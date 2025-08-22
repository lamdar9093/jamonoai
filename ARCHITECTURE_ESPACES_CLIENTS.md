# Architecture Espaces Clients - Jamono

## Vue d'ensemble

Architecture multi-tenant avec séparation stricte des données. Chaque client (entreprise ou individuel) dispose d'un tenant unique avec gestion des permissions adaptée à leur contexte.

## 🏢 Types d'Espaces Clients

### Espace Client Entreprise
Chaque entreprise dispose d'un tenant unique avec deux types d'utilisateurs : **Admin Entreprise** et **Utilisateurs Internes**.

### 👤 Espace Client Individuel/Freelance
Un tenant isolé même pour une seule personne - évite tout mélange de données et garantit évolutivité.

## 🏢 Structure Tenant Entreprise

### Un seul tenant par entreprise
- **Séparation stricte** : Toutes les données (conversations, configs, intégrations) sont isolées par tenant
- **Sécurité renforcée** : Aucune fuite de données entre entreprises
- **Évolutivité** : Architecture supportant croissance entreprise

## 👨‍💼 Admin Entreprise

### Responsabilités principales
- **💰 Gestion facturation** : Plans, paiements, limites utilisateurs
- **👥 Gestion équipe** : Invitation collaborateurs via emails professionnels
- **🔗 Intégrations globales** : Configuration centralisée des services entreprise
- **📊 Supervision** : Analytics et rapports d'utilisation

### Intégrations configurables
- **Slack Enterprise** : Bot NOX dans channels d'équipe
- **GitHub Organizations** : Accès repositories, déploiements
- **Jira/Confluence** : Création tickets, suivi incidents
- **Kubernetes Clusters** : Déploiements, monitoring, logs
- **Datadog/Grafana** : Alertes, métriques, dashboards
- **Teams Microsoft** : Intégration collaborative

### Permissions Admin
```typescript
{
  canManageUsers: true,           // Inviter/supprimer collaborateurs
  canConfigureIntegrations: true, // Configurer services entreprise  
  canManageBilling: true,         // Gérer facturation et plan
  canManageActionZones: true,     // Définir zones d'action autorisées
  canManageAgents: true,          // Configuration globale agents
  canViewAnalytics: true,         // Analytics et rapports complets
  canUseAllAgents: true          // Accès complet à tous les agents
}
```

## 👩‍💻 Utilisateurs Internes

### Points d'accès multiples
1. **Via Slack** : Commandes directes avec NOX dans channels équipe
2. **Via Teams** : Intégration Microsoft Teams (futur)
3. **Via Plateforme Web** : Dashboard personnalisé avec actions

### Cas d'usage typique - Société X
**Configuration Admin :**
- Connecte Slack entreprise + Kubernetes cluster + Datadog
- Définit permissions : tous devs peuvent déployer en staging, seuls seniors en prod
- Configure alertes automatiques pour incidents critiques

**Usage Collaborateurs :**
```bash
# Dans Slack #devops
@NOX déploie branche feature/auth en staging
@NOX affiche logs du service user-api
@NOX status cluster kubernetes 
@NOX créer ticket incident service down
```

### Permissions Utilisateurs Internes
```typescript
{
  // Accès aux agents
  canUseSlackBot: true,           // NOX via Slack
  canUseTeamsBot: false,          // Teams (selon config admin)
  canUsePlatform: true,           // Dashboard web
  
  // Actions DevOps (selon niveau)
  canRequestDeployments: true,    // Déploiements autorisés
  canViewLogs: true,              // Consultation logs
  canReceiveAlerts: true,         // Alertes monitoring
  
  // Agents disponibles
  canUseNOX: true,               // Agent DevOps principal
  canUseATLAS: false,            // Cloud (version future)
  canUseCIRRUS: false,           // Systems (version future)
  
  // Limites et restrictions
  maxActionsPerDay: 50,          // Limite quotidienne
  allowedActionTypes: ["deploy", "logs", "status"], // Actions permises
  restrictedResources: ["prod-db"] // Ressources interdites
}
```

## 🔒 Sécurité et Gouvernance

### Isolation des données
- **Tenant séparé** : Jamais de données croisées entre entreprises
- **Chiffrement** : Tokens et configurations sensibles chiffrés
- **Audit trail** : Traçabilité complète des actions

### Contrôle des accès
- **Role-based** : Admin vs Utilisateurs internes
- **Action-based** : Permissions granulaires par type d'action
- **Resource-based** : Restrictions sur ressources critiques

### Limites et quotas
- **Par plan** : Nombre d'utilisateurs, agents, actions mensuelles
- **Par utilisateur** : Actions quotidiennes, types d'accès
- **Par ressource** : Environnements accessibles (dev/staging/prod)

## 📈 Plans et Évolutivité

### Starter (Gratuit)
- 1 admin + 5 utilisateurs internes max
- 1 agent NOX uniquement
- Intégrations de base (Slack, Jira)
- 1000 actions/mois

