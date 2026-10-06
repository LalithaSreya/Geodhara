import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

describe('GeoDhara API Health & Common Structure', () => {
  const app = createApp();

  it('GET /api/health should return UP status and DEMO notice', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.tagline).toBe('One parcel. One identity.');
    expect(res.body.notice).toContain('DEMO ENVIRONMENT');
  });

  it('GET /docs.json should serve valid OpenAPI 3.0 document', async () => {
    const res = await request(app).get('/docs.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
    expect(res.body.info.title).toBe('GeoDhara API');
  });

  it('404 route should return consistent error envelope { error: { code, message } }', async () => {
    const res = await request(app).get('/api/unknown-endpoint-404');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.message).toBeDefined();
  });

  it('POST /api/ulpin/validate should validate synthetic ULPIN format', async () => {
    const res = await request(app)
      .post('/api/ulpin/validate')
      .send({ ulpin: 'TS7A2K91M4P6X8' });
    expect(res.status).toBe(200);
    expect(res.body.data.format_valid).toBe(true);
    expect(res.body.data.ulpin).toBe('TS7A2K91M4P6X8');
  });

  it('POST /api/ulpin/validate with malformed ULPIN returns format_valid: false', async () => {
    const res = await request(app)
      .post('/api/ulpin/validate')
      .send({ ulpin: 'SHORT' });
    expect(res.status).toBe(200);
    expect(res.body.data.format_valid).toBe(false);
    expect(res.body.data.errors.length).toBeGreaterThan(0);
  });
});
