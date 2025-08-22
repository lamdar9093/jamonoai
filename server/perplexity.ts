import axios from 'axios';

// Interface pour les messages de chat
interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Interface pour les options de configuration de la requête
interface PerplexityRequestOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

// Classe pour interagir avec l'API Perplexity
export class PerplexityAPI {
  private apiKey: string;
  private baseURL: string = 'https://api.perplexity.ai/chat/completions';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Méthode pour appeler l'API Perplexity
  async generateCompletion(
    messages: ChatMessage[],
    options: PerplexityRequestOptions = {}
  ): Promise<string> {
    try {
      const response = await axios.post(
        this.baseURL,
        {
          model: options.model || 'llama-3.1-sonar-small-128k-online',
          messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 1000,
          stream: false
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Erreur lors de la génération de la réponse:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`API Perplexity erreur: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`Erreur lors de la communication avec l'API Perplexity: ${error.message}`);
    }
  }

  // Méthode pour générer une réponse streaming
  async generateStreamingCompletion(
    messages: ChatMessage[],
    onChunk: (chunk: string) => void,
    options: PerplexityRequestOptions = {}
  ): Promise<void> {
    try {
      // Pour les réponses en streaming, nous allons simuler le comportement avec une réponse non streaming
      // car l'implémentation complète du streaming nécessiterait plus de code spécialisé
      const fullResponse = await this.generateCompletion(messages, options);
      
      // Simuler un streaming en divisant la réponse en morceaux
      const chunkSize = 15; // Taille approximative des morceaux
      for (let i = 0; i < fullResponse.length; i += chunkSize) {
        const chunk = fullResponse.slice(i, i + chunkSize);
        onChunk(chunk);
        
        // Petit délai pour simuler la latence du réseau
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } catch (error) {
      console.error('Erreur lors du streaming de la réponse:', error);
      throw error;
    }
  }
}

// Fonction pour créer une instance de PerplexityAPI avec la clé API fournie
export function createPerplexityClient(apiKey: string): PerplexityAPI {
  return new PerplexityAPI(apiKey);
}