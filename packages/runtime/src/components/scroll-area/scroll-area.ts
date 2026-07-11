import { assertHTMLElement, setBooleanAttribute } from "../../internal/dom";

export type ScrollAreaOrientation = "horizontal" | "vertical";

export type ScrollAreaOverflowEdgeThreshold =
  | number
  | Partial<{
      xEnd: number;
      xStart: number;
      yEnd: number;
      yStart: number;
    }>;

export type ScrollAreaOptions = {
  overflowEdgeThreshold?: ScrollAreaOverflowEdgeThreshold;
};

export type ScrollAreaInstance = {
  readonly root: HTMLElement;
  destroy(): void;
  refresh(): void;
};

type ScrollAxis = "x" | "y";
type ScrollEdge = "end" | "start";
type ScrollAreaOverflowEdgeThresholds = {
  xEnd: number;
  xStart: number;
  yEnd: number;
  yStart: number;
};
type ScrollAreaScrollAxes = {
  x: boolean;
  y: boolean;
};
type SpacingProperty = "margin" | "padding";

type ScrollAreaElements = {
  content?: HTMLElement;
  corner?: HTMLElement;
  scrollbars: HTMLElement[];
  viewport: HTMLElement;
};

const SCROLL_AREA_ROOT_ATTRIBUTE = "data-sw-scroll-area";
const SCROLL_AREA_ROOT_SELECTOR = `[${SCROLL_AREA_ROOT_ATTRIBUTE}]`;
const SCROLL_AREA_VIEWPORT_ATTRIBUTE = "data-sw-scroll-area-viewport";
const SCROLL_AREA_VIEWPORT_SELECTOR = `[${SCROLL_AREA_VIEWPORT_ATTRIBUTE}]`;
const SCROLL_AREA_CONTENT_ATTRIBUTE = "data-sw-scroll-area-content";
const SCROLL_AREA_CONTENT_SELECTOR = `[${SCROLL_AREA_CONTENT_ATTRIBUTE}]`;
const SCROLL_AREA_SCROLLBAR_ATTRIBUTE = "data-sw-scroll-area-scrollbar";
const SCROLL_AREA_SCROLLBAR_SELECTOR = `[${SCROLL_AREA_SCROLLBAR_ATTRIBUTE}]`;
const SCROLL_AREA_THUMB_ATTRIBUTE = "data-sw-scroll-area-thumb";
const SCROLL_AREA_THUMB_SELECTOR = `[${SCROLL_AREA_THUMB_ATTRIBUTE}]`;
const SCROLL_AREA_CORNER_ATTRIBUTE = "data-sw-scroll-area-corner";
const SCROLL_AREA_CORNER_SELECTOR = `[${SCROLL_AREA_CORNER_ATTRIBUTE}]`;
const SCROLL_AREA_KEEP_MOUNTED_ATTRIBUTE = "data-keep-mounted";
const SCROLL_AREA_ORIENTATION_ATTRIBUTE = "data-orientation";
const SCROLL_AREA_OVERFLOW_EDGE_THRESHOLD_ATTRIBUTE = "data-overflow-edge-threshold";
const SCROLL_AREA_OVERFLOW_EDGE_THRESHOLD_X_START_ATTRIBUTE =
  "data-overflow-edge-threshold-x-start";
const SCROLL_AREA_OVERFLOW_EDGE_THRESHOLD_X_END_ATTRIBUTE = "data-overflow-edge-threshold-x-end";
const SCROLL_AREA_OVERFLOW_EDGE_THRESHOLD_Y_START_ATTRIBUTE =
  "data-overflow-edge-threshold-y-start";
const SCROLL_AREA_OVERFLOW_EDGE_THRESHOLD_Y_END_ATTRIBUTE = "data-overflow-edge-threshold-y-end";
const SCROLL_AREA_HOVERING_ATTRIBUTE = "data-hovering";
const SCROLL_AREA_SCROLLING_ATTRIBUTE = "data-scrolling";

const DEFAULT_OVERFLOW_EDGE_THRESHOLD = 0;
const MIN_THUMB_SIZE = 20;

const instances = new WeakMap<HTMLElement, ScrollAreaController>();

