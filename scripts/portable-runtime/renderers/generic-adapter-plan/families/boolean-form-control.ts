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
  if (plan.category !== "single-boolean-control") {
    return false;
  }

  const rootPart = plan.parts.find((part) => part.name === plan.runtime.rootPart);
  const inputPart = plan.parts.find((part) => part.name === plan.form?.hiddenInput?.part);
  const stateModel = plan.stateModels.find((candidate) => candidate.name === "checked");
  const event = plan.events.find((candidate) => candidate.name === "checkedChange");
  const nativeButtonProp = plan.props.find(
    (prop) => prop.name === "nativeButton" && prop.targets?.includes("root"),
  );

  if (
    !(
      rootPart?.ownsRuntime === true &&
      rootPart.defaultElement === "span" &&
      inputPart?.defaultElement === "input" &&
      stateModel?.controlledProp === "checked" &&
      stateModel.defaultProp === "defaultChecked" &&
      stateModel.valueType === "boolean" &&
      event?.callbackProp === "onCheckedChange" &&
      event.valueProperty === "checked" &&
      nativeButtonProp?.defaultValue === "false"
    )
  ) {
    return false;
  }

  const shape = getBooleanFormControlShape(plan, inputPart.name);
  return shape !== undefined && hasExactBooleanFormControlShape(plan, shape, inputPart.name);
}

export function getBooleanFormControlFacts(
  plan: GenericAdapterPlan,
): AdapterBooleanFormControlFacts {
  const uncheckedInputCandidates = getRuntimeOwnedUncheckedInputParts(plan);
  if (
    plan.props.some((prop) => prop.name === "uncheckedValue") &&
    uncheckedInputCandidates.length !== 1
  ) {
    throw new Error(
      `${plan.displayName} boolean form-control plan must expose exactly one Runtime-owned unchecked input part with constant type="hidden".`,
    );
  }
  if (!isBooleanFormControlOutputModelPlan(plan)) {
    throw new Error(`${plan.displayName} generic adapter plan is not a boolean form-control plan.`);
  }

  const rootPart = getPart(plan, plan.runtime.rootPart);
  const inputPartName = getRequiredPlanValue(
    plan.form?.hiddenInput?.part,
    `${plan.displayName} boolean form-control plan is missing hidden input part.`,
  );
  const inputPart = getPart(plan, inputPartName);
  const stateIndicatorPart = getBooleanFormControlStateIndicatorPart(plan);
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
  const keepMountedPropName = plan.presence?.keepMountedProp;
  const keepMountedProp = keepMountedPropName
    ? getAdapterFamilyProp(getPlanProp(plan, keepMountedPropName))
    : undefined;
  const indeterminateStateModel = plan.stateModels.find(
    (candidate) => candidate.name === "indeterminate",
  );
  const indeterminatePropName = indeterminateStateModel?.controlledProp
    ? getRuntimeOptionProps(plan, [indeterminateStateModel.controlledProp])[0]
    : undefined;
  const indeterminateSetter = indeterminatePropName
    ? getSetterForState(plan, "indeterminate")
    : undefined;
  const readOnlySetter = readOnlyPropName
    ? plan.setters.find((setter) => "prop" in setter && setter.prop === readOnlyPropName)
    : undefined;
  const formOptionsSetter = plan.setters.find(
    (setter) => "props" in setter && setter.props !== undefined,
  );
  const uncheckedInputPart = uncheckedInputCandidates[0];
  const inputPlacement = plan.refs.some((ref) => ref.part === inputPart.name && ref.public)
    ? "external"
    : "nested-when-non-native";
  const inputIdStrategy =
    inputPlacement === "external"
      ? "suffixed-when-native"
      : uncheckedInputPart
        ? "always-prop"
        : "omit-when-native";

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
      acceptedChangeNotification: stateEvent.acceptanceNotification,
      canCancelChange: stateEvent.cancelable !== false,
      formResetSync: plan.form?.fieldIntegration === true,
      groupStrategy:
        groupContext === undefined
          ? undefined
          : groupContext.values.includes("form")
            ? "value-equals"
            : "array-includes",
      hasIndeterminate: indeterminateStateModel !== undefined,
      inputIdStrategy,
      inputPlacement,
      readonlyAriaFalseWhenFalse: indeterminateStateModel !== undefined,
    },
    displayName: plan.displayName,
    escapeDeclarations: plan.escapeDeclarations.map(({ boundary, reason, tests }) => ({
      boundary,
      reason,
      tests: [...tests],
    })),
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
          requirement: groupContext.requirement ?? "required",
          valueFields: [...groupContext.values],
          variableName: toCamelCase(groupContext.name),
        }
      : undefined,
    input: {
      elementType: getElementType(inputPart.defaultElement),
      idHelperName:
        inputIdStrategy === "suffixed-when-native" ? `get${plan.displayName}InputId` : undefined,
      refProp: plan.refs.some((ref) => ref.part === inputPart.name && ref.public)
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
      uncheckedInput: uncheckedInputPart,
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
      syncEvent: stateModel.runtimeSyncEvent,
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
    (context) => context.direction === "consumes" && context.values.includes("value"),
  );

  if (groupContext && !groupContext.values.includes("disabled")) {
    throw new Error(`${plan.displayName} boolean-control context must expose disabled and value.`);
  }

  return groupContext;
}

