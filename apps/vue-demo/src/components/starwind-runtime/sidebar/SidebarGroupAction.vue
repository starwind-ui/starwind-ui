<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { useAttrs } from "vue";
import { Button } from "../button";
import { sidebarGroupAction } from "./variants";

defineOptions({ inheritAttrs: false });

export type SidebarGroupActionProps = InstanceType<typeof Button>["$props"] & {
  class?: ClassValue;
};
type SidebarGroupActionDeclaredProps = {
  class?: ClassValue;
  variant?: unknown;
  size?: unknown;
} & /* @vue-ignore */ SidebarGroupActionProps;
const {
  variant = "ghost",
  size = "icon-sm",
  class: className,
} = defineProps<SidebarGroupActionDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <Button
    :variant="variant"
    :size="size"
    :class="sidebarGroupAction({ class: className })"
    data-sidebar="group-action"
    v-bind="attrs as Omit<InstanceType<typeof Button>['$props'], 'class' | 'style'>"
    data-slot="sidebar-group-action"
  >
    <slot />
  </Button>
</template>
