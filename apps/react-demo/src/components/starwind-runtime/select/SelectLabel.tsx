import SelectPrimitive from "@starwind-ui/react/select";
import type * as React from "react";
import { selectLabel } from "./variants";

export type SelectLabelProps = React.ComponentPropsWithoutRef<"div">;

function SelectLabel(props: SelectLabelProps) {
  const { className, children, ...rest } = props;

  return (
    <SelectPrimitive.GroupLabel
      className={selectLabel({ class: className })}
      {...rest}
      data-slot="select-label"
    >
      {children}
    </SelectPrimitive.GroupLabel>
  );
}

export default SelectLabel;
