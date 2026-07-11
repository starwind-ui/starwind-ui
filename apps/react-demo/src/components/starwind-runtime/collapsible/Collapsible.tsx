import CollapsiblePrimitive from "@starwind-ui/react/collapsible";
import type * as React from "react";
import { collapsible } from "./variants";

export type CollapsibleProps = React.ComponentPropsWithoutRef<"div"> & {
  defaultOpen?: boolean;
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (
    open: boolean,
    details: import("@starwind-ui/react/collapsible").CollapsibleOpenChangeDetails,
  ) => void;
};

function Collapsible(props: CollapsibleProps) {
  const {
    defaultOpen = false,
    disabled = false,
    open,
    onOpenChange,
    className,
    children,
    ...rest
  } = props;

  return (
    <CollapsiblePrimitive.Root
      className={collapsible({ class: className })}
      defaultOpen={defaultOpen}
      disabled={disabled}
      open={open}
      onOpenChange={onOpenChange}
      {...rest}
      data-slot="collapsible"
    >
      {children}
    </CollapsiblePrimitive.Root>
  );
}

export default Collapsible;
