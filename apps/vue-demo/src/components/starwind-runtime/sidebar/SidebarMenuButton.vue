<script setup lang="ts">
import type { ClassValue, VariantProps } from "tailwind-variants";
import { type AnchorHTMLAttributes, type ButtonHTMLAttributes, computed, useAttrs } from "vue";
import "./styles.css";
import * as SidebarPrimitive from "@starwind-ui/vue/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";
import { sidebarMenuButton } from "./variants";

defineOptions({ inheritAttrs: false });

export type SidebarMenuButtonProps = Omit<
  ButtonHTMLAttributes,
  "asChild" | "class" | "href" | "isActive" | "tooltip"
> &
  Omit<AnchorHTMLAttributes, "asChild" | "class" | "href" | "isActive" | "tooltip" | "type"> &
  VariantProps<typeof sidebarMenuButton> & {
    asChild?: boolean;
    isActive?: boolean;
    tooltip?: string;
    href?: string;
    class?: ClassValue;
  };
type SidebarMenuButtonDeclaredProps = {
  asChild?: boolean;
  isActive?: boolean;
  tooltip?: string;
  href?: string;
  class?: ClassValue;
  variant?: SidebarMenuButtonProps["variant"];
  size?: SidebarMenuButtonProps["size"];
} & /* @vue-ignore */ SidebarMenuButtonProps;
const {
  asChild = false,
  isActive = false,
  tooltip,
  variant,
  size = "md",
  href,
  class: className,
} = defineProps<SidebarMenuButtonDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const Tag = computed(() => (asChild ? "div" : href ? "a" : "button"));
const buttonClassName = computed(() => sidebarMenuButton({ variant, size, class: className }));
</script>

<template>
  <template v-if="Boolean(tooltip)">
    <Tooltip :open-delay="0" :close-delay="0" class="w-full">
      <TooltipTrigger class="w-full">
        <SidebarPrimitive.SidebarMenuButton :as-child="true">
          <Tag
            :class="buttonClassName"
            data-sidebar="menu-button"
            :data-size="size"
            :data-active="isActive"
            :data-tooltip="tooltip"
            :href="href"
            data-slot="sidebar-menu-button"
            :type="Tag === 'button' ? 'button' : undefined"
            :data-as-child="asChild ? true : undefined"
            v-bind="attrs"
          >
            <slot />
          </Tag>
        </SidebarPrimitive.SidebarMenuButton>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        align="center"
        class="whitespace-nowrap"
        data-sw-sidebar-tooltip-content
      >
        {{ tooltip }}
      </TooltipContent>
    </Tooltip>
  </template>
  <template v-else>
    <SidebarPrimitive.SidebarMenuButton :as-child="true">
      <Tag
        :class="buttonClassName"
        data-sidebar="menu-button"
        :data-size="size"
        :data-active="isActive"
        :data-tooltip="tooltip"
        :href="href"
        data-slot="sidebar-menu-button"
        :type="Tag === 'button' ? 'button' : undefined"
        :data-as-child="asChild ? true : undefined"
        v-bind="attrs"
      >
        <slot />
      </Tag>
    </SidebarPrimitive.SidebarMenuButton>
  </template>
</template>
