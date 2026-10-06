export interface UnifiedParcelIdentity {
  id: string;
  ulpin: string;
  version: number;
  state_id: string;
  state_code: string;
  state_name: string;
  legacy_survey_no: string;
  village: string;
  mandal: string;
  district: string;
  recorded_area_sqm: number;
  geodesic_area_sqm: number;
  area_discrepancy_pct: number;
  geometry: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ParcelOwnerInfo {
  id: string;
  parcel_id: string;
  person_name: string;
  person_identifier: string;
  ownership_percentage: number;
  ownership_type: string;
  valid_from: string;
  valid_to?: string | null;
  is_current: boolean;
}

export interface LandRecordInfo {
  id: string;
  parcel_id: string;
  record_type: string;
  record_number: string;
  holder_info: Record<string, any>;
  area: number;
  source: string;
  record_date: string;
  status: string;
  document_reference?: string;
}

export interface RegistrationInfo {
  id: string;
  parcel_id: string;
  document_number: string;
  seller: string;
  buyer: string;
  seller_identifier: string;
  buyer_identifier: string;
  registration_date: string;
  registered_area_sqm: number;
  consideration_amount: number;
  registration_type: string;
  status: string;
}

export interface EncumbranceInfo {
  id: string;
  parcel_id: string;
  type: string;
  description: string;
  authority: string;
  reference_number: string;
  status: string;
  start_date: string;
  end_date?: string | null;
}

export interface LitigationCaseInfo {
  id: string;
  parcel_id: string;
  case_number: string;
  court: string;
  case_type: string;
  status: string;
  opened_at: string;
  closed_at?: string | null;
  description: string;
}

export interface LandUseInfo {
  id: string;
  parcel_id: string;
  category: string;
  sub_category?: string;
  zoning_authority: string;
  master_plan_name: string;
  effective_date: string;
}

export interface MutationAppInfo {
  id: string;
  application_number: string;
  parcel_id: string;
  applicant: Record<string, any>;
  registration_id?: string;
  status: string;
  risk_score: number;
  risk_breakdown_json: Record<string, any>;
  blocked_reason?: string | null;
  submitted_at: string;
  events?: Array<Record<string, any>>;
}

export interface ChangeAlertInfo {
  id: string;
  parcel_id: string;
  ulpin: string;
  type: string;
  confidence: number;
  cloud_pct: number;
  before_date: string;
  after_date: string;
  status: string;
  detection_method: string;
  details_json: Record<string, any>;
  alert_geometry: Record<string, any>;
  created_at: string;
  verified_by?: string | null;
  verified_at?: string | null;
}

export interface LegacyMappingInfo {
  id: string;
  state: string;
  legacy_system: string;
  legacy_survey_no: string;
  legacy_identifier: string;
  ulpin: string;
  confidence: number;
  status: string;
}

export interface RiskFactor {
  factor: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  score: number;
  description: string;
}

export interface RiskAssessment {
  score: number;
  category: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: RiskFactor[];
}

export interface UnifiedParcelResponse {
  meta: {
    tagline: string;
    dossier_type: string;
    is_synthetic_demo: boolean;
    notice: string;
  };
  parcel: UnifiedParcelIdentity;
  risk_assessment: RiskAssessment;
  ownership: {
    current_owners: ParcelOwnerInfo[];
    past_owners: ParcelOwnerInfo[];
    total_percentage: number;
  };
  land_records: LandRecordInfo[];
  registrations: RegistrationInfo[];
  encumbrances: EncumbranceInfo[];
  litigation: LitigationCaseInfo[];
  land_use: LandUseInfo[];
  mutation_applications: MutationAppInfo[];
  satellite_change_alerts: ChangeAlertInfo[];
  field_observations: Array<Record<string, any>>;
  legacy_mappings: LegacyMappingInfo[];
  version_history: Array<Record<string, any>>;
  audit_ledger: Array<Record<string, any>>;
}
