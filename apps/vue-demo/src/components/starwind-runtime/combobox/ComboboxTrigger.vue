<script setup lang="ts">
import * as ComboboxPrimitive from "@starwind-ui/vue/combobox";
import type { ClassValue } from "tailwind-variants";
import { type ButtonHTMLAttributes } from "vue";
import { comboboxTrigger } from "./variants";

defineOptions({ inheritAttrs: false });

export type ComboboxTriggerProps = Omit<
  ButtonHTMLAttributes,
  "asChild" | "class" | "iconClass" | "showIcon"
> & {
  asChild?: boolean;
  iconClass?: string;
  showIcon?: boolean;
  class?: ClassValue;
};
type ComboboxTriggerDeclaredProps = {
  asChild?: boolean;
  iconClass?: string;
  showIcon?: boolean;
  class?: ClassValue;
} & /* @vue-ignore */ ComboboxTriggerProps;
const {
  asChild = false,
  class: className,
  iconClass: iconClassName,
  showIcon = true,
} = defineProps<ComboboxTriggerDeclaredProps>();
defineSlots<{
  default?: () => unknown;
  icon?: () => unknown;
}>();
</script>

<template>
  <ComboboxPrimitive.ComboboxTrigger
    :class="comboboxTrigger({ class: className })"
    :as-child="asChild"
    v-bind="$attrs"
    data-slot="combobox-trigger"
  >
    <slot />
    <template v-if="!asChild &amp;&amp; showIcon">
      <slot name="icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          :class="
            ['text-muted-foreground pointer-events-none size-4', iconClassName]
              .filter(Boolean)
              .join(' ')
          "
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M6 9l6 6l6 -6" />
        </svg>
      </slot>
    </template>
  </ComboboxPrimitive.ComboboxTrigger>
</template>
