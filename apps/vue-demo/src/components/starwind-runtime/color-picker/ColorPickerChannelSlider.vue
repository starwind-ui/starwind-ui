<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import "./styles.css";
import * as ColorPickerPrimitive from "@starwind-ui/vue/color-picker";
import { colorPickerChannelSlider, colorPickerChannelSliderThumb } from "./variants";

defineOptions({ inheritAttrs: false });

export type ColorPickerChannelSliderProps = Omit<
  HTMLAttributes,
  "channel" | "class" | "orientation"
> & {
  channel: import("@starwind-ui/runtime/color-picker").ColorPickerChannel;
  orientation?: "horizontal" | "vertical";
  class?: ClassValue;
};
type ColorPickerChannelSliderDeclaredProps = {
  channel: import("@starwind-ui/runtime/color-picker").ColorPickerChannel;
  orientation?: "horizontal" | "vertical";
  class?: ClassValue;
} & /* @vue-ignore */ ColorPickerChannelSliderProps;
const {
  channel,
  orientation = "horizontal",
  class: className,
} = defineProps<ColorPickerChannelSliderDeclaredProps>();
defineSlots<{}>();
const attrs = useAttrs();
</script>

<template>
  <ColorPickerPrimitive.ColorPickerChannelSlider
    :channel="channel"
    :orientation="orientation"
    :class="colorPickerChannelSlider({ class: className })"
    v-bind="attrs"
    data-slot="color-picker-channel-slider"
  >
    <ColorPickerPrimitive.ColorPickerTransparencyGrid
      class="pointer-events-none absolute inset-0 size-full rounded-[inherit]"
      data-slot="color-picker-transparency-grid"
    />
    <ColorPickerPrimitive.ColorPickerChannelSliderTrack
      class="pointer-events-none absolute inset-0 size-full rounded-[inherit]"
      data-slot="color-picker-channel-slider-track"
    />
    <ColorPickerPrimitive.ColorPickerChannelSliderThumb
      :class="colorPickerChannelSliderThumb()"
      data-slot="color-picker-channel-slider-thumb"
    >
      <span
        class="pointer-events-none absolute inset-0 size-full"
        data-slot="color-picker-transparency-grid"
      />
      <span
        class="pointer-events-none absolute inset-0 size-full bg-(--sw-color-picker-channel-thumb-color)"
        data-slot="color-picker-channel-thumb-color-layer"
      />
    </ColorPickerPrimitive.ColorPickerChannelSliderThumb>
    <ColorPickerPrimitive.ColorPickerChannelSliderInput
      class="absolute inset-0 size-full cursor-pointer opacity-0"
      data-slot="color-picker-channel-slider-input"
    />
  </ColorPickerPrimitive.ColorPickerChannelSlider>
</template>
