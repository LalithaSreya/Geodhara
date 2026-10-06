export type UserRole = 'citizen' | 'officer' | 'field_officer' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface State {
  id: string;
  code: string;
  name: string;
  boundary_geom?: any;
  created_at: string;
  updated_at: string;
}

export interface Parcel {
  id: string;
  ulpin: string;
  state_id: string;
  state_code: string;
  legacy_survey_no: string;
  village: string;
  mandal: string;
  district: string;
  area_sqm: number;
  geom: any; // GeoJSON geometry or WKT
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ParcelOwner {
  id: string;
  parcel_id: string;
  person_name: string;
  person_identifier: string;
  ownership_percentage: number;
  ownership_type: string;
  valid_from: string;
  valid_to?: string | null;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface LandRecord {
  id: string;
  parcel_id: string;
  record_type: string;
  record_number: string;
  holder_info: any;
  area: number;
  source: string;
  record_date: string;
  status: string;
  document_reference?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Registration {
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
  created_at: string;
  updated_at: string;
}

export interface Encumbrance {
  id: string;
  parcel_id: string;
  type: 'MORTGAGE' | 'COURT_STAY' | 'LIEN' | 'ATTACHMENT' | 'OTHER';
  description: string;
  authority: string;
  reference_number: string;
  status: 'ACTIVE' | 'DISCHARGED' | 'REVOKED';
  start_date: string;
  end_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LitigationCase {
  id: string;
  parcel_id: string;
  case_number: string;
  court: string;
  case_type: string;
  status: 'PENDING' | 'STAY_GRANTED' | 'DISPOSED' | 'DISMISSED';
  opened_at: string;
  closed_at?: string | null;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface LandUse {
  id: string;
  parcel_id: string;
  category: string;
  sub_category: string;
  source: string;
  effective_date: string;
  confidence: number;
  created_at: string;
  updated_at: string;
}

export type MutationStatus =
  | 'SUBMITTED'
  | 'AUTO_VALIDATED'
  | 'BLOCKED'
  | 'OFFICER_REVIEW'
  | 'FIELD_VERIFICATION'
  | 'APPROVED'
  | 'RECORD_UPDATED'
  | 'REJECTED';

export interface MutationApplication {
  id: string;
  application_number: string;
  parcel_id: string;
  applicant: {
    name: string;
    id_number: string;
    phone?: string;
    email?: string;
    type?: string;
  };
  registration_id?: string | null;
  status: MutationStatus;
  risk_score: number;
  risk_breakdown_json: any;
  blocked_reason?: string | null;
  submitted_at: string;
  updated_at: string;
  version: number;
}

export interface ChangeAlert {
  id: string;
  parcel_id: string;
  ulpin: string;
  type: 'VEGETATION_LOSS' | 'BUILT_UP_GAIN' | 'OTHER_CHANGE';
  confidence: number;
  cloud_pct: number;
  geometry: any;
  before_date: string;
  after_date: string;
  status: 'PENDING' | 'VERIFIED' | 'DISMISSED';
  detection_method: string;
  details_json: any;
  created_at: string;
  verified_by?: string | null;
  verified_at?: string | null;
}

export interface FieldObservation {
  id: string;
  client_uuid: string;
  parcel_id: string;
  ulpin: string;
  field_officer_id: string;
  notes: string;
  photo_reference?: string | null;
  gps_lat: number;
  gps_lng: number;
  observed_at: string;
  device_timestamp: string;
  server_timestamp: string;
  sync_status: string;
  parcel_version: number;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_id: string;
  payload_json: any;
  prev_hash: string;
  hash: string;
  created_at: string;
}
