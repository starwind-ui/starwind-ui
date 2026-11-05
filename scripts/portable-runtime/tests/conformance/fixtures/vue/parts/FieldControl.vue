<script setup lang="ts">
import {
  Combobox as StyledCombobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxTrigger,
} from "@conformance/styled-vue/combobox";
import {
  Select as StyledSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@conformance/styled-vue/select";
import { Combobox } from "@starwind-ui/vue/combobox";
import { Select } from "@starwind-ui/vue/select";
import FieldItems from "./FieldItems.vue";

defineProps<{
  id: string;
  kind: "ps" | "pc" | "ss" | "sc";
  tick: number;
  child?: boolean;
  name?: string;
  defaultValue?: string;
}>();
</script>

<template>
  <Select.Root v-if="kind === 'ps'" :data-tick="tick" :name="name" :default-value="defaultValue">
    <Select.Trigger :data-testid="`${id}-trigger`"><Select.Value /></Select.Trigger>
    <FieldItems v-if="child" :id="id" :kind="kind" />
    <Select.Positioner v-else>
      <Select.Popup>
        <Select.List>
          <Select.Item value="a"><Select.ItemText>Apple</Select.ItemText></Select.Item>
          <Select.Item value="b" :data-testid="`${id}-item-b`">
            <Select.ItemText>Banana</Select.ItemText>
          </Select.Item>
        </Select.List>
      </Select.Popup>
    </Select.Positioner>
  </Select.Root>

  <Combobox.Root
    v-else-if="kind === 'pc'"
    :data-tick="tick"
    :name="name"
    :default-value="defaultValue"
  >
    <Combobox.InputGroup>
      <Combobox.Input />
      <Combobox.Trigger :data-testid="`${id}-trigger`">Open</Combobox.Trigger>
    </Combobox.InputGroup>
    <FieldItems v-if="child" :id="id" :kind="kind" />
    <Combobox.Positioner v-else>
      <Combobox.Popup>
        <Combobox.List>
          <Combobox.Item value="a"><Combobox.ItemText>Apple</Combobox.ItemText></Combobox.Item>
          <Combobox.Item value="b" :data-testid="`${id}-item-b`">
            <Combobox.ItemText>Banana</Combobox.ItemText>
          </Combobox.Item>
        </Combobox.List>
      </Combobox.Popup>
    </Combobox.Positioner>
  </Combobox.Root>

  <StyledSelect
    v-else-if="kind === 'ss'"
    :data-tick="tick"
    :name="name"
    :default-value="defaultValue"
  >
    <SelectTrigger :data-testid="`${id}-trigger`"><SelectValue /></SelectTrigger>
    <FieldItems v-if="child" :id="id" :kind="kind" />
    <SelectContent v-else>
      <SelectItem value="a">Apple</SelectItem>
      <SelectItem value="b" :data-testid="`${id}-item-b`">Banana</SelectItem>
    </SelectContent>
  </StyledSelect>

  <StyledCombobox v-else :data-tick="tick" :name="name" :default-value="defaultValue">
    <ComboboxInputGroup>
      <ComboboxInput :show-trigger="false" />
      <ComboboxTrigger :data-testid="`${id}-trigger`" />
    </ComboboxInputGroup>
    <FieldItems v-if="child" :id="id" :kind="kind" />
    <ComboboxContent v-else>
      <ComboboxItem value="a">Apple</ComboboxItem>
      <ComboboxItem value="b" :data-testid="`${id}-item-b`">Banana</ComboboxItem>
    </ComboboxContent>
  </StyledCombobox>
</template>
