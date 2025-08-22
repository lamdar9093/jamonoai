import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Activity, 
  Bot, 
  Clock, 
  Server, 
  TrendingUp, 
  Users, 
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
  BarChart3,
  MessageSquare,
  Terminal,
  Database,
  Cloud,
  Plus,
  Trash2,
  Settings,
  Shield,
  RefreshCw
} from "lucide-react";

interface WorkspaceMetrics {
  deployment: {
    id: number;
    workspaceId: number;
    agentId: number;
    status: string;
    slackChannels: string[];
    deployedAt: string;
    lastActiveAt: string;
  };
  metrics: Array<{
    id: number;
    metricType: string;
    value: number;
    timestamp: string;
  }>;
}

interface OrchestrationStats {
  totalWorkspaces: number;
  activeDeployments: number;
  totalInteractions: number;
  avgResponseTime: number;
  successRate: number;
  pendingTasks: number;
}

export default function OrchestratorDashboard() {
  const [selectedWorkspace, setSelectedWorkspace] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock orchestration stats for demonstration
  const orchestrationStats: OrchestrationStats = {
    totalWorkspaces: 3,
    activeDeployments: 5,
    totalInteractions: 247,
    avgResponseTime: 1250,
    successRate: 98.7,
    pendingTasks: 2
  };

  // Query workspace metrics
  const { data: workspaceMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/orchestrator/workspaces/1/metrics'],
    enabled: selectedWorkspace !== null,
  });

  // Process orchestration tasks mutation
  const processTasksMutation = useMutation({
    mutationFn: async (workspaceId?: number) => {
      return await apiRequest('/api/orchestrator/tasks/process', {
        method: 'POST',
        body: JSON.stringify({ workspaceId }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      toast({
        title: "Tâches traitées",
        description: "Les tâches d'orchestration ont été traitées avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orchestrator'] });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Échec du traitement des tâches",
        variant: "destructive",
      });
    },
  });

  // Test Slack mention mutation
  const testMentionMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await apiRequest('/api/orchestrator/slack/mention', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Test de mention réussi",
        description: "L'agent a répondu correctement",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Échec du test de mention",
        variant: "destructive",
      });
    },
  });

  const handleProcessTasks = () => {
    processTasksMutation.mutate(selectedWorkspace || undefined);
  };

  const handleTestMention = () => {
    testMentionMutation.mutate({
      workspaceId: 1,
      slackUserId: "U123456789",
      slackChannelId: "C123456789",
      text: "Teste la connectivité de l'orchestrateur",
      agentName: "NOX"
    });
  };

  useEffect(() => {
    setSelectedWorkspace(1); // Default to workspace 1
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orchestrateur d'Agents</h1>
          <p className="text-muted-foreground">
            Tableau de bord de gestion et monitoring en temps réel
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleProcessTasks} disabled={processTasksMutation.isPending}>
            <PlayCircle className="mr-2 h-4 w-4" />
            Traiter les tâches
          </Button>
          <Button variant="outline" onClick={handleTestMention} disabled={testMentionMutation.isPending}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Test Slack
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Server className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Workspaces</p>
                <p className="text-2xl font-bold">{orchestrationStats.totalWorkspaces}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Bot className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Agents actifs</p>
                <p className="text-2xl font-bold">{orchestrationStats.activeDeployments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Interactions</p>
                <p className="text-2xl font-bold">{orchestrationStats.totalInteractions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Temps réponse</p>
                <p className="text-2xl font-bold">{orchestrationStats.avgResponseTime}ms</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-emerald-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Taux succès</p>
                <p className="text-2xl font-bold">{orchestrationStats.successRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Tâches en attente</p>
                <p className="text-2xl font-bold">{orchestrationStats.pendingTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="deployments">Déploiements</TabsTrigger>
          <TabsTrigger value="metrics">Métriques</TabsTrigger>
          <TabsTrigger value="actions">Actions NOX</TabsTrigger>
          <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
          <TabsTrigger value="tasks">Tâches</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Système d'orchestration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Server className="mr-2 h-5 w-5" />
                  Système d'orchestration
                </CardTitle>
                <CardDescription>
                  Architecture PostgreSQL complète avec gestion des workflows
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Base de données PostgreSQL</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Connectée
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Orchestrateur d'agents</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Actif
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Intégration Slack</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    <Activity className="mr-1 h-3 w-3" />
                    Prêt
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Monitoring temps réel</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Actif
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Performance globale */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Performance globale
                </CardTitle>
                <CardDescription>
                  Métriques de performance en temps réel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Taux de succès</span>
                    <span className="font-medium">{orchestrationStats.successRate}%</span>
                  </div>
                  <Progress value={orchestrationStats.successRate} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Disponibilité</span>
                    <span className="font-medium">99.9%</span>
                  </div>
                  <Progress value={99.9} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Efficacité</span>
                    <span className="font-medium">96.2%</span>
                  </div>
                  <Progress value={96.2} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Architecture technique */}
          <Card>
            <CardHeader>
              <CardTitle>Architecture technique</CardTitle>
              <CardDescription>
                Vue d'ensemble de l'infrastructure d'orchestration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 border rounded-lg">
                  <Server className="mx-auto h-8 w-8 mb-2 text-blue-600" />
                  <h3 className="font-semibold">Base de données</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    PostgreSQL avec schémas Drizzle ORM pour la persistance complète
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Bot className="mx-auto h-8 w-8 mb-2 text-green-600" />
                  <h3 className="font-semibold">Orchestrateur</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Gestion du cycle de vie des agents et traitement asynchrone
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Activity className="mx-auto h-8 w-8 mb-2 text-purple-600" />
                  <h3 className="font-semibold">Monitoring</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Métriques temps réel et alertes de performance
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Déploiements d'agents</CardTitle>
              <CardDescription>
                Gestion des agents déployés dans les workspaces Slack
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Bot className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">NOX - DevOps Specialist</h3>
                        <p className="text-sm text-muted-foreground">Workspace: Demo Team</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Actif
                      </Badge>
                      <span className="text-sm text-muted-foreground">24/7</span>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-muted-foreground">
                    Canaux: #general, #devops, #incidents • Dernière activité: Il y a 2 minutes
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Métriques de performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Interactions (24h)</span>
                    <span className="font-semibold">247</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Temps de réponse moyen</span>
                    <span className="font-semibold">1.25s</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Taux de succès</span>
                    <span className="font-semibold">98.7%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métriques système</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Tâches traitées</span>
                    <span className="font-semibold">156</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Erreurs</span>
                    <span className="font-semibold">3</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Uptime</span>
                    <span className="font-semibold">99.9%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Intégration Jira</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Non configuré</div>
                <p className="text-xs text-muted-foreground">Tickets automatiques indisponibles</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Calendrier Actions</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Actif</div>
                <p className="text-xs text-muted-foreground">Post-mortem automatiques</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Actions Détectées</CardTitle>
                <Zap className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">Cette semaine</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuration Actions Automatiques</CardTitle>
                <CardDescription>
                  Statut des intégrations pour les actions automatiques de NOX
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Pour activer les tickets Jira automatiques : configurez JIRA_HOST, JIRA_USERNAME, JIRA_API_TOKEN, et JIRA_PROJECT_KEY dans les variables d'environnement.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Actions disponibles :</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Création automatique de tickets pour incidents</li>
                    <li>• Planification de réunions post-mortem</li>
                    <li>• Programmation de tâches de maintenance</li>
                    <li>• Gestion proactive des urgences</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions Récentes</CardTitle>
                <CardDescription>
                  Dernières actions automatiques exécutées par NOX
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Post-mortem planifié</p>
                      <p className="text-xs text-muted-foreground">Incident Kubernetes - il y a 2h</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Ticket Jira échoué</p>
                      <p className="text-xs text-muted-foreground">Configuration manquante - il y a 2h</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Maintenance programmée</p>
                      <p className="text-xs text-muted-foreground">Base de données - il y a 1j</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tâches d'orchestration</CardTitle>
              <CardDescription>
                Gestion des tâches asynchrones et workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Système de tâches d'orchestration opérationnel. {orchestrationStats.pendingTasks} tâche(s) en attente de traitement.
                </AlertDescription>
              </Alert>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Déploiement agent NOX</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Terminée</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Configuration monitoring</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Terminée</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm">Contrôle de santé</span>
                  </div>
                  <Badge variant="outline">En attente</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="infrastructure" className="space-y-4">
          <InfrastructureTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Composant pour l'onglet Infrastructure
function InfrastructureTab() {
  const [servers, setServers] = useState<any[]>([]);
  const [isAddingServer, setIsAddingServer] = useState(false);
  const [newServer, setNewServer] = useState({
    id: '',
    name: '',
    type: 'ssh' as 'ssh' | 'kubernetes' | 'docker',
    host: '',
    port: '',
    username: '',
    keyPath: '',
    namespace: '',
    context: ''
  });
  const [logs, setLogs] = useState('');
  const [diagnostic, setDiagnostic] = useState('');
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query pour récupérer les serveurs
  const { data: serversData, isLoading: serversLoading } = useQuery({
    queryKey: ['/api/infrastructure/servers'],
    onSuccess: (data) => setServers(data || [])
  });

  // Query pour récupérer les actions en attente
  const { data: actionsData } = useQuery({
    queryKey: ['/api/infrastructure/actions'],
    onSuccess: (data) => setPendingActions(data || [])
  });

  // Mutation pour ajouter un serveur
  const addServerMutation = useMutation({
    mutationFn: async (serverConfig: any) => {
      return await apiRequest('/api/infrastructure/servers', {
        method: 'POST',
        body: JSON.stringify(serverConfig),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      toast({
        title: "Serveur ajouté",
        description: "Le serveur a été configuré avec succès",
      });
      setIsAddingServer(false);
      setNewServer({ id: '', name: '', type: 'ssh', host: '', port: '', username: '', keyPath: '', namespace: '', context: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/infrastructure/servers'] });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le serveur",
        variant: "destructive",
      });
    },
  });

  // Mutation pour lire les logs
  const readLogsMutation = useMutation({
    mutationFn: async (params: { serverId: string, service?: string, lines?: number }) => {
      return await apiRequest('/api/infrastructure/logs', {
        method: 'POST',
        body: JSON.stringify(params),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: (data) => {
      setLogs(data.logs || 'Aucun log disponible');
      toast({
        title: "Logs récupérés",
        description: "Les logs ont été chargés avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les logs",
        variant: "destructive",
      });
    },
  });

  // Mutation pour diagnostic
  const diagnosticMutation = useMutation({
    mutationFn: async (serverId: string) => {
      return await apiRequest('/api/infrastructure/diagnostic', {
        method: 'POST',
        body: JSON.stringify({ serverId }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: (data) => {
      setDiagnostic(data.diagnostic || 'Diagnostic vide');
      toast({
        title: "Diagnostic terminé",
        description: "Le diagnostic a été exécuté avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible d'exécuter le diagnostic",
        variant: "destructive",
      });
    },
  });

  // Mutation pour exécuter des actions
  const executeActionMutation = useMutation({
    mutationFn: async (params: { type: string, command: string, serverId: string, executedBy: string }) => {
      return await apiRequest('/api/infrastructure/action', {
        method: 'POST',
        body: JSON.stringify(params),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: (data) => {
      if (data.requiresConfirmation) {
        toast({
          title: "Confirmation requise",
          description: data.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Action exécutée",
          description: "L'action a été exécutée avec succès",
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/infrastructure/actions'] });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible d'exécuter l'action",
        variant: "destructive",
      });
    },
  });

  const handleAddServer = () => {
    if (!newServer.name || !newServer.host) {
      toast({
        title: "Erreur",
        description: "Nom et host sont requis",
        variant: "destructive",
      });
      return;
    }

    const serverConfig = {
      ...newServer,
      id: `${newServer.type}-${Date.now()}`,
      port: newServer.port ? parseInt(newServer.port) : undefined
    };

    addServerMutation.mutate(serverConfig);
  };

  const getServerIcon = (type: string) => {
    switch (type) {
      case 'kubernetes': return <Cloud className="h-4 w-4" />;
      case 'docker': return <Database className="h-4 w-4" />;
      case 'ssh': return <Terminal className="h-4 w-4" />;
      default: return <Server className="h-4 w-4" />;
    }
  };

  const getValidationLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'info': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration des serveurs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Configuration des serveurs
              </CardTitle>
              <CardDescription>
                Configurez les serveurs et clusters pour l'intégration NOX
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddingServer(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Ajouter serveur
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Liste des serveurs */}
          <div className="space-y-3">
            {serversLoading ? (
              <div className="text-center py-4">Chargement des serveurs...</div>
            ) : servers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun serveur configuré</p>
                <p className="text-sm">Ajoutez votre premier serveur pour commencer</p>
              </div>
            ) : (
              servers.map((server) => (
                <div key={server.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getServerIcon(server.type)}
                    <div>
                      <div className="font-medium">{server.name}</div>
                      <div className="text-sm text-gray-500">
                        {server.type.toUpperCase()} - {server.host}{server.port ? `:${server.port}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => readLogsMutation.mutate({ serverId: server.id })}
                      disabled={readLogsMutation.isPending}
                    >
                      {readLogsMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Logs'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => diagnosticMutation.mutate(server.id)}
                      disabled={diagnosticMutation.isPending}
                    >
                      {diagnosticMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Diagnostic'}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Formulaire d'ajout de serveur */}
          {isAddingServer && (
            <div className="mt-6 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium mb-4">Nouveau serveur</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nom</label>
                  <input
                    type="text"
                    value={newServer.name}
                    onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Production Server"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={newServer.type}
                    onChange={(e) => setNewServer({ ...newServer, type: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="ssh">SSH</option>
                    <option value="kubernetes">Kubernetes</option>
                    <option value="docker">Docker</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Host</label>
                  <input
                    type="text"
                    value={newServer.host}
                    onChange={(e) => setNewServer({ ...newServer, host: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="192.168.1.100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Port (optionnel)</label>
                  <input
                    type="number"
                    value={newServer.port}
                    onChange={(e) => setNewServer({ ...newServer, port: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="22"
                  />
                </div>
                {newServer.type === 'ssh' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Username</label>
                      <input
                        type="text"
                        value={newServer.username}
                        onChange={(e) => setNewServer({ ...newServer, username: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="ubuntu"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Chemin clé SSH (optionnel)</label>
                      <input
                        type="text"
                        value={newServer.keyPath}
                        onChange={(e) => setNewServer({ ...newServer, keyPath: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="~/.ssh/id_rsa"
                      />
                    </div>
                  </>
                )}
                {newServer.type === 'kubernetes' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Namespace (optionnel)</label>
                      <input
                        type="text"
                        value={newServer.namespace}
                        onChange={(e) => setNewServer({ ...newServer, namespace: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="default"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Context (optionnel)</label>
                      <input
                        type="text"
                        value={newServer.context}
                        onChange={(e) => setNewServer({ ...newServer, context: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="minikube"
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleAddServer} disabled={addServerMutation.isPending}>
                  {addServerMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Ajouter'}
                </Button>
                <Button variant="outline" onClick={() => setIsAddingServer(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions en attente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Actions en attente de validation
          </CardTitle>
          <CardDescription>
            Actions infrastructure nécessitant une confirmation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingActions.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              Aucune action en attente
            </div>
          ) : (
            <div className="space-y-3">
              {pendingActions.map((action) => (
                <div key={action.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{action.command}</div>
                      <div className="text-sm text-gray-500">
                        Serveur: {action.server} • Par: {action.executedBy}
                      </div>
                      <div className="mt-1">
                        <Badge className={getValidationLevelColor(action.validation.level)}>
                          {action.validation.level.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Annuler
                      </Button>
                      <Button size="sm">
                        Confirmer
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logs et diagnostic */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {logs && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Logs récents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto max-h-96 overflow-y-auto">
                {logs}
              </pre>
            </CardContent>
          </Card>
        )}

        {diagnostic && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Diagnostic système
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto max-h-96 overflow-y-auto">
                {diagnostic}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}