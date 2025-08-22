import { exec } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';

const execAsync = promisify(exec);

export interface ServerConfig {
  id: string;
  name: string;
  type: 'ssh' | 'kubernetes' | 'docker';
  host: string;
  port?: number;
  username?: string;
  keyPath?: string;
  namespace?: string; // pour Kubernetes
  context?: string; // pour Kubernetes
}

export interface ValidationRule {
  level: 'info' | 'warning' | 'critical';
  action: string;
  requiresConfirmation: boolean;
  allowedUsers?: string[];
  timeRestrictions?: string[];
}

export interface InfrastructureAction {
  id: string;
  type: 'read' | 'execute' | 'deploy' | 'scale' | 'restart';
  command: string;
  server: string;
  validation: ValidationRule;
  executedBy?: string;
  timestamp?: Date;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled';
  result?: string;
  confirmationToken?: string;
}

class InfrastructureIntegration {
  private servers: Map<string, ServerConfig> = new Map();
  private pendingActions: Map<string, InfrastructureAction> = new Map();
  private validationRules: ValidationRule[] = [
    {
      level: 'critical',
      action: 'delete|drop|remove|destroy',
      requiresConfirmation: true,
      timeRestrictions: ['business_hours']
    },
    {
      level: 'warning',
      action: 'restart|scale|deploy',
      requiresConfirmation: true
    },
    {
      level: 'info',
      action: 'logs|status|get|describe',
      requiresConfirmation: false
    }
  ];

  // Configuration des serveurs
  registerServer(config: ServerConfig): void {
    this.servers.set(config.id, config);
    console.log(`📡 Serveur enregistré: ${config.name} (${config.type})`);
  }

  getServers(): ServerConfig[] {
    return Array.from(this.servers.values());
  }

