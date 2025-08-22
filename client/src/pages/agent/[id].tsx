import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Agent } from "@shared/schema";
import StarRating from "@/components/star-rating";
import SkillBadge from "@/components/skill-badge";
import ChatModal from "@/components/chat-modal";
import HireModal from "@/components/hire-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MessageSquare, Briefcase, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function AgentDetail() {
  const [, params] = useRoute("/agent/:id");
  const agentId = params?.id ? parseInt(params.id) : null;
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);
  const { toast } = useToast();

  // Fetch agent detail
  const { data: agent, isLoading, error } = useQuery<Agent>({
    queryKey: [`/api/agents/${agentId}`],
    enabled: !!agentId,
  });

  // Error handling
  if (error) {
    toast({
      title: "Error",
      description: "Failed to load agent details. Please try again.",
      variant: "destructive",
    });
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center mb-6">
          <Skeleton className="h-10 w-10 rounded-full mr-3" />
          <Skeleton className="h-8 w-44" />
        </div>
        
        <div className="bg-white shadow-sm rounded-xl overflow-hidden">
          <div className="p-6 sm:p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-start gap-8">
              <Skeleton className="h-48 w-48 rounded-xl flex-shrink-0" />
              
              <div className="flex-1">
                <Skeleton className="h-8 w-36 mb-2" />
                <Skeleton className="h-5 w-48 mb-4" />
                <Skeleton className="h-4 w-32 mb-6" />
                
                <Skeleton className="h-5 w-24 mb-2" />
                <Skeleton className="h-20 w-full mb-6" />
                
                <Skeleton className="h-5 w-24 mb-2" />
                <div className="flex flex-wrap gap-2 mb-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-16 rounded-full" />
                  ))}
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <Skeleton className="h-10 w-32 rounded-md" />
                  <Skeleton className="h-10 w-32 rounded-md" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Agent Not Found</h2>
        <p className="text-gray-500 mb-8">
          The agent you're looking for doesn't exist or has been removed.
        </p>
        <Link href="/">
          <Button>
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  // Calculate rating display (converts number to star UI)
  const ratingValue = agent.rating / 20; // Convert 0-100 scale to 0-5

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/" className="inline-flex items-center text-gray-600 hover:text-[#E53E3E] mb-6">
        <ArrowLeft size={16} className="mr-1" />
        Back to Agents
      </Link>
      
      <div className="bg-white shadow-sm rounded-xl overflow-hidden">
        <div className="p-6 sm:p-8 md:p-10">
          <div className="flex flex-col md:flex-row md:items-start gap-8">
            {/* Agent Avatar */}
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-xl bg-gray-200 overflow-hidden flex-shrink-0 mx-auto md:mx-0">
              {agent.avatarUrl ? (
                <img
                  src={agent.avatarUrl}
                  alt={`${agent.name} profile`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#E53E3E] text-white text-4xl font-bold">
                  {agent.name.charAt(0)}
                </div>
              )}
            </div>
            
            {/* Agent Details */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800">{agent.name}</h1>
                {agent.isOnline && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    Online
                  </span>
                )}
              </div>
              
              <p className="text-gray-600 text-lg mb-2">{agent.title}</p>
              
              <div className="flex items-center mb-6">
                <StarRating rating={ratingValue} size="md" />
                <span className="text-gray-500 ml-2">({ratingValue.toFixed(1)})</span>
              </div>
              
              <h2 className="font-medium text-slate-800 mb-2">About</h2>
              <p className="text-gray-600 mb-6">{agent.bio}</p>
              
              <h2 className="font-medium text-slate-800 mb-2">Skills</h2>
              <div className="flex flex-wrap gap-2 mb-8">
                {agent.skills.map((skill, index) => (
                  <SkillBadge key={index} skill={skill} />
                ))}
              </div>
              
              <div className="flex flex-wrap gap-4">
                <Button
                  className="bg-[#E53E3E] hover:bg-red-700"
                  onClick={() => setIsChatModalOpen(true)}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Chat with {agent.name}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsHireModalOpen(true)}
                >
                  <Briefcase className="mr-2 h-4 w-4" />
                  Hire {agent.name}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Related Agents Section - could be added here */}
      
      {/* Chat Modal */}
      {isChatModalOpen && (
        <ChatModal
          agent={agent}
          isOpen={isChatModalOpen}
          onClose={() => setIsChatModalOpen(false)}
        />
      )}
      
      {/* Hire Modal */}
      {isHireModalOpen && (
        <HireModal
          agent={agent}
          isOpen={isHireModalOpen}
          onClose={() => setIsHireModalOpen(false)}
        />
      )}
    </div>
  );
}
