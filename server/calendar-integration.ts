/**
 * Service de calendrier et planification pour NOX
 * Permet de créer des événements, planifier des réunions et gérer les tâches
 */

import ical from 'ical-generator';
import * as cron from 'node-cron';

interface MeetingRequest {
  title: string;
  description?: string;
  duration: number; // in minutes
  attendees: string[];
  preferredTime?: Date;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  type: 'post-mortem' | 'planning' | 'review' | 'incident' | 'maintenance';
}

interface ScheduledTask {
  id: string;
  title: string;
  description: string;
  scheduledTime: Date;
  type: 'maintenance' | 'monitoring' | 'backup' | 'deployment';
  system: string;
  cronExpression?: string;
  isRecurring: boolean;
}

export class CalendarIntegration {
  private scheduledTasks: Map<string, ScheduledTask> = new Map();
  private cronJobs: Map<string, any> = new Map();

  constructor() {
    console.log('📅 Calendar and scheduling service initialized');
  }

  /**
   * Planifie automatiquement une réunion post-incident
   */
  async schedulePostIncidentMeeting(
    incidentDescription: string,
    affectedSystem: string,
    reportedBy: string,
    severity: 'Critical' | 'High' | 'Medium' | 'Low'
  ): Promise<{ success: boolean; meetingDetails?: any; error?: string }> {
    try {
      // Déterminer l'urgence basée sur la sévérité
      const urgencyMap = {
        'Critical': 'critical' as const,
        'High': 'high' as const,
        'Medium': 'medium' as const,
        'Low': 'low' as const
      };

      const urgency = urgencyMap[severity];
      
      // Calculer l'heure de réunion (immédiatement pour critique, dans 2h pour high, etc.)
      const delayMinutes = {
        'critical': 15,
        'high': 120,
        'medium': 480, // 8h
        'low': 1440 // 24h
      };

      const meetingTime = new Date();
      meetingTime.setMinutes(meetingTime.getMinutes() + delayMinutes[urgency]);

      const meetingRequest: MeetingRequest = {
        title: `Post-mortem: ${affectedSystem} - ${severity}`,
        description: `Réunion post-incident pour analyser l'anomalie détectée sur ${affectedSystem}.
        
Incident signalé par: ${reportedBy}
Sévérité: ${severity}
Système affecté: ${affectedSystem}

Description:
${incidentDescription}

Objectifs:
- Analyser la cause racine
- Documenter les actions correctives
- Mettre en place des mesures préventives
- Améliorer le monitoring si nécessaire

Organisé automatiquement par NOX Agent DevOps`,
        duration: severity === 'Critical' ? 60 : severity === 'High' ? 45 : 30,
        attendees: this.getIncidentTeam(severity),
        preferredTime: meetingTime,
        urgency,
        type: 'post-mortem'
      };

      const icalEvent = this.createICalEvent(meetingRequest);
      
      return {
        success: true,
        meetingDetails: {
          title: meetingRequest.title,
          time: meetingTime.toLocaleString('fr-FR'),
          duration: meetingRequest.duration,
          attendees: meetingRequest.attendees,
          icalData: icalEvent.toString(),
          urgency: severity
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to schedule meeting: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Planifie une tâche de maintenance récurrente
   */
  async scheduleMaintenanceTask(
    title: string,
    description: string,
    system: string,
    cronExpression: string,
    type: 'maintenance' | 'monitoring' | 'backup' | 'deployment' = 'maintenance'
  ): Promise<{ success: boolean; taskId?: string; error?: string }> {
    try {
      const taskId = `${type}-${system}-${Date.now()}`;
      const nextExecution = this.getNextExecutionTime(cronExpression);

      const task: ScheduledTask = {
        id: taskId,
        title,
        description,
        scheduledTime: nextExecution,
        type,
        system,
        cronExpression,
        isRecurring: true
      };

      this.scheduledTasks.set(taskId, task);

      // Créer le job cron
      const cronJob = cron.schedule(cronExpression, () => {
        this.executeScheduledTask(taskId);
      });

      this.cronJobs.set(taskId, cronJob);

      console.log(`📅 Tâche planifiée: ${title} pour ${system} (${cronExpression})`);

      return {
        success: true,
        taskId
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to schedule task: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Planifie une réunion de planification sprint/release
   */
  async schedulePlanningMeeting(
    type: 'sprint' | 'release' | 'architecture',
    duration: number = 60,
    participants: string[] = []
  ): Promise<{ success: boolean; meetingDetails?: any; error?: string }> {
    try {
      const meetingTime = this.findNextAvailableSlot();
      
      const meetingRequest: MeetingRequest = {
        title: `Planification ${type} - NOX Auto`,
        description: `Réunion de planification ${type} organisée automatiquement par NOX.
        
Objectifs:
${type === 'sprint' ? '- Planifier les tâches du prochain sprint\n- Prioriser les issues DevOps\n- Estimer les charges' : 
  type === 'release' ? '- Préparer la prochaine release\n- Valider les déploiements\n- Coordonner les équipes' :
  '- Revoir l\'architecture\n- Discuter des améliorations\n- Planifier les migrations'}

Durée: ${duration} minutes
Organisé par: NOX Agent DevOps`,
        duration,
        attendees: participants.length > 0 ? participants : this.getDefaultTeam(),
        preferredTime: meetingTime,
        urgency: 'medium',
        type: 'planning'
      };

      const icalEvent = this.createICalEvent(meetingRequest);

      return {
        success: true,
        meetingDetails: {
          title: meetingRequest.title,
          time: meetingTime.toLocaleString('fr-FR'),
          duration: meetingRequest.duration,
          attendees: meetingRequest.attendees,
          icalData: icalEvent.toString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to schedule planning meeting: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Obtient le planning des tâches à venir
   */
  getUpcomingTasks(days: number = 7): ScheduledTask[] {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    return Array.from(this.scheduledTasks.values())
      .filter(task => task.scheduledTime >= now && task.scheduledTime <= futureDate)
      .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
  }

  /**
   * Annule une tâche planifiée
   */
  cancelScheduledTask(taskId: string): boolean {
    const cronJob = this.cronJobs.get(taskId);
    if (cronJob) {
      cronJob.destroy();
      this.cronJobs.delete(taskId);
    }
    
    return this.scheduledTasks.delete(taskId);
  }

  /**
   * Crée un événement iCal
   */
  private createICalEvent(meeting: MeetingRequest): any {
    const calendar = ical({ name: 'NOX DevOps Calendar' });
    
    const endTime = new Date(meeting.preferredTime!);
    endTime.setMinutes(endTime.getMinutes() + meeting.duration);

    calendar.createEvent({
      start: meeting.preferredTime!,
      end: endTime,
      summary: meeting.title,
      description: meeting.description,
      organizer: 'NOX Agent DevOps <nox@jamono.ai>',
      attendees: meeting.attendees.map(email => ({ email }))
    });

    return calendar;
  }

  /**
   * Détermine l'équipe pour un incident selon la sévérité
   */
  private getIncidentTeam(severity: string): string[] {
    const baseTeam = ['devops@company.com', 'lead-dev@company.com'];
    
    if (severity === 'Critical') {
      return [...baseTeam, 'cto@company.com', 'sre@company.com'];
    } else if (severity === 'High') {
      return [...baseTeam, 'sre@company.com'];
    }
    
    return baseTeam;
  }

  /**
   * Équipe par défaut pour les réunions
   */
  private getDefaultTeam(): string[] {
    return ['devops@company.com', 'lead-dev@company.com', 'product-owner@company.com'];
  }

  /**
   * Trouve le prochain créneau disponible
   */
  private findNextAvailableSlot(): Date {
    const now = new Date();
    const nextSlot = new Date();
    
    // Si c'est en dehors des heures de bureau, programmer pour le lendemain 9h
    if (now.getHours() < 9 || now.getHours() > 17) {
      nextSlot.setDate(now.getDate() + 1);
      nextSlot.setHours(9, 0, 0, 0);
    } else {
      // Sinon, dans 2 heures
      nextSlot.setHours(now.getHours() + 2, 0, 0, 0);
    }
    
    return nextSlot;
  }

  /**
   * Calcule la prochaine exécution d'une expression cron
   */
  private getNextExecutionTime(cronExpression: string): Date {
    // Simplification: pour une vraie implementation, utiliser une librairie comme 'cron-parser'
    const now = new Date();
    const next = new Date();
    next.setHours(now.getHours() + 1, 0, 0, 0); // Par défaut, dans 1 heure
    return next;
  }

  /**
   * Exécute une tâche planifiée
   */
  private async executeScheduledTask(taskId: string): Promise<void> {
    const task = this.scheduledTasks.get(taskId);
    if (!task) return;

    console.log(`🔄 Exécution tâche planifiée: ${task.title} pour ${task.system}`);
    
    // Ici on pourrait déclencher des actions spécifiques selon le type de tâche
    // Par exemple: backup, déploiement, vérification de santé, etc.
    
    // Mettre à jour la prochaine exécution si récurrente
    if (task.isRecurring && task.cronExpression) {
      task.scheduledTime = this.getNextExecutionTime(task.cronExpression);
    }
  }
}

export const calendarIntegration = new CalendarIntegration();