import type {
  AdapterComponentFile,
  AdapterOutputModel,
  AdapterRangeStatusFacts,
  AdapterRangeStatusPartName,
} from "../../framework-adapters/types.js";
import type { AdapterOutputFamilyPlan } from "../adapter-family-plans.js";
import type {
  GenericAdapterPlan,
  GenericAdapterPlanPart,
  GenericAdapterPlanProp,
  GenericAdapterPlanStaticAttribute,
} from "../types.js";
import {
  getAdapterFamilyProp,
  getPart,
  getPartExportName,
  getPlanProp,
  getRequiredPlanValue,
  getRuntimeTypeImportSource,
  getStateModel,
  getStaticAttributeName,
  toPascalCase,
} from "./toolkit.js";

export const rangeStatusAdapterFamilyPlan = {
  buildOutputModel: buildRangeStatusOutputModel,
  id: "range-status",
  matches: isRangeStatusOutputModelPlan,
} satisfies AdapterOutputFamilyPlan<AdapterOutputModel>;

function buildRangeStatusOutputModel(plan: GenericAdapterPlan): AdapterOutputModel {
  const facts = getRangeStatusFacts(plan);

  return {
    files: [
      createRangeStatusComponentFile(plan, "root", facts),
      createRangeStatusComponentFile(plan, "track", facts),
      createRangeStatusComponentFile(plan, "indicator", facts),
      createRangeStatusComponentFile(plan, "value", facts),
      createRangeStatusComponentFile(plan, "label", facts),
      {
        exports: {
          kind: "namespace",
          members: facts.index.importMembers,
          namespace: facts.exports.namespace,
        },
        family: { facts, kind: "range-status" },
        imports: [],
        kind: "index",
        path: `${plan.outputDirectory}/index.ts`,
        typeFacades: [],
      },
    ],
  };
}

function createRangeStatusComponentFile(
  plan: GenericAdapterPlan,
  partName: AdapterRangeStatusPartName,
  facts: AdapterRangeStatusFacts,
): AdapterComponentFile {
  const part = facts.parts[partName];
  const exportName = facts.exports[partName];

  return {
    component: {
      context: [],
      defaults: [],
      displayName: `${facts.displayName}.${part.namespaceKey}`,
      events: [],
      exports: {
        kind: "named",
        members: [{ from: `./${exportName}`, name: exportName }],
        namespace: facts.exports.namespace,
      },
      family: { facts, kind: "range-status", part: partName },
      imports: [],
      lifecycle: undefined,
      name: exportName,
      portals: [],
      props: [],
      refs: [{ id: `${partName}Ref`, part: partName, public: true }],
      render: {
        attrs: [{ name: part.discoveryAttribute }],
        children: partName === "root" || partName === "track" ? [{ kind: "slot" }] : [],
        defaultElement: part.defaultElement,
        events: [],
        kind: "element",
        part: part.name,
        refs: [{ id: `${partName}Ref`, part: part.name, public: true }],
      },
      stateSync: [],
      typeFacades: [],
    },
    kind: "component",
    path: `${plan.outputDirectory}/${exportName}`,
  };
}

export function isRangeStatusOutputModelPlan(plan: GenericAdapterPlan): boolean {
  const rootPart = plan.parts.find((part) => part.name === "root");
  const trackPart = plan.parts.find((part) => part.name === "track");
  const indicatorPart = plan.parts.find((part) => part.name === "indicator");
  const valuePart = plan.parts.find((part) => part.name === "value");
  const labelPart = plan.parts.find((part) => part.name === "label");
  const valueState = plan.stateModels.find((stateModel) => stateModel.name === "value");
  const valuePropName = valueState?.controlledProp;
  const optionProps = plan.runtime.optionProps ?? [];
  const hasValueSetter = plan.setters.some(
    (setter) =>
      valuePropName !== undefined &&
      "props" in setter &&
      hasExactPropNames(setter.props, [valuePropName, "max", "min"]),
  );
  const hasFormatOptionsSetter = plan.setters.some(
    (setter) =>
      "props" in setter &&
      hasExactPropNames(setter.props, ["format", "getAriaValueText", "locale"]),
  );

  return (
    plan.component === "progress" &&
    plan.category === "static-semantic" &&
    rootPart?.defaultElement === "div" &&
    rootPart.ownsRuntime === true &&
    rootPart.role === "progressbar" &&
    trackPart?.defaultElement === "div" &&
    indicatorPart?.defaultElement === "div" &&
    valuePart?.defaultElement === "span" &&
    labelPart?.defaultElement === "span" &&
    valuePropName !== undefined &&
    valueState !== undefined &&
    valueState.initialAttribute === "data-value" &&
    valueState.runtimeSetter === "setValue" &&
    valueState.valueType === "ProgressValue" &&
    optionProps.includes("max") &&
    optionProps.includes("min") &&
    optionProps.includes(valuePropName) &&
    hasValueSetter &&
    hasFormatOptionsSetter
  );
}

