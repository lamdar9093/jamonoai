import fs from 'fs/promises';
import path from 'path';

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface AgentConversationHistory {
  agentId: number;
  messages: ConversationMessage[];
  lastUpdated: Date;
}

class ConversationHistoryManager {
  private historyDir: string;

  constructor() {
    this.historyDir = path.join(process.cwd(), 'conversation-history');
    this.ensureHistoryDirExists();
  }

  private async ensureHistoryDirExists(): Promise<void> {
    try {
      await fs.access(this.historyDir);
    } catch {
      await fs.mkdir(this.historyDir, { recursive: true });
    }
  }

  private getHistoryFilePath(agentId: number): string {
    return path.join(this.historyDir, `agent-${agentId}-history.json`);
  }

  /**
   * Récupère l'historique des conversations pour un agent
   */
  async getAgentHistory(agentId: number): Promise<ConversationMessage[]> {
    try {
      const filePath = this.getHistoryFilePath(agentId);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const history: AgentConversationHistory = JSON.parse(fileContent);
      
      // Convertir les timestamps string en Date objects
      history.messages = history.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
      
      return history.messages;
    } catch (error) {
      // Si le fichier n'existe pas ou il y a une erreur, retourner un tableau vide
      console.log(`No history found for agent ${agentId}, starting fresh`);
      return [];
    }
  }

  /**
   * Récupère les N derniers échanges (question + réponse) pour un agent
   */
  async getRecentExchanges(agentId: number, maxExchanges: number = 10): Promise<ConversationMessage[]> {
    const fullHistory = await this.getAgentHistory(agentId);
    
    // Filtrer pour ne garder que les messages user et assistant (pas system)
    const conversationMessages = fullHistory.filter(msg => 
      msg.role === 'user' || msg.role === 'assistant'
    );
    
    // Prendre les derniers messages (maxExchanges * 2 car chaque échange = question + réponse)
    const recentMessages = conversationMessages.slice(-(maxExchanges * 2));
    
    return recentMessages;
  }

  /**
   * Ajoute un nouveau message à l'historique d'un agent
   */
  async addMessage(
    agentId: number, 
    role: 'user' | 'assistant' | 'system', 
    content: string
  ): Promise<void> {
    const currentHistory = await this.getAgentHistory(agentId);
    
    const newMessage: ConversationMessage = {
      role,
      content,
      timestamp: new Date()
    };
    
    currentHistory.push(newMessage);
    
    const historyData: AgentConversationHistory = {
      agentId,
      messages: currentHistory,
      lastUpdated: new Date()
    };
    
    const filePath = this.getHistoryFilePath(agentId);
    await fs.writeFile(filePath, JSON.stringify(historyData, null, 2), 'utf-8');
  }

  /**
   * Efface l'historique d'un agent
   */
  async clearAgentHistory(agentId: number): Promise<void> {
    try {
      const filePath = this.getHistoryFilePath(agentId);
      await fs.unlink(filePath);
      console.log(`History cleared for agent ${agentId}`);
    } catch (error) {
      // Si le fichier n'existe pas, pas d'erreur
      console.log(`No history file to clear for agent ${agentId}`);
    }
  }

  /**
   * Construit le contexte complet pour l'API OpenAI, incluant le prompt système et l'historique
   */
  async buildContextForOpenAI(
    agentId: number, 
    systemPrompt: string, 
    newUserMessage: string
  ): Promise<Array<{role: 'system' | 'user' | 'assistant', content: string}>> {
    const recentHistory = await this.getRecentExchanges(agentId, 10);
    
    const context: Array<{role: 'system' | 'user' | 'assistant', content: string}> = [
      { role: 'system', content: systemPrompt }
    ];
    
    // Ajouter l'historique récent
    recentHistory.forEach(msg => {
      context.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      });
    });
    
    // Ajouter le nouveau message de l'utilisateur
    context.push({ role: 'user', content: newUserMessage });
    
    return context;
  }

  /**
   * Sauvegarde un échange complet (question utilisateur + réponse assistant)
   */
  async saveExchange(agentId: number, userMessage: string, assistantResponse: string): Promise<void> {
    await this.addMessage(agentId, 'user', userMessage);
    await this.addMessage(agentId, 'assistant', assistantResponse);
  }
}

export const conversationHistoryManager = new ConversationHistoryManager();
export type { ConversationMessage, AgentConversationHistory };