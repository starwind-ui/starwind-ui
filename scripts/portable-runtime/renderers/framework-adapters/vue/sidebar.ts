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
  const props = facts.props;
  return `<script setup lang="ts">
import {
  ${facts.runtime.factory},
  type ${facts.types.mobileOpenDetails},
  type ${facts.types.openDetails},
  type ${facts.types.persistenceStorage},
} from "${facts.runtime.importSource}";
import { computed, onBeforeUnmount, onMounted, provide, readonly, ref, useAttrs, watch } from "vue";

import { ${facts.context.name} } from "./${facts.context.name}.js";

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{
  ${props.defaultOpen.name}?: ${props.defaultOpen.type};
  ${props.open.name}?: ${props.open.type};
  ${props.defaultMobileOpen.name}?: ${props.defaultMobileOpen.type};
  ${props.mobileOpen.name}?: ${props.mobileOpen.type};
  ${props.keyboardShortcut.name}?: ${props.keyboardShortcut.type};
  ${props.mobileQuery.name}?: ${props.mobileQuery.type};
  ${props.persistOpen.name}?: ${props.persistOpen.type};
  ${props.persistenceKey.name}?: ${props.persistenceKey.type};
  ${props.persistenceStorage.name}?: ${facts.types.persistenceStorage};
  ${props.persistenceMaxAge.name}?: ${props.persistenceMaxAge.type};
}>(), {
  ${props.defaultOpen.name}: ${props.defaultOpen.defaultValue},
  ${props.open.name}: undefined,
  ${props.defaultMobileOpen.name}: ${props.defaultMobileOpen.defaultValue},
  ${props.mobileOpen.name}: undefined,
  ${props.keyboardShortcut.name}: ${props.keyboardShortcut.defaultValue},
  ${props.mobileQuery.name}: ${props.mobileQuery.defaultValue},
  ${props.persistOpen.name}: ${props.persistOpen.defaultValue},
  ${props.persistenceMaxAge.name}: ${props.persistenceMaxAge.defaultValue},
});
const emit = defineEmits<{
  openChange: [open: boolean, detail: ${facts.types.openDetails}];
  mobileOpenChange: [open: boolean, detail: ${facts.types.mobileOpenDetails}];
  "update:open": [open: boolean];
  "update:mobileOpen": [open: boolean];
}>();
defineSlots<{ default?: () => unknown }>();
const attrs = useAttrs();
const element = ref<HTMLDivElement | null>(null);
const initialDefaultOpen = props.${props.defaultOpen.name};
const initialDefaultMobileOpen = props.${props.defaultMobileOpen.name};
const uncontrolledOpen = ref(initialDefaultOpen);
const uncontrolledMobileOpen = ref(initialDefaultMobileOpen);
const renderedOpen = computed(() => props.${props.open.name} ?? uncontrolledOpen.value);
const renderedMobileOpen = computed(() => props.${props.mobileOpen.name} ?? uncontrolledMobileOpen.value);
const isMobile = ref(false);
const expanded = computed(() => isMobile.value ? renderedMobileOpen.value : renderedOpen.value);
const state = computed(() => renderedOpen.value ? "expanded" as const : "collapsed" as const);
let instance: ReturnType<typeof ${facts.runtime.factory}> | undefined;
let unsubscribeOpen: (() => void) | undefined;
let unsubscribeMobileOpen: (() => void) | undefined;
let mediaQueryList: MediaQueryList | undefined;

provide(${facts.context.name}, {
  expanded: readonly(expanded),
  mobileOpen: readonly(renderedMobileOpen),
  open: readonly(renderedOpen),
  state: readonly(state),
});
defineExpose({ element });

function handleOpenChange(detail: ${facts.types.openDetails}): void {
  emit("openChange", detail.${facts.events.open.valueProperty}, detail);
  if (props.${props.open.name} === undefined) uncontrolledOpen.value = detail.${facts.events.open.valueProperty};
  emit("update:open", detail.${facts.events.open.valueProperty});
}
function handleMobileOpenChange(detail: ${facts.types.mobileOpenDetails}): void {
  emit("mobileOpenChange", detail.${facts.events.mobileOpen.valueProperty}, detail);
  if (props.${props.mobileOpen.name} === undefined) uncontrolledMobileOpen.value = detail.${facts.events.mobileOpen.valueProperty};
  emit("update:mobileOpen", detail.${facts.events.mobileOpen.valueProperty});
}
function destroyOwnedInstance(): void {
  unsubscribeOpen?.();
  unsubscribeOpen = undefined;
  unsubscribeMobileOpen?.();
  unsubscribeMobileOpen = undefined;
  const owned = instance;
  instance = undefined;
  owned?.destroy();
}
function setupRuntime(): void {
  const acceptedOpen = instance?.${facts.state.open.getter}() ?? renderedOpen.value;
  const acceptedMobileOpen = instance?.${facts.state.mobileOpen.getter}() ?? renderedMobileOpen.value;
  destroyOwnedInstance();
  if (!element.value) return;
  if (props.${props.open.name} === undefined) uncontrolledOpen.value = acceptedOpen;
  if (props.${props.mobileOpen.name} === undefined) uncontrolledMobileOpen.value = acceptedMobileOpen;
  instance = ${facts.runtime.factory}(element.value, {
    ${props.defaultOpen.name}: acceptedOpen,
    ${props.defaultMobileOpen.name}: acceptedMobileOpen,
    ${props.keyboardShortcut.name}: props.${props.keyboardShortcut.name},
    ${props.mobileQuery.name}: props.${props.mobileQuery.name},
    ${props.persistOpen.name}: props.${props.persistOpen.name},
    ${props.persistenceKey.name}: props.${props.persistenceKey.name},
    ${props.persistenceStorage.name}: props.${props.persistenceStorage.name},
    ${props.persistenceMaxAge.name}: props.${props.persistenceMaxAge.name},
    ...(props.${props.open.name} === undefined ? {} : { ${props.open.name}: props.${props.open.name} }),
    ...(props.${props.mobileOpen.name} === undefined ? {} : { ${props.mobileOpen.name}: props.${props.mobileOpen.name} }),
  });
  unsubscribeOpen = instance.subscribe("openChange", handleOpenChange);
  unsubscribeMobileOpen = instance.subscribe("mobileOpenChange", handleMobileOpenChange);
  if (props.${props.open.name} === undefined) uncontrolledOpen.value = instance.${facts.state.open.getter}();
  if (props.${props.mobileOpen.name} === undefined) uncontrolledMobileOpen.value = instance.${facts.state.mobileOpen.getter}();
}
function syncMedia(): void {
  isMobile.value = mediaQueryList?.matches ?? false;
}
function setupMediaQuery(): void {
  mediaQueryList?.removeEventListener?.("change", syncMedia);
  mediaQueryList?.removeListener?.(syncMedia);
  mediaQueryList = typeof window.matchMedia === "function" ? window.matchMedia(props.${props.mobileQuery.name}) : undefined;
  syncMedia();
  mediaQueryList?.addEventListener?.("change", syncMedia);
  mediaQueryList?.addListener?.(syncMedia);
}

onMounted(() => {
  setupMediaQuery();
  setupRuntime();
});
watch(() => props.${props.open.name}, (value, previous) => {
  if ((value === undefined) !== (previous === undefined)) return setupRuntime();
  if (value === undefined || !instance || instance.${facts.state.open.getter}() === value) return;
  instance.${facts.state.open.setter}(value, ${JSON.stringify(facts.state.open.setterOptions ?? {})});
}, { flush: "post" });
watch(() => props.${props.mobileOpen.name}, (value, previous) => {
  if ((value === undefined) !== (previous === undefined)) return setupRuntime();
  if (value === undefined || !instance || instance.${facts.state.mobileOpen.getter}() === value) return;
  instance.${facts.state.mobileOpen.setter}(value, ${JSON.stringify(facts.state.mobileOpen.setterOptions ?? {})});
}, { flush: "post" });
watch([
  () => props.${props.keyboardShortcut.name},
  () => props.${props.persistOpen.name},
  () => props.${props.persistenceKey.name},
  () => props.${props.persistenceStorage.name},
  () => props.${props.persistenceMaxAge.name},
], setupRuntime, { flush: "post" });
watch(() => props.${props.mobileQuery.name}, () => {
  setupMediaQuery();
  setupRuntime();
}, { flush: "post" });
onBeforeUnmount(() => {
  mediaQueryList?.removeEventListener?.("change", syncMedia);
  mediaQueryList?.removeListener?.(syncMedia);
  mediaQueryList = undefined;
  destroyOwnedInstance();
});
</script>

<template>
  <${facts.parts.provider.defaultElement}
    ref="element"
    v-bind="attrs"
    ${facts.attrs.provider}
    :${facts.attrs.defaultOpen}="initialDefaultOpen ? 'true' : undefined"
    :${facts.attrs.defaultMobileOpen}="initialDefaultMobileOpen ? 'true' : undefined"
    :${facts.attrs.providerState}="state"
    :${facts.attrs.mobileOpen}="renderedMobileOpen ? 'true' : 'false'"
    :${facts.attrs.keyboardShortcut}="props.${props.keyboardShortcut.name}"
    :${facts.attrs.mobileQuery}="props.${props.mobileQuery.name}"
    :${facts.attrs.persistOpen}="props.${props.persistOpen.name} ? 'true' : undefined"
    :${facts.attrs.persistenceKey}="props.${props.persistenceKey.name}"
    :${facts.attrs.persistenceStorage}="typeof props.${props.persistenceStorage.name} === 'string' ? props.${props.persistenceStorage.name} : props.${props.persistenceStorage.name} === false ? 'false' : undefined"
    :${facts.attrs.persistenceMaxAge}="props.${props.persistenceMaxAge.name}"
  ><slot /></${facts.parts.provider.defaultElement}>
</template>
`;
}

