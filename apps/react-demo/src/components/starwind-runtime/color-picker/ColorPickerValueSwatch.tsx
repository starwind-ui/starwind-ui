"use client";

import type * as React from "react";
import "./styles.css";
import ColorPickerPrimitive from "@starwind-ui/react/color-picker";
import { colorPickerValueSwatch } from "./variants";

export type ColorPickerValueSwatchProps = React.ComponentPropsWithoutRef<"span">;

function ColorPickerValueSwatch(props: ColorPickerValueSwatchProps) {
  const { className, ...rest } = props;

  return (
    <ColorPickerPrimitive.ValueSwatch
      className={colorPickerValueSwatch({ class: className })}
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