export function createScrollArea(
  root: HTMLElement,
  options: ScrollAreaOptions = {},
): ScrollAreaInstance {
  assertHTMLElement(root, "createScrollArea root");

  const existing = instances.get(root);
  if (existing) return existing;

  const instance = new ScrollAreaController(root, options);
  instances.set(root, instance);
  return instance;
}

class ScrollAreaController implements ScrollAreaInstance {
  readonly root: HTMLElement;

  private readonly abortController = new AbortController();
  private readonly boundScrollbars = new WeakSet<HTMLElement>();
  private readonly boundThumbs = new WeakSet<HTMLElement>();
  private readonly boundViewports = new WeakSet<HTMLElement>();
  private readonly mutationObserver: MutationObserver;
  private readonly resizeObserver: ResizeObserver;
  private dragAbortController?: AbortController;
  private destroyed = false;
  private elements: ScrollAreaElements;
  private hovering = false;
  private readonly optionOverflowEdgeThreshold?: ScrollAreaOverflowEdgeThreshold;
  private overflowEdgeThreshold: ScrollAreaOverflowEdgeThresholds;
  private pendingUpdateFrame: number | undefined;
  private scrollAxes: ScrollAreaScrollAxes = { x: false, y: false };
  private scrollPosition: Record<ScrollAxis, number> = { x: 0, y: 0 };
  private scrollTimeout: number | undefined;

  constructor(root: HTMLElement, options: ScrollAreaOptions) {
    this.root = root;
    this.elements = getScrollAreaElements(root);
    this.optionOverflowEdgeThreshold = options.overflowEdgeThreshold;
    this.overflowEdgeThreshold = readOverflowEdgeThreshold(options.overflowEdgeThreshold, root);
    this.mutationObserver = new MutationObserver(() => this.refresh());
    this.resizeObserver = new ResizeObserver(() => this.updateSoon());

    this.bindEvents();
    this.setupObservers();
    this.updateSoon();
  }

  destroy(): void {
    if (this.destroyed) return;

    this.stopDragging();
    this.cancelPendingUpdate();
    this.abortController.abort();
    this.mutationObserver.disconnect();
    this.resizeObserver.disconnect();
    if (this.scrollTimeout !== undefined) {
      window.clearTimeout(this.scrollTimeout);
      this.scrollTimeout = undefined;
    }
    instances.delete(this.root);
    this.destroyed = true;
  }

  refresh(): void {
    this.elements = getScrollAreaElements(this.root);
    this.overflowEdgeThreshold = readOverflowEdgeThreshold(
      this.optionOverflowEdgeThreshold,
      this.root,
    );
    this.resizeObserver.disconnect();
    this.mutationObserver.disconnect();
    this.bindPartEvents();
    this.setupObservers();
    this.updateSoon();
  }

  private bindEvents(): void {
    this.root.addEventListener("pointerenter", this.handlePointerEnterOrMove, {
      signal: this.abortController.signal,
    });
    this.root.addEventListener("pointermove", this.handlePointerEnterOrMove, {
      signal: this.abortController.signal,
    });
    this.root.addEventListener("pointerleave", this.handlePointerLeave, {
      signal: this.abortController.signal,
    });
    this.bindPartEvents();
  }

  private bindPartEvents(): void {
    const { signal } = this.abortController;

    if (!this.boundViewports.has(this.elements.viewport)) {
      this.elements.viewport.addEventListener("scroll", this.handleScroll, {
        passive: true,
        signal,
      });
      this.boundViewports.add(this.elements.viewport);
    }

    for (const scrollbar of this.elements.scrollbars) {
      const thumb = getThumb(scrollbar);
      if (!thumb) continue;

      thumb.style.flex = "0 0 auto";
      thumb.setAttribute(SCROLL_AREA_ORIENTATION_ATTRIBUTE, getOrientation(scrollbar));

      if (!this.boundThumbs.has(thumb)) {
        thumb.addEventListener("pointerdown", this.handleThumbPointerDown, { signal });
        this.boundThumbs.add(thumb);
      }

      if (!this.boundScrollbars.has(scrollbar)) {
        scrollbar.addEventListener("pointerdown", this.handleScrollbarPointerDown, { signal });
        scrollbar.addEventListener("wheel", this.handleScrollbarWheel, {
          passive: false,
          signal,
        });
        this.boundScrollbars.add(scrollbar);
      }
    }

    this.setHoveringState(this.hovering);
    this.setScrollingState(this.scrollAxes.x || this.scrollAxes.y, this.scrollAxes);
  }

