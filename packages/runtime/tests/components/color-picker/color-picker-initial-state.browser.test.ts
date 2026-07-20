import { describe, expect, it } from "vitest";
import {
  createColorPicker,
  createColorPickerInitialState,
  projectColorPickerInitialPart,
  type ColorPickerInitialPartProjection,
  type ColorPickerInitialStateOptions,
} from "../../../src/components/color-picker";
import { COLOR_PICKER_INITIAL_OWNERSHIP_ATTRIBUTE } from "../../../src/components/color-picker/initial-state";

describe("Color Picker initial projection/controller parity", () => {
  it.each([
    ["opaque", { value: "#336699" }],
    ["translucent", { value: "#33669980" }],
    ["empty", { value: null, allowEmpty: true }],
    ["invalid", { value: "invalid" }],
    ["rgb", { value: "#33669980", format: "rgb" as const }],
    ["hsl", { value: "#33669980", format: "hsl" as const }],
    ["hsb", { value: "#33669980", format: "hsb" as const }],
    [
      "locale, RTL, and form state",
      {
        value: "#33669980",
        locale: "de-DE",
        dir: "rtl" as const,
        allowEmpty: true,
        disabled: true,
        readOnly: true,
        required: true,
        name: "accent",
        form: "theme-form",
      },
    ],
  ])("matches pure projection for %s state", (name, options) => {
    document.body.innerHTML = `${"form" in options && options.form ? '<form id="theme-form"></form>' : ""}${markup()}`;
    const root = document.querySelector<HTMLElement>("[data-sw-color-picker]")!;
    const state = createColorPickerInitialState(options as ColorPickerInitialStateOptions);
    applyProjection(root, projectColorPickerInitialPart(state, { part: "root" }));
    createColorPicker(root, options as ColorPickerInitialStateOptions);

    const enhancedState = createColorPickerInitialState({
      ...(options as ColorPickerInitialStateOptions),
      dir: "dir" in options ? options.dir : "ltr",
    });
    const editingState =
      name === "empty"
        ? createColorPickerInitialState({
            ...(options as ColorPickerInitialStateOptions),
            value: "#000000",
          })
        : state;
    expectElementProjection(root, projectColorPickerInitialPart(enhancedState, { part: "root" }));
    const areaInput = root.querySelector<HTMLInputElement>(
      '[data-sw-color-picker-area-input][data-axis="x"]',
    )!;
    expectElementProjection(
      areaInput,
      projectColorPickerInitialPart(editingState, {
        part: "areaInput",
        axis: "x",
        xChannel: "hue",
        yChannel: "alpha",
        xStep: 7,
        yStep: 5,
        ariaLabelledBy: "color-label",
      }),
    );
    expectElementProjection(
      root.querySelector<HTMLInputElement>("[data-sw-color-picker-channel-input]")!,
      projectColorPickerInitialPart(editingState, {
        part: "channelSliderInput",
        channel: "hue",
        orientation: "vertical",
        step: 7,
      }),
    );
    expectElementProjection(
      root.querySelector<HTMLButtonElement>("[data-sw-color-picker-swatch]")!,
      projectColorPickerInitialPart(state, {
        part: "swatch",
        value: "#33669980",
        disabled: true,
      }),
    );
    expectElementProjection(
      root.querySelector<HTMLInputElement>("[data-sw-color-picker-hidden-input]")!,
      projectColorPickerInitialPart(state, { part: "hiddenInput" }),
      { ignoreDefaultValue: true },
    );
  });

  it("enhances complete server semantics without changing their semantic projection", () => {
    document.body.innerHTML = markup();
    const root = document.querySelector<HTMLElement>("[data-sw-color-picker]")!;
    const state = createColorPickerInitialState({
      defaultValue: "#33669980",
      format: "hsl",
      allowEmpty: true,
      locale: "en-US",
      dir: "rtl",
      name: "accent",
      required: true,
    });
    const targets = projectionTargets(root, state);
    for (const [element, projection] of targets) applyProjection(element, projection);
    expect(root.hasAttribute(COLOR_PICKER_INITIAL_OWNERSHIP_ATTRIBUTE)).toBe(true);
    const before = targets.map(([element, projection]) => semanticFingerprint(element, projection));

    createColorPicker(root, {
      defaultValue: "#33669980",
      format: "hsl",
      allowEmpty: true,
      locale: "en-US",
      dir: "rtl",
      name: "accent",
      required: true,
    });

    const after = targets.map(([element, projection]) => semanticFingerprint(element, projection));
    expect(after).toEqual(before);
    expect(root.hasAttribute(COLOR_PICKER_INITIAL_OWNERSHIP_ATTRIBUTE)).toBe(false);
  });

  it("reconciles Clear visibility and disabled state across capability lifecycle changes", () => {
    document.body.innerHTML = markup();
    const root = document.querySelector<HTMLElement>("[data-sw-color-picker]")!;
    const clear = root.querySelector<HTMLButtonElement>("[data-sw-color-picker-clear]")!;
    const state = createColorPickerInitialState({ defaultValue: "#ff0000" });
    applyProjection(clear, projectColorPickerInitialPart(state, { part: "clear" }));
    const picker = createColorPicker(root, { defaultValue: "#ff0000" });

    expect(clear.hidden).toBe(true);
    expect(clear.disabled).toBe(true);
    clear.hidden = false;
    clear.disabled = false;
    clear.click();
    expect(picker.getValueAsString()).toBe("#ff0000");

    picker.setOptions({ allowEmpty: true });
    expect(clear.hidden).toBe(false);
    expect(clear.disabled).toBe(false);
    picker.setDisabled(true);
    expect(clear.hidden).toBe(false);
    expect(clear.disabled).toBe(true);
    picker.setDisabled(false);
    picker.setOptions({ allowEmpty: false });
    expect(clear.hidden).toBe(true);
    expect(clear.disabled).toBe(true);

    picker.setOptions({ allowEmpty: true });
    const replacement = document.createElement("button");
    replacement.type = "button";
    replacement.setAttribute("data-sw-color-picker-clear", "");
    replacement.hidden = true;
    replacement.disabled = true;
    clear.replaceWith(replacement);
    picker.refresh({ preserveState: true });
    expect(replacement.hidden).toBe(false);
    expect(replacement.disabled).toBe(false);

    picker.setOptions({ allowEmpty: false });
    expect(replacement.hidden).toBe(true);
    expect(replacement.disabled).toBe(true);
  });

  it("uses absent server validity as Runtime-owned state that can be added and removed", () => {
    document.body.innerHTML = markup();
    const root = document.querySelector<HTMLElement>("[data-sw-color-picker]")!;
    const valueInput = root.querySelector<HTMLInputElement>("[data-sw-color-picker-value-input]")!;
    const validState = createColorPickerInitialState({
      defaultValue: "#336699",
      allowEmpty: true,
      required: true,
    });
    applyProjection(root, projectColorPickerInitialPart(validState, { part: "root" }));
    applyProjection(valueInput, projectColorPickerInitialPart(validState, { part: "valueInput" }));

    expect(root).not.toHaveAttribute("data-invalid");
    expect(valueInput).not.toHaveAttribute("data-invalid");
    expect(valueInput).toHaveAttribute("aria-invalid", "false");
    expect(root.getAttribute(COLOR_PICKER_INITIAL_OWNERSHIP_ATTRIBUTE)).toContain("a:data-invalid");

    const picker = createColorPicker(root, {
      defaultValue: "#336699",
      allowEmpty: true,
      required: true,
    });
    picker.setValue(null, { emit: false });
    expect(root).toHaveAttribute("data-invalid");
    expect(valueInput).toHaveAttribute("data-invalid");
    expect(valueInput).toHaveAttribute("aria-invalid", "true");

    picker.setValue("#00ff00", { emit: false });
    expect(root).not.toHaveAttribute("data-invalid");
    expect(valueInput).not.toHaveAttribute("data-invalid");
    expect(valueInput).toHaveAttribute("aria-invalid", "false");
  });

  it("inherits RTL when dir is omitted and keeps keyboard and pointer geometry logical", () => {
    document.body.innerHTML = `<div dir="rtl">${markup()}</div>`;
    const root = document.querySelector<HTMLElement>("[data-sw-color-picker]")!;
    const state = createColorPickerInitialState({ defaultValue: "#ff0000" });
    const rootProjection = projectColorPickerInitialPart(state, { part: "root" });
    expect(rootProjection.attributes.dir).toBeUndefined();
    applyProjection(root, rootProjection);
    expect(root.hasAttribute("dir")).toBe(false);

    const picker = createColorPicker(root, { defaultValue: "#ff0000" });
    expect(root.getAttribute("dir")).toBe("rtl");
    const slider = root.querySelector<HTMLElement>("[data-sw-color-picker-channel-slider]")!;
    slider.setAttribute("data-orientation", "horizontal");
    const input = root.querySelector<HTMLInputElement>("[data-sw-color-picker-channel-input]")!;
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(picker.getValue()!.hsb.hue).toBe(357);

    picker.setValue("#ff0000", { emit: false });
    slider.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        width: 100,
        height: 20,
        right: 100,
        bottom: 20,
        x: 0,
        y: 0,
        toJSON() {},
      }) as DOMRect;
    slider.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        pointerId: 42,
        clientX: 0,
        clientY: 10,
      }),
    );
    document.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, pointerId: 42, clientX: 0, clientY: 10 }),
    );
    expect(picker.getValue()!.hsb.hue).toBe(357);
  });

  it("preserves invalid whole-value and channel drafts across unrelated renders", () => {
    document.body.innerHTML = markup();
    const root = document.querySelector<HTMLElement>("[data-sw-color-picker]")!;
    const picker = createColorPicker(root, { defaultValue: "#336699" });
    const valueInput = root.querySelector<HTMLInputElement>("[data-sw-color-picker-value-input]")!;
    const channelInput = root.querySelector<HTMLInputElement>(
      "[data-sw-color-picker-channel-field]",
    )!;

    valueInput.value = "not-a-color";
    valueInput.dispatchEvent(new Event("input", { bubbles: true }));
    channelInput.value = "not-a-number";
    channelInput.dispatchEvent(new Event("input", { bubbles: true }));
    picker.setDisabled(true);
    picker.setDisabled(false);
    picker.setOptions({ locale: "de-DE" });
    picker.setValue("#ff0000", { emit: false });

    for (const input of [valueInput, channelInput]) {
      expect(input.value).toMatch(/^not-a-/);
      expect(input.getAttribute("data-invalid")).toBe("");
      expect(input.getAttribute("aria-invalid")).toBe("true");
    }
    expect(picker.getValueAsString()).toBe("#ff0000");
  });

  it("silently reconciles null when allowEmpty is removed and resets through current capability", async () => {
    document.body.innerHTML = `<form>${markup()}</form>`;
    const root = document.querySelector<HTMLElement>("[data-sw-color-picker]")!;
    let changes = 0;
    let commits = 0;
    const picker = createColorPicker(root, {
      defaultValue: null,
      allowEmpty: true,
      name: "accent",
      onValueChange: () => changes++,
      onValueCommitted: () => commits++,
    });
    const valueInput = root.querySelector<HTMLInputElement>("[data-sw-color-picker-value-input]")!;
    valueInput.value = "invalid";
    valueInput.dispatchEvent(new Event("input", { bubbles: true }));

    picker.setOptions({ allowEmpty: false });
    expect(picker.getValueAsString()).toBe("#000000");
    expect(root.getAttribute("data-value")).toBe("#000000");
    expect(root.hasAttribute("data-allow-empty")).toBe(false);
    expect(root.querySelector<HTMLInputElement>("[data-sw-color-picker-hidden-input]")!.value).toBe(
      "#000000",
    );
    expect(valueInput.value).toBe("#000000");
    expect(changes).toBe(0);
    expect(commits).toBe(0);

    picker.setValue("#ff0000", { emit: false });
    root.closest("form")!.reset();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(picker.getValueAsString()).toBe("#000000");
  });

  it("uses the SSR ownership handshake without stealing authored swatch and ARIA state", () => {
    document.body.innerHTML = `<div data-sw-color-picker>
      <div data-sw-color-picker-area data-x-channel="saturation" data-y-channel="brightness">
        <input id="projected-role" data-sw-color-picker-area-input data-axis="x">
        <input id="authored-role" data-sw-color-picker-area-input data-axis="y" aria-roledescription="Authored surface">
      </div>
      <button id="root-disabled" data-sw-color-picker-swatch data-value="#ff0000">Root</button>
      <button id="self-disabled" data-sw-color-picker-swatch data-value="#00ff00" data-disabled>Self</button>
      <button id="authored-disabled" data-sw-color-picker-swatch data-value="#0000ff" disabled>Authored</button>
      <input data-sw-color-picker-hidden-input>
    </div>`;
    const root = document.querySelector<HTMLElement>("[data-sw-color-picker]")!;
    const serverState = createColorPickerInitialState({
      defaultValue: "#ff0000",
      disabled: true,
      getAreaRoleDescription: () => "Server surface",
    });
    applyProjection(root, projectColorPickerInitialPart(serverState, { part: "root" }));
    const projectedRole = document.querySelector<HTMLInputElement>("#projected-role")!;
    applyProjection(
      projectedRole,
      projectColorPickerInitialPart(serverState, {
        part: "areaInput",
        axis: "x",
      }),
    );
    for (const [id, value, disabled] of [
      ["root-disabled", "#ff0000", false],
      ["self-disabled", "#00ff00", true],
    ] as const) {
      applyProjection(
        document.querySelector<HTMLElement>(`#${id}`)!,
        projectColorPickerInitialPart(serverState, { part: "swatch", value, disabled }),
      );
    }

    const picker = createColorPicker(root, {
      defaultValue: "#ff0000",
      disabled: true,
      getAreaRoleDescription: () => "Client surface",
    });
    expect(projectedRole.getAttribute("aria-roledescription")).toBe("Client surface");
    expect(document.querySelector("#authored-role")!.getAttribute("aria-roledescription")).toBe(
      "Authored surface",
    );
    expect(root.querySelector(`[${COLOR_PICKER_INITIAL_OWNERSHIP_ATTRIBUTE}]`)).toBeNull();

    picker.setDisabled(false);
    expect(document.querySelector<HTMLButtonElement>("#root-disabled")!.disabled).toBe(false);
    expect(document.querySelector<HTMLButtonElement>("#self-disabled")!.disabled).toBe(true);
    expect(document.querySelector<HTMLButtonElement>("#authored-disabled")!.disabled).toBe(true);
    picker.setOptions({ getAreaRoleDescription: () => "Updated client surface" });
    expect(projectedRole.getAttribute("aria-roledescription")).toBe("Updated client surface");
    expect(document.querySelector("#authored-role")!.getAttribute("aria-roledescription")).toBe(
      "Authored surface",
    );
  });

  it("converges minimal roots with SSR roots and updates every safe setter-backed fact", () => {
    document.body.innerHTML = markup();
    const root = document.querySelector<HTMLElement>("[data-sw-color-picker]")!;
    root.setAttribute("data-invalid", "");
    const picker = createColorPicker(root, {
      defaultValue: "#336699",
      allowEmpty: true,
      alpha: false,
      name: "accent",
      form: "first-form",
      locale: "en-US",
      dir: "rtl",
      required: true,
    });
    expect(root).toMatchObject({});
    expect(root.getAttribute("role")).toBe("group");
    expect(root.getAttribute("data-name")).toBe("accent");
    expect(root.getAttribute("data-form")).toBe("first-form");
    expect(root.getAttribute("data-locale")).toBe("en-US");
    expect(root.getAttribute("data-allow-empty")).toBe("");
    expect(root.getAttribute("data-invalid")).toBe("");

    picker.setName("updated");
    picker.setOptions({
      allowEmpty: false,
      alpha: true,
      form: "second-form",
      locale: "fr-FR",
      dir: "ltr",
      required: false,
    });
    expect(root.getAttribute("data-name")).toBe("updated");
    expect(root.getAttribute("data-form")).toBe("second-form");
    expect(root.getAttribute("data-locale")).toBe("fr-FR");
    expect(root.getAttribute("dir")).toBe("ltr");
    expect(root.hasAttribute("data-allow-empty")).toBe(false);
    expect(root.getAttribute("data-alpha")).toBe("");
    expect(root.hasAttribute("data-required")).toBe(false);
    expect(root.getAttribute("data-invalid")).toBe("");
  });
});

