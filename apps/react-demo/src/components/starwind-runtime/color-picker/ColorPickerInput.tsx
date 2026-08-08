"use client";

import type * as React from "react";
import "./styles.css";
import ColorPickerPrimitive from "@starwind-ui/react/color-picker";
import { IconChevronDown as ChevronDown } from "@tabler/icons-react";
import { NativeSelectOption } from "../native-select";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../select";
import {
  colorPickerFormatSelectTrigger,
  colorPickerInput,
  colorPickerNativeFormatSelect,
  colorPickerNativeFormatSelectIcon,
  colorPickerNativeFormatSelectWrapper,
  colorPickerValueInput,
  colorPickerValueInputLayout,
} from "./variants";

export type ColorPickerInputProps = React.ComponentPropsWithoutRef<"div"> & {
  formatControl?: "select" | "native" | "none";
  formats?: readonly import("@starwind-ui/react/color-picker").ColorPickerFormat[];
  formatContentSize?: "sm" | "md" | "lg";
};

function ColorPickerInput(props: ColorPickerInputProps) {
  const {
    formatControl = "select",
    formats = ["hex", "rgb", "hsl", "hsb"],
    formatContentSize = "md",
    className,
    ...rest
  } = props;

  const normalizedFormats = Array.from(new Set(formats));

  return (
    <div
      className={colorPickerInput({ class: className })}
      {...rest}
      data-slot="color-picker-input"
    >
      <ColorPickerPrimitive.ValueInput
        className={[colorPickerValueInput(), colorPickerValueInputLayout()]
          .filter(Boolean)
          .join(" ")}
        data-slot="color-picker-value-input"
      />

      {formatControl === "native" && (
        <div
          className={colorPickerNativeFormatSelectWrapper()}
          data-slot="color-picker-native-format-select-wrapper"
        >
          <ColorPickerPrimitive.FormatSelect
            className={colorPickerNativeFormatSelect()}
            aria-label="Color format"
            data-slot="color-picker-native-format-select"
          >
            {normalizedFormats.map((formatOption, formatIndex) => (
              <NativeSelectOption value={formatOption} key={`${formatOption}-${formatIndex}`}>
                {formatOption.toUpperCase()}
              </NativeSelectOption>
            ))}
          </ColorPickerPrimitive.FormatSelect>

          <ChevronDown
            className={colorPickerNativeFormatSelectIcon()}
            aria-hidden="true"
            data-slot="color-picker-native-format-select-icon"
          />
        </div>
      )}

      {formatControl === "select" && (
        <ColorPickerPrimitive.FormatControl
          className="shrink-0"
          data-slot="color-picker-format-control"
        >
          <Select>
            <SelectTrigger aria-label="Color format" className={colorPickerFormatSelectTrigger()} />

            <SelectContent size={formatContentSize} data-sw-color-picker-format-options="">
              {normalizedFormats.map((formatOption, formatIndex) => (
                <SelectItem value={formatOption} key={`${formatOption}-${formatIndex}`}>
                  {formatOption.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ColorPickerPrimitive.FormatControl>
      )}
    </div>
  );
}

export default ColorPickerInput;
