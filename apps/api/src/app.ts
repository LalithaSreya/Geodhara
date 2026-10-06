import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { query } from './config/db.js';
import { openApiSpec } from './docs/openapi.js';
import { errorHandler } from './middleware/errorHandler.js';

// Import Routers
import { authRouter } from './modules/auth/auth.router.js';
import { ulpinRouter } from './modules/ulpin/ulpin.router.js';
import { parcelsRouter } from './modules/parcels/parcels.router.js';
import { recordsRouter } from './modules/records/records.router.js';
import { registrationsRouter } from './modules/registrations/registrations.router.js';
import { encumbrancesRouter } from './modules/encumbrances/encumbrances.router.js';
import { litigationRouter } from './modules/litigation/litigation.router.js';
import { mutationRouter } from './modules/mutation/mutation.router.js';
import { riskRouter } from './modules/risk/risk.router.js';
import { changeAlertsRouter } from './modules/change-alerts/change-alerts.router.js';
import { fieldRouter } from './modules/field/field.router.js';
import { syncRouter } from './modules/sync/sync.router.js';
import { auditRouter } from './modules/audit/audit.router.js';
import { adminRouter } from './modules/admin/admin.router.js';
import { legacyRouter } from './modules/legacy/legacy.router.js';
import { adaptersRouter } from './modules/adapters/adapters.router.js';
import { satelliteRouter } from './modules/satellite/satellite.router.js';

export function createApp() {
  const app = express();

  // Basic Middlewares
  app.use(helmet({
    contentSecurityPolicy: false, // Allow Swagger UI assets
  }));
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Swagger Documentation at /docs
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
  app.get('/docs.json', (_req, res) => res.json(openApiSpec));

  // Health Endpoint
  app.get('/api/health', async (_req, res, next) => {
    try {
      const dbCheck = await query('SELECT PostGIS_Version() AS postgis_version, NOW() AS server_time');
      res.json({
        status: 'UP',
        system: 'GeoDhara Digital Public Infrastructure',
        tagline: 'One parcel. One identity.',
        environment: 'DEMO_SYNTHETIC',
        notice: 'DEMO ENVIRONMENT - All data is synthetic. Government integrations are represented by mock adapters.',
        database: {
          connected: true,
          postgis_version: dbCheck.rows[0]?.postgis_version,
          server_time: dbCheck.rows[0]?.server_time,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(503).json({
        status: 'DEGRADED',
        error: err.message,
      });
    }
  });

  // REST API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/ulpin', ulpinRouter);
  app.use('/api/parcels', parcelsRouter);
  app.use('/api/records', recordsRouter);
  app.use('/api/registrations', registrationsRouter);
  app.use('/api/encumbrances', encumbrancesRouter);
  app.use('/api/litigation', litigationRouter);
  app.use('/api/mutation', mutationRouter);
  app.use('/api/risk', riskRouter);
  app.use('/api/change-alerts', changeAlertsRouter);
  app.use('/api/field', fieldRouter);
  app.use('/api/sync', syncRouter);
  app.use('/api/audit', auditRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/legacy', legacyRouter);
  app.use('/api/adapters', adaptersRouter);
  app.use('/api/satellite', satelliteRouter);

  // Fallback 404 Handler
  app.use((_req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource or endpoint does not exist',
      },
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
