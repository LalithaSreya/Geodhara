import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../../config/db.js';

const router = Router();

// GET /api/litigation?parcelId=...
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { parcelId, status } = req.query;
    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (parcelId) {
      conditions.push(`l.parcel_id = $${pIdx++}`);
      params.push(parcelId);
    }
    if (status) {
      conditions.push(`l.status = $${pIdx++}`);
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT l.*, p.ulpin, p.legacy_survey_no, p.village, p.mandal
      FROM litigation_cases l
      JOIN parcels p ON p.id = l.parcel_id
      ${whereClause}
      ORDER BY l.opened_at DESC
    `;

    const result = await query(sql, params);
    res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
});

export const litigationRouter = router;
