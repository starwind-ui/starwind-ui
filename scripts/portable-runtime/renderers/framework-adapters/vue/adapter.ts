import { defineFrameworkAdapter } from "../conformance.js";
import {
  defineFrameworkAdapterReadiness,
  normalizeHtmlAttributeName,
} from "../future-readiness.js";
import type { FrameworkAdapter } from "../types.js";
import { printVueActionSurfaceComponent, printVueActionSurfaceIndex } from "./action-surface.js";
import {
  isVueAnchoredMenuOverlayOutput,
  printVueAnchoredMenuOverlayOutput,
} from "./anchored-menu-overlay.js";
import {
  printVueBooleanFormControlComponent,
  printVueBooleanFormControlIndex,
} from "./boolean-form-control.js";
import {
  printVueColorPickerComponent,
  printVueColorPickerIndex,
  type VueColorPickerComponentProjection,
  type VueColorPickerIndexProjection,
} from "./color-picker.js";
import {
  isVueCompositeMenuOverlayOutput,
  printVueCompositeMenuOverlayOutput,
} from "./composite-menu-overlay.js";
import {
  printVueControlledValuePresenceComponent,
  printVueControlledValuePresenceIndex,
} from "./controlled-value-presence.js";
import {
  printVueDisclosurePresenceComponent,
  printVueDisclosurePresenceIndex,
} from "./disclosure-presence.js";
import {
  isVueEditableCollectionOverlayOutput,
  printVueEditableCollectionOverlayOutput,
} from "./editable-collection-overlay.js";
import { printVueEngineViewportComponent, printVueEngineViewportIndex } from "./engine-viewport.js";
import { printVueIndexFile, printVueNamespaceExport, printVueTypeFacadeFile } from "./exports.js";
import {
  printVueFieldCompositionComponent,
  printVueFieldCompositionIndex,
} from "./field-composition.js";
import {
  printVueFileDropControlComponent,
  printVueFileDropControlIndex,
} from "./file-drop-control.js";
import {
  printVueFormFieldCoordinatorComponent,
  printVueFormFieldCoordinatorIndex,
} from "./form-field-coordinator.js";
import {
  printVueGroupedValueControlComponent,
  printVueGroupedValueControlHelper,
  printVueGroupedValueControlIndex,
} from "./grouped-value-control.js";
import {
  printVueHiddenInputVisualSlotComponent,
  printVueHiddenInputVisualSlotIndex,
} from "./hidden-input-visual-slot.js";
import { printVueMediaStatusComponent, printVueMediaStatusIndex } from "./media-status.js";
import { printVueNativeDisabledComponent, printVueNativeDisabledIndex } from "./native-disabled.js";
import {
  printVueNativeInputValueComponent,
  printVueNativeInputValueIndex,
} from "./native-input-value.js";
import { printVueNativeOverlayComponent, printVueNativeOverlayIndex } from "./native-overlay.js";
import {
  printVueNotificationSystemComponent,
  printVueNotificationSystemIndex,
} from "./notification-system.js";
import {
  isVueOptionCollectionOverlayOutput,
  printVueOptionCollectionOverlayIndex,
  printVueOptionCollectionOverlayOutput,
} from "./option-collection-overlay.js";
import {
  printVuePresenceFloatingOverlayComponent,
  printVuePresenceFloatingOverlayIndex,
} from "./presence-floating-overlay.js";
import {
  projectVueDetailedEvent,
  projectVueModel,
  vueAdapterPublicContract,
} from "./public-contract.js";
import { printVueRangeControlComponent, printVueRangeControlIndex } from "./range-control.js";
import { printVueRangeStatusComponent, printVueRangeStatusIndex } from "./range-status.js";
import {
  printVueRepeatedDisclosureComponent,
  printVueRepeatedDisclosureIndex,
} from "./repeated-disclosure.js";
import {
  isVueSharedViewportNavigationOutput,
  printVueSharedViewportNavigationOutput,
} from "./shared-viewport-navigation.js";
import {
  printVueSidebarComponent,
  printVueSidebarContext,
  printVueSidebarIndex,
} from "./sidebar.js";
import {
  printVueSingleBooleanControlComponent,
  printVueSingleBooleanControlIndex,
} from "./single-boolean-control.js";
import {
  printVueTimedFloatingOverlayComponent,
  printVueTimedFloatingOverlayIndex,
} from "./timed-floating-overlay.js";
import {
  printVueViewportMeasurementComponent,
  printVueViewportMeasurementIndex,
} from "./viewport-measurement.js";

