import MenuPrimitive from "@starwind-ui/react/menu";
import type * as React from "react";

export type DropdownGroupProps = React.ComponentPropsWithoutRef<"div">;

function DropdownGroup(props: DropdownGroupProps) {
  const { className, children, ...rest } = props;

  return (
    <MenuPrimitive.Group className={className} {...rest} data-slot="dropdown-group">
      {children}
    </MenuPrimitive.Group>
  );
}

export default DropdownGroup;
