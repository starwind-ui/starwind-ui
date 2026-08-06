<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { sidebarHeader } from "./variants";

defineOptions({ inheritAttrs: false });

export type SidebarHeaderProps = Omit<HTMLAttributes, "class" | "data-slot"> & {
  "data-slot"?: string;
  class?: ClassValue;
};
type SidebarHeaderDeclaredProps = {
  dataSlot?: string;
  class?: ClassValue;
} & /* @vue-ignore */ Omit<SidebarHeaderProps, "data-slot">;
const { dataSlot = "sidebar-header", class: className } = defineProps<SidebarHeaderDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <div
    :class="sidebarHeader({ class: className })"
    data-sidebar="header"
    v-bind="attrs"
    :data-slot="dataSlot"
  >
    <slot />
  </div>
</template>
