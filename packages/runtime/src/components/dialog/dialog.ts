import {
  assertHTMLElement,
  ensureId,
  readBooleanAttribute,
  resolveAsChildControl,
  uniqueElements,
} from "../../internal/dom";
import { createCancelableDetails } from "../../internal/cancelable-details";
import { dispatchCustomEvent } from "../../internal/events";
import { focusFirstElement, trapTabKey } from "../../internal/focus";
import { runOverlayOpenChangeShell } from "../../internal/overlay-open-change";
import { hideElementAfterAnimations, showElement } from "../../internal/presence";
import { type DocumentScrollLock, lockDocumentScroll } from "../../internal/scroll-lock";

export type DialogOpenChangeReason =
  | "trigger-press"
  | "outside-press"
  | "escape-key"
  | "close-press"
  | "imperative-action"
  | "none";

export type DialogOpenChangeDetails = {
  open: boolean;
  previousOpen: boolean;
  reason: DialogOpenChangeReason;
  event?: Event;
  trigger?: Element;
  cancel(): void;
  readonly isCanceled: boolean;
};

export type DialogCloseCompleteDetails = {
  open: false;
  reason: DialogOpenChangeReason;
  event?: Event;
  trigger?: Element;
};

export type DialogRole = "alertdialog" | "dialog";

export type DialogOptions = {
  defaultOpen?: boolean;
  open?: boolean;
  closeOnEscape?: boolean;
  closeOnOutsideInteract?: boolean;
  modal?: boolean;
  role?: DialogRole;
  onOpenChange?: (open: boolean, details: DialogOpenChangeDetails) => void;
  onCloseComplete?: (details: DialogCloseCompleteDetails) => void;
};

export type DialogSetOpenOptions = {
  emit?: boolean;
  reason?: DialogOpenChangeReason;
  event?: Event;
  trigger?: Element;
};

export type DialogInstance = {
  readonly root: HTMLElement;
  open(): void;
  close(): void;
  toggle(): void;
  setOpen(open: boolean, options?: DialogSetOpenOptions): void;
  getOpen(): boolean;
  subscribe(event: "openChange", callback: (details: DialogOpenChangeDetails) => void): () => void;
  subscribe(
    event: "closeComplete",
    callback: (details: DialogCloseCompleteDetails) => void,
  ): () => void;
  destroy(): void;
};

type DialogElements = {
  content: HTMLDialogElement;
  overlay: HTMLElement | null;
  triggers: HTMLElement[];
  closeButtons: HTMLElement[];
  title: HTMLElement | null;
  description: HTMLElement | null;
};

type OpenRequest = {
  reason: DialogOpenChangeReason;
  event?: Event;
  trigger?: Element;
};

const DIALOG_TRIGGER_ATTRIBUTE = "data-sw-dialog-trigger";
const DIALOG_CLOSE_ATTRIBUTE = "data-sw-dialog-close";
const DIALOG_TARGET_ID_ATTRIBUTE = "data-sw-dialog-target-id";
const DIALOG_ROOT_SELECTOR = "[data-sw-dialog], [data-sw-alert-dialog], [data-sw-drawer]";

const instances = new WeakMap<HTMLElement, DialogController>();
const openDialogStack: DialogController[] = [];
const handledEscapeEvents = new WeakSet<Event>();

export function createDialog(root: HTMLElement, options: DialogOptions = {}): DialogInstance {
  assertHTMLElement(root, "createDialog root");

  const existing = instances.get(root);
  if (existing) return existing;

  const instance = new DialogController(root, options);
  instances.set(root, instance);
  return instance;
}

class DialogController implements DialogInstance {
  readonly root: HTMLElement;