  private setupObservers(): void {
    this.resizeObserver.observe(this.root);
    this.resizeObserver.observe(this.elements.viewport);
    if (this.elements.content) {
      this.resizeObserver.observe(this.elements.content);
    }
    for (const scrollbar of this.elements.scrollbars) {
      this.resizeObserver.observe(scrollbar);
      const thumb = getThumb(scrollbar);
      if (thumb) this.resizeObserver.observe(thumb);
    }

    this.mutationObserver.observe(this.root, {
      characterData: true,
      childList: true,
      subtree: true,
    });
  }

  private updateSoon(): void {
    if (this.destroyed || this.pendingUpdateFrame !== undefined) return;

    this.pendingUpdateFrame = requestAnimationFrame(() => {
      this.pendingUpdateFrame = undefined;
      if (!this.destroyed) this.update();
    });
  }

  private updateNow(): void {
    this.cancelPendingUpdate();
    if (!this.destroyed) this.update();
  }

  private cancelPendingUpdate(): void {
    if (this.pendingUpdateFrame === undefined) return;

    cancelAnimationFrame(this.pendingUpdateFrame);
    this.pendingUpdateFrame = undefined;
  }

  private update(): void {
    const hasVerticalOverflow = this.hasOverflow("vertical");
    const hasHorizontalOverflow = this.hasOverflow("horizontal");
    let hasVerticalScrollbar = false;
    let hasHorizontalScrollbar = false;

    for (const scrollbar of this.elements.scrollbars) {
      const orientation = getOrientation(scrollbar);
      const thumb = getThumb(scrollbar);
      const isOverflowing =
        orientation === "horizontal" ? hasHorizontalOverflow : hasVerticalOverflow;
      const keepMounted = scrollbar.hasAttribute(SCROLL_AREA_KEEP_MOUNTED_ATTRIBUTE);

      if (orientation === "vertical") {
        hasVerticalScrollbar = true;
      } else {
        hasHorizontalScrollbar = true;
      }

      scrollbar.style.display = isOverflowing || keepMounted ? "flex" : "none";
      scrollbar.hidden = !isOverflowing && !keepMounted;
      scrollbar.setAttribute(SCROLL_AREA_ORIENTATION_ATTRIBUTE, orientation);

      if (!thumb) continue;

      thumb.setAttribute(SCROLL_AREA_ORIENTATION_ATTRIBUTE, orientation);
      thumb.hidden = !isOverflowing && !keepMounted;

      if (isOverflowing) {
        this.updateThumb(scrollbar, thumb, orientation);
      }
    }

    this.elements.viewport.tabIndex = hasVerticalOverflow || hasHorizontalOverflow ? 0 : -1;
    this.updateOverflowState(hasHorizontalOverflow, hasVerticalOverflow);
    this.updateLayout(
      hasVerticalOverflow && hasVerticalScrollbar,
      hasHorizontalOverflow && hasHorizontalScrollbar,
    );
  }

  private updateOverflowState(hasHorizontalOverflow: boolean, hasVerticalOverflow: boolean): void {
    const xPosition = this.getScrollPosition("horizontal");
    const xMax = this.getMaxScrollOffset("horizontal");
    const yPosition = this.getScrollPosition("vertical");
    const yMax = this.getMaxScrollOffset("vertical");
    const stateElements = [
      this.root,
      this.elements.viewport,
      ...(this.elements.content ? [this.elements.content] : []),
      ...this.elements.scrollbars,
    ];

    const states = {
      "data-has-overflow-x": hasHorizontalOverflow,
      "data-has-overflow-y": hasVerticalOverflow,
      "data-overflow-x-end":
        hasHorizontalOverflow && xMax - xPosition > this.overflowEdgeThreshold.xEnd,
      "data-overflow-x-start":
        hasHorizontalOverflow && xPosition > this.overflowEdgeThreshold.xStart,
      "data-overflow-y-end":
        hasVerticalOverflow && yMax - yPosition > this.overflowEdgeThreshold.yEnd,
      "data-overflow-y-start": hasVerticalOverflow && yPosition > this.overflowEdgeThreshold.yStart,
    };

    for (const element of stateElements) {
      for (const [attribute, value] of Object.entries(states)) {
        setBooleanAttribute(element, attribute, value);
      }
    }

    this.setOverflowVariable("x", "start", hasHorizontalOverflow, xPosition);
    this.setOverflowVariable("x", "end", hasHorizontalOverflow, xMax - xPosition);
    this.setOverflowVariable("y", "start", hasVerticalOverflow, yPosition);
    this.setOverflowVariable("y", "end", hasVerticalOverflow, yMax - yPosition);
  }

