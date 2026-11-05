<script setup lang="ts">
import { Dialog } from "@starwind-ui/vue/dialog";

defineProps<{ id: string }>();
</script>

<template>
  <Dialog.Trigger :data-testid="`${id}-trigger`">Open</Dialog.Trigger>
  <Dialog.Popup :data-testid="`${id}-popup`">
    <Dialog.Title>Title</Dialog.Title>
    <Dialog.Close :data-testid="`${id}-close`">Close</Dialog.Close>
  </Dialog.Popup>
</template>
