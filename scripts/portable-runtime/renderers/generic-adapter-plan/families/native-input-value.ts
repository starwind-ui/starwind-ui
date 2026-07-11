import type {
  AdapterComponentFile,
  AdapterNativeInputValueFacts,
  AdapterOutputModel,
} from "../../framework-adapters/types.js";
import type { AdapterOutputFamilyPlan } from "../adapter-family-plans.js";
import type {
  GenericAdapterPlan,
  GenericAdapterPlanPart,
  GenericAdapterPlanStaticAttribute,
} from "../types.js";
import {
  getAdapterFamilyProp,
  getEvent,
  getPart,
  getPartExportName,
  getPlanProp,
  getRequiredPlanValue,
  getRuntimeOptionProps,
  getRuntimeTypeImportSource,
  getSetterForProp,
  getSetterForState,
  getStateModel,
  getStaticAttributeName,
  pluralizeDisplayName,
} from "./toolkit.js";

export const nativeInputValueAdapterFamilyPlan = {
  buildOutputModel: buildNativeInputValueOutputModel,
  id: "native-input-value",
  matches: isNativeInputValueOutputModelPlan,
} satisfies AdapterOutputFamilyPlan<AdapterOutputModel>;

function buildNativeInputValueOutputModel(plan: GenericAdapterPlan): AdapterOutputModel {
  const facts = getNativeInputValueFacts(plan);

  return {
    files: [
      createNativeInputValueComponentFile(plan, facts),
      {
        exports: {
          kind: "namespace",
          members: facts.index.importMembers,
          namespace: facts.exports.namespace,
        },
        family: { facts, kind: "native-input-value" },
        imports: [],
        kind: "index",
        path: `${plan.outputDirectory}/index.ts`,
        typeFacades: [],
      },
    ],
  };
}

function createNativeInputValueComponentFile(
  plan: GenericAdapterPlan,
  facts: AdapterNativeInputValueFacts,
): AdapterComponentFile {
  return {
    component: {
      context: [],
      defaults: [],
      displayName: `${facts.displayName}.Root`,
      events: [
        {
          detailType: facts.events.valueChange.detailsType,
          handlerProp: facts.events.valueChange.callbackProp,
          runtimeEvent: "valueChange",
          targetPart: facts.parts.root.name,
        },
      ],
      exports: {
        kind: "named",
        members: [{ from: `./${facts.exports.root}`, name: facts.exports.root }],
        namespace: facts.exports.namespace,
      },
      family: { facts, kind: "native-input-value", part: "root" },
      imports: [],
      lifecycle: undefined,
      name: facts.exports.root,
      portals: [],
      props: [
        {
          kind: "state",
          name: facts.props.defaultValue.name,
          type: facts.props.defaultValue.type,
        },
        { kind: "boolean", name: facts.props.disabled.name, type: facts.props.disabled.type },
        {
          kind: "callback",
          name: facts.events.valueChange.callbackProp,
          type: facts.events.valueChange.detailsType,
        },
        { kind: "state", name: facts.props.value.name, type: facts.props.value.type },
      ],
      refs: [{ id: "rootRef", part: "root", public: true }],
      render: {
        attrs: [{ name: facts.parts.root.discoveryAttribute }],
        children: [],
        defaultElement: facts.parts.root.defaultElement,
        events: [],
        kind: "element",
        part: facts.parts.root.name,
        refs: [{ id: "rootRef", part: facts.parts.root.name, public: true }],
      },
      stateSync: [
        {
          setter: facts.runtime.valueSetter.method,
          state: "value",
          valueProp: facts.props.value.name,
        },
      ],
      typeFacades: [],
    },
    kind: "component",
    path: `${plan.outputDirectory}/${facts.exports.root}`,
  };
}

export function isNativeInputValueOutputModelPlan(plan: GenericAdapterPlan): boolean {
  if (plan.component !== "input") return false;

  const rootPart = plan.parts.find((part) => part.name === plan.runtime.rootPart);
  const partFiles = plan.files.filter((file) => file.kind === "part");
  const optionProps = plan.runtime.optionProps ?? [];
  const valueStateModel = plan.stateModels.find((stateModel) => stateModel.name === "value");
  const valueChangeEvent = plan.events.find((event) => event.name === "valueChange");
  const form = plan.form;
  const hasValueSetter = plan.setters.some(
    (setter) => "stateModel" in setter && setter.stateModel === "value",
  );
  const hasDisabledSetter = plan.setters.some(
    (setter) => "prop" in setter && setter.prop === "disabled",
  );
  const hasInitialAttributes =
    rootPart !== undefined &&
    ["data-disabled", "disabled", "value"].every((name) =>
      hasStaticAttribute(plan, rootPart, name, "prop"),
    );
  const isCandidate =
    plan.category === "form-value-control" &&
    plan.parts.length === 1 &&
    partFiles.length === 1 &&
    rootPart?.defaultElement === "input" &&
    rootPart.ownsRuntime === true &&
    rootPart.forwardsRef === true &&
    valueStateModel !== undefined &&
    valueChangeEvent !== undefined &&
    hasValueSetter &&
    hasDisabledSetter &&
    hasInitialAttributes &&
    form?.fieldIntegration === true;

  if (!isCandidate || !form) {
    return false;
  }

  if (
    valueStateModel.controlledProp !== "value" ||
    valueStateModel.defaultProp !== "defaultValue"
  ) {
    throw new Error(
      `${plan.displayName} native input value plan requires controlledProp "value" and defaultProp "defaultValue".`,
    );
  }

  if (valueChangeEvent.valueType !== "string") {
    throw new Error(
      `${plan.displayName} native input value plan requires valueChange valueType "string".`,
    );
  }

  return (
    optionProps.includes("defaultValue") &&
    optionProps.includes("disabled") &&
    optionProps.includes("onValueChange") &&
    optionProps.includes("value") &&
    form.props.includes("name") &&
    form.props.includes("required") &&
    form.props.includes("value")
  );
}

