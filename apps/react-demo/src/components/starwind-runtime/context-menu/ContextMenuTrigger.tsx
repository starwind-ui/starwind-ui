import ContextMenuPrimitive from "@starwind-ui/react/context-menu";
import type * as React from "react";
import { contextMenuTrigger } from "./variants";

export type ContextMenuTriggerProps = React.ComponentPropsWithoutRef<"div"> & {
  disabled?: boolean;
  ref?: React.Ref<HTMLDivElement>;
};

function ContextMenuTrigger(props: ContextMenuTriggerProps) {
  const { disabled = false, ref, className, children, ...rest } = props;

  return (
    <ContextMenuPrimitive.Trigger
      className={contextMenuTrigger({ class: className })}
      disabled={disabled}
      ref={ref}
      {...rest}
      data-slot="context-menu-trigger"
    >
      {children}
    </ContextMenuPrimitive.Trigger>
  );
}

export default ContextMenuTrigger;
