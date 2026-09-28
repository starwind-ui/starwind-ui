import * as React from "react";
import { act } from "react";
import { flushSync } from "react-dom";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Checkbox } from "../src/checkbox";
import { CheckboxGroup } from "../src/checkbox-group";

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

describe("React Checkbox indicator presence", () => {
  it("renders active and kept indicators while omitting inactive unkept indicators", async () => {
    await mount(<CheckboxPresenceCases unkeptChecked />);

    expect(query('[data-case="keep-mounted"]')?.hidden).toBe(false);
    expect(query('[data-case="explicit-hidden"]')?.hidden).toBe(true);
    expect(query('[data-case="explicit-visible"]')?.hidden).toBe(false);
    expect(query('[data-case="active"]')?.hidden).toBe(false);
    expect(query('[data-case="unkept"]')?.hidden).toBe(false);
    expect(query('[data-case="controlled-remount"]')).toBeNull();
    expect(query('[data-case="uncontrolled-remount"]')).toBeNull();

    await render(<CheckboxPresenceCases unkeptChecked={false} />);

    expect(query('[data-case="unkept"]')).toBeNull();

    await render(<CheckboxPresenceCases remountChecked unkeptChecked={false} />);

    const controlledRemount = query('[data-case="controlled-remount"]');
    expect(controlledRemount).toHaveAttribute("data-checked");
    expect(controlledRemount).toHaveAttribute("data-disabled");
    expect(controlledRemount).toHaveAttribute("data-readonly");
    expect(controlledRemount).toHaveAttribute("data-required");

    const uncontrolledRoot = query('[data-case="uncontrolled-root"]')!;
    await click(uncontrolledRoot);
    expect(query('[data-case="uncontrolled-remount"]')).toHaveAttribute("data-checked");

    await click(uncontrolledRoot);
    expect(query('[data-case="uncontrolled-remount"]')).toBeNull();

    await click(uncontrolledRoot);
    expect(query('[data-case="uncontrolled-remount"]')).toHaveAttribute("data-checked");
  });
});

function CheckboxPresenceCases({
  remountChecked = false,
  unkeptChecked,
}: {
  remountChecked?: boolean;
  unkeptChecked: boolean;
}) {
  return (
    <>
      <Checkbox.Root checked={false}>
        <Checkbox.Indicator data-case="keep-mounted" keepMounted />
      </Checkbox.Root>
      <Checkbox.Root checked={false}>
        <Checkbox.Indicator data-case="explicit-hidden" hidden keepMounted />
      </Checkbox.Root>
      <Checkbox.Root checked={false}>
        <Checkbox.Indicator data-case="explicit-visible" hidden={false} keepMounted />
      </Checkbox.Root>
      <Checkbox.Root checked>
        <Checkbox.Indicator data-case="active" />
      </Checkbox.Root>
      <Checkbox.Root checked={unkeptChecked}>
        <Checkbox.Indicator data-case="unkept" />
      </Checkbox.Root>
      <Checkbox.Root checked={remountChecked} disabled readOnly required>
        <Checkbox.Indicator data-case="controlled-remount" />
      </Checkbox.Root>
      <Checkbox.Root data-case="uncontrolled-root">
        <Checkbox.Indicator data-case="uncontrolled-remount" />
      </Checkbox.Root>
    </>
  );
}

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

function query<T extends HTMLElement = HTMLElement>(selector: string): T | null {
  return container!.querySelector<T>(selector);
}

