<script setup lang="ts">
import * as ColorPickerPrimitive from "@starwind-ui/vue/color-picker";
import type { ClassValue } from "tailwind-variants";
import { useAttrs } from "vue";
import { PopoverTrigger } from "../popover";
import { colorPickerTrigger, colorPickerValueSwatch } from "./variants";

defineOptions({ inheritAttrs: false });

export type ColorPickerTriggerProps = InstanceType<typeof PopoverTrigger>["$props"] & {
  showValueText?: boolean;
  class?: ClassValue;
};
type ColorPickerTriggerDeclaredProps = {
  showValueText?: boolean;
  class?: ClassValue;
} & /* @vue-ignore */ ColorPickerTriggerProps;
const { class: className, showValueText = true } = defineProps<ColorPickerTriggerDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <PopoverTrigger
    :class="colorPickerTrigger({ class: className })"
    v-bind="attrs as Omit<InstanceType<typeof PopoverTrigger>['$props'], 'class' | 'style'>"
    data-slot="color-picker-trigger"
  >
    <slot />
    <ColorPickerPrimitive.ColorPickerValueSwatch
      :class="colorPickerValueSwatch()"
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
    <template v-if="showValueText">
      <ColorPickerPrimitive.ColorPickerValueText data-slot="color-picker-value-text" />
    </template>
  </PopoverTrigger>
</template>
