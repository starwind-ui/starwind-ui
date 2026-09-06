import { projectVueAttributeAccess } from "./public-contract.js";

const VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS = projectVueAttributeAccess([]);

import type {
  AdapterComponentFile,
  AdapterGroupedValueControlFacts,
  AdapterHelperFile,
  AdapterIndexFile,
  AdapterPrintedFile,
} from "../types.js";
import { projectVueModel } from "./public-contract.js";

export function printVueGroupedValueControlComponent(
  file: AdapterComponentFile,
): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "grouped-value-control") {
    throw new TypeError(
      "Vue grouped-value-control projection requires grouped-value-control facts.",
    );
  }
  if (family.facts.behavior.multipleValueNormalization) {
    return printVueNormalizedGroupedValueRoot(file, family.facts);
  }
  if (family.facts.props.form || family.facts.props.orientation) {
    return printVueScalarGroupedValueRoot(file, family.facts);
  }

  return printVueArrayGroupedValueRoot(file, family.facts);
}

export function printVueGroupedValueControlHelper(file: AdapterHelperFile): AdapterPrintedFile {
  const family = file.family;
  if (family?.kind !== "grouped-value-control" || !family.facts.context) {
    throw new TypeError("Vue grouped-value-control helper requires context facts.");
  }
  const { context, runtime, state } = family.facts;
  const contextSymbol = `const ${context.componentName}: InjectionKey<${context.typeName}> = Symbol("Starwind${context.componentName}");`;
  const printedContextSymbol =
    contextSymbol.length <= 100
      ? contextSymbol
      : `const ${context.componentName}: InjectionKey<${context.typeName}> = Symbol(
  "Starwind${context.componentName}",
);`;

  return {
    contents: `import type { ${state.type} } from "${runtime.importSource}";
import { type InjectionKey, inject, type Ref } from "vue";

export type ${context.typeName} = Readonly<{
${context.values.map((value) => `  ${value.name}: Readonly<Ref<${value.type}${value.required === false ? " | undefined" : ""}>>;`).join("\n")}
}>;

${printedContextSymbol}

function ${context.hookName}(): ${context.typeName} | undefined {
  return inject(${context.componentName}, undefined);
}

export { ${context.componentName}, ${context.hookName} };
`,
    path: file.path,
  };
}

export function printVueGroupedValueControlIndex(file: AdapterIndexFile): AdapterPrintedFile {
  const family = file.family;
  if (family?.kind !== "grouped-value-control") {
    throw new TypeError("Vue grouped-value-control index requires grouped-value-control facts.");
  }
  const { context, exports } = family.facts;
  const helperExports = context
    ? `export type { ${context.typeName} } from "./${context.componentName}";
export { ${context.componentName}, ${context.hookName} } from "./${context.componentName}";`
    : "";

  return {
    contents: `import ${exports.root} from "./${exports.root}.vue";

const ${exports.namespace} = {
  Root: ${exports.root},
};

${helperExports}
export { default as ${exports.root} } from "./${exports.root}.vue";
export { ${exports.namespace} };

export default ${exports.namespace};

${file.typeFacades.map((facade) => facade.body.code).join("\n")}
`,
    path: file.path,
  };
}

