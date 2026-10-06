/**
 * Synthetic Fallback Data Provider for SIH 2026 Demonstration.
 * Activated gracefully whenever the live PostgreSQL/PostGIS database or Node API is disconnected.
 */

export const MOCK_PARCELS_360: Record<string, any> = {
  TSQXY9QM4KNXSZ: {
    parcel: {
      id: 'mock-p-ts-1',
      ulpin: 'TSQXY9QM4KNXSZ',
      state_code: 'TS',
      state_name: 'Telangana',
      legacy_survey_no: '101/1',
      village: 'Medchal',
      mandal: 'Medchal',
      district: 'Medchal-Malkajgiri',
      recorded_area_sqm: 14500,
      geodesic_area_sqm: 14498.4,
      area_discrepancy_pct: 0.01,
      land_use: 'AGRICULTURAL',
      status: 'CLEAN',
      boundary_geojson: {
        type: 'Polygon',
        coordinates: [
          [
            [78.485, 17.585],
            [78.4925, 17.585],
            [78.4925, 17.5915],
            [78.485, 17.5915],
            [78.485, 17.585],
          ],
        ],
      },
    },
    risk_assessment: {
      score: 12,
      category: 'LOW',
      flags: [],
      breakdown: { litigation: 0, encumbrance: 0, discrepancy: 0, churn: 12 },
    },
    ownership: {
      current_owners: [
        {
          person_name: 'Ramesh Kumar',
          person_identifier: 'TS-PB-101-1',
          share_percentage: 0.6,
          ownership_type: 'PATTADAR_TITLE',
        },
        {
          person_name: 'P. Lakshmi Devi',
          person_identifier: 'TS-PB-101-2',
          share_percentage: 0.4,
          ownership_type: 'PATTADAR_TITLE',
        },
      ],
      previous_owners: [
        {
          person_name: 'Late Sri Vanga Ram Reddy',
          transfer_date: '2018-05-12',
          transfer_reason: 'INHERITANCE_SUCCESSION',
        },
      ],
    },
    land_records: [
      {
        record_type: 'PATTADAR_PASSBOOK',
        record_number: 'TS-PB-101-1',
        holder_info: {
          primary_holder: 'Ramesh Kumar',
          passbook_no: 'TS-PB-101-1',
          khata_number: 'KH-101',
        },
        verified: true,
      },
    ],
    encumbrances: [],
    litigation: [],
    registrations: [
      {
        id: 'reg-demo-1',
        document_number: 'DOC-2023-8891',
        buyer: 'Vanga Nishith Reddy',
        seller: 'Ramesh Kumar',
        registration_date: '2024-02-15',
        sro_office: 'SRO Medchal',
      },
    ],
    change_alerts: [],
  },

  TSZQ5STGR65JMU: {
    parcel: {
      id: 'mock-p-ts-2',
      ulpin: 'TSZQ5STGR65JMU',
      state_code: 'TS',
      state_name: 'Telangana',
      legacy_survey_no: '102/2',
      village: 'Kompally',
      mandal: 'Dundigal Gandimaisamma',
      district: 'Medchal-Malkajgiri',
      recorded_area_sqm: 8200,
      geodesic_area_sqm: 8196.2,
      area_discrepancy_pct: 0.05,
      land_use: 'AGRICULTURAL',
      status: 'MORTGAGE',
      boundary_geojson: {
        type: 'Polygon',
        coordinates: [
          [
            [78.493, 17.585],
            [78.5005, 17.585],
            [78.5005, 17.5915],
            [78.493, 17.5915],
            [78.493, 17.585],
          ],
        ],
      },
    },
    risk_assessment: {
      score: 55,
      category: 'MEDIUM',
      flags: ['ACTIVE_BANK_MORTGAGE'],
      breakdown: { litigation: 0, encumbrance: 40, discrepancy: 0, churn: 15 },
    },
    ownership: {
      current_owners: [
        {
          person_name: 'K. Venkat Reddy',
          person_identifier: 'TS-PB-102-2',
          share_percentage: 1.0,
          ownership_type: 'PATTADAR_TITLE',
        },
      ],
      previous_owners: [],
    },
    land_records: [
      {
        record_type: 'PATTADAR_PASSBOOK',
        record_number: 'TS-PB-102-2',
        holder_info: {
          primary_holder: 'K. Venkat Reddy',
          passbook_no: 'TS-PB-102-2',
          khata_number: 'KH-102',
        },
        verified: true,
      },
    ],
    encumbrances: [
      {
        id: 'enc-1',
        financial_institution: 'State Bank of India (Kompally Branch)',
        amount: 2500000,
        encumbrance_type: 'AGRICULTURAL_TERM_LOAN_MORTGAGE',
        registered_date: '2023-08-10',
        status: 'ACTIVE_LIEN',
      },
    ],
    litigation: [],
    registrations: [],
    change_alerts: [],
  },

  TSSMSR2Z03QTQD: {
    parcel: {
      id: 'mock-p-ts-3',
      ulpin: 'TSSMSR2Z03QTQD',
      state_code: 'TS',
      state_name: 'Telangana',
      legacy_survey_no: '103/1',
      village: 'Gundlapochampally',
      mandal: 'Medchal',
      district: 'Medchal-Malkajgiri',
      recorded_area_sqm: 12000,
      geodesic_area_sqm: 11985.0,
      area_discrepancy_pct: 0.12,
      land_use: 'RESIDENTIAL',
      status: 'STAY_ORDER',
      boundary_geojson: {
        type: 'Polygon',
        coordinates: [
          [
            [78.501, 17.585],
            [78.5085, 17.585],
            [78.5085, 17.5915],
            [78.501, 17.5915],
            [78.501, 17.585],
          ],
        ],
      },
    },
    risk_assessment: {
      score: 95,
      category: 'CRITICAL',
      flags: ['ACTIVE_JUDICIAL_STAY', 'CIVIL_COURT_INJUNCTION'],
      breakdown: { litigation: 70, encumbrance: 0, discrepancy: 10, churn: 15 },
    },
    ownership: {
      current_owners: [
        {
          person_name: 'Mohammed Abdul Kareem',
          person_identifier: 'TS-PB-103-1',
          share_percentage: 1.0,
          ownership_type: 'PATTADAR_TITLE',
        },
      ],
      previous_owners: [],
    },
    land_records: [
      {
        record_type: 'PATTADAR_PASSBOOK',
        record_number: 'TS-PB-103-1',
        holder_info: {
          primary_holder: 'Mohammed Abdul Kareem',
          passbook_no: 'TS-PB-103-1',
          khata_number: 'KH-103',
        },
        verified: true,
      },
    ],
    encumbrances: [],
    litigation: [
      {
        id: 'lit-1',
        case_number: 'OS/2023/4412',
        court_name: 'Court of Senior Civil Judge, Medchal',
        petitioner: 'S. N. Rao & Others',
        respondent: 'Mohammed Abdul Kareem',
        stay_order_active: true,
        stay_order_date: '2023-11-04',
        prohibition_summary: 'Interim Status Quo Injunction restraining alienation or registration.',
      },
    ],
    registrations: [],
    change_alerts: [],
  },

  KAQMWVSBJHWXC7: {
    parcel: {
      id: 'mock-p-ka-1',
      ulpin: 'KAQMWVSBJHWXC7',
      state_code: 'KA',
      state_name: 'Karnataka',
      legacy_survey_no: 'Sy-87/1',
      village: 'Devanahalli',
      mandal: 'Devanahalli Hobli',
      district: 'Bengaluru Rural',
      recorded_area_sqm: 9800,
      geodesic_area_sqm: 9792.0,
      area_discrepancy_pct: 0.08,
      land_use: 'AGRICULTURAL',
      status: 'BHOOMI_RTC',
      boundary_geojson: {
        type: 'Polygon',
        coordinates: [
          [
            [77.712, 13.242],
            [77.719, 13.242],
            [77.719, 13.248],
            [77.712, 13.248],
            [77.712, 13.242],
          ],
        ],
      },
    },
    risk_assessment: {
      score: 18,
      category: 'LOW',
      flags: [],
      breakdown: { litigation: 0, encumbrance: 0, discrepancy: 8, churn: 10 },
    },
    ownership: {
      current_owners: [
        {
          person_name: 'Muniyappa Gowda',
          person_identifier: 'KA-RTC-87-1',
          share_percentage: 1.0,
          ownership_type: 'KHATEDAR_TITLE',
        },
      ],
      previous_owners: [],
    },
    land_records: [
      {
        record_type: 'BHOOMI_RTC_EXTRACT',
        record_number: 'RTC-2024-87-1',
        holder_info: {
          primary_holder: 'Muniyappa Gowda',
          khata_number: 'KH-KA-87',
          mr_number: 'MR/2023-4419',
        },
        verified: true,
      },
    ],
    encumbrances: [],
    litigation: [],
    registrations: [],
    change_alerts: [],
  },

  TSHUK8ZNXG7QVJ: {
    parcel: {
      id: 'mock-p-ts-4',
      ulpin: 'TSHUK8ZNXG7QVJ',
      state_code: 'TS',
      state_name: 'Telangana',
      legacy_survey_no: '104/3',
      village: 'Dulapally',
      mandal: 'Dundigal Gandimaisamma',
      district: 'Medchal-Malkajgiri',
      recorded_area_sqm: 16000,
      geodesic_area_sqm: 15980.0,
      area_discrepancy_pct: 0.12,
      land_use: 'AGRICULTURAL',
      status: 'AI_ALERT',
      boundary_geojson: {
        type: 'Polygon',
        coordinates: [
          [
            [78.509, 17.585],
            [78.5165, 17.585],
            [78.5165, 17.5915],
            [78.509, 17.5915],
            [78.509, 17.585],
          ],
        ],
      },
    },
    risk_assessment: {
      score: 45,
      category: 'MEDIUM',
      flags: ['SATELLITE_VEGETATION_LOSS_DETECTED'],
      breakdown: { litigation: 0, encumbrance: 0, discrepancy: 10, churn: 35 },
    },
    ownership: {
      current_owners: [
        {
          person_name: 'Chandra Shekar Goud',
          person_identifier: 'TS-PB-104-3',
          share_percentage: 1.0,
          ownership_type: 'PATTADAR_TITLE',
        },
      ],
      previous_owners: [],
    },
    land_records: [
      {
        record_type: 'PATTADAR_PASSBOOK',
        record_number: 'TS-PB-104-3',
        holder_info: {
          primary_holder: 'Chandra Shekar Goud',
          passbook_no: 'TS-PB-104-3',
          khata_number: 'KH-104',
        },
        verified: true,
      },
    ],
    encumbrances: [],
    litigation: [],
    registrations: [],
    change_alerts: [
      {
        id: 'alert-mock-1',
        change_type: 'VEGETATION_LOSS',
        confidence_score: 0.91,
        severity: 'HIGH',
        detected_at: '2024-06-16',
        description: 'Sentinel-2 NDVI diff detected rapid tree canopy reduction and soil clearance.',
      },
    ],
  },
};

