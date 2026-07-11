import MenuPrimitive from "@starwind-ui/react/menu";
import type * as React from "react";
import { dropdownSeparator } from "./variants";

export type DropdownSeparatorProps = React.ComponentPropsWithoutRef<"div">;

function DropdownSeparator(props: DropdownSeparatorProps) {
  const { className, ...rest } = props;

  return (
    <MenuPrimitive.Separator
      className={dropdownSeparator({ class: className })}
      {...rest}
      data-slot="dropdown-separator"
    />
  );
}

export default DropdownSeparator;
