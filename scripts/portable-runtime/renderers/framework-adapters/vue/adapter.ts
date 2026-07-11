import { defineFrameworkAdapter } from "../conformance.js";
import {
  defineFrameworkAdapterReadiness,
  normalizeHtmlAttributeName,
} from "../future-readiness.js";
import type { FrameworkAdapter } from "../types.js";

const NON_SHIPPING_COMMENT =
  "Non-shipping future framework tracer adapter. Do not publish, export, register, or copy into demo dependencies.";

export const vueFrameworkAdapterReadiness = defineFrameworkAdapterReadiness({
  booleanAttributeStrategy: "vue-bound-attribute",
  contextStrategy: "vue-provide-inject",
  eventStrategy: "vue-emit",
  fileExtension: ".vue",
  lifecycleStrategy: "vue-mounted-watch-cleanup",
  normalizeAttributeName: normalizeHtmlAttributeName,
  portalStrategy: "vue-teleport",
  propStrategy: "vue-bindings",
  publicSupport: {
    cliRegistry: false,
    demoIntegration: false,
    packageExports: false,
    publicDocsClaim: false,
    status: "non-shipping-tracer",
  },
  refStrategy: "vue-template-ref",
  slotStrategy: "vue-slot",
  target: "vue",
} as const);

export const vueFrameworkAdapter = defineFrameworkAdapter({
  fileExtension: vueFrameworkAdapterReadiness.fileExtension,
  target: vueFrameworkAdapterReadiness.target,
  printOutput(model) {
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
    const component = file.component;
    const render = component.render.kind === "element" ? component.render : undefined;
    const tag = render?.defaultElement ?? "div";
    const propNames = component.props.map((prop) => prop.name);
    const props = component.props
      .map((prop) => `  ${prop.name}${prop.required ? "" : "?"}: ${prop.type};`)
      .join("\n");
    const emits = component.events
      .map((event) => `  ${toVueEventName(event.handlerProp)}: [event: Event];`)
      .join("\n");
    const contextSetup = renderVueContextSetup(component.context, propNames);
    const lifecycle = renderVueLifecycle(component.lifecycle, component.events);
    const stateSync = renderVueStateSync(component.stateSync);
    const attrs = renderVueAttributes(render?.attrs ?? [], render?.part ?? "root");
    const portal = renderVuePortals(component.portals);

    return {
      contents: `<!-- ${NON_SHIPPING_COMMENT} -->\n<script setup lang="ts">\nimport { inject, onBeforeUnmount, onMounted, provide, ref, watch } from "vue";\n\nconst props = defineProps<{\n${props || "  // no component-specific props"}\n}>();\nconst emit = defineEmits<{\n${emits || "  // no component-specific events"}\n}>();\nconst rootRef = ref<HTMLElement | null>(null);\nlet instance: Record<string, unknown> | undefined;\nlet cleanup: (() => void) | undefined;\n${contextSetup}\n${lifecycle}\n${stateSync}\nonBeforeUnmount(() => {\n  cleanup?.();\n});\n</script>\n\n<template>\n  <${tag} ref="rootRef" ${attrs} v-bind="$attrs">\n    <slot />\n  </${tag}>\n${portal}</template>\n`,
      path: `${file.path}${this.fileExtension}`,
    };
  },
  printHelperFile(file) {
    return {
      contents: `// ${NON_SHIPPING_COMMENT}\nexport function ${file.name}() {\n  ${file.body.code}\n}\n`,
      path: file.path,
    };
  },
  printIndexFile(file) {
    return {
      contents: `// ${NON_SHIPPING_COMMENT}\n${file.exports.members
        .map((member) => `export { default as ${member.name} } from "${member.from}.vue";`)
        .join("\n")}\n`,
      path: file.path,
    };
  },
  printTypeFacadeFile(file) {
    return {
      contents: `// ${NON_SHIPPING_COMMENT}\n${file.typeFacades
        .map((facade) => facade.body.code)
        .join("\n")}\n`,
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
    return exportsModel.namespace;
  },
}) satisfies FrameworkAdapter;

type VueComponentModel = Parameters<FrameworkAdapter["projectContext"]>[0][];
type VueLifecycle = Parameters<FrameworkAdapter["projectRuntimeLifecycle"]>[0] | undefined;
type VueStateSync = Parameters<FrameworkAdapter["projectControlledStateSync"]>[0][];
type VueEventBridge = Parameters<FrameworkAdapter["projectEventBridge"]>[0][];
type VueAttribute = Parameters<FrameworkAdapter["projectBooleanAttribute"]>[0];
type VuePortal = Parameters<FrameworkAdapter["projectPortal"]>[0][];

function renderVueContextSetup(contexts: VueComponentModel, propNames: string[]): string {
  if (contexts.length === 0) return "";

  const contextValues =
    propNames.length === 0
      ? "{}"
      : `{ ${propNames.map((prop) => `${prop}: props.${prop}`).join(", ")} }`;

  return contexts
    .map((context) => {
      const localName = toIdentifier(context.name);
      if (context.role === "consumer") {
        return `const ${localName}Parent = inject("${context.name}", undefined);`;
      }

      return `provide("${context.name}", ${contextValues});`;
    })
    .join("\n");
}

function renderVueLifecycle(lifecycle: VueLifecycle, events: VueEventBridge): string {
  if (!lifecycle) return "";

  const options = [
    ...lifecycle.options.map((option) => {
      const value =
        option.source === "prop" ? `props.${option.name}` : (option.value?.code ?? "undefined");
      return `${option.name}: ${value}`;
    }),
    ...events.map(
      (event) =>
        `${event.handlerProp}(event: Event) {\n      emit("${toVueEventName(event.handlerProp)}", event);\n    }`,
    ),
  ];

  return `onMounted(() => {\n  instance = ${lifecycle.factory}(rootRef.value, {\n    ${options.join(",\n    ")}\n  });\n  cleanup = typeof instance === "object" && instance && "destroy" in instance ? () => instance.destroy?.() : undefined;\n});`;
}

function renderVueStateSync(stateSync: VueStateSync): string {
  return stateSync
    .map(
      (sync) =>
        `watch(\n  () => props.${sync.valueProp},\n  (value) => {\n    const setter = instance?.${sync.setter};\n    if (typeof setter === "function") setter(value);\n  },\n);`,
    )
    .join("\n");
}

function renderVueAttributes(attrs: VueAttribute[], part: string): string {
  return [
    ...attrs.map((attribute) => renderVueAttribute(attribute)),
    `data-sw-part="${part}"`,
  ].join("\n    ");
}

function renderVueAttribute(attribute: VueAttribute): string {
  const name = normalizeHtmlAttributeName(attribute.name);
  if (attribute.value === undefined || attribute.value === true) return name;
  if (typeof attribute.value === "object") return `:${name}="${attribute.value.code}"`;

  return `${name}="${String(attribute.value)}"`;
}

function renderVuePortals(portals: VuePortal): string {
  return portals
    .map((portal) => {
      const target = typeof portal.target === "string" ? portal.target : portal.target.code;
      return `  <Teleport to="${target}">\n    <slot name="${portal.sourcePart}" />\n  </Teleport>\n`;
    })
    .join("");
}

function toVueEventName(handlerProp: string): string {
  const withoutPrefix = handlerProp.startsWith("on") ? handlerProp.slice(2) : handlerProp;
  return `${withoutPrefix.charAt(0).toLowerCase()}${withoutPrefix.slice(1)}`;
}

function toIdentifier(value: string): string {
  return value.replace(/[^a-zA-Z0-9_$]/g, "_");
}
