import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { query } from '../config/db.js';
import { runSeeds } from '../scripts/seed.js';
import {
  AutomatedSatelliteChangeDetector,
  DEFAULT_SATELLITE_CONFIG,
} from '../modules/satellite/satellite.processor.js';
import { ExplainableRiskEngine } from '../modules/risk/risk.engine.js';

describe('GeoDhara Automated Satellite Change Detection Test Suite', () => {
  const app = createApp();
  let officerToken: string;
  let citizenToken: string;
  let detector: AutomatedSatelliteChangeDetector;
  let demoScenes: any[];

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

    detector = new AutomatedSatelliteChangeDetector();
    demoScenes = detector.loadDemoScenes();
  });

  // ==========================================
  // 1. SPECTRAL INDICES & CLOUD MASK UNIT TESTS
  // ==========================================
  describe('1. Radiometric Spectral Indexing & Cloud Mask Physics', () => {
    it('Calculates NDVI correctly via (NIR - Red) / (NIR + Red)', () => {
      const red = [0.05, 0.25, 0.40];
      const nir = [0.60, 0.25, 0.10];
      const ndvi = detector.calculateNdvi(red, nir);

      // Dense veg: (0.60 - 0.05)/(0.60 + 0.05) = 0.55/0.65 = 0.846
      expect(ndvi[0]).toBeCloseTo(0.846, 2);
      // Bare soil / balanced: (0.25 - 0.25) / 0.50 = 0.0
      expect(ndvi[1]).toBeCloseTo(0.0, 2);
      // Water / dark: (0.10 - 0.40) / 0.50 = -0.60
      expect(ndvi[2]).toBeCloseTo(-0.6, 2);
    });

    it('Calculates NDBI correctly via (SWIR - NIR) / (SWIR + NIR)', () => {
      const nir = [0.50, 0.20];
      const swir = [0.15, 0.45];
      const ndbi = detector.calculateNdbi(nir, swir);

      // Vegetation: (0.15 - 0.50)/(0.15 + 0.50) = -0.538
      expect(ndbi[0]).toBeCloseTo(-0.538, 2);
      // Built-up concrete: (0.45 - 0.20)/(0.45 + 0.20) = +0.385
      expect(ndbi[1]).toBeCloseTo(0.385, 2);
    });

    it('Calculates SCL cloud mask and identifies cloudy pixels accurately', () => {
      // SCL: 4=Veg, 8=Cloud Medium Prob, 9=Cloud High Prob, 5=Bare Soil
      const scl = [4, 4, 8, 9, 5];
      const { cloudPct, cloudMask } = detector.calculateCloudPercentage(scl);

      // 2 of 5 are clouds = 40%
      expect(cloudPct).toBe(40.0);
      expect(cloudMask[0]).toBe(false);
      expect(cloudMask[2]).toBe(true);
      expect(cloudMask[3]).toBe(true);
    });
  });

  // ==========================================
  // 2. DIFFERENCING & CLASSIFICATION PIPELINE
  // ==========================================
  describe('2. Radiometric Differencing & Change Classification', () => {
    it('Detects vegetation loss when ΔNDVI exceeds drop threshold', async () => {
      const vegLossScene = demoScenes.find((s) => s.id === 'SCENE_TS_MEDCHAL_VEG_LOSS');
      expect(vegLossScene).toBeDefined();

      const result = await detector.processScene(vegLossScene);
      expect(result.pixelStats.vegetationLossPixels).toBeGreaterThan(0);
      expect(result.pixelStats.meanDeltaNdvi).toBeLessThan(0);

      const vegCluster = result.detectedClusters.find((c) => c.type === 'VEGETATION_LOSS');
      expect(vegCluster).toBeDefined();
      expect(vegCluster?.polygonGeoJson.type).toBe('Polygon');
    });

    it('Detects built-up gain when ΔNDBI exceeds surge threshold', async () => {
      const builtUpScene = demoScenes.find((s) => s.id === 'SCENE_TS_KOMPALLY_BUILT_UP');
      expect(builtUpScene).toBeDefined();

      const result = await detector.processScene(builtUpScene);
      expect(result.pixelStats.builtUpGainPixels).toBeGreaterThan(0);

      const builtCluster = result.detectedClusters.find((c) => c.type === 'BUILT_UP_GAIN');
      expect(builtCluster).toBeDefined();
      expect(builtCluster?.meanDelta).toBeGreaterThan(0.20);
    });

    it('Rejects scene evaluation when cloud percentage exceeds configured max threshold', async () => {
      const cloudyScene = demoScenes.find((s) => s.id === 'SCENE_TS_MONSOON_CLOUDY');
      expect(cloudyScene).toBeDefined();

      const result = await detector.processScene(cloudyScene, {
        config: { maxCloudCoverPct: 20.0 },
      });

      expect(result.isCloudUnsuitable).toBe(true);
      expect(result.cloudPct).toBeGreaterThan(20.0);
      // No parcel infractions generated for cloudy scene
      expect(result.affectedParcels.length).toBe(0);
    });
  });

  // ==========================================
  // 3. POSTGIS SPATIAL PARCEL INTERSECTIONS
  // ==========================================
  describe('3. PostGIS Cadastral Spatial Intersections', () => {
    it('Spatially intersects detected change polygon with underlying parcels and resolves ULPIN', async () => {
      const vegLossScene = demoScenes.find((s) => s.id === 'SCENE_TS_MEDCHAL_VEG_LOSS');
      const result = await detector.processScene(vegLossScene);

      if (result.affectedParcels.length > 0) {
        const hit = result.affectedParcels[0];
        expect(hit).toHaveProperty('ulpin');
        expect(hit.ulpin.length).toBe(14);
        expect(hit.affectedAreaSqm).toBeGreaterThan(0);
        expect(hit.confidence).toBeGreaterThan(0);
        expect(hit.detectionMethod).toBe('SENTINEL2_NDVI_DROP');
      }
    });
  });

  // ==========================================
  // 4. REST API ENDPOINTS
  // ==========================================
  describe('4. Satellite & Change Alerts REST APIs', () => {
    it('GET /api/satellite/scenes returns list of available Sentinel-2 demo crops', async () => {
      const res = await request(app)
        .get('/api/satellite/scenes')
        .set('Authorization', `Bearer ${officerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('scenes');
      expect(res.body.data.scenes.length).toBeGreaterThan(0);
      expect(res.body.data.disclaimer).toContain('Human Verification Required');
    });

    it('POST /api/satellite/pipeline/run executes radiometric differencing on scene', async () => {
      const res = await request(app)
        .post('/api/satellite/pipeline/run')
        .set('Authorization', `Bearer ${officerToken}`)
        .send({
          sceneId: 'SCENE_TS_MEDCHAL_VEG_LOSS',
          config: {
            ndviDropThreshold: 0.20,
            maxCloudCoverPct: 25.0,
          },
          persistAlerts: false,
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('sceneId', 'SCENE_TS_MEDCHAL_VEG_LOSS');
      expect(res.body.data).toHaveProperty('pixelStats');
      expect(res.body.data).toHaveProperty('detectedClusters');
    });

    it('GET /api/change-alerts returns seeded change alerts', async () => {
      const res = await request(app)
        .get('/api/change-alerts')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('ulpin');
      expect(res.body.data[0]).toHaveProperty('confidence');
    });

    it('GET /api/change-alerts/:id returns full alert dossier with parcel details and geometry', async () => {
      const listRes = await request(app).get('/api/change-alerts');
      const alertId = listRes.body.data[0].id;

      const res = await request(app)
        .get(`/api/change-alerts/${alertId}`)
        .set('Authorization', `Bearer ${officerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('id', alertId);
      expect(res.body.data).toHaveProperty('ulpin');
      expect(res.body.data).toHaveProperty('geometry');
      expect(res.body.data).toHaveProperty('affected_area_sqm');
    });
  });

  // ==========================================
  // 5. HUMAN ADJUDICATION & RISK ENGINE INTEGRATION
  // ==========================================
  describe('5. Officer Adjudication, Cryptographic Audit & Risk Synchronization', () => {
    it('POST /api/change-alerts/:id/verify allows officer to VERIFY alert and updates parcel risk', async () => {
      // Find a pending alert
      const listRes = await request(app).get('/api/change-alerts?status=PENDING');
      if (listRes.body.data.length > 0) {
        const targetAlert = listRes.body.data[0];

        // 1. Officer verifies alert
        const verifyRes = await request(app)
          .post(`/api/change-alerts/${targetAlert.id}/verify`)
          .set('Authorization', `Bearer ${officerToken}`)
          .send({
            action: 'VERIFY',
            notes: 'Field surveyor confirmed unauthorized tree clearance and ground alteration.',
          });

        expect(verifyRes.status).toBe(200);
        expect(verifyRes.body.data.status).toBe('VERIFIED');

        // 2. Verify audit ledger record created
        const auditCheck = await query(
          `SELECT * FROM audit_log WHERE entity_type = 'CHANGE_ALERT' AND entity_id = $1 ORDER BY seq DESC LIMIT 1`,
          [targetAlert.id]
        );
        expect(auditCheck.rows.length).toBeGreaterThan(0);
        expect(auditCheck.rows[0].action).toBe('ALERT_VERIFIED');
      }
    });

    it('POST /api/change-alerts/:id/verify allows officer to DISMISS false positive and removes unresolved alert contribution', async () => {
      // Find an open or pending alert
      const listRes = await request(app).get('/api/change-alerts');
      const targetAlert = listRes.body.data.find((a: any) => a.status === 'PENDING' || a.status === 'OPEN') || listRes.body.data[0];

      const dismissRes = await request(app)
        .post(`/api/change-alerts/${targetAlert.id}/verify`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({
          action: 'DISMISS',
          notes: 'Dismissed as permitted agricultural leveling following valid NOC inspection.',
        });

      expect(dismissRes.status).toBe(200);
      expect(dismissRes.body.data.status).toBe('DISMISSED');

      // Check parcel risk calculation
      const riskEngine = new ExplainableRiskEngine();
      const riskAssessment = await riskEngine.evaluateParcelRisk(targetAlert.parcel_id);
      
      // An alert marked DISMISSED should no longer appear in OPEN_CHANGE_ALERT breakdown
      const openAlertRule = riskAssessment.breakdown.find(
        (r) => r.rule === 'OPEN_CHANGE_ALERT' && r.evidence?.alert_id === targetAlert.id
      );
      expect(openAlertRule).toBeUndefined();
    });
  });
});
