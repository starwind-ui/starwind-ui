<script setup lang="ts">
import * as MenuPrimitive from "@starwind-ui/vue/menu";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";

defineOptions({ inheritAttrs: false });

export type DropdownGroupProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type DropdownGroupDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ DropdownGroupProps;
const { class: className } = defineProps<DropdownGroupDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <MenuPrimitive.MenuGroup :class="className" v-bind="$attrs" data-slot="dropdown-group">
    <slot />
  </MenuPrimitive.MenuGroup>
</template>
