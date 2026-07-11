import type {
  GenericAdapterPlan,
  GenericAdapterPlanPart,
  GenericAdapterPlanProp,
} from "../types.js";

export function findPlanPropForTarget(
  plan: GenericAdapterPlan,
  name: string,
  target: string,
): GenericAdapterPlanProp | undefined {
  return plan.props.find(
    (candidate) => candidate.name === name && candidate.targets?.includes(target) === true,
  );
}

export function getAdapterFamilyProp(prop: {
  defaultValue?: unknown;
  name: string;
  required?: boolean;
  type: string;
}) {
  return {
    defaultValue:
      prop.defaultValue === undefined
        ? undefined
        : formatAdapterFamilyDefaultValue(prop.defaultValue),
    name: prop.name,
    required: "required" in prop ? prop.required : undefined,
    type: prop.type,
  };
}

export function getEvent(plan: GenericAdapterPlan, name: string) {
  const event = plan.events.find((candidate) => candidate.name === name);
  if (!event) {
    throw new Error(`${plan.displayName} generic adapter plan is missing event "${name}".`);
  }

  return event;
}

export function getIndefiniteArticle(value: string): "a" | "an" {
  return /^[aeiou]/i.test(value) ? "an" : "a";
}

export function getPart(plan: GenericAdapterPlan, name: string): GenericAdapterPlanPart {
  const part = plan.parts.find((candidate) => candidate.name === name);
  if (!part) {
    throw new Error(`${plan.displayName} generic adapter plan is missing part "${name}".`);
  }

  return part;
}

export function getPartExportName(plan: GenericAdapterPlan, partName: string): string {
  const member = plan.exports.members.find((candidate) => candidate.part === partName);
  if (!member) {
    throw new Error(
      `${plan.displayName} generic adapter plan is missing export for part "${partName}".`,
    );
  }

  return member.name;
}

export function getPlanProp(plan: GenericAdapterPlan, name: string): GenericAdapterPlanProp {
  const prop = plan.props.find((candidate) => candidate.name === name);
  if (!prop) {
    throw new Error(`${plan.displayName} generic adapter plan is missing prop "${name}".`);
  }

  return prop;
}

export function getPlanPropForTarget(
  plan: GenericAdapterPlan,
  name: string,
  target: string,
): GenericAdapterPlanProp {
  const prop = findPlanPropForTarget(plan, name, target);
  if (!prop) {
    throw new Error(
      `${plan.displayName} generic adapter plan is missing "${name}" prop for target "${target}".`,
    );
  }

  return prop;
}

export function getRenderingPropForTarget(
  plan: GenericAdapterPlan,
  target: string,
): GenericAdapterPlanProp {
  const prop = plan.props.find(
    (candidate) => candidate.kind === "rendering" && candidate.targets?.includes(target),
  );
  if (!prop) {
    throw new Error(
      `${plan.displayName} generic adapter plan is missing rendering prop for target "${target}".`,
    );
  }

  return prop;
}

export function getRequiredPlanValue<T>(value: T | undefined, message: string): T {
  if (value === undefined) {
    throw new Error(message);
  }

  return value;
}

export function getStateModel(plan: GenericAdapterPlan, name: string) {
  const stateModel = plan.stateModels.find((candidate) => candidate.name === name);
  if (!stateModel) {
    throw new Error(`${plan.displayName} generic adapter plan is missing state "${name}".`);
  }

  return stateModel;
}

export function getRuntimeOptionProps(plan: GenericAdapterPlan, names: string[]): string[] {
  const optionProps = plan.runtime.optionProps ?? [];
  const missing = names.filter((name) => !optionProps.includes(name));
  if (missing.length > 0) {
    throw new Error(
      `${plan.displayName} generic adapter plan is missing runtime option props: ${missing.join(
        ", ",
      )}.`,
    );
  }

  return names;
}

export function getOptionalRuntimeOptionProp(
  plan: GenericAdapterPlan,
  name: string,
): string | undefined {
  return plan.runtime.optionProps?.includes(name) === true ? name : undefined;
}

