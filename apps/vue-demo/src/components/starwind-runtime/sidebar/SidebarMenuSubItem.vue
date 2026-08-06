<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { sidebarMenuSubItem } from "./variants";

defineOptions({ inheritAttrs: false });

export type SidebarMenuSubItemProps = Omit<HTMLAttributes, "class" | "data-slot"> & {
  "data-slot"?: string;
  class?: ClassValue;
};
type SidebarMenuSubItemDeclaredProps = {
  dataSlot?: string;
  class?: ClassValue;
} & /* @vue-ignore */ Omit<SidebarMenuSubItemProps, "data-slot">;
const { dataSlot = "sidebar-menu-sub-item", class: className } =
  defineProps<SidebarMenuSubItemDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <li
    :class="sidebarMenuSubItem({ class: className })"
    data-sidebar="menu-sub-item"
    v-bind="attrs"
    :data-slot="dataSlot"
  >
    <slot />
  </li>
</template>
