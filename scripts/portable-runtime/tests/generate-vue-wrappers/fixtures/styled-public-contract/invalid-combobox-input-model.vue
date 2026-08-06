<script setup lang="ts">
import { ref } from "vue";

import Combobox from "#candidate/combobox/Combobox.vue";

const inputValue = ref(1);
</script>

<template>
  <Combobox v-model:input-value="inputValue" />
</template>
