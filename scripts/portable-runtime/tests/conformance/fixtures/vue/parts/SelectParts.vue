<script setup lang="ts">
import { Select } from "@starwind-ui/vue/select";

defineProps<{ id: string }>();
</script>

<template>
  <Select.Trigger :data-testid="`${id}-trigger`">
    <Select.Value :data-testid="`${id}-value`" placeholder="Pick" />
  </Select.Trigger>
  <Select.Positioner>
    <Select.Popup :data-testid="`${id}-popup`">
      <Select.List>
        <Select.Item value="a" :data-testid="`${id}-item-a`">
          <Select.ItemText>Apple</Select.ItemText>
        </Select.Item>
        <Select.Item value="b" :data-testid="`${id}-item-b`">
          <Select.ItemText>Banana</Select.ItemText>
        </Select.Item>
      </Select.List>
    </Select.Popup>
  </Select.Positioner>
</template>
