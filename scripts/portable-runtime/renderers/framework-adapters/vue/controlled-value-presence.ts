import { renderTabs as renderRecipeTabs } from "../../shared-recipes/selection/tabs.js";
import { projectVueAttributeAccess } from "./public-contract.js";

const VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS = projectVueAttributeAccess([]);

import type {
  AdapterControlledValuePresenceComponentProjection,
  AdapterControlledValuePresenceFacts,
  AdapterControlledValuePresenceIndexProjection,
} from "../types.js";
import { projectVueDetailedEvent, projectVueModel } from "./public-contract.js";

export function printVueControlledValuePresenceComponent(
  family: AdapterControlledValuePresenceComponentProjection,
): string {
  return renderRecipeTabs("vue", family.part, family.facts);
}

export function printVueControlledValuePresenceIndex(
  family: AdapterControlledValuePresenceIndexProjection,
): { contents: string; path: string } {
  const { facts } = family;
  const imports = facts.index.importMembers
    .map(({ from, name }) => `import ${name} from "${from}.vue";`)
    .join("\n");
  const members = facts.index.namespaceMembers
    .map(({ key, name }) => `  ${key}: ${name},`)
    .join("\n");
  const exports = facts.index.importMembers.map(({ name }) => name).join(",\n  ");
  return {
    contents: `
${imports}

export { ${facts.context.componentName}, ${facts.context.hookName} } from "./${facts.context.componentName}";

const ${facts.exports.namespace} = {
${members}
};

export {
  ${facts.exports.namespace},
  ${exports},
};

export default ${facts.exports.namespace};

export type { ${facts.index.typeExports.join(", ")} } from "${facts.runtime.typeImportSource}";
`,
    path: `${facts.exports.namespace.toLowerCase()}/index.ts`,
  };
}

export function printVueControlledValuePresenceContext(
  facts: AdapterControlledValuePresenceFacts,
): string {
  const orientation = facts.props.orientation;
  const value = facts.props.value;
  return `import {
  inject,
  type InjectionKey,
  type Ref,
} from "vue";
import type { ${orientation.type}, ${facts.state.type} } from "${facts.runtime.importSource}";

export type ${facts.context.typeName} = Readonly<{
  refresh(): void;
  ${orientation.name}: Readonly<Ref<${orientation.type}>>;
  ${value.name}: Readonly<Ref<${facts.state.type}>>;
}>;

export const ${facts.context.componentName}: InjectionKey<${facts.context.typeName}> = Symbol(
  "Starwind${facts.displayName}",
);

export function ${facts.context.hookName}(componentName: string): ${facts.context.typeName} {
  const context = inject(${facts.context.componentName});
  if (!context) {
    throw new Error(\`\${componentName} must be used within ${facts.exports.root}.\`);
  }
  return context;
}
`;
}

function formatOptions(options: Record<string, boolean | number | string> | undefined): string {
  if (!options) return "{}";
  const entries = Object.entries(options).map(
    ([name, value]) => `${name}: ${JSON.stringify(value)}`,
  );
  return `{ ${entries.join(", ")} }`;
}
