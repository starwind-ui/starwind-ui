import SelectPrimitive from "@starwind-ui/react/select";
import type * as React from "react";
import { selectScrollButton } from "./variants";

export type SelectScrollUpButtonProps = React.ComponentPropsWithoutRef<"div">;

function SelectScrollUpButton(props: SelectScrollUpButtonProps) {
  const { className, children, ...rest } = props;

  return (
    <SelectPrimitive.ScrollUpArrow
      className={selectScrollButton({ class: className })}
      {...rest}
      data-slot="select-scroll-up-button"
    >
      {children}
    </SelectPrimitive.ScrollUpArrow>
  );
}

export default SelectScrollUpButton;
