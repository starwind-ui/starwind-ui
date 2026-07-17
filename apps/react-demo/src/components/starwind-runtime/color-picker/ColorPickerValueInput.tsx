import ColorPickerPrimitive from "@starwind-ui/react/color-picker";
import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { colorPickerValueInput, colorPickerValueInputLayout } from "./variants";

export type ColorPickerValueInputProps = Omit<React.ComponentPropsWithoutRef<"input">, "size"> &
  VariantProps<typeof colorPickerValueInput>;

function ColorPickerValueInput(props: ColorPickerValueInputProps) {
  const { className, size = "md", ...rest } = props;

  return (
    <ColorPickerPrimitive.ValueInput
      className={[colorPickerValueInput({ size }), colorPickerValueInputLayout({ size }), className]
        .filter(Boolean)
        .join(" ")}
      {...rest}
      data-slot="color-picker-value-input"
    />
  );
}

export default ColorPickerValueInput;
