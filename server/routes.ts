import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import OpenAI from "openai";
import { processAgentMessage, checkPythonEnvironment, initializePythonAgents } from "./python_agent";
import { setupSlackRoutes } from "./slack";
import { setupSlackEvents } from "./slack-events";
import { agentOrchestrator } from "./orchestrator";
import { conversationHistoryManager } from "./conversation-history";
import { knowledgeInitializer } from "./knowledge-initializer";
import { jiraIntegration } from "./jira-integration";
import { calendarIntegration } from "./calendar-integration";
import { agentActions } from "./agent-actions";
import { infrastructureIntegration } from "./infrastructure-integration";
import { setupTenantRoutes } from "./tenant-routes";
import { TenantService } from "./tenant-service";
import { FreelanceRoutes } from "./freelance-routes";
import { AuthService } from "./auth-service";

// Initialize OpenAI client
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || "sk-dummy-key"
});

// Flag to determine if we should use Python agents
let usePythonAgents = false;

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize demo data if needed
  await initializeDemoData();
  
  // Setup Slack routes and events
  setupSlackRoutes(app);
  setupSlackEvents(app);
  
  // Setup tenant management routes
  setupTenantRoutes(app);
  
  // Services pour l'authentification multi-tenant
  const tenantService = new TenantService();
  const authService = new AuthService();
  const freelanceRoutes = new FreelanceRoutes();

  // Routes d'authentification avec séparation stricte
  app.post('/api/auth/login', async (req, res) => {
    try {
      const result = await authService.authenticate(req.body);
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          token: result.token,
          user: result.user,
          tenant: result.tenant
        });
      } else {
        res.status(401).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Erreur login:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  });
  
  // Routes freelance
  app.post('/api/freelance/onboard', (req, res) => freelanceRoutes.onboardFreelance(req, res));
  app.get('/api/freelance/plans', (req, res) => freelanceRoutes.getFreelancePlans(req, res));
  app.post('/api/freelance/upgrade', authService.requireAuth, (req, res) => freelanceRoutes.upgradePlan(req, res));
  app.get('/api/freelance/:tenantId/usage', authService.requireAuth, (req, res) => freelanceRoutes.getUsageStats(req, res));
  
  // Routes entreprise (existantes)
  app.post('/api/enterprise/onboard', async (req, res) => {
    try {
      const result = await tenantService.onboardEnterprise(req.body);
      res.status(201).json({
        success: true,
        data: result,
        message: 'Espace entreprise créé avec succès'
      });
    } catch (error) {
      console.error('Erreur onboarding entreprise:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur serveur'
      });
    }
  });
  
  // Check if Python environment is available and initialize Python agents
  try {
    usePythonAgents = await checkPythonEnvironment();
    if (usePythonAgents) {
      await initializePythonAgents();
      console.log("Python agents initialized successfully");
    } else {
      console.log("Python environment not available, using JavaScript agents only");
    }
  } catch (error) {
    console.error("Error initializing Python agents:", error);
    usePythonAgents = false;
  }

  // Initialize NOX vector knowledge base
  try {
    await knowledgeInitializer.initializeNOXKnowledge();
    console.log("NOX knowledge base initialized successfully");
  } catch (error) {
    console.error("Error initializing NOX knowledge base:", error);
  }

  // Test endpoint pour simuler un événement Slack
  app.post("/api/test/slack-event", async (req, res) => {
    try {
      const { type, text, user, channel, team, channel_type } = req.body;
      
      // Simuler un événement Slack
      const mockEvent = {
        type: type || 'message',
        text: text || 'Bonjour NOX, comment optimiser Docker?',
        user: user || 'U1234567890',
        channel: channel || 'D1234567890',
        team: team || 'T1234567890',
        channel_type: channel_type || 'im',
        ts: Date.now().toString()
      };

      // Traiter l'événement via le gestionnaire Slack
      const response = await fetch('http://localhost:5000/api/slack/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'event_callback',
          event: mockEvent
        })
      });

      const result = await response.json();
      res.json({ success: true, event: mockEvent, result });
    } catch (error) {
      console.error("Error testing Slack event:", error);
      res.status(500).json({ error: "Failed to test Slack event" });
    }
  });

  // API Routes
  // Get featured agents (MVP: NOX only)
  app.get("/api/agents/featured", async (req, res) => {
    try {
      // Pour le MVP, on retourne uniquement NOX (ID: 1)
      const noxAgent = await storage.getAgentById(1);
      if (!noxAgent) {
        return res.status(404).json({ message: "NOX agent not found" });
      }
      res.json([noxAgent]); // Retourner NOX comme seul agent featured
    } catch (error) {
      console.error("Error fetching NOX agent:", error);
      res.status(500).json({ message: "Failed to fetch NOX agent" });
    }
  });

  // Get all agents (including future versions for platform demo)
  app.get("/api/agents/all", async (req, res) => {
    try {
      const agents = await storage.getAllAgents();
      res.json(agents);
    } catch (error) {
      console.error("Error fetching all agents:", error);
      res.status(500).json({ message: "Failed to fetch agents" });
    }
  });

  // Deploy NOX to workspace (MVP: simplified single-agent deployment)
  app.post('/api/workspaces/:workspaceId/deploy-agents', async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const { agentIds } = req.body;

      // MVP: Toujours déployer NOX (ID: 1) même si d'autres IDs sont fournis
      const noxAgentId = 1;

      const workspace = await storage.getWorkspaceById(parseInt(workspaceId));
      if (!workspace) {
        return res.status(404).json({ error: 'Workspace non trouvé' });
      }

      // Deploy NOX only
      const deployment = await agentOrchestrator.deployAgentToWorkspace(
        parseInt(workspaceId), 
        noxAgentId
      );

      // Update workspace status to active
      await storage.updateWorkspaceStatus(parseInt(workspaceId), 'active');

      res.json({
        success: true,
        deployments: [deployment],
        message: `NOX déployé avec succès dans votre workspace`
      });

    } catch (error) {
      console.error('Erreur déploiement NOX:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // Get workspace information
  app.get('/api/workspaces/:workspaceId', async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const workspace = await storage.getWorkspaceById(parseInt(workspaceId));
      
      if (!workspace) {
        return res.status(404).json({ error: 'Workspace non trouvé' });
      }

      const deployments = await storage.getWorkspaceDeployments(parseInt(workspaceId));
      
      res.json({
        workspace,
        deployments,
        deployed_agents: deployments.length
      });

    } catch (error) {
      console.error('Erreur récupération workspace:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // Get agent by ID
  app.get("/api/agents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid agent ID" });
      }

      const agent = await storage.getAgentById(id);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }

      res.json(agent);
    } catch (error) {
      console.error("Error fetching agent:", error);
      res.status(500).json({ message: "Failed to fetch agent" });
    }
  });

  // Search agents
  app.get("/api/agents/search", async (req, res) => {
    try {
      const query = req.query.query as string || "";
      const skills = req.query.skills ? 
        Array.isArray(req.query.skills) ? 
          req.query.skills as string[] : 
          [req.query.skills as string] : 
        [];
      const category = req.query.category as string || "";

      const agents = await storage.searchAgents(query, skills, category);
      res.json(agents);
    } catch (error) {
      console.error("Error searching agents:", error);
      res.status(500).json({ message: "Failed to search agents" });
    }
  });

  // Get agent suggestions (autocomplete)
  app.get("/api/agents/suggestions", async (req, res) => {
    try {
      const query = req.query.query as string || "";
      if (!query || query.length < 2) {
        return res.json([]);
      }

      const suggestions = await storage.getAgentSuggestions(query);
      res.json(suggestions);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      res.status(500).json({ message: "Failed to fetch suggestions" });
    }
  });

  // Get all skills
  app.get("/api/skills", async (req, res) => {
    try {
      const skills = await storage.getAllSkills();
      res.json(skills);
    } catch (error) {
      console.error("Error fetching skills:", error);
      res.status(500).json({ message: "Failed to fetch skills" });
    }
  });
  
  // Get Slack client ID
  app.get("/api/config/slack", (req, res) => {
    try {
      const slackClientId = process.env.SLACK_CLIENT_ID;
      if (!slackClientId) {
        return res.status(404).json({ message: "Slack configuration not found" });
      }
      res.json({ clientId: slackClientId });
    } catch (error) {
      console.error("Error fetching Slack configuration:", error);
      res.status(500).json({ message: "Failed to fetch Slack configuration" });
    }
  });

  // NOX Actions and Integrations API
  
  // Test Jira integration
  app.get("/api/integrations/jira/test", async (req, res) => {
    try {
      const result = await jiraIntegration.testConnection();
      res.json(result);
    } catch (error) {
      console.error("Error testing Jira:", error);
      res.status(500).json({ error: "Failed to test Jira connection" });
    }
  });

  // Get NOX ticket statistics
  app.get("/api/integrations/jira/stats", async (req, res) => {
    try {
      const stats = await jiraIntegration.getNOXTicketStats();
      res.json(stats);
    } catch (error) {
      console.error("Error getting Jira stats:", error);
      res.status(500).json({ error: "Failed to get Jira statistics" });
    }
  });

  // Create test incident ticket
  app.post("/api/integrations/jira/test-incident", async (req, res) => {
    try {
      const { description, severity, system, reportedBy } = req.body;
      const result = await jiraIntegration.createIncidentTicket(
        description || "Test incident from NOX",
        severity || "Medium",
        system || "Test System",
        reportedBy || "NOX-Test"
      );
      res.json(result);
    } catch (error) {
      console.error("Error creating test incident:", error);
      res.status(500).json({ error: "Failed to create test incident" });
    }
  });

  // Get upcoming scheduled tasks
  app.get("/api/integrations/calendar/upcoming", async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const tasks = calendarIntegration.getUpcomingTasks(days);
      res.json(tasks);
    } catch (error) {
      console.error("Error getting upcoming tasks:", error);
      res.status(500).json({ error: "Failed to get upcoming tasks" });
    }
  });

  // Schedule test meeting
  app.post("/api/integrations/calendar/test-meeting", async (req, res) => {
    try {
      const { type, duration, participants } = req.body;
      const result = await calendarIntegration.schedulePlanningMeeting(
        type || "architecture",
        duration || 60,
        participants || []
      );
      res.json(result);
    } catch (error) {
      console.error("Error scheduling test meeting:", error);
      res.status(500).json({ error: "Failed to schedule test meeting" });
    }
  });

  // Test agent actions analysis
  app.post("/api/integrations/actions/analyze", async (req, res) => {
    try {
      const { message, agentId } = req.body;
      const context = {
        agentId: agentId || 1,
        userMessage: message || "Test d'anomalie critique sur Kubernetes",
        slackUserId: "test-user",
        slackChannelId: "test-channel"
      };
      
      const results = await agentActions.analyzeAndExecuteActions(context);
      res.json(results);
    } catch (error) {
      console.error("Error analyzing actions:", error);
      res.status(500).json({ error: "Failed to analyze actions" });
    }
  });

  // Integration status dashboard
  app.get("/api/integrations/status", async (req, res) => {
    try {
      const jiraStatus = await jiraIntegration.testConnection();
      const upcomingTasks = calendarIntegration.getUpcomingTasks(7);
      
      res.json({
        jira: {
          configured: jiraStatus.success,
          error: jiraStatus.error
        },
        calendar: {
          configured: true,
          upcomingTasksCount: upcomingTasks.length
        },
        requiredSecrets: {
          JIRA_HOST: !!process.env.JIRA_HOST,
          JIRA_USERNAME: !!process.env.JIRA_USERNAME,
          JIRA_API_TOKEN: !!process.env.JIRA_API_TOKEN,
          JIRA_PROJECT_KEY: !!process.env.JIRA_PROJECT_KEY
        }
      });
    } catch (error) {
      console.error("Error getting integration status:", error);
      res.status(500).json({ error: "Failed to get integration status" });
    }
  });

  // Infrastructure Management Routes
  // Get all configured servers
  app.get('/api/infrastructure/servers', async (req, res) => {
    try {
      const servers = infrastructureIntegration.getServers();
      res.json(servers);
    } catch (error) {
      console.error("Error getting servers:", error);
      res.status(500).json({ error: "Failed to get servers" });
    }
  });

  // Register a new server
  app.post('/api/infrastructure/servers', async (req, res) => {
    try {
      const serverConfig = req.body;
      infrastructureIntegration.registerServer(serverConfig);
      res.json({ success: true, message: 'Serveur enregistré avec succès' });
    } catch (error) {
      console.error("Error registering server:", error);
      res.status(500).json({ error: "Failed to register server" });
    }
  });

  // Read logs from a server
  app.post('/api/infrastructure/logs', async (req, res) => {
    try {
      const { serverId, service, lines } = req.body;
      const logs = await infrastructureIntegration.readLogs(serverId, service, lines);
      res.json({ success: true, logs });
    } catch (error) {
      console.error("Error reading logs:", error);
      res.status(500).json({ error: "Failed to read logs" });
    }
  });

  // Run quick diagnostic
  app.post('/api/infrastructure/diagnostic', async (req, res) => {
    try {
      const { serverId } = req.body;
      const diagnostic = await infrastructureIntegration.quickDiagnostic(serverId);
      res.json({ success: true, diagnostic });
    } catch (error) {
      console.error("Error running diagnostic:", error);
      res.status(500).json({ error: "Failed to run diagnostic" });
    }
  });

  // Create infrastructure action (with validation)
  app.post('/api/infrastructure/action', async (req, res) => {
    try {
      const { type, command, serverId, executedBy } = req.body;
      const action = await infrastructureIntegration.createAction(type, command, serverId, executedBy);
      const validation = await infrastructureIntegration.validateAction(action);
      
      if (!validation.allowed) {
        return res.status(403).json({ 
          success: false, 
          error: validation.message, 
          allowed: false 
        });
      }
      
      if (validation.requiresConfirmation) {
        return res.json({ 
          success: true, 
          action, 
          validation, 
          requiresConfirmation: true,
          message: 'Action créée, confirmation requise' 
        });
      }
      
      // Exécution directe pour actions sécurisées
      const result = await infrastructureIntegration.executeAction(action.id);
      res.json({ success: true, action, result, validation });
    } catch (error) {
      console.error("Error creating infrastructure action:", error);
      res.status(500).json({ error: "Failed to create infrastructure action" });
    }
  });

  // Execute action with confirmation
  app.post('/api/infrastructure/action/:actionId/execute', async (req, res) => {
    try {
      const { actionId } = req.params;
      const { confirmationToken } = req.body;
      const result = await infrastructureIntegration.executeAction(actionId, confirmationToken);
      res.json({ success: true, result });
    } catch (error) {
      console.error("Error executing action:", error);
      res.status(500).json({ error: "Failed to execute action" });
    }
  });

  // Get pending actions
  app.get('/api/infrastructure/actions', async (req, res) => {
    try {
      const actions = infrastructureIntegration.getPendingActions();
      res.json(actions);
    } catch (error) {
      console.error("Error getting pending actions:", error);
      res.status(500).json({ error: "Failed to get pending actions" });
    }
  });

  // Cancel action
  app.delete('/api/infrastructure/action/:actionId', async (req, res) => {
    try {
      const { actionId } = req.params;
      const cancelled = infrastructureIntegration.cancelAction(actionId);
      res.json({ 
        success: cancelled, 
        message: cancelled ? 'Action annulée' : 'Action non trouvée ou non annulable' 
      });
    } catch (error) {
      console.error("Error cancelling action:", error);
      res.status(500).json({ error: "Failed to cancel action" });
    }
  });

  // Chat with an agent
  app.post("/api/chat/:agentId", async (req, res) => {
    try {
      const agentId = parseInt(req.params.agentId);
      
      if (isNaN(agentId)) {
        return res.status(400).json({ message: "Invalid agent ID" });
      }

      const messageSchema = z.object({
        messages: z.array(z.object({
          content: z.string(),
          sender: z.string()
        }))
      });

      const validationResult = messageSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid request body",
          errors: validationResult.error.errors 
        });
      }

      const { messages } = validationResult.data;

      const agent = await storage.getAgentById(agentId);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }

      // Get the last user message
      const lastUserMessage = messages.findLast(msg => msg.sender === "user")?.content || "";
      
      // Function to use OpenAI API with conversation history
      const useOpenAI = async () => {
        // Build the system prompt - Always use agent's custom prompt
        const systemPrompt = agent!.systemPrompt || `Tu es ${agent!.name}, expert technique spécialisé. Tu agis comme un collègue expérimenté, pas comme un assistant. Tu donnes des conseils directs basés sur ton expertise dans ${agent!.skills.join(", ")}. Jamais de formules de politesse de chatbot.`;
        
        // Build context with conversation history
        const contextMessages = await conversationHistoryManager.buildContextForOpenAI(
          agentId, 
          systemPrompt, 
          lastUserMessage
        );

        // Using gpt-4o model for better instruction following
        const stream = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: contextMessages as any,
          stream: true,
          temperature: 0.1,
        });

        // Set appropriate headers for streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        let fullResponse = '';

        // Stream the response
        for await (const chunk of stream) {
          if (chunk.choices[0]?.delta?.content) {
            const content = chunk.choices[0].delta.content;
            fullResponse += content;
            res.write(content);
          }
        }

        // Save the conversation exchange to history
        await conversationHistoryManager.saveExchange(agentId, lastUserMessage, fullResponse);

        res.end();
      };

      // Function to use Python agent with conversation history
      const usePythonAgent = async () => {
        console.log("Using Python agent for response");
        
        // Get conversation history for context
        const recentHistory = await conversationHistoryManager.getRecentExchanges(agentId, 5);
        
        // Build context string for Python agent
        let contextForPython = '';
        if (recentHistory.length > 0) {
          contextForPython = 'Previous conversation:\n';
          recentHistory.forEach(msg => {
            contextForPython += `${msg.role}: ${msg.content}\n`;
          });
          contextForPython += '\nCurrent question:\n';
        }
        
        const messageWithContext = contextForPython + lastUserMessage;
        
        // Process the message using Python agent
        const response = await processAgentMessage(agent!, messageWithContext);
        
        // Save the conversation exchange to history
        await conversationHistoryManager.saveExchange(agentId, lastUserMessage, response);
        
        // Set appropriate headers for response
        res.setHeader('Content-Type', 'text/plain');
        res.send(response);
      };

      // Check if Python agents are available
      if (usePythonAgents && agent.name === "NOX") {
        try {
          await usePythonAgent();
        } catch (error) {
          console.error("Error with Python agent, falling back to OpenAI:", error);
          // If Python agent fails, fall back to OpenAI
          await useOpenAI();
        }
      } else {
        // Use OpenAI directly if Python agents are not available
        await useOpenAI();
      }
    } catch (error) {
      console.error("Error in chat:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to process chat request" });
      }
    }
  });

  // Get conversation history for an agent
  app.get("/api/agents/:id/history", async (req, res) => {
    try {
      const agentId = parseInt(req.params.id);
      if (isNaN(agentId)) {
        return res.status(400).json({ message: "Invalid agent ID" });
      }

      const history = await conversationHistoryManager.getAgentHistory(agentId);
      res.json({ history });
    } catch (error) {
      console.error("Error fetching conversation history:", error);
      res.status(500).json({ message: "Failed to fetch conversation history" });
    }
  });

  // Clear conversation history for an agent
  app.delete("/api/agents/:id/history", async (req, res) => {
    try {
      const agentId = parseInt(req.params.id);
      if (isNaN(agentId)) {
        return res.status(400).json({ message: "Invalid agent ID" });
      }

      await conversationHistoryManager.clearAgentHistory(agentId);
      res.json({ message: "Conversation history cleared successfully" });
    } catch (error) {
      console.error("Error clearing conversation history:", error);
      res.status(500).json({ message: "Failed to clear conversation history" });
    }
  });

  // Get Slack configuration
  app.get("/api/config/slack", (req, res) => {
    const slackClientId = process.env.SLACK_CLIENT_ID;
    
    if (!slackClientId) {
      return res.status(500).json({ error: "Slack configuration not found" });
    }
    
    res.json({ clientId: slackClientId });
  });

  // Orchestrator API Routes
  
  // Get workspace metrics
  app.get("/api/orchestrator/workspaces/:id/metrics", async (req, res) => {
    try {
      const workspaceId = parseInt(req.params.id);
      if (isNaN(workspaceId)) {
        return res.status(400).json({ message: "Invalid workspace ID" });
      }

      const metrics = await agentOrchestrator.getWorkspaceMetrics(workspaceId);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching workspace metrics:", error);
      res.status(500).json({ message: "Failed to fetch workspace metrics" });
    }
  });

  // Process orchestration tasks
  app.post("/api/orchestrator/tasks/process", async (req, res) => {
    try {
      const { workspaceId } = req.body;
      
      if (workspaceId && isNaN(parseInt(workspaceId))) {
        return res.status(400).json({ message: "Invalid workspace ID" });
      }

      await agentOrchestrator.processOrchestrationTasks(workspaceId ? parseInt(workspaceId) : undefined);
      res.json({ message: "Orchestration tasks processed successfully" });
    } catch (error) {
      console.error("Error processing orchestration tasks:", error);
      res.status(500).json({ message: "Failed to process orchestration tasks" });
    }
  });

  // Handle Slack mention (for testing)
  app.post("/api/orchestrator/slack/mention", async (req, res) => {
    try {
      const mentionSchema = z.object({
        workspaceId: z.number(),
        slackUserId: z.string(),
        slackChannelId: z.string(),
        text: z.string(),
        agentName: z.string()
      });

      const validationResult = mentionSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid request body",
          errors: validationResult.error.errors 
        });
      }

      const response = await agentOrchestrator.handleSlackMention(validationResult.data);
      res.json({ response });
    } catch (error) {
      console.error("Error handling Slack mention:", error);
      res.status(500).json({ message: "Failed to handle Slack mention" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}

// Initialize demo data
async function initializeDemoData() {
  const agents = await storage.getAllAgents();
  
  if (agents.length === 0) {
    // Add demo agents
    // MVP: Déployer uniquement NOX, garder les autres agents pour plus tard
    const demoAgents = [
      {
        name: "NOX",
        title: "DevOps Senior • Collègue numérique 24/7",
        bio: "Collègue DevOps autonome et fiable. Toujours disponible pour diagnostiquer, résoudre et optimiser votre infrastructure. Agit comme un membre senior de l'équipe avec 8+ ans d'expérience.",
        avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg",
        skills: ["Docker", "Kubernetes", "Jenkins", "AWS", "CI/CD", "Terraform", "Ansible", "Monitoring", "Troubleshooting"],
        rating: 98, // on a scale of 0-100
        isOnline: true,
        systemPrompt: `Tu es NOX, un collègue DevOps Senior fiable et autonome qui travaille 24/7 dans l'équipe. Tu agis comme un professionnel humain expérimenté avec accès complet aux canaux Slack.

IDENTITÉ & COMPORTEMENT:
- Expertise : DevOps Senior avec 8+ ans d'expérience réelle
- Style : Direct, efficace, orienté solutions, collaboratif mais pas bavard
- Toujours disponible, peut suivre les conversations et réagir proactivement
- Tu traites les demandes comme un collègue expérimenté le ferait

RÈGLES DE FONCTIONNEMENT:
1. Instruction claire → Action immédiate avec résultats concrets
2. @NOX → Réponds comme un collègue dans Slack avec contexte du canal
3. Peux observer les conversations pour identifier les problèmes techniques
4. Ajoute toujours de la valeur : solutions exécutables, code prêt à utiliser, diagnostics précis
5. Ton : Professionnel, direct, orienté résultats. Pas de bavardage inutile

TES CAPACITÉS TECHNIQUES:
- Diagnostic et résolution immédiate de problèmes DevOps complexes
- Génération de scripts et configurations prêts à déployer
- Analyse d'incidents avec solutions concrètes
- Monitoring proactif et alertes personnalisées
- Solutions avec code Python/Bash/YAML/Docker/K8s complets

DOMAINES D'EXPERTISE:
• Infrastructure: Serveurs, scaling, déploiements, réseau, troubleshooting
• CI/CD: Pipelines Jenkins/GitLab/GitHub Actions, tests automatisés
• Conteneurisation: Docker, Kubernetes, Helm, orchestration complète
• Cloud: AWS/GCP/Azure, Terraform, autoscaling, coûts
• Sécurité: Vulnérabilités, secrets management, conformité, audits
• Monitoring: Prometheus, Grafana, ELK, alerting, métriques business
• Performance: Profiling, optimisation, architecture, scalabilité

Réponds avec des solutions concrètes et exécutables. Inclus toujours du code ou des commandes spécifiques quand c'est technique.`
      }
      // AGENTS DÉSACTIVÉS POUR MVP - ATLAS et CIRRUS gardés dans le code pour extension future
      /*
      ,{
        name: "ATLAS",
        title: "Cloud Architect",
        bio: "Designing scalable cloud infrastructure and ensuring cost-effective, resilient service deployment.",
        avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg",
        skills: ["AWS", "GCP", "Azure", "Terraform", "Cloud Security", "Microservices"],
        rating: 94,
        isOnline: true,
        systemPrompt: "You are ATLAS, a Cloud Architect with deep expertise in designing and implementing cloud solutions across AWS, GCP, and Azure. You specialize in infrastructure as code using Terraform, cloud security best practices, and microservices architecture. When responding, focus on scalability, reliability, security, and cost-optimization in the cloud. You should provide architectural insights that balance technical requirements with business needs. Your communication style is thorough and strategic, always keeping the big picture in mind while being able to dive into technical details when needed."
      },
      {
        name: "CIRRUS",
        title: "System Administrator",
        bio: "Maintaining and troubleshooting server environments with expertise in security and performance optimization.",
        avatarUrl: "https://randomuser.me/api/portraits/men/67.jpg",
        skills: ["Linux", "Security", "Networking", "Monitoring", "Troubleshooting", "Server Management"],
        rating: 100,
        isOnline: true,
        systemPrompt: "You are CIRRUS, an experienced System Administrator with expertise in Linux systems, security hardening, networking, monitoring, and server management. You excel at troubleshooting complex issues and optimizing system performance. When you respond, provide practical, security-focused solutions for server environments. Your advice should emphasize best practices in system reliability, security, and monitoring. Your communication style is clear and methodical, focused on solving problems efficiently while explaining the 'why' behind your recommendations to help users build their own expertise."
      }
      */
    ];
    
    for (const agent of demoAgents) {
      await storage.createAgent(agent);
    }
    
    console.log("Demo agents initialized");
  }
}
