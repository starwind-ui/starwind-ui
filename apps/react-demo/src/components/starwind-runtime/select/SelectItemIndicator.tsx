import SelectPrimitive from "@starwind-ui/react/select";
import type * as React from "react";
import { selectItemIndicator } from "./variants";

export type SelectItemIndicatorProps = React.ComponentPropsWithoutRef<"span">;

function SelectItemIndicator(props: SelectItemIndicatorProps) {
  const { className, children, ...rest } = props;

  return (
    <SelectPrimitive.ItemIndicator
      className={selectItemIndicator({ class: className })}
      {...rest}
      data-slot="select-item-indicator"
    >
      {children}
    </SelectPrimitive.ItemIndicator>
  );
}

export default SelectItemIndicator;
