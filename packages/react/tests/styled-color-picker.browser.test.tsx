import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";

import ColorPicker from "../../../apps/react-demo/src/components/starwind-runtime/color-picker/ColorPicker";
import ColorPickerContent from "../../../apps/react-demo/src/components/starwind-runtime/color-picker/ColorPickerContent";
import ColorPickerInput from "../../../apps/react-demo/src/components/starwind-runtime/color-picker/ColorPickerInput";
import ColorPickerRoot from "../../../apps/react-demo/src/components/starwind-runtime/color-picker/ColorPickerRoot";
import ColorPickerSwatch from "../../../apps/react-demo/src/components/starwind-runtime/color-picker/ColorPickerSwatch";
import ColorPickerSwatchGroup from "../../../apps/react-demo/src/components/starwind-runtime/color-picker/ColorPickerSwatchGroup";
import ColorPickerTrigger from "../../../apps/react-demo/src/components/starwind-runtime/color-picker/ColorPickerTrigger";

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
        <ColorPickerRoot
          ref={ref}
          defaultValue="#ff0000"
          onValueChange={changed}
          onValueCommitted={committed}
        >
          <ColorPickerInput />
        </ColorPickerRoot>,
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

    expect(positioner.parentElement).toBe(root);
    expect(getComputedStyle(positioner).zIndex).toBe("60");

    await act(async () => userEvent.click(rgbItem));
    await settle();

    expect(root).toHaveAttribute("data-format", "rgb");
    expect(formatChanged).toHaveBeenCalledWith("rgb", expect.anything());
    expect(popoverTrigger).toHaveAttribute("aria-expanded", "true");
    expect(document.querySelector('[data-slot="popover-content"]')).not.toBeNull();
  });

  it("renders the canonical generated footer, icon, compact controls, and framed surfaces", async () => {
    await mount(
      <ColorPicker defaultValue="#ff000080" alpha allowEmpty>
        <ColorPickerTrigger showValueText>Choose color</ColorPickerTrigger>
        <ColorPickerContent
          size="sm"
          showClear
          swatches={
            <ColorPickerSwatchGroup aria-label="Suggested colors">
              <ColorPickerSwatch value="#4f46e5" aria-label="Indigo" />
            </ColorPickerSwatchGroup>
          }
        />
      </ColorPicker>,
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
    expect(eyeDropper.textContent).toBe("");
    expect(eyeDropper.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(formatTrigger.className).toContain("min-w-20");
    expect(area.className).toContain("border-outline");
    expect(area.className).not.toContain("overflow-hidden");
    expect(areaThumb.className).toContain("z-10");
    expect(areaThumb.className).toContain("clamp(1px");
    expect(slider.className).toContain("h-2.5");
    expect(sliderThumb.className).toContain("z-10");
  });

  it("projects derived editor controls and swatches at the sm, md, and lg scales", async () => {
    await mount(
      <>
        {(["sm", "md", "lg"] as const).map((size) => (
          <ColorPicker key={size} defaultValue="#4f46e5" defaultOpen>
            <ColorPickerTrigger>Choose {size}</ColorPickerTrigger>
            <ColorPickerContent
              size={size}
              data-testid={`size-content-${size}`}
              swatches={
                <ColorPickerSwatchGroup size={size} aria-label={`${size} suggested colors`}>
                  <ColorPickerSwatch size={size} value="#4f46e5" aria-label={`${size} indigo`} />
                </ColorPickerSwatchGroup>
              }
            />
          </ColorPicker>
        ))}
      </>,
    );

    const expected = {
      sm: { controlHeightClass: "h-9", selectorWidthClass: "min-w-20", swatchClass: "size-6" },
      md: { controlHeightClass: "h-9", selectorWidthClass: "min-w-20", swatchClass: "size-7" },
      lg: { controlHeightClass: "h-11", selectorWidthClass: "min-w-24", swatchClass: "size-8" },
    } as const;

    for (const size of ["sm", "md", "lg"] as const) {
      const content = query<HTMLElement>(`[data-testid="size-content-${size}"]`);
      const input = content.querySelector<HTMLInputElement>(
        '[data-slot="color-picker-value-input"]',
      )!;
      const select = content.querySelector<HTMLElement>(
        '[data-slot="color-picker-format-control"] [data-slot="select-trigger"]',
      )!;
      const swatch = content.querySelector<HTMLElement>('[data-slot="color-picker-swatch"]')!;

      expect(input.className).toContain(expected[size].controlHeightClass);
      expect(select.className).toContain(expected[size].controlHeightClass);
      expect(select.className).toContain(expected[size].selectorWidthClass);
      expect(swatch.className).toContain(expected[size].swatchClass);
    }
  });

  it("reconciles Clear and separator visibility when allowEmpty changes", async () => {
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
});

function clearEligibilityPicker(allowEmpty: boolean) {
  return (
    <ColorPicker defaultValue="#f97316" allowEmpty={allowEmpty} defaultOpen>
      <ColorPickerTrigger>Choose color</ColorPickerTrigger>
      <ColorPickerContent showClear showEyeDropper={false} />
    </ColorPicker>
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
