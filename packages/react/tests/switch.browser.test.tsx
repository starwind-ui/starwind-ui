import { createSwitch } from "@starwind-ui/runtime/switch";
import * as React from "react";
import { act } from "react";
import { flushSync } from "react-dom";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
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
  vi.restoreAllMocks();
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

describe("React Switch reset baseline", () => {
  for (const option of ["id", "nativeButton", "readOnly"] as const) {
    for (const initial of [false, true]) {
      it(`preserves ${initial} reset after ${option} recreation`, async () => {
        const tree = (changed: boolean) => (
          <React.StrictMode>
            <form>
              <Switch.Root
                defaultChecked={changed ? !initial : initial}
                name="setting"
                value="yes"
                uncheckedValue="no"
                id={option === "id" && changed ? "replacement" : "original"}
                nativeButton={option === "nativeButton" && changed}
                readOnly={option === "readOnly" && changed}
              />
            </form>
          </React.StrictMode>
        );
        await mount(tree(false));
        await click(query<HTMLElement>("[data-sw-switch]")!);
        expect(query<HTMLElement>("[data-sw-switch]")).toHaveAttribute(
          "aria-checked",
          String(!initial),
        );
        await render(tree(true));
        expect(query<HTMLElement>("[data-sw-switch]")).toHaveAttribute(
          "aria-checked",
          String(!initial),
        );
        const form = query<HTMLFormElement>("form")!;
        expect(new FormData(form).get("setting")).toBe(initial ? "no" : "yes");
        await act(async () => {
          form.reset();
          await new Promise((resolve) => setTimeout(resolve, 15));
        });
        expect(query<HTMLElement>("[data-sw-switch]")).toHaveAttribute(
          "aria-checked",
          String(initial),
        );
        expect(query<HTMLInputElement>("[data-sw-switch-input]")!.defaultChecked).toBe(initial);
        expect(new FormData(form).get("setting")).toBe(initial ? "yes" : "no");
      });
    }
  }
});

describe("React Switch reset lifecycle", () => {
  it("keeps canceled reset state and ignores pending reset work after replacement and unmount", async () => {
    const changes: boolean[] = [];
    const tree = (checked?: boolean, id = "first") => (
      <form>
        <Switch.Root
          id={id}
          checked={checked}
          name="setting"
          defaultChecked={false}
          onCheckedChange={(value) => changes.push(value)}
        />
      </form>
    );
    await mount(tree());
    await click(query<HTMLElement>("[data-sw-switch]")!);
    const form = query<HTMLFormElement>("form")!;
    form.addEventListener("reset", (event) => event.preventDefault(), { once: true });
    await act(async () => {
      form.reset();
      await new Promise((resolve) => setTimeout(resolve, 15));
    });
    expect(query<HTMLElement>("[data-sw-switch]")).toHaveAttribute("aria-checked", "true");
    expect(query<HTMLInputElement>("[data-sw-switch-input]")!.checked).toBe(true);
    // A parent command and reconstruction can arrive before the reset timers run.
    await act(async () => {
      form.reset();
      reactRoot!.render(tree(true, "second"));
      await Promise.resolve();
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 15));
    });
    expect(query<HTMLElement>("[data-sw-switch]")).toHaveAttribute("aria-checked", "true");
    await render(tree(false, "second"));
    expect(query<HTMLElement>("[data-sw-switch]")).toHaveAttribute("aria-checked", "false");
    await act(async () => {
      form.reset();
      reactRoot!.unmount();
      reactRoot = undefined;
      await new Promise((resolve) => setTimeout(resolve, 15));
    });
    expect(container!.childElementCount).toBe(0);
    expect(changes).toEqual([true]);
  });
});

for (const initial of [false, true]) {
  it(`keeps a newer parent command during pending reset without reconstruction (${initial})`, async () => {
    const changes: boolean[] = [];
    const tree = (checked?: boolean) => (
      <form>
        <Switch.Root
          checked={checked}
          defaultChecked={initial}
          name="setting"
          value="yes"
          uncheckedValue="no"
          onCheckedChange={(value) => changes.push(value)}
        />
      </form>
    );
    await mount(tree());
    const root = query<HTMLElement>("[data-sw-switch]")!;
    const input = query<HTMLInputElement>("[data-sw-switch-input]")!;
    await click(root);
    expect(root).toHaveAttribute("aria-checked", String(!initial));
    const form = query<HTMLFormElement>("form")!;
    await act(async () => {
      form.reset();
      expect(input.checked).toBe(initial);
      flushSync(() => reactRoot!.render(tree(!initial)));
      await new Promise((resolve) => setTimeout(resolve, 15));
    });
    expect(query<HTMLElement>("[data-sw-switch]")).toBe(root);
    expect(query<HTMLInputElement>("[data-sw-switch-input]")).toBe(input);
    expect(root).toHaveAttribute("aria-checked", String(!initial));
    expect(input.checked).toBe(!initial);
    expect(new FormData(form).get("setting")).toBe(initial ? "no" : "yes");
    expect(changes).toEqual([!initial]);
  });
}

describe("React switch initial native state", () => {
  it.each([true, false])(
    "hydrates controlled %s with matching initial FormData and one owner",
    async (checked) => {
      const changes = vi.fn();
      const tree = (
        <React.StrictMode>
          <form>
            <Switch.Root
              checked={checked}
              defaultChecked={!checked}
              name="setting"
              value="yes"
              onCheckedChange={changes}
            />
          </form>
        </React.StrictMode>
      );
      container = document.createElement("div");
      document.body.append(container);
      container.innerHTML = renderToString(tree);
      const input = query<HTMLInputElement>("[data-sw-switch-input]")!;
      const root = query<HTMLElement>("[data-sw-switch]")!;
      const form = query<HTMLFormElement>("form")!;
      expect(input.checked).toBe(checked);
      expect(new FormData(form).get("setting")).toBe(checked ? "yes" : null);
      const errors = vi.spyOn(console, "error").mockImplementation(() => {});
      const recoverable = vi.fn();
      await act(async () => {
        reactRoot = hydrateRoot(container!, tree, { onRecoverableError: recoverable });
        await Promise.resolve();
      });
      expect(query("[data-sw-switch]")).toBe(root);
      expect(query("[data-sw-switch-input]")).toBe(input);
      expect(container.querySelectorAll("[data-sw-switch-input]")).toHaveLength(1);
      expect(input.checked).toBe(checked);
      await act(async () => {
        form.reset();
        await new Promise((resolve) => setTimeout(resolve, 15));
      });
      expect(input.checked).toBe(checked);
      expect(root).toHaveAttribute("aria-checked", String(checked));
      expect(new FormData(form).get("setting")).toBe(checked ? "yes" : null);
      expect(changes).not.toHaveBeenCalled();
      expect(recoverable).not.toHaveBeenCalled();
      expect(errors).not.toHaveBeenCalled();
    },
  );
});
