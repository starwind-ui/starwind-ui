<script setup lang="ts">
import * as NavigationMenuPrimitive from "@starwind-ui/vue/navigation-menu";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { navigationMenuIndicator } from "./variants";

defineOptions({ inheritAttrs: false });

export type NavigationMenuIndicatorProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type NavigationMenuIndicatorDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ NavigationMenuIndicatorProps;
const { class: className } = defineProps<NavigationMenuIndicatorDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <NavigationMenuPrimitive.NavigationMenuIcon
    :class="navigationMenuIndicator({ class: className })"
    v-bind="attrs"
    data-slot="navigation-menu-indicator"
  >
    <slot>
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
        <path d="M6 9l6 6l6 -6" />
      </svg>
    </slot>
  </NavigationMenuPrimitive.NavigationMenuIcon>
</template>
