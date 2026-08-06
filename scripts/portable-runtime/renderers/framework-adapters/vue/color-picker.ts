import type {
  AdapterColorPickerFacts,
  AdapterColorPickerPartName,
} from "../../primitive-output-model/index.js";

export type VueColorPickerComponentProjection = {
  facts: AdapterColorPickerFacts;
  kind: "vue-color-picker";
  part: AdapterColorPickerPartName;
};

export type VueColorPickerIndexProjection = {
  facts: AdapterColorPickerFacts;
  kind: "vue-color-picker";
};

const VOID_PARTS = new Set<AdapterColorPickerPartName>([
  "areaInput",
  "channelInput",
  "channelSliderInput",
  "hiddenInput",
  "valueInput",
]);

export function printVueColorPickerContext(facts: AdapterColorPickerFacts): string {
  const project = facts.initialStateProjection.projectFunction;
  const ownership = facts.initialStateProjection.ownershipAttribute;
  return `import {
  computed,
  inject,
  type InjectionKey,
  mergeProps,
  type Ref,
  shallowRef,
} from "vue";
import {
  ${project},
  type ColorPickerInitialChannel,
  type ColorPickerInitialPartProjection,
  type ColorPickerInitialPartRequest,
  type ColorPickerInitialState,
} from "${facts.initialStateProjection.importSource}";

export type ColorPickerRootContextValue = {
  initialState: Readonly<Ref<ColorPickerInitialState>>;
};
export type ColorPickerAreaContextValue = {
  xChannel: Readonly<Ref<ColorPickerInitialChannel>>;
  yChannel: Readonly<Ref<ColorPickerInitialChannel>>;
  xStep: Readonly<Ref<number | undefined>>;
  yStep: Readonly<Ref<number | undefined>>;
};
export type ColorPickerChannelSliderContextValue = {
  channel: Readonly<Ref<ColorPickerInitialChannel>>;
  orientation: Readonly<Ref<"horizontal" | "vertical">>;
  step: Readonly<Ref<number | undefined>>;
};

export const ColorPickerRootContext: InjectionKey<ColorPickerRootContextValue> = Symbol("StarwindColorPickerRoot");
export const ColorPickerAreaContext: InjectionKey<ColorPickerAreaContextValue> = Symbol("StarwindColorPickerArea");
export const ColorPickerChannelSliderContext: InjectionKey<ColorPickerChannelSliderContextValue> = Symbol("StarwindColorPickerChannelSlider");

export function useColorPickerRootContext(): ColorPickerRootContextValue {
  const context = inject(ColorPickerRootContext, undefined);
  if (!context) throw new Error("Color Picker parts must be rendered inside ColorPicker.Root.");
  return context;
}
export function useColorPickerAreaContext(): ColorPickerAreaContextValue {
  return inject(ColorPickerAreaContext, undefined) ?? {
    xChannel: shallowRef("saturation"),
    yChannel: shallowRef("brightness"),
    xStep: shallowRef(undefined),
    yStep: shallowRef(undefined),
  };
}
export function useColorPickerChannelSliderContext(): ColorPickerChannelSliderContextValue {
  return inject(ColorPickerChannelSliderContext, undefined) ?? {
    channel: shallowRef("hue"),
    orientation: shallowRef("horizontal"),
    step: shallowRef(undefined),
  };
}

export function useColorPickerPartProjection(
  request: () => ColorPickerInitialPartRequest,
  authoredProps: Record<string, unknown>,
  protectedProps: () => Record<string, unknown>,
) {
  const context = useColorPickerRootContext();
  const projection = ${project}(context.initialState.value, request());
  return {
    props: computed(() => mergeColorPickerProjection(projection, authoredProps, protectedProps())),
    text: projection.text,
  };
}

export function mergeColorPickerProjection(
  projection: ColorPickerInitialPartProjection,
  authoredProps: Record<string, unknown>,
  protectedProps: Record<string, unknown>,
): Record<string, unknown> {
  const projected: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(projection.attributes)) {
    if (name === "${ownership}" || value === undefined || value === false) continue;
    projected[name] = name.startsWith("data-") && value === true ? "" : value;
  }
  for (const [name, value] of Object.entries(projection.properties)) {
    if (value !== undefined && name !== "defaultValue") projected[name] = value;
  }
  if (Object.keys(projection.styles).length > 0) projected.style = projection.styles;
  const result = mergeProps(projected, authoredProps, protectedProps);
  const tokens = [
    ...projection.ownership.attributes
      .filter((name) => !(name in authoredProps) && !(name in protectedProps))
      .map((name) => "a:" + name),
    ...projection.ownership.properties
      .filter((name) => !(name in authoredProps) && !(name in protectedProps))
      .map((name) => "p:" + name),
  ];
  if (tokens.length > 0) result["${ownership}"] = tokens.join(",");
  return result;
}
`;
}

