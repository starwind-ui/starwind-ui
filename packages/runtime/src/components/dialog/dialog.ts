import {
  ensureId,
  readBooleanAttribute,
  resolveAsChildControl,
  uniqueElements,
} from "../../internal/dom";
import { createCancelableDetails } from "../../internal/cancelable-details";
import {
  dispatchCustomEvent,
  type ScheduledStarwindInit,
  scheduleStarwindInit,
} from "../../internal/events";
import { focusFirstElement, trapTabKey } from "../../internal/focus";
import { runOverlayOpenChangeShell } from "../../internal/overlay-open-change";
import {
  demoteDialogOwnedFloatingPortals,
  promoteDialogOwnedFloatingPortals,
  requestDialogOwnedFloatingPortalClose,
} from "../../internal/floating-portal";
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
type DialogInitializationTransaction = {
  createdControllers: DialogController[];
  focusBefore: HTMLElement | null;
  openedControllers: DialogController[];
  ownerDocument: Document;
  rollbackFocusPlan: DialogRollbackFocusPlan | null;
};

type DialogRollbackFocusPlan = {
  desiredFocus: HTMLElement | null;
  fallbackFocus: HTMLElement | null;
};

export function createDialog(root: HTMLElement, options: DialogOptions = {}): DialogInstance {
  return createDialogInternal(root, options, null);
}

