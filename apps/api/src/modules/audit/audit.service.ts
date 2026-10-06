import crypto from 'crypto';
import { query, getClient } from '../../config/db.js';
import { canonicalJsonStringify } from '../../utils/canonicalJson.js';

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';
const AUDIT_LOCK_ID = 424242; // PostgreSQL transaction-level advisory lock

export class AuditService {
  /**
   * Calculates deterministic SHA-256 hash using canonical JSON formatting
   */
  public calculateHash(
    prevHash: string,
    entityType: string,
    entityId: string,
    action: string,
    actorId: string,
    payload: any,
    createdAt: string | Date
  ): string {
    const canonicalPayload = canonicalJsonStringify(payload);
    const d = createdAt instanceof Date ? createdAt : new Date(createdAt);
    d.setMilliseconds(0);
    const dateIso = d.toISOString();
    const data = `${prevHash}|${entityType}|${entityId}|${action}|${actorId}|${canonicalPayload}|${dateIso}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Appends an immutable, cryptographically hashed audit entry with concurrency lock
   */
  async logAction(params: {
    entityType: string;
    entityId: string;
    action: string;
    actorId: string;
    payload: any;
  }) {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      // Concurrency protection: acquire exclusive transaction advisory lock
      await client.query('SELECT pg_advisory_xact_lock($1)', [AUDIT_LOCK_ID]);

      // Fetch last hash in the chain by sequence
      const lastEntry = await client.query(
        'SELECT hash FROM audit_log ORDER BY seq DESC LIMIT 1'
      );
      const prevHash = lastEntry.rows.length > 0 ? lastEntry.rows[0].hash : GENESIS_HASH;

      const now = new Date();
      now.setMilliseconds(0);
      const hash = this.calculateHash(
        prevHash,
        params.entityType,
        params.entityId,
        params.action,
        params.actorId,
        params.payload,
        now
      );

      const result = await client.query(
        `INSERT INTO audit_log (entity_type, entity_id, action, actor_id, payload_json, prev_hash, hash, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          params.entityType,
          params.entityId,
          params.action,
          params.actorId,
          JSON.stringify(params.payload),
          prevHash,
          hash,
          now.toISOString(),
        ]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Fetches audit history for an entity
   */
  async getAuditForEntity(entityType: string, entityId: string) {
    const result = await query(
      `SELECT * FROM audit_log 
       WHERE entity_type = $1 AND entity_id = $2 
       ORDER BY seq ASC`,
      [entityType.toUpperCase(), entityId]
    );
    return result.rows;
  }

  /**
   * Fetches the global audit ledger
   */
  async getLedger(limit = 100, offset = 0) {
    const result = await query(
      `SELECT * FROM audit_log 
       ORDER BY seq DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await query('SELECT COUNT(*)::int AS total FROM audit_log');

    return {
      entries: result.rows,
      total: countResult.rows[0].total,
    };
  }

  /**
   * Verifies the cryptographic integrity of the hash chain
   */
  async verifyChainIntegrity(): Promise<{
    valid: boolean;
    checkedRecords: number;
    firstBrokenRecord: number | null;
    latestHash?: string;
    details?: string;
    violations?: any[];
  }> {
    const entries = await query(
      'SELECT * FROM audit_log ORDER BY seq ASC'
    );

    const total = entries.rows.length;
    if (total === 0) {
      return {
        valid: true,
        checkedRecords: 0,
        firstBrokenRecord: null,
        latestHash: GENESIS_HASH,
      };
    }

    let expectedPrevHash = GENESIS_HASH;
    let firstBrokenRecord: number | null = null;
    const violations: any[] = [];

    for (let i = 0; i < total; i++) {
      const entry = entries.rows[i];
      const recordNumber = i + 1;

      // 1. Verify previous hash pointer
      if (entry.prev_hash !== expectedPrevHash) {
        if (firstBrokenRecord === null) firstBrokenRecord = recordNumber;
        violations.push({
          recordNumber,
          id: entry.id,
          expectedPrevHash,
          actualPrevHash: entry.prev_hash,
          reason: 'Broken previous hash link',
        });
      }

      // 2. Re-compute hash using canonical JSON representation
      const computedHash = this.calculateHash(
        entry.prev_hash,
        entry.entity_type,
        entry.entity_id,
        entry.action,
        entry.actor_id,
        entry.payload_json,
        entry.created_at
      );

      if (computedHash !== entry.hash) {
        if (firstBrokenRecord === null) firstBrokenRecord = recordNumber;
        violations.push({
          recordNumber,
          id: entry.id,
          storedHash: entry.hash,
          computedHash,
          reason: 'Payload modification or hash corruption detected',
        });
      }

      expectedPrevHash = entry.hash;
    }

    const isValid = violations.length === 0;

    return {
      valid: isValid,
      checkedRecords: total,
      firstBrokenRecord,
      latestHash: expectedPrevHash,
      details: isValid
        ? 'All cryptographic signatures and chaining pointers verified successfully.'
        : `Integrity failure: First corrupted record is #${firstBrokenRecord}.`,
      violations: violations.length > 0 ? violations : undefined,
    };
  }
}

export const auditService = new AuditService();
