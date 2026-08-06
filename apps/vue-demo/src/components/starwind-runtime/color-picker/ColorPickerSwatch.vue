<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type ButtonHTMLAttributes, useAttrs } from "vue";
import "./styles.css";
import * as ColorPickerPrimitive from "@starwind-ui/vue/color-picker";
import { colorPickerSwatch } from "./variants";

defineOptions({ inheritAttrs: false });

export type ColorPickerSwatchProps = Omit<ButtonHTMLAttributes, "class" | "disabled" | "value"> & {
  value: import("@starwind-ui/runtime/color-picker").ColorPickerValue;
  disabled?: boolean;
  class?: ClassValue;
};
type ColorPickerSwatchDeclaredProps = {
  value: import("@starwind-ui/runtime/color-picker").ColorPickerValue;
  disabled?: boolean;
  class?: ClassValue;
} & /* @vue-ignore */ ColorPickerSwatchProps;
const { value, disabled = false, class: className } = defineProps<ColorPickerSwatchDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <ColorPickerPrimitive.ColorPickerSwatch
    :swatch-value="value"
    :swatch-disabled="disabled"
    :class="colorPickerSwatch({ class: className })"
    v-bind="attrs"
    data-slot="color-picker-swatch"
  >
    <ColorPickerPrimitive.ColorPickerTransparencyGrid
      class="pointer-events-none absolute inset-0 size-full"
      data-slot="color-picker-transparency-grid"
    />
    <span
      class="pointer-events-none absolute inset-0 size-full"
      data-slot="color-picker-swatch-color"
    />
    <slot />
  </ColorPickerPrimitive.ColorPickerSwatch>
</template>
