import ColorPickerPrimitive from "@starwind-ui/react/color-picker";
import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { colorPickerAction } from "./variants";

export type ColorPickerEyeDropperProps = React.ComponentPropsWithoutRef<"button"> &
  VariantProps<typeof colorPickerAction>;

function ColorPickerEyeDropper(props: ColorPickerEyeDropperProps) {
  const { className, size = "md", children, ...rest } = props;

  return (
    <ColorPickerPrimitive.EyeDropperTrigger
      className={colorPickerAction({ size, class: className })}
      {...rest}
      data-slot="color-picker-eye-dropper"
    >
      {children}
    </ColorPickerPrimitive.EyeDropperTrigger>
  );
}

export default ColorPickerEyeDropper;
