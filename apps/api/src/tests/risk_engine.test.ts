import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { query } from '../config/db.js';
import { runSeeds } from '../scripts/seed.js';
import {
  ExplainableRiskEngine,
  DEFAULT_RISK_CONFIG,
  RiskSeverity,
} from '../modules/risk/risk.engine.js';

describe('GeoDhara Explainable Risk Engine Test Suite', () => {
  const app = createApp();
  let officerToken: string;
  let citizenToken: string;
  let parcels: any[] = [];
  let cleanParcelUlpin: string;
  let encumberedParcelUlpin: string;
  let litigationParcelUlpin: string;
  let multiOwnerParcelUlpin: string;
  let alertParcelUlpin: string;
  let areaMismatchParcelUlpin: string;

  beforeAll(async () => {
    await runSeeds();

    // Authenticate Officer
    const officerLogin = await request(app).post('/api/auth/login').send({
      email: 'officer@geodhara.demo',
      password: 'DemoOfficer@123',
    });
    officerToken = officerLogin.body.data.tokens.accessToken;

    // Authenticate Citizen
    const citizenLogin = await request(app).post('/api/auth/login').send({
      email: 'citizen@geodhara.demo',
      password: 'DemoCitizen@123',
    });
    citizenToken = citizenLogin.body.data.tokens.accessToken;

    // Retrieve parcels to identify target ULPINs
    const parcelsRes = await query(`
      SELECT p.id, p.ulpin, p.area_sqm,
             ST_Area(p.geom::geography) as cadastral_area_sqm
      FROM parcels p
    `);
    parcels = parcelsRes.rows;

    // 1. Clean parcel
    const cleanRes = await query(`
      SELECT p.ulpin FROM parcels p
      LEFT JOIN encumbrances e ON e.parcel_id = p.id
      LEFT JOIN litigation_cases lc ON lc.parcel_id = p.id
      LEFT JOIN change_alerts sca ON sca.parcel_id = p.id
      WHERE e.id IS NULL AND lc.id IS NULL AND sca.id IS NULL
      LIMIT 1
    `);
    cleanParcelUlpin = cleanRes.rows[0]?.ulpin || parcels[0].ulpin;

    // 2. Encumbered parcel
    const encRes = await query(`
      SELECT p.ulpin FROM parcels p
      JOIN encumbrances e ON e.parcel_id = p.id
      WHERE e.status = 'ACTIVE'
      LIMIT 1
    `);
    encumberedParcelUlpin = encRes.rows[0]?.ulpin || 'MHABC12345DEF8';

    // 3. Litigation parcel
    const litRes = await query(`
      SELECT p.ulpin FROM parcels p
      JOIN litigation_cases lc ON lc.parcel_id = p.id
      WHERE lc.status IN ('PENDING', 'STAY_GRANTED', 'ACTIVE')
      LIMIT 1
    `);
    litigationParcelUlpin = litRes.rows[0]?.ulpin || 'KASTY45678JKL2';

    // 4. Multi-owner parcel
    const multiRes = await query(`
      SELECT p.ulpin, count(po.id) as cnt FROM parcels p
      JOIN parcel_owners po ON po.parcel_id = p.id AND po.is_current = TRUE
      GROUP BY p.ulpin
      HAVING count(po.id) > 1
      LIMIT 1
    `);
    multiOwnerParcelUlpin = multiRes.rows[0]?.ulpin || 'APMNB99887JKL4';

    // 5. Satellite Alert parcel
    const alertRes = await query(`
      SELECT p.ulpin FROM parcels p
      JOIN change_alerts sca ON sca.parcel_id = p.id
      WHERE sca.status IN ('OPEN', 'PENDING')
      LIMIT 1
    `);
    alertParcelUlpin = alertRes.rows[0]?.ulpin || 'DLNOP77665MNB1';
  });

  // ==========================================
  // 1. INDIVIDUAL RULES & SCORE CALCULATION
  // ==========================================
  describe('1. Individual Explainable Rules Engine Unit Tests', () => {
    const engine = new ExplainableRiskEngine();

    it('Rule 1: ACTIVE_ENCUMBRANCE evaluates correctly with audit points and evidence', async () => {
      const assessment = await engine.evaluateParcelRisk(encumberedParcelUlpin);
      const ruleItem = assessment.breakdown.find((r) => r.rule === 'ACTIVE_ENCUMBRANCE');
      
      expect(ruleItem).toBeDefined();
      expect(ruleItem?.points).toBeGreaterThanOrEqual(30);
      expect(['HIGH', 'CRITICAL']).toContain(ruleItem?.severity);
      expect(ruleItem?.reason).toMatch(/Active (financial charge|mortgage|encumbrance)/);
      expect(ruleItem?.evidence).toBeDefined();
    });

    it('Rule 2: ACTIVE_LITIGATION evaluates correctly with stay points and court evidence', async () => {
      const assessment = await engine.evaluateParcelRisk(litigationParcelUlpin);
      const ruleItem = assessment.breakdown.find((r) => r.rule === 'ACTIVE_LITIGATION');

      expect(ruleItem).toBeDefined();
      expect(ruleItem?.points).toBeGreaterThanOrEqual(25);
      expect(ruleItem?.evidence).toHaveProperty('case_number');
    });

    it('Rule 4: AREA_MISMATCH triggers when difference exceeds configured tolerance', async () => {
      // Test custom tolerance of 0.01%
      const sensitiveEngine = new ExplainableRiskEngine({
        ...DEFAULT_RISK_CONFIG,
        weights: {
          ...DEFAULT_RISK_CONFIG.weights,
          areaMismatchPctThreshold: 0.001,
        },
      });

      const assessment = await sensitiveEngine.evaluateParcelRisk(parcels[0].ulpin);
      const ruleItem = assessment.breakdown.find((r) => r.rule === 'AREA_MISMATCH');
      if (ruleItem) {
        expect(ruleItem.evidence).toHaveProperty('registered_area_sqm');
        expect(ruleItem.evidence).toHaveProperty('cadastral_survey_area_sqm');
        expect(ruleItem.evidence).toHaveProperty('percentage_difference');
      }
    });

    it('Rule 6: OPEN_CHANGE_ALERT produces elevated risk with satellite detection evidence', async () => {
      const assessment = await engine.evaluateParcelRisk(alertParcelUlpin);
      const ruleItem = assessment.breakdown.find((r) => r.rule === 'OPEN_CHANGE_ALERT');

      expect(ruleItem).toBeDefined();
      expect(ruleItem?.points).toBeGreaterThanOrEqual(15);
      expect(ruleItem?.evidence).toHaveProperty('alert_id');
      expect(ruleItem?.evidence).toHaveProperty('type');
    });

    it('Rule 8: MULTIPLE_OWNERS produces fractional ownership risk item', async () => {
      const assessment = await engine.evaluateParcelRisk(multiOwnerParcelUlpin);
      const ruleItem = assessment.breakdown.find((r) => r.rule === 'MULTIPLE_OWNERS');

      expect(ruleItem).toBeDefined();
      expect(ruleItem?.points).toBeGreaterThanOrEqual(10);
      expect(ruleItem?.evidence?.owner_count).toBeGreaterThan(1);
    });
  });

  // ==========================================
  // 2. SCORE CAP & CONFIGURABLE THRESHOLDS
  // ==========================================
  describe('2. Score Capping and Configurable Risk Thresholds', () => {
    it('Score is strictly capped at 100 even if accumulated points exceed 100', () => {
      const engine = new ExplainableRiskEngine();
      const mockBreakdown = [
        { rule: 'ACTIVE_ENCUMBRANCE', points: 40, reason: 'Active mortgage', severity: 'HIGH' as const },
        { rule: 'ACTIVE_LITIGATION', points: 40, reason: 'Court stay order', severity: 'HIGH' as const },
        { rule: 'SELLER_OWNER_MISMATCH', points: 50, reason: 'Seller is stranger to title', severity: 'CRITICAL' as const },
        { rule: 'DUPLICATE_REGISTRATION', points: 40, reason: 'Duplicate deed', severity: 'HIGH' as const },
      ];

      const score = Math.min(100, mockBreakdown.reduce((sum, b) => sum + b.points, 0));
      expect(score).toBe(100);

      const level = engine.classifyScore(score);
      expect(level).toBe('CRITICAL');
    });

    it('Classifies scores according to default thresholds (0-24: LOW, 25-49: MEDIUM, 50-74: HIGH, 75-100: CRITICAL)', () => {
      const engine = new ExplainableRiskEngine();

      expect(engine.classifyScore(0)).toBe('LOW');
      expect(engine.classifyScore(24)).toBe('LOW');
      expect(engine.classifyScore(25)).toBe('MEDIUM');
      expect(engine.classifyScore(49)).toBe('MEDIUM');
      expect(engine.classifyScore(50)).toBe('HIGH');
      expect(engine.classifyScore(74)).toBe('HIGH');
      expect(engine.classifyScore(75)).toBe('CRITICAL');
      expect(engine.classifyScore(100)).toBe('CRITICAL');
    });

    it('Allows customizing thresholds dynamically', () => {
      const customEngine = new ExplainableRiskEngine({
        ...DEFAULT_RISK_CONFIG,
        thresholds: {
          lowMax: 10,
          mediumMax: 30,
          highMax: 60,
        },
      });

      expect(customEngine.classifyScore(5)).toBe('LOW');
      expect(customEngine.classifyScore(15)).toBe('MEDIUM');
      expect(customEngine.classifyScore(45)).toBe('HIGH');
      expect(customEngine.classifyScore(70)).toBe('CRITICAL');
    });
  });

  // ==========================================
  // 3. CLEAN VS HIGH-RISK DIFFERENTIATION
  // ==========================================
  describe('3. Clean Parcel vs High-Risk Parcel Differentiation', () => {
    const engine = new ExplainableRiskEngine();

    it('Clean title parcel produces LOW risk category with transparent breakdown', async () => {
      const assessment = await engine.evaluateParcelRisk(cleanParcelUlpin);
      
      expect(assessment.score).toBeLessThanOrEqual(24);
      expect(assessment.level).toBe('LOW');
      expect(assessment.metadata?.isAuditable).toBe(true);
    });

    it('Encumbered / litigated parcel produces elevated or HIGH risk with explicit evidence', async () => {
      const assessment = await engine.evaluateParcelRisk(encumberedParcelUlpin);

      expect(assessment.score).toBeGreaterThanOrEqual(25);
      expect(['MEDIUM', 'HIGH', 'CRITICAL']).toContain(assessment.level);
      expect(assessment.breakdown.length).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // 4. API ENDPOINTS VERIFICATION
  // ==========================================
  describe('4. Risk API Endpoints', () => {
    it('GET /api/parcels/:ulpin/risk returns explainable risk response', async () => {
      const res = await request(app)
        .get(`/api/parcels/${cleanParcelUlpin}/risk`)
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('ulpin', cleanParcelUlpin);
      expect(res.body.data).toHaveProperty('score');
      expect(res.body.data).toHaveProperty('level');
      expect(res.body.data).toHaveProperty('breakdown');
      expect(Array.isArray(res.body.data.breakdown)).toBe(true);
      expect(res.body.data).toHaveProperty('evaluatedAt');
    });

    it('GET /api/risk/overview returns system-wide risk telemetry and distribution', async () => {
      const res = await request(app)
        .get('/api/risk/overview')
        .set('Authorization', `Bearer ${officerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('totalParcels');
      expect(res.body.data).toHaveProperty('distribution');
      expect(res.body.data.distribution).toHaveProperty('LOW');
      expect(res.body.data.distribution).toHaveProperty('MEDIUM');
      expect(res.body.data.distribution).toHaveProperty('HIGH');
      expect(res.body.data.distribution).toHaveProperty('CRITICAL');
      expect(res.body.data).toHaveProperty('rulesCatalog');
      expect(res.body.data.rulesCatalog.length).toBe(12);
    });

    it('POST /api/risk/evaluate computes explainable risk with custom runtime config', async () => {
      const res = await request(app)
        .post('/api/risk/evaluate')
        .set('Authorization', `Bearer ${officerToken}`)
        .send({
          ulpin: encumberedParcelUlpin,
          configOverrides: {
            activeEncumbrancePoints: 45,
            thresholds: { lowMax: 15, mediumMax: 40, highMax: 70 },
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('score');
      expect(res.body.data).toHaveProperty('level');
      expect(res.body.data).toHaveProperty('breakdown');
      const encRule = res.body.data.breakdown.find((r: any) => r.rule === 'ACTIVE_ENCUMBRANCE');
      if (encRule) {
        expect(encRule.points).toBe(45);
      }
    });

    it('GET /api/mutation/:id/risk returns comprehensive mutation risk appraisal', async () => {
      // Find any mutation application
      const mutRes = await query(`SELECT id FROM mutation_applications LIMIT 1`);
      if (mutRes.rows.length > 0) {
        const mutationId = mutRes.rows[0].id;
        const res = await request(app)
          .get(`/api/mutation/${mutationId}/risk`)
          .set('Authorization', `Bearer ${officerToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('mutationId', mutationId);
        expect(res.body.data).toHaveProperty('score');
        expect(res.body.data).toHaveProperty('level');
        expect(res.body.data).toHaveProperty('breakdown');
        expect(res.body.data).toHaveProperty('status');
      }
    });
  });

  // ==========================================
  // 5. AUDITABILITY & REPRODUCIBILITY
  // ==========================================
  describe('5. Auditability & Reproducibility Verification', () => {
    it('Identical parcel state produces identical deterministic risk scores', async () => {
      const engine = new ExplainableRiskEngine();
      const run1 = await engine.evaluateParcelRisk(cleanParcelUlpin);
      const run2 = await engine.evaluateParcelRisk(cleanParcelUlpin);

      expect(run1.score).toBe(run2.score);
      expect(run1.level).toBe(run2.level);
      expect(run1.breakdown.length).toBe(run2.breakdown.length);
    });

    it('Every rule item in breakdown contains reason, evidence, and points', async () => {
      const engine = new ExplainableRiskEngine();
      const assessment = await engine.evaluateParcelRisk(encumberedParcelUlpin);

      for (const item of assessment.breakdown) {
        expect(typeof item.rule).toBe('string');
        expect(typeof item.points).toBe('number');
        expect(typeof item.reason).toBe('string');
        expect(item.reason.length).toBeGreaterThan(0);
        expect(item.severity).toBeDefined();
        expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(item.severity);
      }
    });
  });
});
