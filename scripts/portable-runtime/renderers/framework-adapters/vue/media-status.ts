import type {
  AdapterComponentFile,
  AdapterIndexFile,
  AdapterMediaStatusFacts,
  AdapterPrintedFile,
} from "../types.js";
import {
  printVueFamilyIndex,
  printVueOwnedInstanceDestroy,
  VUE_NON_SHIPPING_COMMENT,
} from "./primitive/shared-fragments.js";

export function printVueMediaStatusIndex(file: AdapterIndexFile): AdapterPrintedFile {
  return printVueFamilyIndex(file, "media-status");
}

export function printVueMediaStatusComponent(file: AdapterComponentFile): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "media-status") {
    throw new TypeError("Vue media-status projection requires a media-status component model.");
  }

  const contents =
    family.part === "root"
      ? printRoot(family.facts)
      : family.part === "image"
        ? printImage(family.facts)
        : printFallback(family.facts);

  return { contents, path: `${file.path}.vue` };
}

function printRoot(facts: AdapterMediaStatusFacts): string {
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";
import { onBeforeUnmount, onMounted, ref, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });
defineSlots<{ default?: () => unknown }>();
const attrs = useAttrs();
const rootRef = ref<HTMLSpanElement | null>(null);
let instance: ReturnType<typeof ${facts.runtime.factory}> | undefined;

defineExpose({ element: rootRef });

${printVueOwnedInstanceDestroy()}

function setupRuntime(): void {
  destroyOwnedInstance();
  const element = rootRef.value;
  if (!element) return;

  instance = ${facts.runtime.factory}(element);
}

onMounted(setupRuntime);
onBeforeUnmount(destroyOwnedInstance);
</script>

<template>
  <${facts.parts.root.defaultElement}
    ref="rootRef"
    v-bind="attrs"
    ${facts.parts.root.discoveryAttribute}
    ${facts.attrs.rootStatus}="idle"
  >
    <slot />
  </${facts.parts.root.defaultElement}>
</template>
`;
}

function printImage(facts: AdapterMediaStatusFacts): string {
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import type { ${facts.state.type}, ${facts.event.detailsType} } from "${facts.runtime.importSource}";
import { onBeforeUnmount, onMounted, ref, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  ${facts.props.alt.name}: ${facts.props.alt.type};
  ${facts.props.src.name}?: ${facts.props.src.type};
}>();
const emit = defineEmits<{
  ${facts.event.name}: [status: ${facts.state.type}, detail: ${facts.event.detailsType}];
}>();
const attrs = useAttrs();
const imageRef = ref<HTMLImageElement | null>(null);
let eventRoot: HTMLElement | undefined;

defineExpose({ element: imageRef });

function handleLoadingStatusChange(event: Event): void {
  const detail = (event as CustomEvent<${facts.event.detailsType}>).detail;
  emit("${facts.event.name}", detail.${facts.event.valueProperty}, detail);
}

function notifyCurrentLoadingStatus(root: HTMLElement): void {
  const status = root.getAttribute("${facts.attrs.rootStatus}") as ${facts.state.type} | null;
  if (!status || status === "idle") return;

  emit("${facts.event.name}", status, { previousStatus: "idle", status });
}

function unbindLoadingStatusChange(): void {
  eventRoot?.removeEventListener("${facts.event.domEvent}", handleLoadingStatusChange);
  eventRoot = undefined;
}

onMounted(() => {
  const root = imageRef.value?.closest<HTMLElement>("[${facts.parts.root.discoveryAttribute}]");
  if (!root) return;

  eventRoot = root;
  root.addEventListener("${facts.event.domEvent}", handleLoadingStatusChange);
  notifyCurrentLoadingStatus(root);
});
onBeforeUnmount(unbindLoadingStatusChange);
</script>

<template>
  <${facts.parts.image.defaultElement}
    ref="imageRef"
    v-bind="attrs"
    :alt="props.${facts.props.alt.name}"
    :src="props.${facts.props.src.name}"
    ${facts.parts.image.discoveryAttribute}
    ${facts.attrs.imageStatus}="idle"
    :hidden="true"
  />
</template>
`;
}

function printFallback(facts: AdapterMediaStatusFacts): string {
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { ref, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  ${facts.props.delay.name}?: ${facts.props.delay.type};
}>();
defineSlots<{ default?: () => unknown }>();
const attrs = useAttrs();
const fallbackRef = ref<HTMLSpanElement | null>(null);

defineExpose({ element: fallbackRef });

function includesBooleanAttribute(value: unknown): boolean {
  return value === "" || Boolean(value);
}
</script>

<template>
  <${facts.parts.fallback.defaultElement}
    ref="fallbackRef"
    v-bind="attrs"
    ${facts.parts.fallback.discoveryAttribute}
    :${facts.attrs.fallbackDelay}="props.${facts.props.delay.name}"
    ${facts.attrs.fallbackStatus}="idle"
    :hidden="props.${facts.props.delay.name} !== undefined || includesBooleanAttribute(attrs.hidden)"
  >
    <slot />
  </${facts.parts.fallback.defaultElement}>
</template>
`;
}
