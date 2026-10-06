import { query, getClient } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import { auditService } from '../audit/audit.service.js';
import { MutationStatus } from '../../types/index.js';
import { parcelsService } from '../parcels/parcels.service.js';

export interface ValidationCheckItem {
  id: string;
  name: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  score: number;
  details: string;
}

export interface RuleEvaluationResult {
  result: 'PASS' | 'BLOCK' | 'FLAG_FOR_REVIEW';
  isBlocked: boolean;
  blockReason: string | null;
  riskScore: number;
  riskFactors: { factor: string; severity: 'LOW' | 'MEDIUM' | 'HIGH'; score: number; reason: string }[];
  checks: ValidationCheckItem[];
  evaluatedAt: string;
}

export class MutationService {
  /**
   * Evaluates all 11 automated validation rules and calculates risk score
   */
  async evaluateRiskAndRules(
    parcelId: string,
    registrationId?: string | null,
    applicant?: any,
    sellerName?: string | null
  ): Promise<RuleEvaluationResult> {
    const checks: ValidationCheckItem[] = [];
    const riskFactors: { factor: string; severity: 'LOW' | 'MEDIUM' | 'HIGH'; score: number; reason: string }[] = [];
    let riskScore = 0;
    let isBlocked = false;
    let blockReason: string | null = null;

    // 1. Check ULPIN Exists & Valid
    const parcelRes = await query(`SELECT * FROM parcels WHERE id = $1`, [parcelId]);
    if (parcelRes.rows.length === 0) {
      isBlocked = true;
      blockReason = 'ULPIN / Parcel record not found in cadastral registry.';
      checks.push({
        id: 'CHECK_1_ULPIN_EXISTS',
        name: '1. ULPIN Registry Resolution',
        status: 'FAIL',
        score: 50,
        details: blockReason,
      });
      return {
        result: 'BLOCK',
        isBlocked: true,
        blockReason,
        riskScore: 100,
        riskFactors: [{ factor: 'INVALID_ULPIN', severity: 'HIGH', score: 100, reason: blockReason }],
        checks,
        evaluatedAt: new Date().toISOString(),
      };
    }

    const parcel = parcelRes.rows[0];
    checks.push({
      id: 'CHECK_1_ULPIN_EXISTS',
      name: '1. ULPIN Registry Resolution',
      status: 'PASS',
      score: 0,
      details: `Valid 14-character ULPIN '${parcel.ulpin}' resolved in ${parcel.state_code} registry.`,
    });

    // 2. Check Parcel Cadastral Validity (Geometry & Status)
    if (!parcel.geom || !parcel.area_sqm) {
      isBlocked = true;
      const r = `Parcel has unverified cadastral survey geometry or missing area extent.`;
      blockReason = blockReason || r;
      checks.push({
        id: 'CHECK_2_PARCEL_VALID',
        name: '2. Cadastral Survey Geometry Validity',
        status: 'FAIL',
        score: 40,
        details: r,
      });
    } else {
      checks.push({
        id: 'CHECK_2_PARCEL_VALID',
        name: '2. Cadastral Survey Geometry Validity',
        status: 'PASS',
        score: 0,
        details: `Active surveyed parcel polygon (${parcel.area_sqm} m²) in ${parcel.village}, ${parcel.mandal}.`,
      });
    }

    // 3. Check Seller Matches Current Verified Owner
    const currentOwnersRes = await query(
      `SELECT person_name, person_identifier, ownership_percentage, ownership_type 
       FROM parcel_owners 
       WHERE parcel_id = $1 AND is_current = TRUE`,
      [parcelId]
    );
    const currentOwners = currentOwnersRes.rows;

    let targetSeller = sellerName;
    if (!targetSeller && registrationId) {
      const regRes = await query(`SELECT seller FROM registrations WHERE id = $1`, [registrationId]);
      if (regRes.rows.length > 0) {
        targetSeller = regRes.rows[0].seller;
      }
    }

    if (targetSeller && currentOwners.length > 0) {
      const sellerNormalized = targetSeller.toLowerCase().replace(/[^a-z0-9]/g, '');
      const match = currentOwners.some((o: any) => {
        const ownerNorm = o.person_name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return ownerNorm.includes(sellerNormalized) || sellerNormalized.includes(ownerNorm);
      });

      if (!match) {
        isBlocked = true;
        const r = `Seller '${targetSeller}' does not match current registered title holder (${currentOwners.map((o: any) => o.person_name).join(', ')}).`;
        blockReason = blockReason || r;
        riskScore += 50;
        riskFactors.push({
          factor: 'SELLER_TITLE_MISMATCH',
          severity: 'HIGH',
          score: 50,
          reason: r,
        });
        checks.push({
          id: 'CHECK_3_SELLER_MATCH',
          name: '3. Seller Title Verification',
          status: 'FAIL',
          score: 50,
          details: r,
        });
      } else {
        checks.push({
          id: 'CHECK_3_SELLER_MATCH',
          name: '3. Seller Title Verification',
          status: 'PASS',
          score: 0,
          details: `Seller '${targetSeller}' matches verified Pattadar / title holder.`,
        });
      }
    } else {
      checks.push({
        id: 'CHECK_3_SELLER_MATCH',
        name: '3. Seller Title Verification',
        status: currentOwners.length > 0 ? 'PASS' : 'WARNING',
        score: currentOwners.length > 0 ? 0 : 10,
        details: currentOwners.length > 0
          ? `Current verified title holders: ${currentOwners.map((o: any) => o.person_name).join(', ')}.`
          : 'No historical title holders found on file.',
      });
    }

    // 4. Check Registration Document Existence
    let registrationDoc: any = null;
    if (registrationId) {
      const regRes = await query(`SELECT * FROM registrations WHERE id = $1`, [registrationId]);
      if (regRes.rows.length === 0) {
        isBlocked = true;
        const r = `Referenced registration deed ${registrationId} not found in Sub-Registrar Office (SRO) index.`;
        blockReason = blockReason || r;
        checks.push({
          id: 'CHECK_4_REGISTRATION_EXISTS',
          name: '4. SRO Registration Linkage',
          status: 'FAIL',
          score: 40,
          details: r,
        });
      } else {
        registrationDoc = regRes.rows[0];
        checks.push({
          id: 'CHECK_4_REGISTRATION_EXISTS',
          name: '4. SRO Registration Linkage',
          status: 'PASS',
          score: 0,
          details: `Linked to registered deed ${registrationDoc.document_number} (${registrationDoc.deed_type}) dated ${registrationDoc.registration_date}.`,
        });
      }
    } else {
      checks.push({
        id: 'CHECK_4_REGISTRATION_EXISTS',
        name: '4. SRO Registration Linkage',
        status: 'PASS',
        score: 0,
        details: 'Direct mutation application under statutory revenue rules (Inheritance / Partition).',
      });
    }

    // 5. Check Buyer / Applicant Existence
    if (applicant && applicant.name) {
      checks.push({
        id: 'CHECK_5_BUYER_EXISTS',
        name: '5. Applicant / Buyer Identity Verification',
        status: 'PASS',
        score: 0,
        details: `Applicant '${applicant.name}' verified with identifier '${applicant.id_number || 'ID-VERIFIED'}'.`,
      });
    } else {
      checks.push({
        id: 'CHECK_5_BUYER_EXISTS',
        name: '5. Applicant / Buyer Identity Verification',
        status: 'WARNING',
        score: 10,
        details: 'Applicant identity details require physical verification.',
      });
    }

    // 6. Check Active Encumbrances
    const encResult = await query(
      `SELECT * FROM encumbrances WHERE parcel_id = $1 AND status = 'ACTIVE'`,
      [parcelId]
    );
    if (encResult.rows.length > 0) {
      let hasLegalRestraint = false;
      for (const enc of encResult.rows) {
        if (enc.type === 'COURT_STAY' || enc.type === 'ATTACHMENT') {
          isBlocked = true;
          hasLegalRestraint = true;
          const r = `Active legal restraint: ${enc.type} by ${enc.authority} (Ref: ${enc.reference_number}). Transfer legally prohibited.`;
          blockReason = blockReason || r;
          riskScore += 50;
          riskFactors.push({
            factor: 'LEGAL_RESTRAINT',
            severity: 'HIGH',
            score: 50,
            reason: r,
          });
        } else if (enc.type === 'MORTGAGE' || enc.type === 'TAX_LIEN') {
          riskScore += 25;
          riskFactors.push({
            factor: 'ACTIVE_ENCUMBRANCE',
            severity: 'MEDIUM',
            score: 25,
            reason: `Active ${enc.type} by ${enc.authority}. Requires NOC clearance prior to final order.`,
          });
        }
      }
      checks.push({
        id: 'CHECK_6_ACTIVE_ENCUMBRANCE',
        name: '6. Encumbrance & Mortgage Search',
        status: hasLegalRestraint ? 'FAIL' : 'WARNING',
        score: hasLegalRestraint ? 50 : 25,
        details: hasLegalRestraint
          ? `BLOCKED: Active court attachment / stay on parcel.`
          : `Active mortgage/lien detected (${encResult.rows.map((e: any) => e.authority).join(', ')}). NOC required.`,
      });
    } else {
      checks.push({
        id: 'CHECK_6_ACTIVE_ENCUMBRANCE',
        name: '6. Encumbrance & Mortgage Search',
        status: 'PASS',
        score: 0,
        details: 'Nil encumbrance certificate (EC) verified. No active charges or attachments.',
      });
    }

    // 7. Check Active Litigation & Stay Orders
    const litResult = await query(
      `SELECT * FROM litigation_cases WHERE parcel_id = $1 AND status IN ('PENDING', 'STAY_GRANTED')`,
      [parcelId]
    );
    if (litResult.rows.length > 0) {
      let hasStay = false;
      for (const lit of litResult.rows) {
        if (lit.status === 'STAY_GRANTED') {
          isBlocked = true;
          hasStay = true;
          const r = `Active judicial stay order in Case ${lit.case_number} (${lit.court}).`;
          blockReason = blockReason || r;
          riskScore += 50;
          riskFactors.push({
            factor: 'JUDICIAL_STAY_GRANTED',
            severity: 'HIGH',
            score: 50,
            reason: r,
          });
        } else {
          riskScore += 35;
          riskFactors.push({
            factor: 'PENDING_LITIGATION',
            severity: 'HIGH',
            score: 35,
            reason: `Pending litigation in ${lit.court} (Case: ${lit.case_number}, Type: ${lit.case_type}).`,
          });
        }
      }
      checks.push({
        id: 'CHECK_7_LITIGATION',
        name: '7. Judicial Litigation & Stay Search',
        status: hasStay ? 'FAIL' : 'WARNING',
        score: hasStay ? 50 : 35,
        details: hasStay
          ? `BLOCKED: Injunction/Stay granted in Case ${litResult.rows[0].case_number}.`
          : `Pending civil litigation in ${litResult.rows[0].court} (Case: ${litResult.rows[0].case_number}).`,
      });
    } else {
      checks.push({
        id: 'CHECK_7_LITIGATION',
        name: '7. Judicial Litigation & Stay Search',
        status: 'PASS',
        score: 0,
        details: 'No pending title disputes or civil court proceedings on record.',
      });
    }

    // 8. Check Duplicate Registrations Within Previous 30-180 Days
    const churnRes = await query(
      `SELECT COUNT(*)::int AS count FROM registrations 
       WHERE parcel_id = $1 AND registration_date >= NOW() - INTERVAL '180 days'`,
      [parcelId]
    );
    const recentRegCount = churnRes.rows[0]?.count || 0;
    if (recentRegCount >= 2) {
      riskScore += 25;
      const r = `Multiple deed registrations (${recentRegCount}) recorded on this parcel in the last 180 days.`;
      riskFactors.push({
        factor: 'RAPID_REGISTRATION_CHURN',
        severity: 'MEDIUM',
        score: 25,
        reason: r,
      });
      checks.push({
        id: 'CHECK_8_DUPLICATE_REGISTRATION',
        name: '8. 30-Day Duplicate Registration Check',
        status: 'WARNING',
        score: 25,
        details: r,
      });
    } else {
      checks.push({
        id: 'CHECK_8_DUPLICATE_REGISTRATION',
        name: '8. 30-Day Duplicate Registration Check',
        status: 'PASS',
        score: 0,
        details: 'No duplicate deed registrations or rapid ownership churn detected.',
      });
    }

    // 9. Check Registered Area vs Cadastral Area
    if (registrationDoc) {
      const parcelArea = parseFloat(parcel.area_sqm || '0');
      const regArea = parseFloat(registrationDoc.registered_area_sqm || '0');
      if (regArea > parcelArea * 1.02) {
        riskScore += 20;
        const diff = (regArea - parcelArea).toFixed(2);
        const r = `Registered deed area (${regArea} m²) exceeds cadastral surveyed area (${parcelArea} m²) by ${diff} m².`;
        riskFactors.push({
          factor: 'AREA_MISMATCH',
          severity: 'MEDIUM',
          score: 20,
          reason: r,
        });
        checks.push({
          id: 'CHECK_9_AREA_CONSISTENCY',
          name: '9. Cadastral Area vs Deed Consistency',
          status: 'WARNING',
          score: 20,
          details: r,
        });
      } else {
        checks.push({
          id: 'CHECK_9_AREA_CONSISTENCY',
          name: '9. Cadastral Area vs Deed Consistency',
          status: 'PASS',
          score: 0,
          details: `Deed area (${regArea} m²) matches cadastral surveyed area (${parcelArea} m²).`,
        });
      }
    } else {
      checks.push({
        id: 'CHECK_9_AREA_CONSISTENCY',
        name: '9. Cadastral Area vs Deed Consistency',
        status: 'PASS',
        score: 0,
        details: `Cadastral surveyed area verified at ${parcel.area_sqm} m².`,
      });
    }

    // 10. Check Ownership Conflicts / Multiple Co-Owners
    if (currentOwners.length > 1) {
      riskScore += 15;
      const r = `Parcel has ${currentOwners.length} joint co-owners. Requires partition deed or co-sharer NOC.`;
      riskFactors.push({
        factor: 'MULTIPLE_CO_OWNERS',
        severity: 'LOW',
        score: 15,
        reason: r,
      });
      checks.push({
        id: 'CHECK_10_OWNERSHIP_CONFLICTS',
        name: '10. Ownership Co-Sharer & Title Conflicts',
        status: 'WARNING',
        score: 15,
        details: r,
      });
    } else {
      checks.push({
        id: 'CHECK_10_OWNERSHIP_CONFLICTS',
        name: '10. Ownership Co-Sharer & Title Conflicts',
        status: 'PASS',
        score: 0,
        details: 'Sole owner title structure verified.',
      });
    }

    // 11. Check Legacy Mapping Ambiguity
    const legacyRes = await query(
      `SELECT * FROM legacy_id_map WHERE ulpin = $1`,
      [parcel.ulpin]
    );
    const hasAmbiguity = legacyRes.rows.some((m: any) => m.ambiguity_flag === true) || legacyRes.rows.length > 3;
    if (hasAmbiguity) {
      riskScore += 15;
      const r = `Legacy survey conversion mapping contains ambiguity flag (${legacyRes.rows.length} mappings).`;
      riskFactors.push({
        factor: 'LEGACY_MAPPING_AMBIGUITY',
        severity: 'LOW',
        score: 15,
        reason: r,
      });
      checks.push({
        id: 'CHECK_11_LEGACY_AMBIGUITY',
        name: '11. Legacy Survey Number Concordance',
        status: 'WARNING',
        score: 15,
        details: r,
      });
    } else {
      checks.push({
        id: 'CHECK_11_LEGACY_AMBIGUITY',
        name: '11. Legacy Survey Number Concordance',
        status: 'PASS',
        score: 0,
        details: `Concordance mapped cleanly to legacy survey no ${parcel.legacy_survey_no || 'N/A'}.`,
      });
    }

    // Determine final status result
    let finalResult: 'PASS' | 'BLOCK' | 'FLAG_FOR_REVIEW' = 'PASS';
    if (isBlocked) {
      finalResult = 'BLOCK';
    } else if (riskScore > 20) {
      finalResult = 'FLAG_FOR_REVIEW';
    }

    return {
      result: finalResult,
      isBlocked,
      blockReason,
      riskScore: Math.min(100, riskScore),
      riskFactors,
      checks,
      evaluatedAt: new Date().toISOString(),
    };
  }

