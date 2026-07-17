import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  type Placement,
  type ReferenceElement,
  size,
  type Strategy,
  shift,
} from "@floating-ui/dom";

export type FloatingAlign = "center" | "end" | "start";
export type FloatingSide = "bottom" | "left" | "right" | "top";

export type FloatingOptions = {
  align: FloatingAlign;
  alignOffset?: number;
  avoidCollisions?: boolean;
  preserveAnchor?: boolean;
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
  floating: HTMLElement;
  getOptions: () => FloatingOptions;
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

type ResolveFloatingPortalTargetOptions = {
  dialogFloatingHostSelector?: string;
  floatingRootSelector?: string;
};

const DEFAULT_FLOATING_ROOT_SELECTOR = "[data-floating-root]";
const DEFAULT_DIALOG_FLOATING_HOST_SELECTOR =
  'dialog[data-slot="dialog-content"], dialog[data-slot="sheet-content"], dialog[data-slot="drawer-content"]';
const FLOATING_AVAILABLE_HEIGHT_PROPERTY = "--sw-floating-available-height";
const FLOATING_AVAILABLE_WIDTH_PROPERTY = "--sw-floating-available-width";

export function createFloatingPositioner(options: FloatingPositionerOptions): FloatingPositioner {
  let cleanupAutoUpdate: (() => void) | null = null;
  let destroyed = false;
  let requestedPlacement: Pick<FloatingOptions, "align" | "side"> | null = null;

  const update = async () => {
    const state = await updateFloatingPosition({
      ...options,
      getOptions: () => {
        const nextOptions = options.getOptions();
        if (!requestedPlacement) {
          requestedPlacement = {
            align: nextOptions.align,
            side: nextOptions.side,
          };
          return nextOptions;
        }

        return {
          ...nextOptions,
          align: requestedPlacement.align,
          side: requestedPlacement.side,
        };
      },
    });
    return state;
  };

  return {
    destroy() {
      destroyed = true;
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
        void update().then((state) => {
          if (!destroyed && notify) {
            autoUpdateOptions.onUpdated?.(state);
          }
        });
      });
      autoUpdateStarted = true;
    },
    stopAutoUpdate() {
      if (!cleanupAutoUpdate) return;

      cleanupAutoUpdate();
      cleanupAutoUpdate = null;
    },
    update,
  };
}

export function resolveFloatingPortalTarget(
  reference: Element | null,
  options: ResolveFloatingPortalTargetOptions = {},
): HTMLElement {
  const {
    dialogFloatingHostSelector = DEFAULT_DIALOG_FLOATING_HOST_SELECTOR,
    floatingRootSelector = DEFAULT_FLOATING_ROOT_SELECTOR,
  } = options;

  const currentFloatingRoot = reference?.closest(floatingRootSelector);
  if (currentFloatingRoot instanceof HTMLElement) return currentFloatingRoot;

  const dialogHost = reference?.closest(dialogFloatingHostSelector);
  const dialogFloatingRoot = dialogHost?.querySelector(`:scope > ${floatingRootSelector}`);
  if (dialogFloatingRoot instanceof HTMLElement) return dialogFloatingRoot;

  return document.body;
}

export function getTransformOrigin(side: FloatingSide, align: FloatingAlign): string {
  if (side === "bottom" || side === "top") {
    const horizontal = align === "start" ? "left" : align === "end" ? "right" : "center";
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
  floating,
  getOptions,
  placementStateElements = [],
  reference,
}: FloatingPositionerOptions): Promise<FloatingPlacementState> {
  const {
    align,
    alignOffset = 0,
    avoidCollisions = true,
    preserveAnchor = false,
    side,
    sideOffset = 0,
    strategy = "fixed",
    viewportPadding = 8,
  } = getOptions();
  const middleware = [
    offset({ alignmentAxis: alignOffset, mainAxis: sideOffset }),
    size({
      apply({ availableHeight, availableWidth, elements }) {
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
    }),
    avoidCollisions
      ? flip({ fallbackStrategy: "initialPlacement", padding: viewportPadding })
      : null,
    avoidCollisions && !preserveAnchor
      ? shift({ crossAxis: true, padding: viewportPadding })
      : null,
  ].filter(Boolean);

  floating.style.position = strategy;

  const result = await computePosition(reference, floating, {
    middleware,
    placement: toFloatingPlacement(side, align),
    strategy,
  });
  const placement = fromFloatingPlacement(result.placement);
  const transformOrigin = getTransformOrigin(placement.side, placement.align);

  applyFloatingCoordinates({
    adaptiveOrigin,
    floating,
    placement,
    strategy,
    x: result.x,
    y: result.y,
  });
  floating.style.transformOrigin = transformOrigin;
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
