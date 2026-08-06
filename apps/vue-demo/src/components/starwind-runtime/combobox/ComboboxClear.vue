<script setup lang="ts">
import * as ComboboxPrimitive from "@starwind-ui/vue/combobox";
import type { ClassValue } from "tailwind-variants";
import { type ButtonHTMLAttributes, useAttrs } from "vue";
import { InputGroupButton } from "../input-group";
import { comboboxClear } from "./variants";

defineOptions({ inheritAttrs: false });

export type ComboboxClearProps = Omit<
  ButtonHTMLAttributes,
  "asChild" | "class" | "disabled" | "showIcon"
> & {
  asChild?: boolean;
  showIcon?: boolean;
  class?: ClassValue;
  disabled?: boolean;
};
type ComboboxClearDeclaredProps = {
  asChild?: boolean;
  showIcon?: boolean;
  class?: ClassValue;
  disabled?: boolean;
} & /* @vue-ignore */ ComboboxClearProps;
const {
  asChild = false,
  class: className,
  disabled = false,
  showIcon = true,
} = defineProps<ComboboxClearDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <template v-if="asChild">
    <ComboboxPrimitive.ComboboxClear
      :class="comboboxClear({ class: className })"
      :as-child="asChild"
      v-bind="{ ...attrs, disabled: disabled, 'aria-label': 'Clear selection' }"
      data-slot="combobox-clear"
    >
      <slot />
      <template v-if="showIcon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M18 6l-12 12" />
          <path d="M6 6l12 12" />
        </svg>
      </template>
    </ComboboxPrimitive.ComboboxClear>
  </template>
  <template v-else>
    <ComboboxPrimitive.ComboboxClear
      :as-child="true"
      v-bind="{ ...attrs, disabled: disabled, 'aria-label': 'Clear selection' }"
      data-slot="combobox-clear"
    >
      <InputGroupButton
        size="icon-sm"
        variant="ghost"
        :disabled="disabled"
        :class="comboboxClear({ class: className })"
        data-slot="combobox-clear"
      >
        <slot />
        <template v-if="showIcon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M18 6l-12 12" />
            <path d="M6 6l12 12" />
          </svg>
        </template>
      </InputGroupButton>
    </ComboboxPrimitive.ComboboxClear>
  </template>
</template>
