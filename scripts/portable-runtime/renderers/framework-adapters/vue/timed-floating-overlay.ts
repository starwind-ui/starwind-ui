import { projectVueAttributeAccess } from "./public-contract.js";

const VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS = projectVueAttributeAccess([]);

import type {
  AdapterComponentFile,
  AdapterIndexFile,
  AdapterPrintedFile,
  AdapterTimedFloatingOverlayFacts,
  AdapterTimedFloatingOverlayPartName,
} from "../types.js";
import { printVueFamilyIndex, VUE_NON_SHIPPING_COMMENT } from "./primitive/shared-fragments.js";

export function printVueTimedFloatingOverlayIndex(file: AdapterIndexFile): AdapterPrintedFile {
  return printVueFamilyIndex(file, "timed-floating-overlay");
}

export function printVueTimedFloatingOverlayComponent(
  file: AdapterComponentFile,
): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "timed-floating-overlay") {
    throw new TypeError(
      "Vue timed-floating-overlay projection requires a timed-floating-overlay component model.",
    );
  }

  const { facts, part } = family;
  const contents =
    part === "root"
      ? printRoot(facts)
      : part === "trigger"
        ? printTrigger(facts)
        : part === "portal"
          ? printPortal(facts)
          : part === "positioner" || part === "popup"
            ? printFloatingPart(facts, part)
            : printSimplePart(facts, part);
  return { contents, path: `${file.path}.vue` };
}

function printRoot(facts: AdapterTimedFloatingOverlayFacts): string {
  const disabledProp = facts.root.disabled
    ? `    ${facts.props.disabled.name}?: ${facts.props.disabled.type};\n`
    : "";
  const disabledDefault = facts.root.disabled
    ? `    ${facts.props.disabled.name}: ${facts.props.disabled.defaultValue},\n`
    : "";
  const disabledOption = facts.root.disabled
    ? `    ${facts.props.disabled.name}: props.${facts.props.disabled.name},\n`
    : "";
  const disabledAttribute =
    facts.root.disabled && facts.attrs.rootDisabled
      ? `\n    :${facts.attrs.rootDisabled}="props.${facts.props.disabled.name} ? '' : undefined"`
      : "";
  const renderedOpen = facts.root.disabled
    ? `!props.${facts.props.disabled.name} && (props.${facts.props.open.name} ?? uncontrolledOpen.value)`
    : `props.${facts.props.open.name} ?? uncontrolledOpen.value`;
  const disabledWatch = facts.root.disabled
    ? `
watch(
  () => props.${facts.props.disabled.name},
  (disabled) => {
    instance?.${facts.setters.disabled.method}(disabled);
    if (disabled && props.${facts.props.open.name} === undefined) uncontrolledOpen.value = false;
  },
  { flush: "post" },
);
`
    : "";
  const setterOptions = printOptions(facts.setters.open.options);
  const contextName = `${facts.displayName}Context`;

  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script lang="ts">
import type { InjectionKey, Ref } from "vue";

export type ${contextName}Value = {
  element: Readonly<Ref<HTMLElement | null>>;
  mounted: Readonly<Ref<boolean>>;
  registerPortal: (owner: symbol, element: HTMLElement | null) => void;
};

export const ${contextName}: InjectionKey<${contextName}Value> = Symbol("${contextName}");
</script>

<script setup lang="ts">
import { ${facts.runtime.factory}, type ${facts.event.detailsType} } from "${facts.runtime.importSource}";
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, useAttrs, watch } from "vue";
import { useVueAsChildRuntimeOwner } from "../_internal/as-child";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    ${facts.props.defaultOpen.name}?: ${facts.props.defaultOpen.type};
    ${facts.props.open.name}?: ${facts.props.open.type};
    ${facts.props.closeDelay.name}?: ${facts.props.closeDelay.type};
    ${facts.props.closeOnEscape.name}?: ${facts.props.closeOnEscape.type};
    ${facts.props.closeOnOutsideInteract.name}?: ${facts.props.closeOnOutsideInteract.type};
