<script setup lang="ts">
import type { ClassValue, VariantProps } from "tailwind-variants";
import { useAttrs } from "vue";
import { Button } from "../button";
import { inputGroupButton } from "./variants";

defineOptions({ inheritAttrs: false });

export type InputGroupButtonProps = Omit<InstanceType<typeof Button>["$props"], "size"> &
  VariantProps<typeof inputGroupButton> & {
    class?: ClassValue;
  };
type InputGroupButtonDeclaredProps = {
  class?: ClassValue;
  type?: InputGroupButtonProps["type"];
  variant?: InputGroupButtonProps["variant"];
  size?: InputGroupButtonProps["size"];
} & /* @vue-ignore */ InputGroupButtonProps;
const {
  type = "button",
  variant = "ghost",
  size,
  class: className,
} = defineProps<InputGroupButtonDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <Button
    :type="type"
    :data-size="size"
    :size="size"
    :variant="variant"
    :class="inputGroupButton({ size, class: className })"
    v-bind="attrs as Omit<InstanceType<typeof Button>['$props'], 'class' | 'style'>"
  >
    <slot />
  </Button>
</template>
