<script setup lang="ts">
import StyledField from "@conformance/styled-vue/field/Field.vue";
import { Field } from "@starwind-ui/vue/field";
import { ref } from "vue";
import FieldControl from "./parts/FieldControl.vue";

const tick = ref(0);
const kinds = ["ps", "pc", "ss", "sc"] as const;
const cases = [
  { name: "def", defaultValue: "a" },
  { name: "pick" },
  { name: "kid", defaultValue: "a", child: true },
  { name: "own", defaultValue: "a", own: "own" },
];
const forms = kinds.flatMap((kind) =>
  cases.map((entry) => ({ ...entry, kind, id: `${kind}-${entry.name}` })),
);
</script>

<template>
  <main>
    <button type="button" data-testid="ff-tick" @click="tick += 1">Render again</button>
    <form v-for="form in forms" :id="form.id" :key="form.id">
      <component :is="form.kind[0] === 'p' ? Field.Root : StyledField" name="fruit">
        <FieldControl
          :id="form.id"
          :kind="form.kind"
          :tick="tick"
          :child="form.child"
          :name="form.own"
          :default-value="form.defaultValue"
        />
      </component>
      <button type="submit" :data-testid="`${form.id}-submit`">Submit</button>
    </form>
  </main>
</template>
