import SelectPrimitive from "@starwind-ui/react/select";
import type * as React from "react";
import { selectItemText } from "./variants";

export type SelectItemTextProps = React.ComponentPropsWithoutRef<"span">;

function SelectItemText(props: SelectItemTextProps) {
  const { className, children, ...rest } = props;

  return (
    <SelectPrimitive.ItemText
      className={selectItemText({ class: className })}
      {...rest}
      data-slot="select-item-text"
    >
      {children}
    </SelectPrimitive.ItemText>
  );
}

export default SelectItemText;
