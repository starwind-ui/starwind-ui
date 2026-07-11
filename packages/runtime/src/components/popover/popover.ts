import {
  assertHTMLElement,
  ensureId,
  readBooleanAttribute,
  resolveAsChildControl,
  uniqueElements,
} from "../../internal/dom";
import { createCancelableDetails } from "../../internal/cancelable-details";
import { dispatchCustomEvent } from "../../internal/events";
import {
  createFloatingPositioner,
  type FloatingAlign,
  type FloatingPositioner,
  type FloatingSide,
  resolveFloatingPortalTarget,
} from "../../internal/floating";
import {
  createFloatingDisclosureLifecycle,
  type FloatingDisclosureLifecycle,
  type FloatingDisclosurePositionOptions,
} from "../../internal/floating-disclosure";
import { focusFirstElement } from "../../internal/focus";
import { runOverlayOpenChangeShell } from "../../internal/overlay-open-change";
import { hideElementAfterAnimations, showElement } from "../../internal/presence";
import { lockDocumentScroll } from "../../internal/scroll-lock";

export type PopoverOpenChangeReason =
  | "close-press"
  | "escape-key"
  | "imperative-action"
  | "outside-press"
  | "trigger-hover"
  | "trigger-press";

export type PopoverOpenChangeDetails = {
  event?: Event;
  open: boolean;
  previousOpen: boolean;
  reason: PopoverOpenChangeReason;
  trigger?: Element;
  cancel(): void;
  readonly isCanceled: boolean;
};

export type PopoverCloseCompleteDetails = {
  event?: Event;
  open: false;
  reason: PopoverOpenChangeReason;
  trigger?: Element;
};

export type PopoverOptions = {
  closeOnEscape?: boolean;
  closeOnOutsideInteract?: boolean;
  defaultOpen?: boolean;
  modal?: boolean;
  onCloseComplete?: (details: PopoverCloseCompleteDetails) => void;
  onOpenChange?: (open: boolean, details: PopoverOpenChangeDetails) => void;
  open?: boolean;
  openOnHover?: boolean;
};

export type PopoverSetOpenOptions = {
  emit?: boolean;
  event?: Event;
  reason?: PopoverOpenChangeReason;
  trigger?: Element;
};

export type PopoverInstance = {
  readonly root: HTMLElement;
  close(): void;
  destroy(): void;
  getOpen(): boolean;
  open(): void;
  setOpen(open: boolean, options?: PopoverSetOpenOptions): void;
  subscribe(event: "openChange", callback: (details: PopoverOpenChangeDetails) => void): () => void;
  subscribe(
    event: "closeComplete",
    callback: (details: PopoverCloseCompleteDetails) => void,
  ): () => void;
  toggle(): void;
};

type PopoverElements = {
  backdrop: HTMLElement | null;
  closeButtons: HTMLElement[];
  description: HTMLElement | null;
  popup: HTMLElement;
  portal: HTMLElement | null;
  positioner: HTMLElement | null;
  title: HTMLElement | null;
  triggers: HTMLElement[];
};

type OpenRequest = {
  event?: Event;
  reason: PopoverOpenChangeReason;
  trigger?: Element;
};

const POPOVER_ROOT_ATTRIBUTE = "data-sw-popover";
const POPOVER_TRIGGER_ATTRIBUTE = "data-sw-popover-trigger";
const POPOVER_PORTAL_ATTRIBUTE = "data-sw-popover-portal";
const POPOVER_POSITIONER_ATTRIBUTE = "data-sw-popover-positioner";
const POPOVER_POPUP_ATTRIBUTE = "data-sw-popover-popup";
const POPOVER_BACKDROP_ATTRIBUTE = "data-sw-popover-backdrop";
const POPOVER_TITLE_ATTRIBUTE = "data-sw-popover-title";
const POPOVER_DESCRIPTION_ATTRIBUTE = "data-sw-popover-description";
const POPOVER_CLOSE_ATTRIBUTE = "data-sw-popover-close";
const POPOVER_DEFAULT_OPEN_ATTRIBUTE = "data-default-open";
const POPOVER_CLOSE_ON_ESCAPE_ATTRIBUTE = "data-close-on-escape";
const POPOVER_CLOSE_ON_OUTSIDE_INTERACT_ATTRIBUTE = "data-close-on-outside-interact";
const POPOVER_MODAL_ATTRIBUTE = "data-modal";
const POPOVER_OPEN_ON_HOVER_ATTRIBUTE = "data-open-on-hover";
const POPOVER_CLOSE_DELAY_ATTRIBUTE = "data-close-delay";
const POPOVER_SIDE_ATTRIBUTE = "data-side";
const POPOVER_ALIGN_ATTRIBUTE = "data-align";
const POPOVER_SIDE_OFFSET_ATTRIBUTE = "data-side-offset";
const POPOVER_AVOID_COLLISIONS_ATTRIBUTE = "data-avoid-collisions";
const instances = new WeakMap<HTMLElement, PopoverController>();
const popupOwners = new WeakMap<HTMLElement, PopoverController>();

