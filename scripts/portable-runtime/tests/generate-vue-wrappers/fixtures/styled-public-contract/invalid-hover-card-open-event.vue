<script setup lang="ts">
import HoverCard from "#candidate/hover-card/HoverCard.vue";

function handleOpenChange(_open: boolean, detail: string): void {
  void detail;
}
</script>

<template>
  <HoverCard @open-change="handleOpenChange" />
</template>
