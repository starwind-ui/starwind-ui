import { createToggle } from "@starwind-ui/runtime/toggle";
import * as React from "react";
import { act } from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

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
  vi.restoreAllMocks();
});

describe("React Toggle Group context", () => {
  it.each([true, false])(
    "retains changes to item disabled while its group is disabled (native=%s)",
    async (nativeButton) => {
      const changes = vi.fn();
      const presses = vi.fn();
      const tree = (groupDisabled: boolean, itemDisabled: boolean, value = ["alpha"]) => (
        <React.StrictMode>
          <ToggleGroup.Root disabled={groupDisabled} value={value} onValueChange={changes}>
            <Toggle.Root
              value="alpha"
              nativeButton={nativeButton}
              disabled={itemDisabled}
              onPressedChange={presses}
            >
              Alpha
            </Toggle.Root>
          </ToggleGroup.Root>
        </React.StrictMode>
      );
      await mount(tree(true, false));
      const item = query<HTMLElement>('[data-sw-toggle][data-value="alpha"]');
      const instance = createToggle(item);
      const render = async (groupDisabled: boolean, itemDisabled: boolean, value?: string[]) => {
        await act(async () => {
          reactRoot!.render(tree(groupDisabled, itemDisabled, value));
          await Promise.resolve();
        });
      };
      const expectDisabled = (disabled: boolean) => {
        expect(item.hasAttribute("data-disabled")).toBe(disabled);
        if (nativeButton) expect((item as HTMLButtonElement).disabled).toBe(disabled);
        else expect(item.getAttribute("aria-disabled")).toBe(disabled ? "true" : null);
      };
      await render(true, true);
      await render(false, true);
      expectDisabled(true);
      await click(item);
      expect(changes).not.toHaveBeenCalled();
      expect(presses).not.toHaveBeenCalled();
      await render(true, true);
      await render(true, false);
      expectDisabled(true);
      await render(false, false);
      expectDisabled(false);
      await click(item);
      expect(changes).toHaveBeenCalledTimes(1);
      expect(presses).toHaveBeenCalledTimes(1);
      await render(true, false);
      await render(false, true, []);
      expectDisabled(true);
      expect(item).toHaveAttribute("aria-pressed", "false");
      expect(createToggle(item)).toBe(instance);
      expect(query('[data-sw-toggle][data-value="alpha"]')).toBe(item);
      await act(async () => {
        reactRoot!.render(tree(true, true));
        reactRoot!.render(tree(false, false));
        await Promise.resolve();
      });
      expectDisabled(false);
      await act(() => {
        reactRoot!.render(tree(true, true));
        reactRoot!.unmount();
      });
      reactRoot = undefined;
      const detachedMarkup = item.outerHTML;
      await Promise.resolve();
      expect(item.outerHTML).toBe(detachedMarkup);
      expect(changes).toHaveBeenCalledTimes(1);
    },
  );

  it("hydrates effective group state and preserves each item's own disabled state", async () => {
    const changes = vi.fn();
    const tree = (disabled: boolean, value = ["alpha"]) => (
      <React.StrictMode>
        <ToggleGroup.Root disabled={disabled} value={value} onValueChange={changes}>
          <Toggle.Root value="alpha" pressed={false}>
            Alpha
          </Toggle.Root>
          <Toggle.Root value="beta" disabled pressed>
            Beta
          </Toggle.Root>
          <Toggle.Root value="gamma" nativeButton={false}>
            Gamma
          </Toggle.Root>
        </ToggleGroup.Root>
      </React.StrictMode>
    );
    container = document.createElement("div");
    document.body.append(container);
    container.innerHTML = renderToString(tree(true));
    const alpha = query<HTMLButtonElement>('[data-sw-toggle][data-value="alpha"]');
    const beta = query<HTMLButtonElement>('[data-sw-toggle][data-value="beta"]');
    const gamma = query<HTMLElement>('[data-sw-toggle][data-value="gamma"]');
    expect(alpha.disabled).toBe(true);
    expect(beta.disabled).toBe(true);
    expect(gamma).toHaveAttribute("aria-disabled", "true");
    expect(alpha).toHaveAttribute("aria-pressed", "true");
    expect(beta).toHaveAttribute("aria-pressed", "false");
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const recoverable = vi.fn();
    await act(async () => {
      reactRoot = hydrateRoot(container!, tree(true), { onRecoverableError: recoverable });
      await Promise.resolve();
    });
    const instance = createToggle(alpha);
    expect(alpha.disabled).toBe(true);
    await act(async () => {
      reactRoot!.render(tree(false, ["gamma"]));
      await Promise.resolve();
    });
    expect(alpha.disabled).toBe(false);
    expect(beta.disabled).toBe(true);
    expect(gamma).not.toHaveAttribute("aria-disabled");
    expect(alpha).toHaveAttribute("aria-pressed", "false");
    expect(beta).toHaveAttribute("aria-pressed", "false");
    expect(gamma).toHaveAttribute("aria-pressed", "true");
    expect(createToggle(alpha)).toBe(instance);
    await click(alpha);
    expect(changes).toHaveBeenCalledTimes(1);
    expect(alpha).toHaveAttribute("aria-pressed", "false");
    await click(beta);
    expect(changes).toHaveBeenCalledTimes(1);
    await act(async () => {
      reactRoot!.render(tree(true, ["gamma"]));
      await Promise.resolve();
    });
    expect(alpha.disabled).toBe(true);
    expect(beta.disabled).toBe(true);
    await act(async () => {
      reactRoot!.render(tree(false, ["alpha"]));
      await Promise.resolve();
    });
    expect(alpha.disabled).toBe(false);
    expect(beta.disabled).toBe(true);
    expect(alpha).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelectorAll("[data-sw-toggle]")).toHaveLength(3);
    expect(recoverable).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
  });

  it("publishes accepted uncontrolled group selection once while ignoring item pressed props", async () => {
    const changes = vi.fn();
    await mount(
      <ToggleGroup.Root defaultValue={["alpha"]} onValueChange={changes}>
        <Toggle.Root value="alpha" pressed={false}>
          Alpha
        </Toggle.Root>
        <Toggle.Root value="beta" pressed>
          Beta
        </Toggle.Root>
      </ToggleGroup.Root>,
    );
    const alpha = query<HTMLButtonElement>('[data-sw-toggle][data-value="alpha"]');
    const beta = query<HTMLButtonElement>('[data-sw-toggle][data-value="beta"]');
    await click(beta);
    expect(alpha).toHaveAttribute("aria-pressed", "false");
    expect(beta).toHaveAttribute("aria-pressed", "true");
    expect(changes).toHaveBeenCalledTimes(1);
  });

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