${disabledProp}    ${facts.props.disableHoverableContent.name}?: ${facts.props.disableHoverableContent.type};
    ${facts.props.openDelay.name}?: ${facts.props.openDelay.type};
  }>(),
  {
    ${facts.props.defaultOpen.name}: ${facts.props.defaultOpen.defaultValue},
    ${facts.props.open.name}: undefined,
    ${facts.props.closeDelay.name}: ${facts.props.closeDelay.defaultValue},
    ${facts.props.closeOnEscape.name}: ${facts.props.closeOnEscape.defaultValue},
    ${facts.props.closeOnOutsideInteract.name}: ${facts.props.closeOnOutsideInteract.defaultValue},
${disabledDefault}    ${facts.props.disableHoverableContent.name}: ${facts.props.disableHoverableContent.defaultValue},
    ${facts.props.openDelay.name}: ${facts.props.openDelay.defaultValue},
  },
);
const emit = defineEmits<{
  ${facts.event.name}: [open: ${facts.event.valueType}, detail: ${facts.event.detailsType}];
  "update:${facts.props.open.name}": [open: ${facts.event.valueType}];
}>();
defineSlots<{ default?: () => unknown }>();
const attrs = useAttrs();
const rootRef = ref<HTMLElement | null>(null);
const mounted = ref(false);
const initialDefaultOpen = props.${facts.props.defaultOpen.name};
const uncontrolledOpen = ref(initialDefaultOpen);
const renderedOpen = computed(() => ${renderedOpen});
let instance: ReturnType<typeof ${facts.runtime.factory}> | undefined;
let portalOwner: symbol | undefined;
let runtimeGeneration = 0;
let disposed = false;

provide(${contextName}, {
  element: rootRef,
  mounted,
  registerPortal(owner, element) {
    if (element) portalOwner = owner;
    else if (portalOwner === owner) portalOwner = undefined;
  },
});

defineExpose({ element: rootRef });

function handleOpenChange(nextOpen: ${facts.event.valueType}, detail: ${facts.event.detailsType}): void {
  emit("${facts.event.name}", nextOpen, detail);
  if (detail.isCanceled) return;
  if (props.${facts.props.open.name} === undefined) uncontrolledOpen.value = nextOpen;
  emit("update:${facts.props.open.name}", nextOpen);
}

function destroyOwnedInstance(): void {
  const owned = instance;
  if (!owned) return;
  if (instance === owned) instance = undefined;
  owned.destroy();
}

function setupRuntime(): void {
  const root = rootRef.value;
  if (!root) return;
  instance = ${facts.runtime.factory}(root, {
    ${facts.props.defaultOpen.name}: renderedOpen.value,
    ${facts.props.closeDelay.name}: props.${facts.props.closeDelay.name},
    ${facts.props.closeOnEscape.name}: props.${facts.props.closeOnEscape.name},
    ${facts.props.closeOnOutsideInteract.name}: props.${facts.props.closeOnOutsideInteract.name},
${disabledOption}    ${facts.props.disableHoverableContent.name}: props.${facts.props.disableHoverableContent.name},
    ${facts.props.openDelay.name}: props.${facts.props.openDelay.name},
    ${facts.event.callbackProp}: handleOpenChange,
    ...(props.${facts.props.open.name} === undefined ? {} : { ${facts.props.open.name}: props.${facts.props.open.name} }),
  });
}

async function recreateRuntime(): Promise<void> {
  const generation = ++runtimeGeneration;
  const acceptedOpen = instance?.${facts.state.getter}() ?? renderedOpen.value;
  destroyOwnedInstance();
  mounted.value = false;
  await nextTick();
  if (disposed || generation !== runtimeGeneration) return;

  if (props.${facts.props.open.name} === undefined) uncontrolledOpen.value = acceptedOpen;
  setupRuntime();
  mounted.value = true;
}

