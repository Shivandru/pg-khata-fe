import { z } from 'zod';
import crypto from 'crypto';

// Single source of truth for entity ID prefixes.
// Add a new entity here once — every schema references this map,
// so a prefix is never hardcoded as a magic string in more than one place.
export const ID_PREFIXES = {
  property: 'p',
  room: 'r',
  bed: 'b',
  guest: 'g',
  tenancy: 't',
  payment: 'pm',
  user: 'u',
};
type PrefixValue = (typeof ID_PREFIXES)[keyof typeof ID_PREFIXES];

/**
 * Builds a Zod validator for a prefixed ID string, e.g. id('p') validates "p-3f2504e0".
 * We use these instead of MongoDB's default _id / ObjectId so IDs stay short,
 * human-readable, and self-describing in logs, URLs, and support conversations.
 */
export function id(prefix: PrefixValue) {
  return z.string().regex(
    new RegExp(`^${prefix}-[0-9a-f]{8}$`),
    `Invalid id, expected format "${prefix}-xxxxxxxx"`
  );
}

/**
 * Generates a prefixed ID, e.g. generateId(ID_PREFIXES.property) -> "p-3f2504e0".
 * Uses the first segment of a v4 UUID (8 hex chars) for a short, still-effectively-unique suffix.
 * Call this in the repository layer right before inserting a new document —
 * never let the client supply an ID.
 */
export function generateId(prefix: PrefixValue) {
  const uuid = crypto.randomUUID(); // e.g. "3f2504e0-4f89-11d3-9a0c-0305e82c3301"
  return `${prefix}-${uuid.split('-')[0]}`;
}

// Date-only string, e.g. "2026-07-20"
export const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected date in YYYY-MM-DD format');

// Month-only string, e.g. "2026-08" — used for payment cycles
export const monthOnly = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Expected month in YYYY-MM format');