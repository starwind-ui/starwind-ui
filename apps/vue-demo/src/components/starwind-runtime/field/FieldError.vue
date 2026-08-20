<script setup lang="ts">
import * as FieldPrimitive from "@starwind-ui/vue/field";
import type { ClassValue } from "tailwind-variants";
import { type ComponentPublicInstance, type HTMLAttributes, nextTick, ref } from "vue";
import { fieldError } from "./variants";

defineOptions({ inheritAttrs: false });

export type FieldErrorProps = Omit<HTMLAttributes, "class" | "match" | "messageSource"> & {
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
  messageSource?: "children" | "validation";
  class?: ClassValue;
};
type FieldErrorDeclaredProps = {
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
  messageSource?: "children" | "validation";
  class?: ClassValue;
} & /* @vue-ignore */ FieldErrorProps;
const { match, messageSource, class: className } = defineProps<FieldErrorDeclaredProps>();
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
  <FieldPrimitive.FieldError
    :ref="setElement"
    :class="fieldError({ class: className })"
    :match="match"
    :message-source="messageSource"
    v-bind="$attrs"
    data-slot="field-error"
  >
    <slot />
  </FieldPrimitive.FieldError>
</template>
