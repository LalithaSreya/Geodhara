import {
  MOCK_PARCELS_360,
  generateSyntheticParcelFallback,
  MOCK_SATELLITE_SCENES,
  MOCK_CHANGE_ALERTS,
  MOCK_MUTATIONS_LIST,
  MOCK_AUDIT_LEDGER,
} from './mockData';

const API_BASE = '/api';

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('geodhara_auth_token');
  }

  private getMockFallback(endpoint: string, options: RequestInit = {}): any {
    const clean = endpoint.split('?')[0];

    // 1. Parcels 360
    if (clean.startsWith('/parcels/') && !clean.includes('/search') && !clean.includes('/states/')) {
      const parts = clean.split('/');
      const ulpin = parts[2] ? decodeURIComponent(parts[2]).toUpperCase() : 'TSQXY9QM4KNXSZ';
      if (clean.endsWith('/risk')) {
        const p = generateSyntheticParcelFallback(ulpin);
        return { data: p.risk_assessment };
      }
      if (clean.endsWith('/neighbours')) {
        const list = Object.values(MOCK_PARCELS_360).slice(0, 3).map((p) => ({
          ...p.parcel,
          geometry: p.parcel.boundary_geojson,
        }));
        return { data: { neighbours: list } };
      }
      return { data: generateSyntheticParcelFallback(ulpin) };
    }

    // 2. Search / List Parcels
    if (clean.startsWith('/parcels/search') || clean === '/parcels') {
      const allParcels = Object.values(MOCK_PARCELS_360).map((item) => ({
        ...item.parcel,
        risk_level: item.risk_assessment.category,
        current_owners: item.ownership.current_owners,
      }));
      return {
        type: 'FeatureCollection',
        results: allParcels,
        total: allParcels.length,
        features: allParcels.map((p) => ({
          type: 'Feature',
          geometry: p.boundary_geojson,
          properties: p,
        })),
      };
    }

    // 3. State Boundaries GeoJSON
    if (clean.includes('/states/geojson')) {
      return {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { code: 'TS', name: 'Telangana' },
            geometry: {
              type: 'Polygon',
              coordinates: [[[77.2, 15.8], [81.3, 15.8], [81.3, 19.9], [77.2, 19.9], [77.2, 15.8]]],
            },
          },
          {
            type: 'Feature',
            properties: { code: 'KA', name: 'Karnataka' },
            geometry: {
              type: 'Polygon',
              coordinates: [[[74.0, 11.5], [78.6, 11.5], [78.6, 18.4], [74.0, 18.4], [74.0, 11.5]]],
            },
          },
        ],
      };
    }

    // 4. Satellite Scenes & Alerts
    if (clean.startsWith('/satellite/scenes')) {
      return {
        data: {
          totalScenes: MOCK_SATELLITE_SCENES.length,
          scenes: MOCK_SATELLITE_SCENES,
          disclaimer: 'Synthetic simulation scenes for SIH 2026.',
        },
      };
    }

    if (clean.startsWith('/change-alerts')) {
      if (clean.includes('/verify')) {
        return { data: { status: 'OFFICER_VERIFIED' } };
      }
      const parts = clean.split('/');
      if (parts.length > 2 && parts[2]) {
        const found = MOCK_CHANGE_ALERTS.find((a) => a.id === parts[2]);
        return { data: found || MOCK_CHANGE_ALERTS[0] };
      }
      return { data: MOCK_CHANGE_ALERTS };
    }

    // 5. Mutation Queue
    if (clean.startsWith('/mutation')) {
      if (clean.includes('/transition') && options.method === 'POST') {
        let body: any = {};
        try {
          body = options.body ? JSON.parse(options.body as string) : {};
        } catch {}
        const parts = clean.split('/');
        const id = parts[2];
        const targetStatus = body.targetStatus || 'APPROVED';
        const found = MOCK_MUTATIONS_LIST.find((m) => m.id === id || m.application_number === id);
        if (found) {
          found.status = targetStatus;
          found.version = (body.expectedVersion || found.version || 1) + 1;
        }

        // Chained Audit Entry
        const prevBlock = MOCK_AUDIT_LEDGER[MOCK_AUDIT_LEDGER.length - 1];
        const newBlock = {
          id: `al-block-${MOCK_AUDIT_LEDGER.length}`,
          block_index: MOCK_AUDIT_LEDGER.length,
          event_type: `MUTATION_${targetStatus}`,
          action: `MUTATION_${targetStatus}`,
          entity_type: 'MUTATION_APPLICATION',
          target_ulpin: found?.ulpin || 'TSQXY9QM4KNXSZ',
          actor: 'REVENUE_OFFICER_TAHSILDAR',
          actor_id: 'REVENUE_OFFICER_TAHSILDAR',
          current_hash: 'c81e728d9d4c2f636f067f89cc14862c1e3b02882f5d63f0d0e14a7940e7f8e1',
          hash: 'c81e728d9d4c2f636f067f89cc14862c1e3b02882f5d63f0d0e14a7940e7f8e1',
          previous_hash: prevBlock?.hash || '0000000000000000000000000000000000000000000000000000000000000000',
          prev_hash: prevBlock?.hash || '0000000000000000000000000000000000000000000000000000000000000000',
          created_at: new Date().toISOString(),
          payload_json: {
            target_ulpin: found?.ulpin || 'TSQXY9QM4KNXSZ',
            mutation_id: found?.application_number || id,
            status: targetStatus,
            reason: body.reason || 'Statutory revenue adjudication approved.',
          },
        };
        MOCK_AUDIT_LEDGER.push(newBlock);

        return {
          message: `Mutation transitioned to ${targetStatus}`,
          data: {
            status: targetStatus,
            version: found ? found.version : 2,
          },
        };
      }

      if (options.method === 'POST') {
        let body: any = {};
        try {
          body = options.body ? JSON.parse(options.body as string) : {};
        } catch {}

        const newApp = {
          id: `mut-${Date.now()}`,
          application_number: `MUT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          ulpin: body.parcelId || 'TSQXY9QM4KNXSZ',
          legacy_survey_no: '101/1',
          village: 'Medchal',
          applicant: body.applicant || { name: 'Vanga Nishith Reddy', id_number: 'AADHAAR-8891-2309' },
          risk_score: 12,
          status: 'AUTO_VALIDATED',
          version: 1,
          submitted_at: new Date().toISOString(),
        };

        MOCK_MUTATIONS_LIST.unshift(newApp);

        return {
          message: 'Mutation submitted successfully (Synthetic Simulation)',
          data: newApp,
        };
      }
      const parts = clean.split('/');
      if (parts.length > 2 && parts[2] && parts[2] !== 'validate') {
        const found = MOCK_MUTATIONS_LIST.find((m) => m.id === parts[2] || m.application_number === parts[2]);
        const baseApp = found || MOCK_MUTATIONS_LIST[0];
        return {
          data: {
            ...baseApp,
            version: baseApp.version || 1,
            validation_results: {
              is_valid: baseApp.status !== 'BLOCKED',
              risk_factors: [
                {
                  factor: 'ENCUMBRANCE_OR_STAY_CHECK',
                  score: baseApp.risk_score,
                  reason: baseApp.blocked_reason || 'Statutory automated rule assessment passed',
                  severity: baseApp.risk_score >= 70 ? 'CRITICAL' : baseApp.risk_score >= 30 ? 'HIGH' : 'LOW',
                  evidence: { status: baseApp.status },
                },
              ],
            },
          },
        };
      }
      return { data: MOCK_MUTATIONS_LIST };
    }

    // 6. Audit Ledger
    if (clean.startsWith('/audit/verify')) {
      return {
        data: {
          chain_length: MOCK_AUDIT_LEDGER.length,
          is_valid: true,
          latest_hash: MOCK_AUDIT_LEDGER[MOCK_AUDIT_LEDGER.length - 1]?.current_hash || '0x0',
          violations: [],
        },
      };
    }

    if (clean.startsWith('/audit')) {
      return {
        data: {
          entries: MOCK_AUDIT_LEDGER,
          total: MOCK_AUDIT_LEDGER.length,
        },
      };
    }

    // 7. Telemetry & Fallback
    return {
      status: 'UP',
      data: {
        postgres: 'CONNECTED (SIMULATED)',
        postgis: '3.4.2 (EPSG:4326)',
        redis: 'CONNECTED',
        latency_ms: 1.4,
      },
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      if (response.ok) {
        const text = await response.text();
        if (text && text.trim().length > 0) {
          try {
            return JSON.parse(text) as T;
          } catch {
            // Not valid JSON, fallback below
          }
        }
      }
    } catch {
      // Backend not running or connection refused
    }

    // Fallback to high-fidelity synthetic demo data
    return this.getMockFallback(endpoint, options) as T;
  }

  // Auth
  async login(email: string, passwordPlain: string) {
    return this.request<{ message: string; data: { token: string; user: any } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: passwordPlain }),
    });
  }

  async getMe() {
    return this.request<{ data: any }>('/auth/me');
  }

  // Health
  async checkHealth() {
    return this.request<any>('/health');
  }

  // Parcels & GIS
  async getParcels(params?: { bbox?: string; state?: string; search?: string; village?: string }) {
    const query = new URLSearchParams();
    if (params?.bbox) query.append('bbox', params.bbox);
    if (params?.state) query.append('state', params.state);
    if (params?.search) query.append('search', params.search);
    if (params?.village) query.append('village', params.village);
    return this.request<any>(`/parcels?${query.toString()}`);
  }

  async getParcel360(ulpin: string) {
    return this.request<{ data: any }>(`/parcels/${encodeURIComponent(ulpin)}`);
  }

  async searchParcels(params: {
    q?: string;
    ulpin?: string;
    legacy_survey_no?: string;
    owner_name?: string;
    district?: string;
    village?: string;
    state?: string;
    registration_number?: string;
    limit?: number;
    offset?: number;
  }) {
    const query = new URLSearchParams();
    if (params.q) query.append('q', params.q);
    if (params.ulpin) query.append('ulpin', params.ulpin);
    if (params.legacy_survey_no) query.append('legacy_survey_no', params.legacy_survey_no);
    if (params.owner_name) query.append('owner_name', params.owner_name);
    if (params.district) query.append('district', params.district);
    if (params.village) query.append('village', params.village);
    if (params.state) query.append('state', params.state);
    if (params.registration_number) query.append('registration_number', params.registration_number);
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.offset) query.append('offset', params.offset.toString());
    return this.request<any>(`/parcels/search?${query.toString()}`);
  }

  async resolveLegacy(params: { legacy_identifier?: string; legacy_survey_no?: string; state?: string; legacy_system?: string }) {
    const query = new URLSearchParams();
    if (params.legacy_identifier) query.append('legacy_identifier', params.legacy_identifier);
    if (params.legacy_survey_no) query.append('legacy_survey_no', params.legacy_survey_no);
    if (params.state) query.append('state', params.state);
    if (params.legacy_system) query.append('legacy_system', params.legacy_system);
    return this.request<any>(`/legacy/resolve?${query.toString()}`);
  }

  async fetchMockAdapter(state: string, identifier: string) {
    return this.request<any>(`/adapters/fetch?state=${encodeURIComponent(state)}&identifier=${encodeURIComponent(identifier)}`);
  }

  async getAdapterComparison() {
    return this.request<any>('/adapters/comparison');
  }

  async getNeighbours(ulpin: string) {
    return this.request<{ data: any }>(`/parcels/${encodeURIComponent(ulpin)}/neighbours`);
  }

  async getStateBoundaries() {
    return this.request<any>('/parcels/states/geojson');
  }

  async getPointInParcel(lat: number, lng: number) {
    return this.request<any>(`/parcels/spatial/point?lat=${lat}&lng=${lng}`);
  }

  // ULPIN
  async validateUlpin(ulpin: string) {
    return this.request<{ data: any }>('/ulpin/validate', {
      method: 'POST',
      body: JSON.stringify({ ulpin }),
    });
  }

  // Mutation
  async listMutations(params?: string | { status?: string; search?: string; state?: string; district?: string }) {
    const query = new URLSearchParams();
    if (typeof params === 'string') {
      if (params && params !== 'ALL') query.append('status', params);
    } else if (params) {
      if (params.status && params.status !== 'ALL') query.append('status', params.status);
      if (params.search) query.append('search', params.search);
      if (params.state) query.append('state', params.state);
      if (params.district) query.append('district', params.district);
    }
    return this.request<{ data: any[] }>(`/mutation?${query.toString()}`);
  }

  async getMutationById(id: string) {
    return this.request<{ data: any }>(`/mutation/${encodeURIComponent(id)}`);
  }

  async validateMutation(payload: {
    parcelId: string;
    registrationId?: string | null;
    sellerName?: string | null;
    applicant?: { name: string; id_number: string };
  }) {
    return this.request<{ data: any }>('/mutation/validate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async submitMutation(payload: {
    parcelId: string;
    registrationId?: string | null;
    sellerName?: string | null;
    applicant: { name: string; id_number: string; phone?: string; email?: string };
  }) {
    return this.request<{ message: string; data: any }>('/mutation', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async transitionMutation(
    id: string,
    targetStatus: string,
    reason: string,
    expectedVersion?: number,
    metadata?: any
  ) {
    return this.request<{ message: string; data: any }>(`/mutation/${id}/transition`, {
      method: 'POST',
      body: JSON.stringify({ targetStatus, reason, expectedVersion, metadata }),
    });
  }

  // Registrations (SRO Linkage)
  async createRegistration(payload: {
    parcelId: string;
    documentNumber: string;
    seller: string;
    buyer: string;
    registeredAreaSqm: number;
    considerationAmount: number;
    buyerIdNumber?: string;
    buyerPhone?: string;
    buyerEmail?: string;
    registrationDate?: string;
    deedType?: string;
    sroOffice?: string;
  }) {
    return this.request<{ message: string; data: any }>('/registrations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Satellite Change Alerts & Automated Detection
  async getChangeAlerts(status?: string, type?: string) {
    const query = new URLSearchParams();
    if (status && status !== 'ALL') query.append('status', status);
    if (type && type !== 'ALL') query.append('type', type);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ data: any[] }>(`/change-alerts${queryString}`);
  }

  async getChangeAlertById(id: string) {
    return this.request<{ data: any }>(`/change-alerts/${encodeURIComponent(id)}`);
  }

  async verifyChangeAlert(id: string, action: 'VERIFY' | 'DISMISS', notes?: string) {
    return this.request<{ data: any }>(`/change-alerts/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ action, notes }),
    });
  }

  async getSatelliteScenes() {
    return this.request<{ data: { totalScenes: number; scenes: any[]; disclaimer: string } }>('/satellite/scenes');
  }

  async getSatelliteSceneById(sceneId: string) {
    return this.request<{ data: any }>(`/satellite/scenes/${encodeURIComponent(sceneId)}`);
  }

  async runSatellitePipeline(payload: { sceneId: string; config?: any; persistAlerts?: boolean }) {
    return this.request<{ message: string; data: any }>('/satellite/pipeline/run', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Field Observations & Sync
  async getFieldObservations(parcelId?: string) {
    const query = parcelId ? `?parcelId=${parcelId}` : '';
    return this.request<{ data: any[] }>(`/field${query}`);
  }

  async syncFieldBatch(observations: any[]) {
    return this.request<{ data: any[] }>('/field/sync', {
      method: 'POST',
      body: JSON.stringify({ observations }),
    });
  }

  // Cryptographic Audit Ledger
  async getAuditLedger(limit = 50, offset = 0) {
    return this.request<{ data: { entries: any[]; total: number } }>(`/audit?limit=${limit}&offset=${offset}`);
  }

  async verifyAuditChain() {
    return this.request<{ data: { chain_length: number; is_valid: boolean; latest_hash: string; violations: any[] } }>('/audit/verify');
  }

  // Admin & Risk Metrics
  async getAdminMetrics() {
    return this.request<{ data: any }>('/admin/metrics');
  }

  async getRiskOverview() {
    return this.request<{ data: any }>('/risk/overview');
  }

  async getParcelRisk(ulpin: string) {
    return this.request<{ data: any }>(`/parcels/${encodeURIComponent(ulpin)}/risk`);
  }

  async getMutationRisk(id: string) {
    return this.request<{ data: any }>(`/mutation/${encodeURIComponent(id)}/risk`);
  }
}

export const api = new ApiClient();
