import {
  assertHTMLElement,
  ensureId,
  readNumberAttribute,
  setBooleanAttribute,
} from "../../internal/dom";

export type ToastVariant = "default" | "error" | "info" | "loading" | "success" | "warning";

export type ToastPosition =
  | "bottom-center"
  | "bottom-left"
  | "bottom-right"
  | "top-center"
  | "top-left"
  | "top-right";

export type ToastAction = {
  label: string;
  onClick: () => void;
};

export type ToastOptions = {
  action?: ToastAction;
  description?: string;
  duration?: number;
  id?: string;
  onClose?: () => void;
  onRemove?: () => void;
  title?: string;
  variant?: ToastVariant;
};

export type ToastPromiseStateOption = {
  description?: string;
  duration?: number;
  title?: string;
};

export type ToastPromiseStateValue<T> =
  | ((data: T) => string | ToastPromiseStateOption)
  | ToastPromiseStateOption
  | string;

export type ToastPromiseOptions<T, E = Error> = {
  error: ToastPromiseStateValue<E>;
  loading: string | ToastPromiseStateOption;
  success: ToastPromiseStateValue<T>;
};

export type ToastManagerOptions = {
  defaultDuration?: number;
  limit?: number;
};

export type ToastManager = {
  readonly viewport: HTMLElement;
  add(options: ToastOptions): string;
  close(id: string): void;
  closeAll(): void;
  destroy(): void;
  dismiss(id?: string): void;
  getToasts(): ToastState[];
  update(id: string, options: Partial<ToastOptions>): void;
};

export type ToastApi = {
  (message: string, options?: Omit<ToastOptions, "title">): string;
  (options: ToastOptions): string;
  dismiss(id?: string): void;
  error(message: string, options?: Omit<ToastOptions, "variant">): string;
  info(message: string, options?: Omit<ToastOptions, "variant">): string;
  loading(message: string, options?: Omit<ToastOptions, "variant">): string;
  promise<T, E = Error>(promise: Promise<T>, options: ToastPromiseOptions<T, E>): Promise<T>;
  success(message: string, options?: Omit<ToastOptions, "variant">): string;
  update(id: string, options: Partial<ToastOptions>): void;
  warning(message: string, options?: Omit<ToastOptions, "variant">): string;
};

export type ToastState = ToastOptions & {
  closing?: boolean;
  element?: HTMLElement;
  height?: number;
  id: string;
  managedDescribedBy?: string;
  managedLabelledBy?: string;
  removalTimerId?: number;
  swipeDirection?: SwipeDirection;
  swipeX?: number;
  swipeY?: number;
  timerDuration?: number;
  timerRemaining?: number;
  timerStartedAt?: number;
  swiping?: boolean;
  timeoutId?: number;
};

type SwipeDirection = "down" | "left" | "right" | "up";

type ActiveSwipe = {
  didMove: boolean;
  lockedDirection: "horizontal" | "vertical" | null;
  startTime: number;
  startX: number;
  startY: number;
  toast: ToastState;
};

type ToastUpdateBehavior = {
  resetTimer?: boolean;
};

const TOAST_VIEWPORT_ATTRIBUTE = "data-sw-toast-viewport";
const TOAST_TEMPLATE_ATTRIBUTE = "data-sw-toast-template";
const TOAST_ROOT_ATTRIBUTE = "data-sw-toast-root";
const TOAST_CONTENT_ATTRIBUTE = "data-sw-toast-content";
const TOAST_TITLE_ATTRIBUTE = "data-sw-toast-title";
const TOAST_TITLE_TEXT_ATTRIBUTE = "data-sw-toast-title-text";
const TOAST_DESCRIPTION_ATTRIBUTE = "data-sw-toast-description";
const TOAST_ACTION_ATTRIBUTE = "data-sw-toast-action";
const TOAST_CLOSE_ATTRIBUTE = "data-sw-toast-close";
const TOAST_ID_ATTRIBUTE = "data-toast-id";
const TOAST_LIMIT_ATTRIBUTE = "data-limit";
const TOAST_DURATION_ATTRIBUTE = "data-duration";
const TOAST_POSITION_ATTRIBUTE = "data-position";
const SWIPE_THRESHOLD = 40;
const DAMPING_FACTOR = 0.1;
const LONG_PRESS_DURATION = 300;

