import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, ArrowRight, Slack, MessageSquare, Zap, Users, Shield, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Onboarding() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [slackConfig, setSlackConfig] = useState<{ clientId?: string }>({});
  const { toast } = useToast();

  useEffect(() => {
    // Fetch Slack configuration
    fetch("/api/config/slack")
      .then(res => res.json())
      .then(data => setSlackConfig(data))
      .catch(err => console.error("Failed to load Slack config:", err));
  }, []);

  const handleSlackIntegration = async () => {
    if (!slackConfig.clientId) {
      toast({
        title: "Configuration Error",
        description: "Slack configuration not available. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);

    try {
      // Build Slack OAuth URL
      const redirectUri = `${window.location.origin}/onboarding/slack/callback`;
      const scopes = "channels:read,channels:history,groups:history,chat:write,users:read,app_mentions:read,im:read,im:write,mpim:read,mpim:write,im:history";
      
      const slackAuthUrl = `https://slack.com/oauth/v2/authorize?` +
        `client_id=${slackConfig.clientId}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=nox_onboarding`;

      // Redirect to Slack OAuth
      window.location.href = slackAuthUrl;
    } catch (error) {
      console.error("Error initiating Slack integration:", error);
      toast({
        title: "Integration Error",
        description: "Failed to start Slack integration. Please try again.",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  const features = [
    {
      icon: MessageSquare,
      title: "Mentions directes",
      description: "Mentionnez n'importe quel agent dans vos canaux pour obtenir une aide spécialisée instantanée"
    },
    {
      icon: Zap,
      title: "Réponses automatiques",
      description: "Les agents répondent automatiquement aux incidents et questions dans leur domaine d'expertise"
    },
    {
      icon: Users,
      title: "Collaboration équipe",
      description: "Les agents s'intègrent naturellement dans vos discussions d'équipe comme de vrais collègues"
    },
    {
      icon: Shield,
      title: "Sécurisé",
      description: "Toutes les communications sont sécurisées et respectent vos politiques d'entreprise"
    },
    {
      icon: Clock,
      title: "24/7 Disponible",
      description: "Vos collègues virtuels sont toujours en ligne, même en dehors des heures de bureau"
    }
  ];

  const onboardingSteps = [
    {
      step: 1,
      title: "Connecter Slack",
      description: "Autorisez les agents à accéder à votre workspace Slack",
      completed: false,
      current: true
    },
    {
      step: 2,
      title: "Configuration initiale",
      description: "Définissez les canaux et permissions pour vos agents",
      completed: false,
      current: false
    },
    {
      step: 3,
      title: "Test d'intégration",
      description: "Vérifiez que les agents répondent correctement dans Slack",
      completed: false,
      current: false
    },
    {
      step: 4,
      title: "Formation équipe",
      description: "Apprenez à utiliser efficacement votre main d'œuvre numérique",
      completed: false,
      current: false
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Intégrez votre main d'œuvre numérique
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Ajoutez des agents IA spécialisés à votre workspace Slack en quelques étapes simples 
            et commencez à collaborer avec vos nouveaux collègues virtuels.
          </p>
        </div>

        {/* Agents Available */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Agents disponibles</h2>
          
          {/* NOX - Agent principal développé */}
          <Card className="mb-6 bg-white shadow-lg border-2 border-green-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src="https://randomuser.me/api/portraits/men/32.jpg" alt="NOX" />
                    <AvatarFallback>NOX</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl text-gray-900">NOX</CardTitle>
                    <CardDescription className="text-lg">DevOps Senior • Collègue numérique 24/7</CardDescription>
                    <div className="flex items-center mt-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm text-green-600 font-medium">Disponible maintenant</span>
                    </div>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  Complètement développé
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                NOX est un collègue DevOps autonome qui s'intègre directement dans votre workflow Slack. 
                Il peut diagnostiquer des problèmes, proposer des solutions, générer de la documentation 
                et collaborer avec votre équipe comme un membre senior.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Docker", "Kubernetes", "AWS", "CI/CD", "Monitoring", "Terraform"].map((skill) => (
                  <Badge key={skill} variant="secondary" className="bg-blue-100 text-blue-800">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Autres agents - À venir */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-gray-50 border-dashed border-2 border-gray-300">
              <CardContent className="p-6 text-center">
                <Avatar className="w-12 h-12 mx-auto mb-3">
                  <AvatarImage src="https://randomuser.me/api/portraits/women/44.jpg" alt="ATLAS" />
                  <AvatarFallback>AT</AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-gray-900">ATLAS</h3>
                <p className="text-sm text-gray-600 mb-2">Cloud Architect</p>
                <Badge variant="outline" className="border-orange-200 text-orange-700">
                  Version future
                </Badge>
              </CardContent>
            </Card>

            <Card className="bg-gray-50 border-dashed border-2 border-gray-300">
              <CardContent className="p-6 text-center">
                <Avatar className="w-12 h-12 mx-auto mb-3">
                  <AvatarImage src="https://randomuser.me/api/portraits/men/67.jpg" alt="CIRRUS" />
                  <AvatarFallback>CI</AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-gray-900">CIRRUS</h3>
                <p className="text-sm text-gray-600 mb-2">System Administrator</p>
                <Badge variant="outline" className="border-orange-200 text-orange-700">
                  Version future
                </Badge>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 Actuellement, NOX est entièrement opérationnel. ATLAS et CIRRUS seront disponibles dans les prochaines versions avec leurs propres spécialisations.
            </p>
          </div>
        </div>

        {/* Integration Steps */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Slack className="w-6 h-6 text-purple-600 mr-2" />
              Intégration Slack
            </CardTitle>
            <CardDescription>
              Suivez ces étapes pour intégrer NOX à votre workspace Slack
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {onboardingSteps.map((step) => (
                <div key={step.step} className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step.completed ? 'bg-green-500 text-white' :
                    step.current ? 'bg-blue-500 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {step.completed ? <CheckCircle className="w-4 h-4" /> : step.step}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-medium ${step.current ? 'text-blue-600' : 'text-gray-900'}`}>
                      {step.title}
                    </h4>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                  {step.current && (
                    <Badge variant="outline" className="border-blue-200 text-blue-700">
                      En cours
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            <Separator className="my-6" />

            <div className="text-center">
              <Button 
                onClick={handleSlackIntegration}
                disabled={isConnecting}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                size="lg"
              >
                <Slack className="w-5 h-5 mr-2" />
                {isConnecting ? "Connexion en cours..." : "Connecter à Slack"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                Vous serez redirigé vers Slack pour autoriser l'intégration
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Ce que la main d'œuvre numérique apportera à votre équipe</CardTitle>
            <CardDescription>
              Découvrez comment les agents IA transformeront vos workflows quotidiens
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="text-center">
                  <feature.icon className="w-12 h-12 text-red-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Example Usage */}
        <Card className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardHeader>
            <CardTitle>Exemples d'utilisation dans Slack</CardTitle>
            <CardDescription>
              Voici comment vous pourrez interagir avec NOX une fois l'intégration terminée
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                <p className="font-mono text-sm text-gray-700">
                  <span className="text-blue-600">@NOX</span> le serveur de prod est lent depuis ce matin, peux-tu diagnostiquer ?
                </p>
                <p className="text-xs text-gray-500 mt-2">→ NOX analysera les métriques et proposera des solutions</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                <p className="font-mono text-sm text-gray-700">
                  <span className="text-blue-600">@NOX</span> génère un post-mortem pour l'incident Redis d'hier
                </p>
                <p className="text-xs text-gray-500 mt-2">→ NOX créera automatiquement la documentation</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 border-l-4 border-purple-500">
                <p className="font-mono text-sm text-gray-700">
                  <span className="text-blue-600">@NOX</span> prépare un plan de migration K8s pour le nouveau projet
                </p>
                <p className="text-xs text-gray-500 mt-2">→ NOX planifiera la migration étape par étape</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}