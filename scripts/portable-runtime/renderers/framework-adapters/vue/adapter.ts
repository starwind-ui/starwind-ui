import { defineFrameworkAdapter } from "../conformance.js";
import {
  defineFrameworkAdapterReadiness,
  normalizeHtmlAttributeName,
} from "../future-readiness.js";
import type { FrameworkAdapter } from "../types.js";
import {
  projectVueDetailedEvent,
  projectVueModel,
  vueAdapterPublicContract,
} from "./public-contract.js";
import { printVueActionSurfaceComponent, printVueActionSurfaceIndex } from "./action-surface.js";
import {
  printVueBooleanFormControlComponent,
  printVueBooleanFormControlIndex,
} from "./boolean-form-control.js";
import { printVueMediaStatusComponent, printVueMediaStatusIndex } from "./media-status.js";
import {
  isVueOptionCollectionOverlayOutput,
  printVueOptionCollectionOverlayIndex,
  printVueOptionCollectionOverlayOutput,
} from "./option-collection-overlay.js";
import { printVueRangeStatusComponent, printVueRangeStatusIndex } from "./range-status.js";
import {
  printVueViewportMeasurementComponent,
  printVueViewportMeasurementIndex,
} from "./viewport-measurement.js";
import { printVueIndexFile, printVueNamespaceExport, printVueTypeFacadeFile } from "./exports.js";

const NON_SHIPPING_COMMENT =
  "Internal non-shipping Vue adapter output. Do not publish, expose through the CLI registry, claim in public docs, or copy into public demo dependencies.";

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
    if (isVueOptionCollectionOverlayOutput(model)) {
      return printVueOptionCollectionOverlayOutput(model);
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
    if (file.component.family?.kind === "range-status") {
      return printVueRangeStatusComponent(file);
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
    if (file.component.family?.kind === "option-collection-overlay") {
      throw new TypeError(
        "Vue option-collection-overlay components must be printed through the family output projection.",
      );
    }
    return {
      contents: printVueComponent(file.component),
      path: `${file.path}${this.fileExtension}`,
    };
  },
  printHelperFile(file) {
    return {
      contents: `// ${NON_SHIPPING_COMMENT}\nexport function ${file.name}(value?: string) {\n  ${file.body.code}\n}\n`,
      path: file.path,
    };
  },
  printIndexFile(file) {
    if (file.family?.kind === "action-surface") return printVueActionSurfaceIndex(file);
    if (file.family?.kind === "boolean-form-control") {
      return printVueBooleanFormControlIndex(file);
    }
    if (file.family?.kind === "media-status") return printVueMediaStatusIndex(file);
    if (file.family?.kind === "range-status") return printVueRangeStatusIndex(file);
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
      contents: `// ${NON_SHIPPING_COMMENT}\n${printVueTypeFacadeFile(file)}\n`,
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

  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
${imports}
import {
  cloneVNode,
  computed,
  defineComponent,
  inject,
  isVNode,
  mergeProps,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  useAttrs,
  watch,
  type ComponentPublicInstance,
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
const mounted = ref(false);
let instance: ReturnType<typeof ${component.lifecycle?.factory ?? "Object"}> | undefined;

${stateSetup}

function setRootElement(element: Element | ComponentPublicInstance | null): void {
  rootRef.value = element instanceof HTMLElement ? element : null;
}

const AsChildRoot = defineComponent({
  inheritAttrs: false,
  setup() {
    return () => {
      const children = slots.default?.() ?? [];
      const child = children[0];
      if (children.length !== 1 || !isNativeElementVNode(child)) {
        throw new TypeError("ConformanceRoot asChild requires exactly one native element VNode.");
      }

      const defaultedProps = { type: child.type === "button" ? "button" : undefined };
      const consumerProps = attrs;
      const protectedProps = { "data-sw-part": "${render?.part ?? "root"}", ref: setRootElement };
      return cloneVNode(child, mergeProps(defaultedProps, consumerProps, protectedProps), true);
    };
  },
});

function isNativeElementVNode(value: unknown): value is VNode & { type: string } {
  return isVNode(value) && typeof value.type === "string";
}

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
    .map(({ detailed, event, state }) => {
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
