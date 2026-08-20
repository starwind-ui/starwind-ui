<script setup lang="ts">
import { computed } from "vue";
import ColorPickerArea from "./ColorPickerArea.vue";
import ColorPickerChannelSlider from "./ColorPickerChannelSlider.vue";
import ColorPickerClear from "./ColorPickerClear.vue";
import ColorPickerEyeDropper from "./ColorPickerEyeDropper.vue";
import ColorPickerInput from "./ColorPickerInput.vue";
import ColorPickerSwatch from "./ColorPickerSwatch.vue";
import ColorPickerSwatchGroup from "./ColorPickerSwatchGroup.vue";
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
  formats?: readonly import("@starwind-ui/runtime/color-picker").ColorPickerFormat[];
  swatches?: readonly (
    | import("@starwind-ui/runtime/color-picker").ColorPickerValue
    | {
        value: import("@starwind-ui/runtime/color-picker").ColorPickerValue;
        label: string;
        disabled?: boolean;
      }
  )[];
};
type ColorPickerDefaultEditorDeclaredProps = {
  size?: "sm" | "md" | "lg";
  showEyeDropper?: boolean;
  portalContainer?: string;
  disablePortal?: boolean;
  formatControl?: "select" | "native" | "none";
  formats?: readonly import("@starwind-ui/runtime/color-picker").ColorPickerFormat[];
  swatches?: readonly (
    | import("@starwind-ui/runtime/color-picker").ColorPickerValue
    | {
        value: import("@starwind-ui/runtime/color-picker").ColorPickerValue;
        label: string;
        disabled?: boolean;
      }
  )[];
} & /* @vue-ignore */ ColorPickerDefaultEditorProps;
const {
  size = "md",
  showEyeDropper = true,
  portalContainer,
  disablePortal = false,
  formatControl = "select",
  formats = ["hex", "rgb", "hsl", "hsb"],
  swatches = [],
} = defineProps<ColorPickerDefaultEditorDeclaredProps>();
defineSlots<{}>();
const isSwatchDescriptor = computed(
  () =>
    (
      swatch: (typeof swatches)[number],
    ): swatch is Extract<(typeof swatches)[number], { value: unknown }> =>
      typeof swatch === "object" && swatch !== null && "value" in swatch && "label" in swatch,
);
const normalizedSwatches = computed(() =>
  swatches.map((swatch) =>
    isSwatchDescriptor.value(swatch)
      ? swatch
      : { value: swatch, label: String(swatch), disabled: undefined },
  ),
);
const hasSwatchesAttribute = computed(() =>
  normalizedSwatches.value.length > 0 ? "true" : "false",
);
</script>

<template>
  <ColorPickerArea />
  <div :class="colorPickerSliderActionRow()" data-slot="color-picker-slider-action-row">
    <div :class="colorPickerSliders({ class: 'min-w-0 flex-1' })" data-slot="color-picker-sliders">
      <ColorPickerChannelSlider channel="hue" />
      <ColorPickerChannelSlider channel="alpha" />
    </div>
    <template v-if="showEyeDropper">
      <ColorPickerEyeDropper aria-label="Pick a color from the screen">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          class="size-4"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M11 7l6 6" />
          <path d="M4 16l11.7 -11.7a1 1 0 0 1 3 3l-11.7 11.7h-3v-3z" />
        </svg>
      </ColorPickerEyeDropper>
    </template>
  </div>
  <div :class="colorPickerValueFormatRow()" data-slot="color-picker-value-format-row">
    <ColorPickerInput
      :format-content-size="size"
      :format-control="formatControl"
      :formats="formats"
      :portal-container="portalContainer"
      :disable-portal="disablePortal"
      class="min-w-0 flex-1"
    />
  </div>
  <div class="contents" :data-has-swatches="hasSwatchesAttribute" data-slot="color-picker-footer">
    <div
      :class="colorPickerSeparator()"
      role="separator"
      aria-hidden="true"
      data-slot="color-picker-separator"
    />
    <template v-if="normalizedSwatches.length > 0">
      <ColorPickerSwatchGroup aria-label="Suggested colors">
        <template v-for="(swatch, swatchIndex) in normalizedSwatches">
          <ColorPickerSwatch
            :value="swatch.value"
            :disabled="swatch.disabled"
            :aria-label="swatch.label"
          />
        </template>
      </ColorPickerSwatchGroup>
    </template>
    <ColorPickerClear aria-label="Clear color"> Clear </ColorPickerClear>
  </div>
</template>
