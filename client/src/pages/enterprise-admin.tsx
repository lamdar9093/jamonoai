import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, Users, Settings, CreditCard, BarChart3, 
  UserPlus, Slack, Github, Server, Database,
  CheckCircle, AlertCircle, Clock, ArrowLeft,
  Building, Mail, Crown, Bot
} from "lucide-react";

interface TenantData {
  id: number;
  name: string;
  domain: string;
  planType: string;
  status: string;
  maxUsers: number;
  maxAgents: number;
  currentUsers: number;
  currentAgents: number;
}

interface TenantUser {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string;
  permissions: any;
}

interface Integration {
  id: number;
  integrationType: string;
  name: string;
  status: string;
  lastTestedAt: string;
}

export default function EnterpriseAdmin() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  // Requêtes pour récupérer les données
  const { data: tenant, isLoading: tenantLoading } = useQuery({
    queryKey: [`/api/tenants/${tenantId}`],
    enabled: !!tenantId,
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: [`/api/tenants/${tenantId}/users`],
    enabled: !!tenantId,
  });

  const { data: integrations, isLoading: integrationsLoading } = useQuery({
    queryKey: [`/api/tenants/${tenantId}/integrations`],
    enabled: !!tenantId,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: [`/api/tenants/${tenantId}/analytics`],
    enabled: !!tenantId,
  });

  // Mutation pour inviter un utilisateur
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'manager' | 'developer' | 'viewer'>('developer');
  
  const inviteUserMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/tenants/${tenantId}/users/invite`, {
        method: 'POST',
        body: JSON.stringify({
          email: inviteEmail,
          name: inviteName,
          role: inviteRole,
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur invitation');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitation envoyée !",
        description: `${inviteName} a été invité(e) à rejoindre l'espace.`,
      });
      setInviteEmail('');
      setInviteName('');
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenantId}/users`] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur invitation",
        description: error.message || "Impossible d'envoyer l'invitation",
        variant: "destructive",
      });
    },
  });

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(tenant as TenantData)?.currentUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              sur {(tenant as TenantData)?.maxUsers || 0} max
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(tenant as TenantData)?.currentAgents || 1}</div>
            <p className="text-xs text-muted-foreground">
              sur {(tenant as TenantData)?.maxAgents || 1} max
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Intégrations</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(integrations as Integration[])?.length || 0}</div>
            <p className="text-xs text-muted-foreground">configurées</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Plan</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{(tenant as TenantData)?.planType || 'Starter'}</div>
            <p className="text-xs text-muted-foreground">actuel</p>
          </CardContent>
        </Card>
      </div>

      {/* Informations entreprise */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Informations Entreprise
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nom de l'entreprise</Label>
              <Input value={(tenant as TenantData)?.name || ''} disabled />
            </div>
            <div>
              <Label>Domaine</Label>
              <Input value={(tenant as TenantData)?.domain || 'Non configuré'} disabled />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={(tenant as TenantData)?.status === 'active' ? 'default' : 'destructive'}>
              {(tenant as TenantData)?.status === 'active' ? 'Actif' : 'Suspendu'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Intégrations rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Intégrations Critiques</CardTitle>
          <CardDescription>
            État des intégrations principales pour votre équipe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(integrations as Integration[])?.slice(0, 4).map((integration: Integration) => (
              <div key={integration.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {integration.integrationType === 'slack' && <Slack className="h-5 w-5" />}
                  {integration.integrationType === 'github' && <Github className="h-5 w-5" />}
                  {integration.integrationType === 'kubernetes' && <Server className="h-5 w-5" />}
                  {integration.integrationType === 'database' && <Database className="h-5 w-5" />}
                  <div>
                    <p className="font-medium">{integration.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {integration.integrationType}
                    </p>
                  </div>
                </div>
                <Badge variant={integration.status === 'active' ? 'default' : 'destructive'}>
                  {integration.status === 'active' ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <AlertCircle className="h-3 w-3 mr-1" />
                  )}
                  {integration.status === 'active' ? 'Opérationnel' : 'Erreur'}
                </Badge>
              </div>
            )) || (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Aucune intégration configurée. Accédez à l'onglet "Intégrations" pour commencer.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      {/* Invitation d'utilisateur */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Inviter un Collaborateur
          </CardTitle>
          <CardDescription>
            Ajoutez des membres de votre équipe à l'espace Jamono
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="inviteName">Nom complet</Label>
              <Input
                id="inviteName"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Jean Dupont"
              />
            </div>
            <div>
              <Label htmlFor="inviteEmail">Email professionnel</Label>
              <Input
                id="inviteEmail"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="jean@entreprise.com"
              />
            </div>
            <div>
              <Label htmlFor="inviteRole">Rôle</Label>
              <select
                id="inviteRole"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="developer">Développeur</option>
                <option value="manager">Manager</option>
                <option value="viewer">Observateur</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => inviteUserMutation.mutate()}
                disabled={!inviteEmail || !inviteName || inviteUserMutation.isPending}
                className="w-full"
              >
                {inviteUserMutation.isPending ? 'Invitation...' : 'Inviter'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des utilisateurs */}
      <Card>
        <CardHeader>
          <CardTitle>Équipe ({(users as TenantUser[])?.length || 0})</CardTitle>
          <CardDescription>
            Gérez les membres de votre espace de travail
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(users as TenantUser[])?.map((user: TenantUser) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-medium text-sm">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role === 'admin' ? 'Admin' : user.role === 'manager' ? 'Manager' : user.role === 'developer' ? 'Dev' : 'Viewer'}
                  </Badge>
                  <Badge variant={user.isActive ? 'default' : 'destructive'}>
                    {user.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </div>
            )) || (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Aucun utilisateur trouvé. Invitez vos premiers collaborateurs !
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (tenantLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement de l'espace entreprise...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setLocation('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Shield className="h-8 w-8 text-primary" />
                {(tenant as TenantData)?.name || 'Entreprise'}
              </h1>
              <p className="text-muted-foreground">
                Administration de l'espace de travail multi-agent
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              Plan {(tenant as TenantData)?.planType || 'Starter'}
            </Badge>
          </div>
        </div>

        {/* Navigation par onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Aperçu
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Équipe
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Intégrations
            </TabsTrigger>
            <TabsTrigger value="agents" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Agents
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Facturation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            {renderOverview()}
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            {renderUsers()}
          </TabsContent>

          <TabsContent value="integrations" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Intégrations Disponibles</CardTitle>
                <CardDescription>
                  Connectez vos outils de travail à NOX
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertDescription>
                    Section en cours de développement. Prochainement : configuration Slack, GitHub, Kubernetes, Jira.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agents" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuration des Agents</CardTitle>
                <CardDescription>
                  Gérez NOX et les futurs agents de votre espace
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <Bot className="h-4 w-4" />
                  <AlertDescription>
                    Section en cours de développement. Prochainement : configuration personnalisée de NOX, zones d'action, permissions.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Facturation et Plan</CardTitle>
                <CardDescription>
                  Gérez votre abonnement et consultez l'utilisation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <CreditCard className="h-4 w-4" />
                  <AlertDescription>
                    Section en cours de développement. Prochainement : gestion des paiements, changement de plan, rapports d'utilisation.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}