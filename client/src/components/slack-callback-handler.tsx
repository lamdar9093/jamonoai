import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface SlackCallbackHandlerProps {
  onAuthSuccess?: (workspaceName: string, agentName: string) => void;
  onAuthFailure?: (error: string) => void;
}

/**
 * Composant pour gérer le retour de l'autorisation Slack
 * À utiliser dans la page d'accueil pour intercepter les codes d'autorisation
 */
export default function SlackCallbackHandler({ onAuthSuccess, onAuthFailure }: SlackCallbackHandlerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Fonction pour extraire les paramètres d'URL
    const getUrlParams = () => {
      // Si nous sommes côté client
      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        return {
          code: searchParams.get('code'),
          state: searchParams.get('state'),
          error: searchParams.get('error')
        };
      }
      return { code: null, state: null, error: null };
    };

    // Vérifier s'il y a un code d'autorisation Slack dans l'URL
    const { code, state, error } = getUrlParams();

    if (code && state && !isProcessing) {
      setIsProcessing(true);

      // Récupérer d'abord le client_id depuis notre API
      fetch('/api/config/slack')
        .then(response => response.json())
        .then(config => {
          // Envoyer le code à notre API pour l'échanger contre un token
          return fetch('/api/slack/auth-callback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              code, 
              state,
              clientId: config.clientId // Ajouter le client_id explicitement
            })
          });
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            toast({
              title: "Intégration Slack réussie",
              description: `L'agent ${data.agent} a été connecté avec succès à votre workspace Slack (${data.workspace}).`,
            });
            
            // Nettoyer l'URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Appeler le callback de succès
            if (onAuthSuccess) {
              onAuthSuccess(data.workspace, data.agent);
            }
          } else {
            throw new Error(data.message || "Erreur d'intégration Slack");
          }
        })
        .catch(err => {
          console.error("Erreur lors de l'intégration Slack:", err);
          
          toast({
            title: "Erreur d'intégration",
            description: err.message || "Une erreur s'est produite lors de l'intégration avec Slack.",
            variant: "destructive"
          });
          
          // Nettoyer l'URL
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Appeler le callback d'erreur
          if (onAuthFailure) {
            onAuthFailure(err.message || "Erreur inconnue");
          }
        })
        .finally(() => {
          setIsProcessing(false);
        });
    } else if (error) {
      toast({
        title: "Erreur Slack",
        description: `L'autorisation Slack a échoué: ${error}`,
        variant: "destructive"
      });
      
      // Nettoyer l'URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Appeler le callback d'erreur
      if (onAuthFailure) {
        onAuthFailure(error);
      }
    }
  }, [toast, onAuthSuccess, onAuthFailure]);

  // Ce composant ne rend rien visuellement
  return null;
}