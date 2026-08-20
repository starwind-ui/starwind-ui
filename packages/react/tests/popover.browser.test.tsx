import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import { DrawerPopup, DrawerRoot } from "../src/drawer/index";
import {
  PopoverPopup,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from "@starwind-ui/react/popover";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let reactRoot: Root | undefined;
let container: HTMLDivElement | undefined;

afterEach(async () => {
  if (reactRoot) await act(() => reactRoot?.unmount());
  container?.remove();
  reactRoot = undefined;
  container = undefined;
});

describe("React Popover", () => {
  it("activates on first placement when nested in an open Sheet-equivalent Drawer", async () => {
    await mount(
      <DrawerRoot defaultOpen>
        <DrawerPopup>
          <div data-floating-root />
          <PopoverRoot>
            <PopoverTrigger id="sheet-popover-trigger">Open details</PopoverTrigger>
            <PopoverPortal>
              <PopoverPopup id="sheet-popover-popup">Details</PopoverPopup>
            </PopoverPortal>
          </PopoverRoot>
        </DrawerPopup>
      </DrawerRoot>,
    );

    const trigger = query<HTMLButtonElement>("#sheet-popover-trigger");
    const popup = query<HTMLElement>("#sheet-popover-popup");
    const portal = query<HTMLElement>("[data-sw-popover-portal]");
    expect(portal).toHaveAttribute("data-placement", "ready");
    expect(trigger).toHaveAttribute("aria-controls", popup.id);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(popup.hidden).toBe(true);

    await act(async () => {
      trigger.focus();
      await userEvent.keyboard("{Enter}");
    });

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(popup.hidden).toBe(false);
  });

  it("coordinates a pre-rendered nested tree through normal effect ordering", async () => {
    await mount(
      <PopoverRoot openOnHover closeDelay={20}>
        <PopoverTrigger id="parent-trigger">Open parent</PopoverTrigger>
        <PopoverPortal>
          <PopoverPopup id="parent-popup">
            <PopoverRoot>
              <PopoverTrigger id="child-trigger">Open child</PopoverTrigger>
              <PopoverPortal>
                <PopoverPopup id="child-popup">Child content</PopoverPopup>
              </PopoverPortal>
            </PopoverRoot>
          </PopoverPopup>
        </PopoverPortal>
      </PopoverRoot>,
    );

    const parentTrigger = query<HTMLButtonElement>("#parent-trigger");
    const parentPopup = query<HTMLElement>("#parent-popup");
    const childTrigger = query<HTMLButtonElement>("#child-trigger");
    const childPopup = query<HTMLElement>("#child-popup");

    await act(async () => {
      parentTrigger.dispatchEvent(
        new PointerEvent("pointerenter", { bubbles: false, pointerType: "mouse" }),
      );
      childTrigger.click();
      parentPopup.dispatchEvent(
        new PointerEvent("pointerleave", { bubbles: false, pointerType: "mouse" }),
      );
      await new Promise((resolve) => window.setTimeout(resolve, 30));
    });

    expect(parentTrigger).toHaveAttribute("aria-expanded", "true");
    expect(parentPopup.hidden).toBe(false);
    expect(childTrigger).toHaveAttribute("aria-expanded", "true");
    expect(childPopup.hidden).toBe(false);

    await act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
      );
    });

    expect(parentTrigger).toHaveAttribute("aria-expanded", "true");
    expect(parentPopup.hidden).toBe(false);
    expect(childTrigger).toHaveAttribute("aria-expanded", "false");
    expect(childPopup.hidden).toBe(true);
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