  private readonly abortController = new AbortController();
  private readonly openChangeSubscribers = new Set<(details: DialogOpenChangeDetails) => void>();
  private readonly closeCompleteSubscribers = new Set<
    (details: DialogCloseCompleteDetails) => void
  >();
  private readonly elements: DialogElements;
  private readonly controlled: boolean;
  private readonly closeOnEscape: boolean;
  private readonly closeOnOutsideInteract: boolean;
  private readonly modal: boolean;
  private readonly onOpenChange?: (open: boolean, details: DialogOpenChangeDetails) => void;
  private readonly onCloseComplete?: (details: DialogCloseCompleteDetails) => void;
  private readonly role: DialogRole;
  private openState: boolean;
  private previousActiveElement: HTMLElement | null = null;
  private closeAbortController: AbortController | null = null;
  private pendingControlledCloseRequest: OpenRequest | null = null;
  private bodyScrollLock: DocumentScrollLock | null = null;
  private stateApplied = false;
  private destroyed = false;
  private parentController: DialogController | null = null;
  private nestedOpenCount = 0;
  private nestedParentNotified = false;

  constructor(root: HTMLElement, options: DialogOptions) {
    this.root = root;
    this.elements = getDialogElements(root);
    this.controlled = Object.hasOwn(options, "open");
    this.closeOnEscape =
      options.closeOnEscape ?? readBooleanAttribute(root, "data-close-on-escape", true);
    this.closeOnOutsideInteract =
      options.closeOnOutsideInteract ??
      readBooleanAttribute(root, "data-close-on-outside-interact", true);
    this.modal = options.modal ?? readBooleanAttribute(root, "data-modal", true);
    this.onOpenChange = options.onOpenChange;
    this.onCloseComplete = options.onCloseComplete;
    this.role = options.role ?? readDialogRole(this.elements.content.getAttribute("role"));
    this.openState =
      options.open ?? options.defaultOpen ?? readBooleanAttribute(root, "data-default-open");

    this.setupAccessibility();
    this.bindEvents();
    this.applyOpenState(this.openState);
  }

  open(): void {
    this.requestOpen(true, { reason: "imperative-action" });
  }

  close(): void {
    this.requestOpen(false, { reason: "imperative-action" });
  }

  toggle(): void {
    this.requestOpen(!this.openState, { reason: "imperative-action" });
  }

  setOpen(open: boolean, options: DialogSetOpenOptions = {}): void {
    const previousOpen = this.openState;
    const request = this.resolveSetOpenRequest(open, options);
    this.openState = open;
    this.applyOpenState(open, request);
    this.pendingControlledCloseRequest = null;
    if (options.emit !== false) {
      this.notifyOpenChange(
        createOpenChangeDetails({
          open,
          previousOpen,
          reason: request.reason,
          event: request.event,
          trigger: request.trigger,
        }),
      );
    }
  }

  getOpen(): boolean {
    return this.openState;
  }

  subscribe(event: "openChange", callback: (details: DialogOpenChangeDetails) => void): () => void;
  subscribe(
    event: "closeComplete",
    callback: (details: DialogCloseCompleteDetails) => void,
  ): () => void;
  subscribe(
    event: "openChange" | "closeComplete",
    callback:
      | ((details: DialogOpenChangeDetails) => void)
      | ((details: DialogCloseCompleteDetails) => void),
  ): () => void {
    if (event === "openChange") {
      const openChangeCallback = callback as (details: DialogOpenChangeDetails) => void;
      this.openChangeSubscribers.add(openChangeCallback);
      return () => {
        this.openChangeSubscribers.delete(openChangeCallback);
      };
    }

    if (event === "closeComplete") {
      const closeCompleteCallback = callback as (details: DialogCloseCompleteDetails) => void;
      this.closeCompleteSubscribers.add(closeCompleteCallback);
      return () => {
        this.closeCompleteSubscribers.delete(closeCompleteCallback);
      };
    }

    {
      throw new Error(`Unsupported Dialog event: ${event}`);
    }
  }

