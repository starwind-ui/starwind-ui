import SidebarPrimitive from "@starwind-ui/react/sidebar";
import type * as React from "react";
import { sidebarProvider } from "./variants";

export type SidebarProviderProps = React.ComponentPropsWithoutRef<"div"> & {
  defaultOpen?: boolean;
  defaultMobileOpen?: boolean;
  open?: boolean;
  mobileOpen?: boolean;
  onOpenChange?: (
    open: boolean,
    details: import("@starwind-ui/react/sidebar").SidebarOpenChangeDetails,
  ) => void;
  onMobileOpenChange?: (
    open: boolean,
    details: import("@starwind-ui/react/sidebar").SidebarMobileOpenChangeDetails,
  ) => void;
  keyboardShortcut?: string;
  mobileQuery?: string;
  persistOpen?: boolean;
  persistenceKey?: string;
  persistenceStorage?: "localStorage" | "cookie" | false;
  persistenceMaxAge?: number;
  ref?: React.Ref<HTMLDivElement>;
};

function SidebarProvider(props: SidebarProviderProps) {
  const {
    defaultOpen = true,
    defaultMobileOpen = false,
    open,
    mobileOpen,
    onOpenChange,
    onMobileOpenChange,
    keyboardShortcut = "b",
    mobileQuery = "(max-width: 767.98px)",
    persistOpen = false,
    persistenceKey,
    persistenceStorage,
    persistenceMaxAge = 604800,
    style,
    ref,
    className,
    children,
    ...rest
  } = props;

  const providerStyle = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "3.5rem",
    ...style,
  } as React.CSSProperties;

  return (
    <SidebarPrimitive.Provider
      className={sidebarProvider({ class: className })}
      defaultOpen={defaultOpen}
      defaultMobileOpen={defaultMobileOpen}
      open={open}
      mobileOpen={mobileOpen}
      onOpenChange={onOpenChange}
      onMobileOpenChange={onMobileOpenChange}
      data-keyboard-shortcut={keyboardShortcut}
      data-mobile-query={mobileQuery}
      keyboardShortcut={keyboardShortcut}
      mobileQuery={mobileQuery}
      persistOpen={persistOpen}
      persistenceKey={persistenceKey}
      persistenceStorage={persistenceStorage}
      persistenceMaxAge={persistenceMaxAge}
      style={providerStyle}
      {...rest}
      ref={ref}
      data-slot="sidebar-provider"
    >
      {children}
    </SidebarPrimitive.Provider>
  );
}

export default SidebarProvider;
