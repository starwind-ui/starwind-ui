<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { useAttrs } from "vue";
import { Input } from "../input";
import { sidebarInput } from "./variants";

defineOptions({ inheritAttrs: false });

export type SidebarInputProps = InstanceType<typeof Input>["$props"] & {
  class?: ClassValue;
};
type SidebarInputDeclaredProps = {
  class?: ClassValue;
  size?: unknown;
} & /* @vue-ignore */ SidebarInputProps;
const { size = "md", class: className } = defineProps<SidebarInputDeclaredProps>();
defineSlots<{}>();
const attrs = useAttrs();
</script>

<template>
  <Input
    :size="size"
    :class="sidebarInput({ class: className })"
    data-sidebar="input"
    v-bind="attrs as Omit<InstanceType<typeof Input>['$props'], 'class' | 'style'>"
    data-slot="sidebar-input"
  />
</template>
