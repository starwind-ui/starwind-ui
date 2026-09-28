import {
  avatarFallbackHidden,
  avatarImageVisibility,
  avatarRecipe,
  avatarRefresh,
  avatarRefreshInputs,
  avatarSubscription,
} from "../../shared-recipes/media/avatar.js";
import { projectVueAttributeAccess } from "./public-contract.js";

const VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS = projectVueAttributeAccess([]);
const VUE_AVATAR_NAMESPACE_MEMBERS = [
  { key: "Root", name: "AvatarRoot" },
  { key: "Image", name: "AvatarImage" },
  { key: "Fallback", name: "AvatarFallback" },
] as const;

import type {
  AdapterComponentFile,
  AdapterIndexFile,
  AdapterMediaStatusFacts,
  AdapterPrintedFile,
} from "../types.js";
import { printVueFamilyIndex, printVueOwnedInstanceDestroy } from "./primitive/shared-fragments.js";

export function printVueMediaStatusIndex(file: AdapterIndexFile): AdapterPrintedFile {
  return printVueFamilyIndex(file, "media-status", {
    namespaceMembers: VUE_AVATAR_NAMESPACE_MEMBERS,
  });
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
  return `<script lang="ts">
import type { InjectionKey } from "vue";
export const mediaStatusKey: InjectionKey<() => void> = Symbol("${facts.displayName}");
</script>
<script setup lang="ts">
import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";
import { onBeforeUnmount, onMounted, provide, ref } from "vue";

defineOptions({ inheritAttrs: false });
defineSlots<{ default?: () => unknown }>();
const rootRef = ref<HTMLSpanElement | null>(null);
let instance: ReturnType<typeof ${facts.runtime.factory}> | undefined;
let refreshPending = false;
function requestRefresh(): void {
  ${avatarRefresh(facts, { instance: "instance", root: "rootRef.value", pending: "refreshPending" })}
}
provide(mediaStatusKey, requestRefresh);

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
    v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}"
    ${facts.parts.root.discoveryAttribute}
    ${facts.attrs.rootStatus}="${avatarRecipe.initialStatus}"
  >
    <slot />
  </${facts.parts.root.defaultElement}>
</template>
`;
}

function printImage(facts: AdapterMediaStatusFacts): string {
  const visibilityProperty = facts.presence.imageConcealment.property;

  return `<script setup lang="ts">
import type { ${facts.state.type}, ${facts.event.detailsType} } from "${facts.runtime.importSource}";
import { inject, onBeforeUnmount, onMounted, ref, useAttrs, type CSSProperties } from "vue";
import { mediaStatusKey } from "./${facts.exports.root}.vue";

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  ${facts.props.alt.name}: ${facts.props.alt.type};
  ${facts.props.src.name}?: ${facts.props.src.type};
}>();
const emit = defineEmits<{
  ${facts.event.name}: [status: ${facts.state.type}, detail: ${facts.event.detailsType}];
}>();
const attrs = useAttrs();
const requestRefresh = inject(mediaStatusKey, undefined);
const imageRef = ref<HTMLImageElement | null>(null);
let eventRoot: HTMLElement | undefined;

defineExpose({ element: imageRef });

function handleLoadingStatusChange(event: Event): void {
  if (event.target !== eventRoot) return;
  const detail = (event as CustomEvent<${facts.event.detailsType}>).detail;
  emit("${facts.event.name}", detail.${facts.event.valueProperty}, detail);
}

function unbindLoadingStatusChange(): void {
  eventRoot?.removeEventListener("${facts.event.domEvent}", handleLoadingStatusChange);
  eventRoot = undefined;
}

onMounted(() => {
  const root = imageRef.value?.closest<HTMLElement>("[${facts.parts.root.discoveryAttribute}]");
  if (!root) return;

  eventRoot = root;
  ${avatarSubscription({
    listen: `root.addEventListener("${facts.event.domEvent}", handleLoadingStatusChange);`,
    read: `root.getAttribute("${facts.attrs.rootStatus}") as ${facts.state.type} | null`,
    notify: `emit("${facts.event.name}", status, { previousStatus: "${avatarRecipe.initialStatus}", status });`,
  })}
  requestRefresh?.();
});
onBeforeUnmount(() => { unbindLoadingStatusChange(); requestRefresh?.(); });
</script>

<template>
  <${facts.parts.image.defaultElement}
    ref="imageRef"
    v-bind="attrs"
    :alt="props.${facts.props.alt.name}"
    :src="props.${facts.props.src.name}"
    ${facts.parts.image.discoveryAttribute}
    ${facts.attrs.imageStatus}="${avatarRecipe.initialStatus}"
    :style="[attrs.style, { ${visibilityProperty}: ${avatarImageVisibility(facts, `imageRef?.style.${visibilityProperty}`).replaceAll('"', "'")} } as CSSProperties]"
    :hidden="false"
  />
</template>
`;
}

function printFallback(facts: AdapterMediaStatusFacts): string {
  return `<script setup lang="ts">
import { inject, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";
import { mediaStatusKey } from "./${facts.exports.root}.vue";

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  ${facts.props.delay.name}?: ${facts.props.delay.type};
}>();
defineSlots<{ default?: () => unknown }>();
const attrs = useAttrs();
const fallbackRef = ref<HTMLSpanElement | null>(null);
const requestRefresh = inject(mediaStatusKey, undefined);
onMounted(() => requestRefresh?.());
onBeforeUnmount(() => requestRefresh?.());
watch(() => [${avatarRefreshInputs(facts, "fallback")
    .map((name) => `props.${name}`)
    .join(", ")}], () => requestRefresh?.(), { flush: "post" });

defineExpose({ element: fallbackRef });

</script>

<template>
  <${facts.parts.fallback.defaultElement}
    ref="fallbackRef"
    v-bind="attrs"
    ${facts.parts.fallback.discoveryAttribute}
    :${facts.attrs.fallbackDelay}="props.${facts.props.delay.name}"
    ${facts.attrs.fallbackStatus}="${avatarRecipe.initialStatus}"
    :hidden="${avatarFallbackHidden(`props.${facts.props.delay.name}`, "(attrs.hidden === '' || Boolean(attrs.hidden))").replaceAll('"', "'")}"
  >
    <slot />
  </${facts.parts.fallback.defaultElement}>
</template>
`;
}