function createDialogInternal(
  root: HTMLElement,
  options: DialogOptions,
  initializationTransaction: DialogInitializationTransaction | null,
): DialogInstance {
  assertDialogRoot(root);

  const existing = instances.get(root);
  if (existing) return existing;

  const instance = new DialogController(root, options);
  instances.set(root, instance);
  initializationTransaction?.createdControllers.push(instance);
  try {
    instance.initialize(initializationTransaction);
    return instance;
  } catch (error) {
    instance.destroy();
    throw error;
  }
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
  private scheduledInit: ScheduledStarwindInit | null = null;

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
  }

  initialize(initializationTransaction: DialogInitializationTransaction | null): void {
    this.setupAccessibility();
    this.bindEvents();
    if (!this.openState) {
      this.applyOpenState(false);
      if (initializationTransaction) {
        this.initializeNestedDialogs(initializationTransaction);
      }
      return;
    }

    this.runOpenTransaction(undefined, false, initializationTransaction);
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
    if (open) {
      this.runOpenTransaction(request, previousOpen);
    } else {
      this.applyOpenState(false, request);
    }
    this.pendingControlledCloseRequest = null;
    if (options.emit !== false && previousOpen !== open) {
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

    requestDialogOwnedFloatingPortalClose(this.elements.content);
    demoteDialogOwnedFloatingPortals(this.elements.content);
    this.abortController.abort();
    this.closeAbortController?.abort();
    this.cancelScheduledInit();
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
          trigger: getDocumentElement(event.target, this.root.ownerDocument) ?? undefined,
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
          trigger: getDocumentElement(event.target, this.root.ownerDocument) ?? undefined,
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
          trigger: getDocumentElement(event.target, this.root.ownerDocument) ?? undefined,
        });
      },
      { signal },
    );

    content.addEventListener(
      "click",
      (event) => {
        if (!this.closeOnOutsideInteract) return;
        if (!isMouseEventForDocument(event, this.root.ownerDocument)) return;
        if (
          isNodeForDocument(event.target, this.root.ownerDocument) &&
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
        if (!isFormElementForDocument(event.target, this.root.ownerDocument)) return;
        if (event.target.closest("dialog") !== content) return;
        if (event.target.method !== "dialog") return;

        event.preventDefault();
        if (!this.isTopmostOpenLayer()) return;
        this.requestOpen(false, {
          reason: "close-press",
          event,
          trigger: getSubmitter(event, this.root.ownerDocument) ?? event.target,
        });
      },
      { signal },
    );

    this.root.ownerDocument.addEventListener(
      "keydown",
      (event) => {
        if (!this.openState) return;
        if (handledEscapeEvents.has(event)) return;
        if (!this.isTopmostOpenLayer()) return;

        if (event.key === "Escape") {
          if (event.defaultPrevented) return;
          if (this.closeOnEscape) {
            event.preventDefault();
            handledEscapeEvents.add(event);
            this.requestOpen(false, { reason: "escape-key", event });
            return;
          }
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

    const previousOpen = this.openState;
    const transaction =
      open && !this.controlled ? createInitializationTransaction(this.root.ownerDocument) : null;

    try {
      if (transaction) this.initializeNestedDialogs(transaction);

      const result = runOverlayOpenChangeShell({
        root: this.root,
        controlled: this.controlled,
        createDetails: createOpenChangeDetails,
        open,
        previousOpen,
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
          if (open && transaction) {
            this.applyOpenState(true, request, transaction);
          } else {
            this.applyOpenState(false, request);
          }
        },
        onBeforeOpenChange: () => this.dispatchOpenChangeIntent(open, request),
        onNotifyOpenChangeSubscribers: (details) => this.notifyOpenChange(details),
        onOpenChange: (nextOpen, details) => {
          this.onOpenChange?.(nextOpen, details);
        },
      });

      if (transaction) {
        if (result.status === "applied") {
          commitInitializationTransaction(transaction);
        } else {
          rollbackInitializationTransaction(transaction);
          applyRollbackFocusPlan(transaction);
        }
      }
    } catch (error) {
      if (transaction) {
        rollbackInitializationTransaction(transaction);
        this.restoreFailedOpen(previousOpen);
        applyRollbackFocusPlan(transaction);
      } else {
        this.restoreFailedOpen(previousOpen);
      }
      throw error;
    }
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

  private applyOpenState(
    open: boolean,
    request?: OpenRequest,
    initializationTransaction?: DialogInitializationTransaction,
    rescanOnly = false,
  ): void {
    this.closeAbortController?.abort();
    this.closeAbortController = null;
    if (open) {
      this.pendingControlledCloseRequest = null;
    }

    if (!open && !this.stateApplied) {
      this.cancelScheduledInit();
      this.renderState(false);
      this.elements.content.hidden = true;
      if (this.elements.overlay) this.elements.overlay.hidden = true;
      this.stateApplied = true;
      return;
    }

    if (open) {
      if (rescanOnly) {
        if (!initializationTransaction) {
          throw new Error("Dialog open initialization requires a transaction.");
        }
        this.initializeNestedDialogs(initializationTransaction);
        initializationTransaction.openedControllers.push(this);
        this.stateApplied = true;
        return;
      }

      this.registerOpenLayer();
      this.notifyParentNestedOpen();
      this.renderState(true);
      this.openNativeDialog();
      if (!initializationTransaction) {
        throw new Error("Dialog open initialization requires a transaction.");
      }
      this.initializeNestedDialogs(initializationTransaction);
      this.lockBodyScroll();
      if (this.isTopmostOpenLayer()) {
        focusFirstElement(this.elements.content);
      }
      initializationTransaction.openedControllers.push(this);
    } else {
      this.cancelScheduledInit();
      requestDialogOwnedFloatingPortalClose(this.elements.content);
      const closeAbortController = new AbortController();
      this.closeAbortController = closeAbortController;
      this.notifyParentNestedClose();
      this.renderState(false, closeAbortController.signal);
      this.completeCloseAfterAnimations(closeAbortController, request);
    }
    this.stateApplied = true;
  }

  private runOpenTransaction(
    request: OpenRequest | undefined,
    previousOpen: boolean,
    parentTransaction: DialogInitializationTransaction | null = null,
  ): void {
    const transaction =
      parentTransaction ?? createInitializationTransaction(this.root.ownerDocument);

    try {
      this.applyOpenState(true, request, transaction, previousOpen);
      if (!parentTransaction) commitInitializationTransaction(transaction);
    } catch (error) {
      if (parentTransaction) {
        freezeRollbackFocusPlan(transaction);
      } else {
        rollbackInitializationTransaction(transaction);
        this.restoreFailedOpen(previousOpen);
        applyRollbackFocusPlan(transaction);
      }
      throw error;
    }
  }

  private restoreFailedOpen(previousOpen: boolean): void {
    this.openState = previousOpen;
    if (previousOpen) return;

    this.cancelScheduledInit();
    this.notifyParentNestedClose();
    this.unregisterOpenLayer();
    demoteDialogOwnedFloatingPortals(this.elements.content);
    this.closeNativeDialog();
    this.unlockBodyScroll();
    this.renderState(false);
    this.elements.content.hidden = true;
    if (this.elements.overlay) this.elements.overlay.hidden = true;
    this.restoreFocus();
    this.stateApplied = true;
  }

  private openNativeDialog(): void {
    const { content } = this.elements;
    showElement(content, { startingStyleRelease: "after-paint" });
    if (!content.open) {
      this.previousActiveElement = getActiveHTMLElement(this.root.ownerDocument);

      if (this.modal && typeof content.showModal === "function") {
        content.showModal();
      } else if (typeof content.show === "function") {
        content.show();
      } else {
        content.setAttribute("open", "");
      }
    }
    promoteDialogOwnedFloatingPortals(content);
  }

  private initializeNestedDialogs(transaction: DialogInitializationTransaction): void {
    Array.from(
      this.elements.content.querySelectorAll<HTMLElement>(
        "[data-sw-dialog]:not([data-sw-alert-dialog]):not([data-sw-drawer])",
      ),
    )
      .filter((root) => root.parentElement?.closest(DIALOG_ROOT_SELECTOR) === this.root)
      .forEach((root) => createDialogInternal(root, {}, transaction));
  }

  private cancelScheduledInit(): void {
    this.scheduledInit?.cancel();
    this.scheduledInit = null;
  }

  scheduleInitializationAfterCommit(): void {
    this.cancelScheduledInit();
    this.scheduledInit = scheduleStarwindInit(this.elements.content);
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
        showElement(overlay, { startingStyleRelease: "after-paint" });
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

        demoteDialogOwnedFloatingPortals(this.elements.content);
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

function createInitializationTransaction(ownerDocument: Document): DialogInitializationTransaction {
  return {
    createdControllers: [],
    focusBefore: getActiveHTMLElement(ownerDocument),
    openedControllers: [],
    ownerDocument,
    rollbackFocusPlan: null,
  };
}

function commitInitializationTransaction(transaction: DialogInitializationTransaction): void {
  [...new Set(transaction.openedControllers)].forEach((controller) =>
    controller.scheduleInitializationAfterCommit(),
  );
  transaction.createdControllers.length = 0;
  transaction.focusBefore = null;
  transaction.openedControllers.length = 0;
  transaction.rollbackFocusPlan = null;
}

function rollbackInitializationTransaction(transaction: DialogInitializationTransaction): void {
  freezeRollbackFocusPlan(transaction);

  [...transaction.createdControllers].reverse().forEach((controller) => controller.destroy());
  transaction.createdControllers.length = 0;
  transaction.openedControllers.length = 0;
}

function freezeRollbackFocusPlan(transaction: DialogInitializationTransaction): void {
  if (transaction.rollbackFocusPlan) return;

  const activeElement = getActiveHTMLElement(transaction.ownerDocument);
  const focusBefore = transaction.focusBefore;
  const activeElementIsNeutral = isNeutralFocusTarget(activeElement, transaction.ownerDocument);
  const focusOwnedByTransaction =
    activeElement !== null &&
    transaction.createdControllers.some((controller) => controller.root.contains(activeElement));

  transaction.rollbackFocusPlan = {
    desiredFocus: focusOwnedByTransaction || activeElementIsNeutral ? focusBefore : activeElement,
    fallbackFocus: !focusOwnedByTransaction && !activeElementIsNeutral ? focusBefore : null,
  };
}

function applyRollbackFocusPlan(transaction: DialogInitializationTransaction): void {
  const focusPlan = transaction.rollbackFocusPlan;
  if (!focusPlan) return;

  if (isConnectedFocusTarget(focusPlan.desiredFocus, transaction.ownerDocument)) {
    focusPlan.desiredFocus.focus();
  } else if (isConnectedFocusTarget(focusPlan.fallbackFocus, transaction.ownerDocument)) {
    focusPlan.fallbackFocus.focus();
  }

  transaction.focusBefore = null;
  transaction.rollbackFocusPlan = null;
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
    root.ownerDocument.querySelectorAll<HTMLElement>(
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

function assertDialogRoot(value: unknown): asserts value is HTMLElement {
  const ownerDocument = getOwnerDocument(value);
  if (!ownerDocument || !isHTMLElementForDocument(value, ownerDocument)) {
    throw new TypeError("createDialog root must be an HTMLElement.");
  }
}

function getActiveHTMLElement(ownerDocument: Document): HTMLElement | null {
  return getDocumentHTMLElement(ownerDocument.activeElement, ownerDocument);
}

function getDocumentHTMLElement(value: unknown, ownerDocument: Document): HTMLElement | null {
  return isHTMLElementForDocument(value, ownerDocument) ? value : null;
}

function getDocumentElement(value: unknown, ownerDocument: Document): Element | null {
  const ElementConstructor = ownerDocument.defaultView?.Element;
  if (ElementConstructor) return value instanceof ElementConstructor ? value : null;

  return getOwnerDocument(value) === ownerDocument && getNodeType(value) === 1
    ? (value as Element)
    : null;
}

function getOwnerDocument(value: unknown): Document | null {
  if (typeof value !== "object" || value === null || !("ownerDocument" in value)) return null;

  const ownerDocument = (value as { ownerDocument?: unknown }).ownerDocument;
  return ownerDocument &&
    typeof (ownerDocument as { createElement?: unknown }).createElement === "function"
    ? (ownerDocument as Document)
    : null;
}

function isHTMLElementForDocument(value: unknown, ownerDocument: Document): value is HTMLElement {
  const HTMLElementConstructor = ownerDocument.defaultView?.HTMLElement;
  if (HTMLElementConstructor) return value instanceof HTMLElementConstructor;

  return (
    getOwnerDocument(value) === ownerDocument &&
    getNodeType(value) === 1 &&
    typeof (value as { focus?: unknown }).focus === "function"
  );
}

function isNodeForDocument(value: unknown, ownerDocument: Document): value is Node {
  const NodeConstructor = ownerDocument.defaultView?.Node;
  if (NodeConstructor) return value instanceof NodeConstructor;

  return getOwnerDocument(value) === ownerDocument && typeof getNodeType(value) === "number";
}

function isMouseEventForDocument(value: unknown, ownerDocument: Document): value is MouseEvent {
  const MouseEventConstructor = ownerDocument.defaultView?.MouseEvent;
  if (MouseEventConstructor) return value instanceof MouseEventConstructor;

  return typeof value === "object" && value !== null && "clientX" in value && "clientY" in value;
}

function isFormElementForDocument(
  value: unknown,
  ownerDocument: Document,
): value is HTMLFormElement {
  const HTMLFormElementConstructor = ownerDocument.defaultView?.HTMLFormElement;
  if (HTMLFormElementConstructor) return value instanceof HTMLFormElementConstructor;

  return getDocumentElement(value, ownerDocument)?.tagName === "FORM";
}

function getNodeType(value: unknown): number | null {
  if (typeof value !== "object" || value === null || !("nodeType" in value)) return null;

  return typeof value.nodeType === "number" ? value.nodeType : null;
}

function isNeutralFocusTarget(element: HTMLElement | null, ownerDocument: Document): boolean {
  return (
    element === null || element === ownerDocument.body || element === ownerDocument.documentElement
  );
}

function isConnectedFocusTarget(
  element: HTMLElement | null,
  ownerDocument: Document,
): element is HTMLElement {
  return element !== null && element.ownerDocument === ownerDocument && element.isConnected;
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

function getSubmitter(event: SubmitEvent, ownerDocument: Document): Element | null {
  return getDocumentElement(event.submitter, ownerDocument);
}