  destroy(): void {
    if (this.destroyed) return;

    this.abortController.abort();
    this.closeAbortController?.abort();
    this.openChangeSubscribers.clear();
    this.closeCompleteSubscribers.clear();
    this.unregisterOpenLayer();
    this.notifyParentNestedClose();
    if (this.openState || this.elements.content.open) {
      this.closeNativeDialog();
      this.unlockBodyScroll();
    }
    this.elements.content.hidden = true;
    if (this.elements.overlay) this.elements.overlay.hidden = true;
    instances.delete(this.root);
    this.destroyed = true;
  }

  private setupAccessibility(): void {
    const { content, description, title, triggers } = this.elements;
    const contentId = ensureId(content, "sw-dialog-content");

    content.setAttribute("role", this.role);
    content.setAttribute("aria-modal", String(this.modal));

    if (title) {
      content.setAttribute("aria-labelledby", ensureId(title, "sw-dialog-title"));
    }

    if (description) {
      content.setAttribute("aria-describedby", ensureId(description, "sw-dialog-description"));
    }

    triggers.forEach((trigger) => {
      trigger.setAttribute("aria-haspopup", "dialog");
      trigger.setAttribute("aria-controls", contentId);
    });
  }

  private bindEvents(): void {
    const { signal } = this.abortController;
    const { content, closeButtons, overlay, triggers } = this.elements;

    triggers.forEach((trigger) => {
      trigger.addEventListener(
        "click",
        (event) => {
          this.requestOpen(true, { reason: "trigger-press", event, trigger });
        },
        { signal },
      );
    });

    closeButtons.forEach((button) => {
      button.addEventListener(
        "click",
        (event) => {
          if (!this.isTopmostOpenLayer()) return;
          this.requestOpen(false, { reason: "close-press", event, trigger: button });
        },
        { signal },
      );
    });

    overlay?.addEventListener(
      "click",
      (event) => {
        if (!this.closeOnOutsideInteract) return;
        if (!this.isTopmostOpenLayer()) return;
        this.requestOpen(false, { reason: "outside-press", event });
      },
      { signal },
    );

    this.root.addEventListener(
      "dialog:open",
      (event) => {
        this.requestOpen(true, {
          reason: "imperative-action",
          event,
          trigger: event.target instanceof Element ? event.target : undefined,
        });
      },
      { signal },
    );

    this.root.addEventListener(
      "dialog:close",
      (event) => {
        this.requestOpen(false, {
          reason: "imperative-action",
          event,
          trigger: event.target instanceof Element ? event.target : undefined,
        });
      },
      { signal },
    );

    this.root.addEventListener(
      "dialog:toggle",
      (event) => {
        this.requestOpen(!this.openState, {
          reason: "imperative-action",
          event,
          trigger: event.target instanceof Element ? event.target : undefined,
        });
      },
      { signal },
    );

    content.addEventListener(
      "click",
      (event) => {
        if (!this.closeOnOutsideInteract) return;
        if (!(event instanceof MouseEvent)) return;
        if (
          event.target instanceof Node &&
          event.target !== content &&
          content.contains(event.target)
        ) {
          return;
        }
        if (isPointInsideElement(content, event.clientX, event.clientY)) return;
        if (!this.isTopmostOpenLayer()) return;

        this.requestOpen(false, { reason: "outside-press", event });
      },
      { signal },
    );

    content.addEventListener(
      "cancel",
      (event) => {
        event.preventDefault();
        if (!this.closeOnEscape) return;
        if (!this.isTopmostOpenLayer()) return;
        this.requestOpen(false, { reason: "escape-key", event });
      },
      { signal },
    );

    content.addEventListener(
      "submit",
      (event) => {
        if (!(event.target instanceof HTMLFormElement)) return;
        if (event.target.closest("dialog") !== content) return;
        if (event.target.method !== "dialog") return;

        event.preventDefault();
        if (!this.isTopmostOpenLayer()) return;
        this.requestOpen(false, {
          reason: "close-press",
          event,
          trigger: getSubmitter(event) ?? event.target,
        });
      },
      { signal },
    );

    document.addEventListener(
      "keydown",
      (event) => {
        if (!this.openState) return;
        if (handledEscapeEvents.has(event)) return;
        if (!this.isTopmostOpenLayer()) return;

        if (event.key === "Escape" && this.closeOnEscape) {
          event.preventDefault();
          handledEscapeEvents.add(event);
          this.requestOpen(false, { reason: "escape-key", event });
          return;
        }

        if (this.modal) {
          trapTabKey(content, event);
        }
      },
      { signal },
    );
  }

