<script setup lang="ts">
import * as ColorPickerPrimitive from "@starwind-ui/vue/color-picker";
import type { ClassValue, VariantProps } from "tailwind-variants";
import {
  type ComponentPublicInstance,
  computed,
  type HTMLAttributes,
  nextTick,
  ref,
  useAttrs,
} from "vue";
import { Popover } from "../popover";
import ColorPickerContent from "./ColorPickerContent.vue";
import ColorPickerDefaultEditor from "./ColorPickerDefaultEditor.vue";
import ColorPickerTrigger from "./ColorPickerTrigger.vue";
import {
  colorPicker,
  colorPickerControl,
  colorPickerHiddenInput,
  colorPickerLabel,
} from "./variants";

defineOptions({ inheritAttrs: false });

export type ColorPickerProps = Omit<
  HTMLAttributes,
  | "align"
  | "alpha"
  | "avoidCollisions"
  | "class"
  | "clearable"
  | "closeDelay"
  | "closeOnEscape"
  | "closeOnOutsideInteract"
  | "defaultOpen"
  | "defaultValue"
  | "dir"
  | "disablePortal"
  | "disabled"
  | "form"
  | "format"
  | "formatControl"
  | "formats"
  | "inline"
  | "label"
  | "locale"
  | "modal"
  | "modelValue"
  | "name"
  | "onChange"
  | "open"
  | "openOnHover"
  | "portalContainer"
  | "readOnly"
  | "required"
  | "showEyeDropper"
  | "showValueText"
  | "side"
  | "sideOffset"
  | "swatches"
  | "value"
> &
  VariantProps<typeof colorPicker> & {
    defaultValue?: import("@starwind-ui/runtime/color-picker").ColorPickerValue;
    format?: import("@starwind-ui/runtime/color-picker").ColorPickerFormat;
    alpha?: boolean;
    clearable?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    name?: string;
    form?: string;
    required?: boolean;
    locale?: string;
    dir?: import("@starwind-ui/runtime/color-picker").ColorPickerDirection;
    inline?: boolean;
    label?: string;
    showEyeDropper?: boolean;
    showValueText?: boolean;
    formatControl?: "select" | "native" | "none";
    formats?: readonly import("@starwind-ui/runtime/color-picker").ColorPickerFormat[];
    swatches?: readonly (
      | import("@starwind-ui/runtime/color-picker").ColorPickerValue
      | {
          value: import("@starwind-ui/runtime/color-picker").ColorPickerValue;
          label: string;
          disabled?: boolean;
        }
    )[];
    defaultOpen?: boolean;
    open?: boolean;
    closeOnEscape?: boolean;
    closeOnOutsideInteract?: boolean;
    modal?: boolean;
    openOnHover?: boolean;
    closeDelay?: number;
    side?: "top" | "right" | "bottom" | "left";
    align?: "start" | "center" | "end";
    sideOffset?: number;
    avoidCollisions?: boolean;
    portalContainer?: string;
    disablePortal?: boolean;
    class?: ClassValue;
    modelValue?: import("@starwind-ui/vue/color-picker").ColorPickerValue;
  };