  private setOverflowVariable(
    axis: ScrollAxis,
    edge: ScrollEdge,
    hasOverflow: boolean,
    value: number,
  ): void {
    const property = `--scroll-area-overflow-${axis}-${edge}`;

    if (!hasOverflow) {
      this.root.style.removeProperty(property);
      this.elements.viewport.style.removeProperty(property);
      return;
    }

    const propertyValue = `${Math.max(value, 0)}px`;

    this.root.style.setProperty(property, propertyValue);
    this.elements.viewport.style.setProperty(property, propertyValue);
  }

  private updateLayout(hasVerticalScrollbar: boolean, hasHorizontalScrollbar: boolean): void {
    const verticalScrollbar = this.getScrollbar("vertical");
    const horizontalScrollbar = this.getScrollbar("horizontal");
    const shouldShowCorner = Boolean(
      hasVerticalScrollbar && hasHorizontalScrollbar && verticalScrollbar && horizontalScrollbar,
    );

    if (this.elements.corner) {
      this.elements.corner.style.display = shouldShowCorner ? "block" : "none";

      if (shouldShowCorner && verticalScrollbar && horizontalScrollbar) {
        const cornerWidth = verticalScrollbar.offsetWidth;
        const cornerHeight = horizontalScrollbar.offsetHeight;

        this.elements.corner.style.width = `${cornerWidth}px`;
        this.elements.corner.style.height = `${cornerHeight}px`;
        this.root.style.setProperty("--scroll-area-corner-width", `${cornerWidth}px`);
        this.root.style.setProperty("--scroll-area-corner-height", `${cornerHeight}px`);
      } else {
        this.elements.corner.style.width = "";
        this.elements.corner.style.height = "";
        this.root.style.setProperty("--scroll-area-corner-width", "0px");
        this.root.style.setProperty("--scroll-area-corner-height", "0px");
      }
    } else {
      this.root.style.setProperty("--scroll-area-corner-width", "0px");
      this.root.style.setProperty("--scroll-area-corner-height", "0px");
    }

    if (verticalScrollbar) {
      verticalScrollbar.style.bottom =
        shouldShowCorner && horizontalScrollbar ? `${horizontalScrollbar.offsetHeight}px` : "";
    }

    if (horizontalScrollbar) {
      horizontalScrollbar.style.insetInlineEnd =
        shouldShowCorner && verticalScrollbar ? `${verticalScrollbar.offsetWidth}px` : "";
    }
  }

  private updateThumb(
    scrollbar: HTMLElement,
    thumb: HTMLElement,
    orientation: ScrollAreaOrientation,
  ): void {
    const isHorizontal = orientation === "horizontal";
    const { maxScrollOffset, maxThumbOffset, thumbSize } = this.getThumbMetrics(
      scrollbar,
      thumb,
      orientation,
    );
    const scrollPosition = this.getScrollPosition(orientation);
    const thumbOffset =
      maxScrollOffset === 0 ? 0 : (scrollPosition / maxScrollOffset) * maxThumbOffset;

    if (isHorizontal) {
      scrollbar.style.setProperty("--scroll-area-thumb-width", `${thumbSize}px`);
      thumb.style.width = `${thumbSize}px`;
      thumb.style.height = "100%";
      thumb.style.transform = `translateX(${this.isRtl() ? -thumbOffset : thumbOffset}px)`;
      return;
    }

    scrollbar.style.setProperty("--scroll-area-thumb-height", `${thumbSize}px`);
    thumb.style.height = `${thumbSize}px`;
    thumb.style.width = "100%";
    thumb.style.transform = `translateY(${thumbOffset}px)`;
  }

