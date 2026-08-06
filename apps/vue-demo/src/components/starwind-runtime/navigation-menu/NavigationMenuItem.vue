<script setup lang="ts">
import * as NavigationMenuPrimitive from "@starwind-ui/vue/navigation-menu";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { navigationMenuItem } from "./variants";

defineOptions({ inheritAttrs: false });

export type NavigationMenuItemProps = Omit<HTMLAttributes, "class" | "value"> & {
  value?: string;
  class?: ClassValue;
};
type NavigationMenuItemDeclaredProps = {
  value?: string;
  class?: ClassValue;
} & /* @vue-ignore */ NavigationMenuItemProps;
const { value, class: className } = defineProps<NavigationMenuItemDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <NavigationMenuPrimitive.NavigationMenuItem
    :class="navigationMenuItem({ class: className })"
    :value="value"
    v-bind="attrs"
    data-slot="navigation-menu-item"
  >
    <slot />
  </NavigationMenuPrimitive.NavigationMenuItem>
</template>
