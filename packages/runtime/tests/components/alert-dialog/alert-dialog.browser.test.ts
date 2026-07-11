import { beforeEach, describe, expect, it, vi } from "vitest";

import { initStarwind } from "../../../src/init-starwind";
import { createDialog } from "../../../src/components/dialog";
import { createAlertDialog } from "../../../src/components/alert-dialog/alert-dialog";

describe("createAlertDialog", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    document.body.style.overflow = "";
  });

  it("opens through a trigger and requires an explicit close action by default", () => {
    const root = renderAlertDialog();
    const listener = vi.fn();
    root.addEventListener("starwind:open-change", listener);

    const alertDialog = createAlertDialog(root);

    expect(alertDialog.getOpen()).toBe(false);
    expect(getPopup().getAttribute("role")).toBe("alertdialog");
    expect(getPopup().getAttribute("aria-labelledby")).toBe(getTitle().id);
    expect(getPopup().getAttribute("aria-describedby")).toBe(getDescription().id);
    expect(getPopup().open).toBe(false);
    expect(getBackdrop().hidden).toBe(true);

    getTrigger().click();

    expect(alertDialog.getOpen()).toBe(true);
    expect(getPopup().open).toBe(true);
    expect(getBackdrop().hidden).toBe(false);
    expect(getBackdrop().getAttribute("data-state")).toBe("open");

    getBackdrop().click();

    expect(alertDialog.getOpen()).toBe(true);
    expect(getPopup().open).toBe(true);

    getAction().click();

    expect(alertDialog.getOpen()).toBe(false);
    expect(getPopup().open).toBe(false);
    expect(getBackdrop().hidden).toBe(true);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ open: true, reason: "trigger-press" }),
      }),
    );
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ open: false, reason: "close-press" }),
      }),
    );
  });

  it("allows outside interaction closing when explicitly enabled", () => {
    const root = renderAlertDialog();

    const alertDialog = createAlertDialog(root, { closeOnOutsideInteract: true });

    getTrigger().click();
    getBackdrop().click();

    expect(alertDialog.getOpen()).toBe(false);
    expect(getPopup().open).toBe(false);
  });

  it("allows outside interaction closing from root attributes", () => {
    const root = renderAlertDialog({ closeOnOutsideInteract: true });

    const alertDialog = createAlertDialog(root);

    getTrigger().click();
    getBackdrop().click();

    expect(alertDialog.getOpen()).toBe(false);
    expect(getPopup().open).toBe(false);
  });

  it("opens initially from defaultOpen options and raw data-default-open markup", () => {
    const optionRoot = renderAlertDialog();
    const optionListener = vi.fn();
    optionRoot.addEventListener("starwind:open-change", optionListener);

    const optionAlertDialog = createAlertDialog(optionRoot, { defaultOpen: true });

    expect(optionAlertDialog.getOpen()).toBe(true);
    expect(getPopup().open).toBe(true);
    expect(getBackdrop().hidden).toBe(false);
    expect(optionRoot.getAttribute("data-state")).toBe("open");
    expect(getTrigger().getAttribute("aria-expanded")).toBe("true");
    expect(optionListener).not.toHaveBeenCalled();

    optionAlertDialog.destroy();
    optionRoot.replaceWith(renderAlertDialog({ defaultOpen: true }));
    const rawRoot = document.querySelector<HTMLElement>("[data-sw-alert-dialog]")!;

    const rawAlertDialog = createAlertDialog(rawRoot);

    expect(rawAlertDialog.getOpen()).toBe(true);
    expect(getPopup().open).toBe(true);
    expect(getBackdrop().hidden).toBe(false);
    expect(rawRoot.getAttribute("data-state")).toBe("open");
    expect(getTrigger().getAttribute("aria-expanded")).toBe("true");

    rawAlertDialog.destroy();
  });

  it("supports external asChild triggers and asChild close actions", () => {
    const triggerWrapper = document.createElement("div");
    triggerWrapper.dataset.swAlertDialogTrigger = "";
    triggerWrapper.dataset.swAlertDialogTargetId = "external-alert-dialog";
    triggerWrapper.dataset.asChild = "";
    triggerWrapper.className = "alert-trigger-shell";
    triggerWrapper.innerHTML = `<button id="external-alert-trigger">Open external alert</button>`;
    document.body.append(triggerWrapper);

    const root = renderAlertDialog();
    root.id = "external-alert-dialog";
    getAction().outerHTML = `
      <div
        id="wrapped-alert-action-shell"
        class="alert-action-shell"
        data-slot="alert-dialog-action"
        data-sw-alert-dialog-close
        data-as-child
      >
        <button id="wrapped-alert-action" data-alert-dialog-action>Discard</button>
      </div>
    `;
    const actionWrapper = root.querySelector<HTMLElement>("#wrapped-alert-action-shell")!;

    const alertDialog = createAlertDialog(root);
    const trigger = document.querySelector<HTMLButtonElement>("#external-alert-trigger")!;
    const action = document.querySelector<HTMLButtonElement>("#wrapped-alert-action")!;

    expect(trigger.getAttribute("aria-controls")).toBe(getPopup().id);
    expect(trigger.getAttribute("data-sw-alert-dialog-target-id")).toBe("external-alert-dialog");
    expect(trigger.getAttribute("data-dialog-for")).toBeNull();
    expect(trigger.classList.contains("alert-trigger-shell")).toBe(true);
    expect(triggerWrapper.getAttribute("class")).toBeNull();
    expect(triggerWrapper.style.display).toBe("contents");
    expect(triggerWrapper.getAttribute("aria-controls")).toBeNull();

    trigger.click();

    expect(alertDialog.getOpen()).toBe(true);
    expect(getPopup().open).toBe(true);

    action.click();

    expect(alertDialog.getOpen()).toBe(false);
    expect(getPopup().open).toBe(false);
    expect(action.getAttribute("data-slot")).toBe("alert-dialog-action");
    expect(action.classList.contains("alert-action-shell")).toBe(true);
    expect(actionWrapper.getAttribute("class")).toBeNull();
    expect(actionWrapper.style.display).toBe("contents");
    expect(actionWrapper.getAttribute("aria-controls")).toBeNull();
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
          <div data-sw-alert-dialog>
            <button id="nested-alert-trigger" data-sw-alert-dialog-trigger>Open nested alert</button>
            <div id="nested-alert-backdrop" data-sw-alert-dialog-backdrop hidden></div>
            <dialog id="nested-alert-popup" data-sw-alert-dialog-popup>
              <h2 data-sw-alert-dialog-title>Nested alert</h2>
              <p data-sw-alert-dialog-description>Nested alert description.</p>
              <button data-sw-alert-dialog-close>Cancel</button>
            </dialog>
          </div>
        </dialog>
      </div>
    `;
    const parentRoot = wrapper.firstElementChild as HTMLElement;
    document.body.append(parentRoot);

    const parentDialog = createDialog(parentRoot);
    const alertDialog = createAlertDialog(
      document.querySelector<HTMLElement>("[data-sw-alert-dialog]")!,
    );

    document.querySelector<HTMLButtonElement>("#parent-dialog-trigger")!.click();
    document.querySelector<HTMLButtonElement>("#nested-alert-trigger")!.click();

    const parentContent = document.querySelector<HTMLDialogElement>("#parent-dialog-content")!;
    const nestedBackdrop = document.querySelector<HTMLElement>("#nested-alert-backdrop")!;
    const nestedPopup = document.querySelector<HTMLDialogElement>("#nested-alert-popup")!;

    expect(parentContent.open).toBe(true);
    expect(nestedPopup.open).toBe(true);
    expect(parentContent.hasAttribute("data-nested-dialog-open")).toBe(true);
    expect(nestedBackdrop.hidden).toBe(true);

    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));

    expect(nestedPopup.open).toBe(false);
    expect(parentContent.open).toBe(true);

    alertDialog.destroy();
    parentDialog.destroy();
  });

  it("keeps body scroll locked while a sibling dialog remains open", () => {
    const dialogRoot = renderBaseDialog();
    const alertDialogRoot = renderAlertDialog();
    const dialog = createDialog(dialogRoot);
    const alertDialog = createAlertDialog(alertDialogRoot);

    dialog.setOpen(true);
    alertDialog.setOpen(true);

    expect(document.body.style.overflow).toBe("hidden");

    alertDialog.setOpen(false);

    expect(dialog.getOpen()).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");

    dialog.setOpen(false);

    expect(document.body.style.overflow).toBe("");
  });

  it("supports controlled mode without mutating DOM until setOpen is called", () => {
    const root = renderAlertDialog();
    const onOpenChange = vi.fn();
    const alertDialog = createAlertDialog(root, {
      open: false,
      onOpenChange,
    });

    getTrigger().click();

    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ open: true, reason: "trigger-press" }),
    );
    expect(alertDialog.getOpen()).toBe(false);
    expect(getPopup().open).toBe(false);

    alertDialog.setOpen(true, { emit: false });

    expect(alertDialog.getOpen()).toBe(true);
    expect(getPopup().open).toBe(true);

    alertDialog.destroy();
  });

  it("allows onOpenChange details cancellation before DOM state changes", () => {
    const root = renderAlertDialog();
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

    const alertDialog = createAlertDialog(root, { onOpenChange });
    const subscriber = vi.fn();
    alertDialog.subscribe("openChange", subscriber);

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
    expect(alertDialog.getOpen()).toBe(false);
    expect(getPopup().open).toBe(false);
    expect(getBackdrop().hidden).toBe(true);

    alertDialog.destroy();
  });

  it("requires an alert dialog popup element", () => {
    const root = renderAlertDialog();
    getPopup().remove();

    expect(() => createAlertDialog(root)).toThrow(
      "Dialog requires a [data-sw-dialog-content] element.",
    );
  });

  it("emits close completion after exit animation and cleanup finish", async () => {
    const root = renderAlertDialog();
    const closeAnimation = createDeferred();
    const onCloseComplete = vi.fn();
    const closeCompleteListener = vi.fn();
    root.addEventListener("starwind:close-complete", closeCompleteListener);

    createAlertDialog(root, { onCloseComplete });
    getTrigger().click();

    Object.defineProperty(getPopup(), "getAnimations", {
      configurable: true,
      value: () => [{ finished: closeAnimation.promise }] as unknown as Animation[],
    });

    const action = getAction();
    action.click();

    expect(onCloseComplete).not.toHaveBeenCalled();
    expect(closeCompleteListener).not.toHaveBeenCalled();
    expect(getPopup().open).toBe(true);

    closeAnimation.resolve();
    await closeAnimation.promise;
    await waitForMicrotasks();

    const expectedDetails = expect.objectContaining({
      open: false,
      reason: "close-press",
      trigger: action,
    });
    expect(getPopup().open).toBe(false);
    expect(onCloseComplete).toHaveBeenCalledWith(expectedDetails);
    expect(closeCompleteListener).toHaveBeenCalledWith(
      expect.objectContaining({ detail: expectedDetails }),
    );
  });

  it("initializes raw HTML alert dialogs through initStarwind", () => {
    renderAlertDialog();

    const cleanup = initStarwind();

    getTrigger().click();
    expect(getPopup().open).toBe(true);

    cleanup.destroy();
    getAction().click();
    expect(getPopup().open).toBe(false);
  });
});

function renderAlertDialog(
  options: { closeOnOutsideInteract?: boolean; defaultOpen?: boolean } = {},
): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-alert-dialog ${
      options.closeOnOutsideInteract ? 'data-close-on-outside-interact="true"' : ""
    } ${options.defaultOpen ? "data-default-open" : ""}>
      <button data-sw-alert-dialog-trigger>Discard draft</button>
      <div data-sw-alert-dialog-backdrop hidden></div>
      <dialog data-sw-alert-dialog-popup>
        <h2 data-sw-alert-dialog-title>Discard draft?</h2>
        <p data-sw-alert-dialog-description>This action cannot be undone.</p>
        <button data-sw-alert-dialog-close>Cancel</button>
        <button data-sw-alert-dialog-close data-alert-dialog-action>Discard</button>
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
  return document.querySelector<HTMLButtonElement>("[data-sw-alert-dialog-trigger]")!;
}

function getBackdrop(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-alert-dialog-backdrop]")!;
}

function getPopup(): HTMLDialogElement {
  return document.querySelector<HTMLDialogElement>("[data-sw-alert-dialog-popup]")!;
}

function getAction(): HTMLButtonElement {
  return document.querySelector<HTMLButtonElement>("[data-alert-dialog-action]")!;
}

function getTitle(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-alert-dialog-title]")!;
}

function getDescription(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-alert-dialog-description]")!;
}

function createDeferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve!: () => void;
  const promise = new Promise<void>((promiseResolve) => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
}

function waitForMicrotasks(): Promise<void> {
  return new Promise((resolve) => {
    queueMicrotask(resolve);
  });
}
