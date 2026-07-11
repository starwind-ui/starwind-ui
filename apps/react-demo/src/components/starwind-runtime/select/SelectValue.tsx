import SelectPrimitive from "@starwind-ui/react/select";
import type * as React from "react";
import { selectValue } from "./variants";

export type SelectValueProps = React.ComponentPropsWithoutRef<"span"> & {
  placeholder?: string;
};

function SelectValue(props: SelectValueProps) {
  const { className, placeholder, children, ...rest } = props;

  return (
    <SelectPrimitive.Value
      className={selectValue({ class: className })}
      placeholder={placeholder}
      {...rest}
      data-slot="select-value"
    >
      {children}
    </SelectPrimitive.Value>
  );
}

export default SelectValue;
