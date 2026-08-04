import PreviewCardPrimitive from "@starwind-ui/react/preview-card";
import type * as React from "react";
import { hoverCardTrigger } from "./variants";

export type HoverCardTriggerProps = React.ComponentPropsWithoutRef<"a"> & {
  asChild?: boolean;
  closeDelay?: number;
  disabled?: boolean;
  openDelay?: number;
};

function HoverCardTrigger(props: HoverCardTriggerProps) {
  const {
    asChild = false,
    closeDelay,
    disabled = false,
    openDelay,
    className,
    children,
    ...rest
  } = props;

  const triggerBaseClassName = hoverCardTrigger({ class: className });
  const triggerClassName = asChild ? className : triggerBaseClassName;

  return (
    <PreviewCardPrimitive.Trigger
      className={triggerClassName}
      asChild={asChild}
      closeDelay={closeDelay}
      disabled={disabled}
      openDelay={openDelay}
      {...rest}
      data-slot="hover-card-trigger"
    >
      {children}
    </PreviewCardPrimitive.Trigger>
  );
}

export default HoverCardTrigger;
