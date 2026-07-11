import type {
  AdapterComponentFile,
  AdapterNativeOverlayComponentProjection,
  AdapterNativeOverlayFacts,
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
  getPlanPropForTarget,
  getRequiredPlanValue,
  getRuntimeOptionProps,
  getRuntimeTypeImportSource,
  getSetterForState,
  getStateModel,
  getStaticAttributeName,
  getStaticAttributeValue,
  hasExactNames,
  pluralizeDisplayName,
  toCamelCase,
  toPascalCase,
} from "./toolkit.js";

export const nativeOverlayAdapterFamilyPlan = {
  buildOutputModel: buildNativeOverlayOutputModel,
  id: "native-overlay",
  matches: isNativeOverlayOutputModelPlan,
} satisfies AdapterOutputFamilyPlan<AdapterOutputModel>;

function buildNativeOverlayOutputModel(plan: GenericAdapterPlan): AdapterOutputModel {
  const facts = getNativeOverlayFacts(plan);
  const files: AdapterOutputModel["files"] = plan.parts.map((part) =>
    createNativeOverlayComponentFile(
      plan,
      toNativeOverlayPartName(part.name, `${plan.displayName} native overlay part is unsupported.`),
      facts,
    ),
  );

  files.push({
    exports: {
      kind: "namespace",
      members: facts.index.importMembers.map((member) => ({
        from: `./${member.name}`,
        name: member.name,
      })),
      namespace: facts.exports.namespace,
    },
    family: { facts, kind: "native-overlay" },
    imports: [],
    kind: "index",
    path: `${plan.outputDirectory}/index.ts`,
    typeFacades: [
      {
        body: {
          code: `export type { ${facts.index.typeExports.join(", ")} } from "${facts.runtime.typeImportSource}";`,
        },
        exports: facts.index.typeExports,
        name: `${facts.displayName}RuntimeTypes`,
      },
    ],
  });

  return { files };
}