function projectionTargets(
  root: HTMLElement,
  state: ReturnType<typeof createColorPickerInitialState>,
): Array<[HTMLElement, ColorPickerInitialPartProjection]> {
  return [
    [root, projectColorPickerInitialPart(state, { part: "root" })],
    [
      root.querySelector('[data-sw-color-picker-area-input][data-axis="x"]')!,
      projectColorPickerInitialPart(state, {
        part: "areaInput",
        axis: "x",
        xChannel: "hue",
        yChannel: "alpha",
        xStep: 7,
        yStep: 5,
        ariaLabelledBy: "color-label",
      }),
    ],
    [
      root.querySelector("[data-sw-color-picker-channel-input]")!,
      projectColorPickerInitialPart(state, {
        part: "channelSliderInput",
        channel: "hue",
        orientation: "vertical",
        step: 7,
      }),
    ],
    [
      root.querySelector("[data-sw-color-picker-swatch]")!,
      projectColorPickerInitialPart(state, {
        part: "swatch",
        value: "#33669980",
        disabled: true,
      }),
    ],
    [
      root.querySelector("[data-sw-color-picker-hidden-input]")!,
      projectColorPickerInitialPart(state, { part: "hiddenInput" }),
    ],
  ];
}

function expectElementProjection(
  element: HTMLElement,
  projection: ColorPickerInitialPartProjection,
  options: { ignoreDefaultValue?: boolean } = {},
) {
  expect(semanticFingerprint(element, projection, options)).toEqual(
    projectionFingerprint(projection, options),
  );
}

