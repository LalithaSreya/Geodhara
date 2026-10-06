import { query } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import { auditService } from '../audit/audit.service.js';

export class ChangeAlertsService {
  async getAlerts(options: { status?: string; type?: string; limit?: number; offset?: number }) {
    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (options.status) {
      conditions.push(`ca.status = $${pIdx++}`);
      params.push(options.status.toUpperCase());
    }
    if (options.type) {
      conditions.push(`ca.type = $${pIdx++}`);
      params.push(options.type.toUpperCase());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const sql = `
      SELECT 
        ca.id, ca.parcel_id, ca.ulpin, ca.type, ca.confidence, ca.cloud_pct,
        ca.before_date, ca.after_date, ca.status, ca.detection_method,
        ca.details_json, ca.created_at, ca.verified_by, ca.verified_at,
        ST_AsGeoJSON(ca.geometry)::json AS geometry,
        p.village, p.mandal, p.district, p.legacy_survey_no, p.area_sqm
      FROM change_alerts ca
      JOIN parcels p ON p.id = ca.parcel_id
      ${whereClause}
      ORDER BY ca.created_at DESC
      LIMIT $${pIdx++} OFFSET $${pIdx++}
    `;

    params.push(limit, offset);
    const result = await query(sql, params);

    return result.rows.map((row) => ({
      ...row,
      is_demo_synthetic: true,
    }));
  }

  async getAlertById(alertId: string) {
    const sql = `
      SELECT 
        ca.id, ca.parcel_id, ca.ulpin, ca.type, ca.confidence, ca.cloud_pct,
        ca.before_date, ca.after_date, ca.status, ca.detection_method,
        ca.details_json, ca.created_at, ca.verified_by, ca.verified_at,
        ST_AsGeoJSON(ca.geometry)::json AS geometry,
        ROUND(ST_Area(ca.geometry::geography)::numeric, 2) AS affected_area_sqm,
        p.village, p.mandal, p.district, p.legacy_survey_no, p.area_sqm, p.state_code,
        ST_AsGeoJSON(p.geom)::json AS parcel_geometry
      FROM change_alerts ca
      JOIN parcels p ON p.id = ca.parcel_id
      WHERE ca.id = $1
    `;

    const res = await query(sql, [alertId]);
    if (res.rows.length === 0) {
      throw new AppError(404, 'ALERT_NOT_FOUND', `Satellite change alert '${alertId}' not found`);
    }

    const alert = res.rows[0];

    // Fetch audit history for this alert
    const auditRes = await query(
      `SELECT * FROM audit_log 
       WHERE entity_type = 'CHANGE_ALERT' AND entity_id = $1 
       ORDER BY seq DESC LIMIT 10`,
      [alertId]
    );

    // Fetch parcel current verified owners
    const ownersRes = await query(
      `SELECT person_name, person_identifier, ownership_percentage, ownership_type 
       FROM parcel_owners 
       WHERE parcel_id = $1 AND is_current = TRUE`,
      [alert.parcel_id]
    );

    return {
      ...alert,
      owners: ownersRes.rows,
      audit_events: auditRes.rows,
      is_demo_synthetic: true,
    };
  }

  async verifyAlert(params: {
    alertId: string;
    action: 'VERIFY' | 'DISMISS';
    actorId: string;
    notes?: string;
  }) {
    const targetStatus = params.action === 'VERIFY' ? 'VERIFIED' : 'DISMISSED';

    const existingRes = await query('SELECT * FROM change_alerts WHERE id = $1', [params.alertId]);
    if (existingRes.rows.length === 0) {
      throw new AppError(404, 'ALERT_NOT_FOUND', 'Satellite change alert not found');
    }

    const alert = existingRes.rows[0];

    const updated = await query(
      `UPDATE change_alerts 
       SET status = $1, verified_by = $2, verified_at = NOW(),
           details_json = jsonb_set(COALESCE(details_json, '{}'::jsonb), '{verification_notes}', to_jsonb($3::text))
       WHERE id = $4
       RETURNING *`,
      [targetStatus, params.actorId, params.notes || 'Status updated by officer', params.alertId]
    );

    // Audit log
    await auditService.logAction({
      entityType: 'CHANGE_ALERT',
      entityId: alert.id,
      action: `ALERT_${targetStatus}`,
      actorId: params.actorId,
      payload: {
        alert_id: alert.id,
        ulpin: alert.ulpin,
        action: params.action,
        notes: params.notes,
      },
    });

    return updated.rows[0];
  }
}

export const changeAlertsService = new ChangeAlertsService();
