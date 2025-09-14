import EmblaCarousel, {
  type EmblaCarouselType,
  type EmblaEventType,
  type EmblaOptionsType,
  type EmblaPluginType,
} from "embla-carousel";

export type CarouselApi = EmblaCarouselType;

export interface CarouselOptions {
  opts?: EmblaOptionsType;
  plugins?: EmblaPluginType[];
  setApi?: (api: CarouselApi) => void;
}

export interface CarouselManager {
  api: CarouselApi;
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: () => boolean;
  canScrollNext: () => boolean;
  destroy: () => void;
}

export function initCarousel(
  carouselElement: HTMLElement,
  options: CarouselOptions = {},
): CarouselManager | null {
  // Find content element - Embla expects the viewport element, not the container
  const viewportElement = carouselElement.querySelector(
    '[data-slot="carousel-content"]',
  ) as HTMLElement;
  if (!viewportElement) {
    console.warn("Carousel content element not found");
    return null;
  }

  // Get configuration from data attributes
  const orientation = carouselElement.dataset.orientation || "horizontal";
  
  // Safely parse data options
  let dataOpts = {};
  try {
    const optsString = carouselElement.dataset.opts;
    if (optsString && optsString !== "undefined" && optsString !== "null") {
      dataOpts = JSON.parse(optsString);
    }
  } catch (e) {
    console.warn("Failed to parse carousel opts:", e);
    dataOpts = {};
  }

  // Ensure dataOpts is a valid object
  if (!dataOpts || typeof dataOpts !== 'object') {
    dataOpts = {};
  }

  // Merge options - ensure we always have a valid object
  const emblaOptions: EmblaOptionsType = {
    axis: orientation === "horizontal" ? "x" : "y",
    ...dataOpts,
    ...(options.opts || {}),
  };

  // Handle plugins - EmblaCarousel expects undefined when no plugins, not empty array
  const plugins = options.plugins && options.plugins.length > 0 ? options.plugins : undefined;
  
  // Initialize Embla
  const emblaApi = EmblaCarousel(viewportElement, emblaOptions, plugins);

  // Find navigation buttons
  const prevButton = carouselElement.querySelector(
    '[data-slot="carousel-previous"]',
  ) as HTMLButtonElement;
  const nextButton = carouselElement.querySelector(
    '[data-slot="carousel-next"]',
  ) as HTMLButtonElement;

  // Update button states
  const updateButtons = () => {
    const canScrollPrev = emblaApi.canScrollPrev();
    const canScrollNext = emblaApi.canScrollNext();

    if (prevButton) {
      prevButton.disabled = !canScrollPrev;
      prevButton.setAttribute("aria-disabled", (!canScrollPrev).toString());
    }

    if (nextButton) {
      nextButton.disabled = !canScrollNext;
      nextButton.setAttribute("aria-disabled", (!canScrollNext).toString());
    }
  };

  // Update orientation classes
  const updateOrientationClasses = () => {
    const orientationValue = orientation === "horizontal" ? "x" : "y";

    // Set data-orientation attribute on all relevant elements
    const container = carouselElement.querySelector('[data-slot="carousel-container"]');
    if (container) {
      container.setAttribute("data-orientation", orientationValue);
    }

    const items = carouselElement.querySelectorAll('[data-slot="carousel-item"]');
    items.forEach((item) => {
      item.setAttribute("data-orientation", orientationValue);
    });

    if (prevButton) {
      prevButton.setAttribute("data-orientation", orientationValue);
    }

    if (nextButton) {
      nextButton.setAttribute("data-orientation", orientationValue);
    }
  };

  // Setup event listeners
  const setupEventListeners = () => {
    // Navigation button listeners
    prevButton?.addEventListener("click", () => emblaApi.scrollPrev());
    nextButton?.addEventListener("click", () => emblaApi.scrollNext());

    // Keyboard navigation
    carouselElement.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        emblaApi.scrollPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        emblaApi.scrollNext();
      }
    });
  };

  // Setup user API callback
  const setupUserCallbacks = () => {
    if (options.setApi) {
      options.setApi(emblaApi);
    }
  };

  // Initialize everything
  setupEventListeners();
  setupUserCallbacks();
  updateButtons();
  updateOrientationClasses();

  // Setup internal event listeners
  emblaApi.on("select", updateButtons);
  emblaApi.on("reInit", () => {
    updateButtons();
    updateOrientationClasses();
  });

  // Return manager interface
  return {
    api: emblaApi,
    scrollPrev: () => emblaApi.scrollPrev(),
    scrollNext: () => emblaApi.scrollNext(),
    canScrollPrev: () => emblaApi.canScrollPrev(),
    canScrollNext: () => emblaApi.canScrollNext(),
    destroy: () => emblaApi.destroy(),
  };
}
