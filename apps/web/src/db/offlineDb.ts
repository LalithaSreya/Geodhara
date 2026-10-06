import Dexie, { type Table } from 'dexie';

export interface OfflineObservation {
  id?: number;
  client_uuid: string;
  parcel_id: string;
  ulpin: string;
  notes: string;
  photo_reference?: string | null;
  gps_lat: number;
  gps_lng: number;
  observed_at: string;
  device_timestamp: string;
  parcel_version: number;
  sync_status: 'PENDING_SYNC' | 'SYNCED' | 'CONFLICT';
}

export interface CachedParcel {
  id: string;
  ulpin: string;
  village: string;
  mandal: string;
  district: string;
  area_sqm: number;
  version: number;
  geometry: any;
  cached_at: string;
}

export class GeoDharaOfflineDatabase extends Dexie {
  observations!: Table<OfflineObservation, number>;
  cachedParcels!: Table<CachedParcel, string>;

  constructor() {
    super('GeoDharaOfflineDB');
    this.version(1).stores({
      observations: '++id, client_uuid, parcel_id, ulpin, sync_status, observed_at',
      cachedParcels: 'id, ulpin, village',
    });
  }
}

export const offlineDb = new GeoDharaOfflineDatabase();
