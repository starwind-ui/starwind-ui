<script setup lang="ts">
import { Select } from "#styled/select";

function handleOpenChange(open: string): void {
  void open;
}
</script>

<template>
  <Select @open-change="handleOpenChange" />
</template>
