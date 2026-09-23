import { createAlertDialog } from "@starwind-ui/runtime/alert-dialog";
import { createDialog } from "@starwind-ui/runtime/dialog";
import { createDrawer } from "@starwind-ui/runtime/drawer";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import AlertDialog from "../../../apps/react-demo/src/components/starwind-runtime/alert-dialog";
import Dialog from "../../../apps/react-demo/src/components/starwind-runtime/dialog";
import Sheet from "../../../apps/react-demo/src/components/starwind-runtime/sheet";

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
const families = [
  { name: "dialog", parts: Dialog, Close: Dialog.Close, factory: createDialog },
  { name: "drawer", parts: Sheet, Close: Sheet.Close, factory: createDrawer },
  {
    name: "alert-dialog",
    parts: AlertDialog,
    Close: AlertDialog.Action,
    factory: createAlertDialog,
  },
] as const;

describe("Styled native overlay control wiring", () => {
  it.each(families)(
    "refreshes $name child controls with stable ownership",
    async ({ name, parts, Close, factory }) => {
      const change = vi.fn();
      let veto = false;
      const childRef = React.createRef<HTMLButtonElement>();
      const tree = (shown: boolean, key = 0, title = "same") => (
        <React.StrictMode>
          <parts.Root
            title={title}
            onOpenChange={(open, detail) => {
              change(open);
              if (veto) detail.cancel();
            }}
          >
            {shown && (
              <parts.Trigger asChild>
                <button key={key} data-test-trigger ref={childRef}>
                  Open
                </button>
              </parts.Trigger>
            )}
            <parts.Content>
              <parts.Title>Title</parts.Title>
              <input aria-label="Focus target" />
              {shown && (
                <Close asChild>
                  <button key={key} data-test-close>
                    Close
                  </button>
                </Close>
              )}
              <parts.Root data-nested>
                <parts.Trigger asChild>
                  <button data-nested-trigger>Nested</button>
                </parts.Trigger>
                <parts.Content>
                  <parts.Title>Nested</parts.Title>
                  {shown && (
                    <Close asChild>
                      <button data-nested-close>Close nested</button>
                    </Close>
                  )}
                </parts.Content>
              </parts.Root>
            </parts.Content>
          </parts.Root>
        </React.StrictMode>
      );
      await render(tree(false));
      const root = host.querySelector<HTMLElement>(`[data-sw-${name}]`)!;
      const instance = factory(root);
      const popup = document.querySelector<HTMLDialogElement>("dialog")!;
      const refresh = vi.spyOn(instance, "refresh");
      await render(tree(true));
      const trigger = root.querySelector<HTMLButtonElement>("[data-test-trigger]")!;
      expect(childRef.current).toBe(trigger);
      expect(trigger.getAttribute("aria-controls")).toBe(popup.id);
      await act(() => {
        trigger.focus();
        trigger.click();
      });
      expect(instance.getOpen()).toBe(true);
      const focus = document.activeElement;
      const oldClose = popup.querySelector<HTMLButtonElement>("[data-test-close]")!;
      await render(tree(true, 1));
      expect(factory(root)).toBe(instance);
      expect(document.querySelector("dialog")).toBe(popup);
      expect(document.activeElement).toBe(focus);
      expect(document.body.style.overflow).toBe("hidden");
      oldClose.click();
      expect(instance.getOpen()).toBe(true);
      const close = popup.querySelector<HTMLButtonElement>("[data-test-close]")!;
      const nestedRoot = popup.querySelector<HTMLElement>("[data-nested]")!;
      const nested = factory(nestedRoot);
      await act(() => popup.querySelector<HTMLButtonElement>("[data-nested-trigger]")!.click());
      expect(nested.getOpen()).toBe(true);
      const outerProposals = change.mock.calls.length;
      await act(() => close.click());
      expect(instance.getOpen()).toBe(true);
      expect(change).toHaveBeenCalledTimes(outerProposals);
      await act(() => nestedRoot.querySelector<HTMLButtonElement>("[data-nested-close]")!.click());
      await vi.waitFor(() =>
        expect(nestedRoot.querySelector<HTMLDialogElement>("dialog")!.open).toBe(false),
      );
      expect(instance.getOpen()).toBe(true);
      veto = true;
      await act(() => close.click());
      expect(instance.getOpen()).toBe(true);
      veto = false;
      const cancel = (event: Event) => event.preventDefault();
      root.addEventListener("starwind:open-change", cancel);
      await act(() => close.click());
      expect(instance.getOpen()).toBe(true);
      root.removeEventListener("starwind:open-change", cancel);
      refresh.mockClear();
      await render(tree(true, 1, "unrelated"));
      expect(refresh).not.toHaveBeenCalled();
      await act(() => close.click());
      await vi.waitFor(() => expect(popup.open).toBe(false));
      expect(instance.getOpen()).toBe(false);
      expect(change.mock.calls.map(([open]) => open)).toEqual([true, false, false, false]);
      await render(tree(false));
      expect(childRef.current).toBeNull();
      const proposals = change.mock.calls.length;
      trigger.click();
      close.click();
      expect(change).toHaveBeenCalledTimes(proposals);
      await render(tree(true, 2));
      await act(() => root.querySelector<HTMLButtonElement>("[data-test-trigger]")!.click());
      expect(instance.getOpen()).toBe(true);
      await act(() => owner!.unmount());
      owner = undefined;
      expect(document.body.style.overflow).toBe("");
      expect(childRef.current).toBeNull();
    },
  );

  it.each([AlertDialog.Action, AlertDialog.Cancel])(
    "connects late Button and anchor branches with caller ref cleanup",
    async (Control) => {
      const refs: string[] = [];
      const caller = (element: HTMLButtonElement | HTMLAnchorElement | null) => {
        refs.push(element?.tagName ?? "null");
      };
      const tree = (show: boolean, anchor = false) => (
        <AlertDialog.Root>
          <AlertDialog.Trigger>Open</AlertDialog.Trigger>
          <AlertDialog.Content>
            <AlertDialog.Title>Confirm</AlertDialog.Title>
            {show && (
              <Control
                href={anchor ? "#confirmed" : undefined}
                ref={caller}
                data-control
                data-current={anchor ? "anchor" : "button"}
                className={anchor ? "current-anchor" : "current-button"}
                onClick={(event) => event.preventDefault()}
              >
                Confirm
              </Control>
            )}
          </AlertDialog.Content>
        </AlertDialog.Root>
      );
      await render(tree(false));
      const root = host.querySelector<HTMLElement>("[data-sw-alert-dialog]")!;
      const instance = createAlertDialog(root);
      await act(() =>
        root.querySelector<HTMLButtonElement>("[data-sw-alert-dialog-trigger]")!.click(),
      );
      await render(tree(true));
      const first = document.querySelector<HTMLElement>("[data-control]")!;
      expect(first.tagName).toBe("BUTTON");
      expect(first).toHaveAttribute(
        "data-slot",
        Control === AlertDialog.Action ? "alert-dialog-action" : "alert-dialog-cancel",
      );
      expect(first).toHaveAttribute("data-sw-alert-dialog-close");
      expect(first.closest("[data-as-child]")).toBeNull();
      await render(tree(true, true));
      const anchor = document.querySelector<HTMLElement>("[data-control]")!;
      expect(anchor.tagName).toBe("A");
      expect(anchor.closest("[data-as-child]")).toBeNull();
      expect(anchor).toHaveAttribute("data-current", "anchor");
      expect(anchor).toHaveClass("current-anchor");
      expect(anchor).not.toHaveClass("current-button");
      expect(refs).toEqual(["BUTTON", "null", "A"]);
      first.click();
      expect(instance.getOpen()).toBe(true);
      await act(() => anchor.click());
      expect(instance.getOpen()).toBe(false);
      await vi.waitFor(() =>
        expect(document.querySelector<HTMLDialogElement>("dialog")!.open).toBe(false),
      );
      await render(tree(false));
      expect(refs.at(-1)).toBe("null");
    },
  );
});