  // Lecture des logs et informations
  async readLogs(serverId: string, service?: string, lines: number = 100): Promise<string> {
    const server = this.servers.get(serverId);
    if (!server) throw new Error(`Serveur ${serverId} non trouvé`);

    let command: string;
    
    switch (server.type) {
      case 'kubernetes':
        if (service) {
          command = `kubectl logs -n ${server.namespace || 'default'} ${service} --tail=${lines}`;
        } else {
          command = `kubectl get pods -n ${server.namespace || 'default'}`;
        }
        break;
      
      case 'docker':
        if (service) {
          command = `docker logs ${service} --tail ${lines}`;
        } else {
          command = `docker ps`;
        }
        break;
      
      case 'ssh':
        if (service) {
          command = `ssh ${server.username}@${server.host} "journalctl -u ${service} -n ${lines}"`;
        } else {
          command = `ssh ${server.username}@${server.host} "systemctl status"`;
        }
        break;
      
      default:
        throw new Error(`Type de serveur ${server.type} non supporté`);
    }

    try {
      const { stdout, stderr } = await execAsync(command);
      if (stderr) console.warn(`⚠️ Warnings: ${stderr}`);
      return stdout;
    } catch (error) {
      throw new Error(`Erreur lecture logs: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  // Analyse intelligente pour déterminer les informations manquantes
  analyzeRequirements(userMessage: string, availableServers: ServerConfig[]): {
    missingInfo: string[];
    suggestedQuestions: string[];
    canProceed: boolean;
  } {
    const missingInfo: string[] = [];
    const suggestedQuestions: string[] = [];

    // Détection du serveur/cluster cible
    const serverMentioned = availableServers.some(server => 
      userMessage.toLowerCase().includes(server.name.toLowerCase())
    );
    
    if (!serverMentioned && availableServers.length > 1) {
      missingInfo.push('server_target');
      suggestedQuestions.push(`Sur quel serveur veux-tu que j'intervienne ? (${availableServers.map(s => s.name).join(', ')})`);
    }

    // Détection du service/application
    const serviceKeywords = ['logs', 'restart', 'status'];
    const hasServiceAction = serviceKeywords.some(keyword => 
      userMessage.toLowerCase().includes(keyword)
    );
    
    if (hasServiceAction && !this.extractServiceName(userMessage)) {
      missingInfo.push('service_name');
      suggestedQuestions.push('Quel service ou pod veux-tu que je vérifie ?');
    }

    // Détection de l'urgence/scope
    const criticalKeywords = ['urgent', 'production', 'down', 'crítico'];
    const isCritical = criticalKeywords.some(keyword => 
      userMessage.toLowerCase().includes(keyword)
    );
    
    if (isCritical && !userMessage.includes('confirme')) {
      missingInfo.push('confirmation');
      suggestedQuestions.push('Cette action semble critique. Peux-tu confirmer que tu veux que je procède ?');
    }

    return {
      missingInfo,
      suggestedQuestions,
      canProceed: missingInfo.length === 0
    };
  }

  // Validation avant exécution
  async validateAction(action: InfrastructureAction): Promise<{
    allowed: boolean;
    level: 'info' | 'warning' | 'critical';
    message: string;
    requiresConfirmation: boolean;
  }> {
    // Trouve la règle de validation appropriée
    const rule = this.validationRules.find(rule => 
      new RegExp(rule.action, 'i').test(action.command)
    ) || this.validationRules[this.validationRules.length - 1]; // fallback to info level

    const validation = {
      allowed: true,
      level: rule.level,
      message: '',
      requiresConfirmation: rule.requiresConfirmation
    };

    // Vérifications de sécurité
    if (rule.level === 'critical') {
      validation.message = `⚠️ ATTENTION: Action critique détectée (${action.command}). Confirmation requise.`;
    } else if (rule.level === 'warning') {
      validation.message = `⚡ Action importante détectée. Vérification recommandée.`;
    } else {
      validation.message = `✅ Action de lecture/consultation. Sécurisée.`;
    }

    // Vérification des restrictions horaires
    if (rule.timeRestrictions?.includes('business_hours')) {
      const now = new Date();
      const hour = now.getHours();
      if (hour < 9 || hour > 17) {
        validation.allowed = false;
        validation.message += ' Action critique en dehors des heures ouvrables (9h-17h).';
      }
    }

    return validation;
  }

  // Création d'une action avec token de confirmation
  async createAction(
    type: InfrastructureAction['type'],
    command: string,
    serverId: string,
    executedBy: string
  ): Promise<InfrastructureAction> {
    const server = this.servers.get(serverId);
    if (!server) throw new Error(`Serveur ${serverId} non trouvé`);

    const action: InfrastructureAction = {
      id: crypto.randomUUID(),
      type,
      command,
      server: serverId,
      validation: { level: 'info', action: command, requiresConfirmation: false },
      executedBy,
      timestamp: new Date(),
      status: 'pending'
    };

    // Validation automatique
    const validation = await this.validateAction(action);
    action.validation = {
      level: validation.level,
      action: command,
      requiresConfirmation: validation.requiresConfirmation
    };

    if (validation.requiresConfirmation) {
      action.confirmationToken = crypto.randomBytes(16).toString('hex');
    }

    this.pendingActions.set(action.id, action);
    return action;
  }

  // Exécution d'une action (avec confirmation si nécessaire)
  async executeAction(actionId: string, confirmationToken?: string): Promise<string> {
    const action = this.pendingActions.get(actionId);
    if (!action) throw new Error('Action non trouvée');

    // Vérification token de confirmation
    if (action.validation.requiresConfirmation && action.confirmationToken !== confirmationToken) {
      throw new Error('Token de confirmation requis ou invalide');
    }

    const server = this.servers.get(action.server);
    if (!server) throw new Error('Serveur non trouvé');

    action.status = 'executing';

    try {
      let fullCommand: string;

      switch (server.type) {
        case 'kubernetes':
          fullCommand = `kubectl ${action.command}`;
          if (server.namespace && !action.command.includes('-n')) {
            fullCommand += ` -n ${server.namespace}`;
          }
          break;
        
        case 'docker':
          fullCommand = `docker ${action.command}`;
          break;
        
        case 'ssh':
          fullCommand = `ssh ${server.username}@${server.host} "${action.command}"`;
          break;
        
        default:
          throw new Error(`Type de serveur ${server.type} non supporté`);
      }

      console.log(`🚀 Exécution: ${fullCommand}`);
      const { stdout, stderr } = await execAsync(fullCommand);
      
      action.status = 'completed';
      action.result = stdout;
      
      if (stderr) {
        console.warn(`⚠️ Warnings lors de l'exécution: ${stderr}`);
        action.result += `\nWarnings: ${stderr}`;
      }

      return action.result;
    } catch (error) {
      action.status = 'failed';
      action.result = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Échec de l'exécution: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  // Extraction du nom de service à partir du message
  private extractServiceName(message: string): string | null {
    // Patterns courants pour identifier un service
    const patterns = [
      /logs?\s+(\w+[-\w]*)/i,
      /service\s+(\w+[-\w]*)/i,
      /pod\s+(\w+[-\w]*)/i,
      /container\s+(\w+[-\w]*)/i,
      /restart\s+(\w+[-\w]*)/i,
      /status\s+(\w+[-\w]*)/i
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) return match[1];
    }

    return null;
  }

  // Actions courantes pré-configurées
  async quickDiagnostic(serverId: string): Promise<string> {
    const server = this.servers.get(serverId);
    if (!server) throw new Error(`Serveur ${serverId} non trouvé`);

    let diagnostics: string[] = [];

    try {
      switch (server.type) {
        case 'kubernetes':
          const podStatus = await this.readLogs(serverId);
          const nodeStatus = await execAsync(`kubectl get nodes`);
          diagnostics.push(`Pods: ${podStatus}`);
          diagnostics.push(`Nodes: ${nodeStatus.stdout}`);
          break;
        
        case 'docker':
          const containers = await execAsync(`docker ps -a`);
          const images = await execAsync(`docker images`);
          diagnostics.push(`Containers: ${containers.stdout}`);
          diagnostics.push(`Images: ${images.stdout}`);
          break;
        
        case 'ssh':
          const systemStatus = await execAsync(`ssh ${server.username}@${server.host} "systemctl list-failed"`);
          const diskSpace = await execAsync(`ssh ${server.username}@${server.host} "df -h"`);
          diagnostics.push(`Services Failed: ${systemStatus.stdout}`);
          diagnostics.push(`Disk Space: ${diskSpace.stdout}`);
          break;
      }
    } catch (error) {
      diagnostics.push(`Erreur diagnostic: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }

    return diagnostics.join('\n\n');
  }

  getPendingActions(): InfrastructureAction[] {
    return Array.from(this.pendingActions.values());
  }

  cancelAction(actionId: string): boolean {
    const action = this.pendingActions.get(actionId);
    if (action && action.status === 'pending') {
      action.status = 'cancelled';
      return true;
    }
    return false;
  }
}

export const infrastructureIntegration = new InfrastructureIntegration();