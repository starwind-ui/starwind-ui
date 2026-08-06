<script setup lang="ts">
import ContextMenu from "#candidate/context-menu/ContextMenu.vue";

function handleOpenChange(_open: boolean, detail: string): void {
  void detail;
}
</script>

<template>
  <ContextMenu @open-change="handleOpenChange" />
</template>
