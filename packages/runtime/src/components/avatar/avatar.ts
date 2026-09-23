import { assertHTMLElement } from "../../internal/dom";
import { dispatchCustomEvent } from "../../internal/events";

export type AvatarImageLoadingStatus = "idle" | "loading" | "loaded" | "error";

export type AvatarLoadingStatusChangeDetails = {
  previousStatus: AvatarImageLoadingStatus;
  status: AvatarImageLoadingStatus;
  event?: Event;
};

export type AvatarOptions = {
  onLoadingStatusChange?: (
    status: AvatarImageLoadingStatus,
    details: AvatarLoadingStatusChangeDetails,
  ) => void;
};

export type AvatarSetLoadingStatusOptions = {
  emit?: boolean;
  event?: Event;
};

export type AvatarInstance = {
  readonly root: HTMLElement;
  destroy(): void;
  getImageLoadingStatus(): AvatarImageLoadingStatus;
  refresh(): void;
  setImageLoadingStatus(
    status: AvatarImageLoadingStatus,
    options?: AvatarSetLoadingStatusOptions,
  ): void;
  subscribe(
    event: "loadingStatusChange",
    callback: (details: AvatarLoadingStatusChangeDetails) => void,
  ): () => void;
};

type AvatarFallback = {
  delay?: number;
  delayPassed: boolean;
  element: HTMLElement;
  timeoutId?: number;
};

type AvatarElements = {
  fallbacks: AvatarFallback[];
  images: HTMLImageElement[];
};

const AVATAR_ROOT_ATTRIBUTE = "data-sw-avatar";
const AVATAR_IMAGE_SELECTOR = "[data-sw-avatar-image]";
const AVATAR_FALLBACK_SELECTOR = "[data-sw-avatar-fallback]";
const AVATAR_FALLBACK_DELAY_ATTRIBUTE = "data-delay";
const AVATAR_LOADING_STATUS_ATTRIBUTE = "data-image-loading-status";

const instances = new WeakMap<HTMLElement, AvatarController>();

export function createAvatar(root: HTMLElement, options: AvatarOptions = {}): AvatarInstance {
  assertHTMLElement(root, "createAvatar root");

  const existing = instances.get(root);
  if (existing) return existing;

  const instance = new AvatarController(root, options);
  instances.set(root, instance);
  return instance;
}

export function refreshExistingAvatar(root: HTMLElement): AvatarInstance | undefined {
  const instance = instances.get(root);
  instance?.refresh();
  return instance;
}

class AvatarController implements AvatarInstance {
  readonly root: HTMLElement;

  private readonly imageBindings = new Map<HTMLImageElement, AbortController>();
  private elements: AvatarElements;
  private readonly mutationObserver: MutationObserver;
  private readonly onLoadingStatusChange?: (
    status: AvatarImageLoadingStatus,
    details: AvatarLoadingStatusChangeDetails,
  ) => void;
  private readonly subscribers = new Set<(details: AvatarLoadingStatusChangeDetails) => void>();
  private destroyed = false;
  private imageLoadingStatus: AvatarImageLoadingStatus;

  constructor(root: HTMLElement, options: AvatarOptions) {
    this.root = root;
    this.elements = getAvatarElements(root);
    this.onLoadingStatusChange = options.onLoadingStatusChange;
    this.imageLoadingStatus = this.readImageLoadingStatus();
    this.mutationObserver = new MutationObserver(() => {
      this.handleImageMutation();
    });

    this.bindEvents();
    this.observeImages();
    this.render();
    this.notifyInitialLoadingStatus();
  }

  getImageLoadingStatus(): AvatarImageLoadingStatus {
    return this.imageLoadingStatus;
  }

  setImageLoadingStatus(
    status: AvatarImageLoadingStatus,
    options: AvatarSetLoadingStatusOptions = {},
  ): void {
    if (status === this.imageLoadingStatus) return;

    const previousStatus = this.imageLoadingStatus;
    this.imageLoadingStatus = status;
    this.resetFallbackDelayWhenNeeded(status);
    this.render();

    if (options.emit !== false) {
      this.notify({
        event: options.event,
        previousStatus,
        status,
      });
    }
  }

