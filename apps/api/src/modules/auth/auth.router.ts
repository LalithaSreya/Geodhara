import { Router, Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { validateRequest } from '../../middleware/validate.js';
import { requireAuth, optionalAuth } from '../../middleware/auth.js';
import { rateLimiter } from '../../middleware/rateLimiter.js';
import { z } from 'zod';

const router = Router();

// POST /api/auth/login (Rate limited: 10 attempts per minute)
router.post(
  '/login',
  rateLimiter({ windowSec: 60, maxRequests: 10, keyPrefix: 'rl:auth:login' }),
  validateRequest({
    body: z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }),
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login(req.body.email, req.body.password);
      res.json({
        message: 'Login successful',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/refresh (Rate limited: 20 per minute)
router.post(
  '/refresh',
  rateLimiter({ windowSec: 60, maxRequests: 20, keyPrefix: 'rl:auth:refresh' }),
  validateRequest({
    body: z.object({
      refreshToken: z.string().min(1, 'Refresh token is required'),
    }),
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.refreshSession(req.body.refreshToken);
      res.json({
        message: 'Session refreshed successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/logout
router.post(
  '/logout',
  optionalAuth,
  validateRequest({
    body: z.object({
      refreshToken: z.string().optional(),
    }),
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authService.logout(req.body.refreshToken, req.user?.id);
      res.json({
        message: 'Logged out successfully',
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/auth/me
router.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.getCurrentUser(req.user!.id);
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
});

export const authRouter = router;
