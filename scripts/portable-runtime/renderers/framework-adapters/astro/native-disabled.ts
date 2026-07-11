import type {
  AdapterNativeDisabledComponentProjection,
  AdapterNativeDisabledFacts,
  AdapterNativeDisabledIndexProjection,
  AdapterNativeDisabledPart,
} from "../types.js";
import { astroLifecycleProjection } from "./lifecycle-projection.js";

export function printAstroNativeDisabledComponent(
  family: AdapterNativeDisabledComponentProjection,
): string {
  const part = getPart(family.facts, family.part);

  if (part.name === family.facts.parts.root.name) {
    return printAstroNativeDisabledRoot(family.facts);
  }

  return printAstroNativeDisabledSlotPart(part);
}

export function printAstroNativeDisabledIndex(
  family: AdapterNativeDisabledIndexProjection,
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

function printAstroNativeDisabledRoot(facts: AdapterNativeDisabledFacts): string {
  const part = facts.parts.root;
  const disabled = facts.props.disabled.name;
  const runtimeScript = astroLifecycleProjection.printRuntimeSetup({
    elementName: "root",
    factory: facts.runtime.factory,
    importSource: facts.runtime.importSource,
    selectorAttribute: part.discoveryAttribute,
    setupFunction: facts.runtime.setupFunction,
  });

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ninterface Props extends HTMLAttributes<"${part.defaultElement}"> {\n  ${disabled}?: ${facts.props.disabled.type};\n}\n\nconst { ${disabled} = ${getPropDefault(facts, facts.props.disabled)}, ...rest } = Astro.props;\n---\n\n<${part.defaultElement} ${part.discoveryAttribute} ${facts.attrs.stateDisabled}={${disabled} ? "" : undefined} ${facts.attrs.disabled}={${disabled}} {...rest}>\n  <slot />\n</${part.defaultElement}>\n${runtimeScript}`;
}

function printAstroNativeDisabledSlotPart(part: AdapterNativeDisabledPart): string {
  const frontmatter = astroLifecycleProjection.printFileEnvelope(
    astroLifecycleProjection.printRestPropsBinding({
      defaultElement: part.defaultElement,
      trailingBlankLine: true,
    }),
  );

  return `${frontmatter}\n\n<${part.defaultElement} ${part.discoveryAttribute}${renderRole(part)} {...rest}>\n  <slot />\n</${part.defaultElement}>\n`;
}

function getPart(facts: AdapterNativeDisabledFacts, partName: string): AdapterNativeDisabledPart {
  const part = facts.parts.all.find((candidate) => candidate.name === partName);
  if (!part) {
    throw new Error(`${facts.displayName} native-disabled facts are missing ${partName} part.`);
  }

  return part;
}

function getPropDefault(
  facts: AdapterNativeDisabledFacts,
  prop: AdapterNativeDisabledFacts["props"]["disabled"],
): string {
  if (prop.defaultValue === undefined) {
    throw new Error(`${facts.displayName} ${prop.name} prop is missing a default value.`);
  }

  return prop.defaultValue;
}

function renderRole(part: AdapterNativeDisabledPart): string {
  return part.role ? ` role=${JSON.stringify(part.role)}` : "";
}
