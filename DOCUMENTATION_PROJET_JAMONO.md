# Documentation Projet Jamono
## Agent As a Service - Révolution de la Main d'Œuvre Numérique

---

## 📋 Table des Matières
1. [Vue d'ensemble du projet](#vue-densemble-du-projet)
2. [Architecture système](#architecture-système)
3. [Technologies utilisées](#technologies-utilisées)
4. [Structure de la base de données](#structure-de-la-base-de-données)
5. [Agents disponibles](#agents-disponibles)
6. [Fonctionnalités implémentées](#fonctionnalités-implémentées)
7. [Intégrations](#intégrations)
8. [Sécurité et multi-tenant](#sécurité-et-multi-tenant)
9. [Guide de développement](#guide-de-développement)
10. [État actuel et roadmap](#état-actuel-et-roadmap)

---

## 🎯 Vue d'ensemble du projet

### Concept
Jamono est une plateforme révolutionnaire de **"Agent As a Service"** qui déploie des agents IA spécialisés directement dans les équipes Slack comme des collègues numériques disponibles 24/7.

### Vision
Révolutionner la main d'œuvre avec des agents numériques spécialisés, en commençant par **NOX** (DevOps) et en démontrant le potentiel complet de la plateforme avec **ATLAS** (Cloud) et **CIRRUS** (Systems) en versions futures.

### Positionnement
- **NOX** : Agent DevOps disponible immédiatement
- **ATLAS** : Agent Cloud Architecture (version future)
- **CIRRUS** : Agent Systems Administration (version future)

### État actuel
Plateforme Jamono opérationnelle avec NOX comme agent principal et interface complète montrant l'écosystème d'agents futurs.

---

## 🏗️ Architecture système

### Architecture globale

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                         │
├─────────────────────────────────────────────────────────────────┤
│  • Interface utilisateur principale                             │
│  • Onboarding et gestion des workspaces                        │
│  • Dashboard orchestrateur                                      │
│  • Démo des agents et plateforme                               │
└─────────────────────────────────────────────────────────────────┘
                                  │
                               HTTP/WebSocket
                                  │
┌─────────────────────────────────────────────────────────────────┐
│                    Backend Node.js/Express                      │
├─────────────────────────────────────────────────────────────────┤
│  • API REST et WebSocket                                        │
│  • Orchestrateur d'agents                                       │
│  • Gestion multi-tenant                                         │
│  • Intégrations Slack/Jira/Calendar                            │
└─────────────────────────────────────────────────────────────────┘
                                  │
                              Bridge Python
                                  │
┌─────────────────────────────────────────────────────────────────┐
│                     Agents Python                               │
├─────────────────────────────────────────────────────────────────┤
│  • NOX (DevOps Expert)                                          │
│  • Bases de connaissances spécialisées                         │
│  • Traitement IA et réponses contextuelles                     │
└─────────────────────────────────────────────────────────────────┘
                                  │
                            Données/Storage
                                  │
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                          │
├─────────────────────────────────────────────────────────────────┤
│  • Données multi-tenant                                         │
│  • Conversations et historique                                  │
│  • Métriques et analytics                                       │
│  • Embeddings vectoriels                                        │
└─────────────────────────────────────────────────────────────────┘
```

### Flux de données

```
Slack User Message
        │
        ▼
Slack Events API ──→ Node.js Backend ──→ Python Agent (NOX)
        │                   │                    │
        ▼                   ▼                    ▼
Token Validation    Database Storage    Knowledge Base Search
        │                   │                    │
        ▼                   ▼                    ▼
Workspace Lookup    Conversation Log    AI Response Generation
        │                   │                    │
        ▼                   ▼                    ▼
Agent Deployment ◄── Response Storage ◄── Action Execution
        │                   │                    │
        ▼                   ▼                    ▼
Slack Response      Metrics Update      Jira/Calendar Integration
```

---

## 🔧 Technologies utilisées

### Frontend
- **React 18** - Interface utilisateur moderne
- **TypeScript** - Typage statique
- **Tailwind CSS** - Styling responsive
- **Wouter** - Routing côté client
- **Radix UI** - Composants UI accessibles
- **TanStack Query** - Gestion d'état et cache
- **Framer Motion** - Animations

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **TypeScript** - Typage statique
- **Drizzle ORM** - ORM moderne pour PostgreSQL
- **PostgreSQL** - Base de données relationnelle
- **WebSocket** - Communication temps réel

### Agents IA
- **Python 3** - Langage principal des agents
- **OpenAI API** - Modèles de langage (GPT-4o)
- **Vector Search** - Recherche sémantique
- **Embeddings** - Représentation vectorielle du contexte

### Intégrations
- **Slack API** - OAuth et événements temps réel
- **Jira API** - Création automatique de tickets
- **Calendar API** - Planification de réunions
- **Node-cron** - Tâches programmées

### Infrastructure
- **Vite** - Build tool moderne
- **ESBuild** - Bundling rapide
- **Drizzle Kit** - Migrations de base de données

---

## 🗄️ Structure de la base de données

### Tables principales

#### Multi-tenant
- **tenants** - Organisations clientes
- **tenant_users** - Utilisateurs par tenant
- **tenant_integrations** - Intégrations par tenant
- **action_zones** - Zones d'action autorisées
- **tenant_agent_configs** - Configuration agents par tenant

#### Agents et Orchestration
- **agents** - Définition des agents disponibles
- **workspaces** - Workspaces Slack connectés
- **agent_deployments** - Déploiements d'agents actifs
- **agent_interactions** - Historique des interactions
- **orchestration_tasks** - Tâches d'orchestration

#### Knowledge Base et IA
- **knowledge_documents** - Documents de formation
- **conversation_memory** - Mémoire conversationnelle
- **problem_solutions** - Solutions aux problèmes récurrents
- **agent_learning** - Apprentissage automatique des agents
- **agent_metrics** - Métriques de performance

### Relations clés

```
Tenants (1:N) ← TenantUsers
Tenants (1:N) ← Workspaces
Workspaces (1:N) ← AgentDeployments
AgentDeployments (1:N) ← AgentInteractions
Agents (1:N) ← KnowledgeDocuments
```

---

## 🤖 Agents disponibles

### NOX - Agent DevOps Expert
**Status**: ✅ Opérationnel

#### Capacités
- **Expertise DevOps complète** - CI/CD, containerisation, orchestration
- **Résolution d'incidents** - Diagnostic et solutions automatisées
- **Monitoring et alertes** - Surveillance proactive des systèmes
- **Automatisation** - Scripts et processus automatisés
- **Documentation** - Procédures et best practices

#### Actions automatiques
- **Création de tickets Jira** - Incidents automatiquement documentés
- **Planification de réunions** - Post-mortems et sessions de planification
- **Intégration calendar** - Scheduling automatique
- **Notifications proactives** - Alertes et recommandations

#### Configuration
```json
{
  "name": "NOX",
  "title": "Expert DevOps",
  "model": "gpt-4o",
  "temperature": 0.1,
  "specialization": "DevOps, Infrastructure, Automation",
  "actions": ["jira_ticket", "calendar_meeting", "infrastructure_check"]
}
```

### ATLAS - Agent Cloud Architecture
**Status**: 🔄 Version Future

#### Capacités prévues
- Architecture cloud multi-provider
- Optimisation des coûts
- Sécurité cloud
- Migration et modernisation

### CIRRUS - Agent Systems Administration
**Status**: 🔄 Version Future

#### Capacités prévues
- Administration systèmes
- Gestion des serveurs
- Sécurité système
- Performance tuning

---

## ⚡ Fonctionnalités implémentées

### Interface utilisateur
- ✅ **Landing page professionnelle** - Présentation de la plateforme
- ✅ **Démo NOX interactive** - Test en temps réel
- ✅ **Dashboard orchestrateur** - Gestion des déploiements
- ✅ **Onboarding Slack** - Intégration simplifiée
- ✅ **Plateforme demo** - Écosystème complet

### Backend et API
- ✅ **API REST complète** - CRUD pour toutes les entités
- ✅ **Multi-tenant SaaS** - Isolation complète des données
- ✅ **Authentication/Authorization** - Sécurité robuste
- ✅ **WebSocket temps réel** - Communication instantanée
- ✅ **Event sourcing** - Historique complet des actions

### Intégrations Slack
- ✅ **OAuth flow complet** - Installation sécurisée
- ✅ **Event handling temps réel** - Réponses instantanées
- ✅ **Commandes slash** - `/nox-status`, `/nox-help`, `/nox-metrics`
- ✅ **Mentions et DMs** - Interaction naturelle
- ✅ **Token management** - Refresh automatique

### Intelligence artificielle
- ✅ **OpenAI GPT-4o integration** - Réponses expertes
- ✅ **Vector search** - Recherche sémantique
- ✅ **Conversation memory** - Contexte persistant
- ✅ **Learning system** - Amélioration continue
- ✅ **Knowledge base** - Expertise spécialisée

### Automatisation
- ✅ **Jira integration** - Création automatique de tickets
- ✅ **Calendar integration** - Planification de réunions
- ✅ **Cron jobs** - Tâches programmées
- ✅ **Action detection** - Exécution automatique d'actions

---

## 🔗 Intégrations

### Slack
```typescript
// Configuration OAuth
{
  client_id: process.env.SLACK_CLIENT_ID,
  client_secret: process.env.SLACK_CLIENT_SECRET,
  scopes: ['bot', 'chat:write', 'channels:read', 'im:read']
}

// Event types supportés
- app_mention
- message
- im_message
- team_join
```

### Jira
```typescript
// Configuration API
{
  host: 'company.atlassian.net',
  username: 'api_user@company.com',
  password: 'api_token',
  apiVersion: '2'
}

// Actions automatiques
- createIssue()
- addComment()
- transitionIssue()
- searchIssues()
```

### Calendar (iCal)
```typescript
// Génération d'événements
{
  title: 'Post-mortem incident',
  start: new Date(),
  duration: { hours: 1 },
  attendees: ['team@company.com'],
  description: 'Review incident JIRA-1234'
}
```

---

## 🔒 Sécurité et multi-tenant

### Architecture multi-tenant
- **Isolation complète des données** - Aucune fuite entre tenants
- **Configuration par tenant** - Agents personnalisés
- **Permissions granulaires** - Contrôle d'accès fin
- **Audit trail complet** - Traçabilité des actions

### Sécurité
```typescript
// Authentification
- JWT tokens avec refresh
- Session management sécurisée
- Rate limiting par tenant
- IP whitelist support

// Autorisation
- RBAC (Role-Based Access Control)
- Action zones définies
- Integration permissions
- API key rotation
```

### Gestion des secrets
```typescript
// Variables d'environnement requises
OPENAI_API_KEY=sk-...
SLACK_CLIENT_ID=...
SLACK_CLIENT_SECRET=...
DATABASE_URL=postgresql://...
SESSION_SECRET=...

// Variables optionnelles
JIRA_HOST=...
JIRA_USERNAME=...
JIRA_API_TOKEN=...
```

---

## 💻 Guide de développement

### Structure du projet
```
jamono/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── components/       # Composants réutilisables
│   │   ├── pages/           # Pages de l'application
│   │   ├── hooks/           # Hooks React
│   │   └── lib/             # Utilitaires
├── server/                   # Backend Node.js
│   ├── routes.ts            # Routes API principales
│   ├── orchestrator.ts      # Orchestrateur d'agents
│   ├── slack-events.ts      # Gestion événements Slack
│   ├── agent-actions.ts     # Actions automatiques
│   └── storage.ts           # Couche de données
├── agents/                   # Agents Python
│   ├── models/              # Classes d'agents
│   ├── knowledge_base/      # Bases de connaissances
│   └── config/              # Configurations
├── shared/                   # Types et schémas partagés
│   └── schema.ts            # Schéma Drizzle ORM
└── conversation-history/     # Historique des conversations
```

### Scripts de développement
```bash
# Démarrage en développement
npm run dev

# Build production
npm run build

# Migration base de données
npm run db:push

# Vérification types
npm run check
```

### Variables d'environnement
```bash
# Development
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/jamono
OPENAI_API_KEY=sk-...
SLACK_CLIENT_ID=...
SLACK_CLIENT_SECRET=...
```

### Workflow de développement
1. **Modifier le schéma** dans `shared/schema.ts`
2. **Pousser les changements** avec `npm run db:push`
3. **Mettre à jour les routes** dans `server/routes.ts`
4. **Implémenter le frontend** dans `client/src/`
5. **Tester les intégrations** Slack/Jira

---

## 📊 État actuel et roadmap

### ✅ Implémenté (Q4 2024 - Q1 2025)
- **Plateforme de base** - Architecture multi-tenant complète
- **Agent NOX** - DevOps expert avec actions automatiques
- **Intégration Slack** - OAuth et événements temps réel
- **Interface utilisateur** - Landing, demo, dashboard
- **Automatisation** - Jira, Calendar, Cron jobs
- **Knowledge base** - Recherche vectorielle et apprentissage

### 🔄 En cours (Q1 2025)
- **Optimisation performance** - Cache et optimisations
- **Métriques avancées** - Analytics et reporting
- **Documentation technique** - Guides et API docs
- **Tests automatisés** - Suite de tests complète

### 🎯 Prévu (Q2 2025)
- **Agent ATLAS** - Expert Cloud Architecture
- **Agent CIRRUS** - Expert Systems Administration
- **Marketplace d'agents** - Agents tiers
- **API publique** - SDK pour développeurs
- **Enterprise features** - SSO, compliance, audit

### 🚀 Vision long terme (Q3-Q4 2025)
- **Écosystème d'agents** - 10+ agents spécialisés
- **IA multimodale** - Vision, audio, documents
- **Intégrations étendues** - AWS, Azure, GCP
- **Auto-scaling** - Infrastructure dynamique
- **Certification enterprise** - SOC2, ISO27001

---

## 📞 Support et documentation

### Ressources
- **Documentation technique** : `/docs` (en cours)
- **API Reference** : `/api-docs` (en cours)
- **Exemples d'intégration** : `/examples` (en cours)

### Contact équipe
- **Développement** : Via Slack workspace de développement
- **Support produit** : Contact direct avec l'équipe
- **Feedback utilisateurs** : Collecte via l'interface

---

*Document généré le 8 janvier 2025 - Version 1.0*
*Projet Jamono - Agent As a Service Platform*