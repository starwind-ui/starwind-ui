import type { PrimitiveFrameworkAdapterTarget } from "../../framework-adapters/target-registry.js";
import type {
  AdapterComponentFile,
  AdapterExportMember,
  AdapterGroupedValueControlFacts,
  AdapterHelperFile,
  AdapterOutputModel,
} from "../../framework-adapters/types.js";
import type { AdapterOutputFamilyPlan } from "../adapter-family-plans.js";
import type { GenericAdapterPlan } from "../types.js";
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
  getSetterForProps,
  getSetterForState,
  getStateModel,
  getStaticAttributeName,
  pluralizeDisplayName,
} from "./toolkit.js";

type GroupedValueControlTargetFacts = {
  contextHelperTargets: readonly {
    fileExtension: string;
    target: PrimitiveFrameworkAdapterTarget;
  }[];
  targetNames: readonly PrimitiveFrameworkAdapterTarget[];
};

export function createGroupedValueControlAdapterFamilyPlan(
  targetFacts: GroupedValueControlTargetFacts,
): AdapterOutputFamilyPlan<AdapterOutputModel> {
  return {
    buildOutputModel: (plan) => buildGroupedValueControlOutputModel(plan, targetFacts),
    id: "grouped-value-control",
    matches: isGroupedValueControlOutputModelPlan,
  };
}

function buildGroupedValueControlOutputModel(
  plan: GenericAdapterPlan,
  targetFacts: GroupedValueControlTargetFacts,
): AdapterOutputModel {
  const facts = getGroupedValueControlFacts(plan);
  const files: AdapterOutputModel["files"] = [createGroupedValueControlComponentFile(plan, facts)];

  const contextHelperTargetCapabilities =
    facts.context && facts.behavior.contextProvider ? targetFacts.contextHelperTargets : [];

  files.push(
    ...contextHelperTargetCapabilities.map(({ fileExtension, target }) =>
      createGroupedValueControlHelperFile(plan, facts, target, fileExtension),
    ),
  );

  if (contextHelperTargetCapabilities.length === 0) {
    files.push(createGroupedValueControlIndexFile(plan, facts, false));
    return { files };
  }

  const contextHelperTargetSet = new Set(
    contextHelperTargetCapabilities.map(({ target }) => target),
  );
  files.push(
    ...targetFacts.targetNames.map((target) =>
      createGroupedValueControlIndexFile(plan, facts, contextHelperTargetSet.has(target), target),
    ),
  );

  return { files };
}

function createGroupedValueControlIndexFile(
  plan: GenericAdapterPlan,
  facts: AdapterGroupedValueControlFacts,
  includesContextHelper: boolean,
  target?: PrimitiveFrameworkAdapterTarget,
): AdapterOutputModel["files"][number] {
  return {
    exports: {
      kind: "namespace",
      members: getGroupedValueControlIndexMembers(facts, includesContextHelper),
      namespace: facts.exports.namespace,
    },
    family: { facts, kind: "grouped-value-control" },
    imports: [],
    kind: "index",
    path: `${plan.outputDirectory}/index.ts`,
    typeFacades: [
      {
        body: {
          code: `export type { ${facts.state.type}, ${facts.event.detailsType} } from "${facts.runtime.typeImportSource}";`,
        },
        exports: [facts.state.type, facts.event.detailsType],
        name: `${facts.displayName}RuntimeTypes`,
      },
    ],
    target,
  };
}

function getGroupedValueControlIndexMembers(
  facts: AdapterGroupedValueControlFacts,
  includesContextHelper: boolean,
): AdapterExportMember[] {
  if (includesContextHelper && facts.context) {
    return [
      { from: `./${facts.context.componentName}`, name: facts.context.componentName },
      { from: `./${facts.context.componentName}`, kind: "type", name: facts.context.typeName },
      { from: `./${facts.exports.root}`, name: facts.exports.root },
      { from: `./${facts.context.componentName}`, name: facts.context.hookName },
    ];
  }

  return [{ from: `./${facts.exports.root}`, name: facts.exports.root }];
}

