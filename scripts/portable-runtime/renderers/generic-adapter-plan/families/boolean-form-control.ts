import type {
  AdapterBooleanFormControlFacts,
  AdapterComponentFile,
  AdapterOutputModel,
} from "../../framework-adapters/types.js";
import type { AdapterOutputFamilyPlan } from "../adapter-family-plans.js";
import type { GenericAdapterPlan } from "../types.js";
import {
  getAdapterFamilyProp,
  getElementType,
  getEvent,
  getOptionalPartExportName,
  getOptionalRuntimeAdapterFamilyProp,
  getOptionalRuntimeOptionProp,
  getOptionalStaticAttributeName,
  getPart,
  getPartExportName,
  getPlanProp,
  getRenderingPropForTarget,
  getRequiredPlanValue,
  getRuntimeOptionProps,
  getRuntimeTypeImportSource,
  getSetterForProp,
  getSetterForProps,
  getSetterForState,
  getStateModel,
  getStaticAttributeName,
  pluralizeDisplayName,
  toCamelCase,
  toPascalCase,
} from "./toolkit.js";

export const booleanFormControlAdapterFamilyPlan = {
  buildOutputModel: buildBooleanFormControlOutputModel,
  id: "boolean-form-control",
  matches: isBooleanFormControlOutputModelPlan,
} satisfies AdapterOutputFamilyPlan<AdapterOutputModel>;

function buildBooleanFormControlOutputModel(plan: GenericAdapterPlan): AdapterOutputModel {
  const facts = getBooleanFormControlFacts(plan);
  const files: AdapterOutputModel["files"] = [
    createBooleanFormControlComponentFile(plan, "root", facts),
  ];

  if (facts.parts.stateIndicator) {
    files.push(createBooleanFormControlComponentFile(plan, "state-indicator", facts));
  }

  files.push({
    exports: {
      kind: "namespace",
      members: [
        { from: `./${facts.exports.root}`, name: facts.exports.root },
        ...(facts.exports.stateIndicator
          ? [{ from: `./${facts.exports.stateIndicator}`, name: facts.exports.stateIndicator }]
          : []),
      ],
      namespace: facts.exports.namespace,
    },
    family: { facts, kind: "boolean-form-control" },
    imports: [],
    kind: "index",
    path: `${plan.outputDirectory}/index.ts`,
    typeFacades: [],
  });

  return { files };
}

function createBooleanFormControlComponentFile(
  plan: GenericAdapterPlan,
  partName: "root" | "state-indicator",
  facts: AdapterBooleanFormControlFacts,
): AdapterComponentFile {
  const exportName =
    partName === "root"
      ? facts.exports.root
      : getRequiredPlanValue(facts.exports.stateIndicator, "");
  const part =
    partName === "root" ? facts.parts.root : getRequiredPlanValue(facts.parts.stateIndicator, "");
  const partDisplayName =
    partName === "root"
      ? "Root"
      : getRequiredPlanValue(
          facts.parts.stateIndicator?.namespaceKey,
          `${facts.displayName} boolean form-control facts are missing state indicator namespace key.`,
        );

  return {
    component: {
      context: [],
      defaults: [],
      displayName: `${facts.displayName}.${partDisplayName}`,
      events:
        partName === "root"
          ? [
              {
                detailType: facts.event.detailsType,
                handlerProp: facts.event.callbackProp,
                runtimeEvent: facts.event.name,
                targetPart: "root",
              },
            ]
          : [],
      exports: {
        kind: "named",
        members: [{ from: `./${exportName}`, name: exportName }],
        namespace: facts.exports.namespace,
      },
      family: { facts, kind: "boolean-form-control", part: partName },
      imports: [],
      lifecycle:
        partName === "root"
          ? {
              cleanup: { code: "instance.destroy();" },
              factory: facts.runtime.factory,
              factoryImport: {
                id: "runtime",
                kind: "value",
                members: [{ imported: facts.runtime.factory }],
                source: facts.runtime.importSource,
              },
              mount: { code: `${facts.runtime.factory}(root)` },
              options: getBooleanFormControlRuntimeOptions(facts),
              rootRef: "rootRef",
            }
          : undefined,
      name: exportName,
      portals: [],
      props:
        partName === "root"
          ? getBooleanFormControlRootProps(facts)
          : getBooleanFormControlStateIndicatorProps(facts),
      refs: [{ id: `${part.name}Ref`, part: part.name, public: true }],
      render: {
        attrs: [{ name: part.discoveryAttribute }],
        children: [{ kind: "slot" }],
        defaultElement: part.defaultElement,
        events: [],
        kind: "element",
        part: part.name,
        refs: [{ id: `${part.name}Ref`, part: part.name, public: true }],
      },
      stateSync:
        partName === "root"
          ? [
              {
                setter: facts.setters.state.method,
                state: facts.state.name,
                valueProp: facts.props.state.name,
              },
            ]
          : [],
      typeFacades: [],
    },
    kind: "component",
    path: `${plan.outputDirectory}/${exportName}`,
  };
}

