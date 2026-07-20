<script setup lang="ts">
import * as SelectPrimitive from "@starwind-ui/vue/select";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { selectLabel } from "./variants";

defineOptions({ inheritAttrs: false });

export type SelectLabelProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type SelectLabelDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ SelectLabelProps;
const { class: className } = defineProps<SelectLabelDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <SelectPrimitive.SelectGroupLabel
    :class="selectLabel({ class: className })"
    v-bind="attrs"
    data-slot="select-label"
  >
    <slot />
  </SelectPrimitive.SelectGroupLabel>
</template>
