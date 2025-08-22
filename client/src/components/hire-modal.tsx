import { useState, useEffect } from "react";
import { Agent } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  CheckIcon,
  Briefcase,
  UserCheck,
  Calendar,
  Slack,
  Mail,
  MessageCircle,
  ArrowRight,
  FileCheck,
  Clock,
  Settings,
  Building,
  User2,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface HireModalProps {
  agent: Agent;
  isOpen: boolean;
  onClose: () => void;
}

export default function HireModal({ agent, isOpen, onClose }: HireModalProps) {
  const [currentTab, setCurrentTab] = useState("step1");
  const [progress, setProgress] = useState(33);
  const { toast } = useToast();
  
  // Step 1: Need Validation form data
  const [projectDescription, setProjectDescription] = useState("");
  const [toolsUsed, setToolsUsed] = useState<string[]>([]);
  
  // Récupérer le client ID Slack depuis l'API
  const { data: slackConfig } = useQuery({
    queryKey: ['/api/config/slack'],
    enabled: isOpen,
    placeholderData: { clientId: '' },
  });
  const [autonomyLevel, setAutonomyLevel] = useState("medium");
  const [duration, setDuration] = useState("3months");

  // Step 2: Simulation
  const [simulationQuestion, setSimulationQuestion] = useState("");
  const [simulationResponse, setSimulationResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Step 3: Access Configuration
  const [companyEmail, setCompanyEmail] = useState("");
  const [slackWorkspace, setSlackWorkspace] = useState("");
  const [teamManager, setTeamManager] = useState("");
  const [termsAgreed, setTermsAgreed] = useState(false);
  
  // Tools options
  const toolsOptions = [
    { id: "slack", label: "Slack", icon: <Slack className="h-4 w-4 mr-2" /> },
    { id: "email", label: "Email", icon: <Mail className="h-4 w-4 mr-2" /> },
    { id: "chat", label: "Chat Tools", icon: <MessageCircle className="h-4 w-4 mr-2" /> },
  ];
  
  // Autonomy levels
  const autonomyLevels = [
    { value: "low", label: "Low - Regular supervision" },
    { value: "medium", label: "Medium - Weekly check-ins" },
    { value: "high", label: "High - Fully autonomous" },
  ];
  
  // Duration options
  const durationOptions = [
    { value: "1month", label: "1 month" },
    { value: "3months", label: "3 months" },
    { value: "6months", label: "6 months" },
    { value: "ongoing", label: "Ongoing" },
  ];

  // Toggle tool selection
  const toggleTool = (tool: string) => {
    if (toolsUsed.includes(tool)) {
      setToolsUsed(toolsUsed.filter(t => t !== tool));
    } else {
      setToolsUsed([...toolsUsed, tool]);
    }
  };

  // Handle step navigation - Simplified to 3 steps
  const goToNextStep = () => {
    if (currentTab === "step1") {
      setCurrentTab("step3"); // Skip step2 (Simulation) and go directly to step3 (Setup)
      setProgress(66);
    } else if (currentTab === "step3") {
      setCurrentTab("step4");
      setProgress(100);
    }
  };

  const goToPrevStep = () => {
    if (currentTab === "step3") {
      setCurrentTab("step1"); // From step3 (Setup) back to step1 (Needs)
      setProgress(33);
    } else if (currentTab === "step4") {
      setCurrentTab("step3");
      setProgress(66);
    }
  };

  // Handle simulation
  const handleRunSimulation = async () => {
    setIsLoading(true);
    
    // Placeholder for the simulation API call
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSimulationResponse(
        `Based on your ${agent.title} requirements, I would approach this by setting up a CI/CD pipeline that integrates with your ${toolsUsed.join(", ")} workflow. I'll ensure proper automation while maintaining security standards.`
      );
    } catch (error) {
      console.error("Simulation error:", error);
      toast({
        variant: "destructive",
        title: "Simulation Failed",
        description: "There was an error running the simulation. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle final submission with automatic Slack integration
  const handleHireAgent = async () => {
    // Show loading state
    setIsLoading(true);
    
    try {
      // Simulate API call for agent integration
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // If Slack was selected as a tool, we simulate the automatic integration
      if (toolsUsed.includes('slack')) {
        // Simulate Slack API integration
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      // Success notification
      toast({
        title: "Agent intégré avec succès !",
        description: `${agent.name} a été ajouté à votre équipe et est prêt à collaborer.`,
      });
      
    } catch (error) {
      console.error("Error hiring agent:", error);
      toast({
        variant: "destructive",
        title: "Erreur lors de l'intégration",
        description: "Une erreur est survenue. Veuillez réessayer.",
      });
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  // Check if steps are valid
  const isStep1Valid = projectDescription.trim().length > 0 && toolsUsed.length > 0;
  // Pour l'étape 2, on peut la sauter ou compléter la simulation
  const isStep2Valid = true; // Permettre de continuer même sans simulation
  const isStep3Valid = companyEmail.includes('@') && termsAgreed;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <Briefcase className="h-6 w-6 text-[#E53E3E]" />
            </div>
            <div className="ml-4">
              <DialogTitle className="text-xl font-medium text-gray-900">
                Hire {agent.name}
              </DialogTitle>
              <p className="mt-1 text-sm text-gray-500">
                Complete the following steps to add {agent.name} to your team
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="mt-4">
          <Progress value={progress} className="h-2 bg-gray-200" />
          <style dangerouslySetInnerHTML={{ __html: `
            .h-2.bg-gray-200 > div {
              background-color: #E53E3E !important;
            }
          `}} />
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>Needs</span>
            <span>Setup</span>
            <span>Done</span>
          </div>
        </div>

        <Tabs value={currentTab} className="mt-6">
          {/* Step 1: Need Validation */}
          <TabsContent value="step1" className="space-y-4 mt-2">
            <h3 className="text-lg font-semibold flex items-center">
              <UserCheck className="mr-2 h-5 w-5 text-[#E53E3E]" /> Define Your Needs
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="project-description">What will {agent.name} work on?</Label>
                <Textarea 
                  id="project-description" 
                  placeholder={`Describe the ${agent.title} tasks you need help with...`}
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label>Which tools will {agent.name} use?</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                  {toolsOptions.map((tool) => (
                    <Button
                      key={tool.id}
                      type="button"
                      variant={toolsUsed.includes(tool.id) ? "default" : "outline"}
                      className={cn(
                        "justify-start h-auto py-3", 
                        toolsUsed.includes(tool.id) ? "border-[#E53E3E] bg-red-50 text-red-900" : ""
                      )}
                      onClick={() => toggleTool(tool.id)}
                    >
                      {tool.icon}
                      {tool.label}
                      {toolsUsed.includes(tool.id) && (
                        <CheckIcon className="h-4 w-4 ml-auto text-[#E53E3E]" />
                      )}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="autonomy-level">Autonomy Level</Label>
                  <Select value={autonomyLevel} onValueChange={setAutonomyLevel}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select autonomy level" />
                    </SelectTrigger>
                    <SelectContent>
                      {autonomyLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="duration">Estimated Duration</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {durationOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Step 2: Quick Simulation */}
          <TabsContent value="step2" className="space-y-4 mt-2">
            <h3 className="text-lg font-semibold flex items-center">
              <MessageCircle className="mr-2 h-5 w-5 text-[#E53E3E]" /> Quick Simulation
            </h3>
            
            <Card className="p-4 border border-gray-200">
              <div className="flex items-center mb-4">
                <Clock className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-sm text-gray-500">
                  This simulation shows how {agent.name} would respond in a real work context
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="simulation-question">Ask {agent.name} a sample question</Label>
                  <Textarea 
                    id="simulation-question" 
                    placeholder={`Example: How would you set up a ${agent.skills[0]} environment for our project?`}
                    value={simulationQuestion || `How would you help us implement ${agent.skills[0]} in our current project?`}
                    onChange={(e) => setSimulationQuestion(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <p className="text-xs text-gray-500 italic mb-3">
                  This simulation is optional. You can run it to see how {agent.name} will respond to your needs or skip to the next step.
                </p>
                
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleRunSimulation} 
                    className="bg-[#E53E3E] hover:bg-red-700"
                    disabled={isLoading || !simulationQuestion.trim()}
                  >
                    {isLoading ? "Running simulation..." : "Run simulation"}
                  </Button>
                  
                  <Button
                    onClick={goToNextStep}
                    variant="outline"
                    className="border-gray-300"
                    disabled={isLoading}
                  >
                    Skip simulation
                  </Button>
                </div>
                
                {simulationResponse && (
                  <div className="mt-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex items-start">
                      <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center mr-3 flex-shrink-0">
                        <User2 className="h-4 w-4 text-[#E53E3E]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{agent.name}'s response:</p>
                        <p className="text-sm mt-1">{simulationResponse}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Step 3: Access Configuration */}
          <TabsContent value="step3" className="space-y-4 mt-2">
            <h3 className="text-lg font-semibold flex items-center">
              <Settings className="mr-2 h-5 w-5 text-[#E53E3E]" /> Access Configuration
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="company-email">Company Email</Label>
                <Input 
                  id="company-email" 
                  type="email" 
                  placeholder="your-email@company.com"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  We'll use this email for all communications regarding {agent.name}
                </p>
              </div>
              
              {toolsUsed.includes('slack') && (
                <div>
                  <Label htmlFor="slack-workspace">Slack Workspace</Label>
                  <Input 
                    id="slack-workspace" 
                    placeholder="workspace-name"
                    value={slackWorkspace}
                    onChange={(e) => setSlackWorkspace(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
              
              <div>
                <Label htmlFor="team-manager">Team Name or Manager Reference</Label>
                <Input 
                  id="team-manager" 
                  placeholder="Team name or manager's name"
                  value={teamManager}
                  onChange={(e) => setTeamManager(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div className="flex items-start space-x-2 pt-2">
                <Checkbox 
                  id="terms" 
                  checked={termsAgreed} 
                  onCheckedChange={(checked) => setTermsAgreed(checked === true)}
                  className="data-[state=checked]:bg-[#E53E3E] data-[state=checked]:border-[#E53E3E]"
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Accept terms and conditions
                  </label>
                  <p className="text-xs text-gray-500">
                    I agree to the platform's terms of service and data usage policy
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Step 4: Confirmation & Instructions */}
          <TabsContent value="step4" className="space-y-6 mt-2">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckIcon className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                {agent.name} is ready to join your team!
              </h3>
              <p className="text-gray-500 mt-2">
                Here's what happens next:
              </p>
            </div>
            
            <div className="space-y-4">
              <Card className="p-4 border-green-100">
                <div className="flex">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-3 flex-shrink-0">
                    <Mail className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Confirmation Email</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Une confirmation a été envoyée à {companyEmail} avec les détails de l'intégration et votre ID agent unique. Aucune action supplémentaire n'est nécessaire.
                    </p>
                  </div>
                </div>
              </Card>
              
              {toolsUsed.includes('slack') && (
                <Card className="p-4 border-green-100">
                  <div className="flex">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-3 flex-shrink-0">
                      <Slack className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="w-full">
                      <h4 className="font-medium">Slack Integration</h4>
                      <p className="text-sm text-gray-500 mt-1 mb-3">
                        Connectez {agent.name} à votre espace de travail Slack pour communiquer directement avec l'agent.
                      </p>
                      
                      <div className="flex flex-col space-y-3">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-green-200 hover:bg-green-50"
                            onClick={() => {
                              if (!slackConfig?.clientId) {
                                toast({
                                  title: "Erreur de configuration",
                                  description: "L'ID client Slack n'est pas disponible. Veuillez réessayer plus tard.",
                                  variant: "destructive"
                                });
                                return;
                              }
                              
                              toast({
                                title: "Intégration Slack",
                                description: "Vous êtes redirigé vers Slack pour autoriser l'accès et sélectionner votre workspace et canal.",
                              });
                              
                              // Ajoutons des paramètres pour s'assurer que tout fonctionne correctement
                              const slackUrl = new URL('https://slack.com/oauth/v2/authorize');
                              // Ajout des paramètres de requête
                              slackUrl.searchParams.append('client_id', slackConfig.clientId);
                              slackUrl.searchParams.append('scope', 'chat:write,channels:read,channels:join');
                              slackUrl.searchParams.append('state', agent.id.toString());
                              
                              // Essayons d'ajouter une URL de redirection explicite
                              // Utilisons une URL que nous savons configurée dans l'application Slack
                              slackUrl.searchParams.append('redirect_uri', 'https://jamonoagents.slack.com/oauth');
                              
                              console.log('Redirection vers Slack avec URL:', slackUrl.toString());
                              window.open(slackUrl.toString(), '_blank');
                            }}
                          >
                            <Slack className="mr-2 h-4 w-4" />
                            Connecter à Slack
                          </Button>
                        </div>

                        <div className="mt-2 bg-slate-50 rounded p-2 text-xs font-mono">
                          <p className="mb-1">Après intégration, utilisez la commande :</p>
                          <code className="bg-slate-100 px-2 py-1 rounded">/agent @{agent.name.toLowerCase()} votre message</code>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
              
              <Card className="p-4 border-green-100">
                <div className="flex">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-3 flex-shrink-0">
                    <FileCheck className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Tableau de bord de l'agent</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Suivez les performances de {agent.name}, gérez les paramètres et ajustez les autorisations directement depuis votre tableau de bord. Tout est prêt à l'emploi.
                    </p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 border-blue-100 bg-blue-50">
                <div className="flex">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                    <Building className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Configuration recommandée</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Pour optimiser la collaboration avec {agent.name}, nous recommandons de configurer l'intégration Slack en utilisant le bouton ci-dessus. Cela facilitera la communication entre l'agent et votre équipe.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
          {currentTab !== "step1" && (
            <Button 
              variant="outline" 
              onClick={goToPrevStep}
              className="mb-2 sm:mb-0"
            >
              Back
            </Button>
          )}
          
          <div className="flex space-x-2">
            {currentTab !== "step4" ? (
              <Button 
                className="bg-[#E53E3E] hover:bg-red-700 ml-auto" 
                onClick={goToNextStep}
                disabled={
                  (currentTab === "step1" && !isStep1Valid) ||
                  (currentTab === "step2" && !isStep2Valid) ||
                  (currentTab === "step3" && !isStep3Valid)
                }
              >
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                className="bg-[#E53E3E] hover:bg-red-700 ml-auto" 
                onClick={handleHireAgent}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="mr-2">Intégration en cours...</span>
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </>
                ) : (
                  <>
                    Embaucher {agent.name} <CheckIcon className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
