/**
 * Canonical JSON serialization for cryptographic hash calculation.
 * Recursively sorts all object keys alphabetically, strips undefined,
 * and formats numbers/dates deterministically.
 */
export function canonicalJsonStringify(obj: any): string {
  if (obj === null || obj === undefined) {
    return 'null';
  }

  if (typeof obj === 'boolean' || typeof obj === 'number') {
    return JSON.stringify(obj);
  }

  if (typeof obj === 'string') {
    return JSON.stringify(obj);
  }

  if (obj instanceof Date) {
    return JSON.stringify(obj.toISOString());
  }

  if (Array.isArray(obj)) {
    const items = obj.map((item) => canonicalJsonStringify(item));
    return `[${items.join(',')}]`;
  }

  if (typeof obj === 'object') {
    const keys = Object.keys(obj).sort();
    const pairs: string[] = [];

    for (const key of keys) {
      const val = obj[key];
      if (val !== undefined) {
        pairs.push(`${JSON.stringify(key)}:${canonicalJsonStringify(val)}`);
      }
    }

    return `{${pairs.join(',')}}`;
  }

  return JSON.stringify(obj);
}
