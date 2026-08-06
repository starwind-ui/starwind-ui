import { createApp, createSSRApp, h, nextTick, ref } from "vue";
import { renderToString } from "vue/server-renderer";
import { afterEach, describe, expect, it } from "vitest";

import { ColorPickerRoot, parseColor } from "@starwind-ui/vue/color-picker";
import { PopoverPopup, PopoverRoot, PopoverTrigger } from "@starwind-ui/vue/popover";
import {
  SelectItem,
  SelectItemText,
  SelectList,
  SelectPopup,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from "@starwind-ui/vue/select";
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

  it("acquires and releases value control without losing the accepted value", async () => {
    const value = ref<ReturnType<typeof parseColor> | undefined>(undefined);
    const updates: Array<ReturnType<typeof parseColor>> = [];
    const host = mountPicker(() => ({
      defaultValue: "#ff0000",
      modelValue: value.value,
      "onUpdate:modelValue": (next: ReturnType<typeof parseColor>) => updates.push(next),
    }));
    await settle();

    value.value = parseColor("#00ff00");
    await settle();
    expect(host.querySelector<HTMLElement>("[data-sw-color-picker]")!.dataset.value).toContain(
      "00ff00",
    );

    value.value = undefined;
    await settle();
    expect(host.querySelector<HTMLElement>("[data-sw-color-picker]")!.dataset.value).toContain(
      "00ff00",
    );
    host.querySelectorAll<HTMLButtonElement>("[data-sw-color-picker-swatch]")[0]!.click();
    await settle();

    expect(host.querySelector<HTMLElement>("[data-sw-color-picker]")!.dataset.value).toContain(
      "ff0000",
    );
    expect(updates.at(-1)?.toString("hex")).toBe("#ff0000");
  });

  it("acquires and releases format control with ordered detailed events", async () => {
    const format = ref<"hex" | "rgb" | undefined>(undefined);
    const events: string[] = [];
    const host = mountPicker(() => ({
      format: format.value,
      onFormatChange: (
        next: "hex" | "rgb" | "hsl" | "hsb",
        details: {
          previousFormat: "hex" | "rgb" | "hsl" | "hsb";
          reason: string;
        },
      ) => events.push(`formatChange:${details.previousFormat}->${next}:${details.reason}`),
      "onUpdate:format": (next: "hex" | "rgb" | "hsl" | "hsb") =>
        events.push(`update:format:${next}`),
    }));
    await settle();

    format.value = "rgb";
    await settle();
    const select = host.querySelector<HTMLSelectElement>("[data-sw-color-picker-format-select]")!;
    expect(select.value).toBe("rgb");

    format.value = undefined;
    await settle();
    expect(select.value).toBe("rgb");
    select.value = "hsl";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();

    expect(select.value).toBe("hsl");
    expect(events).toEqual(["formatChange:rgb->hsl:imperative-action", "update:format:hsl"]);
  });

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
