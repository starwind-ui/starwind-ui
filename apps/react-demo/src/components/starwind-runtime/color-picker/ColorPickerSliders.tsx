import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import ColorPickerChannelSlider from "./ColorPickerChannelSlider";
import { colorPickerSliders } from "./variants";

export type ColorPickerSlidersProps = React.ComponentPropsWithoutRef<"div"> &
  VariantProps<typeof colorPickerSliders> & {
    alpha?: boolean;
  };

function ColorPickerSliders(props: ColorPickerSlidersProps) {
  const { alpha = true, className, size = "md", ...rest } = props;

  return (
    <div
      className={colorPickerSliders({ size, class: className })}
      {...rest}
      data-slot="color-picker-sliders"
    >
      <ColorPickerChannelSlider channel="hue" size={size} />

      {alpha && <ColorPickerChannelSlider channel="alpha" size={size} />}
    </div>
  );
}

export default ColorPickerSliders;
