import ColorPickerPrimitive from "@starwind-ui/react/color-picker";
import * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { colorPicker } from "./variants";

export type ColorPickerRootProps = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "value" | "defaultValue" | "onChange" | "dir"
> &
  VariantProps<typeof colorPicker> & {
    value?: import("@starwind-ui/react/color-picker").ColorPickerValue;
    defaultValue?: import("@starwind-ui/react/color-picker").ColorPickerValue;
    format?: import("@starwind-ui/react/color-picker").ColorPickerFormat;
    alpha?: boolean;
    allowEmpty?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    name?: string;
    form?: string;
    required?: boolean;
    locale?: string;
    dir?: import("@starwind-ui/react/color-picker").ColorPickerDirection;
    onValueChange?: (
      value: import("@starwind-ui/react/color-picker").ColorPickerColor | null,
      details: import("@starwind-ui/react/color-picker").ColorPickerValueChangeDetails,
    ) => void;
    onValueCommitted?: (
      value: import("@starwind-ui/react/color-picker").ColorPickerColor | null,
      details: import("@starwind-ui/react/color-picker").ColorPickerValueCommitDetails,
    ) => void;
    onFormatChange?: (
      format: import("@starwind-ui/react/color-picker").ColorPickerFormat,
      details: import("@starwind-ui/react/color-picker").ColorPickerFormatChangeDetails,
    ) => void;
    ref?: React.Ref<HTMLDivElement>;
  };

const ColorPickerRoot = React.forwardRef<HTMLDivElement, ColorPickerRootProps>(
  function ColorPickerRoot(props, forwardedRef) {
    const {
      value,
      defaultValue = "#000000",
      format,
      alpha = true,
      allowEmpty = false,
      disabled = false,
      readOnly = false,
      name,
      form,
      required = false,
      locale,
      dir,
      onValueChange,
      onValueCommitted,
      onFormatChange,
      className,
      size = "md",
      children,
      ...rest
    } = props;

    return (
      <ColorPickerPrimitive.Root
        className={colorPicker({ size, class: className })}
        value={value}
        defaultValue={defaultValue}
        format={format}
        alpha={alpha}
        allowEmpty={allowEmpty}
        disabled={disabled}
        readOnly={readOnly}
        name={name}
        form={form}
        required={required}
        locale={locale}
        dir={dir}
        onValueChange={onValueChange}
        onValueCommitted={onValueCommitted}
        onFormatChange={onFormatChange}
        {...rest}
        ref={forwardedRef}
        data-slot="color-picker"
      >
        {children}
      </ColorPickerPrimitive.Root>
    );
  },
);

ColorPickerRoot.displayName = "ColorPickerRoot";

export default ColorPickerRoot;