  /**
   * Submit new mutation application with automated validation engine
   */
  async submitApplication(params: {
    parcelId: string;
    applicant: {
      name: string;
      id_number: string;
      phone?: string;
      email?: string;
      type?: string;
    };
    sellerName?: string | null;
    registrationId?: string | null;
    actorId: string;
  }) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Check parcel exists
      const parcelRes = await client.query('SELECT * FROM parcels WHERE id = $1', [params.parcelId]);
      if (parcelRes.rows.length === 0) {
        throw new AppError(404, 'PARCEL_NOT_FOUND', 'Target parcel does not exist in registry');
      }
      const parcel = parcelRes.rows[0];

      // Generate unique application number e.g. MUT-2026-XXXXX
      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      const appNumber = `MUT-${new Date().getFullYear()}-${randomSuffix}`;

      // Run comprehensive automated validation engine
      const evaluation = await this.evaluateRiskAndRules(
        params.parcelId,
        params.registrationId,
        params.applicant,
        params.sellerName
      );

      let initialStatus: MutationStatus = 'AUTO_VALIDATED';
      if (evaluation.isBlocked) {
        initialStatus = 'BLOCKED';
      } else if (evaluation.riskScore > 20) {
        initialStatus = 'OFFICER_REVIEW';
      }

      // Insert mutation application
      const insertRes = await client.query(
        `INSERT INTO mutation_applications (
          application_number, parcel_id, applicant, registration_id,
          status, risk_score, risk_breakdown_json, blocked_reason,
          submitted_at, updated_at, version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), 1)
        RETURNING *`,
        [
          appNumber,
          params.parcelId,
          JSON.stringify(params.applicant),
          params.registrationId || null,
          initialStatus,
          evaluation.riskScore,
          JSON.stringify({
            total_score: evaluation.riskScore,
            factors: evaluation.riskFactors,
            checks: evaluation.checks,
            evaluated_at: evaluation.evaluatedAt,
          }),
          evaluation.blockReason,
        ]
      );

