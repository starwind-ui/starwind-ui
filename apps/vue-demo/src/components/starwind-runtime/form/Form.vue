<script setup lang="ts">
import * as FormPrimitive from "@starwind-ui/vue/form";
import type { ClassValue, VariantProps } from "tailwind-variants";
import { type FormHTMLAttributes, useAttrs } from "vue";
import { form } from "./variants";

defineOptions({ inheritAttrs: false });

export type FormProps = Omit<
  FormHTMLAttributes,
  "class" | "errorVisibility" | "revalidationTiming" | "validationTiming"
> &
  VariantProps<typeof form> & {
    errorVisibility?: import("@starwind-ui/runtime/form").FormValidationTiming;
    revalidationTiming?: import("@starwind-ui/runtime/form").FormValidationTiming;
    validationTiming?: import("@starwind-ui/runtime/form").FormValidationTiming;
    class?: ClassValue;
  };
type FormDeclaredProps = {
  errorVisibility?: import("@starwind-ui/runtime/form").FormValidationTiming;
  revalidationTiming?: import("@starwind-ui/runtime/form").FormValidationTiming;
  validationTiming?: import("@starwind-ui/runtime/form").FormValidationTiming;
  class?: ClassValue;
} & /* @vue-ignore */ FormProps;
const {
  errorVisibility,
  revalidationTiming,
  validationTiming,
  class: className,
} = defineProps<FormDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <FormPrimitive.FormRoot
    :class="form({ class: className })"
    :error-visibility="errorVisibility"
    :revalidation-timing="revalidationTiming"
    :validation-timing="validationTiming"
    v-bind="attrs"
    data-slot="form"
  >
    <slot />
  </FormPrimitive.FormRoot>
</template>
