import { renderSimpleRoot } from "../../shared-recipes/simple/frame.js";
import type {
  AdapterActionSurfaceComponentProjection,
  AdapterActionSurfaceFacts,
  AdapterActionSurfaceIndexProjection,
} from "../types.js";

export function printReactActionSurfaceComponent(
  family: AdapterActionSurfaceComponentProjection,
): string {
  return printReactActionSurfaceRoot(family.facts);
}

export function printReactActionSurfaceIndex(family: AdapterActionSurfaceIndexProjection): string {
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
  return renderSimpleRoot("react", "button", facts);
}