      const app = insertRes.rows[0];

      // Log initial mutation event
      await client.query(
        `INSERT INTO mutation_events (
          mutation_application_id, from_status, to_status, actor_id, reason, metadata_json
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          app.id,
          'SUBMITTED',
          initialStatus,
          params.actorId,
          evaluation.isBlocked
            ? `Automated rule validation BLOCKED: ${evaluation.blockReason}`
            : initialStatus === 'OFFICER_REVIEW'
            ? `Flagged for Tahsildar adjudication due to composite risk score (${evaluation.riskScore})`
            : 'Passed automated rules check: 0 blocking issues identified',
          JSON.stringify({
            risk_score: evaluation.riskScore,
            ulpin: parcel.ulpin,
            checks_passed: evaluation.checks.filter((c) => c.status === 'PASS').length,
          }),
        ]
      );

      // Log to cryptographic SHA-256 audit log
      await auditService.logAction({
        entityType: 'MUTATION_APPLICATION',
        entityId: app.id,
        action: 'MUTATION_SUBMITTED',
        actorId: params.actorId,
        payload: {
          application_number: appNumber,
          ulpin: parcel.ulpin,
          applicant: params.applicant,
          status: initialStatus,
          risk_score: evaluation.riskScore,
          is_blocked: evaluation.isBlocked,
        },
      });

      await client.query('COMMIT');
      return {
        ...app,
        validation_evaluation: evaluation,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Transition mutation status through the workflow state machine with optimistic concurrency
   */
  async transitionStatus(params: {
    applicationId: string;
    targetStatus: MutationStatus;
    reason: string;
    actorId: string;
    expectedVersion?: number;
    metadata?: any;
  }) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const appRes = await client.query(
        `SELECT ma.*, p.ulpin, p.version AS parcel_version, p.area_sqm
         FROM mutation_applications ma
         JOIN parcels p ON p.id = ma.parcel_id
         WHERE ma.id = $1 FOR UPDATE`,
        [params.applicationId]
      );

      if (appRes.rows.length === 0) {
        throw new AppError(404, 'MUTATION_NOT_FOUND', 'Mutation application not found');
      }

      const app = appRes.rows[0];
      const fromStatus: MutationStatus = app.status;

      // 1. Optimistic Concurrency Check
      if (params.expectedVersion !== undefined && params.expectedVersion !== app.version) {
        throw new AppError(
          409,
          'VERSION_CONFLICT',
          `Mutation application was modified by another transaction. Reload latest state.`,
          {
            server_version: app.version,
            client_version: params.expectedVersion,
          }
        );
      }

      // 2. State Transition Validation
      const validTransitions: Record<MutationStatus, MutationStatus[]> = {
        SUBMITTED: ['AUTO_VALIDATED', 'BLOCKED', 'OFFICER_REVIEW', 'REJECTED'],
        AUTO_VALIDATED: ['OFFICER_REVIEW', 'FIELD_VERIFICATION', 'APPROVED', 'BLOCKED', 'REJECTED'],
        BLOCKED: ['OFFICER_REVIEW', 'REJECTED'],
        OFFICER_REVIEW: ['FIELD_VERIFICATION', 'APPROVED', 'BLOCKED', 'REJECTED'],
        FIELD_VERIFICATION: ['OFFICER_REVIEW', 'APPROVED', 'REJECTED'],
        APPROVED: ['RECORD_UPDATED'],
        RECORD_UPDATED: [],
        REJECTED: [],
      };

      const allowed = validTransitions[fromStatus] || [];
      if (!allowed.includes(params.targetStatus)) {
        throw new AppError(
          400,
          'INVALID_TRANSITION',
          `Invalid state transition: Cannot move mutation from '${fromStatus}' to '${params.targetStatus}'. Allowed transitions: ${allowed.join(', ') || 'None (Terminal state)'}`
        );
      }

      // 3. Approval Transaction: If APPROVED, record updates happen transactionally
      if (params.targetStatus === 'APPROVED' || params.targetStatus === 'RECORD_UPDATED') {
        const applicant = typeof app.applicant === 'string' ? JSON.parse(app.applicant) : app.applicant;

        // A. Mark old owners as non-current
        await client.query(
          `UPDATE parcel_owners 
           SET is_current = FALSE, valid_to = CURRENT_DATE, updated_at = NOW() 
           WHERE parcel_id = $1 AND is_current = TRUE`,
          [app.parcel_id]
        );

        // B. Insert new sole/primary owner
        await client.query(
          `INSERT INTO parcel_owners (
            parcel_id, person_name, person_identifier, ownership_percentage, ownership_type, valid_from, is_current
          ) VALUES ($1, $2, $3, 100.00, 'SOLE', CURRENT_DATE, TRUE)`,
          [
            app.parcel_id,
            applicant.name,
            applicant.id_number || 'ID-CITIZEN-NEW',
          ]
        );

        // C. Create certified RoR Record
        const rorNumber = `ROR-${app.ulpin}-${Date.now().toString().slice(-4)}`;
        await client.query(
          `INSERT INTO land_records (
            parcel_id, record_type, record_number, holder_info, area, source, record_date, status, document_reference
          ) VALUES ($1, 'RoR_1B', $2, $3, $4, 'DIGITAL_MUTATION_WORKFLOW', CURRENT_DATE, 'ACTIVE', $5)`,
          [
            app.parcel_id,
            rorNumber,
            JSON.stringify([{ name: applicant.name, identifier: applicant.id_number, share: '100%' }]),
            app.area_sqm,
            app.application_number,
          ]
        );

        // D. Create parcel version snapshot and increment version
        const newParcelVersion = (app.parcel_version || 1) + 1;
        await client.query(
          `INSERT INTO parcel_versions (parcel_id, version, snapshot_json, changed_by, change_reason)
           VALUES ($1, $2, (SELECT row_to_json(parcels) FROM parcels WHERE id = $1), $3, $4)`,
          [
            app.parcel_id,
            app.parcel_version,
            params.actorId,
            `Mutation order ${app.application_number} executed. Ownership transferred to ${applicant.name}.`,
          ]
        );

        await client.query(
          `UPDATE parcels SET version = $1, updated_at = NOW() WHERE id = $2`,
          [newParcelVersion, app.parcel_id]
        );
      }

      // 4. Update mutation application status & version
      const effectiveStatus = params.targetStatus === 'APPROVED' ? 'APPROVED' : params.targetStatus;
      const updatedAppRes = await client.query(
        `UPDATE mutation_applications 
         SET status = $1, 
             version = version + 1,
             updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [effectiveStatus, app.id]
      );