export const vueFrameworkAdapterReadiness = defineFrameworkAdapterReadiness({
  booleanAttributeStrategy: "vue-bound-attribute",
  contextStrategy: "vue-provide-inject",
  eventStrategy: "vue-emit",
  fileExtension: ".vue",
  lifecycleStrategy: "vue-mounted-watch-cleanup",
  normalizeAttributeName: normalizeHtmlAttributeName,
  portalStrategy: "vue-teleport",
  propStrategy: "vue-bindings",
  publicSupport: vueAdapterPublicContract.publicSupport,
  refStrategy: "vue-template-ref",
  slotStrategy: "vue-slot",
  target: "vue",
} as const);

export const vueFrameworkAdapter = defineFrameworkAdapter({
  fileExtension: vueFrameworkAdapterReadiness.fileExtension,
  target: vueFrameworkAdapterReadiness.target,
  printOutput(model) {
    if (isVueSharedViewportNavigationOutput(model)) {
      return printVueSharedViewportNavigationOutput(model);
    }
    if (isVueAnchoredMenuOverlayOutput(model)) {
      return printVueAnchoredMenuOverlayOutput(model);
    }
    if (isVueCompositeMenuOverlayOutput(model)) {
      return printVueCompositeMenuOverlayOutput(model);
    }
    if (isVueOptionCollectionOverlayOutput(model)) {
      return printVueOptionCollectionOverlayOutput(model);
    }
    if (isVueEditableCollectionOverlayOutput(model)) {
      return printVueEditableCollectionOverlayOutput(model);
    }
    return model.files
      .filter((file) => !file.target || file.target === this.target)
      .map((file) => {
        if (file.kind === "component") return this.printComponentFile(file);
        if (file.kind === "helper") return this.printHelperFile(file);
        if (file.kind === "index") return this.printIndexFile(file);
        return this.printTypeFacadeFile(file);
      });
  },
  printComponentFile(file) {
    if ((file.component.family as { kind?: string } | undefined)?.kind === "vue-color-picker") {
      return {
        contents: printVueColorPickerComponent(
          file.component.family as unknown as VueColorPickerComponentProjection,
        ),
        path: `${file.path}${this.fileExtension}`,
      };
    }
    if (file.component.family?.kind === "sidebar") {
      return {
        contents: printVueSidebarComponent(file.component.family),
        path: `${file.path}${this.fileExtension}`,
      };
    }
    if (file.component.family?.kind === "engine-viewport") {
      return {
        contents: printVueEngineViewportComponent(file.component.family),
        path: `${file.path}${this.fileExtension}`,
      };
    }
    if (file.component.family?.kind === "notification-system") {
      return {
        contents: printVueNotificationSystemComponent(file.component.family),
        path: `${file.path}${this.fileExtension}`,
      };
    }
    if (file.component.family?.kind === "controlled-value-presence") {
      return {
        contents: printVueControlledValuePresenceComponent(file.component.family),
        path: `${file.path}${this.fileExtension}`,
      };
    }
    if (file.component.family?.kind === "field-composition") {
      return {
        contents: printVueFieldCompositionComponent(file.component.family),
        path: `${file.path}${this.fileExtension}`,
      };
    }
    if (file.component.family?.kind === "repeated-disclosure") {
      return {
        contents: printVueRepeatedDisclosureComponent(file.component.family),
        path: `${file.path}${this.fileExtension}`,
      };
    }
    if (file.component.family?.kind === "range-status") {
      return printVueRangeStatusComponent(file);
    }
    if (file.component.family?.kind === "range-control") {
      return {
        contents: printVueRangeControlComponent(file.component.family),
        path: `${file.path}${this.fileExtension}`,
      };
    }
    if (file.component.family?.kind === "hidden-input-visual-slot") {
      return {
        contents: printVueHiddenInputVisualSlotComponent(file.component.family),
        path: `${file.path}${this.fileExtension}`,
      };
    }
    if (file.component.family?.kind === "file-drop-control") {
      return {
        contents: printVueFileDropControlComponent(file.component.family),
        path: `${file.path}${this.fileExtension}`,
      };
    }
    if (file.component.family?.kind === "viewport-measurement") {
      return printVueViewportMeasurementComponent(file);
    }
    if (file.component.family?.kind === "media-status") {
      return printVueMediaStatusComponent(file);
    }
    if (file.component.family?.kind === "action-surface") {
      return printVueActionSurfaceComponent(file);
    }
    if (file.component.family?.kind === "boolean-form-control") {
      return printVueBooleanFormControlComponent(file);
    }
    if (file.component.family?.kind === "disclosure-presence") {
      return printVueDisclosurePresenceComponent(file);
    }
    if (file.component.family?.kind === "form-field-coordinator") {
      return printVueFormFieldCoordinatorComponent(file);
    }
    if (file.component.family?.kind === "grouped-value-control") {
      return printVueGroupedValueControlComponent(file);
    }
    if (file.component.family?.kind === "native-disabled") {
      return printVueNativeDisabledComponent(file);
    }
    if (file.component.family?.kind === "single-boolean-control") {
      return printVueSingleBooleanControlComponent(file);
    }
    if (file.component.family?.kind === "native-input-value") {
      return printVueNativeInputValueComponent(file);
    }
    if (file.component.family?.kind === "native-overlay") {
      return printVueNativeOverlayComponent(file);
    }
    if (file.component.family?.kind === "presence-floating-overlay") {
      return printVuePresenceFloatingOverlayComponent(file);
    }
    if (file.component.family?.kind === "timed-floating-overlay") {
      return printVueTimedFloatingOverlayComponent(file);
    }
    if (file.component.family?.kind === "option-collection-overlay") {
      throw new TypeError(
        "Vue option-collection-overlay components must be printed through the family output projection.",
      );
    }
    if (file.component.family?.kind === "editable-collection-overlay") {
      throw new TypeError(
        "Vue editable-collection-overlay components must be printed through the family output projection.",
      );
    }
    if (file.component.family?.kind === "composite-menu-overlay") {
      throw new TypeError(
        "Vue composite-menu-overlay components must be printed through the family output projection.",
      );
    }
    if (file.component.family?.kind === "anchored-menu-overlay") {
      throw new TypeError(
        "Vue anchored-menu-overlay components must be printed through the family output projection.",
      );
    }
    if (file.component.family?.kind === "shared-viewport-navigation") {
      throw new TypeError(
        "Vue shared-viewport-navigation components must be printed through the family output projection.",
      );
    }
    return {
      contents: printVueComponent(file.component),
      path: `${file.path}${this.fileExtension}`,
    };
  },
  printHelperFile(file) {
    if (file.path.endsWith("ColorPickerContext.ts")) {
      return { contents: file.body.code, path: file.path };
    }
    if (file.family?.kind === "sidebar-context") {
      return { contents: printVueSidebarContext(file.family.facts), path: file.path };
    }
    if (file.family?.kind === "controlled-value-presence") {
      return { contents: file.body.code, path: file.path };
    }
    if (file.path.endsWith("ItemContext.ts")) {
      return { contents: file.body.code, path: file.path };
    }
    if (file.family?.kind === "grouped-value-control") {
      return printVueGroupedValueControlHelper(file);
    }
    return {
      contents: `export function ${file.name}(value?: string) {\n  ${file.body.code}\n}\n`,
      path: file.path,
    };
  },
  printIndexFile(file) {
    if ((file.family as { kind?: string } | undefined)?.kind === "vue-color-picker") {
      return {
        contents: printVueColorPickerIndex(file.family as unknown as VueColorPickerIndexProjection),
        path: file.path,
      };
    }
    if (file.family?.kind === "sidebar") {
      return { contents: printVueSidebarIndex(file.family), path: file.path };
    }
    if (file.family?.kind === "engine-viewport") {
      return { contents: printVueEngineViewportIndex(file.family), path: file.path };
    }
    if (file.family?.kind === "notification-system") {
      return {
        contents: printVueNotificationSystemIndex(file.family),
        path: file.path,
      };
    }
    if (file.family?.kind === "controlled-value-presence") {
      return printVueControlledValuePresenceIndex(file.family);
    }
    if (file.family?.kind === "field-composition") {
      return printVueFieldCompositionIndex(file.family);
    }
    if (file.family?.kind === "repeated-disclosure") {
      return printVueRepeatedDisclosureIndex(file.family);
    }
    if (file.family?.kind === "action-surface") return printVueActionSurfaceIndex(file);
    if (file.family?.kind === "boolean-form-control") {
      return printVueBooleanFormControlIndex(file);
    }
    if (file.family?.kind === "disclosure-presence") {
      return printVueDisclosurePresenceIndex(file);
    }
    if (file.family?.kind === "form-field-coordinator") {
      return printVueFormFieldCoordinatorIndex(file);
    }
    if (file.family?.kind === "grouped-value-control") {
      return printVueGroupedValueControlIndex(file);
    }
    if (file.family?.kind === "native-disabled") {
      return printVueNativeDisabledIndex(file);
    }
    if (file.family?.kind === "single-boolean-control") {
      return printVueSingleBooleanControlIndex(file);
    }
    if (file.family?.kind === "media-status") return printVueMediaStatusIndex(file);
    if (file.family?.kind === "native-input-value") {
      return printVueNativeInputValueIndex(file);
    }
    if (file.family?.kind === "native-overlay") {
      return printVueNativeOverlayIndex(file);
    }
    if (file.family?.kind === "presence-floating-overlay") {
      return printVuePresenceFloatingOverlayIndex(file);
    }
    if (file.family?.kind === "timed-floating-overlay") {
      return printVueTimedFloatingOverlayIndex(file);
    }
    if (file.family?.kind === "range-status") return printVueRangeStatusIndex(file);
    if (file.family?.kind === "range-control") {
      return {
        contents: printVueRangeControlIndex(file.family),
        path: file.path,
      };
    }
    if (file.family?.kind === "hidden-input-visual-slot") {
      return {
        contents: printVueHiddenInputVisualSlotIndex(file.family),
        path: file.path,
      };
    }
    if (file.family?.kind === "file-drop-control") {
      return {
        contents: printVueFileDropControlIndex(file.family),
        path: file.path,
      };
    }
    if (file.family?.kind === "viewport-measurement") {
      return printVueViewportMeasurementIndex(file);
    }
    if (file.family?.kind === "option-collection-overlay") {
      return printVueOptionCollectionOverlayIndex(file);
    }
    return {
      contents: printVueIndexFile(file),
      path: file.path,
    };
  },
  printTypeFacadeFile(file) {
    return {
      contents: `${printVueTypeFacadeFile(file)}\n`,
      path: file.path,
    };
  },
  normalizeAttributeName: vueFrameworkAdapterReadiness.normalizeAttributeName,
  projectBooleanAttribute(attribute) {
    return { ...attribute, name: this.normalizeAttributeName(attribute.name) };
  },
  projectProp(prop) {
    return prop;
  },
  projectDefaultValue(defaultValue) {
    return defaultValue;
  },
  projectRenderTree(renderTree) {
    return renderTree;
  },
  projectSlot(slot) {
    return slot;
  },
  projectRuntimeLifecycle(lifecycle) {
    return lifecycle;
  },
  projectRef(ref) {
    return ref;
  },
  projectEventBridge(event) {
    return event;
  },
  projectControlledStateSync(sync) {
    return sync;
  },
  projectContext(context) {
    return context;
  },
  projectPortal(portal) {
    return portal;
  },
  printExports(exportsModel) {
    return printVueNamespaceExport(exportsModel);
  },
}) satisfies FrameworkAdapter;

