import type {
  AdapterComponentFile,
  AdapterOutputModel,
  AdapterSingleBooleanControlFacts,
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
  getSetterForState,
  getStateModel,
  getStaticAttributeName,
  toCamelCase,
  toPascalCase,
} from "./toolkit.js";

export const singleBooleanControlAdapterFamilyPlan = {
  buildOutputModel: buildSingleBooleanControlOutputModel,
  id: "single-boolean-control",
  matches: isSingleBooleanControlOutputModelPlan,
} satisfies AdapterOutputFamilyPlan<AdapterOutputModel>;

function buildSingleBooleanControlOutputModel(plan: GenericAdapterPlan): AdapterOutputModel {
  const facts = getSingleBooleanControlFacts(plan);

  return {
    files: [
      createSingleBooleanControlComponentFile(plan, facts),
      {
        exports: {
          kind: "namespace",
          members: [{ from: `./${facts.exports.root}`, name: facts.exports.root }],
          namespace: facts.exports.namespace,
        },
        family: { facts, kind: "single-boolean-control" },
        imports: [],
        kind: "index",
        path: `${plan.outputDirectory}/index.ts`,
        typeFacades: [
          {
            body: {
              code: `export type { ${facts.event.detailsType} } from "${facts.runtime.typeImportSource}";`,
            },
            exports: [facts.event.detailsType],
            name: facts.event.detailsType,
          },
        ],
      },
    ],
  };
}

function createSingleBooleanControlComponentFile(
  plan: GenericAdapterPlan,
  facts: AdapterSingleBooleanControlFacts,
): AdapterComponentFile {
  return {
    component: {
      context: [],
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
      family: { facts, kind: "single-boolean-control", part: "root" },
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
        options: [
          { name: facts.props.defaultState.name, source: "prop" },
          { name: facts.props.disabled.name, source: "prop" },
          { name: facts.props.nativeButton.name, source: "prop" },
          { name: facts.props.state.name, source: "prop" },
          { name: facts.props.syncGroup.name, source: "prop" },
          { name: facts.props.value.name, source: "prop" },
        ],
        rootRef: "rootRef",
      },
      name: facts.exports.root,
      portals: [],
      props: [
        {
          kind: "boolean",
          name: facts.props.defaultState.name,
          type: facts.props.defaultState.type,
        },
        { kind: "boolean", name: facts.props.disabled.name, type: facts.props.disabled.type },
        {
          kind: "boolean",
          name: facts.props.nativeButton.name,
          type: facts.props.nativeButton.type,
        },
        { kind: "boolean", name: facts.props.state.name, type: facts.props.state.type },
        { kind: "string", name: facts.props.syncGroup.name, type: facts.props.syncGroup.type },
        { kind: "string", name: facts.props.value.name, type: facts.props.value.type },
        { kind: "callback", name: facts.event.callbackProp, type: "function" },
      ],
      refs: [{ id: "rootRef", part: "root", public: true }],
      render: {
        attrs: [{ name: facts.part.discoveryAttribute }],
        children: [{ kind: "slot" }],
        defaultElement: facts.part.defaultElement,
        events: [],
        kind: "element",
        part: "root",
        refs: [{ id: "rootRef", part: "root", public: true }],
      },
      stateSync: [
        {
          setter: facts.setters.state.method,
          state: facts.state.name,
          valueProp: facts.props.state.name,
        },
      ],
      typeFacades: [],
    },
    kind: "component",
    path: `${plan.outputDirectory}/${facts.exports.root}`,
  };
}

export function isSingleBooleanControlOutputModelPlan(plan: GenericAdapterPlan): boolean {
  if (plan.category !== "single-boolean-control" || plan.component !== "toggle") {
    return false;
  }

  const rootPart = plan.parts.find((part) => part.name === "root");
  const stateModel = plan.stateModels.find((candidate) => candidate.name === "pressed");
  const stateEvent = plan.events.find((event) => event.name === "pressedChange");
  const hasStateSetter = plan.setters.some(
    (setter) => "stateModel" in setter && setter.stateModel === "pressed",
  );
  const optionProps = plan.runtime.optionProps ?? [];

  return (
    plan.parts.length === 1 &&
    rootPart?.ownsRuntime === true &&
    rootPart.defaultElement === "button" &&
    stateModel?.controlledProp === "pressed" &&
    stateModel.defaultProp === "defaultPressed" &&
    stateModel.runtimeGetter === "getPressed" &&
    stateModel.runtimeSetter === "setPressed" &&
    stateModel.valueType === "boolean" &&
    stateEvent?.callbackProp === "onPressedChange" &&
    stateEvent.valueProperty === "pressed" &&
    hasStateSetter &&
    optionProps.includes("defaultPressed") &&
    optionProps.includes("disabled") &&
    optionProps.includes("nativeButton") &&
    optionProps.includes("pressed") &&
    optionProps.includes("syncGroup") &&
    optionProps.includes("value")
  );
}

