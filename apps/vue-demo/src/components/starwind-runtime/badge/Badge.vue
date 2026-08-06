<script setup lang="ts">
import type { ClassValue, VariantProps } from "tailwind-variants";
import { type AnchorHTMLAttributes, computed, type HTMLAttributes, useAttrs } from "vue";
import { badge } from "./variants";

defineOptions({ inheritAttrs: false });

export type BadgeProps = Omit<HTMLAttributes, "class"> &
  Omit<AnchorHTMLAttributes, "class" | "type"> &
  Omit<VariantProps<typeof badge>, "isLink"> & {
    class?: ClassValue;
  };
type BadgeDeclaredProps = {
  class?: ClassValue;
  variant?: BadgeProps["variant"];
  tone?: BadgeProps["tone"];
  appearance?: BadgeProps["appearance"];
  eyebrow?: BadgeProps["eyebrow"];
  size?: BadgeProps["size"];
} & /* @vue-ignore */ BadgeProps;
const {
  variant,
  tone,
  appearance,
  eyebrow,
  size,
  class: className,
} = defineProps<BadgeDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const rest = computed(() => attrs);
const usesComposedBadgeStyle = computed(() => tone !== undefined || appearance !== undefined);
const resolvedVariant = computed(
  () => (usesComposedBadgeStyle.value ? null : variant) as typeof variant,
);
const resolvedTone = computed(() =>
  usesComposedBadgeStyle.value ? (tone ?? "neutral") : undefined,
);
const resolvedAppearance = computed(() =>
  usesComposedBadgeStyle.value ? (appearance ?? "soft") : undefined,
);
const Tag = computed(() => (attrs.href ? "a" : "div"));
</script>

<template>
  <component
    :is="Tag"
    data-sw-badge
    :class="
      badge({
        variant: resolvedVariant,
        tone: resolvedTone,
        appearance: resolvedAppearance,
        eyebrow,
        size,
        isLink: Boolean(rest.href),
        class: className,
      })
    "
    v-bind="attrs"
    data-slot="badge"
  >
    <slot />
  </component>
</template>
