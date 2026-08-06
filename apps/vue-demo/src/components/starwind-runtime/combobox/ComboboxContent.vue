<script setup lang="ts">
import * as ComboboxPrimitive from "@starwind-ui/vue/combobox";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { comboboxContent, comboboxList } from "./variants";

defineOptions({ inheritAttrs: false });

export type ComboboxContentProps = Omit<
  HTMLAttributes,
  "align" | "alignOffset" | "avoidCollisions" | "class" | "side" | "sideOffset" | "size"
> & {
  align?: "start" | "center" | "end";
  alignOffset?: number;
  avoidCollisions?: boolean;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  size?: "sm" | "md" | "lg";
  class?: ClassValue;
};
type ComboboxContentDeclaredProps = {
  align?: "start" | "center" | "end";
  alignOffset?: number;
  avoidCollisions?: boolean;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  size?: "sm" | "md" | "lg";
  class?: ClassValue;
} & /* @vue-ignore */ ComboboxContentProps;
const {
  align = "start",
  alignOffset = 0,
  avoidCollisions = true,
  class: className,
  side = "bottom",
  sideOffset = 4,
  size = "md",
} = defineProps<ComboboxContentDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <ComboboxPrimitive.ComboboxPortal>
    <ComboboxPrimitive.ComboboxPositioner
      :align="align"
      :align-offset="alignOffset"
      :avoid-collisions="avoidCollisions"
      :side="side"
      :side-offset="sideOffset"
      data-slot="combobox-positioner"
    >
      <ComboboxPrimitive.ComboboxPopup
        :class="comboboxContent({ size, class: className })"
        :align="align"
        :align-offset="alignOffset"
        :avoid-collisions="avoidCollisions"
        :side="side"
        :side-offset="sideOffset"
        v-bind="attrs"
        :data-size="size"
        data-slot="combobox-content"
      >
        <ComboboxPrimitive.ComboboxList :class="comboboxList()" data-slot="combobox-list">
          <slot />
        </ComboboxPrimitive.ComboboxList>
      </ComboboxPrimitive.ComboboxPopup>
    </ComboboxPrimitive.ComboboxPositioner>
  </ComboboxPrimitive.ComboboxPortal>
</template>
