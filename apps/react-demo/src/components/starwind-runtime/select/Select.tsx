import SelectPrimitive from "@starwind-ui/react/select";
import type * as React from "react";
import { select } from "./variants";

export type SelectProps = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "defaultValue" | "onChange"
> & {
  autoComplete?: string;
  defaultOpen?: boolean;
  defaultValue?: string | null;
  disabled?: boolean;
  form?: string;
  highlightItemOnHover?: boolean;
  modal?: boolean;
  name?: string;
  open?: boolean;
  readOnly?: boolean;
  required?: boolean;
  value?: string | null;
  onOpenChange?: (
    open: boolean,
    details: import("@starwind-ui/react/select").SelectOpenChangeDetails,
  ) => void;
  onValueChange?: (
    value: string | null,
    details: import("@starwind-ui/react/select").SelectValueChangeDetails,
  ) => void;
};

function Select(props: SelectProps) {
  const {
    autoComplete,
    defaultOpen = false,
    defaultValue,
    disabled = false,
    form,
    highlightItemOnHover = true,
    modal = true,
    name,
    open,
    readOnly = false,
    required = false,
    value,
    onOpenChange,
    onValueChange,
    className,
    children,
    ...rest
  } = props;

  return (
    <SelectPrimitive.Root
      className={select({ class: className })}
      autoComplete={autoComplete}
      defaultOpen={defaultOpen}
      defaultValue={defaultValue}
      disabled={disabled}
      form={form}
      highlightItemOnHover={highlightItemOnHover}
      modal={modal}
      name={name}
      open={open}
      readOnly={readOnly}
      required={required}
      value={value}
      onOpenChange={onOpenChange}
      onValueChange={onValueChange}
      {...rest}
      data-slot="select"
    >
      {children}
    </SelectPrimitive.Root>
  );
}

export default Select;
