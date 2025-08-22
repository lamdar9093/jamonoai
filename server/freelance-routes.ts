/**
 * Routes spécifiques aux freelances - Jamono
 */

import { Request, Response } from 'express';
import { TenantService, type FreelanceOnboardingRequest } from './tenant-service';

export class FreelanceRoutes {
  private tenantService: TenantService;

  constructor() {
    this.tenantService = new TenantService();
  }

  /**
   * POST /api/freelance/onboard
   * Créer un compte freelance complet
   */
  async onboardFreelance(req: Request, res: Response) {
    try {
      const request: FreelanceOnboardingRequest = req.body;

      // Validation basique
      if (!request.name || !request.email || !request.password) {
        return res.status(400).json({
          success: false,
          message: 'Nom, email et mot de passe requis'
        });
      }

      if (request.password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Mot de passe trop court (minimum 8 caractères)'
        });
      }

      // Vérifier si email déjà utilisé
      const existingUser = await this.tenantService.getTenantUserByEmail(request.email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà utilisé'
        });
      }

      // Créer le compte freelance
      const result = await this.tenantService.onboardFreelance(request);

      res.status(201).json({
        success: true,
        message: 'Compte freelance créé avec succès',
        data: {
          tenantId: result.tenant.id,
          userId: result.user.id,
          planType: result.tenant.planType,
          maxAgents: result.tenant.maxAgents
        }
      });

    } catch (error) {
      console.error('Erreur onboarding freelance:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur serveur'
      });
    }
  }

  /**
   * GET /api/freelance/plans
   * Récupérer les plans freelance disponibles
   */
  async getFreelancePlans(req: Request, res: Response) {
    try {
      const plans = [
        {
          id: 'solo',
          name: 'Solo',
          price: 19,
          currency: 'EUR',
          interval: 'month',
          features: [
            '1 utilisateur (vous)',
            'Agent NOX DevOps',
            '3 intégrations max',
            '2 000 actions/mois',
            'Support par email'
          ],
          limits: {
            users: 1,
            agents: 1,
            integrations: 3,
            actionsPerMonth: 2000
          }
        },
        {
          id: 'pro',
          name: 'Pro',
          price: 49,
          currency: 'EUR',
          interval: 'month',
          features: [
            'Vous + 3 invités ponctuels',
            'NOX + ATLAS (Cloud)',
            '10 intégrations',
            '10 000 actions/mois',
            'Support prioritaire',
            'Rapports détaillés'
          ],
          limits: {
            users: 4,
            agents: 2,
            integrations: 10,
            actionsPerMonth: 10000
          },
          popular: true
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          price: 99,
          currency: 'EUR',
          interval: 'month',
          features: [
            'Utilisateurs illimités',
            'Tous les agents (NOX, ATLAS, CIRRUS)',
            'Intégrations illimitées',
            'Actions illimitées',
            'Support dédié 24/7',
            'SLA garanti'
          ],
          limits: {
            users: 999,
            agents: 999,
            integrations: 999,
            actionsPerMonth: 999999
          }
        }
      ];

      res.json({
        success: true,
        data: plans
      });

    } catch (error) {
      console.error('Erreur récupération plans freelance:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }

  /**
   * POST /api/freelance/upgrade
   * Changer de plan freelance
   */
  async upgradePlan(req: Request, res: Response) {
    try {
      const { tenantId, newPlan } = req.body;

      if (!tenantId || !newPlan) {
        return res.status(400).json({
          success: false,
          message: 'ID tenant et nouveau plan requis'
        });
      }

      // Vérifier que l'utilisateur est propriétaire du tenant
      const tenant = await this.tenantService.getTenant(tenantId);
      if (!tenant || tenant.tenantType !== 'freelance') {
        return res.status(404).json({
          success: false,
          message: 'Espace freelance introuvable'
        });
      }

      // Mettre à jour le plan (logique de paiement à implémenter)
      const updatedTenant = await this.tenantService.updateTenantPlan(tenantId, newPlan);

      res.json({
        success: true,
        message: `Plan mis à jour vers ${newPlan}`,
        data: {
          tenantId: updatedTenant.id,
          planType: updatedTenant.planType,
          maxUsers: updatedTenant.maxUsers,
          maxAgents: updatedTenant.maxAgents
        }
      });

    } catch (error) {
      console.error('Erreur upgrade plan freelance:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur serveur'
      });
    }
  }

  /**
   * GET /api/freelance/:tenantId/usage
   * Récupérer les statistiques d'usage freelance
   */
  async getUsageStats(req: Request, res: Response) {
    try {
      const { tenantId } = req.params;

      const tenant = await this.tenantService.getTenant(parseInt(tenantId));
      if (!tenant || tenant.tenantType !== 'freelance') {
        return res.status(404).json({
          success: false,
          message: 'Espace freelance introuvable'
        });
      }

      // Récupérer les stats d'usage (à implémenter selon les besoins)
      const stats = {
        currentMonth: {
          actions: 0, // À calculer depuis agentInteractions
          integrations: 0, // À calculer depuis tenantIntegrations
          users: 1 // Toujours 1 pour freelance solo
        },
        limits: {
          actionsPerMonth: tenant.planType === 'solo' ? 2000 : 
                          tenant.planType === 'pro' ? 10000 : 999999,
          maxIntegrations: tenant.planType === 'solo' ? 3 : 
                          tenant.planType === 'pro' ? 10 : 999,
          maxUsers: tenant.maxUsers
        },
        planType: tenant.planType
      };

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Erreur stats usage freelance:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }
}