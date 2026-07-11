import { defineFrameworkAdapter } from "../conformance.js";
import {
  defineFrameworkAdapterReadiness,
  normalizeSolidAttributeName,
} from "../future-readiness.js";
import type { FrameworkAdapter } from "../types.js";

const NON_SHIPPING_COMMENT =
  "Non-shipping future framework tracer adapter. Do not publish, export, register, or copy into demo dependencies.";

export const solidFrameworkAdapterReadiness = defineFrameworkAdapterReadiness({
  booleanAttributeStrategy: "jsx-boolean",
  contextStrategy: "solid-context",
  eventStrategy: "solid-callback-prop",
  fileExtension: ".tsx",
  lifecycleStrategy: "solid-mount-effect-cleanup",
  normalizeAttributeName: normalizeSolidAttributeName,
  portalStrategy: "solid-portal",
  propStrategy: "solid-jsx-props",
  publicSupport: {
    cliRegistry: false,
    demoIntegration: false,
    packageExports: false,
    publicDocsClaim: false,
    status: "non-shipping-tracer",
  },
  refStrategy: "solid-ref",
  slotStrategy: "solid-children",
  target: "solid",
} as const);

export const solidFrameworkAdapter = defineFrameworkAdapter({
  fileExtension: solidFrameworkAdapterReadiness.fileExtension,
  target: solidFrameworkAdapterReadiness.target,
  printOutput(model) {
    return model.files.filter((file) => !file.target || file.target === this.target).map((file) => {
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
    const providerContext = component.context.find((context) => context.role === "provider");
    const contextName = providerContext?.name ?? `${component.name}Context`;
    const contextValueName = `${toIdentifier(contextName)}Value`;
    const propNames = component.props.map((prop) => prop.name);
    const eventPropNames = component.events.map((event) => event.handlerProp);
    const props = [
      ...component.props.map((prop) => `  ${prop.name}${prop.required ? "" : "?"}: ${prop.type};`),
      ...component.events.map((event) => `  ${event.handlerProp}?: (event: Event) => void;`),
    ].join("\n");
    const splitPropsEntries = ["children", ...propNames, ...eventPropNames]
      .map((prop) => `"${prop}"`)
      .join(", ");
    const contextFallback =
      propNames.length === 0
        ? "{}"
        : `{ ${propNames.map((prop) => `${prop}: undefined`).join(", ")} }`;
    const contextValue =
      propNames.length === 0 ? "{}" : `{ ${propNames.map((prop) => `${prop}: local.${prop}`).join(", ")} }`;
    const lifecycle = renderSolidLifecycle(component.lifecycle);
    const eventEffects = renderSolidEventEffects(component.events);
    const attrs = renderSolidAttributes(render?.attrs ?? [], render?.part ?? "root");
    const portal = renderSolidPortals(component.portals);

    return {
      contents: `/* ${NON_SHIPPING_COMMENT} */\nimport { createContext, createEffect, onCleanup, onMount, splitProps, useContext } from "solid-js";\nimport type { JSX } from "solid-js";\nimport { Portal } from "solid-js/web";\n\nexport type ${component.name}Props = JSX.HTMLAttributes<HTMLElement> & {\n${props || "  // no component-specific props"}\n};\n\nconst ${toIdentifier(contextName)} = createContext<Record<string, unknown>>(${contextFallback});\n\nexport function ${component.name}(allProps: ${component.name}Props) {\n  const [local, rest] = splitProps(allProps, [${splitPropsEntries}] as const);\n  useContext(${toIdentifier(contextName)});\n  const ${contextValueName} = ${contextValue};\n  let rootRef!: HTMLElement;\n${lifecycle}\n${eventEffects}\n  return (\n    <${toIdentifier(contextName)}.Provider value={${contextValueName}}>\n      <${tag} ref={rootRef} ${attrs} {...rest}>\n        {local.children}\n      </${tag}>\n${portal}    </${toIdentifier(contextName)}.Provider>\n  );\n}\n\nexport default ${component.name};\n`,
      path: `${file.path}${this.fileExtension}`,
    };
  },
  printHelperFile(file) {
    return {
      contents: `/* ${NON_SHIPPING_COMMENT} */\nexport function ${file.name}() {\n  ${file.body.code}\n}\n`,
      path: file.path,
    };
  },
  printIndexFile(file) {
    return {
      contents: `// ${NON_SHIPPING_COMMENT}\n${file.exports.members
        .map((member) => `export { default as ${member.name} } from "${member.from}";`)
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
  normalizeAttributeName: solidFrameworkAdapterReadiness.normalizeAttributeName,
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

type SolidLifecycle = Parameters<FrameworkAdapter["projectRuntimeLifecycle"]>[0] | undefined;
type SolidEventBridge = Parameters<FrameworkAdapter["projectEventBridge"]>[0][];
type SolidAttribute = Parameters<FrameworkAdapter["projectBooleanAttribute"]>[0];
type SolidPortal = Parameters<FrameworkAdapter["projectPortal"]>[0][];

function renderSolidLifecycle(lifecycle: SolidLifecycle): string {
  if (!lifecycle) return "";

  return `\n  onMount(() => {\n    const instance = ${lifecycle.factory}(rootRef);\n    onCleanup(() => {\n      if (typeof instance === "object" && instance && "destroy" in instance) instance.destroy();\n    });\n  });\n`;
}

function renderSolidEventEffects(events: SolidEventBridge): string {
  return events
    .map(
      (event) =>
        `\n  createEffect(() => {\n    local.${event.handlerProp}?.(new Event("${event.runtimeEvent}"));\n  });\n`,
    )
    .join("");
}

function renderSolidAttributes(attrs: SolidAttribute[], part: string): string {
  return [
    ...attrs.map((attribute) => renderSolidAttribute(attribute)),
    `data-sw-part="${part}"`,
  ].join("\n        ");
}

function renderSolidAttribute(attribute: SolidAttribute): string {
  const name = normalizeSolidAttributeName(attribute.name);
  if (attribute.value === undefined || attribute.value === true) return name;
  if (typeof attribute.value === "object") return `${name}={${attribute.value.code}}`;
  if (typeof attribute.value === "string") return `${name}="${attribute.value}"`;

  return `${name}={${attribute.value}}`;
}

function renderSolidPortals(portals: SolidPortal): string {
  return portals
    .map((portal) => {
      const target = typeof portal.target === "string" ? portal.target : portal.target.code;
      const mount = target === "body" ? "document.body" : target;
      return `      <Portal mount={${mount}}>\n        <div data-sw-portal-source="${portal.sourcePart}" />\n      </Portal>\n`;
    })
    .join("");
}

function toIdentifier(value: string): string {
  return value.replace(/[^a-zA-Z0-9_$]/g, "_");
}
