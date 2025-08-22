import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocation } from "wouter";
import {
  Bot,
  Cloud,
  Database,
  Wrench,
  CheckCircle,
  Clock,
  ArrowRight,
  Zap,
  Users,
  Briefcase
} from "lucide-react";

export default function PlatformDemo() {
  const [, navigate] = useLocation();

  const { data: agents = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/agents/all"],
  });

  const handleGetNOX = () => {
    navigate('/onboarding');
  };

  const getAgentIcon = (agentName: string) => {
    switch (agentName) {
      case 'NOX': return Wrench;
      case 'ATLAS': return Cloud;
      case 'CIRRUS': return Database;
      default: return Bot;
    }
  };

  const getAgentStatus = (agentName: string) => {
    return agentName === 'NOX' ? 'available' : 'future';
  };

  const getAgentBadge = (agentName: string) => {
    if (agentName === 'NOX') {
      return <Badge className="bg-green-100 text-green-700 border-green-200">Disponible</Badge>;
    }
    return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-300">Version Future</Badge>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la plateforme...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white/20 rounded-full p-4">
                <Users className="h-12 w-12" />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold mb-4">
              Jamono • Agent As a Service
            </h1>
            <p className="text-xl text-blue-100 mb-6 max-w-3xl mx-auto">
              La révolution de la main d'œuvre numérique. Des agents spécialisés prêts à l'emploi pour transformer votre équipe avec des compétences expertes disponibles 24/7.
            </p>
            
            <div className="flex items-center justify-center space-x-8 text-blue-100">
              <div className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                <span>Déploiement instantané</span>
              </div>
              <div className="flex items-center">
                <Briefcase className="h-5 w-5 mr-2" />
                <span>Expertise professionnelle</span>
              </div>
              <div className="flex items-center">
                <Bot className="h-5 w-5 mr-2" />
                <span>Agents spécialisés</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Agents Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Notre Main d'Œuvre Numérique
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Chaque agent est un spécialiste dans son domaine, prêt à intégrer votre équipe et à apporter son expertise immédiatement.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {(agents as any[]).map((agent: any) => {
              const IconComponent = getAgentIcon(agent.name);
              const status = getAgentStatus(agent.name);
              const isAvailable = status === 'available';
              
              return (
                <Card key={agent.id} className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg border-2 ${
                  isAvailable ? 'border-green-200 bg-white' : 'border-gray-200 bg-gray-50/50'
                }`}>
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className={`relative p-4 rounded-full ${
                        isAvailable ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <IconComponent className={`h-8 w-8 ${
                          isAvailable ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        {isAvailable && (
                          <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                            <CheckCircle className="h-3 w-3 text-white" />
                          </div>
                        )}
                        {!isAvailable && (
                          <div className="absolute -top-1 -right-1 bg-gray-400 rounded-full p-1">
                            <Clock className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-center mb-2">
                      {getAgentBadge(agent.name)}
                    </div>
                    
                    <CardTitle className={`text-xl ${
                      isAvailable ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {agent.name}
                    </CardTitle>
                    <CardDescription className={`text-sm ${
                      isAvailable ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {agent.title}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <p className={`text-sm mb-4 ${
                      isAvailable ? 'text-gray-700' : 'text-gray-500'
                    }`}>
                      {agent.bio}
                    </p>
                    
                    <div className="flex flex-wrap gap-1 mb-4">
                      {agent.skills?.slice(0, 4).map((skill: string, index: number) => (
                        <Badge key={index} variant="outline" className={`text-xs ${
                          isAvailable ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-500 border-gray-300'
                        }`}>
                          {skill}
                        </Badge>
                      ))}
                      {agent.skills?.length > 4 && (
                        <Badge variant="outline" className={`text-xs ${
                          isAvailable ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-500 border-gray-300'
                        }`}>
                          +{agent.skills.length - 4}
                        </Badge>
                      )}
                    </div>
                    
                    {isAvailable ? (
                      <Button 
                        onClick={handleGetNOX}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        <ArrowRight className="mr-2 h-4 w-4" />
                        Déployer maintenant
                      </Button>
                    ) : (
                      <Button 
                        disabled
                        variant="outline"
                        className="w-full border-gray-300 text-gray-500"
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        Bientôt disponible
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Prêt à Révolutionner Votre Équipe ?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Commencez avec NOX, notre agent DevOps Senior, et découvrez la puissance de la main d'œuvre numérique.
          </p>
          
          <Button 
            onClick={handleGetNOX}
            size="lg"
            className="bg-white text-blue-600 hover:bg-gray-100 font-semibold"
          >
            <ArrowRight className="mr-2 h-5 w-5" />
            Démarrer avec NOX
          </Button>
        </div>
      </section>
    </div>
  );
}