const instances = new WeakMap<HTMLElement, ToastManagerController>();
let globalManager: ToastManagerController | null = null;

declare global {
  interface Window {
    __starwindRuntime__?: {
      toast?: ToastManager | null;
      [key: string]: unknown;
    };
  }
}

export function createToastManager(
  viewport: HTMLElement,
  options: ToastManagerOptions = {},
): ToastManager {
  assertHTMLElement(viewport, "createToastManager viewport");

  const existing = instances.get(viewport);
  if (existing) return existing;

  const manager = new ToastManagerController(viewport, options);
  instances.set(viewport, manager);
  installGlobalManager(manager);
  return manager;
}

export function getToastManager(): ToastManager | null {
  return getRegisteredToastManager() ?? globalManager ?? null;
}

const createToast = ((
  messageOrOptions: string | ToastOptions,
  extraOptions: Omit<ToastOptions, "title"> = {},
) => {
  const options =
    typeof messageOrOptions === "string"
      ? ({ ...extraOptions, title: messageOrOptions } as ToastOptions)
      : messageOrOptions;
  const manager = getToastManager();

  if (!manager) {
    console.warn("Toast: No Toaster found. Add <Toaster /> to your layout.");
    return "";
  }

  return manager.add(options);
}) as ToastApi;

createToast.success = (message, options) => createVariantToast("success", message, options);
createToast.error = (message, options) => createVariantToast("error", message, options);
createToast.warning = (message, options) => createVariantToast("warning", message, options);
createToast.info = (message, options) => createVariantToast("info", message, options);
createToast.loading = (message, options) =>
  createVariantToast("loading", message, { ...options, duration: 0 });

createToast.update = (id, options) => {
  const manager = getToastManager();
  if (!manager) {
    console.warn("Toast: No Toaster found. Add <Toaster /> to your layout.");
    return;
  }
  manager.update(id, options);
};

createToast.dismiss = (id) => {
  getToastManager()?.dismiss(id);
};

createToast.promise = async <T, E = Error>(
  promise: Promise<T>,
  options: ToastPromiseOptions<T, E>,
): Promise<T> => {
  const loadingOptions = normalizePromiseState(options.loading);
  const id = createToast({
    ...loadingOptions,
    duration: 0,
    variant: "loading",
  });

  try {
    const data = await promise;
    const successOptions = normalizePromiseState(options.success, data);
    createToast.update(id, { ...successOptions, variant: "success" });
    return data;
  } catch (error) {
    const errorOptions = normalizePromiseState(options.error, error as E);
    createToast.update(id, { ...errorOptions, variant: "error" });
    throw error;
  }
};

export { createToast as toast };

class ToastManagerController implements ToastManager {
  readonly viewport: HTMLElement;

  private readonly abortController = new AbortController();
  private readonly mutationObserver: MutationObserver;
  private activeSwipe: ActiveSwipe | null = null;
  private counter = 0;
  private defaultDuration: number;
  private destroyed = false;
  private expanded = false;
  private expandedByTouch = false;
  private limit: number;
  private swipeDirections: SwipeDirection[] = ["down", "right"];
  private toasts: ToastState[] = [];

  constructor(viewport: HTMLElement, options: ToastManagerOptions) {
    this.viewport = viewport;
    this.limit = options.limit ?? readNumberAttribute(viewport, TOAST_LIMIT_ATTRIBUTE, 3);
    this.defaultDuration =
      options.defaultDuration ?? readNumberAttribute(viewport, TOAST_DURATION_ATTRIBUTE, 5000);
    this.mutationObserver = new MutationObserver(this.handleViewportMutations);
    this.setupViewport();
    this.setupEvents();
    this.mutationObserver.observe(this.viewport, {
      attributeFilter: [TOAST_DURATION_ATTRIBUTE, TOAST_LIMIT_ATTRIBUTE, TOAST_POSITION_ATTRIBUTE],
      attributes: true,
    });
  }

