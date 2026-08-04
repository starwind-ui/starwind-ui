import type * as React from "react";
import "./styles.css";
import ColorPickerPrimitive from "@starwind-ui/react/color-picker";
import { colorPickerSwatch } from "./variants";

export type ColorPickerSwatchProps = Omit<React.ComponentPropsWithoutRef<"button">, "value"> & {
  value: import("@starwind-ui/react/color-picker").ColorPickerValue;
  disabled?: boolean;
};

function ColorPickerSwatch(props: ColorPickerSwatchProps) {
  const { value, disabled = false, className, children, ...rest } = props;

  return (
    <ColorPickerPrimitive.Swatch
      swatchValue={value}
      swatchDisabled={disabled}
      className={colorPickerSwatch({ class: className })}
      {...rest}
      data-slot="color-picker-swatch"
    >
      <ColorPickerPrimitive.TransparencyGrid
        className="pointer-events-none absolute inset-0 size-full"
        data-slot="color-picker-transparency-grid"
      />

      <span
        className="pointer-events-none absolute inset-0 size-full"
        data-slot="color-picker-swatch-color"
      />

      {children}
    </ColorPickerPrimitive.Swatch>
  );
}

export default ColorPickerSwatch;
