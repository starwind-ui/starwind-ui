<script setup lang="ts">
import * as SidebarPrimitive from "@starwind-ui/vue/sidebar";
import type { ClassValue } from "tailwind-variants";
import { useAttrs } from "vue";
import { Button } from "../button";
import { sidebarTrigger } from "./variants";

defineOptions({ inheritAttrs: false });

export type SidebarTriggerProps = InstanceType<typeof Button>["$props"] & {
  class?: ClassValue;
};
type SidebarTriggerDeclaredProps = {
  class?: ClassValue;
  size?: unknown;
  variant?: unknown;
} & /* @vue-ignore */ SidebarTriggerProps;
const {
  size = "icon-sm",
  variant = "ghost",
  class: className,
} = defineProps<SidebarTriggerDeclaredProps>();
defineSlots<{
  icon?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <SidebarPrimitive.SidebarTrigger :as-child="true">
    <Button
      :variant="variant"
      :size="size"
      :class="sidebarTrigger({ class: className })"
      data-sidebar="trigger"
      aria-label="Toggle Sidebar"
      v-bind="attrs as Omit<InstanceType<typeof Button>['$props'], 'class' | 'style'>"
      data-slot="sidebar-trigger"
    >
      <slot name="icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path
            d="M4 4m-2 0a2 2 0 0 1 2 -2h16a2 2 0 0 1 2 2v16a2 2 0 0 1 -2 2h-16a2 2 0 0 1 -2 -2z"
          />
          <path d="M9 4l0 16" />
        </svg>
      </slot>
      <span class="sr-only"> Toggle Sidebar </span>
    </Button>
  </SidebarPrimitive.SidebarTrigger>
</template>
