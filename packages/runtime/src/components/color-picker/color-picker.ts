export const COLOR_PICKER_FORMATS = ["hex", "rgb", "hsl", "hsb"] as const;

export type ColorPickerFormat = (typeof COLOR_PICKER_FORMATS)[number];
export type ColorPickerStringFormat = ColorPickerFormat | "hexa" | "rgba" | "hsla" | "hsba";

export interface ColorPickerRgbChannels {
  readonly alpha: number;
  readonly blue: number;
  readonly green: number;
  readonly red: number;
}

export interface ColorPickerHslChannels {
  readonly alpha: number;
  readonly hue: number;
  readonly lightness: number;
  readonly saturation: number;
}

export interface ColorPickerHsbChannels {
  readonly alpha: number;
  readonly brightness: number;
  readonly hue: number;
  readonly saturation: number;
}

export type ColorPickerRgbChannelUpdates = Partial<ColorPickerRgbChannels>;
export type ColorPickerHslChannelUpdates = Partial<ColorPickerHslChannels>;
export type ColorPickerHsbChannelUpdates = Partial<ColorPickerHsbChannels>;

export interface ColorPickerColor {
  readonly alpha: number;
  readonly hsb: ColorPickerHsbChannels;
  readonly hsl: ColorPickerHslChannels;
  readonly rgb: ColorPickerRgbChannels;
  equals(other: ColorPickerColor): boolean;
  toString(format?: ColorPickerStringFormat): string;
  withChannels(format: "hex" | "rgb", updates: ColorPickerRgbChannelUpdates): ColorPickerColor;
  withChannels(format: "hsl", updates: ColorPickerHslChannelUpdates): ColorPickerColor;
  withChannels(format: "hsb", updates: ColorPickerHsbChannelUpdates): ColorPickerColor;
}

type InternalChannelUpdates = Partial<
  ColorPickerRgbChannels & ColorPickerHslChannels & ColorPickerHsbChannels
>;

class ColorPickerColorImpl implements ColorPickerColor {
  readonly alpha: number;
  readonly hsb: ColorPickerHsbChannels;
  readonly hsl: ColorPickerHslChannels;
  readonly rgb: ColorPickerRgbChannels;

  private readonly meaningfulHue: number;
  private readonly meaningfulHsbSaturation: number;
  private readonly equalityKey: ColorEqualityKey;

  constructor(
    red: number,
    green: number,
    blue: number,
    alpha: number,
    meaningfulHue?: number,
    meaningfulHsbSaturation?: number,
  ) {
    const normalizedRed = clamp(red, 0, 255);
    const normalizedGreen = clamp(green, 0, 255);
    const normalizedBlue = clamp(blue, 0, 255);
    this.alpha = clamp(alpha, 0, 1);
    const derivedHsb = rgbToHsb(normalizedRed, normalizedGreen, normalizedBlue, 0);
    const isChromatic = derivedHsb.saturation > 0 && derivedHsb.brightness > 0;
    this.meaningfulHue = normalizeHue(
      isChromatic ? derivedHsb.hue : finiteOr(meaningfulHue, derivedHsb.hue),
    );
    this.meaningfulHsbSaturation =
      derivedHsb.brightness === 0
        ? clamp(finiteOr(meaningfulHsbSaturation, derivedHsb.saturation), 0, 100)
        : derivedHsb.saturation;
    this.rgb = freeze({
      alpha: this.alpha,
      blue: normalizedBlue,
      green: normalizedGreen,
      red: normalizedRed,
    });
    this.hsl = freeze({
      ...rgbToHsl(this.rgb.red, this.rgb.green, this.rgb.blue, this.meaningfulHue),
      alpha: this.alpha,
    });
    this.hsb = freeze({
      ...rgbToHsb(this.rgb.red, this.rgb.green, this.rgb.blue, this.meaningfulHue),
      saturation: this.meaningfulHsbSaturation,
      alpha: this.alpha,
    });
    this.equalityKey = createColorEqualityKey(
      this.rgb.red,
      this.rgb.green,
      this.rgb.blue,
      this.alpha,
      this.meaningfulHue,
      this.meaningfulHsbSaturation,
    );
    Object.freeze(this);
  }

