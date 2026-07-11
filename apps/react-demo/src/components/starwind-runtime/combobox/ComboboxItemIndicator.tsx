import ComboboxPrimitive from "@starwind-ui/react/combobox";
import type * as React from "react";
import { comboboxItemIndicator } from "./variants";

export type ComboboxItemIndicatorProps = React.ComponentPropsWithoutRef<"span">;

function ComboboxItemIndicator(props: ComboboxItemIndicatorProps) {
  const { className, children, ...rest } = props;

  return (
    <ComboboxPrimitive.ItemIndicator
      className={comboboxItemIndicator({ class: className })}
      {...rest}
      data-slot="combobox-item-indicator"
    >
      {children}
    </ComboboxPrimitive.ItemIndicator>
  );
}

export default ComboboxItemIndicator;
