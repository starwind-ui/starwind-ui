import { renderSlider } from "../../shared-recipes/structured/range/frame.js";
import { projectVueAttributeAccess } from "./public-contract.js";

const VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS = projectVueAttributeAccess([]);

import type {
  AdapterRangeControlComponentProjection,
  AdapterRangeControlFacts,
  AdapterRangeControlIndexProjection,
} from "../types.js";

export function printVueRangeControlComponent(
  family: AdapterRangeControlComponentProjection,
): string {
  if (family.part === "root") return printRoot(family.facts);
  if (family.part === "thumb") return printThumb(family.facts);
  return printSimplePart(family.facts, family.part);
}

export function printVueRangeControlIndex(family: AdapterRangeControlIndexProjection): string {
  const facts = family.facts;
  const imports = facts.index.importMembers
    .map((member) => `import ${member.name} from "${member.from}.vue";`)
    .join("\n");
  const namespaceEntries = facts.index.namespaceMembers
    .map((member) => `  ${member.key}: ${member.name},`)
    .join("\n");
  const exports = [
    facts.exports.namespace,
    ...facts.index.importMembers.map((member) => member.name),
  ]
    .map((name) => `  ${name},`)
    .join("\n");

  return `${imports}\n\nconst ${facts.exports.namespace} = {\n${namespaceEntries}\n};\n\nexport {\n${exports}\n};\n\nexport default ${facts.exports.namespace};\n\nexport type { ${facts.index.typeExports.join(", ")} } from "${facts.runtime.typeImportSource}";\n`;
}

function printRoot(facts: AdapterRangeControlFacts): string {
  return renderSlider("vue", facts);
}

function printSimplePart(
  facts: AdapterRangeControlFacts,
  partName: Exclude<AdapterRangeControlComponentProjection["part"], "root" | "thumb">,
): string {
  const part = facts.parts[partName];
  const exportName = facts.exports[partName];
  const elementType = part.defaultElement === "span" ? "HTMLSpanElement" : "HTMLDivElement";

  return `<script setup lang="ts">
import { ref } from "vue";

defineOptions({ inheritAttrs: false });
const element = ref<${elementType} | null>(null);

defineExpose({ element });
</script>

<template>
  <${part.defaultElement} ref="element" ${facts.attrs[partName]} v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}"><slot /></${part.defaultElement}>
</template>
`;
}

function printThumb(facts: AdapterRangeControlFacts): string {
  const props = facts.props;
  const part = facts.parts.thumb;

  return `<script setup lang="ts">
import { ref } from "vue";

defineOptions({ inheritAttrs: false });

defineProps<{
  ${props.index.name}?: ${props.index.type};
}>();
const element = ref<HTMLDivElement | null>(null);

defineExpose({ element });
</script>

<template>
  <${part.defaultElement}
    ref="element"
    ${facts.attrs.thumb}
    :${facts.attrs.index}="${props.index.name}"
    v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}"
  >
    <slot />
    <input
      ${facts.attrs.input}
      ${facts.attrs.inputAriaHidden}="${facts.thumbInput.hiddenRangeInput.ariaHiddenValue}"
      :style="{
        border: 0,
        clipPath: 'inset(50%)',
        height: '1px',
        margin: '-1px',
        overflow: 'hidden',
        position: 'absolute',
        whiteSpace: 'nowrap',
        width: '1px',
      }"
      :${facts.attrs.inputTabIndex === "tabIndex" ? "tabindex" : facts.attrs.inputTabIndex}="${facts.thumbInput.hiddenRangeInput.tabIndexValue}"
      ${facts.attrs.inputType}="${facts.thumbInput.hiddenRangeInput.typeValue}"
    />
  </${part.defaultElement}>
</template>
`;
}
