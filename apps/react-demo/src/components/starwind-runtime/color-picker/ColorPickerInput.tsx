import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import ColorPickerFormatSelect from "./ColorPickerFormatSelect";
import ColorPickerNativeFormatSelect from "./ColorPickerNativeFormatSelect";
import ColorPickerValueInput from "./ColorPickerValueInput";
import { colorPickerInput } from "./variants";

export type ColorPickerInputProps = React.ComponentPropsWithoutRef<"div"> &
  VariantProps<typeof colorPickerInput> & {
    formatControl?: "select" | "native";
  };

function ColorPickerInput(props: ColorPickerInputProps) {
  const { formatControl = "select", className, size = "md", ...rest } = props;

  return (
    <div
      className={colorPickerInput({ size, class: className })}
      {...rest}
      data-slot="color-picker-input"
    >
      <ColorPickerValueInput size={size} />

      {formatControl === "native" ? (
        <ColorPickerNativeFormatSelect size={size} />
      ) : (
        <ColorPickerFormatSelect size={size} />
      )}
    </div>
  );
}

export default ColorPickerInput;
