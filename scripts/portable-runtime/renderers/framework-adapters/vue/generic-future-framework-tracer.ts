import {
  formatOptions,
  getEvent,
  getPart,
  getPlanPropDefault,
  getRequiredValue,
  getRootPart,
  getStateModel,
  getStateSetter,
} from "../../generic-adapter-plan/future-framework-tracer-utils.js";
import { getBooleanFormControlFacts } from "../../generic-adapter-plan/families/boolean-form-control.js";
import type {
  GenericAdapterPlan,
  GenericAdapterPlanPart,
  GenericAdapterPlanPrintedFile,
} from "../../generic-adapter-plan/types.js";

export function printGenericFutureFrameworkTracerPlan(
  plan: GenericAdapterPlan,
): GenericAdapterPlanPrintedFile[] {
  if (plan.component === "button") {
    return [
      {
        contents: renderVueButtonRoot(plan, getRootPart(plan)),
        path: "__future-fixtures/vue/button/ButtonRoot.vue",
      },
    ];
  }

  if (plan.component === "toggle") {
    return [
      {
        contents: renderVueToggleRoot(plan, getRootPart(plan)),
        path: "__future-fixtures/vue/toggle/ToggleRoot.vue",
      },
    ];
  }

  if (plan.component === "collapsible") {
    return [
      {
        contents: renderVueCollapsibleRoot(plan, getPart(plan, "root")),
        path: "__future-fixtures/vue/collapsible/CollapsibleRoot.vue",
      },
      {
        contents: renderVueCollapsibleTrigger(plan, getPart(plan, "trigger")),
        path: "__future-fixtures/vue/collapsible/CollapsibleTrigger.vue",
      },
      {
        contents: renderVueCollapsiblePanel(plan, getPart(plan, "panel")),
        path: "__future-fixtures/vue/collapsible/CollapsiblePanel.vue",
      },
    ];
  }

  if (plan.component === "checkbox") {
    const facts = getBooleanFormControlFacts(plan);

    return [
      {
        contents: renderVueCheckboxRoot(facts),
        path: `__future-fixtures/vue/checkbox/${facts.exports.root}.vue`,
      },
      {
        contents: renderVueCheckboxIndicator(facts),
        path: `__future-fixtures/vue/checkbox/${facts.exports.stateIndicator}.vue`,
      },
      {
        contents: renderVueCheckboxIndex(facts),
        path: "__future-fixtures/vue/checkbox/index.ts",
      },
    ];
  }

  throw new Error(`${plan.displayName} does not have a Vue future-framework tracer fixture.`);
}

function renderVueButtonRoot(plan: GenericAdapterPlan, part: GenericAdapterPlanPart): string {
  const factory = plan.runtime.factory;
  const disabledDefault = getPlanPropDefault(plan, "disabled");
  const focusableWhenDisabledDefault = getPlanPropDefault(plan, "focusableWhenDisabled");

  if (plan.component === "button") {
    return renderConditionalVueButtonRoot(
      plan,
      part,
      disabledDefault,
      focusableWhenDisabledDefault,
    );
  }

  return `<!-- Non-shipping future framework tracer fixture. Do not publish, export, register, or copy into demo dependencies. -->\n<script setup lang="ts">\nimport { ${factory} } from "${plan.runtime.importSource}";\nimport { onBeforeUnmount, onMounted, ref, watch } from "vue";\n\nconst props = withDefaults(\n  defineProps<{\n    disabled?: boolean;\n    focusableWhenDisabled?: boolean;\n    type?: "button" | "submit" | "reset";\n  }>(),\n  {\n    disabled: ${disabledDefault},\n    focusableWhenDisabled: ${focusableWhenDisabledDefault},\n    type: "button",\n  },\n);\n\nconst root = ref<HTMLButtonElement | null>(null);\nlet instance: ReturnType<typeof ${factory}> | undefined;\n\nfunction setup() {\n  instance?.destroy();\n  instance = root.value\n    ? ${factory}(root.value, {\n        disabled: props.disabled,\n        focusableWhenDisabled: props.focusableWhenDisabled,\n      })\n    : undefined;\n}\n\nonMounted(() => {\n  setup();\n});\n\nwatch(\n  () => [props.disabled, props.focusableWhenDisabled] as const,\n  () => {\n    setup();\n  },\n);\n\nonBeforeUnmount(() => {\n  instance?.destroy();\n  instance = undefined;\n});\n</script>\n\n<template>\n  <button\n    ref="root"\n    ${part.discoveryAttribute}\n    :aria-disabled="props.disabled && props.focusableWhenDisabled ? 'true' : undefined"\n    :data-disabled="props.disabled ? '' : undefined"\n    :data-focusable-when-disabled="props.focusableWhenDisabled ? 'true' : undefined"\n    :disabled="props.disabled && !props.focusableWhenDisabled"\n    :type="props.type"\n  >\n    <slot />\n  </button>\n</template>\n`;
}

