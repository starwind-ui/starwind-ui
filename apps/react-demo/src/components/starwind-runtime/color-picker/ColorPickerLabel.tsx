import ColorPickerPrimitive from "@starwind-ui/react/color-picker";
import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { colorPickerLabel } from "./variants";

export type ColorPickerLabelProps = React.ComponentPropsWithoutRef<"label"> &
  VariantProps<typeof colorPickerLabel>;

function ColorPickerLabel(props: ColorPickerLabelProps) {
  const { className, size = "md", children, ...rest } = props;

  return (
    <ColorPickerPrimitive.Label
      className={colorPickerLabel({ size, class: className })}
      {...rest}
      data-slot="color-picker-label"
    >
      {children}
    </ColorPickerPrimitive.Label>
  );
}

export default ColorPickerLabel;
