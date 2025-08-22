import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Bot, 
  MessageSquare, 
  Clock, 
  Star,
  Zap,
  Trophy,
  TrendingUp,
  Calendar,
  ArrowRight,
  Settings,
  Crown,
  Sparkles
} from "lucide-react";
import { Link } from "wouter";

interface DashboardStats {
  conversationsCount: number;
  noxInteractions: number;
  averageRating: number;
  timeSpent: string;
  achievements: string[];
  nextMilestone: { name: string; progress: number; total: number };
}

export default function UserDashboard() {
  const { user } = useAuth();
  
  // Données simulées pour la démo (en production, récupérées via API)
  const [stats] = useState<DashboardStats>({
    conversationsCount: 3,
    noxInteractions: 12,
    averageRating: 4.8,
    timeSpent: "2h 34min",
    achievements: ["First Chat", "Problem Solver"],
    nextMilestone: {
      name: "DevOps Explorer",
      progress: 7,
      total: 15
    }
  });

  const recentInteractions = [
    {
      id: 1,
      agent: "NOX",
      title: "Docker container optimization",
      timestamp: "Il y a 2 heures",
      status: "resolved",
      rating: 5
    },
    {
      id: 2,
      agent: "NOX", 
      title: "Kubernetes deployment debug",
      timestamp: "Hier",
      status: "resolved",
      rating: 5
    },
    {
      id: 3,
      agent: "NOX",
      title: "CI/CD pipeline setup",
      timestamp: "Il y a 2 jours",
      status: "resolved",
      rating: 4
    }
  ];

  const achievements = [
    { 
      name: "First Chat", 
      description: "Première conversation avec un agent", 
      icon: MessageSquare,
      earned: true,
      date: "Il y a 3 jours"
    },
    { 
      name: "Problem Solver", 
      description: "3 problèmes techniques résolus", 
      icon: Zap,
      earned: true,
      date: "Aujourd'hui"
    },
    { 
      name: "DevOps Explorer", 
      description: "15 interactions avec NOX", 
      icon: Trophy,
      earned: false,
      progress: stats.nextMilestone.progress
    },
    { 
      name: "Early Adopter", 
      description: "Tester ATLAS quand il sera disponible", 
      icon: Crown,
      earned: false,
      comingSoon: true
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Bonjour, {user?.name || user?.email?.split('@')[0]} !
            </h1>
            <p className="text-muted-foreground mt-1">
              Votre tableau de bord personnel Jamono
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Sparkles className="mr-1 h-3 w-3" />
              Utilisateur individuel
            </Badge>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversations</p>
                <p className="text-2xl font-bold">{stats.conversationsCount}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avec NOX</p>
                <p className="text-2xl font-bold">{stats.noxInteractions}</p>
              </div>
              <Bot className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Satisfaction</p>
                <p className="text-2xl font-bold">{stats.averageRating}/5</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Temps passé</p>
                <p className="text-2xl font-bold">{stats.timeSpent}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="upgrade">Upgrade</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Next Milestone */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Prochain objectif</span>
              </CardTitle>
              <CardDescription>
                Continuez à explorer pour débloquer de nouveaux achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{stats.nextMilestone.name}</span>
                  <span>{stats.nextMilestone.progress}/{stats.nextMilestone.total}</span>
                </div>
                <Progress value={(stats.nextMilestone.progress / stats.nextMilestone.total) * 100} />
                <p className="text-sm text-muted-foreground">
                  Plus que {stats.nextMilestone.total - stats.nextMilestone.progress} interactions avec NOX
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
              <CardDescription>Commencez votre prochaine exploration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/nox-demo">
                  <Button variant="outline" className="w-full justify-between h-auto p-4">
                    <div className="text-left">
                      <div className="font-medium">Parler avec NOX</div>
                      <div className="text-sm text-muted-foreground">Interface de chat avancée</div>
                    </div>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>

                <Link href="/platform-demo">
                  <Button variant="outline" className="w-full justify-between h-auto p-4">
                    <div className="text-left">
                      <div className="font-medium">Explorer la plateforme</div>
                      <div className="text-sm text-muted-foreground">Découvrir ATLAS et CIRRUS</div>
                    </div>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Interactions récentes</CardTitle>
              <CardDescription>Vos dernières conversations avec les agents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentInteractions.map((interaction) => (
                  <div key={interaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Bot className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">{interaction.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {interaction.agent} • {interaction.timestamp}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        {[...Array(interaction.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {interaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vos achievements</CardTitle>
              <CardDescription>Débloquez de nouveaux défis en explorant Jamono</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement) => {
                  const IconComponent = achievement.icon;
                  return (
                    <div key={achievement.name} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                        achievement.earned ? 'bg-green-100 text-green-600' : 
                        achievement.comingSoon ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-600'
                      }`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{achievement.name}</div>
                        <div className="text-sm text-muted-foreground">{achievement.description}</div>
                        {achievement.earned && (
                          <div className="text-xs text-green-600 mt-1">Débloqué {achievement.date}</div>
                        )}
                        {achievement.progress && !achievement.earned && (
                          <div className="mt-2">
                            <Progress value={(achievement.progress / 15) * 100} className="h-2" />
                            <div className="text-xs text-muted-foreground mt-1">
                              {achievement.progress}/15 interactions
                            </div>
                          </div>
                        )}
                        {achievement.comingSoon && (
                          <Badge variant="outline" className="mt-1 text-xs">Bientôt disponible</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upgrade" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                <span>Passer à l'Enterprise</span>
              </CardTitle>
              <CardDescription>
                Déployez Jamono pour toute votre équipe avec des fonctionnalités avancées
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Compte individuel actuel</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>✅ Accès démo NOX</li>
                    <li>✅ Interface publique</li>
                    <li>✅ Support communauté</li>
                    <li>❌ Intégrations Slack</li>
                    <li>❌ Zones d'action</li>
                    <li>❌ Gestion d'équipe</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Compte Enterprise</h4>
                  <ul className="space-y-2 text-sm">
                    <li>✅ NOX déployé dans Slack</li>
                    <li>✅ Intégrations complètes (Jira, Calendar)</li>
                    <li>✅ Zones d'action sécurisées</li>
                    <li>✅ Gestion d'équipe</li>
                    <li>✅ Support prioritaire</li>
                    <li>✅ Agents futurs (ATLAS, CIRRUS)</li>
                  </ul>
                </div>
              </div>
              
              <div className="text-center">
                <Link href="/enterprise/onboard">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Crown className="mr-2 h-5 w-5" />
                    Créer un espace Enterprise
                  </Button>
                </Link>
                <p className="text-sm text-muted-foreground mt-2">
                  Plan Starter gratuit • 5 utilisateurs • 1 agent
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}