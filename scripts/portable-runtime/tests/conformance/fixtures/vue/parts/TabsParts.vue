<script setup lang="ts">
import { Tabs } from "@starwind-ui/vue/tabs";

defineProps<{ id: string }>();
</script>

<template>
  <Tabs.List>
    <Tabs.Tab value="one" :data-testid="`${id}-tab-one`">One</Tabs.Tab>
    <Tabs.Tab value="two" :data-testid="`${id}-tab-two`">Two</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="one" :data-testid="`${id}-panel-one`">Panel one</Tabs.Panel>
  <Tabs.Panel value="two" :data-testid="`${id}-panel-two`">Panel two</Tabs.Panel>
</template>
