import { query } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';

export interface NormalizedParcelSchema {
  source_system: string;
  source_state: string;
  is_mock_adapter: true;
  disclaimer: string;
  standard_ulpin: string;
  state_code: string;
  state_name: string;
  normalized_survey_no: string;
  administrative_location: {
    village: string;
    mandal: string;
    district: string;
    state: string;
  };
  normalized_area_sqm: number;
  normalized_area_acres: number;
  normalized_owners: Array<{
    name: string;
    identifier: string;
    share_percentage: number;
    ownership_type: string;
  }>;
  normalized_land_use: string;
  encumbrance_flag: boolean;
  litigation_flag: boolean;
  source_raw_data: Record<string, any>;
}

export interface TelanganaSyntheticSchema {
  survey_no: string;
  pattadar_name: string;
  pattadar_passbook_no: string;
  khata_number: string;
  extent_acres_guntas: string;
  extent_sqm: number;
  nature_of_land: string;
  sro_office: string;
  village_name: string;
  mandal_name: string;
  district_name: string;
  last_mutation_deed_no?: string;
}

export interface KarnatakaSyntheticSchema {
  survey_number: string;
  hissa_no: string;
  owner_name: string;
  rtc_number: string;
  mr_number: string;
  area_acres_guntas: string;
  area_sqm: number;
  land_type: string;
  soil_type: string;
  taluk_office: string;
  village_name: string;
  hobli_name: string;
  district_name: string;
}

/**
 * Mock State Adapter for Telangana (Dharani Portal emulation)
 * Notice: Synthetic simulated adapter for SIH 2026 prototype demonstration.
 */
export class TelanganaStateAdapter {
  static readonly SYSTEM_NAME = 'Dharani Land Portal (Mock Adapter)';
  static readonly STATE_CODE = 'TS';

  /**
   * Fetch synthetic record in Telangana legacy schema by survey number or legacy identifier
   */
  static async fetchRecord(identifier: string): Promise<TelanganaSyntheticSchema | null> {
    const res = await query(
      `SELECT p.ulpin, p.legacy_survey_no, p.village, p.mandal, p.district, p.area_sqm,
              po.person_name, po.person_identifier, lr.record_number, lr.holder_info,
              m.legacy_identifier
       FROM parcels p
       JOIN legacy_id_map m ON m.ulpin = p.ulpin
       LEFT JOIN parcel_owners po ON po.parcel_id = p.id AND po.is_current = TRUE
       LEFT JOIN land_records lr ON lr.parcel_id = p.id
       WHERE p.state_code = 'TS' 
         AND (p.legacy_survey_no = $1 OR m.legacy_identifier = $1 OR p.ulpin = $1)
       LIMIT 1`,
      [identifier]
    );

    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    const sqm = parseFloat(row.area_sqm);
    const acres = (sqm / 4046.86).toFixed(2);
    const guntas = (((sqm / 4046.86) % 1) * 40).toFixed(0);

    return {
      survey_no: row.legacy_survey_no,
      pattadar_name: row.person_name || 'Sri ' + (row.holder_info?.primary_holder || 'Rythu'),
      pattadar_passbook_no: row.holder_info?.passbook_no || `TS-PB-${row.legacy_survey_no.replace('/', '-')}`,
      khata_number: row.holder_info?.khata_number || `KH-${Math.floor(100 + Math.random() * 900)}`,
      extent_acres_guntas: `${Math.floor(parseFloat(acres))} Ac ${guntas} Gts`,
      extent_sqm: sqm,
      nature_of_land: 'Pattadar Agricultural / Wet',
      sro_office: `Sub-Registrar Office, ${row.mandal}`,
      village_name: row.village,
      mandal_name: row.mandal,
      district_name: row.district,
      last_mutation_deed_no: row.record_number,
    };
  }

  /**
   * Normalize Telangana synthetic schema into standard GeoDhara unified schema
   */
  static normalize(raw: TelanganaSyntheticSchema, mappedUlpin: string): NormalizedParcelSchema {
    return {
      source_system: TelanganaStateAdapter.SYSTEM_NAME,
      source_state: 'Telangana',
      is_mock_adapter: true,
      disclaimer: 'Mock State Adapter: Synthetic simulation for SIH 2026 prototype demonstration; not a live government integration.',
      standard_ulpin: mappedUlpin,
      state_code: 'TS',
      state_name: 'Telangana',
      normalized_survey_no: raw.survey_no,
      administrative_location: {
        village: raw.village_name,
        mandal: raw.mandal_name,
        district: raw.district_name,
        state: 'Telangana',
      },
      normalized_area_sqm: raw.extent_sqm,
      normalized_area_acres: parseFloat((raw.extent_sqm / 4046.86).toFixed(2)),
      normalized_owners: [
        {
          name: raw.pattadar_name,
          identifier: raw.pattadar_passbook_no,
          share_percentage: 1.0,
          ownership_type: 'PATTADAR_TITLE',
        },
      ],
      normalized_land_use: 'AGRICULTURAL',
      encumbrance_flag: false,
      litigation_flag: false,
      source_raw_data: raw,
    };
  }
}