function renderConditionalVueButtonRoot(
  plan: GenericAdapterPlan,
  part: GenericAdapterPlanPart,
  disabledDefault: string,
  focusableWhenDisabledDefault: string,
): string {
  const factory = plan.runtime.factory;

  return `<!-- Non-shipping future framework tracer fixture. Do not publish, export, register, or copy into demo dependencies. -->
<script setup lang="ts">
import { ${factory} } from "${plan.runtime.importSource}";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    focusableWhenDisabled?: boolean;
    type?: "button" | "submit" | "reset";
  }>(),
  {
    disabled: ${disabledDefault},
    focusableWhenDisabled: ${focusableWhenDisabledDefault},
    type: "button",
  },
);

const root = ref<HTMLButtonElement | null>(null);
let instance: ReturnType<typeof ${factory}> | undefined;

function setup() {
  instance?.destroy();
  instance = undefined;

  if (!root.value || !props.focusableWhenDisabled) return;

  instance = ${factory}(root.value, {
    disabled: props.disabled,
  });
}

onMounted(() => {
  setup();
});

watch(
  () => props.focusableWhenDisabled,
  () => {
    setup();
  },
);

watch(
  () => props.disabled,
  (disabled) => {
    instance?.setDisabled(disabled);
  },
);

onBeforeUnmount(() => {
  instance?.destroy();
  instance = undefined;
});
</script>

<template>
  <button
    ref="root"
    ${part.discoveryAttribute}
    :aria-disabled="props.disabled && props.focusableWhenDisabled ? 'true' : undefined"
    :data-disabled="props.disabled ? '' : undefined"
    :data-focusable-when-disabled="props.focusableWhenDisabled ? 'true' : undefined"
    :disabled="props.disabled && !props.focusableWhenDisabled"
    :type="props.type"
  >
    <slot />
  </button>
</template>
`;
}

