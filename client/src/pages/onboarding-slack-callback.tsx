import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, AlertCircle, Loader2, Slack, ArrowRight, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function OnboardingSlackCallback() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [integrationData, setIntegrationData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const handleSlackCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
          throw new Error(`Slack authorization error: ${error}`);
        }

        if (!code || state !== 'nox_onboarding') {
          throw new Error('Invalid authorization response from Slack');
        }

        // Send the authorization code to our backend
        const response = await fetch('/api/slack/auth-callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to complete Slack integration');
        }

        const data = await response.json();
        setIntegrationData(data);
        setStatus('success');

        toast({
          title: "Intégration réussie !",
          description: "NOX a été ajouté à votre workspace Slack avec succès.",
        });
      } catch (error) {
        console.error('Slack integration error:', error);
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
        setStatus('error');
        
        toast({
          title: "Erreur d'intégration",
          description: "Impossible de finaliser l'intégration Slack. Veuillez réessayer.",
          variant: "destructive",
        });
      }
    };

    handleSlackCallback();
  }, [toast]);

  const nextSteps = [
    {
      icon: MessageSquare,
      title: "Tester NOX",
      description: "Tapez @NOX dans un canal pour commencer à interagir",
      action: "Aller sur Slack"
    },
    {
      icon: CheckCircle,
      title: "Former l'équipe",
      description: "Partagez les bonnes pratiques d'utilisation de NOX",
      action: "Guide d'utilisation"
    },
    {
      icon: ArrowRight,
      title: "Cas d'usage avancés",
      description: "Découvrez toutes les capacités de NOX",
      action: "Documentation"
    }
  ];

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Finalisation de l'intégration...
            </h2>
            <p className="text-gray-600">
              Configuration de NOX dans votre workspace Slack en cours.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Erreur d'intégration
            </h2>
            <p className="text-gray-600 mb-4">
              {errorMessage || 'Une erreur inattendue s\'est produite lors de l\'intégration.'}
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => setLocation('/onboarding')}
                className="w-full"
              >
                Réessayer l'intégration
              </Button>
              <Button 
                variant="outline"
                onClick={() => setLocation('/')}
                className="w-full"
              >
                Retour à l'accueil
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            NOX est maintenant intégré à votre équipe !
          </h1>
          <p className="text-lg text-gray-600">
            L'intégration Slack s'est terminée avec succès. NOX est prêt à collaborer.
          </p>
        </div>

        {/* Integration Summary */}
        <Card className="mb-8 bg-white shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src="https://randomuser.me/api/portraits/men/32.jpg" alt="NOX" />
                    <AvatarFallback>NOX</AvatarFallback>
                  </Avatar>
                  <Slack className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Intégration terminée</CardTitle>
                  <CardDescription>
                    {integrationData?.team_name && `Workspace: ${integrationData.team_name}`}
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Actif
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Permissions accordées :</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Lecture des canaux
                </div>
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Envoi de messages
                </div>
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Réponse aux mentions
                </div>
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Messages privés
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Prochaines étapes</CardTitle>
            <CardDescription>
              Commencez à utiliser NOX dès maintenant dans votre workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              {nextSteps.map((step, index) => (
                <div key={index} className="text-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <step.icon className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-2">{step.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{step.description}</p>
                  <Button variant="outline" size="sm" className="w-full">
                    {step.action}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Usage Examples */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Comment utiliser NOX dans Slack
            </CardTitle>
            <CardDescription>
              Exemples de commandes pour commencer immédiatement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border">
                <p className="font-mono text-sm text-gray-700 mb-2">
                  <span className="text-blue-600">@NOX</span> salut ! Peux-tu te présenter à l'équipe ?
                </p>
                <Badge variant="outline" className="text-xs">Commande de test</Badge>
              </div>
              
              <div className="bg-white rounded-lg p-4 border">
                <p className="font-mono text-sm text-gray-700 mb-2">
                  <span className="text-blue-600">@NOX</span> le serveur web répond lentement, peux-tu diagnostiquer ?
                </p>
                <Badge variant="outline" className="text-xs">Diagnostic de problème</Badge>
              </div>
              
              <div className="bg-white rounded-lg p-4 border">
                <p className="font-mono text-sm text-gray-700 mb-2">
                  <span className="text-blue-600">@NOX</span> aide-moi à planifier la migration vers Kubernetes
                </p>
                <Badge variant="outline" className="text-xs">Planification projet</Badge>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Button 
                onClick={() => window.open(integrationData?.team_url || 'https://slack.com', '_blank')}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Slack className="w-4 h-4 mr-2" />
                Ouvrir Slack et tester NOX
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}