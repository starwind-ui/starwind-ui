import { projectVueAttributeAccess } from "./public-contract.js";

const VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS = projectVueAttributeAccess([]);

import type {
  AdapterComponentFile,
  AdapterFormFieldCoordinatorFacts,
  AdapterIndexFile,
  AdapterPrintedFile,
} from "../types.js";
import { printVueFamilyIndex, printVueOwnedInstanceDestroy } from "./primitive/shared-fragments.js";

export function printVueFormFieldCoordinatorIndex(file: AdapterIndexFile): AdapterPrintedFile {
  const family = file.family;
  if (family?.kind !== "form-field-coordinator") {
    throw new TypeError(
      "Vue form-field-coordinator index projection requires form-field-coordinator facts.",
    );
  }

  const printed = printVueFamilyIndex(file, "form-field-coordinator");
  const { facts } = family;
  return {
    ...printed,
    contents: `${printed.contents}

export {
  ${facts.runtime.helperExports.join(",\n  ")},
} from "${facts.runtime.importSource}";
`,
  };
}

export function printVueFormFieldCoordinatorComponent(
  file: AdapterComponentFile,
): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "form-field-coordinator") {
    throw new TypeError(
      "Vue form-field-coordinator projection requires a form-field-coordinator component model.",
    );
  }

  return family.part === "root"
    ? printRoot(file, family.facts)
    : printErrorSummary(file, family.facts);
}

function printRoot(
  file: AdapterComponentFile,
  facts: AdapterFormFieldCoordinatorFacts,
): AdapterPrintedFile {
  const part = facts.parts.root;
  const dataErrorVisibility = toVuePropName(facts.attrs.errorVisibility);
  const dataRevalidationTiming = toVuePropName(facts.attrs.revalidationTiming);
  const dataValidationTiming = toVuePropName(facts.attrs.validationTiming);
  const errorVisibility = facts.props.errorVisibility.name;
  const revalidationTiming = facts.props.revalidationTiming.name;
  const validationTiming = facts.props.validationTiming.name;

  return {
    contents: `<script setup lang="ts">
import { ${facts.runtime.factory}, type ${facts.runtime.validationTimingType} } from "${facts.runtime.importSource}";
import { onBeforeUnmount, onMounted, ref } from "vue";

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  ${dataErrorVisibility}?: ${facts.runtime.validationTimingType};
  ${dataRevalidationTiming}?: ${facts.runtime.validationTimingType};
  ${dataValidationTiming}?: ${facts.runtime.validationTimingType};
  ${errorVisibility}?: ${facts.props.errorVisibility.type};
  ${revalidationTiming}?: ${facts.props.revalidationTiming.type};
  ${validationTiming}?: ${facts.props.validationTiming.type};
}>();
defineSlots<{
  default?: () => unknown;
}>();
const rootRef = ref<HTMLFormElement | null>(null);
let instance: ReturnType<typeof ${facts.runtime.factory}> | undefined;

defineExpose({
  element: rootRef,
});

${printVueOwnedInstanceDestroy()}

onMounted(() => {
  const element = rootRef.value;
  if (!element) throw new Error("${facts.displayName} requires its native form before Runtime setup.");

  instance = ${facts.runtime.factory}(element);
});

onBeforeUnmount(destroyOwnedInstance);
</script>

<template>
  <${part.defaultElement}
    ref="rootRef"
    v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}"
    ${facts.attrs.root}
    ${facts.attrs.rootSlot}="${part.slotValue}"
    :${facts.attrs.errorVisibility}="props.${dataErrorVisibility} ?? props.${errorVisibility}"
    :${facts.attrs.revalidationTiming}="props.${dataRevalidationTiming} ?? props.${revalidationTiming}"
    :${facts.attrs.validationTiming}="props.${dataValidationTiming} ?? props.${validationTiming}"
  >
    <slot />
  </${part.defaultElement}>
</template>
`,
    path: `${file.path}.vue`,
  };
}

function toVuePropName(attribute: string): string {
  return attribute.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase());
}

function printErrorSummary(
  file: AdapterComponentFile,
  facts: AdapterFormFieldCoordinatorFacts,
): AdapterPrintedFile {
  const part = facts.parts.errorSummary;

  return {
    contents: `<script setup lang="ts">
import { ref } from "vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    ariaAtomic?: boolean | "false" | "true";
    ariaLive?: "assertive" | "off" | "polite";
    hidden?: boolean;
    role?: string;
  }>(),
  {
    ariaAtomic: "true",
    ariaLive: "polite",
    hidden: true,
    role: "status",
  },
);
defineSlots<{
  default?: () => unknown;
}>();
const rootRef = ref<HTMLDivElement | null>(null);

defineExpose({
  element: rootRef,
});
</script>

<template>
  <${part.defaultElement}
    ref="rootRef"
    v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}"
    :${facts.attrs.errorSummaryRole}="props.role"
    :${facts.attrs.errorSummaryAriaLive}="props.ariaLive"
    :${facts.attrs.errorSummaryAriaAtomic}="props.ariaAtomic"
    :${facts.attrs.errorSummaryHidden}="props.hidden"
    ${facts.attrs.errorSummary}
    ${facts.attrs.errorSummarySlot}="${part.slotValue}"
  >
    <slot />
  </${part.defaultElement}>
</template>
`,
    path: `${file.path}.vue`,
  };
}
