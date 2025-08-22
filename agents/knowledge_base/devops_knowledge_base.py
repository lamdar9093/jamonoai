#!/usr/bin/env python
"""
Base de connaissances DevOps pour l'agent IA.
Ce module fournit des informations spécifiques
au domaine DevOps qui peuvent être utilisées
pour améliorer les réponses de l'agent.
"""

# Base de connaissances structurée pour les
# sujets DevOps courants
DEVOPS_KNOWLEDGE = {
    # CI/CD
    "ci_cd": {
        "definition": """
        CI/CD (Intégration Continue / Déploiement Continu) est un ensemble de 
        pratiques qui automatisent le processus de développement logiciel, permettant 
        aux équipes de livrer des modifications plus fréquemment et plus fiablement.
        
        L'Intégration Continue (CI) consiste à intégrer automatiquement les modifications de 
        code dans un référentiel partagé, 
        suivi par des builds et des tests automatisés pour détecter les problèmes rapidement.
        
        Le Déploiement Continu (CD) permet de déployer automatiquement toutes les modifications 
        de code qui ont passé les étapes de test dans un environnement de production.
        """,
        "outils": ["Jenkins", "GitLab CI/CD", "GitHub Actions", "CircleCI", "Travis CI", "TeamCity", "Bamboo"],
        "code_examples": {
            "github_actions_workflow": """
            name: Python CI

            on:
              push:
                branches: [ main ]
              pull_request:
                branches: [ main ]

            jobs:
              build:
                runs-on: ubuntu-latest
                steps:
                - uses: actions/checkout@v3
                - name: Set up Python
                  uses: actions/setup-python@v4
                  with:
                    python-version: '3.10'
                - name: Install dependencies
                  run: |
                    python -m pip install --upgrade pip
                    pip install flake8 pytest
                    if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
                - name: Lint with flake8
                  run: |
                    flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
                - name: Test with pytest
                  run: |
                    pytest
            """,
            "jenkins_pipeline": """
            pipeline {
                agent {
                    docker {
                        image 'python:3.10-slim'
                    }
                }
                stages {
                    stage('Build') {
                        steps {
                            sh 'pip install -r requirements.txt'
                        }
                    }
                    stage('Test') {
                        steps {
                            sh 'pytest'
                        }
                    }
                    stage('Deploy') {
                        when {
                            branch 'main'
                        }
                        steps {
                            sh './deploy.sh'
                        }
                    }
                }
                post {
                    always {
                        junit 'test-reports/**/*.xml'
                    }
                    failure {
                        mail to: 'team@example.com',
                             subject: "Failed Pipeline: ${currentBuild.fullDisplayName}",
                             body: "Something is wrong with ${env.BUILD_URL}"
                    }
                }
            }
            """
        },
        "common_issues": [
            "Tests échouant de manière intermittente (flaky tests)",
            "Pipeline trop lent",
            "Gestion des secrets inadéquate",
            "Intégration difficile avec les environnements legacy",
            "Manque de visibilité et de métriques"
        ],
        "best_practices": [
            "Rendre les builds rapides",
            "Automatiser tout ce qui peut l'être",
            "Implémenter des tests couvrant différents niveaux (unitaires, intégration, e2e)",
            "Utiliser des environnements identiques pour test et production",
            "Implémenter le déploiement blue/green ou canary"
        ]
    },
    
    # Conteneurisation
    "containerization": {
        "definition": """
        La conteneurisation est une approche de virtualisation OS-level où les applications
        sont encapsulées dans des conteneurs avec leurs propres environnements d'exécution.
        Contrairement aux VMs traditionnelles, les conteneurs partagent le même noyau OS
        mais fonctionnent comme des processus isolés, rendant le déploiement plus léger,
        portable et cohérent entre les environnements.
        """,
        "technologies": ["Docker", "containerd", "CRI-O", "Podman", "LXC/LXD"],
        "orchestration": ["Kubernetes", "Docker Swarm", "Nomad", "OpenShift", "Amazon ECS"],
        "code_examples": {
            "dockerfile": """
            FROM python:3.10-slim
            
            WORKDIR /app
            
            COPY requirements.txt .
            RUN pip install --no-cache-dir -r requirements.txt
            
            COPY . .
            
            ENV PYTHONUNBUFFERED=1
            
            EXPOSE 8000
            
            CMD ["gunicorn", "--bind", "0.0.0.0:8000", "app:app"]
            """,
            "docker_compose": """
            version: '3.8'
            
            services:
              app:
                build: .
                ports:
                  - "8000:8000"
                environment:
                  - DATABASE_URL=postgresql://postgres:postgres@db:5432/app
                depends_on:
                  - db
              
              db:
                image: postgres:13
                volumes:
                  - postgres_data:/var/lib/postgresql/data/
                environment:
                  - POSTGRES_PASSWORD=postgres
                  - POSTGRES_USER=postgres
                  - POSTGRES_DB=app
            
            volumes:
              postgres_data:
            """,
            "kubernetes_deployment": """
            apiVersion: apps/v1
            kind: Deployment
            metadata:
              name: app-deployment
              labels:
                app: myapp
            spec:
              replicas: 3
              selector:
                matchLabels:
                  app: myapp
              template:
                metadata:
                  labels:
                    app: myapp
                spec:
                  containers:
                  - name: app
                    image: myapp:latest
                    ports:
                    - containerPort: 8000
                    env:
                    - name: DATABASE_URL
                      valueFrom:
                        secretKeyRef:
                          name: app-secrets
                          key: database-url
                    resources:
                      limits:
                        cpu: "1"
                        memory: "512Mi"
                      requests:
                        cpu: "0.5"
                        memory: "256Mi"
            """
        },
        "common_issues": [
            "Gestion des volumes et de la persistance des données",
            "Problèmes de networking et communication inter-conteneurs",
            "Gestion des ressources (CPU, mémoire)",
            "Sécurité des images et conteneurs",
            "Problèmes de performance et de mise à l'échelle"
        ],
        "debugging_commands": [
            "docker logs [container_id]",
            "docker exec -it [container_id] /bin/bash",
            "kubectl logs [pod_name]",
            "kubectl describe pod [pod_name]",
            "kubectl exec -it [pod_name] -- /bin/bash"
        ]
    },
    
    # Monitoring et Observabilité
    "monitoring": {
        "definition": """
        Le monitoring et l'observabilité dans DevOps concernent la collecte, l'analyse
        et la visualisation des données opérationnelles pour assurer la performance,
        la disponibilité et la fiabilité des systèmes.
        
        Alors que le monitoring traditionnel se concentre sur la collecte de métriques
        prédéfinies, l'observabilité moderne englobe logs, métriques et traces pour
        permettre de comprendre l'état interne d'un système à partir de ses sorties.
        """,
        "composants": ["Métriques", "Logs", "Traces", "Alertes", "Dashboards"],
        "outils": {
            "metriques": ["Prometheus", "Grafana", "Datadog", "New Relic", "Dynatrace"],
            "logs": ["Elasticsearch", "Logstash", "Kibana (ELK)", "Fluentd", "Graylog", "Loki"],
            "traces": ["Jaeger", "Zipkin", "OpenTelemetry", "AWS X-Ray"],
            "alerting": ["Alertmanager", "PagerDuty", "OpsGenie", "VictorOps"]
        },
        "code_examples": {
            "prometheus_config": """
            global:
              scrape_interval: 15s
            
            scrape_configs:
              - job_name: 'app'
                static_configs:
                  - targets: ['app:8000']
              
              - job_name: 'prometheus'
                static_configs:
                  - targets: ['localhost:9090']
                    
              - job_name: 'node'
                static_configs:
                  - targets: ['node-exporter:9100']
            """,
            "python_prometheus": """
            from flask import Flask
            from prometheus_flask_exporter import PrometheusMetrics
            
            app = Flask(__name__)
            metrics = PrometheusMetrics(app)
            
            # Static information as metric
            metrics.info('app_info', 'Application info', version='1.0.0')
            
            # Request count by endpoint
            @app.route('/')
            @metrics.counter('home_requests', 'Number of requests to home page')
            def home():
                return 'Hello World!'
                
            # Track request latency
            @app.route('/slow')
            @metrics.summary('slow_requests', 'Request latency for slow endpoint')
            def slow():
                import time
                time.sleep(1)
                return 'Slow response'
            
            if __name__ == '__main__':
                app.run(host='0.0.0.0', port=8000)
            """
        },
        "best_practices": [
            "Implémenter les quatre signaux d'or (latence, trafic, erreurs, saturation)",
            "Définir des SLIs (Indicators) et SLOs (Objectives) clairs",
            "Mettre en place une alerte basée sur les symptômes, pas les causes",
            "Collecter des métriques avec différentes granularités",
            "Centraliser tous les logs et impléser une stratégie de rétention",
            "Instrumenter le code pour la traçabilité distribuée"
        ]
    },
    
    # Infrastructure as Code (IaC)
    "infrastructure_as_code": {
        "definition": """
        L'Infrastructure as Code (IaC) est une approche qui consiste à gérer et
        provisionner l'infrastructure informatique à travers des fichiers de
        configuration plutôt que via une configuration manuelle.
        
        Cette pratique permet de traiter l'infrastructure comme du code source: 
        versionnable, testable, et déployable de manière reproductible et automatisée.
        """,
        "outils": ["Terraform", "AWS CloudFormation", "Azure Resource Manager", "Google Cloud Deployment Manager", "Pulumi", "Ansible", "Chef", "Puppet", "SaltStack"],
        "code_examples": {
            "terraform": """
            # Définir le provider AWS
            provider "aws" {
              region = "us-west-2"
            }
            
            # Créer un VPC
            resource "aws_vpc" "main" {
              cidr_block = "10.0.0.0/16"
              
              tags = {
                Name = "MainVPC"
                Environment = "Production"
              }
            }
            
            # Créer un sous-réseau public
            resource "aws_subnet" "public" {
              vpc_id     = aws_vpc.main.id
              cidr_block = "10.0.1.0/24"
              
              tags = {
                Name = "PublicSubnet"
              }
            }
            
            # Créer une instance EC2
            resource "aws_instance" "web" {
              ami           = "ami-0c55b159cbfafe1f0"
              instance_type = "t2.micro"
              subnet_id     = aws_subnet.public.id
              
              tags = {
                Name = "WebServer"
              }
            }
            
            # Output de l'IP publique
            output "instance_ip" {
              value = aws_instance.web.public_ip
            }
            """,
            "ansible_playbook": """
            ---
            - name: Configure webserver
              hosts: webservers
              become: yes
              
              vars:
                http_port: 80
                max_clients: 200
                
              tasks:
                - name: Install nginx
                  apt:
                    name: nginx
                    state: latest
                    
                - name: Copy website files
                  copy:
                    src: /local/path/to/website/
                    dest: /var/www/html/
                    
                - name: Configure nginx
                  template:
                    src: templates/nginx.conf.j2
                    dest: /etc/nginx/nginx.conf
                  notify:
                    - restart nginx
                    
                - name: Ensure nginx is running
                  service:
                    name: nginx
                    state: started
                    enabled: yes
                    
              handlers:
                - name: restart nginx
                  service:
                    name: nginx
                    state: restarted
            """
        },
        "best_practices": [
            "Versionner les configurations dans un système de contrôle de version",
            "Utiliser des modules réutilisables",
            "Implémenter une organisation hiérarchique et modulaire",
            "Suivre le principe d'immutabilité de l'infrastructure",
            "Exécuter des tests sur l'infrastructure",
            "Séparer l'état entre les environnements",
            "Utiliser le provisionnement en plusieurs étapes"
        ]
    },
    
    # Résolution de problèmes courants
    "troubleshooting": {
        "definition": """
        Le troubleshooting (dépannage) dans le contexte DevOps est le processus
        systématique d'identification, d'analyse et de résolution des problèmes
        survenant dans les environnements techniques complexes.
        
        Une approche efficace de troubleshooting combine l'utilisation d'outils
        de monitoring, l'analyse des logs, et l'application de méthodologies
        structurées pour diagnostiquer et résoudre les incidents.
        """,
        "methodologie": [
            "1. Collecte d'informations et reproduction du problème",
            "2. Identification des changements récents",
            "3. Formulation d'hypothèses sur les causes possibles",
            "4. Test des hypothèses une par une",
            "5. Implémentation et vérification de la solution",
            "6. Documentation du problème et de sa résolution"
        ],
        "problemes_courants": {
            "kubernetes": [
                "Pods stuck in Pending/CrashLoopBackOff",
                "Problèmes de networking entre pods",
                "Problèmes de volumes persistants",
                "Problèmes de ressources (CPU/memory)",
                "Issues d'authentification et autorisations"
            ],
            "docker": [
                "Problèmes de build d'images",
                "Conteneurs qui crashent au démarrage",
                "Problèmes de réseau Docker",
                "Problèmes de volumes et permissions",
                "Problèmes de performance"
            ],
            "ci_cd": [
                "Échecs de pipeline non reproductibles",
                "Problèmes d'intégration avec des services externes",
                "Tests échouant de manière intermittente",
                "Problèmes de déploiement"
            ],
            "cloud": [
                "Throttling d'API",
                "Problèmes de quota/limites",
                "Problèmes de réseau VPC",
                "Issues de sécurité et IAM",
                "Problèmes de scaling"
            ]
        },
        "code_examples": {
            "kubernetes_debugging": """
            # Vérifier l'état d'un pod
            kubectl get pod <pod-name> -n <namespace>
            
            # Voir les logs d'un pod
            kubectl logs <pod-name> -n <namespace>
            
            # Voir les logs du conteneur précédent (en cas de crash)
            kubectl logs <pod-name> -n <namespace> --previous
            
            # Obtenir des informations détaillées sur un pod
            kubectl describe pod <pod-name> -n <namespace>
            
            # Exécuter une commande dans un pod
            kubectl exec -it <pod-name> -n <namespace> -- /bin/sh
            
            # Vérifier les événements du cluster
            kubectl get events -n <namespace> --sort-by='.lastTimestamp'
            
            # Vérifier l'utilisation des ressources
            kubectl top pods -n <namespace>
            kubectl top nodes
            """,
        },
        "python_debugging": {
            "description": "Techniques de débogage Python pour applications en production",
            "procedure": """
            import logging
            import sys
            
            # Configuration du logger
            logging.basicConfig(
                level=logging.DEBUG,
                format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                handlers=[
                    logging.FileHandler("debug.log"),
                    logging.StreamHandler(sys.stdout)
                ]
            )
            
            logger = logging.getLogger(__name__)
            
            def troubleshoot_api_connection(api_url, auth_token):
                """Fonction pour diagnostiquer les problèmes de connexion API"""
                import requests
                from requests.exceptions import RequestException
                
                logger.info(f"Test de connexion à l'API: {api_url}")
                
                try:
                    # Test de base de disponibilité
                    logger.debug("Test de base de l'API sans authentification")
                    response = requests.get(api_url, timeout=5)
                    logger.debug(f"Statut HTTP: {response.status_code}")
                    
                    if response.status_code >= 400:
                        logger.error(f"Échec de connexion API: {response.status_code} - {response.text}")
                        return False
                    
                    # Test avec authentification
                    logger.debug("Test de l'API avec authentification")
                    headers = {"Authorization": f"Bearer {auth_token}"}
                    auth_response = requests.get(f"{api_url}/secure-endpoint", headers=headers, timeout=5)
                    
                    if auth_response.status_code >= 400:
                        logger.error(f"Échec d'authentification: {auth_response.status_code} - {auth_response.text}")
                        return False
                    
                    logger.info("Connexion API réussie avec authentification")
                    return True
                
                except RequestException as e:
                    logger.exception(f"Exception lors de la connexion à l'API: {str(e)}")
                    return False
            """
        }
    }
}

