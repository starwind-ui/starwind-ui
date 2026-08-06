<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { useAttrs } from "vue";
import { Separator } from "../separator";
import { sidebarSeparator } from "./variants";

defineOptions({ inheritAttrs: false });

export type SidebarSeparatorProps = InstanceType<typeof Separator>["$props"] & {
  class?: ClassValue;
};
type SidebarSeparatorDeclaredProps = {
  class?: ClassValue;
  orientation?: unknown;
} & /* @vue-ignore */ SidebarSeparatorProps;
const { orientation = "horizontal", class: className } =
  defineProps<SidebarSeparatorDeclaredProps>();
defineSlots<{}>();
const attrs = useAttrs();
</script>

<template>
  <Separator
    :orientation="orientation"
    :class="sidebarSeparator({ class: className })"
    data-sidebar="separator"
    v-bind="attrs as Omit<InstanceType<typeof Separator>['$props'], 'class' | 'style'>"
    data-slot="sidebar-separator"
  />
</template>