useVueAsChildRuntimeOwner(rootRef, recreateRuntime);
onMounted(() => {
  disposed = false;
  setupRuntime();
  mounted.value = true;
});

watch(
  () => props.${facts.props.open.name},
  (open) => {
    if (open === undefined || !instance || Object.is(instance.${facts.state.getter}(), open)) return;
    instance.${facts.setters.open.method}(open${setterOptions});
  },
  { flush: "post" },
);
watch(
  [
    () => props.${facts.props.closeDelay.name},
    () => props.${facts.props.closeOnEscape.name},
    () => props.${facts.props.closeOnOutsideInteract.name},
    () => props.${facts.props.disableHoverableContent.name},
    () => props.${facts.props.openDelay.name},
  ],
  () => {
    void recreateRuntime();
  },
  { flush: "post" },
);
${disabledWatch}
onBeforeUnmount(() => {
  disposed = true;
  runtimeGeneration += 1;
  mounted.value = false;
  portalOwner = undefined;
  destroyOwnedInstance();
});
</script>

<template>
  <${facts.parts.root.defaultElement}
    ref="rootRef"
    v-bind="attrs"
    ${facts.attrs.root}
    data-sw-part="${facts.parts.root.name}"
    :${facts.attrs.rootDefaultOpen}="initialDefaultOpen ? 'true' : undefined"
    :${facts.attrs.rootCloseDelay}="props.${facts.props.closeDelay.name}"
    :${facts.attrs.rootCloseOnEscape}="props.${facts.props.closeOnEscape.name} ? 'true' : 'false'"
    :${facts.attrs.rootCloseOnOutsideInteract}="props.${facts.props.closeOnOutsideInteract.name} ? 'true' : 'false'"
    :${facts.attrs.rootContentHoverable}="props.${facts.props.disableHoverableContent.name} ? 'false' : 'true'"${disabledAttribute}
    :${facts.attrs.rootOpenDelay}="props.${facts.props.openDelay.name}"
    :${facts.attrs.rootState}="renderedOpen ? 'open' : 'closed'"
  >
    <slot />
  </${facts.parts.root.defaultElement}>
