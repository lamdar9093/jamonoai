import { db } from './db';
import { 
  workspaces as workspacesTable, 
  agentDeployments, 
  agentInteractions, 
  orchestrationTasks, 
  agentMetrics,
  agents,
  type Workspace,
  type AgentDeployment,
  type InsertWorkspace,
  type InsertAgentDeployment,
  type InsertAgentInteraction,
  type InsertOrchestrationTask,
  type Agent
} from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { WebClient } from '@slack/web-api';
import OpenAI from 'openai';
import { conversationHistoryManager } from './conversation-history';
import { storage } from './storage';
import { vectorService } from './vector-service';
import { agentActions } from './agent-actions';

export class AgentOrchestrator {
  private openai: OpenAI;
  private slackClients: Map<string, WebClient> = new Map();

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Crée un workspace sans déployer d'agents (pour Agent Marketplace)
   */
  async createWorkspace(tokenData: any): Promise<Workspace> {
    const workspace = await this.upsertWorkspace({
      slackTeamId: tokenData.team.id,
      name: tokenData.team.name,
      slackTeamName: tokenData.team.name,
      slackAccessToken: tokenData.access_token,
      slackBotUserId: tokenData.bot_user_id
    });

    console.log(`✅ Workspace créé: ${workspace.name}`);
    return workspace;
  }

  /**
   * Déploie un agent spécifique dans un workspace
   */
  async deployAgentToWorkspace(workspaceId: number, agentId: number): Promise<AgentDeployment> {
    const agent = await storage.getAgentById(agentId);
    const workspace = await storage.getWorkspaceById(workspaceId);
    
    if (!agent || !workspace) {
      throw new Error('Agent ou workspace non trouvé');
    }

    // Créer le déploiement
    const deployment = await storage.createAgentDeployment({
      workspaceId,
      agentId,
      status: 'active',
      configuration: {
        displayName: agent.name,
        bio: agent.bio,
        capabilities: agent.skills
      }
    });

    // Envoyer message de bienvenue via Slack
    if (workspace.slackAccessToken) {
      await this.sendAgentWelcomeMessage(workspace, agent);
    }

    console.log(`🚀 Agent ${agent.name} déployé dans ${workspace.name}`);
    return deployment;
  }

  /**
   * Envoie un message de bienvenue spécifique à un agent
   */
  private async sendAgentWelcomeMessage(workspace: Workspace, agent: Agent): Promise<void> {
    try {
      const client = new WebClient(workspace.slackAccessToken!);
      
      const welcomeBlocks = [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `${agent.name} a rejoint votre équipe !`
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `Salut ! Je suis ${agent.name}, votre expert DevOps avec *POUVOIRS D'ACTION AUTOMATIQUE*. Je ne me contente pas de donner des conseils - j'agis directement !`
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `⚡ *Mes capacités automatiques :*\n• Création de tickets Jira pour les incidents\n• Planification de réunions post-mortem\n• Programmation de tâches de maintenance\n• Gestion proactive des urgences`
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `🚀 *Utilisation :*\n• Mentionnez-moi avec \`@${agent.name}\` pour déclencher des actions\n• Signalez des problèmes → je crée automatiquement les tickets\n• Demandez de l'aide → j'analyse et j'agis en conséquence`
          }
        }
      ];

