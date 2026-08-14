<script setup lang="ts">
import * as TooltipPrimitive from "@starwind-ui/vue/tooltip";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { tooltipCaret, tooltipContent, tooltipPositioner } from "./variants";

defineOptions({ inheritAttrs: false });

export type TooltipContentProps = Omit<
  HTMLAttributes,
  | "align"
  | "avoidCollisions"
  | "class"
  | "positionerClass"
  | "side"
  | "sideOffset"
  | "tabIndex"
  | "tabindex"
> & {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  avoidCollisions?: boolean;
  positionerClass?: string;
  class?: ClassValue;
};
type TooltipContentDeclaredProps = {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  avoidCollisions?: boolean;
  positionerClass?: string;
  class?: ClassValue;
} & /* @vue-ignore */ TooltipContentProps;
const {
  class: className,
  positionerClass,
  side = "top",
  align = "center",
  sideOffset = 8,
  avoidCollisions = true,
} = defineProps<TooltipContentDeclaredProps>();
defineSlots<{
  default?: () => unknown;
  icon?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <TooltipPrimitive.TooltipPortal data-slot="tooltip-portal">
    <TooltipPrimitive.TooltipPositioner
      :side="side"
      :align="align"
      :side-offset="sideOffset"
      :avoid-collisions="avoidCollisions"
      :class="tooltipPositioner({ class: positionerClass })"
      data-slot="tooltip-positioner"
    >
      <TooltipPrimitive.TooltipPopup
        :class="tooltipContent({ class: className })"
        :side="side"
        :align="align"
        :side-offset="sideOffset"
        :avoid-collisions="avoidCollisions"
        v-bind="attrs"
        data-slot="tooltip-content"
      >
        <slot> My tooltip! </slot>
        <TooltipPrimitive.TooltipArrow :class="tooltipCaret()" data-slot="tooltip-arrow">
          <slot name="icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M11.293 7.293a1 1 0 0 1 1.414 0l6 6a1 1 0 0 1 -.707 1.707h-12a1 1 0 0 1 -.707 -1.707z"
                stroke="none"
              />
            </svg>
          </slot>
        </TooltipPrimitive.TooltipArrow>
      </TooltipPrimitive.TooltipPopup>
    </TooltipPrimitive.TooltipPositioner>
  </TooltipPrimitive.TooltipPortal>
</template>