</template>
`;
}

function printTrigger(facts: AdapterTimedFloatingOverlayFacts): string {
  const anchor = facts.trigger.triggerKind === "anchor";
  const closeDelay = anchor
    ? requireFact(facts.attrs.triggerCloseDelay, "trigger close delay")
    : "";
  const openDelay = anchor ? requireFact(facts.attrs.triggerOpenDelay, "trigger open delay") : "";
  const nativeDisabled = facts.attrs.triggerNativeDisabled;
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { defineComponent, ref, useAttrs, type VNode } from "vue";
import { createVueAsChild } from "../_internal/as-child";

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{
  ${facts.props.asChild.name}?: boolean;
  ${facts.props.disabled.name}?: boolean;
${anchor ? `  ${facts.props.closeDelay.name}?: number;\n  ${facts.props.openDelay.name}?: number;\n` : ""}}>(), {
  ${facts.props.asChild.name}: false,
  ${facts.props.disabled.name}: ${facts.props.disabled.defaultValue},
});
const slots = defineSlots<{ default?: () => VNode[] }>();
const attrs = useAttrs();
const element = ref<HTMLElement | null>(null);
const asChild = createVueAsChild("${facts.exports.trigger}", element);
const { setElement } = asChild;
defineExpose({ element });
function handleClick(event: MouseEvent): void {
  if (!props.${facts.props.disabled.name}) return;
  event.preventDefault();
  event.stopPropagation();
}
function protectedProps() {
  return {
    "${facts.attrs.trigger}": "",
    "${facts.attrs.triggerDisabled}": props.${facts.props.disabled.name} ? "" : undefined,
    "${facts.attrs.triggerAriaDisabled}": props.${facts.props.disabled.name} ? "true" : undefined,
    "${facts.attrs.triggerState}": "closed",
${anchor ? `    "${closeDelay}": props.${facts.props.closeDelay.name},\n    "${openDelay}": props.${facts.props.openDelay.name},\n    href: props.${facts.props.disabled.name} ? undefined : attrs.href,\n    tabindex: props.${facts.props.disabled.name} ? -1 : attrs.tabindex,\n    onClick: handleClick,\n` : nativeDisabled ? `    "${nativeDisabled}": props.${facts.props.disabled.name},\n` : ""}    "data-sw-part": "${facts.parts.trigger.name}",
  };
}
const AsChildTrigger = defineComponent({
  inheritAttrs: false,
  setup() {
    return () => {
      const children = slots.default?.() ?? [];
      return asChild.render({
        children,
        consumerProps: attrs,
        protectedProps: protectedProps(),
      });
    };
  },
});
</script>

<template>
  <AsChildTrigger v-if="props.${facts.props.asChild.name}" />
  <${facts.trigger.renderedElement}
    v-else
    :ref="setElement"
    v-bind="attrs"
    ${facts.attrs.trigger}
    data-sw-part="${facts.parts.trigger.name}"
    :${facts.attrs.triggerDisabled}="props.${facts.props.disabled.name} ? '' : undefined"
    :${facts.attrs.triggerAriaDisabled}="props.${facts.props.disabled.name} ? 'true' : undefined"
    ${facts.attrs.triggerState}="closed"
${anchor ? `    :${closeDelay}="props.${facts.props.closeDelay.name}"\n    :${openDelay}="props.${facts.props.openDelay.name}"\n    :href="props.${facts.props.disabled.name} ? undefined : (attrs.href as string | undefined)"\n    :tabindex="props.${facts.props.disabled.name} ? -1 : (attrs.tabindex as number | undefined)"\n    @click="handleClick"\n` : `    type="button"\n    :disabled="props.${facts.props.disabled.name}"\n`}  >
    <slot />
  </${facts.trigger.renderedElement}>
</template>
`;
}

function printPortal(facts: AdapterTimedFloatingOverlayFacts): string {
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { reportPortalPlacement, resolvePortalPlacement } from "${facts.runtime.importSource}";
import { inject, onBeforeUnmount, onMounted, ref } from "vue";
import { useVuePortalPlacement } from "../_internal/portal";
import { ${facts.displayName}Context } from "./${facts.exports.root}.vue";
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ container?: string | HTMLElement; disabled?: boolean }>(), { disabled: false });
defineSlots<{ default?: () => unknown }>();
const root = inject(${facts.displayName}Context);
if (!root) throw new TypeError("${facts.exports.portal} must be nested inside ${facts.exports.root}.");
const owner = Symbol("${facts.exports.portal}");
const element = ref<HTMLElement | null>(null);
const placement = useVuePortalPlacement({
  active: () => root.mounted.value,
  container: () => props.container,
  disabled: () => props.disabled,
  element,
  reference: () => root.element.value,
  runtime: { reportPortalPlacement, resolvePortalPlacement },
});
onMounted(() => root.registerPortal(owner, element.value));
onBeforeUnmount(() => root.registerPortal(owner, null));
defineExpose({ element });
</script>
<template>
  <Teleport :to="placement.target.value" :disabled="placement.disabled.value">
    <${facts.parts.portal.defaultElement} ref="element" v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}" ${facts.attrs.portal} :data-container="typeof props.container === 'string' ? props.container : undefined" :data-disabled="props.disabled ? '' : undefined" :data-placement="placement.ready.value ? 'ready' : 'pending'" data-sw-portal-placement="framework" data-floating-root data-sw-part="${facts.parts.portal.name}"><slot /></${facts.parts.portal.defaultElement}>
  </Teleport>
