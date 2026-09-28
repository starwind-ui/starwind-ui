import {
  menuConnection,
  menuFragments,
  menuInitialProjection,
  menuPlan,
} from "../../shared-recipes/structured/menu.js";
import type {
  AdapterAnchoredMenuOverlayFacts,
  AdapterComponentFile,
  AdapterIndexFile,
  AdapterOutputModel,
  AdapterPrintedFile,
} from "../types.js";
import { getVueAcceptedModelEvent } from "./accepted-model-publication.js";

export function isVueAnchoredMenuOverlayOutput(model: AdapterOutputModel): boolean {
  return model.files.some(
    (file) => file.kind === "component" && file.component.family?.kind === "anchored-menu-overlay",
  );
}

export function printVueAnchoredMenuOverlayOutput(model: AdapterOutputModel): AdapterPrintedFile[] {
  const components = model.files.filter(
    (file): file is AdapterComponentFile =>
      file.kind === "component" && file.component.family?.kind === "anchored-menu-overlay",
  );
  const family = components[0]?.component.family;
  if (!family || family.kind !== "anchored-menu-overlay") {
    throw new TypeError("Vue anchored-menu-overlay projection requires family facts.");
  }
  const index = model.files.find(
    (file): file is AdapterIndexFile =>
      file.kind === "index" && file.family?.kind === "anchored-menu-overlay",
  );
  if (!index) {
    throw new TypeError("Vue anchored-menu-overlay projection requires an index file.");
  }

  return [
    ...components.map((file) => printComponent(file, family.facts)),
    { contents: printIndex(family.facts), path: index.path },
  ];
}

function printComponent(
  file: AdapterComponentFile,
  facts: AdapterAnchoredMenuOverlayFacts,
): AdapterPrintedFile {
  const family = file.component.family;
  if (!family || family.kind !== "anchored-menu-overlay") {
    throw new TypeError(`Vue ${facts.displayName} component requires anchored-menu-overlay facts.`);
  }

  return {
    contents:
      family.part === "root"
        ? printRoot(facts, getVueAcceptedModelEvent(file, "open"))
        : printTrigger(facts),
    path: `${file.path}.vue`,
  };
}

function printRoot(facts: AdapterAnchoredMenuOverlayFacts, acceptedEvent: string): string {
  const { attrs, events, props, runtime, state } = facts;
  const initial = menuInitialProjection("vue", {
    readModel: `props.${props.open.name}`,
    readDefault: `props.${props.defaultOpen.name}`,
    readDefaultCell: "initialDefaultOpen",
    readAccepted: "uncontrolledOpen.value",
    fallback: props.defaultOpen.defaultValue ?? "false",
  });
  return `<script setup lang="ts">
import { type ${events.closeComplete.detailsType}, type ${events.openChange.detailsType}, ${runtime.factory} } from "${runtime.importSource}";
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, useAttrs, watch } from "vue";
import { MenuOwnerContext, MenuRootContext } from "../menu/MenuContext";

defineOptions({ inheritAttrs: false });
defineSlots<{ default?: () => unknown }>();
const props = withDefaults(defineProps<{
  ${props.defaultOpen.name}?: ${props.defaultOpen.type};
  ${props.open.name}?: ${props.open.type};
  ${props.disabled.name}?: ${props.disabled.type};
  ${props.modal.name}?: ${props.modal.type};
  ${props.closeDelay.name}?: ${props.closeDelay.type};
}>(), {
  ${props.defaultOpen.name}: ${getDefault(props.defaultOpen, "false")},
  ${props.open.name}: undefined,
  ${props.disabled.name}: ${getDefault(props.disabled, "false")},
  ${props.modal.name}: ${getDefault(props.modal, "true")},
  ${props.closeDelay.name}: ${getDefault(props.closeDelay, "200")},
});
const emit = defineEmits<{
  "update:open": [open: boolean];
  ${events.openChange.name}: [open: boolean, detail: ${events.openChange.detailsType}];
  ${events.closeComplete.name}: [detail: ${events.closeComplete.detailsType}];
}>();
const publicAttrs = useAttrs();
const rootRef = ref<HTMLDivElement | null>(null);
const mounted = ref(false);
const initialDefaultOpen = ${initial.defaultSeed};
const uncontrolledOpen = ref(${initial.acceptedSeed});
const renderedOpen = computed(() => ${initial.rendered});
let instance: ReturnType<typeof ${runtime.factory}> | undefined;
let unsubscribeOpenChange: (() => void) | undefined;
let generation = 0;

provide(MenuRootContext, {
  element: rootRef,
  mounted,
  open: renderedOpen,
  registerPortal() {},
});
provide(MenuOwnerContext, { kind: "root" });

defineExpose({
  element: rootRef,
  close: () => instance?.close(),
  open: () => instance?.open(),
});

function destroyOwnedInstance(): void {
  const owned = instance; if (!owned) return;
  ${menuFragments("vue", "contextMenu").cleanup}
}
function setupRuntime(): void {
  const element = rootRef.value;
  if (!element) return;
  ${menuConnection("vue", "contextMenu")}
}
async function recreateRuntime(): Promise<void> {
  ${menuFragments("vue", "contextMenu").retainBeforeReconnect}
  const ownGeneration = ++generation;
  mounted.value = false;
  destroyOwnedInstance();
  await nextTick();
  if (ownGeneration !== generation || !rootRef.value) return;
  setupRuntime();
  mounted.value = true;
}
onMounted(() => { setupRuntime(); mounted.value = true; });
watch(() => props.${props.open.name}, (open, previous) => {
  if ((open === undefined) !== (previous === undefined)) { void recreateRuntime(); return; }
  ${menuFragments("vue", "contextMenu").parentCommand}
}, { flush: "post" });
watch([${menuPlan.contextMenu.options.map((name) => `() => props.${name}`).join(", ")}], () => { void recreateRuntime(); }, { flush: "post" });
onBeforeUnmount(() => { generation += 1; mounted.value = false; destroyOwnedInstance(); });
</script>

<template>
  <${facts.parts.root.defaultElement}
    ref="rootRef"
    v-bind="publicAttrs"
    ${attrs.root}
    ${attrs.menuRoot}
    data-sw-part="${facts.parts.root.name}"
    :${attrs.defaultOpen}="initialDefaultOpen ? 'true' : undefined"
    :${attrs.disabled}="props.${props.disabled.name} ? '' : undefined"
    :${attrs.modal}="props.${props.modal.name} ? 'true' : 'false'"
    :${attrs.closeDelay}="props.${props.closeDelay.name}"
    :${attrs.state}="renderedOpen ? '${facts.root.stateAttributes.openValue}' : '${facts.root.stateAttributes.closedValue}'"
  ><slot /></${facts.parts.root.defaultElement}>
</template>
`;
}

