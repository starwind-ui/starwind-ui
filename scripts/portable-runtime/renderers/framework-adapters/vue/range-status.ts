import type {
  AdapterComponentFile,
  AdapterIndexFile,
  AdapterRangeStatusFacts,
  AdapterRangeStatusPartName,
  AdapterPrintedFile,
} from "../types.js";
import {
  printVueFamilyIndex,
  printVueOwnedInstanceDestroy,
  VUE_NON_SHIPPING_COMMENT,
} from "./primitive/shared-fragments.js";

export function printVueRangeStatusIndex(file: AdapterIndexFile): AdapterPrintedFile {
  return printVueFamilyIndex(file, "range-status");
}

export function printVueRangeStatusComponent(file: AdapterComponentFile): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "range-status") {
    throw new TypeError("Vue range-status projection requires a range-status component model.");
  }

  const contents =
    family.part === "root" ? printRoot(family.facts) : printPassivePart(family.facts, family.part);

  return { contents, path: `${file.path}.vue` };
}

function printRoot(facts: AdapterRangeStatusFacts): string {
  const format = requireProp(facts, facts.props.format, "format");
  const getAriaValueText = requireProp(facts, facts.props.getAriaValueText, "getAriaValueText");
  const locale = requireProp(facts, facts.props.locale, "locale");
  const formatOptionsSetter = requireSetter(
    facts,
    facts.setters.formatOptionsSetter,
    "format options",
  );
  const valueSetter = requireSetter(facts, facts.setters.valueSetter, "value");
  const root = facts.parts.root;
  const elementType = getElementType(root.defaultElement);

  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { ${facts.runtime.factory}, type ${facts.state.valueType} } from "${facts.runtime.importSource}";
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    ${format.name}?: ${format.type};
    ${getAriaValueText.name}?: ${getAriaValueText.type};
    ${locale.name}?: ${locale.type};
    ${facts.props.max.name}?: ${facts.props.max.type};
    ${facts.props.min.name}?: ${facts.props.min.type};
    ${facts.props.value.name}?: ${facts.state.valueType};
  }>(),
  {
    ${facts.props.max.name}: ${getPropDefault(facts, facts.props.max)},
    ${facts.props.min.name}: ${getPropDefault(facts, facts.props.min)},
    ${facts.props.value.name}: ${getPropDefault(facts, facts.props.value)},
  },
);
defineSlots<{ default?: () => unknown }>();
const attrs = useAttrs();
const rootRef = ref<${elementType} | null>(null);
const isIndeterminate = computed(() => props.${facts.props.value.name} == null);
let instance: ReturnType<typeof ${facts.runtime.factory}> | undefined;

defineExpose({ element: rootRef });

function readAriaValueText(): string | undefined {
  const value = attrs["aria-valuetext"];
  return typeof value === "string" ? value : undefined;
}

${printVueOwnedInstanceDestroy()}

function setupRuntime(): void {
  const element = rootRef.value;
  if (!element) return;

  instance = ${facts.runtime.factory}(element, {
    ariaValueText: readAriaValueText(),
    ${format.name}: props.${format.name},
    ${getAriaValueText.name}: props.${getAriaValueText.name},
    ${locale.name}: props.${locale.name},
    ${facts.props.max.name}: props.${facts.props.max.name},
    ${facts.props.min.name}: props.${facts.props.min.name},
    ${facts.props.value.name}: props.${facts.props.value.name},
  });
}

onMounted(setupRuntime);
onBeforeUnmount(destroyOwnedInstance);

watch(
  [
    () => attrs["aria-valuetext"],
    () => props.${format.name},
    () => props.${getAriaValueText.name},
    () => props.${locale.name},
  ],
  () => {
    const ownedInstance = instance;
    if (!ownedInstance) return;

    ownedInstance.${formatOptionsSetter.method}({
      ariaValueText: readAriaValueText(),
      ${format.name}: props.${format.name},
      ${getAriaValueText.name}: props.${getAriaValueText.name},
      ${locale.name}: props.${locale.name},
    });
  },
);

watch(
  [() => props.${facts.props.value.name}, () => props.${facts.props.max.name}, () => props.${facts.props.min.name}],
  ([value, max, min]) => {
    const ownedInstance = instance;
    if (!ownedInstance) return;

    ownedInstance.${valueSetter.method}(value, { max, min });
  },
);
</script>

<template>
  <${root.defaultElement}
    ref="rootRef"
    v-bind="attrs"
    ${root.discoveryAttribute}
    :${facts.attrs.value}="isIndeterminate ? undefined : props.${facts.props.value.name}"
    :${facts.attrs.min}="props.${facts.props.min.name}"
    :${facts.attrs.max}="props.${facts.props.max.name}"
    :${facts.attrs.indeterminate}="isIndeterminate ? '' : undefined"
    role="${root.role}"
  >
    <slot />
  </${root.defaultElement}>
</template>
`;
}

function printPassivePart(
  facts: AdapterRangeStatusFacts,
  partName: Exclude<AdapterRangeStatusPartName, "root">,
): string {
  const part = facts.parts[partName];
  const refName = `${partName}Ref`;
  const elementType = getElementType(part.defaultElement);
  const protectedAttributes =
    partName === "value"
      ? `
    :${facts.attrs.valuePreserveText}="slots.default ? '' : undefined"
    ${facts.attrs.valueAriaHidden.attribute}="${facts.attrs.valueAriaHidden.value}"`
      : partName === "label"
        ? `
    ${facts.attrs.labelRole.attribute}="${facts.attrs.labelRole.value}"`
        : "";

  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { ref, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });
const slots = defineSlots<{ default?: () => unknown }>();
const attrs = useAttrs();
const ${refName} = ref<${elementType} | null>(null);

defineExpose({ element: ${refName} });
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

function requireProp<T>(facts: AdapterRangeStatusFacts, prop: T | undefined, label: string): T {
  if (!prop) throw new Error(`${facts.displayName} range-status facts are missing ${label} prop.`);
  return prop;
}

function requireSetter<T>(facts: AdapterRangeStatusFacts, setter: T | undefined, label: string): T {
  if (!setter) {
    throw new Error(`${facts.displayName} range-status facts are missing ${label} setter.`);
  }
  return setter;
}

function getPropDefault(
  facts: AdapterRangeStatusFacts,
  prop: AdapterRangeStatusFacts["props"]["value"],
): string {
  if (prop.defaultValue === undefined) {
    throw new Error(`${facts.displayName} ${prop.name} prop is missing a default value.`);
  }
  return prop.defaultValue;
}

function getElementType(tagName: string): string {
  if (tagName === "div") return "HTMLDivElement";
  if (tagName === "span") return "HTMLSpanElement";
  return "HTMLElement";
}
