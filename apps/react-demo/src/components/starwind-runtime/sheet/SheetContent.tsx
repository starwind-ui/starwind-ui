import SheetPrimitive from "@starwind-ui/react/drawer";
import { IconX as X } from "@tabler/icons-react";
import type * as React from "react";
import { Button } from "../button";
import { sheetBackdrop, sheetCloseButton, sheetContent } from "./variants";

export type SheetContentProps = React.ComponentPropsWithoutRef<"dialog"> & {
  side?: "top" | "right" | "bottom" | "left";
  backdrop?: React.ReactNode;
  icon?: React.ReactNode;
};

function SheetContent(props: SheetContentProps) {
  const { className, side = "right", children, backdrop, icon, ...rest } = props;

  return (
    <>
      {backdrop ?? (
        <SheetPrimitive.Backdrop
          className={sheetBackdrop()}
          data-state="closed"
          hidden
          data-slot="sheet-backdrop"
        />
      )}

      <SheetPrimitive.Popup
        className={sheetContent({ side, class: className })}
        data-state="closed"
        side={side}
        {...rest}
        data-slot="sheet-content"
      >
        {children}

        <Button
          variant="ghost"
          size="icon-sm"
          className={sheetCloseButton()}
          data-slot="sheet-close"
          data-sw-drawer-close
        >
          {icon ?? <X className="size-5 transition-opacity" />}

          <span className="sr-only">Close sheet</span>
        </Button>

        <div
          className="pointer-events-none fixed inset-0"
          data-floating-root
          data-slot="floating-root"
        />
      </SheetPrimitive.Popup>
    </>
  );
}

export default SheetContent;