</template>
`;
}

function printFloatingPart(
  facts: AdapterTimedFloatingOverlayFacts,
  partName: "popup" | "positioner",
): string {
  const part = facts.parts[partName];
  const role = partName === "popup" ? `\n    role="${facts.popupRole}"` : "";
  const hidden = partName === "popup" ? `\n    ${facts.attrs.popupHidden}` : "";
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { type HTMLAttributes, ref } from "vue";
defineOptions({ inheritAttrs: false });
type NativeElementProps = /* @vue-ignore */ HTMLAttributes;
const props = withDefaults(defineProps<{
  ${facts.props.side.name}?: ${facts.props.side.type};
  ${facts.props.align.name}?: ${facts.props.align.type};
  ${facts.props.sideOffset.name}?: number;
  ${facts.props.avoidCollisions.name}?: boolean;
} & NativeElementProps>(), {
  ${facts.props.side.name}: ${facts.props.side.defaultValue},
  ${facts.props.align.name}: ${facts.props.align.defaultValue},
  ${facts.props.sideOffset.name}: ${facts.props.sideOffset.defaultValue},
  ${facts.props.avoidCollisions.name}: ${facts.props.avoidCollisions.defaultValue},
});
defineSlots<{ default?: () => unknown }>();
const element = ref<HTMLElement | null>(null);
defineExpose({ element });
</script>
<template>
  <${part.defaultElement}
    ref="element"
    v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}"
    ${facts.attrs[partName]}
    data-sw-part="${part.name}"
    ${facts.attrs[`${partName}State`]}="closed"
    :${facts.attrs.side}="props.${facts.props.side.name}"
    :${facts.attrs.align}="props.${facts.props.align.name}"
    :${facts.attrs.sideOffset}="props.${facts.props.sideOffset.name}"
    :${facts.attrs.avoidCollisions}="props.${facts.props.avoidCollisions.name} ? 'true' : 'false'"${role}${hidden}
  ><slot /></${part.defaultElement}>
</template>
`;
}

function printSimplePart(
  facts: AdapterTimedFloatingOverlayFacts,
  partName: Exclude<
    AdapterTimedFloatingOverlayPartName,
    "popup" | "portal" | "positioner" | "root" | "trigger"
  >,
): string {
  const part = requirePart(facts, partName);
  const discovery = requireFact(facts.attrs[partName], `${partName} discovery attribute`);
  const extras =
    partName === "arrow"
      ? `${facts.attrs.arrowState}="closed"`
      : partName === "backdrop"
        ? `${requireFact(facts.attrs.backdropState, "backdrop state")}="closed" ${requireFact(facts.attrs.backdropHidden, "backdrop hidden")}`
        : `${requireFact(facts.attrs.viewportState, "viewport state")}="closed"`;
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { type HTMLAttributes, ref } from "vue";
defineOptions({ inheritAttrs: false });
type NativeElementProps = /* @vue-ignore */ HTMLAttributes;
defineProps<NativeElementProps>();
defineSlots<{ default?: () => unknown }>();
const element = ref<HTMLElement | null>(null);
defineExpose({ element });
</script>
<template><${part.defaultElement} ref="element" v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}" ${discovery} data-sw-part="${part.name}" ${extras}><slot /></${part.defaultElement}></template>
`;
}

function requirePart(
  facts: AdapterTimedFloatingOverlayFacts,
  part: "arrow" | "backdrop" | "viewport",
) {
  const value = facts.parts[part];
  if (!value) throw new TypeError(`${facts.displayName} requires ${part} part facts.`);
  return value;
}

function requireFact(value: string | undefined, context: string): string {
  if (!value) throw new TypeError(`Vue timed-floating-overlay requires ${context}.`);
  return value;
}

function printOptions(options: Record<string, boolean | number | string> | undefined): string {
  if (!options || Object.keys(options).length === 0) return "";
  return `, { ${Object.entries(options)
    .map(([name, value]) => `${name}: ${JSON.stringify(value)}`)
    .join(", ")} }`;
}
