import { Router, Request, Response, NextFunction } from 'express';
import { fieldService } from './field.service.js';
import { validateRequest } from '../../middleware/validate.js';
import { requireAuth, requirePermission, optionalAuth } from '../../middleware/auth.js';
import { rateLimiter } from '../../middleware/rateLimiter.js';
import { z } from 'zod';

const router = Router();

const observationSchema = z.object({
  client_uuid: z.string().min(1),
  parcel_id: z.string().uuid(),
  ulpin: z.string().min(14),
  notes: z.string().min(1),
  photo_reference: z.string().optional().nullable(),
  gps_lat: z.number(),
  gps_lng: z.number(),
  observed_at: z.string(),
  device_timestamp: z.string(),
  parcel_version: z.number().int().positive(),
});

// GET /api/field
router.get('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await fieldService.listObservations(req.query.parcelId as string);
    res.json({ data: list });
  } catch (err) {
    next(err);
  }
});

// POST /api/field/observation
router.post(
  '/observation',
  requireAuth,
  requirePermission('field:capture_observation'),
  validateRequest({
    body: observationSchema,
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await fieldService.recordObservation(req.body, req.user!.email);
      res.status(201).json({
        message: 'Field observation recorded',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/field/sync (Batch offline sync, rate limited)
router.post(
  '/sync',
  requireAuth,
  requirePermission('field:sync'),
  rateLimiter({ windowSec: 60, maxRequests: 30, keyPrefix: 'rl:field:sync' }),
  validateRequest({
    body: z.object({
      observations: z.array(observationSchema),
    }),
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const results = await fieldService.syncBatch(req.body.observations, req.user!.email);
      res.json({
        message: 'Batch sync processed',
        data: results,
      });
    } catch (err) {
      next(err);
    }
  }
);

export const fieldRouter = router;
