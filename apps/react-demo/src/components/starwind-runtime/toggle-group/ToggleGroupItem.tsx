import TogglePrimitive from "@starwind-ui/react/toggle";
import type * as React from "react";
import { toggleGroupItem } from "./variants";

export type ToggleGroupItemProps = Omit<
  React.ComponentPropsWithoutRef<"button">,
  "aria-pressed" | "defaultPressed" | "disabled" | "onChange" | "type" | "value"
> & {
  defaultPressed?: boolean;
  disabled?: boolean;
  nativeButton?: boolean;
  onPressedChange?: (
    pressed: boolean,
    details: import("@starwind-ui/react/toggle").TogglePressedChangeDetails,
  ) => void;
  pressed?: boolean;
  ref?: React.Ref<HTMLButtonElement | HTMLSpanElement>;
  size?: "sm" | "md" | "lg";
  value?: string;
  variant?: "default" | "outline";
};

function ToggleGroupItem(props: ToggleGroupItemProps) {
  const {
    variant,
    size,
    defaultPressed,
    disabled = false,
    nativeButton,
    onPressedChange,
    pressed,
    ref,
    value,
    className,
    children,
    ...rest
  } = props;

  return (
    <TogglePrimitive.Root
      className={toggleGroupItem({ variant, size, class: className })}
      data-variant={variant}
      data-size={size}
      defaultPressed={defaultPressed}
      disabled={disabled}
      nativeButton={nativeButton}
      onPressedChange={onPressedChange}
      pressed={pressed}
      ref={ref}
      value={value}
      {...rest}
      data-slot="toggle-group-item"
    >
      {children}
    </TogglePrimitive.Root>
  );
}

export default ToggleGroupItem;
