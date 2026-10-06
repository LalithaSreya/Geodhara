import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { pool } from '../config/db.js';
import { initRedis, getCache, setCache } from '../config/redis.js';
import { TelanganaStateAdapter, KarnatakaStateAdapter } from '../modules/adapters/stateAdapters.js';

describe('Prompt 3: ULPIN-Centric Unified Parcel Intelligence & GIS Verification', () => {
  let app: any;

  beforeAll(async () => {
    app = createApp();
    await initRedis();
  });

  afterAll(async () => {
    await pool.end();
  });

  // ===========================================================================
  // 1. ULPIN RESOLUTION (GET /api/ulpin/:ulpin)
  // ===========================================================================
  describe('1. ULPIN Resolution & 360° Unified Intelligence', () => {
    it('rejects invalid ULPIN format with 400 (not 14 alphanumeric chars)', async () => {
      const res = await request(app).get('/api/ulpin/INVALID123');
      expect(res.status).toBe(400);
      expect(['VALIDATION_ERROR', 'INVALID_ULPIN_FORMAT']).toContain(res.body.error.code);
    });

    it('returns 404 for non-existent 14-char ULPIN', async () => {
      const res = await request(app).get('/api/ulpin/TS999999999999');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('ULPIN_NOT_FOUND');
    });

    it('successfully resolves existing ULPIN with full unified digital intelligence dossier', async () => {
      // TSQXY9QM4KNXSZ is a seeded Telangana parcel
      const res = await request(app).get('/api/ulpin/TSQXY9QM4KNXSZ');
      expect(res.status).toBe(200);
      const data = res.body.data;

      // 1. Identity & Location
      expect(data.ulpin).toBe('TSQXY9QM4KNXSZ');
      expect(data.state_code).toBe('TS');
      expect(data.state_name).toBe('Telangana');
      expect(data.location.village).toBeDefined();
      expect(data.location.mandal).toBeDefined();
      expect(data.location.district).toBe('Medchal-Malkajgiri');
      expect(data.location.legacy_survey_no).toBe('101/1');

      // 2. Geometry & PostGIS Area
      expect(data.spatial.recorded_area_sqm).toBeGreaterThan(0);
      expect(data.spatial.geodesic_area_sqm).toBeGreaterThan(0);
      expect(data.spatial.geometry.type).toBe('Polygon');
      expect(Array.isArray(data.spatial.geometry.coordinates)).toBe(true);

      // 3. Domain Model Sub-ledgers
      expect(Array.isArray(data.current_owners)).toBe(true);
      expect(data.current_owners.length).toBeGreaterThan(0);
      expect(Array.isArray(data.land_records)).toBe(true);
      expect(Array.isArray(data.registrations)).toBe(true);
      expect(Array.isArray(data.encumbrances)).toBe(true);
      expect(Array.isArray(data.litigation)).toBe(true);
      expect(Array.isArray(data.land_use)).toBe(true);
      expect(Array.isArray(data.mutation_applications)).toBe(true);
      expect(Array.isArray(data.satellite_change_alerts)).toBe(true);
      expect(Array.isArray(data.legacy_mappings)).toBe(true);
      expect(Array.isArray(data.audit_summary)).toBe(true);

      // 4. Risk Assessment
      expect(data.risk_assessment).toBeDefined();
      expect(typeof data.risk_assessment.score).toBe('number');
      expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(data.risk_assessment.category);
    });

    it('correctly reports encumbered parcel with elevated risk score', async () => {
      // TSZQ5STGR65JMU has active SBI Mortgage
      const res = await request(app).get('/api/ulpin/TSZQ5STGR65JMU');
      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.encumbrances.length).toBeGreaterThan(0);
      expect(data.encumbrances[0].type).toBe('MORTGAGE');
      expect(data.risk_assessment.score).toBeGreaterThanOrEqual(30);
    });

    it('correctly reports litigated parcel with active stay order', async () => {
      // TSSMSR2Z03QTQD has active court stay in Medchal
      const res = await request(app).get('/api/ulpin/TSSMSR2Z03QTQD');
      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.litigation.length).toBeGreaterThan(0);
      expect(data.litigation[0].status).toBe('STAY_GRANTED');
      expect(data.risk_assessment.score).toBeGreaterThanOrEqual(45);
    });
  });

  // ===========================================================================
  // 2. MULTI-PARAMETER & CROSS-STATE SEARCH (GET /api/parcels/search)
  // ===========================================================================
  describe('2. Legacy Search & Cross-State Search', () => {
    it('searches by ULPIN', async () => {
      const res = await request(app).get('/api/parcels/search?ulpin=TSQXY9QM4KNXSZ');
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
      expect(res.body.results[0].ulpin).toBe('TSQXY9QM4KNXSZ');
    });

    it('searches by legacy survey number across states', async () => {
      // Telangana survey number 101/1
      const resTS = await request(app).get('/api/parcels/search?legacy_survey_no=101/1&state=TS');
      expect(resTS.status).toBe(200);
      expect(resTS.body.total).toBeGreaterThan(0);
      expect(resTS.body.results.some((r: any) => r.legacy_survey_no === '101/1')).toBe(true);

      // Karnataka survey number Sy-87/1
      const resKA = await request(app).get('/api/parcels/search?legacy_survey_no=Sy-87/1');
      expect(resKA.status).toBe(200);
      expect(resKA.body.total).toBeGreaterThan(0);
      expect(resKA.body.results[0].state_code).toBe('KA');
    });

    it('searches by owner name', async () => {
      const res = await request(app).get('/api/parcels/search?owner_name=Ramesh');
      expect(res.status).toBe(200);
      expect(res.body.total).toBeGreaterThan(0);
      expect(res.body.results.some((r: any) => r.current_owners.some((o: any) => o.name.includes('Ramesh')))).toBe(true);
    });

    it('searches by district and village', async () => {
      const res = await request(app).get('/api/parcels/search?district=Medchal-Malkajgiri&village=Medchal');
      expect(res.status).toBe(200);
      expect(res.body.total).toBeGreaterThan(0);
      expect(res.body.results.every((r: any) => r.district === 'Medchal-Malkajgiri')).toBe(true);
    });

    it('cross-state search seamlessly returns parcels from both TS and KA without state friction', async () => {
      const res = await request(app).get('/api/parcels/search?limit=64');
      expect(res.status).toBe(200);
      expect(res.body.cross_state_search).toBe(true);
      const states = new Set(res.body.results.map((r: any) => r.state_code));
      expect(states.has('TS')).toBe(true);
      expect(states.has('KA')).toBe(true);
    });
  });

  // ===========================================================================
  // 3. LEGACY → ULPIN RESOLUTION (GET /api/legacy/resolve)
  // ===========================================================================
  describe('3. Legacy Identifier → Mapped ULPIN → Unified Parcel Flow', () => {
    it('resolves legacy identifier to ULPIN and unified parcel', async () => {
      const res = await request(app).get('/api/legacy/resolve?legacy_identifier=TS-LEG-1000&state=TS');
      expect(res.status).toBe(200);
      expect(res.body.total_matches).toBeGreaterThan(0);

      const result = res.body.results[0];
      expect(result.flow).toBeDefined();

      // Step 1: Legacy Identifier
      expect(result.flow.step_1_legacy_identifier.identifier).toBe('TS-LEG-1000');
      expect(result.flow.step_1_legacy_identifier.survey_no).toBe('101/1');
      expect(result.flow.step_1_legacy_identifier.source_system).toBe('Dharani Land Portal');

      // Step 2: Mapped ULPIN
      expect(result.flow.step_2_mapped_ulpin.ulpin).toBe('TSQXY9QM4KNXSZ');
      expect(result.flow.step_2_mapped_ulpin.mapping_confidence).toBe(1.0);
      expect(result.flow.step_2_mapped_ulpin.match_status).toBe('MATCHED');

      // Step 3: Unified Parcel
      expect(result.flow.step_3_unified_parcel.ulpin).toBe('TSQXY9QM4KNXSZ');
      expect(result.flow.step_3_unified_parcel.state_name).toBe('Telangana');
      expect(result.flow.step_3_unified_parcel.recorded_area_sqm).toBeGreaterThan(0);
    });

    it('correctly identifies legacy mismatch flagged records', async () => {
      const res = await request(app).get('/api/legacy/resolve?legacy_identifier=TS-LEG-1010');
      expect(res.status).toBe(200);
      const result = res.body.results[0];
      expect(result.flow.step_2_mapped_ulpin.match_status).toBe('MISMATCH_FLAGGED');
      expect(result.flow.step_2_mapped_ulpin.is_ambiguous).toBe(true);
      expect(result.flow.step_2_mapped_ulpin.mapping_confidence).toBeLessThan(1.0);
    });
  });

  // ===========================================================================
  // 4. MOCK STATE ADAPTERS (Telangana & Karnataka)
  // ===========================================================================
  describe('4. Mock State Adapters (Dharani & Bhoomi RTC)', () => {
    it('TelanganaStateAdapter returns Telangana schema and normalizes to GeoDhara schema', async () => {
      const raw = await TelanganaStateAdapter.fetchRecord('101/1');
      expect(raw).not.toBeNull();
      expect(raw?.survey_no).toBe('101/1');
      expect(raw?.pattadar_passbook_no).toBeDefined();
      expect(raw?.extent_acres_guntas).toBeDefined();
      expect(raw?.nature_of_land).toBeDefined();
      expect(raw?.sro_office).toBeDefined();

      const normalized = TelanganaStateAdapter.normalize(raw!, 'TSQXY9QM4KNXSZ');
      expect(normalized.is_mock_adapter).toBe(true);
      expect(normalized.disclaimer).toContain('Mock State Adapter');
      expect(normalized.standard_ulpin).toBe('TSQXY9QM4KNXSZ');
      expect(normalized.state_code).toBe('TS');
      expect(normalized.normalized_survey_no).toBe('101/1');
      expect(normalized.normalized_area_sqm).toBeGreaterThan(0);
      expect(normalized.normalized_owners.length).toBeGreaterThan(0);
    });

    it('KarnatakaStateAdapter returns Karnataka schema and normalizes to GeoDhara schema', async () => {
      const raw = await KarnatakaStateAdapter.fetchRecord('Sy-87/1');
      expect(raw).not.toBeNull();
      expect(raw?.survey_number).toBe('87');
      expect(raw?.hissa_no).toBe('1');
      expect(raw?.rtc_number).toBeDefined();
      expect(raw?.mr_number).toBeDefined();
      expect(raw?.area_acres_guntas).toBeDefined();
      expect(raw?.taluk_office).toBeDefined();

      const normalized = KarnatakaStateAdapter.normalize(raw!, 'KAQMWVSBJHWXC7');
      expect(normalized.is_mock_adapter).toBe(true);
      expect(normalized.disclaimer).toContain('Mock State Adapter');
      expect(normalized.standard_ulpin).toBe('KAQMWVSBJHWXC7');
      expect(normalized.state_code).toBe('KA');
      expect(normalized.normalized_survey_no).toBe('Sy-87/1');
      expect(normalized.normalized_area_sqm).toBeGreaterThan(0);
    });

    it('GET /api/adapters/fetch exposes mock adapter resolution with raw vs normalized schemas', async () => {
      const res = await request(app).get('/api/adapters/fetch?state=TS&identifier=101/1');
      expect(res.status).toBe(200);
      expect(res.body.mock_adapter).toContain('Dharani');
      expect(res.body.raw_state_schema).toBeDefined();
      expect(res.body.normalized_geodhara_schema).toBeDefined();
      expect(res.body.normalized_geodhara_schema.standard_ulpin).toBe('TSQXY9QM4KNXSZ');
    });
  });

  // ===========================================================================
  // 5. GIS APIs & SPATIAL QUERIES
  // ===========================================================================
  describe('5. GIS APIs & PostGIS Spatial Queries', () => {
    it('GET /api/parcels/geojson returns valid GeoJSON FeatureCollection', async () => {
      const res = await request(app).get('/api/parcels/geojson');
      expect(res.status).toBe(200);
      expect(res.body.type).toBe('FeatureCollection');
      expect(Array.isArray(res.body.features)).toBe(true);
      expect(res.body.features.length).toBeGreaterThan(0);

      const feature = res.body.features[0];
      expect(feature.type).toBe('Feature');
      expect(feature.geometry.type).toBe('Polygon');
      expect(feature.properties.ulpin).toBeDefined();
      expect(feature.properties.risk_level).toBeDefined();
    });

    it('GET /api/parcels/states/geojson returns state boundary polygons for Telangana & Karnataka', async () => {
      const res = await request(app).get('/api/parcels/states/geojson');
      expect(res.status).toBe(200);
      expect(res.body.type).toBe('FeatureCollection');
      expect(res.body.features.length).toBe(2);

      const codes = res.body.features.map((f: any) => f.properties.code);
      expect(codes).toContain('TS');
      expect(codes).toContain('KA');
    });

    it('GET /api/parcels/:ulpin/geojson returns single GeoJSON feature', async () => {
      const res = await request(app).get('/api/parcels/TSQXY9QM4KNXSZ/geojson');
      expect(res.status).toBe(200);
      expect(res.body.type).toBe('Feature');
      expect(res.body.properties.ulpin).toBe('TSQXY9QM4KNXSZ');
      expect(res.body.geometry.type).toBe('Polygon');
    });

    it('GET /api/parcels/:ulpin/neighbours detects spatially adjacent/touching parcels', async () => {
      const res = await request(app).get('/api/parcels/TSQXY9QM4KNXSZ/neighbours');
      expect(res.status).toBe(200);
      expect(res.body.data.target_ulpin).toBe('TSQXY9QM4KNXSZ');
      expect(Array.isArray(res.body.data.neighbours)).toBe(true);
      expect(res.body.data.neighbour_count).toBeGreaterThan(0);
    });

    it('GET /api/parcels/spatial/point resolves coordinate to containing parcel', async () => {
      // Medchal sample centroid coordinate for TSQXY9QM4KNXSZ
      const res = await request(app).get('/api/parcels/spatial/point?lat=17.588055&lng=78.488525');
      expect(res.status).toBe(200);
      expect(res.body.found).toBe(true);
      expect(res.body.parcel.state_code).toBe('TS');
      expect(res.body.parcel.ulpin).toBe('TSQXY9QM4KNXSZ');
    });

    it('GET /api/parcels/spatial/nearby retrieves parcels within distance radius', async () => {
      const res = await request(app).get('/api/parcels/spatial/nearby?lat=17.588&lng=78.488&radiusMeters=2000');
      expect(res.status).toBe(200);
      expect(res.body.count).toBeGreaterThan(0);
      expect(res.body.parcels[0].distance_meters).toBeDefined();
    });
  });

  // ===========================================================================
  // 6. REDIS CACHE & INVALIDATION
  // ===========================================================================
  describe('6. Redis Cache & Cache Invalidation', () => {
    it('caches ULPIN resolution in Redis', async () => {
      // 1. Clear any existing cache
      const cacheKey = 'geodhara:ulpin:TSQXY9QM4KNXSZ';
      await setCache(cacheKey, '', 1);

      // 2. First call populates cache
      const res1 = await request(app).get('/api/ulpin/TSQXY9QM4KNXSZ');
      expect(res1.status).toBe(200);

      // 3. Verify Redis has the key
      const cached = await getCache(cacheKey);
      expect(cached).not.toBeNull();
      const parsed = JSON.parse(cached!);
      expect(parsed.ulpin).toBe('TSQXY9QM4KNXSZ');

      // 4. Second call reads from cache
      const res2 = await request(app).get('/api/ulpin/TSQXY9QM4KNXSZ');
      expect(res2.status).toBe(200);
      expect(res2.body.data.ulpin).toBe('TSQXY9QM4KNXSZ');
    });
  });
});
