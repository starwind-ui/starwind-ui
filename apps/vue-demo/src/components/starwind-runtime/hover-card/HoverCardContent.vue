<script setup lang="ts">
import * as PreviewCardPrimitive from "@starwind-ui/vue/preview-card";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { hoverCardContent } from "./variants";

defineOptions({ inheritAttrs: false });

export type HoverCardContentProps = Omit<
  HTMLAttributes,
  "align" | "avoidCollisions" | "class" | "side" | "sideOffset"
> & {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  avoidCollisions?: boolean;
  class?: ClassValue;
};
type HoverCardContentDeclaredProps = {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  avoidCollisions?: boolean;
  class?: ClassValue;
} & /* @vue-ignore */ HoverCardContentProps;
const {
  class: className,
  side = "bottom",
  align = "center",
  sideOffset = 4,
  avoidCollisions = true,
} = defineProps<HoverCardContentDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <PreviewCardPrimitive.PreviewCardPortal data-slot="hover-card-portal">
    <PreviewCardPrimitive.PreviewCardPositioner
      :side="side"
      :align="align"
      :side-offset="sideOffset"
      :avoid-collisions="avoidCollisions"
      class="isolate z-50"
      data-slot="hover-card-positioner"
    >
      <PreviewCardPrimitive.PreviewCardPopup
        :class="hoverCardContent({ class: className })"
        :side="side"
        :align="align"
        :side-offset="sideOffset"
        :avoid-collisions="avoidCollisions"
        v-bind="attrs"
        data-slot="hover-card-content"
      >
        <slot />
      </PreviewCardPrimitive.PreviewCardPopup>
    </PreviewCardPrimitive.PreviewCardPositioner>
  </PreviewCardPrimitive.PreviewCardPortal>
</template>
