import PopoverPrimitive from "@starwind-ui/react/popover";
import type * as React from "react";
import { popoverContent } from "./variants";

export type PopoverContentProps = React.ComponentPropsWithoutRef<"div"> & {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  avoidCollisions?: boolean;
};

function PopoverContent(props: PopoverContentProps) {
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
    <PopoverPrimitive.Portal data-slot="popover-portal">
      <PopoverPrimitive.Popup
        className={popoverContent({ class: className })}
        side={side}
        align={align}
        sideOffset={sideOffset}
        avoidCollisions={avoidCollisions}
        {...rest}
        data-slot="popover-content"
      >
        {children}
      </PopoverPrimitive.Popup>
    </PopoverPrimitive.Portal>
  );
}

export default PopoverContent;
