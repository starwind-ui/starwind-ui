import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import "./styles.css";
import { IconColorPicker as ColorPicker } from "@tabler/icons-react";
import { PopoverContent } from "../popover";
import ColorPickerArea from "./ColorPickerArea";
import ColorPickerClear from "./ColorPickerClear";
import ColorPickerEyeDropper from "./ColorPickerEyeDropper";
import ColorPickerInput from "./ColorPickerInput";
import ColorPickerSliders from "./ColorPickerSliders";
import {
  colorPickerContent,
  colorPickerSeparator,
  colorPickerSliderActionRow,
  colorPickerValueFormatRow,
} from "./variants";

export type ColorPickerContentProps = React.ComponentProps<typeof PopoverContent> &
  VariantProps<typeof colorPickerContent> & {
    alpha?: boolean;
    showEyeDropper?: boolean;
    showClear?: boolean;
    swatches?: React.ReactNode;
  };

function ColorPickerContent(props: ColorPickerContentProps) {
  const {
    className,
    size = "md",
    alpha = true,
    showEyeDropper = true,
    showClear = false,
    side = "bottom",
    align = "start",
    exitMotion = "fade",
    children,
    swatches,
    ...rest
  } = props;

  const inputSize = size === "lg" ? "md" : "sm";
  const hasSwatches = swatches != null;
  const hasSwatchesAttribute = hasSwatches ? "true" : "false";

  return (
    <PopoverContent
      className={colorPickerContent({ size, class: className })}
      side={side}
      align={align}
      exitMotion={exitMotion}
      {...rest}
      data-slot="color-picker-content"
    >
      {children ?? (
        <>
          <ColorPickerArea size={size} />

          <div
            className={colorPickerSliderActionRow({ size })}
            data-slot="color-picker-slider-action-row"
          >
            <ColorPickerSliders alpha={alpha} size={size} className="min-w-0 flex-1" />

            {showEyeDropper && (
              <ColorPickerEyeDropper size={size} aria-label="Pick a color from the screen">
                <ColorPicker className="size-4" aria-hidden="true" />
              </ColorPickerEyeDropper>
            )}
          </div>

          <div
            className={colorPickerValueFormatRow({ size })}
            data-slot="color-picker-value-format-row"
          >
            <ColorPickerInput size={inputSize} className="min-w-0 flex-1" />
          </div>

          <div
            className="contents"
            data-has-swatches={hasSwatchesAttribute}
            data-slot="color-picker-footer"
          >
            {(hasSwatches || showClear) && (
              <div
                className={colorPickerSeparator({ size })}
                role="separator"
                aria-hidden="true"
                data-slot="color-picker-separator"
              />
            )}

            {swatches}

            {showClear && (
              <ColorPickerClear size={inputSize} aria-label="Clear color">
                Clear
              </ColorPickerClear>
            )}
          </div>
        </>
      )}
    </PopoverContent>
  );
}

export default ColorPickerContent;
