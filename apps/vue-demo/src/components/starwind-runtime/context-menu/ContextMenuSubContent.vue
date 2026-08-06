<script setup lang="ts">
import * as ContextMenuPrimitive from "@starwind-ui/vue/context-menu";
import type { ClassValue } from "tailwind-variants";
import { computed, type HTMLAttributes, useAttrs } from "vue";
import { contextMenuContent } from "./variants";

defineOptions({ inheritAttrs: false });

export type ContextMenuSubContentProps = Omit<
  HTMLAttributes,
  "align" | "avoidCollisions" | "class" | "side" | "sideOffset"
> & {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  avoidCollisions?: boolean;
  class?: ClassValue;
};
type ContextMenuSubContentDeclaredProps = {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  avoidCollisions?: boolean;
  class?: ClassValue;
} & /* @vue-ignore */ ContextMenuSubContentProps;
const {
  class: className,
  side = "right",
  align = "start",
  sideOffset = 0,
  avoidCollisions = true,
} = defineProps<ContextMenuSubContentDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const subContentClassName = computed(() => className);
</script>

<template>
  <ContextMenuPrimitive.ContextMenuPortal data-slot="context-menu-sub-portal">
    <ContextMenuPrimitive.ContextMenuPopup
      :class="contextMenuContent({ class: subContentClassName })"
      :side="side"
      :align="align"
      :side-offset="sideOffset"
      :avoid-collisions="avoidCollisions"
      v-bind="attrs"
      data-slot="context-menu-sub-content"
    >
      <slot />
    </ContextMenuPrimitive.ContextMenuPopup>
  </ContextMenuPrimitive.ContextMenuPortal>
</template>
