import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Bot, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Activity,
  MessageSquare,
  Terminal,
  FileText,
  Zap,
  Users,
  PlayCircle,
  PauseCircle
} from "lucide-react";

interface DemoScenario {
  id: string;
  title: string;
  description: string;
  userQuery: string;
  expectedActions: string[];
  agentResponse: string;
  executionSteps: Array<{
    step: string;
    status: 'pending' | 'running' | 'completed' | 'error';
    duration: number;
    result?: string;
  }>;
  metrics: {
    responseTime: number;
    accuracy: number;
    actionsTaken: number;
  };
}

const demoScenarios: DemoScenario[] = [
  {
    id: "incident-diagnosis",
    title: "Diagnostic d'incident en production",
    description: "NOX diagnostique automatiquement un problème de performance sur les serveurs web",
    userQuery: "@NOX le serveur web de production répond très lentement depuis 30 minutes, peux-tu diagnostiquer le problème ?",
    expectedActions: [
      "Analyse des métriques serveur en temps réel",
      "Vérification des logs d'erreur récents", 
      "Contrôle de l'utilisation CPU/RAM/Disque",
      "Inspection des connexions réseau",
      "Identification des processus consommateurs"
    ],
    agentResponse: `🔍 **Diagnostic en cours...**

**Problème identifié :** Saturation mémoire sur web-server-02

**Analyse détaillée :**
• **CPU:** 45% (normal)
• **RAM:** 94% utilisée (critique)
• **Disque:** 67% (acceptable)
• **Connexions:** 1,247 actives (élevé)

**Cause racine :** Processus Java (PID 15432) consomme 6.2GB RAM depuis 11:30
**Hypothèse :** Fuite mémoire dans l'application Spring Boot

**Actions immédiates recommandées :**
1. Redémarrer le service Spring Boot sur web-server-02
2. Activer le profil de mémoire JVM pour monitoring
3. Revoir les paramètres heap (-Xmx/-Xms)

**Commandes d'urgence :**
\`\`\`bash
sudo systemctl restart spring-app
sudo systemctl status spring-app
\`\`\`

Voulez-vous que j'exécute ces actions automatiquement ?`,
    executionSteps: [
      { step: "Connexion aux serveurs de monitoring", status: 'completed', duration: 2, result: "3 serveurs web détectés" },
      { step: "Analyse des métriques Prometheus", status: 'completed', duration: 5, result: "Pic RAM détecté sur web-server-02" },
      { step: "Inspection des logs applicatifs", status: 'completed', duration: 8, result: "OutOfMemoryError dans spring.log" },
      { step: "Identification du processus fautif", status: 'completed', duration: 3, result: "PID 15432 - Spring Boot App" },
      { step: "Génération du rapport de diagnostic", status: 'completed', duration: 2, result: "Rapport complet généré" }
    ],
    metrics: {
      responseTime: 1850,
      accuracy: 98,
      actionsTaken: 5
    }
  },
  {
    id: "infrastructure-planning",
    title: "Planification migration Kubernetes",
    description: "NOX aide à planifier une migration complexe vers Kubernetes",
    userQuery: "@NOX nous devons migrer notre stack Node.js + PostgreSQL vers Kubernetes. Peux-tu nous aider à planifier cette migration ?",
    expectedActions: [
      "Analyse de l'infrastructure actuelle",
      "Évaluation des ressources nécessaires",
      "Création du plan de migration étape par étape",
      "Génération des fichiers de configuration K8s",
      "Planification des tests et rollback"
    ],
    agentResponse: `🚀 **Plan de migration Kubernetes**

**Architecture actuelle analysée :**
• 3 serveurs Node.js (16GB RAM chacun)
• 1 serveur PostgreSQL (32GB RAM, SSD 500GB)
• Load balancer NGINX
• Volume de trafic : ~10k req/min

**Plan de migration en 4 phases :**

**Phase 1 - Préparation (Semaine 1)**
✓ Dockerisation des applications Node.js
✓ Setup cluster Kubernetes (3 nodes minimum)
✓ Configuration des namespaces (prod, staging, dev)

**Phase 2 - Base de données (Semaine 2)**
✓ Déploiement PostgreSQL avec persistance
✓ Migration des données avec pg_dump/restore
✓ Tests de performance et réplication

**Phase 3 - Applications (Semaine 3)**
✓ Déploiement des microservices Node.js
✓ Configuration Ingress Controller
✓ Tests de charge progressifs

**Phase 4 - Production (Semaine 4)**
✓ Basculement DNS progressif (10%, 50%, 100%)
✓ Monitoring avancé avec Prometheus/Grafana
✓ Validation finale et décommissioning anciens serveurs

**Fichiers K8s générés :**
- deployment.yaml (3 fichiers)
- service.yaml (4 fichiers)  
- configmap.yaml (2 fichiers)
- postgresql-statefulset.yaml

Voulez-vous que je génère ces fichiers maintenant ?`,
    executionSteps: [
      { step: "Analyse de l'infrastructure existante", status: 'completed', duration: 12, result: "3 services Node.js + 1 PostgreSQL identifiés" },
      { step: "Calcul des ressources Kubernetes", status: 'completed', duration: 8, result: "6 vCPU, 24GB RAM recommandés" },
      { step: "Génération du plan de migration", status: 'completed', duration: 15, result: "Plan en 4 phases créé" },
      { step: "Création des manifests Kubernetes", status: 'completed', duration: 10, result: "9 fichiers YAML générés" },
      { step: "Validation de la stratégie de rollback", status: 'completed', duration: 5, result: "Procédures de sécurité validées" }
    ],
    metrics: {
      responseTime: 3200,
      accuracy: 95,
      actionsTaken: 8
    }
  },
  {
    id: "security-audit",
    title: "Audit de sécurité automatisé",
    description: "NOX effectue un audit de sécurité complet de l'infrastructure",
    userQuery: "@NOX peux-tu faire un audit de sécurité de notre infrastructure et identifier les vulnérabilités potentielles ?",
    expectedActions: [
      "Scan des ports et services exposés",
      "Vérification des certificats SSL/TLS",
      "Analyse des configurations serveur",
      "Contrôle des accès et permissions",
      "Génération du rapport de sécurité"
    ],
    agentResponse: `🔒 **Audit de sécurité terminé**

**Résumé exécutif :**
• **Score de sécurité :** 7.8/10 (Bon)
• **Vulnérabilités critiques :** 2
• **Vulnérabilités moyennes :** 5
• **Recommandations :** 12

**⚠️ CRITIQUES - Action immédiate requise :**

1. **PostgreSQL 12.3** → Mettre à jour vers 12.17
   - CVE-2023-2454 : Privilege escalation possible
   - Impact : Accès admin base de données
   - Fix : \`apt upgrade postgresql-12\`

2. **Certificat SSL expiré** sur api.votre-domaine.com
   - Expiration : Il y a 3 jours
   - Impact : Trafic HTTPS bloqué
   - Fix : Renouvellement Let's Encrypt

**🔶 MOYENNES - À traiter sous 30 jours :**

• SSH root login activé sur 2 serveurs
• Ports 22, 3306 exposés publiquement
• Logs d'audit désactivés sur web-server-01
• Firewall rules trop permissives
• Mots de passe par défaut sur service Redis

**✅ BONNES PRATIQUES détectées :**
• Encryption des données en transit
• Backups automatiques configurés
• Monitoring actif des intrusions
• Séparation des environnements dev/prod

**Script de correction automatique généré :**
\`\`\`bash
#!/bin/bash
# Correction des vulnérabilités critiques
sudo apt update && sudo apt upgrade postgresql-12
sudo certbot renew --force-renewal
sudo ufw deny 3306
sudo systemctl enable auditd
\`\`\`

Voulez-vous que j'applique ces corrections maintenant ?`,
    executionSteps: [
      { step: "Scan des ports réseau", status: 'completed', duration: 25, result: "15 services détectés, 3 exposés" },
      { step: "Vérification des certificats SSL", status: 'completed', duration: 8, result: "1 certificat expiré trouvé" },
      { step: "Analyse des versions logicielles", status: 'completed', duration: 18, result: "PostgreSQL 12.3 - vulnérable" },
      { step: "Contrôle des configurations sécurité", status: 'completed', duration: 22, result: "5 problèmes de configuration" },
      { step: "Génération du rapport détaillé", status: 'completed', duration: 12, result: "Rapport de 15 pages créé" }
    ],
    metrics: {
      responseTime: 4100,
      accuracy: 97,
      actionsTaken: 12
    }
  }
];

