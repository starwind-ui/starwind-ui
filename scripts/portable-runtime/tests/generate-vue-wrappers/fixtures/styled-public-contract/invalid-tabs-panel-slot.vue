<script setup lang="ts">
import { TabsPanel } from "@starwind-ui/vue/tabs";
</script>

<template>
  <TabsPanel value="account" v-slot="{ active }">{{ active }}</TabsPanel>
</template>
