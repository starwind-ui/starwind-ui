import SelectPrimitive from "@starwind-ui/react/select";
import type * as React from "react";
import { selectScrollButton } from "./variants";

export type SelectScrollDownButtonProps = React.ComponentPropsWithoutRef<"div">;

function SelectScrollDownButton(props: SelectScrollDownButtonProps) {
  const { className, children, ...rest } = props;

  return (
    <SelectPrimitive.ScrollDownArrow
      className={selectScrollButton({ class: className })}
      {...rest}
      data-slot="select-scroll-down-button"
    >
      {children}
    </SelectPrimitive.ScrollDownArrow>
  );
}

export default SelectScrollDownButton;
