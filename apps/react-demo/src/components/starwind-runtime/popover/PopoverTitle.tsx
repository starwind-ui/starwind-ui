import PopoverPrimitive from "@starwind-ui/react/popover";
import type * as React from "react";
import { popoverTitle } from "./variants";

export type PopoverTitleProps = React.ComponentPropsWithoutRef<"h2">;

function PopoverTitle(props: PopoverTitleProps) {
  const { className, children, ...rest } = props;

  return (
    <PopoverPrimitive.Title
      className={popoverTitle({ class: className })}
      {...rest}
      data-slot="popover-title"
    >
      {children}
    </PopoverPrimitive.Title>
  );
}

export default PopoverTitle;
