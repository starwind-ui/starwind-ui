import ComboboxPrimitive from "@starwind-ui/react/combobox";
import type * as React from "react";
import { comboboxLabel } from "./variants";

export type ComboboxLabelProps = React.ComponentPropsWithoutRef<"div">;

function ComboboxLabel(props: ComboboxLabelProps) {
  const { className, children, ...rest } = props;

  return (
    <ComboboxPrimitive.Label
      className={comboboxLabel({ class: className })}
      {...rest}
      data-slot="combobox-label"
    >
      {children}
    </ComboboxPrimitive.Label>
  );
}

export default ComboboxLabel;
