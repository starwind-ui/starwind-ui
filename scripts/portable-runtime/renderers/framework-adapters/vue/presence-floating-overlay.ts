import type {
  AdapterComponentFile,
  AdapterIndexFile,
  AdapterPresenceFloatingOverlayFacts,
  AdapterPrintedFile,
} from "../types.js";
import { printVueFamilyIndex, VUE_NON_SHIPPING_COMMENT } from "./primitive/shared-fragments.js";

export function printVuePresenceFloatingOverlayIndex(file: AdapterIndexFile): AdapterPrintedFile {
  return printVueFamilyIndex(file, "presence-floating-overlay");
}

export function printVuePresenceFloatingOverlayComponent(
  file: AdapterComponentFile,
): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "presence-floating-overlay") {
    throw new TypeError(
      "Vue presence-floating-overlay projection requires a presence-floating-overlay component model.",
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
            : part === "backdrop"
              ? printBackdrop(facts)
              : part === "close"
                ? printClose(facts)
                : printSimplePart(facts, part);

  return { contents, path: `${file.path}.vue` };
}

function printRoot(facts: AdapterPresenceFloatingOverlayFacts): string {
  const { closeComplete, openChange } = facts.events;
  const {
    closeDelay,
    closeOnEscape,
    closeOnOutsideInteract,
    defaultOpen,
    modal,
    open,
    openOnHover,
  } = facts.props;
  const setterOptions = printOptions(facts.setter.options);
  const contextName = `${facts.displayName}Context`;

  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script lang="ts">
import type { InjectionKey, Ref } from "vue";

export type ${facts.displayName}ContextValue = {
  mounted: Readonly<Ref<boolean>>;
  registerPortal: (owner: symbol, element: HTMLElement | null) => void;
};

export const ${contextName}: InjectionKey<${facts.displayName}ContextValue> = Symbol("${contextName}");
</script>

<script setup lang="ts">
import {
  type ${closeComplete.detailsType},
  type ${openChange.detailsType},
  ${facts.runtime.factory},
} from "${facts.runtime.importSource}";
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, useAttrs, watch } from "vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    ${defaultOpen.name}?: boolean;
    ${open.name}?: boolean;
    ${closeOnEscape.name}?: boolean;
    ${closeOnOutsideInteract.name}?: boolean;
    ${modal.name}?: boolean;
    ${openOnHover.name}?: boolean;
    ${closeDelay.name}?: number;
  }>(),
  {
    ${defaultOpen.name}: ${defaultOpen.defaultValue},
    ${open.name}: undefined,
    ${closeOnEscape.name}: ${closeOnEscape.defaultValue},
    ${closeOnOutsideInteract.name}: ${closeOnOutsideInteract.defaultValue},
    ${modal.name}: ${modal.defaultValue},
    ${openOnHover.name}: ${openOnHover.defaultValue},
    ${closeDelay.name}: ${closeDelay.defaultValue},
  },
);
const emit = defineEmits<{
  ${closeComplete.name}: [detail: ${closeComplete.detailsType}];
  ${openChange.name}: [open: boolean, detail: ${openChange.detailsType}];
  "update:${open.name}": [open: boolean];
}>();
defineSlots<{ default?: () => unknown }>();
const attrs = useAttrs();
const rootRef = ref<HTMLDivElement | null>(null);
const initialDefaultOpen = props.${defaultOpen.name};
const uncontrolledOpen = ref(initialDefaultOpen);
const renderedOpen = computed(() => props.${open.name} ?? uncontrolledOpen.value);
const mounted = ref(false);
let instance: ReturnType<typeof ${facts.runtime.factory}> | undefined;
let portalOwner: symbol | undefined;
let runtimeGeneration = 0;

provide(${contextName}, {
  mounted,
  registerPortal(owner, element) {
    if (element) {
      portalOwner = owner;
      return;
    }
    if (portalOwner === owner) portalOwner = undefined;
  },
});

defineExpose({ element: rootRef });

function handleOpenChange(nextOpen: boolean, detail: ${openChange.detailsType}): void {
  const eventWasControlled = props.${open.name} !== undefined;
  emit("${openChange.name}", nextOpen, detail);
  if (detail.isCanceled) return;

  if (!eventWasControlled) uncontrolledOpen.value = nextOpen;
  emit("update:${open.name}", nextOpen);
}

function handleCloseComplete(detail: ${closeComplete.detailsType}): void {
  emit("${closeComplete.name}", detail);
}

function destroyOwnedInstance(): void {
  const ownedInstance = instance;
  if (!ownedInstance) return;

  if (instance === ownedInstance) instance = undefined;
  ownedInstance.destroy();
}

