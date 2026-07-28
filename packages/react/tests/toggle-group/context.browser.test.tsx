import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

import { Toggle } from "../../src/toggle";
import { ToggleGroup, useToggleGroupContext } from "../../src/toggle-group";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let reactRoot: Root | undefined;
let container: HTMLDivElement | undefined;

afterEach(async () => {
  if (reactRoot) await act(() => reactRoot?.unmount());
  container?.remove();
  reactRoot = undefined;
  container = undefined;
});

describe("React Toggle Group context", () => {
  it("provides normalized group state while the hook and Toggle remain standalone-safe", async () => {
    await mount(
      <>
        <ContextProbe id="outside" />
        <Toggle.Root value="standalone">Standalone</Toggle.Root>
        <ToggleGroup.Root
          disabled
          loopFocus={false}
          multiple
          orientation="vertical"
          value={["alpha", "alpha", ""]}
        >
          <ContextProbe id="inside" />
          <Toggle.Root value="alpha">Alpha</Toggle.Root>
        </ToggleGroup.Root>
      </>,
    );

    expect(query('[data-context-probe="outside"]')).toHaveTextContent("none");
    expect(JSON.parse(query('[data-context-probe="inside"]').textContent ?? "")).toEqual({
      disabled: true,
      loopFocus: false,
      multiple: true,
      orientation: "vertical",
      value: ["alpha"],
    });

    const standaloneToggle = query<HTMLButtonElement>('[data-sw-toggle][data-value="standalone"]');
    expect(standaloneToggle).toHaveAttribute("aria-pressed", "false");

    await act(async () => {
      standaloneToggle.click();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(standaloneToggle).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps context identity stable across unrelated parent rerenders", async () => {
    await mount(<ContextStabilityHarness />);

    const contextProbe = query('[data-context-probe="stable"]');
    expect(contextProbe).toHaveAttribute("data-render-count", "1");
    expect(JSON.parse(contextProbe.textContent ?? "")).toEqual({
      disabled: false,
      value: ["alpha"],
    });

    await click(query<HTMLButtonElement>("[data-unrelated-rerender]"));

    expect(query("[data-unrelated-count]")).toHaveTextContent("1");
    expect(contextProbe).toHaveAttribute("data-render-count", "1");

    await click(query<HTMLButtonElement>("[data-semantic-change]"));

    expect(contextProbe).toHaveAttribute("data-render-count", "2");
    expect(JSON.parse(contextProbe.textContent ?? "")).toEqual({
      disabled: true,
      value: ["alpha"],
    });
  });
});

function ContextProbe({ id }: { id: string }) {
  const context = useToggleGroupContext();

  return <output data-context-probe={id}>{context ? JSON.stringify(context) : "none"}</output>;
}

const stableGroupValue = ["alpha"];

function ContextStabilityHarness() {
  const [unrelatedCount, setUnrelatedCount] = React.useState(0);
  const [disabled, setDisabled] = React.useState(false);

  return (
    <>
      <button data-unrelated-rerender onClick={() => setUnrelatedCount((count) => count + 1)}>
        Unrelated rerender
      </button>
      <output data-unrelated-count>{unrelatedCount}</output>
      <button data-semantic-change onClick={() => setDisabled((value) => !value)}>
        Semantic change
      </button>
      <ToggleGroup.Root disabled={disabled} multiple value={stableGroupValue}>
        <StableContextProbe />
      </ToggleGroup.Root>
    </>
  );
}

const StableContextProbe = React.memo(function StableContextProbe() {
  const context = useToggleGroupContext();
  const renderCount = React.useRef(0);
  renderCount.current += 1;

  return (
    <output data-context-probe="stable" data-render-count={renderCount.current}>
      {JSON.stringify({
        disabled: context?.disabled,
        value: context?.value,
      })}
    </output>
  );
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

async function click(element: HTMLElement): Promise<void> {
  await act(async () => {
    element.click();
    await Promise.resolve();
    await Promise.resolve();
  });
}

function query<T extends Element = Element>(selector: string): T {
  return container!.querySelector<T>(selector)!;
}