export function getStaticAttributeName(
  plan: GenericAdapterPlan,
  part: { name: string },
  name: string,
): string {
  const attribute = plan.staticAttributes.find(
    (candidate) => candidate.part === part.name && candidate.name === name,
  );
  if (!attribute) {
    throw new Error(
      `${plan.displayName} generic adapter plan is missing static attribute "${name}" on part "${part.name}".`,
    );
  }

  return attribute.name;
}

export function getStaticAttributeValue(
  plan: GenericAdapterPlan,
  part: { name: string },
  name: string,
): string | undefined {
  return plan.staticAttributes.find(
    (candidate) => candidate.part === part.name && candidate.name === name,
  )?.value;
}

export function getOptionalStaticAttributeName(
  plan: GenericAdapterPlan,
  part: { name: string },
  name: string,
): string | undefined {
  return plan.staticAttributes.find(
    (candidate) => candidate.part === part.name && candidate.name === name,
  )?.name;
}

export function getSetterForState(plan: GenericAdapterPlan, stateModel: string) {
  const setter = plan.setters.find(
    (candidate) => "stateModel" in candidate && candidate.stateModel === stateModel,
  );
  if (!setter) {
    throw new Error(
      `${plan.displayName} generic adapter plan is missing setter for state "${stateModel}".`,
    );
  }

  return setter;
}

export function getSetterForProp(plan: GenericAdapterPlan, prop: string) {
  const setter = plan.setters.find(
    (candidate) =>
      ("prop" in candidate && candidate.prop === prop) ||
      ("props" in candidate && candidate.props?.includes(prop)),
  );
  if (!setter) {
    throw new Error(
      `${plan.displayName} generic adapter plan is missing setter for prop "${prop}".`,
    );
  }

  return setter;
}

export function getSetterForProps(plan: GenericAdapterPlan, props: string[]) {
  const setter = plan.setters.find(
    (candidate) =>
      "props" in candidate && props.every((prop) => candidate.props?.includes(prop) === true),
  );
  if (!setter) {
    throw new Error(
      `${plan.displayName} generic adapter plan is missing setter for props "${props.join(", ")}".`,
    );
  }

  return setter;
}

export function getOptionalPartExportName(
  plan: GenericAdapterPlan,
  partName: string,
): string | undefined {
  return plan.exports.members.find((candidate) => candidate.part === partName)?.name;
}

export function getRuntimeTypeImportSource(plan: GenericAdapterPlan): string {
  if (plan.runtime.importSource.startsWith("@starwind-ui/runtime/")) {
    return "@starwind-ui/runtime";
  }

  return plan.runtime.importSource;
}

export function getOptionalRuntimeAdapterFamilyProp(plan: GenericAdapterPlan, name: string) {
  const propName = getOptionalRuntimeOptionProp(plan, name);
  return propName ? getAdapterFamilyProp(getPlanProp(plan, propName)) : undefined;
}

export function getElementType(tagName: string): string {
  const elementTypes: Record<string, string> = {
    button: "HTMLButtonElement",
    div: "HTMLDivElement",
    fieldset: "HTMLFieldSetElement",
    img: "HTMLImageElement",
    input: "HTMLInputElement",
    label: "HTMLLabelElement",
    span: "HTMLSpanElement",
  };

  return elementTypes[tagName] ?? "HTMLElement";
}

export function hasExactNames(actual: string[], expected: string[]): boolean {
  return (
    actual.length === expected.length &&
    expected.every((expectedName) => actual.includes(expectedName))
  );
}

export function toPascalCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join("");
}

export function toCamelCase(value: string): string {
  const pascalValue = toPascalCase(value);

  return `${pascalValue.charAt(0).toLowerCase()}${pascalValue.slice(1)}`;
}

export function pluralizeDisplayName(value: string): string {
  return /(ch|sh|s|x)$/i.test(value) ? `${value}es` : `${value}s`;
}

function formatAdapterFamilyDefaultValue(value: unknown): string {
  return String(value);
}