function renderVueToggleRoot(plan: GenericAdapterPlan, part: GenericAdapterPlanPart): string {
  const factory = plan.runtime.factory;
  const event = getEvent(plan, "pressedChange");
  const pressedEventDetailsType = getRequiredValue(
    event.detailsType,
    `${plan.displayName} pressedChange event is missing detailsType.`,
  );
  const pressedValueProperty = getRequiredValue(
    event.valueProperty,
    `${plan.displayName} pressedChange event is missing valueProperty.`,
  );
  const defaultPressedDefault = getPlanPropDefault(plan, "defaultPressed");
  const disabledDefault = getPlanPropDefault(plan, "disabled");
  const nativeButtonDefault = getPlanPropDefault(plan, "nativeButton");
  const stateModel = getStateModel(plan, "pressed");
  const runtimeGetter = getRequiredValue(
    stateModel.runtimeGetter,
    `${plan.displayName} pressed state is missing runtimeGetter.`,
  );
  const pressedSetter = getStateSetter(plan, "pressed");

  return `<!-- Non-shipping future framework tracer fixture. Do not publish, export, register, or copy into demo dependencies. -->\n<script setup lang="ts">\nimport { ${factory}, type ${pressedEventDetailsType} } from "${plan.runtime.importSource}";\nimport { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";\n\nconst props = withDefaults(\n  defineProps<{\n    defaultPressed?: boolean;\n    disabled?: boolean;\n    nativeButton?: boolean;\n    pressed?: boolean;\n    syncGroup?: string;\n    value?: string;\n  }>(),\n  {\n    defaultPressed: ${defaultPressedDefault},\n    disabled: ${disabledDefault},\n    nativeButton: ${nativeButtonDefault},\n  },\n);\n\nconst emit = defineEmits<{\n  pressedChange: [pressed: boolean, details: ${pressedEventDetailsType}];\n}>();\n\nconst root = ref<HTMLButtonElement | HTMLSpanElement | null>(null);\nconst uncontrolledPressed = ref(props.defaultPressed);\nconst renderedPressed = computed(() => props.pressed ?? uncontrolledPressed.value);\nlet instance: ReturnType<typeof ${factory}> | undefined;\nlet unsubscribe: (() => void) | undefined;\n\nfunction setup() {\n  unsubscribe?.();\n  instance?.destroy();\n  instance = root.value\n    ? ${factory}(root.value, {\n        defaultPressed: uncontrolledPressed.value,\n        disabled: props.disabled,\n        nativeButton: props.nativeButton,\n        pressed: props.pressed,\n        syncGroup: props.syncGroup,\n        value: props.value,\n      })\n    : undefined;\n  unsubscribe = instance?.subscribe("${event.name}", (details) => {\n    emit("pressedChange", details.${pressedValueProperty}, details);\n    queueMicrotask(() => {\n      if (details.isCanceled) return;\n      if (props.pressed === undefined) {\n        uncontrolledPressed.value = details.${pressedValueProperty};\n      }\n    });\n  });\n}\n\nonMounted(() => {\n  setup();\n});\n\nwatch(\n  () => [props.nativeButton, props.syncGroup, props.value] as const,\n  () => {\n    setup();\n  },\n);\n\nwatch(\n  () => props.pressed,\n  (pressed) => {\n    if (pressed === undefined || !instance) return;\n    if (instance.${runtimeGetter}() === pressed) return;\n\n    instance.${pressedSetter.method}(pressed, ${formatOptions(pressedSetter.options)});\n  },\n);\n\nwatch(\n  () => props.disabled,\n  (disabled) => {\n    instance?.setDisabled(disabled);\n  },\n);\n\nonBeforeUnmount(() => {\n  unsubscribe?.();\n  instance?.destroy();\n  unsubscribe = undefined;\n  instance = undefined;\n});\n</script>\n\n<template>\n  <component\n    :is="props.nativeButton ? 'button' : 'span'"\n    ref="root"\n    ${part.discoveryAttribute}\n    :aria-disabled="!props.nativeButton && props.disabled ? 'true' : undefined"\n    :aria-pressed="renderedPressed ? 'true' : 'false'"\n    :data-default-pressed="props.pressed === undefined && props.defaultPressed ? 'true' : undefined"\n    :data-disabled="props.disabled ? '' : undefined"\n    :data-native="!props.nativeButton ? 'false' : undefined"\n    :data-pressed="renderedPressed ? '' : undefined"\n    :data-state="renderedPressed ? 'on' : 'off'"\n    :data-sync-group="props.syncGroup"\n    :data-unpressed="!renderedPressed ? '' : undefined"\n    :data-value="props.value"\n    :disabled="props.nativeButton && props.disabled ? true : undefined"\n    :role="!props.nativeButton ? 'button' : undefined"\n    :tabindex="!props.nativeButton ? (props.disabled ? -1 : 0) : undefined"\n    :type="props.nativeButton ? 'button' : undefined"\n    :value="props.nativeButton ? props.value : undefined"\n  >\n    <slot />\n  </component>\n</template>\n`;
}

