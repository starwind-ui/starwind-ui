import PopoverPrimitive from "@starwind-ui/react/popover";
import type * as React from "react";
import { popoverDescription } from "./variants";

export type PopoverDescriptionProps = React.ComponentPropsWithoutRef<"p">;

function PopoverDescription(props: PopoverDescriptionProps) {
  const { className, children, ...rest } = props;

  return (
    <PopoverPrimitive.Description
      className={popoverDescription({ class: className })}
      {...rest}
      data-slot="popover-description"
    >
      {children}
    </PopoverPrimitive.Description>
  );
}

export default PopoverDescription;
