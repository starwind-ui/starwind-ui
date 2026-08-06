<script setup lang="ts">
import * as NavigationMenuPrimitive from "@starwind-ui/vue/navigation-menu";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { navigationMenuPopup, navigationMenuPositioner, navigationMenuViewport } from "./variants";

defineOptions({ inheritAttrs: false });

export type NavigationMenuPositionerProps = Omit<
  HTMLAttributes,
  | "align"
  | "alignOffset"
  | "avoidCollisions"
  | "class"
  | "collisionPadding"
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
} = defineProps<NavigationMenuPositionerDeclaredProps>();
defineSlots<{}>();
const attrs = useAttrs();
</script>

<template>
  <NavigationMenuPrimitive.NavigationMenuPortal data-slot="navigation-menu-portal">
    <NavigationMenuPrimitive.NavigationMenuPositioner
      :class="navigationMenuPositioner({ class: className })"
      :side="side"
      :align="align"
      :side-offset="sideOffset"
      :align-offset="alignOffset"
      :avoid-collisions="avoidCollisions"
      :collision-padding="collisionPadding"
      v-bind="attrs"
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