function getBooleanFormControlStateIndicatorPart(plan: GenericAdapterPlan) {
  if (plan.presence?.initialHiddenParts.length === 1) {
    return getPart(plan, plan.presence.initialHiddenParts[0]!);
  }

  const rootPartName = plan.runtime.rootPart;
  const inputPartName = plan.form?.hiddenInput?.part;
  const exportedPartNames = new Set(
    plan.files.filter((file) => file.kind === "part").map((file) => file.part),
  );
  const candidates = plan.parts.filter(
    (part) =>
      part.name !== rootPartName && part.name !== inputPartName && exportedPartNames.has(part.name),
  );
  if (candidates.length !== 1) {
    throw new Error(
      `${plan.displayName} boolean form-control plan must expose one state-indicator part.`,
    );
  }
  return candidates[0]!;
}

type BooleanFormControlShape = "checkbox" | "radio" | "switch";

function getBooleanFormControlShape(
  plan: GenericAdapterPlan,
  inputPartName: string,
): BooleanFormControlShape | undefined {
  if (plan.stateModels.some((state) => state.name === "indeterminate")) return "checkbox";
  if (plan.context?.some((context) => context.values.includes("form"))) return "radio";
  if (plan.refs.some((ref) => ref.part === inputPartName && ref.public)) return "switch";
  return undefined;
}

