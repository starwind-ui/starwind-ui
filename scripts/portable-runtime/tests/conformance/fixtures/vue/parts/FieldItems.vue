<script setup lang="ts">
import { ComboboxContent, ComboboxItem } from "@conformance/styled-vue/combobox";
import { SelectContent, SelectItem } from "@conformance/styled-vue/select";
import { Combobox } from "@starwind-ui/vue/combobox";
import { Select } from "@starwind-ui/vue/select";

defineProps<{ id: string; kind: "ps" | "pc" | "ss" | "sc" }>();
</script>

<template>
  <Select.Positioner v-if="kind === 'ps'">
    <Select.Popup>
      <Select.List>
        <Select.Item value="a"><Select.ItemText>Apple</Select.ItemText></Select.Item>
        <Select.Item value="b" :data-testid="`${id}-item-b`">
          <Select.ItemText>Banana</Select.ItemText>
        </Select.Item>
      </Select.List>
    </Select.Popup>
  </Select.Positioner>
  <Combobox.Positioner v-else-if="kind === 'pc'">
    <Combobox.Popup>
      <Combobox.List>
        <Combobox.Item value="a"><Combobox.ItemText>Apple</Combobox.ItemText></Combobox.Item>
        <Combobox.Item value="b" :data-testid="`${id}-item-b`">
          <Combobox.ItemText>Banana</Combobox.ItemText>
        </Combobox.Item>
      </Combobox.List>
    </Combobox.Popup>
  </Combobox.Positioner>
  <SelectContent v-else-if="kind === 'ss'">
    <SelectItem value="a">Apple</SelectItem>
    <SelectItem value="b" :data-testid="`${id}-item-b`">Banana</SelectItem>
  </SelectContent>
  <ComboboxContent v-else>
    <ComboboxItem value="a">Apple</ComboboxItem>
    <ComboboxItem value="b" :data-testid="`${id}-item-b`">Banana</ComboboxItem>
  </ComboboxContent>
</template>
