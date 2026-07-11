import TogglePrimitive from "@starwind-ui/react/toggle";
import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { toggle } from "./variants";

export type ToggleProps = Omit<
  React.ComponentPropsWithoutRef<"button">,
  "aria-pressed" | "defaultPressed" | "disabled" | "onChange" | "type" | "value"
> &
  VariantProps<typeof toggle> & {
    defaultPressed?: boolean;
    disabled?: boolean;
    nativeButton?: boolean;
    "data-slot"?: string;
    onPressedChange?: (
      pressed: boolean,
      details: import("@starwind-ui/react/toggle").TogglePressedChangeDetails,
    ) => void;
    pressed?: boolean;
    ref?: React.Ref<HTMLButtonElement | HTMLSpanElement>;
    syncGroup?: string;
    value?: string;
  };

function Toggle(props: ToggleProps) {
  const {
    variant,
    size,
    defaultPressed,
    disabled = false,
    nativeButton,
    onPressedChange,
    pressed,
    ref,
    syncGroup,
    value,
    "data-slot": dataSlot = "toggle",
    className,
    children,
    ...rest
  } = props;

  return (
    <TogglePrimitive.Root
      className={toggle({ variant, size, class: className })}
      defaultPressed={defaultPressed}
      disabled={disabled}
      nativeButton={nativeButton}
      onPressedChange={onPressedChange}
      pressed={pressed}
      ref={ref}
      syncGroup={syncGroup}
      value={value}
      {...rest}
      data-slot={dataSlot}
    >
      {children}
    </TogglePrimitive.Root>
  );
}

export default Toggle;
