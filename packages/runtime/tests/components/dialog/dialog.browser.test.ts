import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDialog } from "../../../src/components/dialog/dialog";

describe("createDialog", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    document.body.style.overflow = "";
  });

  it("initializes closed by default with ARIA wiring", () => {
    const root = renderDialog();
    createDialog(root);

    const trigger = getTrigger();
    const content = getContent();
    const overlay = getOverlay();
    const title = getTitle();
    const description = getDescription();

    expect(content.open).toBe(false);
    expect(overlay.hidden).toBe(true);
    expect(content.getAttribute("role")).toBe("dialog");
    expect(content.getAttribute("aria-modal")).toBe("true");
    expect(content.getAttribute("aria-labelledby")).toBe(title.id);
    expect(content.getAttribute("aria-describedby")).toBe(description.id);
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger.getAttribute("aria-controls")).toBe(content.id);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(content.getAttribute("data-state")).toBe("closed");
  });

  it("opens on trigger click and closes on close button click", () => {
    const root = renderDialog();
    const outsideButton = document.createElement("button");
    outsideButton.textContent = "Outside";
    document.body.prepend(outsideButton);
    outsideButton.focus();

    const listener = vi.fn();
    root.addEventListener("starwind:open-change", listener);

    createDialog(root);
    getTrigger().click();

    expect(getContent().open).toBe(true);
    expect(getOverlay().hidden).toBe(false);
    expect(getTrigger().getAttribute("aria-expanded")).toBe("true");
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.activeElement).toBe(getInput());

    getCloseButton().click();

    expect(getContent().open).toBe(false);
    expect(getOverlay().hidden).toBe(true);
    expect(getTrigger().getAttribute("aria-expanded")).toBe("false");
    expect(document.body.style.overflow).toBe("");
    expect(document.activeElement).toBe(outsideButton);
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

  it("opens initially from defaultOpen options without emitting open-change", () => {
    const root = renderDialog();
    const listener = vi.fn();
    root.addEventListener("starwind:open-change", listener);
    const outsideButton = document.createElement("button");
    outsideButton.textContent = "Outside";
    document.body.prepend(outsideButton);
    outsideButton.focus();

    const dialog = createDialog(root, { defaultOpen: true });

    expect(dialog.getOpen()).toBe(true);
    expect(getContent().open).toBe(true);
    expect(getContent().hidden).toBe(false);
    expect(getOverlay().hidden).toBe(false);
    expect(root.getAttribute("data-state")).toBe("open");
    expect(getTrigger().getAttribute("aria-expanded")).toBe("true");
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.activeElement).toBe(getInput());
    expect(listener).not.toHaveBeenCalled();

    dialog.destroy();
  });

  it("opens initially from raw data-default-open markup", () => {
    const root = renderDialog({ defaultOpen: true });

    const dialog = createDialog(root);

    expect(dialog.getOpen()).toBe(true);
    expect(getContent().open).toBe(true);
    expect(getOverlay().hidden).toBe(false);
    expect(getTrigger().getAttribute("aria-expanded")).toBe("true");

    dialog.destroy();
  });

  it("honors non-modal dialogs without locking body scroll", () => {
    const root = renderDialog({ modal: false });

    const dialog = createDialog(root);
    getTrigger().click();

    expect(getContent().open).toBe(true);
    expect(getContent().getAttribute("aria-modal")).toBe("false");
    expect(document.body.style.overflow).toBe("");
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);

    dialog.destroy();
  });

  it("responds to imperative dialog events on the root", () => {
    const root = renderDialog();
    const listener = vi.fn();
    root.addEventListener("starwind:open-change", listener);

    const dialog = createDialog(root);

    root.dispatchEvent(new CustomEvent("dialog:open"));

    expect(getContent().open).toBe(true);
    expect(root.getAttribute("data-state")).toBe("open");

    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ open: true, reason: "imperative-action" }),
      }),
    );

    root.dispatchEvent(new CustomEvent("dialog:close"));

    expect(getContent().open).toBe(false);
    expect(root.getAttribute("data-state")).toBe("closed");

    root.dispatchEvent(new CustomEvent("dialog:toggle"));

    expect(getContent().open).toBe(true);
    expect(root.getAttribute("data-state")).toBe("open");

    dialog.destroy();
  });

  it("resolves asChild trigger and close wrappers to their child control", () => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div data-sw-dialog>
        <div
          id="wrapped-trigger-shell"
          class="trigger-shell"
          data-slot="dialog-trigger"
          data-sw-dialog-trigger
          data-as-child
        >
          <script id="astro-trigger-module-script" type="module"></script>
          <button id="wrapped-trigger" class="trigger-child">Open wrapped dialog</button>
        </div>
        <div data-sw-dialog-overlay hidden></div>
        <dialog data-sw-dialog-content>
          <h2 data-sw-dialog-title>Dialog title</h2>
          <p data-sw-dialog-description>Dialog description</p>
          <input aria-label="Dialog input" />
          <div
            id="wrapped-close-shell"
            class="close-shell"
            data-slot="dialog-close"
            data-sw-dialog-close
            data-as-child
          >
            <script id="astro-close-module-script" type="module"></script>
            <button id="wrapped-close" class="close-child">Close wrapped dialog</button>
          </div>
        </dialog>
      </div>
    `;
    const root = wrapper.firstElementChild as HTMLElement;
    document.body.append(root);
    const triggerScript = document.querySelector<HTMLScriptElement>(
      "#astro-trigger-module-script",
    )!;
    const closeScript = document.querySelector<HTMLScriptElement>("#astro-close-module-script")!;
    const triggerWrapper = document.querySelector<HTMLElement>("#wrapped-trigger-shell")!;
    const closeWrapper = document.querySelector<HTMLElement>("#wrapped-close-shell")!;

    createDialog(root);

    const trigger = document.querySelector<HTMLButtonElement>("#wrapped-trigger")!;
    const close = document.querySelector<HTMLButtonElement>("#wrapped-close")!;

    expect(triggerScript.hasAttribute("data-sw-dialog-trigger")).toBe(false);
    expect(closeScript.hasAttribute("data-sw-dialog-close")).toBe(false);
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger.getAttribute("aria-controls")).toBe(getContent().id);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.getAttribute("data-slot")).toBe("dialog-trigger");
    expect(trigger.classList.contains("trigger-shell")).toBe(true);
    expect(trigger.classList.contains("trigger-child")).toBe(true);
    expect(triggerWrapper.getAttribute("class")).toBeNull();
    expect(triggerWrapper.style.display).toBe("contents");
    expect(triggerWrapper.getAttribute("aria-controls")).toBeNull();

    trigger.click();

    expect(getContent().open).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    close.click();

    expect(getContent().open).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(close.getAttribute("data-slot")).toBe("dialog-close");
    expect(close.classList.contains("close-shell")).toBe(true);
    expect(close.classList.contains("close-child")).toBe(true);
    expect(closeWrapper.getAttribute("class")).toBeNull();
    expect(closeWrapper.style.display).toBe("contents");
    expect(closeWrapper.getAttribute("aria-controls")).toBeNull();
  });

  it("opens from an external trigger that targets the dialog root", () => {
    const externalTrigger = document.createElement("button");
    externalTrigger.dataset.swDialogTrigger = "";
    externalTrigger.dataset.swDialogTargetId = "external-dialog";
    externalTrigger.textContent = "Open external dialog";
    document.body.append(externalTrigger);

    const unrelatedTrigger = document.createElement("button");
    unrelatedTrigger.dataset.swDialogTrigger = "";
    unrelatedTrigger.dataset.swDialogTargetId = "other-dialog";
    unrelatedTrigger.textContent = "Open other dialog";
    document.body.append(unrelatedTrigger);

    const root = renderDialog();
    root.id = "external-dialog";

    const dialog = createDialog(root);

    expect(externalTrigger.getAttribute("aria-controls")).toBe(getContent().id);
    expect(unrelatedTrigger.getAttribute("aria-controls")).toBeNull();

    unrelatedTrigger.click();
    expect(getContent().open).toBe(false);

    externalTrigger.click();

    expect(getContent().open).toBe(true);
    expect(externalTrigger.getAttribute("aria-expanded")).toBe("true");

    dialog.destroy();
  });

  it("keeps the native dialog open until its exit animation finishes", async () => {
    const root = renderDialog();
    const closeAnimation = createDeferred();

    createDialog(root);
    getTrigger().click();

    Object.defineProperty(getContent(), "getAnimations", {
      configurable: true,
      value: () => [{ finished: closeAnimation.promise }] as unknown as Animation[],
    });
    Object.defineProperty(getOverlay(), "getAnimations", {
      configurable: true,
      value: () => [{ finished: closeAnimation.promise }] as unknown as Animation[],
    });

    getCloseButton().click();

    expect(getContent().getAttribute("data-state")).toBe("closed");
    expect(getOverlay().getAttribute("data-state")).toBe("closed");
    expect(getContent().open).toBe(true);
    expect(getOverlay().hidden).toBe(false);

    closeAnimation.resolve();
    await closeAnimation.promise;
    await waitForMicrotasks();

    expect(getContent().open).toBe(false);
    expect(getContent().hidden).toBe(true);
    expect(getOverlay().hidden).toBe(true);
  });

  it("emits close completion after exit animation and cleanup finish", async () => {
    const root = renderDialog();
    const outsideButton = document.createElement("button");
    const closeAnimation = createDeferred();
    const onCloseComplete = vi.fn();
    const closeCompleteListener = vi.fn();

    outsideButton.textContent = "Outside";
    document.body.prepend(outsideButton);
    outsideButton.focus();
    root.addEventListener("starwind:close-complete", closeCompleteListener);

    const dialog = createDialog(root, { onCloseComplete });
    const closeCompleteSubscriber = vi.fn();
    dialog.subscribe("closeComplete", closeCompleteSubscriber);

    getTrigger().click();

    Object.defineProperty(getContent(), "getAnimations", {
      configurable: true,
      value: () => [{ finished: closeAnimation.promise }] as unknown as Animation[],
    });

    const closeButton = getCloseButton();
    closeButton.click();

    expect(closeCompleteListener).not.toHaveBeenCalled();
    expect(getContent().open).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");

    closeAnimation.resolve();
    await closeAnimation.promise;
    await waitForMicrotasks();

    const expectedDetails = expect.objectContaining({
      open: false,
      reason: "close-press",
      trigger: closeButton,
    });
    expect(getContent().open).toBe(false);
    expect(document.body.style.overflow).toBe("");
    expect(document.activeElement).toBe(outsideButton);
    expect(onCloseComplete).toHaveBeenCalledWith(expectedDetails);
    expect(closeCompleteListener).toHaveBeenCalledWith(
      expect.objectContaining({ detail: expectedDetails }),
    );
    expect(closeCompleteSubscriber).toHaveBeenCalledWith(expectedDetails);
  });

  it("preserves the requested close reason for controlled close completion", async () => {
    const root = renderDialog();
    const closeAnimation = createDeferred();
    const onOpenChange = vi.fn();
    const closeCompleteListener = vi.fn();
    root.addEventListener("starwind:close-complete", closeCompleteListener);

    const dialog = createDialog(root, {
      open: true,
      onOpenChange,
    });

    Object.defineProperty(getContent(), "getAnimations", {
      configurable: true,
      value: () => [{ finished: closeAnimation.promise }] as unknown as Animation[],
    });

    const closeButton = getCloseButton();
    closeButton.click();

    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: "close-press", trigger: closeButton }),
    );
    expect(dialog.getOpen()).toBe(true);
    expect(getContent().open).toBe(true);
    expect(closeCompleteListener).not.toHaveBeenCalled();

    dialog.setOpen(false, { emit: false });

    expect(getContent().open).toBe(true);
    expect(getContent().getAttribute("data-state")).toBe("closed");

    closeAnimation.resolve();
    await closeAnimation.promise;
    await waitForMicrotasks();

    expect(getContent().open).toBe(false);
    expect(closeCompleteListener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          open: false,
          reason: "close-press",
          trigger: closeButton,
        }),
      }),
    );
  });

  it("does not retain canceled controlled close requests", async () => {
    const root = renderDialog();
    const closeAnimation = createDeferred();
    const closeCompleteListener = vi.fn();
    const onOpenChange = vi.fn((_open, details) => {
      details.cancel();
    });
    root.addEventListener("starwind:close-complete", closeCompleteListener);

    const dialog = createDialog(root, {
      open: true,
      onOpenChange,
    });
    Object.defineProperty(getContent(), "getAnimations", {
      configurable: true,
      value: () => [{ finished: closeAnimation.promise }] as unknown as Animation[],
    });

    getCloseButton().click();

    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ isCanceled: true, reason: "close-press" }),
    );
    expect(dialog.getOpen()).toBe(true);
    expect(getContent().open).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");
    expect(closeCompleteListener).not.toHaveBeenCalled();

    dialog.setOpen(false, { emit: false });

    expect(document.body.style.overflow).toBe("hidden");

    closeAnimation.resolve();
    await closeAnimation.promise;
    await waitForMicrotasks();

    expect(document.body.style.overflow).toBe("");
    expect(closeCompleteListener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          open: false,
          reason: "imperative-action",
        }),
      }),
    );
  });

  it("routes form method dialog submissions through the close path", () => {
    const root = renderDialog();
    const listener = vi.fn();
    root.addEventListener("starwind:open-change", listener);
    getContent().insertAdjacentHTML(
      "beforeend",
      `
        <form method="dialog">
          <button type="submit">Submit dialog form</button>
        </form>
      `,
    );

    createDialog(root);
    getTrigger().click();

    const form = getContent().querySelector<HTMLFormElement>('form[method="dialog"]')!;
    const submitEvent = new SubmitEvent("submit", {
      bubbles: true,
      cancelable: true,
      submitter: form.querySelector("button"),
    });

    form.dispatchEvent(submitEvent);

    expect(submitEvent.defaultPrevented).toBe(true);
    expect(getContent().open).toBe(false);
    expect(getOverlay().hidden).toBe(true);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ open: false, reason: "close-press" }),
      }),
    );
  });

  it("leaves non-dialog form submissions open", () => {
    const root = renderDialog();
    getContent().insertAdjacentHTML(
      "beforeend",
      `
        <form method="post">
          <button type="submit">Submit post form</button>
        </form>
      `,
    );

    const dialog = createDialog(root);
    getTrigger().click();

    const form = getContent().querySelector<HTMLFormElement>('form[method="post"]')!;
    const submitEvent = new SubmitEvent("submit", {
      bubbles: true,
      cancelable: true,
      submitter: form.querySelector("button"),
    });

    form.dispatchEvent(submitEvent);

    expect(submitEvent.defaultPrevented).toBe(false);
    expect(getContent().open).toBe(true);
    expect(getOverlay().hidden).toBe(false);

    dialog.destroy();
  });

  it("closes on Escape and dispatches a cancelable intent event", () => {
    const root = renderDialog();
    const escapeListener = vi.fn();
    root.addEventListener("starwind:escape-key-down", escapeListener);

    createDialog(root);
    getTrigger().click();

    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));

    expect(escapeListener).toHaveBeenCalledTimes(1);
    expect(getContent().open).toBe(false);
  });

  it("handles native cancel events and respects closeOnEscape", () => {
    const root = renderDialog();
    const dialog = createDialog(root);
    getTrigger().click();

    const cancelEvent = new Event("cancel", { cancelable: true });
    getContent().dispatchEvent(cancelEvent);

    expect(cancelEvent.defaultPrevented).toBe(true);
    expect(getContent().open).toBe(false);

    dialog.destroy();
    root.replaceWith(renderDialog({ closeOnEscape: false }));
    const nextRoot = document.querySelector<HTMLElement>("[data-sw-dialog]")!;
    const nextDialog = createDialog(nextRoot);
    getTrigger().click();

    const blockedCancelEvent = new Event("cancel", { cancelable: true });
    getContent().dispatchEvent(blockedCancelEvent);

    expect(blockedCancelEvent.defaultPrevented).toBe(true);
    expect(getContent().open).toBe(true);

    nextDialog.destroy();
  });

  it("allows open changes to be canceled before DOM state changes", () => {
    const root = renderDialog();
    const openChangeListener = vi.fn((event: Event) => event.preventDefault());
    root.addEventListener("starwind:open-change", openChangeListener);

    createDialog(root);
    getTrigger().click();

    expect(openChangeListener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ open: true, reason: "trigger-press" }),
      }),
    );
    expect(getContent().open).toBe(false);
    expect(getOverlay().hidden).toBe(true);
    expect(getTrigger().getAttribute("aria-expanded")).toBe("false");
  });

  it("allows onOpenChange details cancellation before DOM state changes", () => {
    const root = renderDialog();
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

    const dialog = createDialog(root, { onOpenChange });
    const subscriber = vi.fn();
    dialog.subscribe("openChange", subscriber);
    getTrigger().click();

    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({
        isCanceled: true,
        open: true,
        reason: "trigger-press",
      }),
    );
    expect(canceledSnapshots).toEqual([false, true]);
    expect(openChangeListener).toHaveBeenCalledTimes(1);
    expect(eventDetails).toBe(callbackDetails);
    expect(subscriber).not.toHaveBeenCalled();
    expect(getContent().open).toBe(false);
    expect(getOverlay().hidden).toBe(true);
    expect(getTrigger().getAttribute("aria-expanded")).toBe("false");
  });

  it("preserves the onOpenChange callback receiver", () => {
    const root = renderDialog();
    const receivers: unknown[] = [];

    const dialog = createDialog(root, {
      onOpenChange: function onOpenChange(this: unknown) {
        receivers.push(this);
      },
    });
    getTrigger().click();

    expect(receivers).toEqual([dialog]);

    dialog.destroy();
  });

  it("allows Escape close to be canceled", () => {
    const root = renderDialog();
    root.addEventListener("starwind:escape-key-down", (event) => event.preventDefault());

    const dialog = createDialog(root);
    getTrigger().click();

    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));

    expect(getContent().open).toBe(true);

    dialog.destroy();
  });

  it("closes on overlay click and allows it to be canceled", () => {
    const root = renderDialog();
    root.addEventListener("starwind:outside-interact", (event) => event.preventDefault());

    const dialog = createDialog(root);
    getTrigger().click();
    getOverlay().click();

    expect(getContent().open).toBe(true);

    dialog.destroy();
    root.replaceWith(renderDialog());
    const nextRoot = document.querySelector<HTMLElement>("[data-sw-dialog]")!;
    createDialog(nextRoot);
    getTrigger().click();
    getOverlay().click();

    expect(getContent().open).toBe(false);
  });

  it("closes when the native dialog receives an outside click", () => {
    const root = renderDialog();
    createDialog(root);
    getTrigger().click();

    Object.defineProperty(getContent(), "getBoundingClientRect", {
      configurable: true,
      value: () =>
        ({
          bottom: 200,
          height: 100,
          left: 100,
          right: 200,
          top: 100,
          width: 100,
          x: 100,
          y: 100,
          toJSON: () => undefined,
        }) satisfies DOMRect,
    });

    getContent().dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        clientX: 20,
        clientY: 20,
      }),
    );

    expect(getContent().open).toBe(false);
  });

  it("only lets the topmost nested dialog handle Escape", () => {
    const nested = renderNestedDialogs();
    const parentEscapeListener = vi.fn();
    const childEscapeListener = vi.fn();
    nested.parentRoot.addEventListener("starwind:escape-key-down", (event) => {
      if (event.target === nested.parentRoot) {
        parentEscapeListener(event);
      }
    });
    nested.childRoot.addEventListener("starwind:escape-key-down", childEscapeListener);

    const parentDialog = createDialog(nested.parentRoot);
    const childDialog = createDialog(nested.childRoot);
    nested.parentTrigger.click();
    nested.childTrigger.click();

    expect(nested.parentContent.open).toBe(true);
    expect(nested.childContent.open).toBe(true);
    expect(nested.parentContent.hasAttribute("data-nested-dialog-open")).toBe(true);
    expect(nested.parentContent.style.getPropertyValue("--nested-dialogs")).toBe("1");
    expect(nested.childOverlay.hidden).toBe(true);

    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));

    expect(childEscapeListener).toHaveBeenCalledTimes(1);
    expect(parentEscapeListener).not.toHaveBeenCalled();
    expect(nested.childContent.open).toBe(false);
    expect(nested.parentContent.open).toBe(true);
    expect(nested.parentContent.hasAttribute("data-nested-dialog-open")).toBe(false);
    expect(nested.parentContent.style.getPropertyValue("--nested-dialogs")).toBe("");

    childDialog.destroy();
    parentDialog.destroy();
  });

  it("ignores parent close, outside, and dialog form submissions while a child is topmost", () => {
    const nested = renderNestedDialogs();

    const parentDialog = createDialog(nested.parentRoot);
    const childDialog = createDialog(nested.childRoot);
    nested.parentTrigger.click();
    nested.childTrigger.click();

    nested.parentClose.click();

    expect(nested.parentContent.open).toBe(true);
    expect(nested.childContent.open).toBe(true);

    const parentSubmitEvent = new SubmitEvent("submit", {
      bubbles: true,
      cancelable: true,
      submitter: nested.parentSubmit,
    });
    nested.parentForm.dispatchEvent(parentSubmitEvent);

    expect(parentSubmitEvent.defaultPrevented).toBe(true);
    expect(nested.parentContent.open).toBe(true);
    expect(nested.childContent.open).toBe(true);

    nested.parentOverlay.click();

    expect(nested.parentContent.open).toBe(true);
    expect(nested.childContent.open).toBe(true);

    nested.childClose.click();

    expect(nested.parentContent.open).toBe(true);
    expect(nested.childContent.open).toBe(false);

    nested.parentClose.click();

    expect(nested.parentContent.open).toBe(false);

    childDialog.destroy();
    parentDialog.destroy();
  });

  it("keeps a closing child topmost while restoring parent nested sizing immediately", async () => {
    const nested = renderNestedDialogs();
    const closeAnimation = createDeferred();
    const parentEscapeListener = vi.fn();
    nested.parentRoot.addEventListener("starwind:escape-key-down", (event) => {
      if (event.target === nested.parentRoot) {
        parentEscapeListener(event);
      }
    });

    const parentDialog = createDialog(nested.parentRoot);
    const childDialog = createDialog(nested.childRoot);
    nested.parentTrigger.click();
    nested.childTrigger.click();

    Object.defineProperty(nested.childContent, "getAnimations", {
      configurable: true,
      value: () => [{ finished: closeAnimation.promise }] as unknown as Animation[],
    });

    nested.childClose.click();

    expect(nested.childContent.open).toBe(true);
    expect(nested.childContent.getAttribute("data-state")).toBe("closed");
    expect(nested.parentContent.hasAttribute("data-nested-dialog-open")).toBe(false);
    expect(nested.parentContent.style.getPropertyValue("--nested-dialogs")).toBe("");

    nested.parentClose.click();
    nested.parentOverlay.click();
    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));

    expect(parentEscapeListener).not.toHaveBeenCalled();
    expect(nested.parentContent.open).toBe(true);
    expect(nested.childContent.open).toBe(true);

    closeAnimation.resolve();
    await closeAnimation.promise;
    await waitForMicrotasks();

    expect(nested.childContent.open).toBe(false);
    expect(nested.parentContent.open).toBe(true);
    expect(nested.parentContent.hasAttribute("data-nested-dialog-open")).toBe(false);
    expect(nested.parentContent.style.getPropertyValue("--nested-dialogs")).toBe("");

    childDialog.destroy();
    parentDialog.destroy();
  });

  it("keeps body scroll locked while another non-nested modal dialog remains open", () => {
    const firstRoot = renderDialog();
    const secondRoot = renderDialog();
    const firstDialog = createDialog(firstRoot);
    const secondDialog = createDialog(secondRoot);
    const firstContent = firstRoot.querySelector<HTMLDialogElement>("[data-sw-dialog-content]")!;
    const secondContent = secondRoot.querySelector<HTMLDialogElement>("[data-sw-dialog-content]")!;

    firstDialog.setOpen(true);
    secondDialog.setOpen(true);

    expect(document.body.style.overflow).toBe("hidden");
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);
    expect(document.body.style.getPropertyValue("--sw-scrollbar-width")).toBe("0px");

    firstDialog.setOpen(false);

    expect(firstContent.open).toBe(false);
    expect(secondContent.open).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    secondDialog.setOpen(false);

    expect(document.body.style.overflow).toBe("");
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
    expect(document.body.style.getPropertyValue("--sw-scrollbar-width")).toBe("");
  });

  it("keeps body scroll locked when one overlapping modal dialog is destroyed", () => {
    const firstRoot = renderDialog();
    const secondRoot = renderDialog();
    const firstDialog = createDialog(firstRoot);
    const secondDialog = createDialog(secondRoot);
    const secondContent = secondRoot.querySelector<HTMLDialogElement>("[data-sw-dialog-content]")!;

    firstDialog.setOpen(true);
    secondDialog.setOpen(true);

    firstDialog.destroy();

    expect(secondContent.open).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    secondDialog.destroy();

    expect(document.body.style.overflow).toBe("");
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
    expect(document.body.style.getPropertyValue("--sw-scrollbar-width")).toBe("");
  });

  it("honors raw HTML attributes that disable Escape and outside-interact closing", () => {
    const root = renderDialog({
      closeOnEscape: false,
      closeOnOutsideInteract: false,
    });

    createDialog(root);
    getTrigger().click();

    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    expect(getContent().open).toBe(true);

    getOverlay().click();
    expect(getContent().open).toBe(true);

    getCloseButton().click();
    expect(getContent().open).toBe(false);
  });

  it("supports controlled mode without mutating DOM until setOpen is called", () => {
    const root = renderDialog();
    const onOpenChange = vi.fn();
    const dialog = createDialog(root, {
      open: false,
      onOpenChange,
    });

    getTrigger().click();

    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ open: true, reason: "trigger-press" }),
    );
    expect(getContent().open).toBe(false);

    dialog.setOpen(true);

    expect(getContent().open).toBe(true);

    dialog.destroy();
  });

  it("can sync controlled open state without notifying subscribers", () => {
    const root = renderDialog();
    const dialog = createDialog(root);
    const listener = vi.fn();
    dialog.subscribe("openChange", listener);

    dialog.setOpen(true, { emit: false });

    expect(getContent().open).toBe(true);
    expect(listener).not.toHaveBeenCalled();

    dialog.destroy();
  });

  it("traps Tab focus while open", () => {
    const root = renderDialog();
    const dialog = createDialog(root);
    getTrigger().click();

    const closeButton = getCloseButton();
    const input = getInput();

    closeButton.focus();
    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Tab" }));
    expect(document.activeElement).toBe(input);

    document.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "Tab", shiftKey: true }),
    );
    expect(document.activeElement).toBe(closeButton);

    dialog.destroy();
  });

  it("destroy removes listeners and unlocks body scroll", () => {
    const root = renderDialog();
    const dialog = createDialog(root);

    getTrigger().click();
    dialog.destroy();
    getCloseButton().click();

    expect(document.body.style.overflow).toBe("");
    expect(getContent().open).toBe(false);

    getTrigger().click();
    expect(getContent().open).toBe(false);
  });

  it("requires a native dialog content element", () => {
    const root = renderDialog();
    getContent().remove();

    expect(() => createDialog(root)).toThrow("Dialog requires a [data-sw-dialog-content] element.");
  });
});

function renderDialog(
  options: {
    closeOnEscape?: boolean;
    closeOnOutsideInteract?: boolean;
    defaultOpen?: boolean;
    modal?: boolean;
  } = {},
): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div
      data-sw-dialog
      ${options.defaultOpen ? "data-default-open" : ""}
      ${options.closeOnEscape === false ? 'data-close-on-escape="false"' : ""}
      ${options.closeOnOutsideInteract === false ? 'data-close-on-outside-interact="false"' : ""}
      ${options.modal === false ? 'data-modal="false"' : ""}
    >
      <button data-sw-dialog-trigger>Open dialog</button>
      <div data-sw-dialog-overlay hidden></div>
      <dialog data-sw-dialog-content>
        <h2 data-sw-dialog-title>Dialog title</h2>
        <p data-sw-dialog-description>Dialog description</p>
        <input aria-label="Dialog input" />
        <button data-sw-dialog-close>Close</button>
      </dialog>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderNestedDialogs(): {
  childClose: HTMLButtonElement;
  childContent: HTMLDialogElement;
  childOverlay: HTMLElement;
  childRoot: HTMLElement;
  childTrigger: HTMLButtonElement;
  parentClose: HTMLButtonElement;
  parentContent: HTMLDialogElement;
  parentForm: HTMLFormElement;
  parentOverlay: HTMLElement;
  parentRoot: HTMLElement;
  parentSubmit: HTMLButtonElement;
  parentTrigger: HTMLButtonElement;
} {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-dialog id="parent-dialog">
      <button id="parent-trigger" data-sw-dialog-trigger>Open parent</button>
      <div id="parent-overlay" data-sw-dialog-overlay hidden></div>
      <dialog id="parent-content" data-sw-dialog-content>
        <h2 data-sw-dialog-title>Parent dialog</h2>
        <p data-sw-dialog-description>Parent description</p>
        <button id="parent-close" data-sw-dialog-close>Close parent</button>
        <form id="parent-form" method="dialog">
          <button id="parent-submit" type="submit">Submit parent</button>
        </form>
        <div data-sw-dialog id="child-dialog">
          <button id="child-trigger" data-sw-dialog-trigger>Open child</button>
          <div id="child-overlay" data-sw-dialog-overlay hidden></div>
          <dialog id="child-content" data-sw-dialog-content>
            <h2 data-sw-dialog-title>Child dialog</h2>
            <p data-sw-dialog-description>Child description</p>
            <button id="child-close" data-sw-dialog-close>Close child</button>
          </dialog>
        </div>
      </dialog>
    </div>
  `;

  const parentRoot = wrapper.firstElementChild as HTMLElement;
  document.body.append(parentRoot);

  return {
    childClose: document.querySelector<HTMLButtonElement>("#child-close")!,
    childContent: document.querySelector<HTMLDialogElement>("#child-content")!,
    childOverlay: document.querySelector<HTMLElement>("#child-overlay")!,
    childRoot: document.querySelector<HTMLElement>("#child-dialog")!,
    childTrigger: document.querySelector<HTMLButtonElement>("#child-trigger")!,
    parentClose: document.querySelector<HTMLButtonElement>("#parent-close")!,
    parentContent: document.querySelector<HTMLDialogElement>("#parent-content")!,
    parentForm: document.querySelector<HTMLFormElement>("#parent-form")!,
    parentOverlay: document.querySelector<HTMLElement>("#parent-overlay")!,
    parentRoot,
    parentSubmit: document.querySelector<HTMLButtonElement>("#parent-submit")!,
    parentTrigger: document.querySelector<HTMLButtonElement>("#parent-trigger")!,
  };
}

function getTrigger(): HTMLButtonElement {
  return document.querySelector<HTMLButtonElement>("[data-sw-dialog-trigger]")!;
}

function getOverlay(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-dialog-overlay]")!;
}

function getContent(): HTMLDialogElement {
  return document.querySelector<HTMLDialogElement>("[data-sw-dialog-content]")!;
}

function getTitle(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-dialog-title]")!;
}

function getDescription(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-dialog-description]")!;
}

function getInput(): HTMLInputElement {
  return document.querySelector<HTMLInputElement>("input")!;
}

function getCloseButton(): HTMLButtonElement {
  return document.querySelector<HTMLButtonElement>("[data-sw-dialog-close]")!;
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
