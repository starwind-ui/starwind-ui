import type {
  AdapterComponentFile,
  AdapterOutputModel,
  AdapterPresenceFloatingOverlayComponentProjection,
  AdapterPresenceFloatingOverlayFacts,
} from "../../framework-adapters/types.js";
import type { AdapterOutputFamilyPlan } from "../adapter-family-plans.js";
import type { GenericAdapterPlan } from "../types.js";
import {
  getAdapterFamilyProp,
  getEvent,
  getPart,
  getPartExportName,
  getPlanProp,
  getPlanPropForTarget,
  getRequiredPlanValue,
  getRuntimeOptionProps,
  getRuntimeTypeImportSource,
  getSetterForState,
  getStateModel,
  getStaticAttributeName,
  hasExactNames,
  pluralizeDisplayName,
  toPascalCase,
} from "./toolkit.js";

export const presenceFloatingOverlayAdapterFamilyPlan = {
  buildOutputModel: buildPresenceFloatingOverlayOutputModel,
  id: "presence-floating-overlay",
  matches: isPresenceFloatingOverlayOutputModelPlan,
} satisfies AdapterOutputFamilyPlan<AdapterOutputModel>;

function buildPresenceFloatingOverlayOutputModel(plan: GenericAdapterPlan): AdapterOutputModel {
  const facts = getPresenceFloatingOverlayFacts(plan);
  const partNames: AdapterPresenceFloatingOverlayComponentProjection["part"][] = [
    "root",
    "trigger",
    "portal",
    "positioner",
    "popup",
    "arrow",
    "backdrop",
    "title",
    "description",
    "close",
    "viewport",
  ];

  return {
    files: [
      ...partNames.map((partName) =>
        createPresenceFloatingOverlayComponentFile(plan, partName, facts),
      ),
      {
        exports: {
          kind: "namespace",
          members: facts.index.importMembers,
          namespace: facts.exports.namespace,
        },
        family: { facts, kind: "presence-floating-overlay" },
        imports: [],
        kind: "index",
        path: `${plan.outputDirectory}/index.ts`,
        typeFacades: [],
      },
    ],
  };
}

