import { renderSimpleRoot } from "../../shared-recipes/simple/frame.js";
import type {
  AdapterNativeDisabledComponentProjection,
  AdapterNativeDisabledFacts,
  AdapterNativeDisabledIndexProjection,
  AdapterNativeDisabledPart,
} from "../types.js";

export function printReactNativeDisabledComponent(
  family: AdapterNativeDisabledComponentProjection,
): string {
  const part = getPart(family.facts, family.part);

  if (part.name === family.facts.parts.root.name) {
    return printReactNativeDisabledRoot(family.facts);
  }

  return printReactNativeDisabledSlotPart(family.facts, part);
}

export function printReactNativeDisabledIndex(
  family: AdapterNativeDisabledIndexProjection,
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

function printReactNativeDisabledRoot(facts: AdapterNativeDisabledFacts): string {
  return renderSimpleRoot("react", "fieldset", facts);
}

function printReactNativeDisabledSlotPart(
  facts: AdapterNativeDisabledFacts,
  part: AdapterNativeDisabledPart,
): string {
  const exportName = part.exportName;
  const elementType = getElementType(part);
  const propsType = `${exportName}Props`;

  return `import * as React from "react";\n\nexport type ${propsType} = React.ComponentPropsWithoutRef<"${part.defaultElement}">;\n\nconst ${exportName} = React.forwardRef<${elementType}, ${propsType}>(\n  function ${exportName}({ children, ...props }, ref) {\n    return (\n      <${part.defaultElement} ${part.discoveryAttribute}${renderRole(part)} ref={ref} {...props}>\n        {children}\n      </${part.defaultElement}>\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n`;
}

function getPart(facts: AdapterNativeDisabledFacts, partName: string): AdapterNativeDisabledPart {
  const part = facts.parts.all.find((candidate) => candidate.name === partName);
  if (!part) {
    throw new Error(`${facts.displayName} native-disabled facts are missing ${partName} part.`);
  }

  return part;
}

function getElementType(part: AdapterNativeDisabledPart): string {
  const elementTypes: Record<string, string> = {
    div: "HTMLDivElement",
    fieldset: "HTMLFieldSetElement",
  };

  return elementTypes[part.defaultElement] ?? "HTMLElement";
}

function renderRole(part: AdapterNativeDisabledPart): string {
  return part.role ? ` role=${JSON.stringify(part.role)}` : "";
}
