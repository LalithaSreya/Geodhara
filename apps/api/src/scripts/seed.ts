import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { query, pool } from '../config/db.js';
import { auditService } from '../modules/audit/audit.service.js';

// Deterministic 14-char ULPIN generator for demo
function makeDeterministicUlpin(seedNum: number, prefix: string): string {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let hash = (seedNum * 2654435761) >>> 0;
  let code = prefix; // e.g. TS or KA
  for (let i = 0; i < 12; i++) {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    code += chars[hash % chars.length];
  }
  return code.slice(0, 14);
}

export async function runSeeds() {
  console.log('Starting GeoDhara synthetic database seeding...');

  // 1. Clean existing tables
  await query(`
    TRUNCATE TABLE 
      audit_log, sync_log, field_observations, change_alerts, 
      mutation_events, mutation_applications, land_use, litigation_cases, 
      encumbrances, registrations, land_records, legacy_id_map, 
      parcel_versions, parcel_owners, parcels, states, users, refresh_tokens 
    CASCADE;
  `);

  console.log('Tables cleared.');

  // 2. Seed Demo Users
  console.log('Seeding demo users...');
  const salt = await bcrypt.genSalt(10);
  const citizenPass = await bcrypt.hash('DemoCitizen@123', salt);
  const officerPass = await bcrypt.hash('DemoOfficer@123', salt);
  const fieldPass = await bcrypt.hash('DemoField@123', salt);
  const adminPass = await bcrypt.hash('DemoAdmin@123', salt);

  await query(`
    INSERT INTO users (email, password_hash, full_name, role) VALUES
    ('citizen@geodhara.demo', $1, 'Ramesh Kumar (Citizen)', 'citizen'),
    ('officer@geodhara.demo', $2, 'Smt. Ananya Rao (Tahsildar / Revenue Officer)', 'officer'),
    ('field@geodhara.demo', $3, 'K. Suresh (Field Surveyor / Inspector)', 'field_officer'),
    ('admin@geodhara.demo', $4, 'System Administrator', 'admin')
  `, [citizenPass, officerPass, fieldPass, adminPass]);

  // 3. Seed States
  console.log('Seeding states with synthetic boundaries...');
  const tsGeom = {
    type: 'MultiPolygon',
    coordinates: [
      [
        [
          [77.2, 15.8],
          [81.3, 15.8],
          [81.3, 19.9],
          [77.2, 19.9],
          [77.2, 15.8],
        ],
      ],
    ],
  };

  const kaGeom = {
    type: 'MultiPolygon',
    coordinates: [
      [
        [
          [74.0, 11.5],
          [78.6, 11.5],
          [78.6, 18.4],
          [74.0, 18.4],
          [74.0, 11.5],
        ],
      ],
    ],
  };

  const stateTsRes = await query(
    `INSERT INTO states (code, name, boundary_geom)
     VALUES ('TS', 'Telangana', ST_SetSRID(ST_GeomFromGeoJSON($1), 4326))
     RETURNING id, code, name`,
    [JSON.stringify(tsGeom)]
  );
  const tsStateId = stateTsRes.rows[0].id;

  const stateKaRes = await query(
    `INSERT INTO states (code, name, boundary_geom)
     VALUES ('KA', 'Karnataka', ST_SetSRID(ST_GeomFromGeoJSON($1), 4326))
     RETURNING id, code, name`,
    [JSON.stringify(kaGeom)]
  );
  const kaStateId = stateKaRes.rows[0].id;

  // 4. Generate 64 Synthetic Parcels (36 in TS Medchal-Malkajgiri, 28 in KA Devanahalli)
  console.log('Generating 64 synthetic parcels across Telangana & Karnataka...');

  const tsVillages = [
    { village: 'Kompally', mandal: 'Dundigal Gandimaisamma', district: 'Medchal-Malkajgiri' },
    { village: 'Medchal', mandal: 'Medchal', district: 'Medchal-Malkajgiri' },
    { village: 'Gundlapochampally', mandal: 'Medchal', district: 'Medchal-Malkajgiri' },
    { village: 'Dulapally', mandal: 'Dundigal Gandimaisamma', district: 'Medchal-Malkajgiri' },
    { village: 'Bahadurpally', mandal: 'Dundigal Gandimaisamma', district: 'Medchal-Malkajgiri' },
    { village: 'Kandlakoya', mandal: 'Medchal', district: 'Medchal-Malkajgiri' },
  ];

  const kaVillages = [
    { village: 'Devanahalli', mandal: 'Devanahalli', district: 'Bengaluru Rural' },
    { village: 'Vijayapura', mandal: 'Devanahalli', district: 'Bengaluru Rural' },
    { village: 'Boodigere', mandal: 'Hosakote', district: 'Bengaluru Rural' },
    { village: 'Kundana', mandal: 'Devanahalli', district: 'Bengaluru Rural' },
    { village: 'Sulibele', mandal: 'Hosakote', district: 'Bengaluru Rural' },
  ];

  const landCategories = [
    { cat: 'AGRICULTURAL', sub: 'Dry Crop (Pattadar)' },
    { cat: 'AGRICULTURAL', sub: 'Wet Irrigated (Borewell)' },
    { cat: 'RESIDENTIAL', sub: 'Plotted Layout (Approved)' },
    { cat: 'COMMERCIAL', sub: 'Highway Logistics & Warehouse' },
    { cat: 'INDUSTRIAL', sub: 'Light Industrial Zone' },
  ];

  const syntheticNames = [
    'Ramesh Rao Vanga', 'K. Venkat Reddy', 'P. Lakshmi Devi', 'Mohammed Abdul Kareem',
    'Sunita Narayana Murthy', 'Chandra Shekar Goud', 'B. Satyanarayana', 'Gurappa Gowda',
    'Manjunath Patil', 'Radha Krishna Reddy', 'Srinivas Acharya', 'Vijay Anand Rao',
    'Dr. H. Sudhakar Rao', 'Deepika Shastry', 'Mallikarjun Swamy', 'Anand Kumar Jain',
    'Pooja Hegde', 'Naveen Kumar G.', 'Sudha Murthy Rao', 'Harish Babu K.'
  ];

  const createdParcels: any[] = [];

  // Helper to generate grid polygons
  let parcelIndex = 1;

  // Telangana cluster (6x6 grid in Medchal region around 17.58 - 17.64 N, 78.48 - 78.54 E)
  const tsBaseLng = 78.485;
  const tsBaseLat = 17.585;
  const stepLng = 0.0075;
  const stepLat = 0.0065;

  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      const idx = parcelIndex++;
      const vInfo = tsVillages[(row * 6 + col) % tsVillages.length];
      const ulpin = makeDeterministicUlpin(idx, 'TS');
      const surveyNo = `${100 + idx}/${(col % 4) + 1}`;

      const minLng = tsBaseLng + col * stepLng;
      const minLat = tsBaseLat + row * stepLat;
      const maxLng = minLng + stepLng * 0.94; // slight gap for cadastral road
      const maxLat = minLat + stepLat * 0.94;

      const polyGeoJson = {
        type: 'Polygon',
        coordinates: [
          [
            [Number(minLng.toFixed(6)), Number(minLat.toFixed(6))],
            [Number(maxLng.toFixed(6)), Number(minLat.toFixed(6))],
            [Number(maxLng.toFixed(6)), Number(maxLat.toFixed(6))],
            [Number(minLng.toFixed(6)), Number(maxLat.toFixed(6))],
            [Number(minLng.toFixed(6)), Number(minLat.toFixed(6))],
          ],
        ],
      };

      // Insert Parcel
      const pRes = await query(
        `INSERT INTO parcels (
          ulpin, state_id, state_code, legacy_survey_no, village, mandal, district,
          area_sqm, geom, version
        ) VALUES (
          $1, $2, 'TS', $3, $4, $5, $6,
          ROUND(ST_Area(ST_SetSRID(ST_GeomFromGeoJSON($7), 4326)::geography)::numeric, 2),
          ST_SetSRID(ST_GeomFromGeoJSON($7), 4326),
          1
        ) RETURNING id, ulpin, area_sqm, legacy_survey_no, village, mandal, district`,
        [
          ulpin,
          tsStateId,
          surveyNo,
          vInfo.village,
          vInfo.mandal,
          vInfo.district,
          JSON.stringify(polyGeoJson),
        ]
      );

      createdParcels.push({ ...pRes.rows[0], state_code: 'TS', polyGeoJson, seq: idx });
    }
  }

  // Karnataka cluster (4x7 grid in Devanahalli region around 13.22 - 13.27 N, 77.69 - 77.76 E)
  const kaBaseLng = 77.695;
  const kaBaseLat = 13.220;
  const kaStepLng = 0.0085;
  const kaStepLat = 0.0075;

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 7; col++) {
      const idx = parcelIndex++;
      const vInfo = kaVillages[(row * 7 + col) % kaVillages.length];
      const ulpin = makeDeterministicUlpin(idx, 'KA');
      const surveyNo = `Sy-${50 + idx}/${(col % 3) + 1}`;

      const minLng = kaBaseLng + col * kaStepLng;
      const minLat = kaBaseLat + row * kaStepLat;
      const maxLng = minLng + kaStepLng * 0.94;
      const maxLat = minLat + kaStepLat * 0.94;

      const polyGeoJson = {
        type: 'Polygon',
        coordinates: [
          [
            [Number(minLng.toFixed(6)), Number(minLat.toFixed(6))],
            [Number(maxLng.toFixed(6)), Number(minLat.toFixed(6))],
            [Number(maxLng.toFixed(6)), Number(maxLat.toFixed(6))],
            [Number(minLng.toFixed(6)), Number(maxLat.toFixed(6))],
            [Number(minLng.toFixed(6)), Number(minLat.toFixed(6))],
          ],
        ],
      };

      const pRes = await query(
        `INSERT INTO parcels (
          ulpin, state_id, state_code, legacy_survey_no, village, mandal, district,
          area_sqm, geom, version
        ) VALUES (
          $1, $2, 'KA', $3, $4, $5, $6,
          ROUND(ST_Area(ST_SetSRID(ST_GeomFromGeoJSON($7), 4326)::geography)::numeric, 2),
          ST_SetSRID(ST_GeomFromGeoJSON($7), 4326),
          1
        ) RETURNING id, ulpin, area_sqm, legacy_survey_no, village, mandal, district`,
        [
          ulpin,
          kaStateId,
          surveyNo,
          vInfo.village,
          vInfo.mandal,
          vInfo.district,
          JSON.stringify(polyGeoJson),
        ]
      );

      createdParcels.push({ ...pRes.rows[0], state_code: 'KA', polyGeoJson, seq: idx });
    }
  }

  console.log(`Seeded ${createdParcels.length} total parcels.`);

  // 5. Seed Owners, Land Records, Registrations, Land Use, and Legacy Mappings for all parcels
  console.log('Seeding owners, RoR land records, registrations, and legacy mappings...');

  for (let i = 0; i < createdParcels.length; i++) {
    const p = createdParcels[i];
    const isMultiOwner = i % 5 === 0; // Every 5th parcel has joint owners
    const landUseType = landCategories[i % landCategories.length];
    const primaryName = syntheticNames[i % syntheticNames.length];

    // Legacy ID Mapping
    const isLegacyMismatch = i >= 10 && i < 15; // 5 legacy mismatches
    await query(
      `INSERT INTO legacy_id_map (state, legacy_system, legacy_survey_no, legacy_identifier, ulpin, confidence, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        p.state_code === 'TS' ? 'Telangana' : 'Karnataka',
        p.state_code === 'TS' ? 'Dharani Land Portal' : 'Bhoomi RTC',
        p.legacy_survey_no,
        `${p.state_code}-LEG-${1000 + i}`,
        p.ulpin,
        isLegacyMismatch ? 0.45 : 1.0,
        isLegacyMismatch ? 'MISMATCH_FLAGGED' : 'MATCHED',
      ]
    );

    // Owners
    if (isMultiOwner) {
      const coOwner = syntheticNames[(i + 3) % syntheticNames.length];
      await query(
        `INSERT INTO parcel_owners (parcel_id, person_name, person_identifier, ownership_percentage, ownership_type, valid_from, is_current)
         VALUES 
         ($1, $2, $3, 60.00, 'JOINT', '2018-04-12', TRUE),
         ($1, $4, $5, 40.00, 'JOINT', '2018-04-12', TRUE)`,
        [
          p.id,
          primaryName,
          `ID-PATTADAR-${1000 + i}-A`,
          coOwner,
          `ID-PATTADAR-${1000 + i}-B`,
        ]
      );
    } else {
      await query(
        `INSERT INTO parcel_owners (parcel_id, person_name, person_identifier, ownership_percentage, ownership_type, valid_from, is_current)
         VALUES ($1, $2, $3, 100.00, 'SOLE', '2016-01-10', TRUE)`,
        [p.id, primaryName, `ID-PATTADAR-${1000 + i}`]
      );
    }

    // Land Records (RoR 1B / RTC)
    await query(
      `INSERT INTO land_records (parcel_id, record_type, record_number, holder_info, area, source, record_date, status, document_reference)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE', $8)`,
      [
        p.id,
        p.state_code === 'TS' ? 'RoR_1B' : 'RTC_Pahani',
        `ROR-${p.state_code}-${2020 + (i % 4)}-${1000 + i}`,
        JSON.stringify([{ holder_name: primaryName, khata_no: `KT-${500 + i}`, share: isMultiOwner ? 'Joint' : '100%' }]),
        p.area_sqm,
        p.state_code === 'TS' ? 'Telangana Land Revenue System' : 'Karnataka Revenue Department',
        '2022-06-15',
        `DOC-ROR-${1000 + i}`,
      ]
    );

    // Land Use
    await query(
      `INSERT INTO land_use (parcel_id, category, sub_category, source, effective_date, confidence)
       VALUES ($1, $2, $3, 'MASTER_PLAN_GIS_SURVEY', '2023-01-01', 0.95)`,
      [p.id, landUseType.cat, landUseType.sub]
    );

    // Registrations (Deed history)
    const isAreaMismatch = i === 4; // Special demo scenario: area mismatch
    const regArea = isAreaMismatch ? parseFloat(p.area_sqm) * 1.25 : parseFloat(p.area_sqm);

    await query(
      `INSERT INTO registrations (
        parcel_id, document_number, seller, buyer, seller_identifier, buyer_identifier,
        registration_date, registered_area_sqm, consideration_amount, registration_type, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'SALE_DEED', 'REGISTERED')`,
      [
        p.id,
        `SRO-${p.state_code}/${2024}/${4000 + i}`,
        syntheticNames[(i + 4) % syntheticNames.length],
        primaryName,
        `ID-SELLER-${2000 + i}`,
        `ID-BUYER-${1000 + i}`,
        '2024-03-10',
        regArea,
        4500000 + i * 50000,
      ]
    );
  }

  // 6. Seed Special Demo Cases
  console.log('Seeding special demo scenarios (encumbrances, litigation, churn, duplicate registrations, change alerts)...');

  // Case A: 3 Encumbered parcels
  const encParcel1 = createdParcels[1]; // Index 1 (TS)
  const encParcel2 = createdParcels[4]; // Index 4 (TS)
  const encParcel3 = createdParcels[13]; // Index 13 (TS)

  await query(
    `INSERT INTO encumbrances (parcel_id, type, description, authority, reference_number, status, start_date)
     VALUES 
     ($1, 'MORTGAGE', 'Agricultural Term Loan Mortgage registered against survey parcel', 'State Bank of India (Medchal Branch)', 'SBI/AGRI/2023/9921', 'ACTIVE', '2023-05-10'),
     ($2, 'COURT_STAY', 'Interim judicial attachment & restraint order regarding boundary claim', 'District Civil Judge Court Malkajgiri', 'IA/2024/771', 'ACTIVE', '2024-01-15'),
     ($3, 'LIEN', 'Statutory tax lien for commercial conversion arrears', 'Commercial Taxes Department TS', 'CTD/TAX/2024/098', 'ACTIVE', '2024-04-20')`,
    [encParcel1.id, encParcel2.id, encParcel3.id]
  );

  // Case B: 2 Duplicate / Double-Registration scenarios
  const dupParcel1 = createdParcels[7];
  const dupParcel2 = createdParcels[21];

  await query(
    `INSERT INTO registrations (
      parcel_id, document_number, seller, buyer, seller_identifier, buyer_identifier,
      registration_date, registered_area_sqm, consideration_amount, registration_type, status
    ) VALUES 
    ($1, 'SRO-TS/2024/DUP-901', 'B. Satyanarayana', 'K. V. Reddy (Conflicting Claimant)', 'ID-CLAIM-1', 'ID-BUYER-DUP1', '2024-08-14', $2, 6200000, 'SALE_DEED', 'REGISTERED'),
    ($3, 'SRO-TS/2024/DUP-902', 'Radha Krishna Reddy', 'V. Anand (Parallel Deed)', 'ID-CLAIM-2', 'ID-BUYER-DUP2', '2024-08-28', $4, 5800000, 'SALE_DEED', 'REGISTERED')`,
    [dupParcel1.id, dupParcel1.area_sqm, dupParcel2.id, dupParcel2.area_sqm]
  );

  // Case C: Active Litigation Cases
  const litParcel1 = createdParcels[4];
  const litParcel2 = createdParcels[18];

  await query(
    `INSERT INTO litigation_cases (parcel_id, case_number, court, case_type, status, opened_at, description)
     VALUES 
     ($1, 'OS/2023/4412', 'Senior Civil Judge Court, Medchal', 'TITLE_DISPUTE', 'STAY_GRANTED', '2023-11-20', 'Title injunction suit filed by prior legal heirs claiming share under ancestral partition.'),
     ($2, 'WP/2024/1109', 'High Court for the State of Telangana', 'BOUNDARY_ENCROACHMENT', 'PENDING', '2024-02-05', 'Writ petition filed contesting realignment of revenue survey boundary.')`,
    [litParcel1.id, litParcel2.id]
  );

  // Case D: Planted Automated Satellite Change Detection Scenarios
  // Scenario A: Parcel A (Vegetation Loss via Sentinel-2 NDVI Drop)
  const alertParcel1 = createdParcels[3]; // TS
  // Scenario B: Parcel B (Built-up Gain via Sentinel-2 NDBI Surge)
  const alertParcel2 = createdParcels[24]; // TS
  // Scenario C: Parcel C (Verified Ground Truth - Legitimate Permitted Agro Leveling)
  const alertParcel3 = createdParcels[40]; // KA
  // Scenario D: Parcel D (Cloudy Scenario - High Cloud Cover Optical Degradation)
  const alertParcel4 = createdParcels[10]; // TS

  const alertGeom1 = {
    type: 'Polygon',
    coordinates: [
      [
        [78.5080, 17.5860],
        [78.5110, 17.5860],
        [78.5110, 17.5890],
        [78.5080, 17.5890],
        [78.5080, 17.5860],
      ],
    ],
  };

  const alertGeom2 = {
    type: 'Polygon',
    coordinates: [
      [
        [78.4860, 17.6255],
        [78.4905, 17.6255],
        [78.4905, 17.6295],
        [78.4860, 17.6295],
        [78.4860, 17.6255],
      ],
    ],
  };

  const alertGeom4 = {
    type: 'Polygon',
    coordinates: [
      [
        [78.5120, 17.5820],
        [78.5160, 17.5820],
        [78.5160, 17.5860],
        [78.5120, 17.5860],
        [78.5120, 17.5820],
      ],
    ],
  };

  await query(
    `INSERT INTO change_alerts (
      parcel_id, ulpin, type, confidence, cloud_pct, geometry, before_date, after_date,
      status, detection_method, details_json
    ) VALUES 
    ($1, $2, 'VEGETATION_LOSS', 0.92, 4.2, ST_SetSRID(ST_GeomFromGeoJSON($3), 4326), '2024-01-10', '2024-06-15', 'PENDING', 'SENTINEL2_NDVI_DROP', 
     '{"delta_ndvi": -0.42, "sensor": "Sentinel-2 L2A", "affected_area_sqm": 2400, "estimated_cleared_sqm": 2400, "statutory_warning": "Automated detection — Human verification required"}'),
    
    ($4, $5, 'BUILT_UP_GAIN', 0.88, 2.5, ST_SetSRID(ST_GeomFromGeoJSON($6), 4326), '2024-02-01', '2024-07-20', 'PENDING', 'SENTINEL2_NDBI_SURGE', 
     '{"delta_ndbi": 0.38, "sensor": "Sentinel-2 L2A", "affected_area_sqm": 1650, "unauthorized_structures": 2, "statutory_warning": "Automated detection — Human verification required"}'),
    
    ($7, $8, 'OTHER_CHANGE', 0.81, 3.1, ST_SetSRID(ST_GeomFromGeoJSON($3), 4326), '2024-03-01', '2024-08-10', 'VERIFIED', 'LANDSAT9_SPECTRAL_DIFF', 
     '{"verified_notes": "Ground leveling for greenhouse authorized under Agro Permit #AP-2024-88", "adjudication_status": "LEGITIMATE_PERMITTED"}'),
     
    ($9, $10, 'OTHER_CHANGE', 0.32, 58.5, ST_SetSRID(ST_GeomFromGeoJSON($11), 4326), '2024-05-10', '2024-08-05', 'DISMISSED', 'SENTINEL2_SCL_CLOUD_DEGRADED', 
     '{"warning": "Excessive cloud cover (>20%) caused optical distortion. Dismissed as false positive after ground review.", "cloud_cover_pct": 58.5}')`,
    [
      alertParcel1.id, alertParcel1.ulpin, JSON.stringify(alertGeom1),
      alertParcel2.id, alertParcel2.ulpin, JSON.stringify(alertGeom2),
      alertParcel3.id, alertParcel3.ulpin,
      alertParcel4.id, alertParcel4.ulpin, JSON.stringify(alertGeom4),
    ]
  );

  // 7. Seed Mutation Applications & Events
  console.log('Seeding mutation applications across workflow states...');

  // 1 Auto-Validated Clean Application
  const cleanParcel = createdParcels[0];
  const mutRes1 = await query(
    `INSERT INTO mutation_applications (
      application_number, parcel_id, applicant, status, risk_score, risk_breakdown_json, submitted_at, updated_at
    ) VALUES (
      'MUT-2026-100892', $1,
      '{"name": "Vanga Nishith Reddy", "id_number": "ID-CIT-8899", "email": "citizen@geodhara.demo", "phone": "+91-9876543210"}',
      'AUTO_VALIDATED', 0,
      '{"total_score": 0, "factors": [], "evaluated_at": "2026-10-01T10:00:00Z"}',
      NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'
    ) RETURNING id`,
    [cleanParcel.id]
  );
  await query(
    `INSERT INTO mutation_events (mutation_application_id, from_status, to_status, actor_id, reason)
     VALUES 
     ($1, 'SUBMITTED', 'AUTO_VALIDATED', 'SYSTEM_RULE_ENGINE', 'All encumbrance, litigation, and survey validations passed successfully')`,
    [mutRes1.rows[0].id]
  );

  // 1 Blocked Application (on encumbered/litigation parcel 4)
  const blockedParcel = createdParcels[4];
  const mutRes2 = await query(
    `INSERT INTO mutation_applications (
      application_number, parcel_id, applicant, status, risk_score, risk_breakdown_json, blocked_reason, submitted_at, updated_at
    ) VALUES (
      'MUT-2026-904123', $1,
      '{"name": "V. K. Shastry", "id_number": "ID-CIT-4123", "email": "applicant@demo.com"}',
      'BLOCKED', 90,
      '{"total_score": 90, "factors": [{"factor": "LEGAL_RESTRAINT", "severity": "HIGH", "score": 50, "reason": "Active court stay order in OS/2023/4412"}], "evaluated_at": "2026-10-02T12:00:00Z"}',
      'Active court injunction/stay in Case OS/2023/4412 (Senior Civil Judge Court, Medchal)',
      NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
    ) RETURNING id`,
    [blockedParcel.id]
  );
  await query(
    `INSERT INTO mutation_events (mutation_application_id, from_status, to_status, actor_id, reason)
     VALUES ($1, 'SUBMITTED', 'BLOCKED', 'SYSTEM_RULE_ENGINE', 'Auto-blocked: judicial stay in litigation record')`,
    [mutRes2.rows[0].id]
  );

  // 1 Field Verification Application (on change alert parcel 3)
  const fieldParcel = createdParcels[3];
  const mutRes3 = await query(
    `INSERT INTO mutation_applications (
      application_number, parcel_id, applicant, status, risk_score, risk_breakdown_json, submitted_at, updated_at
    ) VALUES (
      'MUT-2026-551209', $1,
      '{"name": "K. Chandrasekhar", "id_number": "ID-CIT-7711", "email": "kchandra@demo.com"}',
      'FIELD_VERIFICATION', 35,
      '{"total_score": 35, "factors": [{"factor": "UNVERIFIED_SATELLITE_CHANGE", "severity": "LOW", "score": 15, "reason": "Satellite vegetation clearing detected"}], "evaluated_at": "2026-10-03T15:30:00Z"}',
      NOW() - INTERVAL '1 day', NOW() - INTERVAL '4 hours'
    ) RETURNING id`,
    [fieldParcel.id]
  );
  await query(
    `INSERT INTO mutation_events (mutation_application_id, from_status, to_status, actor_id, reason)
     VALUES 
     ($1, 'SUBMITTED', 'OFFICER_REVIEW', 'SYSTEM_RULE_ENGINE', 'Flagged due to satellite change alert'),
     ($1, 'OFFICER_REVIEW', 'FIELD_VERIFICATION', 'officer@geodhara.demo', 'Dispatched to field officer K. Suresh for ground boundary verification')`,
    [mutRes3.rows[0].id]
  );

  // 8. Seed Field Observations
  console.log('Seeding field observations...');
  await query(
    `INSERT INTO field_observations (
      client_uuid, parcel_id, ulpin, field_officer_id, notes, photo_reference,
      gps_lat, gps_lng, observed_at, device_timestamp, sync_status, parcel_version
    ) VALUES 
    ('UUID-FIELD-DEMO-001', $1, $2, 'field@geodhara.demo',
     'Boundary markers verified on ground. North stone in place. No unauthorized permanent structures found.',
     'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400',
     17.5892, 78.4875, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours', 'SYNCED', 1),
    ('UUID-FIELD-DEMO-002', $3, $4, 'field@geodhara.demo',
     'Survey corner GPS coordinates logged. Agricultural borewell operating normally.',
     'https://images.unsplash.com/photo-1500076656116-558758c991c1?w=400',
     17.5910, 78.4950, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', 'SYNCED', 1)`,
    [cleanParcel.id, cleanParcel.ulpin, fieldParcel.id, fieldParcel.ulpin]
  );

  // 9. Initialize Cryptographic Audit Log Genesis Chain
  console.log('Building tamper-evident SHA-256 audit ledger chain...');
  await auditService.logAction({
    entityType: 'SYSTEM',
    entityId: 'GENESIS',
    action: 'SYSTEM_INITIALIZED',
    actorId: 'admin@geodhara.demo',
    payload: {
      platform: 'GeoDhara Digital Public Infrastructure',
      tagline: 'One parcel. One identity.',
      sih_problem_statement: 'PS 26014',
      total_seeded_parcels: createdParcels.length,
      notice: 'DEMO ENVIRONMENT - Synthetic data initialized.',
    },
  });

  // Log parcel creations into audit chain
  for (let k = 0; k < 10; k++) {
    const cp = createdParcels[k];
    await auditService.logAction({
      entityType: 'PARCEL',
      entityId: cp.id,
      action: 'PARCEL_REGISTERED',
      actorId: 'admin@geodhara.demo',
      payload: {
        ulpin: cp.ulpin,
        state_code: cp.state_code,
        village: cp.village,
        mandal: cp.mandal,
        area_sqm: cp.area_sqm,
        survey_no: cp.legacy_survey_no,
      },
    });
  }

  console.log('Verifying audit ledger integrity...');
  const integrity = await auditService.verifyChainIntegrity();
  console.log(`Audit chain records: ${integrity.checkedRecords}, Integrity verified: ${integrity.valid}`);

  console.log('✅ GeoDhara synthetic database seeding completed successfully!');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSeeds()
    .then(() => {
      console.log('Seeding process exited cleanly.');
      pool.end();
    })
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}
