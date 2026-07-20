<script setup lang="ts">
import type { SelectOpenChangeDetails, SelectValueChangeDetails } from "@starwind-ui/vue/select";
import {
  SelectGroup,
  SelectGroupLabel,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectLabel,
  SelectList,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectRoot,
  SelectScrollDownArrow,
  SelectScrollUpArrow,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@starwind-ui/vue/select";
import { ref } from "vue";

export type ReviewSelectItem = {
  disabled?: boolean;
  label: string;
  value: string;
};

const props = withDefaults(
  defineProps<{
    cancelOpen?: boolean;
    cancelValue?: boolean;
    defaultOpen?: boolean;
    defaultValue?: string | null;
    form?: string;
    items: readonly ReviewSelectItem[];
    modelValue?: string | null;
    name?: string;
    open?: boolean;
    portalContainer?: string | HTMLElement;
    portalDisabled?: boolean;
    testId: string;
  }>(),
  {
    cancelOpen: false,
    cancelValue: false,
    defaultOpen: false,
    defaultValue: undefined,
    form: undefined,
    modelValue: undefined,
    name: undefined,
    open: undefined,
    portalContainer: "#vue-review-overlays",
    portalDisabled: false,
  },
);
const emit = defineEmits<{
  "update:modelValue": [value: string | null];
  "update:open": [value: boolean];
}>();
const valueDetails = ref(0);
const openDetails = ref(0);
const canceledDetails = ref(0);
const latestAcceptedValue = ref(props.modelValue ?? props.defaultValue ?? null);
const latestAcceptedOpen = ref(props.open ?? props.defaultOpen);

function handleValueChange(value: string | null, detail: SelectValueChangeDetails): void {
  valueDetails.value += 1;
  if (props.cancelValue) {
    canceledDetails.value += 1;
    detail.cancel();
    return;
  }
  latestAcceptedValue.value = value;
}

function handleOpenChange(open: boolean, detail: SelectOpenChangeDetails): void {
  openDetails.value += 1;
  if (props.cancelOpen) {
    canceledDetails.value += 1;
    detail.cancel();
    return;
  }
  latestAcceptedOpen.value = open;
}

function handleValueUpdate(value: string | null): void {
  latestAcceptedValue.value = value;
  emit("update:modelValue", value);
}

function handleOpenUpdate(open: boolean): void {
  latestAcceptedOpen.value = open;
  emit("update:open", open);
}
</script>

<template>
  <div class="select-scenario" :data-testid="testId">
    <SelectRoot
      :model-value="modelValue"
      :open="open"
      :default-open="defaultOpen"
      :default-value="defaultValue"
      :form="form"
      :name="name"
      :data-testid="`${testId}-root`"
      @value-change="handleValueChange"
      @open-change="handleOpenChange"
      @update:model-value="handleValueUpdate"
      @update:open="handleOpenUpdate"
    >
      <SelectLabel>Fruit</SelectLabel>
      <SelectTrigger :data-testid="`${testId}-trigger`">
        <SelectValue placeholder="Pick fruit" />
        <SelectIcon aria-hidden="true">⌄</SelectIcon>
      </SelectTrigger>
      <SelectPortal
        :container="portalContainer"
        :disabled="portalDisabled"
        :data-testid="`${testId}-portal`"
      >
        <SelectPositioner :align-item-with-trigger="false">
          <SelectPopup :data-testid="`${testId}-popup`">
            <SelectScrollUpArrow>↑</SelectScrollUpArrow>
            <SelectList>
              <SelectGroup>
                <SelectGroupLabel>Available fruit</SelectGroupLabel>
                <SelectItem
                  v-for="item in items"
                  :key="item.value"
                  :value="item.value"
                  :disabled="item.disabled"
                  :data-testid="`${testId}-item-${item.value}`"
                >
                  <SelectItemText>{{ item.label }}</SelectItemText>
                  <SelectItemIndicator>✓</SelectItemIndicator>
                </SelectItem>
              </SelectGroup>
              <SelectSeparator />
            </SelectList>
            <SelectScrollDownArrow>↓</SelectScrollDownArrow>
          </SelectPopup>
        </SelectPositioner>
      </SelectPortal>
    </SelectRoot>
    <output :data-testid="`${testId}-state`">
      value={{ latestAcceptedValue ?? "none" }}, open={{ latestAcceptedOpen }}, value-details={{
        valueDetails
      }}, open-details={{ openDetails }}, canceled={{ canceledDetails }}
    </output>
  </div>
</template>
