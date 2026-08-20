import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import "./styles.css";
import { PopoverContent } from "../popover";
import ColorPickerDefaultEditor from "./ColorPickerDefaultEditor";
import { colorPickerContent } from "./variants";

export type ColorPickerContentProps = React.ComponentProps<typeof PopoverContent> &
  VariantProps<typeof colorPickerContent> & {
    showEyeDropper?: boolean;
    formatControl?: "select" | "native" | "none";
    formats?: readonly import("@starwind-ui/react/color-picker").ColorPickerFormat[];
    swatches?: readonly (
      | import("@starwind-ui/react/color-picker").ColorPickerValue
      | {
          value: import("@starwind-ui/react/color-picker").ColorPickerValue;
          label: string;
          disabled?: boolean;
        }
    )[];
  };

function ColorPickerContent(props: ColorPickerContentProps) {
  const {
    className,
    size = "md",
    showEyeDropper = true,
    formatControl = "select",
    formats = ["hex", "rgb", "hsl", "hsb"],
    swatches = [],
    side = "bottom",
    align = "start",
    exitMotion = "fade",
    portalContainer,
    disablePortal = false,
    children,
    ...rest
  } = props;

  return (
    <PopoverContent
      className={colorPickerContent({ size, class: className })}
      side={side}
      align={align}
      collisionStrategy="best-fit"
      exitMotion={exitMotion}
      portalContainer={portalContainer}
      disablePortal={disablePortal}
      {...rest}
      data-sw-color-picker-content=""
      data-size={size}
      data-slot="color-picker-content"
    >
      {children ?? (
        <ColorPickerDefaultEditor
          size={size}
          showEyeDropper={showEyeDropper}
          portalContainer={portalContainer}
          disablePortal={disablePortal}
          formatControl={formatControl}
          formats={formats}
          swatches={swatches}
        />
      )}
    </PopoverContent>
  );
}

export default ColorPickerContent;
