"use client";

import ColorPickerPrimitive from "@starwind-ui/react/color-picker";
import * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { Popover } from "../popover";
import ColorPickerContent from "./ColorPickerContent";
import ColorPickerDefaultEditor from "./ColorPickerDefaultEditor";
import ColorPickerTrigger from "./ColorPickerTrigger";
import {
  colorPicker,
  colorPickerControl,
  colorPickerHiddenInput,
  colorPickerLabel,
} from "./variants";

export type ColorPickerProps = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "value" | "defaultValue" | "onChange" | "dir"
> &
  VariantProps<typeof colorPicker> & {
    value?: import("@starwind-ui/react/color-picker").ColorPickerValue;
    defaultValue?: import("@starwind-ui/react/color-picker").ColorPickerValue;
    format?: import("@starwind-ui/react/color-picker").ColorPickerFormat;
    alpha?: boolean;
    clearable?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    name?: string;
    form?: string;
    required?: boolean;
    locale?: string;
    dir?: import("@starwind-ui/react/color-picker").ColorPickerDirection;
    inline?: boolean;
    label?: string;
    showEyeDropper?: boolean;
    showValueText?: boolean;
    formatControl?: "select" | "native" | "none";
    formats?: readonly import("@starwind-ui/react/color-picker").ColorPickerFormat[];
    swatches?: readonly (
      | import("@starwind-ui/react/color-picker").ColorPickerValue
      | {
          value: import("@starwind-ui/react/color-picker").ColorPickerValue;
          label: string;
          disabled?: boolean;
        }
    )[];
    defaultOpen?: boolean;
    open?: boolean;
    closeOnEscape?: boolean;
    closeOnOutsideInteract?: boolean;
    modal?: boolean;
    openOnHover?: boolean;
    closeDelay?: number;
    side?: "top" | "right" | "bottom" | "left";
    align?: "start" | "center" | "end";
    sideOffset?: number;
    avoidCollisions?: boolean;
    portalContainer?: string;
    disablePortal?: boolean;
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
    onOpenChange?: React.ComponentProps<typeof Popover>["onOpenChange"];
    onCloseComplete?: React.ComponentProps<typeof Popover>["onCloseComplete"];
    ref?: React.Ref<HTMLDivElement>;
  };

