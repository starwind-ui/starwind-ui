import {
  otpCaretFallbackClass,
  otpConnection,
  otpInitialSeed,
  otpInputMode,
  otpPattern,
  otpTabIndex,
} from "../../shared-recipes/structured/file-controls/input-otp-recipe.js";
import { projectVueAttributeAccess } from "./public-contract.js";

const VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS = projectVueAttributeAccess([]);

import type {
  AdapterHiddenInputVisualSlotComponentProjection,
  AdapterHiddenInputVisualSlotFacts,
  AdapterHiddenInputVisualSlotIndexProjection,
} from "../types.js";

export function printVueHiddenInputVisualSlotComponent(
  family: AdapterHiddenInputVisualSlotComponentProjection,
): string {
  if (family.part === "root") return printRoot(family.facts);
  if (family.part === "slot") return printSlot(family.facts);
  return printSimplePart(family.facts, family.part);
}

export function printVueHiddenInputVisualSlotIndex(
  family: AdapterHiddenInputVisualSlotIndexProjection,
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

function printRoot(facts: AdapterHiddenInputVisualSlotFacts): string {
  const props = facts.props;
  const event = facts.event;
  const connection = otpConnection(facts, {
    authority: "parent",
    parentAcceptance: "reconcile-model",
    read: "readInputs()",
    seed: "initialDefaultValue",
    current: "uncontrolledValue.value",
    notify: (value, detail) => `emit("valueChange", ${value}, ${detail});`,
    writeCurrent: (value) => `uncontrolledValue.value = ${value};`,
    publish: (value) => `modelValue.value = ${value};`,
    untrack: (body) => body,
    afterCommit: (body) => `void nextTick(() => { ${body} });`,
  });

  return `<script setup lang="ts">
import {
  ${facts.runtime.factory},
  type ${event.detailsType},
} from "${facts.runtime.importSource}";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  ref,
  useAttrs,
} from "vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    ${props.defaultValue.name}?: ${props.defaultValue.type};
    ${props.disabled.name}?: ${props.disabled.type};
    ${props.form.name}?: ${props.form.type};
    ${props.id.name}?: ${props.id.type};
    ${props.maxLength.name}?: ${props.maxLength.type};
    ${props.name.name}?: ${props.name.type};
    ${props.pattern.name}?: ${props.pattern.type};
    ${props.readOnly.name}?: ${props.readOnly.type};
    ${props.required.name}?: ${props.required.type};
  }>(),
  {
    ${props.disabled.name}: ${props.disabled.defaultValue},
    ${props.maxLength.name}: ${props.maxLength.defaultValue},
    ${props.readOnly.name}: ${props.readOnly.defaultValue},
    ${props.required.name}: ${props.required.defaultValue},
  },
);
const modelValue = defineModel<${facts.state.type}>();
const emit = defineEmits<{
  valueChange: [value: ${event.valueType}, detail: ${event.detailsType}];
}>();
const attrs = useAttrs();
const element = ref<HTMLDivElement | null>(null);
const controlled = modelValue.value !== undefined;
const initialDefaultValue = ${otpInitialSeed("parent", `props.${props.defaultValue.name}`)};
const uncontrolledValue = ref(initialDefaultValue);
const renderedValue = computed(() =>
  controlled ? (modelValue.value ?? uncontrolledValue.value) : uncontrolledValue.value,
);
const patternText = computed(() => ${otpPattern(facts, `props.${props.pattern.name}`)});
const inputMode = computed(() => ${otpInputMode(facts, "patternText.value")});
function readInputs() {
  return { value: modelValue.value, ${["disabled", "form", "id", "maxLength", "name", "readOnly", "required"].map((name) => `${name}: props.${name}`).join(", ")}, pattern: patternText.value };
}
${connection}
let connection: ReturnType<typeof connectOtp> | undefined;
defineExpose({ element });
onMounted(() => { if (element.value) connection = connectOtp(element.value); });
onUpdated(() => { connection?.update(); });
onBeforeUnmount(() => { const owned = connection; connection = undefined; owned?.destroy(); });

</script>

<template>
  <${facts.parts.root.defaultElement}
    ref="element"
    ${facts.attrs.root}
    :${facts.attrs.defaultValue}="initialDefaultValue"
    :${facts.attrs.disabled}="props.${props.disabled.name} ? '' : undefined"
    :${facts.attrs.form}="props.${props.form.name}"
    :${facts.attrs.id}="props.${props.id.name}"
    :${facts.attrs.maxLength}="props.${props.maxLength.name}"
    :${facts.attrs.name}="props.${props.name.name}"
    :${facts.attrs.pattern}="patternText"
    :${facts.attrs.readOnly}="props.${props.readOnly.name} ? '' : undefined"
    :${facts.attrs.required}="props.${props.required.name} ? '' : undefined"
    :${facts.attrs.value}="renderedValue"
    :${facts.attrs.ariaDisabled}="props.${props.disabled.name} ? 'true' : 'false'"
    :${facts.attrs.rootTabIndex === "tabIndex" ? "tabindex" : facts.attrs.rootTabIndex}="${otpTabIndex(`props.${props.disabled.name}`)}"
    v-bind="attrs"
  >
    <${facts.parts.input.defaultElement}
      v-once
      ${facts.attrs.input}
      ${facts.attrs.inputAutocomplete}="${facts.nativeInput.autocompleteValue}"
      ${facts.attrs.inputClass}="${facts.nativeInput.hiddenClassValue}"
      :disabled="props.${props.disabled.name}"
      :form="props.${props.form.name}"
      :id="props.${props.id.name}"
      :${facts.attrs.inputMode}="inputMode"
      :${facts.attrs.inputMaxLength}="props.${props.maxLength.name}"
      :name="props.${props.name.name}"
      :${facts.attrs.inputReadOnly}="props.${props.readOnly.name}"
      :required="props.${props.required.name}"
      :${facts.attrs.inputTabIndex === "tabIndex" ? "tabindex" : facts.attrs.inputTabIndex}="${facts.nativeInput.tabIndexValue}"
      :value="renderedValue"
    />
    <slot />
  </${facts.parts.root.defaultElement}>
</template>
`;
}

function printSimplePart(
  facts: AdapterHiddenInputVisualSlotFacts,
  partName: "group" | "separator",
): string {
  const part = facts.parts[partName];
  const elementType = part.defaultElement === "span" ? "HTMLSpanElement" : "HTMLDivElement";
  const separatorAttrs =
    partName === "separator"
      ? ` ${facts.attrs.separatorAriaHidden}="${facts.visualSlots.separator.ariaHiddenValue}" role="${facts.visualSlots.separator.role}"`
      : "";

  return `<script setup lang="ts">
import { ref } from "vue";

defineOptions({ inheritAttrs: false });
const element = ref<${elementType} | null>(null);

defineExpose({ element });
</script>

<template>
  <${part.defaultElement} ref="element" ${part.discoveryAttribute}${separatorAttrs} v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}"><slot /></${part.defaultElement}>
</template>
`;
}

function printSlot(facts: AdapterHiddenInputVisualSlotFacts): string {
  const props = facts.props;
  const part = facts.parts.slot;

  return `<script setup lang="ts">
import { ref } from "vue";

defineOptions({ inheritAttrs: false });

defineProps<{
  ${props.index.name}?: ${props.index.type};
}>();
defineSlots<{
  ${facts.visualSlots.caretRendering.outletName}?: () => unknown;
}>();
const element = ref<HTMLDivElement | null>(null);

defineExpose({ element });
</script>

<template>
  <${part.defaultElement}
    ref="element"
    ${facts.attrs.slot}
    :${facts.attrs.slotIndex}="${props.index.name}"
    v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}"
  >
    <${facts.parts.slotChar.defaultElement} ${facts.attrs.slotChar} />
    <${facts.parts.slotCaret.defaultElement}
      ${facts.attrs.slotCaret}
      ${facts.attrs.slotCaretClass}="${facts.visualSlots.slotCaret.classValue}"
      ${facts.attrs.slotCaretHidden}
    >
      <slot name="${facts.visualSlots.caretRendering.outletName}">
        <div class="${otpCaretFallbackClass}" />
      </slot>
    </${facts.parts.slotCaret.defaultElement}>
  </${part.defaultElement}>
</template>
`;
}
