"use client";

import type * as React from "react";
import "./styles.css";
import ColorPickerPrimitive from "@starwind-ui/react/color-picker";
import { colorPickerArea, colorPickerAreaThumb } from "./variants";

export type ColorPickerAreaProps = React.ComponentPropsWithoutRef<"div">;

function ColorPickerArea(props: ColorPickerAreaProps) {
  const { className, ...rest } = props;

  return (
    <ColorPickerPrimitive.Area
      className={colorPickerArea({ class: className })}
      {...rest}
      data-slot="color-picker-area"
    >
      <ColorPickerPrimitive.AreaBackground
        className="pointer-events-none absolute inset-0 size-full"
        data-slot="color-picker-area-background"
      />

      <ColorPickerPrimitive.AreaThumb
        className={colorPickerAreaThumb()}
        data-slot="color-picker-area-thumb"
      />

      <ColorPickerPrimitive.AreaInput
        axis="x"
        className="pointer-events-none absolute inset-0 size-full opacity-0"
        data-slot="color-picker-area-input-x"
      />

      <ColorPickerPrimitive.AreaInput
        axis="y"
        className="pointer-events-none absolute inset-0 size-full opacity-0"
        data-slot="color-picker-area-input-y"
      />
    </ColorPickerPrimitive.Area>
  );
}

export default ColorPickerArea;
