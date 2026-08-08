"use client";

import ColorPickerPrimitive from "@starwind-ui/react/color-picker";
import type * as React from "react";
import { colorPickerChannelInput, colorPickerChannelInputLayout } from "./variants";

export type ColorPickerChannelInputProps = React.ComponentPropsWithoutRef<"input"> & {
  channel: import("@starwind-ui/react/color-picker").ColorPickerChannel;
};

function ColorPickerChannelInput(props: ColorPickerChannelInputProps) {
  const { channel, className, ...rest } = props;

  return (
    <ColorPickerPrimitive.ChannelInput
      className={[colorPickerChannelInput(), colorPickerChannelInputLayout(), className]
        .filter(Boolean)
        .join(" ")}
      channel={channel}
      {...rest}
      data-slot="color-picker-channel-input"
    />
  );
}

export default ColorPickerChannelInput;
