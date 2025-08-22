/**
 * Routes API pour la gestion multi-tenant de Jamono SaaS
 */

import { type Express } from "express";
import { tenantService } from "./tenant-service";
import { z } from "zod";

export function setupTenantRoutes(app: Express) {
  
  /**
   * Création d'un nouveau tenant (entreprise)
   */
  app.post('/api/tenants/create', async (req, res) => {
    try {
      const schema = z.object({
        companyName: z.string().min(2, "Nom de l'entreprise requis"),
        domain: z.string().optional(),
        adminEmail: z.string().email("Email invalide"),
        adminName: z.string().min(2, "Nom de l'administrateur requis"),
        planType: z.enum(["starter", "professional", "enterprise"]).default("starter"),
      });

      const validatedData = schema.parse(req.body);
      
      const result = await tenantService.createTenant({
        companyName: validatedData.companyName,
        domain: validatedData.domain,
        adminEmail: validatedData.adminEmail,
        adminName: validatedData.adminName,
        planType: validatedData.planType,
      });

      res.json({
        success: true,
        tenant: result.tenant,
        adminUser: {
          ...result.adminUser,
          // Ne pas renvoyer l'invite token en response
          inviteToken: undefined
        },
        inviteLink: result.inviteLink
      });
    } catch (error) {
      console.error('Erreur création tenant:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  });

  /**
   * Activation d'un utilisateur via token d'invitation
   */
  app.post('/api/tenants/activate', async (req, res) => {
    try {
      const schema = z.object({
        inviteToken: z.string().min(1, "Token d'invitation requis"),
        password: z.string().optional(),
      });

      const { inviteToken, password } = schema.parse(req.body);
      
      const activatedUser = await tenantService.activateUser(inviteToken, { password });

      res.json({
        success: true,
        user: {
          ...activatedUser,
          // Pas de données sensibles
          inviteToken: undefined
        }
      });
    } catch (error) {
      console.error('Erreur activation utilisateur:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur activation'
      });
    }
  });

  /**
   * Invitation d'un nouvel utilisateur
   */
  app.post('/api/tenants/:tenantId/invite', async (req, res) => {
    try {
      const tenantId = parseInt(req.params.tenantId);
      if (isNaN(tenantId)) {
        return res.status(400).json({ error: 'ID tenant invalide' });
      }

      const schema = z.object({
        email: z.string().email("Email invalide"),
        name: z.string().min(2, "Nom requis"),
        role: z.enum(["admin", "manager", "user"]),
        invitedBy: z.number(),
        permissions: z.any().optional(),
      });

      const validatedData = schema.parse(req.body);
      
      const result = await tenantService.inviteUser({
        tenantId,
        ...validatedData
      });

      res.json({
        success: true,
        user: {
          ...result.user,
          inviteToken: undefined // Sécurité
        },
        inviteLink: result.inviteLink
      });
    } catch (error) {
      console.error('Erreur invitation utilisateur:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur invitation'
      });
    }
  });

  /**
   * Récupération des informations d'un tenant
   */
  app.get('/api/tenants/:tenantId', async (req, res) => {
    try {
      const tenantId = parseInt(req.params.tenantId);
      if (isNaN(tenantId)) {
        return res.status(400).json({ error: 'ID tenant invalide' });
      }

      const tenant = await tenantService.getTenant(tenantId);
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant non trouvé' });
      }

      res.json(tenant);
    } catch (error) {
      console.error('Erreur récupération tenant:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Erreur serveur'
      });
    }
  });

  /**
   * Récupération des utilisateurs d'un tenant
   */
  app.get('/api/tenants/:tenantId/users', async (req, res) => {
    try {
      const tenantId = parseInt(req.params.tenantId);
      if (isNaN(tenantId)) {
        return res.status(400).json({ error: 'ID tenant invalide' });
      }

      const users = await tenantService.getTenantUsers(tenantId);
      
      // Filtrer les données sensibles
      const safeUsers = users.map(user => ({
        ...user,
        inviteToken: undefined
      }));

      res.json(safeUsers);
    } catch (error) {
      console.error('Erreur récupération utilisateurs:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Erreur serveur'
      });
    }
  });

  /**
   * Configuration d'une intégration
   */
  app.post('/api/tenants/:tenantId/integrations', async (req, res) => {
    try {
      const tenantId = parseInt(req.params.tenantId);
      if (isNaN(tenantId)) {
        return res.status(400).json({ error: 'ID tenant invalide' });
      }

      const schema = z.object({
        integrationType: z.enum(["kubernetes", "jira", "ssh", "slack"]),
        name: z.string().min(1, "Nom de l'intégration requis"),
        configuration: z.any(),
        createdBy: z.number(),
      });

      const validatedData = schema.parse(req.body);
      
      const integration = await tenantService.configureIntegration(
        tenantId,
        validatedData.integrationType,
        validatedData.name,
        validatedData.configuration,
        validatedData.createdBy
      );

      res.json({
        success: true,
        integration: {
          ...integration,
          // Pas de configuration en réponse pour sécurité
          configuration: { type: integration.integrationType, configured: true }
        }
      });
    } catch (error) {
      console.error('Erreur configuration intégration:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur configuration'
      });
    }
  });

  /**
   * Récupération des intégrations d'un tenant
   */
  app.get('/api/tenants/:tenantId/integrations', async (req, res) => {
    try {
      const tenantId = parseInt(req.params.tenantId);
      if (isNaN(tenantId)) {
        return res.status(400).json({ error: 'ID tenant invalide' });
      }

      const integrations = await tenantService.getTenantIntegrations(tenantId);
      
      // Filtrer les configurations sensibles
      const safeIntegrations = integrations.map(integration => ({
        ...integration,
        configuration: {
          type: integration.integrationType,
          configured: true,
          status: integration.status
        }
      }));

      res.json(safeIntegrations);
    } catch (error) {
      console.error('Erreur récupération intégrations:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Erreur serveur'
      });
    }
  });

  /**
   * Création d'une zone d'action
   */
  app.post('/api/tenants/:tenantId/action-zones', async (req, res) => {
    try {
      const tenantId = parseInt(req.params.tenantId);
      if (isNaN(tenantId)) {
        return res.status(400).json({ error: 'ID tenant invalide' });
      }

      const schema = z.object({
        integrationId: z.number(),
        name: z.string().min(1, "Nom de la zone requis"),
        description: z.string().optional(),
        scope: z.any(),
        permissions: z.any(),
        restrictions: z.any().optional(),
        createdBy: z.number(),
      });

      const validatedData = schema.parse(req.body);
      
      const actionZone = await tenantService.createActionZone({
        tenantId,
        ...validatedData
      });

      res.json({
        success: true,
        actionZone
      });
    } catch (error) {
      console.error('Erreur création zone d\'action:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur création zone'
      });
    }
  });

  /**
   * Récupération des zones d'action d'un tenant
   */
  app.get('/api/tenants/:tenantId/action-zones', async (req, res) => {
    try {
      const tenantId = parseInt(req.params.tenantId);
      if (isNaN(tenantId)) {
        return res.status(400).json({ error: 'ID tenant invalide' });
      }

      const actionZones = await tenantService.getTenantActionZones(tenantId);
      res.json(actionZones);
    } catch (error) {
      console.error('Erreur récupération zones d\'action:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Erreur serveur'
      });
    }
  });

  /**
   * Configuration d'un agent pour un tenant
   */
  app.post('/api/tenants/:tenantId/agents', async (req, res) => {
    try {
      const tenantId = parseInt(req.params.tenantId);
      if (isNaN(tenantId)) {
        return res.status(400).json({ error: 'ID tenant invalide' });
      }

      const schema = z.object({
        agentId: z.number(),
        displayName: z.string().min(1, "Nom d'affichage requis"),
        customPrompt: z.string().optional(),
        allowedZones: z.number().array().default([]),
        allowedIntegrations: z.number().array().default([]),
        restrictions: z.any().optional(),
        createdBy: z.number(),
      });

      const validatedData = schema.parse(req.body);
      
      const agentConfig = await tenantService.configureAgent({
        tenantId,
        ...validatedData
      });

      res.json({
        success: true,
        agentConfig
      });
    } catch (error) {
      console.error('Erreur configuration agent:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur configuration agent'
      });
    }
  });

  /**
   * Récupération des configurations d'agents d'un tenant
   */
  app.get('/api/tenants/:tenantId/agents', async (req, res) => {
    try {
      const tenantId = parseInt(req.params.tenantId);
      if (isNaN(tenantId)) {
        return res.status(400).json({ error: 'ID tenant invalide' });
      }

      const agentConfigs = await tenantService.getTenantAgentConfigs(tenantId);
      res.json(agentConfigs);
    } catch (error) {
      console.error('Erreur récupération configurations agents:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Erreur serveur'
      });
    }
  });
}