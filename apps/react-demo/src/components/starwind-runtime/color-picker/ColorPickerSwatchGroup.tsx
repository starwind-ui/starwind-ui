import ColorPickerPrimitive from "@starwind-ui/react/color-picker";
import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { colorPickerSwatchGroup } from "./variants";

export type ColorPickerSwatchGroupProps = React.ComponentPropsWithoutRef<"div"> &
  VariantProps<typeof colorPickerSwatchGroup>;

function ColorPickerSwatchGroup(props: ColorPickerSwatchGroupProps) {
  const { className, size = "md", children, ...rest } = props;

  return (
    <ColorPickerPrimitive.SwatchGroup
      className={colorPickerSwatchGroup({ size, class: className })}
      {...rest}
      data-slot="color-picker-swatch-group"
    >
      {children}
    </ColorPickerPrimitive.SwatchGroup>
  );
}

export default ColorPickerSwatchGroup;