function setupRuntime(recreatedOpen?: boolean): void {
  const recreating = recreatedOpen !== undefined || instance !== undefined;
  const acceptedOpen = recreatedOpen ?? instance?.${facts.state.getter}() ?? renderedOpen.value;
  destroyOwnedInstance();
  const element = rootRef.value;
  if (!element) return;

  if (props.${open.name} === undefined) uncontrolledOpen.value = acceptedOpen;
  instance = ${facts.runtime.factory}(element, {
    ${defaultOpen.name}: recreating ? false : acceptedOpen,
    ${closeOnEscape.name}: props.${closeOnEscape.name},
    ${closeOnOutsideInteract.name}: props.${closeOnOutsideInteract.name},
    ${modal.name}: props.${modal.name},
    ${openOnHover.name}: props.${openOnHover.name},
    ${closeComplete.callbackProp}: handleCloseComplete,
    ${openChange.callbackProp}: handleOpenChange,
    ...(props.${open.name} === undefined
      ? {}
      : { ${open.name}: recreating ? false : props.${open.name} }),
  });

  if (recreating && acceptedOpen) {
    instance.${facts.setter.method}(true${setterOptions});
  }
}

async function recreateRuntime(): Promise<void> {
  const generation = ++runtimeGeneration;
  const acceptedOpen = instance?.${facts.state.getter}() ?? renderedOpen.value;
  destroyOwnedInstance();
  mounted.value = false;
  await nextTick();
  if (generation !== runtimeGeneration) return;
  setupRuntime(acceptedOpen);
  mounted.value = true;
}

onMounted(() => {
  setupRuntime();
  mounted.value = true;
});

