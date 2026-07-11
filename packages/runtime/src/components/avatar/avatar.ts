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

class AvatarController implements AvatarInstance {
  readonly root: HTMLElement;

  private readonly abortController = new AbortController();
  private readonly elements: AvatarElements;
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
    this.setImageLoadingStatus(this.readImageLoadingStatus());
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

    this.abortController.abort();
    this.mutationObserver.disconnect();
    this.clearFallbackTimers();
    this.subscribers.clear();
    instances.delete(this.root);
    this.destroyed = true;
  }

  private bindEvents(): void {
    const { signal } = this.abortController;

    this.elements.images.forEach((image) => {
      image.addEventListener(
        "load",
        (event) => {
          this.setImageLoadingStatus("loaded", { event });
        },
        { signal },
      );
      image.addEventListener(
        "error",
        (event) => {
          this.setImageLoadingStatus("error", { event });
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
      image.hidden = status !== "loaded";
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
