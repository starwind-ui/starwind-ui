"use client";

import TooltipPrimitive from "@starwind-ui/react/tooltip";
import { IconCaretUpFilled as CaretUp } from "@tabler/icons-react";
import type * as React from "react";
import { tooltipCaret, tooltipContent, tooltipPositioner } from "./variants";

export type TooltipContentProps = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "tabindex" | "tabIndex"
> & {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  avoidCollisions?: boolean;
  positionerClassName?: string;
  portalContainer?: string;
  disablePortal?: boolean;
  icon?: React.ReactNode;
};

function TooltipContent(props: TooltipContentProps) {
  const {
    className,
    positionerClassName,
    side = "top",
    align = "center",
    sideOffset = 8,
    avoidCollisions = true,
    portalContainer,
    disablePortal = false,
    children,
    icon,
    ...rest
  } = props;

  return (
    <TooltipPrimitive.Portal
      container={portalContainer}
      disabled={disablePortal}
      data-slot="tooltip-portal"
    >
      <TooltipPrimitive.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        avoidCollisions={avoidCollisions}
        className={tooltipPositioner({ class: positionerClassName })}
        data-slot="tooltip-positioner"
      >
        <TooltipPrimitive.Popup
          className={tooltipContent({ class: className })}
          side={side}
          align={align}
          sideOffset={sideOffset}
          avoidCollisions={avoidCollisions}
          {...rest}
          data-slot="tooltip-content"
        >
          {children ?? "My tooltip!"}

          <TooltipPrimitive.Arrow className={tooltipCaret()} data-slot="tooltip-arrow">
            {icon ?? <CaretUp />}
          </TooltipPrimitive.Arrow>
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

export default TooltipContent;
