# Jamono - Agent As a Service

## Project Overview
Jamono est une plateforme révolutionnaire de "main d'œuvre numérique" - Agent As a Service - qui déploie des agents spécialisés prêts à l'emploi dans les équipes Slack. La plateforme positionne des agents IA compétents comme des collègues professionnels disponibles 24/7.

**Goal**: Révolutionner la main d'œuvre avec des agents numériques spécialisés, en commençant par NOX (DevOps) et en démontrant le potentiel complet de la plateforme avec ATLAS (Cloud) et CIRRUS (Systems) en versions futures.

**Current State**: Plateforme Jamono opérationnelle avec NOX comme agent principal et interface complète montrant l'écosystème d'agents futurs.

## Architecture
- **Frontend**: React + TypeScript with Tailwind CSS
- **Backend**: Node.js/Express with PostgreSQL database
- **AI Integration**: OpenAI API for agent responses and embeddings
- **Slack Integration**: OAuth-based Slack Bot API with real-time event handling
- **Agent System**: Python-based agents with specialized knowledge bases

## Recent Changes

### August 9, 2025 - Flux de Connexion & Séparation Multi-Tenant Stricte
- **Page sélection type compte** : `/account-type` avec choix clair Entreprise vs Individuel  
- **Système d'authentification isolé** : JWT avec tenant_id, vérification d'accès stricte
- **Service AuthService** : Authentification avec isolation multi-tenant, middleware de permissions
- **Routes dual complètes** : `/api/enterprise/onboard` et `/api/freelance/onboard` fonctionnelles
- **Isolation base de données** : Chaque requête filtrée par tenant_id, aucun mélange possible
- **Intégrations séparées** : Entreprise (admin connecte une fois) vs Freelance (connecte ses outils personnels)
- **Agents dédiés** : NOX ne peut agir que dans le cadre de son tenant assigné
- **Documentation complète** : `FLUX_CONNEXION_ISOLATION.md` détaille mécanismes d'isolation
- **Navigation mise à jour** : Page d'accueil redirige vers sélection type compte plutôt que direct entreprise

### August 9, 2025 - Architecture Espaces Clients Dual (Entreprise + Freelance)
- **Structure multi-tenant complète** : Support entreprise ET freelance avec séparation stricte des données
- **Espace Entreprise** : Un tenant par entreprise, admin entreprise + utilisateurs internes avec permissions granulaires
- **Espace Freelance** : Tenant isolé même pour une seule personne - évite tout mélange, garantit évolutivité
- **Rôles complets** : admin, manager, developer, viewer + nouveau rôle 'freelance' avec permissions complètes sur son espace
- **Plans Freelance** : Solo (19€/mois, NOX), Pro (49€/mois, NOX+ATLAS), Enterprise (99€/mois, tous agents)
- **Cas d'usage freelance typique** : DevOps freelance connecte Slack perso + cluster K8s clients + GitHub + Notion
- **Onboarding dual** : `/enterprise/onboard` vs `/freelance/onboard` avec UX adaptée à chaque contexte
- **Interface d'administration** : Page `/tenant/:id/admin` pour gestion complète des espaces entreprise
- **Documentation exhaustive** : `ARCHITECTURE_ESPACES_CLIENTS.md` détaille les deux architectures et workflows
- **Types TypeScript** : Interface `TenantUserPermissions` avec helper `getDefaultPermissionsByRole()` incluant 'freelance'

### July 4, 2025 - NOX Agent Actions & Automation System
- **Major upgrade**: NOX now has automatic ACTION capabilities, not just responses
- **Jira integration**: Creates incident tickets automatically when problems are reported
- **Calendar integration**: Schedules post-mortem meetings and planning sessions automatically
- **Action detection**: Analyzes messages and executes appropriate actions (tickets, meetings, tasks)
- **New identity**: NOX presents as expert with "POUVOIRS D'ACTION AUTOMATIQUE"
- **Response pattern**: "J'ai créé automatiquement le ticket JIRA-1234 et planifié un post-mortem..."
- **Integration management**: Actions NOX tab in orchestrator dashboard for post-deployment configuration
- **Dependencies added**: node-jira-client, node-cron, ical-generator for full automation