export function createPopover(root: HTMLElement, options: PopoverOptions = {}): PopoverInstance {
  assertHTMLElement(root, "createPopover root");

  const existing = instances.get(root);
  if (existing) return existing;

  const instance = new PopoverController(root, options);
  instances.set(root, instance);
  return instance;
}

class PopoverController implements PopoverInstance {
  readonly root: HTMLElement;

  private readonly abortController = new AbortController();
  private readonly closeOnEscape: boolean;
  private readonly closeOnOutsideInteract: boolean;
  private readonly controlled: boolean;
  private readonly elements: PopoverElements;
  private readonly modal: boolean;
  private readonly onCloseComplete?: (details: PopoverCloseCompleteDetails) => void;
  private readonly onOpenChange?: (open: boolean, details: PopoverOpenChangeDetails) => void;
  private readonly openOnHover: boolean;
  private readonly parentController: PopoverController | null;
  private readonly lifecycle: FloatingDisclosureLifecycle<OpenRequest>;
  private readonly openChangeSubscribers = new Set<(details: PopoverOpenChangeDetails) => void>();
  private readonly closeCompleteSubscribers = new Set<
    (details: PopoverCloseCompleteDetails) => void
  >();
  private activeTrigger: HTMLElement | null = null;
  private destroyed = false;
  private hoverCloseTimer: number | null = null;
  private openChildCount = 0;
  private openState: boolean;
  private pendingControlledCloseRequest: OpenRequest | null = null;
  private pendingControlledOpenRequest: OpenRequest | null = null;
  private previousActiveElement: HTMLElement | null = null;
  private registeredWithParentAsOpenChild = false;

