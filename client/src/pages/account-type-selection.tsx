import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building, 
  User, 
  ArrowRight, 
  CheckCircle, 
  Users, 
  Shield,
  Zap,
  Bot
} from "lucide-react";

export default function AccountTypeSelection() {
  const [, setLocation] = useLocation();
  const [selectedType, setSelectedType] = useState<'enterprise' | 'individual' | null>(null);

  const accountTypes = [
    {
      id: 'enterprise',
      title: 'Je suis une entreprise',
      subtitle: 'Équipe, organisation, startup',
      icon: <Building className="h-12 w-12 text-blue-600" />,
      description: 'Espace collaboratif avec gestion d\'équipe centralisée',
      features: [
        'Admin entreprise centralise les intégrations',
        'Utilisateurs multiples avec rôles granulaires',
        'Facturation entreprise et gestion budgets',
        'Slack/Teams organisationnel connecté',
        'Clusters K8s, GitHub org, Jira partagés',
        'Rapports et analytics pour toute l\'équipe'
      ],
      useCases: [
        'Équipe DevOps de 5-50+ personnes',
        'Startup avec plusieurs développeurs',
        'DSI qui veut standardiser les outils'
      ],
      ctaText: 'Créer espace entreprise',
      route: '/enterprise/onboard'
    },
    {
      id: 'individual',
      title: 'Je suis un utilisateur individuel',
      subtitle: 'Freelance, consultant, indépendant',
      icon: <User className="h-12 w-12 text-green-600" />,
      description: 'Espace personnel avec contrôle total et outils personnels',
      features: [
        'Vous gérez vos propres intégrations',
        'Slack personnel, GitHub privé/pro',
        'Vos clusters K8s clients isolés',
        'Facturation simple mensuelle',
        'Possibilité d\'inviter clients ponctuellement',
        'Dashboard personnel optimisé'
      ],
      useCases: [
        'DevOps freelance gérant plusieurs clients',
        'Consultant cloud indépendant',
        'Développeur avec projets perso/pro'
      ],
      ctaText: 'Créer espace personnel',
      route: '/freelance/onboard'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <Bot className="h-10 w-10 text-primary" />
            Jamono
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            Agent As a Service - Votre main d'œuvre numérique
          </p>
          <p className="text-lg">
            Choisissez le type d'espace adapté à votre situation
          </p>
        </div>

        {/* Comparaison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {accountTypes.map((type) => (
            <Card 
              key={type.id}
              className={`relative cursor-pointer transition-all duration-300 hover:shadow-lg ${
                selectedType === type.id ? 'ring-2 ring-primary shadow-lg scale-105' : ''
              }`}
              onClick={() => setSelectedType(type.id as any)}
            >
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  {type.icon}
                </div>
                <CardTitle className="text-xl mb-2">{type.title}</CardTitle>
                <CardDescription className="text-base font-medium">
                  {type.subtitle}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <p className="text-muted-foreground text-center">
                  {type.description}
                </p>
                
                {/* Fonctionnalités */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Fonctionnalités incluses
                  </h4>
                  <ul className="space-y-2">
                    {type.features.map((feature, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Cas d'usage */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Parfait pour
                  </h4>
                  <ul className="space-y-1">
                    {type.useCases.map((useCase, index) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        • {useCase}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* CTA */}
                <Button 
                  className="w-full"
                  size="lg"
                  variant={selectedType === type.id ? "default" : "outline"}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocation(type.route);
                  }}
                >
                  {type.ctaText}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
              
              {selectedType === type.id && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Sélectionné
                  </Badge>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Isolation garantie */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Shield className="h-5 w-5" />
              Isolation & Sécurité Garanties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-semibold mb-2">Multi-tenant Strict</h4>
                <p className="text-sm text-muted-foreground">
                  Chaque espace est complètement isolé en base de données
                </p>
              </div>
              
              <div>
                <div className="bg-green-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-semibold mb-2">Intégrations Isolées</h4>
                <p className="text-sm text-muted-foreground">
                  Vos Slack/GitHub/K8s restent dans votre tenant uniquement
                </p>
              </div>
              
              <div>
                <div className="bg-purple-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <Bot className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-semibold mb-2">Agents Dédiés</h4>
                <p className="text-sm text-muted-foreground">
                  NOX n'agit que dans le cadre de votre espace client
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="text-center mt-8">
          <p className="text-muted-foreground mb-4">
            Déjà un compte ? 
            <Button variant="link" onClick={() => setLocation('/sign-in')} className="p-0 ml-1">
              Se connecter
            </Button>
          </p>
          
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/')}
            className="text-muted-foreground"
          >
            ← Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  );
}