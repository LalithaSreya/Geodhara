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

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      const err = data.error || {
        code: 'HTTP_ERROR',
        message: response.statusText || 'Request failed',
      };
      throw err;
    }

    return data;
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
