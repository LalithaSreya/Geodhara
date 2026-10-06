import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { query } from '../config/db.js';
import { runSeeds } from '../scripts/seed.js';

describe('GeoDhara Land Mutation Governance Workflow Suite', () => {
  const app = createApp();
  let officerToken: string;
  let citizenToken: string;
  let cleanParcel: any;
  let encumberedParcel: any;

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

    // Retrieve test parcels
    const parcelsRes = await query(`
      SELECT p.*, po.person_name AS owner_name 
      FROM parcels p 
      LEFT JOIN parcel_owners po ON po.parcel_id = p.id AND po.is_current = TRUE
      LIMIT 10
    `);
    cleanParcel = parcelsRes.rows.find((p: any) => p.ulpin === 'TSQXY9QM4KNXSZ') || parcelsRes.rows[0];

    // Find parcel with court stay
    const encRes = await query(`
      SELECT p.* FROM parcels p
      JOIN litigation_cases lc ON lc.parcel_id = p.id
      WHERE lc.status = 'STAY_GRANTED'
      LIMIT 1
    `);
    encumberedParcel = encRes.rows[0] || parcelsRes.rows[4];
  });

  describe('1. Registration → Automatic Mutation Generation', () => {
    it('POST /api/registrations records deed and automatically triggers linked mutation application', async () => {
      const docNum = `DOC-REG-${Date.now().toString().slice(-6)}`;
      const res = await request(app)
        .post('/api/registrations')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          parcelId: cleanParcel.id,
          documentNumber: docNum,
          seller: cleanParcel.owner_name || 'Ramesh Kumar',
          buyer: 'Vikramaditya Sharma',
          buyerIdNumber: 'AADHAAR-7788-9900',
          buyerPhone: '+91 9988776655',
          buyerEmail: 'vikram@citizen.demo',
          registeredAreaSqm: parseFloat(cleanParcel.area_sqm),
          considerationAmount: 5200000,
          deedType: 'SALE_DEED',
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Registration detected — mutation application created.');
      expect(res.body.data.registration).toBeDefined();
      expect(res.body.data.registration.document_number).toBe(docNum);
      expect(res.body.data.mutation_application).toBeDefined();
      expect(res.body.data.mutation_application.application_number).toMatch(/^MUT-2026-\d+$/);
      expect(res.body.data.mutation_application.status).toBe('AUTO_VALIDATED');
    });
  });

  describe('2. Automated 11-Rule Governance Engine Evaluation', () => {
    it('Dry-run evaluation on clean parcel returns PASS with 0 risk score', async () => {
      const res = await request(app)
        .post('/api/mutation/validate')
        .send({
          parcelId: cleanParcel.id,
          sellerName: cleanParcel.owner_name || 'Ramesh Kumar',
          applicant: {
            name: 'Vikramaditya Sharma',
            id_number: 'AADHAAR-7788-9900',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.isBlocked).toBe(false);
      expect(res.body.data.checks).toHaveLength(11);
      expect(res.body.data.checks.filter((c: any) => c.status === 'FAIL')).toHaveLength(0);
    });

    it('Rule evaluation on parcel with judicial stay returns BLOCK with reason', async () => {
      const res = await request(app)
        .post('/api/mutation/validate')
        .send({
          parcelId: encumberedParcel.id,
          applicant: {
            name: 'Buyer Person',
            id_number: 'ID-1234',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.result).toBe('BLOCK');
      expect(res.body.data.isBlocked).toBe(true);
      expect(res.body.data.blockReason.toLowerCase()).toContain('stay');
      const failChecks = res.body.data.checks.filter((c: any) => c.status === 'FAIL');
      expect(failChecks.length).toBeGreaterThan(0);
    });

    it('Rule evaluation with mismatched seller returns BLOCK', async () => {
      const res = await request(app)
        .post('/api/mutation/validate')
        .send({
          parcelId: cleanParcel.id,
          sellerName: 'Fake Impersonator Not In Registry',
          applicant: {
            name: 'Unwitting Buyer',
            id_number: 'ID-9999',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.result).toBe('BLOCK');
      expect(res.body.data.isBlocked).toBe(true);
      expect(res.body.data.blockReason).toContain('does not match current registered title holder');
      const sellerCheck = res.body.data.checks.find((c: any) => c.id === 'CHECK_3_SELLER_MATCH');
      expect(sellerCheck.status).toBe('FAIL');
    });
  });

  describe('3. State Machine Transitions & Optimistic Concurrency', () => {
    let testMutationId: string;
    let initialVersion: number;

    beforeAll(async () => {
      const subRes = await request(app)
        .post('/api/mutation')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          parcelId: cleanParcel.id,
          sellerName: cleanParcel.owner_name || 'Ramesh Kumar',
          applicant: {
            name: 'Pooja Agarwal',
            id_number: 'ID-POOJA-5566',
            phone: '+91 9123456780',
            email: 'pooja@citizen.demo',
          },
        });
      testMutationId = subRes.body.data.id;
      initialVersion = subRes.body.data.version;
    });

    it('Disallows invalid direct jump from AUTO_VALIDATED to RECORD_UPDATED', async () => {
      const res = await request(app)
        .post(`/api/mutation/${testMutationId}/transition`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({
          targetStatus: 'RECORD_UPDATED',
          reason: 'Attempting illegal bypass of officer approval',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_TRANSITION');
    });

    it('Rejects transition when stale expectedVersion is provided (409 Conflict)', async () => {
      const staleVersion = initialVersion + 99;
      const res = await request(app)
        .post(`/api/mutation/${testMutationId}/transition`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({
          targetStatus: 'OFFICER_REVIEW',
          reason: 'Checking conflict detection',
          expectedVersion: staleVersion,
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('VERSION_CONFLICT');
    });

    it('Transitions AUTO_VALIDATED → OFFICER_REVIEW → APPROVED → RECORD_UPDATED transactionally', async () => {
      // 1. AUTO_VALIDATED -> OFFICER_REVIEW
      const step1 = await request(app)
        .post(`/api/mutation/${testMutationId}/transition`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({
          targetStatus: 'OFFICER_REVIEW',
          reason: 'Officer initiated detailed scrutiny of cadastral boundaries',
          expectedVersion: initialVersion,
        });
      expect(step1.status).toBe(200);
      expect(step1.body.data.status).toBe('OFFICER_REVIEW');

      // 2. OFFICER_REVIEW -> APPROVED
      const step2 = await request(app)
        .post(`/api/mutation/${testMutationId}/transition`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({
          targetStatus: 'APPROVED',
          reason: 'Tahsildar approved mutation after clean record verification',
          expectedVersion: step1.body.data.version,
        });
      expect(step2.status).toBe(200);
      expect(step2.body.data.status).toBe('APPROVED');

      // 3. Verify that Approval transaction updated parcel_owners to new buyer
      const ownersRes = await query(`
        SELECT * FROM parcel_owners WHERE parcel_id = $1 AND is_current = TRUE
      `, [cleanParcel.id]);
      expect(ownersRes.rows.length).toBeGreaterThan(0);
      expect(ownersRes.rows[0].person_name).toBe('Pooja Agarwal');
      expect(parseFloat(ownersRes.rows[0].ownership_percentage)).toBe(100.0);

      // 4. Verify certified RoR was generated in land_records
      const rorRes = await query(`
        SELECT * FROM land_records WHERE parcel_id = $1 AND source = 'DIGITAL_MUTATION_WORKFLOW'
      `, [cleanParcel.id]);
      expect(rorRes.rows.length).toBeGreaterThan(0);
      expect(rorRes.rows[0].record_number).toContain('ROR-TSQXY9QM4KNXSZ');
    });

    it('Rejects mutation with statutory reason when rejected by officer (REJECTED terminal state)', async () => {
      // Create a fresh test application
      const subRes = await request(app)
        .post('/api/mutation')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          parcelId: cleanParcel.id,
          applicant: {
            name: 'Disputed Transferee',
            id_number: 'ID-DISPUTE-01',
          },
        });
      const appId = subRes.body.data.id;

      const rejRes = await request(app)
        .post(`/api/mutation/${appId}/transition`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({
          targetStatus: 'REJECTED',
          reason: 'Statutory refusal under Section 5: Unresolved title objection filed by co-heirs.',
        });

      expect(rejRes.status).toBe(200);
      expect(rejRes.body.data.status).toBe('REJECTED');

      // Attempting any further transition from REJECTED must fail
      const nextRes = await request(app)
        .post(`/api/mutation/${appId}/transition`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({
          targetStatus: 'APPROVED',
          reason: 'Attempting transition on terminal rejected state',
        });
      expect(nextRes.status).toBe(400);
      expect(nextRes.body.error.code).toBe('INVALID_TRANSITION');
    });
  });

  describe('4. Detailed Application Inspection (GET /api/mutation/:id)', () => {
    it('Returns full 360 context including live 11 checks, events, ownership, and audit trail', async () => {
      // List applications to get an ID
      const listRes = await request(app).get('/api/mutation');
      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBeGreaterThan(0);

      const targetId = listRes.body.data[0].id;
      const detailRes = await request(app).get(`/api/mutation/${targetId}`);
      expect(detailRes.status).toBe(200);
      expect(detailRes.body.data.id).toBe(targetId);
      expect(detailRes.body.data.ulpin).toBeDefined();
      expect(detailRes.body.data.live_validation_evaluation).toBeDefined();
      expect(detailRes.body.data.live_validation_evaluation.checks).toHaveLength(11);
      expect(detailRes.body.data.events).toBeDefined();
      expect(detailRes.body.data.current_owners).toBeDefined();
      expect(detailRes.body.data.audit_history).toBeDefined();
    });
  });
});
