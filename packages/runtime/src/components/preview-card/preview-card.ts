import {
  assertHTMLElement,
  ensureId,
  readBooleanAttribute,
  readNumberAttribute,
  resolveAsChildControl,
  setBooleanAttribute,
  uniqueElements,
} from "../../internal/dom";
import { createCancelableDetails } from "../../internal/cancelable-details";
import { dispatchCustomEvent } from "../../internal/events";
import {
  createFloatingPositioner,
  type FloatingPositioner,
  readFloatingAlignAttribute,
  readFloatingSideAttribute,
  resolveFloatingPortalTarget,
} from "../../internal/floating";
import {
  createFloatingDisclosureLifecycle,
  type FloatingDisclosureLifecycle,
  type FloatingDisclosurePositionOptions,
} from "../../internal/floating-disclosure";
import { runOverlayOpenChangeShell } from "../../internal/overlay-open-change";
import { hideElementAfterAnimations, showElement } from "../../internal/presence";

export type PreviewCardOpenChangeReason =
  | "escape-key"
  | "imperative-action"
  | "outside-press"
  | "trigger-focus"
  | "trigger-hover";

export type PreviewCardOpenChangeDetails = {
  event?: Event;
  open: boolean;
  previousOpen: boolean;
  reason: PreviewCardOpenChangeReason;
  trigger?: Element;
  cancel(): void;
  readonly isCanceled: boolean;
};

export type PreviewCardOptions = {
  closeDelay?: number;
  closeOnEscape?: boolean;
  closeOnOutsideInteract?: boolean;
  defaultOpen?: boolean;
  disableHoverableContent?: boolean;
  onOpenChange?: (open: boolean, details: PreviewCardOpenChangeDetails) => void;
  open?: boolean;
  openDelay?: number;
};

export type PreviewCardSetOpenOptions = {
  emit?: boolean;
};

export type PreviewCardInstance = {
  readonly root: HTMLElement;
  close(): void;
  destroy(): void;
  getOpen(): boolean;
  open(): void;
  setOpen(open: boolean, options?: PreviewCardSetOpenOptions): void;
  subscribe(
    event: "openChange",
    callback: (details: PreviewCardOpenChangeDetails) => void,
  ): () => void;
};

type PreviewCardElements = {
  arrows: HTMLElement[];
  backdrop: HTMLElement | null;
  popup: HTMLElement;
  portal: HTMLElement | null;
  positioner: HTMLElement | null;
  triggers: HTMLElement[];
  viewport: HTMLElement | null;
};

type OpenRequest = {
  event?: Event;
  reason: PreviewCardOpenChangeReason;
  trigger?: HTMLElement;
};

const PREVIEW_CARD_ROOT_ATTRIBUTE = "data-sw-preview-card";
const PREVIEW_CARD_TRIGGER_ATTRIBUTE = "data-sw-preview-card-trigger";
const PREVIEW_CARD_PORTAL_ATTRIBUTE = "data-sw-preview-card-portal";
const PREVIEW_CARD_POSITIONER_ATTRIBUTE = "data-sw-preview-card-positioner";
const PREVIEW_CARD_POPUP_ATTRIBUTE = "data-sw-preview-card-popup";
const PREVIEW_CARD_ARROW_ATTRIBUTE = "data-sw-preview-card-arrow";
const PREVIEW_CARD_BACKDROP_ATTRIBUTE = "data-sw-preview-card-backdrop";
const PREVIEW_CARD_VIEWPORT_ATTRIBUTE = "data-sw-preview-card-viewport";
const PREVIEW_CARD_DEFAULT_OPEN_ATTRIBUTE = "data-default-open";
const PREVIEW_CARD_OPEN_DELAY_ATTRIBUTE = "data-open-delay";
const PREVIEW_CARD_CLOSE_DELAY_ATTRIBUTE = "data-close-delay";
const PREVIEW_CARD_CONTENT_HOVERABLE_ATTRIBUTE = "data-content-hoverable";
const PREVIEW_CARD_CLOSE_ON_ESCAPE_ATTRIBUTE = "data-close-on-escape";
const PREVIEW_CARD_CLOSE_ON_OUTSIDE_INTERACT_ATTRIBUTE = "data-close-on-outside-interact";
const PREVIEW_CARD_SIDE_ATTRIBUTE = "data-side";
const PREVIEW_CARD_ALIGN_ATTRIBUTE = "data-align";
const PREVIEW_CARD_SIDE_OFFSET_ATTRIBUTE = "data-side-offset";
const PREVIEW_CARD_AVOID_COLLISIONS_ATTRIBUTE = "data-avoid-collisions";

