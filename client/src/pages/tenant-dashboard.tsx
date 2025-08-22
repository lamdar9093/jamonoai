import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  Users, 
  Settings, 
  Bot,
  Zap,
  Shield,
  Plus,
  CheckCircle,
  AlertCircle,
  Server,
  Database,
  Cloud
} from "lucide-react";

export default function TenantDashboard() {
  const [selectedTenant] = useState({
    id: 1,
    name: "Acme Corporation",
    domain: "acme.com",
    planType: "professional",
    status: "active"
  });

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            {selectedTenant.name}
          </h1>
          <p className="text-muted-foreground">
            Espace de configuration multi-agent SaaS
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            {selectedTenant.planType}
          </Badge>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Déployer vers Slack
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Utilisateurs</p>
                <p className="text-2xl font-bold">12 / 25</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Bot className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Agents</p>
                <p className="text-2xl font-bold">1 / 3</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Intégrations</p>
                <p className="text-2xl font-bold">3</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Zones d'action</p>
                <p className="text-2xl font-bold">5</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs defaultValue="integrations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="integrations">Intégrations</TabsTrigger>
          <TabsTrigger value="zones">Zones d'action</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="deployment">Déploiement</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Intégrations configurées</h2>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle intégration
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Kubernetes Production
                </CardTitle>
                <CardDescription>Cluster principal production</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Statut</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Connecté
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Namespaces</span>
                    <span className="text-sm font-medium">3 autorisés</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Dernière vérification</span>
                    <span className="text-sm">Il y a 2 minutes</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Jira Company
                </CardTitle>
                <CardDescription>Système de tickets principal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Statut</span>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      Configuration incomplète
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Projets</span>
                    <span className="text-sm font-medium">5 autorisés</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Actions</span>
                    <span className="text-sm">Tickets automatiques</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5" />
                  Slack Workspace
                </CardTitle>
                <CardDescription>Communications d'équipe</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Statut</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Connecté
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Canaux</span>
                    <span className="text-sm font-medium">12 autorisés</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Bot NOX</span>
                    <span className="text-sm">Prêt à déployer</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="zones" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Zones d'action configurées</h2>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle zone
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                <Shield className="mx-auto h-12 w-12 mb-4" />
                <p>Configurez des zones d'action pour définir les périmètres</p>
                <p>d'intervention de vos agents selon vos intégrations.</p>
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Créer votre première zone
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Configuration des agents</h2>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Configurer agent
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-6 w-6 text-blue-600" />
                NOX - DevOps Specialist
              </CardTitle>
              <CardDescription>
                Agent DevOps avec accès à vos intégrations configurées
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Statut de configuration</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Prêt
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Intégrations autorisées</span>
                <span className="text-sm font-medium">3 / 3 configurées</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Zones d'action</span>
                <span className="text-sm font-medium">En attente de configuration</span>
              </div>
              <Button className="w-full">
                Tester l'agent avant déploiement
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Gestion des utilisateurs</h2>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Inviter utilisateur
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                <Users className="mx-auto h-12 w-12 mb-4" />
                <p>Gérez les utilisateurs et leurs permissions</p>
                <p>dans votre espace tenant.</p>
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Inviter votre équipe
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployment" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Déploiement vers Slack</h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Prêt pour le déploiement</CardTitle>
              <CardDescription>
                Votre agent NOX est configuré et peut être déployé vers Slack
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Intégrations configurées</span>
                </div>
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <span>Zones d'action à définir (optionnel)</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Agent NOX configuré</span>
                </div>
              </div>

              <Button size="lg" className="w-full">
                <Zap className="mr-2 h-5 w-5" />
                Déployer NOX vers Slack
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}