import { query, getClient } from '../../config/db.js';
import { assertValidUlpin } from '../ulpin/ulpin.validator.js';
import { AppError } from '../../middleware/errorHandler.js';
import { auditService } from '../audit/audit.service.js';
import { getCache, setCache, deleteCache } from '../../config/redis.js';
import { riskEngine } from '../risk/risk.engine.js';

export interface SearchParcelsParams {
  q?: string;
  ulpin?: string;
  legacy_survey_no?: string;
  owner_name?: string;
  district?: string;
  village?: string;
  state?: string;
  registration_number?: string;
  limit?: number;
  offset?: number;
}

export class ParcelsService {
  /**
   * Helper to invalidate Redis cache for a parcel
   */
  async invalidateParcelCache(ulpin: string) {
    try {
      await deleteCache(`geodhara:ulpin:${ulpin}`);
      await deleteCache(`geodhara:parcel360:${ulpin}`);
      await deleteCache(`geodhara:geojson:all`);
      await deleteCache(`geodhara:geojson:TS`);
      await deleteCache(`geodhara:geojson:KA`);
    } catch {
      // Ignore cache errors
    }
  }

  /**
   * Cross-State Multi-Param Search
   */
  async searchParcels(params: SearchParcelsParams) {
    const limit = Math.min(params.limit || 50, 200);
    const offset = params.offset || 0;
    const conditions: string[] = [];
    const sqlParams: any[] = [];
    let pIdx = 1;

    if (params.ulpin) {
      conditions.push(`p.ulpin ILIKE $${pIdx++}`);
      sqlParams.push(`%${params.ulpin.trim()}%`);
    }

    if (params.legacy_survey_no) {
      conditions.push(`(p.legacy_survey_no ILIKE $${pIdx} OR EXISTS (SELECT 1 FROM legacy_id_map m WHERE m.ulpin = p.ulpin AND (m.legacy_survey_no ILIKE $${pIdx} OR m.legacy_identifier ILIKE $${pIdx})))`);
      sqlParams.push(`%${params.legacy_survey_no.trim()}%`);
      pIdx++;
    }

    if (params.owner_name) {
      conditions.push(`EXISTS (SELECT 1 FROM parcel_owners po WHERE po.parcel_id = p.id AND po.person_name ILIKE $${pIdx})`);
      sqlParams.push(`%${params.owner_name.trim()}%`);
      pIdx++;
    }

    if (params.district) {
      conditions.push(`p.district ILIKE $${pIdx++}`);
      sqlParams.push(`%${params.district.trim()}%`);
    }

    if (params.village) {
      conditions.push(`p.village ILIKE $${pIdx++}`);
      sqlParams.push(`%${params.village.trim()}%`);
    }

    if (params.state) {
      conditions.push(`(p.state_code ILIKE $${pIdx} OR s.name ILIKE $${pIdx})`);
      sqlParams.push(`%${params.state.trim()}%`);
      pIdx++;
    }

    if (params.registration_number) {
      conditions.push(`EXISTS (SELECT 1 FROM registrations r WHERE r.parcel_id = p.id AND r.document_number ILIKE $${pIdx})`);
      sqlParams.push(`%${params.registration_number.trim()}%`);
      pIdx++;
    }

    // Generic search across all dimensions
    if (params.q) {
      const q = `%${params.q.trim()}%`;
      conditions.push(`(
        p.ulpin ILIKE $${pIdx}
        OR p.legacy_survey_no ILIKE $${pIdx}
        OR p.village ILIKE $${pIdx}
        OR p.mandal ILIKE $${pIdx}
        OR p.district ILIKE $${pIdx}
        OR s.name ILIKE $${pIdx}
        OR EXISTS (SELECT 1 FROM parcel_owners po WHERE po.parcel_id = p.id AND po.person_name ILIKE $${pIdx})
        OR EXISTS (SELECT 1 FROM registrations r WHERE r.parcel_id = p.id AND r.document_number ILIKE $${pIdx})
        OR EXISTS (SELECT 1 FROM legacy_id_map m WHERE m.ulpin = p.ulpin AND (m.legacy_identifier ILIKE $${pIdx} OR m.legacy_survey_no ILIKE $${pIdx}))
      )`);
      sqlParams.push(q);
      pIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM parcels p
      JOIN states s ON s.id = p.state_id
      ${whereClause}
    `;

    const dataSql = `
      SELECT 
        p.id,
        p.ulpin,
        p.state_code,
        s.name AS state_name,
        p.legacy_survey_no,
        p.village,
        p.mandal,
        p.district,
        p.area_sqm,
        ROUND(ST_Area(p.geom::geography)::numeric, 2) AS calculated_area_sqm,
        p.version,
        p.created_at,
        ST_AsGeoJSON(p.geom)::json AS geometry,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'name', po.person_name,
            'percentage', po.ownership_percentage,
            'is_current', po.is_current
          )) FROM parcel_owners po WHERE po.parcel_id = p.id AND po.is_current = TRUE),
          '[]'::json
        ) AS current_owners,
        (SELECT COUNT(*)::int FROM encumbrances e WHERE e.parcel_id = p.id AND e.status = 'ACTIVE') AS active_encumbrance_count,
        (SELECT COUNT(*)::int FROM litigation_cases l WHERE l.parcel_id = p.id AND l.status IN ('PENDING', 'STAY_GRANTED')) AS active_litigation_count,
        (SELECT COUNT(*)::int FROM change_alerts ca WHERE ca.parcel_id = p.id AND ca.status = 'PENDING') AS pending_alert_count,
        (SELECT lu.category FROM land_use lu WHERE lu.parcel_id = p.id ORDER BY lu.created_at DESC LIMIT 1) AS primary_land_use,
        (SELECT m.legacy_identifier FROM legacy_id_map m WHERE m.ulpin = p.ulpin LIMIT 1) AS legacy_identifier
      FROM parcels p
      JOIN states s ON s.id = p.state_id
      ${whereClause}
      ORDER BY p.ulpin ASC
      LIMIT $${pIdx++} OFFSET $${pIdx++}
    `;

    sqlParams.push(limit, offset);

    const [countRes, dataRes] = await Promise.all([
      query(countSql, sqlParams.slice(0, pIdx - 3)),
      query(dataSql, sqlParams),
    ]);

    const results = dataRes.rows.map((row) => {
      let riskLevel: 'CLEAN' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'CLEAN';
      if (row.active_litigation_count > 0 || row.active_encumbrance_count > 0) {
        riskLevel = 'HIGH';
      } else if (row.pending_alert_count > 0) {
        riskLevel = 'MEDIUM';
      }

      return {
        id: row.id,
        ulpin: row.ulpin,
        state_code: row.state_code,
        state_name: row.state_name,
        legacy_survey_no: row.legacy_survey_no,
        legacy_identifier: row.legacy_identifier,
        village: row.village,
        mandal: row.mandal,
        district: row.district,
        recorded_area_sqm: parseFloat(row.area_sqm),
        calculated_geodesic_area_sqm: parseFloat(row.calculated_area_sqm),
        version: row.version,
        current_owners: row.current_owners,
        active_encumbrances: row.active_encumbrance_count,
        active_litigations: row.active_litigation_count,
        pending_alerts: row.pending_alert_count,
        land_use: row.primary_land_use || 'AGRICULTURAL',
        risk_level: riskLevel,
        geometry: row.geometry,
      };
    });

    return {
      total: countRes.rows[0]?.total || 0,
      limit,
      offset,
      cross_state_search: true,
      states_searched: ['Telangana (TS)', 'Karnataka (KA)'],
      results,
    };
  }

  /**
   * Retrieves parcels as GeoJSON FeatureCollection for GIS visualization with caching
   */
  async getParcelsGeoJson(options: {
    bbox?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
    stateCode?: string;
    landUse?: string;
    riskLevel?: string;
    hasAlerts?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const limit = Math.min(options.limit || 200, 500);
    const offset = options.offset || 0;
    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (options.bbox) {
      const [minLng, minLat, maxLng, maxLat] = options.bbox;
      conditions.push(
        `p.geom && ST_MakeEnvelope($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, 4326)`
      );
      params.push(minLng, minLat, maxLng, maxLat);
    }

    if (options.stateCode) {
      conditions.push(`p.state_code = $${pIdx++}`);
      params.push(options.stateCode.toUpperCase());
    }

    if (options.landUse) {
      conditions.push(`EXISTS (SELECT 1 FROM land_use lu WHERE lu.parcel_id = p.id AND lu.category ILIKE $${pIdx})`);
      sqlParamsPush(params, `%${options.landUse}%`);
      pIdx++;
    }

    if (options.hasAlerts) {
      conditions.push(`EXISTS (SELECT 1 FROM change_alerts ca WHERE ca.parcel_id = p.id AND ca.status = 'PENDING')`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        p.id,
        p.ulpin,
        p.state_code,
        s.name AS state_name,
        p.legacy_survey_no,
        p.village,
        p.mandal,
        p.district,
        p.area_sqm,
        ROUND(ST_Area(p.geom::geography)::numeric, 2) AS calculated_area_sqm,
        p.version,
        p.created_at,
        p.updated_at,
        ST_AsGeoJSON(p.geom)::json AS geometry,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'person_name', po.person_name,
            'percentage', po.ownership_percentage,
            'type', po.ownership_type
          )) FROM parcel_owners po WHERE po.parcel_id = p.id AND po.is_current = TRUE),
          '[]'::json
        ) AS current_owners,
        (SELECT COUNT(*)::int FROM encumbrances e WHERE e.parcel_id = p.id AND e.status = 'ACTIVE') AS active_encumbrance_count,
        (SELECT COUNT(*)::int FROM litigation_cases l WHERE l.parcel_id = p.id AND l.status IN ('PENDING', 'STAY_GRANTED')) AS active_litigation_count,
        (SELECT COUNT(*)::int FROM change_alerts ca WHERE ca.parcel_id = p.id AND ca.status = 'PENDING') AS pending_alert_count,
        (SELECT lu.category FROM land_use lu WHERE lu.parcel_id = p.id ORDER BY lu.created_at DESC LIMIT 1) AS primary_land_use,
        (SELECT m.legacy_identifier FROM legacy_id_map m WHERE m.ulpin = p.ulpin LIMIT 1) AS legacy_identifier
      FROM parcels p
      JOIN states s ON s.id = p.state_id
      ${whereClause}
      ORDER BY p.ulpin ASC
      LIMIT $${pIdx++} OFFSET $${pIdx++}
    `;

    params.push(limit, offset);
    const result = await query(sql, params);

    const features = result.rows.map((row) => {
      let riskLevel: 'CLEAN' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'CLEAN';
      if (row.active_litigation_count > 0 || row.active_encumbrance_count > 0) {
        riskLevel = 'HIGH';
      } else if (row.pending_alert_count > 0) {
        riskLevel = 'MEDIUM';
      }

      return {
        type: 'Feature' as const,
        id: row.id,
        geometry: row.geometry,
        properties: {
          id: row.id,
          ulpin: row.ulpin,
          state_code: row.state_code,
          state_name: row.state_name,
          legacy_survey_no: row.legacy_survey_no,
          legacy_identifier: row.legacy_identifier,
          village: row.village,
          mandal: row.mandal,
          district: row.district,
          recorded_area_sqm: parseFloat(row.area_sqm),
          calculated_geodesic_area_sqm: parseFloat(row.calculated_area_sqm),
          version: row.version,
          current_owners: row.current_owners,
          active_encumbrances: row.active_encumbrance_count,
          active_litigations: row.active_litigation_count,
          pending_alerts: row.pending_alert_count,
          land_use: row.primary_land_use || 'AGRICULTURAL',
          risk_level: riskLevel,
          is_synthetic_demo: true,
        },
      };
    });

    return {
      type: 'FeatureCollection' as const,
      total: result.rows.length,
      limit,
      offset,
      features,
    };
  }

  /**
   * Spatial Query: Point-in-parcel
   */
  async getPointInParcel(lat: number, lng: number) {
    const sql = `
      SELECT p.id, p.ulpin, p.state_code, s.name AS state_name, p.legacy_survey_no,
             p.village, p.mandal, p.district, p.area_sqm,
             ROUND(ST_Area(p.geom::geography)::numeric, 2) AS calculated_area_sqm,
             ST_AsGeoJSON(p.geom)::json AS geometry
      FROM parcels p
      JOIN states s ON s.id = p.state_id
      WHERE ST_Contains(p.geom, ST_SetSRID(ST_MakePoint($1, $2), 4326))
      LIMIT 1
    `;

    const res = await query(sql, [lng, lat]);
    if (res.rows.length === 0) {
      return null;
    }
    return res.rows[0];
  }

  /**
   * Spatial Query: Nearby parcels within radius (meters) using ST_DWithin on geography
   */
  async getNearbyParcels(lat: number, lng: number, radiusMeters: number = 1000) {
    const sql = `
      SELECT p.id, p.ulpin, p.state_code, s.name AS state_name, p.legacy_survey_no,
             p.village, p.mandal, p.district, p.area_sqm,
             ROUND(ST_Distance(p.geom::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography)::numeric, 2) AS distance_meters,
             ROUND(ST_Area(p.geom::geography)::numeric, 2) AS calculated_area_sqm,
             ST_AsGeoJSON(p.geom)::json AS geometry
      FROM parcels p
      JOIN states s ON s.id = p.state_id
      WHERE ST_DWithin(p.geom::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
      ORDER BY distance_meters ASC
      LIMIT 20
    `;

    const res = await query(sql, [lng, lat, radiusMeters]);
    return res.rows;
  }

  /**
   * Spatial Query: Neighbouring parcels touching or adjacent to a parcel
   */
  async getNeighbouringParcels(ulpinInput: string) {
    const ulpin = assertValidUlpin(ulpinInput);

    const targetRes = await query('SELECT id, geom FROM parcels WHERE ulpin = $1', [ulpin]);
    if (targetRes.rows.length === 0) {
      throw new AppError(404, 'PARCEL_NOT_FOUND', `Parcel with ULPIN '${ulpin}' not found`);
    }

    const targetId = targetRes.rows[0].id;

    const sql = `
      SELECT p.id, p.ulpin, p.state_code, s.name AS state_name, p.legacy_survey_no,
             p.village, p.mandal, p.district, p.area_sqm,
             ROUND(ST_Area(p.geom::geography)::numeric, 2) AS calculated_area_sqm,
             ST_Touches(p.geom, target.geom) AS is_touching_boundary,
             ST_AsGeoJSON(p.geom)::json AS geometry
      FROM parcels p
      CROSS JOIN (SELECT geom FROM parcels WHERE id = $1) AS target
      JOIN states s ON s.id = p.state_id
      WHERE p.id != $1
        AND (ST_Touches(p.geom, target.geom) OR ST_DWithin(p.geom::geography, target.geom::geography, 1500))
      ORDER BY p.legacy_survey_no ASC
      LIMIT 15
    `;

    const res = await query(sql, [targetId]);
    return {
      target_ulpin: ulpin,
      neighbour_count: res.rows.length,
      neighbours: res.rows,
    };
  }

  /**
   * State boundaries GeoJSON FeatureCollection
   */
  async getStateBoundariesGeoJson() {
    const sql = `
      SELECT id, code, name, ST_AsGeoJSON(boundary_geom)::json AS geometry,
             ROUND((ST_Area(boundary_geom::geography) / 1000000)::numeric, 2) AS area_sq_km
      FROM states
      ORDER BY code ASC
    `;

    const res = await query(sql);
    const features = res.rows.map((row) => ({
      type: 'Feature' as const,
      id: row.id,
      geometry: row.geometry,
      properties: {
        code: row.code,
        name: row.name,
        area_sq_km: parseFloat(row.area_sq_km),
        is_synthetic_demo: true,
      },
    }));

    return {
      type: 'FeatureCollection' as const,
      features,
    };
  }

  /**
   * Complete 360° Parcel Inspector: Unified digital dossier
   */
  async getParcel360(ulpinInput: string) {
    const ulpin = assertValidUlpin(ulpinInput);

    // 1. Parcel Core Info
    const parcelRes = await query(
      `SELECT p.id, p.ulpin, p.state_id, p.state_code, p.legacy_survey_no, p.village, 
              p.mandal, p.district, p.area_sqm, p.version, p.created_at, p.updated_at,
              s.name AS state_name,
              ST_AsGeoJSON(p.geom)::json AS geometry,
              ROUND(ST_Area(p.geom::geography)::numeric, 2) AS calculated_geodesic_area_sqm
       FROM parcels p
       JOIN states s ON s.id = p.state_id
       WHERE p.ulpin = $1`,
      [ulpin]
    );

    if (parcelRes.rows.length === 0) {
      throw new AppError(404, 'PARCEL_NOT_FOUND', `Parcel with ULPIN '${ulpin}' not found`);
    }

    const parcel = parcelRes.rows[0];
    const parcelId = parcel.id;

    // 2. Owners (Current and Historical)
    const ownersRes = await query(
      `SELECT * FROM parcel_owners 
       WHERE parcel_id = $1 
       ORDER BY is_current DESC, ownership_percentage DESC`,
      [parcelId]
    );

    // 3. Record of Rights (RoR / Land Records)
    const recordsRes = await query(
      `SELECT * FROM land_records 
       WHERE parcel_id = $1 
       ORDER BY record_date DESC`,
      [parcelId]
    );

    // 4. Deed Registrations
    const regRes = await query(
      `SELECT * FROM registrations 
       WHERE parcel_id = $1 
       ORDER BY registration_date DESC`,
      [parcelId]
    );

    // 5. Encumbrances
    const encRes = await query(
      `SELECT * FROM encumbrances 
       WHERE parcel_id = $1 
       ORDER BY start_date DESC`,
      [parcelId]
    );

    // 6. Litigation Cases
    const litRes = await query(
      `SELECT * FROM litigation_cases 
       WHERE parcel_id = $1 
       ORDER BY opened_at DESC`,
      [parcelId]
    );

    // 7. Land Use Classifications
    const landUseRes = await query(
      `SELECT * FROM land_use 
       WHERE parcel_id = $1 
       ORDER BY effective_date DESC`,
      [parcelId]
    );

    // 8. Mutation Applications & Events
    const mutationRes = await query(
      `SELECT ma.*, 
              COALESCE(json_agg(me.* ORDER BY me.created_at ASC) FILTER (WHERE me.id IS NOT NULL), '[]') AS events
       FROM mutation_applications ma
       LEFT JOIN mutation_events me ON me.mutation_application_id = ma.id
       WHERE ma.parcel_id = $1
       GROUP BY ma.id
       ORDER BY ma.submitted_at DESC`,
      [parcelId]
    );

    // 9. Change Alerts (Satellite detections)
    const alertRes = await query(
      `SELECT id, parcel_id, ulpin, type, confidence, cloud_pct, before_date, after_date,
              status, detection_method, details_json, created_at, verified_by, verified_at,
              ST_AsGeoJSON(geometry)::json AS alert_geometry
       FROM change_alerts
       WHERE parcel_id = $1
       ORDER BY created_at DESC`,
      [parcelId]
    );

    // 10. Field Observations
    const fieldRes = await query(
      `SELECT * FROM field_observations 
       WHERE parcel_id = $1 
       ORDER BY observed_at DESC`,
      [parcelId]
    );

    // 11. Legacy ID Mapping
    const legacyRes = await query(
      `SELECT * FROM legacy_id_map 
       WHERE ulpin = $1 
       ORDER BY created_at DESC`,
      [ulpin]
    );

    // 12. Version History Snapshot
    const versionsRes = await query(
      `SELECT * FROM parcel_versions 
       WHERE parcel_id = $1 
       ORDER BY version DESC`,
      [parcelId]
    );

    // 13. Audit Log Chain
    const auditRes = await query(
      `SELECT * FROM audit_log 
       WHERE (entity_type = 'PARCEL' AND entity_id = $1)
          OR (entity_type = 'ULPIN' AND entity_id = $2)
          OR (payload_json->>'ulpin' = $2)
       ORDER BY seq DESC LIMIT 20`,
      [parcelId, ulpin]
    );

    // 14. Calculate Explainable 12-Rule Risk Breakdown via Risk Engine
    const riskEvaluation = await riskEngine.evaluateParcelRisk(parcelId);

    const recordedArea = parseFloat(parcel.area_sqm);
    const geodesicArea = parseFloat(parcel.calculated_geodesic_area_sqm);
    const areaDiscrepancyPct = recordedArea > 0 ? Math.abs((recordedArea - geodesicArea) / recordedArea) * 100 : 0;

    return {
      meta: {
        tagline: 'One parcel. One identity.',
        dossier_type: 'ULPIN_UNIFIED_DIGITAL_VIEW',
        is_synthetic_demo: true,
        notice: 'DEMO ENVIRONMENT - All data is synthetic. Government integrations are represented by mock adapters.',
      },
      parcel: {
        id: parcel.id,
        ulpin: parcel.ulpin,
        state_id: parcel.state_id,
        state_code: parcel.state_code,
        state_name: parcel.state_name,
        legacy_survey_no: parcel.legacy_survey_no,
        village: parcel.village,
        mandal: parcel.mandal,
        district: parcel.district,
        recorded_area_sqm: recordedArea,
        geodesic_area_sqm: geodesicArea,
        area_discrepancy_pct: parseFloat(areaDiscrepancyPct.toFixed(2)),
        version: parcel.version,
        geometry: parcel.geometry,
        created_at: parcel.created_at,
        updated_at: parcel.updated_at,
      },
      risk_assessment: {
        score: riskEvaluation.score,
        category: riskEvaluation.level,
        level: riskEvaluation.level,
        factors: riskEvaluation.breakdown.map((b) => ({
          factor: b.rule,
          severity: b.severity,
          score: b.points,
          description: b.reason,
          evidence: b.evidence,
        })),
        breakdown: riskEvaluation.breakdown,
        evaluated_at: riskEvaluation.evaluatedAt,
        thresholds: riskEvaluation.thresholds,
      },
      ownership: {
        current_owners: ownersRes.rows.filter((o) => o.is_current),
        past_owners: ownersRes.rows.filter((o) => !o.is_current),
        total_percentage: ownersRes.rows
          .filter((o) => o.is_current)
          .reduce((sum, o) => sum + parseFloat(o.ownership_percentage), 0),
      },
      land_records: recordsRes.rows,
      registrations: regRes.rows,
      encumbrances: encRes.rows,
      litigation: litRes.rows,
      land_use: landUseRes.rows,
      mutation_applications: mutationRes.rows,
      satellite_change_alerts: alertRes.rows,
      field_observations: fieldRes.rows,
      legacy_mappings: legacyRes.rows,
      version_history: versionsRes.rows,
      audit_ledger: auditRes.rows,
    };
  }

  /**
   * Explainable 12-rule Risk Evaluation for single parcel
   */
  async getParcelRisk(ulpinInput: string) {
    const ulpin = assertValidUlpin(ulpinInput);
    const pRes = await query(`SELECT id FROM parcels WHERE ulpin = $1`, [ulpin]);
    if (pRes.rows.length === 0) {
      throw new AppError(404, 'PARCEL_NOT_FOUND', `Parcel with ULPIN '${ulpin}' not found`);
    }
    return riskEngine.evaluateParcelRisk(pRes.rows[0].id);
  }

  /**
   * Update parcel attributes with optimistic concurrency and snapshot logging
   */
  async updateParcel(
    ulpinInput: string,
    updates: {
      legacy_survey_no?: string;
      village?: string;
      mandal?: string;
      district?: string;
      expectedVersion: number;
      changeReason: string;
      actorId: string;
    }
  ) {
    const ulpin = assertValidUlpin(ulpinInput);
    const client = await getClient();

    try {
      await client.query('BEGIN');

      const existingRes = await client.query('SELECT * FROM parcels WHERE ulpin = $1 FOR UPDATE', [ulpin]);
      if (existingRes.rows.length === 0) {
        throw new AppError(404, 'PARCEL_NOT_FOUND', `Parcel '${ulpin}' not found`);
      }

      const existing = existingRes.rows[0];

      if (existing.version !== updates.expectedVersion) {
        throw new AppError(
          409,
          'CONCURRENCY_CONFLICT',
          `Parcel version mismatch. Current version is ${existing.version}, but client submitted version ${updates.expectedVersion}. Please refresh.`
        );
      }

      const newVersion = existing.version + 1;

      // 1. Save version snapshot
      await client.query(
        `INSERT INTO parcel_versions (parcel_id, version, snapshot_json, changed_by, change_reason)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          existing.id,
          existing.version,
          JSON.stringify(existing),
          updates.actorId,
          updates.changeReason,
        ]
      );

      // 2. Apply updates
      const updatedRes = await client.query(
        `UPDATE parcels 
         SET legacy_survey_no = COALESCE($1, legacy_survey_no),
             village = COALESCE($2, village),
             mandal = COALESCE($3, mandal),
             district = COALESCE($4, district),
             version = $5,
             updated_at = NOW()
         WHERE id = $6
         RETURNING *`,
        [
          updates.legacy_survey_no || null,
          updates.village || null,
          updates.mandal || null,
          updates.district || null,
          newVersion,
          existing.id,
        ]
      );

      // 3. Append to immutable audit log
      await auditService.logAction({
        entityType: 'PARCEL',
        entityId: existing.id,
        action: 'PARCEL_UPDATED',
        actorId: updates.actorId,
        payload: {
          ulpin,
          from_version: existing.version,
          to_version: newVersion,
          reason: updates.changeReason,
          changes: updates,
        },
      });

      await client.query('COMMIT');

      // 4. Invalidate cache
      await this.invalidateParcelCache(ulpin);

      return updatedRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

function sqlParamsPush(params: any[], val: any) {
  params.push(val);
}

export const parcelsService = new ParcelsService();
