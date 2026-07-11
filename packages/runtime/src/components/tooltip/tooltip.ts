import {
  assertHTMLElement,
  ensureId,
  getAsChildControlElement,
  readBooleanAttribute,
  readNumberAttribute,
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
import { showElement } from "../../internal/presence";

export type TooltipOpenChangeReason =
  | "escape-key"
  | "imperative-action"
  | "outside-press"
  | "trigger-focus"
  | "trigger-hover";

export type TooltipOpenChangeDetails = {
  event?: Event;
  open: boolean;
  previousOpen: boolean;
  reason: TooltipOpenChangeReason;
  trigger?: Element;
  cancel(): void;
  readonly isCanceled: boolean;
};

export type TooltipOptions = {
  closeDelay?: number;
  closeOnEscape?: boolean;
  closeOnOutsideInteract?: boolean;
  defaultOpen?: boolean;
  disabled?: boolean;
  disableHoverableContent?: boolean;
  onOpenChange?: (open: boolean, details: TooltipOpenChangeDetails) => void;
  open?: boolean;
  openDelay?: number;
};

export type TooltipSetOpenOptions = {
  emit?: boolean;
};

export type TooltipInstance = {
  readonly root: HTMLElement;
  close(): void;
  destroy(): void;
  getOpen(): boolean;
  open(): void;
  setDisabled(disabled: boolean): void;
  setOpen(open: boolean, options?: TooltipSetOpenOptions): void;
  subscribe(event: "openChange", callback: (details: TooltipOpenChangeDetails) => void): () => void;
};

type TooltipElements = {
  arrows: HTMLElement[];
  popup: HTMLElement;
  portal: HTMLElement | null;
  positioner: HTMLElement | null;
  triggers: TooltipTriggerElement[];
};

type TooltipTriggerElement = {
  element: HTMLElement;
  eventTarget: HTMLElement;
  target: HTMLElement;
};

type OpenRequest = {
  event?: Event;
  reason: TooltipOpenChangeReason;
  trigger?: TooltipTriggerElement;
};

type FocusOrigin = "keyboard" | "pointer" | null;

const TOOLTIP_ROOT_ATTRIBUTE = "data-sw-tooltip";
const TOOLTIP_TRIGGER_ATTRIBUTE = "data-sw-tooltip-trigger";
const TOOLTIP_PORTAL_ATTRIBUTE = "data-sw-tooltip-portal";
const TOOLTIP_POSITIONER_ATTRIBUTE = "data-sw-tooltip-positioner";
const TOOLTIP_POPUP_ATTRIBUTE = "data-sw-tooltip-popup";
const TOOLTIP_ARROW_ATTRIBUTE = "data-sw-tooltip-arrow";
const TOOLTIP_DEFAULT_OPEN_ATTRIBUTE = "data-default-open";
const TOOLTIP_OPEN_DELAY_ATTRIBUTE = "data-open-delay";
const TOOLTIP_CLOSE_DELAY_ATTRIBUTE = "data-close-delay";
const TOOLTIP_CONTENT_HOVERABLE_ATTRIBUTE = "data-content-hoverable";
const TOOLTIP_CLOSE_ON_ESCAPE_ATTRIBUTE = "data-close-on-escape";
const TOOLTIP_CLOSE_ON_OUTSIDE_INTERACT_ATTRIBUTE = "data-close-on-outside-interact";
const TOOLTIP_DISABLED_ATTRIBUTE = "data-disabled";
const TOOLTIP_SIDE_ATTRIBUTE = "data-side";
const TOOLTIP_ALIGN_ATTRIBUTE = "data-align";
const TOOLTIP_SIDE_OFFSET_ATTRIBUTE = "data-side-offset";
const TOOLTIP_AVOID_COLLISIONS_ATTRIBUTE = "data-avoid-collisions";
const MAX_TRIGGER_TARGET_DEPTH = 5;
const INTERACTIVE_TOOLTIP_DESCENDANT_SELECTOR = [
  "a[href]",
  "button",
  "input",
  "select",
  "textarea",
  "summary",
  "iframe",
  "audio[controls]",
  "video[controls]",
  "[contenteditable]:not([contenteditable='false'])",
  "[tabindex]:not([tabindex='-1'])",
  "[role='button']",
  "[role='checkbox']",
  "[role='link']",
  "[role='menuitem']",
  "[role='option']",
  "[role='radio']",
  "[role='switch']",
  "[role='tab']",
].join(",");

const instances = new WeakMap<HTMLElement, TooltipController>();

export function createTooltip(root: HTMLElement, options: TooltipOptions = {}): TooltipInstance {
  assertHTMLElement(root, "createTooltip root");

  const existing = instances.get(root);
  if (existing) return existing;

  const instance = new TooltipController(root, options);
  instances.set(root, instance);
  return instance;
}

class TooltipController implements TooltipInstance {
  readonly root: HTMLElement;

  private readonly abortController = new AbortController();
  private readonly closeDelay: number;
  private readonly closeOnEscape: boolean;
  private readonly closeOnOutsideInteract: boolean;
  private readonly contentHoverable: boolean;
  private readonly controlled: boolean;
  private readonly elements: TooltipElements;
  private readonly lifecycle: FloatingDisclosureLifecycle<OpenRequest>;
  private readonly onOpenChange?: (open: boolean, details: TooltipOpenChangeDetails) => void;
  private readonly openDelay: number;
  private readonly subscribers = new Set<(details: TooltipOpenChangeDetails) => void>();
  private activeTrigger: TooltipTriggerElement | null = null;
  private closeTimer: number | null = null;
  private disabled: boolean;
  private destroyed = false;
  private focusOrigin: FocusOrigin = null;
  private openState: boolean;
  private openTimer: number | null = null;

  constructor(root: HTMLElement, options: TooltipOptions) {
    this.root = root;
    this.elements = getTooltipElements(root);
    this.controlled = Object.hasOwn(options, "open");
    this.closeDelay =
      options.closeDelay ?? readNumberAttribute(root, TOOLTIP_CLOSE_DELAY_ATTRIBUTE, 200);
    this.closeOnEscape =
      options.closeOnEscape ?? readBooleanAttribute(root, TOOLTIP_CLOSE_ON_ESCAPE_ATTRIBUTE, true);
    this.closeOnOutsideInteract =
      options.closeOnOutsideInteract ??
      readBooleanAttribute(root, TOOLTIP_CLOSE_ON_OUTSIDE_INTERACT_ATTRIBUTE, true);
    this.contentHoverable =
      options.disableHoverableContent !== undefined
        ? !options.disableHoverableContent
        : readBooleanAttribute(root, TOOLTIP_CONTENT_HOVERABLE_ATTRIBUTE, true);
    this.disabled = options.disabled ?? readBooleanAttribute(root, TOOLTIP_DISABLED_ATTRIBUTE);
    this.onOpenChange = options.onOpenChange;
    this.openDelay =
      options.openDelay ?? readNumberAttribute(root, TOOLTIP_OPEN_DELAY_ATTRIBUTE, 200);
    this.openState =
      !this.disabled &&
      (options.open ??
        options.defaultOpen ??
        readBooleanAttribute(root, TOOLTIP_DEFAULT_OPEN_ATTRIBUTE, false));

    this.activeTrigger = this.elements.triggers[0] ?? null;
    this.lifecycle = createFloatingDisclosureLifecycle<OpenRequest>({
      clearFloatingStyles: () => this.clearFloatingStyles(),
      closeOnEscape: () => this.closeOnEscape,
      closeOnOutsideInteract: () => this.closeOnOutsideInteract,
      containsTarget: (target) => this.containsTarget(target),
      createFloatingPositioner: (reference, positionOptions) =>
        this.createTooltipPositioner(reference, positionOptions),
      getFloatingReference: () => this.getFloatingReference(),
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
      renderState: (open) => this.renderState(open),
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

  setOpen(open: boolean, options: TooltipSetOpenOptions = {}): void {
    const nextOpen = open && !this.disabled;
    const previousOpen = this.openState;
    this.openState = nextOpen;
    if (nextOpen && !this.activeTrigger) {
      this.activeTrigger = this.elements.triggers[0] ?? null;
    }
    this.applyOpenState(nextOpen);

    if (options.emit !== false && previousOpen !== nextOpen) {
      this.notify(
        createOpenChangeDetails({
          open: nextOpen,
          previousOpen,
          reason: "imperative-action",
          trigger: this.activeTrigger?.target,
        }),
      );
    }
  }

  setDisabled(disabled: boolean): void {
    if (this.disabled === disabled) return;

    this.disabled = disabled;
    if (disabled && this.openState) {
      this.openState = false;
      this.applyOpenState(false);
      return;
    }

    this.renderState(this.openState);
  }

  getOpen(): boolean {
    return this.openState;
  }

  subscribe(
    event: "openChange",
    callback: (details: TooltipOpenChangeDetails) => void,
  ): () => void {
    if (event !== "openChange") {
      throw new Error(`Unsupported Tooltip event: ${event}`);
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
    instances.delete(this.root);
    this.destroyed = true;
  }

  private setupAccessibility(): void {
    const popupId = ensureId(this.elements.popup, "sw-tooltip-popup");
    this.elements.popup.setAttribute("role", this.elements.popup.getAttribute("role") ?? "tooltip");
    this.applyNonInteractiveContentGuardrails();

    this.elements.triggers.forEach((trigger) => {
      trigger.target.setAttribute("aria-describedby", popupId);
    });
  }

  private applyNonInteractiveContentGuardrails(): void {
    this.elements.popup.removeAttribute("tabindex");

    const interactiveDescendants = getInteractiveTooltipDescendants(this.elements.popup);
    if (interactiveDescendants.length === 0) return;

    warnInteractiveTooltipContent(this.elements.popup, interactiveDescendants);
  }

  private bindEvents(): void {
    const { signal } = this.abortController;
    const ownerDocument = this.root.ownerDocument;

    ownerDocument.addEventListener(
      "keydown",
      (event) => {
        if (isKeyboardFocusOriginEvent(event)) {
          this.focusOrigin = "keyboard";
        }
      },
      { capture: true, signal },
    );

    ownerDocument.addEventListener(
      "pointerdown",
      () => {
        this.focusOrigin = "pointer";
      },
      { capture: true, signal },
    );

    this.elements.triggers.forEach((trigger) => {
      trigger.eventTarget.addEventListener(
        "pointerenter",
        (event) => {
          if (!isMousePointer(event) || this.isTriggerDisabled(trigger)) return;
          this.activeTrigger = trigger;
          this.openAfterDelay(trigger, { event, reason: "trigger-hover", trigger });
        },
        { signal },
      );

      trigger.eventTarget.addEventListener(
        "pointerleave",
        (event) => {
          if (!isMousePointer(event)) return;
          if (this.isPointerLeavingIntoTooltipContent(event)) {
            this.clearCloseTimer();
            return;
          }

          this.closeAfterDelay(trigger, { event, reason: "trigger-hover", trigger });
        },
        { signal },
      );

      trigger.eventTarget.addEventListener(
        "focusin",
        (event) => {
          if (this.isTriggerDisabled(trigger) || !this.shouldOpenFromFocus()) return;
          this.activeTrigger = trigger;
          this.clearCloseTimer();
          this.clearOpenTimer();
          this.requestOpen(true, { event, reason: "trigger-focus", trigger });
        },
        { signal },
      );

      trigger.eventTarget.addEventListener(
        "focusout",
        (event) => {
          if (
            event.relatedTarget instanceof Node &&
            trigger.eventTarget.contains(event.relatedTarget)
          ) {
            return;
          }

          this.clearOpenTimer();
          this.requestOpen(false, { event, reason: "trigger-focus", trigger });
        },
        { signal },
      );
    });

    if (this.contentHoverable) {
      this.getTooltipContentHoverElements().forEach((element) => {
        element.addEventListener(
          "pointerenter",
          (event) => {
            if (!isMousePointer(event)) return;
            this.clearCloseTimer();
          },
          { signal },
        );

        element.addEventListener(
          "pointerleave",
          (event) => {
            if (!isMousePointer(event)) return;
            if (
              this.isPointerLeavingIntoActiveTrigger(event) ||
              this.isPointerLeavingIntoTooltipContent(event)
            ) {
              this.clearCloseTimer();
              return;
            }

            this.closeAfterDelay(this.activeTrigger, {
              event,
              reason: "trigger-hover",
              trigger: this.activeTrigger ?? undefined,
            });
          },
          { signal },
        );
      });
    }
  }

  private requestOpen(open: boolean, request: OpenRequest): void {
    if (open && request.trigger) {
      this.activeTrigger = request.trigger;
    }

    if (this.disabled && open) return;
    if (open === this.openState && !this.controlled) return;

    const previousOpen = this.openState;
    runOverlayOpenChangeShell({
      root: this.root,
      controlled: this.controlled,
      createDetails: createOpenChangeDetails,
      getTrigger: (request) => request.trigger?.target ?? this.activeTrigger?.target,
      open,
      previousOpen,
      request,
      onApplyUncontrolledOpenState: () => {
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

  private renderState(open: boolean): void {
    const state = open ? "open" : "closed";
    const stateElements = [
      this.root,
      this.elements.popup,
      this.elements.positioner,
      ...this.elements.arrows,
    ].filter((element): element is HTMLElement => element instanceof HTMLElement);

    this.root.setAttribute(TOOLTIP_ROOT_ATTRIBUTE, "");
    stateElements.forEach((element) => {
      element.setAttribute("data-state", state);
      setBooleanAttribute(element, "data-open", open);
      setBooleanAttribute(element, "data-closed", !open);
    });

    setBooleanAttribute(this.root, TOOLTIP_DISABLED_ATTRIBUTE, this.disabled);

    if (open) {
      showElement(this.elements.popup);
    }

    this.elements.triggers.forEach((trigger) => {
      const disabled = this.isTriggerDisabled(trigger);
      for (const element of uniqueElements([trigger.element, trigger.target])) {
        element.setAttribute("data-state", state);
        setBooleanAttribute(element, "data-popup-open", open);
        setBooleanAttribute(element, "data-trigger-disabled", disabled);
        setBooleanAttribute(element, TOOLTIP_DISABLED_ATTRIBUTE, disabled);
      }
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

  private isPointerLeavingIntoTooltipContent(event: PointerEvent): boolean {
    if (!this.contentHoverable || !this.openState) return false;

    return isPointerEventWithinElements(event, this.getTooltipContentHoverElements());
  }

  private isPointerLeavingIntoActiveTrigger(event: PointerEvent): boolean {
    if (!this.contentHoverable || !this.openState || !this.activeTrigger) return false;

    return isPointerEventWithinElements(event, [
      this.activeTrigger.element,
      this.activeTrigger.eventTarget,
      this.activeTrigger.target,
    ]);
  }

  private getTooltipContentHoverElements(): HTMLElement[] {
    return uniqueElements(
      [
        this.elements.portal,
        this.elements.positioner,
        this.elements.popup,
        ...this.elements.arrows,
      ].filter((element): element is HTMLElement => element instanceof HTMLElement),
    );
  }

  private resolvePortalTarget(): HTMLElement {
    return resolveFloatingPortalTarget(this.getFloatingReference());
  }

  private getPortalElement(): HTMLElement {
    return this.elements.positioner ?? this.elements.popup;
  }

  private getFloatingReference(): HTMLElement | null {
    return this.activeTrigger?.target ?? this.elements.triggers[0]?.target ?? null;
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

  private createTooltipPositioner(
    reference: HTMLElement,
    options: FloatingDisclosurePositionOptions = {},
  ): FloatingPositioner {
    const placementElement = this.elements.positioner ?? this.elements.popup;
    const floating = this.elements.positioner ?? this.elements.popup;
    const placementStateElements =
      floating === this.elements.popup
        ? this.elements.arrows
        : [this.elements.popup, ...this.elements.arrows];

    return createFloatingPositioner({
      floating,
      getOptions: () => ({
        align: readFloatingAlignAttribute(
          placementElement.getAttribute(TOOLTIP_ALIGN_ATTRIBUTE),
          "center",
        ),
        avoidCollisions:
          options.avoidCollisions ??
          readBooleanAttribute(placementElement, TOOLTIP_AVOID_COLLISIONS_ATTRIBUTE, true),
        preserveAnchor: true,
        side: readFloatingSideAttribute(
          placementElement.getAttribute(TOOLTIP_SIDE_ATTRIBUTE),
          "top",
        ),
        sideOffset: readNumberAttribute(placementElement, TOOLTIP_SIDE_OFFSET_ATTRIBUTE, 8),
      }),
      placementStateElements,
      reference,
    });
  }

  private openAfterDelay(
    trigger: TooltipTriggerElement,
    request: OpenRequest & { trigger: TooltipTriggerElement },
  ): void {
    this.clearCloseTimer();
    this.clearOpenTimer();

    const delay = readNumberAttribute(
      trigger.element,
      TOOLTIP_OPEN_DELAY_ATTRIBUTE,
      this.openDelay,
    );
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

  private closeAfterDelay(trigger: TooltipTriggerElement | null, request: OpenRequest): void {
    this.clearOpenTimer();
    this.clearCloseTimer();

    const delay = trigger
      ? readNumberAttribute(trigger.element, TOOLTIP_CLOSE_DELAY_ATTRIBUTE, this.closeDelay)
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

  private isTriggerDisabled(trigger: TooltipTriggerElement): boolean {
    return (
      this.disabled ||
      trigger.element.hasAttribute("disabled") ||
      trigger.element.hasAttribute(TOOLTIP_DISABLED_ATTRIBUTE) ||
      trigger.element.getAttribute("aria-disabled") === "true" ||
      trigger.target.hasAttribute("disabled") ||
      trigger.target.hasAttribute(TOOLTIP_DISABLED_ATTRIBUTE) ||
      trigger.target.getAttribute("aria-disabled") === "true"
    );
  }

  private shouldOpenFromFocus(): boolean {
    return this.focusOrigin !== "pointer";
  }

  private notify(details: TooltipOpenChangeDetails): void {
    this.subscribers.forEach((subscriber) => subscriber(details));
  }
}

function getTooltipElements(root: HTMLElement): TooltipElements {
  const popup = queryOwnElement(root, `[${TOOLTIP_POPUP_ATTRIBUTE}]`);
  if (!popup) {
    throw new Error("Tooltip requires a [data-sw-tooltip-popup] element.");
  }

  return {
    arrows: queryOwnElements(root, `[${TOOLTIP_ARROW_ATTRIBUTE}]`),
    popup,
    portal: queryOwnElement(root, `[${TOOLTIP_PORTAL_ATTRIBUTE}]`),
    positioner: queryOwnElement(root, `[${TOOLTIP_POSITIONER_ATTRIBUTE}]`),
    triggers: queryOwnElements(root, `[${TOOLTIP_TRIGGER_ATTRIBUTE}]`).map((element) => {
      const target = getTriggerTarget(element);

      return {
        element,
        eventTarget: target,
        target,
      };
    }),
  };
}

function queryOwnElement(root: HTMLElement, selector: string): HTMLElement | null {
  return queryOwnElements(root, selector)[0] ?? null;
}

function queryOwnElements(root: HTMLElement, selector: string): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter((element) => {
    const owner = element.closest<HTMLElement>(`[${TOOLTIP_ROOT_ATTRIBUTE}]`);
    return owner === root;
  });
}

function getTriggerTarget(trigger: HTMLElement): HTMLElement {
  let target = trigger;

  for (let depth = 0; depth < MAX_TRIGGER_TARGET_DEPTH; depth += 1) {
    if (!shouldResolveTriggerTarget(target)) return target;

    const child = getAsChildControlElement(target);
    if (!child) return target;

    target = child;
  }

  return target;
}

function shouldResolveTriggerTarget(element: HTMLElement): boolean {
  return element.hasAttribute("data-as-child") || getComputedStyle(element).display === "contents";
}

function createOpenChangeDetails(
  details: Omit<TooltipOpenChangeDetails, "cancel" | "isCanceled">,
): TooltipOpenChangeDetails {
  return createCancelableDetails(details);
}

function isMousePointer(event: PointerEvent): boolean {
  return event.pointerType === "" || event.pointerType === "mouse";
}

function isKeyboardFocusOriginEvent(event: KeyboardEvent): boolean {
  return !["Alt", "Control", "Meta", "Shift"].includes(event.key);
}

function isPointerEventWithinElements(event: PointerEvent, elements: HTMLElement[]): boolean {
  if (event.relatedTarget instanceof Node) {
    return elements.some((element) => element.contains(event.relatedTarget as Node));
  }

  if (!hasPointerCoordinates(event)) return false;

  return elements.some((element) => isPointerWithinElement(event, element));
}

function hasPointerCoordinates(event: PointerEvent): boolean {
  return event.clientX !== 0 || event.clientY !== 0;
}

function isPointerWithinElement(event: PointerEvent, element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return false;

  return (
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom
  );
}

function getInteractiveTooltipDescendants(popup: HTMLElement): HTMLElement[] {
  return Array.from(popup.querySelectorAll<HTMLElement>(INTERACTIVE_TOOLTIP_DESCENDANT_SELECTOR));
}

function warnInteractiveTooltipContent(popup: HTMLElement, descendants: HTMLElement[]): void {
  if (typeof console === "undefined" || typeof console.warn !== "function") return;

  const popupLabel = popup.id ? `#${popup.id}` : `[${TOOLTIP_POPUP_ATTRIBUTE}]`;
  const descendantLabels = descendants.slice(0, 3).map(getElementDebugName).join(", ");

  console.warn(
    `Starwind Tooltip content must stay non-interactive. Move interactive content in ${popupLabel} to Popover or Dialog. Found ${descendantLabels}.`,
  );
}

function getElementDebugName(element: HTMLElement): string {
  const tagName = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : "";
  const dataSlot = element.getAttribute("data-slot");
  const slot = dataSlot ? `[data-slot="${dataSlot}"]` : "";

  return `${tagName}${id}${slot}`;
}
