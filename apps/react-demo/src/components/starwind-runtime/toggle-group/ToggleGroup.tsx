import ToggleGroupPrimitive from "@starwind-ui/react/toggle-group";
import type * as React from "react";
import { toggleGroup } from "./variants";

export type ToggleGroupProps = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "defaultValue" | "onChange"
> & {
  defaultValue?: string[];
  disabled?: boolean;
  loopFocus?: boolean;
  multiple?: boolean;
  orientation?: "horizontal" | "vertical";
  onValueChange?: (
    value: import("@starwind-ui/react/toggle-group").ToggleGroupValue,
    details: import("@starwind-ui/react/toggle-group").ToggleGroupValueChangeDetails,
  ) => void;
  ref?: React.Ref<HTMLDivElement>;
  size?: "sm" | "md" | "lg";
  spacing?: number;
  value?: import("@starwind-ui/react/toggle-group").ToggleGroupValue;
  variant?: "default" | "outline";
};

function ToggleGroup(props: ToggleGroupProps) {
  const {
    variant = "default",
    size = "md",
    spacing = 2,
    defaultValue,
    disabled = false,
    loopFocus,
    multiple = false,
    orientation = "horizontal",
    onValueChange,
    ref,
    value,
    style,
    className,
    children,
    ...rest
  } = props;

  const toggleGroupStyle =
    typeof style === "string"
      ? `--gap: ${spacing}; ${style}`
      : { "--gap": spacing, ...(style ?? {}) };

  return (
    <ToggleGroupPrimitive.Root
      className={toggleGroup({ class: className })}
      data-variant={variant}
      data-size={size}
      data-spacing={spacing}
      data-horizontal={orientation === "horizontal" ? "" : undefined}
      data-vertical={orientation === "vertical" ? "" : undefined}
      defaultValue={defaultValue}
      disabled={disabled}
      loopFocus={loopFocus}
      multiple={multiple}
      orientation={orientation}
      onValueChange={onValueChange}
      ref={ref}
      style={toggleGroupStyle as React.CSSProperties}
      value={value}
      {...rest}
      data-slot="toggle-group"
    >
      {children}
    </ToggleGroupPrimitive.Root>
  );
}

export default ToggleGroup;