  add(options: ToastOptions): string {
    const id = options.id || `toast-${++this.counter}`;
    const existing = this.toasts.find((candidate) => candidate.id === id);
    if (existing && !existing.closing) {
      const updates: Partial<ToastOptions> = { ...options };
      delete updates.id;
      this.updateToast(id, updates, { resetTimer: true });
      return id;
    }

    const toast: ToastState = {
      ...options,
      duration: options.duration ?? (options.variant === "loading" ? 0 : this.defaultDuration),
      id,
    };

    if (!this.renderToast(toast)) {
      return id;
    }

    this.toasts.unshift(toast);
    this.updatePositions();
    return id;
  }

  update(id: string, options: Partial<ToastOptions>): void {
    this.updateToast(id, options);
  }

  private updateToast(
    id: string,
    options: Partial<ToastOptions>,
    behavior: ToastUpdateBehavior = {},
  ): void {
    const toast = this.toasts.find((candidate) => candidate.id === id);
    if (!toast || toast.closing) return;

    const previousState: ToastState = { ...toast };
    const previousVariant = toast.variant;
    const nextVariant = options.variant ?? previousVariant;
    const durationUpdated = Object.prototype.hasOwnProperty.call(options, "duration");
    const shouldUseLoadingDuration =
      !durationUpdated && previousVariant !== "loading" && nextVariant === "loading";
    const shouldUseSettledDuration =
      !durationUpdated && previousVariant === "loading" && nextVariant !== "loading";

    Object.assign(toast, options);

    if (shouldUseLoadingDuration) {
      toast.duration = 0;
    } else if (shouldUseSettledDuration) {
      toast.duration = this.defaultDuration;
    }

    if (options.variant && options.variant !== previousVariant && toast.element) {
      if (!this.rerenderToast(toast)) {
        for (const key of Object.keys(options) as Array<keyof ToastOptions>) {
          if (!(key in previousState)) {
            delete (toast as Partial<ToastState>)[key as keyof ToastState];
          }
        }
        Object.assign(toast, previousState);
        return;
      }
    } else if (toast.element) {
      this.updateToastContent(toast);
    }

    const duration = toast.duration ?? this.defaultDuration;
    const shouldHaveTimer = this.shouldHaveTimer(toast, duration);
    const shouldUpdateTimer =
      behavior.resetTimer ||
      durationUpdated ||
      shouldUseLoadingDuration ||
      shouldUseSettledDuration ||
      (shouldHaveTimer && !this.expanded && !toast.timeoutId && toast.timerRemaining === undefined);

    if (!shouldHaveTimer) {
      this.clearTimer(toast);
    } else if (shouldHaveTimer && shouldUpdateTimer) {
      this.restartTimer(toast);
    }
  }

  close(id: string): void {
    const toast = this.toasts.find((candidate) => candidate.id === id);
    if (!toast || toast.closing) return;

    toast.closing = true;
    this.clearTimer(toast);
    toast.onClose?.();

    if (!toast.element) {
      this.removeToast(id);
      return;
    }

    toast.element.setAttribute("data-state", "closed");

    toast.removalTimerId = window.setTimeout(() => {
      toast.removalTimerId = undefined;
      if (this.destroyed) return;

      toast.element?.remove();
      toast.onRemove?.();
      this.removeToast(id);
    }, 200);
  }

  closeAll(): void {
    [...this.toasts].forEach((toast) => this.close(toast.id));
  }

  dismiss(id?: string): void {
    if (id) {
      this.close(id);
      return;
    }
    this.closeAll();
  }

  getToasts(): ToastState[] {
    return [...this.toasts];
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.abortController.abort();
    this.mutationObserver.disconnect();
    this.toasts.forEach((toast) => {
      this.clearTimer(toast);
      if (toast.removalTimerId !== undefined) {
        window.clearTimeout(toast.removalTimerId);
        toast.removalTimerId = undefined;
      }
      toast.element?.remove();
    });
    this.toasts = [];
    this.activeSwipe = null;
    this.viewport.removeAttribute("data-expanded");
    this.viewport.style.removeProperty("height");
    instances.delete(this.viewport);
    if (globalManager === this) {
      globalManager = null;
    }
    if (window.__starwindRuntime__?.toast === this) {
      window.__starwindRuntime__.toast = null;
    }
  }

