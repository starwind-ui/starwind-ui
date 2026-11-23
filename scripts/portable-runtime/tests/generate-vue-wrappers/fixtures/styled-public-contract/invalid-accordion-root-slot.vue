<script setup lang="ts">
import { AccordionRoot } from "@starwind-ui/vue/accordion";
</script>

<template>
  <AccordionRoot v-slot="{ value }">{{ value }}</AccordionRoot>
</template>