export function generateSyntheticParcelFallback(ulpin: string) {
  if (MOCK_PARCELS_360[ulpin]) {
    return MOCK_PARCELS_360[ulpin];
  }
  const isKa = ulpin.startsWith('KA');
  return {
    parcel: {
      id: `synthetic-${ulpin}`,
      ulpin,
      state_code: isKa ? 'KA' : 'TS',
      state_name: isKa ? 'Karnataka' : 'Telangana',
      legacy_survey_no: isKa ? 'Sy-89/2' : '105/1',
      village: isKa ? 'Devanahalli' : 'Medchal',
      mandal: isKa ? 'Devanahalli' : 'Medchal',
      district: isKa ? 'Bengaluru Rural' : 'Medchal-Malkajgiri',
      recorded_area_sqm: 10500,
      geodesic_area_sqm: 10495.2,
      area_discrepancy_pct: 0.04,
      land_use: 'AGRICULTURAL',
      status: 'CLEAN',
      boundary_geojson: {
        type: 'Polygon',
        coordinates: [
          [
            [78.485, 17.585],
            [78.4925, 17.585],
            [78.4925, 17.5915],
            [78.485, 17.5915],
            [78.485, 17.585],
          ],
        ],
      },
    },
    risk_assessment: {
      score: 15,
      category: 'LOW',
      flags: [],
      breakdown: { litigation: 0, encumbrance: 0, discrepancy: 0, churn: 15 },
    },
    ownership: {
      current_owners: [
        {
          person_name: 'Verified Landowner',
          person_identifier: `${isKa ? 'KA-RTC' : 'TS-PB'}-105-1`,
          share_percentage: 1.0,
          ownership_type: isKa ? 'KHATEDAR_TITLE' : 'PATTADAR_TITLE',
        },
      ],
      previous_owners: [],
    },
    land_records: [
      {
        record_type: isKa ? 'BHOOMI_RTC_EXTRACT' : 'PATTADAR_PASSBOOK',
        record_number: `${isKa ? 'KA-RTC' : 'TS-PB'}-105-1`,
        holder_info: {
          primary_holder: 'Verified Landowner',
          khata_number: 'KH-105',
        },
        verified: true,
      },
    ],
    encumbrances: [],
    litigation: [],
    registrations: [],
    change_alerts: [],
  };
}