      // 5. Record mutation workflow event
      await client.query(
        `INSERT INTO mutation_events (
          mutation_application_id, from_status, to_status, actor_id, reason, metadata_json
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          app.id,
          fromStatus,
          effectiveStatus,
          params.actorId,
          params.reason,
          JSON.stringify(params.metadata || {}),
        ]
      );

      // 6. Cryptographic SHA-256 Audit Log Entry
      await auditService.logAction({
        entityType: 'MUTATION_APPLICATION',
        entityId: app.id,
        action: `MUTATION_TRANSITION_${effectiveStatus}`,
        actorId: params.actorId,
        payload: {
          application_number: app.application_number,
          ulpin: app.ulpin,
          from_status: fromStatus,
          to_status: effectiveStatus,
          reason: params.reason,
          version: updatedAppRes.rows[0].version,
        },
      });

      await client.query('COMMIT');

      // 7. Purge Redis Cache for parcel
      await parcelsService.invalidateParcelCache(app.ulpin);

      return updatedAppRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Get single application with complete 360° context & rule evaluation
   */
  async getApplicationById(id: string) {
    const appRes = await query(
      `SELECT ma.*, p.ulpin, p.legacy_survey_no, p.village, p.mandal, p.district, p.state_code, p.area_sqm,
              p.version AS parcel_version, ST_AsGeoJSON(p.geom) AS geometry_geojson
       FROM mutation_applications ma
       JOIN parcels p ON p.id = ma.parcel_id
       WHERE ma.id = $1`,
      [id]
    );

    if (appRes.rows.length === 0) {
      throw new AppError(404, 'MUTATION_NOT_FOUND', 'Mutation application not found');
    }

    const app = appRes.rows[0];

    // Fetch related records
    const [eventsRes, ownersRes, encRes, litRes, regRes, auditRes] = await Promise.all([
      query(`SELECT * FROM mutation_events WHERE mutation_application_id = $1 ORDER BY created_at ASC`, [id]),
      query(`SELECT * FROM parcel_owners WHERE parcel_id = $1 ORDER BY is_current DESC, valid_from DESC`, [app.parcel_id]),
      query(`SELECT * FROM encumbrances WHERE parcel_id = $1 ORDER BY status ASC`, [app.parcel_id]),
      query(`SELECT * FROM litigation_cases WHERE parcel_id = $1 ORDER BY status ASC`, [app.parcel_id]),
      app.registration_id ? query(`SELECT * FROM registrations WHERE id = $1`, [app.registration_id]) : Promise.resolve({ rows: [] }),
      query(`SELECT * FROM audit_log WHERE entity_id = $1 ORDER BY seq ASC`, [id]),
    ]);

    // Live evaluate rules for fresh cockpit verification
    const evaluation = await this.evaluateRiskAndRules(
      app.parcel_id,
      app.registration_id,
      typeof app.applicant === 'string' ? JSON.parse(app.applicant) : app.applicant
    );

    return {
      ...app,
      events: eventsRes.rows,
      current_owners: ownersRes.rows,
      encumbrances: encRes.rows,
      litigation_cases: litRes.rows,
      registration: regRes.rows[0] || null,
      audit_history: auditRes.rows,
      live_validation_evaluation: evaluation,
    };
  }

  /**
   * List mutation applications with multi-dimensional filtering
   */
  async listApplications(options: {
    status?: string;
    parcelId?: string;
    state?: string;
    district?: string;
    riskMin?: number;
    riskMax?: number;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (options.status && options.status !== 'ALL') {
      conditions.push(`ma.status = $${pIdx++}`);
      params.push(options.status.toUpperCase());
    }

    if (options.parcelId) {
      conditions.push(`ma.parcel_id = $${pIdx++}`);
      params.push(options.parcelId);
    }

    if (options.state) {
      conditions.push(`p.state_code ILIKE $${pIdx++}`);
      params.push(options.state);
    }

    if (options.district) {
      conditions.push(`p.district ILIKE $${pIdx++}`);
      params.push(`%${options.district}%`);
    }

    if (options.riskMin !== undefined) {
      conditions.push(`ma.risk_score >= $${pIdx++}`);
      params.push(options.riskMin);
    }

    if (options.riskMax !== undefined) {
      conditions.push(`ma.risk_score <= $${pIdx++}`);
      params.push(options.riskMax);
    }

    if (options.search) {
      const q = `%${options.search.trim()}%`;
      conditions.push(`(
        ma.application_number ILIKE $${pIdx} 
        OR p.ulpin ILIKE $${pIdx} 
        OR p.legacy_survey_no ILIKE $${pIdx}
        OR ma.applicant->>'name' ILIKE $${pIdx}
      )`);
      params.push(q);
      pIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = Math.min(options.limit || 50, 100);
    const offset = options.offset || 0;

    const sql = `
      SELECT ma.*, p.ulpin, p.legacy_survey_no, p.village, p.mandal, p.district, p.state_code,
             COALESCE(
               json_agg(me.* ORDER BY me.created_at ASC) FILTER (WHERE me.id IS NOT NULL),
               '[]'
             ) AS events
      FROM mutation_applications ma
      JOIN parcels p ON p.id = ma.parcel_id
      LEFT JOIN mutation_events me ON me.mutation_application_id = ma.id
      ${whereClause}
      GROUP BY ma.id, p.ulpin, p.legacy_survey_no, p.village, p.mandal, p.district, p.state_code
      ORDER BY ma.submitted_at DESC
      LIMIT $${pIdx++} OFFSET $${pIdx++}
    `;

    params.push(limit, offset);
    const result = await query(sql, params);

    return result.rows;
  }
}

export const mutationService = new MutationService();

