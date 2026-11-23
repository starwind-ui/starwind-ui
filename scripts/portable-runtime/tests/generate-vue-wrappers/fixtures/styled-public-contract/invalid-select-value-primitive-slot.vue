<script setup lang="ts">
import { SelectValue } from "@starwind-ui/vue/select";
</script>

<template>
  <SelectValue v-slot="{ value }">{{ value }}</SelectValue>
</template>
