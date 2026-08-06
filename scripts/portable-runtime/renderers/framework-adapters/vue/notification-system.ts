import type {
  AdapterNotificationSystemComponentProjection,
  AdapterNotificationSystemFacts,
  AdapterNotificationSystemIndexProjection,
  AdapterNotificationSystemPartName,
} from "../types.js";
import { VUE_NON_SHIPPING_COMMENT } from "./primitive/shared-fragments.js";

export function printVueNotificationSystemComponent(
  family: AdapterNotificationSystemComponentProjection,
): string {
  if (family.part === "viewport") return printViewport(family.facts);
  if (family.part === "template") return printTemplate(family.facts);
  if (family.part === "root") return printRoot(family.facts);
  if (family.part === "action") return printAction(family.facts);
  if (family.part === "close") return printClose(family.facts);

  return printSimplePart(family.facts, family.part);
}

export function printVueNotificationSystemIndex(
  family: AdapterNotificationSystemIndexProjection,
): string {
  const facts = family.facts;
  const imports = facts.index.importMembers
    .map((member) => `import ${member.name} from "${member.from}.vue";`)
    .join("\n");
  const namespaceEntries = facts.index.namespaceMembers
    .map((member) => `  ${member.key}: ${member.name},`)
    .join("\n");
  const exportNames = [
    facts.exports.namespace,
    ...facts.index.importMembers.map(({ name }) => name),
  ]
    .map((name) => `  ${name},`)
    .join("\n");

  return `${imports}\n\nconst ${facts.exports.namespace} = {\n${namespaceEntries}\n};\n\nexport {\n${exportNames}\n};\n\nexport default ${facts.exports.namespace};\n\nexport type { ${facts.index.typeExports.join(", ")} } from "${facts.index.typeExportSource}";\nexport { ${facts.index.valueExports.join(", ")} } from "${facts.index.valueExportSource}";\n`;
}

