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
import type {
  GenericAdapterPlan,
  GenericAdapterPlanPart,
  GenericAdapterPlanPrintedFile,
} from "../../generic-adapter-plan/types.js";
import { projectVueDetailedEvent, projectVueModel } from "./public-contract.js";

const FIXTURE_COMMENT =
  "Unsupported, non-normative Vue future-framework tracer fixture. Do not publish, export, register, or copy into package or demo output.";

export function printGenericFutureFrameworkTracerPlan(
  plan: GenericAdapterPlan,
): GenericAdapterPlanPrintedFile[] {
  if (plan.component === "toggle") {
    return [
      {
        contents: renderToggle(plan, getRootPart(plan)),
        path: "__future-fixtures/vue/toggle/ToggleRoot.vue",
      },
    ];
  }
  if (plan.component === "collapsible") {
    return [
      {
        contents: renderCollapsibleRoot(plan, getPart(plan, "root")),
        path: "__future-fixtures/vue/collapsible/CollapsibleRoot.vue",
      },
      {
        contents: renderCollapsibleTrigger(getPart(plan, "trigger")),
        path: "__future-fixtures/vue/collapsible/CollapsibleTrigger.vue",
      },
      {
        contents: renderCollapsiblePanel(getPart(plan, "panel")),
        path: "__future-fixtures/vue/collapsible/CollapsiblePanel.vue",
      },
    ];
  }
  throw new Error(`${plan.displayName} does not have a Vue future-framework tracer fixture.`);
}

function renderToggle(plan: GenericAdapterPlan, part: GenericAdapterPlanPart): string {
  const event = getEvent(plan, "pressedChange");
  const model = getStateModel(plan, "pressed");
  const projection = projectVueModel(model.name);
  const detailedEvent = projectVueDetailedEvent(event.callbackProp);
  const detailsType = getRequiredValue(
    event.detailsType,
    "Toggle pressedChange requires detailsType.",
  );
  const valueProperty = getRequiredValue(
    event.valueProperty,
    "Toggle pressedChange requires valueProperty.",
  );
  const getter = getRequiredValue(
    model.runtimeGetter,
    "Toggle pressed state requires runtimeGetter.",
  );
  const setter = getStateSetter(plan, "pressed");

  return `<!-- ${FIXTURE_COMMENT} -->
<script setup lang="ts">
import { ${plan.runtime.factory}, type ${detailsType} } from "${plan.runtime.importSource}";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

defineOptions({ inheritAttrs: false });
defineSlots<{ default?: () => unknown }>();
const props = withDefaults(defineProps<{
  ${projection.defaultProp}?: boolean;
  disabled?: boolean;
  nativeButton?: boolean;
  ${projection.modelProp}?: boolean;
  syncGroup?: string;
  value?: string;
}>(), {
  ${projection.defaultProp}: ${getPlanPropDefault(plan, "defaultPressed")},
  disabled: ${getPlanPropDefault(plan, "disabled")},
  nativeButton: ${getPlanPropDefault(plan, "nativeButton")},
});
const emit = defineEmits<{
  ${detailedEvent.emit}: [pressed: boolean, details: ${detailsType}];
  "${projection.updateEvent}": [pressed: boolean];
}>();
const root = ref<HTMLButtonElement | HTMLSpanElement | null>(null);
defineExpose({ element: root });
const uncontrolledPressed = ref(props.${projection.defaultProp});
const renderedPressed = computed(() => props.${projection.modelProp} ?? uncontrolledPressed.value);
let instance: ReturnType<typeof ${plan.runtime.factory}> | undefined;
let unsubscribe: (() => void) | undefined;

function teardown() {
  const previous = instance;
  instance = undefined;
  unsubscribe?.();
  unsubscribe = undefined;
  previous?.destroy();
}
function setup() {
  teardown();
  if (!root.value) return;
  instance = ${plan.runtime.factory}(root.value, {
    defaultPressed: uncontrolledPressed.value,
    disabled: props.disabled,
    nativeButton: props.nativeButton,
    syncGroup: props.syncGroup,
    value: props.value,
    ...(props.${projection.modelProp} !== undefined ? { pressed: props.${projection.modelProp} } : {}),
  });
  unsubscribe = instance.subscribe("${event.name}", (details) => {
    emit("${detailedEvent.emit}", details.${valueProperty}, details);
    if (details.isCanceled) return;
    if (props.${projection.modelProp} === undefined) {
      uncontrolledPressed.value = details.${valueProperty};
    }
    emit("${projection.updateEvent}", details.${valueProperty});
  });
}
onMounted(setup);
watch(() => [props.nativeButton, props.syncGroup, props.value] as const, setup, { flush: "post" });
watch(() => props.${projection.modelProp}, (pressed) => {
  if (pressed === undefined || !instance || instance.${getter}() === pressed) return;
  instance.${setter.method}(pressed, ${formatOptions(setter.options)});
});
watch(() => props.disabled, (disabled) => instance?.setDisabled(disabled));
onBeforeUnmount(teardown);
</script>

<template>
  <component :is="props.nativeButton ? 'button' : 'span'" ref="root" ${part.discoveryAttribute}
    :aria-pressed="renderedPressed ? 'true' : 'false'" :data-state="renderedPressed ? 'on' : 'off'"
    :disabled="props.nativeButton && props.disabled ? true : undefined" :role="!props.nativeButton ? 'button' : undefined"
    :tabindex="!props.nativeButton ? (props.disabled ? -1 : 0) : undefined" :type="props.nativeButton ? 'button' : undefined"
    v-bind="$attrs"><slot /></component>
</template>
`;
}