function createNativeOverlayComponentFile(
  plan: GenericAdapterPlan,
  partName: AdapterNativeOverlayComponentProjection["part"],
  facts: AdapterNativeOverlayFacts,
): AdapterComponentFile {
  const part = getNativeOverlayPart(facts, partName);
  const exportName = getNativeOverlayExportName(facts, partName);

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
      family: { facts, kind: "native-overlay", part: partName },
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
                { name: facts.props.closeOnEscape.name, source: "prop" },
                { name: facts.props.closeOnOutsideInteract.name, source: "prop" },
                { name: facts.props.modal.name, source: "prop" },
              ],
              rootRef: "rootRef",
            }
          : undefined,
      name: exportName,
      portals: [],
      props: getNativeOverlayPropsForPart(partName, facts),
      refs: [{ id: `${toCamelCase(partName)}Ref`, part: part.name, public: true }],
      render: {
        attrs: [{ name: part.discoveryAttribute }],
        children: [{ kind: "slot" }],
        defaultElement: part.defaultElement,
        events: [],
        kind: "element",
        part: part.name,
        refs: [{ id: `${toCamelCase(partName)}Ref`, part: part.name, public: true }],
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

function getNativeOverlayPropsForPart(
  partName: AdapterNativeOverlayComponentProjection["part"],
  facts: AdapterNativeOverlayFacts,
) {
  if (partName === "root") {
    return [
      facts.props.defaultOpen,
      facts.props.open,
      facts.props.closeOnEscape,
      facts.props.closeOnOutsideInteract,
      facts.props.modal,
      {
        kind: "callback" as const,
        name: facts.events.closeComplete.callbackProp,
        type: "function",
      },
      {
        kind: "callback" as const,
        name: facts.events.openChange.callbackProp,
        type: "function",
      },
    ].map((prop) => ({
      kind:
        prop.name === facts.events.closeComplete.callbackProp ||
        prop.name === facts.events.openChange.callbackProp
          ? ("callback" as const)
          : prop.type === "boolean"
            ? ("boolean" as const)
            : ("unknown" as const),
      name: prop.name,
      required: "required" in prop ? prop.required : undefined,
      type: prop.type,
    }));
  }

  if (partName === "trigger") {
    return [
      {
        kind: "string" as const,
        name: facts.props.targetId.name,
        type: facts.props.targetId.type,
      },
    ];
  }

  if (partName === "popup" && facts.props.side) {
    return [
      {
        kind: "string" as const,
        name: facts.props.side.name,
        type: facts.props.side.type,
      },
    ];
  }

  return [];
}

function isNativeOverlayOutputModelPlan(plan: GenericAdapterPlan): boolean {
  if (
    !["alert-dialog", "dialog", "drawer"].includes(plan.component) ||
    plan.category !== "dialog-native-overlay"
  ) {
    return false;
  }

  const hasPortalAndViewport = plan.component !== "dialog";
  const expectedPartNames = hasPortalAndViewport
    ? [
        "root",
        "trigger",
        "portal",
        "backdrop",
        "viewport",
        "popup",
        "title",
        "description",
        "close",
      ]
    : ["root", "trigger", "backdrop", "popup", "title", "description", "close"];
  const expectedPropNames =
    plan.component === "drawer"
      ? [
          "open",
          "defaultOpen",
          "closeOnEscape",
          "closeOnOutsideInteract",
          "modal",
          "onCloseComplete",
          "onOpenChange",
          "targetId",
          "side",
        ]
      : [
          "open",
          "defaultOpen",
          "closeOnEscape",
          "closeOnOutsideInteract",
          "modal",
          "onCloseComplete",
          "onOpenChange",
          "targetId",
        ];
  const expectedRuntime = {
    "alert-dialog": {
      factory: "createAlertDialog",
      importSource: "@starwind-ui/runtime/alert-dialog",
    },
    dialog: {
      factory: "createDialog",
      importSource: "@starwind-ui/runtime/dialog",
    },
    drawer: {
      factory: "createDrawer",
      importSource: "@starwind-ui/runtime/drawer",
    },
  }[plan.component];
  const partNames = plan.parts.map((part) => part.name);
  const propNames = plan.props.map((prop) => prop.name);
  const optionProps = plan.runtime.optionProps ?? [];
  const rootPart = plan.parts.find((part) => part.name === "root");
  const triggerPart = plan.parts.find((part) => part.name === "trigger");
  const portalPart = plan.parts.find((part) => part.name === "portal");
  const backdropPart = plan.parts.find((part) => part.name === "backdrop");
  const viewportPart = plan.parts.find((part) => part.name === "viewport");
  const popupPart = plan.parts.find((part) => part.name === "popup");
  const titlePart = plan.parts.find((part) => part.name === "title");
  const descriptionPart = plan.parts.find((part) => part.name === "description");
  const closePart = plan.parts.find((part) => part.name === "close");
  const openStateModel = plan.stateModels.find((stateModel) => stateModel.name === "open");
  const openEvent = plan.events.find((event) => event.name === "openChange");
  const closeCompleteEvent = plan.events.find((event) => event.name === "closeComplete");
  const openSetter = plan.setters.find(
    (setter) => "stateModel" in setter && setter.stateModel === "open",
  );
  const sideProp = plan.props.find((prop) => prop.name === "side");
  const popupRoleAttribute = plan.staticAttributes.find(
    (attribute) => attribute.part === "popup" && attribute.name === "role",
  );
  const popupSideAttribute = plan.staticAttributes.find(
    (attribute) => attribute.part === "popup" && attribute.name === "data-side",
  );

  return (
    plan.runtime.factory === expectedRuntime?.factory &&
    plan.runtime.importSource === expectedRuntime?.importSource &&
    plan.runtime.rootPart === "root" &&
    plan.runtime.destroys === true &&
    hasExactNames(partNames, expectedPartNames) &&
    hasExactNames(propNames, expectedPropNames) &&
    rootPart?.defaultElement === "div" &&
    rootPart.ownsRuntime === true &&
    triggerPart?.defaultElement === "button" &&
    (hasPortalAndViewport
      ? portalPart?.defaultElement === "div" && viewportPart?.defaultElement === "div"
      : portalPart === undefined && viewportPart === undefined) &&
    backdropPart?.defaultElement === "div" &&
    popupPart?.defaultElement === "dialog" &&
    popupPart.role === (plan.component === "alert-dialog" ? "alertdialog" : "dialog") &&
    hasNativeOverlayPopupRoleAttribute(plan.component, popupRoleAttribute) &&
    titlePart?.defaultElement === "h2" &&
    descriptionPart?.defaultElement === "p" &&
    closePart?.defaultElement === "button" &&
    (plan.component === "drawer"
      ? sideProp?.targets?.includes("popup") === true &&
        sideProp.defaultValue === '"right"' &&
        sideProp.type === '"top" | "right" | "bottom" | "left"' &&
        popupSideAttribute?.source === "prop"
      : sideProp === undefined && popupSideAttribute === undefined) &&
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
    hasExactNames(optionProps, [
      "closeOnEscape",
      "closeOnOutsideInteract",
      "defaultOpen",
      "modal",
      "onCloseComplete",
      "onOpenChange",
      "open",
    ]) &&
    plan.presence?.initialHiddenParts.includes("backdrop") === true &&
    plan.presence.unmountPolicy === "runtime-owned"
  );
}

function hasNativeOverlayPopupRoleAttribute(
  component: string,
  attribute: { name: string; part: string; source: string; value?: string } | undefined,
): boolean {
  if (component === "alert-dialog") {
    return (
      attribute?.source === "constant" &&
      attribute.value === "alertdialog" &&
      attribute.part === "popup" &&
      attribute.name === "role"
    );
  }

  return attribute === undefined;
}

function getNativeOverlayFacts(plan: GenericAdapterPlan): AdapterNativeOverlayFacts {
  if (!isNativeOverlayOutputModelPlan(plan)) {
    throw new Error(`${plan.displayName} generic adapter plan is not a native-overlay plan.`);
  }

  const rootPart = getPart(plan, "root");
  const triggerPart = getPart(plan, "trigger");
  const portalPart = plan.parts.find((part) => part.name === "portal");
  const backdropPart = getPart(plan, "backdrop");
  const viewportPart = plan.parts.find((part) => part.name === "viewport");
  const popupPart = getPart(plan, "popup");
  const titlePart = getPart(plan, "title");
  const descriptionPart = getPart(plan, "description");
  const closePart = getPart(plan, "close");
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
  const [closeOnEscapeProp, closeOnOutsideInteractProp, modalProp] = getRuntimeOptionProps(plan, [
    "closeOnEscape",
    "closeOnOutsideInteract",
    "modal",
  ]);
  const openEvent = getEvent(plan, "openChange");
  const closeCompleteEvent = getEvent(plan, "closeComplete");
  const openSetter = getSetterForState(plan, "open");
  const sideProp = plan.props.find(
    (prop) => prop.name === "side" && prop.targets?.includes("popup"),
  );
  const targetIdAttribute = plan.staticAttributes.find(
    (attribute) =>
      attribute.part === triggerPart.name &&
      attribute.source === "prop" &&
      attribute.name.endsWith("target-id"),
  );
  const popupRoleAttribute = plan.staticAttributes.find(
    (attribute) => attribute.part === popupPart.name && attribute.name === "role",
  );
  const importMembers = [...plan.exports.members].sort((left, right) =>
    left.name.localeCompare(right.name),
  );

  if (plan.presence?.unmountPolicy !== "runtime-owned") {
    throw new Error(`${plan.displayName} native overlay plan must keep unmounting Runtime-owned.`);
  }
  if (plan.presence.initialHiddenParts.includes("backdrop") !== true) {
    throw new Error(`${plan.displayName} native overlay plan must initially hide backdrop.`);
  }

  return {
    attrs: {
      backdrop: backdropPart.discoveryAttribute,
      backdropHidden: getStaticAttributeName(plan, backdropPart, "hidden"),
      backdropState: getStaticAttributeName(plan, backdropPart, "data-state"),
      close: closePart.discoveryAttribute,
      closeType: getStaticAttributeName(plan, closePart, "type"),
      closeOnEscape: getStaticAttributeName(plan, rootPart, "data-close-on-escape"),
      closeOnOutsideInteract: getStaticAttributeName(
        plan,
        rootPart,
        "data-close-on-outside-interact",
      ),
      defaultOpen: getStaticAttributeName(plan, rootPart, "data-default-open"),
      description: descriptionPart.discoveryAttribute,
      modal: getStaticAttributeName(plan, rootPart, "data-modal"),
      popup: popupPart.discoveryAttribute,
      popupRole: popupRoleAttribute?.name,
      popupSide: sideProp ? getStaticAttributeName(plan, popupPart, "data-side") : undefined,
      popupState: getStaticAttributeName(plan, popupPart, "data-state"),
      portal: portalPart?.discoveryAttribute,
      root: rootPart.discoveryAttribute,
      rootState: getStaticAttributeName(plan, rootPart, "data-state"),
      targetId: getRequiredPlanValue(
        targetIdAttribute?.name,
        `${plan.displayName} trigger is missing target id attribute.`,
      ),
      title: titlePart.discoveryAttribute,
      trigger: triggerPart.discoveryAttribute,
      triggerAriaHaspopup: getStaticAttributeName(plan, triggerPart, "aria-haspopup"),
      triggerState: getStaticAttributeName(plan, triggerPart, "data-state"),
      triggerType: getStaticAttributeName(plan, triggerPart, "type"),
      viewport: viewportPart?.discoveryAttribute,
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
      backdrop: getPartExportName(plan, "backdrop"),
      close: getPartExportName(plan, "close"),
      description: getPartExportName(plan, "description"),
      namespace: plan.exports.namespace,
      popup: getPartExportName(plan, "popup"),
      portal: portalPart ? getPartExportName(plan, "portal") : undefined,
      root: getPartExportName(plan, "root"),
      title: getPartExportName(plan, "title"),
      trigger: getPartExportName(plan, "trigger"),
      viewport: viewportPart ? getPartExportName(plan, "viewport") : undefined,
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
      portal: portalPart ? { ...portalPart, namespaceKey: "Portal" } : undefined,
      root: { ...rootPart, namespaceKey: "Root" },
      title: { ...titlePart, namespaceKey: "Title" },
      trigger: { ...triggerPart, namespaceKey: "Trigger" },
      viewport: viewportPart ? { ...viewportPart, namespaceKey: "Viewport" } : undefined,
    },
    popupRoleValue: getStaticAttributeValue(plan, popupPart, "role"),
    props: {
      closeOnEscape: getAdapterFamilyProp(getPlanProp(plan, closeOnEscapeProp!)),
      closeOnOutsideInteract: getAdapterFamilyProp(getPlanProp(plan, closeOnOutsideInteractProp!)),
      defaultOpen: getAdapterFamilyProp(getPlanProp(plan, defaultOpenProp)),
      modal: getAdapterFamilyProp(getPlanProp(plan, modalProp!)),
      open: getAdapterFamilyProp(getPlanProp(plan, openProp)),
      side: sideProp ? getAdapterFamilyProp(sideProp) : undefined,
      targetId: getAdapterFamilyProp(getPlanPropForTarget(plan, "targetId", "trigger")),
    },
    runtime: {
      factory: plan.runtime.factory,
      importSource: plan.runtime.importSource,
      setupFunction: `setup${pluralizeDisplayName(plan.displayName)}`,
      typeImportSource: getRuntimeTypeImportSource(plan),
    },
    sideDefault: sideProp?.defaultValue,
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

function getNativeOverlayPart(
  facts: AdapterNativeOverlayFacts,
  partName: AdapterNativeOverlayComponentProjection["part"],
) {
  const part = facts.parts[partName];
  if (!part) {
    throw new Error(`${facts.displayName} native overlay facts are missing ${partName} part.`);
  }

  return part;
}

function getNativeOverlayExportName(
  facts: AdapterNativeOverlayFacts,
  partName: AdapterNativeOverlayComponentProjection["part"],
): string {
  const exportName = facts.exports[partName];
  if (!exportName) {
    throw new Error(`${facts.displayName} native overlay facts are missing ${partName} export.`);
  }

  return exportName;
}

function toNativeOverlayPartName(
  value: string,
  message: string,
): AdapterNativeOverlayComponentProjection["part"] {
  if (
    value === "backdrop" ||
    value === "close" ||
    value === "description" ||
    value === "popup" ||
    value === "portal" ||
    value === "root" ||
    value === "title" ||
    value === "trigger" ||
    value === "viewport"
  ) {
    return value;
  }

  throw new Error(message);
}