function renderVueCollapsibleRoot(plan: GenericAdapterPlan, part: GenericAdapterPlanPart): string {
  const factory = plan.runtime.factory;
  const event = getEvent(plan, "openChange");
  const openEventDetailsType = getRequiredValue(
    event.detailsType,
    `${plan.displayName} openChange event is missing detailsType.`,
  );
  const openValueProperty = getRequiredValue(
    event.valueProperty,
    `${plan.displayName} openChange event is missing valueProperty.`,
  );
  const defaultOpenDefault = getPlanPropDefault(plan, "defaultOpen");
  const disabledDefault = getPlanPropDefault(plan, "disabled");
  const stateModel = getStateModel(plan, "open");
  const runtimeGetter = getRequiredValue(
    stateModel.runtimeGetter,
    `${plan.displayName} open state is missing runtimeGetter.`,
  );
  const openSetter = getStateSetter(plan, "open");

  return `<!-- Non-shipping future framework tracer fixture. Do not publish, export, register, or copy into demo dependencies. -->\n<script setup lang="ts">\nimport { ${factory}, type ${openEventDetailsType} } from "${plan.runtime.importSource}";\nimport { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";\n\nconst props = withDefaults(\n  defineProps<{\n    defaultOpen?: boolean;\n    disabled?: boolean;\n    open?: boolean;\n  }>(),\n  {\n    defaultOpen: ${defaultOpenDefault},\n    disabled: ${disabledDefault},\n  },\n);\n\nconst emit = defineEmits<{\n  openChange: [open: boolean, details: ${openEventDetailsType}];\n}>();\n\nconst root = ref<HTMLDivElement | null>(null);\nconst uncontrolledOpen = ref(props.defaultOpen);\nconst renderedOpen = computed(() => props.open ?? uncontrolledOpen.value);\nlet instance: ReturnType<typeof ${factory}> | undefined;\nlet unsubscribe: (() => void) | undefined;\n\nfunction setup() {\n  unsubscribe?.();\n  instance?.destroy();\n  instance = root.value\n    ? ${factory}(root.value, {\n        defaultOpen: uncontrolledOpen.value,\n        disabled: props.disabled,\n        ...(props.open !== undefined ? { open: props.open } : {}),\n      })\n    : undefined;\n  unsubscribe = instance?.subscribe("${event.name}", (details) => {\n    emit("openChange", details.${openValueProperty}, details);\n    if (details.isCanceled) return;\n\n    if (props.open === undefined) {\n      uncontrolledOpen.value = details.${openValueProperty};\n    }\n  });\n}\n\nonMounted(() => {\n  setup();\n});\n\nwatch(\n  () => props.disabled,\n  () => {\n    setup();\n  },\n);\n\nwatch(\n  () => props.open,\n  (open) => {\n    if (open === undefined || !instance) return;\n    if (instance.${runtimeGetter}() === open) return;\n\n    instance.${openSetter.method}(open, ${formatOptions(openSetter.options)});\n  },\n);\n\nonBeforeUnmount(() => {\n  unsubscribe?.();\n  instance?.destroy();\n  unsubscribe = undefined;\n  instance = undefined;\n});\n</script>\n\n<template>\n  <div\n    ref="root"\n    ${part.discoveryAttribute}\n    :data-default-open="props.open === undefined && props.defaultOpen ? 'true' : undefined"\n    :data-disabled="props.disabled ? '' : undefined"\n    :data-state="renderedOpen ? 'open' : 'closed'"\n  >\n    <slot />\n  </div>\n</template>\n`;
}

function renderVueCollapsibleTrigger(
  _plan: GenericAdapterPlan,
  part: GenericAdapterPlanPart,
): string {
  return `<!-- Non-shipping future framework tracer fixture. Do not publish, export, register, or copy into demo dependencies. -->\n<script setup lang="ts">\nconst props = withDefaults(\n  defineProps<{\n    asChild?: boolean;\n  }>(),\n  {\n    asChild: false,\n  },\n);\n</script>\n\n<template>\n  <component\n    :is="props.asChild ? 'div' : 'button'"\n    ${part.discoveryAttribute}\n    :data-as-child="props.asChild ? '' : undefined"\n    aria-expanded="false"\n    data-state="closed"\n    :type="props.asChild ? undefined : 'button'"\n  >\n    <slot />\n  </component>\n</template>\n`;
}

function renderVueCollapsiblePanel(
  _plan: GenericAdapterPlan,
  part: GenericAdapterPlanPart,
): string {
  return `<!-- Non-shipping future framework tracer fixture. Do not publish, export, register, or copy into demo dependencies. -->\n<script setup lang="ts">\nconst props = withDefaults(\n  defineProps<{\n    hiddenUntilFound?: boolean;\n  }>(),\n  {\n    hiddenUntilFound: false,\n  },\n);\n</script>\n\n<template>\n  <div\n    ${part.discoveryAttribute}\n    :data-hidden-until-found="props.hiddenUntilFound ? '' : undefined"\n    data-state="closed"\n    :hidden="props.hiddenUntilFound ? 'until-found' : true"\n  >\n    <slot />\n  </div>\n</template>\n`;
}