export function printVueColorPickerComponent(
  projection: VueColorPickerComponentProjection,
): string {
  return projection.part === "root"
    ? printRoot(projection.facts)
    : printPart(projection.facts, projection.part);
}

export function printVueColorPickerIndex({ facts }: VueColorPickerIndexProjection): string {
  const imports = Object.values(facts.exports.parts)
    .map((name) => `import ${name} from "./${name}.vue";`)
    .join("\n");
  const members = Object.entries(facts.exports.parts)
    .map(
      ([part, name]) =>
        `  ${facts.parts[part as AdapterColorPickerPartName].namespaceKey}: ${name},`,
    )
    .join("\n");
  const named = Object.values(facts.exports.parts).join(",\n  ");
  return `${imports}

const ${facts.exports.namespace} = {
${members}
};

export {
  ${facts.exports.namespace},
  ${named},
};
export default ${facts.exports.namespace};

export type {
  ${facts.exports.runtimeFacades.types.join(",\n  ")},
} from "${facts.exports.runtimeFacades.importSource}";
export { ${facts.exports.runtimeFacades.values.join(", ")} } from "${facts.exports.runtimeFacades.importSource}";
`;
}

function printRoot(facts: AdapterColorPickerFacts): string {
  const props = facts.props;
  const root = facts.parts.root;
  const createInitial = facts.initialStateProjection.createFunction;
  const projectInitial = facts.initialStateProjection.projectFunction;
  const ownership = facts.initialStateProjection.ownershipAttribute;
  const selectors = Object.values(facts.parts)
    .map((part) => `[${part.discoveryAttribute}]`)
    .join(", ");
  return `<script setup lang="ts">
import {
  ${facts.runtime.factory},
  ${createInitial},
  ${projectInitial},
  type ColorPickerColor,
  type ColorPickerDirection,
  type ColorPickerFormat,
  type ColorPickerFormatChangeDetails,
  type ColorPickerOptions,
  type ColorPickerValue,
  type ColorPickerValueChangeDetails,
  type ColorPickerValueCommitDetails,
} from "${facts.runtime.importSource}";
import { computed, onBeforeUnmount, onMounted, provide, ref, useAttrs, watch } from "vue";
import { ColorPickerRootContext, mergeColorPickerProjection } from "./ColorPickerContext.js";

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{
  modelValue?: ColorPickerValue;
  defaultValue?: ColorPickerValue;
  format?: ColorPickerFormat;
  alpha?: boolean;
  allowEmpty?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  name?: string;
  form?: string;
  required?: boolean;
  locale?: string;
  dir?: ColorPickerDirection;
  getAriaValueText?: ColorPickerOptions["getAriaValueText"];
  getAreaRoleDescription?: ColorPickerOptions["getAreaRoleDescription"];
  getColorDescription?: ColorPickerOptions["getColorDescription"];
}>(), {
  defaultValue: ${props.defaultValue.defaultValue},
  alpha: ${props.alpha.defaultValue},
  allowEmpty: ${props.allowEmpty.defaultValue},
  disabled: ${props.disabled.defaultValue},
  readOnly: ${props.readOnly.defaultValue},
  required: ${props.required.defaultValue},
});
const emit = defineEmits<{
  valueChange: [value: ColorPickerColor | null, details: ColorPickerValueChangeDetails];
  valueCommitted: [value: ColorPickerColor | null, details: ColorPickerValueCommitDetails];
  formatChange: [format: ColorPickerFormat, details: ColorPickerFormatChangeDetails];
  "update:modelValue": [value: ColorPickerColor | null];
  "update:format": [format: ColorPickerFormat];
}>();
defineSlots<{ default?: () => unknown }>();
const attrs = useAttrs();
const element = ref<HTMLDivElement | null>(null);
const initial = ${createInitial}({
  ...(props.modelValue !== undefined ? { value: props.modelValue } : { defaultValue: props.defaultValue }),
  ...(props.format === undefined ? {} : { format: props.format }),
  alpha: props.alpha,
  allowEmpty: props.allowEmpty,
});
const uncontrolledValue = ref<ColorPickerColor | null>(initial.value);
const uncontrolledFormat = ref<ColorPickerFormat>(initial.format);
const renderedValue = computed(() => props.modelValue !== undefined ? props.modelValue : uncontrolledValue.value);
const renderedFormat = computed(() => props.format !== undefined ? props.format : uncontrolledFormat.value);
const initialState = computed(() => ${createInitial}({
  value: renderedValue.value,
  format: renderedFormat.value,
  alpha: props.alpha,
  allowEmpty: props.allowEmpty,
  disabled: props.disabled,
  readOnly: props.readOnly,
  required: props.required,
  name: props.name,
  form: props.form,
  locale: props.locale,
  dir: props.dir,
  getAriaValueText: props.getAriaValueText,
  getAreaRoleDescription: props.getAreaRoleDescription,
  getColorDescription: props.getColorDescription,
}));
provide(ColorPickerRootContext, { initialState });
const initialRootProjection = ${projectInitial}(initialState.value, { part: "root" });
const rootProps = computed(() => mergeColorPickerProjection(initialRootProjection, attrs, { "${root.discoveryAttribute}": "" }));
defineExpose({ element });

let instance: ReturnType<typeof ${facts.runtime.factory}> | undefined;
let observer: MutationObserver | undefined;
let refreshQueued = false;
const ownershipSeeds = new Map<Element, string>();
const structuralIds = new WeakMap<Element, number>();
let nextStructuralId = 1;
let structuralFingerprint = "";
const partSelector = ${JSON.stringify(selectors)};
const configurationAttributes = ["data-axis", "data-channel", "data-disabled", "data-orientation", "data-step", "data-value", "data-x-channel", "data-y-channel", "aria-label", "aria-labelledby", "aria-roledescription"];

function ownedParts(rootElement: HTMLElement): Element[] {
  return [rootElement, ...rootElement.querySelectorAll(partSelector)].filter((part) => part.closest("[${root.discoveryAttribute}]") === rootElement);
}
function captureOwnership(rootElement: HTMLElement): void {
  for (const part of ownedParts(rootElement)) {
    const marker = part.getAttribute("${ownership}");
    if (marker) ownershipSeeds.set(part, marker);
  }
}
function replayOwnership(rootElement: HTMLElement): void {
  for (const [part, marker] of ownershipSeeds) {
    if (!part.isConnected || part.closest("[${root.discoveryAttribute}]") !== rootElement) ownershipSeeds.delete(part);
    else part.setAttribute("${ownership}", marker);
  }
}
function relevantMutation(record: MutationRecord, rootElement: HTMLElement): boolean {
  const target = record.target instanceof Element ? record.target : undefined;
  if (!target || target.closest("[${root.discoveryAttribute}]") !== rootElement) return false;
  if (record.type === "childList") return true;
  if (record.type !== "attributes" || !record.attributeName) return false;
  if (["data-value", "data-disabled"].includes(record.attributeName)) return target.hasAttribute("data-sw-color-picker-swatch");
  return true;
}
function configurationFor(part: Element): readonly string[] {
  if (part.hasAttribute("data-sw-color-picker-area")) return ["data-x-channel", "data-y-channel"];
  if (part.hasAttribute("data-sw-color-picker-area-input")) return ["data-axis", "data-step", "aria-label", "aria-labelledby", "aria-roledescription"];
  if (part.hasAttribute("data-sw-color-picker-channel-slider")) return ["data-channel", "data-orientation"];
  if (part.hasAttribute("data-sw-color-picker-channel-input")) return ["data-step"];
  if (part.hasAttribute("data-sw-color-picker-channel-field")) return ["data-channel"];
  if (part.hasAttribute("data-sw-color-picker-swatch")) return ["data-value", "data-disabled"];
  return [];
}
function fingerprint(rootElement: HTMLElement): string {
  return ownedParts(rootElement).map((part) => {
    let id = structuralIds.get(part);
    if (id === undefined) {
      id = nextStructuralId++;
      structuralIds.set(part, id);
    }
    const attributes = configurationFor(part).map((name) => name + "=" + (part.getAttribute(name) ?? "")).join(";");
    return id + ":" + part.tagName + ":" + attributes;
  }).join("|");
}
function queueRefresh(): void {
  if (refreshQueued) return;
  refreshQueued = true;
  queueMicrotask(() => {
    refreshQueued = false;
    if (!element.value || !instance) return;
    const nextFingerprint = fingerprint(element.value);
    if (nextFingerprint === structuralFingerprint) return;
    structuralFingerprint = nextFingerprint;
    captureOwnership(element.value);
    instance.refresh({ preserveState: true });
    structuralFingerprint = fingerprint(element.value);
  });
}

onMounted(() => {
  const rootElement = element.value;
  if (!rootElement) return;
  replayOwnership(rootElement);
  captureOwnership(rootElement);
  instance = ${facts.runtime.factory}(rootElement, {
    ...(props.modelValue !== undefined ? { value: props.modelValue } : { defaultValue: props.defaultValue }),
    format: renderedFormat.value,
    alpha: props.alpha,
    allowEmpty: props.allowEmpty,
    disabled: props.disabled,
    readOnly: props.readOnly,
    name: props.name,
    form: props.form,
    required: props.required,
    locale: props.locale,
    dir: props.dir,
    getAriaValueText: props.getAriaValueText,
    getAreaRoleDescription: props.getAreaRoleDescription,
    getColorDescription: props.getColorDescription,
    onValueChange: (value, details) => {
      const eventWasControlled = props.modelValue !== undefined;
      emit("valueChange", value, details);
      if (details.isCanceled) return;
      if (!eventWasControlled) uncontrolledValue.value = value;
      emit("update:modelValue", value);
    },
    onValueCommitted: (value, details) => emit("valueCommitted", value, details),
    onFormatChange: (format, details) => {
      const eventWasControlled = props.format !== undefined;
      emit("formatChange", format, details);
      if (!eventWasControlled) uncontrolledFormat.value = format;
      emit("update:format", format);
    },
  });
  instance.refresh();
  structuralFingerprint = fingerprint(rootElement);
  observer = new MutationObserver((records) => {
    if (records.some((record) => relevantMutation(record, rootElement))) queueRefresh();
  });
  observer.observe(rootElement, { attributes: true, attributeFilter: configurationAttributes, childList: true, subtree: true });
});
watch(() => props.modelValue, (value, previousValue) => {
  if (!instance) return;
  if (value === undefined) {
    if (previousValue !== undefined) {
      instance.refresh({ preserveState: true });
      instance.setValue(uncontrolledValue.value, { emit: false });
    }
    return;
  }
  instance.refresh({ preserveState: true });
  instance.setValue(value, { emit: false });
  uncontrolledValue.value = instance.getValue();
}, { flush: "post" });
watch(() => props.format, (format, previousFormat) => {
  if (!instance) return;
  if (format === undefined) {
    if (previousFormat !== undefined) {
      instance.refresh({ preserveState: true });
      instance.setFormat(uncontrolledFormat.value, { emit: false });
    }
    return;
  }
  instance.refresh({ preserveState: true });
  instance.setFormat(format, { emit: false });
  uncontrolledFormat.value = instance.getFormat();
}, { flush: "post" });
watch(() => props.disabled, (value) => instance?.setDisabled(value), { flush: "post" });
watch(() => props.readOnly, (value) => instance?.setReadOnly(value), { flush: "post" });
watch(() => props.name, (value) => instance?.setName(value ?? null), { flush: "post" });
watch([
  () => props.alpha,
  () => props.allowEmpty,
  () => props.dir,
  () => props.form,
  () => props.getAreaRoleDescription,
  () => props.getAriaValueText,
  () => props.getColorDescription,
  () => props.locale,
  () => props.required,
], () => instance?.setOptions({
  alpha: props.alpha,
  allowEmpty: props.allowEmpty,
  dir: props.dir ?? null,
  form: props.form ?? null,
  getAreaRoleDescription: props.getAreaRoleDescription,
  getAriaValueText: props.getAriaValueText,
  getColorDescription: props.getColorDescription,
  locale: props.locale ?? null,
  required: props.required,
}), { flush: "post" });
onBeforeUnmount(() => {
  observer?.disconnect();
  observer = undefined;
  const owned = instance;
  instance = undefined;
  owned?.destroy();
  ownershipSeeds.clear();
});
</script>

<template><div ref="element" v-bind="rootProps"><slot /></div></template>
`;
}