  private readonly handleScroll = (): void => {
    const nextScrollPosition = {
      x: this.getScrollPosition("horizontal"),
      y: this.getScrollPosition("vertical"),
    };
    const nextScrollAxes = {
      x: nextScrollPosition.x !== this.scrollPosition.x,
      y: nextScrollPosition.y !== this.scrollPosition.y,
    };

    this.scrollPosition = nextScrollPosition;
    this.scrollAxes = {
      x: this.scrollAxes.x || nextScrollAxes.x,
      y: this.scrollAxes.y || nextScrollAxes.y,
    };
    this.setScrollingState(true, this.scrollAxes);

    if (this.scrollTimeout !== undefined) {
      window.clearTimeout(this.scrollTimeout);
    }
    this.scrollTimeout = window.setTimeout(() => {
      this.scrollAxes = { x: false, y: false };
      this.setScrollingState(false, this.scrollAxes);
      this.scrollTimeout = undefined;
    }, 120);
    this.updateSoon();
  };

  private readonly handlePointerEnterOrMove = (event: PointerEvent): void => {
    if (event.pointerType === "touch") return;

    this.setHoveringState(true);
  };

  private readonly handlePointerLeave = (): void => {
    this.setHoveringState(false);
  };

  private setHoveringState(hovering: boolean): void {
    this.hovering = hovering;

    for (const scrollbar of this.elements.scrollbars) {
      const thumb = getThumb(scrollbar);

      setBooleanAttribute(scrollbar, SCROLL_AREA_HOVERING_ATTRIBUTE, hovering);

      if (thumb) {
        setBooleanAttribute(thumb, SCROLL_AREA_HOVERING_ATTRIBUTE, hovering);
      }
    }
  }

  private setScrollingState(scrolling: boolean, axes: ScrollAreaScrollAxes): void {
    const isScrolling = scrolling && (axes.x || axes.y);
    const generalStateElements = [
      this.root,
      this.elements.viewport,
      ...(this.elements.content ? [this.elements.content] : []),
    ];

    for (const element of generalStateElements) {
      setBooleanAttribute(element, SCROLL_AREA_SCROLLING_ATTRIBUTE, isScrolling);
    }

    for (const scrollbar of this.elements.scrollbars) {
      const axis = getOrientation(scrollbar) === "horizontal" ? "x" : "y";
      const axisScrolling = scrolling && axes[axis];
      const thumb = getThumb(scrollbar);

      setBooleanAttribute(scrollbar, SCROLL_AREA_SCROLLING_ATTRIBUTE, axisScrolling);

      if (thumb) {
        setBooleanAttribute(thumb, SCROLL_AREA_SCROLLING_ATTRIBUTE, axisScrolling);
      }
    }
  }

  private readonly handleScrollbarPointerDown = (event: PointerEvent): void => {
    const scrollbar = event.currentTarget;
    if (!(scrollbar instanceof HTMLElement)) return;

    const thumb = getThumb(scrollbar);
    if (
      !thumb ||
      event.button !== 0 ||
      isNonPrimaryPointer(event) ||
      thumb.contains(event.target as Node)
    ) {
      return;
    }

    event.preventDefault();
    const orientation = getOrientation(scrollbar);
    const isHorizontal = orientation === "horizontal";
    const rect = scrollbar.getBoundingClientRect();
    const scrollbarPadding = getPhysicalSpacing(scrollbar, "padding", orientation);
    const thumbMargin = getPhysicalSpacing(thumb, "margin", orientation);
    const pointerPosition = isHorizontal
      ? this.isRtl()
        ? rect.right - event.clientX - scrollbarPadding.end - thumbMargin.end
        : event.clientX - rect.left - scrollbarPadding.start - thumbMargin.start
      : event.clientY - rect.top - scrollbarPadding.start - thumbMargin.start;
    const { maxScrollOffset, maxThumbOffset, thumbSize } = this.getThumbMetrics(
      scrollbar,
      thumb,
      orientation,
    );

    if (maxThumbOffset === 0) return;

    const nextThumbOffset = clamp(pointerPosition - thumbSize / 2, 0, maxThumbOffset);
    const nextScrollPosition = (nextThumbOffset / maxThumbOffset) * maxScrollOffset;

    this.setScrollPosition(orientation, nextScrollPosition);
  };

