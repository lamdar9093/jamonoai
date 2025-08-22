import { 
  agents, 
  type Agent, 
  type InsertAgent, 
  chats, 
  type Chat, 
  type InsertChat, 
  messages, 
  type Message, 
  type InsertMessage, 
  users, 
  type User, 
  type InsertUser,
  workspaces,
  agentDeployments,
  agentInteractions,
  orchestrationTasks,
  agentMetrics,
  type Workspace,
  type InsertWorkspace,
  type AgentDeployment,
  type InsertAgentDeployment,
  type AgentInteraction,
  type InsertAgentInteraction,
  type OrchestrationTask,
  type InsertOrchestrationTask,
  type AgentMetric
} from "@shared/schema";
import { db } from "./db";
import { eq, like, or, and, desc, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Agent operations
  getAllAgents(): Promise<Agent[]>;
  getFeaturedAgents(): Promise<Agent[]>;
  getAgentById(id: number): Promise<Agent | undefined>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: number, agent: Partial<Agent>): Promise<Agent | undefined>;
  deleteAgent(id: number): Promise<boolean>;
  searchAgents(query: string, skills?: string[], category?: string): Promise<Agent[]>;
  getAgentSuggestions(query: string): Promise<Agent[]>;
  getAllSkills(): Promise<string[]>;
  
  // Chat operations
  createChat(chat: InsertChat): Promise<Chat>;
  getChatsByUserId(userId: number): Promise<Chat[]>;
  getChatById(id: number): Promise<Chat | undefined>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByChatId(chatId: number): Promise<Message[]>;

  // Orchestration operations
  getWorkspaceBySlackTeamId(slackTeamId: string): Promise<Workspace | undefined>;
  getWorkspaceById(id: number): Promise<Workspace | undefined>;
  createWorkspace(workspace: InsertWorkspace): Promise<Workspace>;
  updateWorkspace(id: number, workspace: Partial<Workspace>): Promise<Workspace | undefined>;
  updateWorkspaceStatus(id: number, status: string): Promise<void>;
  getActiveAgentDeployments(workspaceId: number): Promise<AgentDeployment[]>;
  getWorkspaceDeployments(workspaceId: number): Promise<AgentDeployment[]>;
  createAgentDeployment(deployment: InsertAgentDeployment): Promise<AgentDeployment>;
  updateAgentDeployment(id: number, deployment: Partial<AgentDeployment>): Promise<AgentDeployment | undefined>;
  createAgentInteraction(interaction: InsertAgentInteraction): Promise<AgentInteraction>;
  getAgentInteractionsByDeployment(deploymentId: number, limit?: number): Promise<AgentInteraction[]>;
  createOrchestrationTask(task: InsertOrchestrationTask): Promise<OrchestrationTask>;
  getPendingOrchestrationTasks(workspaceId?: number): Promise<OrchestrationTask[]>;
  updateOrchestrationTask(id: number, task: Partial<OrchestrationTask>): Promise<OrchestrationTask | undefined>;
  createAgentMetric(metric: Omit<AgentMetric, 'id'>): Promise<AgentMetric>;
  getAgentMetrics(deploymentId: number, metricType?: string, limit?: number): Promise<AgentMetric[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private agents: Map<number, Agent>;
  private chats: Map<number, Chat>;
  private messages: Map<number, Message>;
  private currentUserId: number;
  private currentAgentId: number;
  private currentChatId: number;
  private currentMessageId: number;

  constructor() {
    this.users = new Map();
    this.agents = new Map();
    this.chats = new Map();
    this.messages = new Map();
    this.currentUserId = 1;
    this.currentAgentId = 1;
    this.currentChatId = 1;
    this.currentMessageId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }
  
  // Agent operations
  async getAllAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values());
  }
  
  async getFeaturedAgents(): Promise<Agent[]> {
    // Get all agents and sort by rating (highest first)
    const allAgents = Array.from(this.agents.values());
    return allAgents.sort((a, b) => b.rating - a.rating).slice(0, 6);
  }
  
  async getAgentById(id: number): Promise<Agent | undefined> {
    return this.agents.get(id);
  }
  
  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const id = this.currentAgentId++;
    const agent: Agent = {
      ...insertAgent,
      id,
      rating: 0,
      isOnline: true,
      createdAt: new Date()
    };
    this.agents.set(id, agent);
    return agent;
  }
  
  async updateAgent(id: number, agentData: Partial<Agent>): Promise<Agent | undefined> {
    const agent = this.agents.get(id);
    if (!agent) return undefined;
    
    const updatedAgent = { ...agent, ...agentData };
    this.agents.set(id, updatedAgent);
    return updatedAgent;
  }
  
  async deleteAgent(id: number): Promise<boolean> {
    return this.agents.delete(id);
  }
  
  async searchAgents(query: string, skills: string[] = [], category?: string): Promise<Agent[]> {
    let filteredAgents = Array.from(this.agents.values());
    
    // Filter by query if provided
    if (query && query.trim() !== '') {
      const lowerQuery = query.toLowerCase();
      filteredAgents = filteredAgents.filter(agent => 
        agent.name.toLowerCase().includes(lowerQuery) ||
        agent.title.toLowerCase().includes(lowerQuery) ||
        agent.bio.toLowerCase().includes(lowerQuery) ||
        agent.skills.some(skill => skill.toLowerCase().includes(lowerQuery))
      );
    }
    
    // Filter by skills if provided
    if (skills && skills.length > 0) {
      filteredAgents = filteredAgents.filter(agent =>
        skills.every(skill => 
          agent.skills.some(agentSkill => 
            agentSkill.toLowerCase().includes(skill.toLowerCase())
          )
        )
      );
    }
    
    // Filter by category if provided
    if (category && category.trim() !== '') {
      const lowerCategory = category.toLowerCase();
      
      // Map category to related skills
      const categorySkillsMap: Record<string, string[]> = {
        devops: ['docker', 'kubernetes', 'jenkins', 'cicd', 'terraform', 'ansible'],
        cloud: ['aws', 'azure', 'gcp', 'cloud'],
        programming: ['javascript', 'typescript', 'python', 'java', 'go', 'ruby'],
        security: ['security', 'penetration testing', 'firewall', 'encryption'],
        database: ['sql', 'nosql', 'mongodb', 'postgres', 'mysql', 'redis'],
        ai: ['machine learning', 'artificial intelligence', 'ml', 'ai', 'data science']
      };
      
      const categorySkills = categorySkillsMap[lowerCategory] || [];
      
      if (categorySkills.length > 0) {
        filteredAgents = filteredAgents.filter(agent =>
          agent.skills.some(skill =>
            categorySkills.some(categorySkill =>
              skill.toLowerCase().includes(categorySkill)
            )
          )
        );
      }
    }
    
    return filteredAgents;
  }
  
  async getAgentSuggestions(query: string): Promise<Agent[]> {
    if (!query || query.trim() === '') return [];
    
    const lowerQuery = query.toLowerCase();
    const allAgents = Array.from(this.agents.values());
    
    // Filter agents by name, title or skills
    const filteredAgents = allAgents.filter(agent => 
      agent.name.toLowerCase().includes(lowerQuery) ||
      agent.title.toLowerCase().includes(lowerQuery) ||
      agent.skills.some(skill => skill.toLowerCase().includes(lowerQuery))
    );
    
    // Return top 5 suggestions
    return filteredAgents.slice(0, 5);
  }
  
  async getAllSkills(): Promise<string[]> {
    // Get unique skills from all agents
    const skillsSet = new Set<string>();
    const allAgents = Array.from(this.agents.values());
    
    allAgents.forEach(agent => {
      agent.skills.forEach(skill => {
        skillsSet.add(skill);
      });
    });
    
    return Array.from(skillsSet).sort();
  }
  
  // Chat operations
  async createChat(insertChat: InsertChat): Promise<Chat> {
    const id = this.currentChatId++;
    const chat: Chat = {
      ...insertChat,
      id,
      createdAt: new Date()
    };
    this.chats.set(id, chat);
    return chat;
  }
  
  async getChatsByUserId(userId: number): Promise<Chat[]> {
    return Array.from(this.chats.values()).filter(
      chat => chat.userId === userId
    );
  }
  
  async getChatById(id: number): Promise<Chat | undefined> {
    return this.chats.get(id);
  }
  
  // Message operations
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = {
      ...insertMessage,
      id,
      createdAt: new Date()
    };
    this.messages.set(id, message);
    return message;
  }
  
  async getMessagesByChatId(chatId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.chatId === chatId)
      .sort((a, b) => {
        // Sort by creation time
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Agent operations
  async getAllAgents(): Promise<Agent[]> {
    return await db.select().from(agents);
  }

  async getFeaturedAgents(): Promise<Agent[]> {
    return await db.select().from(agents).orderBy(desc(agents.rating)).limit(10);
  }

  async getAgentById(id: number): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    return agent || undefined;
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const [agent] = await db.insert(agents).values(insertAgent).returning();
    return agent;
  }

  async updateAgent(id: number, agentData: Partial<Agent>): Promise<Agent | undefined> {
    const [agent] = await db.update(agents)
      .set(agentData)
      .where(eq(agents.id, id))
      .returning();
    return agent || undefined;
  }

  async deleteAgent(id: number): Promise<boolean> {
    const result = await db.delete(agents).where(eq(agents.id, id));
    return result.rowCount > 0;
  }

  async searchAgents(query: string, skills: string[] = [], category?: string): Promise<Agent[]> {
    let whereConditions = [];

    if (query) {
      whereConditions.push(
        or(
          like(agents.name, `%${query}%`),
          like(agents.title, `%${query}%`),
          like(agents.bio, `%${query}%`)
        )
      );
    }

    if (skills.length > 0) {
      whereConditions.push(sql`${agents.skills} && ${skills}`);
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    return await db.select().from(agents).where(whereClause).orderBy(desc(agents.rating));
  }

  async getAgentSuggestions(query: string): Promise<Agent[]> {
    return await db.select().from(agents)
      .where(
        or(
          like(agents.name, `%${query}%`),
          like(agents.title, `%${query}%`),
          like(agents.bio, `%${query}%`)
        )
      )
      .limit(5);
  }

  async getAllSkills(): Promise<string[]> {
    const result = await db.select({ skills: agents.skills }).from(agents);
    const allSkills = result.flatMap(agent => agent.skills);
    return [...new Set(allSkills)];
  }

  // Chat operations
  async createChat(insertChat: InsertChat): Promise<Chat> {
    const [chat] = await db.insert(chats).values(insertChat).returning();
    return chat;
  }

  async getChatsByUserId(userId: number): Promise<Chat[]> {
    return await db.select().from(chats).where(eq(chats.userId, userId));
  }

  async getChatById(id: number): Promise<Chat | undefined> {
    const [chat] = await db.select().from(chats).where(eq(chats.id, id));
    return chat || undefined;
  }

  // Message operations
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }

  async getMessagesByChatId(chatId: number): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.chatId, chatId)).orderBy(messages.createdAt);
  }

  // Orchestration operations
  async getWorkspaceBySlackTeamId(slackTeamId: string): Promise<Workspace | undefined> {
    const [workspace] = await db.select().from(workspaces).where(eq(workspaces.slackTeamId, slackTeamId));
    return workspace || undefined;
  }

  async getWorkspaceById(id: number): Promise<Workspace | undefined> {
    const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, id));
    return workspace || undefined;
  }

  async createWorkspace(insertWorkspace: InsertWorkspace): Promise<Workspace> {
    const [workspace] = await db.insert(workspaces).values(insertWorkspace).returning();
    return workspace;
  }

  async updateWorkspace(id: number, workspaceData: Partial<Workspace>): Promise<Workspace | undefined> {
    const [workspace] = await db.update(workspaces)
      .set({ ...workspaceData, updatedAt: new Date() })
      .where(eq(workspaces.id, id))
      .returning();
    return workspace || undefined;
  }

  async updateWorkspaceStatus(id: number, status: string): Promise<void> {
    await db.update(workspaces)
      .set({ status, updatedAt: new Date() })
      .where(eq(workspaces.id, id));
  }

  async getActiveAgentDeployments(workspaceId: number): Promise<AgentDeployment[]> {
    return await db.select().from(agentDeployments)
      .where(and(eq(agentDeployments.workspaceId, workspaceId), eq(agentDeployments.status, 'active')));
  }

  async getWorkspaceDeployments(workspaceId: number): Promise<AgentDeployment[]> {
    return await db.select().from(agentDeployments)
      .where(eq(agentDeployments.workspaceId, workspaceId))
      .orderBy(desc(agentDeployments.createdAt));
  }

  async createAgentDeployment(insertDeployment: InsertAgentDeployment): Promise<AgentDeployment> {
    const [deployment] = await db.insert(agentDeployments).values(insertDeployment).returning();
    return deployment;
  }

  async updateAgentDeployment(id: number, deploymentData: Partial<AgentDeployment>): Promise<AgentDeployment | undefined> {
    const [deployment] = await db.update(agentDeployments)
      .set({ ...deploymentData, updatedAt: new Date() })
      .where(eq(agentDeployments.id, id))
      .returning();
    return deployment || undefined;
  }

  async createAgentInteraction(insertInteraction: InsertAgentInteraction): Promise<AgentInteraction> {
    const [interaction] = await db.insert(agentInteractions).values(insertInteraction).returning();
    return interaction;
  }

  async getAgentInteractionsByDeployment(deploymentId: number, limit: number = 100): Promise<AgentInteraction[]> {
    return await db.select().from(agentInteractions)
      .where(eq(agentInteractions.deploymentId, deploymentId))
      .orderBy(desc(agentInteractions.createdAt))
      .limit(limit);
  }

  async createOrchestrationTask(insertTask: InsertOrchestrationTask): Promise<OrchestrationTask> {
    const [task] = await db.insert(orchestrationTasks).values(insertTask).returning();
    return task;
  }

  async getPendingOrchestrationTasks(workspaceId?: number): Promise<OrchestrationTask[]> {
    let whereCondition = eq(orchestrationTasks.status, 'pending');
    
    if (workspaceId !== undefined) {
      whereCondition = and(whereCondition, eq(orchestrationTasks.workspaceId, workspaceId));
    }

    return await db.select().from(orchestrationTasks)
      .where(whereCondition)
      .orderBy(desc(orchestrationTasks.priority), orchestrationTasks.createdAt)
      .limit(10);
  }

  async updateOrchestrationTask(id: number, taskData: Partial<OrchestrationTask>): Promise<OrchestrationTask | undefined> {
    const [task] = await db.update(orchestrationTasks)
      .set({ ...taskData, updatedAt: new Date() })
      .where(eq(orchestrationTasks.id, id))
      .returning();
    return task || undefined;
  }

  async createAgentMetric(metric: Omit<AgentMetric, 'id'>): Promise<AgentMetric> {
    const [createdMetric] = await db.insert(agentMetrics).values(metric).returning();
    return createdMetric;
  }

  async getAgentMetrics(deploymentId: number, metricType?: string, limit: number = 100): Promise<AgentMetric[]> {
    let whereCondition = eq(agentMetrics.deploymentId, deploymentId);
    
    if (metricType) {
      whereCondition = and(whereCondition, eq(agentMetrics.metricType, metricType));
    }

    return await db.select().from(agentMetrics)
      .where(whereCondition)
      .orderBy(desc(agentMetrics.timestamp))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
