<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { sidebarContent } from "./variants";

defineOptions({ inheritAttrs: false });

export type SidebarContentProps = Omit<HTMLAttributes, "class" | "data-slot"> & {
  "data-slot"?: string;
  class?: ClassValue;
};
type SidebarContentDeclaredProps = {
  dataSlot?: string;
  class?: ClassValue;
} & /* @vue-ignore */ Omit<SidebarContentProps, "data-slot">;
const { dataSlot = "sidebar-content", class: className } =
  defineProps<SidebarContentDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <div
    :class="sidebarContent({ class: className })"
    data-sidebar="content"
    v-bind="attrs"
    :data-slot="dataSlot"
  >
    <slot />
  </div>
</template>
