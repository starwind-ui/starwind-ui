import ContextMenuPrimitive from "@starwind-ui/react/context-menu";
import { IconChevronRight as ChevronRight } from "@tabler/icons-react";
import type * as React from "react";
import { contextMenuItem } from "./variants";

export type ContextMenuSubTriggerProps = React.ComponentPropsWithoutRef<"div"> & {
  inset?: boolean;
  disabled?: boolean;
};

function ContextMenuSubTrigger(props: ContextMenuSubTriggerProps) {
  const { className, inset = false, disabled = false, children, ...rest } = props;

  const subTriggerClassName = className;

  return (
    <ContextMenuPrimitive.SubmenuTrigger
      className={contextMenuItem({ inset, disabled, class: subTriggerClassName })}
      disabled={disabled}
      {...rest}
      data-slot="context-menu-sub-trigger"
    >
      {children}

      <ChevronRight className="ml-auto size-4" />
    </ContextMenuPrimitive.SubmenuTrigger>
  );
}

export default ContextMenuSubTrigger;
