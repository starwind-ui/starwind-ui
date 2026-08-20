<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import "./styles.css";
import * as ColorPickerPrimitive from "@starwind-ui/vue/color-picker";
import { colorPickerArea, colorPickerAreaThumb } from "./variants";

defineOptions({ inheritAttrs: false });

export type ColorPickerAreaProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type ColorPickerAreaDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ ColorPickerAreaProps;
const { class: className } = defineProps<ColorPickerAreaDeclaredProps>();
defineSlots<{}>();
</script>

<template>
  <ColorPickerPrimitive.ColorPickerArea
    :class="colorPickerArea({ class: className })"
    v-bind="$attrs"
    data-slot="color-picker-area"
  >
    <ColorPickerPrimitive.ColorPickerAreaBackground
      class="pointer-events-none absolute inset-0 size-full"
      data-slot="color-picker-area-background"
    />
    <ColorPickerPrimitive.ColorPickerAreaThumb
      :class="colorPickerAreaThumb()"
      data-slot="color-picker-area-thumb"
    />
    <ColorPickerPrimitive.ColorPickerAreaInput
      axis="x"
      class="pointer-events-none absolute inset-0 size-full opacity-0"
      data-slot="color-picker-area-input-x"
    />
    <ColorPickerPrimitive.ColorPickerAreaInput
      axis="y"
      class="pointer-events-none absolute inset-0 size-full opacity-0"
      data-slot="color-picker-area-input-y"
    />
  </ColorPickerPrimitive.ColorPickerArea>
</template>
