import SelectPrimitive from "@starwind-ui/react/select";
import type * as React from "react";
import { selectGroup } from "./variants";

export type SelectGroupProps = React.ComponentPropsWithoutRef<"div">;

function SelectGroup(props: SelectGroupProps) {
  const { className, children, ...rest } = props;

  return (
    <SelectPrimitive.Group
      className={selectGroup({ class: className })}
      {...rest}
      data-slot="select-group"
    >
      {children}
    </SelectPrimitive.Group>
  );
}

export default SelectGroup;
