import { createAlertDialog } from "@starwind-ui/runtime/alert-dialog";
import { createDialog } from "@starwind-ui/runtime/dialog";
import { createDrawer } from "@starwind-ui/runtime/drawer";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AlertDialog } from "../src/alert-dialog";
import { Dialog } from "../src/dialog";
import { Drawer } from "../src/drawer";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let owner: Root | undefined;
let host: HTMLDivElement;
afterEach(async () => {
  if (owner) await act(() => owner?.unmount());
  owner = undefined;
  host?.remove();
  vi.restoreAllMocks();
});
async function render(tree: React.ReactNode) {
  if (!owner) {
    host = document.createElement("div");
    document.body.append(host);
    owner = createRoot(host);
  }
  await act(async () => owner!.render(tree));
}

describe("React Dialog owned controls", () => {
  it.each([
    { name: "dialog", parts: Dialog, factory: createDialog },
    { name: "alert-dialog", parts: AlertDialog, factory: createAlertDialog },
    { name: "drawer", parts: Drawer, factory: createDrawer },
  ])(
    "retains $name ownership for late and replaced controls in Strict Mode",
    async ({ name, parts, factory }) => {
      const change = vi.fn();
      const complete = vi.fn();
      const Portal = "Portal" in parts ? parts.Portal : React.Fragment;
      const tree = (trigger: number | null, close: number | null, title = "same") => (
        <React.StrictMode>
          <parts.Root onOpenChange={change} onCloseComplete={complete} title={title}>
            {trigger !== null && <parts.Trigger key={trigger}>Open</parts.Trigger>}
            <Portal>
              <parts.Popup>
                <input aria-label="Focus target" />
                {close !== null && <parts.Close key={close}>Close</parts.Close>}
              </parts.Popup>
            </Portal>
          </parts.Root>
        </React.StrictMode>
      );
      await render(tree(null, null));
      const root = host.querySelector<HTMLElement>(`[data-sw-${name}]`)!;
      const instance = factory(root);
      const popup = document.querySelector<HTMLDialogElement>("dialog")!;
      const refresh = vi.spyOn(instance, "refresh");
      await render(tree(0, null));
      const trigger = root.querySelector<HTMLButtonElement>(`[data-sw-${name}-trigger]`)!;
      expect(trigger.getAttribute("aria-controls")).toBe(popup.id);
      expect(trigger.getAttribute("aria-expanded")).toBe("false");
      await act(() => {
        trigger.focus();
        trigger.click();
      });
      expect(popup.open).toBe(true);
      expect(change).toHaveBeenCalledTimes(1);
      const focused = document.activeElement;
      await render(tree(0, 0));
      expect(factory(root)).toBe(instance);
      expect(document.querySelector("dialog")).toBe(popup);
      expect(document.activeElement).toBe(focused);
      expect(document.body.style.overflow).toBe("hidden");
      const oldClose = popup.querySelector<HTMLButtonElement>(`[data-sw-${name}-close]`)!;
      await render(tree(0, 1));
      oldClose.click();
      expect(instance.getOpen()).toBe(true);
      refresh.mockClear();
      await render(tree(0, 1, "unrelated"));
      expect(refresh).not.toHaveBeenCalled();
      await act(() => popup.querySelector<HTMLButtonElement>(`[data-sw-${name}-close]`)!.click());
      expect(instance.getOpen()).toBe(false);
      await vi.waitFor(() => expect(popup.open).toBe(false));
      expect(complete).toHaveBeenCalledTimes(1);
      expect(document.activeElement).toBe(trigger);
      expect(change).toHaveBeenCalledTimes(2);
      await render(tree(1, 1));
      trigger.click();
      expect(instance.getOpen()).toBe(false);
      const replacement = root.querySelector<HTMLButtonElement>(`[data-sw-${name}-trigger]`)!;
      await act(() => replacement.click());
      expect(instance.getOpen()).toBe(true);
      await act(() => owner!.unmount());
      owner = undefined;
      await Promise.resolve();
      replacement.click();
      expect(document.body.style.overflow).toBe("");
    },
  );

  it.each([
    { name: "dialog", parts: Dialog },
    { name: "alert-dialog", parts: AlertDialog },
    { name: "drawer", parts: Drawer },
  ])(
    "composes direct $name Primitive controls through the owned wrapper",
    async ({ name, parts }) => {
      const Portal = "Portal" in parts ? parts.Portal : React.Fragment;
      const tree = (revision: number) => (
        <parts.Root>
          <parts.Trigger asChild>
            <a href={`#open-${revision}`}>Open</a>
          </parts.Trigger>
          <Portal>
            <parts.Popup>
              <parts.Close asChild>
                <a href={`#close-${revision}`}>Close</a>
              </parts.Close>
            </parts.Popup>
          </Portal>
        </parts.Root>
      );

      await render(tree(0));
      const triggerControl = host.querySelector<HTMLElement>(`[data-sw-${name}-trigger]`)!;
      const closeControl = document.querySelector<HTMLElement>(`[data-sw-${name}-close]`)!;
      expect(triggerControl.tagName).toBe("A");
      expect(closeControl.tagName).toBe("A");
      await act(() => triggerControl.click());
      expect(document.querySelector<HTMLDialogElement>("dialog")!.open).toBe(true);

      await render(tree(1));
      const replacementClose = document.querySelector<HTMLElement>(`[data-sw-${name}-close]`)!;
      expect(replacementClose).toHaveAttribute("href", "#close-1");
      await act(() => replacementClose.click());
      await vi.waitFor(() =>
        expect(document.querySelector<HTMLDialogElement>("dialog")!.open).toBe(false),
      );
    },
  );

  it("replaces a direct composed AlertDialog Close wrapper and its forwarded ref", async () => {
    const refs: string[] = [];
    const forwardedRef = (element: HTMLElement | null) => {
      refs.push(element?.tagName ?? "null");
    };
    const tree = (anchor: boolean) => (
      <AlertDialog.Root>
        <AlertDialog.Trigger>Open</AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Popup>
            <AlertDialog.Close asChild ref={forwardedRef}>
              {anchor ? <a href="#close">Close</a> : <button>Close</button>}
            </AlertDialog.Close>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    );

    await render(tree(false));
    expect(refs).toEqual(["DIV", "null", "DIV"]);
    await render(tree(true));
    expect(refs).toEqual(["DIV", "null", "DIV", "null", "DIV"]);
    const close = document.querySelector<HTMLElement>("[data-sw-alert-dialog-close]")!;
    expect(close.tagName).toBe("A");
    await act(() =>
      host.querySelector<HTMLButtonElement>("[data-sw-alert-dialog-trigger]")!.click(),
    );
    expect(document.querySelector<HTMLDialogElement>("dialog")!.open).toBe(true);
    await act(() => close.click());
    await vi.waitFor(() =>
      expect(document.querySelector<HTMLDialogElement>("dialog")!.open).toBe(false),
    );
  });
});
