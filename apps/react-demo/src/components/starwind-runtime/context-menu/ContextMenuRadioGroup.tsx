import ContextMenuPrimitive from "@starwind-ui/react/context-menu";
import type * as React from "react";
import { contextMenuRadioGroup } from "./variants";

export type ContextMenuRadioGroupProps = React.ComponentPropsWithoutRef<"div"> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (
    value: string,
    details: import("@starwind-ui/react/context-menu").MenuValueChangeDetails,
  ) => void;
};

function ContextMenuRadioGroup(props: ContextMenuRadioGroupProps) {
  const { className, value, defaultValue, onValueChange, children, ...rest } = props;

  return (
    <ContextMenuPrimitive.RadioGroup
      className={contextMenuRadioGroup({ class: className })}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      {...rest}
      data-slot="context-menu-radio-group"
    >
      {children}
    </ContextMenuPrimitive.RadioGroup>
  );
}

export default ContextMenuRadioGroup;
