import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  User, Slack, Github, Server, Zap, 
  CheckCircle, ArrowRight, Bot, Crown,
  CreditCard, Users, Settings
} from "lucide-react";

interface FreelanceOnboardingData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  slackWorkspace?: string;
  planType: 'solo' | 'pro' | 'enterprise';
}

export default function FreelanceOnboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState<FreelanceOnboardingData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    slackWorkspace: '',
    planType: 'solo'
  });

  const updateFormData = (field: keyof FreelanceOnboardingData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const createFreelanceMutation = useMutation({
    mutationFn: async (data: FreelanceOnboardingData) => {
      const response = await fetch('/api/freelance/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur création compte freelance');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Compte freelance créé !",
        description: "Votre espace personnel est prêt. Connectez vos outils !",
      });
      setLocation(`/dashboard`);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur création compte",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const plans = [
    {
      id: 'solo',
      name: 'Solo',
      price: '19€/mois',
      features: [
        '1 utilisateur (vous)',
        'Agent NOX DevOps',
        '3 intégrations max',
        '2 000 actions/mois',
        'Support par email'
      ],
      icon: <User className="h-6 w-6" />,
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '49€/mois',
      features: [
        'Vous + 3 invités ponctuels',
        'NOX + ATLAS (Cloud)',
        '10 intégrations',
        '10 000 actions/mois',
        'Support prioritaire',
        'Rapports détaillés'
      ],
      icon: <Crown className="h-6 w-6" />,
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '99€/mois',
      features: [
        'Utilisateurs illimités',
        'Tous les agents (NOX, ATLAS, CIRRUS)',
        'Intégrations illimitées',
        'Actions illimitées',
        'Support dédié 24/7',
        'SLA garanti'
      ],
      icon: <Settings className="h-6 w-6" />,
      popular: false
    }
  ];

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Créez votre espace freelance</h2>
        <p className="text-muted-foreground">
          Un tenant personnel isolé avec vos outils et agents
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informations personnelles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nom complet</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                placeholder="Jean Dupont"
              />
            </div>
            <div>
              <Label htmlFor="email">Email professionnel</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                placeholder="jean@freelance.dev"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => updateFormData('password', e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirmer mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
            <Alert variant="destructive">
              <AlertDescription>
                Les mots de passe ne correspondent pas
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={() => setStep(2)}
          disabled={!formData.name || !formData.email || !formData.password || formData.password !== formData.confirmPassword}
        >
          Continuer
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choisissez votre plan</h2>
        <p className="text-muted-foreground">
          Sélectionnez le plan adapté à votre activité freelance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card 
            key={plan.id}
            className={`relative cursor-pointer transition-all ${
              formData.planType === plan.id ? 'ring-2 ring-primary' : ''
            } ${plan.popular ? 'border-primary' : ''}`}
            onClick={() => updateFormData('planType', plan.id as any)}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  Recommandé
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                {plan.icon}
              </div>
              <CardTitle>{plan.name}</CardTitle>
              <div className="text-2xl font-bold text-primary">{plan.price}</div>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(1)}>
          Retour
        </Button>
        <Button onClick={() => setStep(3)}>
          Continuer
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Intégrations rapides</h2>
        <p className="text-muted-foreground">
          Connectez vos outils personnels à NOX (optionnel)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Slack className="h-5 w-5" />
            Slack Personnel (Recommandé)
          </CardTitle>
          <CardDescription>
            Votre workspace Slack pour recevoir les notifications NOX
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="slackWorkspace">Workspace Slack (optionnel)</Label>
            <Input
              id="slackWorkspace"
              value={formData.slackWorkspace}
              onChange={(e) => updateFormData('slackWorkspace', e.target.value)}
              placeholder="mon-workspace.slack.com"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Vous pourrez configurer cela plus tard dans votre dashboard
            </p>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Bot className="h-4 w-4" />
        <AlertDescription>
          <strong>Prochaines étapes :</strong> Après création, vous pourrez connecter GitHub, 
          vos clusters K8s, Notion et autres outils depuis votre dashboard personnel.
        </AlertDescription>
      </Alert>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(2)}>
          Retour
        </Button>
        <Button 
          onClick={() => createFreelanceMutation.mutate(formData)}
          disabled={createFreelanceMutation.isPending}
        >
          {createFreelanceMutation.isPending ? 'Création...' : 'Créer mon espace'}
          <CheckCircle className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-2">
            <Zap className="h-8 w-8 text-primary" />
            Jamono Freelance
          </h1>
          <p className="text-xl text-muted-foreground">
            Votre agent DevOps personnel 24/7
          </p>
        </div>

        {/* Progress */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNum ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step > stepNum ? <CheckCircle className="h-4 w-4" /> : stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`w-12 h-0.5 ${step > stepNum ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          Déjà un espace entreprise ? 
          <Button variant="link" onClick={() => setLocation('/sign-in')} className="p-0 ml-1">
            Se connecter
          </Button>
        </div>
      </div>
    </div>
  );
}