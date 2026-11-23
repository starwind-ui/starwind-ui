import { isChartIcon } from "./options";
import { configText } from "./presentation";
import type {
  ChartConfig,
  ChartIcon,
  ChartInput,
  ChartWireHostOptions,
  ChartWirePayload,
  NativeHostOptions,
} from "./types";

const WIRE_HOST_KEYS = [
  "width",
  "height",
  "initialWidth",
  "aspectRatio",
  "ariaLabel",
  "ariaDescription",
  "className",
  "tabIndex",
] as const;

const WIRE_ERROR =
  "Chart wire input must contain JSON data. Keep callbacks and native definitions in the chart module.";

function assertWireData(value: unknown, seen: Set<object>): void {
  if (value === undefined || value === null) return;
  if (typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (Number.isFinite(value)) return;
    throw new TypeError(`${WIRE_ERROR} Found a non-finite number.`);
  }
  if (typeof value !== "object") throw new TypeError(WIRE_ERROR);
  if (seen.has(value)) throw new TypeError(`${WIRE_ERROR} Found a circular reference.`);
  const prototype = Object.getPrototypeOf(value);
  const isArray = Array.isArray(value);
  if (!isArray && prototype !== Object.prototype && prototype !== null)
    throw new TypeError(`${WIRE_ERROR} Found a class instance.`);
  seen.add(value);
  for (const item of isArray ? value : Object.values(value)) assertWireData(item, seen);
  seen.delete(value);
}

/**
 * JSON that is safe inside a `<script>` element. Every `<` becomes `<`, so `</script>` and
 * `<!--` cannot end or change the element. `JSON.parse` returns the exact strings.
 */
export function scriptJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

/** Config with plain text labels and portable icons only. */
export function wireConfig(config: ChartConfig): ChartConfig<string, ChartIcon> {
  return Object.fromEntries(
    Object.entries(config).map(([key, entry]) => [
      key,
      {
        label: configText(entry, key),
        text: configText(entry, key),
        ...(entry.theme ? { theme: entry.theme } : { color: entry.color }),
        ...(isChartIcon(entry.icon) ? { icon: entry.icon } : {}),
      },
    ]),
  );
}

/** Host options that are plain data and safe to send to the browser. */
export function wireHostOptions(host: NativeHostOptions | undefined): ChartWireHostOptions {
  const result: Record<string, unknown> = {};
  for (const key of WIRE_HOST_KEYS) {
    const value = host?.[key];
    if (value !== undefined && typeof value !== "function") result[key] = value;
  }
  return result as ChartWireHostOptions;
}

function wireInput(input: ChartInput): ChartInput {
  const wire = { ...input, config: wireConfig(input.config) };
  assertWireData(wire, new Set());
  return wire;
}

/**
 * Serializes chart input for the wire. It rejects functions, class instances, circular data and
 * non-finite numbers, and escapes `<`.
 */
export function serializeInput(input: ChartInput): string {
  return scriptJson(wireInput(input));
}

/** Serializes the complete wire payload that a server-rendered chart root carries. */
export function serializeChartPayload(payload: ChartWirePayload): string {
  const wire: ChartWirePayload = {
    input: wireInput(payload.input),
    host: wireHostOptions(payload.host as NativeHostOptions | undefined),
    ...(payload.tooltipDisabled ? { tooltipDisabled: true } : {}),
  };
  assertWireData(wire, new Set());
  return scriptJson(wire);
}

/** Reads a wire payload. A payload that holds only input is accepted too. */
export function parseChartPayload(text: string | null | undefined): Partial<ChartWirePayload> {
  if (!text) return {};
  const value = JSON.parse(text) as unknown;
  if (!value || typeof value !== "object") return {};
  const record = value as Record<string, unknown>;
  if ("input" in record) return record as Partial<ChartWirePayload>;
  return { input: record as unknown as ChartInput };
}
