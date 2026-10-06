import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import { ulpinService } from '../ulpin/ulpin.service.js';

const router = Router();

// GET /api/legacy/resolve?state=TS&legacy_system=Dharani&legacy_identifier=TS-LEG-1000
// or GET /api/legacy/resolve?legacy_survey_no=101/1&state=TS
router.get('/resolve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const state = req.query.state as string | undefined;
    const legacySystem = req.query.legacy_system as string | undefined;
    const legacyIdentifier = (req.query.legacy_identifier as string | undefined)?.trim();
    const legacySurveyNo = (req.query.legacy_survey_no as string | undefined)?.trim();
    const queryTerm = (req.query.q as string | undefined)?.trim();

    const searchTerm = legacyIdentifier || legacySurveyNo || queryTerm;
    if (!searchTerm) {
      throw new AppError(400, 'MISSING_SEARCH_PARAM', 'Please provide legacy_identifier, legacy_survey_no, or query parameter q');
    }

    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    conditions.push(`(m.legacy_identifier ILIKE $${pIdx} OR m.legacy_survey_no ILIKE $${pIdx} OR p.legacy_survey_no ILIKE $${pIdx})`);
    params.push(`%${searchTerm}%`);
    pIdx++;

    if (state) {
      conditions.push(`(m.state ILIKE $${pIdx} OR p.state_code ILIKE $${pIdx})`);
      params.push(state.toUpperCase());
      pIdx++;
    }

    if (legacySystem) {
      conditions.push(`m.legacy_system ILIKE $${pIdx++}`);
      params.push(`%${legacySystem}%`);
    }

    const sql = `
      SELECT m.id, m.state, m.legacy_system, m.legacy_survey_no, m.legacy_identifier,
             m.ulpin, m.confidence, m.status,
             p.id AS parcel_id, p.village, p.mandal, p.district, p.area_sqm,
             p.version
      FROM legacy_id_map m
      JOIN parcels p ON p.ulpin = m.ulpin
      WHERE ${conditions.join(' AND ')}
      LIMIT 10
    `;

    const result = await query(sql, params);

    if (result.rows.length === 0) {
      throw new AppError(404, 'LEGACY_MAPPING_NOT_FOUND', `No ULPIN mapping found for legacy identifier/survey '${searchTerm}'`);
    }

    const mappingsWithParcel = await Promise.all(
      result.rows.map(async (row) => {
        const unified = await ulpinService.resolveUlpin(row.ulpin);
        return {
          flow: {
            step_1_legacy_identifier: {
              identifier: row.legacy_identifier,
              survey_no: row.legacy_survey_no,
              source_system: row.legacy_system,
              state: row.state,
            },
            step_2_mapped_ulpin: {
              ulpin: row.ulpin,
              mapping_confidence: parseFloat(row.confidence),
              match_status: row.status,
              is_ambiguous: row.status === 'MISMATCH_FLAGGED',
            },
            step_3_unified_parcel: {
              ulpin: unified.ulpin,
              state_name: unified.state_name,
              location: unified.location,
              recorded_area_sqm: unified.spatial.recorded_area_sqm,
              geodesic_area_sqm: unified.spatial.geodesic_area_sqm,
              current_owners: unified.current_owners,
              summary: unified.summary,
              risk_score: unified.risk_assessment?.score || 0,
            },
          },
        };
      })
    );

    res.json({
      total_matches: result.rows.length,
      search_criteria: {
        searched_term: searchTerm,
        state: state || 'ALL',
        legacy_system: legacySystem || 'ALL',
      },
      results: mappingsWithParcel,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/legacy/all (List all legacy mappings for admin/review)
router.get('/all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as string | undefined;
    const state = req.query.state as string | undefined;
    const limit = parseInt(req.query.limit as string) || 100;

    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (status) {
      conditions.push(`status = $${pIdx++}`);
      params.push(status);
    }
    if (state) {
      conditions.push(`state = $${pIdx++}`);
      params.push(state.toUpperCase());
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM legacy_id_map ${where} ORDER BY created_at DESC LIMIT $${pIdx}`;
    params.push(limit);

    const resDb = await query(sql, params);
    res.json({ count: resDb.rows.length, data: resDb.rows });
  } catch (err) {
    next(err);
  }
});

export const legacyRouter = router;
