import { query } from '../../config/db.js';

export type RiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskRuleResult {
  rule: string;
  points: number;
  reason: string;
  evidence: Record<string, any>;
  severity: RiskSeverity;
}

export interface RiskEvaluationResult {
  parcelId?: string;
  ulpin?: string;
  score: number;
  level: RiskLevel;
  breakdown: RiskRuleResult[];
  evaluatedAt: string;
  isCapped: boolean;
  rawScore: number;
  thresholds: {
    lowMax: number;
    mediumMax: number;
    highMax: number;
  };
  metadata?: {
    parcelId?: string;
    ulpin?: string;
    version?: number;
    isAuditable?: boolean;
    [key: string]: any;
  };
}

export interface RiskEngineConfig {
  thresholds: {
    lowMax: number; // default 24
    mediumMax: number; // default 49
    highMax: number; // default 74
  };
  weights: {
    courtStay: number; // default 35
    mortgage: number; // default 30
    activeEncumbrance: number; // default 30
    closedEncumbrance: number; // default 10
    stayGrantedLitigation: number; // default 40
    pendingLitigation: number; // default 25
    closedLitigation: number; // default 5
    churnThresholdDays: number; // default 180
    churnMinCount: number; // default 2
    churnPoints: number; // default 25
    areaMismatchPctThreshold: number; // default 2.0 (%)
    areaMismatchPoints: number; // default 20
    areaMismatchHighPctThreshold: number; // default 10.0 (%)
    areaMismatchHighPoints: number; // default 35
    legacyAmbiguityPoints: number; // default 15
    openChangeAlertPoints: number; // default 20
    recentTransferDays: number; // default 30
    recentTransferPoints: number; // default 15
    multipleOwnersMinCount: number; // default 2
    multipleOwnersPoints: number; // default 15
    duplicateRegDays: number; // default 30
    duplicateRegPoints: number; // default 30
    sellerMismatchPoints: number; // default 40
    mutationAnomalyPoints: number; // default 15
    geometryInconsistencyPoints: number; // default 30
  };
}

export const DEFAULT_RISK_CONFIG: RiskEngineConfig = {
  thresholds: {
    lowMax: 24,
    mediumMax: 49,
    highMax: 74,
  },
  weights: {
    courtStay: 35,
    mortgage: 30,
    activeEncumbrance: 30,
    closedEncumbrance: 10,
    stayGrantedLitigation: 40,
    pendingLitigation: 25,
    closedLitigation: 5,
    churnThresholdDays: 180,
    churnMinCount: 2,
    churnPoints: 25,
    areaMismatchPctThreshold: 2.0,
    areaMismatchPoints: 20,
    areaMismatchHighPctThreshold: 10.0,
    areaMismatchHighPoints: 35,
    legacyAmbiguityPoints: 15,
    openChangeAlertPoints: 20,
    recentTransferDays: 30,
    recentTransferPoints: 15,
    multipleOwnersMinCount: 2,
    multipleOwnersPoints: 15,
    duplicateRegDays: 30,
    duplicateRegPoints: 30,
    sellerMismatchPoints: 40,
    mutationAnomalyPoints: 15,
    geometryInconsistencyPoints: 30,
  },
};

export class ExplainableRiskEngine {
  private defaultConfig: RiskEngineConfig;

  constructor(defaultConfig: Partial<RiskEngineConfig> = {}) {
    this.defaultConfig = {
      thresholds: { ...DEFAULT_RISK_CONFIG.thresholds, ...defaultConfig.thresholds },
      weights: { ...DEFAULT_RISK_CONFIG.weights, ...defaultConfig.weights },
    };
  }

  /**
   * Determine categorical level from numerical score
   */
  classifyScore(score: number, thresholds = this.defaultConfig.thresholds): RiskLevel {
    return this.getRiskLevel(score, thresholds);
  }

  getRiskLevel(score: number, thresholds = this.defaultConfig.thresholds): RiskLevel {
    if (score <= thresholds.lowMax) return 'LOW';
    if (score <= thresholds.mediumMax) return 'MEDIUM';
    if (score <= thresholds.highMax) return 'HIGH';
    return 'CRITICAL';
  }

