import type {
  AdapterComponentFile,
  AdapterIndexFile,
  AdapterNativeOverlayFacts,
  AdapterPrintedFile,
} from "../types.js";
import { printVueFamilyIndex, VUE_NON_SHIPPING_COMMENT } from "./primitive/shared-fragments.js";

export function printVueNativeOverlayIndex(file: AdapterIndexFile): AdapterPrintedFile {
  return printVueFamilyIndex(file, "native-overlay");
}

export function printVueNativeOverlayComponent(file: AdapterComponentFile): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "native-overlay") {
    throw new TypeError("Vue native-overlay projection requires a native-overlay component model.");
  }

  const { facts, part } = family;
  const contents =
    part === "root"
      ? printRoot(facts)
      : part === "trigger"
        ? printTrigger(facts)
        : part === "backdrop"
          ? printBackdrop(facts)
          : part === "popup"
            ? printPopup(facts)
            : part === "close"
              ? printClose(facts)
              : part === "title" || part === "description"
                ? printSimplePart(facts, part)
                : part === "portal"
                  ? printPortal(facts)
                  : printOptionalSimplePart(facts, part);

  return { contents, path: `${file.path}.vue` };
}

function printRoot(facts: AdapterNativeOverlayFacts): string {
  const defaultOpen = facts.props.defaultOpen.name;
  const open = facts.props.open.name;
  const closeOnEscape = facts.props.closeOnEscape.name;
  const closeOnOutsideInteract = facts.props.closeOnOutsideInteract.name;
  const modal = facts.props.modal.name;
  const openEvent = facts.events.openChange;
  const closeCompleteEvent = facts.events.closeComplete;
  const setterOptions = printOptions(facts.setter.options);
  const hasPortal = Boolean(facts.parts.portal);
  const contextName = `${facts.displayName}Context`;
  const contextPrelude = hasPortal
    ? `<script lang="ts">
import type { InjectionKey, Ref } from "vue";

export type ${facts.displayName}ContextValue = {
  mounted: Readonly<Ref<boolean>>;
  registerPortal: (owner: symbol, element: HTMLElement | null) => void;
};

export const ${contextName}: InjectionKey<${facts.displayName}ContextValue> = Symbol("${contextName}");
</script>

`
    : "";
  const vueImports = hasPortal
    ? "computed, nextTick, onBeforeUnmount, onMounted, provide, ref, useAttrs, watch"
    : "computed, onBeforeUnmount, onMounted, ref, useAttrs, watch";
  const portalSetup = hasPortal
    ? `const mounted = ref(false);
let portalOwner: symbol | undefined;
let runtimeGeneration = 0;

provide(${contextName}, {
  mounted,
  registerPortal(owner, element) {
    if (element) {
      portalOwner = owner;
      return;
    }
    if (portalOwner === owner) {
      portalOwner = undefined;
    }
  },
});
`
    : "";
  const mountSetup = hasPortal
    ? `onMounted(() => {
  setupRuntime();
  mounted.value = true;
});`
    : "onMounted(setupRuntime);";
  const recreateRuntime = hasPortal
    ? `async function recreateRuntime(): Promise<void> {
  const generation = ++runtimeGeneration;
  const acceptedOpen = instance?.${facts.state.getter}() ?? renderedOpen.value;
  destroyOwnedInstance();
  mounted.value = false;
  await nextTick();
  if (generation !== runtimeGeneration) return;
  setupRuntime(acceptedOpen);
  mounted.value = true;
}
`
    : "";
  const recreateCall = hasPortal ? "void recreateRuntime();" : "setupRuntime();";
  const unmount = hasPortal
    ? `onBeforeUnmount(() => {
  runtimeGeneration += 1;
  mounted.value = false;
  portalOwner = undefined;
  destroyOwnedInstance();
});`
    : "onBeforeUnmount(destroyOwnedInstance);";
  const optionWatchHandler = hasPortal
    ? `() => {
    void recreateRuntime();
  }`
    : "setupRuntime";
  const setupRuntimeParameter = hasPortal ? "recreatedOpen?: boolean" : "";
  const recreationState = hasPortal
    ? "const recreating = recreatedOpen !== undefined || instance !== undefined;\n  "
    : "";
  const acceptedOpenExpression = hasPortal
    ? `recreatedOpen ?? instance?.${facts.state.getter}() ?? renderedOpen.value`
    : `instance?.${facts.state.getter}() ?? renderedOpen.value`;
  const constructorOpen = hasPortal ? "recreating ? false : acceptedOpen" : "acceptedOpen";
  const controlledConstructorOpen = hasPortal ? "recreating ? false : props.open" : `props.${open}`;
  const restoreRecreatedOpen = hasPortal
    ? `
  if (recreating && acceptedOpen) {
    instance.${facts.setter.method}(true${setterOptions});
  }`
    : "";
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
${contextPrelude}<script setup lang="ts">
import {
  type ${closeCompleteEvent.detailsType},
  type ${openEvent.detailsType},
  ${facts.runtime.factory},
} from "${facts.runtime.importSource}";
import { ${vueImports} } from "vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    ${defaultOpen}?: boolean;
    ${open}?: boolean;
    ${closeOnEscape}?: boolean;
    ${closeOnOutsideInteract}?: boolean;
    ${modal}?: boolean;
  }>(),
  {
    ${defaultOpen}: ${facts.props.defaultOpen.defaultValue},
    ${open}: undefined,
    ${closeOnEscape}: ${facts.props.closeOnEscape.defaultValue},
    ${closeOnOutsideInteract}: ${facts.props.closeOnOutsideInteract.defaultValue},
    ${modal}: ${facts.props.modal.defaultValue},
  },
);
const emit = defineEmits<{
  ${closeCompleteEvent.name}: [detail: ${closeCompleteEvent.detailsType}];
  ${openEvent.name}: [open: boolean, detail: ${openEvent.detailsType}];
  "update:${open}": [open: boolean];
}>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const rootRef = ref<HTMLDivElement | null>(null);
const initialDefaultOpen = props.${defaultOpen};
const uncontrolledOpen = ref(initialDefaultOpen);
const renderedOpen = computed(() => props.${open} ?? uncontrolledOpen.value);
let instance: ReturnType<typeof ${facts.runtime.factory}> | undefined;
${portalSetup}

