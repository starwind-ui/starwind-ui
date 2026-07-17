import ColorPickerPrimitive from "@starwind-ui/react/color-picker";
import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { colorPickerHiddenInput } from "./variants";

export type ColorPickerHiddenInputProps = React.ComponentPropsWithoutRef<"input"> &
  VariantProps<typeof colorPickerHiddenInput>;

function ColorPickerHiddenInput(props: ColorPickerHiddenInputProps) {
  const { className, size = "md", ...rest } = props;

  return (
    <ColorPickerPrimitive.HiddenInput
      className={colorPickerHiddenInput({ size, class: className })}
      {...rest}
      data-slot="color-picker-hidden-input"
    />
  );
}

export default ColorPickerHiddenInput;
