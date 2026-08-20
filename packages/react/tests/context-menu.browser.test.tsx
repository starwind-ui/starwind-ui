import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

import { ContextMenu } from "../src/context-menu/index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let reactRoot: Root | undefined;
let container: HTMLDivElement | undefined;

afterEach(async () => {
  if (reactRoot) await act(() => reactRoot?.unmount());
  container?.remove();
  reactRoot = undefined;
  container = undefined;
});

describe("React Context Menu", () => {
  it("opens its first placed Portal through the public Shift+F10 interaction", async () => {
    await mount(
      <ContextMenu.Root>
        <ContextMenu.Trigger id="context-menu-trigger">Open actions</ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Positioner>
            <ContextMenu.Popup id="context-menu-popup">
              <ContextMenu.Item id="context-menu-item">Action</ContextMenu.Item>
            </ContextMenu.Popup>
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>,
    );

    const trigger = query<HTMLElement>("#context-menu-trigger");
    const portal = query<HTMLElement>("[data-sw-menu-portal]");
    const popup = query<HTMLElement>("#context-menu-popup");
    const item = query<HTMLElement>("#context-menu-item");
    expect(portal).toHaveAttribute("data-placement", "ready");
    expect(trigger).toHaveAttribute("aria-controls", popup.id);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(popup).toHaveAttribute("data-state", "closed");
    expect(popup.hidden).toBe(true);

    await act(() => {
      trigger.focus();
      trigger.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          cancelable: true,
          key: "F10",
          shiftKey: true,
        }),
      );
    });

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(popup).toHaveAttribute("data-state", "open");
    expect(popup.hidden).toBe(false);
    expect(document.activeElement).toBe(item);
  });
});

async function mount(node: React.ReactNode) {
  container = document.createElement("div");
  document.body.append(container);
  reactRoot = createRoot(container);
  await act(() => reactRoot!.render(node));
}

function query<T extends Element>(selector: string): T {
  return document.querySelector<T>(selector)!;
}