function printVueNormalizedGroupedValueRoot(
  file: AdapterComponentFile,
  facts: AdapterGroupedValueControlFacts,
): AdapterPrintedFile {
  const context = requireContext(facts);
  const loopFocus = requireFact(
    facts.props.loopFocus,
    `${facts.displayName} requires a loop-focus prop fact.`,
  );
  const multiple = requireFact(
    facts.props.multiple,
    `${facts.displayName} requires a multiple prop fact.`,
  );
  const orientation = requireFact(
    facts.props.orientation,
    `${facts.displayName} requires an orientation prop fact.`,
  );
  const loopFocusSetter = requireFact(
    facts.setters.loopFocus,
    `${facts.displayName} requires a loop-focus setter fact.`,
  );
  const multipleSetter = requireFact(
    facts.setters.multiple,
    `${facts.displayName} requires a multiple setter fact.`,
  );
  const orientationSetter = requireFact(
    facts.setters.orientation,
    `${facts.displayName} requires an orientation setter fact.`,
  );
  const loopFocusAttribute = requireFact(
    facts.attrs.loopFocus,
    `${facts.displayName} requires a loop-focus attribute fact.`,
  );
  const multipleAttribute = requireFact(
    facts.attrs.multiple,
    `${facts.displayName} requires a multiple attribute fact.`,
  );
  const orientationAttribute = requireFact(
    facts.attrs.orientation,
    `${facts.displayName} requires an orientation attribute fact.`,
  );
  const parseValueAttributeFunction = requireFact(
    facts.behavior.parseValueAttributeFunction,
    `${facts.displayName} requires an attribute parser.`,
  );
  const model = projectVueModel(facts.state.name);

  return {
    contents: `<script setup lang="ts">
import {
  ${facts.runtime.factory},
  type ${facts.state.type},
  type ${facts.event.detailsType},
} from "${facts.runtime.importSource}";
import { computed, onBeforeUnmount, onMounted, provide, ref, useAttrs, watch } from "vue";

import { ${context.componentName} } from "./${context.componentName}";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    ${facts.props.defaultValue.name}?: ${facts.state.type};
    ${facts.props.disabled.name}?: ${facts.props.disabled.type};
    ${loopFocus.name}?: ${loopFocus.type};
    ${model.modelProp}?: ${facts.state.type};
    ${multiple.name}?: ${multiple.type};
    ${orientation.name}?: ${orientation.type};
  }>(),
  {
    ${facts.props.disabled.name}: ${facts.props.disabled.defaultValue},
    ${loopFocus.name}: ${loopFocus.defaultValue},
    ${model.modelProp}: undefined,
    ${multiple.name}: ${multiple.defaultValue},
    ${orientation.name}: ${orientation.defaultValue},
  },
);
const emit = defineEmits<{
  ${facts.event.name}: [value: ${facts.event.valueType}, detail: ${facts.event.detailsType}];
  "${model.updateEvent}": [value: ${facts.event.valueType}];
}>();
defineSlots<{ default?: () => unknown }>();
const attrs = useAttrs();
const rootRef = ref<HTMLElement | null>(null);
const initialDefaultValue = normalizeValue(props.${facts.props.defaultValue.name} ?? [], props.${multiple.name});
const uncontrolledValue = ref<${facts.state.type}>(initialDefaultValue);
const renderedValue = computed(() =>
  normalizeValue(props.${model.modelProp} ?? uncontrolledValue.value, props.${multiple.name}),
);
const renderedDisabled = computed(() => props.${facts.props.disabled.name});
const renderedLoopFocus = computed(() => props.${loopFocus.name});
const renderedMultiple = computed(() => props.${multiple.name});
const renderedOrientation = computed(() => props.${orientation.name});
let instance: ReturnType<typeof ${facts.runtime.factory}> | undefined;
let observer: MutationObserver | undefined;
let unsubscribeValueChange: (() => void) | undefined;
let instanceGeneration = 0;
let mounted = false;

provide(${context.componentName}, {
  ${facts.props.disabled.name}: renderedDisabled,
  ${loopFocus.name}: renderedLoopFocus,
  ${multiple.name}: renderedMultiple,
  ${orientation.name}: renderedOrientation,
  ${facts.props.value.name}: renderedValue,
});

defineExpose({ element: rootRef });

function setUncontrolledValue(nextValue: ${facts.state.type}): void {
  const normalizedValue = normalizeValue(nextValue, props.${multiple.name});
  if (areValuesEqual(uncontrolledValue.value, normalizedValue)) return;
  uncontrolledValue.value = normalizedValue;
}

function handleValueChangeProposal(
  _value: ${facts.event.valueType},
  detail: ${facts.event.detailsType},
): void {
  emit("${facts.event.name}", detail.${facts.event.valueProperty}, detail);
}

function handleAcceptedValueChange(detail: ${facts.event.detailsType}): void {
  const nextValue = normalizeValue(detail.${facts.event.valueProperty}, props.${multiple.name});
  if (props.${model.modelProp} === undefined) setUncontrolledValue(nextValue);
  emit("${model.updateEvent}", nextValue);
}

function destroyOwnedInstance(): void {
  instanceGeneration += 1;
  observer?.disconnect();
  observer = undefined;
  unsubscribeValueChange?.();
  unsubscribeValueChange = undefined;
  const ownedInstance = instance;
  if (!ownedInstance) return;
  instance = undefined;
  ownedInstance.destroy();
}

function setupRuntime(): void {
  destroyOwnedInstance();
  const element = rootRef.value;
  if (!element) return;

  const createdInstance = ${facts.runtime.factory}(element, {
    ${facts.props.defaultValue.name}: renderedValue.value,
    ${facts.props.disabled.name}: props.${facts.props.disabled.name},
    ${loopFocus.name}: props.${loopFocus.name},
    ${multiple.name}: props.${multiple.name},
    ${orientation.name}: props.${orientation.name},
    ${facts.event.callbackProp}: handleValueChangeProposal,
    ...(props.${model.modelProp} === undefined ? {} : { ${facts.props.value.name}: renderedValue.value }),
  });
  instance = createdInstance;
  unsubscribeValueChange = createdInstance.subscribe("${facts.event.name}", handleAcceptedValueChange);

  observer = new MutationObserver(() => {
    if (props.${model.modelProp} !== undefined || instance !== createdInstance) return;
    setUncontrolledValue(${parseValueAttributeFunction}(element.getAttribute("${facts.attrs.value}")));
  });
  observer.observe(element, {
    attributes: true,
    attributeFilter: ["${facts.attrs.value}"],
  });
  if (props.${model.modelProp} === undefined) {
    setUncontrolledValue(${parseValueAttributeFunction}(element.getAttribute("${facts.attrs.value}")));
  }
}

onMounted(() => {
  mounted = true;
  setupRuntime();
});

watch(
  () => props.${model.modelProp},
  (value, previousValue) => {
    const controllednessChanged = (value === undefined) !== (previousValue === undefined);
    if (controllednessChanged) {
      if (value === undefined && instance) setUncontrolledValue(instance.${facts.state.getter}());
      setupRuntime();
      return;
    }
    if (value === undefined || !instance) return;
    const normalizedValue = normalizeValue(value, props.${multiple.name});
    if (areValuesEqual(instance.${facts.state.getter}(), normalizedValue)) return;
    instance.${facts.setters.value.method}(normalizedValue, ${formatOptions(facts.setters.value.options)});
  },
  { flush: "post" },
);
watch(
  () => props.${facts.props.disabled.name},
  (value) => instance?.${facts.setters.disabled.method}(value),
);
watch(
  () => props.${loopFocus.name},
  (value) => instance?.${loopFocusSetter.method}(value),
);
watch(
  () => props.${multiple.name},
  (value) => {
    instance?.${multipleSetter.method}(value);
    if (props.${model.modelProp} === undefined && instance) {
      setUncontrolledValue(instance.${facts.state.getter}());
    } else if (props.${model.modelProp} !== undefined && instance) {
      instance.${facts.setters.value.method}(normalizeValue(props.${model.modelProp}, value), ${formatOptions(facts.setters.value.options)});
    }
  },
  { flush: "post" },
);
watch(
  () => props.${orientation.name},
  (value) => instance?.${orientationSetter.method}(value),
);

onBeforeUnmount(() => {
  mounted = false;
  destroyOwnedInstance();
});

function areValuesEqual(left: ${facts.state.type}, right: ${facts.state.type}): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function normalizeValue(value: ${facts.state.type}, multiple: boolean): ${facts.state.type} {
  const values = Array.from(new Set(value.filter((item) => item.length > 0)));
  return multiple ? values : values.slice(0, 1);
}

function ${parseValueAttributeFunction}(value: string | null): ${facts.state.type} {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}
</script>

<template>
  <${facts.rootPart.defaultElement}
    ref="rootRef"
    v-bind="attrs"
    ${facts.attrs.root}
    :${facts.attrs.defaultValue}="
      initialDefaultValue.length ? JSON.stringify(initialDefaultValue) : undefined
    "
    :${facts.attrs.value}="JSON.stringify(renderedValue)"
    :${facts.attrs.disabled}="props.${facts.props.disabled.name} ? '' : undefined"
    :${loopFocusAttribute}="props.${loopFocus.name} ? undefined : 'false'"
    :${multipleAttribute}="props.${multiple.name} ? '' : undefined"
    :${orientationAttribute}="props.${orientation.name}"
    role="${facts.rootPart.role}"
  >
    <slot />
  </${facts.rootPart.defaultElement}>
</template>
`,
    path: `${file.path}.vue`,
  };
}