  private setupViewport(): void {
    const position = this.viewport.getAttribute(TOAST_POSITION_ATTRIBUTE) ?? "bottom-right";

    this.viewport.setAttribute(TOAST_VIEWPORT_ATTRIBUTE, "");
    this.viewport.setAttribute("role", this.viewport.getAttribute("role") ?? "region");
    this.viewport.setAttribute("aria-live", this.viewport.getAttribute("aria-live") ?? "polite");
    this.viewport.setAttribute("aria-atomic", this.viewport.getAttribute("aria-atomic") ?? "false");
    this.viewport.setAttribute(
      "aria-relevant",
      this.viewport.getAttribute("aria-relevant") ?? "additions text",
    );
    this.viewport.setAttribute(
      "aria-label",
      this.viewport.getAttribute("aria-label") ?? "Notifications",
    );
    this.viewport.tabIndex = this.viewport.tabIndex < 0 ? this.viewport.tabIndex : -1;
    this.setViewportPosition(position);
    this.viewport.setAttribute(TOAST_LIMIT_ATTRIBUTE, String(this.limit));
    this.viewport.setAttribute(TOAST_DURATION_ATTRIBUTE, String(this.defaultDuration));
  }

  private readonly handleViewportMutations = (mutations: MutationRecord[]): void => {
    if (!mutations.some((mutation) => mutation.type === "attributes")) return;

    this.syncViewportOptions();
  };

  private syncViewportOptions(): void {
    const previousLimit = this.limit;

    this.limit = readNumberAttribute(this.viewport, TOAST_LIMIT_ATTRIBUTE, this.limit);
    this.defaultDuration = readNumberAttribute(
      this.viewport,
      TOAST_DURATION_ATTRIBUTE,
      this.defaultDuration,
    );
    this.setViewportPosition(
      this.viewport.getAttribute(TOAST_POSITION_ATTRIBUTE) ?? "bottom-right",
    );

    if (this.limit !== previousLimit) {
      this.updatePositions();
      this.updateViewportHeight();
    }
  }

  private setViewportPosition(position: string): void {
    if (this.viewport.getAttribute(TOAST_POSITION_ATTRIBUTE) !== position) {
      this.viewport.setAttribute(TOAST_POSITION_ATTRIBUTE, position);
    }

    this.swipeDirections = position.startsWith("top") ? ["up", "right"] : ["down", "right"];
  }

  private setupEvents(): void {
    const { signal } = this.abortController;

    this.viewport.addEventListener("mouseenter", () => this.expand(), { signal });
    this.viewport.addEventListener("mouseleave", (event) => this.handleMouseLeave(event), {
      signal,
    });
    this.viewport.addEventListener("focusin", () => this.expand(), { signal });
    this.viewport.addEventListener("focusout", (event) => this.handleFocusOut(event), { signal });
    document.addEventListener("pointerdown", (event) => this.handleDocumentPointerDown(event), {
      signal,
    });
  }

  private expand(): void {
    this.expanded = true;
    this.updateExpanded();
    this.pauseAllTimers();
  }

  private collapse(): void {
    this.expanded = false;
    this.expandedByTouch = false;
    this.updateExpanded();
    this.resumeAllTimers();
  }

  private handleMouseLeave(event: MouseEvent): void {
    if (this.expandedByTouch) return;

    const rect = this.viewport.getBoundingClientRect();
    const inside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;

    if (!inside) this.collapse();
  }

  private handleFocusOut(event: FocusEvent): void {
    if (this.expandedByTouch) return;
    if (!this.viewport.contains(event.relatedTarget as Node | null)) {
      this.collapse();
    }
  }

  private handleDocumentPointerDown(event: PointerEvent): void {
    if (!this.expandedByTouch || !this.expanded) return;
    if (event.target instanceof Node && this.viewport.contains(event.target)) return;
    this.collapse();
  }