  private requestOpen(open: boolean, request: OpenRequest): void {
    if (open === this.openState && !this.controlled) return;

    runOverlayOpenChangeShell({
      root: this.root,
      controlled: this.controlled,
      createDetails: createOpenChangeDetails,
      open,
      previousOpen: this.openState,
      request,
      onApplyControlledOpenState: () => {
        if (open) {
          this.pendingControlledCloseRequest = null;
        } else {
          this.pendingControlledCloseRequest = request;
        }
      },
      onApplyUncontrolledOpenState: () => {
        this.openState = open;
        this.applyOpenState(open, request);
      },
      onBeforeOpenChange: () => this.dispatchOpenChangeIntent(open, request),
      onNotifyOpenChangeSubscribers: (details) => this.notifyOpenChange(details),
      onOpenChange: (nextOpen, details) => {
        this.onOpenChange?.(nextOpen, details);
      },
    });
  }

  private dispatchOpenChangeIntent(open: boolean, request: OpenRequest): boolean {
    if (!open && request.reason === "escape-key") {
      const intentEvent = dispatchCustomEvent(
        this.root,
        "starwind:escape-key-down",
        {
          open: this.openState,
          reason: request.reason,
          event: request.event,
        },
        { cancelable: true },
      );
      if (intentEvent.defaultPrevented) return false;
    }

    if (!open && request.reason === "outside-press") {
      const intentEvent = dispatchCustomEvent(
        this.root,
        "starwind:outside-interact",
        {
          open: this.openState,
          reason: request.reason,
          event: request.event,
        },
        { cancelable: true },
      );
      if (intentEvent.defaultPrevented) return false;
    }

    return true;
  }

  private applyOpenState(open: boolean, request?: OpenRequest): void {
    this.closeAbortController?.abort();
    this.closeAbortController = null;
    if (open) {
      this.pendingControlledCloseRequest = null;
    }

    if (!open && !this.stateApplied) {
      this.renderState(false);
      this.elements.content.hidden = true;
      if (this.elements.overlay) this.elements.overlay.hidden = true;
      this.stateApplied = true;
      return;
    }

    if (open) {
      this.registerOpenLayer();
      this.notifyParentNestedOpen();
      this.openNativeDialog();
      this.renderState(true);
      this.lockBodyScroll();
      focusFirstElement(this.elements.content);
    } else {
      const closeAbortController = new AbortController();
      this.closeAbortController = closeAbortController;
      this.notifyParentNestedClose();
      this.renderState(false, closeAbortController.signal);
      this.completeCloseAfterAnimations(closeAbortController, request);
    }
    this.stateApplied = true;
  }

  private openNativeDialog(): void {
    const { content } = this.elements;
    showElement(content);
    if (content.open) return;

    this.previousActiveElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    if (this.modal && typeof content.showModal === "function") {
      content.showModal();
      return;
    }

    if (typeof content.show === "function") {
      content.show();
      return;
    }

    content.setAttribute("open", "");
  }

  private closeNativeDialog(): void {
    const { content } = this.elements;
    if (!content.open) return;

    if (typeof content.close === "function") {
      content.close();
    } else {
      content.removeAttribute("open");
    }
  }

