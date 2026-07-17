import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import "./styles.css";
import ColorPickerPrimitive from "@starwind-ui/react/color-picker";
import { colorPickerValueSwatch } from "./variants";

export type ColorPickerValueSwatchProps = React.ComponentPropsWithoutRef<"span"> &
  VariantProps<typeof colorPickerValueSwatch>;

function ColorPickerValueSwatch(props: ColorPickerValueSwatchProps) {
  const { className, size = "md", ...rest } = props;

  return (
    <ColorPickerPrimitive.ValueSwatch
      className={colorPickerValueSwatch({ size, class: className })}
      {...rest}
      data-slot="color-picker-value-swatch"
    >
      <ColorPickerPrimitive.TransparencyGrid
        className="pointer-events-none absolute inset-0 size-full"
        data-slot="color-picker-transparency-grid"
      />

      <span
        className="pointer-events-none absolute inset-0 size-full"
        data-slot="color-picker-value-swatch-color"
      />
    </ColorPickerPrimitive.ValueSwatch>
  );
}

export default ColorPickerValueSwatch;
