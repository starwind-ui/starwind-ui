import type * as React from "react";
import "./styles.css";
import ColorPickerPrimitive from "@starwind-ui/react/color-picker";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../select";
import { colorPickerFormatSelectTrigger } from "./variants";

export type ColorPickerFormatSelectProps = React.ComponentPropsWithoutRef<"div"> & {
  size?: "sm" | "md" | "lg";
};

function ColorPickerFormatSelect(props: ColorPickerFormatSelectProps) {
  const { className, size = "md", ...rest } = props;

  return (
    <ColorPickerPrimitive.FormatControl
      className={["shrink-0", className].filter(Boolean).join(" ")}
      {...rest}
      data-slot="color-picker-format-control"
    >
      <Select>
        <SelectTrigger
          size={size}
          aria-label="Color format"
          className={colorPickerFormatSelectTrigger({ size })}
        />

        <SelectContent size={size} data-sw-color-picker-format-options="">
          <SelectItem value="hex">HEX</SelectItem>

          <SelectItem value="rgb">RGB</SelectItem>

          <SelectItem value="hsl">HSL</SelectItem>

          <SelectItem value="hsb">HSB</SelectItem>
        </SelectContent>
      </Select>
    </ColorPickerPrimitive.FormatControl>
  );
}

export default ColorPickerFormatSelect;
