<script setup lang="ts">
import * as SelectPrimitive from "@starwind-ui/vue/select";
import type { ClassValue, VariantProps } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { selectItem, selectItemIndicator, selectItemText } from "./variants";

defineOptions({ inheritAttrs: false });

export type SelectItemProps = Omit<
  HTMLAttributes,
  "class" | "disabled" | "indicatorClass" | "inset" | "role" | "showIndicator" | "value"
> &
  VariantProps<typeof selectItem> & {
    disabled?: boolean;
    indicatorClass?: string;
    showIndicator?: boolean;
    value: string;
    class?: ClassValue;
    inset?: boolean;
  };
type SelectItemDeclaredProps = {
  disabled?: boolean;
  indicatorClass?: string;
  showIndicator?: boolean;
  value: string;
  class?: ClassValue;
  inset?: boolean;
} & /* @vue-ignore */ SelectItemProps;
const {
  class: className,
  disabled = false,
  indicatorClass: indicatorClassName,
  inset = false,
  showIndicator = true,
  value,
} = defineProps<SelectItemDeclaredProps>();
defineSlots<{
  default?: () => unknown;
  indicator?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <SelectPrimitive.SelectItem
    :class="selectItem({ inset, disabled, class: className })"
    :disabled="disabled"
    :value="value"
    v-bind="attrs"
    data-slot="select-item"
  >
    <SelectPrimitive.SelectItemText :class="selectItemText()" data-slot="select-item-text">
      <slot />
    </SelectPrimitive.SelectItemText>
    <template v-if="showIndicator">
      <SelectPrimitive.SelectItemIndicator
        :class="selectItemIndicator({ class: indicatorClassName })"
        data-slot="select-item-indicator"
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
      </SelectPrimitive.SelectItemIndicator>
    </template>
  </SelectPrimitive.SelectItem>
</template>