function createGroupedValueControlComponentFile(
  plan: GenericAdapterPlan,
  facts: AdapterGroupedValueControlFacts,
): AdapterComponentFile {
  return {
    component: {
      context: facts.context
        ? [
            {
              name: facts.context.componentName,
              role: "provider",
              value: { code: "contextValue" },
            },
          ]
        : [],
      defaults: [],
      displayName: `${facts.displayName}.Root`,
      events: [
        {
          detailType: facts.event.detailsType,
          handlerProp: facts.event.callbackProp,
          runtimeEvent: facts.event.name,
          targetPart: "root",
        },
      ],
      exports: {
        kind: "named",
        members: [{ from: `./${facts.exports.root}`, name: facts.exports.root }],
        namespace: facts.exports.namespace,
      },
      family: { facts, kind: "grouped-value-control", part: "root" },
      imports: [],
      lifecycle: {
        cleanup: { code: "instance.destroy();" },
        factory: facts.runtime.factory,
        factoryImport: {
          id: "runtime",
          kind: "value",
          members: [{ imported: facts.runtime.factory }],
          source: facts.runtime.importSource,
        },
        mount: { code: `${facts.runtime.factory}(root)` },
        options: getGroupedValueControlRuntimeOptions(facts),
        rootRef: "rootRef",
      },
      name: facts.exports.root,
      portals: [],
      props: getGroupedValueControlRootProps(facts),
      refs: [{ id: "rootRef", part: "root", public: true }],
      render: {
        attrs: [{ name: facts.rootPart.discoveryAttribute }],
        children: [{ kind: "slot" }],
        defaultElement: facts.rootPart.defaultElement,
        events: [],
        kind: "element",
        part: facts.rootPart.name,
        refs: [{ id: "rootRef", part: facts.rootPart.name, public: true }],
      },
      stateSync: [
        {
          setter: facts.setters.value.method,
          state: facts.state.name,
          valueProp: facts.props.value.name,
        },
      ],
      typeFacades: [],
    },
    kind: "component",
    path: `${plan.outputDirectory}/${facts.exports.root}`,
  };
}

function createGroupedValueControlHelperFile(
  plan: GenericAdapterPlan,
  facts: AdapterGroupedValueControlFacts,
  target: PrimitiveFrameworkAdapterTarget,
  fileExtension: string,
): AdapterHelperFile {
  const context = getRequiredPlanValue(
    facts.context,
    `${plan.displayName} grouped-value output model is missing context helper facts.`,
  );

  return {
    body: { code: "" },
    family: { facts, kind: "grouped-value-control" },
    imports: [],
    kind: "helper",
    name: context.componentName,
    path: `${plan.outputDirectory}/${context.componentName}${fileExtension}`,
    target,
  };
}

function getGroupedValueControlRuntimeOptions(facts: AdapterGroupedValueControlFacts) {
  return [
    facts.props.defaultValue,
    facts.props.disabled,
    facts.props.form,
    facts.props.loopFocus,
    facts.props.multiple,
    facts.props.name,
    facts.props.orientation,
    facts.props.readOnly,
    facts.props.required,
    facts.props.value,
  ]
    .filter((prop): prop is NonNullable<typeof prop> => Boolean(prop))
    .map((prop) => ({ name: prop.name, source: "prop" as const }));
}

function getGroupedValueControlRootProps(facts: AdapterGroupedValueControlFacts) {
  return [
    facts.props.defaultValue,
    facts.props.disabled,
    facts.props.form,
    facts.props.loopFocus,
    facts.props.multiple,
    facts.props.name,
    facts.props.orientation,
    facts.props.readOnly,
    facts.props.required,
    facts.props.value,
    { kind: "callback" as const, name: facts.event.callbackProp, type: "function" },
  ]
    .filter((prop): prop is AdapterGroupedValueControlFacts["props"]["value"] => Boolean(prop))
    .map((prop) => ({
      kind:
        prop.name === facts.event.callbackProp
          ? ("callback" as const)
          : prop.type === "boolean"
            ? ("boolean" as const)
            : ("state" as const),
      name: prop.name,
      required: prop.required,
      type: prop.type,
    }));
}

function isGroupedValueControlOutputModelPlan(plan: GenericAdapterPlan): boolean {
  return (
    isCheckboxGroupGroupedValueOutputModelPlan(plan) ||
    isRadioGroupGroupedValueOutputModelPlan(plan) ||
    isToggleGroupGroupedValueOutputModelPlan(plan)
  );
}

