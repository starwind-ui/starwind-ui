import MenuPrimitive from "@starwind-ui/react/menu";
import type * as React from "react";

export type DropdownSubProps = React.ComponentPropsWithoutRef<"div"> & {
  closeDelay?: number;
};

function DropdownSub(props: DropdownSubProps) {
  const { className, closeDelay = 200, children, ...rest } = props;

  return (
    <MenuPrimitive.SubmenuRoot
      className={["relative", className].filter(Boolean).join(" ")}
      closeDelay={closeDelay}
      {...rest}
      data-slot="dropdown-sub"
    >
      {children}
    </MenuPrimitive.SubmenuRoot>
  );
}

export default DropdownSub;
