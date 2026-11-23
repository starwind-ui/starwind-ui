<script setup lang="ts">
import { TabsTab } from "@starwind-ui/vue/tabs";
</script>

<template>
  <TabsTab value="account" v-slot="{ active }">{{ active }}</TabsTab>
</template>
