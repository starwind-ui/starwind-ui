import {
  controlAttributes,
  floatingInputs,
  partAttributes,
  popoverPartPolicy,
} from "../../shared-recipes/structured/part-policy.js";
import { renderRoot as renderSharedPopoverRoot } from "../../shared-recipes/structured/popover.js";
import { getVueAcceptedModelEvent } from "./accepted-model-publication.js";
import { projectVueAttributeAccess } from "./public-contract.js";

const VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS = projectVueAttributeAccess([]);

import type {
  AdapterComponentFile,
  AdapterIndexFile,
  AdapterPresenceFloatingOverlayFacts,
  AdapterPrintedFile,
} from "../types.js";
import { printVueFamilyIndex } from "./primitive/shared-fragments.js";

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
      ? printRoot(facts, getVueAcceptedModelEvent(file, "open"))
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

function printRoot(_facts: AdapterPresenceFloatingOverlayFacts, _acceptedEvent: string): string {
  return renderSharedPopoverRoot("vue");
}

function printTrigger(facts: AdapterPresenceFloatingOverlayFacts): string {
  const part = facts.parts.trigger;
  return `<script setup lang="ts">
import { defineComponent, ref, useAttrs, type VNode } from "vue";
import { createVueAsChild } from "../_internal/as-child";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<{ ${facts.props.asChild.name}?: boolean }>(), {
  ${facts.props.asChild.name}: false,
});
const slots = defineSlots<{ default?: () => VNode[] }>();
const attrs = useAttrs();
const element = ref<HTMLElement | null>(null);
const asChild = createVueAsChild("${facts.exports.trigger}", element);
const { setElement } = asChild;

defineExpose({ element });

const AsChildTrigger = defineComponent({
  inheritAttrs: false,
  setup() {
    return () => {
      const children = slots.default?.() ?? [];
      const protectedProps = {
${controlAttributes(popoverPartPolicy(facts, "trigger"))}
        "data-sw-part": "${part.name}",
      };
      return asChild.render({
        children,
        consumerProps: attrs,
        defaultNativeButtonType: "button",
        protectedProps,
      });
    };
  },
});
</script>

<template>
  <AsChildTrigger v-if="props.${facts.props.asChild.name}" />
  <${part.defaultElement}
    v-else
    :ref="setElement"
    v-bind="attrs"
    ${partAttributes("vue", popoverPartPolicy(facts, "trigger"))}
    data-sw-part="${part.name}"
  >
    <slot />
  </${part.defaultElement}>
</template>
`;
}

function printPortal(facts: AdapterPresenceFloatingOverlayFacts): string {
  const part = facts.parts.portal;
  return `<script setup lang="ts">
import { reportPortalPlacement, resolvePortalPlacement } from "${facts.runtime.importSource}";
import { inject, ref } from "vue";
import { useVuePortalPlacement } from "../_internal/portal";
import { ${facts.displayName}Context } from "./${facts.exports.root}.vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{ container?: string | HTMLElement; disabled?: boolean }>(),
  { disabled: false },
);
defineSlots<{ default?: () => unknown }>();
const root = inject(${facts.displayName}Context);
if (!root) throw new TypeError("${facts.exports.portal} must be nested inside ${facts.exports.root}.");
const element = ref<HTMLDivElement | null>(null);
const placement = useVuePortalPlacement({
  active: () => root.mounted.value,
  container: () => props.container,
  disabled: () => props.disabled,
  element,
  reference: () => root.element.value,
  runtime: { reportPortalPlacement, resolvePortalPlacement },
});


defineExpose({ element });
</script>

<template>
  <Teleport :to="placement.target.value" :disabled="placement.disabled.value">
    <${part.defaultElement}
      ref="element"
      v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}"
      ${facts.attrs.portal}
      :data-container="typeof props.container === 'string' ? props.container : undefined"
      :data-disabled="props.disabled ? '' : undefined"
      :data-placement="placement.ready.value ? 'ready' : 'pending'"
      data-sw-portal-placement="framework"
      data-floating-root
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
  return `<script setup lang="ts">
import { type HTMLAttributes, inject, ref, watchEffect } from "vue";
import { PopoverContext } from "./PopoverRoot.vue";

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
const element = ref<HTMLDivElement | null>(null);
const owner = inject(PopoverContext);
watchEffect(onCleanup => {
  const node = element.value;
  if (!node) return;
  owner?.registerPlacement(node, { ${floatingInputs(facts)
    .map(([name, input]) => `${JSON.stringify(name)}: String(props.${input})`)
    .join(", ")} });
  onCleanup(() => owner?.registerPlacement(node, null));
}, { flush: "post" });

defineExpose({ element });
</script>

<template>
  <${part.defaultElement}
    ref="element"
    v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}"
    ${partAttributes("vue", popoverPartPolicy(facts, partName))}
    data-sw-part="${part.name}"
  >
    <slot />
  </${part.defaultElement}>
</template>
`;
}

function printBackdrop(facts: AdapterPresenceFloatingOverlayFacts): string {
  return printPart(facts, "backdrop");
}

function printClose(facts: AdapterPresenceFloatingOverlayFacts): string {
  return printPart(facts, "close");
}

function printSimplePart(
  facts: AdapterPresenceFloatingOverlayFacts,
  partName: "arrow" | "description" | "title" | "viewport",
): string {
  return printPart(facts, partName);
}

function printPart(
  facts: AdapterPresenceFloatingOverlayFacts,
  partName: "arrow" | "backdrop" | "close" | "description" | "title" | "viewport",
): string {
  const part = facts.parts[partName];
  return `<script setup lang="ts">
import { type HTMLAttributes, ref } from "vue";

defineOptions({ inheritAttrs: false });

type NativeElementProps = /* @vue-ignore */ HTMLAttributes;
defineProps<NativeElementProps>();
defineSlots<{ default?: () => unknown }>();
const element = ref<HTMLElement | null>(null);

defineExpose({ element });
</script>

<template>
  <${part.defaultElement}
    ref="element"
    v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}"
    ${partAttributes("vue", popoverPartPolicy(facts, partName))}
    data-sw-part="${part.name}"
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
