import ComboboxPrimitive from "@starwind-ui/react/combobox";
import type * as React from "react";
import { comboboxItemText } from "./variants";

export type ComboboxItemTextProps = React.ComponentPropsWithoutRef<"span">;

function ComboboxItemText(props: ComboboxItemTextProps) {
  const { className, children, ...rest } = props;

  return (
    <ComboboxPrimitive.ItemText
      className={comboboxItemText({ class: className })}
      {...rest}
      data-slot="combobox-item-text"
    >
      {children}
    </ComboboxPrimitive.ItemText>
  );
}

export default ComboboxItemText;
