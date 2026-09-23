import { renderSimpleRoot } from "../../shared-recipes/simple/frame.js";
import { progressPartPolicy } from "../../shared-recipes/simple/parts.js";
import type {
  AdapterRangeStatusComponentProjection,
  AdapterRangeStatusFacts,
  AdapterRangeStatusIndexProjection,
} from "../types.js";

export function printReactRangeStatusComponent(
  family: AdapterRangeStatusComponentProjection,
): string {
  const facts = family.facts;

  if (family.part === "root") return printReactRangeStatusRoot(facts);
  if (family.part === "value") return printReactRangeStatusValue(facts);
  if (family.part === "label") return printReactRangeStatusLabel(facts);

  return printReactRangeStatusStaticPart(facts, family.part);
}

export function printReactRangeStatusIndex(family: AdapterRangeStatusIndexProjection): string {
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

  return `${imports}\n\nconst ${facts.exports.namespace} = {\n${namespaceEntries}\n};\n\nexport {\n${exportNames}\n};\n\nexport default ${facts.exports.namespace};\n`;
}

function printReactRangeStatusRoot(facts: AdapterRangeStatusFacts): string {
  return renderSimpleRoot("react", "progress", facts);
}

function printReactRangeStatusStaticPart(
  facts: AdapterRangeStatusFacts,
  partName: "indicator" | "track",
): string {
  const part = facts.parts[partName];
  const exportName = facts.exports[partName];
  const elementType = getElementType(part.defaultElement);
  const propsType = `${exportName}Props`;

  return `import * as React from "react";\n\nexport type ${propsType} = React.HTMLAttributes<${elementType}>;\n\nconst ${exportName} = React.forwardRef<${elementType}, ${propsType}>(\n  function ${exportName}(props, forwardedRef) {\n    return <${part.defaultElement} ${part.discoveryAttribute} ref={forwardedRef} {...props} />;\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n`;
}

function printReactRangeStatusValue(facts: AdapterRangeStatusFacts): string {
  const policy = progressPartPolicy(facts, "value");
  const part = facts.parts.value;
  const exportName = facts.exports.value;
  const elementType = getElementType(part.defaultElement);
  const propsType = `${exportName}Props`;

  return `import * as React from "react";\n\nexport type ${propsType} = React.HTMLAttributes<${elementType}>;\n\nconst ${exportName} = React.forwardRef<${elementType}, ${propsType}>(\n  function ${exportName}({ children, ...props }, forwardedRef) {\n    return (\n      <${part.defaultElement}\n        ${part.discoveryAttribute}\n        ${facts.attrs.valuePreserveText}={${policy.childText === "runtime-unless-children" ? 'children == null ? undefined : ""' : '""'}}\n        ref={forwardedRef}\n        {...props}\n        ${facts.attrs.valueAriaHidden.attribute}="${facts.attrs.valueAriaHidden.value}"\n      >\n        {children}\n      </${part.defaultElement}>\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.Value";\n\nexport default ${exportName};\n`;
}

function printReactRangeStatusLabel(facts: AdapterRangeStatusFacts): string {
  const part = facts.parts.label;
  const exportName = facts.exports.label;
  const elementType = getElementType(part.defaultElement);
  const propsType = `${exportName}Props`;

  return `import * as React from "react";\n\nexport type ${propsType} = React.HTMLAttributes<${elementType}>;\n\nconst ${exportName} = React.forwardRef<${elementType}, ${propsType}>(\n  function ${exportName}(props, forwardedRef) {\n    return <${part.defaultElement} ${part.discoveryAttribute} ref={forwardedRef} {...props} ${facts.attrs.labelRole.attribute}="${facts.attrs.labelRole.value}" />;\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.Label";\n\nexport default ${exportName};\n`;
}

function getElementType(tagName: string): string {
  const elementTypes: Record<string, string> = {
    div: "HTMLDivElement",
    span: "HTMLSpanElement",
  };

  return elementTypes[tagName] ?? "HTMLElement";
}