function printPart(facts: AdapterColorPickerFacts, partName: AdapterColorPickerPartName): string {
  const part = facts.parts[partName];
  const custom = customProps(partName);
  const defaults = defaultProps(partName);
  const contextSetup = contextSetupCode(partName);
  const request = requestCode(partName);
  const protectedProps = protectedPropsCode(partName, part.discoveryAttribute);
  const isVoid = VOID_PARTS.has(partName);
  const text = partName === "valueText" ? "<slot>{{ text }}</slot>" : "<slot />";
  const template = isVoid
    ? `<${part.defaultElement} ref="element" v-bind="projectedProps" />`
    : `<${part.defaultElement} ref="element" v-bind="projectedProps">${text}</${part.defaultElement}>`;
  return `<script setup lang="ts">
import type { ColorPickerInitialChannel, ColorPickerValue } from "${facts.runtime.importSource}";
import { computed, provide, readonly, ref, useAttrs } from "vue";
import {
  ColorPickerAreaContext,
  ColorPickerChannelSliderContext,
  useColorPickerAreaContext,
  useColorPickerChannelSliderContext,
  useColorPickerPartProjection,
} from "./ColorPickerContext.js";

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{${custom}
}>(), {${defaults}});
${isVoid ? "" : "defineSlots<{ default?: () => unknown }>();"}
const attrs = useAttrs();
const element = ref<HTMLElement | null>(null);
${contextSetup}
const { props: projectedProps, text } = useColorPickerPartProjection(
  () => (${request}),
  attrs,
  () => (${protectedProps}),
);
defineExpose({ element });
</script>

<template>${template}</template>
`;
}

