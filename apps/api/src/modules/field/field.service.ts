import { query, getClient } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import { auditService } from '../audit/audit.service.js';

export interface FieldObservationInput {
  client_uuid: string;
  parcel_id: string;
  ulpin: string;
  notes: string;
  photo_reference?: string | null;
  gps_lat: number;
  gps_lng: number;
  observed_at: string;
  device_timestamp: string;
  parcel_version: number;
}

export class FieldService {
  async recordObservation(input: FieldObservationInput, officerId: string) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Check for duplicate client_uuid (idempotency for offline sync)
      const existing = await client.query('SELECT * FROM field_observations WHERE client_uuid = $1', [
        input.client_uuid,
      ]);
      if (existing.rows.length > 0) {
        await client.query('COMMIT');
        return { observation: existing.rows[0], status: 'ALREADY_SYNCED' };
      }

      // Check current parcel version for conflict detection
      const parcelRes = await client.query('SELECT version FROM parcels WHERE id = $1', [input.parcel_id]);
      let isConflict = false;
      let conflictDetails: any = null;

      if (parcelRes.rows.length > 0) {
        const currentVersion = parcelRes.rows[0].version;
        if (input.parcel_version < currentVersion) {
          isConflict = true;
          conflictDetails = {
            message: `Observation recorded against parcel v${input.parcel_version}, but server is at v${currentVersion}`,
            device_version: input.parcel_version,
            server_version: currentVersion,
          };
        }
      }

      // Insert observation
      const res = await client.query(
        `INSERT INTO field_observations (
          client_uuid, parcel_id, ulpin, field_officer_id, notes, photo_reference,
          gps_lat, gps_lng, observed_at, device_timestamp, server_timestamp,
          sync_status, parcel_version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11, $12)
        RETURNING *`,
        [
          input.client_uuid,
          input.parcel_id,
          input.ulpin,
          officerId,
          input.notes,
          input.photo_reference || null,
          input.gps_lat,
          input.gps_lng,
          input.observed_at,
          input.device_timestamp,
          isConflict ? 'CONFLICT_FLAGGED' : 'SYNCED',
          input.parcel_version,
        ]
      );

      // Log in sync_log
      await client.query(
        `INSERT INTO sync_log (client_uuid, user_id, operation_type, entity_type, entity_id, status, conflict_details)
         VALUES ($1, $2, 'FIELD_OBSERVATION_SYNC', 'PARCEL', $3, $4, $5)`,
        [
          input.client_uuid,
          officerId,
          input.parcel_id,
          isConflict ? 'CONFLICT' : 'SUCCESS',
          conflictDetails ? JSON.stringify(conflictDetails) : null,
        ]
      );

      // Log in audit log
      await auditService.logAction({
        entityType: 'FIELD_OBSERVATION',
        entityId: res.rows[0].id,
        action: 'FIELD_OBSERVATION_RECORDED',
        actorId: officerId,
        payload: {
          ulpin: input.ulpin,
          gps: { lat: input.gps_lat, lng: input.gps_lng },
          notes: input.notes,
          sync_status: isConflict ? 'CONFLICT_FLAGGED' : 'SYNCED',
        },
      });

      await client.query('COMMIT');
      return { observation: res.rows[0], status: isConflict ? 'CONFLICT_FLAGGED' : 'SYNCED', conflictDetails };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async syncBatch(observations: FieldObservationInput[], officerId: string) {
    const results = [];
    for (const obs of observations) {
      try {
        const res = await this.recordObservation(obs, officerId);
        results.push({ client_uuid: obs.client_uuid, status: res.status, id: res.observation.id });
      } catch (err: any) {
        results.push({ client_uuid: obs.client_uuid, status: 'ERROR', error: err.message });
      }
    }
    return results;
  }

  async listObservations(parcelId?: string) {
    const conditions = parcelId ? 'WHERE fo.parcel_id = $1' : '';
    const params = parcelId ? [parcelId] : [];

    const res = await query(
      `SELECT fo.*, p.legacy_survey_no, p.village, p.mandal
       FROM field_observations fo
       JOIN parcels p ON p.id = fo.parcel_id
       ${conditions}
       ORDER BY fo.observed_at DESC LIMIT 100`,
      params
    );
    return res.rows;
  }
}

export const fieldService = new FieldService();
