import { valueText } from "./datum";
import type { ChartConfig } from "./types";

/**
 * A portable value format. It is plain data, so it can travel from the server to the browser.
 * The steps run in this order: `configLabel`, `number` or `date`, then `maxLength`, then `prefix`
 * and `suffix`.
 */
export interface ChartFormat {
  /**
   * Shows the config label of the value, as `chartConfig[value]?.label`. A value that is not a
   * config key keeps its own text, and a rich label shows its `text`.
   */
  configLabel?: boolean;
  /** Keeps the first N characters. `{ maxLength: 3 }` is `value.slice(0, 3)`. */
  maxLength?: number;
  /** Formats numbers with `Intl.NumberFormat`. */
  number?: Intl.NumberFormatOptions;
  /**
   * Formats `Date` values, date strings and timestamps with `Intl.DateTimeFormat`. The time zone
   * defaults to `"UTC"`, so server and browser give the same text.
   */
  date?: Intl.DateTimeFormatOptions;
  /** Text before the result. */
  prefix?: string;
  /** Text after the result. */
  suffix?: string;
  /** The locale of `number` and `date`. Defaults to `"en-US"`, so server and browser match. */
  locale?: string;
}

/** A tick formatter: a function in framework code, or a `ChartFormat` object anywhere. */
export type ChartTickFormatter = ChartFormat | ((value: any) => string);

const DEFAULT_LOCALE = "en-US";

// A date and time with no offset, such as "2026-11-25T00:30:00" or "2026-11-25 00:30:00". It reads
// as UTC, so server and browser give the same text. JavaScript would read it in the local time zone.
const NO_OFFSET = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}(:\d{2}(\.\d+)?)?)$/;

function toDate(value: unknown): Date | undefined {
  const date =
    value instanceof Date
      ? value
      : typeof value === "string"
        ? new Date(value.replace(NO_OFFSET, "$1T$2Z"))
        : typeof value === "number"
          ? new Date(value)
          : undefined;
  return date && !Number.isNaN(date.getTime()) ? date : undefined;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "string" && value.trim() === "") return undefined;
  const number =
    typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isNaN(number) ? undefined : number;
}

/**
 * Builds a formatter for one `ChartFormat`. The `Intl` formatter is built once, here, so a tick
 * pass does not build one per tick. `label` names the part and prop in a creation error.
 */
function compileFormat(
  format: ChartFormat,
  label?: string,
  config?: ChartConfig,
): (value: unknown) => string {
  let read: ((value: unknown) => string | undefined) | undefined;
  try {
    if (format.number) {
      const intl = new Intl.NumberFormat(format.locale ?? DEFAULT_LOCALE, format.number);
      read = (value) => {
        const number = toNumber(value);
        return number === undefined ? undefined : intl.format(number);
      };
    } else if (format.date) {
      // Dates format in UTC unless the format names a zone, so server and browser agree and a
      // date-only string such as "2024-04-01" stays on its day.
      const intl = new Intl.DateTimeFormat(format.locale ?? DEFAULT_LOCALE, {
        ...format.date,
        timeZone: format.date.timeZone ?? "UTC",
      });
      read = (value) => {
        const date = toDate(value);
        return date ? intl.format(date) : undefined;
      };
    }
  } catch (error) {
    if (!label) throw error;
    const message = error instanceof Error ? error.message : String(error);
    throw new RangeError(`${label}: ${message}`, { cause: error });
  }
  const configLabel = format.configLabel && config ? config : undefined;
  return (value) => {
    let text = configLabel ? configLabelText(configLabel, value) : undefined;
    text ??= read?.(value);
    text ??= value == null ? "" : valueText(value);
    if (format.maxLength !== undefined) text = text.slice(0, Math.max(0, format.maxLength));
    return `${format.prefix ?? ""}${text}${format.suffix ?? ""}`;
  };
}

/**
 * The plain config label of a value, or `undefined` when the value is not a config key. A rich
 * label without `text` gives the key, so a tick never throws.
 */
function configLabelText(config: ChartConfig, value: unknown): string | undefined {
  if (value == null) return undefined;
  const key = valueText(value);
  if (!Object.hasOwn(config, key)) return undefined;
  const entry = config[key];
  if (entry?.text !== undefined) return entry.text;
  const label = entry?.label;
  return typeof label === "string" || typeof label === "number" ? String(label) : key;
}

/**
 * Formats one value with a `ChartFormat` object. `null` and `undefined` give empty text. `config`
 * gives the labels of a `configLabel` format.
 */
export function formatChartValue(
  value: unknown,
  format: ChartFormat,
  config?: ChartConfig,
): string {
  return compileFormat(format, undefined, config)(value);
}

/**
 * Turns a tick formatter into a function. `label`, such as `"ChartXAxis tickFormatter"`, names
 * the part and prop when the format options are not valid. `config` gives the labels of a
 * `configLabel` format.
 */
export function resolveTickFormatter(
  formatter: ChartTickFormatter | undefined,
  label?: string,
  config?: ChartConfig,
): ((value: unknown) => string) | undefined {
  if (formatter === undefined) return undefined;
  if (typeof formatter === "function") return (value) => String(formatter(value));
  return compileFormat(formatter, label, config);
}
