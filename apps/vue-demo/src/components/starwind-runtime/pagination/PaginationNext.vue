<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { useAttrs } from "vue";
import PaginationLink from "./PaginationLink.vue";
import { paginationNext } from "./variants";

defineOptions({ inheritAttrs: false });

export type PaginationNextProps = InstanceType<typeof PaginationLink>["$props"] & {
  class?: ClassValue;
};
type PaginationNextDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ PaginationNextProps;
const { class: className } = defineProps<PaginationNextDeclaredProps>();
defineSlots<{
  default?: () => unknown;
  icon?: () => unknown;
}>();
const attrs = useAttrs();
function omitForwardedAttrs(
  source: Readonly<Record<string, unknown>>,
  ownedNames: readonly string[],
): Record<string, unknown> {
  return Object.fromEntries(Object.entries(source).filter(([name]) => !ownedNames.includes(name)));
}
</script>

<template>
  <PaginationLink
    aria-label="Go to next page"
    :class="paginationNext({ class: className })"
    v-bind="
      omitForwardedAttrs(attrs, ['aria-label', 'class', 'data-slot']) as Omit<
        InstanceType<typeof PaginationLink>['$props'],
        'aria-label' | 'class' | 'data-slot'
      >
    "
    data-slot="pagination-next"
  >
    <slot />
    <slot name="icon">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        class="size-4 transition-transform group-hover:translate-x-1"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M9 6l6 6l-6 6" />
      </svg>
    </slot>
  </PaginationLink>
</template>
