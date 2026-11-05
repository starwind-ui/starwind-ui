<script setup lang="ts">
import { Combobox } from "@starwind-ui/vue/combobox";

defineProps<{ id: string }>();
</script>

<template>
  <Combobox.InputGroup>
    <Combobox.Input :data-testid="`${id}-input`" />
    <Combobox.Trigger :data-testid="`${id}-trigger`">Open</Combobox.Trigger>
    <Combobox.Clear :data-testid="`${id}-clear`">Clear</Combobox.Clear>
  </Combobox.InputGroup>
  <Combobox.Positioner>
    <Combobox.Popup :data-testid="`${id}-popup`">
      <Combobox.List>
        <Combobox.Item value="a" :data-testid="`${id}-item-a`">
          <Combobox.ItemText>Apple</Combobox.ItemText>
        </Combobox.Item>
        <Combobox.Item value="b" :data-testid="`${id}-item-b`">
          <Combobox.ItemText>Banana</Combobox.ItemText>
        </Combobox.Item>
      </Combobox.List>
    </Combobox.Popup>
  </Combobox.Positioner>
</template>
