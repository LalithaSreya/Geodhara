import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { query, getClient } from '../../config/db.js';
import { env } from '../../config/env.js';
import { AppError } from '../../middleware/errorHandler.js';
import { User, UserRole } from '../../types/index.js';
import { ROLE_PERMISSIONS, Permission } from '../../types/permissions.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // 900 seconds = 15m
}

export class AuthService {
  private generateTokens(user: { id: string; email: string; role: UserRole; full_name: string }): AuthTokens {
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
      },
      env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = crypto.randomBytes(40).toString('hex');
    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
    };
  }

  async login(email: string, passwordPlain: string): Promise<{ tokens: AuthTokens; user: any }> {
    const res = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (res.rows.length === 0) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const user = res.rows[0];
    const isMatch = await bcrypt.compare(passwordPlain, user.password_hash);
    if (!isMatch) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const tokens = this.generateTokens(user);

    // Store refresh token hash in DB with 7-day expiration
    const tokenHash = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [user.id, tokenHash, expiresAt]
    );

    return {
      tokens,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        permissions: ROLE_PERMISSIONS[user.role as UserRole] || [],
      },
    };
  }

  async refreshSession(refreshTokenPlain: string): Promise<{ tokens: AuthTokens; user: any }> {
    if (!refreshTokenPlain) {
      throw new AppError(400, 'REFRESH_TOKEN_REQUIRED', 'Refresh token is required');
    }

    const tokenHash = crypto.createHash('sha256').update(refreshTokenPlain).digest('hex');

    const client = await getClient();
    try {
      await client.query('BEGIN');

      const tokenRes = await client.query(
        `SELECT rt.*, u.email, u.full_name, u.role 
         FROM refresh_tokens rt
         JOIN users u ON u.id = rt.user_id
         WHERE rt.token_hash = $1 AND rt.expires_at > NOW() FOR UPDATE`,
        [tokenHash]
      );

      if (tokenRes.rows.length === 0) {
        throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired. Please re-authenticate.');
      }

      const existingSession = tokenRes.rows[0];

      // Refresh Token Rotation: Invalidate the consumed refresh token
      await client.query('DELETE FROM refresh_tokens WHERE id = $1', [existingSession.id]);

      // Generate new tokens
      const newTokens = this.generateTokens({
        id: existingSession.user_id,
        email: existingSession.email,
        role: existingSession.role,
        full_name: existingSession.full_name,
      });

      // Store new refresh token hash
      const newTokenHash = crypto.createHash('sha256').update(newTokens.refreshToken).digest('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await client.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
        [existingSession.user_id, newTokenHash, expiresAt]
      );

      await client.query('COMMIT');

      return {
        tokens: newTokens,
        user: {
          id: existingSession.user_id,
          email: existingSession.email,
          full_name: existingSession.full_name,
          role: existingSession.role,
          permissions: ROLE_PERMISSIONS[existingSession.role as UserRole] || [],
        },
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async logout(refreshTokenPlain?: string, userId?: string): Promise<void> {
    if (refreshTokenPlain) {
      const tokenHash = crypto.createHash('sha256').update(refreshTokenPlain).digest('hex');
      await query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
    } else if (userId) {
      await query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
    }
  }

  async getCurrentUser(userId: string): Promise<any> {
    const res = await query('SELECT id, email, full_name, role, created_at, updated_at FROM users WHERE id = $1', [userId]);
    if (res.rows.length === 0) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User profile not found');
    }
    const u = res.rows[0];
    return {
      ...u,
      permissions: ROLE_PERMISSIONS[u.role as UserRole] || [],
    };
  }
}

export const authService = new AuthService();
