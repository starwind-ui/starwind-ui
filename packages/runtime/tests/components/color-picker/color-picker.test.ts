import { describe, expect, it } from "vitest";

import { parseColor } from "../../../src/components/color-picker/color-picker";

describe("ColorPickerColor", () => {
  it.each([
    ["#0f8", "#00ff88"],
    ["#0f88", "#00ff8888"],
    ["#00ff88", "#00ff88"],
    ["#00ff8880", "#00ff8880"],
    ["rgb(300, -2, 127.5)", "#ff0080"],
    ["rgba(255, 0, 128, 1.5)", "#ff0080"],
    ["hsl(480, 100%, 50%)", "#00ff00"],
    ["hsla(-120, 100%, 50%, .25)", "#0000ff40"],
    ["hsb(60, 100%, 100%)", "#ffff00"],
    ["hsba(300, 100%, 50%, 0)", "#80008000"],
    ["hsla(+120deg, 100%, 50%, 50%)", "#00ff0080"],
    ["rgba(+255, -0, 1., .5)", "#ff000180"],
    ["rgb(\n 255,\n 0,\n 128\n)", "#ff0080"],
    ["hsla(\n 240deg,\n 100%,\n 50%,\n 25%\n)", "#0000ff40"],
  ])("parses %s", (input, expected) => {
    expect(parseColor(input)?.toString("hex")).toBe(expected);
  });

  it.each([
    "",
    "red",
    "currentColor",
    "var(--color)",
    "none",
    "calc(1)",
    "#12",
    "#ggg",
    "rgb(1 2 3)",
    "rgb(1, 2, 3, .5)",
    "rgba(1, 2, 3)",
    "rgb(1e2, 2, 3)",
    "rgb(Infinity, 2, 3)",
    "rgb(NaN, 2, 3)",
    "hsl(0, 20, 30%)",
    "hsb(0, 20%, NaN%)",
    "hsl(1rad, 20%, 30%)",
    "hsl(1turn, 20%, 30%)",
    "hsla(1deg, 20%, 30%, 5%%)",
    "rgba(1, 2, 3, 1e-1)",
  ])("returns null without throwing for %s", (input) => {
    expect(() => parseColor(input)).not.toThrow();
    expect(parseColor(input)).toBeNull();
  });

  it("accepts whitespace around comma-separated tokens and newlines but rejects whitespace between numeric values and units", () => {
    expect(parseColor("hsla(\n 120deg ,\n 50% ,\n 25% ,\n 50%\n)")?.toString("hex")).toBe(
      "#20602080",
    );
    expect(parseColor("hsl(120 deg, 50%, 25%)")).toBeNull();
    expect(parseColor("hsl(120deg, 50 %, 25%)")).toBeNull();
    expect(parseColor("hsla(120deg, 50%, 25%, 50 %)")).toBeNull();
  });

  it("serializes all formats using the canonical rounding policy", () => {
    const color = parseColor("rgba(12.4, 128.5, 254.6, .12349)");
    expect(color).not.toBeNull();
    expect(color?.toString("hex")).toBe("#0c81ff1f");
    expect(color?.toString("rgb")).toBe("rgba(12, 129, 255, 0.123)");
    expect(color?.toString("hsl")).toBe("hsla(211.2, 99.7%, 52.4%, 0.123)");
    expect(color?.toString("hsb")).toBe("hsba(211.2, 95.1%, 99.8%, 0.123)");
  });

  it.each([
    ["hsl(359.96deg, 0%, 50%)", "hsl", "hsl(0, 0%, 50%)"],
    ["hsl(-.04deg, 0%, 50%)", "hsl", "hsl(0, 0%, 50%)"],
    ["hsl(719.96deg, 0%, 50%)", "hsl", "hsl(0, 0%, 50%)"],
    ["hsl(359.94deg, 0%, 50%)", "hsl", "hsl(359.9, 0%, 50%)"],
    ["hsb(359.96deg, 0%, 50%)", "hsb", "hsb(0, 0%, 50%)"],
    ["hsb(-.04deg, 0%, 50%)", "hsb", "hsb(0, 0%, 50%)"],
    ["hsb(719.96deg, 0%, 50%)", "hsb", "hsb(0, 0%, 50%)"],
    ["hsb(359.94deg, 0%, 50%)", "hsb", "hsb(359.9, 0%, 50%)"],
  ] as const)("normalizes rounded hue for %s", (input, format, expected) => {
    expect(parseColor(input)?.toString(format)).toBe(expected);
  });

  it("omits opaque alpha unless an alpha-bearing format is requested", () => {
    const color = parseColor("#123456");
    expect(color?.toString("hex")).toBe("#123456");
    expect(color?.toString("hexa")).toBe("#123456ff");
    expect(color?.toString("rgb")).toBe("rgb(18, 52, 86)");
    expect(color?.toString("rgba")).toBe("rgba(18, 52, 86, 1)");
  });

  it("is deeply immutable and creates new colors for channel edits", () => {
    const color = parseColor("hsb(210, 50%, 80%)")!;
    expect(Object.isFrozen(color)).toBe(true);
    expect(Object.isFrozen(color.rgb)).toBe(true);
    expect(Object.isFrozen(color.hsl)).toBe(true);
    expect(Object.isFrozen(color.hsb)).toBe(true);

    const changed = color.withChannels("hsb", { saturation: 25 });
    expect(changed).not.toBe(color);
    expect(changed.hsb.alpha).toBe(1);
    expect(changed.hsb.brightness).toBeCloseTo(80, 10);
    expect(changed.hsb.hue).toBeCloseTo(210, 10);
    expect(changed.hsb.saturation).toBeCloseTo(25, 10);
    expect(color.hsb.saturation).toBe(50);
  });

  it("keeps its reflective equality key frozen and equality immutable", () => {
    const color = parseColor("hsba(210, 50%, 80%, .4)")!;
    const equalityKey = Object.values(color as unknown as Record<string, unknown>).find((value) =>
      Array.isArray(value),
    );

    expect(equalityKey).toBeDefined();
    expect(Object.isFrozen(equalityKey)).toBe(true);
    if (!equalityKey)
      throw new Error("Expected the private equality key to be reflectively visible");
    const originalKey = [...equalityKey];
    try {
      equalityKey[0] = Number(equalityKey[0]) + 1;
    } catch {
      // Strict-mode assignment to a frozen tuple throws; immutability is asserted below.
    }

    expect(equalityKey).toEqual(originalKey);
    expect(color.equals(color)).toBe(true);
  });

  it("retains meaningful hue through gray and black edits", () => {
    const blue = parseColor("hsb(225, 70%, 80%)")!;
    const gray = blue.withChannels("hsb", { saturation: 0 });
    const black = gray.withChannels("hsb", { brightness: 0 });

    expect(gray.hsb.hue).toBeCloseTo(225, 10);
    expect(black.hsb.hue).toBeCloseTo(225, 10);
    expect(black.withChannels("hsb", { brightness: 80, saturation: 70 }).hsb.hue).toBeCloseTo(
      225,
      10,
    );

    const hslGray = blue.withChannels("hsl", { saturation: 0 });
    expect(hslGray.withChannels("hsl", { saturation: 70 }).hsl.hue).toBeCloseTo(225, 10);
  });

  it("retains meaningful HSB saturation at zero brightness without changing black RGB output", () => {
    const externalBlack = parseColor("hsb(225, 70%, 0%)")!;
    const black = parseColor("hsb(225, 70%, 80%)")!.withChannels("hsb", { brightness: 0 });
    const movedAcrossBlack = black.withChannels("hsb", { saturation: 35 });
    const translucentBlack = black.withChannels("hsb", { alpha: 0.4 });
    const rgbAlphaClone = translucentBlack.withChannels("rgb", { alpha: 1 });
    const restored = movedAcrossBlack.withChannels("hsb", { brightness: 80 });

    expect(externalBlack.hsb.saturation).toBe(0);
    expect(externalBlack.toString("hsb")).toBe("hsb(225, 0%, 0%)");
    expect(black.hsb.saturation).toBeCloseTo(70, 10);
    expect(black.toString("hex")).toBe("#000000");
    expect(black.toString("rgb")).toBe("rgb(0, 0, 0)");
    expect(black.toString("hsb")).toBe("hsb(225, 70%, 0%)");
    expect(movedAcrossBlack.hsb.saturation).toBeCloseTo(35, 10);
    expect(restored.hsb.saturation).toBeCloseTo(35, 10);
    expect(rgbAlphaClone.toString("hsb")).toBe("hsb(225, 70%, 0%)");
    expect(rgbAlphaClone.equals(black)).toBe(true);
    expect(black.equals(rgbAlphaClone)).toBe(true);
    expect(black.equals(movedAcrossBlack)).toBe(false);
    expect(movedAcrossBlack.equals(black)).toBe(false);
  });

  it.each([0, 100])("retains HSL hue through lightness %s and restores it", (lightness) => {
    const original = parseColor("hsl(213.3deg, 67%, 42%)")!;
    const achromatic = original.withChannels("hsl", { lightness });
    const restored = achromatic.withChannels("hsl", { lightness: 42, saturation: 67 });

    expect(achromatic.hsl.hue).toBeCloseTo(213.3, 10);
    expect(restored.hsl.hue).toBeCloseTo(213.3, 10);
    expect(restored.hsl.lightness).toBeCloseTo(42, 10);
    expect(restored.hsl.saturation).toBeCloseTo(67, 10);
  });

  it("replaces stale retained hue after chromatic RGB edits", () => {
    const yellow = parseColor("#ff0000")!.withChannels("rgb", { green: 255 });
    expect(yellow.hsb.hue).toBeCloseTo(60, 10);

    const hsbBlack = yellow
      .withChannels("hsb", { saturation: 0 })
      .withChannels("hsb", { brightness: 0 });
    expect(hsbBlack.withChannels("hsb", { brightness: 100, saturation: 100 }).hsb.hue).toBeCloseTo(
      60,
      10,
    );

    const hslGray = yellow.withChannels("hsl", { saturation: 0 });
    expect(hslGray.withChannels("hsl", { saturation: 100 }).hsl.hue).toBeCloseTo(60, 10);
  });

  it("derives retained hue from clamped RGB channels", () => {
    const color = parseColor("rgb(300, 0, 255)")!;
    const expectedHue = color.hsb.hue;
    expect(expectedHue).toBeCloseTo(300, 10);

    const hsbBlack = color
      .withChannels("hsb", { saturation: 0 })
      .withChannels("hsb", { brightness: 0 });
    expect(hsbBlack.withChannels("hsb", { brightness: 100, saturation: 100 }).hsb.hue).toBeCloseTo(
      expectedHue,
      10,
    );

    const hslGray = color.withChannels("hsl", { saturation: 0 });
    expect(hslGray.withChannels("hsl", { saturation: 100 }).hsl.hue).toBeCloseTo(expectedHue, 10);
  });

  it("does not accumulate drift when serializing repeatedly across formats", () => {
    const original = parseColor("rgba(17.25, 101.75, 233.5, .3478)")!;
    let cycled = original;
    for (let index = 0; index < 50; index += 1) {
      cycled = parseColor(cycled.toString("hsl"))!;
      cycled = parseColor(cycled.toString("hsb"))!;
      cycled = parseColor(cycled.toString("rgb"))!;
    }

    expect(Math.abs(cycled.rgb.red - original.rgb.red)).toBeLessThanOrEqual(1);
    expect(Math.abs(cycled.rgb.green - original.rgb.green)).toBeLessThanOrEqual(1);
    expect(Math.abs(cycled.rgb.blue - original.rgb.blue)).toBeLessThanOrEqual(1);
    expect(Math.abs(cycled.alpha - original.alpha)).toBeLessThanOrEqual(0.001);
  });

  it("does not drift through repeated internal edits or mutate while serializing", () => {
    const original = parseColor("hsba(213.25deg, 67.75%, 81.5%, 34.78%)")!;
    const rgbBefore = original.rgb;
    const hslBefore = original.hsl;
    const hsbBefore = original.hsb;

    for (const format of ["hex", "hexa", "rgb", "rgba", "hsl", "hsla", "hsb", "hsba"] as const) {
      original.toString(format);
    }
    expect(original.rgb).toBe(rgbBefore);
    expect(original.hsl).toBe(hslBefore);
    expect(original.hsb).toBe(hsbBefore);

    let edited = original;
    for (let index = 0; index < 100; index += 1) {
      edited = edited.withChannels("hsb", { brightness: 50 });
      edited = edited.withChannels("hsb", { brightness: original.hsb.brightness });
    }
    expect(edited.rgb.red).toBeCloseTo(original.rgb.red, 10);
    expect(edited.rgb.green).toBeCloseTo(original.rgb.green, 10);
    expect(edited.rgb.blue).toBeCloseTo(original.rgb.blue, 10);
    expect(edited.alpha).toBe(original.alpha);
  });

  it("ignores non-finite channel updates and clamps finite updates", () => {
    const color = parseColor("hsba(210, 50%, 75%, .4)")!;
    const rgb = color.withChannels("rgb", {
      alpha: Number.NaN,
      blue: Number.POSITIVE_INFINITY,
      green: -20,
      red: Number.NaN,
    });
    expect(rgb.alpha).toBe(color.alpha);
    expect(rgb.rgb.red).toBe(color.rgb.red);
    expect(rgb.rgb.blue).toBe(color.rgb.blue);
    expect(rgb.rgb.green).toBe(0);

    const hsl = color.withChannels("hsl", {
      alpha: Number.NEGATIVE_INFINITY,
      hue: Number.NaN,
      lightness: Number.POSITIVE_INFINITY,
      saturation: 200,
    });
    expect(hsl.alpha).toBe(color.alpha);
    expect(hsl.hsl.hue).toBeCloseTo(color.hsl.hue, 10);
    expect(hsl.hsl.lightness).toBeCloseTo(color.hsl.lightness, 10);
    expect(hsl.hsl.saturation).toBeCloseTo(100, 10);

    const hsb = color.withChannels("hsb", {
      alpha: 2,
      brightness: Number.NaN,
      hue: Number.POSITIVE_INFINITY,
      saturation: -10,
    });
    expect(hsb.alpha).toBe(1);
    expect(hsb.hsb.hue).toBeCloseTo(color.hsb.hue, 10);
    expect(hsb.hsb.brightness).toBeCloseTo(color.hsb.brightness, 10);
    expect(hsb.hsb.saturation).toBe(0);
  });

  it("compares colors by normalized internal channels and retained hue", () => {
    expect(parseColor("#ff0000")?.equals(parseColor("rgb(255, 0, 0)")!)).toBe(true);
    expect(parseColor("hsb(120, 0%, 50%)")?.equals(parseColor("hsb(240, 0%, 50%)")!)).toBe(false);
  });

  it("compares fractional and wrapped hues reflexively and symmetrically", () => {
    const wrapped = parseColor("hsb(-.25deg, 100%, 100%)")!;
    const normalized = parseColor("hsb(359.75deg, 100%, 100%)")!;
    const extreme = parseColor("hsb(719.75deg, 100%, 100%)")!;

    expect(wrapped.equals(wrapped)).toBe(true);
    expect(normalized.equals(normalized)).toBe(true);
    expect(wrapped.equals(normalized)).toBe(true);
    expect(normalized.equals(wrapped)).toBe(true);
    expect(extreme.equals(wrapped)).toBe(true);

    const grayA = parseColor("hsb(.1deg, 0%, 50%)")!;
    const grayB = parseColor("hsb(359.9deg, 0%, 50%)")!;
    expect(grayA.equals(grayA)).toBe(true);
    expect(grayA.equals(grayB)).toBe(false);
    expect(grayB.equals(grayA)).toBe(false);
  });

  it("compares exact quantized keys transitively around equality boundaries", () => {
    const below = parseColor("rgb(13.29999999951, 0, 0)")!;
    const center = parseColor("rgb(13.3, 0, 0)")!;
    const recovered = parseColor("rgb(13.300000000000011, 0, 0)")!;
    const above = parseColor("rgb(13.30000000049, 0, 0)")!;
    const nextKey = parseColor("rgb(13.30000000051, 0, 0)")!;

    expect(below.equals(center)).toBe(true);
    expect(center.equals(recovered)).toBe(true);
    expect(center.equals(above)).toBe(true);
    expect(below.equals(above)).toBe(true);
    expect(center.equals(nextKey)).toBe(false);

    const probeA = parseColor("rgb(0, 0, 0)")!;
    const probeB = parseColor("rgb(0.00000000075, 0, 0)")!;
    const probeC = parseColor("rgb(0.0000000015, 0, 0)")!;
    expect(probeA.equals(probeB)).toBe(false);
    expect(probeB.equals(probeC)).toBe(false);
    expect(probeA.equals(probeC)).toBe(false);
  });

  it("correlates channel update keys with their format", () => {
    const color = parseColor("#123456")!;
    if (false) {
      // @ts-expect-error brightness is not an HSL channel.
      color.withChannels("hsl", { brightness: 50 });
      // @ts-expect-error hue is not an RGB channel.
      color.withChannels("rgb", { hue: 120 });
      // @ts-expect-error lightness is not an HSB channel.
      color.withChannels("hsb", { lightness: 50 });
    }
    expect(color.toString()).toBe("#123456");
  });
});
