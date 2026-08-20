<script setup lang="ts">
import * as ComboboxPrimitive from "@starwind-ui/vue/combobox";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { comboboxGroup } from "./variants";

defineOptions({ inheritAttrs: false });

export type ComboboxGroupProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type ComboboxGroupDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ ComboboxGroupProps;
const { class: className } = defineProps<ComboboxGroupDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <ComboboxPrimitive.ComboboxGroup
    :class="comboboxGroup({ class: className })"
    v-bind="$attrs"
    data-slot="combobox-group"
  >
    <slot />
  </ComboboxPrimitive.ComboboxGroup>
</template>
