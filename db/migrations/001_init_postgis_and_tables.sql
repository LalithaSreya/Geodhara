-- ==========================================================
-- GeoDhara: Database Schema Migration
-- PostGIS spatial extensions + Land Governance Tables
-- ==========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. States Table
CREATE TABLE IF NOT EXISTS states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    boundary_geom geometry(MultiPolygon, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_states_boundary ON states USING GIST (boundary_geom);

-- 2. Parcels Table
CREATE TABLE IF NOT EXISTS parcels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ulpin VARCHAR(14) UNIQUE NOT NULL,
    state_id UUID REFERENCES states(id) ON DELETE CASCADE,
    state_code VARCHAR(10) NOT NULL,
    legacy_survey_no VARCHAR(50) NOT NULL,
    village VARCHAR(100) NOT NULL,
    mandal VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    area_sqm NUMERIC(14, 2) NOT NULL,
    geom geometry(Polygon, 4326) NOT NULL,
    version INT DEFAULT 1 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_parcels_geom ON parcels USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_parcels_ulpin ON parcels (ulpin);
CREATE INDEX IF NOT EXISTS idx_parcels_legacy_survey ON parcels (legacy_survey_no);
CREATE INDEX IF NOT EXISTS idx_parcels_village ON parcels (village);
CREATE INDEX IF NOT EXISTS idx_parcels_state_code ON parcels (state_code);

-- 3. Parcel Owners Table
CREATE TABLE IF NOT EXISTS parcel_owners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id UUID REFERENCES parcels(id) ON DELETE CASCADE,
    person_name VARCHAR(150) NOT NULL,
    person_identifier VARCHAR(50) NOT NULL,
    ownership_percentage NUMERIC(5, 2) NOT NULL,
    ownership_type VARCHAR(50) NOT NULL, -- 'SOLE', 'JOINT', 'COPARCENARY'
    valid_from DATE NOT NULL,
    valid_to DATE,
    is_current BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_parcel_owners_parcel_id ON parcel_owners (parcel_id);
CREATE INDEX IF NOT EXISTS idx_parcel_owners_identifier ON parcel_owners (person_identifier);

-- 4. Parcel Versions (Optimistic Concurrency & Audit Snapshot)
CREATE TABLE IF NOT EXISTS parcel_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id UUID REFERENCES parcels(id) ON DELETE CASCADE,
    version INT NOT NULL,
    snapshot_json JSONB NOT NULL,
    changed_by VARCHAR(100) NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    change_reason TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_parcel_versions_parcel ON parcel_versions (parcel_id, version);

-- 5. Legacy ID Map
CREATE TABLE IF NOT EXISTS legacy_id_map (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state VARCHAR(50) NOT NULL,
    legacy_system VARCHAR(100) NOT NULL,
    legacy_survey_no VARCHAR(50) NOT NULL,
    legacy_identifier VARCHAR(100) NOT NULL,
    ulpin VARCHAR(14) NOT NULL,
    confidence NUMERIC(4, 2) DEFAULT 1.00 NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'MATCHED', 'MISMATCH_FLAGGED', 'UNDER_REVIEW'
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_legacy_id_map_ulpin ON legacy_id_map (ulpin);
CREATE INDEX IF NOT EXISTS idx_legacy_id_map_survey ON legacy_id_map (legacy_survey_no);

-- 6. Land Records (Record of Rights / RoR / Pahani)
CREATE TABLE IF NOT EXISTS land_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id UUID REFERENCES parcels(id) ON DELETE CASCADE,
    record_type VARCHAR(50) NOT NULL,
    record_number VARCHAR(100) NOT NULL,
    holder_info JSONB NOT NULL,
    area NUMERIC(14, 2) NOT NULL,
    source VARCHAR(100) NOT NULL,
    record_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL,
    document_reference VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_land_records_parcel ON land_records (parcel_id);

-- 7. Registrations (Sub-Registrar Deeds)
CREATE TABLE IF NOT EXISTS registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id UUID REFERENCES parcels(id) ON DELETE CASCADE,
    document_number VARCHAR(100) NOT NULL,
    seller VARCHAR(150) NOT NULL,
    buyer VARCHAR(150) NOT NULL,
    seller_identifier VARCHAR(50) NOT NULL,
    buyer_identifier VARCHAR(50) NOT NULL,
    registration_date DATE NOT NULL,
    registered_area_sqm NUMERIC(14, 2) NOT NULL,
    consideration_amount NUMERIC(16, 2) NOT NULL,
    registration_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'REGISTERED' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_registrations_parcel ON registrations (parcel_id);
CREATE INDEX IF NOT EXISTS idx_registrations_doc_no ON registrations (document_number);

-- 8. Encumbrances (Mortgages, Court stays, Liens, Attachments)
CREATE TABLE IF NOT EXISTS encumbrances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id UUID REFERENCES parcels(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'MORTGAGE', 'COURT_STAY', 'LIEN', 'ATTACHMENT', 'OTHER'
    description TEXT NOT NULL,
    authority VARCHAR(150) NOT NULL,
    reference_number VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_encumbrances_parcel ON encumbrances (parcel_id);
CREATE INDEX IF NOT EXISTS idx_encumbrances_status ON encumbrances (status);

-- 9. Litigation Cases
CREATE TABLE IF NOT EXISTS litigation_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id UUID REFERENCES parcels(id) ON DELETE CASCADE,
    case_number VARCHAR(100) NOT NULL,
    court VARCHAR(150) NOT NULL,
    case_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING' NOT NULL,
    opened_at DATE NOT NULL,
    closed_at DATE,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_litigation_parcel ON litigation_cases (parcel_id);
CREATE INDEX IF NOT EXISTS idx_litigation_status ON litigation_cases (status);

-- 10. Land Use
CREATE TABLE IF NOT EXISTS land_use (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id UUID REFERENCES parcels(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    sub_category VARCHAR(100) NOT NULL,
    source VARCHAR(100) NOT NULL,
    effective_date DATE NOT NULL,
    confidence NUMERIC(4, 2) DEFAULT 0.95 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_land_use_parcel ON land_use (parcel_id);

-- 11. Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'citizen', 'officer', 'field_officer', 'admin'
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- 12. Mutation Applications
CREATE TABLE IF NOT EXISTS mutation_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_number VARCHAR(50) UNIQUE NOT NULL,
    parcel_id UUID REFERENCES parcels(id) ON DELETE CASCADE,
    applicant JSONB NOT NULL,
    registration_id UUID REFERENCES registrations(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'SUBMITTED' NOT NULL, -- SUBMITTED, AUTO_VALIDATED, BLOCKED, OFFICER_REVIEW, FIELD_VERIFICATION, APPROVED, RECORD_UPDATED, REJECTED
    risk_score INT DEFAULT 0 NOT NULL,
    risk_breakdown_json JSONB DEFAULT '{}'::jsonb NOT NULL,
    blocked_reason TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    version INT DEFAULT 1 NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mutation_parcel ON mutation_applications (parcel_id);
CREATE INDEX IF NOT EXISTS idx_mutation_status ON mutation_applications (status);
CREATE INDEX IF NOT EXISTS idx_mutation_app_no ON mutation_applications (application_number);

-- 13. Mutation Events (Workflow Audit & Transitions)
CREATE TABLE IF NOT EXISTS mutation_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mutation_application_id UUID REFERENCES mutation_applications(id) ON DELETE CASCADE,
    from_status VARCHAR(50) NOT NULL,
    to_status VARCHAR(50) NOT NULL,
    actor_id VARCHAR(100) NOT NULL,
    reason TEXT,
    metadata_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mutation_events_app ON mutation_events (mutation_application_id);

-- 14. Audit Log (Tamper-evident Hash Chain)
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seq BIGSERIAL UNIQUE NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    actor_id VARCHAR(100) NOT NULL,
    payload_json JSONB NOT NULL,
    prev_hash VARCHAR(64) NOT NULL,
    hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS seq BIGSERIAL UNIQUE;
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_seq ON audit_log (seq);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log (created_at);

-- 15. Change Alerts (Satellite Aligned)
CREATE TABLE IF NOT EXISTS change_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id UUID REFERENCES parcels(id) ON DELETE CASCADE,
    ulpin VARCHAR(14) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'VEGETATION_LOSS', 'BUILT_UP_GAIN', 'OTHER_CHANGE'
    confidence NUMERIC(4, 2) NOT NULL,
    cloud_pct NUMERIC(4, 2) DEFAULT 0.00 NOT NULL,
    geometry geometry(Polygon, 4326) NOT NULL,
    before_date DATE NOT NULL,
    after_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING' NOT NULL, -- 'PENDING', 'VERIFIED', 'DISMISSED'
    detection_method VARCHAR(100) DEFAULT 'SATELLITE_NDVI_NDBI_DIFFERENCING' NOT NULL,
    details_json JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    verified_by VARCHAR(100),
    verified_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_change_alerts_geom ON change_alerts USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_change_alerts_parcel ON change_alerts (parcel_id);
CREATE INDEX IF NOT EXISTS idx_change_alerts_status ON change_alerts (status);

-- 16. Field Observations
CREATE TABLE IF NOT EXISTS field_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_uuid VARCHAR(100) UNIQUE NOT NULL,
    parcel_id UUID REFERENCES parcels(id) ON DELETE CASCADE,
    ulpin VARCHAR(14) NOT NULL,
    field_officer_id VARCHAR(100) NOT NULL,
    notes TEXT NOT NULL,
    photo_reference VARCHAR(255),
    gps_lat NUMERIC(10, 7) NOT NULL,
    gps_lng NUMERIC(10, 7) NOT NULL,
    observed_at TIMESTAMPTZ NOT NULL,
    device_timestamp TIMESTAMPTZ NOT NULL,
    server_timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    sync_status VARCHAR(50) DEFAULT 'SYNCED' NOT NULL,
    parcel_version INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_field_obs_parcel ON field_observations (parcel_id);
CREATE INDEX IF NOT EXISTS idx_field_obs_officer ON field_observations (field_officer_id);

-- 17. Sync Log
CREATE TABLE IF NOT EXISTS sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_uuid VARCHAR(100) NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    operation_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    conflict_details JSONB,
    processed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sync_log_client ON sync_log (client_uuid);

-- 18. Refresh Tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens (user_id);