  private renderState(open: boolean, closeSignal?: AbortSignal): void {
    const state = open ? "open" : "closed";
    const { content, overlay, triggers } = this.elements;

    this.root.setAttribute("data-state", state);
    content.setAttribute("data-state", state);
    overlay?.setAttribute("data-state", state);
    if (overlay && open) {
      if (this.isNestedDialog()) {
        overlay.hidden = true;
      } else {
        showElement(overlay);
      }
    } else if (overlay) {
      hideElementAfterAnimations(overlay, { signal: closeSignal });
    }

    triggers.forEach((trigger) => {
      trigger.setAttribute("data-state", state);
      trigger.setAttribute("aria-expanded", String(open));
    });
  }

  private completeCloseAfterAnimations(
    closeAbortController: AbortController,
    request: OpenRequest | undefined,
  ): void {
    hideElementAfterAnimations(this.elements.content, {
      signal: closeAbortController.signal,
      onHidden: () => {
        if (closeAbortController.signal.aborted) return;

        this.closeNativeDialog();
        this.unregisterOpenLayer();
        this.notifyParentNestedClose();
        this.unlockBodyScroll();
        this.restoreFocus();

        if (this.closeAbortController === closeAbortController) {
          this.closeAbortController = null;
        }

        this.notifyCloseComplete(createCloseCompleteDetails(request));
      },
    });
  }

  private notifyOpenChange(details: DialogOpenChangeDetails): void {
    this.openChangeSubscribers.forEach((subscriber) => subscriber(details));
  }

  private notifyCloseComplete(details: DialogCloseCompleteDetails): void {
    this.onCloseComplete?.(details);
    dispatchCustomEvent(this.root, "starwind:close-complete", details);
    this.closeCompleteSubscribers.forEach((subscriber) => subscriber(details));
  }

  private resolveSetOpenRequest(open: boolean, options: DialogSetOpenOptions): OpenRequest {
    if (options.reason || options.event || options.trigger) {
      return {
        reason: options.reason ?? "imperative-action",
        event: options.event,
        trigger: options.trigger,
      };
    }

    if (!open && this.pendingControlledCloseRequest) {
      return this.pendingControlledCloseRequest;
    }

    return { reason: "imperative-action" };
  }

  private lockBodyScroll(): void {
    if (!this.modal || this.bodyScrollLock) return;

    this.bodyScrollLock = lockDocumentScroll(this.root.ownerDocument);
  }

  private unlockBodyScroll(): void {
    if (!this.modal || !this.bodyScrollLock) return;

    this.bodyScrollLock.release();
    this.bodyScrollLock = null;
  }

  private restoreFocus(): void {
    if (this.previousActiveElement?.isConnected) {
      this.previousActiveElement.focus();
    }
    this.previousActiveElement = null;
  }

  private registerOpenLayer(): void {
    removeOpenLayer(this);
    openDialogStack.push(this);
  }

  private unregisterOpenLayer(): void {
    removeOpenLayer(this);
  }

  private isTopmostOpenLayer(): boolean {
    return getTopmostOpenDialog() === this;
  }

  isOpenLayerActive(): boolean {
    return !this.destroyed && (this.openState || this.elements.content.open);
  }

  private isNestedDialog(): boolean {
    return this.getParentController() !== null;
  }

  private getParentController(): DialogController | null {
    if (this.parentController && !this.parentController.destroyed) {
      return this.parentController;
    }

    const parentRoot = this.root.parentElement?.closest<HTMLElement>(DIALOG_ROOT_SELECTOR);
    this.parentController = parentRoot ? (instances.get(parentRoot) ?? null) : null;

    return this.parentController;
  }

  private notifyParentNestedOpen(): void {
    if (this.nestedParentNotified) return;

    const parentController = this.getParentController();
    if (!parentController) return;

    parentController.onNestedDialogOpen();
    this.nestedParentNotified = true;
  }

  private notifyParentNestedClose(): void {
    if (!this.nestedParentNotified) return;

    const parentController = this.getParentController();
    if (parentController) {
      parentController.onNestedDialogClose();
    }

    this.nestedParentNotified = false;
  }

