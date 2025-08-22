/**
 * Module pour interagir avec les agents Python
 * Ce module gère la communication entre le serveur Node.js et les scripts Python
 */

import { spawn } from 'child_process';
import path from 'path';
import { Agent } from '../shared/schema';

interface AgentResponse {
  response: string;
  error?: string;
}

/**
 * Exécute le script Python de l'agent et traite un message
 * @param agent L'agent qui va traiter le message
 * @param message Le message à traiter
 * @returns La réponse de l'agent
 */
export async function processAgentMessage(agent: Agent, message: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Chemin vers le script Python
    const scriptPath = path.join(process.cwd(), 'agents', 'agent_server.py');
    
    // Configuration en JSON pour l'agent
    const agentConfig = {
      system_prompt: agent.systemPrompt,
      name: agent.name,
      skills: agent.skills,
      bio: agent.bio
    };
    
    // Arguments pour le script Python
    const args = [
      '--agent-type', 'devops', // Pour l'instant on suppose que c'est un agent DevOps
      '--agent-name', agent.name,
      '--config', JSON.stringify(agentConfig),
      '--message', message
    ];
    
    // Exécution du script Python
    const pythonProcess = spawn('python3', [scriptPath, ...args]);
    
    let responseData = '';
    let errorData = '';
    
    // Collecter les données de sortie
    pythonProcess.stdout.on('data', (data) => {
      responseData += data.toString();
    });
    
    // Collecter les erreurs
    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
      console.error(`Erreur Python: ${data}`);
    });
    
    // Gérer la fin de l'exécution
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Le script Python s'est terminé avec le code ${code}`);
        return reject(new Error(`Erreur lors de l'exécution du script Python: ${errorData}`));
      }
      
      try {
        // Analyser la réponse JSON
        const response: AgentResponse = JSON.parse(responseData);
        
        if (response.error) {
          return reject(new Error(response.error));
        }
        
        resolve(response.response);
      } catch (error) {
        console.error('Erreur lors de l\'analyse de la réponse JSON:', error);
        reject(new Error(`Réponse invalide du script Python: ${responseData}`));
      }
    });
    
    // Gérer les erreurs d'exécution
    pythonProcess.on('error', (err) => {
      console.error('Erreur lors du lancement du script Python:', err);
      reject(err);
    });
  });
}

/**
 * Vérifie que l'environnement Python est correctement configuré
 * @returns True si Python est disponible, false sinon
 */
export async function checkPythonEnvironment(): Promise<boolean> {
  return new Promise((resolve) => {
    const pythonProcess = spawn('python3', ['--version']);
    
    pythonProcess.on('close', (code) => {
      resolve(code === 0);
    });
    
    pythonProcess.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Initialise les bases de connaissances Python
 * @returns Promise qui se résout quand l'initialisation est terminée
 */
export async function initializePythonAgents(): Promise<void> {
  const pythonAvailable = await checkPythonEnvironment();
  
  if (!pythonAvailable) {
    console.warn('Python n\'est pas disponible. Les agents Python ne seront pas utilisés.');
    return;
  }
  
  console.log('Environnement Python détecté. Initialisation des agents Python...');
  // Ici on pourrait ajouter du code pour initialiser des ressources Python si nécessaire
}