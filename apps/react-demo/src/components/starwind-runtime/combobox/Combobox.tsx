import ComboboxPrimitive from "@starwind-ui/react/combobox";
import type * as React from "react";
import { combobox } from "./variants";

export type ComboboxProps = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "defaultValue" | "onChange"
> & {
  autoComplete?: string;
  defaultInputValue?: string;
  defaultOpen?: boolean;
  defaultValue?: string | null;
  disabled?: boolean;
  filterMode?: "contains" | "startsWith";
  form?: string;
  highlightItemOnHover?: boolean;
  inputValue?: string;
  locale?: string;
  modal?: boolean;
  name?: string;
  open?: boolean;
  readOnly?: boolean;
  required?: boolean;
  value?: string | null;
  onInputValueChange?: (
    inputValue: string,
    details: import("@starwind-ui/react/combobox").ComboboxInputValueChangeDetails,
  ) => void;
  onOpenChange?: (
    open: boolean,
    details: import("@starwind-ui/react/combobox").ComboboxOpenChangeDetails,
  ) => void;
  onValueChange?: (
    value: string | null,
    details: import("@starwind-ui/react/combobox").ComboboxValueChangeDetails,
  ) => void;
};

function Combobox(props: ComboboxProps) {
  const {
    autoComplete,
    defaultInputValue,
    defaultOpen = false,
    defaultValue,
    disabled = false,
    filterMode = "contains",
    form,
    highlightItemOnHover = true,
    inputValue,
    locale,
    modal = false,
    name,
    open,
    readOnly = false,
    required = false,
    value,
    onInputValueChange,
    onOpenChange,
    onValueChange,
    className,
    children,
    ...rest
  } = props;

  return (
    <ComboboxPrimitive.Root
      className={combobox({ class: className })}
      autoComplete={autoComplete}
      defaultInputValue={defaultInputValue}
      defaultOpen={defaultOpen}
      defaultValue={defaultValue}
      disabled={disabled}
      filterMode={filterMode}
      form={form}
      highlightItemOnHover={highlightItemOnHover}
      inputValue={inputValue}
      locale={locale}
      modal={modal}
      name={name}
      open={open}
      readOnly={readOnly}
      required={required}
      value={value}
      onInputValueChange={onInputValueChange}
      onOpenChange={onOpenChange}
      onValueChange={onValueChange}
      {...rest}
      data-slot="combobox"
    >
      {children}
    </ComboboxPrimitive.Root>
  );
}

export default Combobox;
