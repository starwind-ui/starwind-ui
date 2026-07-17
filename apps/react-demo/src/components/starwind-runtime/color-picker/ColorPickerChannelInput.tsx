import ColorPickerPrimitive from "@starwind-ui/react/color-picker";
import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { colorPickerChannelInput, colorPickerChannelInputLayout } from "./variants";

export type ColorPickerChannelInputProps = React.ComponentPropsWithoutRef<"input"> &
  VariantProps<typeof colorPickerChannelInput> & {
    channel: import("@starwind-ui/react/color-picker").ColorPickerChannel;
  };

function ColorPickerChannelInput(props: ColorPickerChannelInputProps) {
  const { channel, className, size = "md", ...rest } = props;

  return (
    <ColorPickerPrimitive.ChannelInput
      className={[
        colorPickerChannelInput({ size }),
        colorPickerChannelInputLayout({ size }),
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      channel={channel}
      {...rest}
      data-slot="color-picker-channel-input"
    />
  );
}

export default ColorPickerChannelInput;