  private readonly handleScrollbarWheel = (event: WheelEvent): void => {
    const scrollbar = event.currentTarget;
    if (!(scrollbar instanceof HTMLElement)) return;

    const orientation = getOrientation(scrollbar);
    const isHorizontal = orientation === "horizontal";

    if (event.ctrlKey || !this.hasOverflow(orientation)) return;

    const delta = isHorizontal ? event.deltaX || event.deltaY : event.deltaY;
    if (delta === 0) return;

    const scrollProperty = isHorizontal ? "scrollLeft" : "scrollTop";
    const maxScrollOffset = this.getMaxScrollOffset(orientation);
    const minScroll = isHorizontal && this.isRtl() ? -maxScrollOffset : 0;
    const maxScroll = isHorizontal && this.isRtl() ? 0 : maxScrollOffset;
    const scrollPosition = this.elements.viewport[scrollProperty];
    const nextScrollPosition = clamp(scrollPosition + delta, minScroll, maxScroll);

    if (nextScrollPosition === scrollPosition) return;

    event.preventDefault();
    this.elements.viewport[scrollProperty] = nextScrollPosition;
    this.updateSoon();
  };

  private readonly handleThumbPointerDown = (event: PointerEvent): void => {
    const thumb = event.currentTarget;
    if (!(thumb instanceof HTMLElement) || event.button !== 0 || isNonPrimaryPointer(event)) return;

    const scrollbar = thumb.closest<HTMLElement>(SCROLL_AREA_SCROLLBAR_SELECTOR);
    if (!scrollbar || scrollbar.closest(SCROLL_AREA_ROOT_SELECTOR) !== this.root) return;

    event.preventDefault();

    const orientation = getOrientation(scrollbar);
    const isHorizontal = orientation === "horizontal";
    const startPointerPosition = isHorizontal ? event.clientX : event.clientY;
    const startScrollPosition = this.getScrollPosition(orientation);
    const { maxScrollOffset, maxThumbOffset } = this.getThumbMetrics(scrollbar, thumb, orientation);

    if (maxThumbOffset === 0) return;

    setPointerCapture(thumb, event.pointerId);
    this.stopDragging();

    this.dragAbortController = new AbortController();
    const signal = this.dragAbortController.signal;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const pointerPosition = isHorizontal ? moveEvent.clientX : moveEvent.clientY;
      const delta =
        isHorizontal && this.isRtl()
          ? startPointerPosition - pointerPosition
          : pointerPosition - startPointerPosition;
      const nextScrollPosition = startScrollPosition + (delta / maxThumbOffset) * maxScrollOffset;

      this.setScrollPosition(orientation, nextScrollPosition);
    };

    const handlePointerEnd = (endEvent: PointerEvent) => {
      releasePointerCapture(thumb, endEvent.pointerId);
      this.stopDragging();
    };

