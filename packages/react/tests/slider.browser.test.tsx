import type { SliderValue } from "@starwind-ui/runtime/slider";
import type * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Slider } from "../src/slider/index";

let reactRoot: Root | undefined;
let container: HTMLDivElement | undefined;

afterEach(async () => {
  if (reactRoot) await act(() => reactRoot?.unmount());
  container?.remove();
  reactRoot = undefined;
  container = undefined;
});

describe("React Slider late parent writes", () => {
  it.each([
    ["scalar", 40, 41],
    ["array", [30, 70], [31, 70]],
  ] as const)(
    "applies a later defined %s value as a silent command and keeps a later interaction",
    async (_, later, interacted) => {
      const onValueChange = vi.fn();
      const onValueCommitted = vi.fn();
      const slider = (value: SliderValue | undefined, name = "volume") => (
        <Slider.Root
          defaultValue={Array.isArray(later) ? [0, 100] : 0}
          // A fresh array on every render must count as the same input.
          value={Array.isArray(value) ? [...value] : value}
          name={name}
          onValueChange={onValueChange}
          onValueCommitted={onValueCommitted}
        >
          <Slider.Control>
            <Slider.Track>
              <Slider.Indicator />
            </Slider.Track>
            {(Array.isArray(later) ? later : [later]).map((_, index) => (
              <Slider.Thumb key={index} index={index} />
            ))}
          </Slider.Control>
        </Slider.Root>
      );

      await mount(slider(undefined));
      await render(slider(later as SliderValue));
      expect(shown()).toEqual(later);
      expect(onValueChange).not.toHaveBeenCalled();
      expect(onValueCommitted).not.toHaveBeenCalled();

      await act(() => {
        query<HTMLElement>("[data-sw-slider-thumb]").dispatchEvent(
          new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }),
        );
      });
      await flush();
      expect(shown()).toEqual(interacted);
      expect(onValueChange).toHaveBeenCalledOnce();

      // A stale parent input must not revert the accepted interaction.
      await render(slider(later as SliderValue, "volume-2"));
      expect(shown()).toEqual(interacted);

      // The same value after an undefined input differs from the last input, so it applies again.
      await render(slider(undefined, "volume-2"));
      expect(shown()).toEqual(interacted);
      await render(slider(later as SliderValue, "volume-2"));
      expect(shown()).toEqual(later);
      expect(onValueChange).toHaveBeenCalledOnce();
    },
  );
});

function shown(): SliderValue {
  const root = query<HTMLElement>("[data-sw-slider]");
  const values = [...root.querySelectorAll<HTMLElement>("[data-sw-slider-thumb]")].map((thumb) =>
    Number(thumb.getAttribute("aria-valuenow")),
  );
  const rendered = JSON.parse(root.getAttribute("data-value")!) as SliderValue;
  expect(Array.isArray(rendered) ? rendered : [rendered]).toEqual(values);
  return rendered;
}

async function mount(node: React.ReactNode) {
  container = document.createElement("div");
  document.body.append(container);
  reactRoot = createRoot(container);
  await render(node);
}

async function render(node: React.ReactNode) {
  await act(() => reactRoot!.render(node));
  await flush();
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

function query<T extends Element>(selector: string): T {
  return container!.querySelector<T>(selector)!;
}