export function getNativeInputValueFacts(plan: GenericAdapterPlan): AdapterNativeInputValueFacts {
  if (!isNativeInputValueOutputModelPlan(plan)) {
    throw new Error(`${plan.displayName} generic adapter plan is not a native-input-value plan.`);
  }

  const rootPart = getPart(plan, "root");
  const rootExportName = getPartExportName(plan, "root");
  const publicRootRef = plan.refs.some((ref) => ref.part === rootPart.name && ref.public);
  if (!rootPart.forwardsRef || !publicRootRef) {
    throw new Error(
      `${plan.displayName} generic adapter plan ${rootPart.name} part must declare a public forwarded ref.`,
    );
  }

  const valueState = getStateModel(plan, "value");
  const valuePropName = getRequiredPlanValue(
    valueState.controlledProp,
    `${plan.displayName} value state is missing a controlled prop.`,
  );
  const defaultValuePropName = getRequiredPlanValue(
    valueState.defaultProp,
    `${plan.displayName} value state is missing a default prop.`,
  );
  const valueChangeEvent = getEvent(plan, "valueChange");
  const disabledSetter = getSetterForProp(plan, "disabled");
  const valueSetter = getSetterForState(plan, "value");
  const valueGetter = getRequiredPlanValue(
    valueState.runtimeGetter,
    `${plan.displayName} value state is missing runtimeGetter.`,
  );
  const valueChangeDetailsType = getRequiredPlanValue(
    valueChangeEvent.detailsType,
    `${plan.displayName} valueChange event is missing detailsType.`,
  );
  const valueChangeValueProperty = getRequiredPlanValue(
    valueChangeEvent.valueProperty,
    `${plan.displayName} valueChange event is missing valueProperty.`,
  );
  const runtimeOptionProps = getRuntimeOptionProps(plan, [
    defaultValuePropName,
    "disabled",
    valueChangeEvent.callbackProp,
    valuePropName,
  ]);

  return {
    attrs: {
      disabled: "disabled",
      root: rootPart.discoveryAttribute,
      stateDisabled: getStaticAttributeName(plan, rootPart, "data-disabled"),
      value: getStaticAttributeName(plan, rootPart, "value"),
    },
    displayName: plan.displayName,
    events: {
      valueChange: {
        callbackProp: valueChangeEvent.callbackProp,
        detailsType: valueChangeDetailsType,
        valueProperty: valueChangeValueProperty,
        valueType: getRequiredPlanValue(
          valueChangeEvent.valueType,
          `${plan.displayName} valueChange event is missing valueType.`,
        ),
      },
    },
    exports: {
      namespace: plan.exports.namespace,
      root: rootExportName,
    },
    index: {
      importMembers: [{ from: `./${rootExportName}`, name: rootExportName }],
      namespaceMembers: [{ key: "Root", name: rootExportName }],
      typeExports: [
        ...new Set([
          getRequiredPlanValue(
            valueState.valueType,
            `${plan.displayName} value state is missing valueType.`,
          ),
          valueChangeDetailsType,
        ]),
      ],
    },
    parts: {
      root: {
        defaultElement: rootPart.defaultElement,
        discoveryAttribute: rootPart.discoveryAttribute,
        name: rootPart.name,
        namespaceKey: "Root",
      },
    },
    props: {
      defaultValue: getAdapterFamilyProp(getPlanProp(plan, "defaultValue")),
      disabled: getAdapterFamilyProp(getPlanProp(plan, "disabled")),
      value: getAdapterFamilyProp(getPlanProp(plan, "value")),
    },
    runtime: {
      disabledSetter: {
        method: disabledSetter.method,
        options: disabledSetter.options,
      },
      factory: plan.runtime.factory,
      importSource: plan.runtime.importSource,
      optionProps: runtimeOptionProps,
      setupFunction: `setup${pluralizeDisplayName(plan.displayName)}`,
      typeImportSource: getRuntimeTypeImportSource(plan),
      valueGetter,
      valueSetter: {
        method: valueSetter.method,
        options: valueSetter.options,
      },
    },
  };
}

function hasStaticAttribute(
  plan: GenericAdapterPlan,
  part: GenericAdapterPlanPart,
  name: string,
  source?: GenericAdapterPlanStaticAttribute["source"],
): boolean {
  return plan.staticAttributes.some(
    (attribute) =>
      attribute.part === part.name &&
      attribute.name === name &&
      (!source || attribute.source === source),
  );
}
