import { useState, useEffect, useRef } from "react";
import { Agent } from "@shared/schema";
import { processMessageStream, streamChatResponse } from "@/lib/openai";
import { formatMessageTime } from "@/lib/utils";
import { Send, X, Trash2, History } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface ChatModalProps {
  agent: Agent;
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "agent";
  timestamp: Date;
  isStreaming?: boolean;
}

export default function ChatModal({ agent, isOpen, onClose }: ChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize with a greeting message from the agent
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: "initial-greeting",
          content: `Hello! I'm ${agent.name}, your ${agent.title}. How can I assist you today?`,
          sender: "agent",
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, agent, messages.length]);

  // Scroll to bottom of messages whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: input,
      sender: "user",
      timestamp: new Date(),
    };

    // Add user message and empty agent response
    setMessages((prev) => [
      ...prev,
      userMessage,
      {
        id: `agent-${Date.now()}`,
        content: "",
        sender: "agent",
        timestamp: new Date(),
        isStreaming: true,
      },
    ]);
    setInput("");
    setIsLoading(true);

    try {
      // Prepare the messages to send to the API
      const messageHistory = messages
        .filter((m) => !m.isStreaming)
        .map((m) => ({
          content: m.content,
          sender: m.sender,
        }));
      
      messageHistory.push({
        content: input,
        sender: "user",
      });

      // Get stream from the API
      const stream = await streamChatResponse(agent.id, messageHistory);
      
      let fullResponse = "";
      
      // Process the stream chunk by chunk
      await processMessageStream(
        stream,
        (chunk) => {
          fullResponse += chunk;
          setMessages((prev) => {
            const lastIndex = prev.length - 1;
            const updatedMessages = [...prev];
            updatedMessages[lastIndex] = {
              ...updatedMessages[lastIndex],
              content: fullResponse,
            };
            return updatedMessages;
          });
        }
      );

      // Update the last message to remove streaming flag once complete
      setMessages((prev) => {
        const lastIndex = prev.length - 1;
        const updatedMessages = [...prev];
        updatedMessages[lastIndex] = {
          ...updatedMessages[lastIndex],
          isStreaming: false,
        };
        return updatedMessages;
      });
    } catch (error) {
      console.error("Error in chat:", error);
      toast({
        title: "Chat Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive",
      });
      
      // Remove the placeholder message on error
      setMessages((prev) => prev.filter((m) => !m.isStreaming));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle pressing Enter to send message
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Clear conversation history
  const handleClearHistory = async () => {
    setIsClearingHistory(true);
    try {
      const response = await fetch(`/api/agents/${agent.id}/history`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to clear history');
      }

      // Clear local messages but keep the greeting
      setMessages([{
        id: Date.now().toString(),
        content: `Hello! I'm ${agent.name}, ${agent.title}. How can I help you today?`,
        sender: "agent",
        timestamp: new Date(),
      }]);

      toast({
        title: "History Cleared",
        description: "Conversation history has been cleared successfully.",
      });
    } catch (error) {
      console.error("Error clearing history:", error);
      toast({
        title: "Error",
        description: "Failed to clear conversation history. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsClearingHistory(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-red-100 mr-3 overflow-hidden">
                {agent.avatarUrl ? (
                  <img
                    src={agent.avatarUrl}
                    alt={`${agent.name} avatar`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-[#E53E3E] text-white">
                    {agent.name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <DialogTitle className="text-lg">
                  Chat with {agent.name}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <History className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">Contextual memory enabled</span>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearHistory}
              disabled={isClearingHistory}
              className="flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" />
              {isClearingHistory ? "Clearing..." : "Clear History"}
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {agent.name === "NOX" ? (
              <>Parlez à NOX comme à un collègue DevOps Senior. Essayez "@NOX, peux-tu..." ou donnez-lui des instructions directes. Il se souvient du contexte.</>
            ) : (
              <>Ask a technical question to test {agent.name}'s knowledge before hiring. {agent.name} remembers your conversation context.</>
            )}
          </p>
        </DialogHeader>
        
        <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto">
          <div className="space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.sender === "user" ? "justify-end" : ""}`}
              >
                {message.sender === "agent" && (
                  <div className="flex-shrink-0 mr-3">
                    <div className="h-8 w-8 rounded-full overflow-hidden">
                      {agent.avatarUrl ? (
                        <img
                          src={agent.avatarUrl}
                          alt={`${agent.name} avatar`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-[#E53E3E] text-white">
                          {agent.name.charAt(0)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className={`${
                  message.sender === "user" 
                    ? "bg-[#E53E3E] text-white" 
                    : "bg-gray-200 text-gray-800"
                  } rounded-lg py-2 px-3 max-w-[75%]`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs ${
                    message.sender === "user" ? "text-red-200" : "text-gray-500"
                  } mt-1`}>
                    {formatMessageTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && messages[messages.length - 1]?.isStreaming && (
              <div className="flex items-start">
                <div className="ml-11">
                  <div className="bg-gray-400 h-2 w-2 rounded-full animate-pulse mt-2"></div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        <div className="mt-2 relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={2}
            className="resize-none pr-10"
            disabled={isLoading}
          />
          <Button
            size="sm"
            className="absolute right-2 bottom-2 h-8 w-8 p-0"
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
          >
            <Send size={16} />
            <span className="sr-only">Send</span>
          </Button>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={openHireModal}>
            Hire {agent.name}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  function openHireModal() {
    onClose();
    // Add code to open hire modal
  }
}