function createPresenceFloatingOverlayComponentFile(
  plan: GenericAdapterPlan,
  partName: AdapterPresenceFloatingOverlayComponentProjection["part"],
  facts: AdapterPresenceFloatingOverlayFacts,
): AdapterComponentFile {
  const part = getPresenceFloatingOverlayPart(facts, partName);
  const exportName = getPresenceFloatingOverlayExportName(facts, partName);

  return {
    component: {
      context: [],
      defaults: [],
      displayName: `${facts.displayName}.${part.namespaceKey}`,
      events:
        partName === "root"
          ? [
              {
                detailType: facts.events.closeComplete.detailsType,
                handlerProp: facts.events.closeComplete.callbackProp,
                runtimeEvent: facts.events.closeComplete.name,
                targetPart: "root",
              },
              {
                detailType: facts.events.openChange.detailsType,
                handlerProp: facts.events.openChange.callbackProp,
                runtimeEvent: facts.events.openChange.name,
                targetPart: "root",
              },
            ]
          : [],
      exports: {
        kind: "named",
        members: [{ from: `./${exportName}`, name: exportName }],
        namespace: facts.exports.namespace,
      },
      family: { facts, kind: "presence-floating-overlay", part: partName },
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
                facts.props.defaultOpen,
                facts.props.closeOnEscape,
                facts.props.closeOnOutsideInteract,
                facts.props.modal,
                facts.props.openOnHover,
              ].map((prop) => ({ name: prop.name, source: "prop" })),
              rootRef: "rootRef",
            }
          : undefined,
      name: exportName,
      portals:
        partName === "portal"
          ? [
              {
                children: [{ kind: "slot" }],
                sourcePart: "portal",
                target: { code: "document.body" },
              },
            ]
          : [],
      props: getPresenceFloatingOverlayPartProps(partName, facts),
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
                setter: facts.setter.method,
                state: facts.state.name,
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

function getPresenceFloatingOverlayPartProps(
  partName: AdapterPresenceFloatingOverlayComponentProjection["part"],
  facts: AdapterPresenceFloatingOverlayFacts,
) {
  if (partName === "root") {
    return [
      facts.props.defaultOpen,
      facts.props.open,
      facts.props.closeOnEscape,
      facts.props.closeOnOutsideInteract,
      facts.props.modal,
      facts.props.openOnHover,
      facts.props.closeDelay,
    ].map((prop) => ({ kind: "unknown" as const, name: prop.name, type: prop.type }));
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

  if (partName === "positioner" || partName === "popup") {
    return [
      facts.props.side,
      facts.props.align,
      facts.props.sideOffset,
      facts.props.avoidCollisions,
    ].map((prop) => ({ kind: "unknown" as const, name: prop.name, type: prop.type }));
  }

  return [];
}

function isPresenceFloatingOverlayOutputModelPlan(plan: GenericAdapterPlan): boolean {
  return isPresenceFloatingOverlayPlan(plan, hasExactNames);
}

function isPresenceFloatingOverlayPlan(
  plan: GenericAdapterPlan,
  matchNames: (actual: string[], expected: string[]) => boolean,
): boolean {
  if (plan.component !== "popover" || plan.category !== "presence-floating-overlay") {
    return false;
  }

  const partNames = plan.parts.map((part) => part.name);
  const propNames = plan.props.map((prop) => prop.name);
  const optionProps = plan.runtime.optionProps ?? [];
  const rootPart = plan.parts.find((part) => part.name === "root");
  const triggerPart = plan.parts.find((part) => part.name === "trigger");
  const portalPart = plan.parts.find((part) => part.name === "portal");
  const positionerPart = plan.parts.find((part) => part.name === "positioner");
  const popupPart = plan.parts.find((part) => part.name === "popup");
  const arrowPart = plan.parts.find((part) => part.name === "arrow");
  const backdropPart = plan.parts.find((part) => part.name === "backdrop");
  const titlePart = plan.parts.find((part) => part.name === "title");
  const descriptionPart = plan.parts.find((part) => part.name === "description");
  const closePart = plan.parts.find((part) => part.name === "close");
  const viewportPart = plan.parts.find((part) => part.name === "viewport");
  const openStateModel = plan.stateModels.find((stateModel) => stateModel.name === "open");
  const openEvent = plan.events.find((event) => event.name === "openChange");
  const closeCompleteEvent = plan.events.find((event) => event.name === "closeComplete");
  const openSetter = plan.setters.find(
    (setter) => "stateModel" in setter && setter.stateModel === "open",
  );
  const asChild = plan.asChild?.[0];

  return (
    plan.runtime.factory === "createPopover" &&
    plan.runtime.importSource === "@starwind-ui/runtime/popover" &&
    plan.runtime.rootPart === "root" &&
    plan.runtime.destroys === true &&
    matchNames(optionProps, [
      "closeOnEscape",
      "closeOnOutsideInteract",
      "defaultOpen",
      "modal",
      "onCloseComplete",
      "onOpenChange",
      "open",
      "openOnHover",
    ]) &&
    matchNames(partNames, [
      "root",
      "trigger",
      "portal",
      "positioner",
      "popup",
      "arrow",
      "backdrop",
      "title",
      "description",
      "close",
      "viewport",
    ]) &&
    matchNames(propNames, [
      "open",
      "defaultOpen",
      "closeOnEscape",
      "closeOnOutsideInteract",
      "modal",
      "openOnHover",
      "closeDelay",
      "onCloseComplete",
      "onOpenChange",
      "asChild",
      "side",
      "align",
      "sideOffset",
      "avoidCollisions",
    ]) &&
    rootPart?.defaultElement === "div" &&
    rootPart.ownsRuntime === true &&
    triggerPart?.defaultElement === "button" &&
    portalPart?.defaultElement === "div" &&
    positionerPart?.defaultElement === "div" &&
    popupPart?.defaultElement === "div" &&
    popupPart.role === "dialog" &&
    arrowPart?.defaultElement === "div" &&
    backdropPart?.defaultElement === "div" &&
    titlePart?.defaultElement === "h2" &&
    descriptionPart?.defaultElement === "p" &&
    closePart?.defaultElement === "button" &&
    viewportPart?.defaultElement === "div" &&
    openStateModel?.controlledProp === "open" &&
    openStateModel.defaultProp === "defaultOpen" &&
    openStateModel.initialAttribute === "data-default-open" &&
    openStateModel.runtimeGetter === "getOpen" &&
    openStateModel.runtimeSetter === "setOpen" &&
    openStateModel.valueType === "boolean" &&
    openEvent?.callbackProp === "onOpenChange" &&
    openEvent.callbackTiming === "before-state-commit" &&
    openEvent.cancelable === true &&
    closeCompleteEvent?.callbackProp === "onCloseComplete" &&
    closeCompleteEvent.callbackTiming === "after-state-commit" &&
    closeCompleteEvent.cancelable === false &&
    openSetter?.method === "setOpen" &&
    openSetter.options?.emit === false &&
    Object.keys(openSetter.options ?? {}).length === 1 &&
    openSetter.suppressesEmit === true &&
    plan.presence?.unmountPolicy === "runtime-owned" &&
    matchNames(plan.presence.initialHiddenParts, ["popup", "backdrop"]) &&
    plan.floating?.anchorPart === "trigger" &&
    plan.floating.portalPart === "portal" &&
    plan.floating.positionerPart === "positioner" &&
    plan.floating.popupPart === "popup" &&
    matchNames(plan.floating.optionProps, ["side", "align", "sideOffset", "avoidCollisions"]) &&
    plan.asChild?.length === 1 &&
    asChild?.part === "trigger" &&
    matchNames(asChild.merges, ["aria", "className", "data", "ref"]) &&
    hasPresenceFloatingOverlayRequiredStaticAttributes(plan)
  );
}

function hasPresenceFloatingOverlayRequiredStaticAttributes(plan: GenericAdapterPlan): boolean {
  return (
    hasStaticAttribute(plan, "root", "data-default-open", "prop") &&
    hasStaticAttribute(plan, "root", "data-close-on-escape", "prop") &&
    hasStaticAttribute(plan, "root", "data-close-on-outside-interact", "prop") &&
    hasStaticAttribute(plan, "root", "data-modal", "prop") &&
    hasStaticAttribute(plan, "root", "data-open-on-hover", "prop") &&
    hasStaticAttribute(plan, "root", "data-close-delay", "prop") &&
    hasStaticAttribute(plan, "root", "data-state", "state") &&
    hasStaticAttribute(plan, "trigger", "type", "constant", "button") &&
    hasStaticAttribute(plan, "trigger", "data-as-child", "prop") &&
    hasStaticAttribute(plan, "trigger", "aria-haspopup", "constant", "dialog") &&
    hasStaticAttribute(plan, "trigger", "aria-expanded", "state") &&
    hasStaticAttribute(plan, "trigger", "data-state", "state") &&
    hasStaticAttribute(plan, "positioner", "data-state", "state") &&
    hasStaticAttribute(plan, "positioner", "data-side", "prop") &&
    hasStaticAttribute(plan, "positioner", "data-align", "prop") &&
    hasStaticAttribute(plan, "positioner", "data-side-offset", "prop") &&
    hasStaticAttribute(plan, "positioner", "data-avoid-collisions", "prop") &&
    hasStaticAttribute(plan, "popup", "role", "constant", "dialog") &&
    hasStaticAttribute(plan, "popup", "tabindex", "constant", "-1") &&
    hasStaticAttribute(plan, "popup", "tabIndex", "constant", "-1") &&
    hasStaticAttribute(plan, "popup", "data-state", "state") &&
    hasStaticAttribute(plan, "popup", "data-side", "prop") &&
    hasStaticAttribute(plan, "popup", "data-align", "prop") &&
    hasStaticAttribute(plan, "popup", "data-side-offset", "prop") &&
    hasStaticAttribute(plan, "popup", "data-avoid-collisions", "prop") &&
    hasStaticAttribute(plan, "popup", "hidden", "state") &&
    hasStaticAttribute(plan, "backdrop", "data-state", "state") &&
    hasStaticAttribute(plan, "backdrop", "hidden", "state") &&
    hasStaticAttribute(plan, "close", "type", "constant", "button")
  );
}

function hasStaticAttribute(
  plan: GenericAdapterPlan,
  part: string,
  name: string,
  source: "constant" | "prop" | "runtime" | "state",
  value?: string,
): boolean {
  const attribute = plan.staticAttributes.find(
    (candidate) => candidate.part === part && candidate.name === name,
  );

  return (
    attribute?.source === source &&
    (value === undefined ? attribute.value === undefined : attribute.value === value)
  );
}

function getPresenceFloatingOverlayFacts(
  plan: GenericAdapterPlan,
): AdapterPresenceFloatingOverlayFacts {
  if (!isPresenceFloatingOverlayOutputModelPlan(plan)) {
    throw new Error(
      `${plan.displayName} generic adapter plan is not a presence-floating-overlay plan.`,
    );
  }

  const rootPart = getPart(plan, "root");
  const triggerPart = getPart(plan, "trigger");
  const portalPart = getPart(plan, "portal");
  const positionerPart = getPart(plan, "positioner");
  const popupPart = getPart(plan, "popup");
  const arrowPart = getPart(plan, "arrow");
  const backdropPart = getPart(plan, "backdrop");
  const titlePart = getPart(plan, "title");
  const descriptionPart = getPart(plan, "description");
  const closePart = getPart(plan, "close");
  const viewportPart = getPart(plan, "viewport");
  const openStateModel = getStateModel(plan, "open");
  const openProp = getRequiredPlanValue(
    openStateModel.controlledProp,
    `${plan.displayName} open state is missing controlledProp.`,
  );
  const defaultOpenProp = getRequiredPlanValue(
    openStateModel.defaultProp,
    `${plan.displayName} open state is missing defaultProp.`,
  );
  const [closeOnEscapeProp, closeOnOutsideInteractProp, modalProp, openOnHoverProp] =
    getRuntimeOptionProps(plan, [
      "closeOnEscape",
      "closeOnOutsideInteract",
      "modal",
      "openOnHover",
    ]);
  const closeDelayProp = getPlanPropForTarget(plan, "closeDelay", "root");
  const asChildProp = getPlanPropForTarget(plan, "asChild", "trigger");
  const sideProp = getPlanPropForTarget(plan, "side", "popup");
  const alignProp = getPlanPropForTarget(plan, "align", "popup");
  const sideOffsetProp = getPlanPropForTarget(plan, "sideOffset", "popup");
  const avoidCollisionsProp = getPlanPropForTarget(plan, "avoidCollisions", "popup");
  const openEvent = getEvent(plan, "openChange");
  const closeCompleteEvent = getEvent(plan, "closeComplete");
  const openSetter = getSetterForState(plan, "open");
  const importMembers = [...plan.exports.members].sort((left, right) =>
    left.name.localeCompare(right.name),
  );

  return {
    attrs: {
      arrow: arrowPart.discoveryAttribute,
      backdrop: backdropPart.discoveryAttribute,
      backdropHidden: getStaticAttributeName(plan, backdropPart, "hidden"),
      backdropState: getStaticAttributeName(plan, backdropPart, "data-state"),
      close: closePart.discoveryAttribute,
      closeType: getStaticAttributeName(plan, closePart, "type"),
      description: descriptionPart.discoveryAttribute,
      floatingAlign: getStaticAttributeName(plan, popupPart, "data-align"),
      floatingAvoidCollisions: getStaticAttributeName(plan, popupPart, "data-avoid-collisions"),
      floatingSide: getStaticAttributeName(plan, popupPart, "data-side"),
      floatingSideOffset: getStaticAttributeName(plan, popupPart, "data-side-offset"),
      popup: popupPart.discoveryAttribute,
      popupHidden: getStaticAttributeName(plan, popupPart, "hidden"),
      popupRole: getStaticAttributeName(plan, popupPart, "role"),
      popupState: getStaticAttributeName(plan, popupPart, "data-state"),
      popupTabIndex: getStaticAttributeName(plan, popupPart, "tabIndex"),
      popupTabindex: getStaticAttributeName(plan, popupPart, "tabindex"),
      portal: portalPart.discoveryAttribute,
      positioner: positionerPart.discoveryAttribute,
      positionerState: getStaticAttributeName(plan, positionerPart, "data-state"),
      root: rootPart.discoveryAttribute,
      rootCloseDelay: getStaticAttributeName(plan, rootPart, "data-close-delay"),
      rootCloseOnEscape: getStaticAttributeName(plan, rootPart, "data-close-on-escape"),
      rootCloseOnOutsideInteract: getStaticAttributeName(
        plan,
        rootPart,
        "data-close-on-outside-interact",
      ),
      rootDefaultOpen: getStaticAttributeName(plan, rootPart, "data-default-open"),
      rootModal: getStaticAttributeName(plan, rootPart, "data-modal"),
      rootOpenOnHover: getStaticAttributeName(plan, rootPart, "data-open-on-hover"),
      rootState: getStaticAttributeName(plan, rootPart, "data-state"),
      title: titlePart.discoveryAttribute,
      trigger: triggerPart.discoveryAttribute,
      triggerAriaExpanded: getStaticAttributeName(plan, triggerPart, "aria-expanded"),
      triggerAriaHaspopup: getStaticAttributeName(plan, triggerPart, "aria-haspopup"),
      triggerAsChild: getStaticAttributeName(plan, triggerPart, "data-as-child"),
      triggerState: getStaticAttributeName(plan, triggerPart, "data-state"),
      triggerType: getStaticAttributeName(plan, triggerPart, "type"),
      viewport: viewportPart.discoveryAttribute,
    },
    displayName: plan.displayName,
    events: {
      closeComplete: {
        callbackProp: closeCompleteEvent.callbackProp,
        detailsType: getRequiredPlanValue(
          closeCompleteEvent.detailsType,
          `${plan.displayName} closeComplete event is missing detailsType.`,
        ),
        name: closeCompleteEvent.name,
        valueProperty: getRequiredPlanValue(
          closeCompleteEvent.valueProperty,
          `${plan.displayName} closeComplete event is missing valueProperty.`,
        ),
        valueType: getRequiredPlanValue(
          closeCompleteEvent.valueType,
          `${plan.displayName} closeComplete event is missing valueType.`,
        ),
      },
      openChange: {
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
    },
    exports: {
      arrow: getPartExportName(plan, "arrow"),
      backdrop: getPartExportName(plan, "backdrop"),
      close: getPartExportName(plan, "close"),
      description: getPartExportName(plan, "description"),
      namespace: plan.exports.namespace,
      popup: getPartExportName(plan, "popup"),
      portal: getPartExportName(plan, "portal"),
      positioner: getPartExportName(plan, "positioner"),
      root: getPartExportName(plan, "root"),
      title: getPartExportName(plan, "title"),
      trigger: getPartExportName(plan, "trigger"),
      viewport: getPartExportName(plan, "viewport"),
    },
    floating: {
      anchorPart: getRequiredPlanValue(
        plan.floating?.anchorPart,
        `${plan.displayName} floating facts are missing anchorPart.`,
      ),
      optionProps: [
        ...getRequiredPlanValue(
          plan.floating?.optionProps,
          `${plan.displayName} floating facts are missing optionProps.`,
        ),
      ],
      popupPart: getRequiredPlanValue(
        plan.floating?.popupPart,
        `${plan.displayName} floating facts are missing popupPart.`,
      ),
      portalPart: getRequiredPlanValue(
        plan.floating?.portalPart,
        `${plan.displayName} floating facts are missing portalPart.`,
      ),
      positionerPart: getRequiredPlanValue(
        plan.floating?.positionerPart,
        `${plan.displayName} floating facts are missing positionerPart.`,
      ),
    },
    index: {
      importMembers: importMembers.map((member) => ({
        from: `./${member.name}`,
        name: member.name,
      })),
      namespaceMembers: plan.exports.members.map((member) => ({
        key: toPascalCase(member.part),
        name: member.name,
      })),
      typeExports: [
        getRequiredPlanValue(
          closeCompleteEvent.detailsType,
          `${plan.displayName} closeComplete event is missing detailsType.`,
        ),
        getRequiredPlanValue(
          openEvent.detailsType,
          `${plan.displayName} openChange event is missing detailsType.`,
        ),
      ],
    },
    parts: {
      arrow: { ...arrowPart, namespaceKey: "Arrow" },
      backdrop: { ...backdropPart, namespaceKey: "Backdrop" },
      close: { ...closePart, namespaceKey: "Close" },
      description: { ...descriptionPart, namespaceKey: "Description" },
      popup: {
        ...popupPart,
        namespaceKey: "Popup",
        role: getRequiredPlanValue(
          popupPart.role,
          `${plan.displayName} popup part is missing role.`,
        ),
      },
      portal: { ...portalPart, namespaceKey: "Portal" },
      positioner: { ...positionerPart, namespaceKey: "Positioner" },
      root: { ...rootPart, namespaceKey: "Root" },
      title: { ...titlePart, namespaceKey: "Title" },
      trigger: { ...triggerPart, namespaceKey: "Trigger" },
      viewport: { ...viewportPart, namespaceKey: "Viewport" },
    },
    props: {
      align: getAdapterFamilyProp(alignProp),
      asChild: getAdapterFamilyProp(asChildProp),
      avoidCollisions: getAdapterFamilyProp(avoidCollisionsProp),
      closeDelay: getAdapterFamilyProp(closeDelayProp),
      closeOnEscape: getAdapterFamilyProp(getPlanProp(plan, closeOnEscapeProp!)),
      closeOnOutsideInteract: getAdapterFamilyProp(getPlanProp(plan, closeOnOutsideInteractProp!)),
      defaultOpen: getAdapterFamilyProp(getPlanProp(plan, defaultOpenProp)),
      modal: getAdapterFamilyProp(getPlanProp(plan, modalProp!)),
      open: getAdapterFamilyProp(getPlanProp(plan, openProp)),
      openOnHover: getAdapterFamilyProp(getPlanProp(plan, openOnHoverProp!)),
      side: getAdapterFamilyProp(sideProp),
      sideOffset: getAdapterFamilyProp(sideOffsetProp),
    },
    runtime: {
      factory: plan.runtime.factory,
      importSource: plan.runtime.importSource,
      setupFunction: `setup${pluralizeDisplayName(plan.displayName)}`,
      typeImportSource: getRuntimeTypeImportSource(plan),
    },
    state: {
      getter: getRequiredPlanValue(
        openStateModel.runtimeGetter,
        `${plan.displayName} open state is missing runtimeGetter.`,
      ),
      name: openStateModel.name,
    },
    setter: {
      method: openSetter.method,
      options: openSetter.options,
    },
  };
}

function getPresenceFloatingOverlayPart(
  facts: AdapterPresenceFloatingOverlayFacts,
  partName: AdapterPresenceFloatingOverlayComponentProjection["part"],
) {
  return facts.parts[partName];
}

function getPresenceFloatingOverlayExportName(
  facts: AdapterPresenceFloatingOverlayFacts,
  partName: AdapterPresenceFloatingOverlayComponentProjection["part"],
): string {
  return facts.exports[partName];
}
