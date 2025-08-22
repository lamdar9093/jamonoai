# Parcours Utilisateurs Jamono
## Différences entre Sign-Up individuel et Enterprise Onboarding

---

## 🎯 Vue d'ensemble des deux parcours

Jamono propose **deux parcours d'inscription distincts** avec des rôles, permissions et interfaces différents :

### 1. **Sign-Up Individuel** (`/sign-up`)
- **Cible** : Utilisateurs finaux individuels
- **Objectif** : Tester et utiliser les agents sans configuration complexe
- **Modèle** : Utilisateur simple dans le système global

### 2. **Enterprise Onboarding** (`/enterprise/onboard`)
- **Cible** : Entreprises et organisations
- **Objectif** : Créer un espace tenant multi-utilisateur isolé
- **Modèle** : Organisation avec admin, utilisateurs, intégrations et permissions

---

## 📋 Comparaison détaillée des parcours

| Aspect | Sign-Up Individuel | Enterprise Onboarding |
|--------|-------------------|----------------------|
| **URL d'accès** | `/sign-up` | `/enterprise/onboard` |
| **Processus** | 1 étape simple | 4 étapes guidées |
| **Données collectées** | Nom, Email, Mot de passe | Entreprise, Plan, Admin, Configuration |
| **Table DB principale** | `users` | `tenants` + `tenant_users` |
| **Isolation des données** | Partagée | Isolée par tenant |
| **Activation** | Immédiate | Via email d'activation |
| **Dashboard de destination** | Interface utilisateur standard | Dashboard tenant admin |

---

## 🔐 Différences de rôles et permissions

### Utilisateur Sign-Up Individuel

#### Rôle dans le système
```typescript
type: 'individual'
tenantId: null
role: undefined
permissions: {} // Permissions par défaut
```

#### Capacités et limitations
- ✅ **Peut faire** :
  - Utiliser la démo NOX (`/nox-demo`)
  - Voir l'interface publique de la plateforme
  - Tester les interactions avec NOX en mode limité
  - Accéder aux pages informatives (`/`, `/platform-demo`)

- ❌ **Ne peut pas faire** :
  - Créer des workspaces Slack privés
  - Configurer des intégrations personnalisées
  - Gérer des utilisateurs
  - Accéder aux zones d'action sécurisées
  - Voir les métriques détaillées
  - Déployer des agents en production

#### Interface utilisateur
```typescript
// Après connexion - redirection vers
if (result.user.tenantId) {
  setLocation(`/tenant/${result.user.tenantId}/dashboard`); // N'arrive jamais
} else {
  setLocation('/'); // Page d'accueil standard
}
```

### Utilisateur Enterprise (Admin)

#### Rôle dans le système
```typescript
type: 'tenant_admin'
tenantId: number // ID du tenant de l'entreprise
role: 'admin'
permissions: {
  canManageUsers: true,
  canConfigureIntegrations: true,
  canManageAgents: true,
  canViewAllData: true
}
```

#### Capacités complètes
- ✅ **Administration complète** :
  - Gérer les utilisateurs du tenant
  - Configurer les intégrations (Slack, Jira, etc.)
  - Définir les zones d'action autorisées
  - Configurer les agents par tenant
  - Voir toutes les métriques et analytics
  - Gérer les permissions granulaires

- ✅ **Configuration avancée** :
  - Plans tarifaires (Starter, Professional, Enterprise)
  - Intégrations personnalisées par tenant
  - Zones d'action sécurisées
  - Déploiement d'agents en production
  - Branding personnalisé

#### Interface administrateur
```typescript
// Dashboard tenant complet avec onglets :
- Intégrations configurées
- Zones d'action définies  
- Agents déployés
- Utilisateurs du tenant
- Métriques et rapports
```

---

## 🏗️ Architecture technique des différences

### Base de données et isolation

#### Utilisateur individuel
```sql
-- Table simple
INSERT INTO users (username, email, password) 
VALUES (email, email, hashed_password);

-- Pas d'isolation des données
-- Accès partagé aux ressources publiques
-- Pas de configuration tenant
```

