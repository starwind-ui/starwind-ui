import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

import { createSwitch } from "@starwind-ui/runtime/switch";
import { Field } from "../src/field";
import { Switch } from "../src/switch";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let reactRoot: Root | undefined;
let container: HTMLDivElement | undefined;

afterEach(async () => {
  if (reactRoot) await act(() => reactRoot?.unmount());
  container?.remove();
  reactRoot = undefined;
  container = undefined;
});

describe("React Switch form association", () => {
  it("preserves a Runtime-owned input name through an accepted rerender", async () => {
    await mount(
      <form data-case="form">
        <Switch.Root data-case="switch" nativeButton value="enabled">
          <Switch.Thumb />
        </Switch.Root>
      </form>,
    );

    const switchRoot = query<HTMLElement>('[data-case="switch"]')!;
    const input = query<HTMLInputElement>("[data-sw-switch-input]")!;
    const form = query<HTMLFormElement>('[data-case="form"]')!;
    createSwitch(switchRoot).setFormOptions({ name: "alerts" });

    await click(switchRoot);

    expect(switchRoot).toHaveAttribute("aria-checked", "true");
    expect(input.name).toBe("alerts");
    expect(new FormData(form).get("alerts")).toBe("enabled");
  });

  it("keeps an explicit React name authoritative", async () => {
    await mount(
      <form data-case="form">
        <Switch.Root data-case="switch" name="authored" nativeButton value="enabled">
          <Switch.Thumb />
        </Switch.Root>
      </form>,
    );

    const switchRoot = query<HTMLElement>('[data-case="switch"]')!;
    const input = query<HTMLInputElement>("[data-sw-switch-input]")!;
    const form = query<HTMLFormElement>('[data-case="form"]')!;
    createSwitch(switchRoot).setFormOptions({ name: "runtime", value: "enabled" });

    await click(switchRoot);

    expect(input.name).toBe("authored");
    expect(new FormData(form).get("authored")).toBe("enabled");
    expect(new FormData(form).get("runtime")).toBeNull();
  });

  it("preserves Runtime name removal through an accepted rerender", async () => {
    await mount(
      <form data-case="form">
        <Switch.Root data-case="switch" nativeButton value="enabled">
          <Switch.Thumb />
        </Switch.Root>
      </form>,
    );

    const switchRoot = query<HTMLElement>('[data-case="switch"]')!;
    const input = query<HTMLInputElement>("[data-sw-switch-input]")!;
    const form = query<HTMLFormElement>('[data-case="form"]')!;
    const instance = createSwitch(switchRoot);
    instance.setFormOptions({ name: "alerts", value: "enabled" });
    await flushMutationObservers();
    instance.setFormOptions({ name: undefined, value: "enabled" });
    await flushMutationObservers();

    await click(switchRoot);

    expect(input.name).toBe("");
    expect(new FormData(form).get("alerts")).toBeNull();
  });

  it("preserves a Field-owned name after an accepted state update", async () => {
    await mount(
      <React.StrictMode>
        <form data-case="form">
          <Field.Root name="alerts">
            <div>
              <Switch.Root data-case="switch" nativeButton value="enabled">
                <Switch.Thumb />
              </Switch.Root>
            </div>
          </Field.Root>
        </form>
      </React.StrictMode>,
    );

    const switchRoot = query<HTMLElement>('[data-case="switch"]')!;
    const input = query<HTMLInputElement>("[data-sw-switch-input]")!;
    const form = query<HTMLFormElement>('[data-case="form"]')!;

    expect(input.name).toBe("alerts");

    await click(switchRoot);

    expect(switchRoot).toHaveAttribute("aria-checked", "true");
    expect(input.name).toBe("alerts");
    expect(new FormData(form).get("alerts")).toBe("enabled");
  });
});

async function mount(node: React.ReactNode): Promise<void> {
  container = document.createElement("div");
  document.body.append(container);
  reactRoot = createRoot(container);
  await render(node);
}

async function render(node: React.ReactNode): Promise<void> {
  await act(async () => {
    reactRoot!.render(node);
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function click(element: HTMLElement): Promise<void> {
  await act(async () => {
    element.click();
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function flushMutationObservers(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}

function query<ElementType extends Element>(selector: string): ElementType | null {
  return container!.querySelector<ElementType>(selector);
}
