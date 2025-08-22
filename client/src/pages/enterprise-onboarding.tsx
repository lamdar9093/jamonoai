import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { 
  Building2, 
  CheckCircle, 
  Rocket, 
  Users, 
  Settings, 
  Shield,
  ArrowRight,
  Mail,
  Globe
} from "lucide-react";

const onboardingSchema = z.object({
  companyName: z.string().min(2, "Le nom de l'entreprise est requis"),
  domain: z.string().optional(),
  adminEmail: z.string().email("Email invalide"),
  adminName: z.string().min(2, "Le nom de l'administrateur est requis"),
  planType: z.enum(["starter", "professional", "enterprise"]).default("starter"),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const steps: OnboardingStep[] = [
  {
    id: 1,
    title: "Informations entreprise",
    description: "Configuration de base de votre organisation",
    icon: <Building2 className="h-5 w-5" />
  },
  {
    id: 2,
    title: "Plan et fonctionnalités",
    description: "Choisissez le plan adapté à vos besoins",
    icon: <Rocket className="h-5 w-5" />
  },
  {
    id: 3,
    title: "Administrateur",
    description: "Création du compte administrateur",
    icon: <Users className="h-5 w-5" />
  },
  {
    id: 4,
    title: "Finalisation",
    description: "Création de votre espace tenant",
    icon: <CheckCircle className="h-5 w-5" />
  }
];

const planFeatures = {
  starter: {
    name: "Starter",
    price: "Gratuit",
    maxUsers: 5,
    maxAgents: 1,
    features: [
      "1 agent NOX DevOps",
      "5 utilisateurs max",
      "Intégrations de base (Slack, Jira)",
      "Support communauté"
    ]
  },
  professional: {
    name: "Professional", 
    price: "49€/mois",
    maxUsers: 25,
    maxAgents: 3,
    features: [
      "3 agents (NOX + futurs ATLAS, CIRRUS)",
      "25 utilisateurs",
      "Toutes les intégrations",
      "Support prioritaire",
      "Zones d'action avancées",
      "Permissions granulaires"
    ]
  },
  enterprise: {
    name: "Enterprise",
    price: "Sur mesure",
    maxUsers: "Illimité",
    maxAgents: "Tous",
    features: [
      "Agents illimités",
      "Utilisateurs illimités",
      "Intégrations personnalisées",
      "Support dédié 24/7",
      "SLA garanti",
      "Déploiement on-premise"
    ]
  }
};

export default function EnterpriseOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      companyName: "",
      domain: "",
      adminEmail: "",
      adminName: "",
      planType: "starter",
    },
  });

  const createTenantMutation = useMutation({
    mutationFn: async (data: OnboardingFormData) => {
      return await apiRequest('/api/tenants/create', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: (result: any) => {
      toast({
        title: "Tenant créé avec succès !",
        description: `Votre espace ${result.tenant?.name || 'entreprise'} est prêt. Vérifiez votre email pour l'activation.`,
      });
      setCurrentStep(4);
    },
    onError: (error) => {
      toast({
        title: "Erreur création tenant",
        description: "Une erreur est survenue lors de la création de votre espace",
        variant: "destructive",
      });
    },
  });

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: OnboardingFormData) => {
    console.log('Form submitted:', data, 'Current step:', currentStep);
    
    // Validation par étape
    if (currentStep === 1) {
      // Étape 1: Validation des informations entreprise
      if (!data.companyName.trim()) {
        form.setError('companyName', { message: 'Le nom de l\'entreprise est requis' });
        return;
      }
      handleNext();
    } else if (currentStep === 2) {
      // Étape 2: Plan sélectionné, pas de validation supplémentaire
      handleNext();
    } else if (currentStep === 3) {
      // Étape 3: Validation admin et création du tenant
      if (!data.adminName.trim()) {
        form.setError('adminName', { message: 'Le nom de l\'administrateur est requis' });
        return;
      }
      if (!data.adminEmail.trim()) {
        form.setError('adminEmail', { message: 'L\'email administrateur est requis' });
        return;
      }
      createTenantMutation.mutate(data);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de l'entreprise</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Corp" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="domain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domaine (optionnel)</FormLabel>
                  <FormControl>
                    <Input placeholder="acme.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="planType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Choisissez votre plan</FormLabel>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {Object.entries(planFeatures).map(([key, plan]) => (
                      <Card 
                        key={key}
                        className={`cursor-pointer transition-all ${
                          field.value === key ? 'ring-2 ring-primary' : 'hover:shadow-md'
                        }`}
                        onClick={() => field.onChange(key)}
                      >
                        <CardHeader className="text-center">
                          <CardTitle className="text-lg">{plan.name}</CardTitle>
                          <CardDescription className="text-2xl font-bold text-primary">
                            {plan.price}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 mb-4">
                            <p className="text-sm text-muted-foreground">
                              {plan.maxUsers} utilisateurs • {plan.maxAgents} agent(s)
                            </p>
                          </div>
                          <ul className="space-y-2">
                            {plan.features.map((feature, index) => (
                              <li key={index} className="flex items-center text-sm">
                                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="adminName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de l'administrateur</FormLabel>
                  <FormControl>
                    <Input placeholder="Jean Dupont" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="adminEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email administrateur</FormLabel>
                  <FormControl>
                    <Input placeholder="admin@acme.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Un email d'activation sera envoyé à cette adresse pour finaliser la création du compte administrateur.
              </AlertDescription>
            </Alert>
          </div>
        );

      case 4:
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Tenant créé avec succès !</h3>
              <p className="text-muted-foreground mb-4">
                Votre espace Jamono est prêt. Vous pouvez maintenant configurer vos intégrations et déployer NOX.
              </p>
            </div>
            
            <div className="space-y-4">
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  Un email d'activation a été envoyé à votre adresse. Cliquez sur le lien pour finaliser la configuration.
                </AlertDescription>
              </Alert>

              <div className="flex justify-center gap-4">
                <Button 
                  onClick={() => setLocation('/tenant/dashboard')}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Accéder au tableau de bord
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Jamono Enterprise</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Configurez votre espace de travail multi-agent
          </p>
        </div>

        {/* Progress Steps */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${currentStep >= step.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                  }
                `}>
                  {currentStep > step.id ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    step.icon
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    w-20 h-1 mx-4 
                    ${currentStep > step.id ? 'bg-primary' : 'bg-muted'}
                  `} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4">
            {steps.map((step) => (
              <div key={step.id} className="text-center max-w-32">
                <p className="font-medium text-sm">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {steps[currentStep - 1]?.icon}
                {steps[currentStep - 1]?.title}
              </CardTitle>
              <CardDescription>
                {steps[currentStep - 1]?.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {renderStepContent()}
                  
                  {currentStep < 4 && (
                    <div className="flex justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBack}
                        disabled={currentStep === 1}
                      >
                        Précédent
                      </Button>
                      <Button
                        type="submit"
                        disabled={createTenantMutation.isPending}
                      >
                        {createTenantMutation.isPending ? (
                          'Création...'
                        ) : currentStep === 3 ? (
                          'Créer l\'espace'
                        ) : (
                          'Suivant'
                        )}
                      </Button>
                    </div>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}