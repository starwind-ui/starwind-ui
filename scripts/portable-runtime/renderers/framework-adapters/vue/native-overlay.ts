import {
  nativeRecipe,
  nativeTriggerComposition,
  renderNativeRoot,
} from "../../shared-recipes/structured/native.js";
import { getVueAcceptedModelEvent } from "./accepted-model-publication.js";
import { projectVueAttributeAccess } from "./public-contract.js";

const VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS = projectVueAttributeAccess([]);

import type {
  AdapterComponentFile,
  AdapterIndexFile,
  AdapterNativeOverlayFacts,
  AdapterPrintedFile,
} from "../types.js";
import { printVueFamilyIndex } from "./primitive/shared-fragments.js";

export function printVueNativeOverlayIndex(file: AdapterIndexFile): AdapterPrintedFile {
  const printed = printVueFamilyIndex(file, "native-overlay");
  if (file.family?.kind !== "native-overlay") return printed;
  const { facts } = file.family;
  printed.contents += `\nexport { ${facts.displayName}Context } from "./${facts.exports.root}.vue";\n`;
  if (facts.displayName === "AlertDialog") {
    printed.contents += `export { __useAlertDialogControl } from "./${facts.exports.close}.vue";\n`;
  }
  return printed;
}

export function printVueNativeOverlayComponent(file: AdapterComponentFile): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "native-overlay") {
    throw new TypeError("Vue native-overlay projection requires a native-overlay component model.");
  }

  const { facts, part } = family;
  if (part === "root") getVueAcceptedModelEvent(file, facts.state.name);
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
  return renderNativeRoot("vue", facts.displayName);
}

