import {
  arrow,
  autoUpdate,
  computePosition,
  detectOverflow,
  flip,
  limitShift,
  type Middleware,
  offset,
  type Placement,
  type ReferenceElement,
  type Strategy,
  shift,
  size,
} from "@floating-ui/dom";
import { type Direction, readDirection } from "./direction";

export {
  type ResolveFloatingPortalTargetOptions,
  resolveFloatingPortalOwner,
  resolveFloatingPortalTarget,
  resolveFloatingPortalTargetOwner,
} from "./portal-target-policy";

export type FloatingAlign = "center" | "end" | "start";
export type FloatingCollisionStrategy = "best-fit" | "initial-placement";
export type FloatingSide = "bottom" | "left" | "right" | "top";

export type FloatingOptions = {
  align: FloatingAlign;
  alignOffset?: number;
  avoidCollisions?: boolean;
  collisionStrategy?: FloatingCollisionStrategy;
  /** True locks alignment; "side" permits limited alignment-axis shifting. */
  preserveAnchor?: boolean | "side";
  side: FloatingSide;
  sideOffset?: number;
  strategy?: Strategy;
  viewportPadding?: number;
};

export type FloatingPlacementState = {
  align: FloatingAlign;
  left: number;
  side: FloatingSide;
  top: number;
};

export type FloatingPositionerOptions = {
  adaptiveOrigin?: boolean;
  arrow?: HTMLElement | null;
  floating: HTMLElement;
  getApplyRevision?: () => unknown;
  getOptions: () => FloatingOptions;
  /** An owner can supply a side independently of the resolved data-side on the popup. */
  getSideIntent?: () => FloatingSide;
  placementStateElements?: HTMLElement[];
  reference: ReferenceElement;
};

export type FloatingPositioner = {
  destroy(): void;
  startAutoUpdate(options?: FloatingAutoUpdateOptions): void;
  stopAutoUpdate(): void;
  update(): Promise<FloatingPlacementState>;
};

export type FloatingAutoUpdateOptions = {
  onUpdated?: (state: FloatingPlacementState) => void;
  onUpdate?: () => void;
};
// Keeps an arrow off the rounded corners of the popup.
const FLOATING_ARROW_PADDING = 6;
const FLOATING_AVAILABLE_HEIGHT_PROPERTY = "--sw-floating-available-height";
const FLOATING_AVAILABLE_WIDTH_PROPERTY = "--sw-floating-available-width";

export function createFloatingPositioner(options: FloatingPositionerOptions): FloatingPositioner {
  let applyRevision = 0;
  let cleanupAutoUpdate: (() => void) | null = null;
  let destroyed = false;
  let requestedPlacement: Pick<FloatingOptions, "align" | "side"> | null = null;
  let requestedDirection: Direction | null = null;
  let resolvedPlacement: Pick<FloatingOptions, "align" | "side"> | null = null;

  const executeUpdate = async () => {
    const stableApplyRevision = ++applyRevision;
    const stableConsumerRevision = options.getApplyRevision?.();
    const canApply = () =>
      !destroyed &&
      applyRevision === stableApplyRevision &&
      (!options.getApplyRevision || Object.is(stableConsumerRevision, options.getApplyRevision()));
    const state = await updateFloatingPosition({
      ...options,
      canApply,
      getOptions: () => {
        const nextOptions = options.getOptions();
        const direction = readDirection(options.floating);
        const defaultsChanged =
          resolvedPlacement !== null &&
          (nextOptions.align !== resolvedPlacement.align ||
            nextOptions.side !== resolvedPlacement.side);
        if (!requestedPlacement || (requestedDirection !== direction && defaultsChanged)) {
          requestedPlacement = {
            align: nextOptions.align,
            side: nextOptions.side,
          };
        }
        requestedDirection = direction;

        return {
          ...nextOptions,
          align: requestedPlacement.align,
          side: options.getSideIntent?.() ?? requestedPlacement.side,
        };
      },
    });
    if (canApply()) resolvedPlacement = { align: state.align, side: state.side };
    return { applied: canApply(), state };
  };
  const update = async () => (await executeUpdate()).state;

  return {
    destroy() {
      if (destroyed) return;

      destroyed = true;
      applyRevision += 1;
      if (cleanupAutoUpdate) {
        cleanupAutoUpdate();
        cleanupAutoUpdate = null;
      }
    },
    startAutoUpdate(autoUpdateOptions = {}) {
      if (cleanupAutoUpdate || destroyed) return;

      let autoUpdateStarted = false;
      cleanupAutoUpdate = autoUpdate(options.reference, options.floating, () => {
        const notify = autoUpdateStarted;
        if (autoUpdateStarted) {
          autoUpdateOptions.onUpdate?.();
        }
        void executeUpdate().then(({ applied, state }) => {
          if (notify && applied) {
            autoUpdateOptions.onUpdated?.(state);
          }
        });
      });
      autoUpdateStarted = true;
    },
    stopAutoUpdate() {
      applyRevision += 1;
      if (!cleanupAutoUpdate) return;

      cleanupAutoUpdate();
      cleanupAutoUpdate = null;
    },
    update,
  };
}