  private updateExpanded(): void {
    if (this.expanded) {
      this.viewport.setAttribute("data-expanded", "");
      this.updateViewportHeight();
    } else {
      this.viewport.removeAttribute("data-expanded");
      this.viewport.style.removeProperty("height");
    }

    this.toasts.forEach((toast) => {
      if (!toast.element) return;
      const content = queryToastPart(toast.element, TOAST_CONTENT_ATTRIBUTE, "toast-content");
      if (this.expanded) {
        toast.element.setAttribute("data-expanded", "");
        content?.setAttribute("data-expanded", "");
      } else {
        toast.element.removeAttribute("data-expanded");
        content?.removeAttribute("data-expanded");
      }
    });
    this.updatePositions();
  }

  private updateViewportHeight(): void {
    if (!this.expanded || this.toasts.length === 0) return;
    const gap = this.getCssPixelValue("--gap");
    const visibleToasts = this.toasts.slice(0, this.limit);
    const totalHeight = visibleToasts.reduce((sum, toast) => sum + (toast.height || 0), 0);
    const totalGaps = Math.max(visibleToasts.length - 1, 0) * gap;
    this.viewport.style.height = `${totalHeight + totalGaps}px`;
  }

  private getCssPixelValue(property: string): number {
    const value = getComputedStyle(this.viewport).getPropertyValue(property).trim();
    if (!value) return 16;

    const probe = document.createElement("div");
    probe.style.position = "absolute";
    probe.style.visibility = "hidden";
    probe.style.width = value;
    document.body.append(probe);
    const pixels = probe.offsetWidth;
    probe.remove();
    return pixels || 16;
  }

  private renderToast(toast: ToastState): boolean {
    const element = this.cloneToastElement(toast);
    if (!element) return false;

    toast.element = element;
    this.viewport.insertBefore(element, this.viewport.firstElementChild);
    this.setupToastElement(element, toast);

    requestAnimationFrame(() => {
      toast.height = element.offsetHeight;
      this.updatePositions();
      requestAnimationFrame(() => {
        element.removeAttribute("data-starting-style");
      });
    });

    this.restartTimer(toast);
    return true;
  }

  private cloneToastElement(toast: ToastState): HTMLElement | null {
    const variant = toast.variant ?? "default";
    const template =
      this.viewport.querySelector<HTMLTemplateElement>(
        `template[${TOAST_TEMPLATE_ATTRIBUTE}="${variant}"]`,
      ) ??
      this.viewport.querySelector<HTMLTemplateElement>(
        `template[data-toast-template="${variant}"]`,
      );

    if (!template) {
      console.error(`Toast template for variant "${variant}" not found`);
      return null;
    }

    const clone = template.content.cloneNode(true) as DocumentFragment;
    const element = clone.firstElementChild as HTMLElement | null;
    if (!element) return null;

    element.setAttribute(TOAST_ROOT_ATTRIBUTE, "");
    element.setAttribute(TOAST_ID_ATTRIBUTE, toast.id);
    element.setAttribute("data-state", "open");
    element.setAttribute("data-starting-style", "");
    element.setAttribute("data-variant", variant);
    return element;
  }

  private setupToastElement(element: HTMLElement, toast: ToastState): void {
    this.updateToastContent(toast);

    const close = queryToastPart(element, TOAST_CLOSE_ATTRIBUTE, "toast-close");
    close?.addEventListener("click", () => this.close(toast.id));
    close?.setAttribute("type", close.getAttribute("type") ?? "button");
    close?.setAttribute("aria-label", close.getAttribute("aria-label") ?? "Close notification");

    const action = queryToastPart(element, TOAST_ACTION_ATTRIBUTE, "toast-action");
    action?.addEventListener("click", () => {
      toast.action?.onClick();
      this.close(toast.id);
    });
    action?.setAttribute("type", action.getAttribute("type") ?? "button");

    this.setupSwipeHandlers(element, toast);
    element.style.setProperty("--toast-swipe-movement-x", "0px");
    element.style.setProperty("--toast-swipe-movement-y", "0px");
  }

