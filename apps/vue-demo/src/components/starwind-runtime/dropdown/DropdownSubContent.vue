<script setup lang="ts">
import * as MenuPrimitive from "@starwind-ui/vue/menu";
import type { ClassValue } from "tailwind-variants";
import { computed, type HTMLAttributes } from "vue";
import { dropdownContent } from "./variants";

defineOptions({ inheritAttrs: false });

export type DropdownSubContentProps = Omit<
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
type DropdownSubContentDeclaredProps = {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  avoidCollisions?: boolean;
  portalContainer?: string;
  disablePortal?: boolean;
  class?: ClassValue;
} & /* @vue-ignore */ DropdownSubContentProps;
const {
  class: className,
  side = "right",
  align = "start",
  sideOffset = 0,
  avoidCollisions = true,
  portalContainer,
  disablePortal = false,
} = defineProps<DropdownSubContentDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const subContentClassName = computed(() => className);
</script>

<template>
  <MenuPrimitive.MenuPortal
    :container="portalContainer"
    :disabled="disablePortal"
    data-slot="dropdown-sub-portal"
  >
    <MenuPrimitive.MenuPopup
      :class="dropdownContent({ class: subContentClassName })"
      :side="side"
      :align="align"
      :side-offset="sideOffset"
      :avoid-collisions="avoidCollisions"
      v-bind="$attrs"
      data-slot="dropdown-sub-content"
    >
      <slot />
    </MenuPrimitive.MenuPopup>
  </MenuPrimitive.MenuPortal>
</template>
