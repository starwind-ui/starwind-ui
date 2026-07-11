import PreviewCardPrimitive from "@starwind-ui/react/preview-card";
import type * as React from "react";
import { hoverCardContent } from "./variants";

export type HoverCardContentProps = React.ComponentPropsWithoutRef<"div"> & {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  avoidCollisions?: boolean;
};

function HoverCardContent(props: HoverCardContentProps) {
  const {
    className,
    side = "bottom",
    align = "center",
    sideOffset = 4,
    avoidCollisions = true,
    children,
    ...rest
  } = props;

  return (
    <PreviewCardPrimitive.Portal data-slot="hover-card-portal">
      <PreviewCardPrimitive.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        avoidCollisions={avoidCollisions}
        className="isolate z-50"
        data-slot="hover-card-positioner"
      >
        <PreviewCardPrimitive.Popup
          className={hoverCardContent({ class: className })}
          side={side}
          align={align}
          sideOffset={sideOffset}
          avoidCollisions={avoidCollisions}
          {...rest}
          data-slot="hover-card-content"
        >
          {children}
        </PreviewCardPrimitive.Popup>
      </PreviewCardPrimitive.Positioner>
    </PreviewCardPrimitive.Portal>
  );
}

export default HoverCardContent;
