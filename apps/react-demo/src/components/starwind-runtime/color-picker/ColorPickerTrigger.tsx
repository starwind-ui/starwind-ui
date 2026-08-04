import ColorPickerPrimitive from "@starwind-ui/react/color-picker";
import type * as React from "react";
import { PopoverTrigger } from "../popover";
import { colorPickerTrigger, colorPickerValueSwatch } from "./variants";

export type ColorPickerTriggerProps = React.ComponentProps<typeof PopoverTrigger> & {
  showValueText?: boolean;
};

function ColorPickerTrigger(props: ColorPickerTriggerProps) {
  const { className, showValueText = true, children, ...rest } = props;

  return (
    <PopoverTrigger
      className={colorPickerTrigger({ class: className })}
      {...rest}
      data-slot="color-picker-trigger"
    >
      {children}

      <ColorPickerPrimitive.ValueSwatch
        className={colorPickerValueSwatch()}
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

      {showValueText && <ColorPickerPrimitive.ValueText data-slot="color-picker-value-text" />}
    </PopoverTrigger>
  );
}

export default ColorPickerTrigger;
