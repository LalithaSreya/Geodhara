import { Router, Request, Response, NextFunction } from 'express';
import { satelliteChangeDetector } from './satellite.processor.js';
import { requireAuth, requirePermission, optionalAuth } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validate.js';
import { AppError } from '../../middleware/errorHandler.js';
import { z } from 'zod';

const router = Router();

// GET /api/satellite/scenes (List available demo Sentinel-2 Level-2A scenes)
router.get('/scenes', optionalAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const scenes = satelliteChangeDetector.loadDemoScenes();
    const sceneSummaries = scenes.map((s) => ({
      id: s.id,
      name: s.name,
      location: s.location,
      stateCode: s.stateCode,
      beforeDate: s.beforeDate,
      afterDate: s.afterDate,
      cloudPct: s.cloudPct,
      bbox: s.bbox,
      groundTruthType: s.groundTruthType,
      dimensions: `${s.width}x${s.height}`,
      sensor: 'Copernicus Sentinel-2 MSI (Level-2A BOA Surface Reflectance)',
      bands: ['B04 (Red - 665nm)', 'B08 (NIR - 842nm)', 'B11 (SWIR - 1610nm)', 'SCL (Scene Classification)'],
    }));

    res.json({
      data: {
        totalScenes: sceneSummaries.length,
        scenes: sceneSummaries,
        disclaimer: 'Automated Radiometric Differencing Pipeline — Human Verification Required.',
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/satellite/scenes/:sceneId (Fetch full scene matrices including raster bands)
router.get('/scenes/:sceneId', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scenes = satelliteChangeDetector.loadDemoScenes();
    const scene = scenes.find((s) => s.id === req.params.sceneId);

    if (!scene) {
      throw new AppError(404, 'SCENE_NOT_FOUND', `Satellite scene '${req.params.sceneId}' not found`);
    }

    res.json({ data: scene });
  } catch (err) {
    next(err);
  }
});

// POST /api/satellite/pipeline/run (Execute automated radiometric differencing & PostGIS parcel intersection)
router.post(
  '/pipeline/run',
  requireAuth,
  requirePermission('alerts:verify'),
  validateRequest({
    body: z.object({
      sceneId: z.string(),
      config: z
        .object({
          maxCloudCoverPct: z.number().min(0).max(100).optional(),
          ndviDropThreshold: z.number().min(0.05).max(1.0).optional(),
          ndbiSurgeThreshold: z.number().min(0.05).max(1.0).optional(),
          minClusterPixelSize: z.number().min(1).max(50).optional(),
        })
        .optional(),
      persistAlerts: z.boolean().optional(),
    }),
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const scenes = satelliteChangeDetector.loadDemoScenes();
      const targetScene = scenes.find((s) => s.id === req.body.sceneId);

      if (!targetScene) {
        throw new AppError(404, 'SCENE_NOT_FOUND', `Satellite scene '${req.body.sceneId}' not found`);
      }

      const result = await satelliteChangeDetector.processScene(targetScene, {
        config: req.body.config,
        persistAlerts: req.body.persistAlerts ?? false,
        actorId: req.user?.email || 'OFFICER_PIPELINE_TRIGGER',
      });

      res.json({
        message: 'Automated satellite radiometric change detection executed successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

export const satelliteRouter = router;
