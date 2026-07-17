import ColorPickerPrimitive from "@starwind-ui/react/color-picker";
import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { colorPickerAreaThumb } from "./variants";

export type ColorPickerAreaThumbProps = React.ComponentPropsWithoutRef<"span"> &
  VariantProps<typeof colorPickerAreaThumb>;

function ColorPickerAreaThumb(props: ColorPickerAreaThumbProps) {
  const { className, size = "md", children, ...rest } = props;

  return (
    <ColorPickerPrimitive.AreaThumb
      className={colorPickerAreaThumb({ size, class: className })}
      {...rest}
      data-slot="color-picker-area-thumb"
    >
      {children}
    </ColorPickerPrimitive.AreaThumb>
  );
}

export default ColorPickerAreaThumb;
