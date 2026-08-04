import ColorPickerPrimitive from "@starwind-ui/react/color-picker";
import type * as React from "react";
import { colorPickerAction } from "./variants";

export type ColorPickerClearProps = React.ComponentPropsWithoutRef<"button">;

function ColorPickerClear(props: ColorPickerClearProps) {
  const { className, children, ...rest } = props;

  return (
    <ColorPickerPrimitive.Clear
      className={colorPickerAction({ class: className })}
      {...rest}
      data-slot="color-picker-clear"
    >
      {children}
    </ColorPickerPrimitive.Clear>
  );
}

export default ColorPickerClear;
