<script setup lang="ts">
import type { ClassValue, VariantProps } from "tailwind-variants";
import { useAttrs } from "vue";
import "./styles.css";
import { PopoverContent } from "../popover";
import ColorPickerDefaultEditor from "./ColorPickerDefaultEditor.vue";
import { colorPickerContent } from "./variants";

defineOptions({ inheritAttrs: false });

export type ColorPickerContentProps = InstanceType<typeof PopoverContent>["$props"] &
  VariantProps<typeof colorPickerContent> & {
    showEyeDropper?: boolean;
    formatControl?: "select" | "native" | "none";
    formats?: readonly import("@starwind-ui/runtime/color-picker").ColorPickerFormat[];
    swatches?: readonly (
      | import("@starwind-ui/runtime/color-picker").ColorPickerValue
      | {
          value: import("@starwind-ui/runtime/color-picker").ColorPickerValue;
          label: string;
          disabled?: boolean;
        }
    )[];
    class?: ClassValue;
  };
type ColorPickerContentDeclaredProps = {
  showEyeDropper?: boolean;
  formatControl?: "select" | "native" | "none";
  formats?: readonly import("@starwind-ui/runtime/color-picker").ColorPickerFormat[];
  swatches?: readonly (
    | import("@starwind-ui/runtime/color-picker").ColorPickerValue
    | {
        value: import("@starwind-ui/runtime/color-picker").ColorPickerValue;
        label: string;
        disabled?: boolean;
      }
  )[];
  class?: ClassValue;
  size?: ColorPickerContentProps["size"];
  side?: ColorPickerContentProps["side"];
  align?: ColorPickerContentProps["align"];
  exitMotion?: ColorPickerContentProps["exitMotion"];
} & /* @vue-ignore */ ColorPickerContentProps;
const {
  class: className,
  size = "md",
  showEyeDropper = true,
  formatControl = "select",
  formats = ["hex", "rgb", "hsl", "hsb"],
  swatches = [],
  side = "bottom",
  align = "start",
  exitMotion = "fade",
} = defineProps<ColorPickerContentDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <PopoverContent
    :class="colorPickerContent({ size, class: className })"
    :side="side"
    :align="align"
    collision-strategy="best-fit"
    :exit-motion="exitMotion"
    v-bind="attrs as Omit<InstanceType<typeof PopoverContent>['$props'], 'class' | 'style'>"
    data-sw-color-picker-content=""
    :data-size="size"
    data-slot="color-picker-content"
  >
    <slot>
      <ColorPickerDefaultEditor
        :size="size"
        :show-eye-dropper="showEyeDropper"
        :format-control="formatControl"
        :formats="formats"
        :swatches="swatches"
      />
    </slot>
  </PopoverContent>
</template>
