<script setup lang="ts">
import { Checkbox } from "#styled/checkbox";

function handleCheckedChange(value: string): void {
  void value;
}
</script>

<template>
  <Checkbox @checked-change="handleCheckedChange" />
</template>
