/**
 * Service d'intégration Jira pour NOX
 * Permet de créer des tickets automatiquement lors d'anomalies détectées
 */

import JiraApi from 'node-jira-client';

interface JiraConfig {
  host: string;
  username: string;
  password: string; // API token
  apiVersion: string;
}

interface JiraIssue {
  project: string;
  summary: string;
  description: string;
  issueType: string;
  priority: string;
  assignee?: string;
  labels?: string[];
  components?: string[];
}

export class JiraIntegration {
  private jira: JiraApi | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initializeJira();
  }

  private initializeJira(): void {
    try {
      const config: JiraConfig = {
        host: process.env.JIRA_HOST || '',
        username: process.env.JIRA_USERNAME || '',
        password: process.env.JIRA_API_TOKEN || '',
        apiVersion: '2'
      };

      if (config.host && config.username && config.password) {
        this.jira = new JiraApi({
          protocol: 'https',
          host: config.host,
          username: config.username,
          password: config.password,
          apiVersion: config.apiVersion,
          strictSSL: true
        });
        this.isConfigured = true;
        console.log('✅ Jira integration configured');
      } else {
        console.log('⚠️ Jira integration not configured - missing environment variables');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Jira integration:', error);
    }
  }

  /**
   * Crée automatiquement un ticket Jira pour une anomalie détectée
   */
  async createIncidentTicket(
    anomalyDescription: string,
    severity: 'Critical' | 'High' | 'Medium' | 'Low',
    affectedSystem: string,
    reportedBy: string
  ): Promise<{ success: boolean; ticketKey?: string; error?: string }> {
    if (!this.isConfigured || !this.jira) {
      return {
        success: false,
        error: 'Jira integration not configured. Missing JIRA_HOST, JIRA_USERNAME, or JIRA_API_TOKEN'
      };
    }

    try {
      const issueData: any = {
        fields: {
          project: {
            key: process.env.JIRA_PROJECT_KEY || 'DEVOPS'
          },
          summary: `[NOX Auto] Anomalie détectée: ${affectedSystem}`,
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Anomalie détectée automatiquement par NOX (Agent DevOps Jamono)'
                  }
                ]
              },
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: `Système affecté: ${affectedSystem}`,
                    marks: [{ type: 'strong' }]
                  }
                ]
              },
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: `Sévérité: ${severity}`,
                    marks: [{ type: 'strong' }]
                  }
                ]
              },
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: `Signalé par: ${reportedBy}`,
                    marks: [{ type: 'strong' }]
                  }
                ]
              },
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Description de l\'anomalie:'
                  }
                ]
              },
              {
                type: 'codeBlock',
                attrs: { language: 'text' },
                content: [
                  {
                    type: 'text',
                    text: anomalyDescription
                  }
                ]
              },
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: `Créé automatiquement le ${new Date().toLocaleString('fr-FR')} par NOX Agent DevOps`
                  }
                ]
              }
            ]
          },
          issuetype: {
            name: severity === 'Critical' || severity === 'High' ? 'Bug' : 'Task'
          },
          priority: {
            name: severity
          },
          labels: ['nox-auto', 'devops', 'anomalie']
        }
      };

      const result = await this.jira.addNewIssue(issueData);
      
      return {
        success: true,
        ticketKey: result.key
      };
    } catch (error) {
      console.error('❌ Failed to create Jira ticket:', error);
      return {
        success: false,
        error: `Failed to create Jira ticket: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Crée un ticket pour une tâche de maintenance
   */
  async createMaintenanceTask(
    title: string,
    description: string,
    dueDate?: Date,
    assignee?: string
  ): Promise<{ success: boolean; ticketKey?: string; error?: string }> {
    if (!this.isConfigured || !this.jira) {
      return {
        success: false,
        error: 'Jira integration not configured'
      };
    }

    try {
      const issueData: any = {
        fields: {
          project: {
            key: process.env.JIRA_PROJECT_KEY || 'DEVOPS'
          },
          summary: `[NOX] ${title}`,
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Tâche de maintenance planifiée par NOX (Agent DevOps Jamono)'
                  }
                ]
              },
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: description
                  }
                ]
              },
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: `Créé le ${new Date().toLocaleString('fr-FR')} par NOX Agent DevOps`
                  }
                ]
              }
            ]
          },
          issuetype: {
            name: 'Task'
          },
          priority: {
            name: 'Medium'
          },
          labels: ['nox-auto', 'devops', 'maintenance']
        }
      };

      if (dueDate) {
        issueData.fields.duedate = dueDate.toISOString().split('T')[0];
      }

      if (assignee) {
        issueData.fields.assignee = { name: assignee };
      }

      const result = await this.jira.addNewIssue(issueData);
      
      return {
        success: true,
        ticketKey: result.key
      };
    } catch (error) {
      console.error('❌ Failed to create maintenance task:', error);
      return {
        success: false,
        error: `Failed to create maintenance task: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Recherche des tickets existants pour un système
   */
  async searchTicketsBySystem(system: string): Promise<any[]> {
    if (!this.isConfigured || !this.jira) {
      return [];
    }

    try {
      const jql = `project = "${process.env.JIRA_PROJECT_KEY || 'DEVOPS'}" AND summary ~ "${system}" AND status != "Done"`;
      const result = await this.jira.searchJira(jql, {
        maxResults: 10,
        fields: ['summary', 'status', 'priority', 'assignee', 'created']
      });
      
      return result.issues || [];
    } catch (error) {
      console.error('❌ Failed to search Jira tickets:', error);
      return [];
    }
  }

  /**
   * Vérifie la configuration Jira
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured || !this.jira) {
      return {
        success: false,
        error: 'Jira not configured'
      };
    }

    try {
      await this.jira.getCurrentUser();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Obtient les statistiques des tickets NOX
   */
  async getNOXTicketStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    if (!this.isConfigured || !this.jira) {
      return { total: 0, byStatus: {}, byPriority: {} };
    }

    try {
      const jql = `project = "${process.env.JIRA_PROJECT_KEY || 'DEVOPS'}" AND labels = "nox-auto"`;
      const result = await this.jira.searchJira(jql, {
        maxResults: 1000,
        fields: ['status', 'priority']
      });

      const stats = {
        total: result.total || 0,
        byStatus: {} as Record<string, number>,
        byPriority: {} as Record<string, number>
      };

      if (result.issues) {
        result.issues.forEach((issue: any) => {
          const status = issue.fields.status.name;
          const priority = issue.fields.priority.name;

          stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
          stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;
        });
      }

      return stats;
    } catch (error) {
      console.error('❌ Failed to get NOX ticket stats:', error);
      return { total: 0, byStatus: {}, byPriority: {} };
    }
  }
}

export const jiraIntegration = new JiraIntegration();