### July 4, 2025 - Critical NOX Behavior Fix  
- **Problem resolved**: NOX was responding like generic ChatGPT instead of DevOps expert
- **Root cause**: Corrupted conversation history contained hundreds of "Comment puis-je vous aider?" responses
- **Solution**: Completely cleared conversation history and reinforced system prompts
- **NOX behavior transformation**: Now responds as expert DevOps colleague, not chatbot assistant
- **Model upgraded**: Using GPT-4o with temperature 0.1 for better instruction following
- **Response formatting**: Removed repetitive "**NOX**" name and robot icon from each message

### July 2, 2025 - Jamono Platform Launch & Content Optimization
- **Rebranded to Jamono**: "Agent As a Service" - révolution de la main d'œuvre numérique
- **Platform concept**: NOX disponible maintenant, ATLAS et CIRRUS avec tags "Version Future"
- **Content duplication resolved**: Replaced "Capacités techniques complètes" section with "Excellence des agents Jamono" to avoid DevOps-only impression
- **Multi-agent ecosystem showcase**: NOX presented as first available agent among future ATLAS/CIRRUS agents
- **Platform vision enhanced**: Added platform vision section showing NOX alongside future agents
- **NOX identity enhanced**: Updated NOX system prompt to properly identify as "NOX de Jamono" with full platform context and DevOps expertise
- **Agent positioning**: NOX now understands he represents Jamono's digital workforce excellence and can redirect to future agents
- **Modern interface**: Landing page professionnelle avec concept de collègues numériques 24/7
- **Platform demonstration**: Nouvelle page `/platform-demo` montrant l'écosystème complet d'agents
- **Professional positioning**: Éliminé les références "MVP" pour positionnement production
- **Navigation optimisée**: Accueil, Démo NOX, Plateforme, Intégration Slack

### June 13, 2025 - Agent Marketplace Stabilization
- **Fixed NOX multiple responses**: Implemented global event cache to prevent duplicate processing
- **Resolved authentication flow**: Slack OAuth integration working correctly
- **Enhanced channel reading**: NOX can now read recent channel messages for context
- **Professional agent responses**: Specialized system prompts for DevOps expertise

### Technical Improvements
- Event deduplication system prevents multiple agent responses
- Token management system handles Slack authentication lifecycle
- Conversation history system maintains context across interactions
- Agent orchestration manages multi-agent workspace deployments

## User Preferences
- Focus on professional, scalable implementation ready for investor funding
- Prioritize real Slack integration over mock/placeholder systems
- Maintain individual agent identities and specialized capabilities
- Ensure 24/7 availability with robust error handling

## Key Features Implemented
1. **Agent Marketplace Interface**: `/onboarding/agents` page for agent selection
2. **Multi-Agent Deployment**: API endpoints for deploying multiple agents simultaneously
3. **Slack Event Handling**: Real-time processing of mentions and direct messages
4. **Professional Agent Responses**: Specialized system prompts for DevOps, Cloud Architecture, and Systems Administration
5. **Conversation Memory**: Persistent chat history with context awareness
6. **Token Management**: Automatic refresh and validation of Slack workspace tokens

## Current Status
- NOX responding correctly to technical DevOps questions in Slack
- Agent selection interface functional with professional UI
- Multi-workspace support with secure token management
- Vector search capabilities (fallback mode due to embedding model access)
- Event deduplication preventing response conflicts

## Next Steps
- Monitor agent performance in production Slack environments
- Optimize embedding model access for enhanced technical knowledge retrieval
- Scale agent deployment capabilities for enterprise workspaces