import * as React from "react";
import { act } from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Radio } from "../../src/radio";
import { RadioGroup } from "../../src/radio-group";

let reactRoot: Root | undefined;
let container: HTMLDivElement | undefined;

afterEach(async () => {
  if (reactRoot) await act(() => reactRoot?.unmount());
  container?.remove();
  reactRoot = undefined;
  container = undefined;
});

describe("React controlled Radio Group keyboard focus", () => {
  it("moves focus before the value prop reconciles without duplicate publication", async () => {
    const onValueChange = vi.fn();
    function ControlledRadioGroup() {
      const [value, setValue] = React.useState("ssd");
      return (
        <RadioGroup.Root
          name="storage"
          value={value}
          onValueChange={(nextValue) => {
            onValueChange(nextValue);
            setValue(nextValue);
          }}
        >
          <Radio.Root value="ssd" />
          <Radio.Root value="hdd" />
        </RadioGroup.Root>
      );
    }
    await mount(<ControlledRadioGroup />);
    const radios = queryAll<HTMLElement>("[data-sw-radio]");
    radios[0]?.focus();
    let activeAfterDispatch: Element | null = null;
    let valueAfterDispatch: string | null = null;

    await act(() => {
      radios[0]?.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          cancelable: true,
          key: "ArrowDown",
        }),
      );
      activeAfterDispatch = document.activeElement;
      valueAfterDispatch = query<HTMLElement>("[data-sw-radio-group]").getAttribute("data-value");
    });

    expect(activeAfterDispatch).toBe(radios[1]);
    expect(valueAfterDispatch).toBe("ssd");
    expect(document.activeElement).toBe(radios[1]);
    expect(onValueChange).toHaveBeenCalledOnce();
    expect(onValueChange).toHaveBeenCalledWith("hdd");
    expect(query<HTMLElement>("[data-sw-radio-group]")).toHaveAttribute("data-value", "hdd");
    expect(radios[1]).toHaveAttribute("aria-checked", "true");
  });

  it("does not focus a proposal superseded by synchronous prop reconciliation", async () => {
    const onValueChange = vi.fn();
    function ControlledRadioGroup() {
      const [value, setValue] = React.useState("ssd");
      return (
        <RadioGroup.Root
          name="storage"
          value={value}
          onValueChange={(nextValue) => {
            onValueChange(nextValue);
            flushSync(() => setValue("nvme"));
          }}
        >
          <Radio.Root value="ssd" />
          <Radio.Root value="hdd" />
          <Radio.Root value="nvme" />
        </RadioGroup.Root>
      );
    }
    await mount(<ControlledRadioGroup />);
    const group = query<HTMLElement>("[data-sw-radio-group]");
    const radios = queryAll<HTMLElement>("[data-sw-radio]");
    radios[0]?.focus();

    await act(() => {
      radios[0]?.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          cancelable: true,
          key: "ArrowDown",
        }),
      );
    });

    expect(onValueChange).toHaveBeenCalledOnce();
    expect(onValueChange).toHaveBeenCalledWith("hdd");
    expect(group).toHaveAttribute("data-value", "nvme");
    expect(document.activeElement).toBe(radios[0]);
    expect(radios[1]).toHaveAttribute("aria-checked", "false");
    expect(radios[2]).toHaveAttribute("aria-checked", "true");
  });
});

async function mount(node: React.ReactNode): Promise<void> {
  container = document.createElement("div");
  document.body.append(container);
  reactRoot = createRoot(container);
  await act(() => reactRoot!.render(node));
}

function query<T extends Element>(selector: string): T {
  return container!.querySelector<T>(selector)!;
}

function queryAll<T extends Element>(selector: string): T[] {
  return Array.from(container!.querySelectorAll<T>(selector));
}
