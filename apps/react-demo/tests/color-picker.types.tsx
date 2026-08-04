import * as React from "react";

import type { ColorPickerColor } from "@starwind-ui/react/color-picker";
import ColorPicker from "../src/components/starwind-runtime/color-picker/ColorPicker";
import ColorPickerContent from "../src/components/starwind-runtime/color-picker/ColorPickerContent";
import ColorPickerSwatch from "../src/components/starwind-runtime/color-picker/ColorPickerSwatch";
import ColorPickerSwatchGroup from "../src/components/starwind-runtime/color-picker/ColorPickerSwatchGroup";
import ColorPickerTrigger from "../src/components/starwind-runtime/color-picker/ColorPickerTrigger";

declare const color: ColorPickerColor;

const ref = React.createRef<HTMLDivElement>();
const root = (
  <ColorPicker ref={ref} inline defaultValue={color} id="inline" aria-label="Inline color" />
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
  <ColorPicker defaultValue={color} alpha clearable>
    <ColorPickerTrigger showValueText aria-label="Open color picker" />
    <ColorPickerContent size="lg">
      <ColorPickerSwatchGroup aria-label="Suggested colors">
        <ColorPickerSwatch value="#4f46e5" aria-label="Indigo" />
      </ColorPickerSwatchGroup>
    </ColorPickerContent>
  </ColorPicker>
);

void root;
void popup;
void canonical;
