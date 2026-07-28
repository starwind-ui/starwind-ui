<script setup lang="ts">
import * as FieldPrimitive from "@starwind-ui/vue/field";
import type { ClassValue, VariantProps } from "tailwind-variants";
import { type ComponentPublicInstance, type HTMLAttributes, nextTick, ref, useAttrs } from "vue";
import { fieldValidity } from "./variants";

defineOptions({ inheritAttrs: false });

export type FieldValidityProps = Omit<HTMLAttributes, "class" | "match"> &
  VariantProps<typeof fieldValidity> & {
    match?:
      | boolean
      | "badInput"
      | "customError"
      | "patternMismatch"
      | "rangeOverflow"
      | "rangeUnderflow"
      | "stepMismatch"
      | "tooLong"
      | "tooShort"
      | "typeMismatch"
      | "valid"
      | "valueMissing";
    class?: ClassValue;
  };
type FieldValidityDeclaredProps = {
  match?:
    | boolean
    | "badInput"
    | "customError"
    | "patternMismatch"
    | "rangeOverflow"
    | "rangeUnderflow"
    | "stepMismatch"
    | "tooLong"
    | "tooShort"
    | "typeMismatch"
    | "valid"
    | "valueMissing";
  class?: ClassValue;
} & /* @vue-ignore */ FieldValidityProps;
const { match, class: className } = defineProps<FieldValidityDeclaredProps>();
defineSlots<{
  default?: () => unknown;
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
  <FieldPrimitive.FieldValidity
    :ref="setElement"
    :class="fieldValidity({ class: className })"
    :match="match"
    v-bind="attrs"
    data-slot="field-validity"
  >
    <slot />
  </FieldPrimitive.FieldValidity>
</template>
