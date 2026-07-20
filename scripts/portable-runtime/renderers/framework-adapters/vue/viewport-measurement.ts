import type {
  AdapterComponentFile,
  AdapterIndexFile,
  AdapterPrintedFile,
  AdapterViewportMeasurementFacts,
} from "../types.js";
import { printVueFamilyIndex, VUE_NON_SHIPPING_COMMENT } from "./primitive/shared-fragments.js";

export function printVueViewportMeasurementIndex(file: AdapterIndexFile): AdapterPrintedFile {
  return printVueFamilyIndex(file, "viewport-measurement");
}

type PassivePartName = "content" | "corner" | "scrollbar" | "thumb" | "viewport";

export function printVueViewportMeasurementComponent(
  file: AdapterComponentFile,
): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "viewport-measurement") {
    throw new TypeError(
      "Vue viewport-measurement projection requires a viewport-measurement component model.",
    );
  }

  const contents =
    family.part === "root" ? printRoot(family.facts) : printPassivePart(family.facts, family.part);

  return { contents, path: `${file.path}.vue` };
}

function printRoot(facts: AdapterViewportMeasurementFacts): string {
  const root = facts.parts.root;
  const threshold = facts.props.overflowEdgeThreshold;
  const elementType = getElementType(root.defaultElement);

  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";
import { computed, nextTick, onBeforeUnmount, onMounted, onUpdated, ref, useAttrs, watch } from "vue";

defineOptions({ inheritAttrs: false });

type ${facts.threshold.typeName} =
  | number
  | Partial<{
      xStart: number;
      xEnd: number;
      yStart: number;
      yEnd: number;
    }>;

type ${facts.threshold.attributesTypeName} = {
  shared?: number;
  xEnd?: number;
  xStart?: number;
  yEnd?: number;
  yStart?: number;
};

const props = defineProps<{
  ${threshold.name}?: ${facts.threshold.typeName};
}>();
defineSlots<{ default?: () => unknown }>();
const attrs = useAttrs();
const rootRef = ref<${elementType} | null>(null);
const thresholdAttributes = computed(() => ${facts.threshold.helperName}(props.${threshold.name}));
let instance: ReturnType<typeof ${facts.runtime.factory}> | undefined;
let refreshGeneration = 0;
let refreshQueued = false;

defineExpose({ element: rootRef });

function destroyOwnedInstance(): void {
  refreshGeneration += 1;
  refreshQueued = false;
  const ownedInstance = instance;
  if (!ownedInstance) return;

  if (instance === ownedInstance) instance = undefined;
  ownedInstance.destroy();
}

function scheduleRefresh(): void {
  const ownedInstance = instance;
  if (!ownedInstance || refreshQueued) return;

  refreshQueued = true;
  const generation = ++refreshGeneration;
  void nextTick(() => {
    if (generation !== refreshGeneration || instance !== ownedInstance) return;

    refreshQueued = false;
    ownedInstance.refresh();
  });
}

onMounted(() => {
  const element = rootRef.value;
  if (!element) return;

  instance = ${facts.runtime.factory}(element);
});
onUpdated(scheduleRefresh);
onBeforeUnmount(destroyOwnedInstance);

watch(
  [
    () => thresholdAttributes.value.shared,
    () => thresholdAttributes.value.xEnd,
    () => thresholdAttributes.value.xStart,
    () => thresholdAttributes.value.yEnd,
    () => thresholdAttributes.value.yStart,
  ],
  scheduleRefresh,
  { flush: "post" },
);

function ${facts.threshold.helperName}(
  threshold: ${facts.threshold.typeName} | undefined,
): ${facts.threshold.attributesTypeName} {
  if (typeof threshold === "number") {
    const shared = ${facts.threshold.normalizeHelperName}(threshold);
    return shared === undefined ? {} : { shared };
  }

  if (!threshold) return {};

  return {
    xEnd: "xEnd" in threshold ? ${facts.threshold.normalizeHelperName}(threshold.xEnd) : undefined,
    xStart:
      "xStart" in threshold ? ${facts.threshold.normalizeHelperName}(threshold.xStart) : undefined,
    yEnd: "yEnd" in threshold ? ${facts.threshold.normalizeHelperName}(threshold.yEnd) : undefined,
    yStart:
      "yStart" in threshold ? ${facts.threshold.normalizeHelperName}(threshold.yStart) : undefined,
  };
}

function ${facts.threshold.normalizeHelperName}(value: number | undefined): number | undefined {
  if (value === undefined || !Number.isFinite(value)) return undefined;

  return Math.max(value, 0);
}
</script>

<template>
  <${root.defaultElement}
    ref="rootRef"
    v-bind="attrs"
    ${facts.attrs.root}
    :${facts.attrs.overflowEdgeThreshold}="thresholdAttributes.shared"
    :${facts.attrs.overflowEdgeThresholdEdges.xEnd}="thresholdAttributes.xEnd"
    :${facts.attrs.overflowEdgeThresholdEdges.xStart}="thresholdAttributes.xStart"
    :${facts.attrs.overflowEdgeThresholdEdges.yEnd}="thresholdAttributes.yEnd"
    :${facts.attrs.overflowEdgeThresholdEdges.yStart}="thresholdAttributes.yStart"
    role="${root.role}"
  >
    <slot />
  </${root.defaultElement}>
</template>
`;
}

function printPassivePart(
  facts: AdapterViewportMeasurementFacts,
  partName: PassivePartName,
): string {
  const part = facts.parts[partName];
  const refName = `${partName}Ref`;
  const elementType = getElementType(part.defaultElement);
  const props =
    partName === "scrollbar"
      ? `
const props = withDefaults(
  defineProps<{
    ${facts.props.keepMounted.name}?: ${facts.props.keepMounted.type};
    ${facts.props.orientation.name}?: ${facts.props.orientation.type};
  }>(),
  {
    ${facts.props.keepMounted.name}: ${facts.props.keepMounted.defaultValue},
    ${facts.props.orientation.name}: ${facts.props.orientation.defaultValue},
  },
);`
      : "";
  const protectedAttributes =
    partName === "viewport"
      ? `
    role="${facts.parts.viewport.role}"
    :tabindex="getViewportTabIndex()"
    :style="[attrs.style, { overflow: 'scroll' }]"`
      : partName === "scrollbar"
        ? `
    :${facts.attrs.keepMounted}="props.${facts.props.keepMounted.name} ? '' : undefined"
    :${facts.attrs.orientation}="props.${facts.props.orientation.name}"
    ${facts.attrs.scrollbarAriaHidden}="true"`
        : partName === "corner"
          ? `
    ${facts.attrs.cornerAriaHidden}="true"`
          : partName === "content"
            ? `
    role="${facts.parts.content.role}"`
            : "";
  const helpers =
    partName === "viewport"
      ? `

function getViewportTabIndex(): number | string {
  const value = attrs.tabindex ?? attrs.tabIndex;
  return typeof value === "number" || typeof value === "string" ? value : -1;
}`
      : "";

  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { ref, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });${props}
defineSlots<{ default?: () => unknown }>();
const attrs = useAttrs();
const ${refName} = ref<${elementType} | null>(null);

defineExpose({ element: ${refName} });${helpers}
</script>

<template>
  <${part.defaultElement}
    ref="${refName}"
    v-bind="attrs"
    ${part.discoveryAttribute}${protectedAttributes}
  >
    <slot />
  </${part.defaultElement}>
</template>
`;
}

function getElementType(tagName: string): string {
  if (tagName === "div") return "HTMLDivElement";
  return "HTMLElement";
}
