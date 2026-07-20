<script setup lang="ts">
import * as AvatarPrimitive from "@starwind-ui/vue/avatar";
import type { ClassValue } from "tailwind-variants";
import { type ComponentPublicInstance, type HTMLAttributes, nextTick, ref, useAttrs } from "vue";
import { avatarFallback } from "./variants";

defineOptions({ inheritAttrs: false });

export type AvatarFallbackProps = Omit<HTMLAttributes, "class" | "delay"> & {
  delay?: number;
  class?: ClassValue;
};
type AvatarFallbackDeclaredProps = {
  delay?: number;
  class?: ClassValue;
} & /* @vue-ignore */ AvatarFallbackProps;
const { delay, class: className } = defineProps<AvatarFallbackDeclaredProps>();
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
  <AvatarPrimitive.AvatarFallback
    :ref="setElement"
    :class="avatarFallback({ class: className })"
    :delay="delay"
    v-bind="attrs"
    data-slot="avatar-fallback"
  >
    <slot />
  </AvatarPrimitive.AvatarFallback>
</template>
