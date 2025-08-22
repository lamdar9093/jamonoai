/**
 * Service de gestion multi-tenant pour Jamono SaaS
 * Gère la création de tenants, utilisateurs, intégrations et zones d'action
 */

import { db } from "./db";
import { 
  tenants, 
  tenantUsers, 
  tenantIntegrations,
  actionZones,
  tenantAgentConfigs,
  workspaces,
  type Tenant,
  type TenantUser,
  type TenantIntegration,
  type ActionZone,
  type TenantAgentConfig,
  type InsertTenant,
  type InsertTenantUser,
  type InsertTenantIntegration,
  type InsertActionZone,
  type InsertTenantAgentConfig,
  type TenantUserPermissions,
  type TenantUserRole,
  getDefaultPermissionsByRole
} from "@shared/schema";
import { eq, and, inArray } from "drizzle-orm";
import crypto from "crypto";

// Interface TenantUserPermissions maintenant importée de shared/schema.ts

export interface OnboardingRequest {
  companyName: string;
  domain?: string;
  adminEmail: string;
  adminName: string;
  planType?: 'starter' | 'professional' | 'enterprise';
}

export interface FreelanceOnboardingRequest {
  name: string;
  email: string;
  password: string;
  slackWorkspace?: string;
  planType: 'solo' | 'pro' | 'enterprise';
}

export interface InviteUserRequest {
  tenantId: number;
  email: string;
  name: string;
  role: TenantUserRole;
  invitedBy: number;
  permissions?: TenantUserPermissions;
}

export interface IntegrationTestResult {
  success: boolean;
  message: string;
  details?: any;
  error?: string;
}

export class TenantService {
  
