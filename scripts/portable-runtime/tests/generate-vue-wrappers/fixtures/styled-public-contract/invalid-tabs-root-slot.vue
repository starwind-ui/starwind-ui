<script setup lang="ts">
import { TabsRoot } from "@starwind-ui/vue/tabs";
</script>

<template>
  <TabsRoot v-slot="{ orientation }">{{ orientation }}</TabsRoot>
</template>
