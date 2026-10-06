import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../../config/db.js';
import { auditService } from '../audit/audit.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type ChangeType = 'VEGETATION_LOSS' | 'BUILT_UP_GAIN' | 'OTHER_CHANGE' | 'NO_CHANGE' | 'HIGH_CLOUD';

export interface SpectralDiffResult {
  sceneId: string;
  location: string;
  beforeDate: string;
  afterDate: string;
  cloudPct: number;
  isCloudUnsuitable: boolean;
  pixelStats: {
    totalPixels: number;
    validPixels: number;
    cloudPixels: number;
    vegetationLossPixels: number;
    builtUpGainPixels: number;
    meanDeltaNdvi: number;
    meanDeltaNdbi: number;
  };
  detectedClusters: Array<{
    type: ChangeType;
    pixelCount: number;
    meanDelta: number;
    polygonGeoJson: {
      type: 'Polygon';
      coordinates: number[][][];
    };
  }>;
  affectedParcels: Array<{
    parcelId: string;
    ulpin: string;
    village: string;
    mandal: string;
    district: string;
    legacySurveyNo: string;
    totalParcelAreaSqm: number;
    affectedAreaSqm: number;
    changeType: ChangeType;
    confidence: number;
    cloudPct: number;
    detectionMethod: string;
    detailsJson: Record<string, any>;
    alertGeometry: any;
  }>;
}

export interface SatellitePipelineConfig {
  maxCloudCoverPct: number; // default 20.0
  ndviDropThreshold: number; // default 0.25 (drop > 0.25 flags vegetation loss)
  ndbiSurgeThreshold: number; // default 0.20 (surge > 0.20 flags built-up gain)
  minClusterPixelSize: number; // default 4 pixels (noise suppression)
}

export const DEFAULT_SATELLITE_CONFIG: SatellitePipelineConfig = {
  maxCloudCoverPct: 20.0,
  ndviDropThreshold: 0.25,
  ndbiSurgeThreshold: 0.20,
  minClusterPixelSize: 4,
};

export class AutomatedSatelliteChangeDetector {
  private config: SatellitePipelineConfig;

  constructor(config: Partial<SatellitePipelineConfig> = {}) {
    this.config = { ...DEFAULT_SATELLITE_CONFIG, ...config };
  }

  /**
   * Load demo Sentinel-2 spectral raster scenes from data repository
   */
  loadDemoScenes(): any[] {
    const candidates = [
      path.resolve(process.cwd(), 'data/satellite/demo_scenes.json'),
      path.resolve(__dirname, '../../../../../data/satellite/demo_scenes.json'),
      path.resolve(__dirname, '../../../../data/satellite/demo_scenes.json'),
      path.resolve(__dirname, '../../../data/satellite/demo_scenes.json'),
    ];

    for (const p of candidates) {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf-8');
        return JSON.parse(raw);
      }
    }