function printSidebar(facts: AdapterSidebarFacts): string {
  const props = facts.props;
  return `<script setup lang="ts">
import { computed, ref } from "vue";
import { ${facts.context.hook} } from "./${facts.context.name}.js";
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ ${props.side.name}?: ${props.side.type}; ${props.variant.name}?: ${props.variant.type}; ${props.collapsible.name}?: ${props.collapsible.type} }>(), { ${props.side.name}: ${props.side.defaultValue}, ${props.variant.name}: ${props.variant.defaultValue}, ${props.collapsible.name}: ${props.collapsible.defaultValue} });
defineSlots<{ default?: () => unknown }>();
const element = ref<HTMLDivElement | null>(null);
const context = ${facts.context.hook}();
const collapsedMode = computed(() => context.state.value === "collapsed" ? props.${props.collapsible.name} : "");
defineExpose({ element });
</script>
<template><${facts.parts.sidebar.defaultElement} ref="element" v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}" ${facts.attrs.sidebar} :${facts.attrs.sidebarState}="context.state.value" :${facts.attrs.sidebarCollapsible}="collapsedMode" :${facts.attrs.sidebarCollapsibleMode}="props.${props.collapsible.name}" :${facts.attrs.sidebarVariant}="props.${props.variant.name}" :${facts.attrs.sidebarSide}="props.${props.side.name}"><slot /></${facts.parts.sidebar.defaultElement}></template>
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
  const isTrigger = partName === "trigger";
  const protectedProps = isTrigger
    ? `{
  "${facts.attrs.trigger}": "",
  "${facts.attrs.triggerExpanded}": context.expanded.value,
  "${facts.attrs.triggerState}": context.state.value,
}`
    : `{
  "${facts.attrs.menuButton}": "",
  "${facts.attrs.menuButtonState}": context.state.value,
}`;
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
  <${part.defaultElement} v-else ref="element" v-bind="attrs" type="button" ${isTrigger ? facts.attrs.trigger : facts.attrs.menuButton} ${isTrigger ? `:${facts.attrs.triggerExpanded}="context.expanded.value" :${facts.attrs.triggerState}="context.state.value"` : `:${facts.attrs.menuButtonState}="context.state.value"`}><slot /></${part.defaultElement}>
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
<template><${facts.parts.rail.defaultElement} ref="element" v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}" ${facts.attrs.rail} ${facts.attrs.railType}="button" :${facts.attrs.railExpanded}="context.expanded.value" :${facts.attrs.railState}="context.state.value" :${facts.attrs.railTabindex}="${facts.rail.tabIndexValue}"><slot /></${facts.parts.rail.defaultElement}></template>
`;
}
