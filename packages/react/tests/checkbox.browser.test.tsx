import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

import { Checkbox } from "../src/checkbox";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let reactRoot: Root | undefined;
let container: HTMLDivElement | undefined;

afterEach(async () => {
  if (reactRoot) await act(() => reactRoot?.unmount());
  container?.remove();
  reactRoot = undefined;
  container = undefined;
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

function query(selector: string): HTMLElement | null {
  return container!.querySelector<HTMLElement>(selector);
}
