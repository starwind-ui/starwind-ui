<script setup lang="ts">
import * as ColorPickerPrimitive from "@starwind-ui/vue/color-picker";
import type { ClassValue } from "tailwind-variants";
import { type ButtonHTMLAttributes, useAttrs } from "vue";
import { colorPickerAction } from "./variants";

defineOptions({ inheritAttrs: false });

export type ColorPickerClearProps = Omit<ButtonHTMLAttributes, "class"> & {
  class?: ClassValue;
};
type ColorPickerClearDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ ColorPickerClearProps;
const { class: className } = defineProps<ColorPickerClearDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <ColorPickerPrimitive.ColorPickerClear
    :class="colorPickerAction({ class: className })"
    v-bind="attrs"
    data-slot="color-picker-clear"
  >
    <slot />
  </ColorPickerPrimitive.ColorPickerClear>
</template>
