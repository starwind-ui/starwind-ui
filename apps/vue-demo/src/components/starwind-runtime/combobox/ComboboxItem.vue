<script setup lang="ts">
import * as ComboboxPrimitive from "@starwind-ui/vue/combobox";
import type { ClassValue, VariantProps } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { comboboxItem, comboboxItemIndicator, comboboxItemText } from "./variants";

defineOptions({ inheritAttrs: false });

export type ComboboxItemProps = Omit<
  HTMLAttributes,
  "class" | "disabled" | "indicatorClass" | "inset" | "role" | "showIndicator" | "value"
> &
  VariantProps<typeof comboboxItem> & {
    disabled?: boolean;
    indicatorClass?: string;
    showIndicator?: boolean;
    value: string;
    class?: ClassValue;
    inset?: boolean;
  };
type ComboboxItemDeclaredProps = {
  disabled?: boolean;
  indicatorClass?: string;
  showIndicator?: boolean;
  value: string;
  class?: ClassValue;
  inset?: boolean;
} & /* @vue-ignore */ ComboboxItemProps;
const {
  class: className,
  disabled = false,
  indicatorClass: indicatorClassName,
  inset = false,
  showIndicator = true,
  value,
} = defineProps<ComboboxItemDeclaredProps>();
defineSlots<{
  default?: () => unknown;
  indicator?: () => unknown;
}>();
</script>

<template>
  <ComboboxPrimitive.ComboboxItem
    :class="comboboxItem({ inset, disabled, class: className })"
    :disabled="disabled"
    :value="value"
    v-bind="$attrs"
    data-slot="combobox-item"
  >
    <ComboboxPrimitive.ComboboxItemText :class="comboboxItemText()" data-slot="combobox-item-text">
      <slot />
    </ComboboxPrimitive.ComboboxItemText>
    <template v-if="showIndicator">
      <ComboboxPrimitive.ComboboxItemIndicator
        :class="comboboxItemIndicator({ class: indicatorClassName })"
        data-slot="combobox-item-indicator"
      >
        <slot name="indicator">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            class="size-4"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M5 12l5 5l10 -10" />
          </svg>
        </slot>
      </ComboboxPrimitive.ComboboxItemIndicator>
    </template>
  </ComboboxPrimitive.ComboboxItem>
</template>
