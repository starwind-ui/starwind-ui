<script setup lang="ts">
import * as FormPrimitive from "@starwind-ui/vue/form";
import type { ClassValue, VariantProps } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { formErrorSummary } from "./variants";

defineOptions({ inheritAttrs: false });

export type FormErrorSummaryProps = Omit<HTMLAttributes, "class"> &
  VariantProps<typeof formErrorSummary> & {
    class?: ClassValue;
  };
type FormErrorSummaryDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ FormErrorSummaryProps;
const { class: className } = defineProps<FormErrorSummaryDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <FormPrimitive.FormErrorSummary
    :class="formErrorSummary({ class: className })"
    v-bind="$attrs"
    data-slot="form-error-summary"
  >
    <slot />
  </FormPrimitive.FormErrorSummary>
</template>
