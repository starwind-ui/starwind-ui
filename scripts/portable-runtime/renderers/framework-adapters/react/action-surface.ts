import type {
  AdapterActionSurfaceComponentProjection,
  AdapterActionSurfaceFacts,
  AdapterActionSurfaceIndexProjection,
} from "../types.js";
import { reactLifecycleProjection } from "./lifecycle-projection.js";

export function printReactActionSurfaceComponent(
  family: AdapterActionSurfaceComponentProjection,
): string {
  return printReactActionSurfaceRoot(family.facts);
}

export function printReactActionSurfaceIndex(
  family: AdapterActionSurfaceIndexProjection,
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
  ].join(", ");

  return `${imports}\n\nconst ${facts.exports.namespace} = {\n${namespaceEntries}\n};\n\nexport { ${exportNames} };\n\nexport default ${facts.exports.namespace};\n`;
}

function printReactActionSurfaceRoot(facts: AdapterActionSurfaceFacts): string {
  const disabled = facts.props.disabled.name;
  const focusableWhenDisabled = facts.props.focusableWhenDisabled.name;
  const type = facts.props.type.name;
  const exportName = facts.exports.root;
  const part = facts.parts.root;
  const elementType = getElementType(part.defaultElement);
  const propsType = `${exportName}Props`;
  const rootRef = reactLifecycleProjection.printRootRef({ elementType, indentation: "  " });
  const composedRef = reactLifecycleProjection.printComposedRefCallback({
    elementType,
    indentation: "  ",
  });
  const runtimeEffect = reactLifecycleProjection.printEffect({
    body: `const root = rootRef.current;\nif (!root) return;\n\nconst instance = ${facts.runtime.factory}(root, {\n  ${disabled},\n  ${focusableWhenDisabled},\n});\n\nreturn () => {\n  instance.destroy();\n};`,
    dependencies: facts.runtime.optionProps,
    hook: "useIsomorphicLayoutEffect",
    indentation: "  ",
  });
  const protectedDiscovery = part.discoveryAttributeOwnership === "protected";
  const leadingDiscoveryAttribute = protectedDiscovery ? "" : `\n      ${part.discoveryAttribute}`;
  const trailingDiscoveryAttribute = protectedDiscovery ? `\n      ${part.discoveryAttribute}` : "";

  return `import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";\nimport * as React from "react";\nimport { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";\n\nexport type ${propsType} = ${getReactNativePropsType(part.defaultElement, elementType)} & {\n  ${disabled}?: ${facts.props.disabled.type};\n  ${focusableWhenDisabled}?: ${facts.props.focusableWhenDisabled.type};\n  ${type}?: ${getReactTypePropType(part.defaultElement, elementType)};\n};\n\nconst ${exportName} = React.forwardRef<${elementType}, ${propsType}>(function ${exportName}(\n  { ${disabled} = ${getPropDefault(facts, facts.props.disabled)}, ${focusableWhenDisabled} = ${getPropDefault(facts, facts.props.focusableWhenDisabled)}, ${type}, ...props },\n  forwardedRef,\n) {\n${rootRef}\n\n${composedRef}\n\n${runtimeEffect}\n\n  return (\n    <${part.defaultElement}${leadingDiscoveryAttribute}\n      ${facts.attrs.focusableWhenDisabled}={${focusableWhenDisabled} ? "true" : undefined}\n      ${facts.attrs.ariaDisabled}={${disabled} && ${focusableWhenDisabled} ? "true" : undefined}\n      ${facts.attrs.stateDisabled}={${disabled} ? "" : undefined}\n      ${facts.attrs.disabled}={${disabled} && !${focusableWhenDisabled}}\n      ref={composedRef}\n      ${facts.attrs.type}={${type} ?? "button"}\n      {...props}${trailingDiscoveryAttribute}\n    />\n  );\n});\n\n${exportName}.displayName = "${facts.displayName}.Root";\n\nexport default ${exportName};\n\n${renderSetRefFunction()}`;
}

function getPropDefault(
  facts: AdapterActionSurfaceFacts,
  prop: AdapterActionSurfaceFacts["props"]["disabled"],
): string {
  if (prop.defaultValue === undefined) {
    throw new Error(`${facts.displayName} ${prop.name} prop is missing a default value.`);
  }

  return prop.defaultValue;
}

function getReactNativePropsType(tagName: string, elementType: string): string {
  return tagName === "button"
    ? `React.ButtonHTMLAttributes<${elementType}>`
    : `React.HTMLAttributes<${elementType}>`;
}

function getReactTypePropType(tagName: string, elementType: string): string {
  return tagName === "button" ? `React.ButtonHTMLAttributes<${elementType}>["type"]` : "string";
}

function getElementType(tagName: string): string {
  const elementTypes: Record<string, string> = {
    button: "HTMLButtonElement",
    div: "HTMLDivElement",
    span: "HTMLSpanElement",
  };

  return elementTypes[tagName] ?? "HTMLElement";
}

function renderSetRefFunction(): string {
  return `function setRef<T>(ref: React.Ref<T> | undefined, value: T | null): void {\n  if (!ref) return;\n\n  if (typeof ref === "function") {\n    ref(value);\n    return;\n  }\n\n  ref.current = value;\n}\n`;
}