  constructor(root: HTMLElement, options: PopoverOptions) {
    this.root = root;
    this.elements = getPopoverElements(root);
    popupOwners.set(this.elements.popup, this);
    this.parentController = this.resolveParentController();
    this.controlled = Object.hasOwn(options, "open");
    this.closeOnEscape =
      options.closeOnEscape ?? readBooleanAttribute(root, POPOVER_CLOSE_ON_ESCAPE_ATTRIBUTE, true);
    this.closeOnOutsideInteract =
      options.closeOnOutsideInteract ??
      readBooleanAttribute(root, POPOVER_CLOSE_ON_OUTSIDE_INTERACT_ATTRIBUTE, true);
    this.modal = options.modal ?? readBooleanAttribute(root, POPOVER_MODAL_ATTRIBUTE, false);
    this.onCloseComplete = options.onCloseComplete;
    this.onOpenChange = options.onOpenChange;
    this.openOnHover =
      options.openOnHover ?? readBooleanAttribute(root, POPOVER_OPEN_ON_HOVER_ATTRIBUTE, false);
    this.openState =
      options.open ??
      options.defaultOpen ??
      readBooleanAttribute(root, POPOVER_DEFAULT_OPEN_ATTRIBUTE, false);

    this.activeTrigger = this.elements.triggers[0] ?? null;
    this.lifecycle = createFloatingDisclosureLifecycle<OpenRequest>({
      backdrop: this.elements.backdrop,
      clearFloatingStyles: () => this.clearFloatingStyles(),
      closeOnEscape: () => this.closeOnEscape,
      closeOnOutsideInteract: () => this.closeOnOutsideInteract,
      containsTarget: (target) => this.containsTarget(target),
      createFloatingPositioner: (reference, positionOptions) =>
        this.createPopoverPositioner(reference, positionOptions),
      getFloatingReference: () => this.getConnectedActiveTrigger(),
      getOpen: () => this.openState,
      getPortalElement: () => this.getPortalElement(),
      getPortalTarget: () => this.resolvePortalTarget(),
      isDestroyed: () => this.destroyed,
      lockDocumentScroll,
      onBeforeClose: () => {
        this.closeNestedPopovers();
      },
      onBeforeOpen: ({ captureFocusFallback, request }) => {
        if (captureFocusFallback) {
          this.previousActiveElement =
            document.activeElement instanceof HTMLElement ? document.activeElement : null;
        }
        this.activeTrigger = this.resolveActiveTrigger(request);
        this.clearHoverCloseTimersInTree();
        this.registerAsOpenChildOnParent();
      },
      onCloseComplete: ({ request }) => {
        this.unregisterAsOpenChildOnParent();
        this.restoreFocus();
        this.notifyCloseComplete(createCloseCompleteDetails(request));
      },
      onEscapeKeyDown: (event) => {
        event.preventDefault();
        this.requestOpen(false, { event, reason: "escape-key" });
      },
      onImmediateClose: () => {
        this.unregisterAsOpenChildOnParent();
      },
      onOpenFrame: () => {
        focusFirstElement(this.elements.popup);
      },
      onOutsidePointerDown: (event) => {
        this.requestOpen(false, { event, reason: "outside-press" });
      },
      popup: this.elements.popup,
      renderState: (open, closeSignal) => this.renderState(open, closeSignal),
      root: this.root,
      shouldLockDocumentScroll: (request) => this.modal && request?.reason !== "trigger-hover",
    });
    this.setupAccessibility();
    this.bindEvents();
    this.applyOpenState(this.openState, undefined, { captureFocusFallback: this.openState });
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

  setOpen(open: boolean, options: PopoverSetOpenOptions = {}): void {
    const previousOpen = this.openState;
    const request = this.resolveSetOpenRequest(open, options);
    this.openState = open;
    this.applyOpenState(open, request, { captureFocusFallback: open && !previousOpen });
    this.pendingControlledOpenRequest = null;
    this.pendingControlledCloseRequest = null;

    if (options.emit !== false) {
      this.notifyOpenChange(
        createOpenChangeDetails({
          open,
          previousOpen,
          event: request.event,
          reason: request.reason,
          trigger: request.trigger,
        }),
      );
    }
  }

  getOpen(): boolean {
    return this.openState;
  }

  subscribe(event: "openChange", callback: (details: PopoverOpenChangeDetails) => void): () => void;
  subscribe(
    event: "closeComplete",
    callback: (details: PopoverCloseCompleteDetails) => void,
  ): () => void;
  subscribe(
    event: "openChange" | "closeComplete",
    callback:
      | ((details: PopoverOpenChangeDetails) => void)
      | ((details: PopoverCloseCompleteDetails) => void),
  ): () => void {
    if (event === "openChange") {
      const openChangeCallback = callback as (details: PopoverOpenChangeDetails) => void;
      this.openChangeSubscribers.add(openChangeCallback);
      return () => {
        this.openChangeSubscribers.delete(openChangeCallback);
      };
    }

    if (event === "closeComplete") {
      const closeCompleteCallback = callback as (details: PopoverCloseCompleteDetails) => void;
      this.closeCompleteSubscribers.add(closeCompleteCallback);
      return () => {
        this.closeCompleteSubscribers.delete(closeCompleteCallback);
      };
    }

    throw new Error(`Unsupported Popover event: ${event}`);
  }

  destroy(): void {
    if (this.destroyed) return;

    this.abortController.abort();
    this.clearHoverCloseTimer();
    this.lifecycle.destroy();
    this.openChangeSubscribers.clear();
    this.closeCompleteSubscribers.clear();
    this.unregisterAsOpenChildOnParent();
    popupOwners.delete(this.elements.popup);
    this.openState = false;
    this.previousActiveElement = null;
    this.renderState(false);
    this.elements.popup.hidden = true;
    this.elements.backdrop?.setAttribute("hidden", "");
    instances.delete(this.root);
    this.destroyed = true;
  }

  private setupAccessibility(): void {
    const { description, popup, title, triggers } = this.elements;
    const popupId = ensureId(popup, "sw-popover-popup");
    const firstTrigger = triggers[0] ?? null;

    popup.setAttribute("role", popup.getAttribute("role") ?? "dialog");
    popup.setAttribute("tabindex", popup.getAttribute("tabindex") ?? "-1");

    if (title) {
      popup.setAttribute("aria-labelledby", ensureId(title, "sw-popover-title"));
    } else if (firstTrigger) {
      popup.setAttribute("aria-labelledby", ensureId(firstTrigger, "sw-popover-trigger"));
    } else if (!popup.hasAttribute("aria-label")) {
      popup.setAttribute("aria-label", "Popover dialog");
    }

    if (description) {
      popup.setAttribute("aria-describedby", ensureId(description, "sw-popover-description"));
    }

    triggers.forEach((trigger, index) => {
      ensureId(trigger, `sw-popover-trigger-${index}`);
      trigger.setAttribute("aria-haspopup", "dialog");
      trigger.setAttribute("aria-controls", popupId);
    });
  }

  private bindEvents(): void {
    const { signal } = this.abortController;

    this.elements.triggers.forEach((trigger) => {
      trigger.addEventListener(
        "click",
        (event) => {
          if (isDisabledTrigger(trigger)) return;
          event.preventDefault();
          this.requestOpen(this.getTriggerPressOpenState(trigger), {
            event,
            reason: "trigger-press",
            trigger,
          });
        },
        { signal },
      );

      trigger.addEventListener(
        "keydown",
        (event) => {
          if (isDisabledTrigger(trigger)) return;

          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            this.requestOpen(this.getTriggerPressOpenState(trigger), {
              event,
              reason: "trigger-press",
              trigger,
            });
            return;
          }

          if (event.key === "ArrowDown" && !this.openState) {
            event.preventDefault();
            this.requestOpen(true, {
              event,
              reason: "trigger-press",
              trigger,
            });
            return;
          }

          if (event.key === "Escape" && this.openState) {
            event.preventDefault();
            this.requestOpen(false, { event, reason: "escape-key" });
          }
        },
        { signal },
      );

      if (this.openOnHover) {
        trigger.addEventListener(
          "pointerenter",
          (event) => {
            if (event.pointerType !== "mouse" || isDisabledTrigger(trigger)) return;
            this.clearHoverCloseTimer();
            this.requestOpen(true, {
              event,
              reason: "trigger-hover",
              trigger,
            });
          },
          { signal },
        );

        trigger.addEventListener(
          "pointerleave",
          (event) => {
            if (event.pointerType !== "mouse") return;
            this.closeAfterHoverDelay();
          },
          { signal },
        );
      }
    });

    this.elements.closeButtons.forEach((button) => {
      button.addEventListener(
        "click",
        (event) => {
          this.requestOpen(false, { event, reason: "close-press", trigger: button });
        },
        { signal },
      );
    });

    this.elements.popup.addEventListener(
      "keydown",
      (event) => {
        if (event.key !== "Escape" || !this.closeOnEscape || !this.openState) return;
        event.preventDefault();
        this.requestOpen(false, { event, reason: "escape-key" });
      },
      { signal },
    );

    if (this.openOnHover) {
      this.elements.popup.addEventListener(
        "pointerenter",
        (event) => {
          if (event.pointerType !== "mouse") return;
          this.clearHoverCloseTimer();
        },
        { signal },
      );
      this.elements.popup.addEventListener(
        "pointerleave",
        (event) => {
          if (event.pointerType !== "mouse") return;
          this.closeAfterHoverDelay();
        },
        { signal },
      );
    }
  }

