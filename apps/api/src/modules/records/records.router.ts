import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../../config/db.js';

const router = Router();

// GET /api/records?parcelId=...
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { parcelId, recordType } = req.query;
    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (parcelId) {
      conditions.push(`lr.parcel_id = $${pIdx++}`);
      params.push(parcelId);
    }
    if (recordType) {
      conditions.push(`lr.record_type = $${pIdx++}`);
      params.push(recordType);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT lr.*, p.ulpin, p.legacy_survey_no, p.village, p.mandal, p.district
      FROM land_records lr
      JOIN parcels p ON p.id = lr.parcel_id
      ${whereClause}
      ORDER BY lr.record_date DESC
    `;

    const result = await query(sql, params);
    res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
});

export const recordsRouter = router;
