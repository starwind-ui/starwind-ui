import ColorPickerPrimitive from "@starwind-ui/react/color-picker";
import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { colorPickerAction } from "./variants";

export type ColorPickerClearProps = React.ComponentPropsWithoutRef<"button"> &
  VariantProps<typeof colorPickerAction>;

function ColorPickerClear(props: ColorPickerClearProps) {
  const { className, size = "md", children, ...rest } = props;

  return (
    <ColorPickerPrimitive.Clear
      className={colorPickerAction({ size, class: className })}
      {...rest}
      data-slot="color-picker-clear"
    >
      {children}
    </ColorPickerPrimitive.Clear>
  );
}

export default ColorPickerClear;
