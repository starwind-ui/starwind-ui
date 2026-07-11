import PreviewCardPrimitive from "@starwind-ui/react/preview-card";
import type * as React from "react";
import { hoverCard } from "./variants";

export type HoverCardProps = React.ComponentPropsWithoutRef<"div"> & {
  defaultOpen?: boolean;
  open?: boolean;
  closeDelay?: number;
  closeOnEscape?: boolean;
  closeOnOutsideInteract?: boolean;
  disableHoverableContent?: boolean;
  onOpenChange?: (
    open: boolean,
    details: import("@starwind-ui/react/preview-card").PreviewCardOpenChangeDetails,
  ) => void;
  openDelay?: number;
};

function HoverCard(props: HoverCardProps) {
  const {
    defaultOpen = false,
    open,
    closeDelay = 300,
    closeOnEscape = true,
    closeOnOutsideInteract = true,
    disableHoverableContent = false,
    onOpenChange,
    openDelay = 600,
    className,
    children,
    ...rest
  } = props;

  return (
    <PreviewCardPrimitive.Root
      className={hoverCard({ class: className })}
      defaultOpen={defaultOpen}
      open={open}
      closeDelay={closeDelay}
      closeOnEscape={closeOnEscape}
      closeOnOutsideInteract={closeOnOutsideInteract}
      disableHoverableContent={disableHoverableContent}
      onOpenChange={onOpenChange}
      openDelay={openDelay}
      {...rest}
      data-slot="hover-card"
    >
      {children}
    </PreviewCardPrimitive.Root>
  );
}

export default HoverCard;