function customProps(part: AdapterColorPickerPartName): string {
  switch (part) {
    case "area":
      return "\n  xChannel?: ColorPickerInitialChannel;\n  yChannel?: ColorPickerInitialChannel;\n  xStep?: number;\n  yStep?: number;";
    case "areaInput":
      return '\n  axis?: "x" | "y";\n  step?: number;';
    case "channelSlider":
      return '\n  channel?: ColorPickerInitialChannel;\n  orientation?: "horizontal" | "vertical";\n  step?: number;';
    case "channelSliderInput":
      return "\n  step?: number;";
    case "channelInput":
      return "\n  channel?: ColorPickerInitialChannel;";
    case "swatch":
      return "\n  swatchValue: ColorPickerValue;\n  swatchDisabled?: boolean;";
    default:
      return "";
  }
}

function defaultProps(part: AdapterColorPickerPartName): string {
  switch (part) {
    case "area":
      return ' xChannel: "saturation", yChannel: "brightness" ';
    case "areaInput":
      return ' axis: "x" ';
    case "channelSlider":
      return ' channel: "hue", orientation: "horizontal" ';
    case "channelInput":
      return ' channel: "hue" ';
    case "swatch":
      return " swatchDisabled: false ";
    default:
      return "";
  }
}

function contextSetupCode(part: AdapterColorPickerPartName): string {
  switch (part) {
    case "area":
      return `const xChannel = computed(() => props.xChannel);\nconst yChannel = computed(() => props.yChannel);\nconst xStep = computed(() => props.xStep);\nconst yStep = computed(() => props.yStep);\nprovide(ColorPickerAreaContext, { xChannel: readonly(xChannel), yChannel: readonly(yChannel), xStep: readonly(xStep), yStep: readonly(yStep) });`;
    case "areaBackground":
    case "areaThumb":
    case "areaInput":
      return "const area = useColorPickerAreaContext();";
    case "channelSlider":
      return `const channel = computed(() => props.channel);\nconst orientation = computed(() => props.orientation);\nconst step = computed(() => props.step);\nprovide(ColorPickerChannelSliderContext, { channel: readonly(channel), orientation: readonly(orientation), step: readonly(step) });`;
    case "channelSliderTrack":
    case "channelSliderThumb":
    case "channelSliderInput":
      return "const slider = useColorPickerChannelSliderContext();";
    default:
      return "";
  }
}

