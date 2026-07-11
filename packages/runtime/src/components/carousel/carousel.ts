import type { EmblaCarouselType, EmblaOptionsType, EmblaPluginType } from "embla-carousel";
import EmblaCarousel from "embla-carousel";

import { assertHTMLElement } from "../../internal/dom";

export type CarouselOrientation = "horizontal" | "vertical";

export type CarouselOptions = {
  orientation?: CarouselOrientation;
  opts?: EmblaOptionsType;
  plugins?: EmblaPluginType[];
  setApi?: (api: EmblaCarouselType) => void;
};

export type CarouselInstance = {
  readonly api: EmblaCarouselType;
  readonly root: HTMLElement;
  readonly viewport: HTMLElement;
  canScrollNext(): boolean;
  canScrollPrev(): boolean;
  destroy(): void;
  reInit(options?: EmblaOptionsType, plugins?: EmblaPluginType[]): void;
  scrollNext(jump?: boolean): void;
  scrollPrev(jump?: boolean): void;
  scrollTo(index: number, jump?: boolean): void;
  selectedSnap(): number;
};

const CAROUSEL_ROOT_ATTRIBUTE = "data-sw-carousel";
const CAROUSEL_VIEWPORT_ATTRIBUTE = "data-sw-carousel-viewport";
const CAROUSEL_PREVIOUS_ATTRIBUTE = "data-sw-carousel-previous";
const CAROUSEL_NEXT_ATTRIBUTE = "data-sw-carousel-next";
const CAROUSEL_AXIS_ATTRIBUTE = "data-axis";
const CAROUSEL_OPTIONS_ATTRIBUTE = "data-opts";

const instances = new WeakMap<HTMLElement, CarouselController>();

export function createCarousel(root: HTMLElement, options: CarouselOptions = {}): CarouselInstance {
  assertHTMLElement(root, "createCarousel root");

  const existing = instances.get(root);
  if (existing) return existing;

  const instance = new CarouselController(root, options);
  instances.set(root, instance);
  return instance;
}

class CarouselController implements CarouselInstance {
  readonly api: EmblaCarouselType;
  readonly root: HTMLElement;
  readonly viewport: HTMLElement;

  private readonly abortController = new AbortController();
  private readonly nextButton: HTMLButtonElement | null;
  private readonly previousButton: HTMLButtonElement | null;
  private destroyed = false;

  constructor(root: HTMLElement, options: CarouselOptions) {
    this.root = root;
    this.root.setAttribute(CAROUSEL_ROOT_ATTRIBUTE, "");
    this.viewport = getRequiredOwnedElement(root, `[${CAROUSEL_VIEWPORT_ATTRIBUTE}]`, "viewport");
    this.previousButton = getOwnedElement(root, `[${CAROUSEL_PREVIOUS_ATTRIBUTE}]`);
    this.nextButton = getOwnedElement(root, `[${CAROUSEL_NEXT_ATTRIBUTE}]`);

    const emblaOptions = resolveEmblaOptions(root, options);
    this.root.setAttribute(CAROUSEL_AXIS_ATTRIBUTE, emblaOptions.axis === "y" ? "y" : "x");
    this.api = EmblaCarousel(this.viewport, emblaOptions, options.plugins);

    this.setupAccessibility();
    this.bindEvents();
    this.updateControls();
    options.setApi?.(this.api);
  }

  canScrollNext(): boolean {
    return this.api.canScrollNext();
  }

  canScrollPrev(): boolean {
    return this.api.canScrollPrev();
  }

  destroy(): void {
    if (this.destroyed) return;

    this.abortController.abort();
    this.api.off("select", this.updateControls);
    this.api.off("init", this.updateControls);
    this.api.off("reInit", this.updateControls);
    this.api.destroy();
    instances.delete(this.root);
    this.destroyed = true;
  }

  reInit(options?: EmblaOptionsType, plugins?: EmblaPluginType[]): void {
    this.api.reInit(options, plugins);
    const axis = options?.axis ?? this.api.internalEngine().options.axis;
    this.root.setAttribute(CAROUSEL_AXIS_ATTRIBUTE, axis === "y" ? "y" : "x");
    this.updateControls();
  }

  scrollNext(jump?: boolean): void {
    this.api.scrollNext(jump);
  }

  scrollPrev(jump?: boolean): void {
    this.api.scrollPrev(jump);
  }

  scrollTo(index: number, jump?: boolean): void {
    this.api.scrollTo(index, jump);
  }

  selectedSnap(): number {
    return this.api.selectedScrollSnap();
  }

  private setupAccessibility(): void {
    this.root.setAttribute("role", this.root.getAttribute("role") ?? "region");
    this.root.setAttribute(
      "aria-roledescription",
      this.root.getAttribute("aria-roledescription") ?? "carousel",
    );
  }

  private bindEvents(): void {
    const { signal } = this.abortController;

    this.previousButton?.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        this.api.scrollPrev();
      },
      { signal },
    );

    this.nextButton?.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        this.api.scrollNext();
      },
      { signal },
    );

    this.root.addEventListener("keydown", this.handleKeyDown, { signal });
    this.api.on("select", this.updateControls);
    this.api.on("init", this.updateControls);
    this.api.on("reInit", this.updateControls);
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const axis = this.root.getAttribute(CAROUSEL_AXIS_ATTRIBUTE) === "y" ? "y" : "x";

    if (axis === "y") {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        this.api.scrollPrev();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        this.api.scrollNext();
      }
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      this.api.scrollPrev();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      this.api.scrollNext();
    }
  };

  private readonly updateControls = (): void => {
    updateControl(this.previousButton, this.api.canScrollPrev());
    updateControl(this.nextButton, this.api.canScrollNext());
  };
}

function resolveEmblaOptions(root: HTMLElement, options: CarouselOptions): EmblaOptionsType {
  const axis = options.orientation
    ? orientationToAxis(options.orientation)
    : readAxisAttribute(root.getAttribute(CAROUSEL_AXIS_ATTRIBUTE));

  return {
    axis,
    ...readOptionsAttribute(root),
    ...options.opts,
  };
}

function readAxisAttribute(value: string | null): "x" | "y" {
  return value === "y" ? "y" : "x";
}

function orientationToAxis(orientation: CarouselOrientation): "x" | "y" {
  return orientation === "vertical" ? "y" : "x";
}

function readOptionsAttribute(root: HTMLElement): EmblaOptionsType {
  const value = root.getAttribute(CAROUSEL_OPTIONS_ATTRIBUTE);
  if (!value) return {};

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function updateControl(button: HTMLButtonElement | null, canScroll: boolean): void {
  if (!button) return;

  button.disabled = !canScroll;
  button.setAttribute("aria-disabled", String(!canScroll));
  button.toggleAttribute("data-disabled", !canScroll);
}

function getRequiredOwnedElement(root: HTMLElement, selector: string, name: string): HTMLElement {
  const element = getOwnedElement(root, selector);
  if (element) return element;

  throw new Error(`Carousel requires a [data-sw-carousel-${name}] element.`);
}

function getOwnedElement<T extends HTMLElement = HTMLElement>(
  root: HTMLElement,
  selector: string,
): T | null {
  return getOwnedElements<T>(root, selector)[0] ?? null;
}

function getOwnedElements<T extends HTMLElement = HTMLElement>(
  root: HTMLElement,
  selector: string,
): T[] {
  return Array.from(root.querySelectorAll<T>(selector)).filter((element) => {
    const owner = element.closest<HTMLElement>(`[${CAROUSEL_ROOT_ATTRIBUTE}]`);
    return owner === root;
  });
}
