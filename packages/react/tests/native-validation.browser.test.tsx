import { Select } from "@starwind-ui/react/select";
import type * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Checkbox } from "../src/checkbox";
import { Combobox } from "../src/combobox";

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

function RequiredSelect({ defaultValue }: { defaultValue?: string }) {
  return (
    <form>
      <Select.Root name="fruit" required defaultValue={defaultValue}>
        <Select.Trigger>
          <Select.Value placeholder="Pick a fruit" />
        </Select.Trigger>
        <Select.Portal disabled>
          <Select.Positioner>
            <Select.Popup>
              <Select.Item value="apple">
                <Select.ItemText>Apple</Select.ItemText>
              </Select.Item>
              <Select.Item value="banana">
                <Select.ItemText>Banana</Select.ItemText>
              </Select.Item>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
      <button type="submit">Send</button>
    </form>
  );
}

describe("React Select native validation", () => {
  it("blocks a plain form before Runtime starts and focuses the trigger without React warnings", async () => {
    const consoleError = vi.spyOn(console, "error");
    await mount(<RequiredSelect />);
    const form = document.querySelector("form")!;
    const submit = vi.fn((event: SubmitEvent) => event.preventDefault());
    form.addEventListener("submit", submit);
    const trigger = document.querySelector<HTMLElement>("[data-sw-select-trigger]")!;

    await act(() => form.requestSubmit());

    expect(submit).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(trigger);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("submits a filled value under its name", async () => {
    await mount(<RequiredSelect defaultValue="banana" />);
    const form = document.querySelector("form")!;
    const submit = vi.fn((event: SubmitEvent) => event.preventDefault());
    form.addEventListener("submit", submit);

    await act(() => form.requestSubmit());

    expect(submit).toHaveBeenCalledTimes(1);
    expect(new FormData(form).getAll("fruit")).toEqual(["banana"]);
  });

  it("keeps the selected value when autofill writes text while the popup is unmounted", async () => {
    const consoleError = vi.spyOn(console, "error");
    await mount(<RequiredSelect defaultValue="banana" />);
    const input = document.querySelector<HTMLInputElement>("[data-sw-select-input]")!;
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;

    await act(() => {
      setValue.call(input, "Apple");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await waitForMacrotask();

    expect(input.value).toBe("banana");
    expect(new FormData(input.form!).getAll("fruit")).toEqual(["banana"]);
    expect(consoleError).not.toHaveBeenCalled();
  });
});

function RequiredCombobox({ defaultValue }: { defaultValue?: string }) {
  return (
    <form>
      <Combobox.Root name="fruit" required defaultValue={defaultValue}>
        <Combobox.Input placeholder="Pick a fruit" />
        <Combobox.Popup>
          <Combobox.Item value="apple">Apple</Combobox.Item>
          <Combobox.Item value="banana">Banana</Combobox.Item>
        </Combobox.Popup>
      </Combobox.Root>
      <button type="submit">Send</button>
    </form>
  );
}

describe("React Combobox native validation", () => {
  it("blocks a plain form before Runtime starts and focuses the input without React warnings", async () => {
    const consoleError = vi.spyOn(console, "error");
    await mount(<RequiredCombobox />);
    const form = document.querySelector("form")!;
    const submit = vi.fn((event: SubmitEvent) => event.preventDefault());
    form.addEventListener("submit", submit);

    // Combobox.Root observes the Runtime's DOM updates in a microtask, so act must await it.
    await act(async () => form.requestSubmit());

    expect(submit).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(document.querySelector("[data-sw-combobox-input]"));
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("submits a filled value under its name", async () => {
    await mount(<RequiredCombobox defaultValue="banana" />);
    const form = document.querySelector("form")!;
    const submit = vi.fn((event: SubmitEvent) => event.preventDefault());
    form.addEventListener("submit", submit);

    await act(() => form.requestSubmit());

    expect(submit).toHaveBeenCalledTimes(1);
    expect(new FormData(form).getAll("fruit")).toEqual(["banana"]);
  });
});

describe("React Checkbox native validation and labels", () => {
  it("blocks a plain form with a required Checkbox and focuses the visible checkbox", async () => {
    await mount(
      <form>
        <Checkbox.Root name="terms" required />
        <button type="submit">Send</button>
      </form>,
    );
    const form = document.querySelector("form")!;
    const submit = vi.fn((event: SubmitEvent) => event.preventDefault());
    form.addEventListener("submit", submit);

    await act(() => form.requestSubmit());

    expect(submit).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(document.querySelector("[data-sw-checkbox]"));
  });

  it("names the checkbox from an external label", async () => {
    await mount(
      <div>
        <Checkbox.Root id="terms" />
        <label htmlFor="terms">Accept the terms</label>
      </div>,
    );

    expect(document.querySelector("[data-sw-checkbox]")).toHaveAccessibleName("Accept the terms");
  });
});

async function mount(node: React.ReactNode): Promise<void> {
  container = document.createElement("div");
  document.body.append(container);
  reactRoot = createRoot(container);
  await act(async () => {
    reactRoot!.render(node);
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function waitForMacrotask(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 0));
  });
}
