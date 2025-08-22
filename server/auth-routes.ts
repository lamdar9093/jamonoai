/**
 * Routes d'authentification pour Jamono
 * Gère login, signup, logout et vérification des tokens
 */

import { type Express } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { users, tenantUsers, type User } from "@shared/schema";
import { db } from "./db";
import { eq, or } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "jamono_secret_key_change_in_production";
const JWT_EXPIRES_IN = "7d";

interface AuthUser {
  id: number;
  name: string;
  email: string;
  tenantId?: number;
  role?: string;
  permissions?: any;
  isActive: boolean;
}

// Middleware d'authentification
export const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token d\'accès requis' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ message: 'Token invalide' });
    }
    req.user = decoded;
    next();
  });
};

export function setupAuthRoutes(app: Express) {
  
  /**
   * Inscription d'un utilisateur individuel
   */
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const schema = z.object({
        name: z.string().min(2, "Le nom est requis"),
        email: z.string().email("Email invalide"),
        password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
      });

      const { name, email, password } = schema.parse(req.body);

      // Vérifier si l'utilisateur existe déjà
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'Un compte avec cet email existe déjà' 
        });
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);

      // Créer l'utilisateur
      const [newUser] = await db
        .insert(users)
        .values({
          username: email, // Using email as username for simplicity
          email,
          password: hashedPassword,
        })
        .returning();

      // Créer le token JWT
      const token = jwt.sign(
        { 
          userId: newUser.id, 
          email: newUser.email,
          type: 'individual'
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      const authUser: AuthUser = {
        id: newUser.id,
        name: name,
        email: newUser.email,
        isActive: true,
      };

      res.json({
        success: true,
        user: authUser,
        token
      });
    } catch (error) {
      console.error('Erreur inscription:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la création du compte'
      });
    }
  });

  /**
   * Connexion utilisateur
   */
  app.post('/api/auth/login', async (req, res) => {
    try {
      const schema = z.object({
        email: z.string().email("Email invalide"),
        password: z.string().min(1, "Mot de passe requis"),
      });

      const { email, password } = schema.parse(req.body);

      // Chercher dans les utilisateurs individuels d'abord
      let user: any = null;
      let userType = 'individual';
      let authUser: AuthUser | null = null;

      const [individualUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (individualUser) {
        const passwordMatch = await bcrypt.compare(password, individualUser.password);
        if (passwordMatch) {
          user = individualUser;
          authUser = {
            id: individualUser.id,
            name: individualUser.username,
            email: individualUser.email,
            isActive: true,
          };
        }
      }

      // Si pas trouvé dans users, chercher dans tenant_users
      if (!user) {
        const [tenantUser] = await db
          .select()
          .from(tenantUsers)
          .where(eq(tenantUsers.email, email));

        if (tenantUser && tenantUser.isActive) {
          // Pour les utilisateurs tenant, on peut implémenter une authentification différente
          // ou demander l'activation via le token d'invitation
          if (!tenantUser.password) {
            return res.status(400).json({
              success: false,
              message: 'Compte non activé. Veuillez utiliser votre lien d\'invitation.'
            });
          }

          const passwordMatch = await bcrypt.compare(password, tenantUser.password);
          if (passwordMatch) {
            user = tenantUser;
            userType = 'tenant';
            authUser = {
              id: tenantUser.id,
              name: tenantUser.name,
              email: tenantUser.email,
              tenantId: tenantUser.tenantId ?? undefined,
              role: tenantUser.role ?? undefined,
              permissions: tenantUser.permissions,
              isActive: tenantUser.isActive,
            };
          }
        }
      }

      if (!user || !authUser) {
        return res.status(401).json({
          success: false,
          message: 'Email ou mot de passe incorrect'
        });
      }

      // Créer le token JWT
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          type: userType,
          tenantId: userType === 'tenant' ? user.tenantId : undefined
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Mettre à jour la dernière connexion pour les utilisateurs tenant
      if (userType === 'tenant') {
        await db
          .update(tenantUsers)
          .set({ lastLoginAt: new Date() })
          .where(eq(tenantUsers.id, user.id));
      }

      res.json({
        success: true,
        user: authUser,
        token
      });
    } catch (error) {
      console.error('Erreur connexion:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la connexion'
      });
    }
  });

  /**
   * Récupération des informations utilisateur (route protégée)
   */
  app.get('/api/auth/user', authenticateToken, async (req, res) => {
    try {
      const { userId, type, tenantId } = (req as any).user;

      let authUser: AuthUser | null = null;

      if (type === 'individual') {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId));

        if (user) {
          authUser = {
            id: user.id,
            name: user.username,
            email: user.email,
            isActive: true,
          };
        }
      } else if (type === 'tenant') {
        const [tenantUser] = await db
          .select()
          .from(tenantUsers)
          .where(eq(tenantUsers.id, userId));

        if (tenantUser && tenantUser.isActive) {
          authUser = {
            id: tenantUser.id,
            name: tenantUser.name,
            email: tenantUser.email,
            tenantId: tenantUser.tenantId ?? undefined,
            role: tenantUser.role ?? undefined,
            permissions: tenantUser.permissions,
            isActive: tenantUser.isActive,
          };
        }
      }

      if (!authUser) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      res.json(authUser);
    } catch (error) {
      console.error('Erreur récupération utilisateur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des informations utilisateur'
      });
    }
  });

  /**
   * Déconnexion (optionnel, côté client principalement)
   */
  app.post('/api/auth/logout', authenticateToken, async (req, res) => {
    // Dans un vrai système, on pourrait blacklister le token
    // Pour l'instant, on confirme juste la déconnexion
    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });
  });

  /**
   * Activation d'un utilisateur tenant via token d'invitation
   */
  app.post('/api/auth/activate', async (req, res) => {
    try {
      const schema = z.object({
        inviteToken: z.string().min(1, "Token d'invitation requis"),
        password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
      });

      const { inviteToken, password } = schema.parse(req.body);

      // Trouver l'utilisateur avec ce token
      const [tenantUser] = await db
        .select()
        .from(tenantUsers)
        .where(eq(tenantUsers.inviteToken, inviteToken));

      if (!tenantUser) {
        return res.status(400).json({
          success: false,
          message: 'Token d\'invitation invalide'
        });
      }

      if (tenantUser.inviteExpiresAt && tenantUser.inviteExpiresAt < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Token d\'invitation expiré'
        });
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);

      // Activer l'utilisateur
      const [activatedUser] = await db
        .update(tenantUsers)
        .set({
          password: hashedPassword,
          isActive: true,
          inviteToken: null,
          inviteExpiresAt: null,
          lastLoginAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(tenantUsers.id, tenantUser.id))
        .returning();

      // Créer le token JWT
      const token = jwt.sign(
        {
          userId: activatedUser.id,
          email: activatedUser.email,
          type: 'tenant',
          tenantId: activatedUser.tenantId
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      const authUser: AuthUser = {
        id: activatedUser.id,
        name: activatedUser.name,
        email: activatedUser.email,
        tenantId: activatedUser.tenantId ?? undefined,
        role: activatedUser.role ?? undefined,
        permissions: activatedUser.permissions,
        isActive: true,
      };

      res.json({
        success: true,
        user: authUser,
        token
      });
    } catch (error) {
      console.error('Erreur activation:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de l\'activation'
      });
    }
  });
}