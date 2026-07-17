import ColorPickerPrimitive from "@starwind-ui/react/color-picker";
import { IconChevronDown as ChevronDown } from "@tabler/icons-react";
import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { NativeSelectOption } from "../native-select";
import {
  colorPickerNativeFormatSelect,
  colorPickerNativeFormatSelectIcon,
  colorPickerNativeFormatSelectWrapper,
} from "./variants";

export type ColorPickerNativeFormatSelectProps = Omit<
  React.ComponentPropsWithoutRef<"select">,
  "size"
> &
  VariantProps<typeof colorPickerNativeFormatSelect>;

function ColorPickerNativeFormatSelect(props: ColorPickerNativeFormatSelectProps) {
  const { className, size = "md", ...rest } = props;

  return (
    <div
      className={colorPickerNativeFormatSelectWrapper()}
      data-slot="color-picker-native-format-select-wrapper"
    >
      <ColorPickerPrimitive.FormatSelect
        className={colorPickerNativeFormatSelect({ size, class: className })}
        aria-label="Color format"
        {...rest}
        data-slot="color-picker-native-format-select"
      >
        <NativeSelectOption value="hex">HEX</NativeSelectOption>

        <NativeSelectOption value="rgb">RGB</NativeSelectOption>

        <NativeSelectOption value="hsl">HSL</NativeSelectOption>

        <NativeSelectOption value="hsb">HSB</NativeSelectOption>
      </ColorPickerPrimitive.FormatSelect>

      <ChevronDown
        className={colorPickerNativeFormatSelectIcon({ size })}
        aria-hidden="true"
        data-slot="color-picker-native-format-select-icon"
      />
    </div>
  );
}

export default ColorPickerNativeFormatSelect;
