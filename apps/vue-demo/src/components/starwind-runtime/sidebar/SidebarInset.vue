<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { sidebarInset } from "./variants";

defineOptions({ inheritAttrs: false });

export type SidebarInsetProps = Omit<HTMLAttributes, "class" | "data-slot"> & {
  "data-slot"?: string;
  class?: ClassValue;
};
type SidebarInsetDeclaredProps = {
  dataSlot?: string;
  class?: ClassValue;
} & /* @vue-ignore */ Omit<SidebarInsetProps, "data-slot">;
const { dataSlot = "sidebar-inset", class: className } = defineProps<SidebarInsetDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <main :class="sidebarInset({ class: className })" v-bind="$attrs" :data-slot="dataSlot">
    <slot />
  </main>
</template>
