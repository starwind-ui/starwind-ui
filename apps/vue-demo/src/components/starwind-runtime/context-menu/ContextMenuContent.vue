<script setup lang="ts">
import * as ContextMenuPrimitive from "@starwind-ui/vue/context-menu";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { contextMenuContent } from "./variants";

defineOptions({ inheritAttrs: false });

export type ContextMenuContentProps = Omit<
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
type ContextMenuContentDeclaredProps = {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  avoidCollisions?: boolean;
  portalContainer?: string;
  disablePortal?: boolean;
  class?: ClassValue;
} & /* @vue-ignore */ ContextMenuContentProps;
const {
  class: className,
  side = "bottom",
  align = "start",
  sideOffset = 4,
  avoidCollisions = true,
  portalContainer,
  disablePortal = false,
} = defineProps<ContextMenuContentDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <ContextMenuPrimitive.ContextMenuPortal
    :container="portalContainer"
    :disabled="disablePortal"
    data-slot="context-menu-portal"
  >
    <ContextMenuPrimitive.ContextMenuPopup
      :class="contextMenuContent({ class: className })"
      :side="side"
      :align="align"
      :side-offset="sideOffset"
      :avoid-collisions="avoidCollisions"
      v-bind="$attrs"
      data-slot="context-menu-content"
    >
      <slot />
    </ContextMenuPrimitive.ContextMenuPopup>
  </ContextMenuPrimitive.ContextMenuPortal>
</template>
