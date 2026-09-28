import { renderCollapsibleRoot } from "../../shared-recipes/structured/disclosure/frame.js";
import {
  collapsibleParts,
  disclosureDisabled,
} from "../../shared-recipes/structured/disclosure/recipe.js";
import { projectVueAttributeAccess } from "./public-contract.js";

const VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS = projectVueAttributeAccess([]);

import type { AdapterComponentFile, AdapterIndexFile, AdapterPrintedFile } from "../types.js";
import { printVueFamilyIndex } from "./primitive/shared-fragments.js";

export function printVueDisclosurePresenceIndex(file: AdapterIndexFile): AdapterPrintedFile {
  return printVueFamilyIndex(file, "disclosure-presence");
}

export function printVueDisclosurePresenceComponent(
  file: AdapterComponentFile,
): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "disclosure-presence") {
    throw new TypeError(
      "Vue disclosure-presence projection requires a disclosure-presence component model.",
    );
  }

  const { facts, part } = family;
  const contents =
    part === "root"
      ? printRoot(facts)
      : part === "trigger"
        ? printTrigger(facts)
        : printPanel(facts);

  return { contents, path: `${file.path}.vue` };
}

function printRoot(
  _facts: Extract<
    NonNullable<AdapterComponentFile["component"]["family"]>,
    { kind: "disclosure-presence" }
  >["facts"],
): string {
  return renderCollapsibleRoot("vue");
}

function printTrigger(
  facts: Extract<
    NonNullable<AdapterComponentFile["component"]["family"]>,
    { kind: "disclosure-presence" }
  >["facts"],
): string {
  return `<script setup lang="ts">
import { defineComponent, inject, ref, useAttrs, type VNode } from "vue";
import { createVueAsChild } from "../_internal/as-child";
import { DisclosureDisabledContext } from "./${facts.exports.root}.vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<{ ${facts.props.asChild.name}?: boolean }>(), {
  ${facts.props.asChild.name}: false,
});
const slots = defineSlots<{ default?: () => VNode[] }>();
const attrs = useAttrs();
const disclosure = inject(DisclosureDisabledContext, undefined);
const element = ref<HTMLElement | null>(null);
const asChild = createVueAsChild("${facts.exports.trigger}", element);
const { setElement } = asChild;

defineExpose({ element });

const AsChildTrigger = defineComponent({
  inheritAttrs: false,
  setup() {
    return () => {
      const children = slots.default?.() ?? [];
      const disabled = ${disclosureDisabled("disclosure?.disabled", "attrs.disabled", "children[0]?.props?.disabled")};
      const protectedProps = {
        disabled,
        "data-disabled": disabled ? "" : undefined,
        "${facts.attrs.trigger}": "",
        "${facts.attrs.triggerExpanded}": "${collapsibleParts.trigger.expanded}",
        "${facts.attrs.triggerState}": "${collapsibleParts.trigger.state}",
        "data-sw-part": "${facts.parts.trigger.name}",
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
  <button
    v-else
    :ref="setElement"
    v-bind="attrs"
    ${facts.attrs.trigger}
    data-sw-part="${facts.parts.trigger.name}"
    type="button"
    :disabled="${disclosureDisabled("disclosure?.disabled", "attrs.disabled")}"
    :data-disabled="(${disclosureDisabled("disclosure?.disabled", "attrs.disabled")}) ? '' : undefined"
    ${facts.attrs.triggerExpanded}="${collapsibleParts.trigger.expanded}"
    ${facts.attrs.triggerState}="${collapsibleParts.trigger.state}"
  >
    <slot />
  </button>
</template>
`;
}

function printPanel(
  facts: Extract<
    NonNullable<AdapterComponentFile["component"]["family"]>,
    { kind: "disclosure-presence" }
  >["facts"],
): string {
  return `<script setup lang="ts">
import { ref } from "vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{ ${facts.props.hiddenUntilFound.name}?: boolean }>(),
  { ${facts.props.hiddenUntilFound.name}: false },
);
defineSlots<{ default?: () => unknown }>();
const element = ref<HTMLDivElement | null>(null);

defineExpose({ element });
</script>

<template>
  <div
    ref="element"
    v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}"
    ${facts.attrs.panel}
    data-sw-part="${facts.parts.panel.name}"
    :${facts.attrs.panelHiddenUntilFound}="props.${facts.props.hiddenUntilFound.name} ? '' : undefined"
    ${facts.attrs.panelState}="${collapsibleParts.panel.state}"
    :${facts.attrs.panelHidden}="props.${facts.props.hiddenUntilFound.name} ? '${collapsibleParts.panel.hiddenUntilFound}' : ${collapsibleParts.panel.hidden}"
  >
    <slot />
  </div>
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
