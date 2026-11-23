import { renderTabs as renderRecipeTabs } from "../../shared-recipes/selection/tabs.js";

import type {
  AdapterControlledValuePresenceComponentProjection,
  AdapterControlledValuePresenceFacts,
  AdapterControlledValuePresenceIndexProjection,
} from "../types.js";

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
  const internalKey = `${facts.displayName}InternalContext`;
  const internalType = `${facts.displayName}InternalContextValue`;
  const internalHook = `use${facts.displayName}InternalContext`;
  return `import {
  inject,
  type InjectionKey,
  type Ref,
} from "vue";
import type { ${orientation.type}, ${facts.state.type} } from "${facts.runtime.importSource}";

export type ${facts.context.typeName} = Readonly<{
  ${orientation.name}: Readonly<Ref<${orientation.type}>>;
  ${value.name}: Readonly<Ref<${facts.state.type}>>;
}>;

/** Parts also read the Runtime refresh hook. The family index does not export this type. */
export type ${internalType} = ${facts.context.typeName} & Readonly<{ refresh(): void }>;

export const ${internalKey}: InjectionKey<${internalType}> = Symbol(
  "Starwind${facts.displayName}",
);
export const ${facts.context.componentName}: InjectionKey<${facts.context.typeName}> = ${internalKey};

export function ${internalHook}(componentName: string): ${internalType} {
  const context = inject(${internalKey});
  if (!context) {
    throw new Error(\`\${componentName} must be used within ${facts.exports.root}.\`);
  }
  return context;
}

export function ${facts.context.hookName}(componentName: string): ${facts.context.typeName} {
  return ${internalHook}(componentName);
}
`;
}
