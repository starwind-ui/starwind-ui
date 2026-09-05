<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { useAttrs } from "vue";
import { Button } from "../button";

defineOptions({ inheritAttrs: false });

export type PaginationLinkProps = Omit<
  InstanceType<typeof Button>["$props"],
  "variant" | "as" | "ref"
> & {
  isActive?: boolean;
  class?: ClassValue;
};
type PaginationLinkDeclaredProps = {
  isActive?: boolean;
  class?: ClassValue;
  size?: unknown;
  dataSlot?: unknown;
} & /* @vue-ignore */ Omit<PaginationLinkProps, "data-slot">;
const {
  isActive,
  size = "icon",
  dataSlot = "pagination-link",
  class: className,
} = defineProps<PaginationLinkDeclaredProps>();
defineSlots<{
  default?: () => unknown;
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
  <Button
    :aria-current="isActive ? 'page' : undefined"
    :variant="isActive ? 'outline' : 'ghost'"
    :size="size"
    :class="className"
    v-bind="
      omitForwardedAttrs(attrs, [
        'aria-current',
        'variant',
        'size',
        'class',
        'as',
        'data-slot',
      ]) as Omit<
        InstanceType<typeof Button>['$props'],
        'aria-current' | 'variant' | 'size' | 'class' | 'as' | 'data-slot'
      >
    "
    as="a"
    :data-slot="dataSlot"
  >
    <slot />
  </Button>
</template>
