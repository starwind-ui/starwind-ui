<script setup lang="ts">
import * as MenuPrimitive from "@starwind-ui/vue/menu";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { dropdownSeparator } from "./variants";

defineOptions({ inheritAttrs: false });

export type DropdownSeparatorProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type DropdownSeparatorDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ DropdownSeparatorProps;
const { class: className } = defineProps<DropdownSeparatorDeclaredProps>();
defineSlots<{}>();
</script>

<template>
  <MenuPrimitive.MenuSeparator
    :class="dropdownSeparator({ class: className })"
    v-bind="$attrs"
    data-slot="dropdown-separator"
  />
</template>
