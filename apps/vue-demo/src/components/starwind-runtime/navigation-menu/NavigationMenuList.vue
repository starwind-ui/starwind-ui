<script setup lang="ts">
import * as NavigationMenuPrimitive from "@starwind-ui/vue/navigation-menu";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { navigationMenuList } from "./variants";

defineOptions({ inheritAttrs: false });

export type NavigationMenuListProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type NavigationMenuListDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ NavigationMenuListProps;
const { class: className } = defineProps<NavigationMenuListDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <NavigationMenuPrimitive.NavigationMenuList
    :class="navigationMenuList({ class: className })"
    v-bind="attrs"
    data-slot="navigation-menu-list"
  >
    <slot />
  </NavigationMenuPrimitive.NavigationMenuList>
</template>
