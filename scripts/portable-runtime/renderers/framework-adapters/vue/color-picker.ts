import { requireColorPickerModelOwnership } from "../../primitive-output-model/color-picker.js";
import type {
  AdapterColorPickerFacts,
  AdapterColorPickerPartName,
} from "../../primitive-output-model/index.js";
import {
  colorPickerLiveOptions,
  printColorPickerConnection,
} from "../../shared-recipes/color-picker/connection.js";
import {
  type ColorPickerPartAccess,
  colorPickerPartAttributes,
  colorPickerPartProps,
  colorPickerPartRequest,
  printColorPickerStructure,
} from "../../shared-recipes/color-picker/parts.js";
import { colorPickerSeeds } from "../../shared-recipes/color-picker/seeds.js";
import type { AdapterComponentFile } from "../types.js";
import { getVueAcceptedModelEvent } from "./accepted-model-publication.js";

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
  file: AdapterComponentFile,
): string {
  if (
    projection.part === "root" &&
    getVueAcceptedModelEvent(file, "value") !== projection.facts.events.valueChange.name
  )
    throw new Error("ColorPicker requires accepted value publication.");
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
  const seeds = colorPickerSeeds(
    facts,
    (name) =>
      name === "defaultValue"
        ? "initialDefaultValue"
        : `props.${name === "value" ? "modelValue" : name}`,
    { authority: "parent-prop", seed: "seed" },
  );
  requireColorPickerModelOwnership(Object.values(facts.controlledness.states));
  const props = facts.props;
  const root = facts.parts.root;
  const createInitial = facts.initialStateProjection.createFunction;
  const projectInitial = facts.initialStateProjection.projectFunction;
  const ownership = facts.initialStateProjection.ownershipAttribute;
  return `<script setup lang="ts">
import {
  ${facts.runtime.factory},
  parseColor,
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
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, useAttrs, watch } from "vue";
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
const initialDefaultValue = props.defaultValue;
const seed = ${seeds.constructor};
const initial = ${createInitial}(${seeds.projection});
const acceptedValue = ref<ColorPickerColor | null>(initial.value);
const acceptedFormat = ref<ColorPickerFormat>(initial.format);
const initialState = computed(() => ${createInitial}({
  value: acceptedValue.value,
  format: acceptedFormat.value,
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

let connection: ReturnType<typeof connectColorPicker> | undefined;
function readOptions(): ColorPickerOptions {
  return { value: props.modelValue, format: props.format, ${colorPickerLiveOptions(facts)
    .map((name) => `${name}: props.${name}`)
    .join(", ")},
    onValueChange: (value, details) => emit("valueChange", value, details),
    onValueCommitted: (value, details) => emit("valueCommitted", value, details),
    onFormatChange: (format, details) => emit("formatChange", format, details),
  };
}
${printColorPickerConnection(facts)}
let stopObservation: (() => void) | undefined;
${printColorPickerStructure(facts)}

onMounted(() => {
  const rootElement = element.value;
  if (!rootElement) return;
  const structure = colorPickerStructure(rootElement);
  connection = connectColorPicker(rootElement, {
    seed, read: readOptions,
    restoreAuthoredOwnership: structure.restoreOwnership,
    captureAuthoredOwnership: structure.captureOwnership,
    observe: (value, format) => {
      acceptedValue.value = value;
      acceptedFormat.value = format;
    },
    publishValue: (value) => { emit("update:modelValue", value); },
    publishFormat: (format) => { emit("update:format", format); },
    afterUpdate: (run) => { void nextTick(run); },
  });
  stopObservation = structure.observe(() => connection?.update());
});
watch(() => [props.modelValue, props.format, ${colorPickerLiveOptions(facts)
    .map((name) => `props.${name}`)
    .join(", ")}], () => connection?.update(), { flush: "post" });
onBeforeUnmount(() => {
  stopObservation?.();
  stopObservation = undefined;
  connection?.destroy();
  connection = undefined;
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

const partAccess: ColorPickerPartAccess = {
  prop: (name) => `props.${name}`,
  area: (name) => `area.${name}.value`,
  slider: (name) => `slider.${name}.value`,
  aria: (name) => `attrs[${JSON.stringify(name)}] as string | undefined`,
};
function customProps(part: AdapterColorPickerPartName): string {
  return (colorPickerPartProps[part] ?? [])
    .map((prop) => `\n  ${prop.name}${prop.required ? "" : "?"}: ${prop.type};`)
    .join("");
}
function defaultProps(part: AdapterColorPickerPartName): string {
  return (colorPickerPartProps[part] ?? [])
    .filter((prop) => prop.default !== undefined)
    .map((prop) => `${prop.name}: ${prop.default}`)
    .join(", ");
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
  return colorPickerPartRequest(part, partAccess);
}
function protectedPropsCode(part: AdapterColorPickerPartName, discovery: string): string {
  return `{ ${[`${JSON.stringify(discovery)}: ""`, ...colorPickerPartAttributes(part, partAccess)].join(", ")} }`;
}
