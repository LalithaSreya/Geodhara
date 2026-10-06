# GeoDhara: Demo Evaluation & Walkthrough Guide

## 1. Demo Credentials

| Role | Email | Password | Primary Demo Scope |
|---|---|---|---|
| **Citizen** | `citizen@geodhara.demo` | `DemoCitizen@123` | Search ULPIN, View 360° Dossier, Submit Mutation Application |
| **Revenue Officer** | `officer@geodhara.demo` | `DemoOfficer@123` | Inspect Risk Flags, Dispatch Field Verification, Approve Mutation & Update RoR |
| **Field Surveyor** | `field@geodhara.demo` | `DemoField@123` | Geotagged GPS Observations, Offline Dexie Queue Sync |
| **Administrator** | `admin@geodhara.demo` | `DemoAdmin@123` | Verify Cryptographic SHA-256 Audit Chain, System Metrics |

---

## 2. Special Demo Scenarios & Test Cases

1. **Clean Title Parcel:**
   - ULPIN: `TS7A2K91M4P6X8` (Kompally)
   - Features: 0 encumbrances, 0 litigations, 0 change alerts. 100% Green risk score. Auto-validation passes instantly.

2. **Bank Encumbered Parcel (Mortgage):**
   - ULPIN: Click on Orange Parcels on Cadastral Map
   - Features: Active mortgage from State Bank of India. Requires NOC.

3. **Active Litigation Stay (Restraint Order):**
   - Features: Injunction order from District Civil Court. Application auto-blocks transfer.

4. **AI Satellite Change Alert:**
   - Features: Temporal vegetation loss / built-up gain spectral anomaly. Split comparison slider shows pre- and post-capture differences.

5. **Offline PWA Sync:**
   - Toggle offline mode, log field observations into IndexedDB, click "Sync Local Queue" to batch synchronize.

6. **Tamper-Evident SHA-256 Hash Chain:**
   - Navigate to "Tamper-Evident Hash Chain" tab, click "Verify Cryptographic Chain" to confirm mathematical integrity.