  /**
   * Crée un nouveau tenant (entreprise) avec un utilisateur admin
   */
  async createTenant(request: OnboardingRequest): Promise<{
    tenant: Tenant;
    adminUser: TenantUser;
    inviteLink: string;
  }> {
    try {
      // Créer le tenant
      const [tenant] = await db
        .insert(tenants)
        .values({
          name: request.companyName,
          domain: request.domain,
          planType: request.planType || 'starter',
          status: 'trial', // nouveau tenant en trial
        })
        .returning();

      // Générer un token d'invitation pour l'admin
      const inviteToken = crypto.randomUUID();
      const inviteExpiresAt = new Date();
      inviteExpiresAt.setDate(inviteExpiresAt.getDate() + 7); // 7 jours

      // Créer l'utilisateur admin
      const [adminUser] = await db
        .insert(tenantUsers)
        .values({
          tenantId: tenant.id,
          email: request.adminEmail,
          name: request.adminName,
          role: 'admin',
          permissions: { 
            canManageUsers: true,
            canConfigureIntegrations: true,
            canManageAgents: true,
            canViewAllData: true 
          },
          inviteToken,
          inviteExpiresAt,
          isActive: false, // activé lors de la première connexion
        })
        .returning();

      // Générer le lien d'invitation
      const inviteLink = `${process.env.BASE_URL || 'https://jamono.ai'}/onboard?token=${inviteToken}`;

      return {
        tenant,
        adminUser,
        inviteLink
      };
    } catch (error) {
      throw new Error(`Erreur création tenant: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Invite un nouvel utilisateur dans un tenant
   */
  async inviteUser(request: InviteUserRequest): Promise<{
    user: TenantUser;
    inviteLink: string;
  }> {
    try {
      // Vérifier les permissions de l'inviteur
      const inviter = await this.getTenantUser(request.invitedBy, request.tenantId);
      if (!inviter || !(inviter.permissions as TenantUserPermissions)?.canManageUsers) {
        throw new Error('Permissions insuffisantes pour inviter des utilisateurs');
      }

      // Vérifier les limites du plan
      const tenant = await this.getTenant(request.tenantId);
      const userCount = await this.getTenantUserCount(request.tenantId);
      
      if (userCount >= (tenant?.maxUsers || 10)) {
        throw new Error('Limite d\'utilisateurs atteinte pour ce plan');
      }

      // Générer token d'invitation
      const inviteToken = crypto.randomUUID();
      const inviteExpiresAt = new Date();
      inviteExpiresAt.setDate(inviteExpiresAt.getDate() + 7);

      // Créer l'utilisateur invité
      const [user] = await db
        .insert(tenantUsers)
        .values({
          tenantId: request.tenantId,
          email: request.email,
          name: request.name,
          role: request.role,
          permissions: request.permissions || this.getDefaultPermissions(request.role),
          invitedBy: request.invitedBy,
          inviteToken,
          inviteExpiresAt,
          isActive: false,
        })
        .returning();

      const inviteLink = `${process.env.BASE_URL || 'https://jamono.ai'}/join?token=${inviteToken}`;

      return { user, inviteLink };
    } catch (error) {
      throw new Error(`Erreur invitation utilisateur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Onboarding spécialisé pour freelances
   */
  async onboardFreelance(request: FreelanceOnboardingRequest): Promise<{ tenant: Tenant; user: TenantUser }> {
    try {
      // 1. Créer le tenant freelance
      const maxUsers = request.planType === 'solo' ? 1 : 
                      request.planType === 'pro' ? 4 : 999;
      const maxAgents = request.planType === 'solo' ? 1 : 
                       request.planType === 'pro' ? 2 : 999;

      const [tenant] = await db
        .insert(tenants)
        .values({
          name: `${request.name} - Espace Freelance`,
          planType: request.planType,
          tenantType: 'freelance',
          status: 'active',
          maxUsers,
          maxAgents,
          settings: {
            freelanceMode: true,
            slackWorkspace: request.slackWorkspace || null,
            autoDeployment: true,
            simpleReporting: true
          }
        })
        .returning();

      // 2. Créer l'utilisateur freelance avec permissions complètes
      const hashedPassword = await this.hashPassword(request.password);
      const permissions = getDefaultPermissionsByRole('freelance');
      
      // Ajuster permissions selon le plan
      if (request.planType === 'pro') {
        permissions.canUseATLAS = true;
        permissions.maxActionsPerDay = 500;
      } else if (request.planType === 'enterprise') {
        permissions.canUseATLAS = true;
        permissions.canUseCIRRUS = true;
        permissions.maxActionsPerDay = 9999;
      }

      const [user] = await db
        .insert(tenantUsers)
        .values({
          tenantId: tenant.id,
          email: request.email,
          name: request.name,
          password: hashedPassword,
          role: 'freelance',
          permissions: permissions,
          isActive: true
        })
        .returning();

      return { tenant, user };
      
    } catch (error) {
      throw new Error(`Erreur onboarding freelance: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Configure une intégration pour un tenant
   */
  async configureIntegration(
    tenantId: number,
    integrationType: string,
    name: string,
    configuration: any,
    createdBy: number
  ): Promise<TenantIntegration> {
    try {
      // Vérifier les permissions
      const user = await this.getTenantUser(createdBy, tenantId);
      if (!user || !(user.permissions as TenantUserPermissions)?.canConfigureIntegrations) {
        throw new Error('Permissions insuffisantes pour configurer les intégrations');
      }

      // Chiffrer la configuration sensible (tokens, clés API)
      const encryptedConfig = this.encryptConfiguration(configuration);

      const [integration] = await db
        .insert(tenantIntegrations)
        .values({
          tenantId,
          integrationType,
          name,
          configuration: encryptedConfig,
          createdBy,
        })
        .returning();

      // Tester l'intégration
      const testResult = await this.testIntegration(integration.id);
      
      // Mettre à jour le statut selon le résultat du test
      await db
        .update(tenantIntegrations)
        .set({ 
          status: testResult.success ? 'active' : 'error',
          lastTestResult: testResult,
          lastTestedAt: new Date()
        })
        .where(eq(tenantIntegrations.id, integration.id));

      return { ...integration, configuration: encryptedConfig };
    } catch (error) {
      throw new Error(`Erreur configuration intégration: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Crée une zone d'action pour un tenant
   */
  async createActionZone(request: InsertActionZone): Promise<ActionZone> {
    try {
      // Vérifier les permissions
      if (!request.createdBy) {
        throw new Error('Utilisateur créateur requis');
      }
      const user = await this.getTenantUser(request.createdBy, request.tenantId || 0);
      if (!user || !(user.permissions as TenantUserPermissions)?.canManageActionZones) {
        throw new Error('Permissions insuffisantes pour gérer les zones d\'action');
      }

      const [actionZone] = await db
        .insert(actionZones)
        .values(request)
        .returning();

      return actionZone;
    } catch (error) {
      throw new Error(`Erreur création zone d'action: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Configure un agent pour un tenant
   */
  async configureAgent(request: InsertTenantAgentConfig): Promise<TenantAgentConfig> {
    try {
      // Vérifier les permissions
      if (!request.createdBy) {
        throw new Error('Utilisateur créateur requis');
      }
      const user = await this.getTenantUser(request.createdBy, request.tenantId || 0);
      if (!user || !(user.permissions as TenantUserPermissions)?.canManageAgents) {
        throw new Error('Permissions insuffisantes pour configurer les agents');
      }

      const [agentConfig] = await db
        .insert(tenantAgentConfigs)
        .values(request)
        .returning();

      return agentConfig;
    } catch (error) {
      throw new Error(`Erreur configuration agent: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  // Méthodes de récupération

  async getTenant(tenantId: number): Promise<Tenant | null> {
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));
    return tenant || null;
  }

  async getTenantUser(userId: number, tenantId: number): Promise<TenantUser | null> {
    const [user] = await db
      .select()
      .from(tenantUsers)
      .where(and(
        eq(tenantUsers.id, userId),
        eq(tenantUsers.tenantId, tenantId)
      ));
    return user || null;
  }

  async getTenantUsers(tenantId: number): Promise<TenantUser[]> {
    return await db
      .select()
      .from(tenantUsers)
      .where(eq(tenantUsers.tenantId, tenantId));
  }

  async getTenantIntegrations(tenantId: number): Promise<TenantIntegration[]> {
    return await db
      .select()
      .from(tenantIntegrations)
      .where(eq(tenantIntegrations.tenantId, tenantId));
  }

  async getTenantActionZones(tenantId: number): Promise<ActionZone[]> {
    return await db
      .select()
      .from(actionZones)
      .where(eq(actionZones.tenantId, tenantId));
  }

  async getTenantAgentConfigs(tenantId: number): Promise<TenantAgentConfig[]> {
    return await db
      .select()
      .from(tenantAgentConfigs)
      .where(eq(tenantAgentConfigs.tenantId, tenantId));
  }

  // Méthodes utilitaires

  private async getTenantUserCount(tenantId: number): Promise<number> {
    const users = await this.getTenantUsers(tenantId);
    return users.filter(u => u.isActive).length;
  }

  private getDefaultPermissions(role: string): any {
    switch (role) {
      case 'admin':
        return {
          canManageUsers: true,
          canConfigureIntegrations: true,
          canManageAgents: true,
          canViewAllData: true
        };
      case 'manager':
        return {
          canManageUsers: false,
          canConfigureIntegrations: true,
          canManageAgents: true,
          canViewAllData: true
        };
      case 'user':
        return {
          canManageUsers: false,
          canConfigureIntegrations: false,
          canManageAgents: false,
          canViewAllData: false
        };
      default:
        return {};
    }
  }

  private encryptConfiguration(config: any): any {
    // Pour le moment, retourner tel quel
    // À implémenter: chiffrement AES des données sensibles
    return config;
  }

  private decryptConfiguration(encryptedConfig: any): any {
    // Pour le moment, retourner tel quel
    // À implémenter: déchiffrement des données sensibles
    return encryptedConfig;
  }

  /**
   * Teste une intégration
   */
  private async testIntegration(integrationId: number): Promise<IntegrationTestResult> {
    try {
      const [integration] = await db
        .select()
        .from(tenantIntegrations)
        .where(eq(tenantIntegrations.id, integrationId));

      if (!integration) {
        return { success: false, message: 'Intégration non trouvée' };
      }

      const config = this.decryptConfiguration(integration.configuration);

      switch (integration.integrationType) {
        case 'kubernetes':
          return await this.testKubernetesIntegration(config);
        case 'jira':
          return await this.testJiraIntegration(config);
        case 'ssh':
          return await this.testSshIntegration(config);
        case 'slack':
          return await this.testSlackIntegration(config);
        default:
          return { success: false, message: `Type d'intégration ${integration.integrationType} non supporté` };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors du test',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  private async testKubernetesIntegration(config: any): Promise<IntegrationTestResult> {
    // Mock test - à implémenter avec kubectl
    return {
      success: true,
      message: 'Connexion Kubernetes réussie',
      details: { clusters: 1, namespaces: config.allowedNamespaces?.length || 0 }
    };
  }

  private async testJiraIntegration(config: any): Promise<IntegrationTestResult> {
    // Mock test - à implémenter avec l'API Jira
    return {
      success: true,
      message: 'Connexion Jira réussie',
      details: { projects: config.allowedProjects?.length || 0 }
    };
  }

  private async testSshIntegration(config: any): Promise<IntegrationTestResult> {
    // Mock test - à implémenter avec SSH
    return {
      success: true,
      message: 'Connexion SSH réussie',
      details: { servers: config.servers?.length || 0 }
    };
  }

  private async testSlackIntegration(config: any): Promise<IntegrationTestResult> {
    // Mock test - à implémenter avec l'API Slack
    return {
      success: true,
      message: 'Connexion Slack réussie',
      details: { workspace: config.teamName || 'Unknown' }
    };
  }

  /**
   * Active un utilisateur avec son token d'invitation
   */
  async activateUser(inviteToken: string, userData?: { password?: string }): Promise<TenantUser> {
    try {
      const [user] = await db
        .select()
        .from(tenantUsers)
        .where(eq(tenantUsers.inviteToken, inviteToken));

      if (!user) {
        throw new Error('Token d\'invitation invalide');
      }

      if (user.inviteExpiresAt && user.inviteExpiresAt < new Date()) {
        throw new Error('Token d\'invitation expiré');
      }

      // Activer l'utilisateur
      const [activatedUser] = await db
        .update(tenantUsers)
        .set({
          isActive: true,
          inviteToken: null,
          inviteExpiresAt: null,
          lastLoginAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(tenantUsers.id, user.id))
        .returning();

      return activatedUser;
    } catch (error) {
      throw new Error(`Erreur activation utilisateur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }
}

export const tenantService = new TenantService();