  equals(other: ColorPickerColor): boolean {
    const otherKey = createColorEqualityKey(
      other.rgb.red,
      other.rgb.green,
      other.rgb.blue,
      other.alpha,
      other.hsb.hue,
      other.hsb.saturation,
    );
    return this.equalityKey.every((channel, index) => channel === otherKey[index]);
  }

  toString(format: ColorPickerStringFormat = "hex"): string {
    const forceAlpha = format.endsWith("a");
    const includeAlpha = forceAlpha || this.alpha < 1;
    switch (format) {
      case "hex":
      case "hexa":
        return serializeHex(this.rgb, includeAlpha);
      case "rgb":
      case "rgba":
        return serializeRgb(this.rgb, includeAlpha);
      case "hsl":
      case "hsla":
        return serializeHsl(this.hsl, includeAlpha);
      case "hsb":
      case "hsba":
        return serializeHsb(this.hsb, includeAlpha);
    }
  }

  withChannels(format: "hex" | "rgb", updates: ColorPickerRgbChannelUpdates): ColorPickerColor;
  withChannels(format: "hsl", updates: ColorPickerHslChannelUpdates): ColorPickerColor;
  withChannels(format: "hsb", updates: ColorPickerHsbChannelUpdates): ColorPickerColor;
  withChannels(format: ColorPickerFormat, updates: InternalChannelUpdates): ColorPickerColor {
    const alpha = finiteOr(updates.alpha, this.alpha);
    if (format === "rgb" || format === "hex") {
      const preserveBlackHsbSaturation = this.hsb.brightness === 0;
      return new ColorPickerColorImpl(
        finiteOr(updates.red, this.rgb.red),
        finiteOr(updates.green, this.rgb.green),
        finiteOr(updates.blue, this.rgb.blue),
        alpha,
        this.meaningfulHue,
        preserveBlackHsbSaturation ? this.meaningfulHsbSaturation : undefined,
      );
    }

    const hue = normalizeHue(finiteOr(updates.hue, this.meaningfulHue));
    if (format === "hsl") {
      const rgb = hslToRgb(
        hue,
        clamp(finiteOr(updates.saturation, this.hsl.saturation), 0, 100),
        clamp(finiteOr(updates.lightness, this.hsl.lightness), 0, 100),
      );
      return new ColorPickerColorImpl(rgb.red, rgb.green, rgb.blue, alpha, hue);
    }

    const saturation = clamp(finiteOr(updates.saturation, this.hsb.saturation), 0, 100);
    const brightness = clamp(finiteOr(updates.brightness, this.hsb.brightness), 0, 100);
    const rgb = hsbToRgb(hue, saturation, brightness);
    return new ColorPickerColorImpl(rgb.red, rgb.green, rgb.blue, alpha, hue, saturation);
  }
}

/** Parses the intentionally restricted first-version Color Picker syntax without throwing. */
export function parseColor(input: string): ColorPickerColor | null {
  if (typeof input !== "string") return null;
  const value = input.trim();
  const hex = /^#([\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.exec(value);
  if (hex) return parseHex(hex[1]!);

  const functional = /^(rgb|rgba|hsl|hsla|hsb|hsba)\s*\(([\s\S]*)\)$/i.exec(value);
  if (!functional) return null;
  const name = functional[1]!.toLowerCase();
  const parts = functional[2]!.split(",").map((part) => part.trim());
  const expectsAlpha = name.endsWith("a");
  if (parts.length !== (expectsAlpha ? 4 : 3) || parts.some((part) => part === "")) return null;

  const alpha = expectsAlpha ? parseAlpha(parts[3]!) : 1;
  if (alpha === null) return null;
  if (name.startsWith("rgb")) {
    const channels = parts.slice(0, 3).map(parseNumber);
    if (channels.some((channel) => channel === null)) return null;
    return new ColorPickerColorImpl(channels[0]!, channels[1]!, channels[2]!, alpha);
  }

  const hue = parseHue(parts[0]!);
  const saturation = parsePercent(parts[1]!);
  const third = parsePercent(parts[2]!);
  if (hue === null || saturation === null || third === null) return null;
  const normalizedHue = normalizeHue(hue);
  const rgb = name.startsWith("hsl")
    ? hslToRgb(normalizedHue, clamp(saturation, 0, 100), clamp(third, 0, 100))
    : hsbToRgb(normalizedHue, clamp(saturation, 0, 100), clamp(third, 0, 100));
  return new ColorPickerColorImpl(rgb.red, rgb.green, rgb.blue, alpha, normalizedHue);
}

