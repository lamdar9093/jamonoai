import { db } from './db';
import { 
  knowledgeDocuments,
  conversationMemory,
  problemSolutions,
  agentLearning,
  type InsertKnowledgeDocument,
  type InsertConversationMemory,
  type InsertProblemSolution,
  type InsertAgentLearning
} from '@shared/schema';
import { eq, sql, desc, and, gt } from 'drizzle-orm';
import OpenAI from 'openai';

export class VectorService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
    if (!apiKey || apiKey === "sk-dummy-key") {
      console.warn('⚠️ Clé OpenAI manquante - Les embeddings vectoriels ne seront pas disponibles');
      this.openai = null as any;
    } else {
      this.openai = new OpenAI({ apiKey });
      console.log('✅ Service vectoriel OpenAI initialisé');
    }
  }

  /**
   * Génère un embedding pour un texte donné
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.openai) {
      // Mode fallback avec hash simple
      return this.simpleTextHash(text);
    }

    try {
      const response = await this.openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text
      });

      return response.data[0].embedding;
    } catch (error) {
      console.warn('Erreur embeddings OpenAI:', (error as any).message);
      // Mode fallback avec hash simple
      return this.simpleTextHash(text);
    }
  }

  /**
   * Génère un hash numérique simple pour simulation vectorielle
   */
  private simpleTextHash(text: string): number[] {
    const words = text.toLowerCase().split(/\s+/);
    const hash = new Array(1536).fill(0);
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      for (let j = 0; j < word.length; j++) {
        const charCode = word.charCodeAt(j);
        const index = (charCode + i + j) % 1536;
        hash[index] = (hash[index] + charCode / 1000) % 1;
      }
    }
    
    return hash;
  }

  /**
   * Ajoute une nouvelle connaissance à la base vectorielle
   */
  async addKnowledge(data: InsertKnowledgeDocument): Promise<void> {
    const embedding = await this.generateEmbedding(`${data.title} ${data.content}`);
    
    const tags = data.tags || [];
    const tagsArray = `{${tags.map(tag => `"${tag}"`).join(',')}}`;
    await db.execute(sql`
      INSERT INTO knowledge_documents (agent_id, title, content, document_type, tags, embedding, created_at, updated_at)
      VALUES (${data.agentId}, ${data.title}, ${data.content}, ${data.documentType}, ${tagsArray}::text[], ${`[${embedding.join(',')}]`}::vector, NOW(), NOW())
    `);
  }

  /**
   * Recherche des connaissances similaires par similarité vectorielle
   */
  async searchKnowledge(query: string, agentId: number, limit: number = 5): Promise<any[]> {
    const queryEmbedding = await this.generateEmbedding(query);
    
    const results = await db.execute(sql`
      SELECT id, title, content, document_type, tags,
             (embedding <=> ${`[${queryEmbedding.join(',')}]`}) as distance
      FROM knowledge_documents 
      WHERE agent_id = ${agentId}
      ORDER BY embedding <=> ${`[${queryEmbedding.join(',')}]`}
      LIMIT ${limit}
    `);

    return results.rows;
  }

  /**
   * Enregistre une mémoire de conversation
   */
  async saveConversationMemory(data: InsertConversationMemory): Promise<void> {
    const embedding = await this.generateEmbedding(data.conversationSummary);
    
    const keyTopics = data.keyTopics || [];
    const keyTopicsArray = `{${keyTopics.map(topic => `"${topic}"`).join(',')}}`;
    
    await db.execute(sql`
      INSERT INTO conversation_memory (agent_id, workspace_id, slack_user_id, conversation_summary, key_topics, embedding, sentiment, importance, created_at)
      VALUES (${data.agentId}, ${data.workspaceId}, ${data.slackUserId}, ${data.conversationSummary}, ${keyTopicsArray}::text[], ${`[${embedding.join(',')}]`}::vector, ${data.sentiment}, ${data.importance}, NOW())
    `);
  }

  /**
   * Recherche des conversations similaires
   */
  async findSimilarConversations(query: string, agentId: number, workspaceId?: number, limit: number = 3): Promise<any[]> {
    const queryEmbedding = await this.generateEmbedding(query);
    
    let whereClause = `agent_id = ${agentId}`;
    if (workspaceId) {
      whereClause += ` AND workspace_id = ${workspaceId}`;
    }

    const results = await db.execute(sql`
      SELECT conversation_summary, key_topics, sentiment, importance,
             (embedding <=> ${`[${queryEmbedding.join(',')}]`}) as distance
      FROM conversation_memory 
      WHERE ${sql.raw(whereClause)}
      ORDER BY embedding <=> ${`[${queryEmbedding.join(',')}]`}
      LIMIT ${limit}
    `);

    return results.rows;
  }

  /**
   * Enregistre une solution de problème
   */
  async saveProblemSolution(data: InsertProblemSolution): Promise<void> {
    const embedding = await this.generateEmbedding(`${data.problemDescription} ${data.solution}`);
    
    await db.execute(sql`
      INSERT INTO problem_solutions (agent_id, problem_description, solution, tags, embedding, created_at)
      VALUES (${data.agentId}, ${data.problemDescription}, ${data.solution}, ${data.tags}, ${`[${embedding.join(',')}]`}, NOW())
    `);
  }

  /**
   * Trouve des solutions similaires pour un problème
   */
  async findSimilarSolutions(problemDescription: string, agentId: number, limit: number = 3): Promise<any[]> {
    const queryEmbedding = await this.generateEmbedding(problemDescription);
    
    const results = await db.execute(sql`
      SELECT problem_description, solution, success_rate, usage_count, tags,
             (embedding <=> ${`[${queryEmbedding.join(',')}]`}) as distance
      FROM problem_solutions 
      WHERE agent_id = ${agentId} AND success_rate > 0.7
      ORDER BY embedding <=> ${`[${queryEmbedding.join(',')}]`}
      LIMIT ${limit}
    `);

    return results.rows;
  }

  /**
   * Enregistre un apprentissage de l'agent
   */
  async saveAgentLearning(data: InsertAgentLearning): Promise<void> {
    const embedding = await this.generateEmbedding(`${data.context} ${data.insight}`);
    
    await db.execute(sql`
      INSERT INTO agent_learning (agent_id, learning_type, context, insight, confidence, embedding, created_at)
      VALUES (${data.agentId}, ${data.learningType}, ${data.context}, ${data.insight}, ${data.confidence}, ${`[${embedding.join(',')}]`}, NOW())
    `);
  }

  /**
   * Récupère les apprentissages pertinents pour un contexte
   */
  async getRelevantLearnings(context: string, agentId: number, limit: number = 5): Promise<any[]> {
    const queryEmbedding = await this.generateEmbedding(context);
    
    const results = await db.execute(sql`
      SELECT learning_type, context, insight, confidence, applied_count,
             (embedding <=> ${`[${queryEmbedding.join(',')}]`}) as distance
      FROM agent_learning 
      WHERE agent_id = ${agentId} AND confidence > 0.6
      ORDER BY embedding <=> ${`[${queryEmbedding.join(',')}]`}
      LIMIT ${limit}
    `);

    return results.rows;
  }

  /**
   * Met à jour le taux de succès d'une solution après utilisation
   */
  async updateSolutionSuccess(problemDescription: string, agentId: number, wasSuccessful: boolean): Promise<void> {
    const queryEmbedding = await this.generateEmbedding(problemDescription);
    
    // Trouve la solution la plus similaire
    const results = await db.execute(sql`
      SELECT id, success_rate, usage_count
      FROM problem_solutions 
      WHERE agent_id = ${agentId}
      ORDER BY embedding <=> ${`[${queryEmbedding.join(',')}]`}
      LIMIT 1
    `);

    if (results.rows.length > 0) {
      const solution = results.rows[0] as any;
      const newUsageCount = solution.usage_count + 1;
      const newSuccessRate = wasSuccessful 
        ? (solution.success_rate * solution.usage_count + 1) / newUsageCount
        : (solution.success_rate * solution.usage_count) / newUsageCount;

      await db.update(problemSolutions)
        .set({ 
          successRate: newSuccessRate,
          usageCount: newUsageCount,
          lastUsed: new Date()
        })
        .where(eq(problemSolutions.id, solution.id));
    }
  }

  /**
   * Construit un contexte enrichi pour l'agent basé sur la recherche vectorielle
   */
  async buildEnrichedContext(query: string, agentId: number, workspaceId?: number): Promise<string> {
    const [knowledge, conversations, solutions, learnings] = await Promise.all([
      this.searchKnowledge(query, agentId, 3),
      this.findSimilarConversations(query, agentId, workspaceId, 2),
      this.findSimilarSolutions(query, agentId, 2),
      this.getRelevantLearnings(query, agentId, 3)
    ]);

    let context = "";

    if (knowledge.length > 0) {
      context += "\n\n**Base de connaissances pertinente:**\n";
      knowledge.forEach((doc: any) => {
        context += `- ${doc.title}: ${doc.content.substring(0, 200)}...\n`;
      });
    }

    if (solutions.length > 0) {
      context += "\n\n**Solutions similaires réussies:**\n";
      solutions.forEach((sol: any) => {
        context += `- Problème: ${sol.problem_description}\n  Solution: ${sol.solution}\n  Taux de succès: ${(sol.success_rate * 100).toFixed(1)}%\n`;
      });
    }

    if (conversations.length > 0) {
      context += "\n\n**Conversations similaires passées:**\n";
      conversations.forEach((conv: any) => {
        context += `- ${conv.conversation_summary} (Topics: ${conv.key_topics?.join(', ') || 'N/A'})\n`;
      });
    }

    if (learnings.length > 0) {
      context += "\n\n**Apprentissages pertinents:**\n";
      learnings.forEach((learn: any) => {
        context += `- ${learn.insight} (Confiance: ${(learn.confidence * 100).toFixed(1)}%)\n`;
      });
    }

    return context;
  }

  /**
   * Analyse post-interaction pour l'apprentissage continu
   */
  async analyzeInteractionForLearning(
    agentId: number, 
    userQuery: string, 
    agentResponse: string, 
    success: boolean,
    responseTime: number
  ): Promise<void> {
    // Enregistrer la conversation en mémoire
    const conversationSummary = `Q: ${userQuery.substring(0, 200)} R: ${agentResponse.substring(0, 200)}`;
    const sentiment = success ? 0.8 : 0.2; // Sentiment basé sur le succès
    const importance = responseTime < 2000 ? 0.9 : 0.6; // Importance basée sur la rapidité

    await this.saveConversationMemory({
      agentId,
      conversationSummary,
      keyTopics: this.extractKeywords(userQuery),
      sentiment,
      importance
    });

    // Si la réponse était efficace, l'enregistrer comme solution
    if (success && responseTime < 3000) {
      await this.saveProblemSolution({
        agentId,
        problemDescription: userQuery,
        solution: agentResponse,
        tags: this.extractKeywords(userQuery)
      });
    }

    // Générer un insight d'apprentissage
    if (success) {
      const insight = `Réponse efficace pour les problèmes de type: ${this.categorizeQuery(userQuery)}`;
      await this.saveAgentLearning({
        agentId,
        learningType: 'pattern',
        context: userQuery,
        insight,
        confidence: 0.8
      });
    }
  }

  /**
   * Extrait les mots-clés d'un texte
   */
  private extractKeywords(text: string): string[] {
    const stopWords = ['le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou', 'mais', 'donc', 'car', 'ni', 'or'];
    return text.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.includes(word))
      .slice(0, 5);
  }

  /**
   * Catégorise une requête utilisateur
   */
  private categorizeQuery(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('serveur') || lowerQuery.includes('performance')) return 'infrastructure';
    if (lowerQuery.includes('kubernetes') || lowerQuery.includes('docker')) return 'containerization';
    if (lowerQuery.includes('sécurité') || lowerQuery.includes('audit')) return 'security';
    if (lowerQuery.includes('migration') || lowerQuery.includes('plan')) return 'planning';
    if (lowerQuery.includes('incident') || lowerQuery.includes('problème')) return 'troubleshooting';
    
    return 'general';
  }
}

export const vectorService = new VectorService();