defineExpose({
  element: rootRef,
});

function handleOpenChange(nextOpen: boolean, detail: ${openEvent.detailsType}): void {
  const eventWasControlled = props.${open} !== undefined;
  emit("${openEvent.name}", nextOpen, detail);
  if (detail.isCanceled) return;

  if (!eventWasControlled) uncontrolledOpen.value = nextOpen;
  emit("update:${open}", nextOpen);
}

function handleCloseComplete(detail: ${closeCompleteEvent.detailsType}): void {
  emit("${closeCompleteEvent.name}", detail);
}

function destroyOwnedInstance(): void {
  const ownedInstance = instance;
  if (!ownedInstance) return;

  if (instance === ownedInstance) instance = undefined;
  ownedInstance.destroy();
}

function setupRuntime(${setupRuntimeParameter}): void {
  ${recreationState}const acceptedOpen = ${acceptedOpenExpression};
  destroyOwnedInstance();
  const element = rootRef.value;
  if (!element) return;

  if (props.${open} === undefined) uncontrolledOpen.value = acceptedOpen;
  instance = ${facts.runtime.factory}(element, {
    ${defaultOpen}: ${constructorOpen},
    ${closeOnEscape}: props.${closeOnEscape},
    ${closeOnOutsideInteract}: props.${closeOnOutsideInteract},
    ${modal}: props.${modal},
    ${closeCompleteEvent.callbackProp}: handleCloseComplete,
    ${openEvent.callbackProp}: handleOpenChange,
    ...(props.${open} === undefined ? {} : { ${open}: ${controlledConstructorOpen} }),
  });
${restoreRecreatedOpen}
}

