import { z } from 'zod';
import { AppError } from '../../middleware/errorHandler.js';

// Allowed characters: uppercase alphanumeric (0-9, A-Z)
const ULPIN_REGEX = /^[A-Z0-9]{14}$/;

export interface UlpinValidationResult {
  isValid: boolean;
  normalizedUlpin: string;
  errors: string[];
}

/**
 * Validates a 14-character alphanumeric ULPIN string.
 * NOTE: As per GeoDhara specifications, ULPIN does NOT encode administrative
 * hierarchy (state, district, etc.). It acts as an opaque 14-char unique identifier.
 */
export function validateUlpinFormat(ulpinInput: string): UlpinValidationResult {
  const errors: string[] = [];

  if (!ulpinInput || typeof ulpinInput !== 'string') {
    return {
      isValid: false,
      normalizedUlpin: '',
      errors: ['ULPIN must be a non-empty string'],
    };
  }

  const trimmed = ulpinInput.trim().toUpperCase();

  if (trimmed.length !== 14) {
    errors.push(`ULPIN must be exactly 14 alphanumeric characters (received ${trimmed.length})`);
  }

  if (!ULPIN_REGEX.test(trimmed)) {
    errors.push('ULPIN must only contain alphanumeric characters (0-9, A-Z) with no special symbols or spaces');
  }

  return {
    isValid: errors.length === 0,
    normalizedUlpin: trimmed,
    errors,
  };
}

export const ulpinParamSchema = z.object({
  ulpin: z
    .string()
    .transform((val) => val.trim().toUpperCase())
    .refine((val) => ULPIN_REGEX.test(val), {
      message: 'ULPIN must be exactly 14 alphanumeric characters (e.g. TS7A2K91M4P6X8)',
    }),
});

export function assertValidUlpin(ulpin: string): string {
  const result = validateUlpinFormat(ulpin);
  if (!result.isValid) {
    throw new AppError(400, 'INVALID_ULPIN_FORMAT', result.errors.join('; '), {
      provided: ulpin,
      errors: result.errors,
    });
  }
  return result.normalizedUlpin;
}
