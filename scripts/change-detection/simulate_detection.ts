import { query, pool } from '../../apps/api/src/config/db.js';

async function simulateSatelliteChangeDetection() {
  console.log('🛰️ Satellite Change Detection Simulator starting...');
  console.log('Ingesting mock Sentinel-2 & Landsat-9 spectral indices...');

  const parcelsRes = await query(
    `SELECT id, ulpin, village, ST_AsGeoJSON(geom)::json AS geom FROM parcels LIMIT 5`
  );

  console.log(`Analyzing ${parcelsRes.rows.length} parcels for temporal spectral anomalies...`);

  for (const parcel of parcelsRes.rows) {
    console.log(`- Parcel ${parcel.ulpin} (${parcel.village}): NDVI differential: -0.38 (Vegetation Loss detected)`);
  }

  console.log('Change detection analysis complete. 3 alerts currently tracked in database.');
  await pool.end();
}

simulateSatelliteChangeDetection().catch(console.error);
