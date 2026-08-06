<script setup lang="ts">
import type { ClassValue, VariantProps } from "tailwind-variants";
import { type AnchorHTMLAttributes, useAttrs } from "vue";
import { sidebarMenuSubButton } from "./variants";

defineOptions({ inheritAttrs: false });

export type SidebarMenuSubButtonProps = Omit<AnchorHTMLAttributes, "class" | "isActive"> &
  VariantProps<typeof sidebarMenuSubButton> & {
    isActive?: boolean;
    class?: ClassValue;
  };
type SidebarMenuSubButtonDeclaredProps = {
  isActive?: boolean;
  class?: ClassValue;
  size?: SidebarMenuSubButtonProps["size"];
} & /* @vue-ignore */ SidebarMenuSubButtonProps;
const {
  size = "md",
  isActive = false,
  class: className,
} = defineProps<SidebarMenuSubButtonDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <a
    :class="sidebarMenuSubButton({ size, class: className })"
    data-sidebar="menu-sub-button"
    :data-size="size"
    :data-active="isActive"
    v-bind="attrs"
    data-slot="sidebar-menu-sub-button"
  >
    <slot />
  </a>
</template>
