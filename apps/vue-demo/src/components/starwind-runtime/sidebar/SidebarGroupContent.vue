<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { sidebarGroupContent } from "./variants";

defineOptions({ inheritAttrs: false });

export type SidebarGroupContentProps = Omit<HTMLAttributes, "class" | "data-slot"> & {
  "data-slot"?: string;
  class?: ClassValue;
};
type SidebarGroupContentDeclaredProps = {
  dataSlot?: string;
  class?: ClassValue;
} & /* @vue-ignore */ Omit<SidebarGroupContentProps, "data-slot">;
const { dataSlot = "sidebar-group-content", class: className } =
  defineProps<SidebarGroupContentDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <div
    :class="sidebarGroupContent({ class: className })"
    data-sidebar="group-content"
    v-bind="attrs"
    :data-slot="dataSlot"
  >
    <slot />
  </div>
</template>
