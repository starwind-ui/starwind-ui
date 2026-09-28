import type { CommandOperations } from "../../shared-recipes/simple/operations.js";
export const simpleRecipeOperations: CommandOperations = {
  initialValue: (name, expression) => `const ${name} = ${expression};`,
  owner: "owned",
  readInput: (prop) =>
    `props[${JSON.stringify((prop.attribute ?? prop.name).replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase()))}]`,
  fieldName: (prop) =>
    (prop.attribute ?? prop.name).replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase()),
  attribute: (name, expression) => `:${name}='${expression}'`,
  declareOwner: (factory) => `let owned: ReturnType<typeof ${factory}> | undefined;`,
  lifecycle({ recipe, declaration, dispose, create, condition, commands }) {
    return `${declaration}
    function dispose() { ${dispose} }
    function connect() { dispose(); const element = rootRef.value; if (!element${condition ? ` || !${condition}` : ""}) return; ${create} }
    onMounted(connect); onBeforeUnmount(dispose);
    ${condition ? `watch(() => ${condition}, connect, { flush: 'post' });` : ""}
    ${commands.map((c) => `watch([${c.reads.map((r) => `() => ${r}`).join(", ")}], () => { ${c.body} }, { flush: 'post' });`).join("\n")}`;
  },
  frame({ recipe, name, imports, fields, destructure, attrs, code }) {
    return `<script setup lang="ts">
import { ${imports} } from '@starwind-ui/runtime/${recipe.runtime}';
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ ${fields} }>(), { ${recipe.props
      .filter((p) => p.default !== undefined)
      .map((p) => `${JSON.stringify(p.attribute ?? p.name)}: ${p.default}`)
      .join(", ")} });
defineSlots<{default?: () => unknown}>();
const rootRef = ref<${recipe.element} | null>(null);
defineExpose({element:rootRef});
${code}
</script>
<template><${recipe.tag} v-bind="$attrs" ${attrs} ref="rootRef"><slot /></${recipe.tag}></template>`;
  },
};
