"use client";

import type * as React from "react";
import "./styles.css";
import ColorPickerPrimitive from "@starwind-ui/react/color-picker";
import { colorPickerChannelSlider, colorPickerChannelSliderThumb } from "./variants";

export type ColorPickerChannelSliderProps = React.ComponentPropsWithoutRef<"div"> & {
  channel: import("@starwind-ui/react/color-picker").ColorPickerChannel;
  orientation?: "horizontal" | "vertical";
};

function ColorPickerChannelSlider(props: ColorPickerChannelSliderProps) {
  const { channel, orientation = "horizontal", className, ...rest } = props;

  return (
    <ColorPickerPrimitive.ChannelSlider
      channel={channel}
      orientation={orientation}
      className={colorPickerChannelSlider({ class: className })}
      {...rest}
      data-slot="color-picker-channel-slider"
    >
      <ColorPickerPrimitive.TransparencyGrid
        className="pointer-events-none absolute inset-0 size-full rounded-[inherit]"
        data-slot="color-picker-transparency-grid"
      />

      <ColorPickerPrimitive.ChannelSliderTrack
        className="pointer-events-none absolute inset-0 size-full rounded-[inherit]"
        data-slot="color-picker-channel-slider-track"
      />

      <ColorPickerPrimitive.ChannelSliderThumb
        className={colorPickerChannelSliderThumb()}
        data-slot="color-picker-channel-slider-thumb"
      >
        <span
          className="pointer-events-none absolute inset-0 size-full"
          data-slot="color-picker-transparency-grid"
        />

        <span
          className="pointer-events-none absolute inset-0 size-full bg-(--sw-color-picker-channel-thumb-color)"
          data-slot="color-picker-channel-thumb-color-layer"
        />
      </ColorPickerPrimitive.ChannelSliderThumb>

      <ColorPickerPrimitive.ChannelSliderInput
        className="absolute inset-0 size-full cursor-pointer opacity-0"
        data-slot="color-picker-channel-slider-input"
      />
    </ColorPickerPrimitive.ChannelSlider>
  );
}

export default ColorPickerChannelSlider;