/**
 * Mock State Adapter for Karnataka (Bhoomi RTC emulation)
 * Notice: Synthetic simulated adapter for SIH 2026 prototype demonstration.
 */
export class KarnatakaStateAdapter {
  static readonly SYSTEM_NAME = 'Bhoomi RTC (Mock Adapter)';
  static readonly STATE_CODE = 'KA';

  /**
   * Fetch synthetic record in Karnataka legacy schema by survey number or legacy identifier
   */
  static async fetchRecord(identifier: string): Promise<KarnatakaSyntheticSchema | null> {
    const res = await query(
      `SELECT p.ulpin, p.legacy_survey_no, p.village, p.mandal, p.district, p.area_sqm,
              po.person_name, po.person_identifier, lr.record_number, lr.holder_info,
              m.legacy_identifier
       FROM parcels p
       JOIN legacy_id_map m ON m.ulpin = p.ulpin
       LEFT JOIN parcel_owners po ON po.parcel_id = p.id AND po.is_current = TRUE
       LEFT JOIN land_records lr ON lr.parcel_id = p.id
       WHERE p.state_code = 'KA' 
         AND (p.legacy_survey_no = $1 OR m.legacy_identifier = $1 OR p.ulpin = $1)
       LIMIT 1`,
      [identifier]
    );

    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    const sqm = parseFloat(row.area_sqm);
    const acres = (sqm / 4046.86).toFixed(2);
    const guntas = (((sqm / 4046.86) % 1) * 40).toFixed(0);

    const parts = row.legacy_survey_no.replace('Sy-', '').split('/');
    const surveyNo = parts[0] || '87';
    const hissaNo = parts[1] || '1';

    return {
      survey_number: surveyNo,
      hissa_no: hissaNo,
      owner_name: row.person_name || (row.holder_info?.primary_holder || 'Owner'),
      rtc_number: row.holder_info?.khata_number || `KA-RTC-${surveyNo}-${hissaNo}`,
      mr_number: row.record_number || `MR/2023-${Math.floor(1000 + Math.random() * 9000)}`,
      area_acres_guntas: `${Math.floor(parseFloat(acres))} Acre ${guntas} Gunta`,
      area_sqm: sqm,
      land_type: 'Dry Land / Bagayat',
      soil_type: 'Red Loamy Soil',
      taluk_office: `Taluk Office, ${row.mandal}`,
      village_name: row.village,
      hobli_name: `${row.mandal} Hobli`,
      district_name: row.district,
    };
  }

  /**
   * Normalize Karnataka synthetic schema into standard GeoDhara unified schema
   */
  static normalize(raw: KarnatakaSyntheticSchema, mappedUlpin: string): NormalizedParcelSchema {
    return {
      source_system: KarnatakaStateAdapter.SYSTEM_NAME,
      source_state: 'Karnataka',
      is_mock_adapter: true,
      disclaimer: 'Mock State Adapter: Synthetic simulation for SIH 2026 prototype demonstration; not a live government integration.',
      standard_ulpin: mappedUlpin,
      state_code: 'KA',
      state_name: 'Karnataka',
      normalized_survey_no: `Sy-${raw.survey_number}/${raw.hissa_no}`,
      administrative_location: {
        village: raw.village_name,
        mandal: raw.hobli_name,
        district: raw.district_name,
        state: 'Karnataka',
      },
      normalized_area_sqm: raw.area_sqm,
      normalized_area_acres: parseFloat((raw.area_sqm / 4046.86).toFixed(2)),
      normalized_owners: [
        {
          name: raw.owner_name,
          identifier: raw.rtc_number,
          share_percentage: 1.0,
          ownership_type: 'KHATEDAR_TITLE',
        },
      ],
      normalized_land_use: 'AGRICULTURAL',
      encumbrance_flag: false,
      litigation_flag: false,
      source_raw_data: raw,
    };
  }
}
