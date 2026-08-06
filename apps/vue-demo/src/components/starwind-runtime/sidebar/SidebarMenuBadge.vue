<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { sidebarMenuBadge } from "./variants";

defineOptions({ inheritAttrs: false });

export type SidebarMenuBadgeProps = Omit<HTMLAttributes, "class" | "data-slot"> & {
  "data-slot"?: string;
  class?: ClassValue;
};
type SidebarMenuBadgeDeclaredProps = {
  dataSlot?: string;
  class?: ClassValue;
} & /* @vue-ignore */ Omit<SidebarMenuBadgeProps, "data-slot">;
const { dataSlot = "sidebar-menu-badge", class: className } =
  defineProps<SidebarMenuBadgeDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <div
    :class="sidebarMenuBadge({ class: className })"
    data-sidebar="menu-badge"
    v-bind="attrs"
    :data-slot="dataSlot"
  >
    <slot />
  </div>
</template>
