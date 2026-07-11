import ComboboxPrimitive from "@starwind-ui/react/combobox";
import type * as React from "react";
import { comboboxGroupLabel } from "./variants";

export type ComboboxGroupLabelProps = React.ComponentPropsWithoutRef<"div">;

function ComboboxGroupLabel(props: ComboboxGroupLabelProps) {
  const { className, children, ...rest } = props;

  return (
    <ComboboxPrimitive.GroupLabel
      className={comboboxGroupLabel({ class: className })}
      {...rest}
      data-slot="combobox-group-label"
    >
      {children}
    </ComboboxPrimitive.GroupLabel>
  );
}

export default ComboboxGroupLabel;
