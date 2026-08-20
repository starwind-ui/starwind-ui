<script setup lang="ts">
import * as ColorPickerPrimitive from "@starwind-ui/vue/color-picker";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { colorPickerSwatchGroup } from "./variants";

defineOptions({ inheritAttrs: false });

export type ColorPickerSwatchGroupProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type ColorPickerSwatchGroupDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ ColorPickerSwatchGroupProps;
const { class: className } = defineProps<ColorPickerSwatchGroupDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <ColorPickerPrimitive.ColorPickerSwatchGroup
    :class="colorPickerSwatchGroup({ class: className })"
    v-bind="$attrs"
    data-slot="color-picker-swatch-group"
  >
    <slot />
  </ColorPickerPrimitive.ColorPickerSwatchGroup>
</template>