function getBooleanFormControlRuntimeOptions(facts: AdapterBooleanFormControlFacts) {
  return [
    facts.props.state,
    facts.props.defaultState,
    facts.props.disabled,
    facts.props.form,
    facts.props.id,
    facts.props.indeterminate,
    facts.props.name,
    facts.props.readOnly,
    facts.props.required,
    facts.props.uncheckedValue,
    facts.props.value,
  ]
    .filter((prop): prop is NonNullable<typeof prop> => Boolean(prop))
    .map((prop) => ({ name: prop.name, source: "prop" as const }));
}

function getBooleanFormControlRootProps(facts: AdapterBooleanFormControlFacts) {
  return [
    facts.props.state,
    facts.props.defaultState,
    facts.props.disabled,
    facts.props.form,
    facts.props.id,
    facts.props.indeterminate,
    facts.props.name,
    facts.props.nativeButton,
    facts.props.readOnly,
    facts.props.required,
    facts.props.uncheckedValue,
    facts.props.value,
    facts.input.refProp,
    { kind: "callback" as const, name: facts.event.callbackProp, type: "function" },
  ]
    .filter((prop): prop is AdapterBooleanFormControlFacts["props"]["state"] => Boolean(prop))
    .map((prop) => ({
      kind:
        prop.name === facts.event.callbackProp
          ? ("callback" as const)
          : prop.type === "boolean"
            ? ("boolean" as const)
            : ("string" as const),
      name: prop.name,
      required: prop.name === facts.props.value?.name ? facts.props.value.required : undefined,
      type: prop.type,
    }));
}

function getBooleanFormControlStateIndicatorProps(facts: AdapterBooleanFormControlFacts) {
  return facts.props.keepMounted
    ? [
        {
          kind: "boolean" as const,
          name: facts.props.keepMounted.name,
          type: facts.props.keepMounted.type,
        },
      ]
    : [];
}

export function isBooleanFormControlOutputModelPlan(plan: GenericAdapterPlan): boolean {
  if (
    plan.category !== "single-boolean-control" ||
    !["checkbox", "radio", "switch"].includes(plan.component)
  ) {
    return false;
  }

  const rootPart = plan.parts.find((part) => part.name === plan.runtime.rootPart);
  const inputPart = plan.parts.find((part) => part.name === plan.form?.hiddenInput?.part);
  const stateModel = plan.stateModels.find((candidate) => candidate.name === "checked");
  const event = plan.events.find((candidate) => candidate.name === "checkedChange");
  const nativeButtonProp = plan.props.find(
    (prop) => prop.name === "nativeButton" && prop.targets?.includes("root"),
  );

  return (
    rootPart?.ownsRuntime === true &&
    rootPart.defaultElement === "span" &&
    inputPart?.defaultElement === "input" &&
    stateModel?.controlledProp === "checked" &&
    stateModel.defaultProp === "defaultChecked" &&
    stateModel.valueType === "boolean" &&
    event?.callbackProp === "onCheckedChange" &&
    event.valueProperty === "checked" &&
    nativeButtonProp?.defaultValue === "false"
  );
}