const ColorPicker = React.forwardRef<HTMLDivElement, ColorPickerProps>(
  function ColorPicker(props, forwardedRef) {
    const {
      value,
      defaultValue = "#000000",
      format,
      alpha = true,
      clearable = false,
      disabled = false,
      readOnly = false,
      name,
      form,
      required = false,
      locale,
      dir,
      inline = false,
      label,
      showEyeDropper = true,
      showValueText = true,
      formatControl = "select",
      formats = ["hex", "rgb", "hsl", "hsb"],
      swatches = [],
      defaultOpen = false,
      open,
      closeOnEscape = true,
      closeOnOutsideInteract = true,
      modal = false,
      openOnHover = false,
      closeDelay = 200,
      side = "bottom",
      align = "start",
      sideOffset = 4,
      avoidCollisions = true,
      portalContainer,
      disablePortal = false,
      onValueChange,
      onValueCommitted,
      onFormatChange,
      onOpenChange,
      onCloseComplete,
      className,
      size = "md",
      children,
      ...rest
    } = props;

    const initialFormat = format ?? formats[0] ?? "hex";
    const uncontrolledFormatState = React.useState(initialFormat);
    const uncontrolledFormat = uncontrolledFormatState[0];
    const setUncontrolledFormat = uncontrolledFormatState[1];
    const resolvedFormat = format ?? uncontrolledFormat;
    const requestedFormats = Array.from(new Set(formats));
    const normalizedFormats = requestedFormats.includes(resolvedFormat)
      ? requestedFormats
      : [resolvedFormat, ...requestedFormats];
    const handleFormatChange = (...args: Parameters<NonNullable<typeof onFormatChange>>) => {
      const [nextFormat, details] = args;
      if (format === undefined) setUncontrolledFormat(nextFormat);
      onFormatChange?.(nextFormat, details);
    };

    if (inline) {
      return (
        <ColorPickerPrimitive.Root
          className={colorPicker({ size, class: className })}
          value={value}
          defaultValue={defaultValue}
          format={resolvedFormat}
          alpha={alpha}
          allowEmpty={clearable}
          disabled={disabled}
          readOnly={readOnly}
          name={name}
          form={form}
          required={required}
          locale={locale}
          dir={dir}
          onValueChange={onValueChange}
          onValueCommitted={onValueCommitted}
          onFormatChange={handleFormatChange}
          {...rest}
          data-size={size}
          ref={forwardedRef}
          data-slot="color-picker"
        >
          {children ?? (
            <>
              {label != null && (
                <ColorPickerPrimitive.Label
                  className={colorPickerLabel()}
                  data-slot="color-picker-label"
                >
                  {label}
                </ColorPickerPrimitive.Label>
              )}

              <ColorPickerDefaultEditor
                size={size}
                formatControl={formatControl}
                formats={normalizedFormats}
                showEyeDropper={showEyeDropper}
                swatches={swatches}
                portalContainer={portalContainer}
                disablePortal={disablePortal}
              />
            </>
          )}

          <ColorPickerPrimitive.HiddenInput
            className={colorPickerHiddenInput()}
            data-slot="color-picker-hidden-input"
          />
        </ColorPickerPrimitive.Root>
      );
    }

    return (
      <Popover
        defaultOpen={defaultOpen}
        open={open}
        closeOnEscape={closeOnEscape}
        closeOnOutsideInteract={closeOnOutsideInteract}
        modal={modal}
        openOnHover={openOnHover}
        closeDelay={closeDelay}
        onOpenChange={onOpenChange}
        onCloseComplete={onCloseComplete}
      >
        <ColorPickerPrimitive.Root
          className={colorPicker({ size, class: className })}
          value={value}
          defaultValue={defaultValue}
          format={resolvedFormat}
          alpha={alpha}
          allowEmpty={clearable}
          disabled={disabled}
          readOnly={readOnly}
          name={name}
          form={form}
          required={required}
          locale={locale}
          dir={dir}
          onValueChange={onValueChange}
          onValueCommitted={onValueCommitted}
          onFormatChange={handleFormatChange}
          {...rest}
          data-size={size}
          data-floating-root={true}
          ref={forwardedRef}
          data-slot="color-picker"
        >
          {children ?? (
            <>
              {label != null && (
                <ColorPickerPrimitive.Label
                  className={colorPickerLabel()}
                  data-slot="color-picker-label"
                >
                  {label}
                </ColorPickerPrimitive.Label>
              )}

              <>
                <ColorPickerPrimitive.Control
                  className={colorPickerControl()}
                  data-slot="color-picker-control"
                >
                  <ColorPickerTrigger
                    showValueText={showValueText}
                    aria-label={label ? `Open ${label.toLowerCase()} picker` : "Open color picker"}
                  />
                </ColorPickerPrimitive.Control>

                <ColorPickerContent
                  size={size}
                  formatControl={formatControl}
                  formats={normalizedFormats}
                  showEyeDropper={showEyeDropper}
                  swatches={swatches}
                  side={side}
                  align={align}
                  sideOffset={sideOffset}
                  avoidCollisions={avoidCollisions}
                  portalContainer={portalContainer}
                  disablePortal={disablePortal}
                  aria-label={label ? `${label} editor` : "Color editor"}
                />
              </>
            </>
          )}

          <ColorPickerPrimitive.HiddenInput
            className={colorPickerHiddenInput()}
            data-slot="color-picker-hidden-input"
          />
        </ColorPickerPrimitive.Root>
      </Popover>
    );
  },
);

ColorPicker.displayName = "ColorPicker";

export default ColorPicker;
