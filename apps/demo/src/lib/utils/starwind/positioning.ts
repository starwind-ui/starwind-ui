export type FloatingSide = "top" | "bottom" | "left" | "right";
export type FloatingAlign = "start" | "center" | "end";

interface Placement {
  side: FloatingSide;
  align: FloatingAlign;
}

interface Position {
  top: number;
  left: number;
}

interface OverflowAmount {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface ResolvePlacementOptions {
  side: FloatingSide;
  align: FloatingAlign;
  sideOffset: number;
  triggerRect: DOMRect;
  contentWidth: number;
  contentHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  viewportPadding: number;
  avoidCollisions?: boolean;
}

export interface ResolvePlacementResult {
  side: FloatingSide;
  align: FloatingAlign;
  top: number;
  left: number;
}

function getOppositeSide(side: FloatingSide): FloatingSide {
  switch (side) {
    case "top":
      return "bottom";
    case "bottom":
      return "top";
    case "left":
      return "right";
    case "right":
      return "left";
  }
}

function getOppositeAlign(align: FloatingAlign): FloatingAlign {
  switch (align) {
    case "start":
      return "end";
    case "end":
      return "start";
    case "center":
      return "center";
  }
}

function getPlacementCandidates(side: FloatingSide, align: FloatingAlign): Placement[] {
  const placements: Placement[] = [];

  const pushUnique = (candidate: Placement) => {
    if (
      !placements.some(
        (placement) => placement.side === candidate.side && placement.align === candidate.align,
      )
    ) {
      placements.push(candidate);
    }
  };

  const oppositeSide = getOppositeSide(side);
  const oppositeAlign = getOppositeAlign(align);

  pushUnique({ side, align });
  pushUnique({ side: oppositeSide, align });
  pushUnique({ side, align: "center" });
  pushUnique({ side: oppositeSide, align: "center" });
  pushUnique({ side, align: oppositeAlign });
  pushUnique({ side: oppositeSide, align: oppositeAlign });

  if (side === "top" || side === "bottom") {
    for (const fallbackAlign of ["start", "center", "end"] as const) {
      pushUnique({ side: "right", align: fallbackAlign });
      pushUnique({ side: "left", align: fallbackAlign });
    }
  } else {
    for (const fallbackAlign of ["start", "center", "end"] as const) {
      pushUnique({ side: "bottom", align: fallbackAlign });
      pushUnique({ side: "top", align: fallbackAlign });
    }
  }

  return placements;
}

function getPlacementPosition(
  placement: Placement,
  triggerRect: DOMRect,
  contentWidth: number,
  contentHeight: number,
  sideOffset: number,
): Position {
  let top = 0;
  let left = 0;

  if (placement.side === "bottom" || placement.side === "top") {
    top =
      placement.side === "bottom"
        ? triggerRect.bottom + sideOffset
        : triggerRect.top - contentHeight - sideOffset;

    if (placement.align === "start") {
      left = triggerRect.left;
    } else if (placement.align === "end") {
      left = triggerRect.right - contentWidth;
    } else {
      left = triggerRect.left + (triggerRect.width - contentWidth) / 2;
    }
  } else {
    left =
      placement.side === "right"
        ? triggerRect.right + sideOffset
        : triggerRect.left - contentWidth - sideOffset;

    if (placement.align === "start") {
      top = triggerRect.top;
    } else if (placement.align === "end") {
      top = triggerRect.bottom - contentHeight;
    } else {
      top = triggerRect.top + (triggerRect.height - contentHeight) / 2;
    }
  }

  return { top, left };
}

function clampPositionToViewport(
  position: Position,
  contentWidth: number,
  contentHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  viewportPadding: number,
): Position {
  const maxLeft = Math.max(viewportPadding, viewportWidth - contentWidth - viewportPadding);
  const maxTop = Math.max(viewportPadding, viewportHeight - contentHeight - viewportPadding);

  return {
    left: Math.min(Math.max(viewportPadding, position.left), maxLeft),
    top: Math.min(Math.max(viewportPadding, position.top), maxTop),
  };
}

function getOverflowAmount(
  position: Position,
  contentWidth: number,
  contentHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  viewportPadding: number,
): OverflowAmount {
  const right = position.left + contentWidth;
  const bottom = position.top + contentHeight;

  return {
    left: Math.max(0, viewportPadding - position.left),
    top: Math.max(0, viewportPadding - position.top),
    right: Math.max(0, right - (viewportWidth - viewportPadding)),
    bottom: Math.max(0, bottom - (viewportHeight - viewportPadding)),
  };
}

function getMainAxisShift(
  side: FloatingSide,
  preferredPosition: Position,
  clampedPosition: Position,
): number {
  if (side === "top" || side === "bottom") {
    return Math.abs(clampedPosition.top - preferredPosition.top);
  }

  return Math.abs(clampedPosition.left - preferredPosition.left);
}

function getCrossAxisShift(
  side: FloatingSide,
  preferredPosition: Position,
  clampedPosition: Position,
): number {
  if (side === "top" || side === "bottom") {
    return Math.abs(clampedPosition.left - preferredPosition.left);
  }

  return Math.abs(clampedPosition.top - preferredPosition.top);
}

/**
 * Resolves the best side/alignment placement for floating content.
 */
export function resolvePlacement(options: ResolvePlacementOptions): ResolvePlacementResult {
  const {
    side,
    align,
    sideOffset,
    triggerRect,
    contentWidth,
    contentHeight,
    viewportWidth,
    viewportHeight,
    viewportPadding,
    avoidCollisions = true,
  } = options;

  const preferredPlacement: Placement = { side, align };

  if (!avoidCollisions) {
    const preferredPosition = getPlacementPosition(
      preferredPlacement,
      triggerRect,
      contentWidth,
      contentHeight,
      sideOffset,
    );

    return {
      side,
      align,
      top: preferredPosition.top,
      left: preferredPosition.left,
    };
  }

  const candidates = getPlacementCandidates(side, align);

  let bestPlacement = candidates[0] ?? preferredPlacement;
  let bestPosition = clampPositionToViewport(
    getPlacementPosition(bestPlacement, triggerRect, contentWidth, contentHeight, sideOffset),
    contentWidth,
    contentHeight,
    viewportWidth,
    viewportHeight,
    viewportPadding,
  );
  let bestScore = Number.POSITIVE_INFINITY;

  for (const placement of candidates) {
    const preferredPosition = getPlacementPosition(
      placement,
      triggerRect,
      contentWidth,
      contentHeight,
      sideOffset,
    );
    const clampedPosition = clampPositionToViewport(
      preferredPosition,
      contentWidth,
      contentHeight,
      viewportWidth,
      viewportHeight,
      viewportPadding,
    );

    const overflow = getOverflowAmount(
      preferredPosition,
      contentWidth,
      contentHeight,
      viewportWidth,
      viewportHeight,
      viewportPadding,
    );

    const overflowTotal = overflow.left + overflow.right + overflow.top + overflow.bottom;
    const mainAxisShift = getMainAxisShift(placement.side, preferredPosition, clampedPosition);
    const crossAxisShift = getCrossAxisShift(placement.side, preferredPosition, clampedPosition);

    const sidePenalty = placement.side === side ? 0 : 32;
    const alignPenalty = placement.align === align ? 0 : 8;
    const score =
      overflowTotal * 24 + mainAxisShift * 8 + crossAxisShift * 3 + sidePenalty + alignPenalty;

    if (score < bestScore) {
      bestScore = score;
      bestPlacement = placement;
      bestPosition = clampedPosition;
    }
  }

  return {
    side: bestPlacement.side,
    align: bestPlacement.align,
    top: bestPosition.top,
    left: bestPosition.left,
  };
}

/**
 * Returns a transform-origin value that matches the resolved placement.
 */
export function getTransformOrigin(side: FloatingSide, align: FloatingAlign): string {
  if (side === "top" || side === "bottom") {
    const vertical = side === "bottom" ? "top" : "bottom";
    const horizontal = align === "start" ? "left" : align === "end" ? "right" : "center";

    return `${horizontal} ${vertical}`;
  }

  const horizontal = side === "right" ? "left" : "right";
  const vertical = align === "start" ? "top" : align === "end" ? "bottom" : "center";

  return `${horizontal} ${vertical}`;
}