    return [];
  }

  /**
   * Calculate NDVI: (NIR - Red) / (NIR + Red + eps)
   */
  calculateNdvi(red: number[], nir: number[]): number[] {
    const ndvi = new Array(red.length);
    for (let i = 0; i < red.length; i++) {
      const denom = nir[i] + red[i];
      ndvi[i] = denom > 0.0001 ? (nir[i] - red[i]) / denom : 0;
    }
    return ndvi;
  }

  /**
   * Calculate NDBI: (SWIR - NIR) / (SWIR + NIR + eps)
   */
  calculateNdbi(nir: number[], swir: number[]): number[] {
    const ndbi = new Array(nir.length);
    for (let i = 0; i < nir.length; i++) {
      const denom = swir[i] + nir[i];
      ndbi[i] = denom > 0.0001 ? (swir[i] - nir[i]) / denom : 0;
    }
    return ndbi;
  }

  /**
   * Calculate Cloud Percentage from Sentinel-2 SCL (Scene Classification Layer)
   * SCL values: 3=Cloud Shadow, 8=Cloud Medium Prob, 9=Cloud High Prob, 10=Cirrus
   */
  calculateCloudPercentage(sclBands: number[]): { cloudPct: number; cloudMask: boolean[] } {
    let cloudCount = 0;
    const cloudMask = new Array(sclBands.length).fill(false);

    for (let i = 0; i < sclBands.length; i++) {
      const val = sclBands[i];
      if (val === 3 || val === 8 || val === 9 || val === 10) {
        cloudCount++;
        cloudMask[i] = true;
      }
    }

    const cloudPct = sclBands.length > 0 ? (cloudCount / sclBands.length) * 100 : 0;
    return { cloudPct: parseFloat(cloudPct.toFixed(1)), cloudMask };
  }

  /**
   * Process a Sentinel-2 Scene through the Automated Radiometric Differencing Pipeline
   */
  async processScene(
    scene: any,
    options?: { config?: Partial<SatellitePipelineConfig>; persistAlerts?: boolean; actorId?: string }
  ): Promise<SpectralDiffResult> {
    const cfg = { ...this.config, ...options?.config };
    const { width, height, bbox, beforeBands, afterBands } = scene;
    const totalPixels = width * height;

    // 1. Cloud Mask Evaluation
    const beforeCloud = this.calculateCloudPercentage(beforeBands.sclCloud || []);
    const afterCloud = this.calculateCloudPercentage(afterBands.sclCloud || []);
    const maxCloudPct = Math.max(beforeCloud.cloudPct, afterCloud.cloudPct, scene.cloudPct || 0);
    const isCloudUnsuitable = maxCloudPct > cfg.maxCloudCoverPct;

    // 2. Compute Radiometric Indices
    const ndviBefore = this.calculateNdvi(beforeBands.b04Red, beforeBands.b08Nir);
    const ndviAfter = this.calculateNdvi(afterBands.b04Red, afterBands.b08Nir);

    const ndbiBefore = this.calculateNdbi(beforeBands.b08Nir, beforeBands.b11Swir);
    const ndbiAfter = this.calculateNdbi(afterBands.b08Nir, afterBands.b11Swir);

    // 3. Differencing Matrix
    const deltaNdvi = new Array(totalPixels);
    const deltaNdbi = new Array(totalPixels);
    const changeClassMatrix = new Array<ChangeType>(totalPixels).fill('NO_CHANGE');

    let vegLossCount = 0;
    let builtUpGainCount = 0;
    let sumDeltaNdvi = 0;
    let sumDeltaNdbi = 0;
    let validPixelCount = 0;

    for (let i = 0; i < totalPixels; i++) {
      const isCloud = beforeCloud.cloudMask[i] || afterCloud.cloudMask[i];
      if (isCloud) {
        changeClassMatrix[i] = 'HIGH_CLOUD';
        deltaNdvi[i] = 0;
        deltaNdbi[i] = 0;
        continue;
      }

      validPixelCount++;
      const dNdvi = ndviAfter[i] - ndviBefore[i];
      const dNdbi = ndbiAfter[i] - ndbiBefore[i];

      deltaNdvi[i] = dNdvi;
      deltaNdbi[i] = dNdbi;
      sumDeltaNdvi += dNdvi;
      sumDeltaNdbi += dNdbi;

      const absDropNdvi = -dNdvi;
      const surgeNdbi = dNdbi;

      if (surgeNdbi > cfg.ndbiSurgeThreshold && surgeNdbi >= absDropNdvi) {
        changeClassMatrix[i] = 'BUILT_UP_GAIN';
        builtUpGainCount++;
      } else if (dNdvi < -cfg.ndviDropThreshold) {
        changeClassMatrix[i] = 'VEGETATION_LOSS';
        vegLossCount++;
      } else if (dNdbi > cfg.ndbiSurgeThreshold) {
        changeClassMatrix[i] = 'BUILT_UP_GAIN';
        builtUpGainCount++;
      } else if (Math.abs(dNdvi) > 0.35 || Math.abs(dNdbi) > 0.35) {
        changeClassMatrix[i] = 'OTHER_CHANGE';
      }
    }

    const meanDeltaNdvi = validPixelCount > 0 ? parseFloat((sumDeltaNdvi / validPixelCount).toFixed(3)) : 0;
    const meanDeltaNdbi = validPixelCount > 0 ? parseFloat((sumDeltaNdbi / validPixelCount).toFixed(3)) : 0;

    // 4. Cluster Pixels and Polygonize into WGS84 GeoJSON
    const detectedClusters = this.polygonizeChangeClusters(
      changeClassMatrix,
      deltaNdvi,
      deltaNdbi,
      width,
      height,
      bbox,
      cfg.minClusterPixelSize
    );

    // 5. PostGIS Parcel Intersections
    const affectedParcels: SpectralDiffResult['affectedParcels'] = [];

    if (!isCloudUnsuitable && detectedClusters.length > 0) {
      for (const cluster of detectedClusters) {
        const polyGeoJsonStr = JSON.stringify(cluster.polygonGeoJson);

        const spatialQuery = `
          SELECT 
            p.id AS parcel_id, 
            p.ulpin, 
            p.village, 
            p.mandal, 
            p.district, 
            p.legacy_survey_no, 
            p.area_sqm AS total_parcel_area_sqm,
            ROUND(ST_Area(ST_Intersection(p.geom, ST_SetSRID(ST_GeomFromGeoJSON($1), 4326))::geography)::numeric, 2) AS affected_area_sqm,
            ST_AsGeoJSON(ST_Intersection(p.geom, ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)))::json AS alert_geometry
          FROM parcels p
          WHERE ST_Intersects(p.geom, ST_SetSRID(ST_GeomFromGeoJSON($1), 4326))
            AND ST_Area(ST_Intersection(p.geom, ST_SetSRID(ST_GeomFromGeoJSON($1), 4326))::geography) > 50
          ORDER BY affected_area_sqm DESC
        `;

        try {
          const parcelHits = await query(spatialQuery, [polyGeoJsonStr]);

          for (const row of parcelHits.rows) {
            // Compute Transparent Evidence-Derived Confidence
            const atmosphericPurity = Math.max(0.1, 1 - maxCloudPct / 50);
            const magnitudeSignal = Math.min(1.0, Math.abs(cluster.meanDelta) / 0.40);
            const spatialSignificance = Math.min(1.0, parseFloat(row.affected_area_sqm) / 300);

            const rawConfidence = atmosphericPurity * (0.5 * magnitudeSignal + 0.5 * spatialSignificance);
            const confidence = parseFloat(Math.min(0.96, Math.max(0.35, rawConfidence)).toFixed(2));

            const detectionMethod =
              cluster.type === 'VEGETATION_LOSS'
                ? 'SENTINEL2_NDVI_DROP'
                : cluster.type === 'BUILT_UP_GAIN'
                ? 'SENTINEL2_NDBI_SURGE'
                : 'SENTINEL2_SPECTRAL_DIFF';

            const detailsJson = {
              spectral_metric: cluster.type === 'VEGETATION_LOSS' ? 'DELTA_NDVI' : 'DELTA_NDBI',
              delta_value: cluster.meanDelta,
              atmospheric_quality: `${(atmosphericPurity * 100).toFixed(0)}% Clear`,
              affected_area_sqm: parseFloat(row.affected_area_sqm),
              pixel_count: cluster.pixelCount,
              sensor: 'Copernicus Sentinel-2 MSI (Level-2A BOA Reflectance)',
              statutory_warning: 'Automated radiometric detection — Human Officer adjudication required.',
            };

            const alertItem = {
              parcelId: row.parcel_id,
              ulpin: row.ulpin,
              village: row.village,
              mandal: row.mandal,
              district: row.district,
              legacySurveyNo: row.legacy_survey_no,
              totalParcelAreaSqm: parseFloat(row.total_parcel_area_sqm),
              affectedAreaSqm: parseFloat(row.affected_area_sqm),
              changeType: cluster.type,
              confidence,
              cloudPct: maxCloudPct,
              detectionMethod,
              detailsJson,
              alertGeometry: row.alert_geometry,
            };

            affectedParcels.push(alertItem);

            // Persist to change_alerts if requested
            if (options?.persistAlerts) {
              const insertAlertSql = `
                INSERT INTO change_alerts (
                  parcel_id, ulpin, type, confidence, cloud_pct, geometry,
                  before_date, after_date, status, detection_method, details_json
                ) VALUES (
                  $1, $2, $3, $4, $5, ST_SetSRID(ST_GeomFromGeoJSON($6), 4326),
                  $7, $8, 'PENDING', $9, $10
                ) RETURNING id
              `;

              const savedAlert = await query(insertAlertSql, [
                row.parcel_id,
                row.ulpin,
                cluster.type,
                confidence,
                maxCloudPct,
                JSON.stringify(row.alert_geometry),
                scene.beforeDate,
                scene.afterDate,
                detectionMethod,
                JSON.stringify(detailsJson),
              ]);

              // Log cryptographic audit record
              await auditService.logAction({
                entityType: 'CHANGE_ALERT',
                entityId: savedAlert.rows[0].id,
                action: 'AUTOMATED_SATELLITE_ALERT_GENERATED',
                actorId: options.actorId || 'SYSTEM_SATELLITE_PIPELINE',
                payload: {
                  ulpin: row.ulpin,
                  change_type: cluster.type,
                  confidence,
                  cloud_pct: maxCloudPct,
                  detection_method: detectionMethod,
                  affected_area_sqm: row.affected_area_sqm,
                },
              });
            }
          }
        } catch {
          // Continue on spatial edge cases
        }
      }
    }

    return {
      sceneId: scene.id,
      location: scene.location,
      beforeDate: scene.beforeDate,
      afterDate: scene.afterDate,
      cloudPct: maxCloudPct,
      isCloudUnsuitable,
      pixelStats: {
        totalPixels,
        validPixels: validPixelCount,
        cloudPixels: totalPixels - validPixelCount,
        vegetationLossPixels: vegLossCount,
        builtUpGainPixels: builtUpGainCount,
        meanDeltaNdvi,
        meanDeltaNdbi,
      },
      detectedClusters,
      affectedParcels,
    };
  }

  /**
   * Group contiguous pixel coordinates and project into WGS84 GeoJSON bounding boxes
   */
  private polygonizeChangeClusters(
    classMatrix: ChangeType[],
    deltaNdvi: number[],
    deltaNdbi: number[],
    width: number,
    height: number,
    bbox: [number, number, number, number],
    minSize: number
  ): SpectralDiffResult['detectedClusters'] {
    const [minLng, minLat, maxLng, maxLat] = bbox;
    const lngStep = (maxLng - minLng) / width;
    const latStep = (maxLat - minLat) / height;

    const visited = new Array(classMatrix.length).fill(false);
    const clusters: SpectralDiffResult['detectedClusters'] = [];

    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const idx = r * width + c;
        const targetType = classMatrix[idx];

        if (visited[idx] || targetType === 'NO_CHANGE' || targetType === 'HIGH_CLOUD') {
          continue;
        }

        // BFS flood-fill connected component
        const queue = [idx];
        visited[idx] = true;
        const component: number[] = [];

        let minR = r;
        let maxR = r;
        let minC = c;
        let maxC = c;
        let sumDelta = 0;

        while (queue.length > 0) {
          const curr = queue.shift()!;
          component.push(curr);

          const curR = Math.floor(curr / width);
          const curC = curr % width;

          minR = Math.min(minR, curR);
          maxR = Math.max(maxR, curR);
          minC = Math.min(minC, curC);
          maxC = Math.max(maxC, curC);

          sumDelta += targetType === 'VEGETATION_LOSS' ? deltaNdvi[curr] : deltaNdbi[curr];

          // 4-connected neighbors
          const neighbors = [
            curR > 0 ? (curR - 1) * width + curC : -1,
            curR < height - 1 ? (curR + 1) * width + curC : -1,
            curC > 0 ? curR * width + (curC - 1) : -1,
            curC < width - 1 ? curR * width + (curC + 1) : -1,
          ];

          for (const n of neighbors) {
            if (n >= 0 && !visited[n] && classMatrix[n] === targetType) {
              visited[n] = true;
              queue.push(n);
            }
          }
        }

        if (component.length >= minSize) {
          // Convert pixel bounding box to WGS84 coordinates
          const west = minLng + minC * lngStep;
          const east = minLng + (maxC + 1) * lngStep;
          const north = maxLat - minR * latStep;
          const south = maxLat - (maxR + 1) * latStep;

          const polygonGeoJson: { type: 'Polygon'; coordinates: number[][][] } = {
            type: 'Polygon',
            coordinates: [
              [
                [parseFloat(west.toFixed(6)), parseFloat(north.toFixed(6))],
                [parseFloat(east.toFixed(6)), parseFloat(north.toFixed(6))],
                [parseFloat(east.toFixed(6)), parseFloat(south.toFixed(6))],
                [parseFloat(west.toFixed(6)), parseFloat(south.toFixed(6))],
                [parseFloat(west.toFixed(6)), parseFloat(north.toFixed(6))],
              ],
            ],
          };

          clusters.push({
            type: targetType,
            pixelCount: component.length,
            meanDelta: parseFloat((sumDelta / component.length).toFixed(3)),
            polygonGeoJson,
          });
        }
      }
    }

    return clusters;
  }
}

export const satelliteChangeDetector = new AutomatedSatelliteChangeDetector();