export function getTransformOrigin(
  side: FloatingSide,
  align: FloatingAlign,
  direction: Direction = "ltr",
): string {
  if (side === "bottom" || side === "top") {
    const horizontal =
      align === "center"
        ? "center"
        : (align === "start") === (direction === "ltr")
          ? "left"
          : "right";
    const vertical = side === "bottom" ? "top" : "bottom";

    return `${horizontal} ${vertical}`;
  }

  const horizontal = side === "right" ? "left" : "right";
  const vertical = align === "start" ? "top" : align === "end" ? "bottom" : "center";

  return `${horizontal} ${vertical}`;
}

export function readFloatingAlignAttribute(
  value: string | null,
  fallback: FloatingAlign = "start",
): FloatingAlign {
  if (value === "center" || value === "end" || value === "start") return value;
  return fallback;
}

export function readFloatingSideAttribute(
  value: string | null,
  fallback: FloatingSide = "bottom",
): FloatingSide {
  if (value === "bottom" || value === "left" || value === "right" || value === "top") {
    return value;
  }

  return fallback;
}

async function updateFloatingPosition({
  adaptiveOrigin = false,
  arrow: arrowPart,
  canApply = () => true,
  floating,
  getOptions,
  placementStateElements = [],
  reference,
}: FloatingPositionerOptions & { canApply?: () => boolean }): Promise<FloatingPlacementState> {
  const {
    align,
    alignOffset = 0,
    avoidCollisions = true,
    collisionStrategy = "initial-placement",
    preserveAnchor = false,
    side,
    sideOffset = 0,
    strategy = "fixed",
    viewportPadding = 8,
  } = getOptions();
  if (collisionStrategy === "best-fit" && canApply()) {
    floating.style.removeProperty(FLOATING_AVAILABLE_HEIGHT_PROPERTY);
    floating.style.removeProperty(FLOATING_AVAILABLE_WIDTH_PROPERTY);
  }
  const sizeMiddleware = size({
    apply({ availableHeight, availableWidth, elements }) {
      if (!canApply()) return;

      elements.floating.style.setProperty(
        FLOATING_AVAILABLE_HEIGHT_PROPERTY,
        `${Math.max(0, availableHeight)}px`,
      );
      elements.floating.style.setProperty(
        FLOATING_AVAILABLE_WIDTH_PROPERTY,
        `${Math.max(0, availableWidth)}px`,
      );
    },
    padding: viewportPadding,
  });
  const flipMiddleware = avoidCollisions
    ? flip({
        fallbackStrategy: collisionStrategy === "best-fit" ? "bestFit" : "initialPlacement",
        padding: viewportPadding,
      })
    : null;
  const collisionMiddleware =
    collisionStrategy === "best-fit"
      ? [flipMiddleware, sizeMiddleware]
      : [sizeMiddleware, flipMiddleware];
  // An empty or hidden arrow has no size and takes no part in placement.
  const arrowElement = arrowPart?.offsetWidth && arrowPart.offsetHeight ? arrowPart : null;
  const arrowSize = arrowElement
    ? Math.max(arrowElement.offsetWidth, arrowElement.offsetHeight)
    : 0;
  const arrowOffset = arrowSize && arrowSize / 2 + viewportPadding;
  const shiftMiddleware =
    avoidCollisions && preserveAnchor !== true
      ? shift({
          crossAxis: !preserveAnchor,
          // Keep enough overlap with the anchor for the arrow to point at it, as Base UI does.
          limiter: preserveAnchor === "side" ? limitShift({ offset: arrowOffset }) : undefined,
          padding: viewportPadding,
        })
      : null;
  // Correct centered alignment before deciding whether the requested side must flip.
  const shiftBeforeFlip = preserveAnchor === "side" && align === "center";
  const menuEntry = [floating, ...placementStateElements].find((part) =>
    part.hasAttribute("data-sw-context-menu-entry"),
  );
  const entryRoom: Middleware | null = menuEntry
    ? {
        name: "contextMenuEntryRoom",
        async fn(state) {
          const overflow = await detectOverflow(state);
          const { side } = fromFloatingPlacement(state.placement);
          const opposite = { top: "bottom", bottom: "top", left: "right", right: "left" } as const;
          return { data: { pixels: Math.max(0, -overflow[opposite[side]]) } };
        },
      }
    : null;
  const middleware = [
    offset({ alignmentAxis: alignOffset, mainAxis: sideOffset }),
    ...(shiftBeforeFlip
      ? [shiftMiddleware, ...collisionMiddleware]
      : [...collisionMiddleware, shiftMiddleware]),
    arrowElement ? arrow({ element: arrowElement, padding: FLOATING_ARROW_PADDING }) : null,
    entryRoom,
  ].filter(Boolean);

  if (canApply()) floating.style.position = strategy;

  const result = await computePosition(reference, floating, {
    middleware,
    placement: toFloatingPlacement(side, align),
    strategy,
  });
  const placement = fromFloatingPlacement(result.placement);
  const transformOrigin = getTransformOrigin(
    placement.side,
    placement.align,
    readDirection(floating),
  );

  if (!canApply()) {
    return {
      align: placement.align,
      left: result.x,
      side: placement.side,
      top: result.y,
    };
  }

  applyFloatingCoordinates({
    adaptiveOrigin,
    floating,
    placement,
    strategy,
    x: result.x,
    y: result.y,
  });
  if (menuEntry && result.middlewareData.contextMenuEntryRoom) {
    menuEntry.style.setProperty(
      "--sw-context-menu-entry-room",
      `${result.middlewareData.contextMenuEntryRoom.pixels}px`,
    );
  }
  floating.style.transformOrigin = transformOrigin;
  for (const axis of ["x", "y"] as const) {
    const arrowPosition = result.middlewareData.arrow?.[axis];
    if (arrowPosition === undefined) floating.style.removeProperty(`--sw-floating-arrow-${axis}`);
    else floating.style.setProperty(`--sw-floating-arrow-${axis}`, `${arrowPosition}px`);
  }
  [floating, ...placementStateElements].forEach((element) => {
    element.style.setProperty("--transform-origin", transformOrigin);
  });
  setPlacementState([floating, ...placementStateElements], placement);

  return {
    align: placement.align,
    left: result.x,
    side: placement.side,
    top: result.y,
  };
}

