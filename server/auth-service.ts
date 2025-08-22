/**
 * Service d'authentification avec isolation multi-tenant stricte - Jamono
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { TenantService } from './tenant-service';
import type { TenantUser, Tenant } from '../shared/schema';

export interface AuthenticationRequest {
  email: string;
  password: string;
  tenantId?: number; // Pour connexion dans un tenant spécifique
}

export interface AuthenticationResult {
  success: boolean;
  user?: TenantUser;
  tenant?: Tenant;
  token?: string;
  message?: string;
}

export interface SessionData {
  userId: number;
  tenantId: number;
  userRole: string;
  permissions: any;
}

export class AuthService {
  private tenantService: TenantService;
  private JWT_SECRET: string;
  private SESSION_DURATION = '24h';

  constructor() {
    this.tenantService = new TenantService();
    this.JWT_SECRET = process.env.JWT_SECRET || 'jamono-dev-secret-change-in-prod';
  }

  /**
   * Authentification avec isolation stricte multi-tenant
   */
  async authenticate(request: AuthenticationRequest): Promise<AuthenticationResult> {
    try {
      const { email, password, tenantId } = request;

      // 1. Recherche utilisateur dans tous les tenants puis filtrer par tenant si spécifié
      const users = await this.tenantService.getTenantUsers(0); // temporaire - récupérer tous
      const user = users.find(u => u.email === email && (!tenantId || u.tenantId === tenantId));
      
      if (!user) {
        return {
          success: false,
          message: tenantId 
            ? 'Utilisateur introuvable dans cet espace'
            : 'Utilisateur introuvable'
        };
      }

      if (!user.isActive) {
        return {
          success: false,
          message: 'Compte désactivé'
        };
      }

      // 2. Vérification du mot de passe
      const isPasswordValid = await this.verifyPassword(password, user.password || '');
      
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Mot de passe incorrect'
        };
      }

      // 3. Récupération du tenant
      const tenant = await this.tenantService.getTenant(user.tenantId);
      
      if (!tenant || tenant.status !== 'active') {
        return {
          success: false,
          message: 'Espace client inactif'
        };
      }

      // 4. Génération du token avec isolation tenant
      const token = this.generateToken({
        userId: user.id,
        tenantId: user.tenantId,
        userRole: user.role,
        permissions: user.permissions
      });

      return {
        success: true,
        user,
        tenant,
        token,
        message: 'Connexion réussie'
      };

    } catch (error) {
      console.error('Erreur authentification:', error);
      return {
        success: false,
        message: 'Erreur serveur lors de l\'authentification'
      };
    }
  }

  /**
   * Validation du token avec vérification tenant
   */
  async validateToken(token: string): Promise<SessionData | null> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as SessionData;
      
      // Vérifier que l'utilisateur existe toujours dans le tenant
      const user = await this.tenantService.getTenantUser(decoded.userId, decoded.tenantId);
      
      if (!user || !user.isActive) {
        return null;
      }

      return decoded;
      
    } catch (error) {
      console.error('Token invalide:', error);
      return null;
    }
  }

  /**
   * Déconnexion (côté serveur - ajout à blacklist si nécessaire)
   */
  async logout(token: string): Promise<{ success: boolean; message: string }> {
    try {
      // TODO: Ajouter le token à une blacklist avec expiration
      return {
        success: true,
        message: 'Déconnexion réussie'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la déconnexion'
      };
    }
  }

  /**
   * Récupération sécurisée des données utilisateur avec tenant
   */
  async getUserProfile(sessionData: SessionData): Promise<{
    user: TenantUser;
    tenant: Tenant;
  } | null> {
    try {
      const [user, tenant] = await Promise.all([
        this.tenantService.getTenantUser(sessionData.userId, sessionData.tenantId),
        this.tenantService.getTenant(sessionData.tenantId)
      ]);

      if (!user || !tenant) {
        return null;
      }

      // Nettoyer les données sensibles
      const cleanUser = { ...user };
      cleanUser.password = undefined;
      cleanUser.inviteToken = undefined;

      return { user: cleanUser, tenant };
      
    } catch (error) {
      console.error('Erreur récupération profil:', error);
      return null;
    }
  }

  /**
   * Middleware d'authentification pour les routes protégées
   */
  requireAuth = async (req: any, res: any, next: any) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Token d\'authentification requis'
        });
      }

      const token = authHeader.substring(7);
      const sessionData = await this.validateToken(token);
      
      if (!sessionData) {
        return res.status(401).json({
          success: false,
          message: 'Token invalide ou expiré'
        });
      }

      // Ajouter les données de session à la requête
      req.session = sessionData;
      req.tenantId = sessionData.tenantId;
      req.userId = sessionData.userId;
      
      next();
      
    } catch (error) {
      console.error('Erreur middleware auth:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  };

  /**
   * Middleware de vérification des permissions tenant-specific
   */
  requirePermission = (permission: string) => {
    return (req: any, res: any, next: any) => {
      const sessionData = req.session as SessionData;
      
      if (!sessionData || !sessionData.permissions) {
        return res.status(403).json({
          success: false,
          message: 'Permissions insuffisantes'
        });
      }

      const permissions = sessionData.permissions;
      
      if (!permissions[permission]) {
        return res.status(403).json({
          success: false,
          message: `Permission '${permission}' requise`
        });
      }

      next();
    };
  };

  // Méthodes utilitaires

  private generateToken(sessionData: SessionData): string {
    return jwt.sign(sessionData, this.JWT_SECRET, { 
      expiresIn: this.SESSION_DURATION 
    } as jwt.SignOptions);
  }

  private async verifyPassword(plainText: string, hashed: string): Promise<boolean> {
    try {
      // Pour le dev, vérification simple - à remplacer par bcrypt en prod
      return hashed === `hashed_${plainText}` || await bcrypt.compare(plainText, hashed);
    } catch (error) {
      console.error('Erreur vérification mot de passe:', error);
      return false;
    }
  }
}