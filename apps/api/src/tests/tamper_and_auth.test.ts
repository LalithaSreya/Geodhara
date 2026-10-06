import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { query } from '../config/db.js';
import { auditService } from '../modules/audit/audit.service.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import express from 'express';
import { errorHandler } from '../middleware/errorHandler.js';

describe('GeoDhara Security, Auth, RBAC & Tamper-Evident Audit Suite', () => {
  const app = createApp();

  let citizenToken: string;
  let officerToken: string;
  let adminToken: string;
  let citizenRefreshToken: string;

  beforeAll(async () => {
    const { runSeeds } = await import('../scripts/seed.js');
    await runSeeds();

    // 1. Login Citizen
    const citRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'citizen@geodhara.demo', password: 'DemoCitizen@123' });
    citizenToken = citRes.body.data.tokens.accessToken;
    citizenRefreshToken = citRes.body.data.tokens.refreshToken;

    // 2. Login Officer
    const offRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'officer@geodhara.demo', password: 'DemoOfficer@123' });
    officerToken = offRes.body.data.tokens.accessToken;

    // 3. Login Admin
    const admRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@geodhara.demo', password: 'DemoAdmin@123' });
    adminToken = admRes.body.data.tokens.accessToken;
  });

  describe('1. Authentication & Token Lifecycle', () => {
    it('POST /api/auth/login with valid credentials should return access & refresh tokens', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'citizen@geodhara.demo', password: 'DemoCitizen@123' });

      expect(res.status).toBe(200);
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();
      expect(res.body.data.user.role).toBe('citizen');
      expect(res.body.data.user.permissions).toContain('mutation:submit');
    });

    it('POST /api/auth/login with invalid password should return 401 INVALID_CREDENTIALS', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'citizen@geodhara.demo', password: 'WrongPassword' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('POST /api/auth/refresh should rotate refresh token and issue new access token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: citizenRefreshToken });

      expect(res.status).toBe(200);
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).not.toBe(citizenRefreshToken); // Rotated

      // Old refresh token must now be invalid
      const reusedRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: citizenRefreshToken });

      expect(reusedRes.status).toBe(401);
      expect(reusedRes.body.error.code).toBe('INVALID_REFRESH_TOKEN');
    });

    it('GET /api/auth/me should return current user profile and explicit permissions', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${officerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('officer@geodhara.demo');
      expect(res.body.data.role).toBe('officer');
      expect(res.body.data.permissions).toContain('mutation:approve_reject');
    });
  });

  describe('2. RBAC & Explicit Permission Enforcement', () => {
    it('Reject unauthenticated access to protected route with 401 UNAUTHORIZED', async () => {
      const res = await request(app).get('/api/audit');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('Reject citizen token trying to transition mutation (requires mutation:approve_reject) with 403', async () => {
      const mutList = await request(app)
        .get('/api/mutation')
        .set('Authorization', `Bearer ${officerToken}`);
      
      expect(mutList.status).toBe(200);
      const testApp = mutList.body.data[0];
      expect(testApp).toBeDefined();

      const res = await request(app)
        .post(`/api/mutation/${testApp.id}/transition`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ targetStatus: 'APPROVED', reason: 'Unauthorized citizen approval attempt' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('Allow officer with mutation:approve_reject to transition mutation', async () => {
      const mutList = await request(app)
        .get('/api/mutation')
        .set('Authorization', `Bearer ${officerToken}`);
      
      const autoValidatedApp = mutList.body.data.find((m: any) => m.status === 'AUTO_VALIDATED');
      expect(autoValidatedApp).toBeDefined();

      const res = await request(app)
        .post(`/api/mutation/${autoValidatedApp.id}/transition`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({ targetStatus: 'APPROVED', reason: 'Officer verified all title criteria' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('APPROVED');
    });
  });

  describe('3. Rate Limiting Protection', () => {
    it('Blocks requests exceeding limit with 429 TOO_MANY_REQUESTS', async () => {
      const rateApp = express();
      rateApp.use(express.json());
      rateApp.post(
        '/test-rl',
        rateLimiter({ windowSec: 10, maxRequests: 2, keyPrefix: 'test-rl', skipInTest: false }),
        (_req, res) => res.json({ ok: true })
      );
      rateApp.use(errorHandler);

      // Request 1: OK
      const r1 = await request(rateApp).post('/test-rl').send();
      expect(r1.status).toBe(200);

      // Request 2: OK
      const r2 = await request(rateApp).post('/test-rl').send();
      expect(r2.status).toBe(200);

      // Request 3: Blocked (429)
      const r3 = await request(rateApp).post('/test-rl').send();
      expect(r3.status).toBe(429);
      expect(r3.body.error.code).toBe('TOO_MANY_REQUESTS');
    });
  });

  describe('4. Tamper-Evident Cryptographic SHA-256 Hash Chain', () => {
    it('Initial audit chain passes mathematical integrity verification', async () => {
      const res = await request(app)
        .get('/api/audit/verify')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.valid).toBe(true);
      expect(res.body.data.firstBrokenRecord).toBeNull();
      expect(res.body.data.checkedRecords).toBeGreaterThan(0);
    });

    it('Adding new audit records preserves valid hash chain', async () => {
      await auditService.logAction({
        entityType: 'TEST_PARCEL',
        entityId: 'PARCEL-SEC-001',
        action: 'BOUNDARY_CORNER_SURVEYED',
        actorId: 'field@geodhara.demo',
        payload: { corner: 'NW', latitude: 17.5892, longitude: 78.4875, accuracy_m: 0.02 },
      });

      const res = await request(app)
        .get('/api/audit/verify')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.valid).toBe(true);
      expect(res.body.data.firstBrokenRecord).toBeNull();
    });

    it('TAMPER TEST: Modifying historical payload in database breaks chain and identifies broken record', async () => {
      // 1. Fetch an existing middle record from audit_log
      const entriesRes = await query('SELECT * FROM audit_log ORDER BY seq ASC');
      expect(entriesRes.rows.length).toBeGreaterThanOrEqual(3);

      const targetIndex = 2; // 3rd record
      const targetEntry = entriesRes.rows[targetIndex];

      // 2. Tamper with the payload directly in the database (malicious actor altering land share)
      await query(
        `UPDATE audit_log 
         SET payload_json = '{"tampered": true, "unauthorized_ownership_transfer": "100%"}'::jsonb 
         WHERE id = $1`,
        [targetEntry.id]
      );

      // 3. Run verification
      const verifyRes = await request(app)
        .get('/api/audit/verify')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.valid).toBe(false);
      expect(verifyRes.body.data.firstBrokenRecord).toBe(targetIndex + 1); // Record number is 1-indexed
      expect(verifyRes.body.data.violations.length).toBeGreaterThan(0);

      // 4. Restore database state by re-running seed to leave database clean
      const { runSeeds } = await import('../scripts/seed.js');
      await runSeeds();
    });
  });
});