type ColorPickerDeclaredProps = {
  defaultValue?: import("@starwind-ui/runtime/color-picker").ColorPickerValue;
  format?: import("@starwind-ui/vue/color-picker").ColorPickerFormat;
  alpha?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  name?: string;
  form?: string;
  required?: boolean;
  locale?: string;
  dir?: import("@starwind-ui/runtime/color-picker").ColorPickerDirection;
  inline?: boolean;
  label?: string;
  showEyeDropper?: boolean;
  showValueText?: boolean;
  formatControl?: "select" | "native" | "none";
  formats?: readonly import("@starwind-ui/runtime/color-picker").ColorPickerFormat[];
  swatches?: readonly (
    | import("@starwind-ui/runtime/color-picker").ColorPickerValue
    | {
        value: import("@starwind-ui/runtime/color-picker").ColorPickerValue;
        label: string;
        disabled?: boolean;
      }
  )[];
  defaultOpen?: boolean;
  open?: boolean;
  closeOnEscape?: boolean;
  closeOnOutsideInteract?: boolean;
  modal?: boolean;
  openOnHover?: boolean;
  closeDelay?: number;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  avoidCollisions?: boolean;
  portalContainer?: string;
  disablePortal?: boolean;
  class?: ClassValue;
  modelValue?: import("@starwind-ui/vue/color-picker").ColorPickerValue;
  size?: ColorPickerProps["size"];
} & /* @vue-ignore */ ColorPickerProps;
const {
  defaultValue = "#000000",
  format,
  alpha = true,
  clearable = false,
  disabled = false,
  readOnly = false,
  name,
  form,
  required = false,
  locale,
  dir,
  inline = false,
  label,
  showEyeDropper = true,
  showValueText = true,
  formatControl = "select",
  formats = ["hex", "rgb", "hsl", "hsb"],
  swatches = [],
  defaultOpen = false,
  open = undefined,
  closeOnEscape = true,
  closeOnOutsideInteract = true,
  modal = false,
  openOnHover = false,
  closeDelay = 200,
  side = "bottom",
  align = "start",
  sideOffset = 4,
  avoidCollisions = true,
  portalContainer,
  disablePortal = false,
  class: className,
  size = "md",
  modelValue,
} = defineProps<ColorPickerDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const emit = defineEmits<{
  valueChange: [
    value: import("@starwind-ui/vue/color-picker").ColorPickerColor | null,
    detail: import("@starwind-ui/vue/color-picker").ColorPickerValueChangeDetails,
  ];
  valueCommitted: [
    value: import("@starwind-ui/vue/color-picker").ColorPickerColor | null,
    detail: import("@starwind-ui/vue/color-picker").ColorPickerValueCommitDetails,
  ];
  formatChange: [
    format: import("@starwind-ui/vue/color-picker").ColorPickerFormat,
    detail: import("@starwind-ui/vue/color-picker").ColorPickerFormatChangeDetails,
  ];
  openChange: [open: boolean, detail: import("@starwind-ui/vue/popover").PopoverOpenChangeDetails];
  closeComplete: [detail: import("@starwind-ui/vue/popover").PopoverCloseCompleteDetails];
  "update:modelValue": [value: import("@starwind-ui/vue/color-picker").ColorPickerValue];
  "update:format": [value: import("@starwind-ui/vue/color-picker").ColorPickerFormat];
  "update:open": [value: boolean];
}>();
const resolvedFormat = computed(() => format ?? formats[0] ?? "hex");
const requestedFormats = computed(() => Array.from(new Set(formats)));
const normalizedFormats = computed(() =>
  requestedFormats.value.includes(resolvedFormat.value)
    ? requestedFormats.value
    : [resolvedFormat.value, ...requestedFormats.value],
);
function handleValueChange(
  value: import("@starwind-ui/vue/color-picker").ColorPickerColor | null,
  detail: import("@starwind-ui/vue/color-picker").ColorPickerValueChangeDetails,
): void {
  emit("valueChange", value, detail);
}

function handleValueCommitted(
  value: import("@starwind-ui/vue/color-picker").ColorPickerColor | null,
  detail: import("@starwind-ui/vue/color-picker").ColorPickerValueCommitDetails,
): void {
  emit("valueCommitted", value, detail);
}

function handleFormatChange(
  format: import("@starwind-ui/vue/color-picker").ColorPickerFormat,
  detail: import("@starwind-ui/vue/color-picker").ColorPickerFormatChangeDetails,
): void {
  emit("formatChange", format, detail);
}

function handleOpenChange(
  open: boolean,
  detail: import("@starwind-ui/vue/popover").PopoverOpenChangeDetails,
): void {
  emit("openChange", open, detail);
}

function handleCloseComplete(
  detail: import("@starwind-ui/vue/popover").PopoverCloseCompleteDetails,
): void {
  emit("closeComplete", detail);
}
const element = ref<HTMLDivElement | null>(null);
let pendingPrimitiveRef: ({ element?: HTMLDivElement | null } & ComponentPublicInstance) | null =
  null;
defineExpose({ element });

function setElement(value: Element | ComponentPublicInstance | null): void {
  if (value instanceof HTMLDivElement) {
    pendingPrimitiveRef = null;
    element.value = value;
    return;
  }
  const exposed = value as ({ element?: HTMLDivElement | null } & ComponentPublicInstance) | null;
  pendingPrimitiveRef = exposed;
  element.value = exposed?.element instanceof HTMLDivElement ? exposed.element : null;
  if (!exposed || element.value) return;

  void nextTick(() => {
    if (pendingPrimitiveRef !== exposed) return;
    element.value = exposed.element instanceof HTMLDivElement ? exposed.element : null;
  });
}
</script>

