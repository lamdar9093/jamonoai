import express, { Request, Response } from 'express';
import { agentOrchestrator } from './orchestrator';
import { db } from './db';
import { workspaces } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { slackTokenManager } from './slack-token-manager';
import { WebClient } from '@slack/web-api';

// Cache global pour éviter les réponses multiples
const globalProcessedEvents = new Set<string>();

// Nettoyer le cache toutes les heures
setInterval(() => {
  globalProcessedEvents.clear();
  console.log('🧹 Cache événements Slack nettoyé');
}, 3600000);

/**
 * Gestionnaire d'événements Slack en temps réel
 * Traite les mentions, DMs et interactions avec les agents
 */
export function setupSlackEvents(app: express.Express) {
  // Endpoint pour les événements Slack (webhooks)
  app.post('/api/slack/events', async (req: Request, res: Response) => {
    try {
      const { type, challenge, event } = req.body;

      // Vérification du challenge Slack
      if (type === 'url_verification') {
        return res.json({ challenge });
      }

      // Traitement des événements en temps réel
      if (type === 'event_callback' && event) {
        await handleSlackEvent(event);
      }

      res.status(200).json({ ok: true });
    } catch (error) {
      console.error('Erreur événement Slack:', error);
      res.status(500).json({ error: 'Erreur traitement événement' });
    }
  });

  // Endpoint pour les commandes slash
  app.post('/api/slack/commands', async (req: Request, res: Response) => {
    try {
      const { team_id, user_id, channel_id, text, command } = req.body;
      
      const workspace = await db.select()
        .from(workspaces)
        .where(eq(workspaces.slackTeamId, team_id))
        .limit(1)
        .then(rows => rows[0]);

      if (!workspace) {
        return res.json({
          response_type: 'ephemeral',
          text: 'Workspace non configuré. Veuillez refaire l\'onboarding.'
        });
      }

      let responseText = '';

      switch (command) {
        case '/nox-status':
          responseText = await getAgentStatus(workspace.id);
          break;
        case '/nox-help':
          responseText = getHelpText();
          break;
        case '/nox-metrics':
          responseText = await getAgentMetrics(workspace.id);
          break;
        default:
          responseText = 'Commande inconnue. Utilisez /nox-help pour voir les commandes disponibles.';
      }

      res.json({
        response_type: 'ephemeral',
        text: responseText
      });
    } catch (error) {
      console.error('Erreur commande slash:', error);
      res.status(500).json({ error: 'Erreur traitement commande' });
    }
  });
}

/**
 * Traite les événements Slack (mentions, DMs, etc.)
 */
async function handleSlackEvent(event: any): Promise<void> {
  console.log('🔔 Événement Slack reçu:', event.type, event.channel_type);
  
  const { type, text, user, channel, team, channel_type } = event;

  // Ignorer les messages des bots et éviter les boucles
  if (event.bot_id || event.subtype === 'bot_message' || event.user === 'U090BNRKCT0') {
    console.log('🤖 Message de bot ignoré');
    return;
  }

  // Éviter les réponses multiples - cache global persistant
  const eventKey = `${team}_${user}_${event.ts}`;
  if (globalProcessedEvents.has(eventKey)) {
    console.log('📝 Événement déjà traité, ignoré');
    return;
  }
  globalProcessedEvents.add(eventKey);

  // Ignorer les messages sans texte
  if (!text || text.trim() === '') {
    console.log('📝 Message vide ignoré');
    return;
  }

  try {
    // Récupérer le workspace
    const workspace = await db.select()
      .from(workspaces)
      .where(eq(workspaces.slackTeamId, team))
      .limit(1)
      .then(rows => rows[0]);

    if (!workspace) {
      console.warn(`❌ Workspace ${team} non trouvé`);
      return;
    }

    console.log(`✅ Workspace trouvé: ${workspace.name}`);

    // Traiter selon le type d'événement
    switch (type) {
      case 'app_mention':
        console.log('📢 Traitement mention d\'app');
        await handleAppMention(workspace, event);
        break;
      case 'message':
        // Vérifier si c'est un DM (channel_type = 'im')
        if (channel_type === 'im') {
          console.log('💬 Traitement message direct');
          await handleDirectMessage(workspace, event);
        } else {
          console.log('🏢 Message de canal ignoré (pas une mention)');
        }
        break;
      default:
        console.log(`🤷 Type d'événement non traité: ${type}`);
    }
  } catch (error) {
    console.error('❌ Erreur traitement événement Slack:', error);
  }
}

/**
 * Lit l'historique récent d'un canal Slack pour contextualiser la réponse
 */
async function getChannelContext(workspace: any, channelId: string, limit: number = 10): Promise<string> {
  try {
    const validToken = await slackTokenManager.getValidToken(workspace.id);
    if (!validToken) {
      return '';
    }

    const slackClient = new WebClient(validToken);
    const result = await slackClient.conversations.history({
      channel: channelId,
      limit: limit,
      include_all_metadata: false
    });

    if (!result.messages || result.messages.length === 0) {
      return '';
    }

    // Formater les messages récents pour le contexte
    const contextMessages = result.messages
      .filter((msg: any) => !msg.bot_id && msg.text) // Ignorer les messages de bots
      .reverse() // Plus ancien en premier
      .map((msg: any) => `${msg.user}: ${msg.text}`)
      .join('\n');

    return contextMessages ? `\nContexte récent du canal:\n${contextMessages}\n` : '';
  } catch (error) {
    console.warn('Impossible de lire l\'historique du canal:', error);
    return '';
  }
}

/**
 * Traite les mentions d'agents (@NOX, @ATLAS, etc.)
 */
