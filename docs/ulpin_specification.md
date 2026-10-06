# GeoDhara: ULPIN Specification & Validation Rules

## 1. ULPIN Definition

In **GeoDhara**, the Unique Land Parcel Identification Number (ULPIN) is an opaque 14-character alphanumeric identifier that uniquely anchors all departmental records to a single cadastral geometry.

### Critical Rule:
- **ULPIN DOES NOT encode state, district, mandal, or village.**
- No administrative hierarchy is derived from the ULPIN string.
- `state_code` is maintained in a distinct relational column.
- All demo ULPINs are synthetic identifiers formatted cleanly to illustrate the common parcel identity concept.

---

## 2. Validation Constraints

The reusable ULPIN validation module enforces:
1. **Length:** Exactly 14 characters (`len == 14`).
2. **Character Set:** Strict uppercase alphanumeric `^[0-9A-Z]{14}$`.
3. **No Special Characters or Spaces:** Hyphens, underscores, spaces, or lowercase letters are normalized or rejected.
4. **Uniqueness:** Guaranteed unique index `UNIQUE(ulpin)` in PostgreSQL.
5. **Existence Check:** Real-time query to confirm database presence.

---

## 3. Example Synthetic ULPINs

| Synthetic ULPIN | State Code | Village | District | Status |
|---|---|---|---|---|
| `TS7A2K91M4P6X8` | `TS` | Kompally | Medchal-Malkajgiri | Clean Title |
| `TS3M8P12L9N4K7` | `TS` | Medchal | Medchal-Malkajgiri | Encumbered (Mortgage) |
| `TS9Q4L88R2M6X1` | `TS` | Gundlapochampally | Medchal-Malkajgiri | Litigation Court Stay |
| `KA4F8N21Q7R3L5` | `KA` | Devanahalli | Bengaluru Rural | Clean Title |
