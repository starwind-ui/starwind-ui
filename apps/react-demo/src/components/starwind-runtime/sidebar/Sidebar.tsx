import SidebarPrimitive from "@starwind-ui/react/sidebar";
import type * as React from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../sheet";
import {
  sidebar,
  sidebarContainer,
  sidebarGap,
  sidebarInner,
  sidebarMobileContent,
} from "./variants";

export type SidebarProps = React.ComponentPropsWithoutRef<"div"> & {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
  ref?: React.Ref<HTMLDivElement>;
};

function Sidebar(props: SidebarProps) {
  const {
    side = "left",
    variant = "sidebar",
    collapsible = "offcanvas",
    ref,
    className,
    children,
    ...rest
  } = props;

  const mobileStyle = { "--sidebar-width": "18rem" } as React.CSSProperties;

  if (collapsible === "none") {
    return (
      <div
        className={[
          "bg-sidebar text-sidebar-foreground flex h-full w-(--sidebar-width) flex-col",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
        ref={ref}
        data-slot="sidebar"
      >
        {children}
      </div>
    );
  }

  return (
    <>
      <SidebarPrimitive.Sidebar
        className={sidebar({ class: className })}
        data-state="expanded"
        data-collapsible=""
        data-collapsible-mode={collapsible}
        collapsible={collapsible}
        data-variant={variant}
        variant={variant}
        data-side={side}
        side={side}
        data-slot="sidebar"
      >
        <div data-slot="sidebar-gap" className={sidebarGap({ variant })} />

        <div
          className={sidebarContainer({ side, variant })}
          {...rest}
          ref={ref}
          data-slot="sidebar-container"
        >
          <div
            data-sidebar="sidebar"
            data-slot="sidebar-inner"
            className={sidebarInner({ variant })}
          >
            {children}
          </div>
        </div>
      </SidebarPrimitive.Sidebar>

      <Sheet className="md:hidden" data-sidebar="mobile" data-slot="sidebar-mobile">
        <SheetContent
          side={side}
          className={sidebarMobileContent()}
          style={mobileStyle}
          data-sidebar="sidebar"
          data-slot="sidebar-mobile-content"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>

            <SheetDescription>Mobile navigation sidebar</SheetDescription>
          </SheetHeader>

          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default Sidebar;