describe("React Checkbox reset baseline", () => {
  for (const option of ["id", "nativeButton", "readOnly"] as const) {
    for (const initial of [false, true]) {
      it(`preserves ${initial} reset after ${option} recreation`, async () => {
        const tree = (changed: boolean) => (
          <React.StrictMode>
            <form>
              <Checkbox.Root
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
        await click(query<HTMLElement>("[data-sw-checkbox]")!);
        expect(query<HTMLElement>("[data-sw-checkbox]")).toHaveAttribute(
          "aria-checked",
          String(!initial),
        );
        await render(tree(true));
        expect(query<HTMLElement>("[data-sw-checkbox]")).toHaveAttribute(
          "aria-checked",
          String(!initial),
        );
        const form = query<HTMLFormElement>("form")!;
        expect(new FormData(form).get("setting")).toBe(initial ? "no" : "yes");
        await act(async () => {
          form.reset();
          await new Promise((resolve) => setTimeout(resolve, 15));
        });
        expect(query<HTMLElement>("[data-sw-checkbox]")).toHaveAttribute(
          "aria-checked",
          String(initial),
        );
        expect(query<HTMLInputElement>("[data-sw-checkbox-input]")!.defaultChecked).toBe(initial);
        expect(new FormData(form).get("setting")).toBe(initial ? "yes" : "no");
      });
    }
  }
});

describe("React Checkbox group ownership", () => {
  for (const controlled of [false, true]) {
    it(`uses group membership with conflicting children (${controlled ? "controlled" : "default"} group)`, async () => {
      const details: boolean[] = [];
      const groupChanges: string[][] = [];
      const tree = (value: string[], childChecked = false) => (
        <form>
          <CheckboxGroup.Root
            {...(controlled ? { value } : { defaultValue: ["alpha"] })}
            onValueChange={(next) => groupChanges.push(next)}
          >
            <Checkbox.Root
              checked={childChecked}
              defaultChecked={false}
              name="choice"
              value="alpha"
              onCheckedChange={(next) => details.push(next)}
            />
            <Checkbox.Root checked={!childChecked} defaultChecked name="choice" value="beta" />
          </CheckboxGroup.Root>
        </form>
      );
      await mount(tree(["alpha"]));
      const check = (expected: string[]) => {
        const roots = Array.from(container!.querySelectorAll<HTMLElement>("[data-sw-checkbox]"));
        expect(roots.map((root) => root.getAttribute("aria-checked"))).toEqual([
          String(expected.includes("alpha")),
          String(expected.includes("beta")),
        ]);
        expect(new FormData(query<HTMLFormElement>("form")!).getAll("choice")).toEqual(expected);
      };
      check(["alpha"]);
      await click(query<HTMLElement>('[data-sw-checkbox][data-value="alpha"]')!);
      expect(details).toEqual([false]);
      expect(groupChanges).toEqual([[]]);
      check(controlled ? ["alpha"] : []);
      await render(tree(controlled ? ["beta"] : [], true));
      check(controlled ? ["beta"] : []);
      await act(async () => {
        query<HTMLFormElement>("form")!.reset();
        await new Promise((resolve) => setTimeout(resolve, 15));
      });
      check(controlled ? ["beta"] : ["alpha"]);
    });
  }

  it("hydrates group selection over conflicting child props", async () => {
    const tree = (
      <CheckboxGroup.Root defaultValue={["alpha"]}>
        <Checkbox.Root checked={false} value="alpha" />
        <Checkbox.Root checked value="beta" />
      </CheckboxGroup.Root>
    );
    container = document.createElement("div");
    container.innerHTML = renderToString(tree);
    document.body.append(container);
    const states = () =>
      Array.from(container!.querySelectorAll("[data-sw-checkbox]")).map((root) =>
        root.getAttribute("aria-checked"),
      );
    expect(states()).toEqual(["true", "false"]);
    expect(
      Array.from(container!.querySelectorAll<HTMLInputElement>("[data-sw-checkbox-input]")).map(
        (input) => input.checked,
      ),
    ).toEqual([true, false]);
    const recoveries: unknown[] = [];
    await act(async () => {
      reactRoot = hydrateRoot(container!, tree, {
        onRecoverableError: (error) => recoveries.push(error),
      });
    });
    expect(states()).toEqual(["true", "false"]);
    expect(
      Array.from(container!.querySelectorAll<HTMLInputElement>("[data-sw-checkbox-input]")).map(
        (input) => input.checked,
      ),
    ).toEqual([true, false]);
    expect(recoveries).toEqual([]);
  });
});

describe("React Checkbox reset lifecycle", () => {
  it("keeps canceled reset state and ignores pending reset work after replacement and unmount", async () => {
    const changes: boolean[] = [];
    const tree = (checked?: boolean, id = "first") => (
      <form>
        <Checkbox.Root
          id={id}
          checked={checked}
          name="setting"
          defaultChecked={false}
          onCheckedChange={(value) => changes.push(value)}
        />
      </form>
    );
    await mount(tree());
    await click(query<HTMLElement>("[data-sw-checkbox]")!);
    const form = query<HTMLFormElement>("form")!;
    form.addEventListener("reset", (event) => event.preventDefault(), { once: true });
    await act(async () => {
      form.reset();
      await new Promise((resolve) => setTimeout(resolve, 15));
    });
    expect(query<HTMLElement>("[data-sw-checkbox]")).toHaveAttribute("aria-checked", "true");
    expect(query<HTMLInputElement>("[data-sw-checkbox-input]")!.checked).toBe(true);
    // A parent command and reconstruction can arrive before the reset timers run.
    await act(async () => {
      form.reset();
      reactRoot!.render(tree(true, "second"));
      await Promise.resolve();
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 15));
    });
    expect(query<HTMLElement>("[data-sw-checkbox]")).toHaveAttribute("aria-checked", "true");
    await render(tree(false, "second"));
    expect(query<HTMLElement>("[data-sw-checkbox]")).toHaveAttribute("aria-checked", "false");
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

it("retains an indeterminate Checkbox through recreation and a canceled reset", async () => {
  const tree = (id: string) => (
    <form>
      <Checkbox.Root indeterminate id={id} />
    </form>
  );
  await mount(tree("first"));
  await render(tree("replacement"));
  expect(query<HTMLElement>("[data-sw-checkbox]")).toHaveAttribute("aria-checked", "mixed");
  expect(query<HTMLInputElement>("[data-sw-checkbox-input]")!.indeterminate).toBe(true);
  const form = query<HTMLFormElement>("form")!;
  form.addEventListener("reset", (event) => event.preventDefault(), { once: true });
  await act(async () => {
    form.reset();
    await new Promise((resolve) => setTimeout(resolve, 15));
  });
  expect(query<HTMLElement>("[data-sw-checkbox]")).toHaveAttribute("aria-checked", "mixed");
  expect(query<HTMLInputElement>("[data-sw-checkbox-input]")!.indeterminate).toBe(true);
});

for (const initial of [false, true]) {
  it(`keeps a newer parent command during pending reset without reconstruction (${initial})`, async () => {
    const changes: boolean[] = [];
    const tree = (checked?: boolean) => (
      <form>
        <Checkbox.Root
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
    const root = query<HTMLElement>("[data-sw-checkbox]")!;
    const input = query<HTMLInputElement>("[data-sw-checkbox-input]")!;
    await click(root);
    expect(root).toHaveAttribute("aria-checked", String(!initial));
    const form = query<HTMLFormElement>("form")!;
    await act(async () => {
      form.reset();
      expect(input.checked).toBe(initial);
      flushSync(() => reactRoot!.render(tree(!initial)));
      await new Promise((resolve) => setTimeout(resolve, 15));
    });
    expect(query<HTMLElement>("[data-sw-checkbox]")).toBe(root);
    expect(query<HTMLInputElement>("[data-sw-checkbox-input]")).toBe(input);
    expect(root).toHaveAttribute("aria-checked", String(!initial));
    expect(input.checked).toBe(!initial);
    expect(new FormData(form).get("setting")).toBe(initial ? "no" : "yes");
    expect(changes).toEqual([!initial]);
  });
}

describe("React checkbox initial native state", () => {
  it.each([true, false])(
    "hydrates controlled %s with matching initial FormData and one owner",
    async (checked) => {
      const changes = vi.fn();
      const tree = (
        <React.StrictMode>
          <form>
            <Checkbox.Root
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
      const input = query<HTMLInputElement>("[data-sw-checkbox-input]")!;
      const root = query<HTMLElement>("[data-sw-checkbox]")!;
      const form = query<HTMLFormElement>("form")!;
      expect(input.checked).toBe(checked);
      expect(new FormData(form).get("setting")).toBe(checked ? "yes" : null);
      const errors = vi.spyOn(console, "error").mockImplementation(() => {});
      const recoverable = vi.fn();
      await act(async () => {
        reactRoot = hydrateRoot(container!, tree, { onRecoverableError: recoverable });
        await Promise.resolve();
      });
      expect(query("[data-sw-checkbox]")).toBe(root);
      expect(query("[data-sw-checkbox-input]")).toBe(input);
      expect(container.querySelectorAll("[data-sw-checkbox-input]")).toHaveLength(1);
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
