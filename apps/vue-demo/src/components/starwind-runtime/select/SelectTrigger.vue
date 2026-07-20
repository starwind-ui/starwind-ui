<script setup lang="ts">
import * as SelectPrimitive from "@starwind-ui/vue/select";
import { useSelectContext } from "@starwind-ui/vue/select";
import type { ClassValue, VariantProps } from "tailwind-variants";
import {
  type ButtonHTMLAttributes,
  type ComponentPublicInstance,
  cloneVNode,
  computed,
  defineComponent,
  isVNode,
  mergeProps,
  ref,
  useAttrs,
  type VNode,
} from "vue";
import { selectTrigger, selectValue } from "./variants";

defineOptions({ inheritAttrs: false });

export type SelectTriggerProps = Omit<
  ButtonHTMLAttributes,
  "asChild" | "class" | "iconClass" | "placeholder" | "showIcon" | "valueClass"
> &
  VariantProps<typeof selectTrigger> & {
    asChild?: boolean;
    iconClass?: string;
    placeholder?: string;
    showIcon?: boolean;
    valueClass?: string;
    class?: ClassValue;
  };
type SelectTriggerDeclaredProps = {
  asChild?: boolean;
  iconClass?: string;
  placeholder?: string;
  showIcon?: boolean;
  valueClass?: string;
  class?: ClassValue;
  size?: SelectTriggerProps["size"];
} & /* @vue-ignore */ SelectTriggerProps;
const {
  asChild = false,
  class: className,
  iconClass: iconClassName,
  placeholder,
  showIcon = true,
  size = "md",
  valueClass: valueClassName,
} = defineProps<SelectTriggerDeclaredProps>();
const slots = defineSlots<{ default?: () => VNode[]; icon?: () => VNode[] }>();
const attrs = useAttrs();
const select = useSelectContext("StyledTrigger");
const element = ref<HTMLElement | null>(null);
const triggerClass = computed(() => selectTrigger({ size, class: className }));

defineExpose({ element });

function setElement(value: Element | ComponentPublicInstance | null): void {
  if (value instanceof HTMLElement) {
    element.value = value;
    return;
  }
  const exposed = (value as { element?: HTMLElement | null } | null)?.element;
  element.value = exposed instanceof HTMLElement ? exposed : null;
}

const AsChildTrigger = defineComponent({
  inheritAttrs: false,
  setup() {
    return () => {
      const children = slots.default?.() ?? [];
      const child = children[0];
      if (children.length !== 1 || !isVNode(child) || typeof child.type !== "string") {
        throw new TypeError("SelectTrigger asChild requires exactly one native element VNode.");
      }

      const defaultedProps =
        child.type === "button" && child.props?.type === undefined ? { type: "button" } : {};
      const consumerProps = mergeProps(attrs, { class: triggerClass.value });
      const protectedProps = {
        "aria-disabled": select.disabled.value ? "true" : undefined,
        "aria-expanded": select.open.value,
        "aria-haspopup": "listbox",
        "aria-readonly": select.readOnly.value,
        "aria-required": select.required.value,
        "data-disabled": select.disabled.value ? "" : undefined,
        "data-slot": "select-trigger",
        "data-state": select.open.value ? "open" : "closed",
        "data-sw-part": "trigger",
        "data-sw-select-trigger": "",
        disabled: child.type === "button" && select.disabled.value ? true : undefined,
        ref: setElement,
        role: "combobox",
      };
      return cloneVNode(child, mergeProps(defaultedProps, consumerProps, protectedProps), true);
    };
  },
});
</script>

<template>
  <AsChildTrigger v-if="asChild" />
  <SelectPrimitive.SelectTrigger
    v-else
    :ref="setElement"
    v-bind="attrs"
    :class="triggerClass"
    data-slot="select-trigger"
  >
    <slot>
      <SelectPrimitive.SelectValue
        :class="selectValue({ class: valueClassName })"
        :placeholder="placeholder"
        data-slot="select-value"
      />
    </slot>
    <SelectPrimitive.SelectIcon
      v-if="showIcon"
      :class="
        ['text-muted-foreground pointer-events-none size-4', iconClassName]
          .filter(Boolean)
          .join(' ')
      "
      data-slot="select-icon"
    >
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
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M6 9l6 6l6 -6" />
        </svg>
      </slot>
    </SelectPrimitive.SelectIcon>
  </SelectPrimitive.SelectTrigger>
</template>
