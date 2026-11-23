<script setup lang="ts">
import { SelectValue } from "#styled/select";
</script>

<template>
  <SelectValue v-slot="{ label }">{{ label }}</SelectValue>
</template>
