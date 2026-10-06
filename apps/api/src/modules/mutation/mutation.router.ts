import { Router, Request, Response, NextFunction } from 'express';
import { mutationService } from './mutation.service.js';
import { riskEngine } from '../risk/risk.engine.js';
import { validateRequest } from '../../middleware/validate.js';
import { requireAuth, requirePermission, optionalAuth } from '../../middleware/auth.js';
import { rateLimiter } from '../../middleware/rateLimiter.js';
import { z } from 'zod';

const router = Router();

// GET /api/mutation (List applications with multi-dimensional filters)
router.get('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apps = await mutationService.listApplications({
      status: req.query.status as string,
      parcelId: req.query.parcelId as string,
      state: req.query.state as string,
      district: req.query.district as string,
      riskMin: req.query.riskMin ? parseInt(req.query.riskMin as string) : undefined,
      riskMax: req.query.riskMax ? parseInt(req.query.riskMax as string) : undefined,
      search: req.query.search as string,
      limit: parseInt(req.query.limit as string) || 50,
      offset: parseInt(req.query.offset as string) || 0,
    });
    res.json({ data: apps });
  } catch (err) {
    next(err);
  }
});

// GET /api/mutation/:id (Get single application details + 11 validation checks)
router.get('/:id', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const app = await mutationService.getApplicationById(req.params.id);
    res.json({ data: app });
  } catch (err) {
    next(err);
  }
});

// GET /api/mutation/:id/risk (Explainable 12-rule Risk Evaluation for Mutation)
router.get('/:id/risk', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await riskEngine.evaluateMutationRisk(req.params.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// POST /api/mutation/validate (Dry-run automated rules evaluation without saving)
router.post(
  '/validate',
  optionalAuth,
  validateRequest({
    body: z.object({
      parcelId: z.string().uuid(),
      registrationId: z.string().uuid().optional().nullable(),
      sellerName: z.string().optional().nullable(),
      applicant: z
        .object({
          name: z.string().min(2),
          id_number: z.string().min(4),
        })
        .optional(),
    }),
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const evaluation = await mutationService.evaluateRiskAndRules(
        req.body.parcelId,
        req.body.registrationId,
        req.body.applicant,
        req.body.sellerName
      );
      res.json({ data: evaluation });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/mutation (Submit application, rate limited)
router.post(
  '/',
  requireAuth,
  requirePermission('mutation:submit'),
  rateLimiter({ windowSec: 60, maxRequests: 20, keyPrefix: 'rl:mutation:submit' }),
  validateRequest({
    body: z.object({
      parcelId: z.string().uuid(),
      registrationId: z.string().uuid().optional().nullable(),
      sellerName: z.string().optional().nullable(),
      applicant: z.object({
        name: z.string().min(2),
        id_number: z.string().min(4),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        type: z.string().optional(),
      }),
    }),
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorId = req.user!.email;
      const result = await mutationService.submitApplication({
        parcelId: req.body.parcelId,
        applicant: req.body.applicant,
        sellerName: req.body.sellerName,
        registrationId: req.body.registrationId,
        actorId,
      });
      res.status(201).json({
        message: 'Mutation application submitted successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/mutation/:id/transition (Workflow transition with optimistic concurrency)
router.post(
  '/:id/transition',
  requireAuth,
  requirePermission('mutation:approve_reject'),
  validateRequest({
    params: z.object({
      id: z.string().uuid(),
    }),
    body: z.object({
      targetStatus: z.enum([
        'AUTO_VALIDATED',
        'BLOCKED',
        'OFFICER_REVIEW',
        'FIELD_VERIFICATION',
        'APPROVED',
        'RECORD_UPDATED',
        'REJECTED',
      ]),
      reason: z.string().min(3),
      expectedVersion: z.number().int().optional(),
      metadata: z.record(z.any()).optional(),
    }),
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await mutationService.transitionStatus({
        applicationId: req.params.id,
        targetStatus: req.body.targetStatus,
        reason: req.body.reason,
        actorId: req.user!.email,
        expectedVersion: req.body.expectedVersion,
        metadata: req.body.metadata,
      });
      res.json({
        message: `Mutation application transitioned to ${req.body.targetStatus}`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

export const mutationRouter = router;

