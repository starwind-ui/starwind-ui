<script setup lang="ts">
import * as ContextMenuPrimitive from "@starwind-ui/vue/context-menu";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { contextMenuContent } from "./variants";

defineOptions({ inheritAttrs: false });

export type ContextMenuContentProps = Omit<
  HTMLAttributes,
  "align" | "avoidCollisions" | "class" | "side" | "sideOffset"
> & {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  avoidCollisions?: boolean;
  class?: ClassValue;
};
type ContextMenuContentDeclaredProps = {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  avoidCollisions?: boolean;
  class?: ClassValue;
} & /* @vue-ignore */ ContextMenuContentProps;
const {
  class: className,
  side = "bottom",
  align = "start",
  sideOffset = 4,
  avoidCollisions = true,
} = defineProps<ContextMenuContentDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <ContextMenuPrimitive.ContextMenuPortal data-slot="context-menu-portal">
    <ContextMenuPrimitive.ContextMenuPopup
      :class="contextMenuContent({ class: className })"
      :side="side"
      :align="align"
      :side-offset="sideOffset"
      :avoid-collisions="avoidCollisions"
      v-bind="attrs"
      data-slot="context-menu-content"
    >
      <slot />
    </ContextMenuPrimitive.ContextMenuPopup>
  </ContextMenuPrimitive.ContextMenuPortal>
</template>