function printTrigger(facts: AdapterAnchoredMenuOverlayFacts): string {
  const { attrs, props, trigger } = facts;
  return `<script setup lang="ts">
import { ref, useAttrs } from "vue";
import { useMenuRootContext } from "../menu/MenuContext";
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ ${trigger.disabled.prop.name}?: ${trigger.disabled.prop.type}; ${props.tabIndex.name}?: ${props.tabIndex.type} }>(), { ${trigger.disabled.prop.name}: false, ${props.tabIndex.name}: ${trigger.tabIndexDefaultValue} });
defineSlots<{ default?: () => unknown }>();
const publicAttrs = useAttrs();
const menu = useMenuRootContext("ContextMenuTrigger");
const element = ref<HTMLDivElement | null>(null);
defineExpose({ element });
</script>
<template><${facts.parts.trigger.defaultElement} ref="element" v-bind="publicAttrs" ${attrs.trigger} ${attrs.menuTrigger} data-sw-part="${facts.parts.trigger.name}" ${trigger.disclosure.ariaHaspopup.attribute}="${trigger.disclosure.ariaHaspopup.value}" :${trigger.disclosure.ariaExpanded}="menu.open.value" :${trigger.disabled.ariaAttribute}="props.${trigger.disabled.prop.name} ? 'true' : undefined" :${trigger.disabled.dataAttribute}="props.${trigger.disabled.prop.name} ? '' : undefined" :${trigger.disclosure.stateAttribute}="menu.open.value ? '${trigger.disclosure.openStateValue}' : '${trigger.disclosure.closedStateValue}'" :tabindex="props.${trigger.disabled.prop.name} ? -1 : props.${props.tabIndex.name}" :style="[{ ${toVueStyleProperty(trigger.touchCalloutStyle.property)}: '${trigger.touchCalloutStyle.value}' }, publicAttrs.style]"><slot /></${facts.parts.trigger.defaultElement}></template>
`;
}

function printIndex(facts: AdapterAnchoredMenuOverlayFacts): string {
  const menuImports = facts.index.menuAliasMembers
    .map((alias) => `import ${alias.contextName} from "../menu/${alias.menuName}.vue";`)
    .join("\n");
  const localImports = facts.index.importMembers
    .map((member) => `import ${member.name} from "${member.from}.vue";`)
    .join("\n");
  const namespaceEntries = facts.index.namespaceMembers
    .map((member) => `  ${member.key}: ${member.name},`)
    .join("\n");
  const namedMembers = [
    ...facts.index.importMembers.map((member) => member.name),
    ...facts.index.menuAliasMembers.map((alias) => alias.contextName),
  ].sort((a, b) => a.localeCompare(b));
  const namedExports = [facts.exports.namespace, ...namedMembers]
    .map((name) => `  ${name},`)
    .join("\n");
  const typeExports = facts.index.typeExports.length
    ? `\n\nexport type {\n${facts.index.typeExports.map((name) => `  ${name},`).join("\n")}\n} from "${facts.runtime.typeImportSource}";`
    : "";

  return `${menuImports}\n${localImports}\n\nconst ${facts.exports.namespace} = {\n${namespaceEntries}\n};\n\nexport {\n${namedExports}\n};\n\nexport default ${facts.exports.namespace};${typeExports}\n`;
}

function getDefault(prop: { defaultValue?: string }, fallback: string): string {
  return prop.defaultValue ?? fallback;
}

function formatOptions(options: Record<string, boolean | number | string> | undefined): string {
  const entries = Object.entries(options ?? {});
  if (entries.length === 0) return "{}";
  return `{ ${entries.map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join(", ")} }`;
}

function toVueStyleProperty(property: string): string {
  const camelCase = property
    .replace(/^-/, "")
    .replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
  return camelCase.startsWith("webkit") ? `Webkit${camelCase.slice("webkit".length)}` : camelCase;
}
