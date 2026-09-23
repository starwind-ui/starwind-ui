import { renderAccordionRoot as renderSharedAccordionRoot } from "../../shared-recipes/structured/accordion-root.js";
import {
  accordionDisabled,
  accordionPartPolicy,
  partAttributes,
} from "../../shared-recipes/structured/part-policy.js";
import { projectVueAttributeAccess } from "./public-contract.js";

const VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS = projectVueAttributeAccess([]);

import type {
  AdapterRepeatedDisclosureComponentProjection,
  AdapterRepeatedDisclosureFacts,
  AdapterRepeatedDisclosureIndexProjection,
} from "../types.js";
import { projectVueDetailedEvent, projectVueModel } from "./public-contract.js";

export function printVueRepeatedDisclosureComponent(
  family: AdapterRepeatedDisclosureComponentProjection,
): string {
  switch (family.part) {
    case "root":
      return printRoot(family.facts);
    case "item":
      return printItem(family.facts);
    case "header":
      return printHeader(family.facts);
    case "trigger":
      return printTrigger(family.facts);
    case "panel":
      return printPanel(family.facts);
  }
}

export function printVueRepeatedDisclosureIndex(family: AdapterRepeatedDisclosureIndexProjection): {
  contents: string;
  path: string;
} {
  const { facts } = family;
  const imports = facts.index.importMembers
    .map(({ from, name }) => `import ${name} from "${from}.vue";`)
    .join("\n");
  const members = facts.index.namespaceMembers
    .map(({ key, name }) => `  ${key}: ${name},`)
    .join("\n");
  const exports = facts.index.importMembers.map(({ name }) => name).join(",\n  ");
  return {
    contents: `
${imports}

const ${facts.exports.namespace} = {
${members}
};

export {
  ${facts.exports.namespace},
  ${exports},
};

export default ${facts.exports.namespace};

export type { ${facts.index.typeExports.join(", ")} } from "${facts.runtime.typeImportSource}";
`,
    path: `${facts.exports.namespace.toLowerCase()}/index.ts`,
  };
}

export function printVueRepeatedDisclosureContext(facts: AdapterRepeatedDisclosureFacts): string {
  const context = getContextNames(facts);
  return `import { inject, type InjectionKey } from "vue";

export type ${context.type} = Readonly<{
  disabled: boolean;
}>;

export const ${context.key}: InjectionKey<${context.type}> = Symbol(
  "Starwind${facts.displayName}Item",
);

export function ${context.hook}(componentName: string): ${context.type} {
  const context = inject(${context.key});
  if (!context) {
    throw new Error(\`\${componentName} must be used within ${facts.exports.item}.\`);
  }
  return context;
}
`;
}

function printRoot(_facts: AdapterRepeatedDisclosureFacts): string {
  return renderSharedAccordionRoot("vue");
}

function printItem(facts: AdapterRepeatedDisclosureFacts): string {
  const part = facts.parts.item;
  const context = getContextNames(facts);
  return `<script setup lang="ts">
import { provide, ref } from "vue";
import { ${context.key}, type ${context.type} } from "./${context.file}";

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ value?: string; disabled?: boolean }>(), {
  value: undefined,
  disabled: false,
});
defineSlots<{ default?: () => unknown }>();
const element = ref<HTMLDivElement | null>(null);
const itemContext: ${context.type} = {
  get disabled() { return props.disabled; },
};
provide(${context.key}, itemContext);
defineExpose({ element });
</script>

<template>
  <${part.defaultElement}
    ref="element"
    v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}"
    ${facts.attrs.item}
    data-sw-part="${part.name}"
    ${partAttributes("vue", accordionPartPolicy(facts, "item"))}
  >
    <slot />
  </${part.defaultElement}>
</template>
`;
}

function printHeader(facts: AdapterRepeatedDisclosureFacts): string {
  const part = facts.parts.header;
  return `<script setup lang="ts">
import { ref } from "vue";
defineOptions({ inheritAttrs: false });
defineSlots<{ default?: () => unknown }>();
const element = ref<HTMLElement | null>(null);
defineExpose({ element });
</script>

<template>
  <${part.defaultElement} ref="element" v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}" ${facts.attrs.header} data-sw-part="${part.name}">
    <slot />
  </${part.defaultElement}>
</template>
`;
}

function printTrigger(facts: AdapterRepeatedDisclosureFacts): string {
  const part = facts.parts.trigger;
  const context = getContextNames(facts);
  return `<script setup lang="ts">
import { ref } from "vue";
import { ${context.hook} } from "./${context.file}";
defineOptions({ inheritAttrs: false });
defineSlots<{ default?: () => unknown }>();
const element = ref<HTMLButtonElement | null>(null);
const item = ${context.hook}("${facts.exports.trigger}");
const props = withDefaults(defineProps<{ disabled?: boolean }>(), { disabled: false });
defineExpose({ element });
</script>

<template>
  <${part.defaultElement}
    ref="element"
    v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}"
    ${partAttributes("vue", accordionPartPolicy(facts, "trigger"))}
    data-sw-part="${part.name}"
    :disabled='${accordionDisabled("item.disabled", "props.disabled", '$attrs["aria-disabled"]')}'
  >
    <slot />
  </${part.defaultElement}>
</template>
`;
}

function printPanel(facts: AdapterRepeatedDisclosureFacts): string {
  const part = facts.parts.panel;
  return `<script setup lang="ts">
import { ref } from "vue";
defineOptions({ inheritAttrs: false });
defineSlots<{ default?: () => unknown }>();
const element = ref<HTMLDivElement | null>(null);
defineExpose({ element });
</script>

<template>
  <${part.defaultElement}
    ref="element"
    v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}"
    ${partAttributes("vue", accordionPartPolicy(facts, "panel"))}
    data-sw-part="${part.name}"
    style="animation: ${accordionPartPolicy(facts, "panel").initialAnimation}"
  >
    <slot />
  </${part.defaultElement}>
</template>
`;
}

function getContextNames(facts: AdapterRepeatedDisclosureFacts) {
  const base = `${facts.displayName}ItemContext`;
  return {
    file: base,
    hook: `use${base}`,
    key: `${facts.displayName.charAt(0).toLowerCase()}${facts.displayName.slice(1)}ItemContextKey`,
    type: `${base}Value`,
  };
}