type VueCheckboxFacts = ReturnType<typeof getBooleanFormControlFacts>;

function renderVueCheckboxRoot(facts: VueCheckboxFacts): string {
  const indeterminateSetter = facts.setters.indeterminate?.method;

  if (!indeterminateSetter) {
    throw new Error("Checkbox Vue tracer requires indeterminate setter facts.");
  }

  return `<!-- Non-shipping future framework tracer fixture. Do not publish, export, register, or copy into demo dependencies. -->
<script setup lang="ts">
import { ${facts.runtime.factory}, type ${facts.event.detailsType} } from "${facts.runtime.importSource}";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    checked?: boolean;
    defaultChecked?: boolean;
    disabled?: boolean;
    form?: string;
    id?: string;
    indeterminate?: boolean;
    name?: string;
    nativeButton?: boolean;
    readOnly?: boolean;
    required?: boolean;
    uncheckedValue?: string;
    value?: string;
  }>(),
  {
    defaultChecked: ${facts.props.defaultState.defaultValue},
    disabled: ${facts.props.disabled.defaultValue},
    indeterminate: ${facts.props.indeterminate?.defaultValue ?? "false"},
    nativeButton: ${facts.props.nativeButton.defaultValue},
    readOnly: ${facts.props.readOnly?.defaultValue ?? "false"},
    required: ${facts.props.required?.defaultValue ?? "false"},
  },
);

const emit = defineEmits<{
  checkedChange: [checked: boolean, details: ${facts.event.detailsType}];
}>();

const root = ref<HTMLButtonElement | HTMLSpanElement | null>(null);
const input = ref<HTMLInputElement | null>(null);
const uncontrolledChecked = ref(props.defaultChecked);
const renderedChecked = computed(() => props.checked ?? uncontrolledChecked.value);
let instance: ReturnType<typeof ${facts.runtime.factory}> | undefined;
let unsubscribe: (() => void) | undefined;
let observer: MutationObserver | undefined;

function setup() {
  observer?.disconnect();
  unsubscribe?.();
  instance?.destroy();
  observer = undefined;
  unsubscribe = undefined;

  if (!root.value) {
    instance = undefined;
    return;
  }

  instance = ${facts.runtime.factory}(root.value, {
    defaultChecked: uncontrolledChecked.value,
    disabled: props.disabled,
    form: props.form,
    id: props.id,
    indeterminate: props.indeterminate,
    name: props.name,
    readOnly: props.readOnly,
    required: props.required,
    uncheckedValue: props.uncheckedValue,
    value: props.value,
    ...(props.checked !== undefined ? { checked: props.checked } : {}),
  });
  unsubscribe = instance.subscribe("${facts.event.name}", (details) => {
    emit("checkedChange", details.${facts.event.valueProperty}, details);
    if (!details.isCanceled && props.checked === undefined) {
      uncontrolledChecked.value = details.${facts.event.valueProperty};
    }
  });
  observer = new MutationObserver(() => {
    if (props.checked === undefined && root.value) {
      const checked = instance?.${facts.state.getter}();
      if (checked !== undefined) {
        uncontrolledChecked.value = checked;
      }
    }
  });
  observer.observe(root.value, {
    attributes: true,
    attributeFilter: ["${facts.attrs.ariaState}"],
  });
}

onMounted(setup);

watch(
  () => props.nativeButton,
  async () => {
    await nextTick();
    setup();
  },
);

watch(
  () => props.checked,
  (checked) => {
    if (checked === undefined || !instance || instance.${facts.state.getter}() === checked) return;
    instance.${facts.setters.state.method}(checked, ${formatOptions(facts.setters.state.options)});
  },
);

watch(
  () => props.disabled,
  (disabled) => {
    instance?.${facts.setters.disabled.method}(disabled);
  },
);

watch(
  () => props.indeterminate,
  (indeterminate) => {
    instance?.${indeterminateSetter}(indeterminate, ${formatOptions(facts.setters.indeterminate?.options)});
  },
);

watch(
  () => [props.form, props.id, props.name, props.required, props.uncheckedValue, props.value] as const,
  () => {
    setup();
  },
);

onBeforeUnmount(() => {
  observer?.disconnect();
  unsubscribe?.();
  instance?.destroy();
  observer = undefined;
  unsubscribe = undefined;
  instance = undefined;
});
</script>

<template>
  <component
    :is="props.nativeButton ? '${facts.render.nativeElement}' : '${facts.render.nonNativeElement}'"
    ref="root"
    ${facts.attrs.root}
    :${facts.attrs.ariaState}="props.indeterminate ? 'mixed' : renderedChecked ? 'true' : 'false'"
    :${facts.attrs.ariaReadOnly}="props.readOnly ? 'true' : 'false'"
    :${facts.attrs.ariaRequired}="props.required ? 'true' : 'false'"
    :${facts.attrs.defaultState}="props.checked === undefined && props.defaultChecked ? 'true' : undefined"
    :${facts.attrs.disabled}="props.disabled ? '' : undefined"
    :${facts.attrs.form}="props.form"
    :${facts.attrs.id}="props.id"
    :${facts.attrs.indeterminate}="props.indeterminate ? '' : undefined"
    :${facts.attrs.name}="props.name"
    :${facts.attrs.readOnly}="props.readOnly ? '' : undefined"
    :${facts.attrs.required}="props.required ? '' : undefined"
    :${facts.attrs.truthyPresence}="renderedChecked ? '' : undefined"
    :${facts.attrs.falsyPresence}="!renderedChecked ? '' : undefined"
    :${facts.attrs.uncheckedValue}="props.uncheckedValue"
    :${facts.attrs.value}="props.value"
    :disabled="props.nativeButton && props.disabled"
    role="${facts.render.role}"
    :tabindex="props.disabled ? -1 : 0"
    :type="props.nativeButton ? 'button' : undefined"
    v-bind="$attrs"
  >
    <slot />
    <input
      v-if="!props.nativeButton"
      ref="input"
      ${facts.attrs.input}
      aria-hidden="true"
      :checked="renderedChecked"
      :disabled="props.disabled"
      :form="props.form"
      :id="props.id"
      :name="props.name"
      :required="props.required"
      tabindex="-1"
      type="${facts.input.type}"
      :value="props.value ?? 'on'"
    />
  </component>
  <input
    v-if="props.nativeButton"
    ref="input"
    ${facts.attrs.input}
    aria-hidden="true"
    :checked="renderedChecked"
    :disabled="props.disabled"
    :form="props.form"
    :id="props.id"
    :name="props.name"
    :required="props.required"
    tabindex="-1"
    type="${facts.input.type}"
    :value="props.value ?? 'on'"
  />
</template>
`;
}

