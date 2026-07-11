import { assertHTMLElement, readBooleanAttribute } from "../../internal/dom";
import {
  createMenu,
  type MenuCloseCompleteDetails,
  type MenuInstance,
  type MenuOpenChangeDetails,
  type MenuOpenChangeReason,
  type MenuOptions,
  type MenuSetOpenOptions,
} from "../menu";

export type ContextMenuCloseCompleteDetails = MenuCloseCompleteDetails;
export type ContextMenuOpenChangeDetails = MenuOpenChangeDetails;
export type ContextMenuOpenChangeReason = MenuOpenChangeReason;

export type ContextMenuOptions = Omit<
  MenuOptions,
  "openOnHover" | "portalReference" | "reference" | "triggerEvents"
>;

export type ContextMenuInstance = {
  readonly root: HTMLElement;
  close(): void;
  destroy(): void;
  getOpen(): boolean;
  open(): void;
  setOpen(open: boolean, options?: MenuSetOpenOptions): void;
  subscribe(
    event: "openChange",
    callback: (details: ContextMenuOpenChangeDetails) => void,
  ): () => void;
  subscribe(
    event: "closeComplete",
    callback: (details: ContextMenuCloseCompleteDetails) => void,
  ): () => void;
};

type ContextMenuElements = {
  triggers: HTMLElement[];
};

const CONTEXT_MENU_ROOT_ATTRIBUTE = "data-sw-context-menu";
const CONTEXT_MENU_TRIGGER_ATTRIBUTE = "data-sw-context-menu-trigger";
const CONTEXT_MENU_MODAL_ATTRIBUTE = "data-modal";
const MENU_ROOT_ATTRIBUTE = "data-sw-menu";
const MENU_TRIGGER_ATTRIBUTE = "data-sw-menu-trigger";
const MENU_POPUP_ATTRIBUTE = "data-sw-menu-popup";
const MENU_PORTAL_ATTRIBUTE = "data-sw-menu-portal";
const MENU_POSITIONER_ATTRIBUTE = "data-sw-menu-positioner";
const LONG_PRESS_DELAY = 500;
const TOUCH_MOVE_THRESHOLD = 10;

const instances = new WeakMap<HTMLElement, ContextMenuController>();

export function createContextMenu(
  root: HTMLElement,
  options: ContextMenuOptions = {},
): ContextMenuInstance {
  assertHTMLElement(root, "createContextMenu root");

  const existing = instances.get(root);
  if (existing) return existing;

  const instance = new ContextMenuController(root, options);
  instances.set(root, instance);
  return instance;
}

class ContextMenuController implements ContextMenuInstance {
  readonly root: HTMLElement;

  private readonly abortController = new AbortController();
  private readonly anchor: HTMLElement;
  private readonly disabled: boolean;
  private readonly elements: ContextMenuElements;
  private readonly menu: MenuInstance;
  private destroyed = false;
  private longPressTimer: number | null = null;
  private touchStartPoint: { x: number; y: number } | null = null;

  constructor(root: HTMLElement, options: ContextMenuOptions) {
    this.root = root;
    this.disabled = options.disabled ?? false;
    this.root.setAttribute(CONTEXT_MENU_ROOT_ATTRIBUTE, "");
    this.root.setAttribute(MENU_ROOT_ATTRIBUTE, "");
    this.elements = getContextMenuElements(root);
    this.elements.triggers.forEach((trigger) => {
      trigger.setAttribute(MENU_TRIGGER_ATTRIBUTE, "");
    });
    this.anchor = createAnchorElement(this.root.ownerDocument);
    this.root.ownerDocument.body.append(this.anchor);
    this.menu = createMenu(root, {
      ...options,
      modal: options.modal ?? readBooleanAttribute(root, CONTEXT_MENU_MODAL_ATTRIBUTE, true),
      openOnHover: false,
      portalReference: this.elements.triggers[0] ?? this.root,
      reference: this.anchor,
      triggerEvents: false,
    });

    this.bindEvents();
  }

  open(): void {
    this.menu.open();
  }

  close(): void {
    this.menu.close();
  }

  setOpen(open: boolean, options?: MenuSetOpenOptions): void {
    this.menu.setOpen(open, options);
  }

  getOpen(): boolean {
    return this.menu.getOpen();
  }

  subscribe(event: "openChange", callback: (details: MenuOpenChangeDetails) => void): () => void;
  subscribe(
    event: "closeComplete",
    callback: (details: MenuCloseCompleteDetails) => void,
  ): () => void;
  subscribe(
    event: "openChange" | "closeComplete",
    callback:
      | ((details: MenuOpenChangeDetails) => void)
      | ((details: MenuCloseCompleteDetails) => void),
  ): () => void {
    if (event === "openChange") {
      return this.menu.subscribe(event, callback as (details: MenuOpenChangeDetails) => void);
    }

    return this.menu.subscribe(event, callback as (details: MenuCloseCompleteDetails) => void);
  }

  destroy(): void {
    if (this.destroyed) return;

    this.abortController.abort();
    this.clearLongPressTimer();
    this.menu.destroy();
    this.anchor.remove();
    instances.delete(this.root);
    this.destroyed = true;
  }