function parseHex(hex: string): ColorPickerColor {
  const expanded = hex.length <= 4 ? [...hex].map((part) => part + part).join("") : hex;
  return new ColorPickerColorImpl(
    Number.parseInt(expanded.slice(0, 2), 16),
    Number.parseInt(expanded.slice(2, 4), 16),
    Number.parseInt(expanded.slice(4, 6), 16),
    expanded.length === 8 ? Number.parseInt(expanded.slice(6, 8), 16) / 255 : 1,
  );
}

const NUMBER_PATTERN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;

function parseNumber(value: string): number | null {
  if (!NUMBER_PATTERN.test(value)) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function parsePercent(value: string): number | null {
  if (!value.endsWith("%")) return null;
  return parseNumber(value.slice(0, -1));
}

function parseAlpha(value: string): number | null {
  if (!value.endsWith("%")) return parseNumber(value);
  const percentage = parsePercent(value);
  return percentage === null ? null : percentage / 100;
}

function parseHue(value: string): number | null {
  const normalized = value.toLowerCase();
  return parseNumber(normalized.endsWith("deg") ? normalized.slice(0, -3) : normalized);
}

function hslToRgb(hue: number, saturation: number, lightness: number) {
  const s = saturation / 100;
  const l = lightness / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  return hueToRgb(hue, chroma, l - chroma / 2);
}

function hsbToRgb(hue: number, saturation: number, brightness: number) {
  const value = brightness / 100;
  const chroma = value * (saturation / 100);
  return hueToRgb(hue, chroma, value - chroma);
}

function hueToRgb(hue: number, chroma: number, offset: number) {
  const sector = normalizeHue(hue) / 60;
  const second = chroma * (1 - Math.abs((sector % 2) - 1));
  const [red, green, blue] =
    sector < 1
      ? [chroma, second, 0]
      : sector < 2
        ? [second, chroma, 0]
        : sector < 3
          ? [0, chroma, second]
          : sector < 4
            ? [0, second, chroma]
            : sector < 5
              ? [second, 0, chroma]
              : [chroma, 0, second];
  return { blue: (blue + offset) * 255, green: (green + offset) * 255, red: (red + offset) * 255 };
}

function rgbToHsl(red: number, green: number, blue: number, fallbackHue: number) {
  const normalized: [number, number, number] = [red / 255, green / 255, blue / 255];
  const max = Math.max(...normalized);
  const min = Math.min(...normalized);
  const delta = max - min;
  const lightness = (max + min) / 2;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  return {
    alpha: 1,
    hue: delta === 0 ? fallbackHue : rgbHue(normalized, max, delta),
    lightness: lightness * 100,
    saturation: saturation * 100,
  };
}

function rgbToHsb(red: number, green: number, blue: number, fallbackHue: number) {
  const normalized: [number, number, number] = [red / 255, green / 255, blue / 255];
  const max = Math.max(...normalized);
  const min = Math.min(...normalized);
  const delta = max - min;
  return {
    alpha: 1,
    brightness: max * 100,
    hue: delta === 0 ? fallbackHue : rgbHue(normalized, max, delta),
    saturation: max === 0 ? 0 : (delta / max) * 100,
  };
}

function rgbHue([red, green, blue]: [number, number, number], max: number, delta: number): number {
  if (max === red) return normalizeHue(60 * (((green - blue) / delta) % 6));
  if (max === green) return 60 * ((blue - red) / delta + 2);
  return 60 * ((red - green) / delta + 4);
}

function serializeHex(rgb: ColorPickerRgbChannels, includeAlpha: boolean): string {
  const byte = (value: number) =>
    Math.round(clamp(value, 0, 255))
      .toString(16)
      .padStart(2, "0");
  return `#${byte(rgb.red)}${byte(rgb.green)}${byte(rgb.blue)}${includeAlpha ? byte(rgb.alpha * 255) : ""}`;
}

function serializeRgb(channels: ColorPickerRgbChannels, includeAlpha: boolean): string {
  const values = [channels.red, channels.green, channels.blue]
    .map((value) => String(Math.round(value)))
    .join(", ");
  return serializeFunction("rgb", values, channels.alpha, includeAlpha);
}

function serializeHsl(channels: ColorPickerHslChannels, includeAlpha: boolean): string {
  const values = `${formatHue(channels.hue)}, ${formatNumber(channels.saturation, 1)}%, ${formatNumber(channels.lightness, 1)}%`;
  return serializeFunction("hsl", values, channels.alpha, includeAlpha);
}

function serializeHsb(channels: ColorPickerHsbChannels, includeAlpha: boolean): string {
  const values = `${formatHue(channels.hue)}, ${formatNumber(channels.saturation, 1)}%, ${formatNumber(channels.brightness, 1)}%`;
  return serializeFunction("hsb", values, channels.alpha, includeAlpha);
}

function serializeFunction(
  format: "rgb" | "hsl" | "hsb",
  values: string,
  alpha: number,
  includeAlpha: boolean,
): string {
  const alphaValue = includeAlpha ? `, ${formatNumber(alpha, 3)}` : "";
  return `${format}${includeAlpha ? "a" : ""}(${values}${alphaValue})`;
}

function formatNumber(value: number, precision: number): string {
  return Number(value.toFixed(precision)).toString();
}

function formatHue(value: number): string {
  const rounded = Math.round(normalizeHue(value) * 10) / 10;
  return formatNumber(normalizeHue(rounded), 1);
}

function normalizeHue(value: number): number {
  return ((value % 360) + 360) % 360;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

type ColorEqualityKey = readonly [
  red: number,
  green: number,
  blue: number,
  alpha: number,
  hue: number,
  zeroBrightnessHsbSaturation: number,
];

// Equality uses exact integer keys at nine decimal places. This absorbs conversion-level floating
// recovery without reducing the precision stored by the color model. Hue uses a cyclic key so the
// upper quantization boundary wraps to the same key as zero degrees.
const EQUALITY_QUANTIZATION_SCALE = 1_000_000_000;
const HUE_KEY_COUNT = 360 * EQUALITY_QUANTIZATION_SCALE;

function createColorEqualityKey(
  red: number,
  green: number,
  blue: number,
  alpha: number,
  meaningfulHue: number,
  meaningfulHsbSaturation: number,
): ColorEqualityKey {
  const zeroBrightness = Math.max(red, green, blue) === 0;
  const key: ColorEqualityKey = [
    quantize(red),
    quantize(green),
    quantize(blue),
    quantize(alpha),
    Math.round(normalizeHue(meaningfulHue) * EQUALITY_QUANTIZATION_SCALE) % HUE_KEY_COUNT,
    zeroBrightness ? quantize(clamp(meaningfulHsbSaturation, 0, 100)) : 0,
  ];
  return freeze(key);
}

function quantize(value: number): number {
  return Math.round(value * EQUALITY_QUANTIZATION_SCALE);
}

function finiteOr(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) ? value : fallback;
}

function freeze<T extends object>(value: T): Readonly<T> {
  return Object.freeze(value);
}
