import NavigationMenuPrimitive from "@starwind-ui/react/navigation-menu";
import { IconChevronDown as ChevronDown } from "@tabler/icons-react";
import type * as React from "react";
import { navigationMenuIndicator, navigationMenuTrigger } from "./variants";

export type NavigationMenuTriggerProps = React.ComponentPropsWithoutRef<"button"> & {
  asChild?: boolean;
  disabled?: boolean;
  openDelay?: number;
  closeDelay?: number;
  showIcon?: boolean;
  iconClass?: string;
  icon?: React.ReactNode;
};

function NavigationMenuTrigger(props: NavigationMenuTriggerProps) {
  const {
    asChild = false,
    disabled = false,
    openDelay,
    closeDelay,
    showIcon = true,
    iconClass: iconClassName,
    className,
    children,
    icon,
    ...rest
  } = props;

  if (asChild) {
    return (
      <NavigationMenuPrimitive.Trigger
        className={navigationMenuTrigger({ class: className })}
        asChild={asChild}
        disabled={disabled}
        openDelay={openDelay}
        closeDelay={closeDelay}
        {...rest}
        data-slot="navigation-menu-trigger"
      >
        {children}
      </NavigationMenuPrimitive.Trigger>
    );
  }

  return (
    <NavigationMenuPrimitive.Trigger
      className={navigationMenuTrigger({ class: className })}
      asChild={asChild}
      disabled={disabled}
      openDelay={openDelay}
      closeDelay={closeDelay}
      {...rest}
      data-slot="navigation-menu-trigger"
    >
      {children}

      {showIcon && (
        <NavigationMenuPrimitive.Icon
          className={navigationMenuIndicator({ class: iconClassName })}
          data-slot="navigation-menu-indicator"
        >
          {icon ?? <ChevronDown />}
        </NavigationMenuPrimitive.Icon>
      )}
    </NavigationMenuPrimitive.Trigger>
  );
}

export default NavigationMenuTrigger;