${recreateRuntime}${mountSetup}

watch(
  () => props.${open},
  (nextOpen, previousOpen) => {
    const controllednessChanged = (nextOpen === undefined) !== (previousOpen === undefined);
    if (controllednessChanged) {
      ${recreateCall}
      return;
    }
    if (nextOpen === undefined || !instance || Object.is(instance.${facts.state.getter}(), nextOpen)) {
      return;
    }

    instance.${facts.setter.method}(nextOpen${setterOptions});
  },
  { flush: "post" },
);
watch(
  [() => props.${closeOnEscape}, () => props.${closeOnOutsideInteract}, () => props.${modal}],
  ${optionWatchHandler},
  { flush: "post" },
);

${unmount}
</script>

<template>
  <${facts.parts.root.defaultElement}
    ref="rootRef"
    v-bind="attrs"
    ${facts.attrs.root}
    data-sw-part="${facts.parts.root.name}"
    :${facts.attrs.defaultOpen}="initialDefaultOpen ? 'true' : undefined"
    :${facts.attrs.closeOnEscape}="props.${closeOnEscape} ? 'true' : 'false'"
    :${facts.attrs.closeOnOutsideInteract}="props.${closeOnOutsideInteract} ? 'true' : 'false'"
    :${facts.attrs.modal}="props.${modal} ? 'true' : 'false'"
    :${facts.attrs.rootState}="renderedOpen ? 'open' : 'closed'"
  >
    <slot />
  </${facts.parts.root.defaultElement}>
</template>
`;
}

function printPortal(facts: AdapterNativeOverlayFacts): string {
  const part = facts.parts.portal;
  const discoveryAttribute = facts.attrs.portal;
  const exportName = facts.exports.portal;
  if (!part || !discoveryAttribute || !exportName) {
    throw new Error(`${facts.displayName} native-overlay adapter cannot print portal.`);
  }

  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { inject, onBeforeUnmount, onMounted, ref, useAttrs } from "vue";
import { ${facts.displayName}Context } from "./${facts.exports.root}.vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    container?: string | HTMLElement;
    disabled?: boolean;
  }>(),
  {
    container: "body",
    disabled: false,
  },
);
defineSlots<{ default?: () => unknown }>();
const attrs = useAttrs();
const root = inject(${facts.displayName}Context);
if (!root) throw new TypeError("${exportName} must be nested inside ${facts.exports.root}.");
const owner = Symbol("${exportName}");
const element = ref<HTMLDivElement | null>(null);

onMounted(() => root.registerPortal(owner, element.value));
onBeforeUnmount(() => root.registerPortal(owner, null));

defineExpose({ element });
</script>

<template>
  <Teleport :to="props.container" :disabled="props.disabled || !root.mounted.value">
    <${part.defaultElement}
      ref="element"
      v-bind="attrs"
      ${discoveryAttribute}
      data-sw-part="${part.name}"
    >
      <slot />
    </${part.defaultElement}>
  </Teleport>
</template>
`;
}

function printTrigger(facts: AdapterNativeOverlayFacts): string {
  const part = facts.parts.trigger;
  const targetId = facts.props.targetId.name;

  return printPart({
    attrs: [
      `${facts.attrs.trigger}`,
      `data-sw-part="${part.name}"`,
      `${facts.attrs.triggerType}="button"`,
      `${facts.attrs.triggerAriaHaspopup}="dialog"`,
      `:${facts.attrs.targetId}="props.${targetId}"`,
      `${facts.attrs.triggerState}="closed"`,
    ],
    elementType: "HTMLButtonElement",
    exportName: facts.exports.trigger,
    part,
    props: `${targetId}?: ${facts.props.targetId.type};`,
  });
}