  private updateToastContent(toast: ToastState): void {
    if (!toast.element) return;

    const title = queryToastPart(toast.element, TOAST_TITLE_ATTRIBUTE, "toast-title");
    const titleText = queryToastPart(toast.element, TOAST_TITLE_TEXT_ATTRIBUTE, "toast-title-text");
    const description = queryToastPart(
      toast.element,
      TOAST_DESCRIPTION_ATTRIBUTE,
      "toast-description",
    );
    const action = queryToastPart(toast.element, TOAST_ACTION_ATTRIBUTE, "toast-action");

    if (title) {
      if (toast.title) {
        title.hidden = false;
        if (titleText) titleText.textContent = toast.title;
        else title.textContent = toast.title;
      } else {
        title.hidden = true;
      }
    }

    if (description) {
      if (toast.description) {
        description.hidden = false;
        description.textContent = toast.description;
      } else {
        description.hidden = true;
      }
    }

    if (action) {
      if (toast.action) {
        action.hidden = false;
        action.textContent = toast.action.label;
      } else {
        action.hidden = true;
      }
    }

    this.syncToastAria(toast, title, description);
  }

  private syncToastAria(
    toast: ToastState,
    title: HTMLElement | null,
    description: HTMLElement | null,
  ): void {
    const root = toast.element;
    if (!root) return;

    const currentLabelledBy = root.getAttribute("aria-labelledby");
    const ownsLabelledBy =
      toast.managedLabelledBy !== undefined && currentLabelledBy === toast.managedLabelledBy;
    const canManageLabel =
      !root.hasAttribute("aria-label") && (currentLabelledBy === null || ownsLabelledBy);

    if (title && !title.hidden && canManageLabel) {
      const id = ensureId(title, "sw-toast-title");
      root.setAttribute("aria-labelledby", id);
      toast.managedLabelledBy = id;
    } else if (ownsLabelledBy) {
      root.removeAttribute("aria-labelledby");
      toast.managedLabelledBy = undefined;
    } else if (!ownsLabelledBy) {
      toast.managedLabelledBy = undefined;
    }

    const currentDescribedBy = root.getAttribute("aria-describedby");
    const ownsDescribedBy =
      toast.managedDescribedBy !== undefined && currentDescribedBy === toast.managedDescribedBy;
    const canManageDescription = currentDescribedBy === null || ownsDescribedBy;

    if (description && !description.hidden && canManageDescription) {
      const id = ensureId(description, "sw-toast-description");
      root.setAttribute("aria-describedby", id);
      toast.managedDescribedBy = id;
    } else if (ownsDescribedBy) {
      root.removeAttribute("aria-describedby");
      toast.managedDescribedBy = undefined;
    } else if (!ownsDescribedBy) {
      toast.managedDescribedBy = undefined;
    }
  }

  private rerenderToast(toast: ToastState): boolean {
    if (!toast.element) return false;

    const previous = toast.element;
    const next = this.cloneToastElement(toast);
    if (!next) return false;

    next.removeAttribute("data-starting-style");
    next.style.setProperty("--toast-index", previous.style.getPropertyValue("--toast-index"));
    next.style.setProperty("--toast-offset-y", previous.style.getPropertyValue("--toast-offset-y"));
    if (this.expanded) next.setAttribute("data-expanded", "");
    previous.replaceWith(next);
    toast.element = next;
    this.setupToastElement(next, toast);
    if (this.expanded) {
      queryToastPart(next, TOAST_CONTENT_ATTRIBUTE, "toast-content")?.setAttribute(
        "data-expanded",
        "",
      );
    }
    toast.height = next.offsetHeight;
    this.updatePositions();
    return true;
  }

  private updatePositions(): void {
    let offset = 0;
    const gap = this.getCssPixelValue("--gap");

    this.toasts.forEach((toast, index) => {
      if (!toast.element) return;

      const content = queryToastPart(toast.element, TOAST_CONTENT_ATTRIBUTE, "toast-content");
      toast.element.style.setProperty("--toast-index", String(index));
      toast.element.style.setProperty("--toast-offset-y", `${offset}px`);

      if (index > 0) content?.setAttribute("data-behind", "");
      else content?.removeAttribute("data-behind");

      const limited = index >= this.limit;
      setBooleanAttribute(toast.element, "data-limited", limited);
      setBooleanAttribute(toast.element, "inert", limited);

      offset += (toast.height || 0) + gap;
    });
  }

  private pauseAllTimers(): void {
    this.toasts.forEach((toast) => this.pauseTimer(toast));
  }

