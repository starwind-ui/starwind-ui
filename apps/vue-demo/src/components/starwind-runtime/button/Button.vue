<script setup lang="ts">
import * as ButtonPrimitive from "@starwind-ui/vue/button";
import type { ClassValue, VariantProps } from "tailwind-variants";
import {
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ComponentPublicInstance,
  nextTick,
  ref,
  useAttrs,
} from "vue";
import { button } from "./variants";

defineOptions({ inheritAttrs: false });

export type ButtonProps = Omit<
  ButtonHTMLAttributes,
  "as" | "class" | "data-slot" | "disabled" | "focusableWhenDisabled" | "href" | "tabindex"
> &
  Omit<
    AnchorHTMLAttributes,
    | "as"
    | "class"
    | "data-slot"
    | "disabled"
    | "focusableWhenDisabled"
    | "href"
    | "tabindex"
    | "type"
  > &
  VariantProps<typeof button> & {
    as?: "button" | "a";
    "data-slot"?: string;
    focusableWhenDisabled?: boolean;
    href?: string;
    disabled?: boolean;
    tabindex?: number;
    class?: ClassValue;
  };
type ButtonDeclaredProps = {
  as?: "button" | "a";
  "data-slot"?: string;
  focusableWhenDisabled?: boolean;
  href?: string;
  disabled?: boolean;
  tabindex?: number;
  class?: ClassValue;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
} & /* @vue-ignore */ ButtonProps;
const {
  variant,
  size,
  as: buttonAs,
  href,
  disabled = false,
  focusableWhenDisabled,
  "data-slot": dataSlot = "button",
  tabindex,
  class: className,
} = defineProps<ButtonDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const element = ref<HTMLButtonElement | HTMLAnchorElement | null>(null);
let pendingPrimitiveRef: ({ element?: HTMLButtonElement | null } & ComponentPublicInstance) | null =
  null;
defineExpose({ element });

function setElement(value: Element | ComponentPublicInstance | null): void {
  if (value instanceof HTMLButtonElement || value instanceof HTMLAnchorElement) {
    pendingPrimitiveRef = null;
    element.value = value;
    return;
  }
  const exposed = value as
    | ({ element?: HTMLButtonElement | null } & ComponentPublicInstance)
    | null;
  pendingPrimitiveRef = exposed;
  element.value = exposed?.element instanceof HTMLButtonElement ? exposed.element : null;
  if (!exposed || element.value) return;

  void nextTick(() => {
    if (pendingPrimitiveRef !== exposed) return;
    element.value = exposed.element instanceof HTMLButtonElement ? exposed.element : null;
  });
}
</script>

<template>
  <template v-if="buttonAs === 'a' || href !== undefined">
    <a
      :ref="setElement"
      :class="button({ variant, size, class: className })"
      :href="disabled ? undefined : href"
      :aria-disabled="disabled ? 'true' : undefined"
      :data-disabled="disabled ? '' : undefined"
      v-bind="attrs"
      :tabindex="disabled ? -1 : tabindex"
      :data-slot="dataSlot || 'button'"
    >
      <slot />
    </a>
  </template>
  <template v-else>
    <ButtonPrimitive.ButtonRoot
      :ref="setElement"
      :class="button({ variant, size, class: className })"
      :disabled="disabled"
      :focusable-when-disabled="focusableWhenDisabled"
      v-bind="attrs"
      :data-slot="dataSlot || 'button'"
    >
      <slot />
    </ButtonPrimitive.ButtonRoot>
  </template>
</template>