type VueComponent = Parameters<FrameworkAdapter["printComponentFile"]>[0]["component"];
type VueAttribute = Parameters<FrameworkAdapter["projectBooleanAttribute"]>[0];

function printVueComponent(component: VueComponent): string {
  const render = component.render.kind === "element" ? component.render : undefined;
  const tag = render?.defaultElement ?? "div";
  const stateProps = new Map(
    component.stateSync.flatMap((sync) => {
      const prop = component.props.find((candidate) => candidate.name === sync.valueProp);
      return prop ? [[sync.state, { prop, projection: projectVueModel(sync.state) }] as const] : [];
    }),
  );
  const generatedDefaultPropNames = new Set(
    [...stateProps.values()].map(({ projection }) => projection.defaultProp),
  );
  const propLines = component.props.flatMap((prop) => {
    if (prop.kind === "callback" || generatedDefaultPropNames.has(prop.name)) return [];
    const state = [...stateProps.values()].find((candidate) => candidate.prop.name === prop.name);
    if (!state) {
      return [`  ${prop.name}${prop.required ? "" : "?"}: ${printVueType(prop.type)};`];
    }
    return [
      `  ${state.projection.modelProp}?: ${printVueType(prop.type)};`,
      `  ${state.projection.defaultProp}?: ${printVueType(prop.type)};`,
    ];
  });
  if (component.portals.length > 0 && !component.props.some((prop) => prop.name === "disabled")) {
    propLines.push("  disabled?: boolean;");
  }
  const eventFacts = component.events.map((event) => {
    const detailed = projectVueDetailedEvent(event.handlerProp);
    const semanticName = event.handlerProp.slice(2, -"Change".length);
    const modelName = `${semanticName.charAt(0).toLowerCase()}${semanticName.slice(1)}`;
    const state = stateProps.get(modelName) ?? stateProps.values().next().value;
    if (!state) throw new TypeError(`Vue event ${event.handlerProp} requires a state model.`);
    return { detailed, event, state };
  });
  const emitLines = eventFacts.flatMap(({ detailed, state }) => [
    `  ${detailed.emit}: [value: ${state.prop.type}, detail: VueChangeDetail<${state.prop.type}>];`,
    `  "${state.projection.updateEvent}": [value: ${state.prop.type}];`,
  ]);
  const runtimeEventBridgeLines = eventFacts
    .map(
      ({ detailed, state }) =>
        `  ${detailed.emit}: [value: ${printVueType(state.prop.type)}, detail: VueChangeDetail<${printVueType(state.prop.type)}>];`,
    )
    .join("\n");
  const stateSetup = [...stateProps.values()]
    .map(({ prop, projection }) => {
      const pascalName = capitalize(prop.name);
      return `const uncontrolled${pascalName} = ref<${prop.type}>(props.${projection.defaultProp} ?? ${defaultFallback(prop.type)});\nconst rendered${pascalName} = computed(() => props.${projection.modelProp} ?? uncontrolled${pascalName}.value);\nlet lastRuntime${pascalName} = rendered${pascalName}.value;`;
    })
    .join("\n");
  const imports = printVueImports(component);
  const contextSetup = printVueContext(component, stateProps);
  const eventHandlers = printVueEventHandlers(eventFacts);
  const lifecycle = printVueLifecycle(component, eventFacts, stateProps);
  const stateSync = printVueStateSync(component, stateProps);
  const attrs = printVueAttributes(render?.attrs ?? [], render?.part ?? "root", stateProps);
  const portals = printVuePortals(component.portals);
  const publicMethods = component.refs.some((ref) => ref.public)
    ? "defineExpose({\n  element: rootRef,\n});"
    : "";

  return `<script setup lang="ts">
${imports}
import { createVueAsChild } from "../_internal/as-child";
import {
  computed,
  defineComponent,
  inject,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  useAttrs,
  watch,
  type InjectionKey,
  type VNode,
} from "vue";

defineOptions({ inheritAttrs: false });

type VueChangeDetail<T> = {
  readonly isCanceled: boolean;
  cancel(): void;
};
type VueRuntimeEventBridge = {
${runtimeEventBridgeLines || "  // no Runtime DOM event bridges"}
};

const props = defineProps<{
${propLines.join("\n") || "  // no component-specific props"}
  asChild?: boolean;
  container?: string | HTMLElement;
}>();
const emit = defineEmits<{
${emitLines.join("\n") || "  // no component-specific events"}
}>();
const slots = defineSlots<{
  default?: () => VNode[];
  overlay?: () => VNode[];
}>();
const attrs = useAttrs();
const rootRef = ref<HTMLElement | null>(null);
const asChild = createVueAsChild("ConformanceRoot", rootRef);
const { setElement: setRootElement } = asChild;
const mounted = ref(false);
let instance: ReturnType<typeof ${component.lifecycle?.factory ?? "Object"}> | undefined;

${stateSetup}

const AsChildRoot = defineComponent({
  inheritAttrs: false,
  setup() {
    return () => {
      const children = slots.default?.() ?? [];
      const consumerProps = attrs;
      const protectedProps = { "data-sw-part": "${render?.part ?? "root"}" };
      return asChild.render({
        children,
        consumerProps,
        defaultNativeButtonType: "button",
        protectedProps,
      });
    };
  },
});

${contextSetup}
${publicMethods}
${eventHandlers}
${lifecycle}
${stateSync}
</script>

<template>
  <AsChildRoot v-if="props.asChild" />
  <${tag}
    v-else
    ref="rootRef"
    ${attrs}
    v-bind="$attrs"
  >
    <slot />
  </${tag}>
${portals}</template>
`;
}

