<script setup lang="ts">
import * as NavigationMenuPrimitive from "@starwind-ui/vue/navigation-menu";
import type { ClassValue } from "tailwind-variants";
import { type AnchorHTMLAttributes } from "vue";
import { navigationMenuLink } from "./variants";

defineOptions({ inheritAttrs: false });

export type NavigationMenuLinkProps = Omit<
  AnchorHTMLAttributes,
  "active" | "class" | "closeOnClick"
> & {
  active?: boolean;
  closeOnClick?: boolean;
  class?: ClassValue;
};
type NavigationMenuLinkDeclaredProps = {
  active?: boolean;
  closeOnClick?: boolean;
  class?: ClassValue;
} & /* @vue-ignore */ NavigationMenuLinkProps;
const {
  active = false,
  closeOnClick = true,
  class: className,
} = defineProps<NavigationMenuLinkDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <NavigationMenuPrimitive.NavigationMenuLink
    :class="navigationMenuLink({ class: className })"
    :active="active"
    :close-on-click="closeOnClick"
    v-bind="$attrs"
    data-slot="navigation-menu-link"
  >
    <slot />
  </NavigationMenuPrimitive.NavigationMenuLink>
</template>