function hasExactBooleanFormControlShape(
  plan: GenericAdapterPlan,
  shape: BooleanFormControlShape,
  inputPartName: string,
): boolean {
  const rootPartName = plan.runtime.rootPart;
  const indicatorPart = getBooleanFormControlStateIndicatorCandidate(plan);
  const uncheckedInputs = getRuntimeOwnedUncheckedInputParts(plan);
  const uncheckedInput = uncheckedInputs[0];
  const expectedProps = {
    checkbox: [
      "checked",
      "defaultChecked",
      "disabled",
      "form",
      "id",
      "indeterminate",
      "keepMounted",
      "name",
      "nativeButton",
      "onCheckedChange",
      "readOnly",
      "required",
      "uncheckedValue",
      "value",
    ],
    radio: [
      "checked",
      "defaultChecked",
      "disabled",
      "form",
      "id",
      "keepMounted",
      "name",
      "nativeButton",
      "onCheckedChange",
      "readOnly",
      "required",
      "value",
    ],
    switch: [
      "checked",
      "defaultChecked",
      "disabled",
      "form",
      "id",
      "name",
      "nativeButton",
      "onCheckedChange",
      "readOnly",
      "required",
      "uncheckedValue",
      "value",
    ],
  }[shape];
  const expectedStates = shape === "checkbox" ? ["checked", "indeterminate"] : ["checked"];
  const expectedRuntimeOptions = expectedProps.filter(
    (name) => !["keepMounted", "nativeButton", "onCheckedChange"].includes(name),
  );
  const expectedSetters = {
    checkbox: ["prop:disabled", "state:checked", "state:indeterminate"],
    radio: ["prop:disabled", "prop:readOnly", "props:form,name,required,value", "state:checked"],
    switch: ["prop:disabled", "props:form,name,required,uncheckedValue,value", "state:checked"],
  }[shape];
  const expectedRefs = [
    `${rootPartName}:true`,
    `${indicatorPart?.name}:true`,
    ...(shape === "switch" ? [`${inputPartName}:true`] : []),
  ];
  const expectedParts = [
    rootPartName,
    inputPartName,
    indicatorPart?.name,
    uncheckedInput?.name,
  ].filter((name): name is string => Boolean(name));
  const exportedParts = plan.files.filter((file) => file.kind === "part").map((file) => file.part);
  const exportMemberParts = plan.exports.members.map((member) => member.part);

  return (
    indicatorPart !== undefined &&
    uncheckedInputs.length === (shape === "radio" ? 0 : 1) &&
    hasExactBooleanProps(plan, expectedProps) &&
    plan.runtime.destroys === true &&
    hasExactValues(plan.runtime.optionProps ?? [], expectedRuntimeOptions) &&
    hasExactValues(
      plan.stateModels.map((state) => state.name),
      expectedStates,
    ) &&
    plan.events.length === 1 &&
    plan.events[0]?.name === "checkedChange" &&
    plan.events[0]?.callbackProp === "onCheckedChange" &&
    hasExactValues(plan.setters.map(getSetterKey), expectedSetters) &&
    hasExactValues(
      plan.refs.map((ref) => `${ref.part}:${ref.public}`),
      expectedRefs,
    ) &&
    hasExactValues(
      plan.parts.map((part) => part.name),
      expectedParts,
    ) &&
    plan.parts.every((part) => part.initExclusionAttributes === undefined) &&
    hasExactValues(exportedParts, [rootPartName, indicatorPart.name]) &&
    hasExactValues(exportMemberParts, [rootPartName, indicatorPart.name]) &&
    plan.files.filter((file) => file.kind === "index").length === 1 &&
    plan.files.length === 3 &&
    plan.asChild === undefined &&
    plan.floating === undefined &&
    hasExactBooleanContext(plan, shape) &&
    hasExactBooleanForm(plan, shape, inputPartName) &&
    hasExactBooleanPresence(plan, shape, indicatorPart.name) &&
    hasExactBooleanStaticAttributes(
      plan,
      shape,
      rootPartName,
      indicatorPart.name,
      inputPartName,
      uncheckedInput?.name,
    )
  );
}

function hasExactBooleanProps(plan: GenericAdapterPlan, expected: readonly string[]): boolean {
  return (
    hasExactValues(
      plan.props.map((prop) => prop.name),
      expected,
    ) &&
    plan.props.every((prop) => {
      if (prop.unsupportedTargets !== undefined) return false;
      if (prop.name === "nativeButton") {
        return prop.kind === "rendering" && hasExactValues(prop.targets ?? [], ["root"]);
      }
      if (prop.name === "keepMounted") {
        return prop.kind === "rendering" && hasExactValues(prop.targets ?? [], ["indicator"]);
      }
      return prop.targets === undefined;
    })
  );
}

function getBooleanFormControlStateIndicatorCandidate(plan: GenericAdapterPlan) {
  const inputPartName = plan.form?.hiddenInput?.part;
  const exportedPartNames = new Set(
    plan.files.filter((file) => file.kind === "part").map((file) => file.part),
  );
  const candidates = plan.parts.filter(
    (part) =>
      part.name !== plan.runtime.rootPart &&
      part.name !== inputPartName &&
      exportedPartNames.has(part.name),
  );
  return candidates.length === 1 ? candidates[0] : undefined;
}

function getRuntimeOwnedUncheckedInputParts(plan: GenericAdapterPlan) {
  const exportedPartNames = new Set(
    plan.files.filter((file) => file.kind === "part").map((file) => file.part),
  );
  return plan.parts.filter(
    (part) =>
      part.name !== plan.form?.hiddenInput?.part &&
      part.defaultElement === "input" &&
      !exportedPartNames.has(part.name) &&
      plan.staticAttributes.some(
        (attribute) =>
          attribute.part === part.name &&
          attribute.name === "type" &&
          attribute.source === "constant" &&
          attribute.value === "hidden",
      ),
  );
}

