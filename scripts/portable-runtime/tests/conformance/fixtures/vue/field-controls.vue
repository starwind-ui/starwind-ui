<script setup lang="ts">
import StyledField from "@conformance/styled-vue/field/Field.vue";
import { Field } from "@starwind-ui/vue/field";
import FieldHeldControl from "./parts/FieldHeldControl.vue";

const kinds = ["sel", "cmb", "chk", "swi", "sld", "rad", "inp"] as const;
const forms = (["p", "s"] as const).flatMap((style) =>
  kinds.flatMap((kind) =>
    [false, true].map((held) => ({
      style,
      kind,
      held,
      id: `${style}${kind}-${held ? "h" : "u"}`,
    })),
  ),
);
</script>

<template>
  <main>
    <form id="pcmb-n">
      <FieldHeldControl id="pcmb-n" kind="cmb" :styled="false" :held="true" />
    </form>
    <form v-for="form in forms" :id="form.id" :key="form.id">
      <component :is="form.style === 'p' ? Field.Root : StyledField" name="f">
        <FieldHeldControl
          :id="form.id"
          :kind="form.kind"
          :styled="form.style === 's'"
          :held="form.held"
        />
      </component>
      <button type="submit" :data-testid="`${form.id}-submit`">Submit</button>
    </form>
  </main>
</template>
