<script setup lang="ts">
import * as NavigationMenuPrimitive from "@starwind-ui/vue/navigation-menu";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { navigationMenuContent } from "./variants";

defineOptions({ inheritAttrs: false });

export type NavigationMenuContentProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type NavigationMenuContentDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ NavigationMenuContentProps;
const { class: className } = defineProps<NavigationMenuContentDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <NavigationMenuPrimitive.NavigationMenuContent
    :class="navigationMenuContent({ class: className })"
    v-bind="$attrs"
    data-slot="navigation-menu-content"
  >
    <slot />
  </NavigationMenuPrimitive.NavigationMenuContent>
</template>