function requestCode(part: AdapterColorPickerPartName): string {
  switch (part) {
    case "area":
      return '{ part: "area", xChannel: props.xChannel, yChannel: props.yChannel, xStep: props.xStep, yStep: props.yStep }';
    case "areaBackground":
    case "areaThumb":
      return `{ part: "${part}", xChannel: area.xChannel.value, yChannel: area.yChannel.value, xStep: area.xStep.value, yStep: area.yStep.value }`;
    case "areaInput":
      return '{ part: "areaInput", xChannel: area.xChannel.value, yChannel: area.yChannel.value, axis: props.axis, ...(props.axis === "x" ? { xStep: props.step ?? area.xStep.value } : { yStep: props.step ?? area.yStep.value }) }';
    case "channelSlider":
      return '{ part: "channelSlider", channel: props.channel, orientation: props.orientation, step: props.step }';
    case "channelSliderTrack":
    case "channelSliderThumb":
      return `{ part: "${part}", channel: slider.channel.value, orientation: slider.orientation.value, step: slider.step.value }`;
    case "channelSliderInput":
      return '{ part: "channelSliderInput", channel: slider.channel.value, orientation: slider.orientation.value, step: props.step ?? slider.step.value }';
    case "channelInput":
      return '{ part: "channelInput", channel: props.channel }';
    case "swatch":
      return '{ part: "swatch", value: props.swatchValue, disabled: props.swatchDisabled }';
    default:
      return `{ part: "${part}" }`;
  }
}

function protectedPropsCode(part: AdapterColorPickerPartName, discovery: string): string {
  const values = [`${JSON.stringify(discovery)}: ""`];
  if (part === "area")
    values.push('"data-x-channel": props.xChannel', '"data-y-channel": props.yChannel');
  if (part === "areaInput")
    values.push(
      '"data-axis": props.axis',
      '"data-step": props.step ?? (props.axis === "x" ? area.xStep.value : area.yStep.value)',
    );
  if (part === "channelSlider")
    values.push('"data-channel": props.channel', '"data-orientation": props.orientation');
  if (part === "channelSliderInput") values.push('"data-step": props.step ?? slider.step.value');
  if (part === "channelInput") values.push('"data-channel": props.channel');
  if (part === "swatch")
    values.push(
      '"data-value": typeof props.swatchValue === "string" ? props.swatchValue : props.swatchValue?.toString()',
      '"data-disabled": props.swatchDisabled ? "" : undefined',
    );
  return `{ ${values.join(", ")} }`;
}