function printVueArrayGroupedValueRoot(
  file: AdapterComponentFile,
  facts: AdapterGroupedValueControlFacts,
): AdapterPrintedFile {
  const context = requireContext(facts);
  const parseValueAttributeFunction = requireFact(
    facts.behavior.parseValueAttributeFunction,
    `${facts.displayName} grouped-value facts require an attribute parser.`,
  );
  const setterOptions = formatOptions(facts.setters.value.options);
  const model = projectVueModel(facts.state.name);

  return {
    contents: `<script setup lang="ts">
import {
  type ${facts.state.type},
  type ${facts.event.detailsType},
  ${facts.runtime.factory},
} from "${facts.runtime.importSource}";
import { computed, onBeforeUnmount, onMounted, provide, ref, useAttrs, watch } from "vue";

import { ${context.componentName} } from "./${context.componentName}";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    ${facts.props.defaultValue.name}?: ${facts.state.type};
    ${facts.props.disabled.name}?: ${facts.props.disabled.type};
    ${model.modelProp}?: ${facts.state.type};
  }>(),
  {
    ${facts.props.disabled.name}: ${facts.props.disabled.defaultValue},
    ${model.modelProp}: undefined,
  },
);
const emit = defineEmits<{
  ${facts.event.name}: [value: ${facts.event.valueType}, detail: ${facts.event.detailsType}];
  "${model.updateEvent}": [value: ${facts.event.valueType}];
}>();
defineSlots<{ default?: () => unknown }>();
const attrs = useAttrs();
const rootRef = ref<HTMLElement | null>(null);
const initialDefaultValue = props.${facts.props.defaultValue.name} ?? [];
const uncontrolledValue = ref<${facts.state.type}>(initialDefaultValue);
const renderedValue = computed(() => props.${model.modelProp} ?? uncontrolledValue.value);
const renderedDisabled = computed(() => props.${facts.props.disabled.name});
let instance: ReturnType<typeof ${facts.runtime.factory}> | undefined;
let observer: MutationObserver | undefined;

provide(${context.componentName}, {
  ${facts.props.disabled.name}: renderedDisabled,
  ${facts.props.value.name}: renderedValue,
});

defineExpose({ element: rootRef });

function setUncontrolledValue(nextValue: ${facts.state.type}): void {
  if (areValuesEqual(uncontrolledValue.value, nextValue)) return;
  uncontrolledValue.value = nextValue;
}

function handleValueChangeProposal(detail: ${facts.event.detailsType}): void {
  emit("${facts.event.name}", detail.${facts.event.valueProperty}, detail);
}

function handleAcceptedValueChange(detail: ${facts.event.detailsType}): void {
  if (props.${model.modelProp} === undefined) {
    setUncontrolledValue(detail.${facts.event.valueProperty});
  }
  emit("${model.updateEvent}", detail.${facts.event.valueProperty});
}

function destroyOwnedInstance(): void {
  observer?.disconnect();
  observer = undefined;
  const ownedInstance = instance;
  if (!ownedInstance) return;
  instance = undefined;
  ownedInstance.destroy();
}

onMounted(() => {
  const element = rootRef.value;
  if (!element) return;

  instance = ${facts.runtime.factory}(element, {
    ${facts.props.defaultValue.name}: initialDefaultValue,
    ${facts.props.disabled.name}: props.${facts.props.disabled.name},
    ${facts.event.callbackProp}: handleValueChangeProposal,
    ...(props.${model.modelProp} === undefined ? {} : { ${facts.props.value.name}: props.${model.modelProp} }),
  });
  instance.subscribe("${facts.event.name}", handleAcceptedValueChange);

  observer = new MutationObserver(() => {
    if (props.${model.modelProp} !== undefined) return;
    setUncontrolledValue(${parseValueAttributeFunction}(element.getAttribute("${facts.attrs.value}")));
  });
  observer.observe(element, {
    attributes: true,
    attributeFilter: ["${facts.attrs.value}"],
  });
  if (props.${model.modelProp} === undefined) {
    setUncontrolledValue(${parseValueAttributeFunction}(element.getAttribute("${facts.attrs.value}")));
  }
});

watch(
  () => props.${model.modelProp},
  (value) => {
    if (value === undefined || !instance || areValuesEqual(instance.${facts.state.getter}(), value)) {
      return;
    }
    instance.${facts.setters.value.method}(value, ${setterOptions});
  },
);
watch(
  () => props.${facts.props.disabled.name},
  (disabled) => instance?.${facts.setters.disabled.method}(disabled),
);

onBeforeUnmount(destroyOwnedInstance);

function areValuesEqual(left: ${facts.state.type}, right: ${facts.state.type}): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function ${parseValueAttributeFunction}(value: string | null): ${facts.state.type} {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}
</script>

<template>
  <${facts.rootPart.defaultElement}
    ref="rootRef"
    v-bind="attrs"
    ${facts.attrs.root}
    :${facts.attrs.defaultValue}="
      initialDefaultValue.length ? JSON.stringify(initialDefaultValue) : undefined
    "
    :${facts.attrs.value}="JSON.stringify(renderedValue)"
    :${facts.attrs.disabled}="props.${facts.props.disabled.name} ? '' : undefined"
    role="${facts.rootPart.role}"
  >
    <slot />
  </${facts.rootPart.defaultElement}>
</template>
`,
    path: `${file.path}.vue`,
  };
}

