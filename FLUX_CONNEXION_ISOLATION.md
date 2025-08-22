# Flux de Connexion & Séparation Multi-Tenant - Jamono

## Vue d'ensemble

Le système Jamono implémente une **séparation stricte multi-tenant** garantissant une isolation complète entre les espaces clients (entreprise vs individuel).

## Architecture d'Isolation

### 1. Séparation au niveau Base de Données

```sql
-- Chaque tenant a son propre espace isolé
tenants (
  id,
  tenant_type: 'enterprise' | 'freelance',
  isolation_level: 'strict'
)

-- Utilisateurs appartiennent exclusivement à un tenant
tenant_users (
  id,
  tenant_id FOREIGN KEY,
  email,
  role
)

-- Intégrations isolées par tenant
tenant_integrations (
  tenant_id FOREIGN KEY,
  integration_type: 'slack' | 'github' | 'k8s',
  configuration -- Chiffrée et isolée
)
```

### 2. Flux de Création de Compte

```
1. Utilisateur arrive sur Jamono
   ↓
2. Choix du type d'espace:
   • "Je suis une entreprise" 
   • "Je suis un utilisateur individuel"
   ↓
3. Création tenant dédié:
   • Entreprise → tenant "enterprise"
   • Individuel → tenant "freelance" 
   ↓
4. Isolation garantie:
   • Base de données séparée
   • Intégrations isolées  
   • Agents dédiés au tenant
```

## Types d'Espaces

### Espace Entreprise

**Principe**: Un tenant par organisation, gestion centralisée.

- **Admin entreprise** connecte une fois les outils (Slack org, GitHub org, clusters K8s)
- **Utilisateurs internes** héritent automatiquement des accès
- **Permissions granulaires** selon les rôles (admin, manager, developer, viewer)
- **Facturation centralisée** sur le tenant entreprise

**Cas d'usage typique**:
```
Startup TechCorp (50 devs)
├── Admin DSI connecte:
│   ├── Slack workspace TechCorp
│   ├── GitHub organization TechCorp
│   ├── Clusters K8s prod/staging
│   └── Jira TechCorp
├── Développeurs utilisent automatiquement:
│   ├── NOX sur Slack TechCorp
│   ├── Déploiements K8s TechCorp
│   └── Tickets Jira TechCorp
```

### Espace Individuel (Freelance)

**Principe**: Un tenant personnel, contrôle total individuel.

- **Le freelance** connecte directement ses outils personnels/clients
- **Intégrations multiples** selon les clients (Slack perso + Slack client A + K8s client B)
- **Facturation personnelle** simplifiée (19€/49€/99€ par mois)
- **Possibilité d'inviter clients** ponctuellement en mode viewer

**Cas d'usage typique**:
```
Marie, DevOps Freelance
├── Connecte directement:
│   ├── Slack personnel
│   ├── Slack client A
│   ├── GitHub personnel + pro
│   ├── Cluster K8s client A  
│   ├── Cluster K8s client B
│   └── Notion personnel
├── NOX agit 24/7:
│   ├── Monitoring tous les clusters
│   ├── Alertes sur Slack perso
│   ├── Tickets automatiques
│   └── Rapports Notion
```

## Mécanismes d'Isolation

### 1. Authentification avec Tenant

```typescript
// Login avec séparation stricte
POST /api/auth/login
{
  email: "marie@freelance.com",
  password: "...",
  tenantId?: 123 // Optionnel pour forcer un tenant
}

// Token JWT contient le tenant_id
{
  userId: 456,
  tenantId: 123, 
  userRole: "freelance",
  permissions: { ... }
}
```

### 2. Vérification d'Accès

```typescript
// Chaque requête vérifie l'appartenance tenant
middleware.requireAuth = (req, res, next) => {
  const { tenantId, userId } = req.session;
  
  // Vérifier que user appartient au tenant
  if (!verifyTenantAccess(userId, tenantId)) {
    return res.status(403).json({ error: "Accès refusé" });
  }
  
  // Injecter le tenantId dans toutes les requêtes
  req.tenantId = tenantId;
  next();
}
```

### 3. Agents Limités au Tenant

```typescript
// NOX ne peut agir que dans son tenant
class NOXAgent {
  async processMessage(message, context) {
    const { tenantId } = context;
    
    // Récupérer uniquement les intégrations du tenant
    const integrations = await getIntegrationsByTenant(tenantId);
    
    // Actions limitées au tenant
    if (action === "deploy") {
      return this.deployToTenantClusters(tenantId, ...);
    }
  }
}
```

### 4. Intégrations Isolées

#### Pour une Entreprise
```typescript
// L'admin connecte une fois
POST /api/integrations/slack
{
  tenantId: 789,
  workspaceUrl: "techcorp.slack.com",
  adminToken: "xoxp-admin-token"
}

// Tous les utilisateurs du tenant héritent
GET /api/integrations → filtrés par tenantId
```

#### Pour un Freelance  
```typescript
// Le freelance connecte ses outils
POST /api/integrations/slack
{
  tenantId: 456,
  workspaceUrl: "marie-perso.slack.com", 
  userToken: "xoxp-user-token"
}

POST /api/integrations/slack  
{
  tenantId: 456,
  workspaceUrl: "client-a.slack.com",
  userToken: "xoxp-client-a-token" 
}

// Intégrations multiples dans le même tenant freelance
```

## Avantages de cette Architecture

### ✅ Isolation Complète
- **Aucun mélange** entre espaces entreprise et freelance
- **Sécurité garantie** : un freelance ne peut pas accéder aux données d'une entreprise
- **Évolutivité** : ajout de nouveaux types d'espaces sans impact

### ✅ Gouvernance Adaptée  
- **Entreprise** : contrôle centralisé, permissions granulaires
- **Freelance** : autonomie complète, simplicité d'usage

### ✅ Flexibilité d'Intégrations
- **Entreprise** : une intégration → tous les utilisateurs
- **Freelance** : intégrations multiples selon les besoins clients

### ✅ Modèle Économique Cohérent
- **Entreprise** : facturation par siège, plans évolutifs
- **Freelance** : plans individuels fixes (19€/49€/99€)

## Routes d'Implémentation

```
GET  / → Accueil avec choix du type d'espace
GET  /account-type → Sélection détaillée Entreprise vs Freelance
POST /api/enterprise/onboard → Création espace entreprise
POST /api/freelance/onboard → Création espace freelance  
POST /api/auth/login → Connexion avec isolation tenant
GET  /api/tenant/:id/dashboard → Dashboard isolé par tenant
```

Cette architecture garantit une séparation stricte tout en offrant une expérience utilisateur adaptée à chaque contexte d'usage.