<script setup lang="ts">
import * as ColorPickerPrimitive from "@starwind-ui/vue/color-picker";
import type { ClassValue } from "tailwind-variants";
import { type InputHTMLAttributes } from "vue";
import { colorPickerChannelInput, colorPickerChannelInputLayout } from "./variants";

defineOptions({ inheritAttrs: false });

export type ColorPickerChannelInputProps = Omit<InputHTMLAttributes, "channel" | "class"> & {
  channel: import("@starwind-ui/runtime/color-picker").ColorPickerChannel;
  class?: ClassValue;
};
type ColorPickerChannelInputDeclaredProps = {
  channel: import("@starwind-ui/runtime/color-picker").ColorPickerChannel;
  class?: ClassValue;
};
const { channel, class: className } = defineProps<ColorPickerChannelInputDeclaredProps>();
defineSlots<{}>();
</script>

<template>
  <ColorPickerPrimitive.ColorPickerChannelInput
    :class="
      [colorPickerChannelInput(), colorPickerChannelInputLayout(), className]
        .filter(Boolean)
        .join(' ')
    "
    :channel="channel"
    v-bind="$attrs"
    data-slot="color-picker-channel-input"
  />
</template>