function semanticFingerprint(
  element: HTMLElement,
  projection: ColorPickerInitialPartProjection,
  options: { ignoreDefaultValue?: boolean } = {},
) {
  return {
    attributes: Object.fromEntries(
      Object.keys(projection.attributes)
        .filter((name) => name !== COLOR_PICKER_INITIAL_OWNERSHIP_ATTRIBUTE)
        .map((name) => [name, element.getAttribute(name)]),
    ),
    properties: Object.fromEntries(
      Object.keys(projection.properties)
        .filter((name) => !(options.ignoreDefaultValue && name === "defaultValue"))
        .map((name) => [name, (element as unknown as Record<string, unknown>)[name]]),
    ),
    styles: Object.fromEntries(
      Object.keys(projection.styles).map((name) => [name, element.style.getPropertyValue(name)]),
    ),
  };
}

function projectionFingerprint(
  projection: ColorPickerInitialPartProjection,
  options: { ignoreDefaultValue?: boolean } = {},
) {
  const element = document.createElement("div");
  applyProjection(element, projection);
  return semanticFingerprint(element, projection, options);
}

function applyProjection(element: HTMLElement, projection: ColorPickerInitialPartProjection) {
  for (const [name, value] of Object.entries(projection.attributes)) {
    if (value === undefined || value === false) element.removeAttribute(name);
    else element.setAttribute(name, value === true ? "" : String(value));
  }
  for (const [name, value] of Object.entries(projection.styles)) {
    if (value === undefined) element.style.removeProperty(name);
    else element.style.setProperty(name, value);
  }
  for (const [name, value] of Object.entries(projection.properties)) {
    (element as unknown as Record<string, unknown>)[name] = value;
  }
}

