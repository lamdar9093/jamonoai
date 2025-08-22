import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Zap, Clock, Users, CheckCircle, ArrowRight } from "lucide-react";
import ChatModal from "@/components/chat-modal";
import { Agent } from "@shared/schema";

export default function NoxDemo() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  // NOX agent data for demo
  const noxAgent: Agent = {
    id: 1,
    name: "NOX",
    title: "DevOps Senior • Collègue numérique 24/7",
    bio: "Collègue DevOps autonome et fiable. Toujours disponible pour diagnostiquer, résoudre et optimiser votre infrastructure. Agit comme un membre senior de l'équipe avec 8+ ans d'expérience.",
    avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg",
    skills: ["Docker", "Kubernetes", "Jenkins", "AWS", "CI/CD", "Terraform", "Ansible", "Monitoring", "Troubleshooting"],
    rating: 98,
    isOnline: true,
    systemPrompt: "",
    createdAt: new Date()
  };

  const exampleScenarios = [
    {
      title: "Diagnostic d'incident",
      description: "Notre serveur de production est lent depuis ce matin",
      example: "@NOX, le serveur web principal répond lentement depuis 9h. Peux-tu diagnostiquer le problème ?",
      type: "urgent"
    },
    {
      title: "Planification technique",
      description: "Organiser une migration vers Kubernetes",
      example: "NOX, peux-tu me préparer un plan de migration de nos apps Docker vers K8s pour le trimestre ?",
      type: "planning"
    },
    {
      title: "Post-mortem automatique",
      description: "Génération de rapport après incident",
      example: "NOX, génère un post-mortem pour la panne Redis d'hier entre 14h-15h30",
      type: "documentation"
    },
    {
      title: "Collaboration équipe",
      description: "Répondre aux mentions dans les discussions",
      example: "@NOX que penses-tu de cette architecture microservices pour le nouveau projet ?",
      type: "collaboration"
    }
  ];

  const features = [
    {
      icon: Clock,
      title: "Disponible 24/7",
      description: "Toujours en ligne, répond instantanément à vos demandes techniques"
    },
    {
      icon: Zap,
      title: "Réponses proactives",
      description: "Propose des solutions concrètes et prend des initiatives dans son domaine"
    },
    {
      icon: Users,
      title: "Collaboration naturelle",
      description: "Agit comme un collègue senior, comprend le contexte et les enjeux business"
    },
    {
      icon: CheckCircle,
      title: "Mémoire contextuelle",
      description: "Se souvient de vos conversations et du contexte de vos projets"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            NOX • Votre collègue DevOps numérique
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Un agent IA qui agit comme un véritable membre senior de votre équipe DevOps. 
            Toujours disponible, autonome et orienté résultats.
          </p>
        </div>

        {/* NOX Profile Card */}
        <Card className="mb-12 bg-white shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={noxAgent.avatarUrl} alt="NOX" />
                  <AvatarFallback>NOX</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl text-gray-900">{noxAgent.name}</CardTitle>
                  <CardDescription className="text-lg">{noxAgent.title}</CardDescription>
                  <div className="flex items-center mt-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-green-600 font-medium">En ligne</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-600">{noxAgent.rating}%</div>
                <div className="text-sm text-gray-500">Taux de satisfaction</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">{noxAgent.bio}</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {noxAgent.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="bg-blue-100 text-blue-800">
                  {skill}
                </Badge>
              ))}
            </div>
            <Button 
              onClick={() => setIsChatOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white"
              size="lg"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Commencer à discuter avec NOX
            </Button>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="bg-white">
              <CardContent className="p-6 text-center">
                <feature.icon className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Example Scenarios */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900">Exemples d'utilisation</CardTitle>
            <CardDescription>
              Voici comment interagir avec NOX dans différents contextes professionnels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {exampleScenarios.map((scenario, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{scenario.title}</h4>
                    <Badge 
                      variant="outline" 
                      className={
                        scenario.type === "urgent" ? "border-red-200 text-red-700" :
                        scenario.type === "planning" ? "border-blue-200 text-blue-700" :
                        scenario.type === "documentation" ? "border-green-200 text-green-700" :
                        "border-purple-200 text-purple-700"
                      }
                    >
                      {scenario.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{scenario.description}</p>
                  <div className="bg-white border rounded p-3">
                    <p className="text-sm font-mono text-gray-700">{scenario.example}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-3 text-red-600 hover:text-red-700"
                    onClick={() => setIsChatOpen(true)}
                  >
                    Tester cet exemple
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <Card className="bg-gradient-to-r from-red-600 to-red-700 text-white">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Prêt à travailler avec NOX ?</h3>
              <p className="text-red-100 mb-6 max-w-2xl mx-auto">
                Intégrez NOX à votre équipe dès maintenant et bénéficiez d'un collègue DevOps 
                senior disponible 24/7 pour optimiser votre infrastructure.
              </p>
              <Button 
                onClick={() => setIsChatOpen(true)}
                className="bg-white text-red-600 hover:bg-gray-100"
                size="lg"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Démarrer une conversation
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Chat Modal */}
      {isChatOpen && (
        <ChatModal
          agent={noxAgent}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </div>
  );
}