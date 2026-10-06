# GeoDhara: System Architecture & Digital Public Infrastructure (DPI)

> **"One parcel. One identity."**  
> SIH 2026 Prototype — Problem Statement PS 26014

---

## 1. High-Level DPI Overview

GeoDhara is a ULPIN-centric GIS Land Governance platform designed as a robust Digital Public Infrastructure. It establishes a single unified source of truth for every land parcel across disparate departmental silos:

```
+-----------------------------------------------------------------------------------+
|                                  GEODHARA DPI                                     |
|                      ONE PARCEL -> ONE IDENTITY -> ONE GIS VIEW                   |
+-----------------------------------------------------------------------------------+
       |                    |                     |                     |
+---------------+   +----------------+   +-----------------+   +------------------+
| Cadastral GIS |   | Record of      |   | Sub-Registrar   |   | AI Satellite     |
| (PostGIS      |   | Rights (RoR 1B/|   | Deeds &         |   | Temporal         |
| 4326/geog)    |   | Pahani / RTC)  |   | Encumbrances    |   | Differencing     |
+---------------+   +----------------+   +-----------------+   +------------------+
       \                    |                     |                     /
        \                   |                     |                    /
         +------------------------------------------------------------+
         |            14-Character Opaque ULPIN Identity              |
         +------------------------------------------------------------+
                                    |
                    +-------------------------------+
                    |  Mutation & Risk Rule Engine  |
                    |  (Auto-Validate/Stay/Block)   |
                    +-------------------------------+
                                    |
                    +-------------------------------+
                    |  Immutable Hash-Chain Ledger  |
                    |  (SHA-256 Tamper-Evidence)    |
                    +-------------------------------+
```

---

## 2. Core Architectural Pillars

### Pillar 1: Cadastral Geometry & Geodesic Computation
- Built on **PostgreSQL 16 + PostGIS 3.4**.
- Cadastral parcel polygons stored in `EPSG:4326` with a spatial `GiST` index (`idx_parcels_geom`).
- Accurate geodesic area calculations using `ST_Area(geom::geography)` to prevent planar distortion errors in spherical coordinate projections.

### Pillar 2: 14-Character Opaque ULPIN Anchor
- Deterministic, opaque 14-character alphanumeric parcel identifier.
- **Rule Compliance:** Administrative boundaries (State, District, Mandal, Village) are **NOT** encoded into the ULPIN string. They are stored as separate relational attributes (`state_code`, `district`, `mandal`, `village`).

### Pillar 3: Mutation Governance State Machine
Workflow states:
1. `SUBMITTED`
2. `AUTO_VALIDATED`
3. `BLOCKED`
4. `OFFICER_REVIEW`
5. `FIELD_VERIFICATION`
6. `APPROVED`
7. `RECORD_UPDATED`
8. `REJECTED`

### Pillar 4: Cryptographic Tamper-Evident Audit Ledger
- SHA-256 cryptographic hash-chain where each block depends on the previous block's hash:
  $$\text{hash}_n = \text{SHA256}(\text{prev\_hash}_{n-1} + \text{entity} + \text{action} + \text{actor} + \text{payload} + \text{timestamp})$$
- Continuous tamper verification endpoint `/api/audit/verify`.

### Pillar 5: Offline-First Field Surveyor PWA
- Client-side storage via **Dexie / IndexedDB**.
- Geotagged observation capture with GPS lat/lng and simulated photo uploads.
- Optimistic concurrency version checking on sync to prevent race conditions.
