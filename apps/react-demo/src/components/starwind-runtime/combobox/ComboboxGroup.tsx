import ComboboxPrimitive from "@starwind-ui/react/combobox";
import type * as React from "react";
import { comboboxGroup } from "./variants";

export type ComboboxGroupProps = React.ComponentPropsWithoutRef<"div">;

function ComboboxGroup(props: ComboboxGroupProps) {
  const { className, children, ...rest } = props;

  return (
    <ComboboxPrimitive.Group
      className={comboboxGroup({ class: className })}
      {...rest}
      data-slot="combobox-group"
    >
      {children}
    </ComboboxPrimitive.Group>
  );
}

export default ComboboxGroup;
