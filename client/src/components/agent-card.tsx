import { useState } from "react";
import { Agent } from "@shared/schema";
import StarRating from "./star-rating";
import SkillBadge from "./skill-badge";
import ChatModal from "./chat-modal";
import HireModal from "./hire-modal";
import { useLocation } from "wouter";

interface AgentCardProps {
  agent: Agent;
}

export default function AgentCard({ agent }: AgentCardProps) {
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);
  const [, navigate] = useLocation();

  const openChatModal = () => setIsChatModalOpen(true);
  const closeChatModal = () => setIsChatModalOpen(false);
  
  const openHireModal = () => setIsHireModalOpen(true);
  const closeHireModal = () => setIsHireModalOpen(false);

  const handleAgentClick = () => {
    navigate(`/agent/${agent.id}`);
  };

  // Calculate rating display (converts number to star UI)
  const ratingValue = agent.rating / 20; // Convert 0-100 scale to 0-5
  
  return (
    <>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div className="p-6 cursor-pointer" onClick={handleAgentClick}>
          <div className="flex items-start">
            <div className="w-16 h-16 rounded-full bg-gray-200 mr-4 overflow-hidden flex-shrink-0">
              {agent.avatarUrl ? (
                <img 
                  src={agent.avatarUrl} 
                  alt={`${agent.name} profile`} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#E53E3E] text-white text-xl font-bold">
                  {agent.name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center">
                <h3 className="text-lg font-semibold text-slate-800">{agent.name}</h3>
                {agent.isOnline && (
                  <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                    Online
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-sm mt-1">{agent.title}</p>
              <div className="flex items-center mt-1">
                <StarRating rating={ratingValue} />
                <span className="text-xs text-gray-500 ml-1">({ratingValue.toFixed(1)})</span>
              </div>
            </div>
          </div>
          <p className="mt-4 text-gray-600 text-sm">{agent.bio}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {agent.skills.slice(0, 4).map((skill, index) => (
              <SkillBadge key={index} skill={skill} />
            ))}
            {agent.skills.length > 4 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                +{agent.skills.length - 4} more
              </span>
            )}
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
          <button
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#E53E3E] hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E53E3E]"
            onClick={(e) => {
              e.stopPropagation();
              openChatModal();
            }}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Chat
          </button>
          <button
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-slate-800 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E53E3E]"
            onClick={(e) => {
              e.stopPropagation();
              openHireModal();
            }}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Hire
          </button>
        </div>
      </div>

      {/* Chat Modal */}
      {isChatModalOpen && (
        <ChatModal agent={agent} isOpen={isChatModalOpen} onClose={closeChatModal} />
      )}

      {/* Hire Modal */}
      {isHireModalOpen && (
        <HireModal agent={agent} isOpen={isHireModalOpen} onClose={closeHireModal} />
      )}
    </>
  );
}
