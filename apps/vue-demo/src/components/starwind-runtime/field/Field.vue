<script setup lang="ts">
import * as FieldPrimitive from "@starwind-ui/vue/field";
import type { ClassValue, VariantProps } from "tailwind-variants";
import { type ComponentPublicInstance, type HTMLAttributes, nextTick, ref } from "vue";
import { field } from "./variants";

defineOptions({ inheritAttrs: false });

export type FieldProps = Omit<
  HTMLAttributes,
  | "class"
  | "dirty"
  | "disabled"
  | "errorVisibility"
  | "invalid"
  | "name"
  | "revalidationTiming"
  | "touched"
  | "validationTiming"
> &
  VariantProps<typeof field> & {
    dirty?: boolean;
    disabled?: boolean;
    errorVisibility?: import("@starwind-ui/runtime/form").FormValidationTiming;
    invalid?: boolean;
    name?: string;
    revalidationTiming?: import("@starwind-ui/runtime/form").FormValidationTiming;
    touched?: boolean;
    validationTiming?: import("@starwind-ui/runtime/form").FormValidationTiming;
    class?: ClassValue;
  };
type FieldDeclaredProps = {
  dirty?: boolean;
  disabled?: boolean;
  errorVisibility?: import("@starwind-ui/runtime/form").FormValidationTiming;
  invalid?: boolean;
  name?: string;
  revalidationTiming?: import("@starwind-ui/runtime/form").FormValidationTiming;
  touched?: boolean;
  validationTiming?: import("@starwind-ui/runtime/form").FormValidationTiming;
  class?: ClassValue;
  orientation?: FieldProps["orientation"];
} & /* @vue-ignore */ FieldProps;
const {
  dirty,
  disabled = false,
  errorVisibility,
  invalid,
  name,
  orientation,
  revalidationTiming,
  touched,
  validationTiming,
  class: className,
} = defineProps<FieldDeclaredProps>();
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
  <FieldPrimitive.FieldRoot
    :ref="setElement"
    :class="field({ orientation, class: className })"
    :dirty="dirty"
    :disabled="disabled"
    :error-visibility="errorVisibility"
    :invalid="invalid"
    :name="name"
    :revalidation-timing="revalidationTiming"
    :touched="touched"
    :validation-timing="validationTiming"
    v-bind="$attrs"
    data-slot="field"
  >
    <slot />
  </FieldPrimitive.FieldRoot>
</template>