function printVueScalarGroupedValueRoot(
  file: AdapterComponentFile,
  facts: AdapterGroupedValueControlFacts,
): AdapterPrintedFile {
  const context = requireContext(facts);
  const form = requireFact(facts.props.form, `${facts.displayName} requires a form prop fact.`);
  const name = requireFact(facts.props.name, `${facts.displayName} requires a name prop fact.`);
  const orientation = requireFact(
    facts.props.orientation,
    `${facts.displayName} requires an orientation prop fact.`,
  );
  const readOnly = requireFact(
    facts.props.readOnly,
    `${facts.displayName} requires a read-only prop fact.`,
  );
  const required = requireFact(
    facts.props.required,
    `${facts.displayName} requires a required prop fact.`,
  );
  const formOptionsSetter = requireFact(
    facts.setters.formOptions,
    `${facts.displayName} requires a form-options setter fact.`,
  );
  const orientationSetter = requireFact(
    facts.setters.orientation,
    `${facts.displayName} requires an orientation setter fact.`,
  );
  const readOnlySetter = requireFact(
    facts.setters.readOnly,
    `${facts.displayName} requires a read-only setter fact.`,
  );
  const syncEvent = requireFact(
    facts.state.syncEvent,
    `${facts.displayName} requires a state-sync event fact.`,
  );
  const formAttribute = requireFact(
    facts.attrs.form,
    `${facts.displayName} requires a form attribute fact.`,
  );
  const nameAttribute = requireFact(
    facts.attrs.name,
    `${facts.displayName} requires a name attribute fact.`,
  );
  const orientationAttribute = requireFact(
    facts.attrs.orientation,
    `${facts.displayName} requires an orientation attribute fact.`,
  );
  const readOnlyAttribute = requireFact(
    facts.attrs.readOnly,
    `${facts.displayName} requires a read-only attribute fact.`,
  );
  const requiredAttribute = requireFact(
    facts.attrs.required,
    `${facts.displayName} requires a required attribute fact.`,
  );
  const ariaDisabled = requireFact(
    facts.attrs.ariaDisabled,
    `${facts.displayName} requires aria-disabled facts.`,
  );
  const ariaOrientation = requireFact(
    facts.attrs.ariaOrientation,
    `${facts.displayName} requires aria-orientation facts.`,
  );
  const ariaReadOnly = requireFact(
    facts.attrs.ariaReadOnly,
    `${facts.displayName} requires aria-readonly facts.`,
  );
  const ariaRequired = requireFact(
    facts.attrs.ariaRequired,
    `${facts.displayName} requires aria-required facts.`,
  );
  const model = projectVueModel(facts.state.name);

  return {
    contents: `<script setup lang="ts">
import {
  ${facts.runtime.factory},
  type ${facts.state.type},
  type ${facts.event.detailsType},
} from "${facts.runtime.importSource}";
import { computed, onBeforeUnmount, onMounted, provide, ref, useAttrs, watch } from "vue";

import { ${context.componentName} } from "./${context.componentName}";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    ${facts.props.defaultValue.name}?: ${facts.state.type};
    ${facts.props.disabled.name}?: ${facts.props.disabled.type};
    ${form.name}?: ${form.type};
    ${model.modelProp}?: ${facts.state.type};
    ${name.name}?: ${name.type};
    ${orientation.name}?: ${orientation.type};
    ${readOnly.name}?: ${readOnly.type};
    ${required.name}?: ${required.type};
  }>(),
  {
    ${facts.props.disabled.name}: ${facts.props.disabled.defaultValue},
    ${model.modelProp}: undefined,
    ${orientation.name}: ${orientation.defaultValue},
    ${readOnly.name}: ${readOnly.defaultValue},
    ${required.name}: ${required.defaultValue},
  },
);
const emit = defineEmits<{
  ${facts.event.name}: [value: ${facts.event.valueType}, detail: ${facts.event.detailsType}];
  "${model.updateEvent}": [value: ${facts.event.valueType}];
}>();
defineSlots<{ default?: () => unknown }>();
const attrs = useAttrs();
const rootRef = ref<HTMLElement | null>(null);
const initialDefaultValue = props.${facts.props.defaultValue.name};
const uncontrolledValue = ref<${facts.state.type}>(initialDefaultValue);
const renderedValue = computed(() => props.${model.modelProp} ?? uncontrolledValue.value);
const renderedDisabled = computed(() => props.${facts.props.disabled.name});
const renderedForm = computed(() => props.${form.name});
const renderedName = computed(() => props.${name.name});
const renderedReadOnly = computed(() => props.${readOnly.name});
const renderedRequired = computed(() => props.${required.name});
let instance: ReturnType<typeof ${facts.runtime.factory}> | undefined;
let unsubscribeStateSync: (() => void) | undefined;
let instanceGeneration = 0;
let mounted = false;

provide(${context.componentName}, {
  ${facts.props.disabled.name}: renderedDisabled,
  ${form.name}: renderedForm,
  ${name.name}: renderedName,
  ${readOnly.name}: renderedReadOnly,
  ${required.name}: renderedRequired,
  ${facts.props.value.name}: renderedValue,
});

defineExpose({ element: rootRef });

function handleValueChange(_value: ${facts.event.valueType}, detail: ${facts.event.detailsType}): void {
  const eventInstance = instance;
  const eventGeneration = instanceGeneration;
  const eventWasControlled = props.${model.modelProp} !== undefined;
  emit("${facts.event.name}", detail.${facts.event.valueProperty}, detail);
  detail.onAccepted(() => {
    if (!mounted || instance !== eventInstance || instanceGeneration !== eventGeneration) {
      return;
    }
    if (!eventWasControlled) {
      uncontrolledValue.value = detail.${facts.event.valueProperty};
    }
    emit("${model.updateEvent}", detail.${facts.event.valueProperty});
  });
}

function handleStateSync(): void {
  if (props.${model.modelProp} === undefined && instance) {
    uncontrolledValue.value = instance.${facts.state.getter}();
  }
}

function destroyOwnedInstance(): void {
  instanceGeneration += 1;
  unsubscribeStateSync?.();
  unsubscribeStateSync = undefined;
  const ownedInstance = instance;
  if (!ownedInstance) return;
  instance = undefined;
  ownedInstance.destroy();
}

function setupRuntime(): void {
  destroyOwnedInstance();
  const element = rootRef.value;
  if (!element) return;
  const createdInstance = ${facts.runtime.factory}(element, {
    ${facts.props.defaultValue.name}: renderedValue.value,
    ${facts.props.disabled.name}: props.${facts.props.disabled.name},
    ${form.name}: props.${form.name},
    ${name.name}: props.${name.name},
    ${orientation.name}: props.${orientation.name},
    ${readOnly.name}: props.${readOnly.name},
    ${required.name}: props.${required.name},
    ${facts.event.callbackProp}: handleValueChange,
    ...(props.${model.modelProp} === undefined ? {} : { ${facts.props.value.name}: props.${model.modelProp} }),
  });
  instance = createdInstance;
  unsubscribeStateSync = createdInstance.subscribe("${syncEvent}", handleStateSync);
}

onMounted(() => {
  mounted = true;
  setupRuntime();
});

watch(
  () => props.${model.modelProp},
  (value, previousValue) => {
    const controllednessChanged = (value === undefined) !== (previousValue === undefined);
    if (controllednessChanged) {
      if (value === undefined && instance) {
        uncontrolledValue.value = instance.${facts.state.getter}();
      }
      setupRuntime();
      return;
    }
    if (value === undefined || !instance || Object.is(instance.${facts.state.getter}(), value)) return;
    instance.${facts.setters.value.method}(value, ${formatOptions(facts.setters.value.options)});
  },
  { flush: "post" },
);
watch(
  () => props.${facts.props.disabled.name},
  (value) => instance?.${facts.setters.disabled.method}(value),
);
watch(
  () => [props.${form.name}, props.${name.name}, props.${required.name}] as const,
  ([nextForm, nextName, nextRequired]) =>
    instance?.${formOptionsSetter.method}({
      ${form.name}: nextForm,
      ${name.name}: nextName,
      ${required.name}: nextRequired,
    }),
  { flush: "post" },
);
watch(
  () => props.${orientation.name},
  (value) => instance?.${orientationSetter.method}(value),
);
watch(
  () => props.${readOnly.name},
  (value) => instance?.${readOnlySetter.method}(value),
);

onBeforeUnmount(() => {
  mounted = false;
  destroyOwnedInstance();
});
</script>

<template>
  <${facts.rootPart.defaultElement}
    ref="rootRef"
    v-bind="attrs"
    ${facts.attrs.root}
    :${facts.attrs.defaultValue}="initialDefaultValue"
    :${facts.attrs.value}="renderedValue"
    :${facts.attrs.disabled}="props.${facts.props.disabled.name} ? '' : undefined"
    :${formAttribute}="props.${form.name}"
    :${nameAttribute}="props.${name.name}"
    :${orientationAttribute}="props.${orientation.name}"
    :${readOnlyAttribute}="props.${readOnly.name} ? '' : undefined"
    :${requiredAttribute}="props.${required.name} ? '' : undefined"
    :${ariaDisabled}="props.${facts.props.disabled.name} ? 'true' : undefined"
    :${ariaOrientation}="props.${orientation.name}"
    :${ariaReadOnly}="props.${readOnly.name} ? 'true' : undefined"
    :${ariaRequired}="props.${required.name} ? 'true' : undefined"
    role="${facts.rootPart.role}"
  >
    <slot />
  </${facts.rootPart.defaultElement}>
</template>
`,
    path: `${file.path}.vue`,
  };
}

function requireContext(facts: AdapterGroupedValueControlFacts) {
  if (!facts.context) throw new TypeError(`${facts.displayName} requires grouped context facts.`);
  return facts.context;
}

function requireFact<T>(value: T | undefined, message: string): T {
  if (value === undefined) throw new TypeError(message);
  return value;
}

function formatOptions(
  options: Readonly<Record<string, boolean | number | string>> | undefined,
): string {
  if (!options || Object.keys(options).length === 0) return "{}";
  return `{ ${Object.entries(options)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join(", ")} }`;
}
