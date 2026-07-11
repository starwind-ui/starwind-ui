export type FloatingAlign = "center" | "end" | "start";
export type FloatingSide = "bottom" | "left" | "right" | "top";

type Placement = {
  align: FloatingAlign;
  side: FloatingSide;
};

type Position = {
  left: number;
  top: number;
};

type OverflowAmount = {
  bottom: number;
  left: number;
  right: number;
  top: number;
};

export type ResolvePlacementOptions = {
  align: FloatingAlign;
  avoidCollisions?: boolean;
  contentHeight: number;
  contentWidth: number;
  side: FloatingSide;
  sideOffset: number;
  triggerRect: DOMRect;
  viewportHeight: number;
  viewportPadding: number;
  viewportWidth: number;
};

export type ResolvePlacementResult = {
  align: FloatingAlign;
  left: number;
  side: FloatingSide;
  top: number;
};

export function resolvePlacement(options: ResolvePlacementOptions): ResolvePlacementResult {
  const {
    align,
    avoidCollisions = true,
    contentHeight,
    contentWidth,
    side,
    sideOffset,
    triggerRect,
    viewportHeight,
    viewportPadding,
    viewportWidth,
  } = options;

  const preferredPlacement: Placement = { align, side };

  if (!avoidCollisions) {
    const preferredPosition = getPlacementPosition(
      preferredPlacement,
      triggerRect,
      contentWidth,
      contentHeight,
      sideOffset,
    );

    return {
      align,
      left: preferredPosition.left,
      side,
      top: preferredPosition.top,
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
    const overflowTotal = overflow.bottom + overflow.left + overflow.right + overflow.top;
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
    align: bestPlacement.align,
    left: bestPosition.left,
    side: bestPlacement.side,
    top: bestPosition.top,
  };
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

function getOppositeSide(side: FloatingSide): FloatingSide {
  switch (side) {
    case "bottom":
      return "top";
    case "left":
      return "right";
    case "right":
      return "left";
    case "top":
      return "bottom";
  }
}

function getOppositeAlign(align: FloatingAlign): FloatingAlign {
  switch (align) {
    case "center":
      return "center";
    case "end":
      return "start";
    case "start":
      return "end";
  }
}

function getPlacementCandidates(side: FloatingSide, align: FloatingAlign): Placement[] {
  const placements: Placement[] = [];
  const oppositeSide = getOppositeSide(side);
  const oppositeAlign = getOppositeAlign(align);
  const pushUnique = (candidate: Placement) => {
    if (
      placements.some(
        (placement) => placement.align === candidate.align && placement.side === candidate.side,
      )
    ) {
      return;
    }

    placements.push(candidate);
  };

  pushUnique({ align, side });
  pushUnique({ align, side: oppositeSide });
  pushUnique({ align: "center", side });
  pushUnique({ align: "center", side: oppositeSide });
  pushUnique({ align: oppositeAlign, side });
  pushUnique({ align: oppositeAlign, side: oppositeSide });

  if (side === "bottom" || side === "top") {
    for (const fallbackAlign of ["start", "center", "end"] as const) {
      pushUnique({ align: fallbackAlign, side: "right" });
      pushUnique({ align: fallbackAlign, side: "left" });
    }
  } else {
    for (const fallbackAlign of ["start", "center", "end"] as const) {
      pushUnique({ align: fallbackAlign, side: "bottom" });
      pushUnique({ align: fallbackAlign, side: "top" });
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
  let left = 0;
  let top = 0;

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

  return { left, top };
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
  return {
    bottom: Math.max(0, position.top + contentHeight - (viewportHeight - viewportPadding)),
    left: Math.max(0, viewportPadding - position.left),
    right: Math.max(0, position.left + contentWidth - (viewportWidth - viewportPadding)),
    top: Math.max(0, viewportPadding - position.top),
  };
}

function getMainAxisShift(
  side: FloatingSide,
  preferredPosition: Position,
  clampedPosition: Position,
): number {
  if (side === "bottom" || side === "top") {
    return Math.abs(clampedPosition.top - preferredPosition.top);
  }

  return Math.abs(clampedPosition.left - preferredPosition.left);
}

function getCrossAxisShift(
  side: FloatingSide,
  preferredPosition: Position,
  clampedPosition: Position,
): number {
  if (side === "bottom" || side === "top") {
    return Math.abs(clampedPosition.left - preferredPosition.left);
  }

  return Math.abs(clampedPosition.top - preferredPosition.top);
}
