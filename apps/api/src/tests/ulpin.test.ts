import { describe, it, expect } from 'vitest';
import { validateUlpinFormat, assertValidUlpin } from '../modules/ulpin/ulpin.validator.js';

describe('ULPIN Validation Rules (14-Character Opaque Identifier)', () => {
  it('should validate and normalize valid 14-char alphanumeric ULPIN', () => {
    const validUlpin = 'TS7A2K91M4P6X8';
    const result = validateUlpinFormat(validUlpin);
    expect(result.isValid).toBe(true);
    expect(result.normalizedUlpin).toBe('TS7A2K91M4P6X8');
    expect(result.errors).toHaveLength(0);
  });

  it('should accept lowercase and normalize to uppercase', () => {
    const lower = 'ka4f8n21q7r3l5';
    const result = validateUlpinFormat(lower);
    expect(result.isValid).toBe(true);
    expect(result.normalizedUlpin).toBe('KA4F8N21Q7R3L5');
  });

  it('should reject ULPIN with invalid length (< 14 chars)', () => {
    const shortUlpin = 'TS7A2K91M4P6';
    const result = validateUlpinFormat(shortUlpin);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('must be exactly 14');
  });

  it('should reject ULPIN with invalid length (> 14 chars)', () => {
    const longUlpin = 'TS7A2K91M4P6X899';
    const result = validateUlpinFormat(longUlpin);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('must be exactly 14');
  });

  it('should reject special characters, spaces, or symbols', () => {
    const special = 'TS7A-2K91M4P6X';
    const result = validateUlpinFormat(special);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('alphanumeric');
  });

  it('assertValidUlpin should throw AppError on invalid format', () => {
    expect(() => assertValidUlpin('INVALID')).toThrowError();
  });
});
