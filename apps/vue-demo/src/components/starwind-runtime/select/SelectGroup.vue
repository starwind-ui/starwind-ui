<script setup lang="ts">
import * as SelectPrimitive from "@starwind-ui/vue/select";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { selectGroup } from "./variants";

defineOptions({ inheritAttrs: false });

export type SelectGroupProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type SelectGroupDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ SelectGroupProps;
const { class: className } = defineProps<SelectGroupDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <SelectPrimitive.SelectGroup
    :class="selectGroup({ class: className })"
    v-bind="attrs"
    data-slot="select-group"
  >
    <slot />
  </SelectPrimitive.SelectGroup>
</template>
