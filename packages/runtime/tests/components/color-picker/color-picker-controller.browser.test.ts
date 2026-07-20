import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createColorPicker,
  parseColor,
  type ColorPickerValueChangeDetails,
  type ColorPickerValueCommitDetails,
} from "../../../src/components/color-picker";
import { createPopover } from "../../../src/components/popover/popover";
import { createSelect } from "../../../src/components/select/select";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("Color Picker controller", () => {
  it("restores a cleared required value from the retained editing color", () => {
    const form = document.createElement("form");
    document.body.append(form);
    const root = render({ channels: ["hue"] });
    root.insertAdjacentHTML(
      "beforeend",
      '<input data-sw-color-picker-value-input><span data-sw-color-picker-value-text></span><span data-sw-color-picker-value-swatch></span><button type="button" data-sw-color-picker-clear>Clear</button>',
    );
    form.append(root);
    const changed = vi.fn();
    const committed = vi.fn();
    root.addEventListener("starwind:value-change", changed);
    root.addEventListener("starwind:value-committed", committed);
    const picker = createColorPicker(root, {
      defaultValue: "#ff0000",
      allowEmpty: true,
      required: true,
      name: "accent",
    });

    root.querySelector<HTMLButtonElement>("[data-sw-color-picker-clear]")!.click();

    expect(picker.getValue()).toBeNull();
    expect(hidden(root).value).toBe("");
    expect(new FormData(form).get("accent")).toBe("");
    expect(hidden(root).validity.valueMissing).toBe(true);
    expect(root.querySelector<HTMLInputElement>("[data-sw-color-picker-value-input]")!.value).toBe(
      "",
    );
    expect(root.querySelector<HTMLElement>("[data-sw-color-picker-value-text]")!.textContent).toBe(
      "",
    );
    expect(channel(root, "hue")).toHaveAttribute("aria-valuenow", "0");

    channel(root, "hue").dispatchEvent(key("ArrowRight"));

    expect(picker.getValue()!.hsb.hue).toBe(1);
    expect(changed.mock.calls.at(-1)?.[0].detail).toMatchObject({
      previousValue: null,
      reason: "keyboard",
    });
    expect(committed).toHaveBeenCalledTimes(2);
    expect(hidden(root).validity.valueMissing).toBe(false);
    expect(new FormData(form).get("accent")).not.toBe("");
  });

  it.each([
    {
      name: "area pointer",
      reason: "area-drag",
      interact(root: HTMLElement) {
        const area = getArea(root);
        rect(area);
        area.dispatchEvent(pointer("pointerdown", { clientX: 80, clientY: 20, buttons: 1 }));
        document.dispatchEvent(pointer("pointerup", { clientX: 80, clientY: 20, buttons: 0 }));
      },
    },
    {
      name: "slider pointer",
      reason: "channel-drag",
      interact(root: HTMLElement) {
        const slider = getSlider(root, "hue");
        rect(slider);
        slider.dispatchEvent(pointer("pointerdown", { clientX: 50, clientY: 50, buttons: 1 }));
        document.dispatchEvent(pointer("pointerup", { clientX: 50, clientY: 50, buttons: 0 }));
      },
    },
    {
      name: "native range input",
      reason: "channel-input",
      interact(root: HTMLElement) {
        const hue = channel(root, "hue");
        hue.value = "120";
        hue.dispatchEvent(new Event("input", { bubbles: true }));
        hue.dispatchEvent(new Event("change", { bubbles: true }));
      },
    },
  ])("restores a cleared value through $name", ({ reason, interact }) => {
    const root = render({ channels: ["hue"] });
    const changed = vi.fn();
    const committed = vi.fn();
    root.addEventListener("starwind:value-change", changed);
    root.addEventListener("starwind:value-committed", committed);
    const picker = createColorPicker(root, {
      defaultValue: "hsb(210, 40%, 60%)",
      allowEmpty: true,
    });
    const retainedAreaX = input(root, "x").value;
    const retainedAreaY = input(root, "y").value;
    const retainedHue = channel(root, "hue").value;

    picker.setValue(null, { emit: false });

    expect(input(root, "x").value).toBe(retainedAreaX);
    expect(input(root, "y").value).toBe(retainedAreaY);
    expect(channel(root, "hue").value).toBe(retainedHue);
    interact(root);

    expect(picker.getValue()).not.toBeNull();
    expect(changed.mock.calls[0]?.[0].detail).toMatchObject({ previousValue: null, reason });
    expect(committed).toHaveBeenCalledOnce();
  });

  it("restores the retained baseline after a canceled cleared drag", () => {
    const root = render({ channels: ["hue"] });
    const area = getArea(root);
    rect(area);
    const committed = vi.fn();
    root.addEventListener("starwind:value-committed", committed);
    const picker = createColorPicker(root, {
      defaultValue: "hsb(210, 40%, 60%)",
      allowEmpty: true,
    });
    picker.setValue(null, { emit: false });
    const retainedX = input(root, "x").value;
    const retainedY = input(root, "y").value;

    area.dispatchEvent(pointer("pointerdown", { clientX: 80, clientY: 20, buttons: 1 }));
    document.dispatchEvent(pointer("pointercancel", { clientX: 80, clientY: 20, buttons: 0 }));

    expect(picker.getValue()).toBeNull();
    expect(input(root, "x").value).toBe(retainedX);
    expect(input(root, "y").value).toBe(retainedY);
    expect(committed).not.toHaveBeenCalled();
  });

  it("normalizes a retained cleared alpha baseline when alpha is disabled", () => {
    const root = render({ channels: ["hue"] });
    const picker = createColorPicker(root, {
      defaultValue: "rgba(255, 0, 0, 0.25)",
      allowEmpty: true,
    });
    picker.setValue(null, { emit: false });

    picker.setOptions({ alpha: false });
    channel(root, "hue").dispatchEvent(key("ArrowRight"));

    expect(picker.getValue()!.alpha).toBe(1);
    expect(picker.getValue()!.hsb.hue).toBe(1);
  });

  it("rejects cleared baseline edits while disabled or read-only", () => {
    const root = render({ channels: ["hue"] });
    const changed = vi.fn();
    const picker = createColorPicker(root, { defaultValue: "#ff0000", allowEmpty: true });
    picker.setValue(null, { emit: false });
    root.addEventListener("starwind:value-change", changed);

    picker.setDisabled(true);
    channel(root, "hue").dispatchEvent(key("ArrowRight"));
    picker.setDisabled(false);
    picker.setReadOnly(true);
    channel(root, "hue").dispatchEvent(key("ArrowRight"));

    expect(picker.getValue()).toBeNull();
    expect(changed).not.toHaveBeenCalled();
  });

  it("hydrates alpha from initial projection ownership without changing raw DOM defaults", () => {
    const projectedWithoutAlpha = render();
    projectedWithoutAlpha.setAttribute("data-sw-color-picker-initial-owned", "a:data-alpha");
    const projectedWithoutAlphaPicker = createColorPicker(projectedWithoutAlpha, {
      defaultValue: "#ff000080",
    });

    expect(projectedWithoutAlpha).not.toHaveAttribute("data-alpha");
    expect(projectedWithoutAlphaPicker.getValueAsString()).toBe("#ff0000");
    projectedWithoutAlphaPicker.refresh({ preserveState: true });
    expect(projectedWithoutAlpha).not.toHaveAttribute("data-alpha");
    expect(projectedWithoutAlphaPicker.getValueAsString()).toBe("#ff0000");

    const projectedWithAlpha = render();
    projectedWithAlpha.setAttribute("data-alpha", "");
    projectedWithAlpha.setAttribute("data-sw-color-picker-initial-owned", "a:data-alpha");
    const projectedWithAlphaPicker = createColorPicker(projectedWithAlpha, {
      defaultValue: "#ff000080",
    });

    expect(projectedWithAlpha).toHaveAttribute("data-alpha", "");
    expect(projectedWithAlphaPicker.getValueAsString()).toBe("#ff000080");

    const rawWithoutAlpha = render();
    const rawWithoutAlphaPicker = createColorPicker(rawWithoutAlpha, {
      defaultValue: "#ff000080",
    });

    expect(rawWithoutAlpha).toHaveAttribute("data-alpha", "");
    expect(rawWithoutAlphaPicker.getValueAsString()).toBe("#ff000080");
  });

  it("keeps Popover-portaled controls in the owning Color Picker and nested floating root", () => {
    const host = document.createElement("div");
    host.innerHTML = `<div data-dialog-floating-host><div data-floating-root data-slot="dialog-floating-root"><div data-sw-popover><div data-sw-color-picker data-floating-root><button data-sw-popover-trigger>Open</button><div data-sw-popover-portal><div data-sw-popover-popup><span data-sw-color-picker-label>Color</span><div data-sw-color-picker-area><span data-sw-color-picker-area-thumb></span><input data-sw-color-picker-area-input data-axis="x"><input data-sw-color-picker-area-input data-axis="y"></div>${slider("hue")}<input data-sw-color-picker-hidden-input></div></div></div></div></div></div>`;
    document.body.append(host);
    const popoverRoot = host.querySelector<HTMLElement>("[data-sw-popover]")!;
    const colorRoot = host.querySelector<HTMLElement>("[data-sw-color-picker]")!;
    const popup = host.querySelector<HTMLElement>("[data-sw-popover-popup]")!;
    const picker = createColorPicker(colorRoot, { defaultValue: "hsl(0, 100%, 50%)" });
    const popover = createPopover(popoverRoot);

    host.querySelector<HTMLButtonElement>("[data-sw-popover-trigger]")!.click();
    expect(popover.getOpen()).toBe(true);
    expect(popup.closest("[data-sw-color-picker]")).toBe(colorRoot);
    expect(popup.closest('[data-slot="dialog-floating-root"]')).not.toBeNull();

    const hue = channel(colorRoot, "hue");
    hue.dispatchEvent(key("ArrowRight"));
    expect(picker.getValue()!.hsl.hue).toBe(1);

    const area = getArea(colorRoot);
    rect(area);
    area.dispatchEvent(pointer("pointerdown", { clientX: 50, clientY: 50, buttons: 1 }));
    document.dispatchEvent(pointer("pointerup", { clientX: 50, clientY: 50, buttons: 0 }));
    expect(picker.getValue()!.hsb.saturation).toBeCloseTo(50);
  });

  it("keeps a composite format Select inside the Color Picker floating root and parent Popover", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<div data-floating-root><div data-sw-popover><div data-sw-color-picker data-floating-root>
      <button type="button" data-sw-popover-trigger>Open color picker</button>
      <div data-sw-popover-portal><div data-sw-popover-popup>
        <div data-sw-color-picker-format-control><div data-sw-select>
          <button type="button" data-sw-select-trigger><span data-sw-select-value></span></button>
          <input type="hidden" data-sw-select-input>
          <div data-sw-select-positioner><div data-sw-select-popup hidden><div data-sw-select-list>
            <div data-sw-select-item data-value="hex"><span data-sw-select-item-text>HEX</span></div>
            <div data-sw-select-item data-value="rgb"><span data-sw-select-item-text>RGB</span></div>
          </div></div></div>
        </div></div>
        <input data-sw-color-picker-hidden-input>
      </div></div>
    </div></div></div>`;
    document.body.append(host);
    const popoverRoot = host.querySelector<HTMLElement>("[data-sw-popover]")!;
    const colorRoot = host.querySelector<HTMLElement>("[data-sw-color-picker]")!;
    const selectRoot = host.querySelector<HTMLElement>("[data-sw-select]")!;
    const selectTrigger = host.querySelector<HTMLElement>("[data-sw-select-trigger]")!;
    const selectPopup = host.querySelector<HTMLElement>("[data-sw-select-popup]")!;
    const rgbItem = host.querySelector<HTMLElement>('[data-sw-select-item][data-value="rgb"]')!;
    const picker = createColorPicker(colorRoot, { format: "hex" });
    const popover = createPopover(popoverRoot);
    const select = createSelect(selectRoot);

    host.querySelector<HTMLButtonElement>("[data-sw-popover-trigger]")!.click();
    select.setOpen(true, { emit: false });
    expect(selectPopup.closest("[data-floating-root]")).toBe(colorRoot);
    rgbItem.click();
    await Promise.resolve();
    expect(picker.getFormat()).toBe("rgb");
    expect(popover.getOpen()).toBe(true);

    select.setOpen(true, { emit: false });
    selectPopup.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    expect(select.getOpen()).toBe(false);
    expect(popover.getOpen()).toBe(true);
    expect(document.activeElement).toBe(selectTrigger);
  });

  it("synchronizes color state while exposing valid CSS and accessible range output", () => {
    const root = render({ channels: ["hue", "alpha", "saturation", "red"] });
    const picker = createColorPicker(root, {
      defaultValue: "hsb(180, 25%, 80%)",
      format: "hsb",
    });

    expect(picker.getValueAsString()).toBe("hsb(180, 25%, 80%)");
    expect(root.style.getPropertyValue("--sw-color-picker-color")).toBe("#99cccc");
    expect(input(root, "x").value).toBe("25");
    expect(input(root, "y").value).toBe("80");
    expect(input(root, "x").getAttribute("aria-roledescription")).toBe("2D Slider");
    expect(input(root, "y").getAttribute("aria-roledescription")).toBe("2D Slider");
    expect(input(root, "x").getAttribute("aria-labelledby")).toBe(label(root).id);
    expect(input(root, "y").getAttribute("aria-labelledby")).toBe(label(root).id);
    expect(input(root, "x").getAttribute("aria-valuetext")).toMatch(
      /^Saturation 25%, Brightness 80%$/,
    );
    expect(input(root, "y").getAttribute("aria-valuetext")).toMatch(
      /^Brightness 80%, Saturation 25%$/,
    );
    expect(channel(root, "hue").getAttribute("aria-valuetext")).toBe("Hue 180°");
    expect(channel(root, "alpha").getAttribute("aria-valuetext")).toBe("Alpha 100%");
    expect(channel(root, "saturation").getAttribute("aria-valuetext")).toBe("Saturation 25%");
    expect(channel(root, "red").getAttribute("aria-valuetext")).toBe("Red 153");
    expect(channel(root, "hue").getAttribute("aria-description")).toContain("hsb(180, 25%, 80%)");
    expect(channel(root, "hue").getAttribute("aria-description")).toContain("Hue 180°");
    expect(root.style.getPropertyValue("--sw-color-picker-saturation")).toBe("25%");

    picker.setValue("#ff000080", { emit: false });

    expect(channel(root, "hue").value).toBe("0");
    expect(channel(root, "alpha").value).toBe("50");
    expect(root.style.getPropertyValue("--sw-color-picker-color")).toBe("#ff000080");
    expect(hidden(root).value).toBe("hsba(0, 100%, 100%, 0.502)");
  });

  it("updates area and channel thumb colors without changing channel geometry", () => {
    const channels = [
      "hue",
      "saturation",
      "brightness",
      "lightness",
      "red",
      "green",
      "blue",
      "alpha",
    ];
    const root = render({ channels });
    const picker = createColorPicker(root, { defaultValue: "#33669980", allowEmpty: true });

    expect(areaThumb(root).style.getPropertyValue("--sw-color-picker-area-thumb-color")).toBe(
      "#336699",
    );
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
    for (const [channelName, color] of Object.entries(expected)) {
      expect(
        sliderThumb(root, channelName).style.getPropertyValue(
          "--sw-color-picker-channel-thumb-color",
        ),
      ).toBe(color);
    }
    const huePosition = getSlider(root, "hue").style.getPropertyValue(
      "--sw-color-picker-channel-position",
    );

    picker.setValue("#ff000040", { emit: false });
    expect(areaThumb(root).style.getPropertyValue("--sw-color-picker-area-thumb-color")).toBe(
      "#ff0000",
    );
    expect(
      sliderThumb(root, "hue").style.getPropertyValue("--sw-color-picker-channel-thumb-color"),
    ).toBe("#ff0000");
    expect(
      sliderThumb(root, "alpha").style.getPropertyValue("--sw-color-picker-channel-thumb-color"),
    ).toBe("#ff000040");
    expect(
      getSlider(root, "hue").style.getPropertyValue("--sw-color-picker-channel-position"),
    ).not.toBe(huePosition);

    getSlider(root, "alpha").setAttribute("data-orientation", "vertical");
    picker.refresh({ preserveState: true });
    expect(
      sliderThumb(root, "alpha").style.getPropertyValue("--sw-color-picker-channel-thumb-color"),
    ).toBe("#ff000040");
    expect(channel(root, "alpha")).toHaveAttribute("aria-orientation", "vertical");

    picker.setValue(null, { emit: false });
    expect(areaThumb(root).style.getPropertyValue("--sw-color-picker-area-thumb-color")).toBe(
      "#ff0000",
    );
    expect(
      sliderThumb(root, "alpha").style.getPropertyValue("--sw-color-picker-channel-thumb-color"),
    ).toBe("#ff000040");
  });

  it("uses caller-provided accessible text and color descriptions", () => {
    const root = render();
    createColorPicker(root, {
      defaultValue: "#ff0000",
      getAriaValueText: (name, value) => `${name}:${value}`,
      getColorDescription: (color) => `chosen ${color?.toString("hex")}`,
    });

    expect(input(root, "x").getAttribute("aria-valuetext")).toBe("saturation:100");
    expect(channel(root, "hue").getAttribute("aria-valuetext")).toBe("hue:0");
    expect(channel(root, "hue").getAttribute("aria-description")).toBe("chosen #ff0000");
  });

  it("returns duplicate instances and makes a destroyed controller fully inert", () => {
    const root = render();
    const first = createColorPicker(root);
    expect(createColorPicker(root)).toBe(first);
    first.destroy();
    const second = createColorPicker(root);
    expect(second).not.toBe(first);
    const snapshot = root.outerHTML;

    first.setValue("#fff");
    first.setFormat("rgb");
    first.setDisabled(true);
    first.setReadOnly(true);
    first.setName("stale");
    first.setOptions({ alpha: false, dir: "rtl", locale: "de-DE" });
    first.refresh();
    first.subscribe("valueChange", vi.fn());

    expect(root.outerHTML).toBe(snapshot);
    expect(second.getValueAsString()).toBe("#000000");
  });

  it("refreshes newly rendered controls once and cancels pending native input", () => {
    const root = render({ channels: [] });
    const picker = createColorPicker(root, { defaultValue: "#ff0000" });
    root.insertAdjacentHTML("beforeend", slider("hue"));
    picker.refresh();
    picker.refresh();
    const commits = vi.fn();
    root.addEventListener("starwind:value-committed", commits);

    channel(root, "hue").value = "120";
    channel(root, "hue").dispatchEvent(new Event("input", { bubbles: true }));
    expect(picker.getValue()!.hsb.hue).toBeCloseTo(120);

    picker.refresh();
    expect(picker.getValue()!.hsb.hue).toBe(0);
    channel(root, "hue").dispatchEvent(new Event("change", { bubbles: true }));
    expect(commits).not.toHaveBeenCalled();

    channel(root, "hue").dispatchEvent(key("ArrowRight"));
    expect(picker.getValue()!.hsb.hue).toBe(1);
    expect(commits).toHaveBeenCalledOnce();
  });

  it("keeps exactly one native session and isolates interleaved axis commit details", () => {
    const root = render();
    const picker = createColorPicker(root, { defaultValue: "hsb(0, 0%, 100%)" });
    const commits: ColorPickerValueCommitDetails[] = [];
    root.addEventListener("starwind:value-committed", (event) => {
      commits.push((event as CustomEvent<ColorPickerValueCommitDetails>).detail);
    });
    const x = input(root, "x");
    const y = input(root, "y");

    x.value = "50";
    x.dispatchEvent(new Event("input", { bubbles: true }));
    expect(picker.getValue()!.hsb.saturation).toBeCloseTo(50);

    y.value = "50";
    y.dispatchEvent(new Event("input", { bubbles: true }));
    expect(picker.getValue()!.hsb.saturation).toBe(0);
    expect(picker.getValue()!.hsb.brightness).toBeCloseTo(50);

    x.dispatchEvent(new Event("change", { bubbles: true }));
    expect(commits).toHaveLength(0);
    y.dispatchEvent(new Event("change", { bubbles: true }));

    expect(commits).toHaveLength(1);
    expect(commits[0]!.value!.hsb.saturation).toBe(0);
    expect(commits[0]!.value!.hsb.brightness).toBeCloseTo(50);
    expect(commits[0]!.previousValue!.hsb.brightness).toBe(100);
    expect(commits[0]!.trigger).toBe(y);
  });

  it("keeps the area x-coordinate at black, clamps captured movement, and restores it upward", () => {
    const root = render();
    const area = getArea(root);
    rect(area);
    const picker = createColorPicker(root, {
      defaultValue: "hsb(180, 25%, 80%)",
      format: "hsb",
    });

    area.dispatchEvent(pointer("pointerdown", { clientX: 100, clientY: 100, buttons: 1 }));
    expect(picker.getValue()!.hsb).toMatchObject({ saturation: 100, brightness: 0 });
    expect(picker.getValueAsString()).toBe("hsb(180, 100%, 0%)");
    expect(hidden(root).value).toBe("hsb(180, 100%, 0%)");
    expect(areaThumb(root).style.getPropertyValue("--sw-color-picker-area-x")).toBe("100%");
    expect(areaThumb(root).style.getPropertyValue("--sw-color-picker-area-y")).toBe("100%");

    root.ownerDocument.dispatchEvent(
      pointer("pointermove", { clientX: 140, clientY: 140, buttons: 1 }),
    );
    expect(picker.getValue()!.hsb).toMatchObject({ saturation: 100, brightness: 0 });

    root.ownerDocument.dispatchEvent(
      pointer("pointermove", { clientX: 100, clientY: 50, buttons: 1 }),
    );
    expect(picker.getValue()!.hsb).toMatchObject({ saturation: 100, brightness: 50 });
    root.ownerDocument.dispatchEvent(
      pointer("pointerup", { clientX: 100, clientY: 50, buttons: 0 }),
    );
  });

  it("retains coordinateful black when alpha capability normalizes through RGB", () => {
    const root = render();
    const black = parseColor("hsba(210, 65%, 70%, .4)")!.withChannels("hsb", {
      brightness: 0,
    });
    const picker = createColorPicker(root, {
      defaultValue: black,
      format: "hsb",
    });

    expect(areaThumb(root).style.getPropertyValue("--sw-color-picker-area-x")).toBe("65%");
    picker.setOptions({ alpha: false });
    expect(picker.getValue()!.hsb.saturation).toBeCloseTo(65, 10);
    expect(picker.getValueAsString()).toBe("hsb(210, 65%, 0%)");
    expect(hidden(root).value).toBe("hsb(210, 65%, 0%)");
    expect(areaThumb(root).style.getPropertyValue("--sw-color-picker-area-x")).toBe("65%");

    picker.setValue(picker.getValue()!.withChannels("hsb", { brightness: 50 }), { emit: false });
    expect(picker.getValue()!.hsb.saturation).toBeCloseTo(65, 10);
  });

  it("commits the last accepted controlled pointer candidate after a canceled proposal", () => {
    const root = render();
    const area = getArea(root);
    rect(area);
    const picker = createColorPicker(root, { value: "hsb(0, 0%, 100%)" });
    const commits: ColorPickerValueCommitDetails[] = [];
    root.addEventListener("starwind:value-committed", (event) => {
      commits.push((event as CustomEvent<ColorPickerValueCommitDetails>).detail);
    });

    area.dispatchEvent(pointer("pointerdown", { clientX: 20, clientY: 0, buttons: 1 }));
    root.ownerDocument.dispatchEvent(
      pointer("pointermove", { clientX: 0, clientY: 0, buttons: 1 }),
    );
    root.ownerDocument.dispatchEvent(pointer("pointerup", { clientX: 0, clientY: 0, buttons: 0 }));

    expect(commits).toHaveLength(0);
    expect(picker.getValue()!.hsb.saturation).toBe(0);

    root.addEventListener("starwind:value-change", (event) => {
      const detail = (event as CustomEvent<{ value: { hsb: { saturation: number } } }>).detail;
      if (detail.value.hsb.saturation === 80) event.preventDefault();
    });
    area.dispatchEvent(pointer("pointerdown", { clientX: 20, clientY: 0, buttons: 1 }));
    root.ownerDocument.dispatchEvent(
      pointer("pointermove", { clientX: 80, clientY: 0, buttons: 1 }),
    );
    root.ownerDocument.dispatchEvent(pointer("pointerup", { clientX: 80, clientY: 0, buttons: 0 }));

    expect(commits).toHaveLength(1);
    expect(commits[0]!.value!.hsb.saturation).toBeCloseTo(20);
    expect(commits[0]!.previousValue!.hsb.saturation).toBe(0);
    expect(picker.getValue()!.hsb.saturation).toBe(0);

    root.addEventListener("starwind:value-change", (event) => {
      const detail = (event as CustomEvent<{ value: { hsb: { saturation: number } } }>).detail;
      if (detail.value.hsb.saturation === 40) event.preventDefault();
    });
    area.dispatchEvent(pointer("pointerdown", { clientX: 40, clientY: 0, buttons: 1 }));
    root.ownerDocument.dispatchEvent(pointer("pointerup", { clientX: 40, clientY: 0, buttons: 0 }));
    expect(commits).toHaveLength(1);

    area.dispatchEvent(pointer("pointerdown", { clientX: 30, clientY: 0, buttons: 1 }));
    root.ownerDocument.dispatchEvent(
      pointer("pointercancel", { clientX: 30, clientY: 0, buttons: 0 }),
    );
    expect(commits).toHaveLength(1);
  });

  it("tracks the final controlled native proposal and commits its own value", () => {
    const root = render();
    const hue = channel(root, "hue");
    const picker = createColorPicker(root, { value: "#ff0000" });
    const commits: ColorPickerValueCommitDetails[] = [];
    root.addEventListener("starwind:value-committed", (event) => {
      commits.push((event as CustomEvent<ColorPickerValueCommitDetails>).detail);
    });

    hue.value = "120";
    hue.dispatchEvent(new Event("input", { bubbles: true }));
    hue.value = "0";
    hue.dispatchEvent(new Event("input", { bubbles: true }));
    hue.dispatchEvent(new Event("change", { bubbles: true }));
    expect(commits).toHaveLength(0);

    hue.value = "120";
    hue.dispatchEvent(new Event("input", { bubbles: true }));
    hue.dispatchEvent(new Event("change", { bubbles: true }));
    expect(commits).toHaveLength(1);
    expect(commits[0]!.value!.hsb.hue).toBeCloseTo(120);
    expect(commits[0]!.previousValue!.hsb.hue).toBe(0);
    expect(commits[0]!.trigger).toBe(hue);
    expect(picker.getValue()!.hsb.hue).toBe(0);

    root.addEventListener("starwind:value-change", (event) => {
      const detail = (event as CustomEvent<{ value: { hsb: { hue: number } } }>).detail;
      if (detail.value.hsb.hue === 240) event.preventDefault();
    });
    hue.value = "120";
    hue.dispatchEvent(new Event("input", { bubbles: true }));
    hue.value = "240";
    hue.dispatchEvent(new Event("input", { bubbles: true }));
    hue.dispatchEvent(new Event("change", { bubbles: true }));
    expect(commits).toHaveLength(2);
    expect(commits[1]!.value!.hsb.hue).toBeCloseTo(120);

    root.addEventListener("starwind:value-change", (event) => {
      const detail = (event as CustomEvent<{ value: { hsb: { hue: number } } }>).detail;
      if (detail.value.hsb.hue === 300) event.preventDefault();
    });
    hue.value = "300";
    hue.dispatchEvent(new Event("input", { bubbles: true }));
    hue.dispatchEvent(new Event("change", { bubbles: true }));
    expect(commits).toHaveLength(2);
  });

  it("reconciles matching and divergent reentrant pointer synchronization", () => {
    const matchingRoot = render();
    const matchingArea = getArea(matchingRoot);
    rect(matchingArea);
    const matchingCommits: ColorPickerValueCommitDetails[] = [];
    matchingRoot.addEventListener("starwind:value-committed", (event) => {
      matchingCommits.push((event as CustomEvent<ColorPickerValueCommitDetails>).detail);
    });
    let matchingPicker!: ReturnType<typeof createColorPicker>;
    matchingPicker = createColorPicker(matchingRoot, {
      value: "hsb(0, 0%, 100%)",
      onValueChange: (value) => matchingPicker.setValue(value, { emit: false }),
    });

    matchingArea.dispatchEvent(pointer("pointerdown", { clientX: 20, clientY: 0, buttons: 1 }));
    matchingRoot.ownerDocument.dispatchEvent(
      pointer("pointermove", { clientX: 60, clientY: 0, buttons: 1 }),
    );
    matchingRoot.ownerDocument.dispatchEvent(
      pointer("pointerup", { clientX: 60, clientY: 0, buttons: 0 }),
    );

    expect(matchingPicker.getValue()!.hsb.saturation).toBeCloseTo(60);
    expect(matchingCommits).toHaveLength(1);
    expect(matchingCommits[0]!.value!.hsb.saturation).toBeCloseTo(60);
    expect(matchingCommits[0]!.previousValue!.hsb.saturation).toBe(0);

    const divergentRoot = render();
    const divergentArea = getArea(divergentRoot);
    rect(divergentArea);
    const divergentCommits = vi.fn();
    divergentRoot.addEventListener("starwind:value-committed", divergentCommits);
    let rebased = false;
    let divergentPicker!: ReturnType<typeof createColorPicker>;
    divergentPicker = createColorPicker(divergentRoot, {
      defaultValue: "hsb(0, 0%, 100%)",
      onValueChange: () => {
        if (rebased) return;
        rebased = true;
        divergentPicker.setValue("#0000ff", { emit: false });
      },
    });

    divergentArea.dispatchEvent(pointer("pointerdown", { clientX: 50, clientY: 0, buttons: 1 }));
    divergentRoot.ownerDocument.dispatchEvent(
      pointer("pointerup", { clientX: 50, clientY: 0, buttons: 0 }),
    );

    expect(divergentPicker.getValueAsString()).toBe("#0000ff");
    expect(divergentCommits).not.toHaveBeenCalled();
  });

  it("reconciles matching and divergent reentrant native synchronization", () => {
    const matchingRoot = render();
    const matchingHue = channel(matchingRoot, "hue");
    const matchingCommits: ColorPickerValueCommitDetails[] = [];
    matchingRoot.addEventListener("starwind:value-committed", (event) => {
      matchingCommits.push((event as CustomEvent<ColorPickerValueCommitDetails>).detail);
    });
    let matchingPicker!: ReturnType<typeof createColorPicker>;
    matchingPicker = createColorPicker(matchingRoot, {
      value: "#ff0000",
      onValueChange: (value) => matchingPicker.setValue(value, { emit: false }),
    });

    matchingHue.value = "120";
    matchingHue.dispatchEvent(new Event("input", { bubbles: true }));
    matchingHue.dispatchEvent(new Event("change", { bubbles: true }));

    expect(matchingPicker.getValue()!.hsb.hue).toBeCloseTo(120);
    expect(matchingCommits).toHaveLength(1);
    expect(matchingCommits[0]!.value!.hsb.hue).toBeCloseTo(120);
    expect(matchingCommits[0]!.previousValue!.hsb.hue).toBe(0);

    const divergentRoot = render();
    const divergentHue = channel(divergentRoot, "hue");
    const divergentCommits = vi.fn();
    divergentRoot.addEventListener("starwind:value-committed", divergentCommits);
    let rebased = false;
    let divergentPicker!: ReturnType<typeof createColorPicker>;
    divergentPicker = createColorPicker(divergentRoot, {
      defaultValue: "#ff0000",
      onValueChange: () => {
        if (rebased) return;
        rebased = true;
        divergentPicker.setValue("#0000ff", { emit: false });
      },
    });

    divergentHue.value = "120";
    divergentHue.dispatchEvent(new Event("input", { bubbles: true }));
    divergentHue.dispatchEvent(new Event("change", { bubbles: true }));

    expect(divergentPicker.getValueAsString()).toBe("#0000ff");
    expect(divergentCommits).not.toHaveBeenCalled();
  });

  it("setFormat cancels an active interaction without committing its preview", () => {
    const root = render();
    const area = getArea(root);
    rect(area);
    const commits = vi.fn();
    root.addEventListener("starwind:value-committed", commits);
    const picker = createColorPicker(root, { defaultValue: "hsb(0, 0%, 100%)" });

    area.dispatchEvent(pointer("pointerdown", { clientX: 50, clientY: 0, buttons: 1 }));
    expect(picker.getValue()!.hsb.saturation).toBeCloseTo(50);
    picker.setFormat("rgb");
    root.ownerDocument.dispatchEvent(pointer("pointerup", { clientX: 50, clientY: 0, buttons: 0 }));

    expect(picker.getValue()!.hsb.saturation).toBe(0);
    expect(picker.getFormat()).toBe("rgb");
    expect(commits).not.toHaveBeenCalled();
  });

  it("refresh cancels an active drag, restores state, releases capture, and rebinds", () => {
    const root = render();
    const area = getArea(root);
    rect(area);
    const release = vi.fn();
    Object.defineProperty(area, "setPointerCapture", { configurable: true, value: vi.fn() });
    Object.defineProperty(area, "releasePointerCapture", { configurable: true, value: release });
    const picker = createColorPicker(root, { defaultValue: "hsb(0, 0%, 100%)" });
    const commits = vi.fn();
    root.addEventListener("starwind:value-committed", commits);

    area.dispatchEvent(pointer("pointerdown", { clientX: 20, clientY: 50, buttons: 1 }));
    expect(picker.getValue()!.hsb.saturation).toBeCloseTo(20);
    expect(area).toHaveAttribute("data-dragging");
    expect(areaThumb(root)).toHaveAttribute("data-dragging");

    picker.refresh();

    expect(picker.getValue()!.hsb.saturation).toBe(0);
    expect(area).not.toHaveAttribute("data-dragging");
    expect(areaThumb(root)).not.toHaveAttribute("data-dragging");
    expect(release).toHaveBeenCalledWith(7);
    root.ownerDocument.dispatchEvent(
      pointer("pointerup", { clientX: 90, clientY: 10, buttons: 0 }),
    );
    expect(commits).not.toHaveBeenCalled();

    area.dispatchEvent(pointer("pointerdown", { clientX: 40, clientY: 20, buttons: 1 }));
    root.ownerDocument.dispatchEvent(
      pointer("pointerup", { clientX: 40, clientY: 20, buttons: 0 }),
    );
    expect(commits).toHaveBeenCalledOnce();
  });

  it("destroy cancels an active drag and old owner-document listeners cannot mutate replacement state", () => {
    const ownerDocument = document.implementation.createHTMLDocument("color picker");
    const root = render({ ownerDocument });
    const area = getArea(root);
    rect(area);
    const release = vi.fn();
    Object.defineProperty(area, "setPointerCapture", { configurable: true, value: vi.fn() });
    Object.defineProperty(area, "releasePointerCapture", { configurable: true, value: release });
    const first = createColorPicker(root, { defaultValue: "hsb(0, 0%, 100%)" });

    area.dispatchEvent(pointer("pointerdown", { clientX: 25, clientY: 25, buttons: 1 }));
    ownerDocument.dispatchEvent(pointer("pointermove", { clientX: 75, clientY: 25, buttons: 1 }));
    expect(first.getValue()!.hsb.saturation).toBeCloseTo(75);

    first.destroy();
    expect(first.getValue()!.hsb.saturation).toBe(0);
    expect(release).toHaveBeenCalledWith(7);
    const second = createColorPicker(root, { defaultValue: "#00ff00" });
    ownerDocument.dispatchEvent(pointer("pointermove", { clientX: 100, clientY: 0, buttons: 1 }));
    ownerDocument.dispatchEvent(pointer("pointerup", { clientX: 100, clientY: 0, buttons: 0 }));
    expect(second.getValueAsString()).toBe("#00ff00");
  });

  it("commits the proposed keyboard value for uncontrolled and controlled state", () => {
    for (const controlled of [false, true]) {
      const root = render();
      const commits: ColorPickerValueCommitDetails[] = [];
      root.addEventListener("starwind:value-committed", (event) => {
        commits.push((event as CustomEvent<ColorPickerValueCommitDetails>).detail);
      });
      const picker = createColorPicker(root, {
        ...(controlled ? { value: "#ff0000" } : { defaultValue: "#ff0000" }),
      });

      channel(root, "hue").dispatchEvent(key("ArrowRight"));

      expect(commits).toHaveLength(1);
      expect(commits[0]!.value!.hsb.hue).toBeCloseTo(1);
      expect(commits[0]!.valueAsString).toBe(commits[0]!.value!.toString("hex"));
      expect(commits[0]!.previousValue!.hsb.hue).toBe(0);
      expect(commits[0]!.previousValueAsString).toBe("#ff0000");
      expect(picker.getValue()!.hsb.hue).toBeCloseTo(controlled ? 0 : 1);
    }
  });

  it("classifies matching and divergent keyboard synchronization before committing", () => {
    const matchingRoot = render();
    const matchingCommits = vi.fn();
    matchingRoot.addEventListener("starwind:value-committed", matchingCommits);
    let matchingPicker!: ReturnType<typeof createColorPicker>;
    matchingPicker = createColorPicker(matchingRoot, {
      value: "#ff0000",
      onValueChange: (value) => matchingPicker.setValue(value, { emit: false }),
    });

    channel(matchingRoot, "hue").dispatchEvent(key("ArrowRight"));

    expect(matchingPicker.getValue()!.hsb.hue).toBeCloseTo(1);
    expect(matchingCommits).toHaveBeenCalledOnce();

    const divergentRoot = render();
    const divergentCommits = vi.fn();
    divergentRoot.addEventListener("starwind:value-committed", divergentCommits);
    let divergentPicker!: ReturnType<typeof createColorPicker>;
    divergentPicker = createColorPicker(divergentRoot, {
      defaultValue: "#ff0000",
      onValueChange: () => divergentPicker.setValue("#0000ff", { emit: false }),
    });

    channel(divergentRoot, "hue").dispatchEvent(key("ArrowRight"));

    expect(divergentPicker.getValueAsString()).toBe("#0000ff");
    expect(divergentCommits).not.toHaveBeenCalled();
  });

  it("lets reentrant imperative state supersede stale outer proposals and commits", () => {
    const syncedRoot = render();
    const syncedCommits = vi.fn();
    syncedRoot.addEventListener("starwind:value-committed", syncedCommits);
    let syncedPicker!: ReturnType<typeof createColorPicker>;
    syncedPicker = createColorPicker(syncedRoot, {
      defaultValue: "#ff0000",
      onValueChange: () => syncedPicker.setValue("#0000ff", { emit: false }),
    });

    syncedPicker.setValue("#00ff00");

    expect(syncedPicker.getValueAsString()).toBe("#0000ff");
    expect(syncedCommits).not.toHaveBeenCalled();

    const nestedRoot = render();
    const nestedCommits: ColorPickerValueCommitDetails[] = [];
    nestedRoot.addEventListener("starwind:value-committed", (event) => {
      nestedCommits.push((event as CustomEvent<ColorPickerValueCommitDetails>).detail);
    });
    let nested = false;
    let nestedPicker!: ReturnType<typeof createColorPicker>;
    nestedPicker = createColorPicker(nestedRoot, {
      defaultValue: "#ff0000",
      onValueChange: () => {
        if (nested) return;
        nested = true;
        nestedPicker.setValue("#0000ff");
      },
    });

    nestedPicker.setValue("#00ff00");

    expect(nestedPicker.getValueAsString()).toBe("#0000ff");
    expect(nestedCommits).toHaveLength(1);
    expect(nestedCommits[0]!.valueAsString).toBe("#0000ff");
    expect(nestedCommits[0]!.previousValueAsString).toBe("#ff0000");
  });

  it("wraps hue increments while keeping Home and End at distinct native boundaries", () => {
    const root = render();
    const picker = createColorPicker(root, { defaultValue: "#ff0000" });
    const hue = channel(root, "hue");

    expect(hue.min).toBe("0");
    expect(hue.max).toBe("359");
    hue.dispatchEvent(key("ArrowLeft"));
    expect(picker.getValue()!.hsb.hue).toBeCloseTo(359);
    hue.dispatchEvent(key("ArrowRight"));
    expect(picker.getValue()!.hsb.hue).toBe(0);
    hue.dispatchEvent(key("End"));
    expect(picker.getValue()!.hsb.hue).toBeCloseTo(359);
    hue.dispatchEvent(key("Home"));
    expect(picker.getValue()!.hsb.hue).toBe(0);

    picker.destroy();
    hue.setAttribute("data-step", "10");
    const custom = createColorPicker(root, { defaultValue: "#ff0000" });
    expect(hue.step).toBe("10");
    expect(hue.max).toBe("350");
    hue.dispatchEvent(key("End"));
    expect(custom.getValue()!.hsb.hue).toBeCloseTo(350);
    hue.dispatchEvent(key("ArrowRight"));
    expect(custom.getValue()!.hsb.hue).toBe(0);
  });

  it("uses a step-aligned hue domain for non-divisor pointer, native, and keyboard input", () => {
    const root = render();
    const hueInput = channel(root, "hue");
    const hueSlider = getSlider(root, "hue");
    hueInput.setAttribute("data-step", "7");
    rect(hueSlider);
    const picker = createColorPicker(root, { defaultValue: "#ff0000" });

    expect(hueInput.max).toBe("357");
    hueInput.dispatchEvent(key("End"));
    expect(picker.getValue()!.hsb.hue).toBeCloseTo(357);
    expect(hueInput.validity.stepMismatch).toBe(false);
    hueInput.dispatchEvent(key("ArrowRight"));
    expect(picker.getValue()!.hsb.hue).toBe(0);
    hueInput.dispatchEvent(key("ArrowLeft"));
    expect(picker.getValue()!.hsb.hue).toBeCloseTo(357);
    hueInput.dispatchEvent(key("PageUp"));
    expect(picker.getValue()!.hsb.hue).toBeCloseTo(63);
    expect(hueInput.validity.stepMismatch).toBe(false);
    hueInput.dispatchEvent(key("PageDown"));
    expect(picker.getValue()!.hsb.hue).toBeCloseTo(357);
    hueInput.dispatchEvent(key("ArrowRight", { altKey: true }));
    expect(picker.getValue()!.hsb.hue).toBe(0);
    hueInput.dispatchEvent(key("ArrowRight", { altKey: true }));
    expect(picker.getValue()!.hsb.hue).toBeCloseTo(7);
    expect(hueInput.validity.stepMismatch).toBe(false);
    hueInput.dispatchEvent(key("ArrowLeft", { altKey: true }));
    expect(picker.getValue()!.hsb.hue).toBe(0);
    expect(hueInput.validity.stepMismatch).toBe(false);

    hueSlider.dispatchEvent(pointer("pointerdown", { clientX: 50, clientY: 50, buttons: 1 }));
    root.ownerDocument.dispatchEvent(
      pointer("pointerup", { clientX: 50, clientY: 50, buttons: 0 }),
    );
    expect(picker.getValue()!.hsb.hue).toBeCloseTo(182);
    expect(hueInput.validity.stepMismatch).toBe(false);

    hueInput.value = "356";
    hueInput.dispatchEvent(new Event("input", { bubbles: true }));
    hueInput.dispatchEvent(new Event("change", { bubbles: true }));
    expect(picker.getValue()!.hsb.hue).toBeCloseTo(357);
    expect(hueInput.validity.stepMismatch).toBe(false);

    picker.destroy();
    hueInput.setAttribute("data-step", "0.1");
    const decimal = createColorPicker(root, { defaultValue: "#ff0000" });
    expect(hueInput.max).toBe("359.9");
    hueInput.dispatchEvent(key("End"));
    expect(decimal.getValue()!.hsb.hue).toBeCloseTo(359.9);
    expect(hueInput.validity.stepMismatch).toBe(false);
    hueInput.dispatchEvent(key("ArrowLeft", { altKey: true }));
    expect(decimal.getValue()!.hsb.hue).toBeCloseTo(359.8);
    expect(hueInput.validity.stepMismatch).toBe(false);
  });

  it("projects off-grid exact colors consistently without changing the model", () => {
    const root = render();
    const hueInput = channel(root, "hue");
    const hueSlider = getSlider(root, "hue");
    hueInput.setAttribute("data-step", "7");
    const picker = createColorPicker(root, { defaultValue: "hsb(180, 25%, 80%)", format: "hsb" });

    expect(picker.getValue()!.hsb.hue).toBeCloseTo(180);
    expect(root.style.getPropertyValue("--sw-color-picker-hue")).toBe("180");
    expect(hueInput.value).toBe("182");
    expect(hueInput.getAttribute("aria-valuenow")).toBe("182");
    expect(hueInput.getAttribute("aria-valuetext")).toBe("Hue 182°");
    expect(
      Number.parseFloat(hueSlider.style.getPropertyValue("--sw-color-picker-channel-position")),
    ).toBeCloseTo((182 / 357) * 100);
    expect(hueInput.validity.stepMismatch).toBe(false);

    picker.setValue("hsb(181, 25%, 80%)", { emit: false });
    expect(picker.getValue()!.hsb.hue).toBeCloseTo(181);
    expect(hueInput.value).toBe("182");
    expect(hueInput.validity.stepMismatch).toBe(false);

    picker.destroy();
    hueInput.setAttribute("data-step", "0.1");
    const decimal = createColorPicker(root, {
      defaultValue: "hsb(180.04, 25%, 80%)",
      format: "hsb",
    });
    expect(decimal.getValue()!.hsb.hue).toBeCloseTo(180.04);
    expect(hueInput.value).toBe("180");
    expect(hueInput.getAttribute("aria-valuenow")).toBe("180");
    expect(hueInput.validity.stepMismatch).toBe(false);
  });

  it("moves keyboard input from an off-grid exact value onto the configured grid", () => {
    const root = render();
    const hue = channel(root, "hue");
    hue.setAttribute("data-step", "7");
    const picker = createColorPicker(root, { defaultValue: "hsb(180, 25%, 80%)" });

    expect(hue.value).toBe("182");
    hue.dispatchEvent(key("ArrowRight"));

    expect(picker.getValue()!.hsb.hue).toBeCloseTo(189);
    expect(hue.value).toBe("189");
    expect(hue.validity.stepMismatch).toBe(false);
  });

  it("uses projected area-axis values for native state, announcements, and thumb geometry", () => {
    const root = render();
    const x = input(root, "x");
    const y = input(root, "y");
    x.setAttribute("data-step", "7");
    y.setAttribute("data-step", "7");
    const picker = createColorPicker(root, {
      defaultValue: "hsb(0, 25%, 80%)",
      format: "hsb",
    });

    expect(picker.getValue()!.hsb.saturation).toBeCloseTo(25);
    expect(picker.getValue()!.hsb.brightness).toBeCloseTo(80);
    expect(x.max).toBe("98");
    expect(y.max).toBe("98");
    expect(x.value).toBe("28");
    expect(y.value).toBe("77");
    expect(x.getAttribute("aria-valuetext")).toBe("Saturation 28%, Brightness 77%");
    expect(y.getAttribute("aria-valuetext")).toBe("Brightness 77%, Saturation 28%");
    expect(
      Number.parseFloat(areaThumb(root).style.getPropertyValue("--sw-color-picker-area-x")),
    ).toBeCloseTo((28 / 98) * 100);
    expect(
      Number.parseFloat(areaThumb(root).style.getPropertyValue("--sw-color-picker-area-y")),
    ).toBeCloseTo((1 - 77 / 98) * 100);
    expect(x.validity.stepMismatch).toBe(false);
    expect(y.validity.stepMismatch).toBe(false);
  });

  it("localizes runtime-owned area role descriptions without overriding authored copy", () => {
    const root = render();
    input(root, "x").setAttribute("aria-roledescription", "Authored area control");
    const getAreaRoleDescription = vi.fn((locale?: string) =>
      locale === "de-DE" ? "Zweidimensionaler Schieberegler" : "2D Slider",
    );
    const picker = createColorPicker(root, { getAreaRoleDescription, locale: "de-DE" });

    expect(input(root, "x").getAttribute("aria-roledescription")).toBe("Authored area control");
    expect(input(root, "y").getAttribute("aria-roledescription")).toBe(
      "Zweidimensionaler Schieberegler",
    );
    expect(getAreaRoleDescription).toHaveBeenCalledWith("de-DE");

    picker.setOptions({ getAreaRoleDescription: () => "Farbfläche" });
    expect(input(root, "x").getAttribute("aria-roledescription")).toBe("Authored area control");
    expect(input(root, "y").getAttribute("aria-roledescription")).toBe("Farbfläche");

    picker.destroy();
    expect(input(root, "x").getAttribute("aria-roledescription")).toBe("Authored area control");
    expect(input(root, "y")).not.toHaveAttribute("aria-roledescription");

    const replacement = createColorPicker(root, {
      getAreaRoleDescription: () => "Nouvelle zone de couleur",
      locale: "fr-FR",
    });
    expect(input(root, "x").getAttribute("aria-roledescription")).toBe("Authored area control");
    expect(input(root, "y").getAttribute("aria-roledescription")).toBe("Nouvelle zone de couleur");

    input(root, "y").setAttribute("aria-roledescription", "Consumer-owned area");
    replacement.setOptions({ getAreaRoleDescription: () => "Runtime replacement" });
    expect(input(root, "y").getAttribute("aria-roledescription")).toBe("Consumer-owned area");

    input(root, "y").removeAttribute("aria-roledescription");
    replacement.refresh({ preserveState: true });
    expect(input(root, "y").getAttribute("aria-roledescription")).toBe("Runtime replacement");

    replacement.setOptions({ getAreaRoleDescription: () => "Runtime localized replacement" });
    expect(input(root, "y").getAttribute("aria-roledescription")).toBe(
      "Runtime localized replacement",
    );
    replacement.destroy();
    expect(input(root, "y")).not.toHaveAttribute("aria-roledescription");
  });

  it("uses black to edit an initially empty uncontrolled value", () => {
    const root = render();
    const changed = vi.fn();
    root.addEventListener("starwind:value-change", changed);
    const picker = createColorPicker(root, { allowEmpty: true, defaultValue: null });

    expect(picker.getValue()).toBeNull();
    expect(root.getAttribute("data-value")).toBe("");
    expect(root.style.getPropertyValue("--sw-color-picker-color")).toBe("transparent");
    expect(channel(root, "hue")).toHaveAttribute("aria-valuenow", "0");

    channel(root, "hue").dispatchEvent(key("ArrowRight"));

    expect(picker.getValue()!.hsb).toMatchObject({ hue: 1, saturation: 0, brightness: 0 });
    expect(changed.mock.calls.at(-1)?.[0].detail.previousValue).toBeNull();
  });

  it("keeps an initially empty controlled value empty until synchronization", () => {
    const root = render();
    const changed = vi.fn();
    const committed = vi.fn();
    const picker = createColorPicker(root, {
      allowEmpty: true,
      value: null,
      onValueChange: changed,
      onValueCommitted: committed,
    });

    channel(root, "hue").dispatchEvent(key("ArrowRight"));

    expect(changed).toHaveBeenCalledOnce();
    expect(changed.mock.calls[0]![1]).toMatchObject({ previousValue: null, reason: "keyboard" });
    expect(committed).toHaveBeenCalledOnce();
    expect(picker.getValue()).toBeNull();
    expect(hidden(root).value).toBe("");
    expect(channel(root, "hue")).toHaveAttribute("aria-valuenow", "0");
  });

  it("proposes from the last externally confirmed color after a controlled clear", () => {
    const root = render({ channels: ["hue"] });
    const changed = vi.fn();
    const picker = createColorPicker(root, {
      allowEmpty: true,
      value: "#00ff00",
      onValueChange: changed,
    });
    picker.setValue(null, { emit: false });

    expect(channel(root, "hue")).toHaveAttribute("aria-valuenow", "120");
    channel(root, "hue").dispatchEvent(key("ArrowRight"));

    expect(changed).toHaveBeenCalledOnce();
    expect(changed.mock.calls[0]![0]!.hsb.hue).toBe(121);
    expect(changed.mock.calls[0]![1]).toMatchObject({ previousValue: null, reason: "keyboard" });
    expect(picker.getValue()).toBeNull();
    expect(hidden(root).value).toBe("");
  });

  it("keeps a canceled cleared edit empty without committing or replacing its baseline", () => {
    const root = render({ channels: ["hue"] });
    const committed = vi.fn();
    root.addEventListener("starwind:value-change", (event) => event.preventDefault());
    root.addEventListener("starwind:value-committed", committed);
    const picker = createColorPicker(root, { defaultValue: "#00ff00", allowEmpty: true });
    picker.setValue(null, { emit: false });

    channel(root, "hue").dispatchEvent(key("ArrowRight"));

    expect(picker.getValue()).toBeNull();
    expect(channel(root, "hue")).toHaveAttribute("aria-valuenow", "120");
    expect(committed).not.toHaveBeenCalled();
  });

  it("rolls back a canceled controlled confirmation to the cleared editing baseline", () => {
    const root = render({ channels: ["hue"] });
    const picker = createColorPicker(root, {
      allowEmpty: true,
      value: "#00ff00",
    });
    picker.setValue(null, { emit: false });
    root.addEventListener("starwind:value-change", (event) => {
      const detail = (event as CustomEvent<ColorPickerValueChangeDetails>).detail;
      picker.setValue(detail.value, { emit: false });
      event.preventDefault();
    });

    channel(root, "hue").dispatchEvent(key("ArrowRight"));

    expect(picker.getValue()).toBeNull();
    expect(channel(root, "hue")).toHaveAttribute("aria-valuenow", "120");
  });

  it("keeps controlled null accepted until non-emitting synchronization", () => {
    const root = render();
    const changed = vi.fn();
    const committed = vi.fn();
    const picker = createColorPicker(root, {
      allowEmpty: true,
      value: null,
      onValueChange: changed,
      onValueCommitted: committed,
    });

    picker.setValue("#ff0000");
    expect(picker.getValue()).toBeNull();
    expect(changed.mock.calls[0]![1].valueAsString).toBe("#ff0000");
    expect(committed.mock.calls[0]![1].valueAsString).toBe("#ff0000");

    picker.setValue("#ff0000", { emit: false });
    expect(picker.getValueAsString()).toBe("#ff0000");
  });

  it("notifies DOM, callback, and subscribers in Slider order", () => {
    const order: string[] = [];
    const root = render();
    root.addEventListener("starwind:value-change", () => order.push("change-dom"));
    root.addEventListener("starwind:value-committed", () => order.push("commit-dom"));
    root.addEventListener("starwind:format-change", () => order.push("format-dom"));
    const picker = createColorPicker(root, {
      defaultValue: "#ff0000",
      onValueChange: () => order.push("change-callback"),
      onValueCommitted: () => order.push("commit-callback"),
      onFormatChange: () => order.push("format-callback"),
    });
    picker.subscribe("valueChange", () => order.push("change-subscriber"));
    picker.subscribe("valueCommitted", () => order.push("commit-subscriber"));
    picker.subscribe("formatChange", () => order.push("format-subscriber"));

    channel(root, "hue").dispatchEvent(key("ArrowRight"));
    picker.setFormat("rgb");

    expect(order).toEqual([
      "change-dom",
      "change-callback",
      "change-subscriber",
      "commit-dom",
      "commit-callback",
      "commit-subscriber",
      "format-dom",
      "format-callback",
      "format-subscriber",
    ]);
  });

  it("lets DOM listeners cancel atomically before callbacks and subscribers", () => {
    const root = render();
    const callback = vi.fn();
    const committed = vi.fn();
    root.addEventListener("starwind:value-change", (event) => event.preventDefault());
    root.addEventListener("starwind:value-committed", committed);
    const picker = createColorPicker(root, { defaultValue: "#ff0000", onValueChange: callback });
    const subscriber = vi.fn();
    picker.subscribe("valueChange", subscriber);

    channel(root, "hue").dispatchEvent(key("ArrowRight"));

    expect(picker.getValueAsString()).toBe("#ff0000");
    expect(channel(root, "hue").value).toBe("0");
    expect(callback.mock.calls[0]![1].isCanceled).toBe(true);
    expect(subscriber.mock.calls[0]![0].isCanceled).toBe(true);
    expect(committed).not.toHaveBeenCalled();
  });

  it("rolls back matching controlled synchronization when a later listener cancels", () => {
    const pointerRoot = render();
    const pointerArea = getArea(pointerRoot);
    rect(pointerArea);
    const pointerCommits = vi.fn();
    pointerRoot.addEventListener("starwind:value-committed", pointerCommits);
    let pointerPicker!: ReturnType<typeof createColorPicker>;
    pointerPicker = createColorPicker(pointerRoot, {
      value: "hsb(0, 0%, 100%)",
      onValueChange: (value) => pointerPicker.setValue(value, { emit: false }),
    });
    pointerPicker.subscribe("valueChange", (details) => details.cancel());

    pointerArea.dispatchEvent(pointer("pointerdown", { clientX: 50, clientY: 0, buttons: 1 }));
    pointerRoot.ownerDocument.dispatchEvent(
      pointer("pointerup", { clientX: 50, clientY: 0, buttons: 0 }),
    );

    expect(pointerPicker.getValue()!.hsb.saturation).toBe(0);
    expect(input(pointerRoot, "x").value).toBe("0");
    expect(pointerCommits).not.toHaveBeenCalled();

    const nativeRoot = render();
    const nativeHue = channel(nativeRoot, "hue");
    const nativeCommits = vi.fn();
    nativeRoot.addEventListener("starwind:value-committed", nativeCommits);
    let nativePicker!: ReturnType<typeof createColorPicker>;
    nativePicker = createColorPicker(nativeRoot, {
      value: "#ff0000",
      onValueChange: (value) => nativePicker.setValue(value, { emit: false }),
    });
    nativePicker.subscribe("valueChange", (details) => details.cancel());

    nativeHue.value = "120";
    nativeHue.dispatchEvent(new Event("input", { bubbles: true }));
    nativeHue.dispatchEvent(new Event("change", { bubbles: true }));

    expect(nativePicker.getValueAsString()).toBe("#ff0000");
    expect(nativeHue.value).toBe("0");
    expect(nativeCommits).not.toHaveBeenCalled();

    const keyboardRoot = render();
    const keyboardCommits = vi.fn();
    keyboardRoot.addEventListener("starwind:value-committed", keyboardCommits);
    let keyboardPicker!: ReturnType<typeof createColorPicker>;
    keyboardPicker = createColorPicker(keyboardRoot, {
      value: "#ff0000",
      onValueChange: (value) => keyboardPicker.setValue(value, { emit: false }),
    });
    keyboardPicker.subscribe("valueChange", (details) => details.cancel());

    channel(keyboardRoot, "hue").dispatchEvent(key("ArrowRight"));

    expect(keyboardPicker.getValueAsString()).toBe("#ff0000");
    expect(channel(keyboardRoot, "hue").value).toBe("0");
    expect(keyboardCommits).not.toHaveBeenCalled();
  });

  it("exposes native orientation for area axes and channel geometry", () => {
    const root = render();
    const picker = createColorPicker(root);
    const hueSlider = getSlider(root, "hue");

    expect(input(root, "x")).toHaveAttribute("aria-orientation", "horizontal");
    expect(input(root, "y")).toHaveAttribute("aria-orientation", "vertical");
    expect(channel(root, "hue")).toHaveAttribute("aria-orientation", "horizontal");

    hueSlider.setAttribute("data-orientation", "vertical");
    picker.refresh();
    expect(channel(root, "hue")).toHaveAttribute("aria-orientation", "vertical");

    hueSlider.setAttribute("data-orientation", "horizontal");
    picker.setOptions({ locale: "en-US" });
    expect(channel(root, "hue")).toHaveAttribute("aria-orientation", "horizontal");
  });

  it("reflects focus, dragging, disabled, and read-only on visible surfaces and thumbs", () => {
    const root = render();
    const picker = createColorPicker(root, { defaultValue: "#ff0000" });
    const area = getArea(root);
    const hueSlider = getSlider(root, "hue");
    const hueThumb = sliderThumb(root, "hue");
    rect(hueSlider);

    channel(root, "hue").focus();
    expect(hueSlider).toHaveAttribute("data-focused");
    expect(hueThumb).toHaveAttribute("data-focused");
    channel(root, "hue").blur();
    input(root, "x").focus();
    expect(area).toHaveAttribute("data-focused");
    expect(areaThumb(root)).toHaveAttribute("data-focused");
    input(root, "x").blur();

    hueSlider.dispatchEvent(pointer("pointerdown", { clientX: 30, clientY: 50, buttons: 1 }));
    expect(hueSlider).toHaveAttribute("data-dragging");
    expect(hueThumb).toHaveAttribute("data-dragging");
    root.ownerDocument.dispatchEvent(
      pointer("pointerup", { clientX: 30, clientY: 50, buttons: 0 }),
    );
    expect(hueSlider).not.toHaveAttribute("data-dragging");
    expect(hueThumb).not.toHaveAttribute("data-dragging");

    picker.setReadOnly(true);
    for (const part of [area, areaThumb(root), hueSlider, hueThumb])
      expect(part).toHaveAttribute("data-readonly");
    picker.setDisabled(true);
    for (const part of [area, areaThumb(root), hueSlider, hueThumb])
      expect(part).toHaveAttribute("data-disabled");
  });

  it("owns pointer focus without letting read-only or disabled surfaces mutate", () => {
    const root = render();
    const area = getArea(root);
    const hueSlider = getSlider(root, "hue");
    const hueInput = channel(root, "hue");
    const x = input(root, "x");
    const y = input(root, "y");
    const outside = document.createElement("button");
    document.body.append(outside);
    rect(area);
    rect(hueSlider);
    const picker = createColorPicker(root, { defaultValue: "hsb(0, 0%, 100%)" });

    hueSlider.dispatchEvent(pointer("pointerdown", { clientX: 25, clientY: 50, buttons: 1 }));
    expect(document.activeElement).toBe(hueInput);
    document.dispatchEvent(pointer("pointerup", { clientX: 25, clientY: 50, buttons: 0 }));
    const afterPointer = picker.getValue()!.hsb.hue;
    hueInput.dispatchEvent(key("ArrowRight"));
    expect(picker.getValue()!.hsb.hue).toBeCloseTo(afterPointer + 1);

    y.focus();
    area.dispatchEvent(pointer("pointerdown", { clientX: 40, clientY: 20, buttons: 1 }));
    expect(document.activeElement).toBe(y);
    document.dispatchEvent(pointer("pointerup", { clientX: 40, clientY: 20, buttons: 0 }));

    outside.focus();
    area.dispatchEvent(pointer("pointerdown", { clientX: 50, clientY: 30, buttons: 1 }));
    expect(document.activeElement).toBe(x);
    document.dispatchEvent(pointer("pointerup", { clientX: 50, clientY: 30, buttons: 0 }));

    picker.setReadOnly(true);
    outside.focus();
    const readOnlyValue = picker.getValueAsString();
    hueSlider.dispatchEvent(pointer("pointerdown", { clientX: 80, clientY: 50, buttons: 1 }));
    expect(document.activeElement).toBe(hueInput);
    expect(picker.getValueAsString()).toBe(readOnlyValue);

    picker.setReadOnly(false);
    picker.setDisabled(true);
    outside.focus();
    const disabledValue = picker.getValueAsString();
    hueSlider.dispatchEvent(pointer("pointerdown", { clientX: 10, clientY: 50, buttons: 1 }));
    expect(document.activeElement).toBe(outside);
    expect(picker.getValueAsString()).toBe(disabledValue);
  });

  it("mirrors horizontal area pointer and keyboard math in RTL and commits once", () => {
    const root = render();
    const area = getArea(root);
    rect(area);
    const committed = vi.fn();
    root.addEventListener("starwind:value-committed", committed);
    const picker = createColorPicker(root, { defaultValue: "hsb(0, 0%, 100%)", dir: "rtl" });
    area.dispatchEvent(pointer("pointerdown", { clientX: 20, clientY: 50, buttons: 1 }));
    root.ownerDocument.dispatchEvent(
      pointer("pointermove", { clientX: 40, clientY: 20, buttons: 1 }),
    );
    root.ownerDocument.dispatchEvent(
      pointer("pointerup", { clientX: 40, clientY: 20, buttons: 0 }),
    );
    expect(picker.getValue()!.hsb.saturation).toBeCloseTo(60);
    expect(picker.getValue()!.hsb.brightness).toBeCloseTo(80);
    expect(committed).toHaveBeenCalledOnce();
    input(root, "x").dispatchEvent(key("ArrowRight"));
    expect(picker.getValue()!.hsb.saturation).toBeCloseTo(59);
  });

  it("supports vertical channel pointer math and localized announcements", () => {
    const root = render();
    const hue = getSlider(root, "hue");
    hue.setAttribute("data-orientation", "vertical");
    rect(hue);
    const picker = createColorPicker(root, { locale: "de-DE" });
    hue.dispatchEvent(pointer("pointerdown", { clientX: 10, clientY: 25, buttons: 1 }));
    root.ownerDocument.dispatchEvent(
      pointer("pointerup", { clientX: 10, clientY: 25, buttons: 0 }),
    );
    expect(picker.getValue()!.hsb.hue).toBeCloseTo(269);
    expect(channel(root, "hue").getAttribute("aria-valuetext")).toBe("Hue 269°");
  });

  it("keeps every discovery, listener, render, and hidden input inside its nearest nested root", () => {
    const outer = render({ channels: ["hue"] });
    const inner = render({ channels: ["hue"] });
    const outerArea = getArea(outer);
    const outerSlider = getSlider(outer, "hue");
    outerSlider.setAttribute("data-orientation", "vertical");
    outerArea.append(outerSlider);
    outerSlider.append(inner);
    const outerPicker = createColorPicker(outer, {
      defaultValue: "#ff0000",
      name: "outer",
    });
    const innerPicker = createColorPicker(inner, {
      defaultValue: "#0000ff",
      dir: "rtl",
      name: "inner",
    });

    expect(outer.querySelectorAll("[data-sw-color-picker-hidden-input]")).toHaveLength(2);
    expect(hidden(outer).name).toBe("outer");
    expect(hidden(inner).name).toBe("inner");
    expect(hidden(outer).value).toBe("#ff0000");
    expect(hidden(inner).value).toBe("#0000ff");

    const innerHue = channel(inner, "hue");
    expect(inner.hasAttribute("data-sw-color-picker")).toBe(true);
    expect(innerHue.closest("[data-sw-color-picker]")).toBe(inner);
    expect(innerHue.closest("[data-orientation=vertical]")).toBe(outerSlider);
    expect(innerHue.disabled).toBe(false);
    expect(innerHue.getAttribute("aria-valuenow")).toBe("240");
    expect(innerHue.getAttribute("data-step")).toBe("1");
    const arrowRight = key("ArrowRight", { cancelable: true });
    innerHue.dispatchEvent(arrowRight);
    expect(arrowRight.defaultPrevented).toBe(true);
    expect(innerHue.getAttribute("aria-valuenow")).toBe("239");
    expect(innerPicker.getValue()!.hsb.hue).toBe(239);
    const innerValue = hidden(inner).value;
    expect(outerPicker.getValueAsString()).toBe("#ff0000");
    innerHue.focus();
    outerPicker.setReadOnly(false);
    expect(outerArea).not.toHaveAttribute("data-focused");
    expect(outerSlider).not.toHaveAttribute("data-focused");
    outerPicker.setDisabled(true);
    expect(channel(inner, "hue").disabled).toBe(false);
    expect(hidden(inner).disabled).toBe(false);
    outerPicker.refresh();
    expect(hidden(inner).name).toBe("inner");
    expect(hidden(inner).value).toBe(innerValue);
  });

  it("cancels detached or reconfigured interaction sessions during preserving refresh", () => {
    const root = render({ channels: ["hue"] });
    const area = getArea(root);
    const slider = getSlider(root, "hue");
    const hueInput = channel(root, "hue");
    rect(area);
    rect(slider);
    const committed = vi.fn();
    root.addEventListener("starwind:value-committed", committed);
    const picker = createColorPicker(root, { defaultValue: "hsb(0, 0%, 100%)" });

    area.dispatchEvent(pointer("pointerdown", { clientX: 75, clientY: 25, buttons: 1 }));
    expect(picker.getValue()!.hsb.saturation).toBeCloseTo(75);
    area.remove();
    picker.refresh({ preserveState: true });
    expect(picker.getValue()!.hsb.saturation).toBe(0);
    document.dispatchEvent(pointer("pointermove", { clientX: 10, clientY: 10, buttons: 1 }));
    document.dispatchEvent(pointer("pointerup", { clientX: 10, clientY: 10, buttons: 0 }));
    expect(picker.getValue()!.hsb.saturation).toBe(0);
    expect(committed).not.toHaveBeenCalled();

    slider.dispatchEvent(pointer("pointerdown", { clientX: 50, clientY: 50, buttons: 1 }));
    expect(picker.getValue()!.hsb.hue).toBeCloseTo(180);
    slider.remove();
    picker.refresh({ preserveState: true });
    document.dispatchEvent(pointer("pointermove", { clientX: 90, clientY: 50, buttons: 1 }));
    document.dispatchEvent(pointer("pointerup", { clientX: 90, clientY: 50, buttons: 0 }));
    expect(picker.getValue()!.hsb.hue).toBe(0);
    expect(committed).not.toHaveBeenCalled();

    root.append(slider);
    picker.refresh({ preserveState: true });
    hueInput.value = "120";
    hueInput.dispatchEvent(new Event("input", { bubbles: true }));
    expect(picker.getValue()!.hsb.hue).toBe(120);
    hueInput.remove();
    picker.refresh({ preserveState: true });
    hueInput.dispatchEvent(new Event("change", { bubbles: true }));
    expect(picker.getValue()!.hsb.hue).toBe(0);
    expect(committed).not.toHaveBeenCalled();

    slider.append(hueInput);
    picker.refresh({ preserveState: true });
    slider.dispatchEvent(pointer("pointerdown", { clientX: 50, clientY: 50, buttons: 1 }));
    expect(picker.getValue()!.hsb.hue).toBeCloseTo(180);
    slider.setAttribute("data-orientation", "vertical");
    picker.refresh({ preserveState: true });
    document.dispatchEvent(pointer("pointerup", { clientX: 50, clientY: 50, buttons: 0 }));
    expect(picker.getValue()!.hsb.hue).toBe(0);
    expect(committed).not.toHaveBeenCalled();
  });

  it("preserves an active drag through unrelated insertion and commits once", () => {
    const root = render({ channels: ["hue"] });
    const area = getArea(root);
    rect(area);
    const committed = vi.fn();
    root.addEventListener("starwind:value-committed", committed);
    const picker = createColorPicker(root, { defaultValue: "hsb(0, 0%, 100%)" });

    area.dispatchEvent(pointer("pointerdown", { clientX: 20, clientY: 80, buttons: 1 }));
    const decoration = document.createElement("span");
    area.append(decoration);
    picker.refresh({ preserveState: true });
    document.dispatchEvent(pointer("pointermove", { clientX: 70, clientY: 30, buttons: 1 }));
    document.dispatchEvent(pointer("pointerup", { clientX: 70, clientY: 30, buttons: 0 }));

    expect(picker.getValue()!.hsb.saturation).toBeCloseTo(70);
    expect(picker.getValue()!.hsb.brightness).toBeCloseTo(70);
    expect(committed).toHaveBeenCalledOnce();
  });

  it("cancels preserving refresh when active channel, axis, step, or orientation changes", () => {
    for (const mutate of [
      (root: HTMLElement) => getSlider(root, "hue").setAttribute("data-channel", "red"),
      (root: HTMLElement) => getSlider(root, "hue").setAttribute("data-orientation", "vertical"),
      (root: HTMLElement) => channel(root, "hue").setAttribute("data-step", "7"),
    ]) {
      const root = render({ channels: ["hue"] });
      const slider = getSlider(root, "hue");
      rect(slider);
      const committed = vi.fn();
      root.addEventListener("starwind:value-committed", committed);
      const picker = createColorPicker(root, { defaultValue: "hsb(0, 0%, 100%)" });
      slider.dispatchEvent(pointer("pointerdown", { clientX: 50, clientY: 50, buttons: 1 }));
      mutate(root);
      picker.refresh({ preserveState: true });
      document.dispatchEvent(pointer("pointerup", { clientX: 50, clientY: 50, buttons: 0 }));
      expect(picker.getValue()!.hsb.hue).toBe(0);
      expect(committed).not.toHaveBeenCalled();
      picker.destroy();
      root.remove();
    }

    const root = render({ channels: [] });
    const area = getArea(root);
    rect(area);
    const committed = vi.fn();
    root.addEventListener("starwind:value-committed", committed);
    const picker = createColorPicker(root, { defaultValue: "hsb(0, 0%, 100%)" });
    area.dispatchEvent(pointer("pointerdown", { clientX: 50, clientY: 50, buttons: 1 }));
    input(root, "x").setAttribute("data-axis", "y");
    picker.refresh({ preserveState: true });
    document.dispatchEvent(pointer("pointerup", { clientX: 50, clientY: 50, buttons: 0 }));
    expect(picker.getValue()!.hsb.saturation).toBe(0);
    expect(committed).not.toHaveBeenCalled();
  });

  it("clears optional reflected state explicitly and recomputes inherited direction", () => {
    const parent = document.createElement("div");
    parent.dir = "rtl";
    document.body.append(parent);
    const root = render();
    parent.append(root);
    const picker = createColorPicker(root, { defaultValue: "#ff0000" });

    picker.setName("accent");
    picker.setOptions({ form: "theme-form", locale: "de-DE", dir: "ltr" });
    expect(root.getAttribute("data-name")).toBe("accent");
    expect(root.getAttribute("data-form")).toBe("theme-form");
    expect(root.getAttribute("data-locale")).toBe("de-DE");
    expect(root.getAttribute("dir")).toBe("ltr");

    picker.setName(null);
    picker.setOptions({ form: null, locale: null, dir: null });
    expect(root.hasAttribute("data-name")).toBe(false);
    expect(root.hasAttribute("data-form")).toBe(false);
    expect(root.hasAttribute("data-locale")).toBe(false);
    expect(root.hasAttribute("dir")).toBe(false);
    expect(hidden(root).name).toBe("");
    expect(hidden(root).getAttribute("form")).toBeNull();

    const area = getArea(root);
    rect(area);
    area.dispatchEvent(pointer("pointerdown", { clientX: 20, clientY: 50, buttons: 1 }));
    root.ownerDocument.dispatchEvent(
      pointer("pointerup", { clientX: 20, clientY: 50, buttons: 0 }),
    );
    expect(picker.getValue()!.hsb.saturation).toBeCloseTo(80);
  });
});

function render({
  channels = ["hue", "alpha"],
  ownerDocument = document,
}: {
  channels?: string[];
  ownerDocument?: Document;
} = {}) {
  const wrapper = ownerDocument.createElement("div");
  wrapper.innerHTML = `<div data-sw-color-picker><span data-sw-color-picker-label>Color</span><div data-sw-color-picker-area><span data-sw-color-picker-area-thumb></span><input data-sw-color-picker-area-input data-axis="x"><input data-sw-color-picker-area-input data-axis="y"></div>${channels.map(slider).join("")}<input data-sw-color-picker-hidden-input></div>`;
  const root = wrapper.firstElementChild as HTMLElement;
  ownerDocument.body.append(root);
  return root;
}
function slider(name: string) {
  return `<div data-sw-color-picker-channel-slider data-channel="${name}"><span data-sw-color-picker-channel-slider-thumb></span><input data-sw-color-picker-channel-input></div>`;
}
function label(root: HTMLElement) {
  return root.querySelector<HTMLElement>("[data-sw-color-picker-label]")!;
}
function input(root: HTMLElement, axis: string) {
  return root.querySelector<HTMLInputElement>(
    `[data-sw-color-picker-area-input][data-axis=${axis}]`,
  )!;
}
function channel(root: HTMLElement, name: string) {
  return [...root.querySelectorAll<HTMLInputElement>("[data-sw-color-picker-channel-input]")].find(
    (candidate) =>
      candidate.closest("[data-sw-color-picker]") === root &&
      candidate.closest("[data-sw-color-picker-channel-slider]")?.getAttribute("data-channel") ===
        name,
  )!;
}
function getSlider(root: HTMLElement, name: string) {
  return [
    ...root.querySelectorAll<HTMLElement>(
      `[data-sw-color-picker-channel-slider][data-channel=${name}]`,
    ),
  ].find((candidate) => candidate.closest("[data-sw-color-picker]") === root)!;
}
function sliderThumb(root: HTMLElement, name: string) {
  return getSlider(root, name).querySelector<HTMLElement>(
    "[data-sw-color-picker-channel-slider-thumb]",
  )!;
}
function getArea(root: HTMLElement) {
  return root.querySelector<HTMLElement>("[data-sw-color-picker-area]")!;
}
function areaThumb(root: HTMLElement) {
  return root.querySelector<HTMLElement>("[data-sw-color-picker-area-thumb]")!;
}
function hidden(root: HTMLElement) {
  return [...root.querySelectorAll<HTMLInputElement>("[data-sw-color-picker-hidden-input]")].find(
    (candidate) => candidate.closest("[data-sw-color-picker]") === root,
  )!;
}
function rect(element: HTMLElement) {
  Object.defineProperty(element, "getBoundingClientRect", {
    configurable: true,
    value: () => ({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
      right: 100,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON() {},
    }),
  });
}
function pointer(type: string, init: PointerEventInit) {
  return new PointerEvent(type, { bubbles: true, button: 0, pointerId: 7, ...init });
}
function key(value: string, init: KeyboardEventInit = {}) {
  return new KeyboardEvent("keydown", { bubbles: true, key: value, ...init });
}
