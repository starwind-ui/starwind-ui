<script setup lang="ts">
import { Dropzone } from "#styled/dropzone";
</script>

<template>
  <Dropzone :aria-invalid="{ invalid: true }" />
</template>
