import { pgTable, text, serial, integer, boolean, jsonb, timestamp, uniqueIndex, vector, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  bio: text("bio").notNull(),
  avatarUrl: text("avatar_url").notNull(),
  skills: text("skills").array().notNull(),
  rating: integer("rating").default(0),
  isOnline: boolean("is_online").default(true),
  systemPrompt: text("system_prompt").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  agentId: integer("agent_id").references(() => agents.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").references(() => chats.id),
  content: text("content").notNull(),
  sender: text("sender").notNull(), // "user" or "agent"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Multi-Tenant SaaS Tables
export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  domain: text("domain").unique(), // company domain for branding
  planType: text("plan_type").default("starter"), // starter, professional, enterprise, solo, pro
  tenantType: text("tenant_type").default("enterprise"), // enterprise, freelance
  status: text("status").default("active"), // active, suspended, trial
  settings: jsonb("settings").default({}), // tenant-wide settings
  maxUsers: integer("max_users").default(10),
  maxAgents: integer("max_agents").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tenantUsers = pgTable("tenant_users", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id),
  email: text("email").notNull(),
  name: text("name").notNull(),
  password: text("password"), // nullable until activation
  role: text("role").default("user"), // admin, manager, user
  permissions: jsonb("permissions").default({}),
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  invitedBy: integer("invited_by"), // references tenantUsers.id
  inviteToken: text("invite_token"),
  inviteExpiresAt: timestamp("invite_expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tenantIntegrations = pgTable("tenant_integrations", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id),
  integrationType: text("integration_type").notNull(), // slack, kubernetes, jira, ssh
  name: text("name").notNull(), // user-defined name
  configuration: jsonb("configuration").notNull(), // encrypted connection details
  status: text("status").default("active"), // active, inactive, error
  lastTestResult: jsonb("last_test_result"),
  lastTestedAt: timestamp("last_tested_at"),
  createdBy: integer("created_by").references(() => tenantUsers.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const actionZones = pgTable("action_zones", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id),
  integrationId: integer("integration_id").references(() => tenantIntegrations.id),
  name: text("name").notNull(), // e.g., "Production K8s", "Dev Servers"
  description: text("description"),
  scope: jsonb("scope").notNull(), // allowed namespaces, servers, projects, etc.
  permissions: jsonb("permissions").notNull(), // read, write, execute levels
  restrictions: jsonb("restrictions").default({}), // time restrictions, approval requirements
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").references(() => tenantUsers.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tenantAgentConfigs = pgTable("tenant_agent_configs", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id),
  agentId: integer("agent_id").references(() => agents.id),
  displayName: text("display_name").notNull(),
  customPrompt: text("custom_prompt"), // tenant-specific system prompt additions
  allowedZones: integer("allowed_zones").array().default([]), // array of action_zone IDs
  allowedIntegrations: integer("allowed_integrations").array().default([]), // array of integration IDs
  restrictions: jsonb("restrictions").default({}), // tenant-specific agent restrictions
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").references(() => tenantUsers.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Agent Orchestration Tables (updated to reference tenants)
export const workspaces = pgTable("workspaces", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id),
  name: text("name").notNull(),
  slackTeamId: text("slack_team_id").unique(),
  slackTeamName: text("slack_team_name"),
  slackAccessToken: text("slack_access_token"),
  slackRefreshToken: text("slack_refresh_token"),
  slackBotUserId: text("slack_bot_user_id"),
  agentDisplayName: text("agent_display_name").default("NOX"),
  agentIcon: text("agent_icon").default(":gear:"),
  companyBranding: jsonb("company_branding").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const agentDeployments = pgTable("agent_deployments", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").references(() => workspaces.id),
  agentId: integer("agent_id").references(() => agents.id),
  status: text("status").notNull(), // "pending", "active", "paused", "failed"
  slackChannels: text("slack_channels").array().default([]),
  permissions: jsonb("permissions").default({}),
  configuration: jsonb("configuration").default({}),
  deployedAt: timestamp("deployed_at"),
  lastActiveAt: timestamp("last_active_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const agentInteractions = pgTable("agent_interactions", {
  id: serial("id").primaryKey(),
  deploymentId: integer("deployment_id").references(() => agentDeployments.id),
  slackUserId: text("slack_user_id"),
  slackChannelId: text("slack_channel_id"),
  messageType: text("message_type").notNull(), // "mention", "dm", "keyword"
  userMessage: text("user_message").notNull(),
  agentResponse: text("agent_response"),
  responseTime: integer("response_time"), // in milliseconds
  success: boolean("success").default(true),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orchestrationTasks = pgTable("orchestration_tasks", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").references(() => workspaces.id),
  taskType: text("task_type").notNull(), // "deploy_agent", "update_config", "health_check"
  status: text("status").notNull(), // "pending", "running", "completed", "failed"
  priority: integer("priority").default(1),
  payload: jsonb("payload").notNull(),
  result: jsonb("result"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const agentMetrics = pgTable("agent_metrics", {
  id: serial("id").primaryKey(),
  deploymentId: integer("deployment_id").references(() => agentDeployments.id),
  metricType: text("metric_type").notNull(), // "interactions", "response_time", "success_rate"
  value: integer("value").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: jsonb("metadata").default({}),
});

// Vector Knowledge Base Tables
export const knowledgeDocuments = pgTable("knowledge_documents", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id), // tenant-specific knowledge
  agentId: integer("agent_id").references(() => agents.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  documentType: text("document_type").notNull(), // "procedure", "troubleshooting", "best_practice"
  embedding: vector("embedding", { dimensions: 1536 }), // OpenAI embeddings
  tags: text("tags").array().default([]),
  isPublic: boolean("is_public").default(false), // shared across tenants or tenant-specific
  createdBy: integer("created_by").references(() => tenantUsers.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const conversationMemory = pgTable("conversation_memory", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id),
  agentId: integer("agent_id").references(() => agents.id),
  workspaceId: integer("workspace_id").references(() => workspaces.id),
  slackUserId: text("slack_user_id"),
  conversationSummary: text("conversation_summary").notNull(),
  keyTopics: text("key_topics").array().default([]),
  embedding: vector("embedding", { dimensions: 1536 }),
  sentiment: real("sentiment"), // -1 to 1
  importance: real("importance"), // 0 to 1
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const problemSolutions = pgTable("problem_solutions", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").references(() => agents.id),
  problemDescription: text("problem_description").notNull(),
  solution: text("solution").notNull(),
  successRate: real("success_rate").default(0),
  usageCount: integer("usage_count").default(0),
  embedding: vector("embedding", { dimensions: 1536 }),
  tags: text("tags").array().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUsed: timestamp("last_used"),
});

export const agentLearning = pgTable("agent_learning", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").references(() => agents.id),
  learningType: text("learning_type").notNull(), // "feedback", "pattern", "improvement"
  context: text("context").notNull(),
  insight: text("insight").notNull(),
  confidence: real("confidence"), // 0 to 1
  embedding: vector("embedding", { dimensions: 1536 }),
  appliedCount: integer("applied_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

// Tenant schemas
export const insertTenantSchema = createInsertSchema(tenants).pick({
  name: true,
  domain: true,
  planType: true,
  settings: true,
  maxUsers: true,
  maxAgents: true,
});

export const insertTenantUserSchema = createInsertSchema(tenantUsers).pick({
  tenantId: true,
  email: true,
  name: true,
  role: true,
  permissions: true,
  invitedBy: true,
});

export const insertTenantIntegrationSchema = createInsertSchema(tenantIntegrations).pick({
  tenantId: true,
  integrationType: true,
  name: true,
  configuration: true,
  createdBy: true,
});

export const insertActionZoneSchema = createInsertSchema(actionZones).pick({
  tenantId: true,
  integrationId: true,
  name: true,
  description: true,
  scope: true,
  permissions: true,
  restrictions: true,
  createdBy: true,
});

export const insertTenantAgentConfigSchema = createInsertSchema(tenantAgentConfigs).pick({
  tenantId: true,
  agentId: true,
  displayName: true,
  customPrompt: true,
  allowedZones: true,
  allowedIntegrations: true,
  restrictions: true,
  createdBy: true,
});

export const insertAgentSchema = createInsertSchema(agents).pick({
  name: true,
  title: true,
  bio: true,
  avatarUrl: true,
  skills: true,
  systemPrompt: true,
});

export const insertChatSchema = createInsertSchema(chats).pick({
  userId: true,
  agentId: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  chatId: true,
  content: true,
  sender: true,
});

// Orchestration schemas
export const insertWorkspaceSchema = createInsertSchema(workspaces).pick({
  tenantId: true,
  name: true,
  slackTeamId: true,
  slackTeamName: true,
  slackAccessToken: true,
  slackBotUserId: true,
});

export const insertAgentDeploymentSchema = createInsertSchema(agentDeployments).pick({
  workspaceId: true,
  agentId: true,
  status: true,
  slackChannels: true,
  permissions: true,
  configuration: true,
});

export const insertAgentInteractionSchema = createInsertSchema(agentInteractions).pick({
  deploymentId: true,
  slackUserId: true,
  slackChannelId: true,
  messageType: true,
  userMessage: true,
  agentResponse: true,
  responseTime: true,
  success: true,
  errorMessage: true,
  metadata: true,
});

export const insertOrchestrationTaskSchema = createInsertSchema(orchestrationTasks).pick({
  workspaceId: true,
  taskType: true,
  status: true,
  priority: true,
  payload: true,
  maxRetries: true,
});

// Vector schemas
export const insertKnowledgeDocumentSchema = createInsertSchema(knowledgeDocuments).pick({
  tenantId: true,
  agentId: true,
  title: true,
  content: true,
  documentType: true,
  tags: true,
  isPublic: true,
  createdBy: true,
});

export const insertConversationMemorySchema = createInsertSchema(conversationMemory).pick({
  tenantId: true,
  agentId: true,
  workspaceId: true,
  slackUserId: true,
  conversationSummary: true,
  keyTopics: true,
  sentiment: true,
  importance: true,
});

export const insertProblemSolutionSchema = createInsertSchema(problemSolutions).pick({
  agentId: true,
  problemDescription: true,
  solution: true,
  tags: true,
});

export const insertAgentLearningSchema = createInsertSchema(agentLearning).pick({
  agentId: true,
  learningType: true,
  context: true,
  insight: true,
  confidence: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Tenant types
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;

export type TenantUser = typeof tenantUsers.$inferSelect;
export type InsertTenantUser = z.infer<typeof insertTenantUserSchema>;

export type TenantIntegration = typeof tenantIntegrations.$inferSelect;
export type InsertTenantIntegration = z.infer<typeof insertTenantIntegrationSchema>;

export type ActionZone = typeof actionZones.$inferSelect;
export type InsertActionZone = z.infer<typeof insertActionZoneSchema>;

export type TenantAgentConfig = typeof tenantAgentConfigs.$inferSelect;
export type InsertTenantAgentConfig = z.infer<typeof insertTenantAgentConfigSchema>;

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = z.infer<typeof insertAgentSchema>;

export type Chat = typeof chats.$inferSelect;
export type InsertChat = z.infer<typeof insertChatSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Orchestration types
export type Workspace = typeof workspaces.$inferSelect;
export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;

export type AgentDeployment = typeof agentDeployments.$inferSelect;
export type InsertAgentDeployment = z.infer<typeof insertAgentDeploymentSchema>;

export type AgentInteraction = typeof agentInteractions.$inferSelect;
export type InsertAgentInteraction = z.infer<typeof insertAgentInteractionSchema>;

export type OrchestrationTask = typeof orchestrationTasks.$inferSelect;
export type InsertOrchestrationTask = z.infer<typeof insertOrchestrationTaskSchema>;

export type AgentMetric = typeof agentMetrics.$inferSelect;

// Vector types
export type KnowledgeDocument = typeof knowledgeDocuments.$inferSelect;
export type InsertKnowledgeDocument = z.infer<typeof insertKnowledgeDocumentSchema>;

export type ConversationMemory = typeof conversationMemory.$inferSelect;
export type InsertConversationMemory = z.infer<typeof insertConversationMemorySchema>;

export type ProblemSolution = typeof problemSolutions.$inferSelect;
export type InsertProblemSolution = z.infer<typeof insertProblemSolutionSchema>;

export type AgentLearning = typeof agentLearning.$inferSelect;
export type InsertAgentLearning = z.infer<typeof insertAgentLearningSchema>;

// Types pour les permissions des utilisateurs tenant - Architecture Espaces Clients Entreprise
export interface TenantUserPermissions {
  // Permissions administrateur entreprise
  canManageUsers?: boolean;           // Inviter/supprimer collaborateurs
  canConfigureIntegrations?: boolean; // Configurer Slack org, GitHub, Jira, K8s
  canManageBilling?: boolean;         // Gérer facturation et plan
  canManageActionZones?: boolean;     // Définir zones d'action autorisées
  canManageAgents?: boolean;          // Configuration globale des agents
  canViewAnalytics?: boolean;         // Analytics et rapports
  
  // Permissions utilisateurs internes
  canUseSlackBot?: boolean;           // Utiliser agents via Slack
  canUseTeamsBot?: boolean;           // Utiliser agents via Teams  
  canUsePlatform?: boolean;           // Accès plateforme web
  canRequestDeployments?: boolean;    // Demander déploiements K8s
  canViewLogs?: boolean;              // Consulter logs système
  canReceiveAlerts?: boolean;         // Recevoir alertes monitoring
  
  // Permissions spécifiques aux agents
  canUseNOX?: boolean;               // Agent DevOps
  canUseATLAS?: boolean;             // Agent Cloud (futur)
  canUseCIRRUS?: boolean;            // Agent Systems (futur)
  
  // Restrictions et limites
  maxActionsPerDay?: number;         // Limite actions quotidiennes
  allowedActionTypes?: string[];     // Types d'actions autorisées
  restrictedResources?: string[];    // Ressources interdites
}

// Types pour les rôles utilisateur entreprise et freelance
export type TenantUserRole = 
  | 'admin'      // Admin entreprise : facturation, invitations, intégrations globales
  | 'manager'    // Manager équipe : permissions étendues sur son équipe
  | 'developer'  // Développeur : accès standard aux agents et actions
  | 'viewer'     // Observateur : lecture seule, pas d'actions
  | 'freelance'; // Freelance : admin complet de son espace personnel

// Helper pour permissions par défaut selon le rôle
export const getDefaultPermissionsByRole = (role: TenantUserRole): TenantUserPermissions => {
  switch (role) {
    case 'admin':
      return {
        // Permissions admin complètes
        canManageUsers: true,
        canConfigureIntegrations: true,
        canManageBilling: true,
        canManageActionZones: true,
        canManageAgents: true,
        canViewAnalytics: true,
        // Accès utilisateur complet
        canUseSlackBot: true,
        canUseTeamsBot: true,
        canUsePlatform: true,
        canRequestDeployments: true,
        canViewLogs: true,
        canReceiveAlerts: true,
        // Tous les agents
        canUseNOX: true,
        canUseATLAS: true,
        canUseCIRRUS: true,
        // Limites élevées
        maxActionsPerDay: 1000,
        allowedActionTypes: ['*'], // Toutes actions
        restrictedResources: [] // Aucune restriction
      };
    
    case 'manager':
      return {
        // Gestion équipe limitée
        canManageUsers: false, // Seulement admin peut inviter
        canConfigureIntegrations: false,
        canManageBilling: false,
        canManageActionZones: false,
        canManageAgents: false,
        canViewAnalytics: true,
        // Accès utilisateur complet
        canUseSlackBot: true,
        canUseTeamsBot: true,
        canUsePlatform: true,
        canRequestDeployments: true,
        canViewLogs: true,
        canReceiveAlerts: true,
        // Agents principaux
        canUseNOX: true,
        canUseATLAS: true,
        canUseCIRRUS: false,
        // Limites modérées
        maxActionsPerDay: 200,
        allowedActionTypes: ['deploy', 'logs', 'status', 'alerts'],
        restrictedResources: ['prod-db'] // Protection ressources critiques
      };
      
    case 'developer':
      return {
        // Aucune permission admin
        canManageUsers: false,
        canConfigureIntegrations: false,
        canManageBilling: false,
        canManageActionZones: false,
        canManageAgents: false,
        canViewAnalytics: false,
        // Accès utilisateur standard
        canUseSlackBot: true,
        canUseTeamsBot: true,
        canUsePlatform: true,
        canRequestDeployments: true,
        canViewLogs: true,
        canReceiveAlerts: true,
        // Agent principal uniquement
        canUseNOX: true,
        canUseATLAS: false,
        canUseCIRRUS: false,
        // Limites standards
        maxActionsPerDay: 50,
        allowedActionTypes: ['deploy', 'logs', 'status'],
        restrictedResources: ['prod-db', 'prod-secrets'] // Restrictions production
      };
      
    case 'viewer':
      return {
        // Aucune permission admin
        canManageUsers: false,
        canConfigureIntegrations: false,
        canManageBilling: false,
        canManageActionZones: false,
        canManageAgents: false,
        canViewAnalytics: false,
        // Accès lecture seule
        canUseSlackBot: true,
        canUseTeamsBot: true,
        canUsePlatform: true,
        canRequestDeployments: false,
        canViewLogs: true,
        canReceiveAlerts: true,
        // Agent lecture seule
        canUseNOX: true,
        canUseATLAS: false,
        canUseCIRRUS: false,
        // Limites très restrictives
        maxActionsPerDay: 10,
        allowedActionTypes: ['status', 'logs'],
        restrictedResources: ['prod-db', 'prod-secrets', 'staging-db'] // Très restrictif
      };
      
    case 'freelance':
      return {
        // Admin complet de son espace personnel
        canManageUsers: true,           // Peut inviter clients ponctuels
        canConfigureIntegrations: true, // Ses outils perso
        canManageBilling: true,         // Sa facturation
        canManageActionZones: true,     // Ses environnements clients
        canManageAgents: true,          // Configuration NOX perso
        canViewAnalytics: true,         // Ses métriques d'activité
        // Usage illimité pour lui
        canUseSlackBot: true,
        canUseTeamsBot: true,
        canUsePlatform: true,
        canRequestDeployments: true,
        canViewLogs: true,
        canReceiveAlerts: true,
        // Agents selon plan freelance
        canUseNOX: true,
        canUseATLAS: false,    // Plan Pro requis
        canUseCIRRUS: false,   // Plan Enterprise requis
        // Limites freelance généreuses
        maxActionsPerDay: 100,
        allowedActionTypes: ['*'], // Toutes actions
        restrictedResources: []    // Aucune restriction par défaut
      };
  }
};