const instances = new WeakMap<HTMLElement, PreviewCardController>();

export function createPreviewCard(
  root: HTMLElement,
  options: PreviewCardOptions = {},
): PreviewCardInstance {
  assertHTMLElement(root, "createPreviewCard root");

  const existing = instances.get(root);
  if (existing) return existing;

  const instance = new PreviewCardController(root, options);
  instances.set(root, instance);
  return instance;
}

class PreviewCardController implements PreviewCardInstance {
  readonly root: HTMLElement;

  private readonly abortController = new AbortController();
  private readonly closeDelay: number;
  private readonly closeOnEscape: boolean;
  private readonly closeOnOutsideInteract: boolean;
  private readonly contentHoverable: boolean;
  private readonly controlled: boolean;
  private readonly elements: PreviewCardElements;
  private readonly lifecycle: FloatingDisclosureLifecycle<OpenRequest>;
  private readonly onOpenChange?: (open: boolean, details: PreviewCardOpenChangeDetails) => void;
  private readonly openDelay: number;
  private readonly subscribers = new Set<(details: PreviewCardOpenChangeDetails) => void>();
  private activeTrigger: HTMLElement | null = null;
  private closeTimer: number | null = null;
  private destroyed = false;
  private openState: boolean;
  private openTimer: number | null = null;

