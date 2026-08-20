import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";

import ColorPicker from "../../../apps/react-demo/src/components/starwind-runtime/color-picker/ColorPicker";
import ColorPickerContent from "../../../apps/react-demo/src/components/starwind-runtime/color-picker/ColorPickerContent";
import ColorPickerInput from "../../../apps/react-demo/src/components/starwind-runtime/color-picker/ColorPickerInput";
import ColorPickerTrigger from "../../../apps/react-demo/src/components/starwind-runtime/color-picker/ColorPickerTrigger";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "../../../apps/react-demo/src/components/starwind-runtime/select";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let reactRoot: Root | undefined;
let container: HTMLDivElement | undefined;

afterEach(async () => {
  if (reactRoot) await act(() => reactRoot?.unmount());
  container?.remove();
  reactRoot = undefined;
  container = undefined;
});

describe("React styled Color Picker root", () => {
  it("shows each configured format in the nested Select before interaction", async () => {
    const examples = [
      { format: "hex", value: "#0ea5e9" },
      { format: "rgb", value: "rgb(14, 165, 233)" },
      { format: "hsl", value: "hsl(199.6 89.1% 48.4%)" },
      { format: "hsb", value: "hsb(199.6 94% 91.4%)" },
    ] as const;

    await mount(
      <>
        {examples.map(({ format, value }) => (
          <ColorPicker
            id={`format-${format}`}
            key={format}
            inline
            format={format}
            defaultValue={value}
          >
            <ColorPickerInput />
          </ColorPicker>
        ))}
      </>,
    );

    for (const { format } of examples) {
      const formatValue = query<HTMLElement>(
        `#format-${format} [data-slot="color-picker-format-control"] [data-slot="select-value"]`,
      );
      expect(formatValue).toHaveTextContent(format.toUpperCase());
    }
  });

  it("uses selected-value styling for the initial nested format", async () => {
    await mount(
      <>
        <ColorPicker id="styled-format" inline format="hex" defaultValue="#0ea5e9">
          <ColorPickerInput />
        </ColorPicker>
        <Select defaultValue="hex">
          <SelectTrigger aria-label="Reference format" />
          <SelectContent>
            <SelectItem value="hex">HEX</SelectItem>
          </SelectContent>
        </Select>
      </>,
    );

    const colorPickerTrigger = query<HTMLElement>(
      '#styled-format [data-slot="color-picker-format-control"] [data-slot="select-trigger"]',
    );
    const colorPickerValue = colorPickerTrigger.querySelector<HTMLElement>(
      '[data-slot="select-value"]',
    )!;
    const referenceTrigger = query<HTMLElement>('[aria-label="Reference format"]');
    const referenceValue = referenceTrigger.querySelector<HTMLElement>(
      '[data-slot="select-value"]',
    )!;

    await vi.waitFor(() => {
      expect(colorPickerValue).toHaveTextContent("HEX");
      expect(referenceValue).toHaveTextContent("HEX");
    });

    expect(colorPickerTrigger).not.toHaveAttribute("data-placeholder");
    expect(getComputedStyle(colorPickerValue).color).toBe(getComputedStyle(referenceValue).color);
  });

  it("mounts and edits without creating a Popover controller or page error", async () => {
    const changed = vi.fn();
    const committed = vi.fn();
    const ref = React.createRef<HTMLDivElement>();
    const consoleError = vi.spyOn(console, "error");
    const pageErrors: ErrorEvent[] = [];
    const recordPageError = (event: ErrorEvent) => pageErrors.push(event);
    window.addEventListener("error", recordPageError);

    try {
      await mount(
        <ColorPicker
          inline
          ref={ref}
          defaultValue="#ff0000"
          onValueChange={changed}
          onValueCommitted={committed}
        >
          <ColorPickerInput />
        </ColorPicker>,
      );

      const root = query<HTMLElement>("[data-sw-color-picker]");
      const input = query<HTMLInputElement>("[data-sw-color-picker-value-input]");
      expect(ref.current).toBe(root);
      expect(container!.querySelector("[data-sw-popover]")).toBeNull();
      expect(root).not.toHaveAttribute("data-floating-root");

      await act(() => {
        input.value = "rgb(0, 255, 0)";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
      });

      expect(root.getAttribute("data-value")).toBe("#00ff00");
      expect(changed).toHaveBeenCalled();
      expect(committed).toHaveBeenCalledOnce();
      expect(pageErrors).toEqual([]);
      expect(consoleError).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener("error", recordPageError);
      consoleError.mockRestore();
    }
  });

  it("routes popup DOM props and refs to the color-picker root while Popover controls opening", async () => {
    const clicked = vi.fn();
    const openChanged = vi.fn();
    const ref = React.createRef<HTMLDivElement>();

    await mount(
      <ColorPicker
        ref={ref}
        defaultValue="#ff0000"
        id="popup-picker"
        style={{ backgroundColor: "rgb(1, 2, 3)" }}
        data-routing="root-only"
        onClick={(event) => clicked(event.currentTarget)}
        onOpenChange={openChanged}
      >
        <ColorPickerTrigger>Choose color</ColorPickerTrigger>
        <ColorPickerContent>
          <span data-popup-content>Popup content</span>
        </ColorPickerContent>
      </ColorPicker>,
    );

    const root = query<HTMLElement>("[data-sw-color-picker]");
    const popoverRoot = query<HTMLElement>("[data-sw-popover]");
    const trigger = query<HTMLButtonElement>("[data-sw-popover-trigger]");

    expect(ref.current).toBe(root);
    expect(root).toHaveAttribute("id", "popup-picker");
    expect(root).toHaveAttribute("data-routing", "root-only");
    expect(root.style.backgroundColor).toBe("rgb(1, 2, 3)");
    expect(popoverRoot).not.toHaveAttribute("id");
    expect(popoverRoot).not.toHaveAttribute("data-routing");
    expect(popoverRoot.style.backgroundColor).toBe("");

    await act(() => popoverRoot.click());
    expect(clicked).not.toHaveBeenCalled();

    await act(() => trigger.click());
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(clicked).toHaveBeenCalledOnce();
    expect(clicked).toHaveBeenCalledWith(root);
    expect(openChanged).toHaveBeenCalledWith(true, expect.anything());
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(document.querySelector("[data-popup-content]")).not.toBeNull();
  });

  it("keeps the parent Popover open while real nested Select clicks change format", async () => {
    const formatChanged = vi.fn();

    await mount(
      <ColorPicker defaultValue="#ff0000" onFormatChange={formatChanged}>
        <ColorPickerTrigger>Choose color</ColorPickerTrigger>
        <ColorPickerContent />
      </ColorPicker>,
    );

    const root = query<HTMLElement>("[data-sw-color-picker]");
    const popoverTrigger = query<HTMLButtonElement>("[data-sw-popover-trigger]");

    await act(async () => userEvent.click(popoverTrigger));
    await settle();

    const selectTrigger = query<HTMLButtonElement>(
      '[data-slot="color-picker-format-control"] [data-slot="select-trigger"]',
    );
    expect(popoverTrigger).toHaveAttribute("aria-expanded", "true");

    await act(async () => userEvent.click(selectTrigger));
    await settle();

    const options = query<HTMLElement>("[data-sw-color-picker-format-options]");
    const positioner = options.closest<HTMLElement>('[data-slot="select-positioner"]')!;
    const rgbItem = [...options.querySelectorAll<HTMLElement>('[data-slot="select-item"]')].find(
      (item) => item.textContent?.trim() === "RGB",
    )!;

    expect(positioner.parentElement).toHaveAttribute("data-sw-select-portal");
    expect(positioner.parentElement?.parentElement).toBe(root);
    expect(positioner).toHaveAttribute("data-state", "open");

    await act(async () => userEvent.click(rgbItem));
    await settle();

    expect(root).toHaveAttribute("data-format", "rgb");
    expect(formatChanged).toHaveBeenCalledWith("rgb", expect.anything());
    expect(popoverTrigger).toHaveAttribute("aria-expanded", "true");
    expect(document.querySelector('[data-slot="popover-content"]')).not.toBeNull();
  });

  it("renders the canonical generated footer, icon, compact controls, and framed surfaces", async () => {
    await mount(
      <ColorPicker
        defaultValue="#ff000080"
        clearable
        size="sm"
        swatches={[{ value: "#4f46e5", label: "Indigo" }]}
      />,
    );

    await act(async () => userEvent.click(query("[data-sw-popover-trigger]")));
    await settle();

    const content = query<HTMLElement>('[data-slot="popover-content"]');
    const eyeDropper = query<HTMLButtonElement>('[data-slot="color-picker-eye-dropper"]');
    const area = query<HTMLElement>('[data-slot="color-picker-area"]');
    const areaThumb = query<HTMLElement>('[data-slot="color-picker-area-thumb"]');
    const slider = query<HTMLElement>('[data-slot="color-picker-channel-slider"]');
    const sliderThumb = query<HTMLElement>('[data-slot="color-picker-channel-slider-thumb"]');
    const formatTrigger = query<HTMLElement>(
      '[data-slot="color-picker-format-control"] [data-slot="select-trigger"]',
    );
    const clear = query<HTMLButtonElement>('[data-slot="color-picker-clear"]');
    const footer = query<HTMLElement>('[data-slot="color-picker-footer"]');

    expect(content.querySelector('[data-slot="color-picker-separator"]')).not.toBeNull();
    expect(content.querySelector('[data-slot="color-picker-swatch-group"]')).not.toBeNull();
    expect(footer.lastElementChild).toBe(clear);
    expect(clear).not.toHaveAttribute("hidden");
    expect(eyeDropper).toHaveAccessibleName("Pick a color from the screen");
    if (!("EyeDropper" in window)) expect(eyeDropper).toHaveAttribute("hidden");
    expect(eyeDropper.textContent).toBe("");
    expect(eyeDropper.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(content).toHaveAttribute("data-size", "sm");
    expect(formatTrigger.className).toContain("min-w-(--sw-color-picker-format-width)");
    expect(area.className).toContain("border-outline");
    expect(area.className).not.toContain("overflow-hidden");
    expect(areaThumb.className).toContain("z-10");
    expect(areaThumb.className).toContain("clamp(1px");
    expect(slider.className).toContain("h-(--sw-color-picker-slider-size)");
    expect(sliderThumb.className).toContain("z-10");
  });

  it("projects derived editor controls and swatches at the sm, md, and lg scales", async () => {
    await mount(
      <>
        {(["sm", "md", "lg"] as const).map((size) => (
          <ColorPicker key={size} defaultValue="#4f46e5" defaultOpen size={size}>
            <ColorPickerTrigger>Choose {size}</ColorPickerTrigger>
            <ColorPickerContent
              size={size}
              data-testid={`size-content-${size}`}
              swatches={[{ value: "#4f46e5", label: `${size} indigo` }]}
            />
          </ColorPicker>
        ))}
      </>,
    );

    for (const size of ["sm", "md", "lg"] as const) {
      const content = query<HTMLElement>(`[data-testid="size-content-${size}"]`);
      const input = content.querySelector<HTMLInputElement>(
        '[data-slot="color-picker-value-input"]',
      )!;
      const select = content.querySelector<HTMLElement>(
        '[data-slot="color-picker-format-control"] [data-slot="select-trigger"]',
      )!;
      const swatch = content.querySelector<HTMLElement>('[data-slot="color-picker-swatch"]')!;

      expect(content).toHaveAttribute("data-size", size);
      expect(input.className).toContain("h-(--sw-color-picker-control-height)");
      expect(select.className).toContain("h-(--sw-color-picker-control-height)");
      expect(select.className).toContain("min-w-(--sw-color-picker-format-width)");
      expect(swatch.className).toContain("size-(--sw-color-picker-swatch-size)");
    }
  });

  it("reconciles Clear and separator visibility when clearable changes", async () => {
    await mount(clearEligibilityPicker(false));

    const clear = query<HTMLButtonElement>('[data-slot="color-picker-clear"]');
    const separator = query<HTMLElement>('[data-slot="color-picker-separator"]');
    expect(clear).toHaveAttribute("hidden");
    expect(clear).toBeDisabled();
    expect(getComputedStyle(separator).display).toBe("none");

    await act(() => reactRoot!.render(clearEligibilityPicker(true)));
    await settle();
    await vi.waitFor(() => {
      expect(clear).not.toHaveAttribute("hidden");
      expect(clear).not.toBeDisabled();
      expect(getComputedStyle(separator).display).not.toBe("none");
    });

    await act(() => reactRoot!.render(clearEligibilityPicker(false)));
    await settle();
    await vi.waitFor(() => {
      expect(clear).toHaveAttribute("hidden");
      expect(clear).toBeDisabled();
      expect(getComputedStyle(separator).display).toBe("none");
    });
  });

  it("renders zero-child popup and inline editors with normalized convenience props", async () => {
    await mount(
      <>
        <ColorPicker
          id="zero-popup"
          defaultOpen
          label="Brand color"
          name="brand"
          defaultValue="hsl(210, 50%, 40%)"
          format="hsl"
          formats={["rgb", "rgb"]}
          formatControl="native"
          alpha={false}
          showEyeDropper={false}
          swatches={["#111111", { value: "#222222", label: "Second color", disabled: true }]}
        />
        <ColorPicker
          id="zero-inline"
          inline
          label="Inline color"
          defaultValue="#33669980"
          formatControl="none"
        />
        <ColorPicker id="custom-children" inline defaultValue="#ff0000">
          <span data-custom-child>Custom editor</span>
        </ColorPicker>
      </>,
    );

    const popup = query<HTMLElement>("#zero-popup");
    const inline = query<HTMLElement>("#zero-inline");
    const custom = query<HTMLElement>("#custom-children");
    const native = popup.querySelector<HTMLSelectElement>(
      '[data-slot="color-picker-native-format-select"]',
    )!;
    const nativeValues = [...native.options].map((option) => option.value);
    const popupAlpha = popup.querySelector<HTMLElement>(
      '[data-slot="color-picker-channel-slider"][data-channel="alpha"]',
    )!;
    const inlineAlpha = inline.querySelector<HTMLElement>(
      '[data-slot="color-picker-channel-slider"][data-channel="alpha"]',
    )!;
    const swatches = popup.querySelectorAll<HTMLButtonElement>('[data-slot="color-picker-swatch"]');

    expect(popup.querySelector('[data-slot="color-picker-label"]')).toHaveTextContent(
      "Brand color",
    );
    expect(nativeValues).toEqual(["hsl", "rgb"]);
    expect(popup.querySelector('[data-slot="color-picker-format-control"]')).toBeNull();
    expect(popupAlpha).toHaveAttribute("hidden");
    expect(popup.querySelector('[data-slot="color-picker-eye-dropper"]')).toBeNull();
    expect(swatches).toHaveLength(2);
    expect(swatches[0]).toHaveAccessibleName("#111111");
    expect(swatches[1]).toHaveAccessibleName("Second color");
    expect(swatches[1]).toBeDisabled();
    expect(popup.querySelectorAll('[data-slot="color-picker-hidden-input"]')).toHaveLength(1);

    expect(inline.querySelector('[data-slot="color-picker-area"]')).not.toBeNull();
    expect(inlineAlpha).not.toHaveAttribute("hidden");
    expect(inline.querySelector('[data-slot="color-picker-format-control"]')).toBeNull();
    expect(inline.querySelector('[data-slot="color-picker-native-format-select"]')).toBeNull();
    expect(inline.querySelectorAll('[data-slot="color-picker-hidden-input"]')).toHaveLength(1);

    expect(custom.querySelector("[data-custom-child]")).toHaveTextContent("Custom editor");
    expect(custom.querySelector('[data-slot="color-picker-area"]')).toBeNull();
    expect(custom.querySelectorAll('[data-slot="color-picker-hidden-input"]')).toHaveLength(1);
  });

  it("clears required form state and restores the initial value on reset", async () => {
    await mount(
      <form id="palette-form">
        <ColorPicker
          id="form-picker"
          inline
          name="accent"
          defaultValue="#0ea5e9"
          clearable
          required
          showEyeDropper={false}
        />
      </form>,
    );

    const form = query<HTMLFormElement>("#palette-form");
    const root = query<HTMLElement>("#form-picker");
    const hidden = root.querySelector<HTMLInputElement>('[data-slot="color-picker-hidden-input"]')!;
    const clear = root.querySelector<HTMLButtonElement>('[data-slot="color-picker-clear"]')!;

    expect(hidden.value).toBe("#0ea5e9");
    expect(hidden.checkValidity()).toBe(true);

    await act(async () => userEvent.click(clear));
    await settle();
    expect(root).toHaveAttribute("data-invalid");
    expect(hidden.value).toBe("");
    expect(hidden.checkValidity()).toBe(false);

    await act(() => form.reset());
    await settle();
    expect(root).not.toHaveAttribute("data-invalid");
    expect(hidden.value).toBe("#0ea5e9");
    expect(hidden.checkValidity()).toBe(true);
  });

  it("keeps controlled values and formats synchronized through the styled root", async () => {
    await mount(
      <ColorPicker
        id="controlled-styled"
        inline
        value="#ff0000"
        format="rgb"
        formats={["hex"]}
        formatControl="native"
      />,
    );

    const root = query<HTMLElement>("#controlled-styled");
    const options = () =>
      [...root.querySelectorAll<HTMLOptionElement>("option")].map((option) => option.value);
    expect(root).toHaveAttribute("data-value", "rgb(255, 0, 0)");
    expect(root).toHaveAttribute("data-format", "rgb");
    expect(options()).toEqual(["rgb", "hex"]);

    await act(() =>
      reactRoot!.render(
        <ColorPicker
          id="controlled-styled"
          inline
          value="#00ff00"
          format="hsl"
          formats={["hex"]}
          formatControl="native"
        />,
      ),
    );
    await settle();

    expect(root).toHaveAttribute("data-value", "hsl(120, 100%, 50%)");
    expect(root).toHaveAttribute("data-format", "hsl");
    expect(options()).toEqual(["hsl", "hex"]);
  });
});

function clearEligibilityPicker(clearable: boolean) {
  return (
    <ColorPicker defaultValue="#f97316" clearable={clearable} defaultOpen showEyeDropper={false} />
  );
}

async function mount(node: React.ReactNode) {
  container = document.createElement("div");
  document.body.append(container);
  reactRoot = createRoot(container);
  await act(() => reactRoot!.render(node));
  await settle();
}

async function settle() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

function query<T extends Element>(selector: string): T {
  return container!.querySelector<T>(selector)!;
}
