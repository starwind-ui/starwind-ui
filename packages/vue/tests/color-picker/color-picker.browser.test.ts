import {
  ColorPickerFormatControl,
  ColorPickerFormatSelect,
  ColorPickerRoot,
  parseColor,
} from "@starwind-ui/vue/color-picker";
import {
  PopoverPopup,
  PopoverPortal,
  PopoverPositioner,
  PopoverRoot,
  PopoverTrigger,
} from "@starwind-ui/vue/popover";
import {
  SelectItem,
  SelectItemText,
  SelectList,
  SelectPopup,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from "@starwind-ui/vue/select";
import { afterEach, describe, expect, it } from "vitest";
import { createApp, createSSRApp, h, nextTick, ref } from "vue";
import { renderToString } from "vue/server-renderer";
import { testAcceptedModelPublication } from "../accepted-model-publication.js";
import { colorPickerChildren } from "./tree.js";

const cleanups: Array<() => void> = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  document.body.innerHTML = "";
});

describe("Vue Color Picker public behavior", () => {
  it("hydrates once without warnings and remains interactive", async () => {
    const tree = () => h(ColorPickerRoot, { defaultValue: "#ff0000" }, colorPickerChildren);
    const html = await renderToString(createSSRApp({ render: tree }));
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.append(host);
    const warnings: string[] = [];
    const app = createSSRApp({ render: tree });
    app.config.warnHandler = (message) => warnings.push(message);
    app.mount(host);
    cleanups.push(() => app.unmount());
    await settle();

    expect(warnings).toEqual([]);
    expect(host.querySelectorAll("[data-sw-color-picker]")).toHaveLength(1);
    host.querySelectorAll<HTMLButtonElement>("[data-sw-color-picker-swatch]")[1]!.click();
    await settle();
    expect(host.querySelector<HTMLElement>("[data-sw-color-picker]")!.dataset.value).toContain(
      "00ff00",
    );
  });

  it("bridges value and format models with detailed events", async () => {
    const value = ref(parseColor("#ff0000"));
    const format = ref<"hex" | "rgb">("hex");
    const details: string[] = [];
    const host = mountPicker(() => ({
      format: format.value,
      modelValue: value.value,
      onFormatChange: (_next: unknown, detail: { reason: string }) => details.push(detail.reason),
      onValueChange: (_next: unknown, detail: { reason: string }) => details.push(detail.reason),
      "onUpdate:format": (next: "hex" | "rgb") => (format.value = next),
      "onUpdate:modelValue": (next: NonNullable<typeof value.value>) => (value.value = next),
    }));
    await settle();

    const select = host.querySelector<HTMLSelectElement>("[data-sw-color-picker-format-select]")!;
    select.value = "rgb";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(format.value).toBe("rgb");
    expect(details.length).toBeGreaterThan(0);

    const hue = host.querySelector<HTMLInputElement>(
      '[data-sw-color-picker-channel-input][aria-label="hue"]',
    )!;
    hue.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
    await settle();
    expect(value.value?.hsb.hue).toBe(1);
  });

  it("keeps portaled format controls inside their authored floating owner", async () => {
    const format = ref<"hex" | "rgb">("hex");
    const events: string[] = [];
    const host = document.createElement("div");
    document.body.append(host);
    const app = createApp({
      render: () =>
        h(PopoverRoot, { defaultOpen: true }, () =>
          h(
            ColorPickerRoot,
            {
              "data-floating-root": "",
              defaultValue: "#ff0000",
              format: format.value,
              onFormatChange: (next: "hex" | "rgb", detail: { format: "hex" | "rgb" }) =>
                events.push(`formatChange:${next}:${detail.format}`),
              "onUpdate:format": (next: "hex" | "rgb") => {
                events.push(`update:format:${next}`);
                format.value = next;
              },
            },
            () => [
              h(PopoverTrigger, null, () => "Open color picker"),
              h(PopoverPortal, null, () =>
                h(PopoverPositioner, null, () =>
                  h(PopoverPopup, null, () =>
                    h(ColorPickerFormatControl, null, () =>
                      h(ColorPickerFormatSelect, null, () => [
                        h("option", { value: "hex" }, "Hex"),
                        h("option", { value: "rgb" }, "RGB"),
                      ]),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await settle();

    const root = host.querySelector<HTMLElement>("[data-sw-color-picker]")!;
    const portal = document.querySelector<HTMLElement>("[data-sw-popover-portal]")!;
    const select = portal.querySelector<HTMLSelectElement>("[data-sw-color-picker-format-select]")!;
    expect(portal.parentElement).toBe(root);

    select.value = "rgb";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();

    expect(format.value).toBe("rgb");
    expect(events).toEqual(["formatChange:rgb:rgb", "update:format:rgb"]);
  });

  for (const controlled of [false, true]) {
    it(`keeps initial ${controlled ? "parent" : "Runtime"} value ownership after later defined and undefined props`, async () => {
      const value = ref<ReturnType<typeof parseColor> | undefined>(
        controlled ? parseColor("#0000ff") : undefined,
      );
      const updates: Array<ReturnType<typeof parseColor>> = [];
      let accept = false;
      const host = mountPicker(() => ({
        defaultValue: "#0000ff",
        modelValue: value.value,
        "onUpdate:modelValue": (next: ReturnType<typeof parseColor>) => {
          updates.push(next);
          if (accept) value.value = next;
        },
      }));
      await settle();
      const root = host.querySelector<HTMLElement>("[data-sw-color-picker]")!;
      const swatch = host.querySelectorAll<HTMLButtonElement>("[data-sw-color-picker-swatch]")[0]!;
      value.value = parseColor("#00ff00");
      await settle();
      expect(root.dataset.value).toContain(controlled ? "00ff00" : "0000ff");
      value.value = undefined;
      await settle();
      expect(root.dataset.value).toContain(controlled ? "00ff00" : "0000ff");
      swatch.click();
      await settle();
      expect(root.dataset.value).toContain(controlled ? "00ff00" : "ff0000");
      expect(updates.at(-1)?.toString("hex")).toBe("#ff0000");
      accept = true;
      swatch.click();
      await settle();
      expect(root.dataset.value).toContain("ff0000");
    });

    it(`keeps initial ${controlled ? "parent" : "Runtime"} format ownership independently`, async () => {
      const format = ref<"hex" | "rgb" | "hsl" | "hsb" | undefined>(controlled ? "hex" : undefined);
      const updates: string[] = [];
      let accept = false;
      const host = mountPicker(() => ({
        modelValue: "#0000ff",
        format: format.value,
        "onUpdate:format": (next: "hex" | "rgb" | "hsl" | "hsb") => {
          updates.push(next);
          if (accept) format.value = next;
        },
      }));
      await settle();
      const select = host.querySelector<HTMLSelectElement>("[data-sw-color-picker-format-select]")!;
      format.value = "rgb";
      await settle();
      expect(select.value).toBe(controlled ? "rgb" : "hex");
      format.value = undefined;
      await settle();
      expect(select.value).toBe(controlled ? "rgb" : "hex");
      select.value = "hsl";
      select.dispatchEvent(new Event("change", { bubbles: true }));
      await settle();
      expect(select.value).toBe(controlled ? "rgb" : "hsl");
      expect(updates).toEqual(["hsl"]);
      accept = true;
      select.value = "hsb";
      select.dispatchEvent(new Event("change", { bubbles: true }));
      await settle();
      expect(select.value).toBe("hsb");
    });
  }

  it("uses Runtime geometry and cancellation without accepting a canceled draft", async () => {
    const reasons: string[] = [];
    const host = mountPicker({
      defaultValue: "hsb(0, 0%, 0%)",
      onValueChange: (_value: unknown, details: { cancel(): void; reason: string }) => {
        reasons.push(details.reason);
        details.cancel();
      },
    });
    await settle();
    const area = host.querySelector<HTMLElement>("[data-sw-color-picker-area]")!;
    area.getBoundingClientRect = () => new DOMRect(0, 0, 100, 100);
    area.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        buttons: 1,
        clientX: 75,
        clientY: 25,
        pointerId: 1,
      }),
    );
    document.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, clientX: 75, clientY: 25, pointerId: 1 }),
    );
    await settle();
    expect(reasons).toContain("area-drag");
    expect(host.querySelector<HTMLElement>("[data-sw-color-picker]")!.dataset.value).toBe(
      "#000000",
    );
  });

  it("preserves form submission and reset while reflecting capability state", async () => {
    const form = document.createElement("form");
    document.body.append(form);
    const mounted = mountPickerApp({ defaultValue: "#ff0000", name: "accent" }, form);
    await settle();
    const swatches = mounted.host.querySelectorAll<HTMLButtonElement>(
      "[data-sw-color-picker-swatch]",
    );
    swatches[1]!.click();
    await settle();
    expect(new FormData(form).get("accent")).toContain("00ff00");
    form.reset();
    await settle();
    expect(new FormData(form).get("accent")).toContain("ff0000");
    const eyeDropper = mounted.host.querySelector<HTMLElement>(
      "[data-sw-color-picker-eye-dropper]",
    )!;
    expect(
      eyeDropper.hidden || eyeDropper.hasAttribute("data-unsupported") || "EyeDropper" in window,
    ).toBe(true);
  });

  it("isolates instances and survives unmount and remount", async () => {
    const first = mountPickerApp({ allowEmpty: true, defaultValue: "#ff0000" });
    const second = mountPicker({ defaultValue: "#0000ff" });
    await settle();
    first.host.querySelector<HTMLButtonElement>("[data-sw-color-picker-clear]")!.click();
    await settle();
    expect(first.host.querySelector<HTMLElement>("[data-sw-color-picker]")!.dataset.value).toBe("");
    expect(second.querySelector<HTMLElement>("[data-sw-color-picker]")!.dataset.value).toContain(
      "0000ff",
    );
    first.app.unmount();
    cleanups.pop();
    const remounted = mountPicker({ defaultValue: "#00ff00" });
    await settle();
    expect(remounted.querySelector<HTMLElement>("[data-sw-color-picker]")!.dataset.value).toContain(
      "00ff00",
    );
  });

  it("keeps nested Popover and Select primitives independently operable", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const app = createApp({
      render: () =>
        h(ColorPickerRoot, { defaultValue: "#ff0000" }, () => [
          ...colorPickerChildren(),
          h(PopoverRoot, null, () => [
            h(PopoverTrigger, null, () => "More colors"),
            h(PopoverPopup, null, () => "Palette"),
          ]),
          h(SelectRoot, { defaultValue: "hex" }, () => [
            h(SelectTrigger, null, () => h(SelectValue)),
            h(SelectPopup, null, () =>
              h(SelectList, null, () =>
                h(SelectItem, { value: "rgb" }, () => h(SelectItemText, null, () => "RGB")),
              ),
            ),
          ]),
        ]),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await settle();

    host.querySelector<HTMLButtonElement>("[data-sw-popover-trigger]")!.click();
    await settle();
    expect(host.querySelector<HTMLElement>("[data-sw-popover]")!.dataset.state).toBe("open");
    expect(host.querySelector<HTMLElement>("[data-sw-color-picker]")!.dataset.value).toContain(
      "ff0000",
    );
    expect(host.querySelector("[data-sw-select]")).not.toBeNull();
  });
});

function mountPicker(props: Record<string, unknown> | (() => Record<string, unknown>)) {
  return mountPickerApp(props).host;
}

function mountPickerApp(
  props: Record<string, unknown> | (() => Record<string, unknown>),
  parent: HTMLElement = document.body,
) {
  const host = document.createElement("div");
  parent.append(host);
  const app = createApp({
    render: () =>
      h(ColorPickerRoot, typeof props === "function" ? props() : props, colorPickerChildren),
  });
  app.mount(host);
  cleanups.push(() => app.unmount());
  return { app, host };
}

async function settle(): Promise<void> {
  await nextTick();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await nextTick();
}

testAcceptedModelPublication({
  name: "Color Picker",
  model: "modelValue",
  proposal: "onValueChange",
  domEvent: "starwind:value-change",
  initial: "#ff0000",
  accepted: "#00ff00",
  tree: () => h(ColorPickerRoot, { defaultValue: "#ff0000", name: "color" }, colorPickerChildren),
  root: "[data-sw-color-picker]",
  act: (root) => root.querySelectorAll<HTMLElement>("[data-sw-color-picker-swatch]")[1]!.click(),
  normalize: (value) => (value as ReturnType<typeof parseColor>)!.toString("hex"),
  read: (root) =>
    root.querySelector<HTMLInputElement>("[data-sw-color-picker-hidden-input]")!.value,
});

it("keeps current parent-controlled color and format through native form reset", async () => {
  const form = document.createElement("form");
  document.body.append(form);
  const value = ref("#ff0000");
  const format = ref<"hex" | "rgb">("hex");
  const updates: unknown[] = [];
  const { host, app } = mountPickerApp(
    () => ({
      modelValue: value.value,
      format: format.value,
      name: "accent",
      "onUpdate:modelValue": (next: unknown) => updates.push(next),
    }),
    form,
  );
  await settle();
  value.value = "#00ff00";
  format.value = "rgb";
  await settle();
  form.reset();
  await settle();
  expect(
    parseColor(host.querySelector<HTMLElement>("[data-sw-color-picker]")!.dataset.value!)?.toString(
      "hex",
    ),
  ).toBe("#00ff00");
  expect(host.querySelector<HTMLElement>("[data-sw-color-picker]")!.dataset.format).toBe("rgb");
  expect(new FormData(form).get("accent")).toContain("0, 255, 0");
  expect(updates).toEqual([]);
  form.addEventListener("reset", (event) => event.preventDefault(), { once: true });
  form.reset();
  value.value = "#0000ff";
  await settle();
  expect(
    parseColor(host.querySelector<HTMLElement>("[data-sw-color-picker]")!.dataset.value!)?.toString(
      "hex",
    ),
  ).toBe("#0000ff");
  form.reset();
  app.unmount();
  cleanups.pop();
  await settle();
  expect(host.children).toHaveLength(0);
  expect(updates).toEqual([]);
});

it("restores canceled uncontrolled resets without undoing a newer accepted interaction", async () => {
  const form = document.createElement("form");
  document.body.append(form);
  const { host } = mountPickerApp({ defaultValue: "#0000ff" }, form);
  await settle();
  const swatches = host.querySelectorAll<HTMLButtonElement>("[data-sw-color-picker-swatch]");
  swatches[1]!.click();
  await settle();
  form.addEventListener("reset", (event) => event.preventDefault());
  form.reset();
  await settle();
  expect(
    parseColor(host.querySelector<HTMLElement>("[data-sw-color-picker]")!.dataset.value!)?.toString(
      "hex",
    ),
  ).toBe("#00ff00");
  form.reset();
  swatches[0]!.click();
  await settle();
  expect(host.querySelector<HTMLElement>("[data-sw-color-picker]")!.dataset.value).toContain(
    "ff0000",
  );
});

it("treats initial null as controlled when empty colors are allowed", async () => {
  const value = ref<ReturnType<typeof parseColor>>(null);
  let accept = false;
  const host = mountPicker(() => ({
    allowEmpty: true,
    modelValue: value.value,
    "onUpdate:modelValue": (next: ReturnType<typeof parseColor>) => {
      if (accept) value.value = next;
    },
  }));
  await settle();
  const root = host.querySelector<HTMLElement>("[data-sw-color-picker]")!;
  const swatch = host.querySelector<HTMLButtonElement>("[data-sw-color-picker-swatch]")!;
  swatch.click();
  await settle();
  expect(root.dataset.value).toBe("");
  accept = true;
  swatch.click();
  await settle();
  expect(root.dataset.value).toContain("ff0000");
});

it.each(["value", "format"])(
  "keeps the untouched model after canceled reset and a newer %s change",
  async (model) => {
    const form = document.createElement("form");
    document.body.append(form);
    const { host } = mountPickerApp({ defaultValue: "#0000ff", name: "accent" }, form);
    await settle();
    const select = host.querySelector<HTMLSelectElement>("select")!;
    const swatches = host.querySelectorAll<HTMLButtonElement>("[data-sw-color-picker-swatch]");
    const changeFormat = (format: string) => {
      select.value = format;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    };
    swatches[1]!.click();
    changeFormat("hsl");
    await settle();
    form.addEventListener("reset", (event) => event.preventDefault());
    form.reset();
    if (model === "value") swatches[0]!.click();
    else changeFormat("rgb");
    await settle();
    expect(
      parseColor(
        host.querySelector<HTMLElement>("[data-sw-color-picker]")!.dataset.value!,
      )?.toString("hex"),
    ).toBe(model === "value" ? "#ff0000" : "#00ff00");
    expect(select.value).toBe(model === "value" ? "hsl" : "rgb");
    expect(parseColor(String(new FormData(form).get("accent")))?.toString("hex")).toBe(
      model === "value" ? "#ff0000" : "#00ff00",
    );
  },
);
it.each(["invalid", null])(
  "keeps the last valid controlled color after rejected input %s and reset",
  async (invalid) => {
    const form = document.createElement("form");
    document.body.append(form);
    const value = ref<string | null>("#ff0000");
    const { host } = mountPickerApp(() => ({ modelValue: value.value, name: "accent" }), form);
    await settle();
    value.value = "#00ff00";
    await settle();
    value.value = invalid;
    await settle();
    expect(host.querySelector<HTMLElement>("[data-sw-color-picker]")!.dataset.value).toContain(
      "00ff00",
    );
    form.reset();
    await settle();
    expect(host.querySelector<HTMLElement>("[data-sw-color-picker]")!.dataset.value).toContain(
      "00ff00",
    );
    value.value = "#0000ff";
    await settle();
    form.reset();
    value.value = invalid;
    await settle();
    expect(host.querySelector<HTMLElement>("[data-sw-color-picker]")!.dataset.value).toContain(
      "0000ff",
    );
  },
);
