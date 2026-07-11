import type {
  AdapterComponentFile,
  AdapterDisclosurePresenceFacts,
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
  getRenderingPropForTarget,
  getRequiredPlanValue,
  getRuntimeOptionProps,
  getRuntimeTypeImportSource,
  getSetterForState,
  getStateModel,
  getStaticAttributeName,
  hasExactNames,
  toPascalCase,
} from "./toolkit.js";

export const disclosurePresenceAdapterFamilyPlan = {
  buildOutputModel: buildDisclosurePresenceOutputModel,
  id: "disclosure-presence",
  matches: isDisclosurePresenceOutputModelPlan,
} satisfies AdapterOutputFamilyPlan<AdapterOutputModel>;

function buildDisclosurePresenceOutputModel(plan: GenericAdapterPlan): AdapterOutputModel {
  const facts = getDisclosurePresenceFacts(plan);

  return {
    files: [
      createDisclosurePresenceComponentFile(plan, "root", facts),
      createDisclosurePresenceComponentFile(plan, "trigger", facts),
      createDisclosurePresenceComponentFile(plan, "panel", facts),
      {
        exports: {
          kind: "namespace",
          members: [
            { from: `./${facts.exports.root}`, name: facts.exports.root },
            { from: `./${facts.exports.trigger}`, name: facts.exports.trigger },
            { from: `./${facts.exports.panel}`, name: facts.exports.panel },
          ],
          namespace: facts.exports.namespace,
        },
        family: { facts, kind: "disclosure-presence" },
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

function createDisclosurePresenceComponentFile(
  plan: GenericAdapterPlan,
  partName: "panel" | "root" | "trigger",
  facts: AdapterDisclosurePresenceFacts,
): AdapterComponentFile {
  const part = facts.parts[partName];
  const exportName = facts.exports[partName];

  return {
    component: {
      context: [],
      defaults: [],
      displayName: `${facts.displayName}.${toPascalCase(partName)}`,
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
      family: { facts, kind: "disclosure-presence", part: partName },
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
              options: [
                { name: facts.props.defaultOpen.name, source: "prop" },
                { name: facts.props.disabled.name, source: "prop" },
                { name: facts.props.open.name, source: "prop" },
              ],
              rootRef: "rootRef",
            }
          : undefined,
      name: exportName,
      portals: [],
      props: getDisclosurePresencePropsForPart(partName, facts),
      refs: [{ id: `${partName}Ref`, part: partName, public: true }],
      render: {
        attrs: [{ name: part.discoveryAttribute }],
        children: [{ kind: "slot" }],
        defaultElement: part.defaultElement,
        events: [],
        kind: "element",
        part: partName,
        refs: [{ id: `${partName}Ref`, part: partName, public: true }],
      },
      stateSync:
        partName === "root"
          ? [
              {
                setter: facts.setter.method,
                state: "open",
                valueProp: facts.props.open.name,
              },
            ]
          : [],
      typeFacades: [],
    },
    kind: "component",
    path: `${plan.outputDirectory}/${exportName}`,
  };
}

function getDisclosurePresencePropsForPart(
  partName: "panel" | "root" | "trigger",
  facts: AdapterDisclosurePresenceFacts,
) {
  if (partName === "root") {
    return [
      {
        kind: "boolean" as const,
        name: facts.props.defaultOpen.name,
        type: facts.props.defaultOpen.type,
      },
      {
        kind: "boolean" as const,
        name: facts.props.disabled.name,
        type: facts.props.disabled.type,
      },
      { kind: "boolean" as const, name: facts.props.open.name, type: facts.props.open.type },
      { kind: "callback" as const, name: facts.event.callbackProp, type: "function" },
    ];
  }

  if (partName === "trigger") {
    return [
      {
        kind: "rendering" as const,
        name: facts.props.asChild.name,
        type: facts.props.asChild.type,
      },
    ];
  }

  return [
    {
      kind: "rendering" as const,
      name: facts.props.hiddenUntilFound.name,
      type: facts.props.hiddenUntilFound.type,
    },
  ];
}

function isDisclosurePresenceOutputModelPlan(plan: GenericAdapterPlan): boolean {
  if (plan.category !== "presence-disclosure-control" || plan.component !== "collapsible") {
    return false;
  }

  const partNames = plan.parts.map((part) => part.name);
  const rootPart = plan.parts.find((part) => part.name === "root");
  const triggerPart = plan.parts.find((part) => part.name === "trigger");
  const panelPart = plan.parts.find((part) => part.name === "panel");
  const openStateModel = plan.stateModels.find((stateModel) => stateModel.name === "open");
  const openEvent = plan.events.find((event) => event.name === "openChange");
  const hasOpenSetter = plan.setters.some(
    (setter) => "stateModel" in setter && setter.stateModel === "open",
  );
  const optionProps = plan.runtime.optionProps ?? [];
  const presence = plan.presence;

  return (
    hasExactNames(partNames, ["root", "trigger", "panel"]) &&
    rootPart?.ownsRuntime === true &&
    rootPart.defaultElement === "div" &&
    triggerPart?.defaultElement === "button" &&
    panelPart?.defaultElement === "div" &&
    openStateModel?.controlledProp === "open" &&
    openStateModel.defaultProp === "defaultOpen" &&
    openStateModel.runtimeGetter === "getOpen" &&
    openStateModel.runtimeSetter === "setOpen" &&
    openStateModel.valueType === "boolean" &&
    openEvent?.callbackProp === "onOpenChange" &&
    openEvent.callbackTiming === "before-state-commit" &&
    openEvent.cancelable === true &&
    hasOpenSetter &&
    optionProps.includes("defaultOpen") &&
    optionProps.includes("disabled") &&
    optionProps.includes("open") &&
    presence?.initialHiddenParts.includes("panel") === true &&
    presence.unmountPolicy === "runtime-owned-visibility"
  );
}

function getDisclosurePresenceFacts(plan: GenericAdapterPlan): AdapterDisclosurePresenceFacts {
  if (!isDisclosurePresenceOutputModelPlan(plan)) {
    throw new Error(`${plan.displayName} generic adapter plan is not a disclosure presence plan.`);
  }

  const rootPart = getPart(plan, "root");
  const triggerPart = getPart(plan, "trigger");
  const panelPart = getPart(plan, "panel");
  const openStateModel = getStateModel(plan, "open");
  const openProp = getRuntimeOptionProps(plan, [
    getRequiredPlanValue(
      openStateModel.controlledProp,
      `${plan.displayName} open state is missing controlledProp.`,
    ),
  ])[0]!;
  const defaultOpenProp = getRuntimeOptionProps(plan, [
    getRequiredPlanValue(
      openStateModel.defaultProp,
      `${plan.displayName} open state is missing defaultProp.`,
    ),
  ])[0]!;
  const disabledProp = getRuntimeOptionProps(plan, ["disabled"])[0]!;
  const openEvent = getEvent(plan, "openChange");
  const openSetter = getSetterForState(plan, "open");
  const asChildProp = getRenderingPropForTarget(plan, "trigger");
  const hiddenUntilFoundProp = getRenderingPropForTarget(plan, "panel");

  return {
    attrs: {
      defaultOpen: getStaticAttributeName(plan, rootPart, "data-default-open"),
      disabled: getStaticAttributeName(plan, rootPart, "data-disabled"),
      panel: panelPart.discoveryAttribute,
      panelHidden: getStaticAttributeName(plan, panelPart, "hidden"),
      panelHiddenUntilFound: getStaticAttributeName(plan, panelPart, "data-hidden-until-found"),
      panelState: getStaticAttributeName(plan, panelPart, "data-state"),
      root: rootPart.discoveryAttribute,
      rootState: getStaticAttributeName(plan, rootPart, "data-state"),
      trigger: triggerPart.discoveryAttribute,
      triggerExpanded: getStaticAttributeName(plan, triggerPart, "aria-expanded"),
      triggerState: getStaticAttributeName(plan, triggerPart, "data-state"),
    },
    displayName: plan.displayName,
    event: {
      callbackProp: openEvent.callbackProp,
      detailsType: getRequiredPlanValue(
        openEvent.detailsType,
        `${plan.displayName} openChange event is missing detailsType.`,
      ),
      name: openEvent.name,
      valueProperty: getRequiredPlanValue(
        openEvent.valueProperty,
        `${plan.displayName} openChange event is missing valueProperty.`,
      ),
      valueType: getRequiredPlanValue(
        openEvent.valueType,
        `${plan.displayName} openChange event is missing valueType.`,
      ),
    },
    exports: {
      namespace: plan.exports.namespace,
      panel: getPartExportName(plan, "panel"),
      root: getPartExportName(plan, "root"),
      trigger: getPartExportName(plan, "trigger"),
    },
    openGetter: getRequiredPlanValue(
      openStateModel.runtimeGetter,
      `${plan.displayName} open state is missing runtimeGetter.`,
    ),
    parts: {
      panel: panelPart,
      root: rootPart,
      trigger: triggerPart,
    },
    props: {
      asChild: getAdapterFamilyProp(asChildProp),
      defaultOpen: getAdapterFamilyProp(getPlanProp(plan, defaultOpenProp)),
      disabled: getAdapterFamilyProp(getPlanProp(plan, disabledProp)),
      hiddenUntilFound: getAdapterFamilyProp(hiddenUntilFoundProp),
      open: getAdapterFamilyProp(getPlanProp(plan, openProp)),
    },
    runtime: {
      factory: plan.runtime.factory,
      importSource: plan.runtime.importSource,
      setupFunction: `setup${plan.displayName}s`,
      typeImportSource: getRuntimeTypeImportSource(plan),
    },
    setter: {
      method: openSetter.method,
      options: openSetter.options,
    },
  };
}
