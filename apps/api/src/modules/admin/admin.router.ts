import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../../config/db.js';
import { requireAuth, requirePermission, requireRole } from '../../middleware/auth.js';

const router = Router();

// GET /api/admin/metrics
router.get(
  '/metrics',
  requireAuth,
  requireRole(['admin', 'officer']),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const counts = await Promise.all([
        query('SELECT COUNT(*)::int AS count FROM states'),
        query('SELECT COUNT(*)::int AS count FROM parcels'),
        query('SELECT COUNT(*)::int AS count FROM parcel_owners'),
        query('SELECT COUNT(*)::int AS count FROM registrations'),
        query('SELECT COUNT(*)::int AS count FROM encumbrances'),
        query('SELECT COUNT(*)::int AS count FROM litigation_cases'),
        query('SELECT COUNT(*)::int AS count FROM mutation_applications'),
        query('SELECT COUNT(*)::int AS count FROM change_alerts'),
        query('SELECT COUNT(*)::int AS count FROM field_observations'),
        query('SELECT COUNT(*)::int AS count FROM audit_log'),
        query('SELECT COUNT(*)::int AS count FROM users'),
      ]);

      const states = await query('SELECT id, code, name FROM states ORDER BY name ASC');

      res.json({
        data: {
          tables: {
            states: counts[0].rows[0].count,
            parcels: counts[1].rows[0].count,
            parcel_owners: counts[2].rows[0].count,
            registrations: counts[3].rows[0].count,
            encumbrances: counts[4].rows[0].count,
            litigation_cases: counts[5].rows[0].count,
            mutation_applications: counts[6].rows[0].count,
            change_alerts: counts[7].rows[0].count,
            field_observations: counts[8].rows[0].count,
            audit_log: counts[9].rows[0].count,
            users: counts[10].rows[0].count,
          },
          states: states.rows,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export const adminRouter = router;
