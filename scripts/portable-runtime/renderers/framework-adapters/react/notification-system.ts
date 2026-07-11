import type {
  AdapterNotificationSystemComponentProjection,
  AdapterNotificationSystemFacts,
  AdapterNotificationSystemIndexProjection,
  AdapterNotificationSystemPartName,
} from "../types.js";

export function printReactNotificationSystemComponent(
  family: AdapterNotificationSystemComponentProjection,
): string {
  if (family.part === "viewport") return printViewport(family.facts);
  if (family.part === "template") return printTemplate(family.facts);
  if (family.part === "root") return printRoot(family.facts);
  if (family.part === "action") return printAction(family.facts);
  if (family.part === "close") return printClose(family.facts);

  return printSimplePart(family.facts, family.part);
}

export function printReactNotificationSystemIndex(
  family: AdapterNotificationSystemIndexProjection,
): string {
  const facts = family.facts;
  const imports = facts.index.importMembers
    .map((member) => `import ${member.name} from "${member.from}";`)
    .join("\n");
  const namespaceEntries = facts.index.namespaceMembers
    .map((member) => `  ${member.key}: ${member.name},`)
    .join("\n");
  const exportNames = [
    facts.exports.namespace,
    ...facts.index.importMembers.map((member) => member.name),
  ]
    .map((name) => `  ${name},`)
    .join("\n");

  return `${imports}\n\nconst ${facts.exports.namespace} = {\n${namespaceEntries}\n};\n\nexport {\n${exportNames}\n};\n\nexport default ${facts.exports.namespace};\n\nexport type { ${facts.index.typeExports.join(", ")} } from "${facts.index.typeExportSource}";\nexport { ${facts.index.valueExports.join(", ")} } from "${facts.index.valueExportSource}";\n`;
}

function printViewport(facts: AdapterNotificationSystemFacts): string {
  const component = facts.exports.viewport;
  const options = facts.viewportOptions;
  const part = facts.parts.viewport;
  const elementType = getReactElementType(part.defaultElement);
  const semantics = facts.viewportSemantics;

  return `import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";\nimport * as React from "react";\n\ntype Position = ${options.position.type};\n\nexport type ${component}Props = React.HTMLAttributes<${elementType}> & {\n  ${options.duration.name}?: ${options.duration.type};\n  ${options.gap.name}?: ${options.gap.type};\n  ${options.limit.name}?: ${options.limit.type};\n  ${options.peek.name}?: ${options.peek.type};\n  ${options.position.name}?: Position;\n};\n\nconst ${component} = React.forwardRef<${elementType}, ${component}Props>(function ${component}(\n  {\n    ${options.duration.name} = ${options.duration.defaultValue},\n    ${options.gap.name} = ${options.gap.defaultValue},\n    ${options.limit.name} = ${options.limit.defaultValue},\n    ${options.peek.name} = ${options.peek.defaultValue},\n    ${options.position.name} = ${options.position.defaultValue},\n    style,\n    ...props\n  },\n  forwardedRef,\n) {\n  const viewportRef = React.useRef<${elementType}>(null);\n  const composedRef = React.useCallback(\n    (node: ${elementType} | null) => {\n      viewportRef.current = node;\n      setRef(forwardedRef, node);\n    },\n    [forwardedRef],\n  );\n\n  React.useEffect(() => {\n    const viewport = viewportRef.current;\n    if (!viewport) return;\n\n    const manager = ${facts.runtime.factory}(viewport);\n\n    return () => {\n      manager.${facts.runtime.destroyMethod}();\n    };\n  }, []);\n\n  const viewportStyle = {\n    "${options.gap.cssVariable}": ${options.gap.name},\n    "${options.peek.cssVariable}": ${options.peek.name},\n    ...style,\n  } as React.CSSProperties & Record<"${options.gap.cssVariable}" | "${options.peek.cssVariable}", string>;\n\n  return (\n    <${part.defaultElement}\n      ${facts.attrs.viewport}\n      ${options.position.attribute}={${options.position.name}}\n      ${options.limit.attribute}={${options.limit.name}}\n      ${options.duration.attribute}={${options.duration.name}}\n      role="${semantics.role}"\n      ${semantics.ariaLiveAttribute}="${semantics.ariaLiveValue}"\n      ${semantics.ariaAtomicAttribute}="${semantics.ariaAtomicValue}"\n      ${semantics.ariaRelevantAttribute}="${semantics.ariaRelevantValue}"\n      ${semantics.ariaLabelAttribute}="${semantics.ariaLabelValue}"\n      tabIndex={${semantics.tabIndexValue}}\n      style={viewportStyle}\n      ref={composedRef}\n      {...props}\n    />\n  );\n});\n\n${component}.displayName = "${facts.displayName}.Viewport";\n\nexport default ${component};\n\n${printSetRef()}\n`;
}

