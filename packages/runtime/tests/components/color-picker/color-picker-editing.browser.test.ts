import { afterEach, describe, expect, it, vi } from "vitest";
import { createColorPicker, parseColor } from "../../../src/components/color-picker";
import { createSelect } from "../../../src/components/select/select";
import { initStarwind } from "../../../src/init-starwind";

describe("Color Picker editing behaviors", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    delete (window as Window & { EyeDropper?: unknown }).EyeDropper;
  });

  it("keeps invalid whole and channel drafts isolated and restores them", () => {
    const root = render();
    const picker = createColorPicker(root, { defaultValue: "#ff0000" });
    const value = get<HTMLInputElement>(root, "[data-sw-color-picker-value-input]");
    value.focus();
    value.value = "#ff";
    value.dispatchEvent(new Event("input", { bubbles: true }));
    expect(value).toHaveAttribute("aria-invalid", "true");
    expect(picker.getValueAsString()).toBe("#ff0000");

    value.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    expect(value.value).toBe("#ff0000");

    const red = get<HTMLInputElement>(
      root,
      '[data-sw-color-picker-channel-field][data-channel="red"]',
    );
    red.value = "nope";
    red.dispatchEvent(new Event("input", { bubbles: true }));
    red.dispatchEvent(new FocusEvent("blur", { bubbles: true }));
    expect(red.value).toBe("255");
    expect(picker.getValueAsString()).toBe("#ff0000");
    for (const draft of ["", "   "]) {
      red.value = draft;
      red.dispatchEvent(new Event("input", { bubbles: true }));
      expect(red).toHaveAttribute("aria-invalid", "true");
      red.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
      expect(red.value).toBe("255");
      expect(picker.getValueAsString()).toBe("#ff0000");
    }
  });

  it("commits valid whole and channel drafts through the shared pipeline", () => {
    const root = render();
    const changed = vi.fn();
    const committed = vi.fn();
    root.addEventListener("starwind:value-change", changed);
    root.addEventListener("starwind:value-committed", committed);
    const picker = createColorPicker(root, { defaultValue: "#ff0000" });
    const value = get<HTMLInputElement>(root, "[data-sw-color-picker-value-input]");
    value.value = "rgb(0, 255, 0)";
    value.dispatchEvent(new Event("input", { bubbles: true }));
    value.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    expect(picker.getValueAsString()).toBe("#00ff00");
    expect(changed.mock.calls.at(-1)?.[0].detail.reason).toBe("value-input");
    expect(committed).toHaveBeenCalledOnce();

    const blue = get<HTMLInputElement>(
      root,
      '[data-sw-color-picker-channel-field][data-channel="blue"]',
    );
    blue.value = "255";
    blue.dispatchEvent(new Event("input", { bubbles: true }));
    blue.dispatchEvent(new Event("change", { bubbles: true }));
    expect(picker.getValueAsString()).toBe("#00ffff");
    expect(changed.mock.calls.at(-1)?.[0].detail.reason).toBe("channel-input");
  });

  it("switches formats, selects repeatable swatches, and clears only when allowed", () => {
    const root = render();
    const picker = createColorPicker(root, { defaultValue: "#ff0000", allowEmpty: true });
    const select = get<HTMLSelectElement>(root, "[data-sw-color-picker-format-select]");
    select.value = "rgb";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    expect(picker.getFormat()).toBe("rgb");
    expect(picker.getValueAsString()).toBe("rgb(255, 0, 0)");

    const green = get<HTMLButtonElement>(
      root,
      '[data-sw-color-picker-swatch][data-value="#00ff00"]',
    );
    green.click();
    expect(green).toHaveAttribute("aria-pressed", "true");
    expect(picker.getValueAsString()).toBe("rgb(0, 255, 0)");
    get<HTMLButtonElement>(root, "[data-sw-color-picker-clear]").click();
    expect(picker.getValue()).toBeNull();
    expect(get<HTMLInputElement>(root, "[data-sw-color-picker-hidden-input]").value).toBe("");
  });

  it("bridges accepted and canceled composite format changes without leaking value events", async () => {
    const root = render();
    const selectRoot = appendCompositeFormatControl(root);
    const picker = createColorPicker(root, { defaultValue: "#ff0000", format: "hsl" });
    const select = createSelect(selectRoot);
    const formatChanged = vi.fn();
    const valueChanged = vi.fn();
    root.addEventListener("starwind:format-change", formatChanged);
    root.addEventListener("starwind:value-change", valueChanged);

    expect(select.getValue()).toBe("hsl");
    const rgbItem = selectRoot.querySelector<HTMLElement>(
      '[data-sw-select-item][data-value="rgb"]',
    )!;
    select.setOpen(true, { emit: false });
    rgbItem.click();
    await Promise.resolve();

    expect(picker.getFormat()).toBe("rgb");
    expect(select.getValue()).toBe("rgb");
    expect(formatChanged).toHaveBeenCalledOnce();
    expect(valueChanged).not.toHaveBeenCalled();

    picker.refresh({ preserveState: true });
    picker.refresh({ preserveState: true });
    const hsbItem = document.querySelector<HTMLElement>('[data-sw-select-item][data-value="hsb"]')!;
    select.setOpen(true, { emit: false });
    hsbItem.click();
    await Promise.resolve();
    expect(picker.getFormat()).toBe("hsb");
    expect(formatChanged).toHaveBeenCalledTimes(2);
    expect(valueChanged).not.toHaveBeenCalled();

    selectRoot.addEventListener("starwind:value-change", (event) => event.preventDefault());
    const hexItem = document.querySelector<HTMLElement>('[data-sw-select-item][data-value="hex"]')!;
    select.setOpen(true, { emit: false });
    hexItem.click();
    await Promise.resolve();

    expect(picker.getFormat()).toBe("hsb");
    expect(select.getValue()).toBe("hsb");
    expect(formatChanged).toHaveBeenCalledTimes(2);
    expect(valueChanged).not.toHaveBeenCalled();
  });

  it("silently synchronizes composite format, state, refresh, reset, and form ownership", async () => {
    const form = document.createElement("form");
    form.id = "colors";
    document.body.append(form);
    const root = render();
    const selectRoot = appendCompositeFormatControl(root, {
      form: form.id,
      name: "format",
      required: true,
    });
    form.append(root);
    const formatChanged = vi.fn();
    root.addEventListener("starwind:format-change", formatChanged);
    const picker = createColorPicker(root, {
      defaultValue: "#ff0000",
      format: "hex",
      name: "accent",
      required: true,
      disabled: true,
      readOnly: true,
    });
    const select = createSelect(selectRoot);

    expect(selectRoot).toHaveAttribute("data-disabled");
    expect(selectRoot).toHaveAttribute("data-readonly");
    picker.setDisabled(false);
    picker.setReadOnly(false);

    for (const format of ["rgb", "hsl", "hsb", "hex"] as const) {
      picker.setFormat(format, { emit: false });
      expect(select.getValue()).toBe(format);
    }
    picker.refresh({ preserveState: true });
    expect(select.getValue()).toBe("hex");

    picker.setDisabled(true);
    expect(selectRoot).toHaveAttribute("data-disabled");
    picker.setDisabled(false);
    picker.setReadOnly(true);
    expect(selectRoot).toHaveAttribute("data-readonly");
    picker.setReadOnly(false);

    const selectInput = selectRoot.querySelector<HTMLInputElement>("[data-sw-select-input]")!;
    expect(selectInput.name).toBe("");
    expect(selectInput.required).toBe(false);
    expect(selectInput.getAttribute("form")).toBeNull();
    expect([...new FormData(form).entries()]).toEqual([["accent", "#ff0000"]]);

    picker.setFormat("hsb", { emit: false });
    form.reset();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(picker.getFormat()).toBe("hex");
    expect(select.getValue()).toBe("hex");
    expect(formatChanged).not.toHaveBeenCalled();
  });

  it("wins conflicting composite Select defaults on reset in both controller init orders", async () => {
    for (const order of ["init-starwind", "select-first"] as const) {
      const form = document.createElement("form");
      document.body.append(form);
      const root = render();
      const selectRoot = appendCompositeFormatControl(root, { defaultValue: "rgb" });
      form.append(root);
      const formatChanged = vi.fn();
      root.addEventListener("starwind:format-change", formatChanged);

      const cleanup = order === "init-starwind" ? initStarwind(form) : undefined;
      const select = createSelect(selectRoot);
      const picker = createColorPicker(root, { defaultValue: "#ff0000", format: "hex" });

      expect(select.getValue()).toBe("hex");
      picker.setFormat("hsb", { emit: false });
      expect(select.getValue()).toBe("hsb");

      form.reset();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(picker.getFormat()).toBe("hex");
      expect(select.getValue()).toBe("hex");
      expect(selectRoot.querySelector("[data-sw-select-value]")).toHaveTextContent("HEX");
      expect(formatChanged).not.toHaveBeenCalled();

      cleanup?.destroy();
      picker.destroy();
      select.destroy();
      form.remove();
    }
  });

  it("progressively samples a color, preserves alpha, and ignores cancellation", async () => {
    const open = vi.fn().mockResolvedValue({ sRGBHex: "#00ff00" });
    (window as Window & { EyeDropper?: unknown }).EyeDropper = class {
      open = open;
    };
    const root = render();
    const picker = createColorPicker(root, { defaultValue: "rgba(255, 0, 0, 0.25)" });
    const trigger = get<HTMLButtonElement>(root, "[data-sw-color-picker-eye-dropper]");
    expect(trigger.hidden).toBe(false);
    trigger.click();
    await vi.waitFor(() => expect(picker.getValue()!.rgb.green).toBe(255));
    expect(picker.getValue()!.alpha).toBeCloseTo(0.25);

    open.mockRejectedValueOnce(new DOMException("cancel", "AbortError"));
    const before = picker.getValueAsString();
    trigger.click();
    await Promise.resolve();
    expect(picker.getValueAsString()).toBe(before);
  });

  it("submits one canonical value, validates empty, omits disabled, and resets silently", async () => {
    const form = document.createElement("form");
    document.body.append(form);
    const root = render();
    form.append(root);
    const changed = vi.fn();
    const committed = vi.fn();
    const formatChanged = vi.fn();
    root.addEventListener("starwind:value-change", changed);
    root.addEventListener("starwind:value-committed", committed);
    root.addEventListener("starwind:format-change", formatChanged);
    const picker = createColorPicker(root, {
      defaultValue: "#ff0000",
      format: "hex",
      allowEmpty: true,
      required: true,
      name: "accent",
    });
    const hidden = get<HTMLInputElement>(root, "[data-sw-color-picker-hidden-input]");
    const valueInput = get<HTMLInputElement>(root, "[data-sw-color-picker-value-input]");
    expect(hidden.form).toBe(form);
    expect(hidden.hidden).toBe(false);
    expect(hidden.tabIndex).toBe(-1);
    expect(hidden).toHaveAttribute("aria-hidden", "true");
    expect(hidden.style.position).toBe("absolute");
    expect(root.querySelectorAll("[data-sw-color-picker-hidden-input]")).toHaveLength(1);
    expect(new FormData(form).get("accent")).toBe("#ff0000");
    get<HTMLButtonElement>(root, "[data-sw-color-picker-clear]").click();
    expect(hidden.validity.valueMissing).toBe(true);
    expect(root).toHaveAttribute("data-invalid");
    expect(valueInput).toHaveAttribute("aria-invalid", "true");
    const submitted = vi.fn();
    form.addEventListener("submit", submitted);
    const consoleError = vi.spyOn(console, "error");
    form.requestSubmit();
    expect(submitted).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(valueInput);
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
    picker.setDisabled(true);
    expect(new FormData(form).get("accent")).toBeNull();
    picker.setDisabled(false);
    picker.setFormat("rgb");
    form.reset();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(picker.getValueAsString()).toBe("#ff0000");
    expect(picker.getFormat()).toBe("hex");
    expect(valueInput.value).toBe("#ff0000");
    expect(
      get<HTMLInputElement>(root, '[data-sw-color-picker-channel-field][data-channel="red"]').value,
    ).toBe("255");
    expect(get<HTMLSelectElement>(root, "[data-sw-color-picker-format-select]").value).toBe("hex");
    expect(get<HTMLInputElement>(root, "[data-sw-color-picker-channel-input]").value).toBe("0");
    expect(
      get<HTMLElement>(root, "[data-sw-color-picker-channel-slider]").style.getPropertyValue(
        "--sw-color-picker-channel-position",
      ),
    ).toBe("0%");
    expect(
      get<HTMLButtonElement>(root, '[data-sw-color-picker-swatch][data-value="#ff0000"]'),
    ).toHaveAttribute("aria-pressed", "true");
    expect(hidden.value).toBe("#ff0000");
    expect(changed).toHaveBeenCalledOnce();
    expect(committed).toHaveBeenCalledOnce();
    expect(formatChanged).toHaveBeenCalledOnce();
  });

  it("keeps coordinateful black HSB state through controlled updates and form reset", async () => {
    const form = document.createElement("form");
    document.body.append(form);
    const root = render();
    form.append(root);
    const initial = parseColor("hsb(210, 80%, 75%)")!.withChannels("hsb", { brightness: 0 });
    const updated = initial.withChannels("hsb", { saturation: 35 });
    const picker = createColorPicker(root, {
      value: initial,
      format: "hsb",
      name: "accent",
    });
    const hidden = get<HTMLInputElement>(root, "[data-sw-color-picker-hidden-input]");
    const valueInput = get<HTMLInputElement>(root, "[data-sw-color-picker-value-input]");

    expect(hidden.value).toBe("hsb(210, 80%, 0%)");
    expect(hidden.defaultValue).toBe("hsb(210, 80%, 0%)");
    picker.setValue(updated, { emit: false });
    expect(picker.getValue()!.hsb.saturation).toBe(35);
    expect(hidden.value).toBe("hsb(210, 35%, 0%)");
    expect(valueInput.value).toBe("hsb(210, 35%, 0%)");
    expect(new FormData(form).get("accent")).toBe("hsb(210, 35%, 0%)");

    form.reset();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(picker.getValue()!.hsb.saturation).toBeCloseTo(80, 10);
    expect(hidden.value).toBe("hsb(210, 80%, 0%)");
    expect(valueInput.value).toBe("hsb(210, 80%, 0%)");
  });

  it("restores authored validity and retains invalid drafts across every proxy recovery path", async () => {
    const firstForm = document.createElement("form");
    firstForm.id = "first-color-form";
    const secondForm = document.createElement("form");
    secondForm.id = "second-color-form";
    document.body.append(firstForm, secondForm);
    const root = render();
    const valueInput = get<HTMLInputElement>(root, "[data-sw-color-picker-value-input]");
    root.setAttribute("data-invalid", "application-root");
    root.setAttribute("aria-invalid", "true");
    valueInput.setAttribute("data-invalid", "application-input");
    valueInput.setAttribute("aria-invalid", "true");
    firstForm.append(root);
    const picker = createColorPicker(root, {
      defaultValue: "#ff0000",
      allowEmpty: true,
      required: true,
      name: "accent",
    });

    picker.setValue(null, { emit: false });
    expect(root.getAttribute("data-invalid")).toBe("");
    expect(valueInput.getAttribute("data-invalid")).toBe("");
    picker.setOptions({ required: false });
    expect(root.getAttribute("data-invalid")).toBe("application-root");
    expect(root).toHaveAttribute("aria-invalid", "true");
    expect(valueInput.getAttribute("data-invalid")).toBe("application-input");
    expect(valueInput).toHaveAttribute("aria-invalid", "true");

    root.removeAttribute("data-invalid");
    root.removeAttribute("aria-invalid");
    valueInput.removeAttribute("data-invalid");
    valueInput.removeAttribute("aria-invalid");
    picker.setOptions({ required: true });
    valueInput.value = "not-a-color";
    valueInput.dispatchEvent(new Event("input", { bubbles: true }));
    expect(valueInput).toHaveAttribute("data-invalid");

    picker.setDisabled(true);
    expect(root).not.toHaveAttribute("data-invalid");
    expect(valueInput).toHaveAttribute("data-invalid");
    expect(valueInput).toHaveAttribute("aria-invalid", "true");
    picker.setDisabled(false);
    picker.setValue("#00ff00", { emit: false });
    expect(root).not.toHaveAttribute("data-invalid");
    expect(valueInput.value).toBe("not-a-color");
    expect(valueInput).toHaveAttribute("data-invalid");

    picker.setOptions({ form: secondForm.id });
    expect(get<HTMLInputElement>(root, "[data-sw-color-picker-hidden-input]").form).toBe(
      secondForm,
    );
    picker.setValue(null, { emit: false });
    picker.setOptions({ required: false });
    expect(root).not.toHaveAttribute("data-invalid");
    expect(valueInput).toHaveAttribute("data-invalid");

    picker.setOptions({ required: true, form: firstForm.id });
    picker.setValue("#0000ff", { emit: false });
    firstForm.reset();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(root).not.toHaveAttribute("data-invalid");
    expect(valueInput.value).toBe("#ff0000");
    expect(valueInput).not.toHaveAttribute("data-invalid");
    expect(valueInput).toHaveAttribute("aria-invalid", "false");
  });

  it("refreshes draft validity baselines after reset, format, capability, and refresh clears", async () => {
    const clearCases: readonly {
      name: string;
      clear(form: HTMLFormElement, picker: ReturnType<typeof createColorPicker>): Promise<void>;
    }[] = [
      {
        name: "reset",
        clear: async (form: HTMLFormElement) => {
          form.reset();
          await new Promise((resolve) => setTimeout(resolve, 0));
        },
      },
      {
        name: "format",
        clear: async (_form: HTMLFormElement, picker: ReturnType<typeof createColorPicker>) => {
          picker.setFormat("rgb");
        },
      },
      {
        name: "capability",
        clear: async (_form: HTMLFormElement, picker: ReturnType<typeof createColorPicker>) => {
          picker.setOptions({ alpha: false });
        },
      },
      {
        name: "refresh",
        clear: async (_form: HTMLFormElement, picker: ReturnType<typeof createColorPicker>) => {
          picker.refresh();
        },
      },
    ];

    for (const [index, clearCase] of clearCases.entries()) {
      const form = document.createElement("form");
      form.dataset.clearCase = clearCase.name;
      const root = render();
      form.append(root);
      document.body.append(form);
      const picker = createColorPicker(root, { defaultValue: "#ff0000", allowEmpty: true });
      const input = get<HTMLInputElement>(root, "[data-sw-color-picker-value-input]");
      input.value = "first-invalid-draft";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      expect(input).toHaveAttribute("data-invalid");

      await clearCase.clear(form, picker);
      input.setAttribute("data-invalid", `field-${clearCase.name}`);
      input.setAttribute("aria-invalid", "true");

      input.value = index % 2 === 0 ? "second-invalid-draft" : "#00ff00";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          key: index % 2 === 0 ? "Escape" : "Enter",
        }),
      );
      expect(input.getAttribute("data-invalid")).toBe(`field-${clearCase.name}`);
      expect(input).toHaveAttribute("aria-invalid", "true");
      picker.destroy();
      form.remove();
    }
  });

  it("restores active draft validity and releases it when destroyed", () => {
    const root = render();
    document.body.append(root);
    const picker = createColorPicker(root, { defaultValue: "#ff0000" });
    const input = get<HTMLInputElement>(root, "[data-sw-color-picker-value-input]");
    input.setAttribute("data-invalid", "authored");
    input.setAttribute("aria-invalid", "true");
    input.value = "invalid-draft";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    picker.destroy();
    expect(input.getAttribute("data-invalid")).toBe("authored");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("creates one form control for nearest ownership and makes alpha-disabled values opaque", async () => {
    const form = document.createElement("form");
    document.body.append(form);
    const root = render();
    root.querySelectorAll("[data-sw-color-picker-hidden-input]").forEach((input) => input.remove());
    form.append(root);
    const changed = vi.fn();
    const committed = vi.fn();
    root.addEventListener("starwind:value-change", changed);
    root.addEventListener("starwind:value-committed", committed);
    const picker = createColorPicker(root, {
      defaultValue: "rgba(0, 0, 0, 0)",
      alpha: false,
      allowEmpty: true,
      required: true,
      name: "ink",
    });
    const hidden = get<HTMLInputElement>(root, "[data-sw-color-picker-hidden-input]");
    expect(hidden.form).toBe(form);
    expect(hidden.validity.valueMissing).toBe(false);
    expect(hidden.defaultValue).toBe("#000000");
    expect(picker.getValue()!.alpha).toBe(1);
    expect(new FormData(form).get("ink")).toBe("#000000");
    expect(root.style.getPropertyValue("--sw-color-picker-color")).toBe("#000000");
    picker.setOptions({ alpha: true });
    picker.setValue("rgba(255, 0, 0, 0.25)", { emit: false });
    picker.setOptions({ alpha: false });
    expect(picker.getValue()!.alpha).toBe(1);
    expect(new FormData(form).get("ink")).toBe("#ff0000");
    expect(changed).not.toHaveBeenCalled();
    const valueInput = get<HTMLInputElement>(root, "[data-sw-color-picker-value-input]");
    valueInput.value = "rgba(0, 0, 255, 0.2)";
    valueInput.dispatchEvent(new Event("input", { bubbles: true }));
    valueInput.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    expect(picker.getValue()!.alpha).toBe(1);
    expect((changed.mock.calls.at(-1)![0] as CustomEvent).detail.value.alpha).toBe(1);
    expect((committed.mock.calls.at(-1)![0] as CustomEvent).detail.value.alpha).toBe(1);
    expect(hidden.value).toBe("#0000ff");

    const translucent = document.createElement("button");
    translucent.type = "button";
    translucent.setAttribute("data-sw-color-picker-swatch", "");
    translucent.setAttribute("data-value", "rgba(0, 255, 0, 0.1)");
    root.append(translucent);
    picker.refresh();
    translucent.click();
    expect(picker.getValue()!.alpha).toBe(1);
    expect(translucent).toHaveAttribute("aria-pressed", "true");
    (window as Window & { EyeDropper?: unknown }).EyeDropper = class {
      open = vi.fn().mockResolvedValue({ sRGBHex: "#ff00ff" });
    };
    picker.refresh();
    get<HTMLButtonElement>(root, "[data-sw-color-picker-eye-dropper]").click();
    await vi.waitFor(() => expect(picker.getValue()!.rgb.blue).toBe(255));
    expect(picker.getValue()!.rgb.red).toBe(255);
    expect(picker.getValue()!.alpha).toBe(1);
  });

  it("keeps a dynamically disabled initial alpha snapshot opaque across reset", async () => {
    const form = document.createElement("form");
    document.body.append(form);
    const root = render();
    form.append(root);
    const picker = createColorPicker(root, {
      defaultValue: "rgba(255, 0, 0, 0.25)",
      name: "paint",
    });
    picker.setOptions({ alpha: false });
    expect(picker.getValue()!.alpha).toBe(1);
    form.reset();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const hidden = get<HTMLInputElement>(root, "[data-sw-color-picker-hidden-input]");
    expect(picker.getValue()!.alpha).toBe(1);
    expect(hidden.value).toBe("#ff0000");
    expect(hidden.defaultValue).toBe("#ff0000");
  });

  it("treats same-format setters as true no-ops for tracked drafts", () => {
    const root = render();
    const picker = createColorPicker(root);
    const value = get<HTMLInputElement>(root, "[data-sw-color-picker-value-input]");
    value.value = "bad";
    value.dispatchEvent(new Event("input", { bubbles: true }));
    picker.setFormat("hex");
    picker.setFormat("hex", { emit: false });
    expect(value.value).toBe("bad");
    value.dispatchEvent(new FocusEvent("blur", { bubbles: true }));
    expect(value.value).toBe("#000000");
  });

  it("keeps read-only fields focusable while rejecting every mutation surface", () => {
    const root = render();
    (window as Window & { EyeDropper?: unknown }).EyeDropper = class {
      open = vi.fn();
    };
    const picker = createColorPicker(root, {
      defaultValue: "#ff0000",
      allowEmpty: true,
      readOnly: true,
    });
    const value = get<HTMLInputElement>(root, "[data-sw-color-picker-value-input]");
    expect(value.disabled).toBe(false);
    expect(value.readOnly).toBe(true);
    value.focus();
    value.value = "#00ff00";
    value.dispatchEvent(new Event("input", { bubbles: true }));
    get<HTMLButtonElement>(root, '[data-sw-color-picker-swatch][data-value="#00ff00"]').click();
    get<HTMLButtonElement>(root, "[data-sw-color-picker-clear]").click();
    get<HTMLButtonElement>(root, "[data-sw-color-picker-eye-dropper]").click();
    expect(picker.getValueAsString()).toBe("#ff0000");
  });

  it("preserves authored disabled swatches through root state, refresh, and repeats", () => {
    const root = render();
    const picker = createColorPicker(root, { defaultValue: "#ff0000" });
    const green = get<HTMLButtonElement>(
      root,
      '[data-sw-color-picker-swatch][data-value="#00ff00"]',
    );
    green.disabled = true;
    picker.refresh();
    picker.setDisabled(true);
    picker.setDisabled(false);
    expect(green.disabled).toBe(true);
    green.disabled = false;
    picker.refresh();
    green.click();
    expect(picker.getValueAsString()).toBe("#00ff00");

    const dynamic = document.createElement("button");
    dynamic.type = "button";
    dynamic.disabled = true;
    dynamic.setAttribute("data-sw-color-picker-swatch", "");
    dynamic.setAttribute("data-value", "#0000ff");
    root.append(dynamic);
    picker.refresh();
    picker.refresh();
    dynamic.click();
    expect(picker.getValueAsString()).toBe("#00ff00");
  });

  it("invalidates stale and overlapping EyeDropper requests across lifecycle seams", async () => {
    const requests: Array<ReturnType<typeof deferred<{ sRGBHex: string }>>> = [];
    (window as Window & { EyeDropper?: unknown }).EyeDropper = class {
      open() {
        const request = deferred<{ sRGBHex: string }>();
        requests.push(request);
        return request.promise;
      }
    };
    const root = render();
    const picker = createColorPicker(root, { defaultValue: "rgba(255, 0, 0, 0.25)" });
    const trigger = get<HTMLButtonElement>(root, "[data-sw-color-picker-eye-dropper]");
    trigger.click();
    trigger.click();
    requests[0]!.resolve({ sRGBHex: "#00ff00" });
    await Promise.resolve();
    expect(picker.getValue()!.rgb.red).toBe(255);
    requests[1]!.resolve({ sRGBHex: "#0000ff" });
    await vi.waitFor(() => expect(picker.getValue()!.rgb.blue).toBe(255));
    expect(picker.getValue()!.alpha).toBeCloseTo(0.25);

    const form = document.createElement("form");
    document.body.append(form);
    form.append(root);
    picker.refresh();
    trigger.click();
    const resetRequest = requests.at(-1)!;
    form.reset();
    resetRequest.resolve({ sRGBHex: "#00ff00" });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(picker.getValue()!.rgb.red).toBe(255);

    for (const invalidate of [
      () => picker.refresh(),
      () => picker.setDisabled(true),
      () => {
        picker.setDisabled(false);
        picker.setReadOnly(true);
      },
    ]) {
      picker.setReadOnly(false);
      picker.setDisabled(false);
      trigger.click();
      const request = requests.at(-1)!;
      invalidate();
      request.resolve({ sRGBHex: "#00ff00" });
      await Promise.resolve();
      expect(picker.getValue()!.rgb.red).toBe(255);
    }
  });

  it("keeps canceled secondary proposals atomic and emits no commits", async () => {
    (window as Window & { EyeDropper?: unknown }).EyeDropper = class {
      open = vi.fn().mockResolvedValue({ sRGBHex: "#00ff00" });
    };
    const root = render();
    const commits = vi.fn();
    root.addEventListener("starwind:value-change", (event) => event.preventDefault());
    root.addEventListener("starwind:value-committed", commits);
    const picker = createColorPicker(root, {
      defaultValue: "#ff0000",
      allowEmpty: true,
      name: "c",
    });
    get<HTMLButtonElement>(root, '[data-sw-color-picker-swatch][data-value="#00ff00"]').click();
    get<HTMLButtonElement>(root, "[data-sw-color-picker-clear]").click();
    get<HTMLButtonElement>(root, "[data-sw-color-picker-eye-dropper]").click();
    await Promise.resolve();
    expect(picker.getValueAsString()).toBe("#ff0000");
    expect(get<HTMLInputElement>(root, "[data-sw-color-picker-hidden-input]").value).toBe(
      "#ff0000",
    );
    expect(
      get<HTMLButtonElement>(root, '[data-sw-color-picker-swatch][data-value="#ff0000"]'),
    ).toHaveAttribute("aria-pressed", "true");
    expect(commits).not.toHaveBeenCalled();
  });

  it("prunes detached drafts during a state-preserving structural refresh", () => {
    const root = render();
    const picker = createColorPicker(root, { defaultValue: "#ff0000" });
    const original = get<HTMLInputElement>(root, "[data-sw-color-picker-value-input]");
    original.value = "not-a-color";
    original.dispatchEvent(new Event("input", { bubbles: true }));
    expect(original).toHaveAttribute("aria-invalid", "true");

    original.remove();
    const replacement = document.createElement("input");
    replacement.setAttribute("data-sw-color-picker-value-input", "");
    root.append(replacement);
    picker.refresh({ preserveState: true });
    expect(replacement.value).toBe("#ff0000");
    expect(replacement).toHaveAttribute("aria-invalid", "false");

    original.removeAttribute("data-invalid");
    original.setAttribute("aria-invalid", "false");
    root.append(original);
    picker.refresh({ preserveState: true });
    expect(original.value).toBe("#ff0000");
    expect(original).toHaveAttribute("aria-invalid", "false");
  });
});