function printViewport(facts: AdapterNotificationSystemFacts): string {
  const component = facts.exports.viewport;
  const options = facts.viewportOptions;
  const semantics = facts.viewportSemantics;

  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";
import { computed, onBeforeUnmount, onMounted, ref, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

type Position = ${options.position.type};

const props = withDefaults(
  defineProps<{
    ${options.duration.name}?: ${options.duration.type};
    ${options.gap.name}?: ${options.gap.type};
    ${options.limit.name}?: ${options.limit.type};
    ${options.peek.name}?: ${options.peek.type};
    ${options.position.name}?: Position;
  }>(),
  {
    ${options.duration.name}: ${options.duration.defaultValue},
    ${options.gap.name}: ${options.gap.defaultValue},
    ${options.limit.name}: ${options.limit.defaultValue},
    ${options.peek.name}: ${options.peek.defaultValue},
    ${options.position.name}: ${options.position.defaultValue},
  },
);
defineSlots<{ default?: () => unknown }>();
const attrs = useAttrs();
const viewportRef = ref<HTMLDivElement | null>(null);
const runtimeStyle = computed(() => ({
  "${options.gap.cssVariable}": props.${options.gap.name},
  "${options.peek.cssVariable}": props.${options.peek.name},
}));
let manager: ReturnType<typeof ${facts.runtime.factory}> | undefined;

defineExpose({ element: viewportRef });

onMounted(() => {
  const viewport = viewportRef.value;
  if (!viewport) return;
  manager = ${facts.runtime.factory}(viewport);
});

onBeforeUnmount(() => {
  const owned = manager;
  manager = undefined;
  owned?.${facts.runtime.destroyMethod}();
});
</script>

<template>
  <${facts.parts.viewport.defaultElement}
    ref="viewportRef"
    role="${semantics.role}"
    ${semantics.ariaLiveAttribute}="${semantics.ariaLiveValue}"
    ${semantics.ariaAtomicAttribute}="${semantics.ariaAtomicValue}"
    ${semantics.ariaRelevantAttribute}="${semantics.ariaRelevantValue}"
    ${semantics.ariaLabelAttribute}="${semantics.ariaLabelValue}"
    :tabindex="${semantics.tabIndexValue}"
    v-bind="attrs"
    ${facts.attrs.viewport}
    :${options.position.attribute}="props.${options.position.name}"
    :${options.limit.attribute}="props.${options.limit.name}"
    :${options.duration.attribute}="props.${options.duration.name}"
    :style="[attrs.style, runtimeStyle]"
  >
    <slot />
  </${facts.parts.viewport.defaultElement}>
</template>
`;
}

function printTemplate(facts: AdapterNotificationSystemFacts): string {
  const variant = facts.template.variant;

  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, onUpdated, ref, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

type Variant = ${variant.type};

const props = withDefaults(defineProps<{ ${variant.name}?: Variant }>(), {
  ${variant.name}: ${variant.defaultValue},
});
defineSlots<{ default?: () => unknown }>();
const attrs = useAttrs();
const templateRef = ref<HTMLTemplateElement | null>(null);
const sourceRef = ref<HTMLDivElement | null>(null);
let forwardedAttributeNames = new Set<string>();

defineExpose({ element: templateRef });

function syncContent(): void {
  const source = sourceRef.value;
  if (!source) return;
  let template = templateRef.value;
  if (!template) {
    template = document.createElement("template");
    source.before(template);
    templateRef.value = template;
  }
  const nextForwardedAttributeNames = new Set<string>();
  for (const attribute of Array.from(source.attributes)) {
    if (["aria-hidden", "data-sw-toast-template-source", "hidden"].includes(attribute.name)) continue;
    nextForwardedAttributeNames.add(attribute.name);
    template.setAttribute(attribute.name, attribute.value);
  }
  for (const attributeName of forwardedAttributeNames) {
    if (!nextForwardedAttributeNames.has(attributeName)) template.removeAttribute(attributeName);
  }
  forwardedAttributeNames = nextForwardedAttributeNames;
  template.setAttribute("${facts.attrs.template}", props.${variant.name});
  const renderedChildren = Array.from(source.childNodes);
  if (renderedChildren.length > 0) template.content.replaceChildren(...renderedChildren);
}

onMounted(syncContent);
onUpdated(syncContent);
onBeforeUnmount(() => templateRef.value?.remove());
</script>

<template>
  <div
    ref="sourceRef"
    v-bind="attrs"
    hidden
    aria-hidden="true"
    data-sw-toast-template-source
    :data-variant="props.${variant.name}"
  >
    <slot />
  </div>
</template>
`;
}

function printRoot(facts: AdapterNotificationSystemFacts): string {
  const variant = facts.template.variant;
  const state = facts.rootState;

  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { ref, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

type Variant = ${variant.type};

const props = withDefaults(defineProps<{ ${variant.name}?: Variant }>(), {
  ${variant.name}: ${variant.defaultValue},
});
defineSlots<{ default?: () => unknown }>();
const attrs = useAttrs();
const rootRef = ref<HTMLDivElement | null>(null);

defineExpose({ element: rootRef });
</script>

<template>
  <${facts.parts.root.defaultElement}
    ref="rootRef"
    v-bind="attrs"
    ${facts.attrs.root}
    ${state.stateAttribute}="${state.stateOpenValue}"
    :${state.variantAttribute}="props.${variant.name}"
    role="${state.role}"
    ${state.ariaModalAttribute}="${state.ariaModalValue}"
  >
    <slot />
  </${facts.parts.root.defaultElement}>
</template>
`;
}

function printSimplePart(
  facts: AdapterNotificationSystemFacts,
  partName: Exclude<
    AdapterNotificationSystemPartName,
    "action" | "close" | "root" | "template" | "viewport"
  >,
): string {
  const part = facts.parts[partName];
  const elementType = getVueElementType(part.defaultElement);

  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { ref, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });
defineSlots<{ default?: () => unknown }>();
const attrs = useAttrs();
const elementRef = ref<${elementType} | null>(null);

defineExpose({ element: elementRef });
</script>

<template>
  <${part.defaultElement} ref="elementRef" v-bind="attrs" ${facts.attrs[partName]}>
    <slot />
  </${part.defaultElement}>
</template>
`;
}

function printAction(facts: AdapterNotificationSystemFacts): string {
  const action = facts.actions.action;
  return printButton(facts, "action", "", `${action.typeAttribute}="${action.typeValue}"`);
}

function printClose(facts: AdapterNotificationSystemFacts): string {
  const close = facts.actions.close;
  return printButton(
    facts,
    "close",
    `${close.ariaLabelAttribute}="${close.ariaLabelValue}"`,
    `${close.typeAttribute}="${close.typeValue}"`,
  );
}

function printButton(
  facts: AdapterNotificationSystemFacts,
  partName: "action" | "close",
  overridableAttributes: string,
  protectedAttributes: string,
): string {
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { ref, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });
defineSlots<{ default?: () => unknown }>();
const attrs = useAttrs();
const elementRef = ref<HTMLButtonElement | null>(null);

defineExpose({ element: elementRef });
</script>

<template>
  <button
    ref="elementRef"
    ${overridableAttributes}
    v-bind="attrs"
    ${protectedAttributes}
    ${facts.attrs[partName]}
  >
    <slot />
  </button>
</template>
`;
}

function getVueElementType(defaultElement: string): string {
  if (defaultElement === "div") return "HTMLDivElement";
  if (defaultElement === "span") return "HTMLSpanElement";
  return "HTMLElement";
}