    document.addEventListener("pointermove", handlePointerMove, { signal });
    document.addEventListener("pointerup", handlePointerEnd, { signal });
    document.addEventListener("pointercancel", handlePointerEnd, { signal });
  };

  private stopDragging(): void {
    this.dragAbortController?.abort();
    this.dragAbortController = undefined;
  }

  private hasOverflow(orientation: ScrollAreaOrientation): boolean {
    if (orientation === "horizontal") {
      return this.elements.viewport.scrollWidth > this.elements.viewport.clientWidth + 1;
    }

    return this.elements.viewport.scrollHeight > this.elements.viewport.clientHeight + 1;
  }

  private isRtl(): boolean {
    return getComputedStyle(this.elements.viewport).direction === "rtl";
  }

  private getScrollbar(orientation: ScrollAreaOrientation): HTMLElement | undefined {
    return this.elements.scrollbars.find((scrollbar) => getOrientation(scrollbar) === orientation);
  }

  private getScrollSize(orientation: ScrollAreaOrientation): number {
    return orientation === "horizontal"
      ? this.elements.viewport.scrollWidth
      : this.elements.viewport.scrollHeight;
  }

  private getViewportSize(orientation: ScrollAreaOrientation): number {
    return orientation === "horizontal"
      ? this.elements.viewport.clientWidth
      : this.elements.viewport.clientHeight;
  }

  private getMaxScrollOffset(orientation: ScrollAreaOrientation): number {
    return Math.max(this.getScrollSize(orientation) - this.getViewportSize(orientation), 0);
  }

  private getScrollPosition(orientation: ScrollAreaOrientation): number {
    const maxScrollOffset = this.getMaxScrollOffset(orientation);

    if (orientation === "horizontal") {
      return clamp(
        this.isRtl() ? -this.elements.viewport.scrollLeft : this.elements.viewport.scrollLeft,
        0,
        maxScrollOffset,
      );
    }

    return clamp(this.elements.viewport.scrollTop, 0, maxScrollOffset);
  }

  private setScrollPosition(orientation: ScrollAreaOrientation, position: number): void {
    const nextPosition = clamp(position, 0, this.getMaxScrollOffset(orientation));

    if (orientation === "horizontal") {
      this.elements.viewport.scrollLeft = this.isRtl() ? -nextPosition : nextPosition;
    } else {
      this.elements.viewport.scrollTop = nextPosition;
    }

    this.updateNow();
  }

  private getThumbMetrics(
    scrollbar: HTMLElement,
    thumb: HTMLElement,
    orientation: ScrollAreaOrientation,
  ) {
    const axis = orientation === "horizontal" ? "x" : "y";
    const isHorizontal = orientation === "horizontal";
    const viewportSize = this.getViewportSize(orientation);
    const scrollSize = this.getScrollSize(orientation);
    const scrollbarSize = isHorizontal ? scrollbar.clientWidth : scrollbar.clientHeight;
    const scrollbarPadding = getSpacing(scrollbar, "padding", axis);
    const thumbMargin = getSpacing(thumb, "margin", axis);
    const trackSize = Math.max(scrollbarSize - scrollbarPadding - thumbMargin, 0);
    const thumbSize =
      trackSize > 0
        ? Math.min(Math.max((viewportSize / scrollSize) * trackSize, MIN_THUMB_SIZE), trackSize)
        : 0;
    const maxThumbOffset = Math.max(trackSize - thumbSize, 0);
    const maxScrollOffset = Math.max(scrollSize - viewportSize, 0);

    return {
      maxScrollOffset,
      maxThumbOffset,
      thumbSize,
    };
  }
}

function getScrollAreaElements(root: HTMLElement): ScrollAreaElements {
  const viewport = queryOwnElements(root, SCROLL_AREA_VIEWPORT_SELECTOR)[0];
  if (!viewport) {
    throw new Error("ScrollArea requires a viewport element.");
  }

  return {
    content: queryOwnElements(root, SCROLL_AREA_CONTENT_SELECTOR)[0],
    corner: queryOwnElements(root, SCROLL_AREA_CORNER_SELECTOR)[0],
    scrollbars: queryOwnElements(root, SCROLL_AREA_SCROLLBAR_SELECTOR),
    viewport,
  };
}

function queryOwnElements(root: HTMLElement, selector: string): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
    (element) => element.closest(SCROLL_AREA_ROOT_SELECTOR) === root,
  );
}

function getThumb(scrollbar: HTMLElement): HTMLElement | undefined {
  return Array.from(scrollbar.querySelectorAll<HTMLElement>(SCROLL_AREA_THUMB_SELECTOR)).find(
    (thumb) => thumb.closest(SCROLL_AREA_SCROLLBAR_SELECTOR) === scrollbar,
  );
}

function getOrientation(scrollbar: HTMLElement): ScrollAreaOrientation {
  return scrollbar.getAttribute(SCROLL_AREA_ORIENTATION_ATTRIBUTE) === "horizontal"
    ? "horizontal"
    : "vertical";
}