export const MOCK_SATELLITE_SCENES = [
  {
    id: 'SCENE_TS_MEDCHAL_VEG_LOSS',
    name: 'Sentinel-2 Tile 44QKB (Medchal Forest/Agriculture Corridor)',
    location: 'Malkajgiri Mandal, Medchal-Malkajgiri District, Telangana',
    stateCode: 'TS',
    width: 32,
    height: 32,
    beforeDate: '2024-01-10',
    afterDate: '2024-06-15',
    cloudPct: 4.2,
  },
  {
    id: 'SCENE_KA_DEVANAHALLI_URBAN',
    name: 'Sentinel-2 Tile 43PGP (Devanahalli Airport Periphery)',
    location: 'Devanahalli Taluk, Bengaluru Rural, Karnataka',
    stateCode: 'KA',
    width: 32,
    height: 32,
    beforeDate: '2024-02-01',
    afterDate: '2024-07-20',
    cloudPct: 2.1,
  },
];

export const MOCK_CHANGE_ALERTS = [
  {
    id: 'alert-ts-01',
    ulpin: 'TSHUK8ZNXG7QVJ',
    legacy_survey_no: '104/3',
    village: 'Dulapally',
    change_type: 'VEGETATION_LOSS',
    alert_status: 'PENDING_VERIFICATION',
    confidence_score: 0.91,
    ndvi_drop: 0.38,
    ndbi_surge: 0.12,
    detected_at: '2024-06-16T10:30:00Z',
    severity: 'HIGH',
    description: 'Significant reduction in vegetative cover detected on boundary perimeter.',
  },
  {
    id: 'alert-ts-02',
    ulpin: 'TS1EZQMU38RE38',
    legacy_survey_no: '106/2',
    village: 'Medchal',
    change_type: 'NEW_CONSTRUCTION',
    alert_status: 'FIELD_DISPATCHED',
    confidence_score: 0.84,
    ndvi_drop: 0.15,
    ndbi_surge: 0.42,
    detected_at: '2024-06-18T14:15:00Z',
    severity: 'MEDIUM',
    description: 'Rapid increase in built-up spectral index indicating unauthorized structure foundation.',
  },
];

