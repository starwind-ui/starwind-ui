import type {
  AdapterActionSurfaceComponentProjection,
  AdapterActionSurfaceFacts,
  AdapterActionSurfaceIndexProjection,
} from "../types.js";
import { astroLifecycleProjection } from "./lifecycle-projection.js";

export function printAstroActionSurfaceComponent(
  family: AdapterActionSurfaceComponentProjection,
): string {
  return printAstroActionSurfaceRoot(family.facts);
}

export function printAstroActionSurfaceIndex(
  family: AdapterActionSurfaceIndexProjection,
): string {
  const facts = family.facts;
  const extension = ".astro";
  const imports = facts.index.importMembers
    .map((member) => `import ${member.name} from "${member.from}${extension}";`)
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

function printAstroActionSurfaceRoot(facts: AdapterActionSurfaceFacts): string {
  const disabled = facts.props.disabled.name;
  const focusableWhenDisabled = facts.props.focusableWhenDisabled.name;
  const type = facts.props.type.name;
  const part = facts.parts.root;
  const runtimeScript = astroLifecycleProjection.printRuntimeSetup({
    elementName: "button",
    factory: facts.runtime.factory,
    importSource: facts.runtime.importSource,
    selectorAttribute: part.discoveryAttribute,
    setupFunction: facts.runtime.setupFunction,
  });
  const protectedDiscovery = part.discoveryAttributeOwnership === "protected";
  const leadingDiscoveryAttribute = protectedDiscovery ? "" : `\n  ${part.discoveryAttribute}`;
  const trailingDiscoveryAttribute = protectedDiscovery ? `\n  ${part.discoveryAttribute}` : "";

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ninterface Props extends HTMLAttributes<"${part.defaultElement}"> {\n  ${focusableWhenDisabled}?: ${facts.props.focusableWhenDisabled.type};\n}\n\nconst { ${type} = ${getPropDefault(facts, facts.props.type, '"button"')}, ${disabled} = ${getPropDefault(facts, facts.props.disabled)}, ${focusableWhenDisabled} = ${getPropDefault(facts, facts.props.focusableWhenDisabled)}, ...rest } = Astro.props;\n---\n\n<${part.defaultElement}${leadingDiscoveryAttribute}\n  ${facts.attrs.focusableWhenDisabled}={${focusableWhenDisabled} ? "true" : undefined}\n  ${facts.attrs.stateDisabled}={${disabled} ? "" : undefined}\n  ${facts.attrs.ariaDisabled}={${disabled} && ${focusableWhenDisabled} ? "true" : undefined}\n  ${facts.attrs.disabled}={${disabled} && !${focusableWhenDisabled}}\n  ${facts.attrs.type}={${type}}\n  {...rest}${trailingDiscoveryAttribute}\n>\n  <slot />\n</${part.defaultElement}>\n${runtimeScript}`;
}

function getPropDefault(
  facts: AdapterActionSurfaceFacts,
  prop: AdapterActionSurfaceFacts["props"]["disabled"],
  fallback?: string,
): string {
  if (prop.defaultValue === undefined && fallback !== undefined) {
    return fallback;
  }

  if (prop.defaultValue === undefined) {
    throw new Error(`${facts.displayName} ${prop.name} prop is missing a default value.`);
  }

  return prop.defaultValue;
}
