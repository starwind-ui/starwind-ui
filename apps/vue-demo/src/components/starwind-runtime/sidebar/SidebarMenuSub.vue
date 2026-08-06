<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { sidebarMenuSub } from "./variants";

defineOptions({ inheritAttrs: false });

export type SidebarMenuSubProps = Omit<HTMLAttributes, "class" | "data-slot"> & {
  "data-slot"?: string;
  class?: ClassValue;
};
type SidebarMenuSubDeclaredProps = {
  dataSlot?: string;
  class?: ClassValue;
} & /* @vue-ignore */ Omit<SidebarMenuSubProps, "data-slot">;
const { dataSlot = "sidebar-menu-sub", class: className } =
  defineProps<SidebarMenuSubDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <ul
    :class="sidebarMenuSub({ class: className })"
    data-sidebar="menu-sub"
    v-bind="attrs"
    :data-slot="dataSlot"
  >
    <slot />
  </ul>
</template>