function isCheckboxGroupGroupedValueOutputModelPlan(plan: GenericAdapterPlan): boolean {
  const rootPart = plan.parts.find((part) => part.name === plan.runtime.rootPart);
  const valueStateModel = plan.stateModels.find((candidate) => candidate.name === "value");
  const event = plan.events.find((candidate) => candidate.name === "valueChange");
  const optionProps = plan.runtime.optionProps ?? [];
  const groupContext = plan.context?.find(
    (context) => context.name === "checkbox-group" && context.direction === "provides",
  );

  return (
    plan.component === "checkbox-group" &&
    plan.category === "controlled-value-group" &&
    rootPart?.defaultElement === "div" &&
    rootPart.ownsRuntime === true &&
    rootPart.role === "group" &&
    plan.parts.length === 1 &&
    valueStateModel?.controlledProp === "value" &&
    valueStateModel.defaultProp === "defaultValue" &&
    valueStateModel.runtimeGetter === "getValue" &&
    valueStateModel.runtimeSetter === "setValue" &&
    valueStateModel.valueType === "CheckboxGroupValue" &&
    event?.callbackProp === "onValueChange" &&
    event.callbackTiming === "before-state-commit" &&
    event.cancelable === true &&
    groupContext?.values.includes("disabled") === true &&
    groupContext.values.includes("value") &&
    ["defaultValue", "disabled", "value"].every((prop) => optionProps.includes(prop))
  );
}

function isToggleGroupGroupedValueOutputModelPlan(plan: GenericAdapterPlan): boolean {
  const rootPart = plan.parts.find((part) => part.name === plan.runtime.rootPart);
  const valueStateModel = plan.stateModels.find((candidate) => candidate.name === "value");
  const event = plan.events.find((candidate) => candidate.name === "valueChange");
  const optionProps = plan.runtime.optionProps ?? [];
  const groupContext = plan.context?.find(
    (context) => context.name === "toggle-group" && context.direction === "provides",
  );

  return (
    plan.component === "toggle-group" &&
    plan.category === "controlled-value-group" &&
    rootPart?.defaultElement === "div" &&
    rootPart.ownsRuntime === true &&
    rootPart.role === "group" &&
    plan.parts.length === 1 &&
    valueStateModel?.controlledProp === "value" &&
    valueStateModel.defaultProp === "defaultValue" &&
    valueStateModel.runtimeGetter === "getValue" &&
    valueStateModel.runtimeSetter === "setValue" &&
    valueStateModel.valueType === "ToggleGroupValue" &&
    event?.callbackProp === "onValueChange" &&
    groupContext?.values.includes("disabled") === true &&
    groupContext.values.includes("loopFocus") &&
    groupContext.values.includes("multiple") &&
    groupContext.values.includes("orientation") &&
    groupContext.values.includes("value") &&
    ["defaultValue", "disabled", "loopFocus", "multiple", "orientation", "value"].every((prop) =>
      optionProps.includes(prop),
    )
  );
}

function isRadioGroupGroupedValueOutputModelPlan(plan: GenericAdapterPlan): boolean {
  const rootPart = plan.parts.find((part) => part.name === plan.runtime.rootPart);
  const valueStateModel = plan.stateModels.find((candidate) => candidate.name === "value");
  const event = plan.events.find((candidate) => candidate.name === "valueChange");
  const optionProps = plan.runtime.optionProps ?? [];
  const groupContext = plan.context?.find(
    (context) => context.name === "radio-group" && context.direction === "provides",
  );

  return (
    plan.component === "radio-group" &&
    plan.category === "controlled-value-group" &&
    rootPart?.defaultElement === "div" &&
    rootPart.ownsRuntime === true &&
    rootPart.role === "radiogroup" &&
    plan.parts.length === 1 &&
    valueStateModel?.controlledProp === "value" &&
    valueStateModel.defaultProp === "defaultValue" &&
    valueStateModel.runtimeGetter === "getValue" &&
    valueStateModel.runtimeSetter === "setValue" &&
    valueStateModel.valueType === "RadioGroupValue" &&
    event?.callbackProp === "onValueChange" &&
    event.valueProperty === "value" &&
    event.valueType === "string" &&
    groupContext?.values.includes("disabled") === true &&
    groupContext.values.includes("form") &&
    groupContext.values.includes("name") &&
    groupContext.values.includes("readOnly") &&
    groupContext.values.includes("required") &&
    groupContext.values.includes("value") &&
    [
      "defaultValue",
      "disabled",
      "form",
      "name",
      "orientation",
      "readOnly",
      "required",
      "value",
    ].every((prop) => optionProps.includes(prop))
  );
}

