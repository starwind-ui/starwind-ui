import SelectPrimitive from "@starwind-ui/react/select";
import type * as React from "react";
import { selectSeparator } from "./variants";

export type SelectSeparatorProps = React.ComponentPropsWithoutRef<"div">;

function SelectSeparator(props: SelectSeparatorProps) {
  const { className, ...rest } = props;

  return (
    <SelectPrimitive.Separator
      className={selectSeparator({ class: className })}
      {...rest}
      data-slot="select-separator"
    />
  );
}

export default SelectSeparator;
