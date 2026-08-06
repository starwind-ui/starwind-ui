import type {
  AdapterEngineViewportComponentProjection,
  AdapterEngineViewportFacts,
  AdapterEngineViewportIndexProjection,
  AdapterEngineViewportPartName,
} from "../types.js";

export function printVueEngineViewportComponent(
  family: AdapterEngineViewportComponentProjection,
): string {
  const facts = family.facts;
  if (family.part === "root") return printRoot(facts);
  if (family.part === "item") return printItem(facts);
  if (family.part === "previous" || family.part === "next") {
    return printControl(facts, family.part);
  }
  return printSimplePart(facts, family.part);
}

export function printVueEngineViewportIndex(family: AdapterEngineViewportIndexProjection): string {
  const facts = family.facts;
  const imports = facts.index.importMembers
    .map((member) =>
      member.name === facts.exports.root
        ? `import ${member.name}Component from "${member.from}.vue";`
        : `import ${member.name} from "${member.from}.vue";`,
    )
    .join("\n");
  const entries = facts.index.namespaceMembers
    .map((member) => `  ${member.key}: ${member.name},`)
    .join("\n");
  const exports = facts.index.importMembers.map((member) => member.name).join(", ");

  return `${imports}\nimport type { DefineComponent } from "vue";\nimport type { ${facts.exports.root}Props } from "./${facts.displayName}Types.js";\n\nconst ${facts.exports.root} = ${facts.exports.root}Component as unknown as DefineComponent<${facts.exports.root}Props>;\n\nconst ${facts.exports.namespace} = {\n${entries}\n};\n\nexport { ${facts.exports.namespace}, ${exports} };\nexport default ${facts.exports.namespace};\n\nexport type { ${facts.exports.root}Props } from "./${facts.displayName}Types.js";\nexport type { ${facts.index.typeExports.join(", ")} } from "${facts.index.typeExportSource}";\nexport { ${facts.index.valueExports.join(", ")} } from "${facts.index.valueExportSource}";\n`;
}

export function printVueEngineViewportTypes(facts: AdapterEngineViewportFacts): string {
  const props = facts.options;
  return `import type { ${facts.runtime.instanceType}, ${facts.runtime.optionsType} } from "${facts.runtime.importSource}";\n\nexport type ${facts.exports.root}Props = {\n  ${props.orientation.name}?: ${props.orientation.type};\n  ${props.opts.name}?: ${props.opts.type};\n  ${props.plugins.name}?: ${props.plugins.type};\n  ${props.setApi.name}?: ${props.setApi.type};\n};\n`;
}

function printRoot(facts: AdapterEngineViewportFacts): string {
  const props = facts.options;
  const root = facts.exports.root;

  return `<script setup lang="ts">
import {
  ${facts.runtime.factory},
  type ${facts.runtime.instanceType},
  type ${facts.runtime.optionsType},
} from "${facts.runtime.importSource}";
import { nextTick, onBeforeUnmount, onMounted, onUpdated, ref, useAttrs, watch } from "vue";
import type { ${root}Props } from "./${facts.displayName}Types.js";

defineOptions({ inheritAttrs: false });

const rawProps = withDefaults(
  defineProps<{
    ${props.orientation.name}?: ${props.orientation.type};
    ${props.opts.name}?: unknown;
    ${props.plugins.name}?: unknown;
    ${props.setApi.name}?: ((api: unknown) => void) | undefined;
  }>(),
  {
  ${props.orientation.name}: ${props.orientation.defaultValue},
  ${props.opts.name}: () => (${props.opts.defaultValue}),
  },
);
const props = rawProps as ${root}Props;
const attrs = useAttrs();
const element = ref<HTMLDivElement | null>(null);
let instance: ${facts.runtime.instanceType} | undefined;
let refreshRevision = 0;

function currentOptions(): ${facts.runtime.optionsType}["opts"] {
  return {
    axis:
      props.${props.orientation.name} === "vertical"
        ? "${props.orientation.axisMap.vertical}"
        : "${props.orientation.axisMap.horizontal}",
    ...props.${props.opts.name},
  };
}

async function refreshAfterVueFlush(): Promise<void> {
  const revision = ++refreshRevision;
  await nextTick();
  if (revision !== refreshRevision || !instance) return;
  instance.reInit(currentOptions(), props.${props.plugins.name});
}

defineExpose({ element });

onMounted(() => {
  if (!element.value) return;
  instance = ${facts.runtime.factory}(element.value, {
    ${props.orientation.name}: props.${props.orientation.name},
    ${props.opts.name}: props.${props.opts.name},
    ${props.plugins.name}: props.${props.plugins.name},
    ${props.setApi.name}: (api) => props.${props.setApi.name}?.(api),
  });
});

onUpdated(() => {
  void refreshAfterVueFlush();
});

watch(
  () => [props.${props.orientation.name}, props.${props.opts.name}, props.${props.plugins.name}] as const,
  () => void refreshAfterVueFlush(),
  { flush: "post" },
);

watch(
  () => props.${props.setApi.name},
  (setApi) => {
    if (setApi && instance) setApi(instance.api);
  },
);

onBeforeUnmount(() => {
  refreshRevision += 1;
  const owned = instance;
  instance = undefined;
  owned?.destroy();
});
</script>

<template>
  <${facts.parts.root.defaultElement}
    ref="element"
    v-bind="attrs"
    ${facts.attrs.root}
    ${facts.attrs.role}="${facts.semantics.rootRole}"
    ${facts.attrs.roledescription}="${facts.semantics.rootRoledescription}"
    ${facts.attrs.autoInit}="${props.autoInit.falseValue}"
    :${facts.attrs.axis}="
      props.${props.orientation.name} === 'vertical'
        ? '${props.orientation.axisMap.vertical}'
        : '${props.orientation.axisMap.horizontal}'
    "
    :${facts.attrs.opts}="JSON.stringify(props.${props.opts.name})"
  >
    <slot />
  </${facts.parts.root.defaultElement}>
</template>
`;
}

function printItem(facts: AdapterEngineViewportFacts): string {
  const part = facts.parts.item;
  return printElement(
    part.defaultElement,
    ` ${facts.attrs.item} ${facts.attrs.itemRole}="${facts.semantics.itemRole}" ${facts.attrs.itemRoledescription}="${facts.semantics.itemRoledescription}"`,
  );
}

function printControl(facts: AdapterEngineViewportFacts, partName: "next" | "previous"): string {
  const part = facts.parts[partName];
  const control = facts.controls[partName];
  return printElement(
    part.defaultElement,
    ` ${facts.attrs[partName]} ${control.typeAttribute}="${control.typeValue}"`,
  );
}

function printSimplePart(
  facts: AdapterEngineViewportFacts,
  partName: Exclude<AdapterEngineViewportPartName, "item" | "next" | "previous" | "root">,
): string {
  return printElement(facts.parts[partName].defaultElement, ` ${facts.attrs[partName]}`);
}

function printElement(tag: string, protectedAttributes: string): string {
  return `<script setup lang="ts">
import { ref, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
const element = ref<HTMLElement | null>(null);
defineExpose({ element });
</script>

<template>
  <${tag} ref="element" v-bind="attrs"${protectedAttributes}><slot /></${tag}>
</template>
`;
}