      await client.chat.postMessage({
        channel: '#general',
        text: `${agent.name} a rejoint votre équipe !`,
        blocks: welcomeBlocks
      });

    } catch (error) {
      console.error(`Erreur envoi message bienvenue ${agent.name}:`, error);
    }
  }

  /**
   * Orchestration complète de l'onboarding Slack
   */
  async handleSlackOnboarding(tokenData: any): Promise<Workspace> {
    console.log('🚀 Démarrage orchestration onboarding Slack');

    // 1. Créer ou mettre à jour le workspace
    const workspace = await this.upsertWorkspace({
      name: tokenData.team?.name || 'Unknown Team',
      slackTeamId: tokenData.team?.id,
      slackTeamName: tokenData.team?.name,
      slackAccessToken: tokenData.access_token,
      slackBotUserId: tokenData.bot_user_id,
    });

    // 2. Initialiser le client Slack pour ce workspace
    this.slackClients.set(workspace.slackTeamId!, new WebClient(tokenData.access_token));

    // 3. Programmer les tâches d'orchestration
    await this.scheduleOrchestrationTask(workspace.id, 'deploy_agent', {
      agentId: 1, // NOX
      channels: ['general'],
      permissions: { canMention: true, canDM: true, canRespond: true }
    });

    await this.scheduleOrchestrationTask(workspace.id, 'send_welcome', {
      agentId: 1,
      channel: 'general'
    });

    await this.scheduleOrchestrationTask(workspace.id, 'setup_monitoring', {
      agentId: 1,
      metricsInterval: 300000 // 5 minutes
    });

    // 4. Exécuter immédiatement les tâches prioritaires
    await this.processOrchestrationTasks(workspace.id);

    console.log('✅ Orchestration onboarding terminée');
    return workspace;
  }

  /**
   * Traite les mentions Slack et orchestre la réponse des agents
   */
  async handleSlackMention(payload: {
    workspaceId: number;
    slackUserId: string;
    slackChannelId: string;
    text: string;
    agentName: string;
  }): Promise<string> {
    const startTime = Date.now();

    try {
      // 1. Récupérer le déploiement d'agent actif
      const deployment = await this.getActiveAgentDeployment(payload.workspaceId, payload.agentName);
      if (!deployment) {
        throw new Error(`Agent ${payload.agentName} non déployé dans ce workspace`);
      }

      // 2. Récupérer l'agent et ses configurations
      const agentResults = await db.execute(sql`SELECT * FROM agents WHERE id = ${deployment.agentId} LIMIT 1`);
      const agent = agentResults.rows[0] as any;
      if (!agent) {
        throw new Error(`Agent ${payload.agentName} introuvable`);
      }

      // 3. Détecter le type de message (salutation vs question technique)
      const isSimpleGreeting = this.isSimpleGreeting(payload.text);
      
      let enrichedContext = '';
      let actionResults: any[] = [];
      
      if (!isSimpleGreeting) {
        // Construire le contexte enrichi avec recherche vectorielle pour les vraies questions
        enrichedContext = await vectorService.buildEnrichedContext(
          payload.text, 
          agent.id, 
          payload.workspaceId
        );

        // Analyser et exécuter les actions automatiques pour les vraies questions
        actionResults = await agentActions.analyzeAndExecuteActions({
          agentId: agent.id,
          userMessage: payload.text,
          slackUserId: payload.slackUserId,
          slackChannelId: payload.slackChannelId,
          workspaceId: payload.workspaceId
        });
      }

      // 5. Construire le contexte en intégrant les actions exécutées
      let contextWithActions = agent.systemPrompt;
      
      if (isSimpleGreeting) {
        contextWithActions += `\n\nCONTEXTE: L'utilisateur te salue simplement. Réponds naturellement comme un collègue DevOps sympathique, sans donner de conseils techniques non demandés. Garde ta réponse courte et chaleureuse.`;
      } else {
        if (enrichedContext) {
          contextWithActions += `\n\nContexte enrichi:\n${enrichedContext}`;
        }
        
        if (actionResults.length > 0) {
          const executedActions = actionResults
            .filter(result => result.success)
            .map(result => `• ${result.action}: ${result.details}`)
            .join('\n');
          
          contextWithActions += `\n\nACTIONS AUTOMATIQUES EXÉCUTÉES:\n${executedActions}\n\nTu dois mentionner ces actions dans ta réponse de manière naturelle et professionnelle.`;
        }
      }

      // 6. Construire le contexte avec historique des conversations
      const contextMessages = await conversationHistoryManager.buildContextForOpenAI(
        agent.id,
        contextWithActions,
        payload.text
      );

      // 7. Générer la réponse via OpenAI avec le contexte des actions
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: contextMessages as any,
        temperature: 0.1,
        max_tokens: 1000,
      });

      let agentResponse = response.choices[0]?.message?.content || "Désolé, je n'ai pas pu générer une réponse.";

      const responseTime = Date.now() - startTime;

      // 7. Enregistrer l'interaction
      await this.recordAgentInteraction({
        deploymentId: deployment.id,
        slackUserId: payload.slackUserId,
        slackChannelId: payload.slackChannelId,
        messageType: 'mention',
        userMessage: payload.text,
        agentResponse,
        responseTime,
        success: true,
        metadata: { model: 'gpt-3.5-turbo', contextLength: contextMessages.length }
      });

      // 6. Analyser l'interaction pour l'apprentissage vectoriel (désactivé temporairement)
      // await vectorService.analyzeInteractionForLearning(
      //   agent.id,
      //   payload.text,
      //   agentResponse,
      //   true,
      //   responseTime
      // );

      // 7. Sauvegarder l'échange dans l'historique
      await conversationHistoryManager.saveExchange(agent.id, payload.text, agentResponse);

      // 8. Mettre à jour les métriques
      await this.updateAgentMetrics(deployment.id, responseTime);

      return agentResponse;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('Erreur orchestration mention Slack:', error);

      // Enregistrer l'erreur
      const deployment = await this.getActiveAgentDeployment(payload.workspaceId, payload.agentName);
      if (deployment) {
        await this.recordAgentInteraction({
          deploymentId: deployment.id,
          slackUserId: payload.slackUserId,
          slackChannelId: payload.slackChannelId,
          messageType: 'mention',
          userMessage: payload.text,
          agentResponse: null,
          responseTime,
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Erreur inconnue',
          metadata: { error: true }
        });
      }

      throw error;
    }
  }

  /**
   * Détecte si le message est une simple salutation
   */
  private isSimpleGreeting(text: string): boolean {
    const cleanText = text.toLowerCase().trim();
    const greetings = [
      'salut', 'hello', 'hi', 'bonjour', 'bonsoir', 'hey', 'coucou',
      'ça va', 'comment ça va', 'comment allez-vous', 'comment vas-tu'
    ];
    
    // Message très court et contient une salutation
    return cleanText.length < 20 && greetings.some(greeting => 
      cleanText.includes(greeting) || cleanText === greeting
    );
  }

  /**
   * Gestion des tâches d'orchestration asynchrones
   */
  async processOrchestrationTasks(workspaceId?: number): Promise<void> {
    console.log('🔄 Traitement des tâches d\'orchestration');

    const query = workspaceId 
      ? and(eq(orchestrationTasks.workspaceId, workspaceId), eq(orchestrationTasks.status, 'pending'))
      : eq(orchestrationTasks.status, 'pending');

    const tasks = await db.select()
      .from(orchestrationTasks)
      .where(query)
      .orderBy(desc(orchestrationTasks.priority), orchestrationTasks.createdAt)
      .limit(10);

    for (const task of tasks) {
      try {
        await this.executeOrchestrationTask(task);
      } catch (error) {
        console.error(`Erreur tâche orchestration ${task.id}:`, error);
        await this.markTaskFailed(task.id, error instanceof Error ? error.message : 'Erreur inconnue');
      }
    }
  }

  /**
   * Exécute une tâche d'orchestration spécifique
   */
  private async executeOrchestrationTask(task: any): Promise<void> {
    console.log(`🎯 Exécution tâche: ${task.taskType} (ID: ${task.id})`);

    // Marquer la tâche comme en cours
    await db.update(orchestrationTasks)
      .set({ 
        status: 'running', 
        startedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(orchestrationTasks.id, task.id));

    let result: any = {};

    switch (task.taskType) {
      case 'deploy_agent':
        result = await this.deployAgent(task.workspaceId, task.payload);
        break;
      
      case 'send_welcome':
        result = await this.sendWelcomeMessage(task.workspaceId, task.payload);
        break;
      
      case 'setup_monitoring':
        result = await this.setupAgentMonitoring(task.workspaceId, task.payload);
        break;
      
      case 'health_check':
        result = await this.performHealthCheck(task.workspaceId, task.payload);
        break;
      
      default:
        throw new Error(`Type de tâche inconnu: ${task.taskType}`);
    }

    // Marquer la tâche comme terminée
    await db.update(orchestrationTasks)
      .set({ 
        status: 'completed', 
        completedAt: new Date(),
        result,
        updatedAt: new Date()
      })
      .where(eq(orchestrationTasks.id, task.id));

    console.log(`✅ Tâche ${task.taskType} terminée avec succès`);
  }

  /**
   * Déploie un agent dans un workspace
   */
  private async deployAgent(workspaceId: number, payload: any): Promise<any> {
    const { agentId, channels, permissions } = payload;

    const deployment = await db.insert(agentDeployments).values({
      workspaceId,
      agentId,
      status: 'active',
      slackChannels: channels,
      permissions,
      configuration: {},
      deployedAt: new Date(),
      lastActiveAt: new Date(),
    }).returning();

    return { deploymentId: deployment[0].id, status: 'deployed' };
  }

  /**
   * Envoie un message de bienvenue personnalisé
   */
  private async sendWelcomeMessage(workspaceId: number, payload: any): Promise<any> {
    const { agentId, channel } = payload;
    
    const workspace = await db.select().from(workspacesTable).where(eq(workspacesTable.id, workspaceId)).then(rows => rows[0]);
    const agent = await db.select().from(agents).where(eq(agents.id, agentId)).then(rows => rows[0]);
    
    if (!workspace?.slackAccessToken || !agent) {
      throw new Error('Workspace ou agent introuvable');
    }

    const slackClient = new WebClient(workspace.slackAccessToken);
    
    const welcomeBlocks = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `🤖 ${agent.name} a rejoint ${workspace.slackTeamName} !`
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Bonjour ! Je suis *${agent.name}*, votre nouveau collègue ${agent.title}. Je suis maintenant disponible 24/7 pour vous aider avec vos défis techniques.`
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `🔧 *Comment m'utiliser :*\n• Mentionnez-moi avec \`@${agent.name}\` dans n'importe quel canal\n• Posez-moi des questions techniques directement\n• Je me souviens de nos conversations pour un meilleur contexte`
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `💡 *Exemples de commandes :*\n• \`@${agent.name} diagnostique le problème de performance du serveur web\`\n• \`@${agent.name} génère un post-mortem pour l'incident d'hier\`\n• \`@${agent.name} aide-moi à planifier la migration Kubernetes\``
        }
      },
      {
        type: "divider"
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "✨ Orchestré par AI Agents Network - Votre main d'œuvre numérique"
          }
        ]
      }
    ];

    const result = await slackClient.chat.postMessage({
      channel: `#${channel}`,
      text: `${agent.name} a rejoint votre équipe !`,
      blocks: welcomeBlocks
    });

    return { messageTs: result.ts, channel: result.channel };
  }

  /**
   * Configure le monitoring des agents
   */
  private async setupAgentMonitoring(workspaceId: number, payload: any): Promise<any> {
    const { agentId, metricsInterval } = payload;
    
    // Configuration du monitoring en temps réel
    setInterval(async () => {
      try {
        await this.collectAgentMetrics(workspaceId, agentId);
      } catch (error) {
        console.error('Erreur collecte métriques:', error);
      }
    }, metricsInterval);

    return { monitoringEnabled: true, interval: metricsInterval };
  }

  /**
   * Effectue un contrôle de santé des agents
   */
  private async performHealthCheck(workspaceId: number, payload: any): Promise<any> {
    const deployments = await db.select()
      .from(agentDeployments)
      .where(and(eq(agentDeployments.workspaceId, workspaceId), eq(agentDeployments.status, 'active')));

    const healthStatus = [];
    
    for (const deployment of deployments) {
      const lastInteraction = await db.select()
        .from(agentInteractions)
        .where(eq(agentInteractions.deploymentId, deployment.id))
        .orderBy(desc(agentInteractions.createdAt))
        .limit(1);

      const isHealthy = lastInteraction.length > 0 && 
        (Date.now() - lastInteraction[0].createdAt.getTime()) < 3600000; // 1 heure

      healthStatus.push({
        deploymentId: deployment.id,
        agentId: deployment.agentId,
        healthy: isHealthy,
        lastActive: lastInteraction[0]?.createdAt
      });
    }

    return { healthCheck: healthStatus, timestamp: new Date() };
  }

  /**
   * Utilitaires de gestion des données
   */
  private async upsertWorkspace(data: InsertWorkspace): Promise<Workspace> {
    const existing = await db.select()
      .from(workspacesTable)
      .where(eq(workspacesTable.slackTeamId, data.slackTeamId!))
      .limit(1);

    if (existing.length > 0) {
      const updated = await db.update(workspacesTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(workspacesTable.id, existing[0].id))
        .returning();
      return updated[0];
    } else {
      const created = await db.insert(workspacesTable).values(data).returning();
      return created[0];
    }
  }

  private async getActiveAgentDeployment(workspaceId: number, agentName: string): Promise<AgentDeployment | null> {
    const result = await db.select({ deployment: agentDeployments, agent: agents })
      .from(agentDeployments)
      .innerJoin(agents, eq(agentDeployments.agentId, agents.id))
      .where(and(
        eq(agentDeployments.workspaceId, workspaceId),
        eq(agentDeployments.status, 'active'),
        eq(agents.name, agentName)
      ))
      .limit(1);

    if (result.length > 0) {
      return result[0].deployment;
    }

    // Auto-déploiement pour NOX si pas encore déployé
    if (agentName === 'NOX') {
      console.log(`🚀 Auto-déploiement de ${agentName} dans workspace ${workspaceId}`);
      
      const agentResult = await db.select()
        .from(agents)
        .where(eq(agents.name, 'NOX'))
        .limit(1);
      
      if (agentResult.length === 0) return null;
      
      const deployment = await db.insert(agentDeployments).values({
        workspaceId,
        agentId: agentResult[0].id,
        status: 'active',
        slackChannels: ['general'],
        permissions: { canMention: true, canDM: true, canRespond: true },
        configuration: { autoDeployed: true },
        deployedAt: new Date(),
        lastActiveAt: new Date(),
      }).returning();

      return deployment[0];
    }

    return null;
  }

  private async recordAgentInteraction(data: InsertAgentInteraction): Promise<void> {
    await db.insert(agentInteractions).values(data);
  }

  private async scheduleOrchestrationTask(workspaceId: number, taskType: string, payload: any, priority: number = 1): Promise<void> {
    await db.insert(orchestrationTasks).values({
      workspaceId,
      taskType,
      status: 'pending',
      priority,
      payload,
      maxRetries: 3
    });
  }

  private async markTaskFailed(taskId: number, errorMessage: string): Promise<void> {
    await db.update(orchestrationTasks)
      .set({ 
        status: 'failed', 
        completedAt: new Date(),
        result: { error: errorMessage },
        updatedAt: new Date()
      })
      .where(eq(orchestrationTasks.id, taskId));
  }

  private async updateAgentMetrics(deploymentId: number, responseTime: number): Promise<void> {
    // Enregistrer le temps de réponse
    await db.insert(agentMetrics).values({
      deploymentId,
      metricType: 'response_time',
      value: responseTime,
      timestamp: new Date()
    });

    // Incrémenter le compteur d'interactions
    await db.insert(agentMetrics).values({
      deploymentId,
      metricType: 'interactions',
      value: 1,
      timestamp: new Date()
    });
  }

  private async collectAgentMetrics(workspaceId: number, agentId: number): Promise<void> {
    // Métriques de performance en temps réel
    const deployment = await db.select()
      .from(agentDeployments)
      .where(and(
        eq(agentDeployments.workspaceId, workspaceId),
        eq(agentDeployments.agentId, agentId),
        eq(agentDeployments.status, 'active')
      ))
      .limit(1);

    if (deployment.length === 0) return;

    // Calculer le taux de succès des dernières 24h
    const successRate = await db.select({
      total: sql<number>`count(*)`,
      successful: sql<number>`count(*) filter (where success = true)`
    })
    .from(agentInteractions)
    .where(and(
      eq(agentInteractions.deploymentId, deployment[0].id),
      sql`created_at > now() - interval '24 hours'`
    ));

    if (successRate.length > 0 && successRate[0].total > 0) {
      const rate = Math.round((successRate[0].successful / successRate[0].total) * 100);
      await db.insert(agentMetrics).values({
        deploymentId: deployment[0].id,
        metricType: 'success_rate',
        value: rate,
        timestamp: new Date()
      });
    }
  }

  /**
   * API publiques pour le dashboard
   */
  async getWorkspaceMetrics(workspaceId: number): Promise<any> {
    const deployments = await db.select()
      .from(agentDeployments)
      .where(eq(agentDeployments.workspaceId, workspaceId));

    const metrics = [];
    for (const deployment of deployments) {
      const recentMetrics = await db.select()
        .from(agentMetrics)
        .where(eq(agentMetrics.deploymentId, deployment.id))
        .orderBy(desc(agentMetrics.timestamp))
        .limit(100);

      metrics.push({
        deployment,
        metrics: recentMetrics
      });
    }

    return metrics;
  }
}

export const agentOrchestrator = new AgentOrchestrator();