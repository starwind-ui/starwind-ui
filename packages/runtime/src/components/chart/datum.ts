/**
 * Spec charts draw from mark rows that hold the user's row under `ROW` and the mark channels
 * under prefixed field names. User fields cannot collide with the channels, and tooltips hand
 * out the user's row unchanged.
 */
export const ROW = "sw:row";
export const SERIES = "sw:series";
export const VALUE = "sw:value";
export const ID = "sw:id";
export const X = "sw:x";

export type MarkRow = Record<string, any> & { [ROW]: Record<string, any> };

/** True for a spec chart mark row. */
export function isMarkRow(datum: unknown): datum is MarkRow {
  return !!datum && typeof datum === "object" && ROW in datum;
}

/** The user's row of a spec chart mark row. Other datums come back as they are. */
export function sourceRow(datum: unknown): unknown {
  return isMarkRow(datum) ? datum[ROW] : datum;
}

/** True in a Vite development build. */
export function isDevelopment(): boolean {
  try {
    return (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV === true;
  } catch {
    return false;
  }
}

/**
 * Stable text for a data value. A `Date` gives its ISO string, so ids and default text do not
 * depend on the host time zone.
 */
export function valueText(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

/**
 * Chart parts data with every `Date` field turned into its ISO string. Only data that crosses the
 * wire is converted: the wire payload carries JSON only, so an Astro server render draws from the
 * converted data too, and the browser restart matches it. Framework callbacks get the `Date`.
 */
export function datesToStrings<T>(data: readonly T[]): T[] {
  return data.map((row) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) return row;
    const entries = Object.entries(row);
    if (!entries.some(([, value]) => value instanceof Date)) return row;
    return Object.fromEntries(
      entries.map(([key, value]) => [key, value instanceof Date ? value.toISOString() : value]),
    ) as T;
  });
}