function printPortal(facts: AdapterNativeOverlayFacts): string {
  const activationFirst =
    nativeRecipe(facts.displayName as "Dialog" | "AlertDialog" | "Drawer").surface.connection[0] ===
    "activate-placement";
  const part = facts.parts.portal;
  const discoveryAttribute = facts.attrs.portal;
  const exportName = facts.exports.portal;
  if (!part || !discoveryAttribute || !exportName) {
    throw new Error(`${facts.displayName} native-overlay adapter cannot print portal.`);
  }

  return `<script setup lang="ts">
import { reportPortalPlacement, resolvePortalPlacement } from "${facts.runtime.importSource}";
import { inject, onBeforeUnmount, onMounted, ref${activationFirst ? ", watch" : ""} } from "vue";
import { useVuePortalPlacement } from "../_internal/portal";
import { ${facts.displayName}Context } from "./${facts.exports.root}.vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    container?: string | HTMLElement;
    disabled?: boolean;
  }>(),
  {
    disabled: false,
  },
);
defineSlots<{ default?: () => unknown }>();
const root = inject(${facts.displayName}Context);
if (!root) throw new TypeError("${exportName} must be nested inside ${facts.exports.root}.");
const owner = Symbol("${exportName}");
const element = ref<HTMLDivElement | null>(null);
const placement = useVuePortalPlacement({
  active: () => root.mounted.value,
  container: () => props.container,
  disabled: () => props.disabled,
  element,
  reference: () => root.element.value,
  runtime: { reportPortalPlacement, resolvePortalPlacement },
});

${
  activationFirst
    ? `// An enabled portal is pending during activation; only the authored disabled prop makes it inline-ready.
watch(() => root.mounted.value, active => {
  if (active && !props.disabled) element.value?.removeAttribute("data-disabled");
}, { flush: "sync" });
`
    : ""
}
onMounted(() => root.registerPortal(owner, element.value));
onBeforeUnmount(() => root.registerPortal(owner, null));

defineExpose({ element });
</script>

<template>
  <Teleport :to="placement.target.value" :disabled="placement.disabled.value">
    <${part.defaultElement}
      ref="element"
      v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}"
      ${discoveryAttribute}
      :data-container="typeof props.container === 'string' ? props.container : undefined"
      :data-disabled="props.disabled ? '' : undefined"
      :data-placement="placement.ready.value ? 'ready' : 'pending'"
      data-sw-portal-placement="framework"
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
    composition: nativeTriggerComposition(facts.displayName),
    asChildProtectedProps: [
      `"${facts.attrs.trigger}": ""`,
      `"data-sw-part": "${part.name}"`,
      `"${facts.attrs.triggerAriaHaspopup}": "dialog"`,
      `"${facts.attrs.targetId}": props.${targetId}`,
      `"${facts.attrs.triggerState}": "closed"`,
    ],
    controlContext: { name: `${facts.displayName}Context`, root: facts.exports.root },
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
    asChildProtectedProps: [
      `"${facts.attrs.close}": ""`,
      `"data-sw-part": "${facts.parts.close.name}"`,
    ],
    controlContext: { name: `${facts.displayName}Context`, root: facts.exports.root },
    attrs: [
      facts.attrs.close,
      `data-sw-part="${facts.parts.close.name}"`,
      `${facts.attrs.closeType}="button"`,
    ],
    elementType: "HTMLButtonElement",
    exportName: facts.exports.close,
    part: facts.parts.close,
    reservedAlertDialogControl: facts.displayName === "AlertDialog",
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
  asChildProtectedProps,
  controlContext,
  attrs,
  elementType,
  exportName,
  part,
  props,
  reservedAlertDialogControl = false,
  composition,
}: {
  asChildProtectedProps?: string[];
  controlContext?: { name: string; root: string };
  attrs: Array<string | undefined>;
  elementType: string;
  exportName: string;
  part: { defaultElement: string; name: string };
  props?: string;
  reservedAlertDialogControl?: boolean;
  composition?: "native-or-component-root";
}): string {
  const componentRoot = composition === "native-or-component-root";
  const composed = Boolean(controlContext && asChildProtectedProps);
  const reservedHook = reservedAlertDialogControl
    ? `<script lang="ts">
import { inject } from "vue";
import { useVueNativeControl } from "../_internal/native-control";
import { ${controlContext!.name} } from "./${controlContext!.root}.vue";

export function __useAlertDialogControl(name: string) {
  const root = inject(${controlContext!.name}, undefined);
  return useVueNativeControl(name, () => root?.requestRefresh());
}
</script>
`
    : "";
  const frameworkImports = composed
    ? `defineComponent, ${reservedAlertDialogControl ? "" : "inject, "}useAttrs, type HTMLAttributes, type VNode`
    : "type HTMLAttributes, ref";
  const controlImports =
    composed && !reservedAlertDialogControl
      ? `import { useVueNativeControl } from "../_internal/native-control";\nimport { ${controlContext!.name} } from "./${controlContext!.root}.vue";`
      : "";
  const propsDeclaration = composed
    ? `const props = withDefaults(defineProps<{ asChild?: boolean; ${props ?? ""} } & NativeElementProps>(), { asChild: false });`
    : props
      ? `const props = defineProps<{ ${props} } & NativeElementProps>();`
      : "defineProps<NativeElementProps>();";
  const compositionSetup = composed
    ? `const attrs = useAttrs();
${reservedAlertDialogControl ? "" : `const root = inject(${controlContext!.name}, undefined);\n`}const { element, render: renderAsChild, setElement } = ${reservedAlertDialogControl ? `__useAlertDialogControl("${exportName}")` : `useVueNativeControl("${exportName}", () => root?.requestRefresh()${componentRoot ? ", true" : ""})`};
const AsChildControl = defineComponent({
  inheritAttrs: false,
  setup() {
    return () => renderAsChild({
      children: slots.default?.() ?? [],
      consumerProps: attrs,
      defaultNativeButtonType: "button",
      protectedProps: {
        ${asChildProtectedProps!.join(",\n        ")},
      },
    });
  },
});`
    : `const element = ref<${elementType} | null>(null);`;

  return `${reservedHook}<script setup lang="ts">
import { ${frameworkImports} } from "vue";
${controlImports}

defineOptions({ inheritAttrs: false });

type NativeElementProps = /* @vue-ignore */ HTMLAttributes;
${propsDeclaration}
${composed ? "const slots = " : ""}defineSlots<{ default?: () => ${composed ? "VNode[]" : "unknown"} }>();
${compositionSetup}

defineExpose({ element });
</script>

<template>
  ${composed ? `<AsChildControl v-if="props.asChild" />\n  ` : ""}<${part.defaultElement}
    ${composed ? `:ref="setElement"\n    v-else` : `ref="element"`}
    v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}"
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
