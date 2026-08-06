<script setup lang="ts">
import type { ClassValue, VariantProps } from "tailwind-variants";
import { ref, type TextareaHTMLAttributes, useAttrs } from "vue";
import { textarea } from "./variants";

defineOptions({ inheritAttrs: false });

export type TextareaProps = Omit<TextareaHTMLAttributes, "children" | "class" | "data-slot"> &
  VariantProps<typeof textarea> & {
    "data-slot"?: string;
    class?: ClassValue;
  };
type TextareaDeclaredProps = {
  dataSlot?: string;
  class?: ClassValue;
  size?: TextareaProps["size"];
} & /* @vue-ignore */ Omit<TextareaProps, "data-slot">;
const { size, dataSlot = "textarea", class: className } = defineProps<TextareaDeclaredProps>();
defineSlots<{}>();
const attrs = useAttrs();
const element = ref<HTMLTextAreaElement | null>(null);
defineExpose({ element });
</script>

<template>
  <textarea
    ref="element"
    data-sw-textarea
    :class="textarea({ size, class: className })"
    :data-slot="dataSlot"
    v-bind="attrs"
  />
</template>
