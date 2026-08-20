<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import "./styles.css";
import * as ColorPickerPrimitive from "@starwind-ui/vue/color-picker";
import { colorPickerValueSwatch } from "./variants";

defineOptions({ inheritAttrs: false });

export type ColorPickerValueSwatchProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type ColorPickerValueSwatchDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ ColorPickerValueSwatchProps;
const { class: className } = defineProps<ColorPickerValueSwatchDeclaredProps>();
defineSlots<{}>();
</script>

<template>
  <ColorPickerPrimitive.ColorPickerValueSwatch
    :class="colorPickerValueSwatch({ class: className })"
    v-bind="$attrs"
    data-slot="color-picker-value-swatch"
  >
    <ColorPickerPrimitive.ColorPickerTransparencyGrid
      class="pointer-events-none absolute inset-0 size-full"
      data-slot="color-picker-transparency-grid"
    />
    <span
      class="pointer-events-none absolute inset-0 size-full"
      data-slot="color-picker-value-swatch-color"
    />
  </ColorPickerPrimitive.ColorPickerValueSwatch>
</template>