def get_devops_knowledge(topic=None, subtopic=None):
    """
    Récupère les informations de la base de connaissances DevOps.
    
    Args:
        topic (str, optional): Le sujet principal à récupérer.
                              Si None, retourne toute la base de connaissances.
        subtopic (str, optional): Le sous-sujet spécifique à récupérer.
                                 Nécessite que topic soit spécifié.
                                 
    Returns:
        dict: Les informations demandées de la base de connaissances.
    """
    if topic is None:
        return DEVOPS_KNOWLEDGE
    
    if topic not in DEVOPS_KNOWLEDGE:
        raise KeyError(f"Le sujet '{topic}' n'existe pas dans la base de connaissances DevOps.")
    
    if subtopic is None:
        return DEVOPS_KNOWLEDGE[topic]
    
    if subtopic not in DEVOPS_KNOWLEDGE[topic]:
        raise KeyError(f"Le sous-sujet '{subtopic}' n'existe pas dans le sujet '{topic}'.")
    
    return DEVOPS_KNOWLEDGE[topic][subtopic]

def get_all_topics():
    """
    Retourne tous les sujets disponibles dans la base de connaissances DevOps.
    
    Returns:
        list: Liste des sujets dans la base de connaissances.
    """
    return list(DEVOPS_KNOWLEDGE.keys())

