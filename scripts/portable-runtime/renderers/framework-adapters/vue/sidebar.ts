import { assertSidebarConnection } from "../../primitive-output-model/sidebar-connection.js";
import { renderSidebarProvider } from "../../shared-recipes/structured/sidebar/frame.js";
import { sidebarAttrs } from "../../shared-recipes/structured/sidebar/parts.js";
import { projectVueAttributeAccess } from "./public-contract.js";

const VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS = projectVueAttributeAccess([]);

import type {
  AdapterSidebarComponentProjection,
  AdapterSidebarFacts,
  AdapterSidebarIndexProjection,
} from "../types.js";

export function printVueSidebarContext(facts: AdapterSidebarFacts): string {
  return `import { type InjectionKey, inject, type Ref } from "vue";

export type ${facts.context.typeName} = Readonly<{
  expanded: Readonly<Ref<boolean>>;
  mobileOpen: Readonly<Ref<boolean>>;
  open: Readonly<Ref<boolean>>;
  state: Readonly<Ref<"collapsed" | "expanded">>;
}>;

const ${facts.context.name}: InjectionKey<${facts.context.typeName}> = Symbol("Starwind${facts.context.name}");

function ${facts.context.hook}(): ${facts.context.typeName} {
  const context = inject(${facts.context.name}, undefined);
  if (!context) throw new Error("${facts.displayName} parts must be used within ${facts.exports.provider}.");
  return context;
}

export { ${facts.context.name}, ${facts.context.hook} };
`;
}

export function printVueSidebarComponent(family: AdapterSidebarComponentProjection): string {
  assertSidebarConnection(family.facts);
  if (family.part === "provider") return printProvider(family.facts);
  if (family.part === "sidebar") return printSidebar(family.facts);
  if (family.part === "trigger") return printTrigger(family.facts);
  if (family.part === "rail") return printRail(family.facts);
  return printMenuButton(family.facts);
}

export function printVueSidebarIndex(family: AdapterSidebarIndexProjection): string {
  const facts = family.facts;
  const imports = [
    `import SidebarComponent from "./${facts.exports.sidebar}.vue";`,
    `import { ${facts.context.contextExports.join(", ")} } from "./${facts.context.name}.js";`,
    `import ${facts.exports.menuButton} from "./${facts.exports.menuButton}.vue";`,
    `import ${facts.exports.provider} from "./${facts.exports.provider}.vue";`,
    `import ${facts.exports.rail} from "./${facts.exports.rail}.vue";`,
    `import ${facts.exports.trigger} from "./${facts.exports.trigger}.vue";`,
  ].join("\n");
  const members = facts.index.namespaceMembers
    .map(({ key, name }) => `  ${key}: ${name},`)
    .join("\n");
  return `${imports}

const ${facts.exports.namespace} = {
${members}
};

export type { ${facts.context.contextTypeExports.join(", ")} } from "./${facts.context.name}.js";
export {
  ${facts.index.namedExports.join(",\n  ")},
  ${facts.context.contextExports.join(",\n  ")},
};
export default ${facts.exports.namespace};

export type { ${facts.index.typeExports.join(", ")} } from "${facts.runtime.typeImportSource}";
`;
}

function printProvider(facts: AdapterSidebarFacts): string {
  return renderSidebarProvider("vue", facts);
}

function printSidebar(facts: AdapterSidebarFacts): string {
  const props = facts.props;
  return `<script setup lang="ts">
import { ref } from "vue";
import { ${facts.context.hook} } from "./${facts.context.name}.js";
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ ${props.side.name}?: ${props.side.type}; ${props.variant.name}?: ${props.variant.type}; ${props.collapsible.name}?: ${props.collapsible.type} }>(), { ${props.side.name}: ${props.side.defaultValue}, ${props.variant.name}: ${props.variant.defaultValue}, ${props.collapsible.name}: ${props.collapsible.defaultValue} });
defineSlots<{ default?: () => unknown }>();
const element = ref<HTMLDivElement | null>(null);
const context = ${facts.context.hook}();
defineExpose({ element });
</script>
<template><${facts.parts.sidebar.defaultElement} ref="element" v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}" ${sidebarAttrs(facts, "sidebar", "vue")}><slot /></${facts.parts.sidebar.defaultElement}></template>
`;
}

function printTrigger(facts: AdapterSidebarFacts): string {
  return printAsChildControl(facts, "trigger");
}

function printMenuButton(facts: AdapterSidebarFacts): string {
  return printAsChildControl(facts, "menuButton");
}

function printAsChildControl(
  facts: AdapterSidebarFacts,
  partName: "menuButton" | "trigger",
): string {
  const part = facts.parts[partName];
  const protectedProps = `{${sidebarAttrs(facts, partName, "vue", "object")}}`;
  return `<script setup lang="ts">
import { computed, defineComponent, ref, useAttrs, useSlots } from "vue";
import { createVueAsChild } from "../_internal/as-child.js";
import { ${facts.context.hook} } from "./${facts.context.name}.js";
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ ${facts.props.asChild.name}?: ${facts.props.asChild.type} }>(), { ${facts.props.asChild.name}: ${facts.props.asChild.defaultValue} });
const attrs = useAttrs();
const slots = useSlots();
const element = ref<HTMLElement | null>(null);
const context = ${facts.context.hook}();
const asChild = createVueAsChild("${facts.displayName}.${part.namespaceKey}", element);
const protectedProps = computed(() => (${protectedProps}));
const AsChildRoot = defineComponent({
  inheritAttrs: false,
  setup() {
    return () => asChild.render({ children: slots.default?.() ?? [], consumerProps: attrs, defaultNativeButtonType: "button", protectedProps: protectedProps.value });
  },
});
defineExpose({ element });
</script>
<template>
  <AsChildRoot v-if="props.${facts.props.asChild.name}" />
  <${part.defaultElement} v-else ref="element" v-bind="attrs" type="button" ${sidebarAttrs(facts, partName, "vue")}><slot /></${part.defaultElement}>
</template>
`;
}

function printRail(facts: AdapterSidebarFacts): string {
  return `<script setup lang="ts">
import { ref } from "vue";
import { ${facts.context.hook} } from "./${facts.context.name}.js";
defineOptions({ inheritAttrs: false });
defineSlots<{ default?: () => unknown }>();
const element = ref<HTMLButtonElement | null>(null);
const context = ${facts.context.hook}();
defineExpose({ element });
</script>
<template><${facts.parts.rail.defaultElement} ref="element" v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}" ${sidebarAttrs(facts, "rail", "vue")}><slot /></${facts.parts.rail.defaultElement}></template>
`;
}
