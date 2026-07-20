<script setup lang="ts">
import * as AvatarPrimitive from "@starwind-ui/vue/avatar";
import type { ClassValue, VariantProps } from "tailwind-variants";
import { type ComponentPublicInstance, type HTMLAttributes, nextTick, ref, useAttrs } from "vue";
import { avatar } from "./variants";

defineOptions({ inheritAttrs: false });

export type AvatarProps = Omit<HTMLAttributes, "class"> &
  VariantProps<typeof avatar> & {
    class?: ClassValue;
  };
type AvatarDeclaredProps = {
  class?: ClassValue;
  variant?: AvatarProps["variant"];
  size?: AvatarProps["size"];
} & /* @vue-ignore */ AvatarProps;
const { variant, size, class: className } = defineProps<AvatarDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const element = ref<HTMLSpanElement | null>(null);
let pendingPrimitiveRef: ({ element?: HTMLSpanElement | null } & ComponentPublicInstance) | null =
  null;
defineExpose({ element });

function setElement(value: Element | ComponentPublicInstance | null): void {
  if (value instanceof HTMLSpanElement) {
    pendingPrimitiveRef = null;
    element.value = value;
    return;
  }
  const exposed = value as ({ element?: HTMLSpanElement | null } & ComponentPublicInstance) | null;
  pendingPrimitiveRef = exposed;
  element.value = exposed?.element instanceof HTMLSpanElement ? exposed.element : null;
  if (!exposed || element.value) return;

  void nextTick(() => {
    if (pendingPrimitiveRef !== exposed) return;
    element.value = exposed.element instanceof HTMLSpanElement ? exposed.element : null;
  });
}
</script>

<template>
  <AvatarPrimitive.AvatarRoot
    :ref="setElement"
    :class="avatar({ variant, size, class: className })"
    v-bind="attrs"
    data-slot="avatar"
  >
    <slot />
  </AvatarPrimitive.AvatarRoot>
</template>
