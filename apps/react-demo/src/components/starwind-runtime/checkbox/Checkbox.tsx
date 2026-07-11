import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import "./styles.css";
import CheckboxPrimitive from "@starwind-ui/react/checkbox";
import { IconCheck as Check } from "@tabler/icons-react";
import { checkbox, checkboxIndicator, checkboxLabel, checkboxWrapper } from "./variants";

export type CheckboxProps = Omit<
  React.ComponentPropsWithoutRef<"span">,
  "defaultChecked" | "id" | "onChange"
> &
  VariantProps<typeof checkbox> & {
    checked?: boolean;
    defaultChecked?: boolean;
    disabled?: boolean;
    form?: string;
    id?: string;
    indeterminate?: boolean;
    label?: string;
    name?: string;
    nativeButton?: boolean;
    onCheckedChange?: (
      checked: boolean,
      details: import("@starwind-ui/react/checkbox").CheckboxCheckedChangeDetails,
    ) => void;
    readOnly?: boolean;
    ref?: React.Ref<HTMLSpanElement | HTMLButtonElement>;
    required?: boolean;
    uncheckedValue?: string;
    value?: string;
  };

function Checkbox(props: CheckboxProps) {
  const {
    variant,
    size,
    checked,
    defaultChecked,
    disabled = false,
    form,
    id,
    indeterminate = false,
    label,
    name,
    nativeButton = false,
    onCheckedChange,
    readOnly = false,
    ref,
    required = false,
    uncheckedValue,
    value,
    className,
    ...rest
  } = props;

  const ariaLabel = rest["aria-label"] ?? label;

  return (
    <div className={checkboxWrapper()} data-sw-checkbox-wrapper data-slot="checkbox-wrapper">
      <CheckboxPrimitive.Root
        className={checkbox({ variant, size, class: className })}
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        form={form}
        id={id}
        indeterminate={indeterminate}
        name={name}
        nativeButton={nativeButton}
        onCheckedChange={onCheckedChange}
        readOnly={readOnly}
        ref={ref}
        required={required}
        uncheckedValue={uncheckedValue}
        value={value}
        {...rest}
        aria-label={ariaLabel}
        data-slot="checkbox"
      >
        <CheckboxPrimitive.Indicator
          keepMounted
          className={checkboxIndicator({ variant, size })}
          data-slot="checkbox-indicator"
        >
          <Check data-sw-checkbox-check-icon />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>

      {label && (
        <label htmlFor={id} className={checkboxLabel({ size })} data-slot="checkbox-label">
          {label}
        </label>
      )}
    </div>
  );
}

export default Checkbox;
