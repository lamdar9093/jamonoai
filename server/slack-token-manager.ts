/**
 * Gestionnaire de tokens Slack pour assurer la disponibilité 24/7
 * Gère automatiquement l'expiration et le rafraîchissement des tokens
 */

import { db } from './db';
import { workspaces as workspacesTable } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { WebClient } from '@slack/web-api';

export class SlackTokenManager {
  private static instance: SlackTokenManager;
  private tokenCache: Map<number, { token: string, expiresAt: number }> = new Map();

  private constructor() {
    // Vérification périodique des tokens (toutes les 30 minutes)
    setInterval(() => {
      this.validateAllTokens().catch(console.error);
    }, 30 * 60 * 1000);
  }

  static getInstance(): SlackTokenManager {
    if (!SlackTokenManager.instance) {
      SlackTokenManager.instance = new SlackTokenManager();
    }
    return SlackTokenManager.instance;
  }

  /**
   * Obtient un token Slack valide pour un workspace
   */
  async getValidToken(workspaceId: number): Promise<string | null> {
    try {
      // Vérifier le cache local d'abord
      const cached = this.tokenCache.get(workspaceId);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.token;
      }

      // Récupérer depuis la base de données
      const workspace = await db.select()
        .from(workspacesTable)
        .where(eq(workspacesTable.id, workspaceId))
        .limit(1);

      if (workspace.length === 0 || !workspace[0].slackAccessToken) {
        return null;
      }

      const token = workspace[0].slackAccessToken;

      // Tester la validité du token
      const isValid = await this.testToken(token);
      if (!isValid) {
        console.log(`Token expiré pour workspace ${workspaceId}, tentative de rafraîchissement`);
        const refreshedToken = await this.refreshToken(workspace[0]);
        if (refreshedToken) {
          this.cacheToken(workspaceId, refreshedToken);
          return refreshedToken;
        }
        return null;
      }

      // Mettre en cache le token valide
      this.cacheToken(workspaceId, token);
      return token;

    } catch (error) {
      console.error(`Erreur obtention token workspace ${workspaceId}:`, error);
      return null;
    }
  }

  /**
   * Teste la validité d'un token Slack
   */
  private async testToken(token: string): Promise<boolean> {
    try {
      const client = new WebClient(token);
      const response = await client.auth.test();
      return response.ok === true;
    } catch (error: any) {
      if (error.data?.error === 'token_expired' || error.data?.error === 'invalid_auth') {
        return false;
      }
      // Autres erreurs considérées comme token valide (problème réseau, etc.)
      return true;
    }
  }

  /**
   * Rafraîchit un token expiré
   */
  private async refreshToken(workspace: any): Promise<string | null> {
    try {
      if (!workspace.slackRefreshToken) {
        console.error(`Pas de refresh token pour workspace ${workspace.id}`);
        return null;
      }

      const response = await fetch('https://slack.com/api/oauth.v2.access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.SLACK_CLIENT_ID!,
          client_secret: process.env.SLACK_CLIENT_SECRET!,
          grant_type: 'refresh_token',
          refresh_token: workspace.slackRefreshToken,
        }),
      });

      const data = await response.json();

      if (data.ok && data.access_token) {
        // Mettre à jour la base de données
        await db.update(workspacesTable)
          .set({
            slackAccessToken: data.access_token,
            slackRefreshToken: data.refresh_token || workspace.slackRefreshToken,
            updatedAt: new Date(),
          })
          .where(eq(workspacesTable.id, workspace.id));

        console.log(`Token rafraîchi avec succès pour workspace ${workspace.id}`);
        return data.access_token;
      } else {
        console.error(`Échec rafraîchissement token: ${data.error}`);
        return null;
      }
    } catch (error) {
      console.error('Erreur rafraîchissement token:', error);
      return null;
    }
  }

  /**
   * Met en cache un token avec expiration
   */
  private cacheToken(workspaceId: number, token: string): void {
    // Cache pour 50 minutes (les tokens Slack expirent généralement après 1h)
    const expiresAt = Date.now() + (50 * 60 * 1000);
    this.tokenCache.set(workspaceId, { token, expiresAt });
  }

  /**
   * Valide tous les tokens en cache
   */
  private async validateAllTokens(): Promise<void> {
    const workspaces = await db.select().from(workspacesTable);
    
    for (const workspace of workspaces) {
      if (workspace.slackAccessToken) {
        await this.getValidToken(workspace.id);
      }
    }
  }

  /**
   * Nettoie le cache des tokens expirés
   */
  private clearExpiredTokens(): void {
    const now = Date.now();
    const expiredWorkspaces: number[] = [];
    
    this.tokenCache.forEach((cached, workspaceId) => {
      if (cached.expiresAt <= now) {
        expiredWorkspaces.push(workspaceId);
      }
    });
    
    expiredWorkspaces.forEach(workspaceId => {
      this.tokenCache.delete(workspaceId);
    });
  }
}

// Singleton instance
export const slackTokenManager = SlackTokenManager.getInstance();