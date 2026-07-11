import type {
  AdapterNativeInputValueComponentProjection,
  AdapterNativeInputValueFacts,
  AdapterNativeInputValueIndexProjection,
} from "../types.js";
import { astroLifecycleProjection } from "./lifecycle-projection.js";

export function printAstroNativeInputValueComponent(
  family: AdapterNativeInputValueComponentProjection,
): string {
  return printAstroNativeInputValueRoot(family.facts);
}

export function printAstroNativeInputValueIndex(
  family: AdapterNativeInputValueIndexProjection,
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
  const typeExports = facts.index.typeExports.join(", ");

  return `${imports}\n\nconst ${facts.exports.namespace} = {\n${namespaceEntries}\n};\n\nexport { ${exportNames} };\n\nexport default ${facts.exports.namespace};\n\nexport type { ${typeExports} } from "${facts.runtime.typeImportSource}";\n`;
}

function printAstroNativeInputValueRoot(facts: AdapterNativeInputValueFacts): string {
  const part = facts.parts.root;
  const defaultValue = facts.props.defaultValue.name;
  const disabled = facts.props.disabled.name;
  const value = facts.props.value.name;
  const runtimeScript = astroLifecycleProjection.printRuntimeSetup({
    elementName: "input",
    factory: facts.runtime.factory,
    importSource: facts.runtime.importSource,
    selectorAttribute: part.discoveryAttribute,
    setupFunction: facts.runtime.setupFunction,
  });

  return `---\nimport type { ${facts.props.value.type} } from "${facts.runtime.importSource}";\nimport type { HTMLAttributes } from "astro/types";\n\ninterface Props extends Omit<HTMLAttributes<"${part.defaultElement}">, "children" | "${defaultValue}" | "${value}"> {\n  ${defaultValue}?: ${facts.props.defaultValue.type};\n  ${value}?: ${facts.props.value.type};\n}\n\nconst { ${defaultValue}, ${disabled} = ${getPropDefault(facts, facts.props.disabled)}, ${value}, ...rest } = Astro.props;\n---\n\n<${part.defaultElement}\n  ${part.discoveryAttribute}\n  ${facts.attrs.stateDisabled}={${disabled} ? "" : undefined}\n  ${facts.attrs.disabled}={${disabled}}\n  ${facts.attrs.value}={${value} ?? ${defaultValue}}\n  {...rest}\n/>\n${runtimeScript}`;
}

function getPropDefault(
  facts: AdapterNativeInputValueFacts,
  prop: AdapterNativeInputValueFacts["props"]["disabled"],
): string {
  if (prop.defaultValue === undefined) {
    throw new Error(`${facts.displayName} ${prop.name} prop is missing a default value.`);
  }

  return prop.defaultValue;
}
