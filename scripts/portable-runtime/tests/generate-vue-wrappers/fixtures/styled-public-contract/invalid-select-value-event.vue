<script setup lang="ts">
import { Select } from "#styled/select";

function handleValueChange(value: number): void {
  void value;
}
</script>

<template>
  <Select @value-change="handleValueChange" />
</template>
