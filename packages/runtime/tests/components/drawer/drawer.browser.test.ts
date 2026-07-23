import { beforeEach, describe, expect, it, vi } from "vitest";

import { initStarwind } from "../../../src/init-starwind";
import { createDialog } from "../../../src/components/dialog";
import { createDrawer } from "../../../src/components/drawer/drawer";
import { createFloatingPortalSession } from "../../../src/internal/floating-portal";

describe("createDrawer", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    document.body.style.overflow = "";
  });

  it("opens through a trigger and closes on outside interaction by default", () => {
    const root = renderDrawer();
    const listener = vi.fn();
    root.addEventListener("starwind:open-change", listener);

    const drawer = createDrawer(root);

    expect(drawer.getOpen()).toBe(false);
    expect(getPopup().getAttribute("role")).toBe("dialog");
    expect(getPopup().getAttribute("aria-labelledby")).toBe(getTitle().id);
    expect(getPopup().getAttribute("aria-describedby")).toBe(getDescription().id);
    expect(getPopup().open).toBe(false);
    expect(getBackdrop().hidden).toBe(true);

    getTrigger().click();

    expect(drawer.getOpen()).toBe(true);
    expect(getPopup().open).toBe(true);
    expect(getBackdrop().hidden).toBe(false);
    expect(getBackdrop().getAttribute("data-state")).toBe("open");

    getBackdrop().click();

    expect(drawer.getOpen()).toBe(false);
    expect(getPopup().open).toBe(false);
    expect(getBackdrop().hidden).toBe(true);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ open: true, reason: "trigger-press" }),
      }),
    );
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ open: false, reason: "outside-press" }),
      }),
    );

    drawer.destroy();
  });

  it("reports close button, escape, and programmatic open-change reasons", () => {
    const root = renderDrawer();
    const drawer = createDrawer(root);
    const listener = vi.fn();
    drawer.subscribe("openChange", listener);

    drawer.setOpen(true);
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ open: true, reason: "imperative-action" }),
    );

    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ open: false, reason: "escape-key" }),
    );

    getTrigger().click();
    getCloseButton().click();
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ open: false, reason: "close-press" }),
    );
  });

  it("opens initially from defaultOpen options and raw data-default-open markup", () => {
    const optionRoot = renderDrawer();
    const optionListener = vi.fn();
    optionRoot.addEventListener("starwind:open-change", optionListener);

    const optionDrawer = createDrawer(optionRoot, { defaultOpen: true });

    expect(optionDrawer.getOpen()).toBe(true);
    expect(getPopup().open).toBe(true);
    expect(getBackdrop().hidden).toBe(false);
    expect(optionRoot.getAttribute("data-state")).toBe("open");
    expect(getTrigger().getAttribute("aria-expanded")).toBe("true");
    expect(optionListener).not.toHaveBeenCalled();

    optionDrawer.destroy();
    optionRoot.replaceWith(renderDrawer({ defaultOpen: true }));
    const rawRoot = document.querySelector<HTMLElement>("[data-sw-drawer]")!;

    const rawDrawer = createDrawer(rawRoot);

    expect(rawDrawer.getOpen()).toBe(true);
    expect(getPopup().open).toBe(true);
    expect(getBackdrop().hidden).toBe(false);
    expect(rawRoot.getAttribute("data-state")).toBe("open");
    expect(getTrigger().getAttribute("aria-expanded")).toBe("true");

    rawDrawer.destroy();
  });

  it("preserves side placement markup while normalizing drawer parts", () => {
    const root = renderDrawer({ side: "left" });

    const drawer = createDrawer(root);

    expect(getPopup().getAttribute("data-side")).toBe("left");
    expect(getPopup().hasAttribute("data-sw-dialog-content")).toBe(true);
    expect(getPopup().getAttribute("role")).toBe("dialog");

    drawer.destroy();
  });

  it("honors non-modal drawers without locking body scroll", () => {
    const root = renderDrawer({ modal: false });

    const drawer = createDrawer(root);
    getTrigger().click();

    expect(drawer.getOpen()).toBe(true);
    expect(getPopup().open).toBe(true);
    expect(getPopup().getAttribute("aria-modal")).toBe("false");
    expect(document.body.style.overflow).toBe("");

    drawer.destroy();
  });

  it("emits close completion after drawer exit animation and cleanup finish", async () => {
    const root = renderDrawer();
    const closeAnimation = createDeferred();
    const onCloseComplete = vi.fn();
    const closeCompleteListener = vi.fn();
    root.addEventListener("starwind:close-complete", closeCompleteListener);

    const drawer = createDrawer(root, { onCloseComplete });
    const closeCompleteSubscriber = vi.fn();
    drawer.subscribe("closeComplete", closeCompleteSubscriber);

    getTrigger().click();

    Object.defineProperty(getPopup(), "getAnimations", {
      configurable: true,
      value: () => [{ finished: closeAnimation.promise }] as unknown as Animation[],
    });

    const closeButton = getCloseButton();
    closeButton.click();

    expect(closeCompleteListener).not.toHaveBeenCalled();
    expect(getPopup().open).toBe(true);

    closeAnimation.resolve();
    await closeAnimation.promise;
    await waitForMicrotasks();

    const expectedDetails = expect.objectContaining({
      open: false,
      reason: "close-press",
      trigger: closeButton,
    });
    expect(getPopup().open).toBe(false);
    expect(onCloseComplete).toHaveBeenCalledWith(expectedDetails);
    expect(closeCompleteListener).toHaveBeenCalledWith(
      expect.objectContaining({ detail: expectedDetails }),
    );
    expect(closeCompleteSubscriber).toHaveBeenCalledWith(expectedDetails);
  });

  it("inherits dialog-owned floating layer closure and native cleanup", () => {
    const root = renderDrawer();
    const drawer = createDrawer(root);
    drawer.open();
    const popup = getPopup();
    popup.setAttribute("data-slot", "drawer-content");
    const portalTarget = document.createElement("div");
    portalTarget.setAttribute("data-floating-root", "");
    const layer = document.createElement("div");
    layer.setAttribute("data-state", "open");
    popup.append(portalTarget, layer);
    const closeEvents: string[] = [];
    let session = createFloatingPortalSession({
      root: layer,
      getPortalElement: () => layer,
      getPortalTarget: () => portalTarget,
      onOwnerCloseRequest: () => {
        closeEvents.push("requested");
        layer.setAttribute("data-state", "closed");
        session.restore();
      },
    });
    session.mount();

    expect(document.querySelector("[data-sw-floating-portal]:popover-open")).not.toBeNull();

    drawer.close();

    expect(closeEvents).toEqual(["requested"]);
    expect(layer.getAttribute("data-state")).toBe("closed");
    expect(popup.open).toBe(false);
    expect(document.querySelector("[data-sw-floating-portal]")).toBeNull();

    session.destroy();
    drawer.destroy();
  });

  it("can disable outside interaction closing", () => {
    const root = renderDrawer({ closeOnOutsideInteract: false });

    const drawer = createDrawer(root);

    getTrigger().click();
    getBackdrop().click();

    expect(drawer.getOpen()).toBe(true);
    expect(getPopup().open).toBe(true);

    drawer.destroy();
  });

  it("handles native cancel events and respects closeOnEscape", () => {
    const root = renderDrawer();
    const drawer = createDrawer(root);
    getTrigger().click();

    const cancelEvent = new Event("cancel", { cancelable: true });
    getPopup().dispatchEvent(cancelEvent);

    expect(cancelEvent.defaultPrevented).toBe(true);
    expect(drawer.getOpen()).toBe(false);
    expect(getPopup().open).toBe(false);

    drawer.destroy();
    root.replaceWith(renderDrawer({ closeOnEscape: false }));
    const nextRoot = document.querySelector<HTMLElement>("[data-sw-drawer]")!;
    const nextDrawer = createDrawer(nextRoot);
    getTrigger().click();

    const blockedCancelEvent = new Event("cancel", { cancelable: true });
    getPopup().dispatchEvent(blockedCancelEvent);

    expect(blockedCancelEvent.defaultPrevented).toBe(true);
    expect(nextDrawer.getOpen()).toBe(true);
    expect(getPopup().open).toBe(true);

    nextDrawer.destroy();
  });

  it("opens from an external asChild trigger targeting the drawer root", () => {
    const wrapper = document.createElement("div");
    wrapper.dataset.swDrawerTrigger = "";
    wrapper.dataset.swDrawerTargetId = "external-drawer";
    wrapper.dataset.asChild = "";
    wrapper.className = "drawer-trigger-shell";
    wrapper.innerHTML = `<button id="external-drawer-trigger">Open external drawer</button>`;
    document.body.append(wrapper);

    const root = renderDrawer();
    root.id = "external-drawer";

    const drawer = createDrawer(root);
    const trigger = document.querySelector<HTMLButtonElement>("#external-drawer-trigger")!;

    expect(trigger.getAttribute("aria-controls")).toBe(getPopup().id);
    expect(trigger.getAttribute("data-sw-drawer-target-id")).toBe("external-drawer");
    expect(trigger.getAttribute("data-dialog-for")).toBeNull();
    expect(trigger.classList.contains("drawer-trigger-shell")).toBe(true);
    expect(wrapper.getAttribute("class")).toBeNull();
    expect(wrapper.style.display).toBe("contents");
    expect(wrapper.getAttribute("aria-controls")).toBeNull();

    trigger.click();

    expect(drawer.getOpen()).toBe(true);
    expect(getPopup().open).toBe(true);

    drawer.destroy();
  });

  it("inherits topmost nested behavior when opened inside a dialog", () => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div data-sw-dialog>
        <button id="parent-dialog-trigger" data-sw-dialog-trigger>Open parent dialog</button>
        <div data-sw-dialog-overlay hidden></div>
        <dialog id="parent-dialog-content" data-sw-dialog-content>
          <h2 data-sw-dialog-title>Parent dialog</h2>
          <p data-sw-dialog-description>Parent description.</p>
          <div data-sw-drawer>
            <button id="nested-drawer-trigger" data-sw-drawer-trigger>Open nested drawer</button>
            <div id="nested-drawer-backdrop" data-sw-drawer-backdrop hidden></div>
            <dialog id="nested-drawer-popup" data-sw-drawer-popup>
              <h2 data-sw-drawer-title>Nested drawer</h2>
              <p data-sw-drawer-description>Nested drawer description.</p>
              <button data-sw-drawer-close>Close drawer</button>
            </dialog>
          </div>
        </dialog>
      </div>
    `;
    const parentRoot = wrapper.firstElementChild as HTMLElement;
    document.body.append(parentRoot);

    const parentDialog = createDialog(parentRoot);
    const drawer = createDrawer(document.querySelector<HTMLElement>("[data-sw-drawer]")!);

    document.querySelector<HTMLButtonElement>("#parent-dialog-trigger")!.click();
    document.querySelector<HTMLButtonElement>("#nested-drawer-trigger")!.click();

    const parentContent = document.querySelector<HTMLDialogElement>("#parent-dialog-content")!;
    const nestedBackdrop = document.querySelector<HTMLElement>("#nested-drawer-backdrop")!;
    const nestedPopup = document.querySelector<HTMLDialogElement>("#nested-drawer-popup")!;

    expect(parentContent.open).toBe(true);
    expect(nestedPopup.open).toBe(true);
    expect(parentContent.hasAttribute("data-nested-dialog-open")).toBe(true);
    expect(nestedBackdrop.hidden).toBe(true);

    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));

    expect(nestedPopup.open).toBe(false);
    expect(parentContent.open).toBe(true);

    drawer.destroy();
    parentDialog.destroy();
  });

  it("keeps body scroll locked while a sibling dialog remains open", () => {
    const dialogRoot = renderBaseDialog();
    const drawerRoot = renderDrawer();
    const dialog = createDialog(dialogRoot);
    const drawer = createDrawer(drawerRoot);

    dialog.setOpen(true);
    drawer.setOpen(true);

    expect(document.body.style.overflow).toBe("hidden");

    drawer.setOpen(false);

    expect(dialog.getOpen()).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");

    dialog.setOpen(false);

    expect(document.body.style.overflow).toBe("");
  });

  it("keeps body scroll locked when an overlapping drawer is destroyed", () => {
    const dialogRoot = renderBaseDialog();
    const drawerRoot = renderDrawer();
    const dialog = createDialog(dialogRoot);
    const drawer = createDrawer(drawerRoot);

    dialog.setOpen(true);
    drawer.setOpen(true);

    drawer.destroy();

    expect(dialog.getOpen()).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    dialog.destroy();

    expect(document.body.style.overflow).toBe("");
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
    expect(document.body.style.getPropertyValue("--sw-scrollbar-width")).toBe("");
  });

  it("allows onOpenChange details cancellation before DOM state changes", () => {
    const root = renderDrawer();
    const canceledSnapshots: boolean[] = [];
    let callbackDetails: unknown;
    let eventDetails: unknown;
    const onOpenChange = vi.fn((_open, details) => {
      callbackDetails = details;
      canceledSnapshots.push(details.isCanceled);
      details.cancel();
      canceledSnapshots.push(details.isCanceled);
    });
    const openChangeListener = vi.fn((event: Event) => {
      eventDetails = (event as CustomEvent).detail;
    });
    root.addEventListener("starwind:open-change", openChangeListener);

    const drawer = createDrawer(root, { onOpenChange });
    const subscriber = vi.fn();
    drawer.subscribe("openChange", subscriber);

    getTrigger().click();

    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({
        isCanceled: true,
        open: true,
        reason: "trigger-press",
        trigger: getTrigger(),
      }),
    );
    expect(canceledSnapshots).toEqual([false, true]);
    expect(openChangeListener).toHaveBeenCalledTimes(1);
    expect(eventDetails).toBe(callbackDetails);
    expect(subscriber).not.toHaveBeenCalled();
    expect(drawer.getOpen()).toBe(false);
    expect(getPopup().open).toBe(false);
    expect(getBackdrop().hidden).toBe(true);

    drawer.destroy();
  });

  it("focuses the first focusable drawer control when opened", () => {
    const root = renderDrawer();

    const drawer = createDrawer(root);
    getTrigger().click();

    expect(document.activeElement).toBe(getCloseButton());

    drawer.destroy();
  });

  it("supports controlled mode without mutating DOM until setOpen is called", () => {
    const root = renderDrawer();
    const onOpenChange = vi.fn();
    const drawer = createDrawer(root, {
      open: false,
      onOpenChange,
    });

    getTrigger().click();

    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ open: true, reason: "trigger-press" }),
    );
    expect(drawer.getOpen()).toBe(false);
    expect(getPopup().open).toBe(false);

    drawer.setOpen(true, { emit: false });

    expect(drawer.getOpen()).toBe(true);
    expect(getPopup().open).toBe(true);

    drawer.destroy();
  });

  it("initializes raw HTML drawers through initStarwind", () => {
    renderDrawer();

    const cleanup = initStarwind();

    getTrigger().click();
    expect(getPopup().open).toBe(true);

    cleanup.destroy();
    getTrigger().click();
    expect(getPopup().open).toBe(false);
  });

  it("requires a native drawer popup element", () => {
    const root = renderDrawer();
    getPopup().remove();

    expect(() => createDrawer(root)).toThrow("Dialog requires a [data-sw-dialog-content] element.");
  });
});

function renderDrawer(
  options: {
    closeOnEscape?: boolean;
    closeOnOutsideInteract?: boolean;
    defaultOpen?: boolean;
    modal?: boolean;
    side?: "top" | "right" | "bottom" | "left";
  } = {},
): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div
      data-sw-drawer
      ${options.defaultOpen ? "data-default-open" : ""}
      ${options.closeOnEscape === false ? 'data-close-on-escape="false"' : ""}
      ${options.closeOnOutsideInteract === false ? 'data-close-on-outside-interact="false"' : ""}
      ${options.modal === false ? 'data-modal="false"' : ""}
    >
      <button data-sw-drawer-trigger>Open drawer</button>
      <div data-sw-drawer-backdrop hidden></div>
      <dialog data-sw-drawer-popup ${options.side ? `data-side="${options.side}"` : ""}>
        <h2 data-sw-drawer-title>Drawer title</h2>
        <p data-sw-drawer-description>Drawer description.</p>
        <button data-sw-drawer-close>Close</button>
      </dialog>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderBaseDialog(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-dialog>
      <button data-sw-dialog-trigger>Open dialog</button>
      <div data-sw-dialog-overlay hidden></div>
      <dialog data-sw-dialog-content>
        <h2 data-sw-dialog-title>Dialog title</h2>
        <p data-sw-dialog-description>Dialog description.</p>
        <button data-sw-dialog-close>Close</button>
      </dialog>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function getTrigger(): HTMLButtonElement {
  return document.querySelector<HTMLButtonElement>("[data-sw-drawer-trigger]")!;
}

function getBackdrop(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-drawer-backdrop]")!;
}

function getPopup(): HTMLDialogElement {
  return document.querySelector<HTMLDialogElement>("[data-sw-drawer-popup]")!;
}

function getTitle(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-drawer-title]")!;
}

function getDescription(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-drawer-description]")!;
}

function getCloseButton(): HTMLButtonElement {
  return document.querySelector<HTMLButtonElement>("[data-sw-drawer-close]")!;
}

function createDeferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve!: () => void;
  const promise = new Promise<void>((promiseResolve) => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
}

async function waitForMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
