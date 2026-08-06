<script setup lang="ts">
import * as SidebarPrimitive from "@starwind-ui/vue/sidebar";
import type { ClassValue } from "tailwind-variants";
import { type ButtonHTMLAttributes, useAttrs } from "vue";
import { sidebarRail } from "./variants";

defineOptions({ inheritAttrs: false });

export type SidebarRailProps = Omit<ButtonHTMLAttributes, "class"> & {
  class?: ClassValue;
};
type SidebarRailDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ SidebarRailProps;
const { class: className } = defineProps<SidebarRailDeclaredProps>();
defineSlots<{}>();
const attrs = useAttrs();
</script>

<template>
  <SidebarPrimitive.SidebarRail
    :class="sidebarRail({ class: className })"
    data-sidebar="rail"
    v-bind="{ ...attrs, 'aria-label': 'Toggle Sidebar' } as Record<string, unknown>"
    data-slot="sidebar-rail"
  />
</template>