  private resumeAllTimers(): void {
    this.toasts.forEach((toast) => this.resumeTimer(toast));
  }

  private restartTimer(toast: ToastState): void {
    this.clearTimer(toast);
    const duration = toast.duration ?? this.defaultDuration;
    this.startTimer(toast, duration);
  }

  private startTimer(toast: ToastState, duration: number): void {
    if (this.shouldHaveTimer(toast, duration) && !this.expanded) {
      toast.timerDuration = duration;
      toast.timerStartedAt = Date.now();
      toast.timeoutId = window.setTimeout(() => this.close(toast.id), duration);
    }
  }

  private shouldHaveTimer(
    toast: ToastState,
    duration = toast.duration ?? this.defaultDuration,
  ): boolean {
    return duration > 0 && toast.variant !== "loading" && !toast.closing;
  }

  private pauseTimer(toast: ToastState): void {
    if (!toast.timeoutId) return;

    const startedAt = toast.timerStartedAt ?? Date.now();
    const duration = toast.timerDuration ?? toast.duration ?? this.defaultDuration;
    toast.timerRemaining = Math.max(duration - (Date.now() - startedAt), 0);
    window.clearTimeout(toast.timeoutId);
    toast.timeoutId = undefined;
    toast.timerDuration = undefined;
    toast.timerStartedAt = undefined;
  }

  private resumeTimer(toast: ToastState): void {
    const remaining = toast.timerRemaining;
    if (remaining !== undefined) {
      toast.timerRemaining = undefined;
      if (remaining <= 0) {
        this.close(toast.id);
        return;
      }
      this.startTimer(toast, remaining);
      return;
    }

    this.restartTimer(toast);
  }

  private clearTimer(toast: ToastState): void {
    if (toast.timeoutId) {
      window.clearTimeout(toast.timeoutId);
    }
    toast.timeoutId = undefined;
    toast.timerDuration = undefined;
    toast.timerRemaining = undefined;
    toast.timerStartedAt = undefined;
  }

  private removeToast(id: string): void {
    const index = this.toasts.findIndex((toast) => toast.id === id);
    if (index >= 0) this.toasts.splice(index, 1);
    this.updatePositions();
    this.updateViewportHeight();
  }

  private setupSwipeHandlers(element: HTMLElement, toast: ToastState): void {
    element.addEventListener("pointerdown", (event) => this.handlePointerDown(event, toast));
    element.addEventListener("pointermove", (event) => this.handlePointerMove(event));
    element.addEventListener("pointerup", (event) => this.handlePointerUp(event));
    element.addEventListener("pointercancel", (event) => this.handlePointerUp(event));
    element.addEventListener(
      "touchmove",
      (event) => {
        if (this.activeSwipe?.toast === toast) event.preventDefault();
      },
      { passive: false },
    );
  }

  private handlePointerDown(event: PointerEvent, toast: ToastState): void {
    if (event.button !== 0) return;
    if (!(event.target instanceof HTMLElement)) return;
    if (
      event.target.closest(
        'button, a, input, textarea, [role="button"], [data-swipe-ignore], [data-base-ui-swipe-ignore]',
      )
    ) {
      return;
    }

    this.expandedByTouch = true;
    if (!this.expanded) this.expand();

    this.activeSwipe = {
      didMove: false,
      lockedDirection: null,
      startTime: Date.now(),
      startX: event.clientX,
      startY: event.clientY,
      toast,
    };
    toast.swiping = true;
    toast.swipeX = 0;
    toast.swipeY = 0;
    toast.element?.setAttribute("data-swiping", "");
    toast.element?.setPointerCapture(event.pointerId);
    this.pauseTimer(toast);
  }

  private handlePointerMove(event: PointerEvent): void {
    if (!this.activeSwipe) return;

    event.preventDefault();
    const { toast, startX, startY } = this.activeSwipe;
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    if (!this.activeSwipe.lockedDirection) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      if (absX > 5 || absY > 5) {
        this.activeSwipe.didMove = true;
        this.activeSwipe.lockedDirection = absX > absY ? "horizontal" : "vertical";
      }
    }

