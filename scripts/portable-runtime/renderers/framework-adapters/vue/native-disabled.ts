import { renderSimpleRoot } from "../../shared-recipes/simple/frame.js";
import { projectVueAttributeAccess } from "./public-contract.js";

const VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS = projectVueAttributeAccess([]);

import type {
  AdapterComponentFile,
  AdapterIndexFile,
  AdapterNativeDisabledFacts,
  AdapterNativeDisabledPart,
  AdapterPrintedFile,
} from "../types.js";
import { printVueFamilyIndex } from "./primitive/shared-fragments.js";

export function printVueNativeDisabledIndex(file: AdapterIndexFile): AdapterPrintedFile {
  return printVueFamilyIndex(file, "native-disabled");
}

export function printVueNativeDisabledComponent(file: AdapterComponentFile): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "native-disabled") {
    throw new TypeError(
      "Vue native-disabled projection requires a native-disabled component model.",
    );
  }

  const part = family.facts.parts.all.find((candidate) => candidate.name === family.part);
  if (!part) {
    throw new TypeError(
      `${family.facts.displayName} native-disabled facts are missing ${family.part} part.`,
    );
  }

  return part.name === family.facts.parts.root.name
    ? printRoot(file, family.facts)
    : printSlotPart(file, part);
}

function printRoot(
  file: AdapterComponentFile,
  facts: AdapterNativeDisabledFacts,
): AdapterPrintedFile {
  return { path: file.path + ".vue", contents: renderSimpleRoot("vue", "fieldset", facts) };
}

function printSlotPart(
  file: AdapterComponentFile,
  part: AdapterNativeDisabledPart,
): AdapterPrintedFile {
  return {
    contents: `<script setup lang="ts">
import { ref } from "vue";

defineOptions({ inheritAttrs: false });

defineSlots<{
  default?: () => unknown;
}>();
const rootRef = ref<${getElementType(part)} | null>(null);

defineExpose({
  element: rootRef,
});
</script>

<template>
  <${part.defaultElement}
    ref="rootRef"
    v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}"
    ${part.discoveryAttribute}${part.role ? `\n    role="${part.role}"` : ""}
  >
    <slot />
  </${part.defaultElement}>
</template>
`,
    path: `${file.path}.vue`,
  };
}

function getElementType(part: AdapterNativeDisabledPart): string {
  if (part.defaultElement === "fieldset") return "HTMLFieldSetElement";
  if (part.defaultElement === "div") return "HTMLDivElement";
  return "HTMLElement";
}