function printTemplate(facts: AdapterNotificationSystemFacts): string {
  const component = facts.exports.template;
  const variant = facts.template.variant;

  return `import * as React from "react";\n\ntype Variant = ${variant.type};\n\nexport type ${component}Props = React.HTMLAttributes<HTMLTemplateElement> & {\n  ${variant.name}?: Variant;\n};\n\nconst ${component} = React.forwardRef<HTMLTemplateElement, ${component}Props>(\n  function ${component}({ ${variant.name} = ${variant.defaultValue}, children, ...props }, forwardedRef) {\n    const templateRef = React.useRef<HTMLTemplateElement>(null);\n    const composedRef = React.useCallback(\n      (node: HTMLTemplateElement | null) => {\n        templateRef.current = node;\n        setRef(forwardedRef, node);\n      },\n      [forwardedRef],\n    );\n\n    React.useLayoutEffect(() => {\n      const template = templateRef.current;\n      if (!template) return;\n\n      const renderedChildren = Array.from(template.childNodes);\n      if (renderedChildren.length > 0) {\n        template.content.replaceChildren(...renderedChildren);\n      }\n    }, [children]);\n\n    return (\n      <template ${facts.attrs.template}={${variant.name}} ref={composedRef} {...props}>\n        {children}\n      </template>\n    );\n  },\n);\n\n${component}.displayName = "${facts.displayName}.Template";\n\nexport default ${component};\n\n${printSetRef()}\n`;
}

function printRoot(facts: AdapterNotificationSystemFacts): string {
  const component = facts.exports.root;
  const part = facts.parts.root;
  const elementType = getReactElementType(part.defaultElement);
  const variant = facts.template.variant;
  const rootState = facts.rootState;

  return `import * as React from "react";\n\ntype Variant = ${variant.type};\n\nexport type ${component}Props = React.HTMLAttributes<${elementType}> & {\n  ${variant.name}?: Variant;\n};\n\nconst ${component} = React.forwardRef<${elementType}, ${component}Props>(\n  function ${component}({ ${variant.name} = ${variant.defaultValue}, ...props }, forwardedRef) {\n    return (\n      <${part.defaultElement}\n        ${facts.attrs.root}\n        ${rootState.stateAttribute}="${rootState.stateOpenValue}"\n        ${rootState.variantAttribute}={${variant.name}}\n        role="${rootState.role}"\n        ${rootState.ariaModalAttribute}="${rootState.ariaModalValue}"\n        ref={forwardedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${component}.displayName = "${facts.displayName}.Root";\n\nexport default ${component};\n`;
}

function printSimplePart(
  facts: AdapterNotificationSystemFacts,
  partName: Exclude<
    AdapterNotificationSystemPartName,
    "action" | "close" | "root" | "template" | "viewport"
  >,
): string {
  const component = facts.exports[partName];
  const part = facts.parts[partName];
  const elementType = getReactElementType(part.defaultElement);

  return `import * as React from "react";\n\nexport type ${component}Props = React.HTMLAttributes<${elementType}>;\n\nconst ${component} = React.forwardRef<${elementType}, ${component}Props>(\n  function ${component}(props, forwardedRef) {\n    return <${part.defaultElement} ${facts.attrs[partName]} ref={forwardedRef} {...props} />;\n  },\n);\n\n${component}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${component};\n`;
}

function printAction(facts: AdapterNotificationSystemFacts): string {
  const component = facts.exports.action;
  const action = facts.actions.action;

  return `import * as React from "react";\n\nexport type ${component}Props = React.ButtonHTMLAttributes<HTMLButtonElement>;\n\nconst ${component} = React.forwardRef<HTMLButtonElement, ${component}Props>(\n  function ${component}(props, forwardedRef) {\n    return <button ${action.typeAttribute}="${action.typeValue}" ${facts.attrs.action} ref={forwardedRef} {...props} />;\n  },\n);\n\n${component}.displayName = "${facts.displayName}.Action";\n\nexport default ${component};\n`;
}

function printClose(facts: AdapterNotificationSystemFacts): string {
  const component = facts.exports.close;
  const close = facts.actions.close;

  return `import * as React from "react";\n\nexport type ${component}Props = React.ButtonHTMLAttributes<HTMLButtonElement>;\n\nconst ${component} = React.forwardRef<HTMLButtonElement, ${component}Props>(\n  function ${component}(props, forwardedRef) {\n    return (\n      <button\n        ${close.typeAttribute}="${close.typeValue}"\n        ${facts.attrs.close}\n        ${close.ariaLabelAttribute}="${close.ariaLabelValue}"\n        ref={forwardedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${component}.displayName = "${facts.displayName}.Close";\n\nexport default ${component};\n`;
}

function getReactElementType(defaultElement: string): string {
  if (defaultElement === "button") return "HTMLButtonElement";
  if (defaultElement === "div") return "HTMLDivElement";
  if (defaultElement === "span") return "HTMLSpanElement";
  if (defaultElement === "template") return "HTMLTemplateElement";

  return "HTMLElement";
}

function printSetRef(): string {
  return `function setRef<T>(ref: React.Ref<T> | undefined, value: T | null): void {\n  if (!ref) return;\n\n  if (typeof ref === "function") {\n    ref(value);\n    return;\n  }\n\n  ref.current = value;\n}`;
}
