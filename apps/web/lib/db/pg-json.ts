/** Postgres text and json cannot store U+0000. */
export function stripNul(value: string) {
  return value.replace(/\u0000/g, "");
}

export function jsonWithoutNul<T>(value: T): T {
  if (typeof value === "string") return stripNul(value) as T;
  if (Array.isArray(value)) return value.map((item) => jsonWithoutNul(item)) as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      out[stripNul(key)] = jsonWithoutNul(nested);
    }
    return out as T;
  }
  return value;
}
