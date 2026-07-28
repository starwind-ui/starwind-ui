<script setup lang="ts">
import * as PopoverPrimitive from "@starwind-ui/vue/popover";
import type { ClassValue, VariantProps } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { popoverContent } from "./variants";

defineOptions({ inheritAttrs: false });

export type PopoverContentProps = Omit<
  HTMLAttributes,
  "align" | "avoidCollisions" | "class" | "collisionStrategy" | "side" | "sideOffset"
> &
  VariantProps<typeof popoverContent> & {
    side?: "top" | "right" | "bottom" | "left";
    align?: "start" | "center" | "end";
    sideOffset?: number;
    avoidCollisions?: boolean;
    collisionStrategy?: "initial-placement" | "best-fit";
    class?: ClassValue;
  };
type PopoverContentDeclaredProps = {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  avoidCollisions?: boolean;
  collisionStrategy?: "initial-placement" | "best-fit";
  class?: ClassValue;
  exitMotion?: PopoverContentProps["exitMotion"];
} & /* @vue-ignore */ PopoverContentProps;
const {
  class: className,
  side = "bottom",
  align = "center",
  sideOffset = 4,
  avoidCollisions = true,
  collisionStrategy = "initial-placement",
  exitMotion = "popover",
} = defineProps<PopoverContentDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <PopoverPrimitive.PopoverPortal data-slot="popover-portal">
    <PopoverPrimitive.PopoverPopup
      :class="popoverContent({ exitMotion, class: className })"
      :side="side"
      :align="align"
      :side-offset="sideOffset"
      :avoid-collisions="avoidCollisions"
      :collision-strategy="collisionStrategy"
      v-bind="attrs"
      data-slot="popover-content"
    >
      <slot />
    </PopoverPrimitive.PopoverPopup>
  </PopoverPrimitive.PopoverPortal>
</template>
