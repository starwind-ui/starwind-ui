<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { sidebarMenu } from "./variants";

defineOptions({ inheritAttrs: false });

export type SidebarMenuProps = Omit<HTMLAttributes, "class" | "data-slot"> & {
  "data-slot"?: string;
  class?: ClassValue;
};
type SidebarMenuDeclaredProps = {
  dataSlot?: string;
  class?: ClassValue;
} & /* @vue-ignore */ Omit<SidebarMenuProps, "data-slot">;
const { dataSlot = "sidebar-menu", class: className } = defineProps<SidebarMenuDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <ul
    :class="sidebarMenu({ class: className })"
    data-sidebar="menu"
    v-bind="$attrs"
    :data-slot="dataSlot"
  >
    <slot />
  </ul>
</template>