  private requestOpen(open: boolean, request: OpenRequest): void {
    const shouldSwitchActiveTrigger = this.shouldSwitchActiveTrigger(open, request);

    if (open === this.openState && !this.controlled && !shouldSwitchActiveTrigger) {
      return;
    }

    const previousOpen = this.openState;
    runOverlayOpenChangeShell({
      root: this.root,
      controlled: this.controlled,
      createDetails: createOpenChangeDetails,
      open,
      previousOpen,
      request,
      onApplyControlledOpenState: () => {
        if (shouldSwitchActiveTrigger) {
          this.applyOpenState(open, request, { captureFocusFallback: open && !previousOpen });
        }

        if (open) {
          this.pendingControlledOpenRequest = request;
          this.pendingControlledCloseRequest = null;
        } else {
          this.pendingControlledOpenRequest = null;
          this.pendingControlledCloseRequest = request;
        }
      },
      onApplyUncontrolledOpenState: () => {
        this.openState = open;
        this.applyOpenState(open, request, { captureFocusFallback: open && !previousOpen });
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
          event: request.event,
          open: this.openState,
          reason: request.reason,
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
          event: request.event,
          open: this.openState,
          reason: request.reason,
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
    options: { captureFocusFallback?: boolean } = {},
  ): void {
    this.clearHoverCloseTimer();
    if (open) this.pendingControlledCloseRequest = null;

    this.lifecycle.applyOpenState(open, request, options);
  }

  private renderState(open: boolean, closeSignal?: AbortSignal): void {
    const state = open ? "open" : "closed";
    const { backdrop, popup, positioner, triggers } = this.elements;

    this.root.setAttribute(POPOVER_ROOT_ATTRIBUTE, "");
    this.root.setAttribute("data-state", state);
    popup.setAttribute("data-state", state);
    positioner?.setAttribute("data-state", state);
    backdrop?.setAttribute("data-state", state);

    if (open) {
      showElement(popup);
      if (backdrop) showElement(backdrop);
    } else if (backdrop) {
      hideElementAfterAnimations(backdrop, { signal: closeSignal });
    }

    triggers.forEach((trigger) => {
      const triggerOpen = open && trigger === this.activeTrigger;
      trigger.setAttribute("data-state", triggerOpen ? "open" : "closed");
      trigger.setAttribute("aria-expanded", String(triggerOpen));
    });

    this.syncPopupTriggerLabel();
  }

  private containsTarget(target: Node): boolean {
    const portalElement = this.getPortalElement();

    return (
      this.root.contains(target) ||
      portalElement.contains(target) ||
      Boolean(this.elements.portal?.contains(target)) ||
      this.isTargetInPopoverTree(target)
    );
  }

  private clearFloatingStyles(): void {
    const elements = [this.elements.positioner, this.elements.popup].filter(
      (element): element is HTMLElement => element instanceof HTMLElement,
    );

    elements.forEach((element) => {
      element.style.removeProperty("left");
      element.style.removeProperty("position");
      element.style.removeProperty("top");
      element.style.removeProperty("transform-origin");
    });
  }

  private resolvePortalTarget(): HTMLElement {
    return resolveFloatingPortalTarget(this.getConnectedActiveTrigger());
  }

  private getPortalElement(): HTMLElement {
    return this.elements.positioner ?? this.elements.popup;
  }

  private createPopoverPositioner(
    reference: HTMLElement,
    options: FloatingDisclosurePositionOptions = {},
  ): FloatingPositioner {
    const placementElement = this.elements.positioner ?? this.elements.popup;
    const floating = this.elements.positioner ?? this.elements.popup;
    const placementStateElements = floating === this.elements.popup ? [] : [this.elements.popup];

    return createFloatingPositioner({
      floating,
      getOptions: () => ({
        align: readAlignAttribute(placementElement.getAttribute(POPOVER_ALIGN_ATTRIBUTE)),
        avoidCollisions:
          options.avoidCollisions ??
          readBooleanAttribute(placementElement, POPOVER_AVOID_COLLISIONS_ATTRIBUTE, true),
        side: readSideAttribute(placementElement.getAttribute(POPOVER_SIDE_ATTRIBUTE)),
        sideOffset: readNumberAttribute(placementElement, POPOVER_SIDE_OFFSET_ATTRIBUTE, 4),
      }),
      placementStateElements,
      reference,
    });
  }

  private resolveActiveTrigger(request: OpenRequest | undefined): HTMLElement | null {
    if (this.isInternalTrigger(request?.trigger)) {
      return request.trigger;
    }

    return this.getConnectedActiveTrigger();
  }

  private restoreFocus(): void {
    const focusTarget = this.activeTrigger?.isConnected
      ? this.activeTrigger
      : this.previousActiveElement?.isConnected
        ? this.previousActiveElement
        : null;

    focusTarget?.focus();
    this.previousActiveElement = null;
  }

  private syncPopupTriggerLabel(): void {
    if (this.elements.title) return;

    const trigger = this.getConnectedActiveTrigger();
    if (!trigger) return;

    this.elements.popup.setAttribute("aria-labelledby", ensureId(trigger, "sw-popover-trigger"));
  }

  private getConnectedActiveTrigger(): HTMLElement | null {
    if (this.activeTrigger?.isConnected) return this.activeTrigger;

    return this.elements.triggers.find((trigger) => trigger.isConnected) ?? null;
  }

  private getTriggerPressOpenState(trigger: HTMLElement): boolean {
    if (this.openState && trigger !== this.activeTrigger) return true;

    return !this.openState;
  }

  private shouldSwitchActiveTrigger(open: boolean, request: OpenRequest): boolean {
    return (
      open && this.isInternalTrigger(request.trigger) && request.trigger !== this.activeTrigger
    );
  }

  private isInternalTrigger(trigger: Element | undefined): trigger is HTMLElement {
    return trigger instanceof HTMLElement && this.elements.triggers.includes(trigger);
  }

  private closeAfterHoverDelay(): void {
    this.clearHoverCloseTimer();

    const delay = readNumberAttribute(this.root, POPOVER_CLOSE_DELAY_ATTRIBUTE, 200);
    this.hoverCloseTimer = window.setTimeout(() => {
      this.hoverCloseTimer = null;
      if (!this.destroyed && this.openState && this.openChildCount === 0) {
        this.requestOpen(false, { reason: "trigger-hover" });
      }
    }, delay);
  }

  private clearHoverCloseTimer(): void {
    if (this.hoverCloseTimer === null) return;

    window.clearTimeout(this.hoverCloseTimer);
    this.hoverCloseTimer = null;
  }

  private notifyOpenChange(details: PopoverOpenChangeDetails): void {
    this.openChangeSubscribers.forEach((subscriber) => subscriber(details));
  }

  private notifyCloseComplete(details: PopoverCloseCompleteDetails): void {
    this.onCloseComplete?.(details);
    dispatchCustomEvent(this.root, "starwind:close-complete", details);
    this.closeCompleteSubscribers.forEach((subscriber) => subscriber(details));
  }

  private resolveSetOpenRequest(open: boolean, options: PopoverSetOpenOptions): OpenRequest {
    if (options.reason || options.event || options.trigger) {
      return {
        event: options.event,
        reason: options.reason ?? "imperative-action",
        trigger: options.trigger,
      };
    }

    if (!open && this.pendingControlledCloseRequest) {
      return this.pendingControlledCloseRequest;
    }

    if (open && this.pendingControlledOpenRequest) {
      return this.pendingControlledOpenRequest;
    }

    return { reason: "imperative-action" };
  }

  private resolveParentController(): PopoverController | null {
    const parentPopup = this.root.parentElement?.closest<HTMLElement>(
      `[${POPOVER_POPUP_ATTRIBUTE}]`,
    );
    if (!parentPopup || parentPopup === this.elements.popup) return null;

    return popupOwners.get(parentPopup) ?? null;
  }

  private closeNestedPopovers(): void {
    const nestedRoots = Array.from(
      this.elements.popup.querySelectorAll<HTMLElement>(
        `[${POPOVER_ROOT_ATTRIBUTE}][data-state="open"]`,
      ),
    );

    nestedRoots.forEach((nestedRoot) => {
      if (nestedRoot === this.root) return;

      instances.get(nestedRoot)?.setOpen(false);
    });
  }

  private clearHoverCloseTimersInTree(): void {
    this.clearHoverCloseTimer();

    let currentController = this.parentController;
    while (currentController) {
      currentController.clearHoverCloseTimer();
      currentController = currentController.parentController;
    }
  }

  private registerAsOpenChildOnParent(): void {
    if (!this.parentController || this.registeredWithParentAsOpenChild) return;

    this.parentController.openChildCount += 1;
    this.registeredWithParentAsOpenChild = true;
  }

  private unregisterAsOpenChildOnParent(): void {
    if (!this.parentController || !this.registeredWithParentAsOpenChild) return;

    this.parentController.openChildCount = Math.max(0, this.parentController.openChildCount - 1);
    this.registeredWithParentAsOpenChild = false;
    this.parentController.handleChildPopoverClosed();
  }

  private handleChildPopoverClosed(): void {
    if (!this.openOnHover || !this.openState) return;
    if (this.openChildCount > 0) return;

    this.closeAfterHoverDelay();
  }

  private isTargetInPopoverTree(target: Node): boolean {
    const element = target instanceof HTMLElement ? target : target.parentElement;
    if (!element) return false;

    const popup = element.closest<HTMLElement>(`[${POPOVER_POPUP_ATTRIBUTE}]`);
    if (!popup) return false;

    let currentController = popupOwners.get(popup) ?? null;
    while (currentController) {
      if (currentController === this) return true;

      currentController = currentController.parentController;
    }

    return false;
  }
}

function getPopoverElements(root: HTMLElement): PopoverElements {
  const popup = queryOwnElement(root, `[${POPOVER_POPUP_ATTRIBUTE}]`);
  if (!popup) {
    throw new Error("Popover requires a [data-sw-popover-popup] element.");
  }

  return {
    backdrop: queryOwnElement(root, `[${POPOVER_BACKDROP_ATTRIBUTE}]`),
    closeButtons: queryOwnElements(root, `[${POPOVER_CLOSE_ATTRIBUTE}]`),
    description: queryOwnElement(root, `[${POPOVER_DESCRIPTION_ATTRIBUTE}]`),
    popup,
    portal: queryOwnElement(root, `[${POPOVER_PORTAL_ATTRIBUTE}]`),
    positioner: queryOwnElement(root, `[${POPOVER_POSITIONER_ATTRIBUTE}]`),
    title: queryOwnElement(root, `[${POPOVER_TITLE_ATTRIBUTE}]`),
    triggers: uniqueElements(
      queryOwnElements(root, `[${POPOVER_TRIGGER_ATTRIBUTE}]`).map(resolveAsChildControl),
    ),
  };
}

function queryOwnElement(root: HTMLElement, selector: string): HTMLElement | null {
  return queryOwnElements(root, selector)[0] ?? null;
}

function queryOwnElements(root: HTMLElement, selector: string): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter((element) => {
    const owner = element.closest<HTMLElement>(`[${POPOVER_ROOT_ATTRIBUTE}]`);
    return owner === root;
  });
}

function createOpenChangeDetails(
  details: Omit<PopoverOpenChangeDetails, "cancel" | "isCanceled">,
): PopoverOpenChangeDetails {
  return createCancelableDetails(details);
}

function createCloseCompleteDetails(request: OpenRequest | undefined): PopoverCloseCompleteDetails {
  return {
    event: request?.event,
    open: false,
    reason: request?.reason ?? "imperative-action",
    trigger: request?.trigger,
  };
}

function isDisabledTrigger(trigger: HTMLElement): boolean {
  return (
    trigger.hasAttribute("disabled") ||
    trigger.getAttribute("aria-disabled") === "true" ||
    trigger.hasAttribute("data-disabled")
  );
}

function readAlignAttribute(value: string | null): FloatingAlign {
  if (value === "end" || value === "start") return value;
  return "center";
}

function readSideAttribute(value: string | null): FloatingSide {
  if (value === "left" || value === "right" || value === "top") return value;
  return "bottom";
}

function readNumberAttribute(element: HTMLElement, name: string, fallback: number): number {
  const value = Number.parseFloat(element.getAttribute(name) ?? "");
  return Number.isFinite(value) ? value : fallback;
}
