import { describe, expect, it } from "vitest";
import {
  COLOR_PICKER_INITIAL_OWNERSHIP_ATTRIBUTE,
  COLOR_PICKER_INITIAL_PARTS,
  createColorPickerInitialState,
  projectColorPickerInitialPart,
  type ColorPickerInitialPartRequest,
} from "../../../src/components/color-picker/initial-state";
import { parseColor } from "../../../src/components/color-picker/color-picker";

describe("Color Picker initial state projection", () => {
  it("normalizes invalid, empty, translucent, opaque, and formatted values immutably", () => {
    const invalid = createColorPickerInitialState({ value: "not-a-color" });
    expect(invalid.valueAsString).toBe("#000000");
    expect(invalid.cssColor).toBe("#000000");

    const empty = createColorPickerInitialState({ value: null, allowEmpty: true });
    expect(empty.value).toBeNull();
    expect(empty.valueAsString).toBe("");
    expect(empty.cssColor).toBe("transparent");

    const withoutAlpha = createColorPickerInitialState({ value: "#33669980", alpha: false });
    expect(withoutAlpha.valueAsString).toBe("#336699");
    expect(withoutAlpha.value?.alpha).toBe(1);

    expect(
      (["hex", "rgb", "hsl", "hsb"] as const).map(
        (format) => createColorPickerInitialState({ value: "#33669980", format }).valueAsString,
      ),
    ).toEqual([
      "#33669980",
      "rgba(51, 102, 153, 0.502)",
      "hsla(210, 50%, 40%, 0.502)",
      "hsba(210, 66.7%, 60%, 0.502)",
    ]);
    expect(Object.isFrozen(invalid)).toBe(true);
    expect(invalid.dir).toBeUndefined();
    expect(projectColorPickerInitialPart(invalid, { part: "root" }).attributes.dir).toBeUndefined();
  });

  it("projects every public part and pins compound composition inputs", () => {
    const state = createColorPickerInitialState({ value: "#33669980", allowEmpty: true });
    const contextual = new Map<string, ColorPickerInitialPartRequest>([
      ["area", { part: "area", xChannel: "saturation", yChannel: "brightness" }],
      [
        "areaBackground",
        { part: "areaBackground", xChannel: "saturation", yChannel: "brightness" },
      ],
      ["areaThumb", { part: "areaThumb", xChannel: "saturation", yChannel: "brightness" }],
      [
        "areaInput",
        { part: "areaInput", axis: "x", xChannel: "saturation", yChannel: "brightness" },
      ],
      ["channelSlider", { part: "channelSlider", channel: "hue" }],
      ["channelSliderTrack", { part: "channelSliderTrack", channel: "hue" }],
      ["channelSliderThumb", { part: "channelSliderThumb", channel: "hue" }],
      ["channelSliderInput", { part: "channelSliderInput", channel: "hue" }],
      ["channelInput", { part: "channelInput", channel: "red" }],
      ["swatch", { part: "swatch", value: "#33669980" }],
    ]);
    const projections = COLOR_PICKER_INITIAL_PARTS.map((part) =>
      projectColorPickerInitialPart(
        state,
        contextual.get(part) ?? ({ part } as ColorPickerInitialPartRequest),
      ),
    );
    expect(projections.map((projection) => projection.part)).toEqual(COLOR_PICKER_INITIAL_PARTS);
    expect(projections.every(Object.isFrozen)).toBe(true);
  });

  it("projects Clear eligibility as owned hidden and disabled state", () => {
    const ineligible = projectColorPickerInitialPart(createColorPickerInitialState(), {
      part: "clear",
    });
    const eligible = projectColorPickerInitialPart(
      createColorPickerInitialState({ allowEmpty: true }),
      { part: "clear" },
    );

    expect(ineligible.properties).toEqual({ hidden: true, disabled: true });
    expect(ineligible.ownership.properties).toEqual(["hidden", "disabled"]);
    expect(eligible.properties).toEqual({ hidden: false, disabled: false });
    expect(eligible.ownership.properties).toEqual(["hidden", "disabled"]);
  });

  it("projects coordinateful black consistently into initial area and form state", () => {
    const black = parseColor("hsba(210, 65%, 70%, .4)")!.withChannels("hsb", {
      brightness: 0,
    });
    const state = createColorPickerInitialState({ value: black, format: "hsb", alpha: false });

    expect(projectColorPickerInitialPart(state, { part: "root" }).styles).toMatchObject({
      "--sw-color-picker-saturation": "65%",
      "--sw-color-picker-brightness": "0%",
    });
    expect(projectColorPickerInitialPart(state, { part: "areaThumb" }).styles).toMatchObject({
      "--sw-color-picker-area-x": "65%",
      "--sw-color-picker-area-y": "100%",
    });
    expect(projectColorPickerInitialPart(state, { part: "hiddenInput" }).properties.value).toBe(
      "hsb(210, 65%, 0%)",
    );
  });

  it("omits false and undefined attributes while retaining presence and ARIA string semantics", () => {
    const state = createColorPickerInitialState({ value: "#336699", format: "hsl" });
    const requests: ColorPickerInitialPartRequest[] = [
      { part: "root" },
      { part: "valueInput" },
      { part: "area" },
      { part: "areaThumb" },
      { part: "channelSlider", channel: "alpha" },
      { part: "channelSliderThumb", channel: "alpha" },
      { part: "channelInput", channel: "alpha" },
      { part: "swatch", value: "#ffffff" },
      { part: "hiddenInput" },
    ];

    for (const request of requests) {
      const projection = projectColorPickerInitialPart(state, request);
      expect(Object.values(projection.attributes)).not.toContain(false);
      expect(Object.values(projection.attributes)).not.toContain(undefined);
    }

    const root = projectColorPickerInitialPart(state, { part: "root" });
    expect(root.attributes).not.toHaveProperty("data-invalid");
    expect(root.attributes).not.toHaveProperty("data-disabled");
    expect(root.attributes).not.toHaveProperty("data-readonly");
    expect(root.ownership.attributes).toContain("data-invalid");
    expect(root.attributes[COLOR_PICKER_INITIAL_OWNERSHIP_ATTRIBUTE]).toContain("a:data-invalid");

    const valueInput = projectColorPickerInitialPart(state, { part: "valueInput" });
    expect(valueInput.attributes["aria-invalid"]).toBe("false");
    expect(valueInput.attributes).not.toHaveProperty("data-invalid");
    expect(
      projectColorPickerInitialPart(state, { part: "formatSelect" }).attributes["aria-readonly"],
    ).toBe("false");
    expect(projectColorPickerInitialPart(state, { part: "formatControl" })).toMatchObject({
      attributes: { "data-format": "hsl" },
      properties: {},
    });
    expect(
      projectColorPickerInitialPart(state, { part: "swatch", value: "#ffffff" }).attributes[
        "aria-pressed"
      ],
    ).toBe("false");

    const enabledAlpha = projectColorPickerInitialPart(
      createColorPickerInitialState({ alpha: true, disabled: true }),
      { part: "root" },
    );
    expect(enabledAlpha.attributes["data-alpha"]).toBe("");
    expect(enabledAlpha.attributes["data-disabled"]).toBe("");
  });

  it("projects area and channel thumb display colors for every channel family", () => {
    const state = createColorPickerInitialState({ value: "#33669980" });
    expect(
      projectColorPickerInitialPart(state, { part: "areaThumb" }).styles[
        "--sw-color-picker-area-thumb-color"
      ],
    ).toBe("#336699");

    const expected = {
      hue: "#0080ff",
      saturation: "#336699",
      brightness: "#336699",
      lightness: "#336699",
      red: "#336699",
      green: "#336699",
      blue: "#336699",
      alpha: "#33669980",
    } as const;
    for (const [channel, color] of Object.entries(expected)) {
      const projection = projectColorPickerInitialPart(state, {
        part: "channelSliderThumb",
        channel: channel as keyof typeof expected,
      });
      expect(projection.styles["--sw-color-picker-channel-thumb-color"]).toBe(color);
    }

    const empty = createColorPickerInitialState({ value: null, allowEmpty: true });
    expect(
      projectColorPickerInitialPart(empty, { part: "areaThumb" }).styles[
        "--sw-color-picker-area-thumb-color"
      ],
    ).toBeUndefined();
    expect(
      projectColorPickerInitialPart(empty, { part: "channelSliderThumb", channel: "hue" }).styles[
        "--sw-color-picker-channel-thumb-color"
      ],
    ).toBeUndefined();
  });

  it("projects locale, RTL, custom-step, accessibility, swatch, and form semantics", () => {
    const state = createColorPickerInitialState({
      value: "#33669980",
      format: "hsb",
      allowEmpty: true,
      disabled: true,
      readOnly: true,
      required: true,
      name: "accent",
      form: "theme-form",
      locale: "de-DE",
      dir: "rtl",
      getAreaRoleDescription: () => "Farbfläche",
    });
    const root = projectColorPickerInitialPart(state, { part: "root" });
    expect(root.attributes.dir).toBe("rtl");
    expect(root.styles["--sw-color-picker-alpha"]).toBe("0.502");

    const area = projectColorPickerInitialPart(state, {
      part: "areaInput",
      axis: "x",
      xChannel: "hue",
      yChannel: "alpha",
      xStep: 7,
      yStep: 5,
    });
    expect(area.attributes.max).toBe(357);
    expect(area.attributes.step).toBe(7);
    expect(area.attributes["aria-roledescription"]).toBe("Farbfläche");
    expect(area.ownership.attributes).toContain("aria-roledescription");
    expect(area.attributes[COLOR_PICKER_INITIAL_OWNERSHIP_ATTRIBUTE]).toContain(
      "a:aria-roledescription",
    );
    expect(area.attributes["aria-valuetext"]).toContain("210");
    expect(area.attributes["aria-valuetext"]).toContain("50 %");

    const swatch = projectColorPickerInitialPart(state, {
      part: "swatch",
      value: "#33669980",
      disabled: true,
    });
    expect(swatch.attributes["aria-pressed"]).toBe("true");
    expect(swatch.properties.disabled).toBe(true);
    expect(swatch.styles["--sw-color-picker-swatch-color"]).toBe("#33669980");

    expect(projectColorPickerInitialPart(state, { part: "hiddenInput" })).toMatchObject({
      attributes: {
        type: "text",
        "aria-hidden": "true",
        tabindex: -1,
        name: "accent",
        form: "theme-form",
        required: "",
      },
      properties: { value: "hsba(210, 66.7%, 60%, 0.502)", disabled: true },
      styles: { position: "absolute", "clip-path": "inset(50%)" },
    });
    expect(projectColorPickerInitialPart(state, { part: "eyeDropperTrigger" })).toMatchObject({
      attributes: { "data-unsupported": "" },
      properties: { hidden: true, disabled: true },
    });
  });
});
