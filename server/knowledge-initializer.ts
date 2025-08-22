import { vectorService } from './vector-service';
import { db } from './db';
import { agents } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Initialise la base de connaissances vectorielle pour NOX
 * avec des procédures DevOps authentiques
 */
export class KnowledgeInitializer {
  
  async initializeNOXKnowledge(): Promise<void> {
    console.log('Initialisation de la base de connaissances NOX...');

    // Récupérer l'agent NOX
    const noxResults = await db.execute(`SELECT id FROM agents WHERE name = 'NOX' LIMIT 1`);
    if (noxResults.rows.length === 0) {
      console.log('Agent NOX non trouvé, création...');
      await this.createNOXAgent();
      return this.initializeNOXKnowledge();
    }

    const noxAgentId = (noxResults.rows[0] as any).id;

    // Vérifier si la base de connaissances existe déjà
    const existingKnowledge = await db.execute(
      `SELECT COUNT(*) as count FROM knowledge_documents WHERE agent_id = ${noxAgentId}`
    );
    
    if ((existingKnowledge.rows[0] as any).count > 0) {
      console.log('Base de connaissances NOX déjà initialisée');
      return;
    }

    // Initialiser les connaissances DevOps de base
    await this.addDockerKnowledge(noxAgentId);
    await this.addKubernetesKnowledge(noxAgentId);
    await this.addMonitoringKnowledge(noxAgentId);
    await this.addSecurityKnowledge(noxAgentId);
    await this.addIncidentResponse(noxAgentId);

    console.log('Base de connaissances NOX initialisée avec succès');
  }

  private async createNOXAgent(): Promise<void> {
    await db.execute(`
      INSERT INTO agents (name, title, description, system_prompt, tags, created_at, updated_at)
      VALUES (
        'NOX',
        'Spécialiste DevOps Senior',
        'Expert en infrastructure cloud, Kubernetes, Docker, monitoring et sécurité. Disponible 24/7 pour optimiser vos opérations.',
        'Tu es NOX de Jamono, spécialiste DevOps senior avec POUVOIRS D''ACTION AUTOMATIQUE. Tu maîtrises Kubernetes, Docker, AWS/GCP/Azure, monitoring, CI/CD, et sécurité. IMPORTANT: Tu peux exécuter des actions automatiques:\n\n• Créer des tickets Jira pour les incidents\n• Planifier des réunions post-mortem\n• Programmer des tâches de maintenance\n• Gérer les urgences avec des actions concrètes\n\nQuand tu détectes un problème, tu AGIS automatiquement au lieu de simplement donner des conseils. Tu es un expert qui prend des initiatives, pas un assistant qui demande la permission. Réponds toujours en tant que collègue DevOps expérimenté qui a déjà géré des milliers d''incidents similaires.',
        ARRAY['devops', 'kubernetes', 'docker', 'monitoring', 'security'],
        NOW(),
        NOW()
      )
    `);
  }

  private async addDockerKnowledge(agentId: number): Promise<void> {
    const dockerKnowledge = [
      {
        title: "Optimisation des images Docker",
        content: `
Pour optimiser les images Docker en production:

1. Utiliser des images de base Alpine ou Distroless
2. Multi-stage builds pour réduire la taille
3. .dockerignore pour exclure les fichiers inutiles
4. Minimiser les layers RUN

Exemple Dockerfile optimisé:
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
USER node
CMD ["node", "server.js"]

Cette approche réduit la taille d'image de ~60% et améliore la sécurité.
        `,
        documentType: "best_practice",
        tags: ["docker", "optimization", "security"]
      },
      {
        title: "Debugging containers en production",
        content: `
Pour déboguer un container en production sans le redémarrer:

1. Vérifier les logs:
   docker logs -f <container_id>

2. Accéder au container:
   docker exec -it <container_id> /bin/sh

3. Vérifier les métriques:
   docker stats <container_id>

4. Inspecter la configuration:
   docker inspect <container_id>

5. Pour les containers qui plantent:
   docker run --rm -it <image> /bin/sh

Toujours sauvegarder les logs avant intervention.
        `,
        documentType: "troubleshooting",
        tags: ["docker", "debugging", "production"]
      }
    ];

    for (const knowledge of dockerKnowledge) {
      await vectorService.addKnowledge({
        agentId,
        ...knowledge
      });
    }
  }

