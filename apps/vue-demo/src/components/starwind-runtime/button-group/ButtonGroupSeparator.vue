<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { useAttrs } from "vue";
import { Separator } from "../separator";
import { buttonGroupSeparator } from "./variants";

defineOptions({ inheritAttrs: false });

export type ButtonGroupSeparatorProps = InstanceType<typeof Separator>["$props"] & {
  class?: ClassValue;
};
type ButtonGroupSeparatorDeclaredProps = {
  class?: ClassValue;
  orientation?: unknown;
} & /* @vue-ignore */ ButtonGroupSeparatorProps;
const { orientation = "vertical", class: className } =
  defineProps<ButtonGroupSeparatorDeclaredProps>();
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
    :class="buttonGroupSeparator({ class: className })"
    v-bind="
      omitForwardedAttrs(attrs, ['orientation', 'class', 'data-slot']) as Omit<
        InstanceType<typeof Separator>['$props'],
        'orientation' | 'class' | 'data-slot'
      >
    "
    data-slot="button-group-separator"
  />
</template>
