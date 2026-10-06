import { query } from '../../config/db.js';
import { validateUlpinFormat, assertValidUlpin } from './ulpin.validator.js';
import { AppError } from '../../middleware/errorHandler.js';
import { getCache, setCache } from '../../config/redis.js';

export class UlpinService {
  /**
   * Resolves a parcel by ULPIN with full unified digital intelligence and Redis caching
   */
  async resolveUlpin(ulpinInput: string) {
    const normalized = assertValidUlpin(ulpinInput);
    const cacheKey = `geodhara:ulpin:${normalized}`;

    // 1. Try Redis cache
    const cached = await getCache(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        parsed._from_cache = true;
        return parsed;
      } catch {
        // Fall through on corrupt cache
      }
    }

    // 2. Fetch Core Parcel Record
    const result = await query(
      `SELECT p.id, p.ulpin, p.state_id, p.state_code, p.legacy_survey_no, p.village, 
              p.mandal, p.district, p.area_sqm, p.version, p.created_at, p.updated_at,
              ST_AsGeoJSON(p.geom)::json AS geometry,
              ROUND(ST_Area(p.geom::geography)::numeric, 2) AS calculated_geodesic_area_sqm,
              s.name AS state_name
       FROM parcels p
       JOIN states s ON s.id = p.state_id
       WHERE p.ulpin = $1`,
      [normalized]
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'ULPIN_NOT_FOUND', `Parcel with ULPIN '${normalized}' does not exist`, {
        ulpin: normalized,
        isSyntheticDemo: true,
      });
    }

    const parcel = result.rows[0];
    const parcelId = parcel.id;

    // 3. Owners (Current and Historical)
    const ownersResult = await query(
      `SELECT id, person_name, person_identifier, ownership_percentage, ownership_type, valid_from, valid_to, is_current
       FROM parcel_owners
       WHERE parcel_id = $1
       ORDER BY is_current DESC, ownership_percentage DESC`,
      [parcelId]
    );

    // 4. Record of Rights (RoR)
    const rorResult = await query(
      `SELECT id, record_type, record_number, holder_info, area, source, record_date, status, document_reference
       FROM land_records
       WHERE parcel_id = $1
       ORDER BY record_date DESC`,
      [parcelId]
    );

    // 5. Deed Registrations
    const regResult = await query(
      `SELECT id, document_number, seller, buyer, seller_identifier, buyer_identifier, 
              registration_date, registered_area_sqm, consideration_amount, registration_type, status
       FROM registrations
       WHERE parcel_id = $1
       ORDER BY registration_date DESC`,
      [parcelId]
    );

    // 6. Encumbrances (Lien, Mortgage, Attachment)
    const encResult = await query(
      `SELECT id, type, description, authority, reference_number, status, start_date, end_date
       FROM encumbrances
       WHERE parcel_id = $1
       ORDER BY start_date DESC`,
      [parcelId]
    );

    // 7. Litigation Cases
    const litResult = await query(
      `SELECT id, case_number, court, case_type, status, opened_at, closed_at, description
       FROM litigation_cases
       WHERE parcel_id = $1
       ORDER BY opened_at DESC`,
      [parcelId]
    );

    // 8. Land Use Classifications
    const landUseResult = await query(
      `SELECT id, category, sub_category, source, effective_date, confidence
       FROM land_use
       WHERE parcel_id = $1
       ORDER BY effective_date DESC`,
      [parcelId]
    );

    // 9. Mutation Applications
    const mutationResult = await query(
      `SELECT ma.id, ma.application_number, ma.applicant, ma.status, ma.risk_score, 
              ma.risk_breakdown_json, ma.blocked_reason, ma.submitted_at,
              COALESCE(json_agg(me.* ORDER BY me.created_at ASC) FILTER (WHERE me.id IS NOT NULL), '[]') AS events
       FROM mutation_applications ma
       LEFT JOIN mutation_events me ON me.mutation_application_id = ma.id
       WHERE ma.parcel_id = $1
       GROUP BY ma.id
       ORDER BY ma.submitted_at DESC`,
      [parcelId]
    );

    // 10. Satellite Change Alerts
    const alertResult = await query(
      `SELECT id, ulpin, type, confidence, cloud_pct, before_date, after_date, status,
              detection_method, details_json, created_at, verified_by, verified_at,
              ST_AsGeoJSON(geometry)::json AS alert_geometry
       FROM change_alerts
       WHERE parcel_id = $1
       ORDER BY created_at DESC`,
      [parcelId]
    );

    // 11. Field Observations
    const fieldResult = await query(
      `SELECT id, field_officer_id, notes, photo_reference, gps_lat, gps_lng, observed_at, sync_status
       FROM field_observations
       WHERE parcel_id = $1
       ORDER BY observed_at DESC`,
      [parcelId]
    );

    // 12. Legacy Identifiers Mapping
    const legacyResult = await query(
      `SELECT id, state, legacy_system, legacy_survey_no, legacy_identifier, ulpin, confidence, status
       FROM legacy_id_map
       WHERE ulpin = $1
       ORDER BY created_at DESC`,
      [normalized]
    );

    // 13. Audit Summary for this parcel
    const auditResult = await query(
      `SELECT id, seq, prev_hash, hash, action, entity_type, entity_id, actor_id, created_at
       FROM audit_log
       WHERE (entity_type = 'PARCEL' AND entity_id = $1)
          OR (entity_type = 'ULPIN' AND entity_id = $2)
          OR (payload_json->>'ulpin' = $2)
       ORDER BY seq DESC
       LIMIT 10`,
      [parcelId, normalized]
    );

    // Risk Calculation
    const activeEncumbrances = encResult.rows.filter((e) => e.status === 'ACTIVE');
    const activeLitigation = litResult.rows.filter((l) => ['PENDING', 'STAY_GRANTED'].includes(l.status));
    const pendingAlerts = alertResult.rows.filter((a) => a.status === 'PENDING');

    const recordedArea = parseFloat(parcel.area_sqm);
    const geodesicArea = parseFloat(parcel.calculated_geodesic_area_sqm);
    const areaDiscrepancyPct = recordedArea > 0 ? Math.abs((recordedArea - geodesicArea) / recordedArea) * 100 : 0;

    let calculatedRiskScore = 0;
    const riskFactors: { factor: string; severity: 'LOW' | 'MEDIUM' | 'HIGH'; score: number; description: string }[] = [];

    if (activeLitigation.length > 0) {
      calculatedRiskScore += 45;
      riskFactors.push({
        factor: 'ACTIVE_LITIGATION',
        severity: 'HIGH',
        score: 45,
        description: `Parcel has ${activeLitigation.length} active litigation dispute(s) or court stay(s).`,
      });
    }

    if (activeEncumbrances.length > 0) {
      calculatedRiskScore += 30;
      riskFactors.push({
        factor: 'ACTIVE_ENCUMBRANCE',
        severity: 'HIGH',
        score: 30,
        description: `Parcel has active lien, mortgage, or financial attachment.`,
      });
    }

    if (pendingAlerts.length > 0) {
      calculatedRiskScore += 20;
      riskFactors.push({
        factor: 'SATELLITE_CHANGE_ALERT',
        severity: 'MEDIUM',
        score: 20,
        description: `Unverified satellite change detection detected.`,
      });
    }

    if (areaDiscrepancyPct > 5.0) {
      calculatedRiskScore += 15;
      riskFactors.push({
        factor: 'AREA_DISCREPANCY',
        severity: 'LOW',
        score: 15,
        description: `Area discrepancy between cadastral record (${recordedArea} sqm) and geodesic polygon (${geodesicArea} sqm) is ${areaDiscrepancyPct.toFixed(2)}%.`,
      });
    }

    calculatedRiskScore = Math.min(100, calculatedRiskScore);

    const response = {
      meta: {
        tagline: 'One parcel. One identity.',
        dossier_type: 'ULPIN_UNIFIED_DIGITAL_VIEW',
        is_synthetic_demo: true,
        notice: 'DEMO ENVIRONMENT - All data is synthetic. Government integrations are represented by mock adapters.',
      },
      ulpin: parcel.ulpin,
      is_demo_synthetic: true,
      parcel_id: parcel.id,
      state_code: parcel.state_code,
      state_name: parcel.state_name,
      location: {
        village: parcel.village,
        mandal: parcel.mandal,
        district: parcel.district,
        legacy_survey_no: parcel.legacy_survey_no,
        state: parcel.state_name,
      },
      spatial: {
        recorded_area_sqm: recordedArea,
        geodesic_area_sqm: geodesicArea,
        area_discrepancy_pct: parseFloat(areaDiscrepancyPct.toFixed(2)),
        geometry: parcel.geometry,
      },
      risk_assessment: {
        score: calculatedRiskScore,
        category: calculatedRiskScore >= 70 ? 'CRITICAL' : calculatedRiskScore >= 40 ? 'HIGH' : calculatedRiskScore >= 20 ? 'MEDIUM' : 'LOW',
        factors: riskFactors,
      },
      current_owners: ownersResult.rows.filter((o) => o.is_current),
      historical_owners: ownersResult.rows.filter((o) => !o.is_current),
      land_records: rorResult.rows,
      registrations: regResult.rows,
      encumbrances: encResult.rows,
      litigation: litResult.rows,
      land_use: landUseResult.rows,
      mutation_applications: mutationResult.rows,
      satellite_change_alerts: alertResult.rows,
      field_observations: fieldResult.rows,
      legacy_mappings: legacyResult.rows,
      audit_summary: auditResult.rows,
      summary: {
        active_encumbrances: activeEncumbrances.length,
        active_litigations: activeLitigation.length,
        pending_alerts: pendingAlerts.length,
        version: parcel.version,
      },
    };

    // Cache in Redis for 5 minutes (300 seconds)
    await setCache(cacheKey, JSON.stringify(response), 300);

    return response;
  }

  /**
   * Validates syntax and verifies whether ULPIN exists in database
   */
  async checkUlpinStatus(ulpinInput: string) {
    const format = validateUlpinFormat(ulpinInput);
    if (!format.isValid) {
      return {
        ulpin: ulpinInput,
        format_valid: false,
        exists_in_database: false,
        errors: format.errors,
      };
    }

    const res = await query('SELECT id, version FROM parcels WHERE ulpin = $1', [format.normalizedUlpin]);
    const exists = res.rows.length > 0;

    return {
      ulpin: format.normalizedUlpin,
      format_valid: true,
      exists_in_database: exists,
      parcel_id: exists ? res.rows[0].id : null,
      version: exists ? res.rows[0].version : null,
      notice: 'DEMO ULPIN validated successfully',
    };
  }
}

export const ulpinService = new UlpinService();