export function getRangeStatusFacts(plan: GenericAdapterPlan): AdapterRangeStatusFacts {
  if (!isRangeStatusOutputModelPlan(plan)) {
    throw new Error(`${plan.displayName} generic adapter plan is not a range-status plan.`);
  }

  const rootPart = getPart(plan, "root");
  const trackPart = getPart(plan, "track");
  const indicatorPart = getPart(plan, "indicator");
  const valuePart = getPart(plan, "value");
  const labelPart = getPart(plan, "label");
  const valueState = getStateModel(plan, "value");
  const valuePropName = getRequiredPlanValue(
    valueState.controlledProp,
    `${plan.displayName} value state is missing controlledProp.`,
  );
  const valueAttribute = getRequiredPlanValue(
    valueState.initialAttribute,
    `${plan.displayName} value state is missing initialAttribute.`,
  );
  const valueSetter = getSetterForProps(plan, [valuePropName, "max", "min"]);
  const formatOptionsSetter = getSetterForProps(plan, [
    "format",
    "getAriaValueText",
    "locale",
  ]);

  return {
    attrs: {
      indicator: indicatorPart.discoveryAttribute,
      indeterminate: getStaticAttributeName(plan, rootPart, "data-indeterminate"),
      label: labelPart.discoveryAttribute,
      labelRole: getConstantAttributeFacts(plan, labelPart, "role"),
      max: getStaticAttributeName(plan, rootPart, "data-max"),
      min: getStaticAttributeName(plan, rootPart, "data-min"),
      root: rootPart.discoveryAttribute,
      track: trackPart.discoveryAttribute,
      value: getStaticAttributeName(plan, rootPart, valueAttribute),
      valueAriaHidden: getConstantAttributeFacts(plan, valuePart, "aria-hidden"),
      valuePart: valuePart.discoveryAttribute,
      valuePreserveText: getStaticAttributeName(plan, valuePart, "data-preserve-text"),
    },
    displayName: plan.displayName,
    exports: {
      indicator: getPartExportName(plan, "indicator"),
      label: getPartExportName(plan, "label"),
      namespace: plan.exports.namespace,
      root: getPartExportName(plan, "root"),
      track: getPartExportName(plan, "track"),
      value: getPartExportName(plan, "value"),
    },
    index: {
      importMembers: [...plan.exports.members]
        .sort((left, right) => left.name.localeCompare(right.name))
        .map((member) => ({ from: `./${member.name}`, name: member.name })),
      namespaceMembers: plan.exports.members.map((member) => ({
        key: toPascalCase(member.part),
        name: member.name,
      })),
    },
    parts: {
      indicator: toRangeStatusPart(indicatorPart),
      label: toRangeStatusPart(labelPart),
      root: toRangeStatusPart(rootPart),
      track: toRangeStatusPart(trackPart),
      value: toRangeStatusPart(valuePart),
    },
    props: {
      format: getOptionalAdapterFamilyProp(getOptionalPlanProp(plan, "format")),
      getAriaValueText: getOptionalAdapterFamilyProp(
        getOptionalPlanProp(plan, "getAriaValueText"),
      ),
      locale: getOptionalAdapterFamilyProp(getOptionalPlanProp(plan, "locale")),
      max: getAdapterFamilyProp(getPlanProp(plan, "max")),
      min: getAdapterFamilyProp(getPlanProp(plan, "min")),
      value: getAdapterFamilyProp(getPlanProp(plan, valuePropName)),
    },
    runtime: {
      factory: plan.runtime.factory,
      importSource: plan.runtime.importSource,
      setupFunction: "setupProgress",
      typeImportSource: getRuntimeTypeImportSource(plan),
    },
    setters: {
      formatOptionsSetter: {
        method: formatOptionsSetter.method,
        options: formatOptionsSetter.options,
      },
      valueSetter: {
        method: valueSetter.method,
        options: valueSetter.options,
      },
    },
    state: {
      name: valueState.name,
      valueType: getRequiredPlanValue(
        valueState.valueType,
        `${plan.displayName} value state is missing valueType.`,
      ),
    },
  };
}

function toRangeStatusPart(part: GenericAdapterPlanPart) {
  return {
    defaultElement: part.defaultElement,
    discoveryAttribute: part.discoveryAttribute,
    name: part.name,
    namespaceKey: toPascalCase(part.name),
    role: part.role,
  };
}

function getOptionalPlanProp(
  plan: GenericAdapterPlan,
  name: string,
): GenericAdapterPlanProp | undefined {
  return plan.props.find((candidate) => candidate.name === name);
}

function getOptionalAdapterFamilyProp(prop: GenericAdapterPlanProp | undefined) {
  return prop ? getAdapterFamilyProp(prop) : undefined;
}

function getSetterForProps(plan: GenericAdapterPlan, props: readonly string[]) {
  const setter = plan.setters.find((candidate) => {
    if (!("props" in candidate) || !Array.isArray(candidate.props)) return false;

    return hasExactPropNames(candidate.props, props);
  });

  if (!setter) {
    throw new Error(
      `${plan.displayName} generic adapter plan is missing setter for props "${props.join(", ")}".`,
    );
  }

  return setter;
}

function hasExactPropNames(
  actual: readonly string[] | undefined,
  expected: readonly string[],
): boolean {
  return (
    actual?.length === expected.length &&
    expected.every((expectedName) => actual.includes(expectedName))
  );
}

function getConstantAttributeFacts(
  plan: GenericAdapterPlan,
  part: GenericAdapterPlanPart,
  name: string,
): { attribute: string; value: string } {
  const attribute = getStaticAttribute(plan, part, name);
  if (!attribute || attribute.source !== "constant" || attribute.value === undefined) {
    throw new Error(`${plan.displayName} generic adapter plan is missing ${name} attribute.`);
  }

  return { attribute: attribute.name, value: attribute.value };
}

function getStaticAttribute(
  plan: GenericAdapterPlan,
  part: GenericAdapterPlanPart,
  name: string,
): GenericAdapterPlanStaticAttribute | undefined {
  return plan.staticAttributes.find(
    (candidate) => candidate.part === part.name && candidate.name === name,
  );
}
