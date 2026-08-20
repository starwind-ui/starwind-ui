<script setup lang="ts">
import * as MenuPrimitive from "@starwind-ui/vue/menu";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { dropdownContent } from "./variants";

defineOptions({ inheritAttrs: false });

export type DropdownContentProps = Omit<
  HTMLAttributes,
  | "align"
  | "avoidCollisions"
  | "class"
  | "disablePortal"
  | "portalContainer"
  | "side"
  | "sideOffset"
> & {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  avoidCollisions?: boolean;
  portalContainer?: string;
  disablePortal?: boolean;
  class?: ClassValue;
};
type DropdownContentDeclaredProps = {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  avoidCollisions?: boolean;
  portalContainer?: string;
  disablePortal?: boolean;
  class?: ClassValue;
} & /* @vue-ignore */ DropdownContentProps;
const {
  class: className,
  side = "bottom",
  align = "start",
  sideOffset = 4,
  avoidCollisions = true,
  portalContainer,
  disablePortal = false,
} = defineProps<DropdownContentDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <MenuPrimitive.MenuPortal
    :container="portalContainer"
    :disabled="disablePortal"
    data-slot="dropdown-portal"
  >
    <MenuPrimitive.MenuPopup
      :class="dropdownContent({ class: className })"
      :side="side"
      :align="align"
      :side-offset="sideOffset"
      :avoid-collisions="avoidCollisions"
      v-bind="$attrs"
      data-slot="dropdown-content"
    >
      <slot />
    </MenuPrimitive.MenuPopup>
  </MenuPrimitive.MenuPortal>
</template>