#### Utilisateur enterprise
```sql
-- Création du tenant
INSERT INTO tenants (name, domain, plan_type, status)
VALUES ('Acme Corp', 'acme.com', 'professional', 'trial');

-- Utilisateur admin avec permissions
INSERT INTO tenant_users (tenant_id, email, name, role, permissions)
VALUES (tenant_id, admin_email, admin_name, 'admin', full_permissions);

-- Tables de configuration liées
INSERT INTO tenant_integrations (...);
INSERT INTO action_zones (...);
INSERT INTO tenant_agent_configs (...);
```

### Gestion des sessions et tokens

#### Token utilisateur individuel
```typescript
const token = jwt.sign({
  userId: user.id,
  email: user.email,
  type: 'individual'
}, JWT_SECRET);

// Payload simple sans contexte tenant
```

#### Token utilisateur enterprise
```typescript
const token = jwt.sign({
  userId: tenantUser.id,
  email: tenantUser.email,
  tenantId: tenant.id,
  role: 'admin',
  permissions: full_permissions,
  type: 'tenant_admin'
}, JWT_SECRET);

// Payload riche avec contexte complet
```

---

## 🎨 Différences d'interfaces utilisateur

### Landing et navigation

#### Utilisateur individuel
```typescript
// Pages accessibles
- /                    // Landing page publique
- /nox-demo           // Démo interactive (mode limité)
- /platform-demo      // Présentation de la plateforme
- /search             // Recherche publique

// Interface simple et épurée
// Focus sur la découverte et test
```

#### Utilisateur enterprise
```typescript
// Dashboard tenant complet
- /tenant/:tenantId/dashboard  // Dashboard administratif
  ├── Onglet Intégrations     // Configuration Slack, Jira, etc.
  ├── Onglet Zones d'action   // Périmètres de sécurité
  ├── Onglet Agents           // Configuration NOX, ATLAS, CIRRUS
  ├── Onglet Utilisateurs     // Gestion équipe
  └── Onglet Déploiement      // Mise en production

// Interface riche et professionnelle
// Focus sur la configuration et gestion
```

### Onboarding et activation

#### Processus Sign-Up (1 étape)
```typescript
1. Formulaire simple
   - Nom complet
   - Email  
   - Mot de passe (+ confirmation)
   - Acceptation CGU

2. Activation immédiate
   - Connexion automatique
   - Redirection vers /
   - Toast de bienvenue
```

#### Processus Enterprise (4 étapes)
```typescript
1. Informations entreprise
   - Nom de l'entreprise
   - Domaine (optionnel)

2. Plan et fonctionnalités
   - Starter (gratuit, 5 users, 1 agent)
   - Professional (49€/mois, 25 users, 3 agents)
   - Enterprise (sur mesure, illimité)

3. Administrateur
   - Nom administrateur
   - Email administrateur
   - Permissions complètes

4. Finalisation
   - Création tenant
   - Email d'activation
   - Lien vers dashboard
```

---

## 📊 Fonctionnalités par type d'utilisateur

### Matrice des fonctionnalités

| Fonctionnalité | Individuel | Enterprise Admin | Enterprise User |
|----------------|------------|------------------|-----------------|
| **Démo NOX** | ✅ Limitée | ✅ Complète | ✅ Selon permissions |
| **Déploiement Slack** | ❌ | ✅ | ❌ |
| **Configuration intégrations** | ❌ | ✅ | ❌ |
| **Gestion utilisateurs** | ❌ | ✅ | ❌ |
| **Métriques avancées** | ❌ | ✅ | ✅ Vue seule |
| **Zones d'action** | ❌ | ✅ Configuration | ✅ Utilisation |
| **Agents personnalisés** | ❌ | ✅ | ✅ |
| **Support technique** | 🔶 Communauté | ✅ Prioritaire | ✅ Via admin |

### Limites par plan Enterprise

#### Starter (Gratuit)
```typescript
{
  maxUsers: 5,
  maxAgents: 1, // NOX seulement
  features: [
    "1 agent NOX DevOps",
    "5 utilisateurs max", 
    "Intégrations de base (Slack, Jira)",
    "Support communauté"
  ]
}
```

#### Professional (49€/mois)
```typescript
{
  maxUsers: 25,
  maxAgents: 3, // NOX + futurs ATLAS, CIRRUS
  features: [
    "3 agents (NOX + futurs ATLAS, CIRRUS)",
    "25 utilisateurs",
    "Toutes les intégrations", 
    "Support prioritaire",
    "Zones d'action avancées",
    "Permissions granulaires"
  ]
}
```

