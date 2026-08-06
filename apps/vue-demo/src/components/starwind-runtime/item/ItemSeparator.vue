<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { useAttrs } from "vue";
import { Separator } from "../separator";
import { itemSeparator } from "./variants";

defineOptions({ inheritAttrs: false });

export type ItemSeparatorProps = InstanceType<typeof Separator>["$props"] & {
  class?: ClassValue;
};
type ItemSeparatorDeclaredProps = {
  class?: ClassValue;
  orientation?: unknown;
} & /* @vue-ignore */ ItemSeparatorProps;
const { orientation = "horizontal", class: className } = defineProps<ItemSeparatorDeclaredProps>();
defineSlots<{}>();
const attrs = useAttrs();
function omitForwardedAttrs(
  source: Readonly<Record<string, unknown>>,
  ownedNames: readonly string[],
): Record<string, unknown> {
  return Object.fromEntries(Object.entries(source).filter(([name]) => !ownedNames.includes(name)));
}
</script>

<template>
  <Separator
    :orientation="orientation"
    :class="itemSeparator({ class: className })"
    v-bind="
      omitForwardedAttrs(attrs, ['orientation', 'class', 'data-slot']) as Omit<
        InstanceType<typeof Separator>['$props'],
        'orientation' | 'class' | 'data-slot'
      >
    "
    data-slot="item-separator"
  />
</template>