function getGroupedValueControlFacts(plan: GenericAdapterPlan): AdapterGroupedValueControlFacts {
  if (!isGroupedValueControlOutputModelPlan(plan)) {
    throw new Error(`${plan.displayName} generic adapter plan is not a grouped-value plan.`);
  }

  const rootPart = getPart(plan, "root");
  const valueStateModel = getStateModel(plan, "value");
  const valueProp = getRuntimeOptionProps(plan, [
    getRequiredPlanValue(
      valueStateModel.controlledProp,
      `${plan.displayName} value state is missing controlledProp.`,
    ),
  ])[0]!;
  const defaultValueProp = getRuntimeOptionProps(plan, [
    getRequiredPlanValue(
      valueStateModel.defaultProp,
      `${plan.displayName} value state is missing defaultProp.`,
    ),
  ])[0]!;
  const [disabledProp] = getRuntimeOptionProps(plan, ["disabled"]);
  const groupContext = getGroupedValueControlContext(plan);
  const valueEvent = getEvent(plan, "valueChange");
  const disabledSetter = getSetterForProp(plan, disabledProp);
  const valueSetter = getSetterForState(plan, "value");
  const isToggleLike = plan.component === "toggle-group";
  const isCheckboxLike = plan.component === "checkbox-group";
  const isRadioLike = plan.component === "radio-group";
  const formProp = isRadioLike ? getRuntimeOptionProps(plan, ["form"])[0] : undefined;
  const nameProp = isRadioLike ? getRuntimeOptionProps(plan, ["name"])[0] : undefined;
  const loopFocusProp = isToggleLike ? getRuntimeOptionProps(plan, ["loopFocus"])[0] : undefined;
  const multipleProp = isToggleLike ? getRuntimeOptionProps(plan, ["multiple"])[0] : undefined;
  const orientationProp =
    isToggleLike || isRadioLike ? getRuntimeOptionProps(plan, ["orientation"])[0] : undefined;
  const readOnlyProp = isRadioLike ? getRuntimeOptionProps(plan, ["readOnly"])[0] : undefined;
  const requiredProp = isRadioLike ? getRuntimeOptionProps(plan, ["required"])[0] : undefined;

  return {
    attrs: {
      ariaDisabled: isRadioLike
        ? getStaticAttributeName(plan, rootPart, "aria-disabled")
        : undefined,
      ariaOrientation: isRadioLike
        ? getStaticAttributeName(plan, rootPart, "aria-orientation")
        : undefined,
      ariaReadOnly: isRadioLike
        ? getStaticAttributeName(plan, rootPart, "aria-readonly")
        : undefined,
      ariaRequired: isRadioLike
        ? getStaticAttributeName(plan, rootPart, "aria-required")
        : undefined,
      defaultValue: getStaticAttributeName(plan, rootPart, "data-default-value"),
      disabled: getStaticAttributeName(plan, rootPart, "data-disabled"),
      form: isRadioLike ? getStaticAttributeName(plan, rootPart, "data-form") : undefined,
      loopFocus: isToggleLike
        ? getStaticAttributeName(plan, rootPart, "data-loop-focus")
        : undefined,
      multiple: isToggleLike ? getStaticAttributeName(plan, rootPart, "data-multiple") : undefined,
      name: isRadioLike ? getStaticAttributeName(plan, rootPart, "data-name") : undefined,
      orientation:
        isToggleLike || isRadioLike
          ? getStaticAttributeName(plan, rootPart, "data-orientation")
          : undefined,
      readOnly: isRadioLike ? getStaticAttributeName(plan, rootPart, "data-readonly") : undefined,
      required: isRadioLike ? getStaticAttributeName(plan, rootPart, "data-required") : undefined,
      root: rootPart.discoveryAttribute,
      value: getStaticAttributeName(plan, rootPart, "data-value"),
    },
    behavior: {
      contextProvider: isCheckboxLike || isRadioLike,
      multipleValueNormalization: isToggleLike,
      parseValueAttributeFunction: isCheckboxLike
        ? `parse${plan.displayName}ValueAttribute`
        : undefined,
      syncUncontrolledValueFromAttribute: isCheckboxLike,
    },
    context:
      isCheckboxLike || isRadioLike
        ? {
            componentName: `${plan.displayName}Context`,
            hookName: `use${plan.displayName}Context`,
            typeName: `${plan.displayName}ContextValue`,
            values: groupContext.values.map((value) => {
              const prop = getAdapterFamilyProp(getPlanProp(plan, value));

              return isRadioLike && (value === "form" || value === "name")
                ? { ...prop, required: false }
                : prop;
            }),
          }
        : undefined,
    displayName: plan.displayName,
    event: {
      callbackProp: valueEvent.callbackProp,
      detailsType: getRequiredPlanValue(
        valueEvent.detailsType,
        `${plan.displayName} valueChange event is missing detailsType.`,
      ),
      name: valueEvent.name,
      valueProperty: getRequiredPlanValue(
        valueEvent.valueProperty,
        `${plan.displayName} valueChange event is missing valueProperty.`,
      ),
      valueType: getRequiredPlanValue(
        valueEvent.valueType,
        `${plan.displayName} valueChange event is missing valueType.`,
      ),
    },
    exports: {
      namespace: plan.exports.namespace,
      root: getPartExportName(plan, "root"),
    },
    props: {
      defaultValue: getAdapterFamilyProp(getPlanProp(plan, defaultValueProp)),
      disabled: getAdapterFamilyProp(getPlanProp(plan, disabledProp)),
      form: formProp ? getAdapterFamilyProp(getPlanProp(plan, formProp)) : undefined,
      loopFocus: loopFocusProp ? getAdapterFamilyProp(getPlanProp(plan, loopFocusProp)) : undefined,
      multiple: multipleProp ? getAdapterFamilyProp(getPlanProp(plan, multipleProp)) : undefined,
      name: nameProp ? getAdapterFamilyProp(getPlanProp(plan, nameProp)) : undefined,
      orientation: orientationProp
        ? getAdapterFamilyProp(getPlanProp(plan, orientationProp))
        : undefined,
      readOnly: readOnlyProp ? getAdapterFamilyProp(getPlanProp(plan, readOnlyProp)) : undefined,
      required: requiredProp ? getAdapterFamilyProp(getPlanProp(plan, requiredProp)) : undefined,
      value: getAdapterFamilyProp(getPlanProp(plan, valueProp)),
    },
    rootPart: {
      ...rootPart,
      role: getRequiredPlanValue(rootPart.role, `${plan.displayName} root part is missing role.`),
    },
    runtime: {
      factory: plan.runtime.factory,
      importSource: plan.runtime.importSource,
      setupFunction: `setup${pluralizeDisplayName(plan.displayName)}`,
      typeImportSource: getRuntimeTypeImportSource(plan),
    },
    state: {
      getter: getRequiredPlanValue(
        valueStateModel.runtimeGetter,
        `${plan.displayName} value state is missing runtimeGetter.`,
      ),
      name: valueStateModel.name,
      type: getPlanProp(plan, valueProp).type,
    },
    setters: {
      disabled: {
        method: disabledSetter.method,
        options: disabledSetter.options,
      },
      loopFocus: loopFocusProp
        ? {
            method: getSetterForProp(plan, loopFocusProp).method,
            options: getSetterForProp(plan, loopFocusProp).options,
          }
        : undefined,
      multiple: multipleProp
        ? {
            method: getSetterForProp(plan, multipleProp).method,
            options: getSetterForProp(plan, multipleProp).options,
          }
        : undefined,
      orientation: orientationProp
        ? {
            method: getSetterForProp(plan, orientationProp).method,
            options: getSetterForProp(plan, orientationProp).options,
          }
        : undefined,
      formOptions:
        formProp && nameProp && requiredProp
          ? {
              method: getSetterForProps(plan, [formProp, nameProp, requiredProp]).method,
              props: [...(getSetterForProps(plan, [formProp, nameProp, requiredProp]).props ?? [])],
            }
          : undefined,
      readOnly: readOnlyProp
        ? {
            method: getSetterForProp(plan, readOnlyProp).method,
            options: getSetterForProp(plan, readOnlyProp).options,
          }
        : undefined,
      value: {
        method: valueSetter.method,
        options: valueSetter.options,
      },
    },
  };
}

