<script setup lang="ts">
import * as InputOtpPrimitive from "@starwind-ui/vue/input-otp";
import type { ClassValue, VariantProps } from "tailwind-variants";
import { type ComponentPublicInstance, type HTMLAttributes, nextTick, ref, useAttrs } from "vue";
import { inputOtpSlot } from "./variants";

defineOptions({ inheritAttrs: false });

export type InputOtpSlotProps = Omit<HTMLAttributes, "class" | "index"> &
  VariantProps<typeof inputOtpSlot> & {
    index?: number;
    class?: ClassValue;
  };
type InputOtpSlotDeclaredProps = {
  index?: number;
  class?: ClassValue;
  size?: InputOtpSlotProps["size"];
} & /* @vue-ignore */ InputOtpSlotProps;
const { size, index, class: className } = defineProps<InputOtpSlotDeclaredProps>();
defineSlots<{}>();
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
  <InputOtpPrimitive.InputOtpSlot
    :ref="setElement"
    :class="inputOtpSlot({ size, class: className })"
    :index="index"
    v-bind="attrs"
    data-slot="input-otp-slot"
  />
</template>
