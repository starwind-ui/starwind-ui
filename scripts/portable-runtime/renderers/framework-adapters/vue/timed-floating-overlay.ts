import { partAttributes } from "../../shared-recipes/structured/part-policy.js";
import { renderTimedRoot } from "../../shared-recipes/structured/timed/frame.js";
import {
  timedPartPolicy,
  timedPlacementInputs,
  timedTriggerPolicy,
} from "../../shared-recipes/structured/timed/recipe.js";
import { getVueAcceptedModelEvent } from "./accepted-model-publication.js";
import { projectVueAttributeAccess } from "./public-contract.js";

const VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS = projectVueAttributeAccess([]);

import type {
  AdapterComponentFile,
  AdapterIndexFile,
  AdapterPrintedFile,
  AdapterTimedFloatingOverlayFacts,
  AdapterTimedFloatingOverlayPartName,
} from "../types.js";
import { printVueFamilyIndex } from "./primitive/shared-fragments.js";

export function printVueTimedFloatingOverlayIndex(file: AdapterIndexFile): AdapterPrintedFile {
  if (file.family?.kind !== "timed-floating-overlay")
    throw new TypeError("Timed Vue index requires timed facts");
  const facts = file.family.facts;
  return printVueFamilyIndex(
    {
      ...file,
      exports: {
        ...file.exports,
        members: [
          ...file.exports.members,
          ...facts.index.typeExports.map((name) => ({
            name,
            from: facts.runtime.typeImportSource,
            kind: "type" as const,
          })),
        ],
      },
    },
    "timed-floating-overlay",
  );
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
      ? printRoot(facts, getVueAcceptedModelEvent(file, "open"))
      : part === "trigger"
        ? printTrigger(facts)
        : part === "portal"
          ? printPortal(facts)
          : part === "positioner" || part === "popup"
            ? printFloatingPart(facts, part)
            : printSimplePart(facts, part);
  return { contents, path: `${file.path}.vue` };
}

function printRoot(facts: AdapterTimedFloatingOverlayFacts, _acceptedEvent: string): string {
  return renderTimedRoot("vue", facts);
}

function printTrigger(facts: AdapterTimedFloatingOverlayFacts): string {
  const anchor = facts.trigger.triggerKind === "anchor";
  const closeDelay = anchor
    ? requireFact(facts.attrs.triggerCloseDelay, "trigger close delay")
    : "";
  const openDelay = anchor ? requireFact(facts.attrs.triggerOpenDelay, "trigger open delay") : "";
  const nativeDisabled = facts.attrs.triggerNativeDisabled;
  return `<script setup lang="ts">
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
    "${facts.attrs.triggerState}": "${timedTriggerPolicy.state}",
${anchor ? `    "${closeDelay}": props.${facts.props.closeDelay.name},\n    "${openDelay}": props.${facts.props.openDelay.name},\n    ...(props.${facts.props.disabled.name} ? { href: undefined, tabindex: -1 } : {}),\n    onClick: handleClick,\n` : nativeDisabled ? `    "${nativeDisabled}": props.${facts.props.disabled.name},\n` : ""}    "data-sw-part": "${facts.parts.trigger.name}",
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
    ${facts.attrs.triggerState}="${timedTriggerPolicy.state}"
${anchor ? `    :${closeDelay}="props.${facts.props.closeDelay.name}"\n    :${openDelay}="props.${facts.props.openDelay.name}"\n    :href="props.${facts.props.disabled.name} ? undefined : (attrs.href as string | undefined)"\n    :tabindex="props.${facts.props.disabled.name} ? -1 : (attrs.tabindex as number | undefined)"\n    @click="handleClick"\n` : `    type="button"\n    :disabled="props.${facts.props.disabled.name}"\n`}  >
    <slot />
  </${facts.trigger.renderedElement}>
</template>
`;
}

function printPortal(facts: AdapterTimedFloatingOverlayFacts): string {
  return `<script setup lang="ts">
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
    <${facts.parts.portal.defaultElement} ref="element" v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}" ${facts.attrs.portal} :data-container="typeof props.container === 'string' ? props.container : undefined" :data-disabled="props.disabled ? '' : undefined" :data-placement="placement.ready.value ? 'ready' : 'pending'" data-sw-portal-placement="framework" data-sw-part="${facts.parts.portal.name}"><slot /></${facts.parts.portal.defaultElement}>
  </Teleport>
</template>
`;
}

function printFloatingPart(
  facts: AdapterTimedFloatingOverlayFacts,
  partName: "positioner" | "popup",
): string {
  const inputs = timedPlacementInputs(facts),
    fields = inputs.map(([, name]) => facts.props[name as keyof typeof facts.props]);
  return `<script setup lang="ts">
import {inject,ref,watchEffect} from 'vue';
import {${facts.displayName}Context} from './${facts.exports.root}.vue';
defineOptions({inheritAttrs:false});
const props=withDefaults(defineProps<{${fields.map((p) => `${p.name}?:${p.type};`).join("")}}>(),{${fields.map((p) => `${p.name}:${p.defaultValue}`).join(", ")}});
defineSlots<{default?:()=>unknown}>();
const element=ref<HTMLDivElement|null>(null),owner=inject(${facts.displayName}Context,undefined);
watchEffect(onCleanup=>{const node=element.value;if(!node)return;owner?.registerPlacement(node,{${inputs.map(([attr, input]) => `${JSON.stringify(attr)}:String(props.${input})`).join(", ")}});onCleanup(()=>owner?.registerPlacement(node,null));},{flush:'post'});
defineExpose({element});
</script>
<template><div ref="element" v-bind="$attrs" ${partAttributes("vue", timedPartPolicy(facts, partName))}><slot/></div></template>`;
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
  return `<script setup lang="ts">
import { type HTMLAttributes, ref } from "vue";
defineOptions({ inheritAttrs: false });
type NativeElementProps = /* @vue-ignore */ HTMLAttributes;
defineProps<NativeElementProps>();
defineSlots<{ default?: () => unknown }>();
const element = ref<HTMLElement | null>(null);
defineExpose({ element });
</script>
<template><${part.defaultElement} ref="element" v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}" ${partAttributes("vue", timedPartPolicy(facts, partName))}><slot /></${part.defaultElement}></template>
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
