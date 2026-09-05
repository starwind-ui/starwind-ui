<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { computed, type HTMLAttributes } from "vue";
import "./styles.css";
import * as ColorPickerPrimitive from "@starwind-ui/vue/color-picker";
import { NativeSelectOption } from "../native-select";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../select";
import {
  colorPickerFormatSelectTrigger,
  colorPickerInput,
  colorPickerNativeFormatSelect,
  colorPickerNativeFormatSelectIcon,
  colorPickerNativeFormatSelectWrapper,
  colorPickerValueInput,
  colorPickerValueInputLayout,
} from "./variants";

defineOptions({ inheritAttrs: false });

export type ColorPickerInputProps = Omit<
  HTMLAttributes,
  "class" | "disablePortal" | "formatContentSize" | "formatControl" | "formats" | "portalContainer"
> & {
  formatControl?: "select" | "native" | "none";
  formats?: readonly import("@starwind-ui/runtime/color-picker").ColorPickerFormat[];
  formatContentSize?: "sm" | "md" | "lg";
  portalContainer?: string;
  disablePortal?: boolean;
  class?: ClassValue;
};
type ColorPickerInputDeclaredProps = {
  formatControl?: "select" | "native" | "none";
  formats?: readonly import("@starwind-ui/runtime/color-picker").ColorPickerFormat[];
  formatContentSize?: "sm" | "md" | "lg";
  portalContainer?: string;
  disablePortal?: boolean;
  class?: ClassValue;
} & /* @vue-ignore */ ColorPickerInputProps;
const {
  formatControl = "select",
  formats = ["hex", "rgb", "hsl", "hsb"],
  formatContentSize = "md",
  portalContainer,
  disablePortal = false,
  class: className,
} = defineProps<ColorPickerInputDeclaredProps>();
defineSlots<{}>();
const normalizedFormats = computed(() => Array.from(new Set(formats)));
</script>

<template>
  <div
    :class="colorPickerInput({ class: className })"
    v-bind="$attrs"
    data-slot="color-picker-input"
  >
    <ColorPickerPrimitive.ColorPickerValueInput
      :class="[colorPickerValueInput(), colorPickerValueInputLayout()].filter(Boolean).join(' ')"
      data-slot="color-picker-value-input"
    />
    <template v-if="formatControl === 'native'">
      <div
        :class="colorPickerNativeFormatSelectWrapper()"
        data-slot="color-picker-native-format-select-wrapper"
      >
        <ColorPickerPrimitive.ColorPickerFormatSelect
          :class="colorPickerNativeFormatSelect()"
          v-bind="{ 'aria-label': 'Color format' } as Record<string, unknown>"
          data-slot="color-picker-native-format-select"
        >
          <template v-for="formatOption in normalizedFormats">
            <NativeSelectOption :value="formatOption">
              {{ formatOption.toUpperCase() }}
            </NativeSelectOption>
          </template>
        </ColorPickerPrimitive.ColorPickerFormatSelect>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          :class="colorPickerNativeFormatSelectIcon()"
          data-slot="color-picker-native-format-select-icon"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M6 9l6 6l6 -6" />
        </svg>
      </div>
    </template>
    <template v-if="formatControl === 'select'">
      <ColorPickerPrimitive.ColorPickerFormatControl
        class="shrink-0"
        data-slot="color-picker-format-control"
      >
        <Select>
          <SelectTrigger aria-label="Color format" :class="colorPickerFormatSelectTrigger()" />
          <SelectContent
            :size="formatContentSize"
            :portal-container="portalContainer"
            :disable-portal="disablePortal"
            data-sw-color-picker-format-options=""
          >
            <template v-for="formatOption in normalizedFormats">
              <SelectItem :value="formatOption">
                {{ formatOption.toUpperCase() }}
              </SelectItem>
            </template>
          </SelectContent>
        </Select>
      </ColorPickerPrimitive.ColorPickerFormatControl>
    </template>
  </div>
</template>
