import { renderFormGroup } from "../../shared-recipes/grouped/groups.js";
import { renderToggleGroup } from "../../shared-recipes/toggle-selection/recipe.js";
import { projectVueAttributeAccess } from "./public-contract.js";
import { groupOperations } from "./recipe-form-group.js";
import { toggleOperations } from "./recipe-toggle.js";

const VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS = projectVueAttributeAccess([]);

import type {
  AdapterComponentFile,
  AdapterGroupedValueControlFacts,
  AdapterHelperFile,
  AdapterIndexFile,
  AdapterPrintedFile,
} from "../types.js";
import { projectVueModel } from "./public-contract.js";

export function printVueGroupedValueControlComponent(
  file: AdapterComponentFile,
): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "grouped-value-control") {
    throw new TypeError(
      "Vue grouped-value-control projection requires grouped-value-control facts.",
    );
  }
  if (["createRadioGroup", "createCheckboxGroup"].includes(family.facts.runtime.factory))
    return { path: `${file.path}.vue`, contents: renderFormGroup(groupOperations, family.facts) };
  if (family.facts.behavior.multipleValueNormalization) {
    return {
      path: `${file.path}.vue`,
      contents: renderToggleGroup(toggleOperations("toggle-group"), family.facts),
    };
  }
  if (family.facts.props.form || family.facts.props.orientation) {
    return printVueScalarGroupedValueRoot(file, family.facts);
  }

  return printVueArrayGroupedValueRoot(file, family.facts);
}

export function printVueGroupedValueControlHelper(file: AdapterHelperFile): AdapterPrintedFile {
  const family = file.family;
  if (family?.kind !== "grouped-value-control" || !family.facts.context) {
    throw new TypeError("Vue grouped-value-control helper requires context facts.");
  }
  const { context, runtime, state } = family.facts;
  const contextSymbol = `const ${context.componentName}: InjectionKey<${context.typeName}> = Symbol("Starwind${context.componentName}");`;
  const printedContextSymbol =
    contextSymbol.length <= 100
      ? contextSymbol
      : `const ${context.componentName}: InjectionKey<${context.typeName}> = Symbol(
  "Starwind${context.componentName}",
);`;

  return {
    contents: `import type { ${state.type} } from "${runtime.importSource}";
import { type InjectionKey, inject, type Ref } from "vue";

export type ${context.typeName} = Readonly<{
${context.values.map((value) => `  ${value.name}: Readonly<Ref<${value.type}${value.required === false ? " | undefined" : ""}>>;`).join("\n")}
}>;

${printedContextSymbol}

function ${context.hookName}(): ${context.typeName} | undefined {
  return inject(${context.componentName}, undefined);
}

export { ${context.componentName}, ${context.hookName} };
`,
    path: file.path,
  };
}

export function printVueGroupedValueControlIndex(file: AdapterIndexFile): AdapterPrintedFile {
  const family = file.family;
  if (family?.kind !== "grouped-value-control") {
    throw new TypeError("Vue grouped-value-control index requires grouped-value-control facts.");
  }
  const { context, exports } = family.facts;
  const helperExports = context
    ? `export type { ${context.typeName} } from "./${context.componentName}";
export { ${context.componentName}, ${context.hookName} } from "./${context.componentName}";`
    : "";

  return {
    contents: `import ${exports.root} from "./${exports.root}.vue";

const ${exports.namespace} = {
  Root: ${exports.root},
};

${helperExports}
export { default as ${exports.root} } from "./${exports.root}.vue";
export { ${exports.namespace} };

export default ${exports.namespace};

${file.typeFacades.map((facade) => facade.body.code).join("\n")}
`,
    path: file.path,
  };
}

function printVueArrayGroupedValueRoot(
  file: AdapterComponentFile,
  facts: AdapterGroupedValueControlFacts,
): AdapterPrintedFile {
  return { path: `${file.path}.vue`, contents: renderFormGroup(groupOperations, facts) };
}

function printVueScalarGroupedValueRoot(
  file: AdapterComponentFile,
  facts: AdapterGroupedValueControlFacts,
): AdapterPrintedFile {
  return { path: `${file.path}.vue`, contents: renderFormGroup(groupOperations, facts) };
}

function requireContext(facts: AdapterGroupedValueControlFacts) {
  if (!facts.context) throw new TypeError(`${facts.displayName} requires grouped context facts.`);
  return facts.context;
}

function requireFact<T>(value: T | undefined, message: string): T {
  if (value === undefined) throw new TypeError(message);
  return value;
}

function formatOptions(
  options: Readonly<Record<string, boolean | number | string>> | undefined,
): string {
  if (!options || Object.keys(options).length === 0) return "{}";
  return `{ ${Object.entries(options)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join(", ")} }`;
}
