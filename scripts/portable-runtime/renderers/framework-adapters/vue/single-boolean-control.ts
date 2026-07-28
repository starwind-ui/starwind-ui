import type { AdapterComponentFile, AdapterIndexFile, AdapterPrintedFile } from "../types.js";
import { printVueFamilyIndex, VUE_NON_SHIPPING_COMMENT } from "./primitive/shared-fragments.js";

export function printVueSingleBooleanControlIndex(file: AdapterIndexFile): AdapterPrintedFile {
  return printVueFamilyIndex(file, "single-boolean-control");
}

export function printVueSingleBooleanControlComponent(
  file: AdapterComponentFile,
): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "single-boolean-control") {
    throw new TypeError(
      "Vue single-boolean-control projection requires a single-boolean-control component model.",
    );
  }

  const { facts } = family;
  const state = facts.props.state.name;
  const defaultState = facts.props.defaultState.name;
  const disabled = facts.props.disabled.name;
  const nativeButton = facts.props.nativeButton.name;
  const syncGroup = facts.props.syncGroup.name;
  const value = facts.props.value.name;
  const detailType = facts.event.detailsType;
  const statePascal = facts.state.pascalName;
  const stateSetterOptions = printOptions(facts.setters.state.options);
  const group = facts.group;
  if (!group || group.requirement !== "optional") {
    throw new TypeError("Vue Toggle projection requires optional toggle-group context facts.");
  }

  return {
    contents: `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { ${facts.runtime.factory}, type ${detailType} } from "${facts.runtime.importSource}";
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";

import { ${group.hookName} } from "${group.importPath}";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    ${state}?: boolean;
    ${defaultState}?: boolean;
    ${disabled}?: boolean;
    ${nativeButton}?: boolean;
    ${syncGroup}?: string;
    ${value}?: string;
  }>(),
  {
    ${state}: undefined,
    ${defaultState}: false,
    ${disabled}: false,
    ${nativeButton}: true,
  },
);
const emit = defineEmits<{
  ${facts.event.name}: [value: boolean, detail: ${detailType}];
  "update:${state}": [value: boolean];
}>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const rootRef = ref<HTMLElement | null>(null);
const ${group.variableName} = ${group.hookName}();
const isGroupOwned = ${group.variableName} !== undefined;
const group${statePascal} = computed(() =>
  ${group.variableName} && props.${value} !== undefined
    ? ${group.variableName}.${value}.value.includes(props.${value})
    : undefined,
);
const effectiveDisabled = computed(() => props.${disabled} || ${group.variableName}?.${disabled}.value === true);
const initialDefault${statePascal} = props.${defaultState};
const uncontrolled${statePascal} = ref(initialDefault${statePascal});
const runtime${statePascal} = ref(initialDefault${statePascal});
const rendered${statePascal} = computed(
  () =>
    group${statePascal}.value ??
    (isGroupOwned ? runtime${statePascal}.value : (props.${state} ?? uncontrolled${statePascal}.value)),
);
let instance: ReturnType<typeof ${facts.runtime.factory}> | undefined;
let observer: MutationObserver | undefined;
let instanceGeneration = 0;
let mounted = false;

defineExpose({
  element: rootRef,
});

function handle${statePascal}Change(${state}: boolean, detail: ${detailType}): void {
  const eventInstance = instance;
  const eventGeneration = instanceGeneration;
  const eventWasGroupOwned = isGroupOwned;
  const eventWasControlled = !eventWasGroupOwned && props.${state} !== undefined;
  emit("${facts.event.name}", ${state}, detail);
  queueMicrotask(() => {
    if (
      detail.isCanceled ||
      !mounted ||
      instance !== eventInstance ||
      instanceGeneration !== eventGeneration
    ) {
      return;
    }

    if (!eventWasGroupOwned && !eventWasControlled) {
      uncontrolled${statePascal}.value = ${state};
    }
    emit("update:${state}", ${state});
  });
}

function destroyOwnedInstance(): void {
  instanceGeneration += 1;
  observer?.disconnect();
  observer = undefined;
  const ownedInstance = instance;
  if (!ownedInstance) return;

  if (instance === ownedInstance) instance = undefined;
  ownedInstance.destroy();
}

function setupRuntime(): void {
  destroyOwnedInstance();
  const element = rootRef.value;
  if (!element) return;

  instance = ${facts.runtime.factory}(element, {
    ${defaultState}: rendered${statePascal}.value,
    ${disabled}: effectiveDisabled.value,
    ${nativeButton}: props.${nativeButton},
    ${syncGroup}: props.${syncGroup},
    ${value}: props.${value},
    ${facts.event.callbackProp}: handle${statePascal}Change,
    ...(isGroupOwned
      ? { ${state}: rendered${statePascal}.value }
      : props.${state} === undefined
        ? {}
        : { ${state}: props.${state} }),
  });

  const syncRuntime${statePascal} = () => {
    runtime${statePascal}.value = element.getAttribute("${facts.attrs.ariaState}") === "true";
  };
  observer = new MutationObserver(syncRuntime${statePascal});
  observer.observe(element, {
    attributes: true,
    attributeFilter: ["${facts.attrs.ariaState}"],
  });
  syncRuntime${statePascal}();
}

onMounted(() => {
  mounted = true;
  setupRuntime();
});

watch(
  () => props.${state},
  (${state}, previous${statePascal}) => {
    if (isGroupOwned) return;
    const controllednessChanged = (${state} === undefined) !== (previous${statePascal} === undefined);
    if (controllednessChanged) {
      if (${state} === undefined && instance) {
        uncontrolled${statePascal}.value = instance.${facts.state.getter}();
      }
      setupRuntime();
      return;
    }
    if (${state} === undefined || !instance || Object.is(instance.${facts.state.getter}(), ${state})) {
      return;
    }

    instance.${facts.setters.state.method}(${state}${stateSetterOptions});
  },
  { flush: "post" },
);
watch(group${statePascal}, (next${statePascal}) => {
  if (
    !isGroupOwned ||
    next${statePascal} === undefined ||
    !instance ||
    Object.is(instance.${facts.state.getter}(), next${statePascal})
  ) {
    return;
  }
  instance.${facts.setters.state.method}(next${statePascal}${stateSetterOptions});
});
watch(effectiveDisabled, (nextDisabled) => {
  if (!instance || rootRef.value?.hasAttribute("${facts.attrs.disabled}") === nextDisabled) return;
  instance.${facts.setters.disabled.method}(nextDisabled);
});
watch(() => [props.${nativeButton}, props.${syncGroup}, props.${value}] as const, setupRuntime, {
  flush: "post",
});

onBeforeUnmount(() => {
  mounted = false;
  destroyOwnedInstance();
});
</script>

<template>
  <component
    :is="props.${nativeButton} ? '${facts.part.defaultElement}' : '${facts.render.nonNativeElement}'"
    ref="rootRef"
    v-bind="attrs"
    ${facts.part.discoveryAttribute}
    data-sw-part="${facts.part.name}"
    :type="props.${nativeButton} ? 'button' : undefined"
    :role="props.${nativeButton} ? undefined : 'button'"
    :aria-disabled="!props.${nativeButton} && effectiveDisabled ? 'true' : undefined"
    :aria-pressed="String(rendered${statePascal})"
    :${facts.attrs.defaultState}="
      !isGroupOwned && props.${state} === undefined && initialDefault${statePascal} ? 'true' : undefined
    "
    :${facts.attrs.disabled}="effectiveDisabled ? '' : undefined"
    :${facts.attrs.native}="props.${nativeButton} ? undefined : 'false'"
    :${facts.attrs.truthyPresence}="rendered${statePascal} ? '' : undefined"
    :${facts.attrs.state}="rendered${statePascal} ? 'on' : 'off'"
    :${facts.attrs.syncGroup}="props.${syncGroup}"
    :${facts.attrs.falsyPresence}="rendered${statePascal} ? undefined : ''"
    :${facts.attrs.value}="props.${value}"
    :disabled="props.${nativeButton} ? effectiveDisabled : undefined"
    :tabindex="props.${nativeButton} ? undefined : effectiveDisabled ? -1 : 0"
    :value="props.${nativeButton} ? props.${value} : undefined"
  >
    <slot />
  </component>
</template>
`,
    path: `${file.path}.vue`,
  };
}

function printOptions(options: Record<string, boolean | number | string> | undefined): string {
  if (!options || Object.keys(options).length === 0) return "";
  const fields = Object.entries(options)
    .map(([name, value]) => `${name}: ${JSON.stringify(value)}`)
    .join(", ");
  return `, { ${fields} }`;
}