function getSetterKey(setter: GenericAdapterPlan["setters"][number]): string {
  if ("stateModel" in setter) return `state:${setter.stateModel}`;
  if ("prop" in setter) return `prop:${setter.prop}`;
  return `props:${[...(setter.props ?? [])].sort().join(",")}`;
}

function hasExactValues(actual: readonly string[], expected: readonly string[]): boolean {
  return (
    actual.length === expected.length &&
    new Set(actual).size === actual.length &&
    expected.every((value) => actual.includes(value))
  );
}

function hasExactBooleanContext(plan: GenericAdapterPlan, shape: BooleanFormControlShape): boolean {
  if (shape === "switch") return plan.context === undefined;
  if (plan.context?.length !== 1) return false;
  const context = plan.context[0]!;
  const values =
    shape === "checkbox"
      ? ["disabled", "value"]
      : ["disabled", "form", "name", "readOnly", "required", "value"];
  return (
    context.direction === "consumes" &&
    context.requirement === "optional" &&
    hasExactValues(context.values, values)
  );
}

function hasExactBooleanForm(
  plan: GenericAdapterPlan,
  shape: BooleanFormControlShape,
  inputPartName: string,
): boolean {
  if (
    !plan.form ||
    plan.form.fieldIntegration !== true ||
    plan.form.hiddenInput?.part !== inputPartName
  ) {
    return false;
  }
  const props =
    shape === "radio"
      ? ["form", "id", "name", "required", "value"]
      : ["form", "id", "name", "required", "uncheckedValue", "value"];
  return (
    plan.form.hiddenInput.type === (shape === "radio" ? "radio" : "checkbox") &&
    hasExactValues(plan.form.props, props)
  );
}

function hasExactBooleanPresence(
  plan: GenericAdapterPlan,
  shape: BooleanFormControlShape,
  indicatorPartName: string,
): boolean {
  if (shape === "switch") return plan.presence === undefined;
  return (
    plan.presence?.keepMountedProp === "keepMounted" &&
    plan.presence.unmountPolicy === "runtime-owned" &&
    hasExactValues(plan.presence.initialHiddenParts, [indicatorPartName])
  );
}

function hasExactBooleanStaticAttributes(
  plan: GenericAdapterPlan,
  shape: BooleanFormControlShape,
  rootPartName: string,
  indicatorPartName: string,
  inputPartName: string,
  uncheckedInputPartName: string | undefined,
): boolean {
  const rootNames = {
    checkbox: [
      "aria-checked",
      "aria-readonly",
      "aria-required",
      "data-checked",
      "data-default-checked",
      "data-disabled",
      "data-form",
      "data-id",
      "data-indeterminate",
      "data-name",
      "data-readonly",
      "data-required",
      "data-unchecked",
      "data-unchecked-value",
      "data-value",
    ],
    radio: [
      "aria-checked",
      "data-checked",
      "data-default-checked",
      "data-disabled",
      "data-form",
      "data-id",
      "data-name",
      "data-readonly",
      "data-required",
      "data-unchecked",
      "data-value",
    ],
    switch: [
      "aria-checked",
      "aria-readonly",
      "aria-required",
      "data-checked",
      "data-default-checked",
      "data-disabled",
      "data-filled",
      "data-form",
      "data-id",
      "data-name",
      "data-readonly",
      "data-required",
      "data-unchecked",
      "data-unchecked-value",
      "data-value",
    ],
  }[shape];
  const expected = [
    ...rootNames.map((name) => `${rootPartName}:${name}`),
    ...(shape === "switch"
      ? []
      : ["data-keep-mounted", "data-unchecked"].map((name) => `${indicatorPartName}:${name}`)),
    ...["type", "aria-hidden", "tabIndex"].map((name) => `${inputPartName}:${name}`),
    ...(uncheckedInputPartName ? [`${uncheckedInputPartName}:type`] : []),
  ];
  return hasExactValues(
    plan.staticAttributes.map((attribute) => `${attribute.part}:${attribute.name}`),
    expected,
  );
}
