<script setup lang="ts">
import * as NavigationMenuPrimitive from "@starwind-ui/vue/navigation-menu";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { navigationMenuPopup, navigationMenuPositioner, navigationMenuViewport } from "./variants";

defineOptions({ inheritAttrs: false });

export type NavigationMenuPositionerProps = Omit<
  HTMLAttributes,
  | "align"
  | "alignOffset"
  | "avoidCollisions"
  | "class"
  | "collisionPadding"
  | "disablePortal"
  | "portalContainer"
  | "side"
  | "sideOffset"
  | "size"
> & {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  alignOffset?: number;
  avoidCollisions?: boolean;
  collisionPadding?: number;
  size?: "sm" | "md";
  portalContainer?: string;
  disablePortal?: boolean;
  class?: ClassValue;
};
type NavigationMenuPositionerDeclaredProps = {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  alignOffset?: number;
  avoidCollisions?: boolean;
  collisionPadding?: number;
  size?: "sm" | "md";
  portalContainer?: string;
  disablePortal?: boolean;
  class?: ClassValue;
} & /* @vue-ignore */ NavigationMenuPositionerProps;
const {
  side = "bottom",
  align = "start",
  sideOffset = 8,
  alignOffset = 0,
  avoidCollisions = true,
  collisionPadding = 8,
  size = "md",
  class: className,
  portalContainer,
  disablePortal = false,
} = defineProps<NavigationMenuPositionerDeclaredProps>();
defineSlots<{}>();
</script>

<template>
  <NavigationMenuPrimitive.NavigationMenuPortal
    :container="portalContainer"
    :disabled="disablePortal"
    data-slot="navigation-menu-portal"
  >
    <NavigationMenuPrimitive.NavigationMenuPositioner
      :class="navigationMenuPositioner({ class: className })"
      :side="side"
      :align="align"
      :side-offset="sideOffset"
      :align-offset="alignOffset"
      :avoid-collisions="avoidCollisions"
      :collision-padding="collisionPadding"
      v-bind="$attrs"
      :data-size="size"
      data-slot="navigation-menu-positioner"
    >
      <NavigationMenuPrimitive.NavigationMenuPopup
        :class="navigationMenuPopup()"
        data-slot="navigation-menu-popup"
      >
        <NavigationMenuPrimitive.NavigationMenuViewport
          :class="navigationMenuViewport()"
          data-slot="navigation-menu-viewport"
        />
      </NavigationMenuPrimitive.NavigationMenuPopup>
    </NavigationMenuPrimitive.NavigationMenuPositioner>
  </NavigationMenuPrimitive.NavigationMenuPortal>
</template>
