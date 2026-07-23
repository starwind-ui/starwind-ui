import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDialog } from "../../../src/components/dialog/dialog";
import { createPopover } from "../../../src/components/popover/popover";
import { registerOverlayDismissal } from "../../../src/internal/overlay-dismissal";
import {
  createFloatingPortalSession,
  type FloatingPortalSession,
} from "../../../src/internal/floating-portal";

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

  it("applies coherent open state before native presentation", () => {
    const root = renderDialog();
    const dialog = createDialog(root);

    const trigger = getTrigger();
    const content = getContent();
    const overlay = getOverlay();
    const presentationState = vi.fn(() => {
      content.setAttribute("open", "");
      return {
        contentHidden: content.hidden,
        contentState: content.getAttribute("data-state"),
        overlayHidden: overlay.hidden,
        overlayState: overlay.getAttribute("data-state"),
        rootState: root.getAttribute("data-state"),
        triggerExpanded: trigger.getAttribute("aria-expanded"),
        triggerState: trigger.getAttribute("data-state"),
      };
    });
    vi.spyOn(content, "showModal").mockImplementation(() => {
      presentationState();
    });

    trigger.click();
    const observedPresentationState = presentationState.mock.results[0]?.value;
    dialog.destroy();

    expect(observedPresentationState).toEqual({
      contentHidden: false,
      contentState: "open",
      overlayHidden: false,
      overlayState: "open",
      rootState: "open",
      triggerExpanded: "true",
      triggerState: "open",
    });
  });

  it("keeps popup and backdrop starting styles through the first presented frame", async () => {
    const root = renderDialog();
    const dialog = createDialog(root);
    const content = getContent();
    const overlay = getOverlay();

    getTrigger().click();

    expect(content.open).toBe(true);
    expect(content.hasAttribute("data-starting-style")).toBe(true);
    expect(overlay.hasAttribute("data-starting-style")).toBe(true);

    await nextAnimationFrame();
    expect(content.hasAttribute("data-starting-style")).toBe(true);
    expect(overlay.hasAttribute("data-starting-style")).toBe(true);

    await nextAnimationFrame();
    expect(content.hasAttribute("data-starting-style")).toBe(false);
    expect(overlay.hasAttribute("data-starting-style")).toBe(false);

    dialog.destroy();
  });

  it("rolls back coherent visual state when native presentation fails", async () => {
    const root = renderDialog();
    const outsideButton = document.createElement("button");
    outsideButton.textContent = "Outside";
    document.body.prepend(outsideButton);
    outsideButton.focus();

    const dialog = createDialog(root);
    const content = getContent();
    const showModal = vi.spyOn(content, "showModal").mockImplementation(() => {
      expect(root.getAttribute("data-state")).toBe("open");
      expect(content.getAttribute("data-state")).toBe("open");
      expect(getOverlay().getAttribute("data-state")).toBe("open");
      expect(getTrigger().getAttribute("data-state")).toBe("open");
      throw new Error("Native presentation failed");
    });

    expect(() => dialog.setOpen(true)).toThrow("Native presentation failed");

    expect(showModal).toHaveBeenCalledTimes(1);
    expect(dialog.getOpen()).toBe(false);
    expect(root.getAttribute("data-state")).toBe("closed");
    expect(content.open).toBe(false);
    expect(content.hidden).toBe(true);
    expect(content.getAttribute("data-state")).toBe("closed");
    expect(getOverlay().hidden).toBe(true);
    expect(getOverlay().getAttribute("data-state")).toBe("closed");
    expect(getTrigger().getAttribute("aria-expanded")).toBe("false");
    expect(document.body.style.overflow).toBe("");
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
    expect(document.activeElement).toBe(outsideButton);

    showModal.mockRestore();
    dialog.setOpen(true);
    expect(content.open).toBe(true);
    expect(content.hasAttribute("data-starting-style")).toBe(true);
    await nextAnimationFrame();
    expect(content.hasAttribute("data-starting-style")).toBe(true);
    await nextAnimationFrame();
    expect(content.hasAttribute("data-starting-style")).toBe(false);
    dialog.destroy();
  });

  it("does not let a destroyed controller release a replacement entry marker", async () => {
    const root = renderDialog();
    const firstDialog = createDialog(root);
    const content = getContent();

    firstDialog.setOpen(true);
    await nextAnimationFrame();
    firstDialog.destroy();

    const replacementDialog = createDialog(root);
    replacementDialog.setOpen(true);

    await nextAnimationFrame();
    expect(content.hasAttribute("data-starting-style")).toBe(true);

    await nextAnimationFrame();
    expect(content.hasAttribute("data-starting-style")).toBe(false);

    replacementDialog.destroy();
  });

  it("initializes nested overlays after dialog portal movement without duplicate controllers", async () => {
    const root = renderDialog();
    const content = getContent();
    content.insertAdjacentHTML(
      "beforeend",
      `
        <div data-sw-popover>
          <button data-sw-popover-trigger>Open nested popover</button>
          <div data-sw-popover-portal>
            <div data-sw-popover-popup>Nested popover content</div>
          </div>
        </div>
      `,
    );

    const controllers = new Set<ReturnType<typeof createPopover>>();
    const setupNestedPopovers = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      const initRoot = event.detail?.root;
      if (!(initRoot instanceof Element)) return;

      initRoot.querySelectorAll<HTMLElement>("[data-sw-popover]").forEach((popoverRoot) => {
        controllers.add(createPopover(popoverRoot));
      });
    };
    document.addEventListener("starwind:init", setupNestedPopovers);

    const dialog = createDialog(root);
    const popoverRoot = content.querySelector<HTMLElement>("[data-sw-popover]")!;
    const popoverTrigger = content.querySelector<HTMLButtonElement>("[data-sw-popover-trigger]")!;
    const popoverPopup = content.querySelector<HTMLElement>("[data-sw-popover-popup]")!;
    const openChange = vi.fn();
    popoverRoot.addEventListener("starwind:open-change", openChange);

    expect(controllers.size).toBe(0);

    getTrigger().click();
    await waitForMicrotasks();
    expect(controllers.size).toBe(1);

    document.dispatchEvent(new CustomEvent("starwind:init", { detail: { root: content } }));
    getCloseButton().click();
    getTrigger().click();
    await waitForMicrotasks();
    expect(controllers.size).toBe(1);

    popoverTrigger.click();
    expect(popoverPopup.hidden).toBe(false);
    expect(openChange).toHaveBeenCalledTimes(1);

    controllers.forEach((controller) => controller.destroy());
    document.removeEventListener("starwind:init", setupNestedPopovers);
    popoverTrigger.click();

    expect(openChange).toHaveBeenCalledTimes(1);
    dialog.destroy();
  });

  it("waits for moved nested overlay topology before scoped initialization", async () => {
    const root = renderDialog();
    const content = getContent();
    content.insertAdjacentHTML(
      "beforeend",
      `
        <div data-sw-popover>
          <button data-sw-popover-trigger>Open moved popover</button>
          <div data-sw-popover-portal></div>
        </div>
      `,
    );

    const popoverRoot = content.querySelector<HTMLElement>("[data-sw-popover]")!;
    const portal = content.querySelector<HTMLElement>("[data-sw-popover-portal]")!;
    const popup = document.createElement("div");
    popup.dataset.swPopoverPopup = "";
    popup.textContent = "Moved popover content";
    const transientPortalHost = document.createElement("div");
    transientPortalHost.append(popup);
    document.body.append(transientPortalHost);

    const controllers = new Set<ReturnType<typeof createPopover>>();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const initPass = vi.fn();
    const setupNestedPopovers = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      const initRoot = event.detail?.root;
      if (!(initRoot instanceof Element)) return;
      initPass(initRoot);

      initRoot.querySelectorAll<HTMLElement>("[data-sw-popover]").forEach((candidate) => {
        try {
          controllers.add(createPopover(candidate));
        } catch (error) {
          console.error(error);
        }
      });
    };
    document.addEventListener("starwind:init", setupNestedPopovers);

    const dialog = createDialog(root);
    getTrigger().click();
    portal.append(popup);
    await waitForMicrotasks();

    expect(consoleError).not.toHaveBeenCalled();
    expect(initPass).toHaveBeenCalledTimes(1);
    expect(initPass).toHaveBeenCalledWith(content);
    expect(controllers.size).toBe(1);

    const openChange = vi.fn();
    popoverRoot.addEventListener("starwind:open-change", openChange);
    popoverRoot.querySelector<HTMLButtonElement>("[data-sw-popover-trigger]")!.click();

    expect(popup.hidden).toBe(false);
    expect(openChange).toHaveBeenCalledTimes(1);

    controllers.forEach((controller) => controller.destroy());
    document.removeEventListener("starwind:init", setupNestedPopovers);
    consoleError.mockRestore();
    dialog.destroy();
  });

  it("cancels scoped initialization when destroyed before the scheduled flush", async () => {
    const root = renderDialog();
    const content = getContent();
    content.insertAdjacentHTML(
      "beforeend",
      `
        <div data-sw-popover>
          <button data-sw-popover-trigger>Open stale popover</button>
          <div data-sw-popover-portal>
            <div data-sw-popover-popup>Stale popover content</div>
          </div>
        </div>
      `,
    );

    const controllers = new Set<ReturnType<typeof createPopover>>();
    const initPass = vi.fn((event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      const initRoot = event.detail?.root;
      if (!(initRoot instanceof Element)) return;

      initRoot.querySelectorAll<HTMLElement>("[data-sw-popover]").forEach((candidate) => {
        controllers.add(createPopover(candidate));
      });
    });
    document.addEventListener("starwind:init", initPass);

    const dialog = createDialog(root);
    getTrigger().click();
    dialog.destroy();
    await waitForMicrotasks();

    expect(content.isConnected).toBe(true);
    expect(content.hidden).toBe(true);
    expect(initPass).not.toHaveBeenCalled();
    expect(controllers.size).toBe(0);

    document.removeEventListener("starwind:init", initPass);
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
        <dialog data-sw-dialog-content data-slot="dialog-content">
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

  it("closes owned floating layers before native dialog teardown and restores focus", async () => {
    const root = renderDialog();
    const outsideButton = document.createElement("button");
    outsideButton.textContent = "Outside focus target";
    document.body.prepend(outsideButton);
    outsideButton.focus();
    const dialog = createDialog(root);
    getTrigger().click();

    const layer = mountDialogOwnedLayer(getContent());
    const closeAnimation = createDeferred();
    Object.defineProperty(getContent(), "getAnimations", {
      configurable: true,
      value: () => [{ finished: closeAnimation.promise }] as unknown as Animation[],
    });
    layer.focusTarget.focus();

    dialog.close();

    expect(layer.element.getAttribute("data-state")).toBe("closed");
    expect(layer.closeRequests).toEqual(["owner-close"]);
    expect(getContent().open).toBe(true);

    closeAnimation.resolve();
    await closeAnimation.promise;
    await waitForMicrotasks();

    expect(getContent().open).toBe(false);
    expect(document.querySelector("[data-sw-floating-portal]")).toBeNull();
    expect(document.activeElement).toBe(outsideButton);

    dialog.open();
    expect(layer.element.getAttribute("data-state")).toBe("closed");
    expect(document.querySelector("[data-sw-floating-portal]")).toBeNull();

    layer.destroy();
    dialog.destroy();
  });

  it("suppresses controlled owned layers while closed and restores only current open state", () => {
    const root = renderDialog();
    const dialog = createDialog(root);
    dialog.open();
    const layer = mountDialogOwnedLayer(getContent(), { controlled: true });
    const closeEvents: string[] = [];
    layer.element.addEventListener("layer-close-request", () => closeEvents.push("requested"));

    expect(getPromotedFloatingPortal()?.matches(":popover-open")).toBe(true);

    dialog.close();

    expect(layer.element.getAttribute("data-state")).toBe("open");
    expect(closeEvents).toEqual(["requested"]);
    expect(getContent().open).toBe(false);
    expect(getPromotedFloatingPortal()).toBeNull();

    dialog.open();

    expect(getPromotedFloatingPortal()?.matches(":popover-open")).toBe(true);
    expect(layer.element.getAttribute("data-state")).toBe("open");

    dialog.close();
    expect(closeEvents).toEqual(["requested", "requested"]);
    layer.element.setAttribute("data-state", "closed");
    layer.session.restore();
    dialog.open();

    expect(layer.element.getAttribute("data-state")).toBe("closed");
    expect(getPromotedFloatingPortal()).toBeNull();

    layer.destroy();
    dialog.destroy();
  });

  it("closes only the nearest nested dialog layers and preserves parent layer focus", () => {
    const nested = renderNestedDialogs();
    const parentDialog = createDialog(nested.parentRoot);
    const childDialog = createDialog(nested.childRoot);
    parentDialog.open();
    const parentLayer = mountDialogOwnedLayer(nested.parentContent);
    parentLayer.focusTarget.focus();
    childDialog.open();
    const childLayer = mountDialogOwnedLayer(nested.childContent);
    childLayer.focusTarget.focus();

    childDialog.close();

    expect(childLayer.element.getAttribute("data-state")).toBe("closed");
    expect(childLayer.closeRequests).toEqual(["owner-close"]);
    expect(parentLayer.element.getAttribute("data-state")).toBe("open");
    expect(parentLayer.closeRequests).toEqual([]);
    expect(parentLayer.element.closest("[data-sw-floating-portal]")?.matches(":popover-open")).toBe(
      true,
    );
    expect(nested.parentContent.open).toBe(true);
    expect(nested.childContent.open).toBe(false);
    expect(document.activeElement).toBe(parentLayer.focusTarget);

    parentDialog.close();
    expect(parentLayer.closeRequests).toEqual(["owner-close"]);
    expect(document.querySelectorAll("[data-sw-floating-portal]")).toHaveLength(0);

    childLayer.destroy();
    parentLayer.destroy();
    childDialog.destroy();
    parentDialog.destroy();
  });

  it("destroys an open owner without stale controlled wrappers or focus", () => {
    const root = renderDialog();
    const outsideButton = document.createElement("button");
    outsideButton.textContent = "Return focus after destroy";
    document.body.prepend(outsideButton);
    outsideButton.focus();
    const dialog = createDialog(root);
    dialog.open();
    const layer = mountDialogOwnedLayer(getContent(), { controlled: true });
    layer.focusTarget.focus();

    dialog.destroy();

    expect(layer.closeRequests).toEqual(["owner-close"]);
    expect(getContent().open).toBe(false);
    expect(document.querySelectorAll("[data-sw-floating-portal]")).toHaveLength(0);
    expect(document.activeElement).toBe(outsideButton);

    layer.destroy();
  });

  it("does not duplicate controlled layer close intent when destroyed during close", () => {
    const root = renderDialog();
    const dialog = createDialog(root);
    dialog.open();
    const layer = mountDialogOwnedLayer(getContent(), { controlled: true });
    const closeAnimation = createDeferred();
    Object.defineProperty(getContent(), "getAnimations", {
      configurable: true,
      value: () => [{ finished: closeAnimation.promise }] as unknown as Animation[],
    });

    dialog.close();
    dialog.destroy();

    expect(layer.closeRequests).toEqual(["owner-close"]);
    expect(getContent().open).toBe(false);
    expect(document.querySelectorAll("[data-sw-floating-portal]")).toHaveLength(0);

    closeAnimation.resolve();
    layer.destroy();
  });

  it("closes an uncontrolled layer mounted during exit before reopening", async () => {
    const root = renderDialog();
    const dialog = createDialog(root);
    dialog.open();
    const closeAnimation = createDeferred();
    Object.defineProperty(getContent(), "getAnimations", {
      configurable: true,
      value: () => [{ finished: closeAnimation.promise }] as unknown as Animation[],
    });

    dialog.close();
    const lateLayer = mountDialogOwnedLayer(getContent());

    expect(lateLayer.closeRequests).toEqual(["owner-close"]);
    expect(lateLayer.element.getAttribute("data-state")).toBe("closed");
    expect(document.querySelector("[data-sw-floating-portal]")).toBeNull();

    closeAnimation.resolve();
    await closeAnimation.promise;
    await waitForMicrotasks();
    dialog.open();

    expect(lateLayer.element.getAttribute("data-state")).toBe("closed");
    expect(document.querySelector("[data-sw-floating-portal]")).toBeNull();

    lateLayer.destroy();
    dialog.destroy();
  });

  it("requests and cleans a controlled layer mounted before closing-owner destruction", () => {
    const root = renderDialog();
    const dialog = createDialog(root);
    dialog.open();
    const closeAnimation = createDeferred();
    Object.defineProperty(getContent(), "getAnimations", {
      configurable: true,
      value: () => [{ finished: closeAnimation.promise }] as unknown as Animation[],
    });

    dialog.close();
    const lateLayer = mountDialogOwnedLayer(getContent(), { controlled: true });

    expect(lateLayer.closeRequests).toEqual(["owner-close"]);
    expect(document.querySelector("[data-sw-floating-portal]")).toBeNull();

    dialog.destroy();

    expect(lateLayer.closeRequests).toEqual(["owner-close"]);
    expect(getContent().open).toBe(false);
    expect(document.querySelector("[data-sw-floating-portal]")).toBeNull();

    closeAnimation.resolve();
    lateLayer.destroy();
  });

  it("keeps a controlled layer promoted when close animation is aborted by reopen", async () => {
    const root = renderDialog();
    const dialog = createDialog(root);
    dialog.open();
    const layer = mountDialogOwnedLayer(getContent(), { controlled: true });
    const closeAnimation = createDeferred();
    Object.defineProperty(getContent(), "getAnimations", {
      configurable: true,
      value: () => [{ finished: closeAnimation.promise }] as unknown as Animation[],
    });

    dialog.close();
    dialog.open();

    expect(layer.closeRequests).toEqual(["owner-close"]);
    expect(getContent().open).toBe(true);
    expect(getPromotedFloatingPortal()?.matches(":popover-open")).toBe(true);

    closeAnimation.resolve();
    await closeAnimation.promise;
    await waitForMicrotasks();

    expect(layer.closeRequests).toEqual(["owner-close"]);
    expect(getContent().open).toBe(true);
    expect(getPromotedFloatingPortal()?.matches(":popover-open")).toBe(true);

    layer.destroy();
    dialog.destroy();
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

  it("leaves the Dialog open when a later floating overlay claims Escape", () => {
    const root = renderDialog();
    const dialog = createDialog(root);
    getTrigger().click();
    const floatingRoot = document.createElement("div");
    const floating = document.createElement("button");
    floating.setAttribute("data-state", "open");
    floatingRoot.append(floating);
    getContent().append(floatingRoot);
    let dismissal!: ReturnType<typeof registerOverlayDismissal>;
    dismissal = registerOverlayDismissal({
      floating,
      onEscapeKeyDown: (event) => {
        event.preventDefault();
        floating.setAttribute("data-state", "closed");
        dismissal.destroy();
        return true;
      },
      root: floatingRoot,
    });

    floating.focus();
    floating.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
    );

    expect(floating.getAttribute("data-state")).toBe("closed");
    expect(getContent().open).toBe(true);

    getContent().dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
    );

    expect(dialog.getOpen()).toBe(false);
    expect(getContent().getAttribute("data-state")).toBe("closed");

    dismissal.destroy();
    dialog.destroy();
  });

  it("lets a cross-owner floating portal inside the modal claim Escape", () => {
    const root = renderDialog();
    const dialog = createDialog(root);
    getTrigger().click();
    const floatingRoot = document.createElement("div");
    const floating = document.createElement("button");
    floating.setAttribute("data-state", "open");
    floatingRoot.append(document.createElement("span"));
    document.body.append(floatingRoot);
    getContent().append(floating);
    let dismissal!: ReturnType<typeof registerOverlayDismissal>;
    dismissal = registerOverlayDismissal({
      floating,
      onEscapeKeyDown: (event) => {
        event.preventDefault();
        floating.setAttribute("data-state", "closed");
        dismissal.destroy();
        return true;
      },
      root: floatingRoot,
    });
    floating.focus();

    try {
      floating.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
      );

      expect(floating.getAttribute("data-state")).toBe("closed");
      expect(dialog.getOpen()).toBe(true);
      expect(getContent().open).toBe(true);
    } finally {
      dismissal.destroy();
      dialog.destroy();
    }
  });

  it("closes while a prior controlled-open floating layer remains outside its modal boundary", () => {
    const root = renderDialog();
    const floatingRoot = document.createElement("div");
    const floating = document.createElement("div");
    floating.setAttribute("data-state", "open");
    floatingRoot.append(floating);
    document.body.append(floatingRoot);
    const dismissal = registerOverlayDismissal({
      floating,
      onEscapeKeyDown: (event) => {
        event.preventDefault();
        floating.setAttribute("data-state", "closed");
        return true;
      },
      root: floatingRoot,
    });
    const dialog = createDialog(root);
    getTrigger().click();

    try {
      getContent().dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
      );

      expect(floating.getAttribute("data-state")).toBe("open");
      expect(dialog.getOpen()).toBe(false);
      expect(getContent().getAttribute("data-state")).toBe("closed");
    } finally {
      dismissal.destroy();
      dialog.destroy();
    }
  });

  it("leaves overlays and the Dialog open when an earlier capture listener prevents Escape", () => {
    const root = renderDialog();
    const dialog = createDialog(root);
    getTrigger().click();
    const floatingRoot = document.createElement("div");
    const floating = document.createElement("div");
    const onEscapeKeyDown = vi.fn();
    floating.setAttribute("data-state", "open");
    floatingRoot.append(floating);
    getContent().append(floatingRoot);
    const preventEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") event.preventDefault();
    };
    document.addEventListener("keydown", preventEscape, { capture: true });
    const dismissal = registerOverlayDismissal({
      floating,
      onEscapeKeyDown,
      root: floatingRoot,
    });

    document.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
    );

    expect(onEscapeKeyDown).not.toHaveBeenCalled();
    expect(floating.getAttribute("data-state")).toBe("open");
    expect(getContent().open).toBe(true);

    dismissal.destroy();
    document.removeEventListener("keydown", preventEscape, { capture: true });
    dialog.destroy();
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

  it("lets a nested child Dialog ignore floating layers owned by its parent", () => {
    const nested = renderNestedDialogs();
    const parentFloatingRoot = document.createElement("div");
    const parentFloating = document.createElement("div");
    parentFloating.setAttribute("data-state", "open");
    parentFloatingRoot.append(parentFloating);
    nested.parentContent.append(parentFloatingRoot);
    const parentDismissal = registerOverlayDismissal({
      floating: parentFloating,
      onEscapeKeyDown: (event) => {
        event.preventDefault();
        parentFloating.setAttribute("data-state", "closed");
        return true;
      },
      root: parentFloatingRoot,
    });
    const childFloatingRoot = document.createElement("div");
    const childFloating = document.createElement("button");
    childFloating.setAttribute("data-state", "open");
    childFloatingRoot.append(childFloating);
    nested.childContent.append(childFloatingRoot);
    let childDismissal!: ReturnType<typeof registerOverlayDismissal>;
    childDismissal = registerOverlayDismissal({
      floating: childFloating,
      onEscapeKeyDown: (event) => {
        event.preventDefault();
        childFloating.setAttribute("data-state", "closed");
        childDismissal.destroy();
        return true;
      },
      root: childFloatingRoot,
    });
    const parentDialog = createDialog(nested.parentRoot);
    const childDialog = createDialog(nested.childRoot);
    nested.parentTrigger.click();
    nested.childTrigger.click();
    childFloating.focus();

    try {
      childFloating.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
      );

      expect(childFloating.getAttribute("data-state")).toBe("closed");
      expect(parentFloating.getAttribute("data-state")).toBe("open");
      expect(childDialog.getOpen()).toBe(true);
      expect(parentDialog.getOpen()).toBe(true);

      nested.childClose.focus();
      nested.childClose.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
      );

      expect(parentFloating.getAttribute("data-state")).toBe("open");
      expect(childDialog.getOpen()).toBe(false);
      expect(nested.childContent.getAttribute("data-state")).toBe("closed");
      expect(parentDialog.getOpen()).toBe(true);
      expect(nested.parentContent.open).toBe(true);
    } finally {
      childDismissal.destroy();
      parentDismissal.destroy();
      childDialog.destroy();
      parentDialog.destroy();
    }
  });

  it("uses Dialog open order when modal focus cannot identify an Escape realm", () => {
    const firstRoot = renderDialog();
    const firstContent = firstRoot.querySelector<HTMLDialogElement>("[data-sw-dialog-content]")!;
    const secondRoot = renderDialog();
    const secondContent = secondRoot.querySelector<HTMLDialogElement>("[data-sw-dialog-content]")!;
    const backgroundFloatingRoot = document.createElement("div");
    const backgroundFloating = document.createElement("div");
    backgroundFloating.setAttribute("data-state", "open");
    backgroundFloatingRoot.append(backgroundFloating);
    secondContent.append(backgroundFloatingRoot);
    const dismissal = registerOverlayDismissal({
      floating: backgroundFloating,
      onEscapeKeyDown: (event) => {
        event.preventDefault();
        backgroundFloating.setAttribute("data-state", "closed");
        return true;
      },
      root: backgroundFloatingRoot,
    });
    const firstDialog = createDialog(firstRoot);
    const secondDialog = createDialog(secondRoot);
    secondDialog.open();
    firstDialog.open();
    const focusedElement = document.activeElement;
    if (focusedElement instanceof HTMLElement) focusedElement.remove();

    try {
      expect(document.activeElement).toBe(document.body);

      document.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
      );

      expect(backgroundFloating.getAttribute("data-state")).toBe("open");
      expect(firstDialog.getOpen()).toBe(false);
      expect(firstContent.getAttribute("data-state")).toBe("closed");
      expect(secondDialog.getOpen()).toBe(true);
      expect(secondContent.open).toBe(true);
    } finally {
      dismissal.destroy();
      firstDialog.destroy();
      secondDialog.destroy();
    }
  });

  it("initializes default-open nested dialogs after registering the parent controller", () => {
    const nested = renderNestedDialogs();
    nested.parentRoot.setAttribute("data-default-open", "");
    nested.childRoot.setAttribute("data-default-open", "");

    const parentDialog = createDialog(nested.parentRoot);

    expect(nested.parentContent.open).toBe(true);
    expect(nested.childContent.open).toBe(true);
    expect(nested.parentContent.hasAttribute("data-nested-dialog-open")).toBe(true);
    expect(nested.parentContent.style.getPropertyValue("--nested-dialogs")).toBe("1");
    expect(nested.childOverlay.hidden).toBe(true);
    expect(document.activeElement).toBe(nested.childClose);

    nested.parentClose.click();

    expect(nested.parentContent.open).toBe(true);
    expect(nested.childContent.open).toBe(true);
    expect(document.activeElement).toBe(nested.childClose);

    const childDialog = createDialog(nested.childRoot);
    childDialog.destroy();
    expect(nested.parentContent.hasAttribute("data-nested-dialog-open")).toBe(false);
    expect(nested.parentContent.style.getPropertyValue("--nested-dialogs")).toBe("");
    parentDialog.destroy();
  });

  it("registers closed intermediate dialogs before default-open descendants", () => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div data-sw-dialog data-default-open id="parent-dialog">
        <button id="parent-trigger" data-sw-dialog-trigger>Open parent</button>
        <dialog id="parent-content" data-sw-dialog-content>
          <button id="parent-close" data-sw-dialog-close>Close parent</button>
          <div data-sw-dialog id="middle-dialog">
            <button data-sw-dialog-trigger>Open middle</button>
            <dialog id="middle-content" data-sw-dialog-content>
              <button data-sw-dialog-close>Close middle</button>
              <div data-sw-dialog data-default-open id="grandchild-dialog">
                <button data-sw-dialog-trigger>Open grandchild</button>
                <dialog id="grandchild-content" data-sw-dialog-content>
                  <button id="grandchild-close" data-sw-dialog-close>Close grandchild</button>
                </dialog>
              </div>
            </dialog>
          </div>
        </dialog>
      </div>
    `;
    const parentRoot = wrapper.firstElementChild as HTMLElement;
    const outsideButton = document.createElement("button");
    outsideButton.textContent = "Outside";
    document.body.append(outsideButton);
    document.body.append(parentRoot);
    outsideButton.focus();
    const middleRoot = document.querySelector<HTMLElement>("#middle-dialog")!;
    const grandchildRoot = document.querySelector<HTMLElement>("#grandchild-dialog")!;
    const parentContent = document.querySelector<HTMLDialogElement>("#parent-content")!;
    const middleContent = document.querySelector<HTMLDialogElement>("#middle-content")!;
    const grandchildContent = document.querySelector<HTMLDialogElement>("#grandchild-content")!;
    const parentClose = document.querySelector<HTMLButtonElement>("#parent-close")!;
    const grandchildClose = document.querySelector<HTMLButtonElement>("#grandchild-close")!;

    const parentDialog = createDialog(parentRoot);

    expect(parentContent.open).toBe(true);
    expect(middleContent.open).toBe(false);
    expect(middleContent.hidden).toBe(true);
    expect(grandchildContent.open).toBe(true);
    expect(parentContent.style.getPropertyValue("--nested-dialogs")).toBe("1");
    expect(middleContent.style.getPropertyValue("--nested-dialogs")).toBe("1");
    expect(document.activeElement).toBe(document.body);
    expect(document.activeElement).not.toBe(parentClose);

    parentClose.click();
    expect(parentContent.open).toBe(true);

    grandchildClose.click();
    expect(grandchildContent.open).toBe(false);
    expect(parentContent.hasAttribute("data-nested-dialog-open")).toBe(false);
    expect(middleContent.hasAttribute("data-nested-dialog-open")).toBe(false);
    expect(middleContent.hidden).toBe(true);

    parentClose.click();
    expect(parentContent.open).toBe(false);

    createDialog(grandchildRoot).destroy();
    createDialog(middleRoot).destroy();
    parentDialog.destroy();
  });

  it("rolls back nested controllers when a later pre-pass root is incomplete", () => {
    const unrelatedWrapper = document.createElement("div");
    unrelatedWrapper.innerHTML = `
      <div data-sw-dialog id="reentrant-unrelated-dialog">
        <button data-sw-dialog-trigger>Open unrelated dialog</button>
        <dialog data-sw-dialog-content>
          <button data-sw-dialog-close>Close unrelated dialog</button>
        </dialog>
      </div>
    `;
    const unrelatedRoot = unrelatedWrapper.firstElementChild as HTMLElement;
    document.body.append(unrelatedRoot);
    const unrelatedContent = unrelatedRoot.querySelector<HTMLDialogElement>(
      "[data-sw-dialog-content]",
    )!;
    const unrelatedTrigger = unrelatedRoot.querySelector<HTMLButtonElement>(
      "[data-sw-dialog-trigger]",
    )!;
    const unrelatedClose =
      unrelatedRoot.querySelector<HTMLButtonElement>("[data-sw-dialog-close]")!;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div data-sw-dialog data-default-open id="transaction-parent">
        <dialog data-sw-dialog-content>
          <button data-sw-dialog-close>Close parent</button>
          <div data-sw-dialog id="preexisting-child">
            <button data-sw-dialog-trigger>Open preexisting child</button>
            <dialog data-sw-dialog-content>
              <button data-sw-dialog-close>Close preexisting child</button>
            </dialog>
          </div>
          <div data-sw-dialog data-default-open id="valid-child">
            <button data-sw-dialog-trigger>Open valid child</button>
            <dialog data-sw-dialog-content>
              <button data-sw-dialog-close>Close valid child</button>
            </dialog>
          </div>
          <div data-sw-dialog id="incomplete-child"></div>
        </dialog>
      </div>
    `;
    const parentRoot = wrapper.firstElementChild as HTMLElement;
    document.body.append(parentRoot);
    const preexistingChildRoot = document.querySelector<HTMLElement>("#preexisting-child")!;
    const preexistingChildContent = preexistingChildRoot.querySelector<HTMLDialogElement>(
      "[data-sw-dialog-content]",
    )!;
    const preexistingChildTrigger = preexistingChildRoot.querySelector<HTMLButtonElement>(
      "[data-sw-dialog-trigger]",
    )!;
    const preexistingChildClose =
      preexistingChildRoot.querySelector<HTMLButtonElement>("[data-sw-dialog-close]")!;
    const validChildRoot = document.querySelector<HTMLElement>("#valid-child")!;
    const validChildContent = validChildRoot.querySelector<HTMLDialogElement>(
      "[data-sw-dialog-content]",
    )!;
    const validChildTrigger = validChildRoot.querySelector<HTMLButtonElement>(
      "[data-sw-dialog-trigger]",
    )!;
    const validChildClose =
      validChildRoot.querySelector<HTMLButtonElement>("[data-sw-dialog-close]")!;
    const incompleteChild = document.querySelector<HTMLElement>("#incomplete-child")!;
    const openChange = vi.fn();
    validChildRoot.addEventListener("starwind:open-change", openChange);
    const preexistingChildDialog = createDialog(preexistingChildRoot);
    validChildClose.addEventListener("focus", () => createDialog(unrelatedRoot), { once: true });

    expect(() => createDialog(parentRoot)).toThrow(
      "Dialog requires a [data-sw-dialog-content] element.",
    );
    expect(validChildContent.open).toBe(false);
    expect(
      parentRoot.querySelector("[data-sw-dialog-content]")?.hasAttribute("data-nested-dialog-open"),
    ).toBe(false);

    validChildTrigger.click();
    expect(validChildContent.open).toBe(false);
    expect(openChange).not.toHaveBeenCalled();

    unrelatedTrigger.click();
    expect(unrelatedContent.open).toBe(true);
    unrelatedClose.click();
    expect(unrelatedContent.open).toBe(false);

    preexistingChildTrigger.click();
    expect(preexistingChildContent.open).toBe(true);
    preexistingChildClose.click();
    expect(preexistingChildContent.open).toBe(false);

    incompleteChild.innerHTML = `<dialog data-sw-dialog-content></dialog>`;
    const parentDialog = createDialog(parentRoot);

    expect(validChildContent.open).toBe(true);
    expect(
      parentRoot.querySelector("[data-sw-dialog-content]")?.hasAttribute("data-nested-dialog-open"),
    ).toBe(true);

    validChildClose.click();
    validChildTrigger.click();

    expect(openChange).toHaveBeenCalledTimes(2);
    expect(validChildContent.open).toBe(true);
    expect(
      parentRoot.querySelector("[data-sw-dialog-content]")?.hasAttribute("data-nested-dialog-open"),
    ).toBe(true);

    createDialog(incompleteChild).destroy();
    createDialog(validChildRoot).destroy();
    preexistingChildDialog.destroy();
    createDialog(unrelatedRoot).destroy();
    parentDialog.destroy();
  });

  it("starts a fresh transaction when an existing closed child opens", () => {
    const unrelatedWrapper = document.createElement("div");
    unrelatedWrapper.innerHTML = `
      <div data-sw-dialog id="later-open-unrelated">
        <button data-sw-dialog-trigger>Open unrelated</button>
        <dialog data-sw-dialog-content>
          <button data-sw-dialog-close>Close unrelated</button>
        </dialog>
      </div>
    `;
    const unrelatedRoot = unrelatedWrapper.firstElementChild as HTMLElement;
    document.body.append(unrelatedRoot);
    const unrelatedContent = unrelatedRoot.querySelector<HTMLDialogElement>(
      "[data-sw-dialog-content]",
    )!;
    const unrelatedClose =
      unrelatedRoot.querySelector<HTMLButtonElement>("[data-sw-dialog-close]")!;

    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div data-sw-dialog data-default-open id="later-open-parent">
        <dialog data-sw-dialog-content>
          <button data-sw-dialog-close>Close parent</button>
          <div data-sw-dialog id="later-open-child">
            <button data-sw-dialog-trigger>Open child</button>
            <dialog data-sw-dialog-content>
              <button data-sw-dialog-close>Close child</button>
              <div data-sw-dialog id="stable-descendant">
                <button data-sw-dialog-trigger>Open stable descendant</button>
                <dialog data-sw-dialog-content>
                  <button data-sw-dialog-close>Close stable descendant</button>
                </dialog>
              </div>
            </dialog>
          </div>
        </dialog>
      </div>
    `;
    const parentRoot = wrapper.firstElementChild as HTMLElement;
    document.body.append(parentRoot);
    const childRoot = document.querySelector<HTMLElement>("#later-open-child")!;
    const childContent = childRoot.querySelector<HTMLDialogElement>("[data-sw-dialog-content]")!;
    const stableRoot = document.querySelector<HTMLElement>("#stable-descendant")!;
    const stableContent = stableRoot.querySelector<HTMLDialogElement>("[data-sw-dialog-content]")!;
    const childOpenChange = vi.fn();
    childRoot.addEventListener("starwind:open-change", (event) => {
      if (event.target === childRoot) childOpenChange(event);
    });

    const parentDialog = createDialog(parentRoot);
    const childDialog = createDialog(childRoot);
    const stableDialog = createDialog(stableRoot);
    const childSubscriber = vi.fn();
    childDialog.subscribe("openChange", childSubscriber);

    childContent.insertAdjacentHTML(
      "beforeend",
      `
        <div data-sw-dialog data-default-open id="new-valid-descendant">
          <button data-sw-dialog-trigger>Open new valid descendant</button>
          <dialog data-sw-dialog-content>
            <button id="new-valid-close" data-sw-dialog-close>Close new valid descendant</button>
          </dialog>
        </div>
        <div data-sw-dialog id="new-incomplete-descendant"></div>
      `,
    );
    const validRoot = document.querySelector<HTMLElement>("#new-valid-descendant")!;
    const validContent = validRoot.querySelector<HTMLDialogElement>("[data-sw-dialog-content]")!;
    const validClose = document.querySelector<HTMLButtonElement>("#new-valid-close")!;
    const incompleteRoot = document.querySelector<HTMLElement>("#new-incomplete-descendant")!;
    validClose.addEventListener(
      "focus",
      () => {
        createDialog(unrelatedRoot).open();
      },
      { once: true },
    );
    const validFocus = vi
      .spyOn(validClose, "focus")
      .mockImplementation(() => validClose.dispatchEvent(new FocusEvent("focus")));

    expect(() => childDialog.open()).toThrow("Dialog requires a [data-sw-dialog-content] element.");

    expect(childDialog.getOpen()).toBe(false);
    expect(childContent.open).toBe(false);
    expect(childContent.hidden).toBe(true);
    expect(childOpenChange).not.toHaveBeenCalled();
    expect(childSubscriber).not.toHaveBeenCalled();
    expect(validContent.open).toBe(false);
    expect(
      parentRoot.querySelector("[data-sw-dialog-content]")?.hasAttribute("data-nested-dialog-open"),
    ).toBe(false);
    expect(unrelatedContent.open).toBe(true);
    expect(document.activeElement).toBe(unrelatedClose);

    stableDialog.open();
    expect(stableContent.open).toBe(true);
    stableDialog.close();
    expect(stableContent.open).toBe(false);

    expect(unrelatedContent.open).toBe(true);
    expect(document.activeElement).toBe(unrelatedClose);
    unrelatedClose.click();
    expect(unrelatedContent.open).toBe(false);
    validFocus.mockRestore();

    incompleteRoot.innerHTML = `<dialog data-sw-dialog-content></dialog>`;
    childDialog.open();

    expect(childDialog.getOpen()).toBe(true);
    expect(childContent.open).toBe(true);
    expect(validContent.open).toBe(true);
    expect(childOpenChange).toHaveBeenCalledTimes(1);
    expect(childSubscriber).toHaveBeenCalledTimes(1);
    expect(
      parentRoot.querySelector("[data-sw-dialog-content]")?.hasAttribute("data-nested-dialog-open"),
    ).toBe(true);

    childContent.insertAdjacentHTML(
      "beforeend",
      `<div data-sw-dialog id="rescan-incomplete-descendant"></div>`,
    );
    const rescanIncomplete = document.querySelector<HTMLElement>("#rescan-incomplete-descendant")!;

    expect(() => childDialog.setOpen(true)).toThrow(
      "Dialog requires a [data-sw-dialog-content] element.",
    );
    expect(childDialog.getOpen()).toBe(true);
    expect(childContent.open).toBe(true);
    expect(childOpenChange).toHaveBeenCalledTimes(1);
    expect(childSubscriber).toHaveBeenCalledTimes(1);

    rescanIncomplete.innerHTML = `<dialog data-sw-dialog-content></dialog>`;
    childDialog.setOpen(true);
    expect(childDialog.getOpen()).toBe(true);
    expect(childContent.open).toBe(true);
    expect(childOpenChange).toHaveBeenCalledTimes(1);
    expect(childSubscriber).toHaveBeenCalledTimes(1);

    createDialog(rescanIncomplete).destroy();
    createDialog(incompleteRoot).destroy();
    createDialog(validRoot).destroy();
    stableDialog.destroy();
    childDialog.destroy();
    parentDialog.destroy();
    createDialog(unrelatedRoot).destroy();
  });

  it("rescans an open parent without promoting it above its open child", () => {
    const nested = renderNestedDialogs();
    const parentDialog = createDialog(nested.parentRoot);
    const childDialog = createDialog(nested.childRoot);
    const parentSubscriber = vi.fn();
    const parentEscape = vi.fn();
    const childEscape = vi.fn((event: Event) => event.preventDefault());
    parentDialog.subscribe("openChange", parentSubscriber);
    nested.parentRoot.addEventListener("starwind:escape-key-down", (event) => {
      if (event.target === nested.parentRoot) parentEscape(event);
    });
    nested.childRoot.addEventListener("starwind:escape-key-down", childEscape);
    nested.parentTrigger.click();
    nested.childTrigger.click();
    parentSubscriber.mockClear();

    expect(document.activeElement).toBe(nested.childClose);

    parentDialog.setOpen(true);

    expect(parentSubscriber).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(nested.childClose);
    nested.parentClose.click();
    expect(nested.parentContent.open).toBe(true);
    expect(nested.childContent.open).toBe(true);
    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    expect(childEscape).toHaveBeenCalledTimes(1);
    expect(parentEscape).not.toHaveBeenCalled();
    expect(nested.childContent.open).toBe(true);

    nested.parentContent.insertAdjacentHTML(
      "beforeend",
      `<div data-sw-dialog id="open-rescan-incomplete"></div>`,
    );
    const incomplete = document.querySelector<HTMLElement>("#open-rescan-incomplete")!;

    expect(() => parentDialog.setOpen(true)).toThrow(
      "Dialog requires a [data-sw-dialog-content] element.",
    );
    expect(parentSubscriber).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(nested.childClose);
    nested.parentClose.click();
    expect(nested.parentContent.open).toBe(true);
    expect(nested.childContent.open).toBe(true);
    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    expect(childEscape).toHaveBeenCalledTimes(2);
    expect(parentEscape).not.toHaveBeenCalled();

    incomplete.innerHTML = `<dialog data-sw-dialog-content></dialog>`;
    parentDialog.setOpen(true);

    expect(parentSubscriber).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(nested.childClose);
    nested.parentClose.click();
    expect(nested.parentContent.open).toBe(true);
    expect(nested.childContent.open).toBe(true);

    createDialog(incomplete).destroy();
    childDialog.destroy();
    parentDialog.destroy();
  });

  it("restores child focus when an open parent rescan rolls back a new default-open dialog", () => {
    const nested = renderNestedDialogs();
    const parentDialog = createDialog(nested.parentRoot);
    const childDialog = createDialog(nested.childRoot);
    const parentSubscriber = vi.fn();
    parentDialog.subscribe("openChange", parentSubscriber);
    nested.parentTrigger.click();
    nested.childTrigger.click();
    parentSubscriber.mockClear();

    nested.parentContent.insertAdjacentHTML(
      "beforeend",
      `
        <div data-sw-dialog data-default-open id="focus-rollback-child">
          <button data-sw-dialog-trigger>Open focus rollback child</button>
          <dialog data-sw-dialog-content>
            <button id="focus-rollback-close" data-sw-dialog-close>Close focus rollback child</button>
          </dialog>
        </div>
        <div data-sw-dialog id="focus-rollback-incomplete"></div>
      `,
    );
    const rollbackChild = document.querySelector<HTMLElement>("#focus-rollback-child")!;
    const rollbackContent = rollbackChild.querySelector<HTMLDialogElement>(
      "[data-sw-dialog-content]",
    )!;
    const rollbackClose = document.querySelector<HTMLButtonElement>("#focus-rollback-close")!;
    const incomplete = document.querySelector<HTMLElement>("#focus-rollback-incomplete")!;

    expect(document.activeElement).toBe(nested.childClose);
    expect(() => parentDialog.setOpen(true)).toThrow(
      "Dialog requires a [data-sw-dialog-content] element.",
    );

    expect(rollbackContent.open).toBe(false);
    expect(rollbackContent.hidden).toBe(true);
    expect(document.activeElement).toBe(nested.childClose);
    expect(nested.parentContent.open).toBe(true);
    expect(nested.childContent.open).toBe(true);
    expect(parentSubscriber).not.toHaveBeenCalled();
    nested.parentClose.click();
    expect(nested.parentContent.open).toBe(true);
    expect(nested.childContent.open).toBe(true);

    incomplete.innerHTML = `<dialog data-sw-dialog-content></dialog>`;
    parentDialog.setOpen(true);

    expect(rollbackContent.open).toBe(true);
    expect(document.activeElement).toBe(rollbackClose);
    expect(parentSubscriber).not.toHaveBeenCalled();

    createDialog(incomplete).destroy();
    createDialog(rollbackChild).destroy();
    childDialog.destroy();
    parentDialog.destroy();
  });

  it("preserves focus in a surviving Popover when a Dialog transaction rolls back", () => {
    const popoverRoot = document.createElement("div");
    popoverRoot.dataset.swPopover = "";
    popoverRoot.innerHTML = `
      <button data-sw-popover-trigger>Open unrelated popover</button>
      <div data-sw-popover-portal>
        <div data-sw-popover-popup>
          <button id="surviving-popover-focus">Keep popover focus</button>
        </div>
      </div>
    `;
    const popoverPopup = popoverRoot.querySelector<HTMLElement>("[data-sw-popover-popup]")!;
    const popoverFocus = popoverRoot.querySelector<HTMLButtonElement>("#surviving-popover-focus")!;
    let popoverController: ReturnType<typeof createPopover> | null = null;
    let focusDuringHandler: Element | null = null;

    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div data-sw-dialog data-default-open data-modal="false" id="popover-rollback-parent">
        <dialog data-sw-dialog-content>
          <button data-sw-dialog-close>Close parent</button>
          <div data-sw-dialog data-modal="false" id="popover-rollback-child">
            <button data-sw-dialog-trigger>Open child</button>
            <dialog data-sw-dialog-content>
              <button data-sw-dialog-close>Close child</button>
            </dialog>
          </div>
        </dialog>
      </div>
    `;
    const parentRoot = wrapper.firstElementChild as HTMLElement;
    document.body.append(parentRoot);
    const floatingRoot = document.createElement("div");
    floatingRoot.setAttribute("data-floating-root", "");
    parentRoot.querySelector("[data-sw-dialog-content]")?.append(popoverRoot, floatingRoot);
    const childRoot = document.querySelector<HTMLElement>("#popover-rollback-child")!;
    const childContent = childRoot.querySelector<HTMLDialogElement>("[data-sw-dialog-content]")!;
    const parentDialog = createDialog(parentRoot);
    const childDialog = createDialog(childRoot);

    childContent.insertAdjacentHTML(
      "beforeend",
      `
        <div data-sw-dialog data-default-open data-modal="false" id="popover-rollback-valid">
          <dialog data-sw-dialog-content>
            <button id="popover-rollback-valid-focus" data-sw-dialog-close>Close valid child</button>
          </dialog>
        </div>
        <div data-sw-dialog id="popover-rollback-incomplete"></div>
      `,
    );
    const validRoot = document.querySelector<HTMLElement>("#popover-rollback-valid")!;
    const validContent = validRoot.querySelector<HTMLDialogElement>("[data-sw-dialog-content]")!;
    const validFocus = document.querySelector<HTMLButtonElement>("#popover-rollback-valid-focus")!;
    const incomplete = document.querySelector<HTMLElement>("#popover-rollback-incomplete")!;
    validFocus.addEventListener(
      "focus",
      () => {
        popoverController = createPopover(popoverRoot);
        popoverController.open();
        popoverFocus.focus();
        focusDuringHandler = document.activeElement;
      },
      { once: true },
    );
    const focusSpy = vi
      .spyOn(validFocus, "focus")
      .mockImplementation(() => validFocus.dispatchEvent(new FocusEvent("focus")));

    expect(() => childDialog.open()).toThrow("Dialog requires a [data-sw-dialog-content] element.");

    expect(childDialog.getOpen()).toBe(false);
    expect(validContent.open).toBe(false);
    expect(popoverPopup.hidden).toBe(false);
    expect(focusDuringHandler).toBe(popoverFocus);
    expect(document.activeElement).toBe(popoverFocus);

    focusSpy.mockRestore();
    (popoverController as ReturnType<typeof createPopover> | null)?.destroy();
    validRoot.remove();
    incomplete.remove();
    childDialog.destroy();
    parentDialog.destroy();
  });

  it("falls back to pre-transaction focus when the frozen external focus target is removed", () => {
    const focusBefore = document.createElement("button");
    focusBefore.textContent = "Focus before rollback";
    const externalFocus = document.createElement("button");
    externalFocus.textContent = "External focus that is removed";
    document.body.append(focusBefore, externalFocus);

    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div data-sw-dialog data-modal="false" id="removed-focus-parent">
        <dialog data-sw-dialog-content>
          <div data-sw-dialog data-modal="false" id="removed-focus-child">
            <button data-sw-dialog-trigger>Open child</button>
            <dialog data-sw-dialog-content>
            </dialog>
          </div>
        </dialog>
      </div>
    `;
    const parentRoot = wrapper.firstElementChild as HTMLElement;
    document.body.append(parentRoot);
    const childRoot = parentRoot.querySelector<HTMLElement>("#removed-focus-child")!;
    const childContent = childRoot.querySelector<HTMLDialogElement>("[data-sw-dialog-content]")!;
    const parentDialog = createDialog(parentRoot);
    const childDialog = createDialog(childRoot);
    childContent.insertAdjacentHTML(
      "beforeend",
      `
        <div data-sw-dialog data-default-open data-modal="false" id="removed-focus-valid">
          <dialog data-sw-dialog-content>
            <button id="removed-focus-valid-close" data-sw-dialog-close>Close valid child</button>
          </dialog>
        </div>
        <div data-sw-dialog id="removed-focus-incomplete"></div>
      `,
    );
    const validContent = parentRoot.querySelector<HTMLDialogElement>(
      "#removed-focus-valid [data-sw-dialog-content]",
    )!;
    const validClose = parentRoot.querySelector<HTMLButtonElement>("#removed-focus-valid-close")!;
    const incomplete = parentRoot.querySelector<HTMLElement>("#removed-focus-incomplete")!;
    const closeValidContent = validContent.close.bind(validContent);
    validContent.close = () => {
      externalFocus.remove();
      closeValidContent();
    };

    focusBefore.focus();
    validClose.addEventListener("focus", () => externalFocus.focus(), { once: true });

    expect(() => childDialog.open()).toThrow("Dialog requires a [data-sw-dialog-content] element.");

    expect(externalFocus.isConnected).toBe(false);
    expect(document.activeElement).toBe(focusBefore);

    incomplete.remove();
    childDialog.destroy();
    parentDialog.destroy();
    parentRoot.remove();
    focusBefore.remove();
  });

  it("treats body focus as neutral and restores pre-transaction focus on rollback", () => {
    const focusBefore = document.createElement("button");
    focusBefore.textContent = "Focus before rollback";
    document.body.append(focusBefore);

    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div data-sw-dialog data-modal="false" id="neutral-focus-parent">
        <dialog data-sw-dialog-content>
          <div data-sw-dialog data-modal="false" id="neutral-focus-child">
            <button data-sw-dialog-trigger>Open child</button>
            <dialog data-sw-dialog-content>
            </dialog>
          </div>
        </dialog>
      </div>
    `;
    const parentRoot = wrapper.firstElementChild as HTMLElement;
    document.body.append(parentRoot);
    const childRoot = parentRoot.querySelector<HTMLElement>("#neutral-focus-child")!;
    const childContent = childRoot.querySelector<HTMLDialogElement>("[data-sw-dialog-content]")!;
    const parentDialog = createDialog(parentRoot);
    const childDialog = createDialog(childRoot);
    childContent.insertAdjacentHTML(
      "beforeend",
      `
        <div data-sw-dialog data-default-open data-modal="false" id="neutral-focus-valid">
          <dialog data-sw-dialog-content>
            <button id="neutral-focus-valid-close" data-sw-dialog-close>Close valid child</button>
          </dialog>
        </div>
        <div data-sw-dialog id="neutral-focus-incomplete"></div>
      `,
    );
    const validClose = parentRoot.querySelector<HTMLButtonElement>("#neutral-focus-valid-close")!;
    const incomplete = parentRoot.querySelector<HTMLElement>("#neutral-focus-incomplete")!;
    const previousTabIndex = document.body.getAttribute("tabindex");

    focusBefore.focus();
    validClose.addEventListener(
      "focus",
      () => {
        document.body.tabIndex = -1;
        document.body.focus();
      },
      { once: true },
    );

    expect(() => childDialog.open()).toThrow("Dialog requires a [data-sw-dialog-content] element.");

    expect(document.activeElement).toBe(focusBefore);

    if (previousTabIndex === null) {
      document.body.removeAttribute("tabindex");
    } else {
      document.body.setAttribute("tabindex", previousTabIndex);
    }
    incomplete.remove();
    childDialog.destroy();
    parentDialog.destroy();
    parentRoot.remove();
    focusBefore.remove();
  });

  it("uses the Dialog owner document for rollback focus", () => {
    const iframe = document.createElement("iframe");
    document.body.append(iframe);
    const ownerDocument = iframe.contentDocument!;
    ownerDocument.body.innerHTML = `
      <button id="focus-before">Focus before rollback</button>
      <div data-sw-dialog data-default-open data-modal="false" id="owner-document-parent">
        <dialog data-sw-dialog-content>
          <div data-sw-dialog data-default-open data-modal="false" id="owner-document-valid">
            <dialog data-sw-dialog-content>
              <button data-sw-dialog-close>Close valid child</button>
            </dialog>
          </div>
          <div data-sw-dialog id="owner-document-incomplete"></div>
        </dialog>
      </div>
    `;
    const focusBefore = ownerDocument.querySelector<HTMLButtonElement>("#focus-before")!;
    const parentRoot = ownerDocument.querySelector<HTMLElement>("#owner-document-parent")!;

    focusBefore.focus();

    expect(() => createDialog(parentRoot)).toThrow(
      "Dialog requires a [data-sw-dialog-content] element.",
    );

    expect(ownerDocument.activeElement).toBe(focusBefore);

    iframe.remove();
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

function getPromotedFloatingPortal(): HTMLElement | null {
  return document.querySelector<HTMLElement>("[data-sw-floating-portal]");
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

function nextAnimationFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function mountDialogOwnedLayer(
  owner: HTMLDialogElement,
  options: { controlled?: boolean } = {},
): {
  closeRequests: string[];
  destroy(): void;
  element: HTMLElement;
  focusTarget: HTMLButtonElement;
  session: FloatingPortalSession;
} {
  owner.setAttribute("data-slot", "dialog-content");
  const portalTarget = owner.ownerDocument.createElement("div");
  portalTarget.setAttribute("data-floating-root", "");
  const element = owner.ownerDocument.createElement("div");
  element.setAttribute("data-state", "open");
  const focusTarget = owner.ownerDocument.createElement("button");
  focusTarget.textContent = "Floating layer action";
  element.append(focusTarget);
  owner.append(portalTarget, element);

  const closeRequests: string[] = [];
  let session!: FloatingPortalSession;
  session = createFloatingPortalSession({
    root: element,
    getPortalElement: () => element,
    getPortalTarget: () => portalTarget,
    onOwnerCloseRequest: () => {
      closeRequests.push("owner-close");
      element.dispatchEvent(new CustomEvent("layer-close-request"));
      if (!options.controlled) {
        element.setAttribute("data-state", "closed");
        session.restore();
      }
    },
  });
  session.mount();

  return {
    closeRequests,
    destroy() {
      session.destroy();
      portalTarget.remove();
      element.remove();
    },
    element,
    focusTarget,
    session,
  };
}