export function getSingleBooleanControlFacts(
  plan: GenericAdapterPlan,
): AdapterSingleBooleanControlFacts {
  if (!isSingleBooleanControlOutputModelPlan(plan)) {
    throw new Error(
      `${plan.displayName} generic adapter plan is not a single boolean-control plan.`,
    );
  }

  const rootPart = getPart(plan, "root");
  const stateModel = getStateModel(plan, "pressed");
  const stateProp = getRuntimeOptionProps(plan, [
    getRequiredPlanValue(
      stateModel.controlledProp,
      `${plan.displayName} ${stateModel.name} state is missing controlledProp.`,
    ),
  ])[0]!;
  const defaultStateProp = getRuntimeOptionProps(plan, [
    getRequiredPlanValue(
      stateModel.defaultProp,
      `${plan.displayName} ${stateModel.name} state is missing defaultProp.`,
    ),
  ])[0]!;
  const disabledProp = getRuntimeOptionProps(plan, ["disabled"])[0]!;
  const nativeButtonProp = getRuntimeOptionProps(plan, ["nativeButton"])[0]!;
  const syncGroupProp = getRuntimeOptionProps(plan, ["syncGroup"])[0]!;
  const valueProp = getRuntimeOptionProps(plan, ["value"])[0]!;
  const stateEvent = getEvent(plan, "pressedChange");
  const stateSetter = getSetterForState(plan, "pressed");
  const disabledSetter = getSetterForProp(plan, disabledProp);

  return {
    attrs: {
      ariaDisabled: getStaticAttributeName(plan, rootPart, "aria-disabled"),
      ariaState: getStaticAttributeName(plan, rootPart, "aria-pressed"),
      defaultState: getStaticAttributeName(plan, rootPart, "data-default-pressed"),
      disabled: getStaticAttributeName(plan, rootPart, "data-disabled"),
      falsyPresence: getStaticAttributeName(plan, rootPart, "data-unpressed"),
      native: getStaticAttributeName(plan, rootPart, "data-native"),
      state: getStaticAttributeName(plan, rootPart, "data-state"),
      syncGroup: getStaticAttributeName(plan, rootPart, "data-sync-group"),
      truthyPresence: getStaticAttributeName(plan, rootPart, "data-pressed"),
      value: getStaticAttributeName(plan, rootPart, "data-value"),
    },
    displayName: plan.displayName,
    event: {
      callbackProp: stateEvent.callbackProp,
      detailsType: getRequiredPlanValue(
        stateEvent.detailsType,
        `${plan.displayName} ${stateEvent.name} event is missing detailsType.`,
      ),
      name: stateEvent.name,
      valueProperty: getRequiredPlanValue(
        stateEvent.valueProperty,
        `${plan.displayName} ${stateEvent.name} event is missing valueProperty.`,
      ),
      valueType: stateModel.valueType,
    },
    exports: {
      namespace: plan.exports.namespace,
      root: getPartExportName(plan, "root"),
    },
    initExclusionAttributes: rootPart.initExclusionAttributes ?? [],
    part: rootPart,
    render: {
      nonNativeElement: "span",
      nonNativeElementType: "HTMLSpanElement",
    },
    props: {
      defaultState: getAdapterFamilyProp(getPlanProp(plan, defaultStateProp)),
      disabled: getAdapterFamilyProp(getPlanProp(plan, disabledProp)),
      nativeButton: getAdapterFamilyProp(getPlanProp(plan, nativeButtonProp)),
      state: getAdapterFamilyProp(getPlanProp(plan, stateProp)),
      syncGroup: getAdapterFamilyProp(getPlanProp(plan, syncGroupProp)),
      value: getAdapterFamilyProp(getPlanProp(plan, valueProp)),
    },
    runtime: {
      destroyFunction: `destroy${plan.displayName}s`,
      factory: plan.runtime.factory,
      importSource: plan.runtime.importSource,
      instancesName: `${toCamelCase(plan.displayName)}Instances`,
      setupFunction: `setup${plan.displayName}s`,
      typeImportSource: getRuntimeTypeImportSource(plan),
    },
    state: {
      getter: getRequiredPlanValue(
        stateModel.runtimeGetter,
        `${plan.displayName} ${stateModel.name} state is missing runtimeGetter.`,
      ),
      name: stateModel.name,
      pascalName: toPascalCase(stateModel.name),
    },
    setters: {
      disabled: {
        method: disabledSetter.method,
        options: disabledSetter.options,
      },
      state: {
        method: stateSetter.method,
        options: stateSetter.options,
      },
    },
  };
}
