<script setup lang="ts">
import { ref } from "vue";

import { CheckboxGroup } from "#styled/checkbox-group";

const value = ref("invalid");
</script>

<template>
  <CheckboxGroup v-model="value" />
</template>
