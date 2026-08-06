<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type AnchorHTMLAttributes, ref, useAttrs } from "vue";
import { breadcrumbLink } from "./variants";

defineOptions({ inheritAttrs: false });

export type BreadcrumbLinkProps = Omit<AnchorHTMLAttributes, "asChild" | "class"> & {
  asChild?: boolean;
  class?: ClassValue;
};
type BreadcrumbLinkDeclaredProps = {
  asChild?: boolean;
  class?: ClassValue;
} & /* @vue-ignore */ BreadcrumbLinkProps;
const { asChild = false, class: className } = defineProps<BreadcrumbLinkDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const element = ref<HTMLAnchorElement | null>(null);
defineExpose({ element });
</script>

<template>
  <template v-if="asChild">
    <slot />
  </template>
  <template v-else>
    <a
      ref="element"
      data-sw-breadcrumb-link
      :class="breadcrumbLink({ class: className })"
      v-bind="attrs"
      data-slot="breadcrumb-link"
    >
      <slot />
    </a>
  </template>
</template>