function readOverflowEdgeThreshold(
  value: ScrollAreaOverflowEdgeThreshold | undefined,
  element: HTMLElement,
): ScrollAreaOverflowEdgeThresholds {
  if (typeof value === "number") return createOverflowEdgeThresholds(value);

  if (value && typeof value === "object") {
    return createOverflowEdgeThresholds(DEFAULT_OVERFLOW_EDGE_THRESHOLD, value);
  }

  const sharedAttributeValue = readFiniteAttribute(
    element,
    SCROLL_AREA_OVERFLOW_EDGE_THRESHOLD_ATTRIBUTE,
  );
  const sharedThreshold = sharedAttributeValue ?? DEFAULT_OVERFLOW_EDGE_THRESHOLD;

  return createOverflowEdgeThresholds(sharedThreshold, {
    xEnd: readFiniteAttribute(element, SCROLL_AREA_OVERFLOW_EDGE_THRESHOLD_X_END_ATTRIBUTE),
    xStart: readFiniteAttribute(element, SCROLL_AREA_OVERFLOW_EDGE_THRESHOLD_X_START_ATTRIBUTE),
    yEnd: readFiniteAttribute(element, SCROLL_AREA_OVERFLOW_EDGE_THRESHOLD_Y_END_ATTRIBUTE),
    yStart: readFiniteAttribute(element, SCROLL_AREA_OVERFLOW_EDGE_THRESHOLD_Y_START_ATTRIBUTE),
  });
}

function createOverflowEdgeThresholds(
  sharedValue: number,
  edgeValues: Partial<ScrollAreaOverflowEdgeThresholds> = {},
): ScrollAreaOverflowEdgeThresholds {
  const sharedThreshold = normalizeThresholdValue(sharedValue);

  return {
    xEnd: normalizeThresholdValue(edgeValues.xEnd ?? sharedThreshold),
    xStart: normalizeThresholdValue(edgeValues.xStart ?? sharedThreshold),
    yEnd: normalizeThresholdValue(edgeValues.yEnd ?? sharedThreshold),
    yStart: normalizeThresholdValue(edgeValues.yStart ?? sharedThreshold),
  };
}

function readFiniteAttribute(element: HTMLElement, attribute: string): number | undefined {
  const rawValue = element.getAttribute(attribute);
  if (rawValue === null) return undefined;

  const value = Number(rawValue);
  return Number.isFinite(value) ? value : undefined;
}

function normalizeThresholdValue(value: number): number {
  return Number.isFinite(value) ? Math.max(value, 0) : DEFAULT_OVERFLOW_EDGE_THRESHOLD;
}

function getPhysicalSpacing(
  element: Element,
  property: SpacingProperty,
  orientation: ScrollAreaOrientation,
) {
  const styles = getComputedStyle(element);

  if (orientation === "horizontal") {
    return {
      end: parseCssPixelValue(styles.getPropertyValue(`${property}-right`)),
      start: parseCssPixelValue(styles.getPropertyValue(`${property}-left`)),
    };
  }

  return {
    end: parseCssPixelValue(styles.getPropertyValue(`${property}-bottom`)),
    start: parseCssPixelValue(styles.getPropertyValue(`${property}-top`)),
  };
}

function getSpacing(element: Element | null, property: SpacingProperty, axis: ScrollAxis): number {
  if (!element) return 0;

  const styles = getComputedStyle(element);

  if (axis === "x" && property === "margin") {
    return parseCssPixelValue(styles.getPropertyValue("margin-inline-start")) * 2;
  }

  const propertyAxis = axis === "x" ? "inline" : "block";

  return (
    parseCssPixelValue(styles.getPropertyValue(`${property}-${propertyAxis}-start`)) +
    parseCssPixelValue(styles.getPropertyValue(`${property}-${propertyAxis}-end`))
  );
}

function parseCssPixelValue(value: string): number {
  const parsed = Number.parseFloat(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function setPointerCapture(element: HTMLElement, pointerId: number): void {
  if (!pointerId || !element.setPointerCapture) return;

  try {
    element.setPointerCapture(pointerId);
  } catch {
    // Pointer capture can fail for synthetic or already-ended pointers.
  }
}

function releasePointerCapture(element: HTMLElement, pointerId: number): void {
  if (!pointerId || !element.releasePointerCapture) return;

  try {
    if (!element.hasPointerCapture || element.hasPointerCapture(pointerId)) {
      element.releasePointerCapture(pointerId);
    }
  } catch {
    // Releasing an inactive pointer capture is harmless.
  }
}

function isNonPrimaryPointer(event: PointerEvent): boolean {
  return event.isPrimary === false && event.pointerType !== "" && event.pointerType !== "mouse";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