  private bindEvents(): void {
    const { signal } = this.abortController;

    this.root.addEventListener(
      "pointerdown",
      (event) => {
        if (event.button !== 0 || !this.menu.getOpen()) return;
        if (!(event.target instanceof Element)) return;
        if (this.isMenuSurfaceTarget(event.target)) return;

        this.menu.setOpen(false, { event, reason: "outside-press" });
      },
      { signal },
    );

    this.elements.triggers.forEach((trigger) => {
      trigger.addEventListener(
        "contextmenu",
        (event) => {
          if (this.isUserOpenDisabled(trigger)) return;

          event.preventDefault();
          event.stopPropagation();
          this.openAtPoint(event.clientX, event.clientY, { event, trigger });
        },
        { signal },
      );

      trigger.addEventListener(
        "keydown",
        (event) => {
          if (this.isUserOpenDisabled(trigger)) return;
          if (event.key !== "ContextMenu" && !(event.key === "F10" && event.shiftKey)) return;

          event.preventDefault();
          const rect = trigger.getBoundingClientRect();
          this.openAtPoint(rect.left, rect.bottom, { event, focusFirstItem: true, trigger });
        },
        { signal },
      );

      trigger.addEventListener(
        "touchstart",
        (event) => {
          if (this.isUserOpenDisabled(trigger) || event.touches.length !== 1) {
            this.clearLongPressTimer();
            this.touchStartPoint = null;
            return;
          }

          const touch = event.touches[0];
          this.touchStartPoint = { x: touch.clientX, y: touch.clientY };
          this.clearLongPressTimer();
          this.longPressTimer = window.setTimeout(() => {
            this.longPressTimer = null;
            if (!this.touchStartPoint || this.isUserOpenDisabled(trigger)) return;

            this.openAtPoint(this.touchStartPoint.x, this.touchStartPoint.y, {
              event,
              height: 10,
              trigger,
              width: 10,
            });
          }, LONG_PRESS_DELAY);
        },
        { signal },
      );

      trigger.addEventListener(
        "touchmove",
        (event) => {
          if (event.touches.length !== 1 || !this.touchStartPoint) {
            this.clearLongPressTimer();
            return;
          }

          const touch = event.touches[0];
          const deltaX = Math.abs(touch.clientX - this.touchStartPoint.x);
          const deltaY = Math.abs(touch.clientY - this.touchStartPoint.y);
          if (deltaX > TOUCH_MOVE_THRESHOLD || deltaY > TOUCH_MOVE_THRESHOLD) {
            this.clearLongPressTimer();
          }
        },
        { signal },
      );

      const handleTouchEnd = () => {
        this.clearLongPressTimer();
        this.touchStartPoint = null;
      };

      trigger.addEventListener("touchend", handleTouchEnd, { signal });
      trigger.addEventListener("touchcancel", handleTouchEnd, { signal });
    });
  }

  private openAtPoint(
    x: number,
    y: number,
    options: {
      event: Event;
      focusFirstItem?: boolean;
      height?: number;
      trigger: HTMLElement;
      width?: number;
    },
  ): void {
    positionAnchor(this.anchor, x, y, options.width ?? 0, options.height ?? 0);
    this.menu.open({
      event: options.event,
      ...(options.focusFirstItem ? { focusFirstItem: true } : {}),
      reason: "trigger-press",
      trigger: options.trigger,
    });
    this.menu.updatePosition();
    requestAnimationFrame(() => {
      if (!this.destroyed && this.menu.getOpen()) {
        this.menu.updatePosition();
      }
    });
  }

  private clearLongPressTimer(): void {
    if (this.longPressTimer === null) return;

    window.clearTimeout(this.longPressTimer);
    this.longPressTimer = null;
  }

  private isMenuSurfaceTarget(target: Element): boolean {
    return Boolean(
      target.closest(
        `[${MENU_POPUP_ATTRIBUTE}], [${MENU_PORTAL_ATTRIBUTE}], [${MENU_POSITIONER_ATTRIBUTE}]`,
      ),
    );
  }

  private isUserOpenDisabled(trigger: HTMLElement): boolean {
    return this.disabled || isDisabledRoot(this.root) || isDisabledTrigger(trigger);
  }
}

function getContextMenuElements(root: HTMLElement): ContextMenuElements {
  return {
    triggers: queryContextMenuElements(root, `[${CONTEXT_MENU_TRIGGER_ATTRIBUTE}]`),
  };
}

function queryContextMenuElements(root: HTMLElement, selector: string): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter((element) => {
    const owner = element.closest<HTMLElement>(`[${CONTEXT_MENU_ROOT_ATTRIBUTE}]`);
    return owner === root;
  });
}

function createAnchorElement(ownerDocument: Document): HTMLElement {
  const anchor = ownerDocument.createElement("span");
  anchor.setAttribute("data-sw-context-menu-anchor", "");
  anchor.style.position = "absolute";
  anchor.style.left = "0px";
  anchor.style.top = "0px";
  anchor.style.width = "0px";
  anchor.style.height = "0px";
  anchor.style.pointerEvents = "none";
  anchor.style.visibility = "hidden";
  return anchor;
}

function positionAnchor(
  anchor: HTMLElement,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const view = anchor.ownerDocument.defaultView;
  const scrollX = view?.scrollX ?? anchor.ownerDocument.documentElement.scrollLeft;
  const scrollY = view?.scrollY ?? anchor.ownerDocument.documentElement.scrollTop;

  anchor.style.left = `${x + scrollX}px`;
  anchor.style.top = `${y + scrollY}px`;
  anchor.style.width = `${width}px`;
  anchor.style.height = `${height}px`;
}

function isDisabledTrigger(trigger: HTMLElement): boolean {
  return (
    trigger.hasAttribute("disabled") ||
    trigger.hasAttribute("data-disabled") ||
    trigger.getAttribute("aria-disabled") === "true"
  );
}

function isDisabledRoot(root: HTMLElement): boolean {
  return root.hasAttribute("data-disabled") || root.getAttribute("aria-disabled") === "true";
}
