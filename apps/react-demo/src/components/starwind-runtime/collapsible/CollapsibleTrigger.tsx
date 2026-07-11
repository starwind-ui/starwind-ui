import CollapsiblePrimitive from "@starwind-ui/react/collapsible";
import type * as React from "react";
import { collapsibleTrigger } from "./variants";

export type CollapsibleTriggerProps = React.ComponentPropsWithoutRef<"button"> & {
  asChild?: boolean;
};

function CollapsibleTrigger(props: CollapsibleTriggerProps) {
  const { asChild = false, className, children, ...rest } = props;

  return (
    <CollapsiblePrimitive.Trigger
      className={collapsibleTrigger({ class: className })}
      asChild={asChild}
      {...rest}
      data-slot="collapsible-trigger"
    >
      {children}
    </CollapsiblePrimitive.Trigger>
  );
}

export default CollapsibleTrigger;
