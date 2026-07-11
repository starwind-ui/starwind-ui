import type {
  AdapterRangeStatusComponentProjection,
  AdapterRangeStatusFacts,
  AdapterRangeStatusIndexProjection,
} from "../types.js";
import { astroLifecycleProjection } from "./lifecycle-projection.js";

export function printAstroRangeStatusComponent(
  family: AdapterRangeStatusComponentProjection,
): string {
  const facts = family.facts;

  if (family.part === "root") return printAstroRangeStatusRoot(facts);
  if (family.part === "value") return printAstroRangeStatusValue(facts);
  if (family.part === "label") return printAstroRangeStatusLabel(facts);

  return printAstroRangeStatusStaticPart(facts, family.part);
}

export function printAstroRangeStatusIndex(family: AdapterRangeStatusIndexProjection): string {
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
  ]
    .map((name) => `  ${name},`)
    .join("\n");

  return `${imports}\n\nconst ${facts.exports.namespace} = {\n${namespaceEntries}\n};\n\nexport {\n${exportNames}\n};\n\nexport default ${facts.exports.namespace};\n`;
}

function printAstroRangeStatusRoot(facts: AdapterRangeStatusFacts): string {
  const valueProp = facts.props.value.name;
  const minProp = facts.props.min.name;
  const maxProp = facts.props.max.name;
  const runtimeScript = astroLifecycleProjection.printRuntimeSetup({
    elementName: "root",
    factory: facts.runtime.factory,
    importSource: facts.runtime.importSource,
    selectorAttribute: facts.parts.root.discoveryAttribute,
    setupFunction: facts.runtime.setupFunction,
  });

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = Omit<HTMLAttributes<"${facts.parts.root.defaultElement}">, "${valueProp}"> & {\n  ${maxProp}?: ${facts.props.max.type};\n  ${minProp}?: ${facts.props.min.type};\n  ${valueProp}?: ${facts.props.value.type};\n};\n\nconst { ${maxProp} = ${getPropDefault(facts, facts.props.max)}, ${minProp} = ${getPropDefault(facts, facts.props.min)}, ${valueProp} = ${getPropDefault(facts, facts.props.value)}, ...rest } = Astro.props;\nconst isIndeterminate = ${valueProp} == null;\n---\n\n<${facts.parts.root.defaultElement}\n  {...rest}\n  ${facts.parts.root.discoveryAttribute}\n  ${facts.attrs.value}={isIndeterminate ? undefined : ${valueProp}}\n  ${facts.attrs.min}={${minProp}}\n  ${facts.attrs.max}={${maxProp}}\n  ${facts.attrs.indeterminate}={isIndeterminate ? "" : undefined}\n  role="${facts.parts.root.role}"\n>\n  <slot />\n</${facts.parts.root.defaultElement}>\n${runtimeScript}`;
}

function printAstroRangeStatusStaticPart(
  facts: AdapterRangeStatusFacts,
  partName: "indicator" | "track",
): string {
  const part = facts.parts[partName];
  const frontmatter = astroLifecycleProjection.printFileEnvelope(
    astroLifecycleProjection.printRestPropsBinding({ defaultElement: part.defaultElement }),
  );

  return `${frontmatter}\n\n<${part.defaultElement} ${part.discoveryAttribute} {...rest}>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAstroRangeStatusValue(facts: AdapterRangeStatusFacts): string {
  const part = facts.parts.value;
  const frontmatter = astroLifecycleProjection.printFileEnvelope(
    astroLifecycleProjection.printRestPropsBinding({
      defaultElement: part.defaultElement,
      setupStatements: ['const preserveText = Astro.slots.has("default");'],
    }),
  );

  return `${frontmatter}\n\n<${part.defaultElement}\n  ${part.discoveryAttribute}\n  ${facts.attrs.valuePreserveText}={preserveText ? "" : undefined}\n  {...rest}\n  ${facts.attrs.valueAriaHidden.attribute}="${facts.attrs.valueAriaHidden.value}"\n>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAstroRangeStatusLabel(facts: AdapterRangeStatusFacts): string {
  const part = facts.parts.label;
  const frontmatter = astroLifecycleProjection.printFileEnvelope(
    astroLifecycleProjection.printRestPropsBinding({ defaultElement: part.defaultElement }),
  );

  return `${frontmatter}\n\n<${part.defaultElement} ${part.discoveryAttribute} {...rest} ${facts.attrs.labelRole.attribute}="${facts.attrs.labelRole.value}">\n  <slot />\n</${part.defaultElement}>\n`;
}

function getPropDefault(
  facts: AdapterRangeStatusFacts,
  prop: AdapterRangeStatusFacts["props"]["value"],
): string {
  if (prop.defaultValue === undefined) {
    throw new Error(`${facts.displayName} ${prop.name} prop is missing a default value.`);
  }

  return prop.defaultValue;
}