export const MOCK_MUTATIONS_LIST = [
  {
    id: 'mut-app-1',
    application_number: 'MUT-2026-0001',
    ulpin: 'TSQXY9QM4KNXSZ',
    legacy_survey_no: '101/1',
    village: 'Medchal',
    applicant: { name: 'Vanga Nishith Reddy', id_number: 'AADHAAR-8891-2309' },
    risk_score: 12,
    status: 'AUTO_VALIDATED',
    submitted_at: '2026-02-10T09:30:00Z',
  },
  {
    id: 'mut-app-2',
    application_number: 'MUT-2026-0002',
    ulpin: 'TSSMSR2Z03QTQD',
    legacy_survey_no: '103/1',
    village: 'Gundlapochampally',
    applicant: { name: 'S. K. Verma', id_number: 'AADHAAR-9900-1122' },
    risk_score: 95,
    status: 'BLOCKED',
    blocked_reason: 'Active Court Stay (Case OS/2023/4412 in Senior Civil Judge Medchal).',
    submitted_at: '2026-02-11T11:45:00Z',
  },
  {
    id: 'mut-app-3',
    application_number: 'MUT-2026-0003',
    ulpin: 'TSHUK8ZNXG7QVJ',
    legacy_survey_no: '104/3',
    village: 'Dulapally',
    applicant: { name: 'B. Srinivas', id_number: 'AADHAAR-5544-3322' },
    risk_score: 45,
    status: 'FIELD_VERIFICATION',
    submitted_at: '2026-02-12T14:20:00Z',
  },
  {
    id: 'mut-app-4',
    application_number: 'MUT-2026-0004',
    ulpin: 'KAQMWVSBJHWXC7',
    legacy_survey_no: 'Sy-87/1',
    village: 'Devanahalli',
    applicant: { name: 'Anand Kumar Jain', id_number: 'AADHAAR-7788-9900' },
    risk_score: 18,
    status: 'OFFICER_REVIEW',
    submitted_at: '2026-02-13T16:00:00Z',
  },
];

export const MOCK_AUDIT_LEDGER = [
  {
    block_index: 0,
    event_type: 'GENESIS_PARCEL_MINT',
    target_ulpin: 'TSQXY9QM4KNXSZ',
    actor: 'SYSTEM_GENESIS_SEED',
    current_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    previous_hash: '0000000000000000000000000000000000000000000000000000000000000000',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    block_index: 1,
    event_type: 'DEED_REGISTRATION_LINKAGE',
    target_ulpin: 'TSQXY9QM4KNXSZ',
    actor: 'SRO_MEDCHAL_ADAPTER',
    current_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    previous_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    created_at: '2026-02-10T09:30:00Z',
  },
  {
    block_index: 2,
    event_type: 'MUTATION_AUTO_VALIDATE',
    target_ulpin: 'TSQXY9QM4KNXSZ',
    actor: 'RULE_ENGINE_VALIDATOR',
    current_hash: 'a4f89d8174e98f729b47e8e9cd81e6a17b88ec6e1f0e8f8b89e3a7a9d0f2b3e4',
    previous_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    created_at: '2026-02-10T09:31:00Z',
  },
];
