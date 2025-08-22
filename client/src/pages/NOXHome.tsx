import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SlackCallbackHandler from "@/components/slack-callback-handler";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  Bot,
  Zap,
  Container,
  Settings,
  Cloud,
  Monitor,
  Shield,
  Code,
  Users,
  ArrowRight,
  CheckCircle,
  Star,
  MessageSquare,
  Slack,
  Cog,
  Server,
  Building,
  User
} from "lucide-react";

export default function NOXHome() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [slackIntegrationSuccess, setSlackIntegrationSuccess] = useState(false);
  
  // Callback pour Slack integration
  const handleSlackAuthSuccess = (workspaceName: string, agentName: string) => {
    setSlackIntegrationSuccess(true);
    toast({
      title: "Intégration Slack réussie",
      description: `NOX a été connecté avec succès à votre workspace Slack (${workspaceName}).`,
    });
  };

  const handleGetStarted = () => {
    navigate('/onboarding');
  };

  const handleViewDemo = () => {
    navigate('/nox-demo');
  };

  const handleViewPlatform = () => {
    navigate('/platform-demo');
  };
  
  const setLocation = navigate;

  const noxCapabilities = [
    {
      icon: Container,
      title: "Conteneurisation",
      description: "Docker, Kubernetes, orchestration complète",
      examples: ["Debug pods K8s", "Optimiser images Docker", "Helm charts"]
    },
    {
      icon: Settings,
      title: "CI/CD Automation",
      description: "Pipelines et déploiements automatisés",
      examples: ["Jenkins troubleshooting", "GitLab CI optimisation", "GitHub Actions"]
    },
    {
      icon: Cloud,
      title: "Cloud Infrastructure", 
      description: "AWS, GCP, Azure, Infrastructure as Code",
      examples: ["Terraform configs", "Cloud cost optimization", "Auto-scaling"]
    },
    {
      icon: Monitor,
      title: "Monitoring & Alertes",
      description: "Surveillance proactive et diagnostics",
      examples: ["Setup Prometheus", "Grafana dashboards", "Log analysis"]
    },
    {
      icon: Shield,
      title: "Security & Compliance",
      description: "Sécurité DevOps et gestion des secrets",
      examples: ["Vault setup", "Security scanning", "RBAC configs"]
    },
    {
      icon: Code,
      title: "Automation Scripts",
      description: "Scripts et automatisation infrastructure",
      examples: ["Ansible playbooks", "Python automation", "Bash scripts"]
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "DevOps Lead",
      company: "TechCorp",
      content: "NOX a résolu notre problème Kubernetes en 5 minutes. Impressionnant !",
      rating: 5
    },
    {
      name: "Marcus Johnson", 
      role: "CTO",
      company: "StartupXYZ",
      content: "Comme avoir un DevOps Senior disponible 24/7. Game changer.",
      rating: 5
    },
    {
      name: "Elena Rodriguez",
      role: "Platform Engineer", 
      company: "CloudScale",
      content: "Les scripts de NOX sont production-ready. Gain de temps énorme.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <SlackCallbackHandler 
        onAuthSuccess={handleSlackAuthSuccess}
        onAuthFailure={(error) => {
          toast({
            title: "Erreur d'intégration Slack",
            description: error,
            variant: "destructive",
          });
        }}
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Content */}
            <div>
              <div className="flex items-center mb-6">
                <div className="bg-white/20 rounded-full p-3 mr-4">
                  <Bot className="h-8 w-8" />
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  Main d'œuvre numérique • Agent As a Service
                </Badge>
              </div>
              
              <h1 className="text-5xl font-bold mb-6 leading-tight">
                Votre main-d'œuvre IA,
                <span className="block text-blue-200">prête à l'emploi</span>
              </h1>
              
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Une plateforme SaaS de nouvelle génération mettant à votre disposition des agents IA spécialisés, 
                entraînés par métier et intégrables directement dans vos outils, vos équipes et vos flux de travail.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleViewPlatform}
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-gray-100 font-semibold"
                >
                  <Users className="mr-2 h-5 w-5" />
                  Découvrir la plateforme
                </Button>
                <Button 
                  onClick={() => setLocation('/account-type')}
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-blue-50 border-0 font-semibold"
                >
                  <ArrowRight className="mr-2 h-5 w-5" />
                  Créer un espace
                </Button>
              </div>
              
              <div className="flex items-center mt-8 space-x-6">
                <div className="flex items-center">
                  <div className="flex -space-x-2">
                    <Avatar className="h-8 w-8 border-2 border-white">
                      <AvatarImage src="https://randomuser.me/api/portraits/women/44.jpg" />
                      <AvatarFallback>SC</AvatarFallback>
                    </Avatar>
                    <Avatar className="h-8 w-8 border-2 border-white">
                      <AvatarImage src="https://randomuser.me/api/portraits/men/85.jpg" />
                      <AvatarFallback>MJ</AvatarFallback>
                    </Avatar>
                    <Avatar className="h-8 w-8 border-2 border-white">
                      <AvatarImage src="https://randomuser.me/api/portraits/women/67.jpg" />
                      <AvatarFallback>ER</AvatarFallback>
                    </Avatar>
                  </div>
                  <span className="ml-3 text-blue-100">Utilisé par 500+ équipes</span>
                </div>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="ml-2 text-blue-100">4.9/5</span>
                </div>
              </div>
            </div>

            {/* Right Content - Agent Example */}
            <div className="lg:pl-8">
              <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0">
                <CardHeader className="pb-4">
                  <div className="text-center mb-4">
                    <Badge className="bg-green-100 text-green-700 border-green-200 mb-2">
                      Agent Disponible Maintenant
                    </Badge>
                    <h3 className="text-lg font-semibold text-slate-900">Exemple d'agent</h3>
                  </div>
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
                        DevOps Senior • Spécialiste Infrastructure
                      </CardDescription>
                      <div className="flex items-center mt-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          Prêt à l'emploi
                        </Badge>
                        <Badge variant="outline" className="ml-2">
                          98/100
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Compétences principales</h4>
                    <div className="flex flex-wrap gap-2">
                      {["Docker", "Kubernetes", "Jenkins", "AWS", "Terraform", "Ansible"].map((skill) => (
                        <Badge key={skill} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-600 italic">
                      "8+ ans d'expérience DevOps. Je diagnostique, résous et optimise votre infrastructure 
                      comme un collègue expérimenté. Disponible 24/7 sur Slack."
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* NOX Introduction Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 mb-4">
              Premier agent disponible
            </Badge>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Découvrez NOX, votre spécialiste DevOps
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              NOX exemplifie la puissance de notre plateforme Agent As a Service. 
              Un expert DevOps avec 8+ ans d'expérience, prêt à intégrer votre équipe immédiatement.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-6">
                Un collègue DevOps autonome et fiable
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-slate-900">Intégration Slack native</h4>
                    <p className="text-slate-600 text-sm">S'intègre directement dans vos canaux de travail existants</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-slate-900">Disponibilité 24/7</h4>
                    <p className="text-slate-600 text-sm">Répond aux urgences et gère les incidents en continu</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-slate-900">Expertise métier approfondie</h4>
                    <p className="text-slate-600 text-sm">Formé sur les meilleures pratiques DevOps modernes</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <Button 
                  onClick={handleGetStarted}
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <ArrowRight className="mr-2 h-5 w-5" />
                  Déployer NOX maintenant
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-6">
                Domaines d'expertise
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {noxCapabilities.slice(0, 6).map((capability, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="bg-blue-100 rounded-lg p-2 flex-shrink-0">
                      <capability.icon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">{capability.title}</h4>
                      <p className="text-slate-600 text-xs">{capability.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Comment NOX peut vous aider :</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Diagnostiquer et résoudre les incidents de production</li>
                  <li>• Optimiser vos pipelines CI/CD existants</li>
                  <li>• Auditer votre sécurité cloud et infrastructure</li>
                  <li>• Automatiser vos déploiements et monitoring</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Agent Excellence Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Excellence des agents Jamono
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Chaque agent Jamono est conçu pour exceller dans son domaine de spécialisation, 
              offrant une expertise de niveau senior dans votre équipe.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* NOX - Available */}
            <Card className="relative border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
              <CardContent className="p-8 text-center">
                <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                  <Cog className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">NOX</h3>
                <p className="text-slate-600 mb-4">Expert DevOps & Infrastructure</p>
                <Badge className="bg-green-100 text-green-700 border-green-200 mb-4">
                  Disponible maintenant
                </Badge>
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center justify-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    <span>8+ ans d'expérience</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    <span>Intégration immédiate</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ATLAS - Coming Soon */}
            <Card className="relative border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white opacity-75">
              <CardContent className="p-8 text-center">
                <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                  <Cloud className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">ATLAS</h3>
                <p className="text-gray-500 mb-4">Architecte Cloud Senior</p>
                <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-300 mb-4">
                  Version Future
                </Badge>
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center justify-center">
                    <Star className="h-4 w-4 text-gray-400 mr-1" />
                    <span>Architectures multi-cloud</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-gray-400 mr-1" />
                    <span>Optimisation coûts</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CIRRUS - Coming Soon */}
            <Card className="relative border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white opacity-75">
              <CardContent className="p-8 text-center">
                <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                  <Server className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">CIRRUS</h3>
                <p className="text-gray-500 mb-4">Administrateur Systèmes</p>
                <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-300 mb-4">
                  Version Future
                </Badge>
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center justify-center">
                    <Star className="h-4 w-4 text-gray-400 mr-1" />
                    <span>Administration serveurs</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-gray-400 mr-1" />
                    <span>Sécurité infrastructure</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-blue-50 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              Pourquoi choisir les agents Jamono ?
            </h3>
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-3">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-slate-900 mb-2">Expertise Senior</h4>
                <p className="text-sm text-slate-600">Chaque agent possède l'expérience d'un expert senior dans son domaine</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-3">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-slate-900 mb-2">Disponibilité 24/7</h4>
                <p className="text-sm text-slate-600">Vos agents travaillent en continu, sans pause ni congés</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-3">
                  <Slack className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-slate-900 mb-2">Intégration Native</h4>
                <p className="text-sm text-slate-600">S'intègrent directement dans vos outils de travail existants</p>
              </div>
            </div>
            <p className="text-slate-600 mb-6">
              Commencez dès aujourd'hui avec NOX et découvrez la révolution de la main d'œuvre numérique.
            </p>
            <Button 
              onClick={handleViewPlatform}
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700"
            >
              <ArrowRight className="mr-2 h-5 w-5" />
              Découvrir tous les agents
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-xl text-slate-600">
              Intégration simple en 3 étapes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="bg-blue-600 rounded-full p-6 w-20 h-20 mx-auto mb-6">
                <Slack className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                1. Connexion Slack
              </h3>
              <p className="text-slate-600">
                Autorisez NOX à rejoindre votre workspace Slack en un clic
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-600 rounded-full p-6 w-20 h-20 mx-auto mb-6">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                2. Intégration équipe
              </h3>
              <p className="text-slate-600">
                NOX rejoint vos canaux comme un nouveau membre de l'équipe
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-600 rounded-full p-6 w-20 h-20 mx-auto mb-6">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                3. Support immédiat
              </h3>
              <p className="text-slate-600">
                Mentionnez @NOX ou envoyez un DM pour obtenir une aide DevOps immédiate
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Ce que disent nos utilisateurs
            </h2>
            <p className="text-xl text-slate-600">
              Retours d'équipes qui utilisent NOX quotidiennement
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 mb-4 italic">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-slate-900">{testimonial.name}</div>
                      <div className="text-sm text-slate-600">{testimonial.role} • {testimonial.company}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Vision Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 mb-4">
              Vision Plateforme Jamono
            </Badge>
            <h2 className="text-4xl font-bold text-slate-900 mb-6">
              L'avenir de la main d'œuvre numérique
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
              NOX n'est que le début. Jamono développe un écosystème complet d'agents spécialisés 
              pour révolutionner chaque aspect de votre organisation.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
            <Card className="text-center p-6 border-2 border-green-200 bg-white">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                <Cog className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">NOX</h3>
              <p className="text-sm text-slate-600 mb-3">DevOps & Infrastructure</p>
              <Badge className="bg-green-100 text-green-700 border-green-200">Disponible</Badge>
            </Card>
            
            <Card className="text-center p-6 border-2 border-gray-200 bg-gray-50">
              <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                <Cloud className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-500 mb-2">ATLAS</h3>
              <p className="text-sm text-gray-400 mb-3">Cloud Architecture</p>
              <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-300">Version Future</Badge>
            </Card>
            
            <Card className="text-center p-6 border-2 border-gray-200 bg-gray-50">
              <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                <Server className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-500 mb-2">CIRRUS</h3>
              <p className="text-sm text-gray-400 mb-3">System Administration</p>
              <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-300">Version Future</Badge>
            </Card>
          </div>
          
          <div className="text-center">
            <Button 
              onClick={handleViewPlatform}
              size="lg" 
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <ArrowRight className="mr-2 h-5 w-5" />
              Découvrir la plateforme complète
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Prêt à démarrer votre révolution numérique ?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Commencez avec NOX et découvrez la puissance d'une main d'œuvre IA spécialisée, 
            disponible 24/7 dans votre workspace Slack.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleGetStarted}
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100 font-semibold"
            >
              <Slack className="mr-2 h-5 w-5" />
              Déployer NOX maintenant
            </Button>
            <Button 
              onClick={handleViewPlatform}
              variant="outline" 
              size="lg"
              className="border-white text-white hover:bg-white/10"
            >
              <Users className="mr-2 h-5 w-5" />
              Explorer la plateforme
            </Button>
          </div>
          
          <p className="text-blue-200 mt-6 text-sm">
            Intégration gratuite • Support 24/7 • Révolution immédiate
          </p>
        </div>
      </section>
    </div>
  );
}