### Professional (49€/mois)
- 1 admin + 25 utilisateurs internes max
- 3 agents (NOX + futurs ATLAS/CIRRUS)
- Toutes intégrations disponibles
- 10 000 actions/mois
- Support prioritaire

### Enterprise (Sur mesure)
- Utilisateurs illimités
- Agents illimités
- Intégrations personnalisées
- Actions illimitées
- Support dédié 24/7
- SLA garanti
- Déploiement on-premise

## 🚀 Workflow Complet

### Onboarding Entreprise
1. **Admin s'inscrit** → Crée tenant entreprise
2. **Configure intégrations** → Slack org, GitHub, K8s, etc.
3. **Invite collaborateurs** → Via emails professionnels
4. **Définit permissions** → Qui peut faire quoi, où
5. **Lance NOX** → Déploiement dans Slack d'équipe

### Usage Quotidien
1. **Dev demande déploiement** → Via Slack @NOX
2. **NOX vérifie permissions** → Autorisé pour cet utilisateur/environnement ?
3. **Exécute action** → Déploiement K8s + notifications équipe
4. **Trace activité** → Logs audit pour admin
5. **Rapports automatiques** → Métriques usage pour facturation

## 🧑‍💻 Espace Client Individuel/Freelance

### Structure simplifiée
- **Tenant personnel** : Un seul tenant même pour une personne - architecture cohérente
- **Utilisateur unique** : Le freelance est admin et utilisateur de son propre espace
- **Évolutivité** : Peut inviter clients ou collaborateurs ponctuels si besoin

### Compte personnel
- **💰 Facturation simple** : Abonnement mensuel sans complexité équipe
- **🔗 Intégrations limitées** : Slack perso, GitHub perso, Notion, outils individuels
- **👤 Gestion solo** : Pas de gestion d'équipe (ou très limitée)
- **🚀 Déploiement rapide** : Configuration immédiate sans validation entreprise

### Cas d'usage typique - Freelance DevOps
**Configuration personnelle :**
- Connecte son agent NOX à son Slack personnel
- Intègre cluster K8s qu'il administre pour ses clients
- Configure ses repos GitHub privés et professionnels
- Connecte Notion pour documentation technique

**Usage quotidien :**
```bash
# Dans son Slack perso #devops
@NOX déploie site-client-X en production
@NOX status cluster client-Y
@NOX backup base données client-Z
@NOX créer rapport hebdo dans Notion
```

### Permissions Freelance
```typescript
{
  // Admin complet de son espace
  canManageUsers: true,           // Peut inviter clients ponctuels
  canConfigureIntegrations: true, // Ses outils perso
  canManageBilling: true,         // Sa facturation
  canManageActionZones: true,     // Ses environnements clients
  canManageAgents: true,          // Configuration NOX perso
  canViewAnalytics: true,         // Ses métriques d'activité
  
  // Usage illimité pour lui
  canUseSlackBot: true,
  canUsePlatform: true,
  canRequestDeployments: true,
  canViewLogs: true,
  canReceiveAlerts: true,
  
  // Agents selon plan
  canUseNOX: true,
  canUseATLAS: false,    // Plan Pro requis
  canUseCIRRUS: false,   // Plan Enterprise requis
  
  // Limites freelance
  maxActionsPerDay: 100,
  allowedActionTypes: ['*'], // Toutes actions
  restrictedResources: []    // Aucune restriction
}
```

### Plans Freelance

#### Solo (19€/mois)
- 1 utilisateur (le freelance)
- Agent NOX uniquement
- 3 intégrations max (Slack, GitHub, 1 autre)
- 2000 actions/mois
- Support par email

#### Pro (49€/mois)
- 1 utilisateur principal + 3 invités ponctuels
- NOX + ATLAS (Cloud)
- 10 intégrations
- 10 000 actions/mois
- Support prioritaire
- Rapports détaillés

#### Freelance Enterprise (99€/mois)
- Utilisateurs illimités (pour gros projets)
- Tous les agents (NOX, ATLAS, CIRRUS)
- Intégrations illimitées
- Actions illimitées
- Support dédié
- SLA garanti
- White-label possible

### Workflow Freelance

#### Onboarding Simplifié
1. **Inscription rapide** → Email + mot de passe
2. **Créer tenant personnel** → Automatique
3. **Connecter Slack perso** → OAuth simple
4. **Configurer première intégration** → GitHub ou K8s
5. **Lancer NOX** → Immédiat dans Slack

#### Usage Quotidien
1. **Commande dans Slack** → @NOX action
2. **NOX exécute** → Selon permissions freelance
3. **Notification résultat** → Slack + email si critique
4. **Logs centralisés** → Dashboard personnel
5. **Facturation automatique** → Selon usage mensuel

#### Collaboration Ponctuelle
- **Inviter client temporaire** → Accès lecture seule à un projet
- **Partager rapport** → Link temporaire sécurisé
- **Demo en live** → Écran partagé avec exécution temps réel

Cette architecture garantit une **séparation stricte**, une **gouvernance adaptée** et une **expérience fluide** pour tous les types de clients - entreprises comme freelances.