watch(
  () => props.${open.name},
  (nextOpen, previousOpen) => {
    const controllednessChanged = (nextOpen === undefined) !== (previousOpen === undefined);
    if (controllednessChanged) {
      void recreateRuntime();
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
  [
    () => props.${closeOnEscape.name},
    () => props.${closeOnOutsideInteract.name},
    () => props.${modal.name},
    () => props.${openOnHover.name},
  ],
  () => {
    void recreateRuntime();
  },
  { flush: "post" },
);

onBeforeUnmount(() => {
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
    :${facts.attrs.rootCloseOnEscape}="props.${closeOnEscape.name} ? 'true' : 'false'"
    :${facts.attrs.rootCloseOnOutsideInteract}="props.${closeOnOutsideInteract.name} ? 'true' : 'false'"
    :${facts.attrs.rootModal}="props.${modal.name} ? 'true' : 'false'"
    :${facts.attrs.rootOpenOnHover}="props.${openOnHover.name} ? 'true' : undefined"
    :${facts.attrs.rootCloseDelay}="props.${closeDelay.name}"
    :${facts.attrs.rootState}="renderedOpen ? 'open' : 'closed'"
  >
    <slot />
  </${facts.parts.root.defaultElement}>
</template>
`;
}

function printTrigger(facts: AdapterPresenceFloatingOverlayFacts): string {
  const part = facts.parts.trigger;
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import {
  cloneVNode,
  defineComponent,
  isVNode,
  mergeProps,
  ref,
  useAttrs,
  type ComponentPublicInstance,
  type VNode,
} from "vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<{ ${facts.props.asChild.name}?: boolean }>(), {
  ${facts.props.asChild.name}: false,
});
const slots = defineSlots<{ default?: () => VNode[] }>();
const attrs = useAttrs();
const element = ref<HTMLElement | null>(null);

defineExpose({ element });

function setElement(value: Element | ComponentPublicInstance | null): void {
  element.value = value instanceof HTMLElement ? value : null;
}

const AsChildTrigger = defineComponent({
  inheritAttrs: false,
  setup() {
    return () => {
      const children = slots.default?.() ?? [];
      const child = children[0];
      if (children.length !== 1 || !isNativeElementVNode(child)) {
        throw new TypeError(
          "${facts.exports.trigger} asChild requires exactly one native element VNode.",
        );
      }

      const defaultedProps =
        child.type === "button" && child.props?.type === undefined && attrs.type === undefined
          ? { type: "button" }
          : {};
      const protectedProps = {
        "${facts.attrs.trigger}": "",
        "${facts.attrs.triggerAriaHaspopup}": "dialog",
        "${facts.attrs.triggerAriaExpanded}": "false",
        "${facts.attrs.triggerState}": "closed",
        "data-as-child": "",
        "data-sw-part": "${part.name}",
        ref: setElement,
      };
      return cloneVNode(child, mergeProps(defaultedProps, attrs, protectedProps), true);
    };
  },
});

function isNativeElementVNode(value: unknown): value is VNode & { type: string } {
  return isVNode(value) && typeof value.type === "string";
}
</script>

<template>
  <AsChildTrigger v-if="props.${facts.props.asChild.name}" />
  <${part.defaultElement}
    v-else
    :ref="setElement"
    v-bind="attrs"
    ${facts.attrs.trigger}
    data-sw-part="${part.name}"
    ${facts.attrs.triggerType}="button"
    ${facts.attrs.triggerAriaHaspopup}="dialog"
    ${facts.attrs.triggerAriaExpanded}="false"
    ${facts.attrs.triggerState}="closed"
  >
    <slot />
  </${part.defaultElement}>
</template>
`;
}

function printPortal(facts: AdapterPresenceFloatingOverlayFacts): string {
  const part = facts.parts.portal;
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { inject, onBeforeUnmount, onMounted, ref, useAttrs } from "vue";
import { ${facts.displayName}Context } from "./${facts.exports.root}.vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{ container?: string | HTMLElement; disabled?: boolean }>(),
  { container: "body", disabled: false },
);
defineSlots<{ default?: () => unknown }>();
const attrs = useAttrs();
const root = inject(${facts.displayName}Context);
if (!root) throw new TypeError("${facts.exports.portal} must be nested inside ${facts.exports.root}.");
const owner = Symbol("${facts.exports.portal}");
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
      ${facts.attrs.portal}
      data-sw-part="${part.name}"
    >
      <slot />
    </${part.defaultElement}>
  </Teleport>
</template>
`;
}

function printFloatingPart(
  facts: AdapterPresenceFloatingOverlayFacts,
  partName: "popup" | "positioner",
): string {
  const part = facts.parts[partName];
  const hidden = partName === "popup" ? `\n    ${facts.attrs.popupHidden}` : "";
  const semantics =
    partName === "popup"
      ? `\n    ${facts.attrs.popupRole}="${facts.parts.popup.role}"\n    :${facts.attrs.popupTabIndex.toLowerCase()}="-1"`
      : "";
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { type HTMLAttributes, ref, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

type NativeElementProps = /* @vue-ignore */ HTMLAttributes;
const props = withDefaults(
  defineProps<{
    ${facts.props.side.name}?: ${facts.props.side.type};
    ${facts.props.align.name}?: ${facts.props.align.type};
    ${facts.props.sideOffset.name}?: number;
    ${facts.props.avoidCollisions.name}?: boolean;
    ${facts.props.collisionStrategy.name}?: ${facts.props.collisionStrategy.type};
  } & NativeElementProps>(),
  {
    ${facts.props.side.name}: ${facts.props.side.defaultValue},
    ${facts.props.align.name}: ${facts.props.align.defaultValue},
    ${facts.props.sideOffset.name}: ${facts.props.sideOffset.defaultValue},
    ${facts.props.avoidCollisions.name}: ${facts.props.avoidCollisions.defaultValue},
    ${facts.props.collisionStrategy.name}: ${facts.props.collisionStrategy.defaultValue},
  },
);
defineSlots<{ default?: () => unknown }>();
const attrs = useAttrs();
const element = ref<HTMLDivElement | null>(null);

defineExpose({ element });
</script>

<template>
  <${part.defaultElement}
    ref="element"
    v-bind="attrs"
    ${facts.attrs[partName]}
    data-sw-part="${part.name}"
    ${facts.attrs[`${partName}State`]}="closed"
    :${facts.attrs.floatingSide}="props.${facts.props.side.name}"
    :${facts.attrs.floatingAlign}="props.${facts.props.align.name}"
    :${facts.attrs.floatingSideOffset}="props.${facts.props.sideOffset.name}"
    :${facts.attrs.floatingAvoidCollisions}="props.${facts.props.avoidCollisions.name} ? 'true' : 'false'"
    :${facts.attrs.floatingCollisionStrategy}="props.${facts.props.collisionStrategy.name}"${semantics}${hidden}
  >
    <slot />
  </${part.defaultElement}>
</template>
`;
}

function printBackdrop(facts: AdapterPresenceFloatingOverlayFacts): string {
  return printPart(facts, "backdrop", [
    `${facts.attrs.backdropState}="closed"`,
    facts.attrs.backdropHidden,
  ]);
}

function printClose(facts: AdapterPresenceFloatingOverlayFacts): string {
  return printPart(facts, "close", [`${facts.attrs.closeType}="button"`]);
}

function printSimplePart(
  facts: AdapterPresenceFloatingOverlayFacts,
  partName: "arrow" | "description" | "title" | "viewport",
): string {
  return printPart(facts, partName, []);
}

function printPart(
  facts: AdapterPresenceFloatingOverlayFacts,
  partName: "arrow" | "backdrop" | "close" | "description" | "title" | "viewport",
  extraAttrs: string[],
): string {
  const part = facts.parts[partName];
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { type HTMLAttributes, ref, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

type NativeElementProps = /* @vue-ignore */ HTMLAttributes;
defineProps<NativeElementProps>();
defineSlots<{ default?: () => unknown }>();
const attrs = useAttrs();
const element = ref<HTMLElement | null>(null);

defineExpose({ element });
</script>

<template>
  <${part.defaultElement}
    ref="element"
    v-bind="attrs"
    ${facts.attrs[partName]}
    data-sw-part="${part.name}"
    ${extraAttrs.join("\n    ")}
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