function renderVueCheckboxIndicator(facts: VueCheckboxFacts): string {
  const part = facts.parts.stateIndicator;
  const keepMounted = facts.props.keepMounted;
  if (!part || !keepMounted) {
    throw new Error("Checkbox Vue tracer requires indicator presence facts.");
  }

  return `<!-- Non-shipping future framework tracer fixture. Do not publish, export, register, or copy into demo dependencies. -->
<script setup lang="ts">
import { ref } from "vue";

const props = withDefaults(
  defineProps<{
    ${keepMounted.name}?: boolean;
  }>(),
  {
    ${keepMounted.name}: ${keepMounted.defaultValue},
  },
);
const indicator = ref<HTMLSpanElement | null>(null);
</script>

<template>
  <${part.defaultElement}
    ref="indicator"
    ${part.discoveryAttribute}
    :${facts.attrs.stateIndicatorKeepMounted}="props.${keepMounted.name} ? 'true' : undefined"
    ${facts.attrs.stateIndicatorFalsyPresence}
    hidden
    v-bind="$attrs"
  >
    <slot />
  </${part.defaultElement}>
</template>
`;
}

function renderVueCheckboxIndex(facts: VueCheckboxFacts): string {
  return `// Non-shipping future framework tracer fixture. Do not publish, export, register, or copy into demo dependencies.
export { default as Root } from "./${facts.exports.root}.vue";
export { default as Indicator } from "./${facts.exports.stateIndicator}.vue";
`;
}
