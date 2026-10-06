import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../../config/db.js';

const router = Router();

// GET /api/sync/logs
router.get('/logs', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT * FROM sync_log ORDER BY processed_at DESC LIMIT 100`
    );
    res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
});

export const syncRouter = router;
