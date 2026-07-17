import * as React from "react";

import type { ColorPickerColor } from "@starwind-ui/react/color-picker";
import ColorPicker from "../src/components/starwind-runtime/color-picker/ColorPicker";
import ColorPickerContent from "../src/components/starwind-runtime/color-picker/ColorPickerContent";
import ColorPickerRoot from "../src/components/starwind-runtime/color-picker/ColorPickerRoot";
import ColorPickerSwatch from "../src/components/starwind-runtime/color-picker/ColorPickerSwatch";
import ColorPickerSwatchGroup from "../src/components/starwind-runtime/color-picker/ColorPickerSwatchGroup";
import ColorPickerTrigger from "../src/components/starwind-runtime/color-picker/ColorPickerTrigger";

declare const color: ColorPickerColor;

const ref = React.createRef<HTMLDivElement>();
const root = (
  <ColorPickerRoot ref={ref} defaultValue={color} id="inline" aria-label="Inline color" />
);
const popup = (
  <ColorPicker
    ref={ref}
    defaultValue={color}
    defaultOpen
    id="popup"
    style={{ color: "red" }}
    aria-label="Popup color"
    onClick={() => undefined}
  />
);
const canonical = (
  <ColorPicker defaultValue={color} alpha allowEmpty>
    <ColorPickerTrigger showValueText aria-label="Open color picker" />
    <ColorPickerContent
      size="lg"
      showClear
      swatches={
        <ColorPickerSwatchGroup aria-label="Suggested colors">
          <ColorPickerSwatch value="#4f46e5" aria-label="Indigo" />
        </ColorPickerSwatchGroup>
      }
    />
  </ColorPicker>
);

void root;
void popup;
void canonical;
