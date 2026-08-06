<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { sidebarGroupLabel } from "./variants";

export type SidebarGroupLabelProps = Omit<HTMLAttributes, "asChild" | "class"> & {
  asChild?: boolean;
  class?: ClassValue;
};
type SidebarGroupLabelDeclaredProps = {
  asChild?: boolean;
  class?: ClassValue;
} & /* @vue-ignore */ SidebarGroupLabelProps;
const { asChild = false, class: className } = defineProps<SidebarGroupLabelDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <div
    :class="sidebarGroupLabel({ class: className })"
    data-sidebar="group-label"
    :data-as-child="asChild ? true : undefined"
    data-slot="sidebar-group-label"
  >
    <slot />
  </div>
</template>
