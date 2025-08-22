#!/usr/bin/env python
"""
Module principal des agents IA.
Contient les classes et fonctions pour interagir avec les différents agents.
"""

import os
import json
import sys
import logging
from typing import Dict, List, Any, Optional, Union

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("agent")

class Agent:
    """
    Classe abstraite pour tous les agents.
    Définit l'interface commune que tous les agents doivent implémenter.
    """
    
    def __init__(self, name: str, config: Dict[str, Any]):
        """
        Initialise un nouvel agent.
        
        Args:
            name (str): Nom de l'agent
            config (Dict[str, Any]): Configuration de l'agent
        """
        self.name = name
        self.config = config
        self.knowledge_bases = []
        logger.info(f"Agent {name} initialisé avec la configuration: {config}")
    
    def add_knowledge_base(self, kb_module: Any) -> None:
        """
        Ajoute une base de connaissances à l'agent.
        
        Args:
            kb_module: Module Python contenant la base de connaissances
        """
        self.knowledge_bases.append(kb_module)
        logger.info(f"Base de connaissances ajoutée à l'agent {self.name}")
    
    def process_message(self, message: str) -> str:
        """
        Traite un message et génère une réponse.
        À implémenter par les classes dérivées.
        
        Args:
            message (str): Message à traiter
            
        Returns:
            str: Réponse de l'agent
        """
        raise NotImplementedError("Cette méthode doit être implémentée par une classe dérivée")

    def search_knowledge(self, query: str) -> Dict[str, Any]:
        """
        Recherche des informations dans les bases de connaissances de l'agent.
        
        Args:
            query (str): Terme de recherche
            
        Returns:
            Dict[str, Any]: Résultats de la recherche
        """
        results = {}
        for kb in self.knowledge_bases:
            if hasattr(kb, "search_knowledge_base"):
                kb_results = kb.search_knowledge_base(query)
                results.update(kb_results)
        return results
    
    def get_system_prompt(self) -> str:
        """
        Retourne le prompt système pour l'agent.
        
        Returns:
            str: Prompt système
        """
        return self.config.get("system_prompt", "")
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convertit l'agent en dictionnaire pour la sérialisation.
        
        Returns:
            Dict[str, Any]: Représentation de l'agent sous forme de dictionnaire
        """
        return {
            "name": self.name,
            "config": self.config
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Agent":
        """
        Crée un agent à partir d'un dictionnaire.
        
        Args:
            data (Dict[str, Any]): Dictionnaire contenant les données de l'agent
            
        Returns:
            Agent: Instance d'agent
        """
        return cls(data["name"], data["config"])


class DevOpsAgent(Agent):
    """
    Agent spécialisé en DevOps.
    """
    
    def __init__(self, name: str, config: Dict[str, Any]):
        """
        Initialise un nouvel agent DevOps.
        
        Args:
            name (str): Nom de l'agent
            config (Dict[str, Any]): Configuration de l'agent
        """
        super().__init__(name, config)
        logger.info(f"Agent DevOps {name} initialisé")
    
    def process_message(self, message: str) -> str:
        """
        Traite un message et génère une réponse spécifique au domaine DevOps.
        
        Args:
            message (str): Message à traiter
            
        Returns:
            str: Réponse de l'agent
        """
        # 1. Extraire les mots-clés importants du message
        keywords = self._extract_keywords(message)
        
        # 2. Rechercher des informations dans la base de connaissances
        knowledge = {}
        for keyword in keywords:
            results = self.search_knowledge(keyword)
            if results:
                knowledge[keyword] = results
        
        # 3. Préparer le contexte pour l'API IA
        context = self._prepare_context(message, knowledge)
        
        # 4. Générer la réponse (à remplacer par l'appel à l'API IA)
        response = self._mock_ai_response(context)
        
        logger.info(f"Message traité: '{message[:50]}...' - Réponse générée")
        return response
    
    def _extract_keywords(self, message: str) -> List[str]:
        """
        Extrait les mots-clés importants d'un message.
        Implémentation simplifiée pour l'exemple.
        
        Args:
            message (str): Message à analyser
            
        Returns:
            List[str]: Mots-clés extraits
        """
        # Implémentation naïve pour l'exemple
        devops_keywords = [
            "ci/cd", "cicd", "ci-cd", "pipeline", "jenkins", "github actions",
            "docker", "container", "kubernetes", "k8s", "terraform", 
            "ansible", "monitoring", "prometheus", "grafana", "elk",
            "cloud", "aws", "azure", "gcp", "infrastructure", "deployment"
        ]
        
        message_lower = message.lower()
        found_keywords = []
        
        for keyword in devops_keywords:
            if keyword in message_lower:
                found_keywords.append(keyword)
        
        # S'il n'y a pas de mots-clés spécifiques, utiliser un mot-clé générique
        if not found_keywords and "problème" in message_lower:
            found_keywords.append("troubleshooting")
        
        return found_keywords or ["general"]
    
    def _prepare_context(self, message: str, knowledge: Dict[str, Any]) -> Dict[str, Any]:
        """
        Prépare le contexte pour l'appel à l'API IA.
        
        Args:
            message (str): Message de l'utilisateur
            knowledge (Dict[str, Any]): Informations de la base de connaissances
            
        Returns:
            Dict[str, Any]: Contexte pour l'appel API
        """
        return {
            "message": message,
            "system_prompt": self.get_system_prompt(),
            "knowledge": knowledge
        }
    
    def _mock_ai_response(self, context: Dict[str, Any]) -> str:
        """
        Génère une réponse factice pour les tests.
        À remplacer par l'appel réel à l'API IA.
        
        Args:
            context (Dict[str, Any]): Contexte pour l'appel API
            
        Returns:
            str: Réponse générée
        """
        message = context["message"]
        knowledge = context["knowledge"]
        
        # Vérifier si nous avons des informations dans la base de connaissances
        if knowledge:
            first_topic = list(knowledge.values())[0]
            first_result = list(first_topic.values())[0]
            
            if isinstance(first_result, dict) and "definition" in first_result:
                definition = first_result["definition"].strip()
                return f"D'après ma base de connaissances, je peux vous dire que {definition}\n\nY a-t-il quelque chose de spécifique sur ce sujet que vous aimeriez savoir?"
            
        # Réponse par défaut
        return "Je suis NOX, votre spécialiste DevOps. Bien que je n'aie pas d'informations spécifiques sur votre demande dans ma base de connaissances actuelle, je peux vous aider avec diverses problématiques DevOps comme CI/CD, containerisation, monitoring, et infrastructure as code. N'hésitez pas à préciser votre question."


def create_agent(agent_type: str, name: str, config: Dict[str, Any]) -> Agent:
    """
    Crée un agent du type spécifié.
    
    Args:
        agent_type (str): Type d'agent à créer
        name (str): Nom de l'agent
        config (Dict[str, Any]): Configuration de l'agent
        
    Returns:
        Agent: Instance de l'agent créé
        
    Raises:
        ValueError: Si le type d'agent n'est pas reconnu
    """
    if agent_type.lower() == "devops":
        return DevOpsAgent(name, config)
    else:
        raise ValueError(f"Type d'agent non reconnu: {agent_type}")


def load_agent_config(config_path: str) -> Dict[str, Any]:
    """
    Charge la configuration d'un agent à partir d'un fichier JSON.
    
    Args:
        config_path (str): Chemin vers le fichier de configuration
        
    Returns:
        Dict[str, Any]: Configuration chargée
    """
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Erreur lors du chargement de la configuration: {str(e)}")
        return {}


if __name__ == "__main__":
    # Exemple d'utilisation
    config = {
        "system_prompt": "Tu es NOX, un spécialiste DevOps avec expertise en pipelines CI/CD, containerisation, et infrastructure as code."
    }
    
    agent = create_agent("devops", "NOX", config)
    
    # Ajout de la base de connaissances (à faire en production)
    # from knowledge_base import devops_knowledge_base
    # agent.add_knowledge_base(devops_knowledge_base)
    
    # Test de traitement de message
    response = agent.process_message("J'ai un problème avec mon pipeline CI/CD, les tests échouent de manière aléatoire.")
    print(response)