function printBackdrop(facts: AdapterNativeOverlayFacts): string {
  return printPart({
    attrs: [
      facts.attrs.backdrop,
      `data-sw-part="${facts.parts.backdrop.name}"`,
      `${facts.attrs.backdropState}="closed"`,
      facts.attrs.backdropHidden,
    ],
    elementType: "HTMLDivElement",
    exportName: facts.exports.backdrop,
    part: facts.parts.backdrop,
  });
}

function printPopup(facts: AdapterNativeOverlayFacts): string {
  const sideProp = facts.props.side;
  const props = sideProp ? `${sideProp.name}?: ${sideProp.type};` : undefined;
  const sideAttribute =
    sideProp && facts.attrs.popupSide
      ? `:${facts.attrs.popupSide}='props.${sideProp.name} ?? ${facts.sideDefault}'`
      : undefined;

  return printPart({
    attrs: [
      facts.attrs.popup,
      `data-sw-part="${facts.parts.popup.name}"`,
      facts.attrs.popupRole && facts.popupRoleValue
        ? `${facts.attrs.popupRole}="${facts.popupRoleValue}"`
        : undefined,
      `${facts.attrs.popupState}="closed"`,
      sideAttribute,
    ],
    elementType: "HTMLDialogElement",
    exportName: facts.exports.popup,
    part: facts.parts.popup,
    props,
  });
}

function printClose(facts: AdapterNativeOverlayFacts): string {
  return printPart({
    attrs: [
      facts.attrs.close,
      `data-sw-part="${facts.parts.close.name}"`,
      `${facts.attrs.closeType}="button"`,
    ],
    elementType: "HTMLButtonElement",
    exportName: facts.exports.close,
    part: facts.parts.close,
  });
}

function printSimplePart(
  facts: AdapterNativeOverlayFacts,
  partName: "description" | "title",
): string {
  const part = facts.parts[partName];
  return printPart({
    attrs: [facts.attrs[partName], `data-sw-part="${part.name}"`],
    elementType: partName === "title" ? "HTMLHeadingElement" : "HTMLParagraphElement",
    exportName: facts.exports[partName],
    part,
  });
}

function printOptionalSimplePart(
  facts: AdapterNativeOverlayFacts,
  partName: "portal" | "viewport",
): string {
  const part = facts.parts[partName];
  const discoveryAttribute = facts.attrs[partName];
  const exportName = facts.exports[partName];
  if (!part || !discoveryAttribute || !exportName) {
    throw new Error(`${facts.displayName} native-overlay adapter cannot print ${partName}.`);
  }

  return printPart({
    attrs: [discoveryAttribute, `data-sw-part="${part.name}"`],
    elementType: "HTMLDivElement",
    exportName,
    part,
  });
}

function printPart({
  attrs,
  elementType,
  exportName,
  part,
  props,
}: {
  attrs: Array<string | undefined>;
  elementType: string;
  exportName: string;
  part: { defaultElement: string; name: string };
  props?: string;
}): string {
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { type HTMLAttributes, ref, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

type NativeElementProps = /* @vue-ignore */ HTMLAttributes;
${props ? `const props = defineProps<{ ${props} } & NativeElementProps>();` : "defineProps<NativeElementProps>();"}
defineSlots<{ default?: () => unknown }>();
const attrs = useAttrs();
const element = ref<${elementType} | null>(null);

defineExpose({ element });
</script>

<template>
  <${part.defaultElement}
    ref="element"
    v-bind="attrs"
    ${attrs.filter(Boolean).join("\n    ")}
  >
    <slot />
  </${part.defaultElement}>
</template>
`;
}

function printOptions(options: Record<string, boolean | number | string> | undefined): string {
  if (!options || Object.keys(options).length === 0) return "";
  const fields = Object.entries(options)
    .map(([name, value]) => `${name}: ${JSON.stringify(value)}`)
    .join(", ");
  return `, { ${fields} }`;
}
