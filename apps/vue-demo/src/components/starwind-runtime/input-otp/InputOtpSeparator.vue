<script setup lang="ts">
import * as InputOtpPrimitive from "@starwind-ui/vue/input-otp";
import type { ClassValue } from "tailwind-variants";
import { type ComponentPublicInstance, type HTMLAttributes, nextTick, ref, useAttrs } from "vue";
import { inputOtpSeparator } from "./variants";

defineOptions({ inheritAttrs: false });

export type InputOtpSeparatorProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type InputOtpSeparatorDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ InputOtpSeparatorProps;
const { class: className } = defineProps<InputOtpSeparatorDeclaredProps>();
defineSlots<{
  icon?: () => unknown;
}>();
const attrs = useAttrs();
const element = ref<HTMLDivElement | null>(null);
let pendingPrimitiveRef: ({ element?: HTMLDivElement | null } & ComponentPublicInstance) | null =
  null;
defineExpose({ element });

function setElement(value: Element | ComponentPublicInstance | null): void {
  if (value instanceof HTMLDivElement) {
    pendingPrimitiveRef = null;
    element.value = value;
    return;
  }
  const exposed = value as ({ element?: HTMLDivElement | null } & ComponentPublicInstance) | null;
  pendingPrimitiveRef = exposed;
  element.value = exposed?.element instanceof HTMLDivElement ? exposed.element : null;
  if (!exposed || element.value) return;

  void nextTick(() => {
    if (pendingPrimitiveRef !== exposed) return;
    element.value = exposed.element instanceof HTMLDivElement ? exposed.element : null;
  });
}
</script>

<template>
  <InputOtpPrimitive.InputOtpSeparator
    :ref="setElement"
    :class="inputOtpSeparator({ class: className })"
    v-bind="attrs"
    data-slot="input-otp-separator"
  >
    <slot name="icon">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        class="size-6"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M5 12h14" />
      </svg>
    </slot>
  </InputOtpPrimitive.InputOtpSeparator>
</template>