<template>
  <template v-if="inline">
    <ColorPickerPrimitive.ColorPickerRoot
      :ref="setElement"
      :class="colorPicker({ size, class: className })"
      :model-value="modelValue"
      :default-value="defaultValue"
      :format="format"
      :alpha="alpha"
      :allow-empty="clearable"
      :disabled="disabled"
      :read-only="readOnly"
      :name="name"
      :form="form"
      :required="required"
      :locale="locale"
      :dir="dir"
      v-bind="attrs"
      :data-size="size"
      data-slot="color-picker"
      @update:model-value="emit('update:modelValue', $event)"
      @update:format="emit('update:format', $event)"
      @value-change="handleValueChange"
      @value-committed="handleValueCommitted"
      @format-change="handleFormatChange"
    >
      <slot>
        <template v-if="label != null">
          <ColorPickerPrimitive.ColorPickerLabel
            :class="colorPickerLabel()"
            data-slot="color-picker-label"
          >
            {{ label }}
          </ColorPickerPrimitive.ColorPickerLabel>
        </template>
        <ColorPickerDefaultEditor
          :size="size"
          :format-control="formatControl"
          :formats="normalizedFormats"
          :show-eye-dropper="showEyeDropper"
          :swatches="swatches"
          :portal-container="portalContainer"
          :disable-portal="disablePortal"
        />
      </slot>
      <ColorPickerPrimitive.ColorPickerHiddenInput
        :class="colorPickerHiddenInput()"
        data-slot="color-picker-hidden-input"
      />
    </ColorPickerPrimitive.ColorPickerRoot>
  </template>
  <template v-else>
    <Popover
      :default-open="defaultOpen"
      :open="open"
      :close-on-escape="closeOnEscape"
      :close-on-outside-interact="closeOnOutsideInteract"
      :modal="modal"
      :open-on-hover="openOnHover"
      :close-delay="closeDelay"
      @update:open="emit('update:open', $event)"
      @open-change="handleOpenChange"
      @close-complete="handleCloseComplete"
    >
      <ColorPickerPrimitive.ColorPickerRoot
        :ref="setElement"
        :class="colorPicker({ size, class: className })"
        :model-value="modelValue"
        :default-value="defaultValue"
        :format="format"
        :alpha="alpha"
        :allow-empty="clearable"
        :disabled="disabled"
        :read-only="readOnly"
        :name="name"
        :form="form"
        :required="required"
        :locale="locale"
        :dir="dir"
        v-bind="attrs"
        :data-size="size"
        :data-floating-root="true"
        data-slot="color-picker"
        @update:model-value="emit('update:modelValue', $event)"
        @update:format="emit('update:format', $event)"
        @value-change="handleValueChange"
        @value-committed="handleValueCommitted"
        @format-change="handleFormatChange"
      >
        <slot>
          <template v-if="label != null">
            <ColorPickerPrimitive.ColorPickerLabel
              :class="colorPickerLabel()"
              data-slot="color-picker-label"
            >
              {{ label }}
            </ColorPickerPrimitive.ColorPickerLabel>
          </template>
          <ColorPickerPrimitive.ColorPickerControl
            :class="colorPickerControl()"
            data-slot="color-picker-control"
          >
            <ColorPickerTrigger
              :show-value-text="showValueText"
              :aria-label="label ? `Open ${label.toLowerCase()} picker` : 'Open color picker'"
            />
          </ColorPickerPrimitive.ColorPickerControl>
          <ColorPickerContent
            :size="size"
            :format-control="formatControl"
            :formats="normalizedFormats"
            :show-eye-dropper="showEyeDropper"
            :swatches="swatches"
            :side="side"
            :align="align"
            :side-offset="sideOffset"
            :avoid-collisions="avoidCollisions"
            :portal-container="portalContainer"
            :disable-portal="disablePortal"
            :aria-label="label ? `${label} editor` : 'Color editor'"
          />
        </slot>
        <ColorPickerPrimitive.ColorPickerHiddenInput
          :class="colorPickerHiddenInput()"
          data-slot="color-picker-hidden-input"
        />
      </ColorPickerPrimitive.ColorPickerRoot>
    </Popover>
  </template>
</template>
