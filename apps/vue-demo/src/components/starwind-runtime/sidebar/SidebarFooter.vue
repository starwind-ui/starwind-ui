<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { sidebarFooter } from "./variants";

defineOptions({ inheritAttrs: false });

export type SidebarFooterProps = Omit<HTMLAttributes, "class" | "data-slot"> & {
  "data-slot"?: string;
  class?: ClassValue;
};
type SidebarFooterDeclaredProps = {
  dataSlot?: string;
  class?: ClassValue;
} & /* @vue-ignore */ Omit<SidebarFooterProps, "data-slot">;
const { dataSlot = "sidebar-footer", class: className } = defineProps<SidebarFooterDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <div
    :class="sidebarFooter({ class: className })"
    data-sidebar="footer"
    v-bind="$attrs"
    :data-slot="dataSlot"
  >
    <slot />
  </div>
</template>
