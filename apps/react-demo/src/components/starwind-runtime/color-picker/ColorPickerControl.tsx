import ColorPickerPrimitive from "@starwind-ui/react/color-picker";
import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { colorPickerControl } from "./variants";

export type ColorPickerControlProps = React.ComponentPropsWithoutRef<"div"> &
  VariantProps<typeof colorPickerControl>;

function ColorPickerControl(props: ColorPickerControlProps) {
  const { className, size = "md", children, ...rest } = props;

  return (
    <ColorPickerPrimitive.Control
      className={colorPickerControl({ size, class: className })}
      {...rest}
      data-slot="color-picker-control"
    >
      {children}
    </ColorPickerPrimitive.Control>
  );
}

export default ColorPickerControl;
