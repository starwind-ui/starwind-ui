<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { useAttrs } from "vue";
import { Input } from "../input";
import { inputGroupInput } from "./variants";

defineOptions({ inheritAttrs: false });

export type InputGroupInputProps = InstanceType<typeof Input>["$props"] & {
  class?: ClassValue;
};
type InputGroupInputDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ InputGroupInputProps;
const { class: className } = defineProps<InputGroupInputDeclaredProps>();
defineSlots<{}>();
const attrs = useAttrs();
</script>

<template>
  <Input
    :class="inputGroupInput({ class: className })"
    v-bind="attrs as Omit<InstanceType<typeof Input>['$props'], 'class' | 'style'>"
    data-slot="input-group-control"
  />
</template>
