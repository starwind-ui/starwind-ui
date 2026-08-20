import { IconColorPicker as ColorPicker } from "@tabler/icons-react";
import ColorPickerArea from "./ColorPickerArea";
import ColorPickerChannelSlider from "./ColorPickerChannelSlider";
import ColorPickerClear from "./ColorPickerClear";
import ColorPickerEyeDropper from "./ColorPickerEyeDropper";
import ColorPickerInput from "./ColorPickerInput";
import ColorPickerSwatch from "./ColorPickerSwatch";
import ColorPickerSwatchGroup from "./ColorPickerSwatchGroup";
import {
  colorPickerSeparator,
  colorPickerSliderActionRow,
  colorPickerSliders,
  colorPickerValueFormatRow,
} from "./variants";

export type ColorPickerDefaultEditorProps = {
  size?: "sm" | "md" | "lg";
  showEyeDropper?: boolean;
  portalContainer?: string;
  disablePortal?: boolean;
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

function ColorPickerDefaultEditor(props: ColorPickerDefaultEditorProps) {
  const {
    size = "md",
    showEyeDropper = true,
    portalContainer,
    disablePortal = false,
    formatControl = "select",
    formats = ["hex", "rgb", "hsl", "hsb"],
    swatches = [],
  } = props;

  const isSwatchDescriptor = (
    swatch: (typeof swatches)[number],
  ): swatch is Extract<(typeof swatches)[number], { value: unknown }> =>
    typeof swatch === "object" && swatch !== null && "value" in swatch && "label" in swatch;
  const normalizedSwatches = swatches.map((swatch) =>
    isSwatchDescriptor(swatch)
      ? swatch
      : { value: swatch, label: String(swatch), disabled: undefined },
  );
  const hasSwatchesAttribute = normalizedSwatches.length > 0 ? "true" : "false";

  return (
    <>
      <ColorPickerArea />

      <div className={colorPickerSliderActionRow()} data-slot="color-picker-slider-action-row">
        <div
          className={colorPickerSliders({ class: "min-w-0 flex-1" })}
          data-slot="color-picker-sliders"
        >
          <ColorPickerChannelSlider channel="hue" />

          <ColorPickerChannelSlider channel="alpha" />
        </div>

        {showEyeDropper && (
          <ColorPickerEyeDropper aria-label="Pick a color from the screen">
            <ColorPicker className="size-4" aria-hidden="true" />
          </ColorPickerEyeDropper>
        )}
      </div>

      <div className={colorPickerValueFormatRow()} data-slot="color-picker-value-format-row">
        <ColorPickerInput
          formatContentSize={size}
          formatControl={formatControl}
          formats={formats}
          portalContainer={portalContainer}
          disablePortal={disablePortal}
          className="min-w-0 flex-1"
        />
      </div>

      <div
        className="contents"
        data-has-swatches={hasSwatchesAttribute}
        data-slot="color-picker-footer"
      >
        <div
          className={colorPickerSeparator()}
          role="separator"
          aria-hidden="true"
          data-slot="color-picker-separator"
        />

        {normalizedSwatches.length > 0 && (
          <ColorPickerSwatchGroup aria-label="Suggested colors">
            {normalizedSwatches.map((swatch, swatchIndex) => (
              <ColorPickerSwatch
                value={swatch.value}
                disabled={swatch.disabled}
                aria-label={swatch.label}
                key={`${String(swatch.value)}-${swatchIndex}`}
              />
            ))}
          </ColorPickerSwatchGroup>
        )}

        <ColorPickerClear aria-label="Clear color">Clear</ColorPickerClear>
      </div>
    </>
  );
}

export default ColorPickerDefaultEditor;
