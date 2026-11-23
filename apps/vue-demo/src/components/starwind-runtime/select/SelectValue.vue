<script setup lang="ts">
import * as SelectPrimitive from "@starwind-ui/vue/select";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { selectValue } from "./variants";

defineOptions({ inheritAttrs: false });

export type SelectValueProps = Omit<HTMLAttributes, "class" | "placeholder"> & {
  placeholder?: string;
  class?: ClassValue;
};
type SelectValueDeclaredProps = {
  placeholder?: string;
  class?: ClassValue;
} & /* @vue-ignore */ SelectValueProps;
const { class: className, placeholder } = defineProps<SelectValueDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <SelectPrimitive.SelectValue
    :class="selectValue({ class: className })"
    :placeholder="placeholder"
    v-bind="attrs"
    data-slot="select-value"
  >
    <slot />
  </SelectPrimitive.SelectValue>
</template>
