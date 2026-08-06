import type { AdapterComponentFile, AdapterIndexFile, AdapterPrintedFile } from "../types.js";
import { printVueFamilyIndex, VUE_NON_SHIPPING_COMMENT } from "./primitive/shared-fragments.js";

export function printVueDisclosurePresenceIndex(file: AdapterIndexFile): AdapterPrintedFile {
  return printVueFamilyIndex(file, "disclosure-presence");
}

export function printVueDisclosurePresenceComponent(
  file: AdapterComponentFile,
): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "disclosure-presence") {
    throw new TypeError(
      "Vue disclosure-presence projection requires a disclosure-presence component model.",
    );
  }

  const { facts, part } = family;
  const contents =
    part === "root"
      ? printRoot(facts)
      : part === "trigger"
        ? printTrigger(facts)
        : printPanel(facts);

  return { contents, path: `${file.path}.vue` };
}

function printRoot(
  facts: Extract<
    NonNullable<AdapterComponentFile["component"]["family"]>,
    { kind: "disclosure-presence" }
  >["facts"],
): string {
  const defaultOpen = facts.props.defaultOpen.name;
  const disabled = facts.props.disabled.name;
  const open = facts.props.open.name;
  const setterOptions = printOptions(facts.setter.options);

  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import {
  type ${facts.event.detailsType},
  ${facts.runtime.factory},
} from "${facts.runtime.importSource}";
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";
import { useVueAsChildRuntimeOwner } from "../_internal/as-child";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    ${defaultOpen}?: boolean;
    ${disabled}?: boolean;
    ${open}?: boolean;
  }>(),
  {
    ${defaultOpen}: false,
    ${disabled}: false,
    ${open}: undefined,
  },
);
const emit = defineEmits<{
  ${facts.event.name}: [open: boolean, detail: ${facts.event.detailsType}];
  "update:${open}": [open: boolean];
}>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const rootRef = ref<HTMLDivElement | null>(null);
const initialDefaultOpen = props.${defaultOpen};
const uncontrolledOpen = ref(initialDefaultOpen);
const renderedOpen = computed(() => props.${open} ?? uncontrolledOpen.value);
let instance: ReturnType<typeof ${facts.runtime.factory}> | undefined;

defineExpose({
  element: rootRef,
});

function handleOpenChange(nextOpen: boolean, detail: ${facts.event.detailsType}): void {
  const eventWasControlled = props.${open} !== undefined;
  emit("${facts.event.name}", nextOpen, detail);
  if (detail.isCanceled) return;

  if (!eventWasControlled) uncontrolledOpen.value = nextOpen;
  emit("update:${open}", nextOpen);
}

function destroyOwnedInstance(): void {
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
    ${defaultOpen}: uncontrolledOpen.value,
    ${disabled}: props.${disabled},
    ${facts.event.callbackProp}: handleOpenChange,
    ...(props.${open} === undefined ? {} : { ${open}: props.${open} }),
  });
}

useVueAsChildRuntimeOwner(rootRef, setupRuntime);
onMounted(setupRuntime);

watch(
  () => props.${open},
  (nextOpen, previousOpen) => {
    const controllednessChanged = (nextOpen === undefined) !== (previousOpen === undefined);
    if (controllednessChanged) {
      if (nextOpen === undefined && instance) {
        uncontrolledOpen.value = instance.${facts.openGetter}();
      }
      setupRuntime();
      return;
    }
    if (nextOpen === undefined || !instance || Object.is(instance.${facts.openGetter}(), nextOpen)) {
      return;
    }

    instance.${facts.setter.method}(nextOpen${setterOptions});
  },
  { flush: "post" },
);
watch(() => props.${disabled}, setupRuntime, { flush: "post" });

onBeforeUnmount(destroyOwnedInstance);
</script>

<template>
  <div
    ref="rootRef"
    v-bind="attrs"
    ${facts.attrs.root}
    data-sw-part="${facts.parts.root.name}"
    :${facts.attrs.defaultOpen}="initialDefaultOpen ? 'true' : undefined"
    :${facts.attrs.disabled}="props.${disabled} ? '' : undefined"
    :${facts.attrs.rootState}="renderedOpen ? 'open' : 'closed'"
  >
    <slot />
  </div>
</template>
`;
}

function printTrigger(
  facts: Extract<
    NonNullable<AdapterComponentFile["component"]["family"]>,
    { kind: "disclosure-presence" }
  >["facts"],
): string {
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { defineComponent, ref, useAttrs, type VNode } from "vue";
import { createVueAsChild } from "../_internal/as-child";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<{ ${facts.props.asChild.name}?: boolean }>(), {
  ${facts.props.asChild.name}: false,
});
const slots = defineSlots<{ default?: () => VNode[] }>();
const attrs = useAttrs();
const element = ref<HTMLElement | null>(null);
const asChild = createVueAsChild("${facts.exports.trigger}", element);
const { setElement } = asChild;

defineExpose({ element });

const AsChildTrigger = defineComponent({
  inheritAttrs: false,
  setup() {
    return () => {
      const children = slots.default?.() ?? [];
      const protectedProps = {
        "${facts.attrs.trigger}": "",
        "${facts.attrs.triggerExpanded}": "false",
        "${facts.attrs.triggerState}": "closed",
        "data-as-child": "",
        "data-sw-part": "${facts.parts.trigger.name}",
      };
      return asChild.render({
        children,
        consumerProps: attrs,
        defaultNativeButtonType: "button",
        protectedProps,
      });
    };
  },
});
</script>

<template>
  <AsChildTrigger v-if="props.${facts.props.asChild.name}" />
  <button
    v-else
    :ref="setElement"
    v-bind="attrs"
    ${facts.attrs.trigger}
    data-sw-part="${facts.parts.trigger.name}"
    type="button"
    ${facts.attrs.triggerExpanded}="false"
    ${facts.attrs.triggerState}="closed"
  >
    <slot />
  </button>
</template>
`;
}

function printPanel(
  facts: Extract<
    NonNullable<AdapterComponentFile["component"]["family"]>,
    { kind: "disclosure-presence" }
  >["facts"],
): string {
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { ref, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{ ${facts.props.hiddenUntilFound.name}?: boolean }>(),
  { ${facts.props.hiddenUntilFound.name}: false },
);
defineSlots<{ default?: () => unknown }>();
const attrs = useAttrs();
const element = ref<HTMLDivElement | null>(null);

defineExpose({ element });
</script>

<template>
  <div
    ref="element"
    v-bind="attrs"
    ${facts.attrs.panel}
    data-sw-part="${facts.parts.panel.name}"
    :${facts.attrs.panelHiddenUntilFound}="props.${facts.props.hiddenUntilFound.name} ? '' : undefined"
    ${facts.attrs.panelState}="closed"
    :${facts.attrs.panelHidden}="props.${facts.props.hiddenUntilFound.name} ? 'until-found' : true"
  >
    <slot />
  </div>
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
