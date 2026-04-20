/**
 * Convierte valores que `JSON.stringify` no soporta (p. ej. bigint de pg) a tipos JSON seguros.
 */
export function jsonSafe(v: unknown): unknown {
  if (typeof v === 'bigint') {
    const n = Number(v);
    return Number.isSafeInteger(n) ? n : v.toString();
  }
  if (v instanceof Date) return v;
  if (Array.isArray(v)) return v.map(jsonSafe);
  if (v !== null && typeof v === 'object') {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>).map(([k, val]) => [k, jsonSafe(val)])
    );
  }
  return v;
}