function getGroupedValueControlContext(plan: GenericAdapterPlan) {
  const groupContext = plan.context?.find(
    (context) =>
      (context.name === "checkbox-group" ||
        context.name === "radio-group" ||
        context.name === "toggle-group") &&
      context.direction === "provides",
  );

  if (!groupContext) {
    throw new Error(`${plan.displayName} generic adapter plan is missing grouped-value context.`);
  }

  if (plan.component === "checkbox-group") {
    if (!groupContext.values.includes("disabled") || !groupContext.values.includes("value")) {
      throw new Error(`${plan.displayName} checkbox-group context must expose disabled and value.`);
    }
  }

  if (plan.component === "toggle-group") {
    for (const value of ["disabled", "loopFocus", "multiple", "orientation", "value"]) {
      if (!groupContext.values.includes(value)) {
        throw new Error(
          `${plan.displayName} toggle-group context must expose disabled, loopFocus, multiple, orientation, and value.`,
        );
      }
    }
  }

  if (plan.component === "radio-group") {
    for (const value of ["disabled", "form", "name", "readOnly", "required", "value"]) {
      if (!groupContext.values.includes(value)) {
        throw new Error(
          `${plan.displayName} radio-group context must expose disabled, form, name, readOnly, required, and value.`,
        );
      }
    }
  }

  return groupContext;
}
