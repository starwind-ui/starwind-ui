<script setup lang="ts">
import * as InputOtpPrimitive from "@starwind-ui/vue/input-otp";
import type { ClassValue } from "tailwind-variants";
import { type ComponentPublicInstance, type HTMLAttributes, nextTick, ref } from "vue";
import { inputOtpGroup } from "./variants";

defineOptions({ inheritAttrs: false });

export type InputOtpGroupProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type InputOtpGroupDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ InputOtpGroupProps;
const { class: className } = defineProps<InputOtpGroupDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
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
  <InputOtpPrimitive.InputOtpGroup
    :ref="setElement"
    :class="inputOtpGroup({ class: className })"
    v-bind="$attrs"
    data-slot="input-otp-group"
  >
    <slot />
  </InputOtpPrimitive.InputOtpGroup>
</template>