function printVueImports(component: VueComponent): string {
  const imports = component.lifecycle?.factoryImport
    ? [...component.imports, component.lifecycle.factoryImport]
    : component.imports;
  const mergedImports = new Map<
    string,
    {
      kind: "type" | "value";
      members: Map<string, VueComponent["imports"][number]["members"][number]>;
      source: string;
    }
  >();

  for (const importModel of imports) {
    const kind = importModel.kind === "type" ? "type" : "value";
    const key = `${kind}:${importModel.source}`;
    const merged = mergedImports.get(key) ?? {
      kind,
      members: new Map(),
      source: importModel.source,
    };
    for (const member of importModel.members) {
      merged.members.set(`${member.imported}:${member.local ?? ""}`, member);
    }
    mergedImports.set(key, merged);
  }

  return [...mergedImports.values()]
    .map((importModel) => {
      const members = [...importModel.members.values()]
        .map((member) => (member.local ? `${member.imported} as ${member.local}` : member.imported))
        .join(", ");
      return `import${importModel.kind === "type" ? " type" : ""} { ${members} } from "${importModel.source}";`;
    })
    .join("\n");
}

function printVueContext(
  component: VueComponent,
  stateProps: Map<
    string,
    { prop: VueComponent["props"][number]; projection: ReturnType<typeof projectVueModel> }
  >,
): string {
  if (component.context.length === 0) return "";
  const values = [...stateProps.values()]
    .map(({ prop }) => `${prop.name}: rendered${capitalize(prop.name)}`)
    .join(", ");
  const valueType = [...stateProps.values()]
    .map(({ prop }) => `${prop.name}: Readonly<{ value: ${prop.type} }>`)
    .join("; ");
  const contextNames = [...new Set(component.context.map((context) => context.name))];
  const declarations = contextNames.map((name) => {
    const identifier = toIdentifier(name);
    return `type ${identifier}Value = Readonly<{ ${valueType} }>;
const ${identifier}Key: InjectionKey<${identifier}Value> = Symbol("Starwind${identifier}");`;
  });
  const projections = component.context.map((context) => {
    const identifier = toIdentifier(context.name);
    const projectedValue = toContextBinding(context.value.code);
    if (context.role === "provider") {
      return `const ${projectedValue}: ${identifier}Value = { ${values} };
provide(${identifier}Key, ${projectedValue});`;
    }

    return `const ${projectedValue} = inject(${identifier}Key);
if (!${projectedValue}) {
  throw new Error("${component.name} must be used within a ${identifier} provider.");
}`;
  });

  return [...declarations, ...projections].join("\n\n");
}

