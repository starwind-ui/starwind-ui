<script setup lang="ts">
import type { ClassValue, VariantProps } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { InputGroup } from "../input-group";
import { comboboxInputGroup } from "./variants";

defineOptions({ inheritAttrs: false });

export type ComboboxInputGroupProps = Omit<HTMLAttributes, "class"> &
  VariantProps<typeof comboboxInputGroup> & {
    class?: ClassValue;
  };
type ComboboxInputGroupDeclaredProps = {
  class?: ClassValue;
  size?: ComboboxInputGroupProps["size"];
} & /* @vue-ignore */ ComboboxInputGroupProps;
const { class: className, size = "md" } = defineProps<ComboboxInputGroupDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <InputGroup
    :class="comboboxInputGroup({ size, class: className })"
    v-bind="attrs as Omit<InstanceType<typeof InputGroup>['$props'], 'class' | 'style'>"
    :data-size="size"
    data-sw-combobox-input-group=""
    data-slot="combobox-input-group"
  >
    <slot />
  </InputGroup>
</template>
