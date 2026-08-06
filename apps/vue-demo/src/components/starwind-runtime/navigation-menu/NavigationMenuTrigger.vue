<script setup lang="ts">
import * as NavigationMenuPrimitive from "@starwind-ui/vue/navigation-menu";
import type { ClassValue } from "tailwind-variants";
import { type ButtonHTMLAttributes, computed, useAttrs } from "vue";
import { navigationMenuIndicator, navigationMenuTrigger } from "./variants";

defineOptions({ inheritAttrs: false });

export type NavigationMenuTriggerProps = Omit<
  ButtonHTMLAttributes,
  "asChild" | "class" | "closeDelay" | "disabled" | "iconClass" | "openDelay" | "showIcon"
> & {
  asChild?: boolean;
  disabled?: boolean;
  openDelay?: number;
  closeDelay?: number;
  showIcon?: boolean;
  iconClass?: string;
  class?: ClassValue;
};
type NavigationMenuTriggerDeclaredProps = {
  asChild?: boolean;
  disabled?: boolean;
  openDelay?: number;
  closeDelay?: number;
  showIcon?: boolean;
  iconClass?: string;
  class?: ClassValue;
} & /* @vue-ignore */ NavigationMenuTriggerProps;
const {
  asChild = false,
  disabled = false,
  openDelay,
  closeDelay,
  showIcon = true,
  iconClass: iconClassName,
  class: className,
} = defineProps<NavigationMenuTriggerDeclaredProps>();
defineSlots<{
  default?: () => unknown;
  icon?: () => unknown;
}>();
const attrs = useAttrs();
const triggerBaseClassName = computed(() => navigationMenuTrigger({ class: className }));
const triggerClassName = computed(() => (asChild ? className : triggerBaseClassName.value));
</script>

<template>
  <template v-if="asChild">
    <NavigationMenuPrimitive.NavigationMenuTrigger
      :class="triggerClassName"
      :as-child="asChild"
      :disabled="disabled"
      :open-delay="openDelay"
      :close-delay="closeDelay"
      v-bind="attrs"
      data-slot="navigation-menu-trigger"
    >
      <slot />
    </NavigationMenuPrimitive.NavigationMenuTrigger>
  </template>
  <template v-else>
    <NavigationMenuPrimitive.NavigationMenuTrigger
      :class="triggerClassName"
      :as-child="asChild"
      :disabled="disabled"
      :open-delay="openDelay"
      :close-delay="closeDelay"
      v-bind="attrs"
      data-slot="navigation-menu-trigger"
    >
      <slot />
      <template v-if="showIcon">
        <NavigationMenuPrimitive.NavigationMenuIcon
          :class="navigationMenuIndicator({ class: iconClassName })"
          data-slot="navigation-menu-indicator"
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
              <path d="M6 9l6 6l6 -6" />
            </svg>
          </slot>
        </NavigationMenuPrimitive.NavigationMenuIcon>
      </template>
    </NavigationMenuPrimitive.NavigationMenuTrigger>
  </template>
</template>
