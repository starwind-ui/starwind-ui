<script setup lang="ts">
import * as SelectPrimitive from "@starwind-ui/vue/select";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { selectContent, selectList } from "./variants";

defineOptions({ inheritAttrs: false });

export type SelectContentProps = Omit<
  HTMLAttributes,
  | "align"
  | "alignItemWithTrigger"
  | "alignOffset"
  | "avoidCollisions"
  | "class"
  | "disablePortal"
  | "portalContainer"
  | "side"
  | "sideOffset"
  | "size"
> & {
  align?: "start" | "center" | "end";
  alignOffset?: number;
  alignItemWithTrigger?: boolean;
  avoidCollisions?: boolean;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  size?: "sm" | "md" | "lg";
  portalContainer?: string;
  disablePortal?: boolean;
  class?: ClassValue;
};
type SelectContentDeclaredProps = {
  align?: "start" | "center" | "end";
  alignOffset?: number;
  alignItemWithTrigger?: boolean;
  avoidCollisions?: boolean;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  size?: "sm" | "md" | "lg";
  portalContainer?: string;
  disablePortal?: boolean;
  class?: ClassValue;
} & /* @vue-ignore */ SelectContentProps;
const {
  align = "start",
  alignOffset = 0,
  alignItemWithTrigger = true,
  avoidCollisions = true,
  class: className,
  side = "bottom",
  sideOffset = 4,
  size = "md",
  portalContainer,
  disablePortal = false,
} = defineProps<SelectContentDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <SelectPrimitive.SelectPortal
    :container="portalContainer"
    :disabled="disablePortal"
    data-slot="select-portal"
  >
    <SelectPrimitive.SelectPositioner
      :align="align"
      :align-offset="alignOffset"
      :align-item-with-trigger="alignItemWithTrigger"
      :avoid-collisions="avoidCollisions"
      :side="side"
      :side-offset="sideOffset"
      data-slot="select-positioner"
    >
      <SelectPrimitive.SelectPopup
        :class="selectContent({ size, class: className })"
        :align="align"
        :align-offset="alignOffset"
        :avoid-collisions="avoidCollisions"
        :side="side"
        :side-offset="sideOffset"
        :data-align-trigger="alignItemWithTrigger ? 'true' : 'false'"
        v-bind="$attrs"
        :data-size="size"
        data-slot="select-content"
      >
        <SelectPrimitive.SelectList :class="selectList()" data-slot="select-list">
          <slot />
        </SelectPrimitive.SelectList>
      </SelectPrimitive.SelectPopup>
    </SelectPrimitive.SelectPositioner>
  </SelectPrimitive.SelectPortal>
</template>
