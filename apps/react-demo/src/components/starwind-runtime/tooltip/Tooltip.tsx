import TooltipPrimitive from "@starwind-ui/react/tooltip";
import type * as React from "react";
import { tooltip } from "./variants";

export type TooltipProps = React.ComponentPropsWithoutRef<"div"> & {
  defaultOpen?: boolean;
  open?: boolean;
  closeDelay?: number;
  closeOnEscape?: boolean;
  closeOnOutsideInteract?: boolean;
  disabled?: boolean;
  disableHoverableContent?: boolean;
  onOpenChange?: (
    open: boolean,
    details: import("@starwind-ui/react/tooltip").TooltipOpenChangeDetails,
  ) => void;
  openDelay?: number;
};

function Tooltip(props: TooltipProps) {
  const {
    defaultOpen = false,
    open,
    closeDelay = 200,
    closeOnEscape = true,
    closeOnOutsideInteract = true,
    disabled = false,
    disableHoverableContent = false,
    onOpenChange,
    openDelay = 200,
    className,
    children,
    ...rest
  } = props;

  return (
    <TooltipPrimitive.Root
      className={tooltip({ class: className })}
      defaultOpen={defaultOpen}
      open={open}
      closeDelay={closeDelay}
      closeOnEscape={closeOnEscape}
      closeOnOutsideInteract={closeOnOutsideInteract}
      disabled={disabled}
      disableHoverableContent={disableHoverableContent}
      onOpenChange={onOpenChange}
      openDelay={openDelay}
      {...rest}
      data-slot="tooltip"
    >
      {children}
    </TooltipPrimitive.Root>
  );
}

export default Tooltip;
