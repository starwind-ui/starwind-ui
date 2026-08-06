<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { useAttrs } from "vue";
import { Button } from "../button";
import { sidebarMenuAction } from "./variants";

defineOptions({ inheritAttrs: false });

export type SidebarMenuActionProps = InstanceType<typeof Button>["$props"] & {
  showOnHover?: boolean;
  class?: ClassValue;
};
type SidebarMenuActionDeclaredProps = {
  showOnHover?: boolean;
  class?: ClassValue;
  variant?: unknown;
  size?: unknown;
} & /* @vue-ignore */ SidebarMenuActionProps;
const {
  showOnHover = false,
  variant = "ghost",
  size = "icon-sm",
  class: className,
} = defineProps<SidebarMenuActionDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <Button
    :variant="variant"
    :size="size"
    :class="sidebarMenuAction({ showOnHover, class: className })"
    data-sidebar="menu-action"
    v-bind="attrs as Omit<InstanceType<typeof Button>['$props'], 'class' | 'style'>"
    data-slot="sidebar-menu-action"
  >
    <slot />
  </Button>
</template>
