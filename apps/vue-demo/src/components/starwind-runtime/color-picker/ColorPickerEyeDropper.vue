<script setup lang="ts">
import * as ColorPickerPrimitive from "@starwind-ui/vue/color-picker";
import type { ClassValue } from "tailwind-variants";
import { type ButtonHTMLAttributes, useAttrs } from "vue";
import { colorPickerAction } from "./variants";

defineOptions({ inheritAttrs: false });

export type ColorPickerEyeDropperProps = Omit<ButtonHTMLAttributes, "class"> & {
  class?: ClassValue;
};
type ColorPickerEyeDropperDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ ColorPickerEyeDropperProps;
const { class: className } = defineProps<ColorPickerEyeDropperDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <ColorPickerPrimitive.ColorPickerEyeDropperTrigger
    :class="colorPickerAction({ class: className })"
    v-bind="attrs"
    data-slot="color-picker-eye-dropper"
  >
    <slot />
  </ColorPickerPrimitive.ColorPickerEyeDropperTrigger>
</template>
