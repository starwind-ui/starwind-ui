import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import "./styles.css";
import SidebarPrimitive from "@starwind-ui/react/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";
import { sidebarMenuButton } from "./variants";

export type SidebarMenuButtonProps = React.ComponentPropsWithoutRef<"button"> &
  Omit<React.ComponentPropsWithoutRef<"a">, "type"> &
  VariantProps<typeof sidebarMenuButton> & {
    asChild?: boolean;
    isActive?: boolean;
    tooltip?: string;
  };

function SidebarMenuButton(props: SidebarMenuButtonProps) {
  const {
    asChild = false,
    isActive = false,
    tooltip,
    variant,
    size = "default",
    href,
    className,
    children,
    ...rest
  } = props;

  const Tag = (asChild ? "div" : href ? "a" : "button") as React.ElementType;
  const buttonClassName = sidebarMenuButton({ variant, size, class: className });

  if (Boolean(tooltip)) {
    return (
      <Tooltip openDelay={0} closeDelay={0} className="w-full">
        <TooltipTrigger className="w-full">
          <SidebarPrimitive.MenuButton asChild={true}>
            <Tag
              className={buttonClassName}
              data-sidebar="menu-button"
              data-size={size}
              data-active={isActive}
              data-tooltip={tooltip}
              href={href}
              data-slot="sidebar-menu-button"
              type={Tag === "button" ? "button" : undefined}
              data-as-child={asChild ? true : undefined}
              {...rest}
            >
              {children}
            </Tag>
          </SidebarPrimitive.MenuButton>
        </TooltipTrigger>

        <TooltipContent
          side="right"
          align="center"
          className="whitespace-nowrap"
          data-sw-sidebar-tooltip-content
        >
          {tooltip}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <SidebarPrimitive.MenuButton asChild={true}>
      <Tag
        className={buttonClassName}
        data-sidebar="menu-button"
        data-size={size}
        data-active={isActive}
        data-tooltip={tooltip}
        href={href}
        data-slot="sidebar-menu-button"
        type={Tag === "button" ? "button" : undefined}
        data-as-child={asChild ? true : undefined}
        {...rest}
      >
        {children}
      </Tag>
    </SidebarPrimitive.MenuButton>
  );
}

export default SidebarMenuButton;
