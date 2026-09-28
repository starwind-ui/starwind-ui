<script setup lang="ts">
import * as FormPrimitive from "@starwind-ui/vue/form";
import type { ClassValue, VariantProps } from "tailwind-variants";
import { type FormHTMLAttributes } from "vue";
import { form } from "./variants";

defineOptions({ inheritAttrs: false });

export type FormProps = Omit<
  FormHTMLAttributes,
  | "class"
  | "errorOptions"
  | "errorVisibility"
  | "errors"
  | "options"
  | "revalidationTiming"
  | "validationTiming"
> &
  VariantProps<typeof form> & {
    options?: import("@starwind-ui/runtime/form").FormOptions;
    errors?: import("@starwind-ui/runtime/form").FormExternalErrors;
    errorOptions?: import("@starwind-ui/runtime/form").FormExternalErrorOptions;
    errorVisibility?: import("@starwind-ui/runtime/form").FormValidationTiming;
    revalidationTiming?: import("@starwind-ui/runtime/form").FormValidationTiming;
    validationTiming?: import("@starwind-ui/runtime/form").FormValidationTiming;
    class?: ClassValue;
  };
type FormDeclaredProps = {
  options?: import("@starwind-ui/runtime/form").FormOptions;
  errors?: import("@starwind-ui/runtime/form").FormExternalErrors;
  errorOptions?: import("@starwind-ui/runtime/form").FormExternalErrorOptions;
  errorVisibility?: import("@starwind-ui/runtime/form").FormValidationTiming;
  revalidationTiming?: import("@starwind-ui/runtime/form").FormValidationTiming;
  validationTiming?: import("@starwind-ui/runtime/form").FormValidationTiming;
  class?: ClassValue;
} & /* @vue-ignore */ FormProps;
const {
  options,
  errors,
  errorOptions,
  errorVisibility,
  revalidationTiming,
  validationTiming,
  class: className,
} = defineProps<FormDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <FormPrimitive.FormRoot
    :options="options"
    :errors="errors"
    :error-options="errorOptions"
    :class="form({ class: className })"
    :error-visibility="errorVisibility"
    :revalidation-timing="revalidationTiming"
    :validation-timing="validationTiming"
    v-bind="$attrs"
    data-slot="form"
  >
    <slot />
  </FormPrimitive.FormRoot>
</template>
