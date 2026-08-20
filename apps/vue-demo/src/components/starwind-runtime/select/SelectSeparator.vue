<script setup lang="ts">
import * as SelectPrimitive from "@starwind-ui/vue/select";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { selectSeparator } from "./variants";

defineOptions({ inheritAttrs: false });

export type SelectSeparatorProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type SelectSeparatorDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ SelectSeparatorProps;
const { class: className } = defineProps<SelectSeparatorDeclaredProps>();
defineSlots<{}>();
</script>

<template>
  <SelectPrimitive.SelectSeparator
    :class="selectSeparator({ class: className })"
    v-bind="$attrs"
    data-slot="select-separator"
  />
</template>
