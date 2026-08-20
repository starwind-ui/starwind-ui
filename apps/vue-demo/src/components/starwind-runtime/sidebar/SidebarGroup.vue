<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { sidebarGroup } from "./variants";

defineOptions({ inheritAttrs: false });

export type SidebarGroupProps = Omit<HTMLAttributes, "class" | "data-slot"> & {
  "data-slot"?: string;
  class?: ClassValue;
};
type SidebarGroupDeclaredProps = {
  dataSlot?: string;
  class?: ClassValue;
} & /* @vue-ignore */ Omit<SidebarGroupProps, "data-slot">;
const { dataSlot = "sidebar-group", class: className } = defineProps<SidebarGroupDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <div
    :class="sidebarGroup({ class: className })"
    data-sidebar="group"
    v-bind="$attrs"
    :data-slot="dataSlot"
  >
    <slot />
  </div>
</template>
