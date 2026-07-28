import type {
  AdapterComponentFile,
  AdapterIndexFile,
  AdapterNativeDisabledFacts,
  AdapterNativeDisabledPart,
  AdapterPrintedFile,
} from "../types.js";
import {
  printVueFamilyIndex,
  printVueOwnedInstanceDestroy,
  VUE_NON_SHIPPING_COMMENT,
} from "./primitive/shared-fragments.js";

export function printVueNativeDisabledIndex(file: AdapterIndexFile): AdapterPrintedFile {
  return printVueFamilyIndex(file, "native-disabled");
}

export function printVueNativeDisabledComponent(
  file: AdapterComponentFile,
): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "native-disabled") {
    throw new TypeError(
      "Vue native-disabled projection requires a native-disabled component model.",
    );
  }

  const part = family.facts.parts.all.find(
    (candidate) => candidate.name === family.part,
  );
  if (!part) {
    throw new TypeError(
      `${family.facts.displayName} native-disabled facts are missing ${family.part} part.`,
    );
  }

  return part.name === family.facts.parts.root.name
    ? printRoot(file, family.facts)
    : printSlotPart(file, part);
}

function printRoot(
  file: AdapterComponentFile,
  facts: AdapterNativeDisabledFacts,
): AdapterPrintedFile {
  const disabled = facts.props.disabled.name;
  const part = facts.parts.root;

  return {
    contents: `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";
import { onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    ${disabled}?: ${facts.props.disabled.type};
  }>(),
  {
    ${disabled}: ${getDefaultValue(facts.props.disabled.defaultValue, facts.displayName, disabled)},
  },
);
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const rootRef = ref<${getElementType(part)} | null>(null);
let instance: ReturnType<typeof ${facts.runtime.factory}> | undefined;

defineExpose({
  element: rootRef,
});

${printVueOwnedInstanceDestroy()}

onMounted(() => {
  const element = rootRef.value;
  if (!element) throw new Error("${facts.displayName} requires its native root before Runtime setup.");

  instance = ${facts.runtime.factory}(element, {
    ${disabled}: props.${disabled},
  });
});

watch(
  () => props.${disabled},
  (nextDisabled) => {
    instance?.${facts.runtime.disabledSetter.method}(nextDisabled);
  },
);

onBeforeUnmount(destroyOwnedInstance);
</script>

<template>
  <${part.defaultElement}
    ref="rootRef"
    v-bind="attrs"
    ${part.discoveryAttribute}
    :${facts.attrs.stateDisabled}="props.${disabled} ? '' : undefined"
    :${facts.attrs.disabled}="props.${disabled}"
  >
    <slot />
  </${part.defaultElement}>
</template>
`,
    path: `${file.path}.vue`,
  };
}

function printSlotPart(
  file: AdapterComponentFile,
  part: AdapterNativeDisabledPart,
): AdapterPrintedFile {
  return {
    contents: `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { ref, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const rootRef = ref<${getElementType(part)} | null>(null);

defineExpose({
  element: rootRef,
});
</script>

<template>
  <${part.defaultElement}
    ref="rootRef"
    v-bind="attrs"
    ${part.discoveryAttribute}${part.role ? `\n    role="${part.role}"` : ""}
  >
    <slot />
  </${part.defaultElement}>
</template>
`,
    path: `${file.path}.vue`,
  };
}

function getElementType(part: AdapterNativeDisabledPart): string {
  if (part.defaultElement === "fieldset") return "HTMLFieldSetElement";
  if (part.defaultElement === "div") return "HTMLDivElement";
  return "HTMLElement";
}

function getDefaultValue(
  defaultValue: string | undefined,
  displayName: string,
  propName: string,
): string {
  if (defaultValue === undefined) {
    throw new TypeError(`${displayName} ${propName} prop is missing a default value.`);
  }
  return defaultValue;
}