function renderCollapsibleRoot(plan: GenericAdapterPlan, part: GenericAdapterPlanPart): string {
  const event = getEvent(plan, "openChange");
  const model = getStateModel(plan, "open");
  const projection = projectVueModel(model.name);
  const detailedEvent = projectVueDetailedEvent(event.callbackProp);
  const detailsType = getRequiredValue(
    event.detailsType,
    "Collapsible openChange requires detailsType.",
  );
  const valueProperty = getRequiredValue(
    event.valueProperty,
    "Collapsible openChange requires valueProperty.",
  );
  const getter = getRequiredValue(
    model.runtimeGetter,
    "Collapsible open state requires runtimeGetter.",
  );
  const setter = getStateSetter(plan, "open");

  return `<!-- ${FIXTURE_COMMENT} -->
<script setup lang="ts">
import { ${plan.runtime.factory}, type ${detailsType} } from "${plan.runtime.importSource}";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
defineOptions({ inheritAttrs: false });
defineSlots<{ default?: () => unknown }>();
const props = withDefaults(defineProps<{ ${projection.defaultProp}?: boolean; disabled?: boolean; ${projection.modelProp}?: boolean }>(), {
  ${projection.defaultProp}: ${getPlanPropDefault(plan, "defaultOpen")}, disabled: ${getPlanPropDefault(plan, "disabled")},
});
const emit = defineEmits<{ ${detailedEvent.emit}: [open: boolean, details: ${detailsType}]; "${projection.updateEvent}": [open: boolean] }>();
const root = ref<HTMLDivElement | null>(null);
defineExpose({ element: root });
const uncontrolledOpen = ref(props.${projection.defaultProp});
const renderedOpen = computed(() => props.${projection.modelProp} ?? uncontrolledOpen.value);
let instance: ReturnType<typeof ${plan.runtime.factory}> | undefined;
let unsubscribe: (() => void) | undefined;
function teardown() { const previous = instance; instance = undefined; unsubscribe?.(); unsubscribe = undefined; previous?.destroy(); }
function setup() {
  teardown();
  if (!root.value) return;
  instance = ${plan.runtime.factory}(root.value, { defaultOpen: uncontrolledOpen.value, disabled: props.disabled, ...(props.${projection.modelProp} !== undefined ? { open: props.${projection.modelProp} } : {}) });
  unsubscribe = instance.subscribe("${event.name}", (details) => {
    emit("${detailedEvent.emit}", details.${valueProperty}, details);
    if (details.isCanceled) return;
    if (props.${projection.modelProp} === undefined) {
      uncontrolledOpen.value = details.${valueProperty};
    }
    emit("${projection.updateEvent}", details.${valueProperty});
  });
}
onMounted(setup);
watch(() => props.disabled, setup, { flush: "post" });
watch(() => props.${projection.modelProp}, (open) => {
  if (open === undefined || !instance || instance.${getter}() === open) return;
  instance.${setter.method}(open, ${formatOptions(setter.options)});
});
onBeforeUnmount(teardown);
</script>
<template><div ref="root" ${part.discoveryAttribute} :data-state="renderedOpen ? 'open' : 'closed'" v-bind="$attrs"><slot /></div></template>
`;
}

