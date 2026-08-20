import { projectVueAttributeAccess } from "./public-contract.js";

const VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS = projectVueAttributeAccess([]);

import type {
  AdapterFileDropControlComponentProjection,
  AdapterFileDropControlFacts,
  AdapterFileDropControlIndexProjection,
  AdapterFileDropControlPartName,
} from "../types.js";

const NON_SHIPPING_COMMENT =
  "Internal non-shipping Vue adapter output. Do not publish, expose through the CLI registry, claim in public docs, or copy into public demo dependencies.";

export function printVueFileDropControlComponent(
  family: AdapterFileDropControlComponentProjection,
): string {
  if (family.part === "root") return printRoot(family.facts);
  if (family.part === "input") return printInput(family.facts);
  return printStatusPart(family.facts, family.part);
}

export function printVueFileDropControlIndex(
  family: AdapterFileDropControlIndexProjection,
): string {
  const facts = family.facts;
  const imports = facts.index.importMembers
    .map((member) => `import ${member.name} from "${member.from}.vue";`)
    .join("\n");
  const namespaceEntries = facts.index.namespaceMembers
    .map((member) => `  ${member.key}: ${member.name},`)
    .join("\n");
  const exports = [
    facts.exports.namespace,
    ...facts.index.importMembers.map((member) => member.name),
  ]
    .map((name) => `  ${name},`)
    .join("\n");

  return `${imports}\n\nconst ${facts.exports.namespace} = {\n${namespaceEntries}\n};\n\nexport {\n${exports}\n};\n\nexport default ${facts.exports.namespace};\n\nexport type { ${facts.index.typeExports.join(", ")} } from "${facts.runtime.typeImportSource}";\n`;
}

function printRoot(facts: AdapterFileDropControlFacts): string {
  const props = facts.props;
  const part = facts.parts.root;
  const exportName = facts.exports.root;

  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import {
  ${facts.runtime.factory},
  type ${facts.event.detailsType},
} from "${facts.runtime.importSource}";
import { onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    ${props.disabled.name}?: ${props.disabled.type};
    ${props.isUploading.name}?: ${props.isUploading.type};
  }>(),
  {
    ${props.disabled.name}: ${props.disabled.defaultValue},
    ${props.isUploading.name}: ${props.isUploading.defaultValue},
  },
);
const emit = defineEmits<{
  filesChange: [files: ${facts.event.valueType}, detail: ${facts.event.detailsType}];
}>();
const attrs = useAttrs();
const element = ref<HTMLLabelElement | null>(null);
let instance: ReturnType<typeof ${facts.runtime.factory}> | undefined;

defineExpose({ element });

onMounted(() => {
  if (!element.value) return;
  instance = ${facts.runtime.factory}(element.value, {
    ${props.disabled.name}: props.${props.disabled.name},
    ${props.isUploading.name}: props.${props.isUploading.name},
    ${facts.event.callbackProp}: (files, detail) => emit("filesChange", files, detail),
  });
});

watch(
  () => props.${props.disabled.name},
  (value) => instance?.${facts.setters.disabled}(value),
);

watch(
  () => props.${props.isUploading.name},
  (value) => instance?.${facts.setters.uploading}(value),
);

onBeforeUnmount(() => {
  instance?.destroy();
  instance = undefined;
});
</script>

<template>
  <${part.defaultElement}
    ref="element"
    ${facts.attrs.root}
    :${facts.attrs.disabled}="props.${props.disabled.name} ? '' : undefined"
    ${facts.attrs.dragActive}="false"
    ${facts.attrs.hasFiles}="false"
    :${facts.attrs.isUploading}="props.${props.isUploading.name} ? 'true' : 'false'"
    :${facts.attrs.ariaDisabled}="props.${props.disabled.name} ? 'true' : 'false'"
    ${facts.attrs.role}="${part.role}"
    :tabindex="props.${props.disabled.name} ? -1 : 0"
    v-bind="attrs"
  >
    <slot />
  </${part.defaultElement}>
</template>
`;
}

function printInput(facts: AdapterFileDropControlFacts): string {
  const props = facts.props;
  const part = facts.parts.input;

  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { computed, ref, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    ${props.accept.name}?: ${props.accept.type};
    ${props.disabled.name}?: ${props.disabled.type};
    ${props.multiple.name}?: ${props.multiple.type};
    ${props.name.name}?: ${props.name.type};
    ${props.required.name}?: ${props.required.type};
  }>(),
  {
    ${props.disabled.name}: ${props.disabled.defaultValue},
  },
);
const attrs = useAttrs();
const element = ref<HTMLInputElement | null>(null);
const classes = computed(() =>
  [${JSON.stringify(facts.fileInput.hiddenClassValue)}, attrs.class]
    .filter(Boolean)
    .join(" "),
);

defineExpose({ element });
</script>

<template>
  <${part.defaultElement}
    ref="element"
    v-bind="{ ...attrs, class: undefined }"
    ${facts.attrs.input}
    :accept="props.${props.accept.name}"
    :class="classes"
    :${facts.attrs.disabled}="props.${props.disabled.name} ? '' : undefined"
    :${facts.fileInput.disabledForwardedAttribute}="props.${props.disabled.name}"
    :multiple="props.${props.multiple.name}"
    :name="props.${props.name.name}"
    :required="props.${props.required.name}"
    ${facts.attrs.inputTabIndex}="${facts.fileInput.tabIndexValue}"
    ${facts.attrs.inputType}="${facts.fileInput.typeValue}"
  />
</template>
`;
}

function printStatusPart(
  facts: AdapterFileDropControlFacts,
  partName: Exclude<AdapterFileDropControlPartName, "input" | "root">,
): string {
  const part = facts.parts[partName];
  const exportName = facts.exports[partName];
  const hasUploading = partName !== "filesList";
  const discoveryAttribute =
    partName === "filesList"
      ? facts.attrs.filesList
      : partName === "loadingIndicator"
        ? facts.attrs.loadingIndicator
        : facts.attrs.uploadIndicator;
  const stateAttributes =
    partName === "filesList"
      ? ` ${facts.fileList.stateAttribute}="${facts.fileList.emptyInitialState}"`
      : ` :${facts.attrs.isUploading}="props.${facts.props.isUploading.name} ? 'true' : 'false'"
    :hidden="${partName === "loadingIndicator" ? "!" : ""}props.${facts.props.isUploading.name}"`;

  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { ref } from "vue";

defineOptions({ inheritAttrs: false });

${hasUploading ? `const props = withDefaults(defineProps<{ ${facts.props.isUploading.name}?: ${facts.props.isUploading.type} }>(), { ${facts.props.isUploading.name}: ${facts.props.isUploading.defaultValue} });` : ""}
const element = ref<HTMLDivElement | null>(null);

defineExpose({ element });
</script>

<template>
  <${part.defaultElement} ref="element" ${discoveryAttribute}${stateAttributes} v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}"><slot /></${part.defaultElement}>
</template>
`;
}
