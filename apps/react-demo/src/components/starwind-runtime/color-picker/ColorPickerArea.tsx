import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import "./styles.css";
import ColorPickerPrimitive from "@starwind-ui/react/color-picker";
import ColorPickerAreaThumb from "./ColorPickerAreaThumb";
import { colorPickerArea } from "./variants";

export type ColorPickerAreaProps = React.ComponentPropsWithoutRef<"div"> &
  VariantProps<typeof colorPickerArea>;

function ColorPickerArea(props: ColorPickerAreaProps) {
  const { className, size = "md", ...rest } = props;

  return (
    <ColorPickerPrimitive.Area
      className={colorPickerArea({ size, class: className })}
      {...rest}
      data-slot="color-picker-area"
    >
      <ColorPickerPrimitive.AreaBackground
        className="pointer-events-none absolute inset-0 size-full"
        data-slot="color-picker-area-background"
      />

      <ColorPickerAreaThumb size={size} />

      <ColorPickerPrimitive.AreaInput
        axis="x"
        className="absolute inset-0 size-full cursor-crosshair opacity-0"
        data-slot="color-picker-area-input-x"
      />

      <ColorPickerPrimitive.AreaInput
        axis="y"
        className="absolute inset-0 size-full cursor-crosshair opacity-0"
        data-slot="color-picker-area-input-y"
      />
    </ColorPickerPrimitive.Area>
  );
}

export default ColorPickerArea;