function printVueEventHandlers(
  eventFacts: Array<{
    detailed: ReturnType<typeof projectVueDetailedEvent>;
    event: VueComponent["events"][number];
    state: { prop: VueComponent["props"][number]; projection: ReturnType<typeof projectVueModel> };
  }>,
): string {
  return eventFacts
    .map(({ detailed, state }) => {
      const pascalName = capitalize(state.prop.name);
      return `function handle${pascalName}Change(...[value, detail]: VueRuntimeEventBridge["${detailed.emit}"]): void {
  emit("${detailed.emit}", value, detail);
  if (detail.isCanceled) return;

  if (props.${state.projection.modelProp} === undefined) {
    uncontrolled${pascalName}.value = value;
  }
  lastRuntime${pascalName} = value;
  emit("${state.projection.updateEvent}", value);
}`;
    })
    .join("\n\n");
}

function printVueLifecycle(
  component: VueComponent,
  eventFacts: Array<{
    event: VueComponent["events"][number];
    state: { prop: VueComponent["props"][number]; projection: ReturnType<typeof projectVueModel> };
  }>,
  stateProps: Map<
    string,
    { prop: VueComponent["props"][number]; projection: ReturnType<typeof projectVueModel> }
  >,
): string {
  const lifecycle = component.lifecycle;
  if (!lifecycle) return "";
  const options = [
    ...lifecycle.options.map((option) => {
      const state = stateProps.get(option.name);
      if (state) return `${option.name}: rendered${capitalize(option.name)}.value`;
      return `${option.name}: ${option.source === "prop" ? `props.${option.name}` : (option.value?.code ?? "undefined")}`;
    }),
    ...eventFacts.map(
      ({ event, state }) => `${event.handlerProp}: handle${capitalize(state.prop.name)}Change`,
    ),
  ];

  return `onMounted(() => {
  const element = rootRef.value;
  if (!element) throw new Error("${component.name} requires its semantic element before Runtime setup.");

  const createdInstance = ${lifecycle.factory}(element, {
    ${options.join(",\n    ")}
  });
  instance = createdInstance;
  mounted.value = true;
});

onBeforeUnmount(() => {
  mounted.value = false;
  const ownedInstance = instance;
  if (!ownedInstance) return;

  ownedInstance.destroy();
  if (instance === ownedInstance) instance = undefined;
});`;
}

