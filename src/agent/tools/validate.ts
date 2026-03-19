/**
 * Shared validation helpers for agent tool executors.
 * All functions throw a descriptive Error on invalid input,
 * which the agent loop catches and relays to Claude as a tool error.
 */

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const SEASON_REGEX = /^\d{4}-\d{4}$|^\d{4}$/;

export function assertString(
  value: unknown,
  field: string,
  { min = 1, max }: { min?: number; max: number }
): string {
  if (typeof value !== "string") throw new Error(`${field} must be a string`);
  const trimmed = value.trim();
  if (trimmed.length < min) throw new Error(`${field} must not be empty`);
  if (trimmed.length > max)
    throw new Error(`${field} must be ${max} characters or fewer (got ${trimmed.length})`);
  return trimmed;
}

export function assertOptionalString(
  value: unknown,
  field: string,
  max: number
): string | null {
  if (value === undefined || value === null || value === "") return null;
  return assertString(value, field, { min: 0, max });
}

export function assertNumber(
  value: unknown,
  field: string,
  { min, max }: { min: number; max: number }
): number {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`${field} must be a number`);
  if (n < min) throw new Error(`${field} must be at least ${min}`);
  if (n > max) throw new Error(`${field} must be at most ${max}`);
  return n;
}

export function assertOptionalNumber(
  value: unknown,
  field: string,
  { min, max }: { min: number; max: number }
): number | null {
  if (value === undefined || value === null) return null;
  return assertNumber(value, field, { min, max });
}

export function assertDate(value: unknown, field: string): string {
  const s = assertString(value, field, { max: 10 });
  if (!DATE_REGEX.test(s)) throw new Error(`${field} must be in YYYY-MM-DD format`);
  const year = parseInt(s.slice(0, 4), 10);
  if (year < 2000 || year > 2100) throw new Error(`${field} year must be between 2000 and 2100`);
  return s;
}

export function assertOptionalDate(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === "") return null;
  return assertDate(value, field);
}

export function assertSeason(value: unknown, field = "season"): string {
  const s = assertString(value, field, { max: 20 });
  if (!SEASON_REGEX.test(s))
    throw new Error(`${field} must be in YYYY-YYYY or YYYY format (e.g. "2025-2026")`);
  return s;
}

/** Clamps a caller-supplied limit to [1, max], defaulting to defaultVal. */
export function clampLimit(value: unknown, max: number, defaultVal: number): number {
  if (value === undefined || value === null) return defaultVal;
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 1) return defaultVal;
  return Math.min(n, max);
}