function renderCollapsibleTrigger(part: GenericAdapterPlanPart): string {
  return `<!-- ${FIXTURE_COMMENT} -->
<script setup lang="ts">
import {
  cloneVNode,
  defineComponent,
  isVNode,
  mergeProps,
  ref,
  useAttrs,
  type ComponentPublicInstance,
  type VNode,
} from "vue";

defineOptions({ inheritAttrs: false });
const slots = defineSlots<{ default?: () => VNode[] }>();
const props = withDefaults(defineProps<{ asChild?: boolean }>(), { asChild: false });
const attrs = useAttrs();
const element = ref<HTMLElement | null>(null);
defineExpose({ element });

function setElement(value: Element | ComponentPublicInstance | null): void {
  element.value = value instanceof HTMLElement ? value : null;
}

const AsChildTrigger = defineComponent({
  inheritAttrs: false,
  setup() {
    return () => {
      const children = slots.default?.() ?? [];
      const child = children[0];
      if (children.length !== 1 || !isNativeElementVNode(child)) {
        throw new TypeError("CollapsibleTrigger asChild requires exactly one native element VNode.");
      }

      const childHasType =
        child.props !== null && Object.prototype.hasOwnProperty.call(child.props, "type");
      const attrsHaveType = Object.prototype.hasOwnProperty.call(attrs, "type");
      const defaultedProps =
        child.type === "button" && !childHasType && !attrsHaveType ? { type: "button" } : {};
      const protectedProps = {
        "${part.discoveryAttribute}": "",
        "data-as-child": "",
        ref: setElement,
      };
      return cloneVNode(child, mergeProps(defaultedProps, attrs, protectedProps), true);
    };
  },
});

function isNativeElementVNode(value: unknown): value is VNode & { type: string } {
  return isVNode(value) && typeof value.type === "string";
}
</script>
<template>
  <AsChildTrigger v-if="props.asChild"><slot /></AsChildTrigger>
  <button
    v-else
    :ref="setElement"
    ${part.discoveryAttribute}
    aria-expanded="false"
    data-state="closed"
    type="button"
    v-bind="attrs"
  ><slot /></button>
</template>
`;
}

function renderCollapsiblePanel(part: GenericAdapterPlanPart): string {
  return `<!-- ${FIXTURE_COMMENT} -->
<script setup lang="ts">
import { ref } from "vue";

defineOptions({ inheritAttrs: false });
defineSlots<{ default?: () => unknown }>();
const props = withDefaults(defineProps<{ hiddenUntilFound?: boolean }>(), { hiddenUntilFound: false });
const element = ref<HTMLDivElement | null>(null);
defineExpose({ element });
</script>
<template>
  <div
    ref="element"
    ${part.discoveryAttribute}
    :data-hidden-until-found="props.hiddenUntilFound ? '' : undefined"
    data-state="closed"
    :hidden="props.hiddenUntilFound ? 'until-found' : true"
    v-bind="$attrs"
  ><slot /></div>
</template>
`;
}