function render() {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `<div data-sw-color-picker>
    <div data-sw-color-picker-channel-slider data-channel="hue"><span data-sw-color-picker-channel-slider-thumb></span><input data-sw-color-picker-channel-input></div>
    <input data-sw-color-picker-value-input>
    <input data-sw-color-picker-channel-field data-channel="red">
    <input data-sw-color-picker-channel-field data-channel="green">
    <input data-sw-color-picker-channel-field data-channel="blue">
    <select data-sw-color-picker-format-select><option value="hex">hex</option><option value="rgb">rgb</option><option value="hsl">hsl</option><option value="hsb">hsb</option></select>
    <button type="button" data-sw-color-picker-swatch data-value="#ff0000">Red</button>
    <button type="button" data-sw-color-picker-swatch data-value="#00ff00">Green</button>
    <button type="button" data-sw-color-picker-clear>Clear</button>
    <button type="button" data-sw-color-picker-eye-dropper>Pick</button>
    <input data-sw-color-picker-hidden-input>
    <input data-sw-color-picker-hidden-input>
  </div>`;
  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}
function get<T extends Element>(root: ParentNode, selector: string) {
  return root.querySelector<T>(selector)!;
}

function appendCompositeFormatControl(
  root: HTMLElement,
  options: { defaultValue?: string; form?: string; name?: string; required?: boolean } = {},
) {
  const control = document.createElement("div");
  control.setAttribute("data-sw-color-picker-format-control", "");
  control.innerHTML = `<div data-sw-select ${options.defaultValue ? `data-default-value="${options.defaultValue}"` : ""} ${options.form ? `data-form="${options.form}"` : ""} ${options.name ? `data-name="${options.name}"` : ""} ${options.required ? "data-required" : ""}>
    <button type="button" data-sw-select-trigger><span data-sw-select-value></span></button>
    <input type="hidden" data-sw-select-input>
    <div data-sw-select-positioner><div data-sw-select-popup hidden><div data-sw-select-list>
      ${["hex", "rgb", "hsl", "hsb"].map((format) => `<div data-sw-select-item data-value="${format}"><span data-sw-select-item-text>${format.toUpperCase()}</span></div>`).join("")}
    </div></div></div>
  </div>`;
  root.append(control);
  return control.querySelector<HTMLElement>("[data-sw-select]")!;
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => (resolve = done));
  return { promise, resolve };
}
