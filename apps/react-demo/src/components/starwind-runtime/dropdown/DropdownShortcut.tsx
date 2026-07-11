import MenuPrimitive from "@starwind-ui/react/menu";
import type * as React from "react";
import { dropdownShortcut } from "./variants";

export type DropdownShortcutProps = React.ComponentPropsWithoutRef<"span">;

function DropdownShortcut(props: DropdownShortcutProps) {
  const { className, children, ...rest } = props;

  return (
    <MenuPrimitive.Shortcut
      className={dropdownShortcut({ class: className })}
      {...rest}
      data-slot="dropdown-shortcut"
    >
      {children}
    </MenuPrimitive.Shortcut>
  );
}

export default DropdownShortcut;