    let swipeX = 0;
    let swipeY = 0;
    if (this.activeSwipe.lockedDirection === "horizontal") {
      if (deltaX > 0 && this.swipeDirections.includes("right")) swipeX = deltaX;
      else if (deltaX < 0 && this.swipeDirections.includes("left")) swipeX = deltaX;
      else swipeX = deltaX * DAMPING_FACTOR;
    } else if (this.activeSwipe.lockedDirection === "vertical") {
      if (deltaY > 0 && this.swipeDirections.includes("down")) swipeY = deltaY;
      else if (deltaY < 0 && this.swipeDirections.includes("up")) swipeY = deltaY;
      else swipeY = deltaY * DAMPING_FACTOR;
    }

    toast.swipeX = swipeX;
    toast.swipeY = swipeY;
    toast.element?.style.setProperty("--toast-swipe-movement-x", `${swipeX}px`);
    toast.element?.style.setProperty("--toast-swipe-movement-y", `${swipeY}px`);
  }

  private handlePointerUp(event: PointerEvent): void {
    if (!this.activeSwipe) return;

    const { toast } = this.activeSwipe;
    toast.element?.releasePointerCapture(event.pointerId);
    toast.element?.removeAttribute("data-swiping");
    toast.swiping = false;

    const swipeX = toast.swipeX || 0;
    const swipeY = toast.swipeY || 0;
    const direction = this.getClosingSwipeDirection(
      swipeX,
      swipeY,
      this.activeSwipe.lockedDirection,
    );
    const pressDuration = Date.now() - this.activeSwipe.startTime;
    const shouldCollapse =
      (pressDuration < LONG_PRESS_DURATION && !this.activeSwipe.didMove && this.expandedByTouch) ||
      this.isOutsideViewport(event);

    if (direction) {
      toast.swipeDirection = direction;
      toast.element?.setAttribute("data-swipe-direction", direction);
      this.close(toast.id);
    } else {
      toast.swipeX = 0;
      toast.swipeY = 0;
      toast.element?.style.setProperty("--toast-swipe-movement-x", "0px");
      toast.element?.style.setProperty("--toast-swipe-movement-y", "0px");
      if (shouldCollapse) this.collapse();
      else if (!this.expanded) this.resumeTimer(toast);
    }

    this.activeSwipe = null;
  }

  private getClosingSwipeDirection(
    swipeX: number,
    swipeY: number,
    lockedDirection: "horizontal" | "vertical" | null,
  ): SwipeDirection | null {
    if (lockedDirection === "horizontal") {
      if (swipeX > SWIPE_THRESHOLD && this.swipeDirections.includes("right")) return "right";
      if (swipeX < -SWIPE_THRESHOLD && this.swipeDirections.includes("left")) return "left";
    }
    if (lockedDirection === "vertical") {
      if (swipeY > SWIPE_THRESHOLD && this.swipeDirections.includes("down")) return "down";
      if (swipeY < -SWIPE_THRESHOLD && this.swipeDirections.includes("up")) return "up";
    }
    return null;
  }

  private isOutsideViewport(event: PointerEvent): boolean {
    const rect = this.viewport.getBoundingClientRect();
    return (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    );
  }
}

function createVariantToast(
  variant: ToastVariant,
  message: string,
  options?: Omit<ToastOptions, "variant">,
): string {
  return createToast({ ...options, title: message, variant });
}

function normalizePromiseState<T>(
  value: ToastPromiseStateValue<T>,
  data?: T,
): Omit<ToastOptions, "variant"> {
  const resolved = typeof value === "function" ? value(data as T) : value;
  return typeof resolved === "string" ? { title: resolved } : resolved;
}

function queryToastPart(root: HTMLElement, attribute: string, slot: string): HTMLElement | null {
  return root.querySelector<HTMLElement>(`[${attribute}], [data-slot="${slot}"]`);
}

function installGlobalManager(manager: ToastManagerController): void {
  globalManager = manager;
  window.__starwindRuntime__ = window.__starwindRuntime__ || {};
  window.__starwindRuntime__.toast = manager;
}

function getRegisteredToastManager(): ToastManager | null {
  if (typeof window === "undefined") return null;
  return window.__starwindRuntime__?.toast ?? null;
}