#### Enterprise (Sur mesure)
```typescript
{
  maxUsers: "Illimité",
  maxAgents: "Tous",
  features: [
    "Agents illimités",
    "Utilisateurs illimités",
    "Intégrations personnalisées",
    "Support dédié 24/7",
    "SLA garanti", 
    "Déploiement on-premise"
  ]
}
```

---

## 🔄 Flux de données et sécurité

### Isolation des données

#### Utilisateur individuel
```sql
-- Accès partagé aux données publiques
SELECT * FROM agents WHERE id IN (1, 2, 3); -- Agents publics
SELECT * FROM knowledge_documents WHERE is_public = true;

-- Pas de données tenant-spécifiques
-- Pas de configurations personnalisées
```

#### Utilisateur enterprise
```sql
-- Isolation complète par tenant_id
SELECT * FROM tenant_integrations WHERE tenant_id = :current_tenant;
SELECT * FROM action_zones WHERE tenant_id = :current_tenant;
SELECT * FROM tenant_agent_configs WHERE tenant_id = :current_tenant;

-- Row Level Security (RLS)
CREATE POLICY tenant_isolation ON agent_interactions
FOR ALL TO authenticated_users  
USING (deployment_id IN (
  SELECT ad.id FROM agent_deployments ad
  JOIN workspaces w ON ad.workspace_id = w.id
  WHERE w.tenant_id = current_setting('app.current_tenant_id')::INTEGER
));
```

### Permissions et contrôle d'accès

#### Check de permissions dans l'API
```typescript
// Middleware pour utilisateur individuel
if (user.type === 'individual') {
  // Accès limité aux endpoints publics
  if (!publicEndpoints.includes(req.path)) {
    return res.status(403).json({ message: 'Accès non autorisé' });
  }
}

// Middleware pour tenant admin
if (user.type === 'tenant_admin') {
  // Vérification des permissions spécifiques
  const hasPermission = await checkTenantPermission(
    user.tenantId, 
    user.userId, 
    requiredPermission
  );
  
  if (!hasPermission) {
    return res.status(403).json({ message: 'Permission insuffisante' });
  }
}
```

---

## 🎯 Cas d'usage typiques

### Utilisateur Sign-Up Individuel

**Persona** : Développeur curieux, freelance, étudiant
**Objectifs** :
- Découvrir la plateforme Jamono
- Tester NOX en mode démo
- Évaluer l'intérêt pour son entreprise

**Parcours typique** :
1. Visite `/` depuis un lien ou recherche Google
2. Teste `/nox-demo` pour voir les capacités
3. S'inscrit via `/sign-up` pour un accès persistent
4. Utilise l'interface pour explorer les fonctionnalités
5. Potentiellement recommande à son entreprise

### Utilisateur Enterprise Onboarding

**Persona** : CTO, Lead DevOps, IT Manager
**Objectifs** :
- Déployer NOX pour son équipe
- Configurer des intégrations métier
- Gérer les accès et permissions
- Mesurer la valeur ajoutée

**Parcours typique** :
1. Arrivée via `/enterprise/onboard` depuis le site commercial
2. Configuration complète du tenant (4 étapes)  
3. Activation du compte admin par email
4. Configuration des intégrations Slack/Jira
5. Définition des zones d'action sécurisées
6. Invitation des utilisateurs de l'équipe
7. Déploiement NOX en production
8. Monitoring et optimisation

---

## 💡 Recommandations stratégiques

### Pour le développement
1. **Maintenir la simplicité** du parcours individuel pour la conversion
2. **Enrichir les fonctionnalités** enterprise pour la rétention
3. **Implémenter la migration** individuel → enterprise
4. **Développer l'onboarding** utilisateur final dans les tenants

### Pour le produit
1. **Free trial** limité pour les individuels
2. **Démonstration de valeur** rapide pour les enterprises
3. **Self-service** maximum pour réduire les frictions
4. **Support échelonné** selon le type d'utilisateur

---

*Document rédigé le 8 janvier 2025*
*Jamono Platform - User Journey Analysis*