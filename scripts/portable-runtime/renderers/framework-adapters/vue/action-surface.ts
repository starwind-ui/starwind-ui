import type { AdapterComponentFile, AdapterIndexFile, AdapterPrintedFile } from "../types.js";
import {
  printVueFamilyIndex,
  printVueOwnedInstanceDestroy,
  VUE_NON_SHIPPING_COMMENT,
} from "./primitive/shared-fragments.js";

export function printVueActionSurfaceIndex(file: AdapterIndexFile): AdapterPrintedFile {
  return printVueFamilyIndex(file, "action-surface");
}

export function printVueActionSurfaceComponent(file: AdapterComponentFile): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "action-surface") {
    throw new TypeError(
      "Vue action-surface projection requires an action-surface component model.",
    );
  }

  const { facts } = family;
  const disabled = facts.props.disabled.name;
  const focusableWhenDisabled = facts.props.focusableWhenDisabled.name;
  const type = facts.props.type.name;

  return {
    contents: `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";
import { onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    ${disabled}?: ${facts.props.disabled.type};
    ${focusableWhenDisabled}?: ${facts.props.focusableWhenDisabled.type};
    ${type}?: ${printVueType(facts.props.type.type)};
  }>(),
  {
    ${disabled}: false,
    ${focusableWhenDisabled}: false,
    ${type}: "button",
  },
);
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const rootRef = ref<HTMLButtonElement | null>(null);
let instance: ReturnType<typeof ${facts.runtime.factory}> | undefined;

defineExpose({
  element: rootRef,
});

${printVueOwnedInstanceDestroy()}

function setupRuntime(): void {
  destroyOwnedInstance();
  const element = rootRef.value;
  if (!element || !props.${facts.runtime.conditionalInit.prop}) return;

  instance = ${facts.runtime.factory}(element, {
    ${facts.runtime.disabledSetter.prop}: props.${facts.runtime.disabledSetter.prop},
  });
}

onMounted(setupRuntime);

watch(() => props.${facts.runtime.conditionalInit.prop}, setupRuntime);
watch(
  () => props.${facts.runtime.disabledSetter.prop},
  (${facts.runtime.disabledSetter.prop}) => {
    instance?.${facts.runtime.disabledSetter.method}(${facts.runtime.disabledSetter.prop});
  },
);

onBeforeUnmount(destroyOwnedInstance);
</script>

<template>
  <button
    ref="rootRef"
    v-bind="attrs"
    :${facts.attrs.type}="props.${type}"
    ${facts.attrs.root}
    data-sw-part="${facts.parts.root.name}"
    :${facts.attrs.focusableWhenDisabled}="props.${focusableWhenDisabled} ? '${facts.runtime.conditionalInit.truthyValue}' : undefined"
    :${facts.attrs.stateDisabled}="props.${disabled} ? '' : undefined"
    :${facts.attrs.ariaDisabled}="props.${disabled} && props.${focusableWhenDisabled} ? 'true' : undefined"
    :${facts.attrs.disabled}="props.${disabled} && !props.${focusableWhenDisabled}"
  >
    <slot />
  </button>
</template>
`,
    path: `${file.path}.vue`,
  };
}

function printVueType(type: string): string {
  const members = type.split("|").map((member) => member.trim());
  if (members.length > 1 && members.every((member) => /^[a-z][a-zA-Z0-9-]*$/.test(member))) {
    return members.map((member) => JSON.stringify(member)).join(" | ");
  }
  return type;
}
