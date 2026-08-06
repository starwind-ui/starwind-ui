<script setup lang="ts">
import * as ComboboxPrimitive from "@starwind-ui/vue/combobox";
import type { ClassValue } from "tailwind-variants";
import { type InputHTMLAttributes, useAttrs } from "vue";
import { InputGroup, InputGroupAddon, InputGroupButton } from "../input-group";
import { comboboxInput, comboboxInputGroup } from "./variants";

defineOptions({ inheritAttrs: false });

export type ComboboxInputProps = Omit<
  InputHTMLAttributes,
  "class" | "disabled" | "showClear" | "showTrigger"
> & {
  showClear?: boolean;
  showTrigger?: boolean;
  class?: ClassValue;
  disabled?: boolean;
};
type ComboboxInputDeclaredProps = {
  showClear?: boolean;
  showTrigger?: boolean;
  class?: ClassValue;
  disabled?: boolean;
};
const {
  class: className,
  disabled = false,
  showClear = false,
  showTrigger = true,
} = defineProps<ComboboxInputDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <InputGroup :class="comboboxInputGroup({ class: className })" data-sw-combobox-input-group="">
    <ComboboxPrimitive.ComboboxInput
      :class="comboboxInput()"
      v-bind="{ ...attrs, disabled: disabled }"
      data-slot="combobox-input"
    />
    <InputGroupAddon align="inline-end">
      <template v-if="showTrigger">
        <ComboboxPrimitive.ComboboxTrigger
          :as-child="true"
          v-bind="{ disabled: disabled }"
          data-slot="combobox-trigger"
        >
          <InputGroupButton
            size="icon-sm"
            variant="ghost"
            :disabled="disabled"
            class="group-has-data-[slot=combobox-clear]/input-group:hidden"
            data-slot="combobox-trigger"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              class="text-muted-foreground pointer-events-none size-4"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M6 9l6 6l6 -6" />
            </svg>
          </InputGroupButton>
        </ComboboxPrimitive.ComboboxTrigger>
      </template>
      <template v-if="showClear">
        <ComboboxPrimitive.ComboboxClear
          :as-child="true"
          v-bind="{ disabled: disabled, 'aria-label': 'Clear selection' }"
          data-slot="combobox-clear"
        >
          <InputGroupButton
            size="icon-sm"
            variant="ghost"
            :disabled="disabled"
            data-slot="combobox-clear"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              class="text-muted-foreground pointer-events-none size-4"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M18 6l-12 12" />
              <path d="M6 6l12 12" />
            </svg>
          </InputGroupButton>
        </ComboboxPrimitive.ComboboxClear>
      </template>
    </InputGroupAddon>
    <slot />
  </InputGroup>
</template>
