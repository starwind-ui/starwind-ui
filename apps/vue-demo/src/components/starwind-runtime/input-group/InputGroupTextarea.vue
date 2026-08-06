<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { useAttrs } from "vue";
import { Textarea } from "../textarea";
import { inputGroupTextarea } from "./variants";

defineOptions({ inheritAttrs: false });

export type InputGroupTextareaProps = InstanceType<typeof Textarea>["$props"] & {
  class?: ClassValue;
};
type InputGroupTextareaDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ InputGroupTextareaProps;
const { class: className } = defineProps<InputGroupTextareaDeclaredProps>();
defineSlots<{}>();
const attrs = useAttrs();
</script>

<template>
  <Textarea
    :class="inputGroupTextarea({ class: className })"
    v-bind="attrs as Omit<InstanceType<typeof Textarea>['$props'], 'class' | 'style'>"
    data-slot="input-group-control"
  />
</template>