  /**
   * Comprehensive 12-rule explainable risk calculation for a parcel
   */
  async evaluateParcelRisk(
    parcelId: string,
    options?: {
      registrationId?: string | null;
      sellerName?: string | null;
      config?: any;
    }
  ): Promise<RiskEvaluationResult> {
    const rawOverrides = options?.config?.weights || options?.config || {};
    const config: RiskEngineConfig = {
      thresholds: { ...this.defaultConfig.thresholds, ...(options?.config?.thresholds || {}) },
      weights: {
        ...this.defaultConfig.weights,
        ...(options?.config?.weights || {}),
        ...(rawOverrides.activeEncumbrancePoints ? { mortgage: rawOverrides.activeEncumbrancePoints, activeEncumbrance: rawOverrides.activeEncumbrancePoints } : {}),
        ...(rawOverrides.activeEncumbrance ? { mortgage: rawOverrides.activeEncumbrance, activeEncumbrance: rawOverrides.activeEncumbrance } : {}),
        ...(rawOverrides.mortgage ? { mortgage: rawOverrides.mortgage } : {}),
      },
    };

    const breakdown: RiskRuleResult[] = [];

    // 1. Fetch Parcel Data with PostGIS Spatial Area & Geometry Validity
    const parcelRes = await query(
      `SELECT p.*,
              ST_Area(p.geom::geography) AS geodesic_area_sqm,
              ST_IsValid(p.geom) AS is_geom_valid,
              ST_GeometryType(p.geom) AS geom_type
       FROM parcels p 
       WHERE p.ulpin = $1 OR p.id::text = $1`,
      [parcelId]
    );

    if (parcelRes.rows.length === 0) {
      return {
        score: 100,
        level: 'CRITICAL',
        breakdown: [
          {
            rule: 'PARCEL_NOT_FOUND',
            points: 100,
            reason: 'Target parcel record not found in cadastral database',
            evidence: { parcelId },
            severity: 'CRITICAL',
          },
        ],
        evaluatedAt: new Date().toISOString(),
        isCapped: false,
        rawScore: 100,
        thresholds: config.thresholds,
        metadata: {
          parcelId,
          ulpin: parcelId,
          version: 1,
          isAuditable: true,
        },
      };
    }

    const parcel = parcelRes.rows[0];
    const targetParcelId = parcel.id;

    // ==========================================
    // RULE 1: ACTIVE & HISTORICAL ENCUMBRANCES
    // ==========================================
    const encRes = await query(
      `SELECT * FROM encumbrances WHERE parcel_id = $1 ORDER BY status ASC, created_at DESC`,
      [targetParcelId]
    );
    const activeEncumbrances = encRes.rows.filter((e) => e.status === 'ACTIVE');
    const closedEncumbrances = encRes.rows.filter((e) => e.status === 'CLOSED');

    if (activeEncumbrances.length > 0) {
      for (const enc of activeEncumbrances) {
        if (enc.type === 'COURT_STAY' || enc.type === 'ATTACHMENT') {
          breakdown.push({
            rule: 'ACTIVE_ENCUMBRANCE',
            points: config.weights.courtStay,
            reason: `Active judicial restraint: ${enc.type} issued by ${enc.authority} (Ref: ${enc.reference_number}). Transfer legally prohibited.`,
            evidence: {
              type: enc.type,
              authority: enc.authority,
              reference_number: enc.reference_number,
              status: enc.status,
              start_date: enc.start_date,
            },
            severity: 'CRITICAL',
          });
        } else {
          breakdown.push({
            rule: 'ACTIVE_ENCUMBRANCE',
            points: config.weights.mortgage,
            reason: `Active financial charge/mortgage registered by ${enc.authority} (Ref: ${enc.reference_number}). Bank NOC required.`,
            evidence: {
              type: enc.type,
              authority: enc.authority,
              reference_number: enc.reference_number,
              status: enc.status,
              start_date: enc.start_date,
            },
            severity: 'HIGH',
          });
        }
      }
    } else if (closedEncumbrances.length > 0) {
      // Check recently closed within 180 days
      const recentClosed = closedEncumbrances.filter(
        (e) => e.end_date && new Date(e.end_date) >= new Date(Date.now() - 180 * 86400000)
      );
      if (recentClosed.length > 0) {
        breakdown.push({
          rule: 'HISTORICAL_ENCUMBRANCE',
          points: config.weights.closedEncumbrance,
          reason: `Recently discharged encumbrance (${recentClosed[0].authority}) within the last 180 days.`,
          evidence: {
            closed_count: recentClosed.length,
            latest_discharge_date: recentClosed[0].end_date,
            authority: recentClosed[0].authority,
          },
          severity: 'LOW',
        });
      }
    }

    // ==========================================
    // RULE 2: ACTIVE & HISTORICAL LITIGATION
    // ==========================================
    const litRes = await query(
      `SELECT * FROM litigation_cases WHERE parcel_id = $1 ORDER BY status ASC, opened_at DESC`,
      [targetParcelId]
    );
    const activeLitigation = litRes.rows.filter((l) => l.status === 'STAY_GRANTED' || l.status === 'PENDING');
    const closedLitigation = litRes.rows.filter((l) => l.status === 'DISPOSED' || l.status === 'CLOSED');

    if (activeLitigation.length > 0) {
      for (const lit of activeLitigation) {
        if (lit.status === 'STAY_GRANTED') {
          breakdown.push({
            rule: 'ACTIVE_LITIGATION',
            points: config.weights.stayGrantedLitigation,
            reason: `Active judicial injunction/stay in Case ${lit.case_number} (${lit.court}). Injunction against title alienation.`,
            evidence: {
              case_number: lit.case_number,
              court: lit.court,
              case_type: lit.case_type,
              status: lit.status,
              opened_at: lit.opened_at,
            },
            severity: 'CRITICAL',
          });
        } else {
          breakdown.push({
            rule: 'ACTIVE_LITIGATION',
            points: config.weights.pendingLitigation,
            reason: `Pending civil litigation in ${lit.court} (Case: ${lit.case_number}, Type: ${lit.case_type}).`,
            evidence: {
              case_number: lit.case_number,
              court: lit.court,
              case_type: lit.case_type,
              status: lit.status,
              opened_at: lit.opened_at,
            },
            severity: 'HIGH',
          });
        }
      }
    } else if (closedLitigation.length > 0) {
      const recentDisposed = closedLitigation.filter(
        (l) => l.closed_at && new Date(l.closed_at) >= new Date(Date.now() - 365 * 86400000)
      );
      if (recentDisposed.length > 0) {
        breakdown.push({
          rule: 'HISTORICAL_LITIGATION',
          points: config.weights.closedLitigation,
          reason: `Historical court dispute disposed in ${recentDisposed[0].court} (Case: ${recentDisposed[0].case_number}).`,
          evidence: {
            case_number: recentDisposed[0].case_number,
            court: recentDisposed[0].court,
            closed_at: recentDisposed[0].closed_at,
          },
          severity: 'LOW',
        });
      }
    }

    // ==========================================
    // RULE 3: RECENT OWNERSHIP CHURN (REGISTRATION HISTORY)
    // ==========================================
    const churnRes = await query(
      `SELECT * FROM registrations 
       WHERE parcel_id = $1 AND registration_date >= NOW() - ($2 || ' days')::INTERVAL 
       ORDER BY registration_date DESC`,
      [targetParcelId, config.weights.churnThresholdDays]
    );

    if (churnRes.rows.length >= config.weights.churnMinCount) {
      breakdown.push({
        rule: 'OWNERSHIP_CHURN',
        points: config.weights.churnPoints,
        reason: `Rapid ownership churn: ${churnRes.rows.length} deed transfers recorded within the last ${config.weights.churnThresholdDays} days.`,
        evidence: {
          transfers_in_window: churnRes.rows.length,
          window_days: config.weights.churnThresholdDays,
          recent_deeds: churnRes.rows.map((r) => ({
            document_number: r.document_number,
            date: r.registration_date,
            buyer: r.buyer,
          })),
        },
        severity: 'MEDIUM',
      });
    }

    // ==========================================
    // RULE 4: REGISTRATION / CADASTRAL AREA MISMATCH
    // ==========================================
    let targetRegistration: any = null;
    if (options?.registrationId) {
      const regDoc = await query(`SELECT * FROM registrations WHERE id = $1`, [options.registrationId]);
      if (regDoc.rows.length > 0) targetRegistration = regDoc.rows[0];
    } else if (churnRes.rows.length > 0) {
      targetRegistration = churnRes.rows[0];
    }

    if (targetRegistration) {
      const cadastralArea = parseFloat(parcel.area_sqm || '0');
      const regArea = parseFloat(targetRegistration.registered_area_sqm || '0');

      if (cadastralArea > 0 && regArea > 0) {
        const pctDiff = ((regArea - cadastralArea) / cadastralArea) * 100;
        if (pctDiff > config.weights.areaMismatchHighPctThreshold) {
          breakdown.push({
            rule: 'AREA_MISMATCH',
            points: config.weights.areaMismatchHighPoints,
            reason: `Severe area discrepancy: Registered deed area (${regArea} m²) exceeds surveyed cadastral area (${cadastralArea} m²) by +${pctDiff.toFixed(1)}%.`,
            evidence: {
              registered_area_sqm: regArea,
              cadastral_survey_area_sqm: cadastralArea,
              excess_sqm: (regArea - cadastralArea).toFixed(2),
              percentage_difference: +pctDiff.toFixed(2),
              document_number: targetRegistration.document_number,
            },
            severity: 'HIGH',
          });
        } else if (pctDiff > config.weights.areaMismatchPctThreshold) {
          breakdown.push({
            rule: 'AREA_MISMATCH',
            points: config.weights.areaMismatchPoints,
            reason: `Registered deed area (${regArea} m²) exceeds cadastral surveyed area (${cadastralArea} m²) by +${pctDiff.toFixed(1)}%.`,
            evidence: {
              registered_area_sqm: regArea,
              cadastral_survey_area_sqm: cadastralArea,
              excess_sqm: (regArea - cadastralArea).toFixed(2),
              percentage_difference: +pctDiff.toFixed(2),
              document_number: targetRegistration.document_number,
            },
            severity: 'MEDIUM',
          });
        }
      }
    }

    // ==========================================
    // RULE 5: LEGACY MAPPING AMBIGUITY
    // ==========================================
    const legacyRes = await query(`SELECT * FROM legacy_id_map WHERE ulpin = $1`, [parcel.ulpin]);
    const hasAmbiguity =
      legacyRes.rows.some((m) => m.ambiguity_flag === true) || legacyRes.rows.length > 3;

    if (hasAmbiguity) {
      breakdown.push({
        rule: 'LEGACY_MAPPING_AMBIGUITY',
        points: config.weights.legacyAmbiguityPoints,
        reason: `Legacy land records conversion contains ambiguity flags or multiple unlinked legacy survey records (${legacyRes.rows.length} mappings).`,
        evidence: {
          legacy_mapping_count: legacyRes.rows.length,
          ambiguous_records: legacyRes.rows.filter((m) => m.ambiguity_flag === true),
        },
        severity: 'MEDIUM',
      });
    }

    // ==========================================
    // RULE 6: OPEN SATELLITE CHANGE ALERT
    // ==========================================
    const alertRes = await query(`SELECT * FROM change_alerts WHERE parcel_id = $1`, [targetParcelId]);
    const pendingAlerts = alertRes.rows.filter((a) => a.status === 'OPEN' || a.status === 'PENDING');

    if (pendingAlerts.length > 0) {
      for (const alert of pendingAlerts) {
        breakdown.push({
          rule: 'OPEN_CHANGE_ALERT',
          points: config.weights.openChangeAlertPoints,
          reason: `Unverified satellite spectral anomaly detected (${alert.type} via ${alert.detection_method}). Ground inspection required.`,
          evidence: {
            alert_id: alert.id,
            type: alert.type,
            detection_method: alert.detection_method,
            confidence: alert.confidence,
            details: alert.details_json,
          },
          severity: 'MEDIUM',
        });
      }
    }

    // ==========================================
    // RULE 7: RECENT TRANSFER IN SHORT PERIOD (< 30 DAYS)
    // ==========================================
    const recentTransfers = await query(
      `SELECT * FROM registrations 
       WHERE parcel_id = $1 AND registration_date >= NOW() - ($2 || ' days')::INTERVAL 
       ORDER BY registration_date DESC LIMIT 1`,
      [targetParcelId, config.weights.recentTransferDays]
    );

    if (recentTransfers.rows.length > 0) {
      const lastReg = recentTransfers.rows[0];
      const daysAgo = Math.floor(
        (Date.now() - new Date(lastReg.registration_date).getTime()) / 86400000
      );
      breakdown.push({
        rule: 'RECENT_TRANSFER',
        points: config.weights.recentTransferPoints,
        reason: `Very recent deed transfer executed ${daysAgo} day(s) ago (Doc: ${lastReg.document_number}).`,
        evidence: {
          document_number: lastReg.document_number,
          registration_date: lastReg.registration_date,
          days_ago: daysAgo,
          buyer: lastReg.buyer,
        },
        severity: 'LOW',
      });
    }

    // ==========================================
    // RULE 8: MULTIPLE CURRENT OWNERS (CO-PARCENARY / JOINT)
    // ==========================================
    const ownersRes = await query(
      `SELECT * FROM parcel_owners WHERE parcel_id = $1 AND is_current = TRUE`,
      [targetParcelId]
    );

    if (ownersRes.rows.length >= config.weights.multipleOwnersMinCount) {
      breakdown.push({
        rule: 'MULTIPLE_OWNERS',
        points: config.weights.multipleOwnersPoints,
        reason: `Parcel held jointly by ${ownersRes.rows.length} co-owners. Requires partition consent or joint NOC.`,
        evidence: {
          owner_count: ownersRes.rows.length,
          owners: ownersRes.rows.map((o) => ({
            name: o.person_name,
            share: `${o.ownership_percentage}%`,
            type: o.ownership_type,
          })),
        },
        severity: 'LOW',
      });
    }

    // ==========================================
    // RULE 9: DUPLICATE REGISTRATIONS (DOUBLE SALE IN 30 DAYS)
    // ==========================================
    const dupRes = await query(
      `SELECT r1.document_number AS doc1, r2.document_number AS doc2, r1.buyer AS buyer1, r2.buyer AS buyer2,
              r1.registration_date AS date1, r2.registration_date AS date2
       FROM registrations r1
       JOIN registrations r2 ON r1.parcel_id = r2.parcel_id AND r1.id != r2.id AND r1.registration_date <= r2.registration_date
       WHERE r1.parcel_id = $1 AND ABS((r2.registration_date::date - r1.registration_date::date)) <= $2`,
      [targetParcelId, config.weights.duplicateRegDays]
    );

    if (dupRes.rows.length > 0) {
      breakdown.push({
        rule: 'DUPLICATE_REGISTRATION',
        points: config.weights.duplicateRegPoints,
        reason: `Potential double registration: Multiple deed transactions recorded on the same parcel within ${config.weights.duplicateRegDays} days.`,
        evidence: {
          overlapping_deeds: dupRes.rows[0],
        },
        severity: 'HIGH',
      });
    }

    // ==========================================
    // RULE 10: SELLER-OWNER TITLE MISMATCH
    // ==========================================
    const targetSeller = options?.sellerName || targetRegistration?.seller;
    if (targetSeller && ownersRes.rows.length > 0) {
      const sellerNorm = targetSeller.toLowerCase().replace(/[^a-z0-9]/g, '');
      const matchFound = ownersRes.rows.some((o) => {
        const ownerNorm = o.person_name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return ownerNorm.includes(sellerNorm) || sellerNorm.includes(ownerNorm);
      });

      if (!matchFound) {
        breakdown.push({
          rule: 'SELLER_OWNER_MISMATCH',
          points: config.weights.sellerMismatchPoints,
          reason: `Seller '${targetSeller}' does not match any current verified Pattadar / title holder on record.`,
          evidence: {
            deed_seller: targetSeller,
            registered_owners: ownersRes.rows.map((o) => o.person_name),
          },
          severity: 'CRITICAL',
        });
      }
    }

    // ==========================================
    // RULE 11: HISTORICAL MUTATION ANOMALIES (BLOCKED / REJECTED)
    // ==========================================
    const mutationHistory = await query(
      `SELECT * FROM mutation_applications WHERE parcel_id = $1 AND status IN ('BLOCKED', 'REJECTED')`,
      [targetParcelId]
    );

    if (mutationHistory.rows.length > 0) {
      breakdown.push({
        rule: 'HISTORICAL_MUTATION_ANOMALIES',
        points: config.weights.mutationAnomalyPoints,
        reason: `Historical mutation anomalies: ${mutationHistory.rows.length} prior application(s) were blocked or rejected.`,
        evidence: {
          blocked_count: mutationHistory.rows.length,
          applications: mutationHistory.rows.map((m) => ({
            application_number: m.application_number,
            status: m.status,
            reason: m.blocked_reason,
            submitted_at: m.submitted_at,
          })),
        },
        severity: 'MEDIUM',
      });
    }

    // ==========================================
    // RULE 12: PARCEL GEOMETRY & DATA INCONSISTENCY
    // ==========================================
    if (!parcel.is_geom_valid || parseFloat(parcel.area_sqm) <= 0) {
      breakdown.push({
        rule: 'PARCEL_GEOMETRY_INCONSISTENCY',
        points: config.weights.geometryInconsistencyPoints,
        reason: `Cadastral spatial survey geometry is invalid or self-intersecting in GIS topology.`,
        evidence: {
          is_valid: parcel.is_geom_valid,
          geom_type: parcel.geom_type,
          area_sqm: parcel.area_sqm,
        },
        severity: 'HIGH',
      });
    }

    // ==========================================
    // COMPUTE AGGREGATED SCORE (CAP AT 100)
    // ==========================================
    const rawScore = breakdown.reduce((sum, item) => sum + item.points, 0);
    const score = Math.min(100, rawScore);
    const level = this.getRiskLevel(score, config.thresholds);

    return {
      parcelId: parcel.id,
      ulpin: parcel.ulpin,
      score,
      level,
      breakdown,
      evaluatedAt: new Date().toISOString(),
      isCapped: rawScore > 100,
      rawScore,
      thresholds: config.thresholds,
      metadata: {
        parcelId: parcel.id,
        ulpin: parcel.ulpin,
        version: parcel.version,
        isAuditable: true,
      },
    };
  }

  /**
   * Evaluate mutation application risk
   */
  async evaluateMutationRisk(
    mutationId: string,
    config?: Partial<RiskEngineConfig>
  ): Promise<RiskEvaluationResult & { mutationId: string; status: string; applicationNumber: string }> {
    const mutRes = await query(`SELECT * FROM mutation_applications WHERE id = $1`, [mutationId]);
    if (mutRes.rows.length === 0) {
      throw new Error(`Mutation application ${mutationId} not found`);
    }

    const app = mutRes.rows[0];
    const applicant = typeof app.applicant === 'string' ? JSON.parse(app.applicant) : app.applicant;

    const evalResult = await this.evaluateParcelRisk(app.parcel_id, {
      registrationId: app.registration_id,
      sellerName: applicant?.seller_name,
      config,
    });

    return {
      ...evalResult,
      mutationId: app.id,
      status: app.status,
      applicationNumber: app.application_number,
    };
  }
}

export const riskEngine = new ExplainableRiskEngine();