function markup() {
  return `<div data-sw-color-picker>
    <span id="color-label" data-sw-color-picker-label>Color</span>
    <input data-sw-color-picker-value-input>
    <div data-sw-color-picker-area data-x-channel="hue" data-y-channel="alpha">
      <span data-sw-color-picker-area-thumb></span>
      <input data-sw-color-picker-area-input data-axis="x" data-step="7" aria-labelledby="color-label">
      <input data-sw-color-picker-area-input data-axis="y" data-step="5" aria-labelledby="color-label">
    </div>
    <div data-sw-color-picker-channel-slider data-channel="hue" data-orientation="vertical">
      <span data-sw-color-picker-channel-slider-thumb></span>
      <input data-sw-color-picker-channel-input data-step="7">
    </div>
    <input data-sw-color-picker-channel-field data-channel="alpha">
    <select data-sw-color-picker-format-select><option value="hex">hex</option><option value="rgb">rgb</option><option value="hsl">hsl</option><option value="hsb">hsb</option></select>
    <button type="button" data-sw-color-picker-swatch data-value="#33669980" data-disabled>Color</button>
    <button type="button" data-sw-color-picker-eye-dropper>Pick</button>
    <button type="button" data-sw-color-picker-clear>Clear</button>
    <input data-sw-color-picker-hidden-input>
  </div>`;
}
