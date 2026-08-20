<script setup lang="ts">
import * as FieldsetPrimitive from "@starwind-ui/vue/fieldset";
import type { ClassValue, VariantProps } from "tailwind-variants";
import { type ComponentPublicInstance, type HTMLAttributes, nextTick, ref } from "vue";
import { fieldSet } from "./variants";

defineOptions({ inheritAttrs: false });

export type FieldSetProps = Omit<HTMLAttributes, "class" | "disabled"> &
  VariantProps<typeof fieldSet> & {
    disabled?: boolean;
    class?: ClassValue;
  };
type FieldSetDeclaredProps = {
  disabled?: boolean;
  class?: ClassValue;
} & /* @vue-ignore */ FieldSetProps;
const { disabled = false, class: className } = defineProps<FieldSetDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const element = ref<HTMLFieldSetElement | null>(null);
let pendingPrimitiveRef:
  | ({ element?: HTMLFieldSetElement | null } & ComponentPublicInstance)
  | null = null;
defineExpose({ element });

function setElement(value: Element | ComponentPublicInstance | null): void {
  if (value instanceof HTMLFieldSetElement) {
    pendingPrimitiveRef = null;
    element.value = value;
    return;
  }
  const exposed = value as
    | ({ element?: HTMLFieldSetElement | null } & ComponentPublicInstance)
    | null;
  pendingPrimitiveRef = exposed;
  element.value = exposed?.element instanceof HTMLFieldSetElement ? exposed.element : null;
  if (!exposed || element.value) return;

  void nextTick(() => {
    if (pendingPrimitiveRef !== exposed) return;
    element.value = exposed.element instanceof HTMLFieldSetElement ? exposed.element : null;
  });
}
</script>

<template>
  <FieldsetPrimitive.FieldsetRoot
    :ref="setElement"
    :class="fieldSet({ class: className })"
    :disabled="disabled"
    v-bind="$attrs"
    data-slot="field-set"
  >
    <slot />
  </FieldsetPrimitive.FieldsetRoot>
</template>
