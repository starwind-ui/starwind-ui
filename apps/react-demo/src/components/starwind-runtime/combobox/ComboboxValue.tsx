import ComboboxPrimitive from "@starwind-ui/react/combobox";
import type * as React from "react";
import { comboboxValue } from "./variants";

export type ComboboxValueProps = React.ComponentPropsWithoutRef<"span"> & {
  placeholder?: string;
};

function ComboboxValue(props: ComboboxValueProps) {
  const { className, placeholder, children, ...rest } = props;

  return (
    <ComboboxPrimitive.Value
      className={comboboxValue({ class: className })}
      placeholder={placeholder}
      {...rest}
      data-slot="combobox-value"
    >
      {children}
    </ComboboxPrimitive.Value>
  );
}

export default ComboboxValue;
