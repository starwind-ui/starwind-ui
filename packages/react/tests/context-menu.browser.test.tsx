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

  it("keeps an uncontrolled long-press menu open when tapping a submenu trigger", async () => {
    await mount(
      <ContextMenu.Root id="context-menu-root">
        <ContextMenu.Trigger id="context-menu-trigger">Open actions</ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Positioner id="context-menu-positioner">
            <ContextMenu.Popup id="context-menu-popup">
              <ContextMenu.SubmenuRoot>
                <ContextMenu.SubmenuTrigger id="context-menu-submenu-trigger">
                  More
                </ContextMenu.SubmenuTrigger>
                <ContextMenu.Portal>
                  <ContextMenu.Positioner id="context-menu-submenu-positioner">
                    <ContextMenu.Popup id="context-menu-submenu-popup">
                      <ContextMenu.Item>Nested action</ContextMenu.Item>
                    </ContextMenu.Popup>
                  </ContextMenu.Positioner>
                </ContextMenu.Portal>
              </ContextMenu.SubmenuRoot>
            </ContextMenu.Popup>
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>,
    );

    const root = query<HTMLElement>("#context-menu-root");
    const trigger = query<HTMLElement>("#context-menu-trigger");
    const positioner = query<HTMLElement>("#context-menu-positioner");
    const popup = query<HTMLElement>("#context-menu-popup");
    const submenuTrigger = query<HTMLElement>("#context-menu-submenu-trigger");
    const submenuPositioner = query<HTMLElement>("#context-menu-submenu-positioner");
    const submenuPopup = query<HTMLElement>("#context-menu-submenu-popup");

    await act(async () => {
      dispatchTouchEvent(trigger, "touchstart", [{ clientX: 120, clientY: 140 }]);
      await new Promise((resolve) => setTimeout(resolve, 550));
      dispatchTouchEvent(trigger, "touchend", []);
      await waitForPosition(positioner);
    });

    expect(root).toHaveAttribute("data-state", "open");
    expect(popup.hidden).toBe(false);

    await act(async () => {
      trigger.dispatchEvent(
        new FocusEvent("focusout", {
          bubbles: true,
          relatedTarget: submenuTrigger,
        }),
      );
      await Promise.resolve();
      submenuTrigger.focus();
      dispatchTouchEvent(submenuTrigger, "touchstart", [{ clientX: 140, clientY: 160 }]);
      submenuTrigger.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerType: "touch" }),
      );
      dispatchTouchEvent(submenuTrigger, "touchend", []);
      submenuTrigger.dispatchEvent(
        new PointerEvent("pointerup", { bubbles: true, button: 0, pointerType: "touch" }),
      );
      submenuTrigger.click();
      await waitForPosition(submenuPositioner);
    });

    expect(root).toHaveAttribute("data-state", "open");
    expect(popup.hidden).toBe(false);
    expect(submenuTrigger).toHaveAttribute("aria-expanded", "true");
    expect(submenuPopup).toHaveAttribute("data-state", "open");
    expect(submenuPopup.hidden).toBe(false);
    expect(submenuPositioner.style.position).toBe("fixed");
    expect(submenuPositioner.style.left).not.toBe("");
    expect(submenuPositioner.style.top).not.toBe("");
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

async function waitForPosition(popup: HTMLElement): Promise<void> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    if (popup.style.position !== "") return;
    await new Promise(requestAnimationFrame);
  }
}

function dispatchTouchEvent(
  target: HTMLElement,
  type: string,
  touches: Array<{ clientX: number; clientY: number }>,
): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "touches", { value: touches });
  target.dispatchEvent(event);
  return event;
}
