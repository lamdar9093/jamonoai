/**
 * Service d'actions automatiques pour NOX
 * Permet à NOX d'effectuer des actions concrètes au lieu de simplement répondre
 */

import { jiraIntegration } from './jira-integration';
import { calendarIntegration } from './calendar-integration';
import { infrastructureIntegration } from './infrastructure-integration';
import OpenAI from 'openai';

interface ActionContext {
  agentId: number;
  userMessage: string;
  slackUserId?: string;
  slackChannelId?: string;
  workspaceId?: number;
  requiresUserInput?: boolean;
  missingInfo?: string[];
}

interface ActionResult {
  success: boolean;
  action: string;
  details: any;
  response: string;
  error?: string;
  requiresUserInput?: boolean;
  suggestedQuestions?: string[];
  confirmationToken?: string;
}

export class AgentActions {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
  }

  /**
   * Analyse le message et détermine quelles actions automatiques NOX doit prendre
   */
  async analyzeAndExecuteActions(context: ActionContext): Promise<ActionResult[]> {
    const results: ActionResult[] = [];
    
    try {
      // Analyser le message pour détecter les intentions d'action
      const intentions = await this.detectActionIntentions(context.userMessage);
      
      for (const intention of intentions) {
        const result = await this.executeAction(intention, context);
        if (result) {
          results.push(result);
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error in analyzeAndExecuteActions:', error);
      return [];
    }
  }

  /**
   * Détecte les intentions d'action dans le message utilisateur
   */
  private async detectActionIntentions(message: string): Promise<string[]> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Tu es un analyseur d'intentions pour NOX Agent DevOps. 
            Analyse le message et détecte quelles actions automatiques NOX devrait prendre.
            
            Actions disponibles:
            - create_jira_incident: Pour créer un ticket d'incident/bug
            - create_jira_task: Pour créer une tâche de maintenance
            - schedule_meeting: Pour planifier une réunion
            - schedule_postmortem: Pour planifier un post-mortem après incident
            - create_maintenance_task: Pour planifier une tâche de maintenance récurrente
            - read_logs: Pour consulter les logs d'un service/application
            - check_status: Pour vérifier le statut d'un serveur/cluster
            - quick_diagnostic: Pour faire un diagnostic rapide
            - infrastructure_action: Pour exécuter une action sur l'infrastructure (restart, scale, etc.)
            - ask_for_info: Quand des informations manquent pour procéder
            
            Réponds uniquement avec un JSON array des actions à prendre.
            Exemple: ["create_jira_incident", "schedule_postmortem"]
            
            Si aucune action automatique n'est détectée, réponds: []`
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{"actions": []}');
      return result.actions || [];
    } catch (error) {
      console.error('Error detecting intentions:', error);
      return [];
    }
  }

  /**
   * Exécute une action spécifique
   */
  private async executeAction(action: string, context: ActionContext): Promise<ActionResult | null> {
    switch (action) {
      case 'create_jira_incident':
        return await this.createJiraIncident(context);
      
      case 'create_jira_task':
        return await this.createJiraTask(context);
      
      case 'schedule_meeting':
        return await this.scheduleMeeting(context);
      
      case 'schedule_postmortem':
        return await this.schedulePostMortem(context);
      
      case 'create_maintenance_task':
        return await this.createMaintenanceTask(context);
      
      case 'read_logs':
        return await this.readServerLogs(context);
      
      case 'check_status':
        return await this.checkServerStatus(context);
      
      case 'quick_diagnostic':
        return await this.runQuickDiagnostic(context);
      
      case 'infrastructure_action':
        return await this.executeInfrastructureAction(context);
      
      case 'ask_for_info':
        return await this.requestMissingInformation(context);
      
      default:
        return null;
    }
  }

  /**
   * Crée automatiquement un ticket Jira pour un incident
   */
  private async createJiraIncident(context: ActionContext): Promise<ActionResult> {
    try {
      // Extraire les détails de l'incident du message
      const incidentDetails = await this.extractIncidentDetails(context.userMessage);
      
      const result = await jiraIntegration.createIncidentTicket(
        incidentDetails.description,
        incidentDetails.severity,
        incidentDetails.system,
        context.slackUserId || 'NOX-Auto'
      );

      if (result.success) {
        return {
          success: true,
          action: 'create_jira_incident',
          details: { ticketKey: result.ticketKey },
          response: `✅ J'ai créé automatiquement le ticket Jira ${result.ticketKey} pour cet incident ${incidentDetails.severity.toLowerCase()}. L'équipe DevOps est notifiée.`
        };
      } else {
        return {
          success: false,
          action: 'create_jira_incident',
          details: {},
          response: `⚠️ Je n'ai pas pu créer le ticket Jira automatiquement. Vérifiez la configuration Jira.`,
          error: result.error
        };
      }
    } catch (error) {
      return {
        success: false,
        action: 'create_jira_incident',
        details: {},
        response: `❌ Erreur lors de la création du ticket d'incident.`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Planifie automatiquement un post-mortem
   */
  private async schedulePostMortem(context: ActionContext): Promise<ActionResult> {
    try {
      const incidentDetails = await this.extractIncidentDetails(context.userMessage);
      
      const result = await calendarIntegration.schedulePostIncidentMeeting(
        incidentDetails.description,
        incidentDetails.system,
        context.slackUserId || 'NOX-Auto',
        incidentDetails.severity
      );

      if (result.success) {
        return {
          success: true,
          action: 'schedule_postmortem',
          details: result.meetingDetails,
          response: `📅 Post-mortem planifié automatiquement pour ${result.meetingDetails?.time}. Durée: ${result.meetingDetails?.duration}min. L'équipe sera notifiée.`
        };
      } else {
        return {
          success: false,
          action: 'schedule_postmortem',
          details: {},
          response: `⚠️ Je n'ai pas pu planifier le post-mortem automatiquement.`,
          error: result.error
        };
      }
    } catch (error) {
      return {
        success: false,
        action: 'schedule_postmortem',
        details: {},
        response: `❌ Erreur lors de la planification du post-mortem.`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Planifie une réunion générale
   */
  private async scheduleMeeting(context: ActionContext): Promise<ActionResult> {
    try {
      const meetingDetails = await this.extractMeetingDetails(context.userMessage);
      
      const result = await calendarIntegration.schedulePlanningMeeting(
        meetingDetails.type,
        meetingDetails.duration,
        meetingDetails.participants
      );

      if (result.success) {
        return {
          success: true,
          action: 'schedule_meeting',
          details: result.meetingDetails,
          response: `📅 J'ai planifié la réunion "${result.meetingDetails?.title}" pour ${result.meetingDetails?.time}. Invitation envoyée à l'équipe.`
        };
      } else {
        return {
          success: false,
          action: 'schedule_meeting',
          details: {},
          response: `⚠️ Je n'ai pas pu planifier la réunion automatiquement.`,
          error: result.error
        };
      }
    } catch (error) {
      return {
        success: false,
        action: 'schedule_meeting',
        details: {},
        response: `❌ Erreur lors de la planification de la réunion.`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Crée une tâche Jira
   */
  private async createJiraTask(context: ActionContext): Promise<ActionResult> {
    try {
      const taskDetails = await this.extractTaskDetails(context.userMessage);
      
      const result = await jiraIntegration.createMaintenanceTask(
        taskDetails.title,
        taskDetails.description,
        taskDetails.dueDate,
        taskDetails.assignee
      );

      if (result.success) {
        return {
          success: true,
          action: 'create_jira_task',
          details: { ticketKey: result.ticketKey },
          response: `✅ Tâche créée automatiquement: ${result.ticketKey}. Elle est assignée et priorisée dans le backlog.`
        };
      } else {
        return {
          success: false,
          action: 'create_jira_task',
          details: {},
          response: `⚠️ Je n'ai pas pu créer la tâche automatiquement.`,
          error: result.error
        };
      }
    } catch (error) {
      return {
        success: false,
        action: 'create_jira_task',
        details: {},
        response: `❌ Erreur lors de la création de la tâche.`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Crée une tâche de maintenance récurrente
   */
  private async createMaintenanceTask(context: ActionContext): Promise<ActionResult> {
    try {
      const maintenanceDetails = await this.extractMaintenanceDetails(context.userMessage);
      
      const result = await calendarIntegration.scheduleMaintenanceTask(
        maintenanceDetails.title,
        maintenanceDetails.description,
        maintenanceDetails.system,
        maintenanceDetails.cronExpression,
        'maintenance'
      );

      if (result.success) {
        return {
          success: true,
          action: 'create_maintenance_task',
          details: { taskId: result.taskId },
          response: `🔧 Tâche de maintenance planifiée automatiquement: "${maintenanceDetails.title}". Exécution selon le planning défini.`
        };
      } else {
        return {
          success: false,
          action: 'create_maintenance_task',
          details: {},
          response: `⚠️ Je n'ai pas pu planifier la tâche de maintenance.`,
          error: result.error
        };
      }
    } catch (error) {
      return {
        success: false,
        action: 'create_maintenance_task',
        details: {},
        response: `❌ Erreur lors de la planification de la maintenance.`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Extrait les détails d'un incident du message
   */
  private async extractIncidentDetails(message: string): Promise<{
    description: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    system: string;
  }> {
    // Simplification - dans un vrai système, utiliser l'IA pour extraire ces détails
    return {
      description: message,
      severity: message.toLowerCase().includes('critique') || message.toLowerCase().includes('critical') ? 'Critical' :
               message.toLowerCase().includes('urgent') || message.toLowerCase().includes('high') ? 'High' :
               message.toLowerCase().includes('moyen') || message.toLowerCase().includes('medium') ? 'Medium' : 'Low',
      system: this.extractSystemName(message) || 'Unknown System'
    };
  }

  /**
   * Extrait les détails d'une réunion
   */
  private async extractMeetingDetails(message: string): Promise<{
    type: 'sprint' | 'release' | 'architecture';
    duration: number;
    participants: string[];
  }> {
    return {
      type: message.toLowerCase().includes('sprint') ? 'sprint' :
            message.toLowerCase().includes('release') ? 'release' : 'architecture',
      duration: 60,
      participants: []
    };
  }

  /**
   * Extrait les détails d'une tâche
   */
  private async extractTaskDetails(message: string): Promise<{
    title: string;
    description: string;
    dueDate?: Date;
    assignee?: string;
  }> {
    return {
      title: `Tâche DevOps: ${this.extractSystemName(message) || 'Maintenance'}`,
      description: message,
      dueDate: undefined,
      assignee: undefined
    };
  }

  /**
   * Extrait les détails de maintenance
   */
  private async extractMaintenanceDetails(message: string): Promise<{
    title: string;
    description: string;
    system: string;
    cronExpression: string;
  }> {
    return {
      title: `Maintenance ${this.extractSystemName(message) || 'System'}`,
      description: message,
      system: this.extractSystemName(message) || 'Unknown',
      cronExpression: '0 2 * * 0' // Dimanche à 2h par défaut
    };
  }

  /**
   * Extrait le nom du système du message
   */
  private extractSystemName(message: string): string | null {
    const systemKeywords = [
      'kubernetes', 'k8s', 'docker', 'jenkins', 'gitlab', 'aws', 'gcp', 'azure',
      'database', 'redis', 'nginx', 'apache', 'api', 'frontend', 'backend',
      'monitoring', 'prometheus', 'grafana', 'elk', 'kafka'
    ];

    const messageLower = message.toLowerCase();
    for (const keyword of systemKeywords) {
      if (messageLower.includes(keyword)) {
        return keyword;
      }
    }
    
    return null;
  }

  /**
   * Lit les logs d'un serveur/service
   */
  private async readServerLogs(context: ActionContext): Promise<ActionResult> {
    try {
      const servers = infrastructureIntegration.getServers();
      const analysis = infrastructureIntegration.analyzeRequirements(context.userMessage, servers);

      if (!analysis.canProceed) {
        return {
          success: false,
          action: 'read_logs',
          details: { missingInfo: analysis.missingInfo },
          response: analysis.suggestedQuestions.join(' '),
          requiresUserInput: true,
          suggestedQuestions: analysis.suggestedQuestions
        };
      }

      // Identifier le serveur et service
      const targetServer = servers.find(s => 
        context.userMessage.toLowerCase().includes(s.name.toLowerCase())
      ) || servers[0];

      if (!targetServer) {
        return {
          success: false,
          action: 'read_logs',
          details: {},
          response: "❌ Aucun serveur configuré. Demande à ton admin de configurer l'intégration infrastructure."
        };
      }

      const serviceName = this.extractServiceName(context.userMessage);
      const lines = this.extractLogLines(context.userMessage);

      const logs = await infrastructureIntegration.readLogs(targetServer.id, serviceName, lines);
      
      return {
        success: true,
        action: 'read_logs',
        details: { server: targetServer.name, service: serviceName, lines },
        response: `📋 Logs de ${serviceName ? `${serviceName} sur ` : ''}${targetServer.name}:\n\`\`\`\n${logs.slice(0, 2000)}${logs.length > 2000 ? '\n... (tronqué)' : ''}\n\`\`\``
      };
    } catch (error) {
      return {
        success: false,
        action: 'read_logs',
        details: {},
        response: `❌ Erreur lecture logs: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Vérifie le statut d'un serveur/cluster
   */
  private async checkServerStatus(context: ActionContext): Promise<ActionResult> {
    try {
      const servers = infrastructureIntegration.getServers();
      const analysis = infrastructureIntegration.analyzeRequirements(context.userMessage, servers);

      if (!analysis.canProceed) {
        return {
          success: false,
          action: 'check_status',
          details: { missingInfo: analysis.missingInfo },
          response: analysis.suggestedQuestions.join(' '),
          requiresUserInput: true,
          suggestedQuestions: analysis.suggestedQuestions
        };
      }

      const targetServer = servers.find(s => 
        context.userMessage.toLowerCase().includes(s.name.toLowerCase())
      ) || servers[0];

      if (!targetServer) {
        return {
          success: false,
          action: 'check_status',
          details: {},
          response: "❌ Aucun serveur configuré pour vérification de statut."
        };
      }

      const status = await infrastructureIntegration.readLogs(targetServer.id);
      
      return {
        success: true,
        action: 'check_status',
        details: { server: targetServer.name },
        response: `🔍 Statut de ${targetServer.name} (${targetServer.type}):\n\`\`\`\n${status.slice(0, 1500)}${status.length > 1500 ? '\n... (tronqué)' : ''}\n\`\`\``
      };
    } catch (error) {
      return {
        success: false,
        action: 'check_status',
        details: {},
        response: `❌ Erreur vérification statut: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Exécute un diagnostic rapide
   */
  private async runQuickDiagnostic(context: ActionContext): Promise<ActionResult> {
    try {
      const servers = infrastructureIntegration.getServers();
      const targetServer = servers.find(s => 
        context.userMessage.toLowerCase().includes(s.name.toLowerCase())
      ) || servers[0];

      if (!targetServer) {
        return {
          success: false,
          action: 'quick_diagnostic',
          details: {},
          response: "❌ Aucun serveur configuré pour diagnostic."
        };
      }

      const diagnostic = await infrastructureIntegration.quickDiagnostic(targetServer.id);
      
      return {
        success: true,
        action: 'quick_diagnostic',
        details: { server: targetServer.name },
        response: `🩺 Diagnostic rapide de ${targetServer.name}:\n\`\`\`\n${diagnostic.slice(0, 2500)}${diagnostic.length > 2500 ? '\n... (complet disponible sur demande)' : ''}\n\`\`\``
      };
    } catch (error) {
      return {
        success: false,
        action: 'quick_diagnostic',
        details: {},
        response: `❌ Erreur diagnostic: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Exécute une action infrastructure avec validation
   */
  private async executeInfrastructureAction(context: ActionContext): Promise<ActionResult> {
    try {
      const servers = infrastructureIntegration.getServers();
      const analysis = infrastructureIntegration.analyzeRequirements(context.userMessage, servers);

      if (!analysis.canProceed) {
        return {
          success: false,
          action: 'infrastructure_action',
          details: { missingInfo: analysis.missingInfo },
          response: analysis.suggestedQuestions.join(' '),
          requiresUserInput: true,
          suggestedQuestions: analysis.suggestedQuestions
        };
      }

      const targetServer = servers.find(s => 
        context.userMessage.toLowerCase().includes(s.name.toLowerCase())
      ) || servers[0];

      if (!targetServer) {
        return {
          success: false,
          action: 'infrastructure_action',
          details: {},
          response: "❌ Aucun serveur configuré pour cette action."
        };
      }

      // Extraire la commande du message
      const command = this.extractInfrastructureCommand(context.userMessage);
      const actionType = this.determineActionType(command);

      // Créer l'action avec validation
      const action = await infrastructureIntegration.createAction(
        actionType,
        command,
        targetServer.id,
        context.slackUserId || 'NOX-Auto'
      );

      const validation = await infrastructureIntegration.validateAction(action);

      if (!validation.allowed) {
        return {
          success: false,
          action: 'infrastructure_action',
          details: { validationMessage: validation.message },
          response: `🚫 ${validation.message} Action non autorisée.`
        };
      }

      if (validation.requiresConfirmation) {
        return {
          success: false,
          action: 'infrastructure_action',
          details: { actionId: action.id, validationLevel: validation.level },
          response: `${validation.message}\nPour confirmer cette action critique, réponds: "confirme action ${action.id.slice(0, 8)}"`,
          requiresUserInput: true,
          confirmationToken: action.confirmationToken
        };
      }

      // Exécution directe pour les actions sécurisées
      const result = await infrastructureIntegration.executeAction(action.id);
      
      return {
        success: true,
        action: 'infrastructure_action',
        details: { actionId: action.id, command },
        response: `✅ Action exécutée sur ${targetServer.name}:\n\`\`\`\n${result.slice(0, 1500)}${result.length > 1500 ? '\n... (tronqué)' : ''}\n\`\`\``
      };
    } catch (error) {
      return {
        success: false,
        action: 'infrastructure_action',
        details: {},
        response: `❌ Erreur action infrastructure: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Demande les informations manquantes à l'utilisateur
   */
  private async requestMissingInformation(context: ActionContext): Promise<ActionResult> {
    const servers = infrastructureIntegration.getServers();
    const analysis = infrastructureIntegration.analyzeRequirements(context.userMessage, servers);

    return {
      success: false,
      action: 'ask_for_info',
      details: { missingInfo: analysis.missingInfo },
      response: `❓ Il me manque quelques informations pour t'aider:\n${analysis.suggestedQuestions.map(q => `• ${q}`).join('\n')}`,
      requiresUserInput: true,
      suggestedQuestions: analysis.suggestedQuestions
    };
  }

  /**
   * Extrait le nom d'un service du message
   */
  private extractServiceName(message: string): string | null {
    const patterns = [
      /logs?\s+(?:de\s+|du\s+)?(\w+[-\w]*)/i,
      /service\s+(\w+[-\w]*)/i,
      /pod\s+(\w+[-\w]*)/i,
      /container\s+(\w+[-\w]*)/i,
      /restart\s+(\w+[-\w]*)/i,
      /statut?\s+(?:de\s+|du\s+)?(\w+[-\w]*)/i
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) return match[1];
    }

    return null;
  }

  /**
   * Extrait le nombre de lignes de logs du message
   */
  private extractLogLines(message: string): number {
    const match = message.match(/(\d+)\s*(?:lignes?|lines?)/i);
    return match ? Math.min(parseInt(match[1]), 1000) : 100;
  }

  /**
   * Extrait une commande infrastructure du message
   */
  private extractInfrastructureCommand(message: string): string {
    // Patterns courants pour extraire des commandes
    const restartPatterns = [
      /restart\s+(\w+[-\w]*)/i,
      /redémarr\w*\s+(\w+[-\w]*)/i
    ];

    const scalePatterns = [
      /scale\s+(\w+[-\w]*)\s+(?:to\s+)?(\d+)/i,
      /augment\w*\s+(\w+[-\w]*)\s+(?:à\s+)?(\d+)/i
    ];

    // Restart
    for (const pattern of restartPatterns) {
      const match = message.match(pattern);
      if (match) return `restart ${match[1]}`;
    }

    // Scale
    for (const pattern of scalePatterns) {
      const match = message.match(pattern);
      if (match) return `scale ${match[1]} --replicas=${match[2]}`;
    }

    // Default: retourner le message comme commande (sera validé)
    return message;
  }

  /**
   * Détermine le type d'action basé sur la commande
   */
  private determineActionType(command: string): 'read' | 'execute' | 'deploy' | 'scale' | 'restart' {
    const cmdLower = command.toLowerCase();
    
    if (cmdLower.includes('restart') || cmdLower.includes('redémarr')) return 'restart';
    if (cmdLower.includes('scale') || cmdLower.includes('augment')) return 'scale';
    if (cmdLower.includes('deploy') || cmdLower.includes('déploi')) return 'deploy';
    if (cmdLower.includes('logs') || cmdLower.includes('status') || cmdLower.includes('get')) return 'read';
    
    return 'execute';
  }
}

export const agentActions = new AgentActions();