  refresh(): void {
    if (this.destroyed) return;

    const previous = this.elements;
    const next = getAvatarElements(this.root);
    const sourceChanged = this.mutationObserver
      .takeRecords()
      .some((record) => next.images.includes(record.target as HTMLImageElement));
    const retainedFallbacks = new Map(
      previous.fallbacks.map((fallback) => [fallback.element, fallback]),
    );
    next.fallbacks = next.fallbacks.map((fallback) => {
      const retained = retainedFallbacks.get(fallback.element);
      if (!retained || retained.delay !== fallback.delay) return fallback;
      retainedFallbacks.delete(fallback.element);
      return retained;
    });
    retainedFallbacks.forEach((fallback) => this.clearFallbackTimer(fallback));

    const imagesChanged =
      previous.images.length !== next.images.length ||
      previous.images.some((image, index) => image !== next.images[index]);
    this.elements = next;
    if (imagesChanged) {
      this.imageBindings.forEach((binding, image) => {
        if (next.images.includes(image)) return;
        binding.abort();
        this.imageBindings.delete(image);
      });
      this.mutationObserver.disconnect();
      this.bindEvents();
      this.observeImages();
    }

    const status =
      previous.images[0] === next.images[0] && !sourceChanged
        ? this.imageLoadingStatus
        : this.readImageLoadingStatus();
    if (sourceChanged && status !== "loaded") this.restartFallbackDelay();
    if (status !== this.imageLoadingStatus) this.setImageLoadingStatus(status);
    else this.render();
  }

