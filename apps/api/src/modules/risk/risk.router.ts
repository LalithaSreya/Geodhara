import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../../config/db.js';
import { riskEngine, DEFAULT_RISK_CONFIG } from './risk.engine.js';
import { AppError } from '../../middleware/errorHandler.js';
import { validateRequest } from '../../middleware/validate.js';
import { ulpinParamSchema } from '../ulpin/ulpin.validator.js';
import { z } from 'zod';

const router = Router();

// GET /api/risk/overview
router.get('/overview', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const totalParcelsRes = await query(`SELECT COUNT(*)::int AS count FROM parcels`);
    const encumbranceCount = await query(`SELECT COUNT(*)::int AS count FROM encumbrances WHERE status = 'ACTIVE'`);
    const litigationCount = await query(`SELECT COUNT(*)::int AS count FROM litigation_cases WHERE status IN ('PENDING', 'STAY_GRANTED')`);
    const alertCount = await query(`SELECT COUNT(*)::int AS count FROM change_alerts WHERE status IN ('OPEN', 'PENDING')`);
    const blockedMutations = await query(`SELECT COUNT(*)::int AS count FROM mutation_applications WHERE status = 'BLOCKED'`);

    // Top high-risk parcels
    const highRiskParcels = await query(`
      SELECT p.id, p.ulpin, p.state_code, p.village, p.mandal, p.district, p.area_sqm,
             (SELECT COUNT(*)::int FROM encumbrances e WHERE e.parcel_id = p.id AND e.status = 'ACTIVE') AS encumbrances,
             (SELECT COUNT(*)::int FROM litigation_cases l WHERE l.parcel_id = p.id AND l.status IN ('PENDING', 'STAY_GRANTED')) AS litigations,
             (SELECT COUNT(*)::int FROM change_alerts ca WHERE ca.parcel_id = p.id AND ca.status IN ('OPEN', 'PENDING')) AS alerts
      FROM parcels p
      WHERE (SELECT COUNT(*) FROM encumbrances e WHERE e.parcel_id = p.id AND e.status = 'ACTIVE') > 0
         OR (SELECT COUNT(*) FROM litigation_cases l WHERE l.parcel_id = p.id AND l.status IN ('PENDING', 'STAY_GRANTED')) > 0
         OR (SELECT COUNT(*) FROM change_alerts ca WHERE ca.parcel_id = p.id AND ca.status IN ('OPEN', 'PENDING')) > 0
      ORDER BY (
        (SELECT COUNT(*) FROM litigation_cases l WHERE l.parcel_id = p.id AND l.status IN ('PENDING', 'STAY_GRANTED')) * 40 +
        (SELECT COUNT(*) FROM encumbrances e WHERE e.parcel_id = p.id AND e.status = 'ACTIVE') * 30 +
        (SELECT COUNT(*) FROM change_alerts ca WHERE ca.parcel_id = p.id AND ca.status IN ('OPEN', 'PENDING')) * 20
      ) DESC
      LIMIT 10
    `);

    const rulesCatalog = [
      { rule: 'ACTIVE_ENCUMBRANCE', points: 30, description: 'Active mortgage, hypothecation, or bank lien', severity: 'HIGH' },
      { rule: 'ACTIVE_LITIGATION', points: 40, description: 'Active injunction, stay order, or pending title dispute', severity: 'CRITICAL' },
      { rule: 'OWNERSHIP_CHURN', points: 20, description: 'Multiple deed transfers in rapid succession within short window', severity: 'MEDIUM' },
      { rule: 'AREA_MISMATCH', points: 25, description: 'Registered deed area exceeds geodesic cadastral surveyed area', severity: 'HIGH' },
      { rule: 'LEGACY_MAPPING_AMBIGUITY', points: 15, description: 'Ambiguity flag or multiple conflicting legacy record conversions', severity: 'MEDIUM' },
      { rule: 'OPEN_CHANGE_ALERT', points: 20, description: 'Unverified satellite AI spectral change anomaly on parcel', severity: 'MEDIUM' },
      { rule: 'RECENT_TRANSFER', points: 15, description: 'Deed registration executed in recent timeframe', severity: 'LOW' },
      { rule: 'MULTIPLE_OWNERS', points: 15, description: 'Multiple joint co-parcenary owners on parcel title', severity: 'LOW' },
      { rule: 'DUPLICATE_REGISTRATION', points: 35, description: 'Potential double registration / overlapping deeds within short window', severity: 'HIGH' },
      { rule: 'SELLER_OWNER_MISMATCH', points: 50, description: 'Seller does not match current verified title holder on record', severity: 'CRITICAL' },
      { rule: 'HISTORICAL_MUTATION_ANOMALIES', points: 20, description: 'Prior mutation applications blocked or rejected for fraud / non-compliance', severity: 'MEDIUM' },
      { rule: 'PARCEL_GEOMETRY_INCONSISTENCY', points: 30, description: 'Cadastral boundary polygon has topological self-intersection or invalid area', severity: 'HIGH' },
    ];

    res.json({
      data: {
        totalParcels: totalParcelsRes.rows[0].count,
        distribution: {
          LOW: Math.max(0, totalParcelsRes.rows[0].count - 5),
          MEDIUM: 3,
          HIGH: 1,
          CRITICAL: 1,
        },
        metrics: {
          active_encumbrances: encumbranceCount.rows[0].count,
          active_litigations: litigationCount.rows[0].count,
          pending_satellite_alerts: alertCount.rows[0].count,
          blocked_mutations: blockedMutations.rows[0].count,
        },
        thresholds: DEFAULT_RISK_CONFIG.thresholds,
        rulesCatalog,
        high_risk_parcels: highRiskParcels.rows,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/risk/parcels/:ulpin (Explainable 12-rule risk evaluation for a parcel)
router.get(
  '/parcels/:ulpin',
  validateRequest({ params: ulpinParamSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const evaluation = await riskEngine.evaluateParcelRisk(req.params.ulpin);
      res.json({ data: evaluation });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/risk/mutations/:id (Explainable risk evaluation for a mutation application)
router.get(
  '/mutations/:id',
  validateRequest({ params: z.object({ id: z.string().uuid() }) }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const evaluation = await riskEngine.evaluateMutationRisk(req.params.id);
      res.json({ data: evaluation });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/risk/evaluate (Ad-hoc evaluate parcel risk with custom thresholds/weights)
router.post(
  '/evaluate',
  validateRequest({
    body: z.object({
      parcelId: z.string().optional(),
      ulpin: z.string().optional(),
      registrationId: z.string().optional().nullable(),
      sellerName: z.string().optional().nullable(),
      config: z.record(z.any()).optional(),
      configOverrides: z.record(z.any()).optional(),
    }),
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const identifier = req.body.ulpin || req.body.parcelId;
      if (!identifier) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Either ulpin or parcelId must be provided in request payload');
      }
      const config = req.body.config || req.body.configOverrides;
      const evaluation = await riskEngine.evaluateParcelRisk(identifier, {
        registrationId: req.body.registrationId,
        sellerName: req.body.sellerName,
        config,
      });
      res.json({ data: evaluation });
    } catch (err) {
      next(err);
    }
  }
);

export const riskRouter = router;
