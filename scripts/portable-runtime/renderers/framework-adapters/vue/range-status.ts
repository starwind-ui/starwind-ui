import { renderSimpleRoot } from "../../shared-recipes/simple/frame.js";
import { progressPartPolicy } from "../../shared-recipes/simple/parts.js";
import { projectVueAttributeAccess } from "./public-contract.js";

const VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS = projectVueAttributeAccess([]);

import type {
  AdapterComponentFile,
  AdapterIndexFile,
  AdapterPrintedFile,
  AdapterRangeStatusFacts,
  AdapterRangeStatusPartName,
} from "../types.js";
import { printVueFamilyIndex } from "./primitive/shared-fragments.js";

export function printVueRangeStatusIndex(file: AdapterIndexFile): AdapterPrintedFile {
  return printVueFamilyIndex(file, "range-status");
}

export function printVueRangeStatusComponent(file: AdapterComponentFile): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "range-status") {
    throw new TypeError("Vue range-status projection requires a range-status component model.");
  }

  const contents =
    family.part === "root" ? printRoot(family.facts) : printPassivePart(family.facts, family.part);

  return { contents, path: `${file.path}.vue` };
}

function printRoot(facts: AdapterRangeStatusFacts): string {
  return renderSimpleRoot("vue", "progress", facts);
}

function printPassivePart(
  facts: AdapterRangeStatusFacts,
  partName: Exclude<AdapterRangeStatusPartName, "root">,
): string {
  const part = facts.parts[partName];
  const refName = `${partName}Ref`;
  const elementType = getElementType(part.defaultElement);
  const protectedAttributes =
    progressPartPolicy(facts, partName).childText === "runtime-unless-children"
      ? `
    :${facts.attrs.valuePreserveText}="slots.default ? '' : undefined"
    ${facts.attrs.valueAriaHidden.attribute}="${facts.attrs.valueAriaHidden.value}"`
      : partName === "label"
        ? `
    ${facts.attrs.labelRole.attribute}="${facts.attrs.labelRole.value}"`
        : "";

  return `<script setup lang="ts">
import { ref } from "vue";

defineOptions({ inheritAttrs: false });
const slots = defineSlots<{ default?: () => unknown }>();
const ${refName} = ref<${elementType} | null>(null);

defineExpose({ element: ${refName} });
</script>

<template>
  <${part.defaultElement}
    ref="${refName}"
    v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}"
    ${part.discoveryAttribute}${protectedAttributes}
  >
    <slot />
  </${part.defaultElement}>
</template>
`;
}

function getElementType(tagName: string): string {
  if (tagName === "div") return "HTMLDivElement";
  if (tagName === "span") return "HTMLSpanElement";
  return "HTMLElement";
}