  private async addKubernetesKnowledge(agentId: number): Promise<void> {
    const k8sKnowledge = [
      {
        title: "Résolution problèmes pods CrashLoopBackOff",
        content: `
Quand un pod est en CrashLoopBackOff:

1. Vérifier les événements:
   kubectl describe pod <pod-name>

2. Examiner les logs:
   kubectl logs <pod-name> --previous

3. Causes communes:
   - Image incorrecte ou inexistante
   - Command/args mal configurés
   - Ressources insuffisantes
   - ConfigMap/Secret manquant
   - Healthcheck qui échoue

4. Solutions:
   - Corriger la configuration
   - Augmenter les ressources
   - Vérifier les dépendances
   - Ajuster les probes

5. Test rapide:
   kubectl run debug-pod --image=busybox -it --rm -- /bin/sh
        `,
        documentType: "troubleshooting",
        tags: ["kubernetes", "debugging", "crashloop"]
      },
      {
        title: "Scaling automatique avec HPA",
        content: `
Configuration HPA pour scaling intelligent:

apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: app-deployment
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80

Commandes utiles:
kubectl get hpa
kubectl describe hpa app-hpa
kubectl top pods
        `,
        documentType: "procedure",
        tags: ["kubernetes", "scaling", "hpa", "performance"]
      }
    ];

    for (const knowledge of k8sKnowledge) {
      await vectorService.addKnowledge({
        agentId,
        ...knowledge
      });
    }
  }

  private async addMonitoringKnowledge(agentId: number): Promise<void> {
    const monitoringKnowledge = [
      {
        title: "Alerting critique avec Prometheus",
        content: `
Règles d'alerting critiques pour production:

groups:
- name: critical-alerts
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "Taux d'erreur élevé détecté"

  - alert: HighMemoryUsage
    expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
    for: 2m
    labels:
      severity: critical

  - alert: PodCrashing
    expr: rate(kube_pod_container_status_restarts_total[15m]) > 0
    for: 5m
    labels:
      severity: warning

Configuration Alertmanager pour Slack:
route:
  receiver: 'slack-critical'
receivers:
- name: 'slack-critical'
  slack_configs:
  - api_url: 'YOUR_WEBHOOK_URL'
    channel: '#alerts'
        `,
        documentType: "procedure",
        tags: ["monitoring", "prometheus", "alerting", "slack"]
      }
    ];

    for (const knowledge of monitoringKnowledge) {
      await vectorService.addKnowledge({
        agentId,
        ...knowledge
      });
    }
  }

  private async addSecurityKnowledge(agentId: number): Promise<void> {
    const securityKnowledge = [
      {
        title: "Audit de sécurité Kubernetes",
        content: `
Checklist sécurité Kubernetes essentielle:

1. RBAC (Role-Based Access Control):
   - Principe du moindre privilège
   - Pas de cluster-admin par défaut
   - ServiceAccounts dédiés

2. Network Policies:
   - Isolation réseau entre namespaces
   - Règles ingress/egress strictes

3. Pod Security Standards:
   - runAsNonRoot: true
   - readOnlyRootFilesystem: true
   - allowPrivilegeEscalation: false

4. Secrets management:
   - Chiffrement au repos
   - Rotation automatique
   - Pas de secrets dans les images

5. Image scanning:
   - Scanner les vulnérabilités
   - Images signées uniquement
   - Registry privé sécurisé

Commandes d'audit:
kubectl auth can-i --list
kubectl get networkpolicies --all-namespaces
kubectl get pods --all-namespaces -o jsonpath='{.items[*].spec.securityContext}'
        `,
        documentType: "procedure",
        tags: ["security", "kubernetes", "audit", "rbac"]
      }
    ];

    for (const knowledge of securityKnowledge) {
      await vectorService.addKnowledge({
        agentId,
        ...knowledge
      });
    }
  }

  private async addIncidentResponse(agentId: number): Promise<void> {
    const incidentKnowledge = [
      {
        title: "Procédure incident production critique",
        content: `
PROCÉDURE D'URGENCE - INCIDENT PRODUCTION:

PHASE 1 - ÉVALUATION IMMÉDIATE (0-5 min):
1. Identifier la gravité (P0/P1/P2)
2. Créer un canal Slack #incident-YYYY-MM-DD
3. Notifier l'équipe de garde
4. Documenter l'impact utilisateur

PHASE 2 - CONTAINMENT (5-15 min):
1. Rollback automatique si possible:
   kubectl rollout undo deployment/app-name
2. Scaling d'urgence:
   kubectl scale deployment app-name --replicas=10
3. Traffic shaping si nécessaire
4. Communication status page

PHASE 3 - INVESTIGATION (15+ min):
1. Collecter les logs et métriques
2. Identifier la cause racine
3. Implémenter le fix permanent
4. Tests en staging avant déploiement

PHASE 4 - POST-MORTEM:
1. Chronologie détaillée
2. Actions correctives
3. Prévention future
4. Mise à jour des playbooks

CONTACTS D'URGENCE:
- Slack: #incidents-critiques
- Escalation: Lead DevOps
- Externe: Support cloud provider
        `,
        documentType: "procedure",
        tags: ["incident", "emergency", "production", "troubleshooting"]
      }
    ];

    for (const knowledge of incidentKnowledge) {
      await vectorService.addKnowledge({
        agentId,
        ...knowledge
      });
    }
  }
}

export const knowledgeInitializer = new KnowledgeInitializer();