function applyFloatingCoordinates({
  adaptiveOrigin,
  floating,
  placement,
  strategy,
  x,
  y,
}: {
  adaptiveOrigin: boolean;
  floating: HTMLElement;
  placement: Pick<FloatingPlacementState, "align" | "side">;
  strategy: Strategy;
  x: number;
  y: number;
}): void {
  const left = Math.round(x);
  const top = Math.round(y);
  const dimensions = adaptiveOrigin ? getAdaptiveOriginDimensions(floating, strategy) : null;

  if (adaptiveOrigin && dimensions && placement.side === "left") {
    const right = Math.round(dimensions.width - (x + getFloatingSize(floating, "width")));
    floating.style.right = `${right}px`;
    floating.style.removeProperty("left");
  } else {
    floating.style.left = `${left}px`;
    floating.style.removeProperty("right");
  }

  if (adaptiveOrigin && dimensions && placement.side === "top") {
    const bottom = Math.round(dimensions.height - (y + getFloatingSize(floating, "height")));
    floating.style.bottom = `${bottom}px`;
    floating.style.removeProperty("top");
  } else {
    floating.style.top = `${top}px`;
    floating.style.removeProperty("bottom");
  }
}

function getAdaptiveOriginDimensions(
  floating: HTMLElement,
  strategy: Strategy,
): { height: number; width: number } | null {
  if (strategy === "fixed") {
    const viewport = floating.ownerDocument.defaultView?.visualViewport;
    const documentElement = floating.ownerDocument.documentElement;

    return {
      height: viewport?.height ?? documentElement.clientHeight,
      width: viewport?.width ?? documentElement.clientWidth,
    };
  }

  const offsetParent = floating.offsetParent;
  if (offsetParent instanceof HTMLElement) {
    return {
      height: offsetParent.clientHeight,
      width: offsetParent.clientWidth,
    };
  }

  const documentElement = floating.ownerDocument.documentElement;
  return {
    height: documentElement.clientHeight,
    width: documentElement.clientWidth,
  };
}

function getFloatingSize(floating: HTMLElement, dimension: "height" | "width"): number {
  const styleValue = Number.parseFloat(floating.style[dimension]);
  if (Number.isFinite(styleValue) && styleValue > 0) return styleValue;

  return floating.getBoundingClientRect()[dimension];
}

function toFloatingPlacement(side: FloatingSide, align: FloatingAlign): Placement {
  if (align === "center") return side;
  return `${side}-${align}`;
}

function fromFloatingPlacement(
  placement: Placement,
): Pick<FloatingPlacementState, "align" | "side"> {
  const [side, align] = placement.split("-") as [FloatingSide, FloatingAlign | undefined];

  return {
    align: align ?? "center",
    side,
  };
}

function setPlacementState(
  elements: HTMLElement[],
  placement: Pick<FloatingPlacementState, "align" | "side">,
): void {
  for (const element of elements) {
    element.setAttribute("data-side", placement.side);
    element.setAttribute("data-align", placement.align);
  }
}
