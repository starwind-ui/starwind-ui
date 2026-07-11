import MenuPrimitive from "@starwind-ui/react/menu";
import type * as React from "react";
import { dropdownContent } from "./variants";

export type DropdownSubContentProps = React.ComponentPropsWithoutRef<"div"> & {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  avoidCollisions?: boolean;
};

function DropdownSubContent(props: DropdownSubContentProps) {
  const {
    className,
    side = "right",
    align = "start",
    sideOffset = 0,
    avoidCollisions = true,
    children,
    ...rest
  } = props;

  const subContentClassName = className;

  return (
    <MenuPrimitive.Portal data-slot="dropdown-sub-portal">
      <MenuPrimitive.Popup
        className={dropdownContent({ class: subContentClassName })}
        side={side}
        align={align}
        sideOffset={sideOffset}
        avoidCollisions={avoidCollisions}
        {...rest}
        data-slot="dropdown-sub-content"
      >
        {children}
      </MenuPrimitive.Popup>
    </MenuPrimitive.Portal>
  );
}

export default DropdownSubContent;
