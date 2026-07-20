<script setup lang="ts">
import { initThemeController } from "@starwind-ui/vue/theme";
import type { ClassValue, VariantProps } from "tailwind-variants";
import { type ButtonHTMLAttributes, computed, onMounted, ref, useAttrs } from "vue";
import { themeToggle } from "./variants";

defineOptions({ inheritAttrs: false });

export type ThemeToggleProps = Omit<
  ButtonHTMLAttributes,
  | "aria-pressed"
  | "ariaLabel"
  | "class"
  | "data-slot"
  | "defaultPressed"
  | "disabled"
  | "onChange"
  | "pressed"
  | "syncGroup"
  | "type"
  | "value"
> &
  VariantProps<typeof themeToggle> & {
    ariaLabel?: string;
    defaultPressed?: boolean;
    disabled?: boolean;
    "data-slot"?: string;
    pressed?: boolean;
    syncGroup?: string;
    value?: string;
    class?: ClassValue;
  };
type ThemeToggleDeclaredProps = {
  ariaLabel?: string;
  defaultPressed?: boolean;
  disabled?: boolean;
  "data-slot"?: string;
  pressed?: boolean;
  syncGroup?: string;
  value?: string;
  class?: ClassValue;
  variant?: ThemeToggleProps["variant"];
  size?: ThemeToggleProps["size"];
} & /* @vue-ignore */ ThemeToggleProps;
const {
  ariaLabel = "Toggle theme",
  variant = "outline",
  size = "md",
  defaultPressed,
  disabled = false,
  pressed,
  syncGroup = "starwind-theme",
  value,
  "data-slot": dataSlot = "theme-toggle",
  class: className,
} = defineProps<ThemeToggleDeclaredProps>();
defineSlots<{
  default?: () => unknown;
  "dark-icon"?: () => unknown;
  "light-icon"?: () => unknown;
}>();
const attrs = useAttrs();
const initialPressed = computed(() => pressed ?? defaultPressed ?? false);
const element = ref<HTMLButtonElement | null>(null);
defineExpose({ element });

onMounted(() => {
  initThemeController();
});
</script>

<template>
  <button
    ref="element"
    :class="themeToggle({ variant, size, class: className })"
    :disabled="disabled"
    :aria-label="ariaLabel"
    :aria-pressed="initialPressed ? 'true' : 'false'"
    :data-state="initialPressed ? 'on' : 'off'"
    data-sw-toggle
    data-sw-theme-toggle
    data-sw-theme-control
    data-theme-on="dark"
    data-theme-off="light"
    :data-sync-group="syncGroup"
    :data-value="value"
    :data-pressed="initialPressed ? '' : undefined"
    :data-unpressed="initialPressed ? undefined : ''"
    :data-disabled="disabled ? '' : undefined"
    v-bind="attrs"
    type="button"
    :data-slot="dataSlot || 'theme-toggle'"
  >
    <slot>
      <span class="size-5" data-theme-icon-wrapper>
        <slot name="light-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="hidden size-5 group-data-[state=off]:data-ready:block"
            aria-hidden="true"
            data-theme-icon
          >
            <path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
            <path
              d="M4 12h.01M12 4v.01M20 12h.01M12 20v.01M6.31 6.31l-.01 -.01M17.7 6.3l-.01 .01M17.7 17.7l-.01 -.01M6.3 17.7l.01 -.01"
            />
          </svg>
        </slot>
        <slot name="dark-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="hidden size-5 group-data-[state=on]:data-ready:block"
            aria-hidden="true"
            data-theme-icon
          >
            <path
              d="M12 3c.132 0 .263 0 .393 .008a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z"
            />
          </svg>
        </slot>
      </span>
    </slot>
  </button>
</template>