async function handleAppMention(workspace: any, event: any): Promise<void> {
  const { text, user, channel } = event;
  
  // Pour les app_mention, l'agent mentionné est toujours NOX (notre app)
  const agentName = 'NOX';
  
  // Nettoyer le message (enlever la mention)
  const cleanMessage = text.replace(/<@\w+>/g, '').trim();
  
  // Obtenir le contexte du canal pour une réponse plus pertinente
  const channelContext = await getChannelContext(workspace, channel, 5);

  try {
    // Orchestrer la réponse via l'orchestrateur avec contexte du canal
    const messageWithContext = channelContext ? `${cleanMessage}${channelContext}` : cleanMessage;
    const response = await agentOrchestrator.handleSlackMention({
      workspaceId: workspace.id,
      slackUserId: user,
      slackChannelId: channel,
      text: messageWithContext,
      agentName
    });

    // Obtenir un token valide et envoyer la réponse
    const validToken = await slackTokenManager.getValidToken(workspace.id);
    if (validToken) {
      await sendSlackResponse(validToken, channel, response, workspace);
    } else {
      console.error(`Token Slack indisponible pour workspace ${workspace.id}`);
    }
  } catch (error) {
    console.error(`Erreur mention agent ${agentName}:`, error);
    const validToken = await slackTokenManager.getValidToken(workspace.id);
    if (validToken) {
      await sendSlackResponse(
        validToken, 
        channel, 
        `Désolé, j'ai rencontré une erreur en traitant votre demande: ${(error as any).message}`,
        workspace
      );
    }
  }
}

/**
 * Traite les messages directs aux agents
 */
async function handleDirectMessage(workspace: any, event: any): Promise<void> {
  const { text, user, channel } = event;
  
  // Déterminer quel agent répondre (par défaut NOX)
  const agentName = 'NOX';

  try {
    const response = await agentOrchestrator.handleSlackMention({
      workspaceId: workspace.id,
      slackUserId: user,
      slackChannelId: channel,
      text,
      agentName
    });

    const validToken = await slackTokenManager.getValidToken(workspace.id);
    if (validToken) {
      await sendSlackResponse(validToken, channel, response, workspace);
    }
  } catch (error) {
    console.error('Erreur message direct:', error);
    const validToken = await slackTokenManager.getValidToken(workspace.id);
    if (validToken) {
      await sendSlackResponse(
        validToken, 
        channel, 
        'Désolé, je ne peux pas traiter votre message pour le moment.',
        workspace
      );
    }
  }
}

/**
 * Envoie une réponse dans Slack
 */
async function sendSlackResponse(accessToken: string, channel: string, text: string, workspace: any): Promise<void> {
  try {
    const displayName = workspace?.agentDisplayName || 'NOX';
    const icon = workspace?.agentIcon || ':gear:';
    
    const client = new WebClient(accessToken);
    
    await client.chat.postMessage({
      channel,
      text: text
    });
    
  } catch (error: any) {
    if (error.data?.error === 'token_expired' || error.data?.error === 'invalid_auth') {
      console.error('Token Slack expiré - Reconnectez l\'intégration');
    } else if (error.data?.error === 'channel_not_found') {
      console.log('Canal de test non trouvé (normal en développement)');
    } else {
      console.error('Erreur Slack:', error.data?.error || error.message);
    }
  }
}

/**
 * Utilitaires pour les commandes slash
 */
async function getAgentStatus(workspaceId: number): Promise<string> {
  try {
    const metrics = await agentOrchestrator.getWorkspaceMetrics(workspaceId);
    
    let status = '🤖 *Statut des agents:*\n\n';
    
    for (const { deployment, metrics: agentMetrics } of metrics) {
      const lastActive = deployment.lastActiveAt ? 
        `dernière activité: ${deployment.lastActiveAt.toLocaleDateString()}` : 
        'jamais actif';
      
      status += `• Agent ID ${deployment.agentId}: ${deployment.status} (${lastActive})\n`;
    }
    
    return status || 'Aucun agent déployé.';
  } catch (error) {
    return 'Erreur lors de la récupération du statut des agents.';
  }
}

function getHelpText(): string {
  return `🤖 *Commandes disponibles:*

*Interaction avec les agents:*
• \`@NOX votre question\` - Poser une question à NOX
• Message direct à NOX pour une conversation privée

*Commandes système:*
• \`/nox-status\` - Afficher le statut des agents
• \`/nox-metrics\` - Voir les métriques de performance
• \`/nox-help\` - Afficher cette aide

*Exemples d'utilisation:*
• \`@NOX diagnostique le problème de performance du serveur\`
• \`@NOX génère un post-mortem pour l'incident d'hier\`
• \`@NOX aide-moi à planifier la migration Kubernetes\``;
}

async function getAgentMetrics(workspaceId: number): Promise<string> {
  try {
    const metrics = await agentOrchestrator.getWorkspaceMetrics(workspaceId);
    
    let metricsText = '📊 *Métriques des agents (dernières 24h):*\n\n';
    
    for (const { deployment, metrics: agentMetrics } of metrics) {
      const interactions = agentMetrics.filter(m => m.metricType === 'interactions').length;
      const avgResponseTime = agentMetrics
        .filter(m => m.metricType === 'response_time')
        .reduce((sum, m) => sum + m.value, 0) / Math.max(1, agentMetrics.filter(m => m.metricType === 'response_time').length);
      
      metricsText += `*Agent ${deployment.agentId}:*\n`;
      metricsText += `• Interactions: ${interactions}\n`;
      metricsText += `• Temps de réponse moyen: ${Math.round(avgResponseTime)}ms\n`;
      metricsText += `• Statut: ${deployment.status}\n\n`;
    }
    
    return metricsText || 'Aucune métrique disponible.';
  } catch (error) {
    return 'Erreur lors de la récupération des métriques.';
  }
}