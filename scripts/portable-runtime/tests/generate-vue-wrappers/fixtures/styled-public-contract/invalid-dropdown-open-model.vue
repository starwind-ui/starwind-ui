<script setup lang="ts">
import { ref } from "vue";

import Dropdown from "#candidate/dropdown/Dropdown.vue";

const open = ref("open");
</script>

<template>
  <Dropdown v-model:open="open" />
</template>
