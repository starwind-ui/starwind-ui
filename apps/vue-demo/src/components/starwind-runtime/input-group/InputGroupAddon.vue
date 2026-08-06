<script setup lang="ts">
import type { ClassValue, VariantProps } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { inputGroupAddon } from "./variants";

defineOptions({ inheritAttrs: false });

export type InputGroupAddonProps = Omit<HTMLAttributes, "class"> &
  VariantProps<typeof inputGroupAddon> & {
    class?: ClassValue;
  };
type InputGroupAddonDeclaredProps = {
  class?: ClassValue;
  align?: InputGroupAddonProps["align"];
} & /* @vue-ignore */ InputGroupAddonProps;
const { align, class: className } = defineProps<InputGroupAddonDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <div
    role="group"
    :data-align="align"
    :class="inputGroupAddon({ align, class: className })"
    v-bind="attrs"
    data-slot="input-group-addon"
  >
    <slot />
  </div>
</template>
