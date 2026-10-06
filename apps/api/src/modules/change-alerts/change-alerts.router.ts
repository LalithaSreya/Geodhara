import { Router, Request, Response, NextFunction } from 'express';
import { changeAlertsService } from './change-alerts.service.js';
import { validateRequest } from '../../middleware/validate.js';
import { requireAuth, requirePermission, optionalAuth } from '../../middleware/auth.js';
import { z } from 'zod';

const router = Router();

// GET /api/change-alerts
router.get('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alerts = await changeAlertsService.getAlerts({
      status: req.query.status as string,
      type: req.query.type as string,
      limit: parseInt(req.query.limit as string) || 50,
      offset: parseInt(req.query.offset as string) || 0,
    });
    res.json({ data: alerts });
  } catch (err) {
    next(err);
  }
});

// GET /api/change-alerts/:id
router.get(
  '/:id',
  optionalAuth,
  validateRequest({
    params: z.object({
      id: z.string().uuid(),
    }),
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const alert = await changeAlertsService.getAlertById(req.params.id);
      res.json({ data: alert });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/change-alerts/:id/verify
router.post(
  '/:id/verify',
  requireAuth,
  requirePermission('alerts:verify'),
  validateRequest({
    params: z.object({
      id: z.string().uuid(),
    }),
    body: z.object({
      action: z.enum(['VERIFY', 'DISMISS']),
      notes: z.string().optional(),
    }),
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await changeAlertsService.verifyAlert({
        alertId: req.params.id,
        action: req.body.action,
        actorId: req.user!.email,
        notes: req.body.notes,
      });
      res.json({
        message: `Change alert marked as ${result.status}`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

export const changeAlertsRouter = router;