  private onNestedDialogOpen(): void {
    this.nestedOpenCount += 1;
    this.updateNestedState();
    this.getParentController()?.onNestedDialogOpen();
  }

  private onNestedDialogClose(): void {
    this.nestedOpenCount = Math.max(0, this.nestedOpenCount - 1);
    this.updateNestedState();
    this.getParentController()?.onNestedDialogClose();
  }

  private updateNestedState(): void {
    if (this.nestedOpenCount > 0) {
      this.elements.content.setAttribute("data-nested-dialog-open", "");
      this.elements.content.style.setProperty("--nested-dialogs", String(this.nestedOpenCount));
      return;
    }

    this.elements.content.removeAttribute("data-nested-dialog-open");
    this.elements.content.style.removeProperty("--nested-dialogs");
  }
}

function getTopmostOpenDialog(): DialogController | null {
  for (let index = openDialogStack.length - 1; index >= 0; index -= 1) {
    const controller = openDialogStack[index];
    if (controller.isOpenLayerActive()) return controller;

    openDialogStack.splice(index, 1);
  }

  return null;
}

function removeOpenLayer(controller: DialogController): void {
  const index = openDialogStack.indexOf(controller);
  if (index >= 0) {
    openDialogStack.splice(index, 1);
  }
}

function getDialogElements(root: HTMLElement): DialogElements {
  const content = root.querySelector<HTMLDialogElement>("[data-sw-dialog-content]");
  if (!content) {
    throw new Error("Dialog requires a [data-sw-dialog-content] element.");
  }

  return {
    content,
    overlay: root.querySelector<HTMLElement>("[data-sw-dialog-overlay]"),
    triggers: getDialogTriggers(root),
    closeButtons: getResolvedDialogControls(root, DIALOG_CLOSE_ATTRIBUTE),
    title: root.querySelector<HTMLElement>("[data-sw-dialog-title]"),
    description: root.querySelector<HTMLElement>("[data-sw-dialog-description]"),
  };
}

function getDialogTriggers(root: HTMLElement): HTMLElement[] {
  const internalTriggers = getResolvedDialogControls(root, DIALOG_TRIGGER_ATTRIBUTE);
  const rootId = root.id;

  if (!rootId) return internalTriggers;

  const externalTriggers = Array.from(
    document.querySelectorAll<HTMLElement>(
      `[${DIALOG_TRIGGER_ATTRIBUTE}][${DIALOG_TARGET_ID_ATTRIBUTE}]`,
    ),
  )
    .filter(
      (trigger) =>
        !root.contains(trigger) && trigger.getAttribute(DIALOG_TARGET_ID_ATTRIBUTE) === rootId,
    )
    .map(resolveAsChildControl);

  return uniqueElements([...internalTriggers, ...externalTriggers]);
}

function getResolvedDialogControls(root: HTMLElement, attribute: string): HTMLElement[] {
  return uniqueElements(
    Array.from(root.querySelectorAll<HTMLElement>(`[${attribute}]`)).map(resolveAsChildControl),
  );
}

function isPointInsideElement(element: HTMLElement, clientX: number, clientY: number): boolean {
  const rect = element.getBoundingClientRect();

  return (
    clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom
  );
}

function createOpenChangeDetails(
  details: Omit<DialogOpenChangeDetails, "cancel" | "isCanceled">,
): DialogOpenChangeDetails {
  return createCancelableDetails(details);
}

function createCloseCompleteDetails(request: OpenRequest | undefined): DialogCloseCompleteDetails {
  return {
    open: false,
    reason: request?.reason ?? "imperative-action",
    event: request?.event,
    trigger: request?.trigger,
  };
}

function readDialogRole(value: string | null): DialogRole {
  return value === "alertdialog" ? "alertdialog" : "dialog";
}

function getSubmitter(event: SubmitEvent): Element | null {
  return event.submitter instanceof Element ? event.submitter : null;
}
