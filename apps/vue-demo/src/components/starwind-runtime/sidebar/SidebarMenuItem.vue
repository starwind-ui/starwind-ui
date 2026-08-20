<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { sidebarMenuItem } from "./variants";

defineOptions({ inheritAttrs: false });

export type SidebarMenuItemProps = Omit<HTMLAttributes, "class" | "data-slot"> & {
  "data-slot"?: string;
  class?: ClassValue;
};
type SidebarMenuItemDeclaredProps = {
  dataSlot?: string;
  class?: ClassValue;
} & /* @vue-ignore */ Omit<SidebarMenuItemProps, "data-slot">;
const { dataSlot = "sidebar-menu-item", class: className } =
  defineProps<SidebarMenuItemDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <li
    :class="sidebarMenuItem({ class: className })"
    data-sidebar="menu-item"
    v-bind="$attrs"
    :data-slot="dataSlot"
  >
    <slot />
  </li>
</template>
