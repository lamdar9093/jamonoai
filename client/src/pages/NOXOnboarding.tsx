import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  CheckCircle, 
  Bot, 
  Settings, 
  Code, 
  Container, 
  Cloud,
  Zap,
  Users,
  Shield,
  Monitor,
  Rocket
} from 'lucide-react';

interface Workspace {
  id: number;
  name: string;
  status: string;
}

const NOXCapabilities = [
  { 
    icon: Container, 
    title: "Conteneurisation", 
    desc: "Docker, Kubernetes, orchestration",
    skills: ["Docker", "Kubernetes", "Helm", "Docker Compose"]
  },
  { 
    icon: Settings, 
    title: "CI/CD", 
    desc: "Pipelines automatisés et déploiements",
    skills: ["Jenkins", "GitLab CI", "GitHub Actions", "ArgoCD"]
  },
  { 
    icon: Cloud, 
    title: "Cloud Infrastructure", 
    desc: "AWS, GCP, Azure, Infrastructure as Code",
    skills: ["AWS", "Terraform", "CloudFormation", "Azure"]
  },
  { 
    icon: Monitor, 
    title: "Monitoring & Alertes", 
    desc: "Surveillance infrastructure et applications",
    skills: ["Prometheus", "Grafana", "ELK Stack", "Datadog"]
  },
  { 
    icon: Shield, 
    title: "Sécurité DevOps", 
    desc: "Secrets management et compliance",
    skills: ["Vault", "Security Scanning", "RBAC", "Compliance"]
  },
  { 
    icon: Code, 
    title: "Automation", 
    desc: "Scripts et automatisation infrastructure",
    skills: ["Ansible", "Python", "Bash", "PowerShell"]
  }
];

export default function NOXOnboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentComplete, setDeploymentComplete] = useState(false);
  
  const workspaceId = new URLSearchParams(window.location.search).get('workspace');

  const deployNOXMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/workspaces/${workspaceId}/deploy-agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentIds: [1] }) // NOX Agent ID = 1
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du déploiement de NOX');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setDeploymentComplete(true);
      toast({
        title: "NOX déployé avec succès !",
        description: "Votre agent DevOps est maintenant actif dans votre workspace Slack.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur de déploiement",
        description: "Impossible de déployer NOX. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  });

  const handleDeployNOX = () => {
    if (!workspaceId) {
      toast({
        title: "Erreur",
        description: "ID workspace manquant",
        variant: "destructive",
      });
      return;
    }
    
    setIsDeploying(true);
    deployNOXMutation.mutate();
  };

  const handleGoToSlack = () => {
    // Redirection vers Slack après déploiement
    window.open('https://slack.com/app_redirect?channel=general', '_blank');
  };

  if (!workspaceId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Erreur de configuration</CardTitle>
            <CardDescription>
              ID workspace manquant. Veuillez refaire l'autorisation Slack.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-blue-600 rounded-full p-4 mr-4">
              <Bot className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900">
                Rencontrez NOX
              </h1>
              <p className="text-xl text-slate-600 mt-2">
                Votre nouveau collègue DevOps Senior
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border max-w-2xl mx-auto">
            <p className="text-lg text-slate-700">
              NOX est un agent DevOps autonome qui travaille 24/7 dans votre équipe. 
              Il diagnostique, résout et optimise votre infrastructure comme un collègue expérimenté.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          
          {/* NOX Profile Card */}
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage 
                    src="https://randomuser.me/api/portraits/men/32.jpg" 
                    alt="NOX" 
                  />
                  <AvatarFallback className="bg-blue-600 text-white text-xl font-bold">
                    NOX
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-2xl text-slate-900">NOX</CardTitle>
                  <CardDescription className="text-lg">
                    DevOps Senior • Collègue numérique 24/7
                  </CardDescription>
                  <div className="flex items-center mt-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      En ligne
                    </Badge>
                    <Badge variant="outline" className="ml-2">
                      Rating: 98/100
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Profil professionnel</h4>
                <p className="text-slate-600">
                  Collègue DevOps autonome et fiable avec 8+ ans d'expérience. 
                  Toujours disponible pour diagnostiquer, résoudre et optimiser votre infrastructure. 
                  Agit comme un membre senior de l'équipe.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Compétences principales</h4>
                <div className="flex flex-wrap gap-2">
                  {["Docker", "Kubernetes", "Jenkins", "AWS", "CI/CD", "Terraform", "Ansible", "Monitoring"].map((skill) => (
                    <Badge key={skill} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4">
                {deploymentComplete ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-green-800 font-medium">
                          NOX est maintenant actif dans votre workspace !
                        </span>
                      </div>
                    </div>
                    <Button 
                      onClick={handleGoToSlack}
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="lg"
                    >
                      <Rocket className="mr-2 h-5 w-5" />
                      Ouvrir Slack et commencer
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={handleDeployNOX}
                    disabled={isDeploying}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    {isDeploying ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Déploiement en cours...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-5 w-5" />
                        Déployer NOX dans mon workspace
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Capabilities Grid */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                Capacités DevOps complètes
              </h2>
              <p className="text-slate-600 mb-6">
                NOX maîtrise toute la chaîne DevOps moderne et peut intervenir sur tous vos projets.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {NOXCapabilities.map((capability, index) => (
                <Card key={index} className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-100 rounded-lg p-2 flex-shrink-0">
                        <capability.icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 mb-1">
                          {capability.title}
                        </h4>
                        <p className="text-sm text-slate-600 mb-2">
                          {capability.desc}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {capability.skills.map((skill) => (
                            <Badge 
                              key={skill} 
                              variant="secondary" 
                              className="text-xs bg-slate-100 text-slate-700"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* How it works section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-8">
            Comment ça marche ?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">
                1. Intégration Slack
              </h3>
              <p className="text-slate-600">
                NOX rejoint votre workspace Slack comme un nouveau membre de l'équipe
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-600 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">
                2. Disponibilité 24/7
              </h3>
              <p className="text-slate-600">
                Mentionnez @NOX ou envoyez-lui un DM pour obtenir une aide immédiate
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-600 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                <Settings className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">
                3. Solutions concrètes
              </h3>
              <p className="text-slate-600">
                Recevez du code, des configurations et des solutions prêtes à déployer
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}