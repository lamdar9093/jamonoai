#!/usr/bin/env python
"""
Serveur d'agents IA.
Ce script expose une interface pour interagir avec les agents via des commandes en ligne de commande.
Il peut être appelé par le serveur Node.js pour traiter les messages des utilisateurs.
"""

import sys
import json
import argparse
import importlib.util
import os
from typing import Dict, List, Any, Optional

# Import des modules d'agents
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

try:
    from models.agent import create_agent, Agent
    from knowledge_base import devops_knowledge_base
except ImportError as e:
    print(f"Erreur d'importation: {e}", file=sys.stderr)
    sys.exit(1)

def load_agent_from_config(config_path: str) -> Agent:
    """
    Charge un agent à partir d'un fichier de configuration JSON.
    
    Args:
        config_path (str): Chemin vers le fichier de configuration JSON
        
    Returns:
        Agent: Instance de l'agent chargé
    """
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
            
        agent_type = config.get("type", "devops")
        name = config.get("name", "Generic Agent")
        
        agent = create_agent(agent_type, name, config)
        
        # Charger les bases de connaissances configurées
        if agent_type.lower() == "devops":
            agent.add_knowledge_base(devops_knowledge_base)
        
        return agent
    except Exception as e:
        print(f"Erreur lors du chargement de la configuration de l'agent: {str(e)}", file=sys.stderr)
        raise

def load_agent(agent_type: str, name: str, config: Dict[str, Any]) -> Agent:
    """
    Charge un agent avec sa base de connaissances.
    
    Args:
        agent_type (str): Type d'agent à charger
        name (str): Nom de l'agent
        config (Dict[str, Any]): Configuration de l'agent
        
    Returns:
        Agent: Instance de l'agent chargé
    """
    agent = create_agent(agent_type, name, config)
    
    # Charger la base de connaissances appropriée
    if agent_type.lower() == "devops":
        agent.add_knowledge_base(devops_knowledge_base)
    
    return agent

def process_message(agent: Agent, message: str) -> str:
    """
    Traite un message avec l'agent spécifié.
    
    Args:
        agent (Agent): Agent à utiliser pour traiter le message
        message (str): Message à traiter
        
    Returns:
        str: Réponse de l'agent
    """
    return agent.process_message(message)

def main():
    """Fonction principale pour l'exécution en ligne de commande."""
    parser = argparse.ArgumentParser(description="Interface pour interagir avec les agents IA")
    parser.add_argument("--agent-type", help="Type d'agent (devops, cloud, etc.)")
    parser.add_argument("--agent-name", help="Nom de l'agent")
    parser.add_argument("--config", help="Configuration de l'agent au format JSON")
    parser.add_argument("--message", required=True, help="Message à traiter")
    parser.add_argument("--config-file", help="Fichier de configuration de l'agent")
    parser.add_argument("--default-agent", default="nox", help="Agent par défaut à utiliser si aucun n'est spécifié")
    
    args = parser.parse_args()
    
    agent = None
    
    # Si un type d'agent est fourni, utiliser la configuration fournie
    if args.agent_type:
        # Charger la configuration
        config = {}
        if args.config:
            try:
                config = json.loads(args.config)
            except json.JSONDecodeError:
                print("Erreur: La configuration JSON n'est pas valide", file=sys.stderr)
                sys.exit(1)
        elif args.config_file:
            try:
                with open(args.config_file, 'r', encoding='utf-8') as f:
                    config = json.load(f)
            except Exception as e:
                print(f"Erreur lors du chargement du fichier de configuration: {str(e)}", file=sys.stderr)
                sys.exit(1)
        
        # Créer et initialiser l'agent
        try:
            agent = load_agent(args.agent_type, args.agent_name or "Agent", config)
        except ValueError as e:
            print(f"Erreur lors de la création de l'agent: {str(e)}", file=sys.stderr)
            sys.exit(1)
    else:
        # Utiliser l'agent par défaut
        default_agent = args.default_agent.lower()
        config_path = os.path.join(current_dir, "config", f"{default_agent}_config.json")
        
        try:
            agent = load_agent_from_config(config_path)
        except Exception as e:
            print(f"Erreur lors du chargement de l'agent par défaut: {str(e)}", file=sys.stderr)
            sys.exit(1)
    
    # Traiter le message
    try:
        response = process_message(agent, args.message)
        print(json.dumps({"response": response}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()