def search_knowledge_base(query):
    """
    Recherche des informations dans la base de connaissances contenant la requête.
    Recherche simple basée sur les chaînes de caractères.
    
    Args:
        query (str): Le terme de recherche.
        
    Returns:
        dict: Dictionnaire des résultats correspondant à la requête.
    """
    query = query.lower()
    results = {}
    
    for topic, topic_data in DEVOPS_KNOWLEDGE.items():
        # Recherche au niveau du sujet
        if query in topic.lower() or (isinstance(topic_data.get("definition"), str) and query in topic_data["definition"].lower()):
            results[topic] = topic_data
            continue
            
        # Recherche dans les sous-sujets
        topic_results = {}
        for subtopic, subtopic_data in topic_data.items():
            if isinstance(subtopic_data, (str, list)):
                # Pour les chaînes et les listes
                data_str = str(subtopic_data).lower()
                if query in subtopic.lower() or query in data_str:
                    topic_results[subtopic] = subtopic_data
            elif isinstance(subtopic_data, dict):
                # Pour les dictionnaires (récursif une seule fois pour simplifier)
                for key, value in subtopic_data.items():
                    if (query in key.lower() or 
                        (isinstance(value, str) and query in value.lower()) or
                        (isinstance(value, list) and any(query in str(item).lower() for item in value))):
                        if subtopic not in topic_results:
                            topic_results[subtopic] = {}
                        topic_results[subtopic][key] = value
        
        if topic_results:
            results[topic] = topic_results
            
    return results

if __name__ == "__main__":
    # Test simple de la base de connaissances
    print("Sujets disponibles :", get_all_topics())
    
    # Exemple de recherche
    query = "kubernetes"
    print(f"\nRésultats de recherche pour '{query}':")
    results = search_knowledge_base(query)
    
    for topic in results:
        print(f"- {topic}")