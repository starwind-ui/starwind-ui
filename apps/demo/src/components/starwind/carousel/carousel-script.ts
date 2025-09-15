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
  // don't re-initialize if already initialized
  if (carouselElement.dataset.initialized === "true") return null;
  carouselElement.dataset.initialized = "true";

  if (!carouselElement) {
    console.warn("Carousel element not found");
    return null;
  }

  // Find content element - Embla expects the viewport element, not the container
  const viewportElement = carouselElement.querySelector(
    '[data-slot="carousel-content"]',
  ) as HTMLElement;
  if (!viewportElement) {
    console.warn("Carousel content element not found");
    return null;
  }

  // Get configuration from data attributes
  const axisData = carouselElement.dataset.axis;
  const axis: EmblaOptionsType["axis"] = axisData === "y" ? "y" : "x";

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
  if (!dataOpts || typeof dataOpts !== "object") {
    dataOpts = {};
  }

  // Merge options - ensure we always have a valid object
  const emblaOptions: EmblaOptionsType = {
    axis,
    ...dataOpts,
    ...(options.opts || {}),
  };

  // Handle plugins - EmblaCarousel expects undefined when no plugins, not empty array
  const plugins = options.plugins && options.plugins.length > 0 ? options.plugins : undefined;

  // console.log("ID:", carouselElement.id);
  // console.log("Plugins:", plugins);
  // console.log("Options:", emblaOptions);

  // Find navigation buttons
  const prevButton = carouselElement.querySelector(
    '[data-slot="carousel-previous"]',
  ) as HTMLButtonElement;
  const nextButton = carouselElement.querySelector(
    '[data-slot="carousel-next"]',
  ) as HTMLButtonElement;

  // Initialize Embla
  let emblaApi: EmblaCarouselType;
  if (plugins) {
    emblaApi = EmblaCarousel(viewportElement, emblaOptions, plugins);
  } else {
    emblaApi = EmblaCarousel(viewportElement, emblaOptions);
  }

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

  // Event handlers for cleanup
  const prevClickHandler = () => emblaApi.scrollPrev();
  const nextClickHandler = () => emblaApi.scrollNext();
  const keydownHandler = (event: KeyboardEvent) => {
    if (axis === "y") {
      // Vertical axis: ArrowUp = previous, ArrowDown = next
      if (event.key === "ArrowUp") {
        event.preventDefault();
        emblaApi.scrollPrev();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        emblaApi.scrollNext();
      }
    } else {
      // Horizontal axis (default): ArrowLeft = previous, ArrowRight = next
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        emblaApi.scrollPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        emblaApi.scrollNext();
      }
    }
  };

  // Setup event listeners
  const setupEventListeners = () => {
    // Navigation button listeners
    prevButton?.addEventListener("click", prevClickHandler);
    nextButton?.addEventListener("click", nextClickHandler);

    // Keyboard navigation
    carouselElement.addEventListener("keydown", keydownHandler);
  };

  // Setup user API callback
  const setupUserCallbacks = () => {
    if (options.setApi) {
      options.setApi(emblaApi);
    }
  };

  // Initialize everything
  updateButtons();
  setupEventListeners();
  setupUserCallbacks();

  // Setup internal event listeners
  emblaApi.on("select", updateButtons);
  emblaApi.on("init", () => {
    updateButtons();
  });
  emblaApi.on("reInit", () => {
    updateButtons();
  });

  // Return manager interface
  return {
    api: emblaApi,
    scrollPrev: () => emblaApi.scrollPrev(),
    scrollNext: () => emblaApi.scrollNext(),
    canScrollPrev: () => emblaApi.canScrollPrev(),
    canScrollNext: () => emblaApi.canScrollNext(),
    destroy: () => {
      // Remove event listeners to prevent memory leaks
      if (prevButton) {
        prevButton.removeEventListener("click", prevClickHandler);
      }
      if (nextButton) {
        nextButton.removeEventListener("click", nextClickHandler);
      }
      carouselElement.removeEventListener("keydown", keydownHandler);

      // Destroy the Embla instance
      emblaApi.destroy();
    },
  };
}
