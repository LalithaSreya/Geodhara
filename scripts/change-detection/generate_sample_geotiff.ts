import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project root data directory
const SATELLITE_DATA_DIR = path.resolve(__dirname, '../../data/satellite');

if (!fs.existsSync(SATELLITE_DATA_DIR)) {
  fs.mkdirSync(SATELLITE_DATA_DIR, { recursive: true });
}

export interface SyntheticRasterScene {
  id: string;
  name: string;
  location: string;
  stateCode: string;
  width: number;
  height: number;
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  beforeDate: string;
  afterDate: string;
  cloudPct: number;
  // Band matrices (width x height flattened float32)
  beforeBands: {
    b04Red: number[];
    b08Nir: number[];
    b11Swir: number[];
    sclCloud: number[];
  };
  afterBands: {
    b04Red: number[];
    b08Nir: number[];
    b11Swir: number[];
    sclCloud: number[];
  };
  groundTruthType: 'VEGETATION_LOSS' | 'BUILT_UP_GAIN' | 'NO_CHANGE' | 'HIGH_CLOUD';
}

/**
 * Generate synthetic Sentinel-2 L2A multi-band raster data aligned with Telangana & Karnataka demo parcels
 */
export function generateDemoSatelliteScenes(): SyntheticRasterScene[] {
  const width = 32;
  const height = 32;
  const pixelCount = width * height;

  // Scene 1: Malkajgiri / Medchal (Vegetation Loss -> Forest clearance / unauthorized leveling)
  // Bbox around Telangana demo parcels: [78.5000, 17.5800, 78.5200, 17.6000]
  const scene1BeforeRed = new Array(pixelCount).fill(0.08);
  const scene1BeforeNir = new Array(pixelCount).fill(0.55); // High NDVI = (0.55-0.08)/(0.55+0.08) = 0.74 (Dense green)
  const scene1BeforeSwir = new Array(pixelCount).fill(0.12);
  const scene1BeforeScl = new Array(pixelCount).fill(4); // 4 = Vegetation in SCL

  const scene1AfterRed = new Array(pixelCount).fill(0.08);
  const scene1AfterNir = new Array(pixelCount).fill(0.55);
  const scene1AfterSwir = new Array(pixelCount).fill(0.12);
  const scene1AfterScl = new Array(pixelCount).fill(4);

  // Plant a vegetation clearance hotspot in center (rows 10-22, cols 10-22)
  for (let r = 10; r < 22; r++) {
    for (let c = 10; c < 22; c++) {
      const idx = r * width + c;
      scene1AfterRed[idx] = 0.28; // Red increases
      scene1AfterNir[idx] = 0.18; // NIR drops -> NDVI drops to (0.18-0.28)/(0.18+0.28) = -0.21 (delta = -0.95)
      scene1AfterSwir[idx] = 0.16; // Bare soil reflectance in SWIR
      scene1AfterScl[idx] = 5; // 5 = Bare soil
    }
  }

  // Scene 2: Kompally / Dundigal (Built-up Gain -> New illegal structure / plinth emergence)
  // Bbox around Telangana parcel: [78.4800, 17.6200, 78.5000, 17.6400]
  const scene2BeforeRed = new Array(pixelCount).fill(0.15);
  const scene2BeforeNir = new Array(pixelCount).fill(0.25);
  const scene2BeforeSwir = new Array(pixelCount).fill(0.18); // NDBI = (0.18-0.25)/(0.18+0.25) = -0.16
  const scene2BeforeScl = new Array(pixelCount).fill(5); // Bare soil

  const scene2AfterRed = new Array(pixelCount).fill(0.15);
  const scene2AfterNir = new Array(pixelCount).fill(0.25);
  const scene2AfterSwir = new Array(pixelCount).fill(0.18);
  const scene2AfterScl = new Array(pixelCount).fill(5);

  // Plant a built-up structure hotspot (rows 12-20, cols 12-20)
  for (let r = 12; r < 20; r++) {
    for (let c = 12; c < 20; c++) {
      const idx = r * width + c;
      scene2AfterRed[idx] = 0.22;
      scene2AfterNir[idx] = 0.20;
      scene2AfterSwir[idx] = 0.42; // SWIR surges -> NDBI = (0.42-0.20)/(0.42+0.20) = +0.35 (delta = +0.51)
      scene2AfterScl[idx] = 7; // Built-up / unclassified
    }
  }

  // Scene 3: Devanahalli / Bangalore North (Stable Agricultural / No Meaningful Change)
  // Bbox around Karnataka parcels: [77.6800, 13.2300, 77.7000, 13.2500]
  const scene3BeforeRed = new Array(pixelCount).fill(0.10);
  const scene3BeforeNir = new Array(pixelCount).fill(0.48);
  const scene3BeforeSwir = new Array(pixelCount).fill(0.14);
  const scene3BeforeScl = new Array(pixelCount).fill(4);

  const scene3AfterRed = scene3BeforeRed.map((v) => v + (Math.random() * 0.02 - 0.01));
  const scene3AfterNir = scene3BeforeNir.map((v) => v + (Math.random() * 0.02 - 0.01));
  const scene3AfterSwir = scene3BeforeSwir.map((v) => v + (Math.random() * 0.02 - 0.01));
  const scene3AfterScl = new Array(pixelCount).fill(4);

  // Scene 4: Cloudy Scene (High Cloud Cover Mask -> Unsuitable for optical change detection)
  // Bbox around Telangana parcels: [78.5050, 17.5850, 78.5150, 17.5950]
  const scene4BeforeRed = new Array(pixelCount).fill(0.10);
  const scene4BeforeNir = new Array(pixelCount).fill(0.50);
  const scene4BeforeSwir = new Array(pixelCount).fill(0.15);
  const scene4BeforeScl = new Array(pixelCount).fill(4);

  const scene4AfterRed = new Array(pixelCount).fill(0.45); // High reflection in clouds
  const scene4AfterNir = new Array(pixelCount).fill(0.52);
  const scene4AfterSwir = new Array(pixelCount).fill(0.35);
  const scene4AfterScl = new Array(pixelCount).fill(9); // 9 = Cloud High Probability

  // Partial clear pixels
  for (let i = 0; i < 400; i++) {
    scene4AfterScl[i] = 4;
    scene4AfterRed[i] = 0.10;
  }

  const scenes: SyntheticRasterScene[] = [
    {
      id: 'SCENE_TS_MEDCHAL_VEG_LOSS',
      name: 'Sentinel-2 Tile 44QKB (Medchal Forest/Agriculture Corridor)',
      location: 'Malkajgiri Mandal, Medchal-Malkajgiri District, Telangana',
      stateCode: 'TS',
      width,
      height,
      bbox: [78.5000, 17.5800, 78.5200, 17.6000],
      beforeDate: '2024-01-10',
      afterDate: '2024-06-15',
      cloudPct: 4.2,
      beforeBands: {
        b04Red: scene1BeforeRed,
        b08Nir: scene1BeforeNir,
        b11Swir: scene1BeforeSwir,
        sclCloud: scene1BeforeScl,
      },
      afterBands: {
        b04Red: scene1AfterRed,
        b08Nir: scene1AfterNir,
        b11Swir: scene1AfterSwir,
        sclCloud: scene1AfterScl,
      },
      groundTruthType: 'VEGETATION_LOSS',
    },
    {
      id: 'SCENE_TS_KOMPALLY_BUILT_UP',
      name: 'Sentinel-2 Tile 44QKB (Kompally Urban Expansion)',
      location: 'Kompally / Gundlapochampally, Telangana',
      stateCode: 'TS',
      width,
      height,
      bbox: [78.4800, 17.6200, 78.5000, 17.6400],
      beforeDate: '2024-02-01',
      afterDate: '2024-07-20',
      cloudPct: 2.5,
      beforeBands: {
        b04Red: scene2BeforeRed,
        b08Nir: scene2BeforeNir,
        b11Swir: scene2BeforeSwir,
        sclCloud: scene2BeforeScl,
      },
      afterBands: {
        b04Red: scene2AfterRed,
        b08Nir: scene2AfterNir,
        b11Swir: scene2AfterSwir,
        sclCloud: scene2AfterScl,
      },
      groundTruthType: 'BUILT_UP_GAIN',
    },
    {
      id: 'SCENE_KA_DEVANAHALLI_STABLE',
      name: 'Sentinel-2 Tile 43PGP (Devanahalli Agro Zone)',
      location: 'Devanahalli Taluk, Bangalore Rural, Karnataka',
      stateCode: 'KA',
      width,
      height,
      bbox: [77.6800, 13.2300, 77.7000, 13.2500],
      beforeDate: '2024-03-01',
      afterDate: '2024-08-10',
      cloudPct: 3.1,
      beforeBands: {
        b04Red: scene3BeforeRed,
        b08Nir: scene3BeforeNir,
        b11Swir: scene3BeforeSwir,
        sclCloud: scene3BeforeScl,
      },
      afterBands: {
        b04Red: scene3AfterRed,
        b08Nir: scene3AfterNir,
        b11Swir: scene3AfterSwir,
        sclCloud: scene3AfterScl,
      },
      groundTruthType: 'NO_CHANGE',
    },
    {
      id: 'SCENE_TS_MONSOON_CLOUDY',
      name: 'Sentinel-2 Tile 44QKB (Monsoon Cloud Obscuration)',
      location: 'Medchal District, Telangana',
      stateCode: 'TS',
      width,
      height,
      bbox: [78.5050, 17.5850, 78.5150, 17.5950],
      beforeDate: '2024-05-10',
      afterDate: '2024-08-05',
      cloudPct: 60.9,
      beforeBands: {
        b04Red: scene4BeforeRed,
        b08Nir: scene4BeforeNir,
        b11Swir: scene4BeforeSwir,
        sclCloud: scene4BeforeScl,
      },
      afterBands: {
        b04Red: scene4AfterRed,
        b08Nir: scene4AfterNir,
        b11Swir: scene4AfterSwir,
        sclCloud: scene4AfterScl,
      },
      groundTruthType: 'HIGH_CLOUD',
    },
  ];

  return scenes;
}

// Write scenes JSON for fast deterministic demo pipeline execution
const demoScenes = generateDemoSatelliteScenes();
fs.writeFileSync(
  path.join(SATELLITE_DATA_DIR, 'demo_scenes.json'),
  JSON.stringify(demoScenes, null, 2),
  'utf-8'
);

console.log(`Generated ${demoScenes.length} demo Sentinel-2 satellite crops in ${SATELLITE_DATA_DIR}`);
