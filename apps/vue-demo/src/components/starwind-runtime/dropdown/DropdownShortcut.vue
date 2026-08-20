<script setup lang="ts">
import * as MenuPrimitive from "@starwind-ui/vue/menu";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { dropdownShortcut } from "./variants";

defineOptions({ inheritAttrs: false });

export type DropdownShortcutProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type DropdownShortcutDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ DropdownShortcutProps;
const { class: className } = defineProps<DropdownShortcutDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <MenuPrimitive.MenuShortcut
    :class="dropdownShortcut({ class: className })"
    v-bind="$attrs"
    data-slot="dropdown-shortcut"
  >
    <slot />
  </MenuPrimitive.MenuShortcut>
</template>