function printVueStateSync(
  component: VueComponent,
  stateProps: Map<
    string,
    { prop: VueComponent["props"][number]; projection: ReturnType<typeof projectVueModel> }
  >,
): string {
  return component.stateSync
    .map((sync) => {
      const state = stateProps.get(sync.state);
      if (!state) return "";
      const pascalName = capitalize(state.prop.name);
      return `watch(
  () => props.${state.projection.modelProp},
  (value) => {
    if (value === undefined || !instance || Object.is(value, lastRuntime${pascalName})) return;

    instance.${sync.setter}(value, { emit: false });
    lastRuntime${pascalName} = value;
  },
);`;
    })
    .filter(Boolean)
    .join("\n\n");
}

function printVueAttributes(
  attributes: VueAttribute[],
  part: string,
  stateProps: Map<
    string,
    { prop: VueComponent["props"][number]; projection: ReturnType<typeof projectVueModel> }
  >,
): string {
  return [
    ...attributes.map((attribute) => printVueAttribute(attribute, stateProps)),
    `data-sw-part="${part}"`,
  ].join("\n    ");
}

function printVueAttribute(
  attribute: VueAttribute,
  stateProps: Map<
    string,
    { prop: VueComponent["props"][number]; projection: ReturnType<typeof projectVueModel> }
  >,
): string {
  const name = normalizeHtmlAttributeName(attribute.name);
  if (attribute.value === undefined || attribute.value === true) return name;
  if (typeof attribute.value === "object") {
    let expression = attribute.value.code;
    for (const { prop } of stateProps.values()) {
      expression = expression.replaceAll(prop.name, `rendered${capitalize(prop.name)}`);
    }
    expression = expression.replace(/\bdisabled\b/g, "props.disabled");
    return `:${name}="${expression}"`;
  }
  return `${name}="${String(attribute.value)}"`;
}

function printVuePortals(portals: VueComponent["portals"]): string {
  return portals
    .map((portal) => {
      const target = typeof portal.target === "string" ? portal.target : portal.target.code;
      return `  <Teleport :to="props.container ?? '${target}'" :disabled="props.disabled || !mounted">
    <slot name="${portal.sourcePart}" />
  </Teleport>
`;
    })
    .join("");
}

function defaultFallback(type: string): string {
  if (type === "boolean") return "false";
  if (type.includes("null")) return "null";
  return '""';
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function toIdentifier(value: string): string {
  return value.replace(/[^a-zA-Z0-9_$]/g, "_");
}

function toContextBinding(value: string): string {
  if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(value)) {
    throw new TypeError(`Vue context values must name target-local bindings; received ${value}.`);
  }
  return value;
}

function printVueType(type: string): string {
  const members = type.split("|").map((member) => member.trim());
  if (
    members.length > 1 &&
    members.every((member) => /^[a-z][a-zA-Z0-9-]*$/.test(member)) &&
    !members.some((member) =>
      ["boolean", "never", "null", "number", "string", "undefined", "unknown"].includes(member),
    )
  ) {
    return members.map((member) => JSON.stringify(member)).join(" | ");
  }
  return type;
}
