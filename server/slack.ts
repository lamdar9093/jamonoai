import { WebClient } from '@slack/web-api';
import express, { Request, Response } from 'express';
import { Agent } from '@shared/schema';
import { storage } from './storage';
import { agentOrchestrator } from './orchestrator';

// Initialiser le client Slack avec le token du bot
const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

// Configuration Slack OAuth
const slackClientId = process.env.SLACK_CLIENT_ID;
const slackClientSecret = process.env.SLACK_CLIENT_SECRET;

if (!slackClientId || !slackClientSecret) {
  console.warn('WARNING: Slack client ID or secret not found. Slack integration will not work properly.');
}

/**
 * Configure les routes Slack pour Express
 */
export function setupSlackRoutes(app: express.Express) {
  // Route pour le callback OAuth de Slack
  app.post('/api/slack/auth-callback', async (req: Request, res: Response) => {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ 
        success: false, 
        error: 'Code d\'autorisation manquant' 
      });
    }
    
    if (!slackClientId || !slackClientSecret) {
      return res.status(500).json({ 
        success: false, 
        error: 'Configuration Slack manquante. Veuillez vérifier SLACK_CLIENT_ID et SLACK_CLIENT_SECRET.' 
      });
    }
    
    try {
      // Échanger le code d'autorisation contre un token d'accès avec l'API OAuth v2 de Slack
      const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: slackClientId,
          client_secret: slackClientSecret,
          code: code,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenData.ok) {
        console.error('Erreur OAuth Slack:', tokenData.error);
        return res.status(400).json({
          success: false,
          error: `Échec OAuth Slack: ${tokenData.error}`
        });
      }

      // Créer le workspace sans déployer d'agents automatiquement
      try {
        const workspace = await agentOrchestrator.createWorkspace(tokenData);
        
        res.json({
          success: true,
          message: 'Workspace configuré - Sélectionnez vos agents',
          team_name: tokenData.team?.name,
          team_url: `https://${tokenData.team?.domain}.slack.com`,
          bot_user_id: tokenData.bot_user_id,
          workspace_id: workspace.id,
          redirectTo: `/onboarding/agents?workspace=${workspace.id}`,
          orchestration_status: 'pending_agent_selection'
        });
      } catch (orchestrationError) {
        console.warn('Échec orchestration onboarding:', orchestrationError);
        
        // Fallback : envoi du message de bienvenue simple
        try {
          const agent = await storage.getAgentById(1);
          if (agent) {
            await sendWelcomeMessage(agent, tokenData.access_token);
          }
        } catch (welcomeError) {
          console.warn('Échec envoi message de bienvenue:', welcomeError);
        }

        res.json({
          success: true,
          message: 'Intégration Slack terminée avec succès (mode basique)',
          team_name: tokenData.team?.name,
          team_url: `https://${tokenData.team?.domain}.slack.com`,
          bot_user_id: tokenData.bot_user_id,
          orchestration_status: 'fallback'
        });
      }
    } catch (error) {
      console.error('Erreur dans le callback OAuth Slack:', error);
      res.status(500).json({
        success: false,
        error: 'Échec de l\'intégration Slack'
      });
    }
  });

  // Route pour tester la configuration Slack
  app.get('/api/slack/test-config', async (req: Request, res: Response) => {
    const hasBotToken = !!process.env.SLACK_BOT_TOKEN;

    res.json({
      hasClientId: !!slackClientId,
      hasClientSecret: !!slackClientSecret,
      hasBotToken: hasBotToken,
      clientId: slackClientId ? `${slackClientId.substring(0, 8)}...` : null,
      ready: !!(slackClientId && slackClientSecret)
    });
  });
}

/**
 * Envoie un message de bienvenue dans Slack après l'intégration
 */
async function sendWelcomeMessage(agent: Agent, accessToken: string) {
  try {
    // Utiliser le token d'accès spécifique au workspace
    const workspaceClient = new WebClient(accessToken);
    
    // Message de bienvenue formaté
    const welcomeBlocks = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `🤖 ${agent.name} a rejoint votre équipe !`
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Bonjour ! Je suis *${agent.name}*, votre nouveau collègue ${agent.title}. Je suis maintenant disponible 24/7 pour vous aider avec vos défis DevOps.`
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "🔧 *Comment m'utiliser :*\n• Mentionnez-moi avec `@NOX` dans n'importe quel canal\n• Posez-moi des questions techniques directement\n• Demandez-moi d'analyser des problèmes ou de générer de la documentation"
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "💡 *Exemples de commandes :*\n• `@NOX diagnostique le problème de performance du serveur web`\n• `@NOX génère un post-mortem pour l'incident d'hier`\n• `@NOX aide-moi à planifier la migration Kubernetes`"
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
            text: "Je me souviens de nos conversations précédentes pour un meilleur contexte. Commençons à collaborer !"
          }
        ]
      }
    ];

    // Envoyer le message dans le canal général
    await workspaceClient.chat.postMessage({
      channel: '#general',
      text: `${agent.name} a rejoint votre équipe !`,
      blocks: welcomeBlocks
    });

    console.log(`Message de bienvenue envoyé pour ${agent.name}`);
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message de bienvenue:', error);
    throw error;
  }
}

/**
 * Envoie un message Slack via l'API Slack
 */
export async function sendSlackMessage(options: {
  channel: string;
  text: string;
  blocks?: any[];
  accessToken?: string;
}) {
  try {
    const client = options.accessToken ? new WebClient(options.accessToken) : slack;
    
    const result = await client.chat.postMessage({
      channel: options.channel,
      text: options.text,
      blocks: options.blocks
    });

    return result;
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message Slack:', error);
    throw error;
  }
}