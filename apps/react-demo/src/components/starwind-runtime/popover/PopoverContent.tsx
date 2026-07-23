import PopoverPrimitive from "@starwind-ui/react/popover";
import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { popoverContent } from "./variants";

export type PopoverContentProps = React.ComponentPropsWithoutRef<"div"> &
  VariantProps<typeof popoverContent> & {
    side?: "top" | "right" | "bottom" | "left";
    align?: "start" | "center" | "end";
    sideOffset?: number;
    avoidCollisions?: boolean;
    collisionStrategy?: "initial-placement" | "best-fit";
  };

function PopoverContent(props: PopoverContentProps) {
  const {
    className,
    side = "bottom",
    align = "center",
    sideOffset = 4,
    avoidCollisions = true,
    collisionStrategy = "initial-placement",
    exitMotion = "popover",
    children,
    ...rest
  } = props;

  return (
    <PopoverPrimitive.Portal data-slot="popover-portal">
      <PopoverPrimitive.Popup
        className={popoverContent({ exitMotion, class: className })}
        side={side}
        align={align}
        sideOffset={sideOffset}
        avoidCollisions={avoidCollisions}
        collisionStrategy={collisionStrategy}
        {...rest}
        data-slot="popover-content"
      >
        {children}
      </PopoverPrimitive.Popup>
    </PopoverPrimitive.Portal>
  );
}

export default PopoverContent;