export function getBooleanFormControlFacts(
  plan: GenericAdapterPlan,
): AdapterBooleanFormControlFacts {
  if (!isBooleanFormControlOutputModelPlan(plan)) {
    throw new Error(`${plan.displayName} generic adapter plan is not a boolean form-control plan.`);
  }

  const rootPart = getPart(plan, plan.runtime.rootPart);
  const inputPartName = getRequiredPlanValue(
    plan.form?.hiddenInput?.part,
    `${plan.displayName} boolean form-control plan is missing hidden input part.`,
  );
  const inputPart = getPart(plan, inputPartName);
  const stateIndicatorPart =
    plan.component === "switch" ? getPart(plan, "thumb") : getPart(plan, "indicator");
  const stateModel = getStateModel(plan, "checked");
  const statePropName = getRuntimeOptionProps(plan, [
    getRequiredPlanValue(
      stateModel.controlledProp,
      `${plan.displayName} checked state is missing controlledProp.`,
    ),
  ])[0]!;
  const defaultStatePropName = getRuntimeOptionProps(plan, [
    getRequiredPlanValue(
      stateModel.defaultProp,
      `${plan.displayName} checked state is missing defaultProp.`,
    ),
  ])[0]!;
  const disabledPropName = getRuntimeOptionProps(plan, ["disabled"])[0]!;
  const stateEvent = getEvent(plan, "checkedChange");
  const stateSetter = getSetterForState(plan, "checked");
  const disabledSetter = getSetterForProp(plan, disabledPropName);
  const readOnlyPropName = getOptionalRuntimeOptionProp(plan, "readOnly");
  const groupContext = getBooleanFormControlGroupContext(plan);
  const stateIndicatorExport = getOptionalPartExportName(plan, stateIndicatorPart.name);
  const keepMountedProp =
    stateIndicatorPart.name === "indicator"
      ? getAdapterFamilyProp(getRenderingPropForTarget(plan, "indicator"))
      : undefined;
  const indeterminateStateModel =
    plan.component === "checkbox" ? getStateModel(plan, "indeterminate") : undefined;
  const indeterminatePropName = indeterminateStateModel?.controlledProp
    ? getRuntimeOptionProps(plan, [indeterminateStateModel.controlledProp])[0]
    : undefined;
  const indeterminateSetter = indeterminatePropName
    ? getSetterForState(plan, "indeterminate")
    : undefined;
  const readOnlySetter =
    plan.component === "radio" && readOnlyPropName
      ? getSetterForProp(plan, readOnlyPropName)
      : undefined;
  const formOptionsSetter =
    plan.component === "radio"
      ? getSetterForProps(plan, ["form", "name", "required", "value"])
      : plan.component === "switch"
        ? getSetterForProps(plan, ["form", "name", "required", "uncheckedValue", "value"])
        : undefined;

  return {
    attrs: {
      ariaReadOnly: getOptionalStaticAttributeName(plan, rootPart, "aria-readonly"),
      ariaRequired: getOptionalStaticAttributeName(plan, rootPart, "aria-required"),
      ariaState: getStaticAttributeName(plan, rootPart, "aria-checked"),
      defaultState: getStaticAttributeName(plan, rootPart, "data-default-checked"),
      disabled: getStaticAttributeName(plan, rootPart, "data-disabled"),
      filled: getOptionalStaticAttributeName(plan, rootPart, "data-filled"),
      form: getOptionalStaticAttributeName(plan, rootPart, "data-form"),
      id: getOptionalStaticAttributeName(plan, rootPart, "data-id"),
      indeterminate: getOptionalStaticAttributeName(plan, rootPart, "data-indeterminate"),
      input: inputPart.discoveryAttribute,
      name: getOptionalStaticAttributeName(plan, rootPart, "data-name"),
      readOnly: getOptionalStaticAttributeName(plan, rootPart, "data-readonly"),
      required: getOptionalStaticAttributeName(plan, rootPart, "data-required"),
      root: rootPart.discoveryAttribute,
      stateIndicator: stateIndicatorPart.discoveryAttribute,
      stateIndicatorFalsyPresence: getOptionalStaticAttributeName(
        plan,
        stateIndicatorPart,
        "data-unchecked",
      ),
      stateIndicatorKeepMounted: getOptionalStaticAttributeName(
        plan,
        stateIndicatorPart,
        "data-keep-mounted",
      ),
      falsyPresence: getStaticAttributeName(plan, rootPart, "data-unchecked"),
      truthyPresence: getStaticAttributeName(plan, rootPart, "data-checked"),
      uncheckedValue: getOptionalStaticAttributeName(plan, rootPart, "data-unchecked-value"),
      value: getOptionalStaticAttributeName(plan, rootPart, "data-value"),
    },
    behavior: {
      canCancelChange: plan.component !== "radio",
      formResetSync: plan.component !== "radio",
      groupStrategy:
        plan.component === "checkbox"
          ? "array-includes"
          : plan.component === "radio"
            ? "value-equals"
            : undefined,
      hasIndeterminate: plan.component === "checkbox",
      inputIdStrategy:
        plan.component === "switch"
          ? "suffixed-when-native"
          : plan.component === "radio"
            ? "omit-when-native"
            : "always-prop",
      inputPlacement: plan.component === "switch" ? "external" : "nested-when-non-native",
      readonlyAriaFalseWhenFalse: plan.component === "checkbox",
    },
    displayName: plan.displayName,
    event: {
      callbackProp: stateEvent.callbackProp,
      detailsType: getRequiredPlanValue(
        stateEvent.detailsType,
        `${plan.displayName} checkedChange event is missing detailsType.`,
      ),
      name: stateEvent.name,
      valueProperty: getRequiredPlanValue(
        stateEvent.valueProperty,
        `${plan.displayName} checkedChange event is missing valueProperty.`,
      ),
      valueType: getRequiredPlanValue(
        stateEvent.valueType,
        `${plan.displayName} checkedChange event is missing valueType.`,
      ),
    },
    exports: {
      namespace: plan.exports.namespace,
      root: getPartExportName(plan, "root"),
      stateIndicator: stateIndicatorExport,
    },
    group: groupContext
      ? {
          hookName: `use${toPascalCase(groupContext.name)}Context`,
          importPath: `../${groupContext.name}/${toPascalCase(groupContext.name)}Context`,
          valueFields: [...groupContext.values],
          variableName: toCamelCase(groupContext.name),
        }
      : undefined,
    input: {
      elementType: getElementType(inputPart.defaultElement),
      idHelperName: plan.component === "switch" ? `get${plan.displayName}InputId` : undefined,
      refProp:
        plan.component === "switch"
          ? { name: "inputRef", type: getElementType(inputPart.defaultElement) }
          : undefined,
      type: getRequiredPlanValue(
        plan.form?.hiddenInput?.type,
        `${plan.displayName} boolean form-control plan is missing hidden input type.`,
      ),
    },
    parts: {
      input: inputPart,
      root: rootPart,
      stateIndicator: stateIndicatorExport
        ? {
            ...stateIndicatorPart,
            namespaceKey: toPascalCase(stateIndicatorPart.name),
          }
        : undefined,
    },
    props: {
      defaultState: getAdapterFamilyProp(getPlanProp(plan, defaultStatePropName)),
      disabled: getAdapterFamilyProp(getPlanProp(plan, disabledPropName)),
      form: getOptionalRuntimeAdapterFamilyProp(plan, "form"),
      id: getOptionalRuntimeAdapterFamilyProp(plan, "id"),
      indeterminate: indeterminatePropName
        ? getAdapterFamilyProp(getPlanProp(plan, indeterminatePropName))
        : undefined,
      keepMounted: keepMountedProp,
      name: getOptionalRuntimeAdapterFamilyProp(plan, "name"),
      nativeButton: getAdapterFamilyProp(getRenderingPropForTarget(plan, "root")),
      readOnly: readOnlyPropName
        ? getAdapterFamilyProp(getPlanProp(plan, readOnlyPropName))
        : undefined,
      required: getOptionalRuntimeAdapterFamilyProp(plan, "required"),
      state: getAdapterFamilyProp(getPlanProp(plan, statePropName)),
      uncheckedValue: getOptionalRuntimeAdapterFamilyProp(plan, "uncheckedValue"),
      value: getOptionalRuntimeAdapterFamilyProp(plan, "value"),
    },
    render: {
      nativeElement: "button",
      nativeElementType: "HTMLButtonElement",
      nonNativeElement: rootPart.defaultElement,
      nonNativeElementType: getElementType(rootPart.defaultElement),
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
        stateModel.runtimeGetter,
        `${plan.displayName} checked state is missing runtimeGetter.`,
      ),
      name: stateModel.name,
      pascalName: toPascalCase(stateModel.name),
    },
    setters: {
      disabled: {
        method: disabledSetter.method,
        options: disabledSetter.options,
      },
      formOptions: formOptionsSetter
        ? {
            method: formOptionsSetter.method,
            props: "props" in formOptionsSetter ? [...(formOptionsSetter.props ?? [])] : [],
          }
        : undefined,
      indeterminate: indeterminateSetter
        ? {
            method: indeterminateSetter.method,
            options: indeterminateSetter.options,
          }
        : undefined,
      readOnly: readOnlySetter
        ? {
            method: readOnlySetter.method,
            options: readOnlySetter.options,
          }
        : undefined,
      state: {
        method: stateSetter.method,
        options: stateSetter.options,
      },
    },
  };
}

function getBooleanFormControlGroupContext(plan: GenericAdapterPlan) {
  const groupContext = plan.context?.find(
    (context) =>
      (context.name === "checkbox-group" || context.name === "radio-group") &&
      context.direction === "consumes",
  );

  if (plan.component === "checkbox") {
    if (!groupContext) {
      throw new Error(
        `${plan.displayName} generic adapter plan is missing checkbox-group context.`,
      );
    }

    if (!groupContext.values.includes("disabled") || !groupContext.values.includes("value")) {
      throw new Error(`${plan.displayName} checkbox-group context must expose disabled and value.`);
    }
  }

  if (plan.component === "radio") {
    if (!groupContext) {
      throw new Error(`${plan.displayName} generic adapter plan is missing radio-group context.`);
    }

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
