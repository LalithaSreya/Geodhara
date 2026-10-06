import { Router, Request, Response, NextFunction } from 'express';
import { parcelsService } from './parcels.service.js';
import { validateRequest } from '../../middleware/validate.js';
import { ulpinParamSchema } from '../ulpin/ulpin.validator.js';
import { requireAuth, requirePermission, optionalAuth } from '../../middleware/auth.js';
import { rateLimiter } from '../../middleware/rateLimiter.js';
import { AppError } from '../../middleware/errorHandler.js';
import { z } from 'zod';

const router = Router();

// GET /api/parcels/search (Multi-parameter & cross-state search)
router.get(
  '/search',
  optionalAuth,
  rateLimiter({ windowSec: 60, maxRequests: 120, keyPrefix: 'rl:search' }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const results = await parcelsService.searchParcels({
        q: req.query.q as string,
        ulpin: req.query.ulpin as string,
        legacy_survey_no: (req.query.legacy_survey_no || req.query.survey_no) as string,
        owner_name: req.query.owner_name as string,
        district: req.query.district as string,
        village: req.query.village as string,
        state: (req.query.state || req.query.state_code) as string,
        registration_number: (req.query.registration_number || req.query.deed_number) as string,
        limit: parseInt(req.query.limit as string) || 50,
        offset: parseInt(req.query.offset as string) || 0,
      });

      res.json(results);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/parcels/geojson (GeoJSON FeatureCollection with spatial filters)
router.get(
  '/geojson',
  optionalAuth,
  rateLimiter({ windowSec: 60, maxRequests: 120, keyPrefix: 'rl:geojson' }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let bbox: [number, number, number, number] | undefined;
      if (req.query.bbox && typeof req.query.bbox === 'string') {
        const parts = req.query.bbox.split(',').map((p) => parseFloat(p.trim()));
        if (parts.length === 4 && !parts.some(isNaN)) {
          bbox = parts as [number, number, number, number];
        }
      }

      const result = await parcelsService.getParcelsGeoJson({
        bbox,
        stateCode: req.query.state as string,
        landUse: req.query.land_use as string,
        hasAlerts: req.query.alerts === 'true',
        limit: parseInt(req.query.limit as string) || 200,
        offset: parseInt(req.query.offset as string) || 0,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/parcels/states/geojson (State boundaries for Leaflet GIS toggle)
router.get('/states/geojson', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const geojson = await parcelsService.getStateBoundariesGeoJson();
    res.json(geojson);
  } catch (err) {
    next(err);
  }
});

// GET /api/parcels/spatial/nearby?lat=...&lng=...&radiusMeters=...
router.get('/spatial/nearby', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radiusMeters = parseFloat(req.query.radiusMeters as string) || 1000;

    if (isNaN(lat) || isNaN(lng)) {
      throw new AppError(400, 'INVALID_COORDINATES', 'Valid lat and lng query parameters are required');
    }

    const parcels = await parcelsService.getNearbyParcels(lat, lng, radiusMeters);
    res.json({
      center: { lat, lng },
      radius_meters: radiusMeters,
      count: parcels.length,
      parcels,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/parcels/spatial/point?lat=...&lng=... (Point-in-parcel)
router.get('/spatial/point', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (isNaN(lat) || isNaN(lng)) {
      throw new AppError(400, 'INVALID_COORDINATES', 'Valid lat and lng query parameters are required');
    }

    const parcel = await parcelsService.getPointInParcel(lat, lng);
    if (!parcel) {
      return res.status(404).json({
        found: false,
        message: 'No parcel found at the given coordinates',
        coordinates: { lat, lng },
      });
    }

    res.json({
      found: true,
      parcel,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/parcels/:ulpin/neighbours (Get neighbouring parcels)
router.get(
  '/:ulpin/neighbours',
  validateRequest({
    params: ulpinParamSchema,
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const neighbours = await parcelsService.getNeighbouringParcels(req.params.ulpin);
      res.json({ data: neighbours });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/parcels/:ulpin/geojson (Single parcel GeoJSON feature)
router.get(
  '/:ulpin/geojson',
  validateRequest({
    params: ulpinParamSchema,
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await parcelsService.getParcel360(req.params.ulpin);
      res.json({
        type: 'Feature',
        id: data.parcel.id,
        geometry: data.parcel.geometry,
        properties: {
          ulpin: data.parcel.ulpin,
          state_code: data.parcel.state_code,
          state_name: data.parcel.state_name,
          legacy_survey_no: data.parcel.legacy_survey_no,
          village: data.parcel.village,
          mandal: data.parcel.mandal,
          district: data.parcel.district,
          recorded_area_sqm: data.parcel.recorded_area_sqm,
          geodesic_area_sqm: data.parcel.geodesic_area_sqm,
          risk_score: data.risk_assessment.score,
          risk_category: data.risk_assessment.category,
          current_owners: data.ownership.current_owners,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/parcels/:ulpin/risk (Explainable 12-Rule Risk Evaluation)
router.get(
  '/:ulpin/risk',
  optionalAuth,
  validateRequest({
    params: ulpinParamSchema,
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await parcelsService.getParcelRisk(req.params.ulpin);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/parcels/:ulpin (360° Unified Parcel Inspector)
router.get(
  '/:ulpin',
  optionalAuth,
  validateRequest({
    params: ulpinParamSchema,
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await parcelsService.getParcel360(req.params.ulpin);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/parcels/:ulpin (Update with optimistic concurrency & explicit RBAC permission)
router.patch(
  '/:ulpin',
  requireAuth,
  requirePermission('parcels:update'),
  validateRequest({
    params: ulpinParamSchema,
    body: z.object({
      expectedVersion: z.number().int().positive(),
      changeReason: z.string().min(3),
      legacy_survey_no: z.string().optional(),
      village: z.string().optional(),
      mandal: z.string().optional(),
      district: z.string().optional(),
    }),
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await parcelsService.updateParcel(req.params.ulpin, {
        ...req.body,
        actorId: req.user!.email,
      });
      res.json({
        message: 'Parcel updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

export const parcelsRouter = router;
