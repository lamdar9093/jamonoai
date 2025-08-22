import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Agent } from "@shared/schema";
import SearchBar from "@/components/search-bar";
import AgentCard from "@/components/agent-card";
import CategoryCard from "@/components/category-card";
import SlackCallbackHandler from "@/components/slack-callback-handler";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  Server,
  Cloud,
  CodeSquare,
  ShieldCheck,
  Database,
  Brain,
  Search,
  MessageSquare,
  Handshake
} from "lucide-react";

export default function Home() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [slackIntegrationSuccess, setSlackIntegrationSuccess] = useState(false);
  
  // Fetch featured agents
  const { data: agents, isLoading: isLoadingAgents } = useQuery<Agent[]>({
    queryKey: ["/api/agents/featured"],
  });
  
  // Callback pour Slack integration
  const handleSlackAuthSuccess = (workspaceName: string, agentName: string) => {
    setSlackIntegrationSuccess(true);
    toast({
      title: "Intégration Slack réussie",
      description: `L'agent ${agentName} a été connecté avec succès à votre workspace Slack (${workspaceName}).`,
    });
  };

  // Handle search from hero section
  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  // Categories data
  const categories = [
    {
      name: "DevOps",
      icon: <Server className="w-6 h-6" />,
      bgColor: "bg-red-100",
      iconColor: "text-[#E53E3E]",
      href: "/search?category=devops",
    },
    {
      name: "Cloud",
      icon: <Cloud className="w-6 h-6" />,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-500",
      href: "/search?category=cloud",
    },
    {
      name: "Programming",
      icon: <CodeSquare className="w-6 h-6" />,
      bgColor: "bg-green-100",
      iconColor: "text-green-500",
      href: "/search?category=programming",
    },
    {
      name: "Security",
      icon: <ShieldCheck className="w-6 h-6" />,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-500",
      href: "/search?category=security",
    },
    {
      name: "Database",
      icon: <Database className="w-6 h-6" />,
      bgColor: "bg-yellow-100",
      iconColor: "text-yellow-500",
      href: "/search?category=database",
    },
    {
      name: "AI",
      icon: <Brain className="w-6 h-6" />,
      bgColor: "bg-indigo-100",
      iconColor: "text-indigo-500",
      href: "/search?category=ai",
    },
  ];

  // How it works steps
  const howItWorksSteps = [
    {
      title: "1. Découvrir",
      description: "Explorez notre catalogue d'agents IA spécialisés selon vos besoins techniques",
      icon: <Search className="text-2xl" />,
    },
    {
      title: "2. Tester",
      description: "Dialoguez gratuitement avec les agents pour évaluer leur expertise",
      icon: <MessageSquare className="text-2xl" />,
    },
    {
      title: "3. Intégrer",
      description: "Ajoutez vos collègues virtuels directement dans votre workspace Slack",
      icon: <Handshake className="text-2xl" />,
    },
  ];

  // Testimonial data
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "DevOps Lead",
      content: "NOX has completely transformed our deployment pipeline. What used to take days now happens in minutes, and the quality of the infrastructure code is outstanding.",
      rating: 5,
      avatarUrl: "https://randomuser.me/api/portraits/women/32.jpg",
    },
    {
      name: "Michael Chen",
      role: "CTO, TechStart",
      content: "ATLAS designed our entire cloud architecture in days, not months. The cost savings alone paid for the subscription ten times over. Exceptional problem-solving skills.",
      rating: 5,
      avatarUrl: "https://randomuser.me/api/portraits/men/42.jpg",
    },
    {
      name: "Amanda Rodriguez",
      role: "IT Manager",
      content: "CIRRUS helped us identify and patch critical security vulnerabilities in our system. The 24/7 availability means we can get help even during off-hours emergencies.",
      rating: 5,
      avatarUrl: "https://randomuser.me/api/portraits/women/85.jpg",
    },
  ];

  return (
    <>
      {/* Gestionnaire de callback Slack */}
      <SlackCallbackHandler 
        onAuthSuccess={handleSlackAuthSuccess}
        onAuthFailure={(error) => toast({
          title: "Erreur d'intégration Slack",
          description: error,
          variant: "destructive"
        })}
      />
      {/* Hero Section */}
      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold text-slate-800 sm:text-5xl sm:tracking-tight lg:text-6xl">
            AI Agents Network
          </h1>
          <p className="mt-4 max-w-xl mx-auto text-xl text-gray-500">
            Intégrez une main d'œuvre numérique spécialisée pour transformer vos équipes
          </p>
          
          {/* Call to Action Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="max-w-xl w-full">
              <SearchBar large onSearch={handleSearch} />
            </div>
          </div>
          
          {/* Onboarding CTA */}
          <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Intégrez une main d'œuvre numérique à votre équipe maintenant
            </h3>
            <p className="text-gray-600 mb-4">
              Ajoutez un agent directement dans votre workspace Slack et commencez à collaborer avec votre nouveau collègue virtuel.
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => navigate('/onboarding')}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                Commencer l'onboarding
              </button>
              <button 
                onClick={() => navigate('/nox-demo')}
                className="bg-white text-purple-600 px-6 py-3 rounded-lg font-medium border border-purple-600 hover:bg-purple-50 transition-colors"
              >
                Voir NOX en action
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories Section */}
      <section className="py-12 bg-gray-50" id="categories">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Popular Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <CategoryCard
                key={index}
                name={category.name}
                icon={category.icon}
                bgColor={category.bgColor}
                iconColor={category.iconColor}
                href={category.href}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Agents Section */}
      <section className="py-12 bg-white" id="explore">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Featured Agents</h2>
            <a 
              href="/search" 
              className="text-[#E53E3E] hover:text-red-700 text-sm font-medium"
            >
              View all <span aria-hidden="true">→</span>
            </a>
          </div>

          {/* Agent Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoadingAgents
              ? Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 p-6">
                    <div className="flex items-start">
                      <Skeleton className="h-16 w-16 rounded-full mr-4" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-16 w-full mt-4" />
                    <div className="flex mt-4 gap-2">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                    <div className="flex justify-between mt-6">
                      <Skeleton className="h-10 w-24 rounded-md" />
                      <Skeleton className="h-10 w-24 rounded-md" />
                    </div>
                  </div>
                ))
              : agents?.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
            
            {!isLoadingAgents && (!agents || agents.length === 0) && (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No agents found. Check back later!</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-800">How It Works</h2>
            <p className="mt-4 text-lg text-gray-500">
              Connect with specialized AI agents in just three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorksSteps.map((step, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm text-center">
                <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <div className="text-[#E53E3E]">{step.icon}</div>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-800">What Our Users Say</h2>
            <p className="mt-4 text-lg text-gray-500">
              Discover how AI agents are transforming technical workflows
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full overflow-hidden">
                    <img
                      src={testimonial.avatarUrl}
                      alt={`${testimonial.name} avatar`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold text-slate-800">{testimonial.name}</h4>
                    <p className="text-gray-500 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-600">{testimonial.content}</p>
                <div className="mt-4 flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#E53E3E] py-16" id="pricing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Ready to transform your workflow?
          </h2>
          <p className="mt-4 text-xl text-red-100 max-w-2xl mx-auto">
            Connect with AI agents that specialize in your technical needs
          </p>
          <div className="mt-8 flex justify-center gap-4 flex-wrap">
            <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-[#E53E3E] bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#E53E3E] focus:ring-white">
              Get Started for Free
            </button>
            <button className="inline-flex items-center px-6 py-3 border border-white text-base font-medium rounded-md text-white bg-[#E53E3E] hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#E53E3E] focus:ring-white">
              View Pricing
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
