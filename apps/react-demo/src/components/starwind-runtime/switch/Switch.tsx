import SwitchPrimitive from "@starwind-ui/react/switch";
import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { switchButton, switchLabel, switchToggle, switchWrapper } from "./variants";

export type SwitchProps = Omit<
  React.ComponentPropsWithoutRef<"button">,
  "aria-checked" | "defaultChecked" | "onChange" | "role" | "type"
> &
  VariantProps<typeof switchButton> &
  VariantProps<typeof switchToggle> & {
    checked?: boolean;
    defaultChecked?: boolean;
    disabled?: boolean;
    form?: string;
    id: string;
    label?: string;
    name?: string;
    onCheckedChange?: (
      checked: boolean,
      details: import("@starwind-ui/react/switch").SwitchCheckedChangeDetails,
    ) => void;
    padding?: number;
    readOnly?: boolean;
    ref?: React.Ref<HTMLSpanElement | HTMLButtonElement>;
    required?: boolean;
    uncheckedValue?: string;
    value?: string;
  };

function Switch(props: SwitchProps) {
  const {
    variant = "default",
    size = "md",
    checked,
    defaultChecked,
    disabled = false,
    form,
    id,
    label,
    name,
    onCheckedChange,
    padding,
    readOnly = false,
    ref,
    required = false,
    uncheckedValue,
    value,
    className,
    ...rest
  } = props;

  const resolvedPadding = padding ?? (size === "sm" ? 2.5 : size === "lg" ? 4 : 3);
  const sizeMultiplier = size === "sm" ? 4 : size === "lg" ? 6 : 5;
  const ariaLabel = rest["aria-label"] ?? label ?? "switch";
  const switchStyle = {
    "--padding": `${resolvedPadding}px`,
    "--height": `calc((var(--spacing) * ${sizeMultiplier}) + (var(--padding) * 2))`,
    "--width": `calc((var(--spacing) * ${sizeMultiplier} * 2) + (var(--padding) * 3))`,
    "--border-offset": "1px",
  };
  const thumbStyle = {
    "--translation": `calc((var(--spacing) * ${sizeMultiplier}) + (var(--padding) * 2) - var(--border-offset))`,
  };

  return (
    <div className={switchWrapper()} data-sw-switch-wrapper data-slot="switch-wrapper">
      <SwitchPrimitive.Root
        className={switchButton({ variant, class: className })}
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        form={form}
        id={id}
        name={name}
        nativeButton
        onCheckedChange={onCheckedChange}
        readOnly={readOnly}
        ref={ref}
        required={required}
        uncheckedValue={uncheckedValue}
        value={value}
        style={switchStyle as React.CSSProperties}
        {...rest}
        aria-label={ariaLabel}
        data-slot="switch-button"
      >
        <SwitchPrimitive.Thumb
          className={switchToggle({ size })}
          style={thumbStyle as React.CSSProperties}
          data-slot="switch-toggle"
        />
      </SwitchPrimitive.Root>

      {label && (
        <label htmlFor={id} className={switchLabel({ size })} data-slot="switch-label">
          {label}
        </label>
      )}
    </div>
  );
}

export default Switch;