  constructor(root: HTMLElement, options: PreviewCardOptions) {
    this.root = root;
    this.elements = getPreviewCardElements(root);
    this.controlled = Object.hasOwn(options, "open");
    this.closeDelay =
      options.closeDelay ?? readNumberAttribute(root, PREVIEW_CARD_CLOSE_DELAY_ATTRIBUTE, 300);
    this.closeOnEscape =
      options.closeOnEscape ??
      readBooleanAttribute(root, PREVIEW_CARD_CLOSE_ON_ESCAPE_ATTRIBUTE, true);
    this.closeOnOutsideInteract =
      options.closeOnOutsideInteract ??
      readBooleanAttribute(root, PREVIEW_CARD_CLOSE_ON_OUTSIDE_INTERACT_ATTRIBUTE, true);
    this.contentHoverable =
      options.disableHoverableContent !== undefined
        ? !options.disableHoverableContent
        : readBooleanAttribute(root, PREVIEW_CARD_CONTENT_HOVERABLE_ATTRIBUTE, true);
    this.onOpenChange = options.onOpenChange;
    this.openDelay =
      options.openDelay ?? readNumberAttribute(root, PREVIEW_CARD_OPEN_DELAY_ATTRIBUTE, 600);
    this.openState =
      options.open ??
      options.defaultOpen ??
      readBooleanAttribute(root, PREVIEW_CARD_DEFAULT_OPEN_ATTRIBUTE, false);

    this.activeTrigger = this.elements.triggers[0] ?? null;
    this.lifecycle = createFloatingDisclosureLifecycle<OpenRequest>({
      backdrop: this.elements.backdrop,
      clearFloatingStyles: () => this.clearFloatingStyles(),
      closeOnEscape: () => this.closeOnEscape,
      closeOnOutsideInteract: () => this.closeOnOutsideInteract,
      containsTarget: (target) => this.containsTarget(target),
      createFloatingPositioner: (reference, positionOptions) =>
        this.createPreviewCardPositioner(reference, positionOptions),
      getFloatingReference: () => this.getConnectedActiveTrigger(),
      getOpen: () => this.openState,
      getPortalElement: () => this.getPortalElement(),
      getPortalTarget: () => this.resolvePortalTarget(),
      isDestroyed: () => this.destroyed,
      onEscapeKeyDown: (event) => {
        event.preventDefault();
        this.requestOpen(false, { event, reason: "escape-key" });
      },
      onImmediateClose: () => {
        this.elements.popup.classList.add("hidden");
      },
      onOutsidePointerDown: (event) => {
        this.requestOpen(false, { event, reason: "outside-press" });
      },
      popup: this.elements.popup,
      renderState: (open, closeSignal) => this.renderState(open, closeSignal),
      root: this.root,
    });
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

  setOpen(open: boolean, options: PreviewCardSetOpenOptions = {}): void {
    const previousOpen = this.openState;
    this.openState = open;
    if (open && !this.activeTrigger) {
      this.activeTrigger = this.elements.triggers[0] ?? null;
    }
    this.applyOpenState(open);

    if (options.emit !== false) {
      this.notify(
        createOpenChangeDetails({
          open,
          previousOpen,
          reason: "imperative-action",
          trigger: this.activeTrigger ?? undefined,
        }),
      );
    }
  }

  getOpen(): boolean {
    return this.openState;
  }

  subscribe(
    event: "openChange",
    callback: (details: PreviewCardOpenChangeDetails) => void,
  ): () => void {
    if (event !== "openChange") {
      throw new Error(`Unsupported PreviewCard event: ${event}`);
    }

    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  destroy(): void {
    if (this.destroyed) return;

    this.abortController.abort();
    this.clearCloseTimer();
    this.clearOpenTimer();
    this.lifecycle.destroy();
    this.subscribers.clear();
    this.openState = false;
    this.renderState(false);
    this.elements.popup.hidden = true;
    this.elements.backdrop?.setAttribute("hidden", "");
    instances.delete(this.root);
    this.destroyed = true;
  }

  private setupAccessibility(): void {
    const popupId = ensureId(this.elements.popup, "sw-preview-card-popup");

    this.elements.popup.setAttribute("role", this.elements.popup.getAttribute("role") ?? "tooltip");

    this.elements.triggers.forEach((trigger) => {
      trigger.setAttribute("aria-describedby", popupId);
    });
  }

  private bindEvents(): void {
    const { signal } = this.abortController;

    this.elements.triggers.forEach((trigger) => {
      trigger.addEventListener(
        "pointerenter",
        (event) => {
          if (!isMousePointer(event) || isDisabledTrigger(trigger)) return;
          this.openAfterDelay(trigger, { event, reason: "trigger-hover", trigger });
        },
        { signal },
      );

      trigger.addEventListener(
        "pointerleave",
        (event) => {
          if (!isMousePointer(event)) return;
          this.closeAfterDelay(trigger, { event, reason: "trigger-hover", trigger });
        },
        { signal },
      );

      trigger.addEventListener(
        "focusin",
        (event) => {
          if (isDisabledTrigger(trigger)) return;
          this.openAfterDelay(trigger, { event, reason: "trigger-focus", trigger });
        },
        { signal },
      );

      trigger.addEventListener(
        "focusout",
        (event) => {
          if (event.relatedTarget instanceof Node && this.containsTarget(event.relatedTarget)) {
            return;
          }

          this.clearOpenTimer();
          this.requestOpen(false, { event, reason: "trigger-focus", trigger });
        },
        { signal },
      );

      trigger.addEventListener(
        "click",
        (event) => {
          if (!isDisabledTrigger(trigger)) return;

          event.preventDefault();
          event.stopPropagation();
        },
        { signal },
      );
    });

    if (this.contentHoverable) {
      this.elements.popup.addEventListener(
        "pointerenter",
        (event) => {
          if (!isMousePointer(event)) return;
          this.clearCloseTimer();
        },
        { signal },
      );

      this.elements.popup.addEventListener(
        "pointerleave",
        (event) => {
          if (!isMousePointer(event)) return;
          this.closeAfterDelay(this.activeTrigger, {
            event,
            reason: "trigger-hover",
            trigger: this.activeTrigger ?? undefined,
          });
        },
        { signal },
      );
    }

    this.elements.popup.addEventListener(
      "focusout",
      (event) => {
        if (event.relatedTarget instanceof Node && this.containsTarget(event.relatedTarget)) {
          return;
        }

        this.clearOpenTimer();
        this.requestOpen(false, {
          event,
          reason: "trigger-focus",
          trigger: this.activeTrigger ?? undefined,
        });
      },
      { signal },
    );
  }

  private requestOpen(open: boolean, request: OpenRequest): void {
    const nextActiveTrigger = open
      ? this.isInternalTrigger(request.trigger)
        ? request.trigger
        : this.getConnectedActiveTrigger()
      : this.activeTrigger;
    const shouldSwitchActiveTrigger = open && nextActiveTrigger !== this.activeTrigger;

    if (open === this.openState && !this.controlled && !shouldSwitchActiveTrigger) return;

    const previousOpen = this.openState;
    runOverlayOpenChangeShell({
      root: this.root,
      controlled: this.controlled,
      createDetails: createOpenChangeDetails,
      getTrigger: (request) => request.trigger ?? this.activeTrigger ?? undefined,
      open,
      previousOpen,
      request,
      onApplyControlledOpenState: () => {
        if (open) {
          this.activeTrigger = nextActiveTrigger;
        }

        if (shouldSwitchActiveTrigger) {
          this.applyOpenState(open);
        }
      },
      onApplyUncontrolledOpenState: () => {
        if (open) {
          this.activeTrigger = nextActiveTrigger;
        }

        this.openState = open;
        this.applyOpenState(open);
      },
      onBeforeOpenChange: () => this.dispatchOpenChangeIntent(open, request),
      onNotifyOpenChangeSubscribers: (details) => this.notify(details),
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

  private applyOpenState(open: boolean): void {
    this.clearCloseTimer();
    this.clearOpenTimer();

    this.lifecycle.applyOpenState(open, undefined);
  }

  private renderState(open: boolean, closeSignal?: AbortSignal): void {
    const state = open ? "open" : "closed";
    const stateElements = [
      this.root,
      this.elements.popup,
      this.elements.positioner,
      this.elements.backdrop,
      this.elements.viewport,
      ...this.elements.arrows,
    ].filter((element): element is HTMLElement => element instanceof HTMLElement);

    this.root.setAttribute(PREVIEW_CARD_ROOT_ATTRIBUTE, "");
    stateElements.forEach((element) => {
      element.setAttribute("data-state", state);
      setBooleanAttribute(element, "data-open", open);
      setBooleanAttribute(element, "data-closed", !open);
    });

    if (open) {
      showElement(this.elements.popup);
      if (this.elements.backdrop) showElement(this.elements.backdrop);
    } else if (this.elements.backdrop) {
      this.elements.backdrop.setAttribute("data-state", state);
      setBooleanAttribute(this.elements.backdrop, "data-open", false);
      setBooleanAttribute(this.elements.backdrop, "data-closed", true);
      hideElementAfterAnimations(this.elements.backdrop, { signal: closeSignal });
    }

    this.elements.triggers.forEach((trigger) => {
      const disabled = isDisabledTrigger(trigger);
      const triggerOpen = open && trigger === this.activeTrigger;
      trigger.setAttribute("data-state", triggerOpen ? "open" : "closed");
      setBooleanAttribute(trigger, "data-popup-open", triggerOpen);
      setBooleanAttribute(trigger, "data-trigger-disabled", disabled);
      setBooleanAttribute(trigger, "data-disabled", disabled);
    });
  }

  private containsTarget(target: Node): boolean {
    const portalElement = this.getPortalElement();

    return (
      this.root.contains(target) ||
      portalElement.contains(target) ||
      Boolean(this.elements.portal?.contains(target))
    );
  }

  private resolvePortalTarget(): HTMLElement {
    return resolveFloatingPortalTarget(this.getConnectedActiveTrigger());
  }

  private getPortalElement(): HTMLElement {
    return this.elements.positioner ?? this.elements.popup;
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

  private createPreviewCardPositioner(
    reference: HTMLElement,
    options: FloatingDisclosurePositionOptions = {},
  ): FloatingPositioner {
    const placementElement = this.elements.positioner ?? this.elements.popup;
    const floating = this.elements.positioner ?? this.elements.popup;
    const placementStateElements =
      floating === this.elements.popup
        ? [...this.elements.arrows, this.elements.viewport].filter(
            (element): element is HTMLElement => element instanceof HTMLElement,
          )
        : [this.elements.popup, this.elements.viewport, ...this.elements.arrows].filter(
            (element): element is HTMLElement => element instanceof HTMLElement,
          );

    return createFloatingPositioner({
      floating,
      getOptions: () => ({
        align: readFloatingAlignAttribute(
          placementElement.getAttribute(PREVIEW_CARD_ALIGN_ATTRIBUTE),
          "center",
        ),
        avoidCollisions:
          options.avoidCollisions ??
          readBooleanAttribute(placementElement, PREVIEW_CARD_AVOID_COLLISIONS_ATTRIBUTE, true),
        side: readFloatingSideAttribute(
          placementElement.getAttribute(PREVIEW_CARD_SIDE_ATTRIBUTE),
          "bottom",
        ),
        sideOffset: readNumberAttribute(placementElement, PREVIEW_CARD_SIDE_OFFSET_ATTRIBUTE, 0),
      }),
      placementStateElements,
      reference,
    });
  }

  private openAfterDelay(trigger: HTMLElement, request: OpenRequest & { trigger: HTMLElement }) {
    this.clearCloseTimer();
    this.clearOpenTimer();

    const delay = readNumberAttribute(trigger, PREVIEW_CARD_OPEN_DELAY_ATTRIBUTE, this.openDelay);
    if (delay <= 0) {
      this.requestOpen(true, request);
      return;
    }

    this.openTimer = window.setTimeout(() => {
      this.openTimer = null;
      if (!this.destroyed) {
        this.requestOpen(true, request);
      }
    }, delay);
  }

  private closeAfterDelay(trigger: HTMLElement | null, request: OpenRequest): void {
    this.clearOpenTimer();
    this.clearCloseTimer();

    const delay = trigger
      ? readNumberAttribute(trigger, PREVIEW_CARD_CLOSE_DELAY_ATTRIBUTE, this.closeDelay)
      : this.closeDelay;
    if (delay <= 0) {
      this.requestOpen(false, request);
      return;
    }

    this.closeTimer = window.setTimeout(() => {
      this.closeTimer = null;
      if (!this.destroyed) {
        this.requestOpen(false, request);
      }
    }, delay);
  }

  private clearOpenTimer(): void {
    if (this.openTimer === null) return;

    window.clearTimeout(this.openTimer);
    this.openTimer = null;
  }

  private clearCloseTimer(): void {
    if (this.closeTimer === null) return;

    window.clearTimeout(this.closeTimer);
    this.closeTimer = null;
  }

  private notify(details: PreviewCardOpenChangeDetails): void {
    this.subscribers.forEach((subscriber) => subscriber(details));
  }

  private isInternalTrigger(trigger: Element | undefined): trigger is HTMLElement {
    return trigger instanceof HTMLElement && this.elements.triggers.includes(trigger);
  }

  private getConnectedActiveTrigger(): HTMLElement | null {
    if (this.activeTrigger?.isConnected) return this.activeTrigger;

    return this.elements.triggers.find((trigger) => trigger.isConnected) ?? null;
  }
}

function getPreviewCardElements(root: HTMLElement): PreviewCardElements {
  const popup = queryOwnElement(root, `[${PREVIEW_CARD_POPUP_ATTRIBUTE}]`);
  if (!popup) {
    throw new Error("PreviewCard requires a [data-sw-preview-card-popup] element.");
  }

  return {
    arrows: queryOwnElements(root, `[${PREVIEW_CARD_ARROW_ATTRIBUTE}]`),
    backdrop: queryOwnElement(root, `[${PREVIEW_CARD_BACKDROP_ATTRIBUTE}]`),
    popup,
    portal: queryOwnElement(root, `[${PREVIEW_CARD_PORTAL_ATTRIBUTE}]`),
    positioner: queryOwnElement(root, `[${PREVIEW_CARD_POSITIONER_ATTRIBUTE}]`),
    triggers: uniqueElements(
      queryOwnElements(root, `[${PREVIEW_CARD_TRIGGER_ATTRIBUTE}]`).map(resolveAsChildControl),
    ),
    viewport: queryOwnElement(root, `[${PREVIEW_CARD_VIEWPORT_ATTRIBUTE}]`),
  };
}

function queryOwnElement(root: HTMLElement, selector: string): HTMLElement | null {
  return queryOwnElements(root, selector)[0] ?? null;
}

function queryOwnElements(root: HTMLElement, selector: string): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter((element) => {
    const owner = element.closest<HTMLElement>(`[${PREVIEW_CARD_ROOT_ATTRIBUTE}]`);
    return owner === root;
  });
}

function createOpenChangeDetails(
  details: Omit<PreviewCardOpenChangeDetails, "cancel" | "isCanceled">,
): PreviewCardOpenChangeDetails {
  return createCancelableDetails(details);
}

function isDisabledTrigger(trigger: HTMLElement): boolean {
  return (
    trigger.hasAttribute("disabled") ||
    trigger.getAttribute("aria-disabled") === "true" ||
    trigger.hasAttribute("data-disabled")
  );
}

function isMousePointer(event: PointerEvent): boolean {
  return event.pointerType === "" || event.pointerType === "mouse";
}
