import ColorPickerPrimitive from "@starwind-ui/react/color-picker";
import type * as React from "react";
import { colorPickerAction } from "./variants";

export type ColorPickerEyeDropperProps = React.ComponentPropsWithoutRef<"button">;

function ColorPickerEyeDropper(props: ColorPickerEyeDropperProps) {
  const { className, children, ...rest } = props;

  return (
    <ColorPickerPrimitive.EyeDropperTrigger
      className={colorPickerAction({ class: className })}
      {...rest}
      data-slot="color-picker-eye-dropper"
    >
      {children}
    </ColorPickerPrimitive.EyeDropperTrigger>
  );
}

export default ColorPickerEyeDropper;
