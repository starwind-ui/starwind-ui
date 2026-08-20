<script setup lang="ts">
import * as PreviewCardPrimitive from "@starwind-ui/vue/preview-card";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { hoverCardContent, hoverCardPositioner } from "./variants";

defineOptions({ inheritAttrs: false });

export type HoverCardContentProps = Omit<
  HTMLAttributes,
  | "align"
  | "avoidCollisions"
  | "class"
  | "disablePortal"
  | "portalContainer"
  | "positionerClass"
  | "side"
  | "sideOffset"
> & {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  avoidCollisions?: boolean;
  positionerClass?: string;
  portalContainer?: string;
  disablePortal?: boolean;
  class?: ClassValue;
};
type HoverCardContentDeclaredProps = {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  avoidCollisions?: boolean;
  positionerClass?: string;
  portalContainer?: string;
  disablePortal?: boolean;
  class?: ClassValue;
} & /* @vue-ignore */ HoverCardContentProps;
const {
  class: className,
  positionerClass,
  side = "bottom",
  align = "center",
  sideOffset = 4,
  avoidCollisions = true,
  portalContainer,
  disablePortal = false,
} = defineProps<HoverCardContentDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <PreviewCardPrimitive.PreviewCardPortal
    :container="portalContainer"
    :disabled="disablePortal"
    data-slot="hover-card-portal"
  >
    <PreviewCardPrimitive.PreviewCardPositioner
      :side="side"
      :align="align"
      :side-offset="sideOffset"
      :avoid-collisions="avoidCollisions"
      :class="hoverCardPositioner({ class: positionerClass })"
      data-slot="hover-card-positioner"
    >
      <PreviewCardPrimitive.PreviewCardPopup
        :class="hoverCardContent({ class: className })"
        :side="side"
        :align="align"
        :side-offset="sideOffset"
        :avoid-collisions="avoidCollisions"
        v-bind="$attrs"
        data-slot="hover-card-content"
      >
        <slot />
      </PreviewCardPrimitive.PreviewCardPopup>
    </PreviewCardPrimitive.PreviewCardPositioner>
  </PreviewCardPrimitive.PreviewCardPortal>
</template>
