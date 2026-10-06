import { Router, Request, Response, NextFunction } from 'express';
import { TelanganaStateAdapter, KarnatakaStateAdapter } from './stateAdapters.js';
import { AppError } from '../../middleware/errorHandler.js';
import { query } from '../../config/db.js';

const router = Router();

// GET /api/adapters/fetch?state=TS&identifier=101/1
router.get('/fetch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const state = ((req.query.state as string) || '').toUpperCase();
    const identifier = (req.query.identifier as string) || '';

    if (!state || !identifier) {
      throw new AppError(400, 'INVALID_PARAMS', 'Both state (TS or KA) and identifier (survey_no or legacy_id) are required');
    }

    // Resolve mapped ULPIN from legacy_id_map or parcels
    const mapRes = await query(
      `SELECT p.ulpin FROM parcels p
       LEFT JOIN legacy_id_map m ON m.ulpin = p.ulpin
       WHERE p.state_code = $1 AND (p.legacy_survey_no = $2 OR m.legacy_identifier = $2 OR p.ulpin = $2)
       LIMIT 1`,
      [state, identifier]
    );

    const mappedUlpin = mapRes.rows[0]?.ulpin || 'TSUNKNOWN00000';

    if (state === 'TS' || state === 'TELANGANA') {
      const rawData = await TelanganaStateAdapter.fetchRecord(identifier);
      if (!rawData) {
        throw new AppError(404, 'RECORD_NOT_FOUND', `Telangana legacy record '${identifier}' not found`);
      }
      const normalized = TelanganaStateAdapter.normalize(rawData, mappedUlpin);
      return res.json({
        mock_adapter: TelanganaStateAdapter.SYSTEM_NAME,
        state: 'Telangana (TS)',
        raw_state_schema: rawData,
        normalized_geodhara_schema: normalized,
      });
    } else if (state === 'KA' || state === 'KARNATAKA') {
      const rawData = await KarnatakaStateAdapter.fetchRecord(identifier);
      if (!rawData) {
        throw new AppError(404, 'RECORD_NOT_FOUND', `Karnataka legacy record '${identifier}' not found`);
      }
      const normalized = KarnatakaStateAdapter.normalize(rawData, mappedUlpin);
      return res.json({
        mock_adapter: KarnatakaStateAdapter.SYSTEM_NAME,
        state: 'Karnataka (KA)',
        raw_state_schema: rawData,
        normalized_geodhara_schema: normalized,
      });
    } else {
      throw new AppError(400, 'UNSUPPORTED_STATE', `Mock adapter for state '${state}' is not supported. Supported: TS, KA`);
    }
  } catch (err) {
    next(err);
  }
});

// GET /api/adapters/comparison
router.get('/comparison', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const tsSample = await TelanganaStateAdapter.fetchRecord('101/1');
    const kaSample = await KarnatakaStateAdapter.fetchRecord('Sy-87/1');

    res.json({
      notice: 'Mock State Adapter Demonstration: Schemas vary between states but normalize into GeoDhara standard schema.',
      adapters: [
        {
          state: 'Telangana',
          system: TelanganaStateAdapter.SYSTEM_NAME,
          fields: ['survey_no', 'pattadar_name', 'khata_number', 'extent_acres_guntas', 'nature_of_land', 'sro_office'],
          sample_raw: tsSample,
          sample_normalized: tsSample ? TelanganaStateAdapter.normalize(tsSample, 'TSQXY9QM4KNXSZ') : null,
        },
        {
          state: 'Karnataka',
          system: KarnatakaStateAdapter.SYSTEM_NAME,
          fields: ['survey_number', 'hissa_no', 'owner_name', 'rtc_number', 'mr_number', 'area_acres_guntas', 'taluk_office'],
          sample_raw: kaSample,
          sample_normalized: kaSample ? KarnatakaStateAdapter.normalize(kaSample, 'KAQMWVSBJHWXC7') : null,
        },
      ],
    });
  } catch (err) {
    next(err);
  }
});

export const adaptersRouter = router;