  subscribe(
    event: "loadingStatusChange",
    callback: (details: AvatarLoadingStatusChangeDetails) => void,
  ): () => void {
    if (event !== "loadingStatusChange") {
      throw new Error(`Unsupported Avatar event: ${event}`);
    }

    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  destroy(): void {
    if (this.destroyed) return;

    this.imageBindings.forEach((binding) => binding.abort());
    this.imageBindings.clear();
    this.mutationObserver.disconnect();
    this.clearFallbackTimers();
    this.subscribers.clear();
    instances.delete(this.root);
    this.destroyed = true;
  }

  private bindEvents(): void {
    this.elements.images.forEach((image) => {
      if (this.imageBindings.has(image)) return;
      const binding = new AbortController();
      this.imageBindings.set(image, binding);
      const { signal } = binding;
      image.addEventListener(
        "load",
        (event) => {
          if (isOwnedByRoot(image, this.root)) this.setImageLoadingStatus("loaded", { event });
        },
        { signal },
      );
      image.addEventListener(
        "error",
        (event) => {
          if (isOwnedByRoot(image, this.root)) this.setImageLoadingStatus("error", { event });
        },
        { signal },
      );
    });
  }

  private observeImages(): void {
    this.elements.images.forEach((image) => {
      this.mutationObserver.observe(image, {
        attributeFilter: ["crossorigin", "referrerpolicy", "sizes", "src", "srcset"],
        attributes: true,
      });
    });
  }

  private render(): void {
    const status = this.imageLoadingStatus;

    this.root.setAttribute(AVATAR_ROOT_ATTRIBUTE, "");
    this.root.setAttribute(AVATAR_LOADING_STATUS_ATTRIBUTE, status);

    this.updateFallbackTimers();

    this.elements.images.forEach((image) => {
      image.setAttribute(AVATAR_LOADING_STATUS_ATTRIBUTE, status);
      // `hidden` removes the image from layout, which can prevent a natively lazy-loaded image
      // from ever becoming eligible to load. Avatar owns visibility without removing the image's
      // layout box so framework image components can keep their native loading policy.
      image.hidden = false;
      image.style.visibility = status === "loaded" ? "visible" : "hidden";
    });

    this.elements.fallbacks.forEach((fallback) => {
      fallback.element.setAttribute(AVATAR_LOADING_STATUS_ATTRIBUTE, status);
      fallback.element.hidden = status === "loaded" || !fallback.delayPassed;
    });
  }

  private readImageLoadingStatus(): AvatarImageLoadingStatus {
    const image = this.elements.images[0];
    if (!image || !hasImageSource(image)) return "error";

    if (image.complete) {
      return image.naturalWidth > 0 ? "loaded" : "error";
    }

    return "loading";
  }

  private handleImageMutation(): void {
    const status = this.readImageLoadingStatus();
    const didRestartDelay = status !== "loaded" && this.restartFallbackDelay();

    if (status !== this.imageLoadingStatus) {
      this.setImageLoadingStatus(status);
      return;
    }

    if (didRestartDelay) {
      this.render();
    }
  }

  private resetFallbackDelayWhenNeeded(status: AvatarImageLoadingStatus): void {
    if (status !== "loaded") return;

    this.restartFallbackDelay();
  }

  private restartFallbackDelay(): boolean {
    let restarted = false;

    this.elements.fallbacks.forEach((fallback) => {
      if (fallback.delay !== undefined && fallback.delay > 0) {
        this.clearFallbackTimer(fallback);
        fallback.delayPassed = false;
        restarted = true;
      }
    });

    return restarted;
  }

  private updateFallbackTimers(): void {
    this.elements.fallbacks.forEach((fallback) => {
      if (fallback.delay === undefined || fallback.delay <= 0) {
        fallback.delayPassed = true;
        return;
      }

      if (this.imageLoadingStatus === "loaded") {
        this.clearFallbackTimer(fallback);
        return;
      }

      if (fallback.delayPassed || fallback.timeoutId !== undefined) return;

      fallback.timeoutId = window.setTimeout(() => {
        fallback.timeoutId = undefined;
        fallback.delayPassed = true;
        this.render();
      }, fallback.delay);
    });
  }

  private clearFallbackTimers(): void {
    this.elements.fallbacks.forEach((fallback) => this.clearFallbackTimer(fallback));
  }

  private clearFallbackTimer(fallback: AvatarFallback): void {
    if (fallback.timeoutId === undefined) return;

    window.clearTimeout(fallback.timeoutId);
    fallback.timeoutId = undefined;
  }

  private notify(details: AvatarLoadingStatusChangeDetails): void {
    dispatchCustomEvent(this.root, "starwind:loading-status-change", details);
    this.onLoadingStatusChange?.(details.status, details);
    this.subscribers.forEach((subscriber) => subscriber(details));
  }

  private notifyInitialLoadingStatus(): void {
    if (this.imageLoadingStatus === "idle") return;

    this.notify({
      previousStatus: "idle",
      status: this.imageLoadingStatus,
    });
  }
}

function hasImageSource(image: HTMLImageElement): boolean {
  return hasNonEmptyAttribute(image, "src") || hasNonEmptyAttribute(image, "srcset");
}

function getAvatarElements(root: HTMLElement): AvatarElements {
  return {
    fallbacks: Array.from(root.querySelectorAll<HTMLElement>(AVATAR_FALLBACK_SELECTOR))
      .filter((element) => isOwnedByRoot(element, root))
      .map((element) => ({
        delay: readNumberAttribute(element, AVATAR_FALLBACK_DELAY_ATTRIBUTE),
        delayPassed: !element.hasAttribute(AVATAR_FALLBACK_DELAY_ATTRIBUTE),
        element,
      })),
    images: Array.from(root.querySelectorAll<HTMLImageElement>(AVATAR_IMAGE_SELECTOR)).filter(
      (element) => isOwnedByRoot(element, root),
    ),
  };
}

function isOwnedByRoot(element: Element, root: HTMLElement): boolean {
  return element.closest(`[${AVATAR_ROOT_ATTRIBUTE}]`) === root;
}

function readNumberAttribute(element: HTMLElement, name: string): number | undefined {
  const value = element.getAttribute(name);
  if (value === null || value.trim() === "") return undefined;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function hasNonEmptyAttribute(element: HTMLElement, name: string): boolean {
  return (element.getAttribute(name) ?? "").trim() !== "";
}