export default function DemoPresentation() {
  const [selectedScenario, setSelectedScenario] = useState<string>(demoScenarios[0].id);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [executionProgress, setExecutionProgress] = useState(0);

  const currentDemo = demoScenarios.find(s => s.id === selectedScenario) || demoScenarios[0];

  const runDemoExecution = async () => {
    setIsExecuting(true);
    setCurrentStep(0);
    setExecutionProgress(0);

    for (let i = 0; i < currentDemo.executionSteps.length; i++) {
      setCurrentStep(i);
      
      // Simulate execution time
      const stepDuration = currentDemo.executionSteps[i].duration * 100;
      
      // Progress animation
      for (let progress = 0; progress <= 100; progress += 2) {
        setExecutionProgress(progress);
        await new Promise(resolve => setTimeout(resolve, stepDuration / 50));
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsExecuting(false);
    setExecutionProgress(100);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Démonstration NOX - Agent DevOps IA
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Découvrez comment NOX transforme les opérations IT en automatisant 
          le diagnostic, la planification et la résolution de problèmes complexes.
        </p>
      </div>

      {/* Agent Profile */}
      <Card className="mb-8 bg-gradient-to-r from-blue-50 to-green-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src="https://randomuser.me/api/portraits/men/32.jpg" alt="NOX" />
              <AvatarFallback>NOX</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-bold">NOX</h2>
                <Badge className="bg-green-100 text-green-800">Actif 24/7</Badge>
              </div>
              <p className="text-lg text-gray-700">DevOps Senior • 8+ ans d'expérience • Spécialiste Infrastructure</p>
              <div className="flex items-center mt-2 space-x-6 text-sm text-gray-600">
                <span className="flex items-center"><Activity className="w-4 h-4 mr-1" /> 247 interventions ce mois</span>
                <span className="flex items-center"><Clock className="w-4 h-4 mr-1" /> Temps de réponse : 1.2s</span>
                <span className="flex items-center"><TrendingUp className="w-4 h-4 mr-1" /> 98.7% de succès</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <PlayCircle className="mr-2 h-5 w-5" />
            Scénarios de démonstration
          </CardTitle>
          <CardDescription>
            Choisissez un scénario pour voir NOX en action
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {demoScenarios.map((scenario) => (
              <Card 
                key={scenario.id}
                className={`cursor-pointer transition-all ${
                  selectedScenario === scenario.id 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedScenario(scenario.id)}
              >
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">{scenario.title}</h3>
                  <p className="text-sm text-gray-600">{scenario.description}</p>
                  <div className="flex justify-between mt-3 text-xs text-gray-500">
                    <span>{scenario.metrics.actionsTaken} actions</span>
                    <span>{scenario.metrics.responseTime}ms</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button 
              onClick={runDemoExecution}
              disabled={isExecuting}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isExecuting ? (
                <>
                  <PauseCircle className="mr-2 h-5 w-5" />
                  Exécution en cours...
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Lancer la démonstration
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Demo Execution */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* User Query & Response */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" />
              Interaction Slack
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* User Message */}
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Avatar className="w-6 h-6 mr-2">
                  <AvatarFallback className="text-xs">U</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">Utilisateur</span>
                <span className="text-xs text-gray-500 ml-auto">Maintenant</span>
              </div>
              <p className="text-sm">{currentDemo.userQuery}</p>
            </div>

            {/* Agent Response */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Avatar className="w-6 h-6 mr-2">
                  <AvatarImage src="https://randomuser.me/api/portraits/men/32.jpg" alt="NOX" />
                  <AvatarFallback>NOX</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-blue-700">NOX</span>
                <Badge className="ml-2 text-xs bg-green-100 text-green-700">Bot</Badge>
                <span className="text-xs text-gray-500 ml-auto">
                  {isExecuting ? 'En cours...' : `Répondu en ${currentDemo.metrics.responseTime}ms`}
                </span>
              </div>
              {!isExecuting ? (
                <div className="text-sm whitespace-pre-line">{currentDemo.agentResponse}</div>
              ) : (
                <div className="text-sm text-gray-600">
                  NOX analyse votre demande et exécute les actions nécessaires...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Execution Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Terminal className="mr-2 h-5 w-5" />
              Exécution en temps réel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentDemo.executionSteps.map((step, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    isExecuting && index === currentStep ? 'bg-blue-500 text-white animate-pulse' :
                    (!isExecuting || index < currentStep) ? 'bg-green-500 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {(!isExecuting || index < currentStep) ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{step.step}</p>
                    {(!isExecuting || index < currentStep) && step.result && (
                      <p className="text-xs text-green-600">{step.result}</p>
                    )}
                    {isExecuting && index === currentStep && (
                      <div className="mt-1">
                        <Progress value={executionProgress} className="h-1" />
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {step.duration}s
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            Métriques de performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{currentDemo.metrics.responseTime}ms</div>
              <p className="text-sm text-gray-600">Temps de réponse</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{currentDemo.metrics.accuracy}%</div>
              <p className="text-sm text-gray-600">Précision</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{currentDemo.metrics.actionsTaken}</div>
              <p className="text-sm text-gray-600">Actions exécutées</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">24/7</div>
              <p className="text-sm text-gray-600">Disponibilité</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Value Proposition */}
      <Alert>
        <Zap className="h-4 w-4" />
        <AlertDescription>
          <strong>Impact business :</strong> NOX réduit le temps de résolution des incidents de 75%, 
          automatise 60% des tâches DevOps répétitives et améliore la disponibilité système de 99.2% à 99.8%.
        </AlertDescription>
      </Alert>
    </div>
  );
}