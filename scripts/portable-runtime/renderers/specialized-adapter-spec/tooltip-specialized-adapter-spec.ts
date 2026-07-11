import type { RuntimeAdapterContract } from "../../contracts/primitive/types.js";
import type {
  AdapterComponentFile,
  AdapterFamilyProp,
  AdapterOutputModel,
  AdapterTimedFloatingOverlayComponentProjection,
  AdapterTimedFloatingOverlayFacts,
} from "../framework-adapters/index.js";
import {
  buildBaseSpecializedAdapterSpec,
  validateSpecializedAdapterSpec,
} from "./base-specialized-adapter-spec.js";
import type { SpecializedAdapterSpec } from "./types.js";

export type TooltipSpecializedAdapterSpec = SpecializedAdapterSpec & {
  sourcePrimitiveContract: RuntimeAdapterContract;
  tooltip: {
    accessibility: TooltipAccessibilityRecipe;
    adapterKind: "timed-floating-overlay";
    anatomy: TooltipAnatomyRecipe[];
    asChildTrigger: TooltipAsChildTriggerRecipe;
    floating: NonNullable<SpecializedAdapterSpec["renderPlan"]["floating"]>;
    namespace: TooltipNamespaceRecipe;
    options: TooltipOptionsRecipe;
    presence: NonNullable<SpecializedAdapterSpec["renderPlan"]["presence"]>;
    runtimeBoundary: string[];
    stateControl: TooltipStateControlRecipe;
  };
};

type TooltipAccessibilityRecipe = {
  ariaDescription: {
    popupPart: "popup";
    relationship: "runtime-owned-aria-describedby";
    triggerPart: "trigger";
  };
  nonInteractivePopup: {
    part: "popup";
    runtimeBoundary: string[];
    tabIndex: "omitted";
  };
  popupRole: "tooltip";
};

type TooltipAnatomyRecipe = {
  defaultElement: string;
  discoveryAttribute: string;
  initialAttributes: string[];
  part: string;
  publicRef: boolean;
  role?: string;
};

type TooltipAsChildTriggerRecipe = {
  attribute: "data-as-child";
  merges: string[];
  part: "trigger";
  prop: "asChild";
  wrapperElement: "span";
};

type TooltipEventRecipe = {
  callbackProp: string;
  cancelable: boolean;
  detailsType: string;
  domEvent: string;
  emitsFrom: string;
  name: "openChange";
  valueProperty: string;
  valueType: string;
};

type TooltipNamespaceRecipe = {
  defaultExport: "Tooltip";
  defaultNamespace: boolean;
  memberParts: string[];
  namedExports: string[];
  namespace: "Tooltip";
  objectEntries: TooltipNamespaceObjectEntry[];
};

type TooltipNamespaceObjectEntry = {
  exportName: string;
  part: string;
  property: string;
};

type TooltipOptionsRecipe = {
  disabled: {
    defaultValue: string;
    prop: "disabled";
    rootAttribute: string;
    setter: string;
    triggerAttributes: {
      ariaDisabled: string;
      dataDisabled: string;
      nativeDisabled: string;
    };
    type: "boolean";
  };
  dismissal: {
    closeOnEscape: TooltipOptionAttributeRecipe<"closeOnEscape", "boolean">;
    closeOnOutsideInteract: TooltipOptionAttributeRecipe<"closeOnOutsideInteract", "boolean">;
    runtimeBoundary: "Runtime owns Escape and outside interaction dismissal.";
  };
  timing: {
    closeDelay: TooltipOptionAttributeRecipe<"closeDelay", "number">;
    disableHoverableContent: {
      contentHoverableAttribute: string;
      defaultValue: string;
      prop: "disableHoverableContent";
      type: "boolean";
    };
    openDelay: TooltipOptionAttributeRecipe<"openDelay", "number">;
    runtimeBoundary: "Runtime owns hover/focus timers and hoverable-content coordination.";
  };
};

type TooltipOptionAttributeRecipe<Prop extends string, Type extends string> = {
  attribute: string;
  defaultValue: string;
  prop: Prop;
  type: Type;
};

type TooltipSetterSyncRecipe = {
  disabled: {
    method: string;
    prop: string;
  };
  open: {
    method: string;
    options?: Record<string, unknown>;
    stateModel: "open";
    suppressesEmit: boolean;
  };
};

type TooltipStateControlRecipe = {
  event: TooltipEventRecipe;
  runtimeBoundary: string[];
  setterSync: TooltipSetterSyncRecipe;
  state: {
    controlledProp: string;
    defaultProp: string;
    getter: string;
    name: "open";
    setter: string;
    valueType: string;
  };
};

type TooltipRequiredState = SpecializedAdapterSpec["stateModels"][number] & {
  controlledProp: string;
  defaultProp: string;
  runtimeGetter: string;
  runtimeSetter: string;
  valueType: string;
};

type TooltipRequiredEvent = SpecializedAdapterSpec["events"][number] & {
  callbackProp: string;
  detailsType: string;
  domEvent: string;
  emitsFrom: string;
  valueProperty: string;
  valueType: string;
};

const TOOLTIP_ANATOMY_PARTS = [
  "root",
  "trigger",
  "portal",
  "positioner",
  "popup",
  "arrow",
] as const;
const TOOLTIP_NAMESPACE_OBJECT_PART_ORDER = [
  "root",
  "trigger",
  "portal",
  "positioner",
  "popup",
  "arrow",
] as const;
const TOOLTIP_NAMESPACE_NAMED_EXPORT_PART_ORDER = [
  "arrow",
  "popup",
  "portal",
  "positioner",
  "root",
  "trigger",
] as const;
const TOOLTIP_REQUIRED_PARTS = TOOLTIP_ANATOMY_PARTS;
const TOOLTIP_STATE_CONTROL_RUNTIME_BOUNDARY = [
  "Runtime owns hover/focus timing; adapters only project open state and event forwarding.",
  "Runtime owns delayed hide and cancellation; adapters only call setOpen for controlled resync.",
] as const;
const TOOLTIP_RUNTIME_BOUNDARY = [
  "hover/focus timing",
  "non-interactive content guardrails",
  "aria-describedby wiring",
  "hoverable-content coordination",
  "delayed hide and presence cleanup",
  "portal movement",
  "Floating UI auto-update",
  "Escape and outside interaction dismissal",
  "controller destroy cleanup",
] as const;
const TOOLTIP_NON_INTERACTIVE_POPUP_BOUNDARY = [
  "Runtime warns on interactive descendants.",
  "Adapters omit popup tabIndex and only project tooltip role.",
] as const;

export function buildTooltipSpecializedAdapterSpec(
  contract: RuntimeAdapterContract,
): TooltipSpecializedAdapterSpec {
  const spec = buildBaseSpecializedAdapterSpec(contract);
  if (spec.component !== "tooltip") {
    throw new Error(
      `${spec.displayName} cannot be rendered as the Tooltip specialized adapter spec.`,
    );
  }

  for (const part of TOOLTIP_REQUIRED_PARTS) {
    assertPart(spec, part);
  }

  if (!spec.renderPlan.floating) {
    throw new Error("Tooltip specialized adapter spec requires floating metadata.");
  }
  if (!spec.renderPlan.presence) {
    throw new Error("Tooltip specialized adapter spec requires presence metadata.");
  }

  return {
    ...spec,
    sourcePrimitiveContract: contract,
    tooltip: {
      accessibility: buildAccessibilityRecipe(spec),
      adapterKind: "timed-floating-overlay",
      anatomy: buildAnatomyRecipes(spec),
      asChildTrigger: buildAsChildTriggerRecipe(spec),
      floating: buildFloatingRecipe(spec),
      namespace: buildNamespaceRecipe(spec),
      options: buildOptionsRecipe(spec),
      presence: buildPresenceRecipe(spec),
      runtimeBoundary: [...TOOLTIP_RUNTIME_BOUNDARY],
      stateControl: buildStateControlRecipe(spec),
    },
  };
}

export function validateTooltipSpecializedAdapterSpec(
  spec: TooltipSpecializedAdapterSpec,
): string[] {
  const errors = validateSpecializedAdapterSpec(spec);
  if (!isRecord(spec) || spec.component !== "tooltip") {
    errors.push("Tooltip specialized adapter spec must target the tooltip primitive.");
    return errors;
  }

  const tooltip = isRecord(spec.tooltip) ? spec.tooltip : undefined;
  if (!tooltip) {
    errors.push("Tooltip specialized adapter spec is missing tooltip metadata.");
    return errors;
  }

  if (tooltip.adapterKind !== "timed-floating-overlay") {
    errors.push('Tooltip specialized adapter spec adapterKind must be "timed-floating-overlay".');
  }

  const expectedFields = new Set([
    "accessibility",
    "adapterKind",
    "anatomy",
    "asChildTrigger",
    "floating",
    "namespace",
    "options",
    "presence",
    "runtimeBoundary",
    "stateControl",
  ]);
  for (const field of Object.keys(tooltip)) {
    if (field === "dismissalAlgorithms" || field === "hoverFocusTimers") {
      errors.push(
        `Tooltip specialized adapter spec must not declare tooltip.${field}; keep Runtime-owned behavior in Runtime controllers.`,
      );
      continue;
    }

    if (!expectedFields.has(field)) {
      errors.push(`Tooltip specialized adapter spec must not declare unexpected field "${field}".`);
    }
  }

  for (const part of TOOLTIP_REQUIRED_PARTS) {
    if (!hasPart(spec, part)) {
      errors.push(`Tooltip specialized adapter spec requires ${part} part.`);
    }
  }

  errors.push(...validateAnatomy(spec, tooltip.anatomy));
  errors.push(...validateAccessibility(spec, tooltip.accessibility));
  errors.push(...validateAsChildTrigger(spec, tooltip.asChildTrigger));
  errors.push(...validateFloating(spec, tooltip.floating));
  errors.push(...validateNamespace(spec, tooltip.namespace));
  errors.push(...validateOptions(spec, tooltip.options));
  errors.push(...validatePresence(spec, tooltip.presence));
  errors.push(...validateStateControl(spec, tooltip.stateControl));


  if (!arraysEqual(asArray(tooltip.runtimeBoundary), TOOLTIP_RUNTIME_BOUNDARY)) {
    errors.push(
      "Tooltip specialized adapter spec runtimeBoundary must match Runtime-owned behavior.",
    );
  }

  return errors;
}

export function buildTooltipAdapterOutputModel(
  spec: TooltipSpecializedAdapterSpec,
): AdapterOutputModel {
  assertValidTooltipAdapterOutputModelSpec(spec);

  const facts = getTooltipTimedFloatingOverlayFacts(spec);
  const files: AdapterOutputModel["files"] = [
    createTooltipComponentFile(spec, "root", facts),
    createTooltipComponentFile(spec, "trigger", facts),
    createTooltipComponentFile(spec, "portal", facts),
    createTooltipComponentFile(spec, "positioner", facts),
    createTooltipComponentFile(spec, "popup", facts),
    createTooltipComponentFile(spec, "arrow", facts),
    {
      exports: {
        kind: "namespace",
        members: facts.index.importMembers,
        namespace: facts.exports.namespace,
      },
      family: { facts, kind: "timed-floating-overlay" },
      imports: [],
      kind: "index",
      path: `${spec.component}/index.ts`,
      typeFacades: [],
    },
  ];

  return { files };
}

function createTooltipComponentFile(
  spec: TooltipSpecializedAdapterSpec,
  partName: AdapterTimedFloatingOverlayComponentProjection["part"],
  facts: AdapterTimedFloatingOverlayFacts,
): AdapterComponentFile {
  const part = facts.parts[partName];
  const exportName = facts.exports[partName];
  if (!part || !exportName) {
    throw new Error(
      `Tooltip specialized adapter spec output model requires ${partName} part and export.`,
    );
  }

  return {
    component: {
      context: [],
      defaults: [],
      displayName: `${facts.displayName}.${part.namespaceKey}`,
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
      family: { facts, kind: "timed-floating-overlay", part: partName },
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
                facts.props.closeDelay,
                facts.props.closeOnEscape,
                facts.props.closeOnOutsideInteract,
                facts.props.disabled,
                facts.props.disableHoverableContent,
                facts.props.openDelay,
              ].map((prop) => ({ name: prop.name, source: "prop" })),
              rootRef: "rootRef",
            }
          : undefined,
      name: exportName,
      portals: [],
      props: getTooltipComponentProps(partName, facts),
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
                setter: facts.setters.open.method,
                state: facts.state.name,
                valueProp: facts.props.open.name,
              },
            ]
          : [],
      typeFacades: [],
    },
    kind: "component",
    path: `${spec.component}/${exportName}`,
  };
}

function getTooltipComponentProps(
  partName: AdapterTimedFloatingOverlayComponentProjection["part"],
  facts: AdapterTimedFloatingOverlayFacts,
) {
  if (partName === "root") {
    return [
      facts.props.defaultOpen,
      facts.props.open,
      facts.props.closeDelay,
      facts.props.closeOnEscape,
      facts.props.closeOnOutsideInteract,
      facts.props.disabled,
      facts.props.disableHoverableContent,
      facts.props.openDelay,
    ].map(toUnknownAdapterProp);
  }

  if (partName === "trigger") {
    return [facts.props.asChild, facts.props.disabled].map(toUnknownAdapterProp);
  }

  if (partName === "positioner" || partName === "popup") {
    return [
      facts.props.side,
      facts.props.align,
      facts.props.sideOffset,
      facts.props.avoidCollisions,
    ].map(toUnknownAdapterProp);
  }

  return [];
}

function getTooltipTimedFloatingOverlayFacts(
  spec: TooltipSpecializedAdapterSpec,
): AdapterTimedFloatingOverlayFacts {
  const portalPart = getRequiredValue(spec.tooltip.floating.portalPart, "floating portal part");
  const anatomy = {
    arrow: getTooltipAnatomyPart(spec, "arrow"),
    popup: getTooltipAnatomyPart(spec, spec.tooltip.floating.popupPart),
    portal: getTooltipAnatomyPart(spec, portalPart),
    positioner: getTooltipAnatomyPart(spec, spec.tooltip.floating.positionerPart),
    root: getTooltipAnatomyPart(spec, "root"),
    trigger: getTooltipAnatomyPart(spec, "trigger"),
  };
  for (const partName of spec.tooltip.namespace.memberParts) {
    getTooltipSpecFileBasename(spec, partName);
    assertTooltipPublicRef(spec, partName);
  }

  const state = spec.tooltip.stateControl.state;
  const event = spec.tooltip.stateControl.event;
  const options = spec.tooltip.options;
  const entriesByPart = new Map(
    spec.tooltip.namespace.objectEntries.map((entry) => [entry.part, entry]),
  );
  const parts = {
    arrow: getTooltipTimedFloatingPart(spec, anatomy.arrow.part),
    popup: getTooltipTimedFloatingPart(spec, anatomy.popup.part),
    portal: getTooltipTimedFloatingPart(spec, anatomy.portal.part),
    positioner: getTooltipTimedFloatingPart(spec, anatomy.positioner.part),
    root: getTooltipTimedFloatingPart(spec, anatomy.root.part),
    trigger: getTooltipTimedFloatingPart(spec, anatomy.trigger.part),
  };
  const props = {
    align: getAdapterFamilyProp(getProp(spec, "align")),
    asChild: getAdapterFamilyProp(getProp(spec, spec.tooltip.asChildTrigger.prop)),
    avoidCollisions: getAdapterFamilyProp(getProp(spec, "avoidCollisions")),
    closeDelay: getAdapterFamilyProp(getProp(spec, options.timing.closeDelay.prop)),
    closeOnEscape: getAdapterFamilyProp(getProp(spec, options.dismissal.closeOnEscape.prop)),
    closeOnOutsideInteract: getAdapterFamilyProp(
      getProp(spec, options.dismissal.closeOnOutsideInteract.prop),
    ),
    defaultOpen: getAdapterFamilyProp(getProp(spec, state.defaultProp)),
    disabled: getAdapterFamilyProp(getProp(spec, options.disabled.prop)),
    disableHoverableContent: getAdapterFamilyProp(
      getProp(spec, options.timing.disableHoverableContent.prop),
    ),
    open: getAdapterFamilyProp(getProp(spec, state.controlledProp)),
    openDelay: getAdapterFamilyProp(getProp(spec, options.timing.openDelay.prop)),
    side: getAdapterFamilyProp(getProp(spec, "side")),
    sideOffset: getAdapterFamilyProp(getProp(spec, "sideOffset")),
  };

  return {
    attrs: {
      align: getTooltipFloatingAttribute(spec, props.align.name, "data-align"),
      arrow: anatomy.arrow.discoveryAttribute,
      arrowState: getStaticAttributeName(spec, anatomy.arrow.part, "data-state"),
      avoidCollisions: getTooltipFloatingAttribute(
        spec,
        props.avoidCollisions.name,
        "data-avoid-collisions",
      ),
      popup: anatomy.popup.discoveryAttribute,
      popupHidden: getStaticAttributeName(spec, anatomy.popup.part, "hidden"),
      popupState: getStaticAttributeName(spec, anatomy.popup.part, "data-state"),
      portal: anatomy.portal.discoveryAttribute,
      positioner: anatomy.positioner.discoveryAttribute,
      positionerState: getStaticAttributeName(spec, anatomy.positioner.part, "data-state"),
      root: anatomy.root.discoveryAttribute,
      rootCloseDelay: options.timing.closeDelay.attribute,
      rootCloseOnEscape: options.dismissal.closeOnEscape.attribute,
      rootCloseOnOutsideInteract: options.dismissal.closeOnOutsideInteract.attribute,
      rootContentHoverable: options.timing.disableHoverableContent.contentHoverableAttribute,
      rootDefaultOpen: getRequiredValue(
        getRequiredState(spec, state.name).initialAttribute,
        `${state.name} initial attribute`,
      ),
      rootDisabled: options.disabled.rootAttribute,
      rootOpenDelay: options.timing.openDelay.attribute,
      rootState: getStaticAttributeName(spec, anatomy.root.part, "data-state"),
      side: getTooltipFloatingAttribute(spec, props.side.name, "data-side"),
      sideOffset: getTooltipFloatingAttribute(spec, props.sideOffset.name, "data-side-offset"),
      trigger: anatomy.trigger.discoveryAttribute,
      triggerAriaDisabled: options.disabled.triggerAttributes.ariaDisabled,
      triggerAsChild: spec.tooltip.asChildTrigger.attribute,
      triggerDisabled: options.disabled.triggerAttributes.dataDisabled,
      triggerNativeDisabled: options.disabled.triggerAttributes.nativeDisabled,
      triggerState: getStaticAttributeName(spec, anatomy.trigger.part, "data-state"),
    },
    displayName: spec.displayName,
    event,
    exports: {
      arrow: getTooltipSpecFileBasename(spec, "arrow"),
      namespace: spec.tooltip.namespace.namespace,
      popup: getTooltipSpecFileBasename(spec, "popup"),
      portal: getTooltipSpecFileBasename(spec, portalPart),
      positioner: getTooltipSpecFileBasename(spec, spec.tooltip.floating.positionerPart),
      root: getTooltipSpecFileBasename(spec, "root"),
      trigger: getTooltipSpecFileBasename(spec, "trigger"),
    },
    index: {
      importMembers: spec.tooltip.namespace.namedExports
        .filter((exportName) => exportName !== spec.tooltip.namespace.defaultExport)
        .map((exportName) => {
          const entry = spec.tooltip.namespace.objectEntries.find(
            (candidate) => candidate.exportName === exportName,
          );
          if (!entry) {
            throw new Error(
              `Tooltip specialized adapter spec output model requires ${exportName} namespace entry.`,
            );
          }

          return { from: `./${exportName}`, name: exportName };
        }),
      namespaceMembers: spec.tooltip.namespace.objectEntries.map((entry) => ({
        key: entry.property,
        name: entry.exportName,
      })),
      typeExports: [event.detailsType],
    },
    parts,
    popup: {
      omitTabIndexProps: true,
    },
    popupRole: spec.tooltip.accessibility.popupRole,
    props,
    root: {
      disabled: true,
    },
    runtime: {
      factory: spec.root.runtimeFactory,
      importSource: spec.root.runtimeImportSource,
      setupFunction: `setup${spec.displayName}s`,
      typeImportSource: "@starwind-ui/runtime",
    },
    setters: {
      disabled: {
        method: spec.tooltip.stateControl.setterSync.disabled.method,
      },
      open: {
        method: spec.tooltip.stateControl.setterSync.open.method,
        options: getBooleanNumberStringOptions(spec.tooltip.stateControl.setterSync.open.options),
      },
    },
    state: {
      getter: state.getter,
      name: state.name,
      valueType: state.valueType,
    },
    trigger: {
      asChildWrapperElement: spec.tooltip.asChildTrigger.wrapperElement,
      clickGuardWhenDisabled: false,
      delayOverrides: false,
      disabledNavigation: false,
      renderedElement: anatomy.trigger.defaultElement,
      triggerKind: "button",
    },
  };

  function getTooltipTimedFloatingPart(
    currentSpec: TooltipSpecializedAdapterSpec,
    partName: string,
  ) {
    const part = getPart(currentSpec, partName);
    const namespaceEntry = entriesByPart.get(partName);
    if (!namespaceEntry) {
      throw new Error(
        `Tooltip specialized adapter spec output model requires ${partName} namespace entry.`,
      );
    }

    return {
      defaultElement: part.defaultElement,
      discoveryAttribute: part.discoveryAttribute,
      name: part.name,
      namespaceKey: namespaceEntry.property,
      role: part.role,
    };
  }
}

function assertValidTooltipAdapterOutputModelSpec(spec: TooltipSpecializedAdapterSpec): void {
  const errors = validateTooltipSpecializedAdapterSpec(spec);
  if (errors.length > 0) {
    throw new Error(
      `Tooltip Adapter Output Model cannot build from invalid Tooltip spec:\n${errors.join("\n")}`,
    );
  }
}

function buildAccessibilityRecipe(spec: SpecializedAdapterSpec): TooltipAccessibilityRecipe {
  const popup = getPart(spec, "popup");

  return {
    ariaDescription: {
      relationship: "runtime-owned-aria-describedby",
      popupPart: "popup",
      triggerPart: "trigger",
    },
    nonInteractivePopup: {
      part: "popup",
      runtimeBoundary: [...TOOLTIP_NON_INTERACTIVE_POPUP_BOUNDARY],
      tabIndex: "omitted",
    },
    popupRole: popup.role === "tooltip" ? popup.role : "tooltip",
  };
}

function buildAnatomyRecipes(spec: SpecializedAdapterSpec): TooltipAnatomyRecipe[] {
  return TOOLTIP_ANATOMY_PARTS.map((partName) => {
    const part = getPart(spec, partName);

    return {
      defaultElement: part.defaultElement,
      discoveryAttribute: part.discoveryAttribute,
      initialAttributes: getInitialAttributeNames(spec, partName),
      part: part.name,
      publicRef: hasPublicRef(spec, partName),
      role: part.role,
    };
  });
}

function buildAsChildTriggerRecipe(spec: SpecializedAdapterSpec): TooltipAsChildTriggerRecipe {
  const asChild = getAsChild(spec, "trigger");

  return {
    attribute: "data-as-child",
    merges: [...asChild.merges],
    part: "trigger",
    prop: "asChild",
    wrapperElement: "span",
  };
}

function buildFloatingRecipe(
  spec: SpecializedAdapterSpec,
): NonNullable<SpecializedAdapterSpec["renderPlan"]["floating"]> {
  return {
    anchorPart: getRequiredFloatingPart(spec, "anchorPart"),
    optionProps: [...getRequiredValue(spec.renderPlan.floating?.optionProps, "floating options")],
    popupPart: getRequiredFloatingPart(spec, "popupPart"),
    portalPart: getRequiredFloatingPart(spec, "portalPart"),
    positionerPart: getRequiredFloatingPart(spec, "positionerPart"),
  };
}

function buildNamespaceRecipe(spec: SpecializedAdapterSpec): TooltipNamespaceRecipe {
  const membersByPart = new Map(spec.exports.members.map((member) => [member.part, member]));
  const objectEntries = TOOLTIP_NAMESPACE_OBJECT_PART_ORDER.map((part) => {
    const member = membersByPart.get(part);
    if (!member) {
      throw new Error(`Tooltip specialized adapter spec requires ${part} namespace export.`);
    }

    return {
      exportName: member.name,
      part,
      property: toPascalCase(part),
    };
  });

  return {
    defaultExport: "Tooltip",
    defaultNamespace: spec.exports.defaultNamespace,
    memberParts: objectEntries.map((entry) => entry.part),
    namedExports: [
      "Tooltip",
      ...TOOLTIP_NAMESPACE_NAMED_EXPORT_PART_ORDER.map((part) => {
        const member = membersByPart.get(part);
        if (!member) {
          throw new Error(`Tooltip specialized adapter spec requires ${part} named export.`);
        }

        return member.name;
      }),
    ],
    namespace: "Tooltip",
    objectEntries,
  };
}

function buildOptionsRecipe(spec: SpecializedAdapterSpec): TooltipOptionsRecipe {
  return {
    disabled: {
      defaultValue: getPropDefault(spec, "disabled"),
      prop: "disabled",
      rootAttribute: getStaticAttributeName(spec, "root", "data-disabled"),
      setter: "setDisabled",
      triggerAttributes: {
        ariaDisabled: getStaticAttributeName(spec, "trigger", "aria-disabled"),
        dataDisabled: getStaticAttributeName(spec, "trigger", "data-disabled"),
        nativeDisabled: getStaticAttributeName(spec, "trigger", "disabled"),
      },
      type: getPropType(spec, "disabled") as "boolean",
    },
    dismissal: {
      closeOnEscape: {
        attribute: getStaticAttributeName(spec, "root", "data-close-on-escape"),
        defaultValue: getPropDefault(spec, "closeOnEscape"),
        prop: "closeOnEscape",
        type: getPropType(spec, "closeOnEscape") as "boolean",
      },
      closeOnOutsideInteract: {
        attribute: getStaticAttributeName(spec, "root", "data-close-on-outside-interact"),
        defaultValue: getPropDefault(spec, "closeOnOutsideInteract"),
        prop: "closeOnOutsideInteract",
        type: getPropType(spec, "closeOnOutsideInteract") as "boolean",
      },
      runtimeBoundary: "Runtime owns Escape and outside interaction dismissal.",
    },
    timing: {
      closeDelay: {
        attribute: getStaticAttributeName(spec, "root", "data-close-delay"),
        defaultValue: getPropDefault(spec, "closeDelay"),
        prop: "closeDelay",
        type: getPropType(spec, "closeDelay") as "number",
      },
      disableHoverableContent: {
        contentHoverableAttribute: getStaticAttributeName(spec, "root", "data-content-hoverable"),
        defaultValue: getPropDefault(spec, "disableHoverableContent"),
        prop: "disableHoverableContent",
        type: getPropType(spec, "disableHoverableContent") as "boolean",
      },
      openDelay: {
        attribute: getStaticAttributeName(spec, "root", "data-open-delay"),
        defaultValue: getPropDefault(spec, "openDelay"),
        prop: "openDelay",
        type: getPropType(spec, "openDelay") as "number",
      },
      runtimeBoundary: "Runtime owns hover/focus timers and hoverable-content coordination.",
    },
  };
}

function buildPresenceRecipe(
  spec: SpecializedAdapterSpec,
): NonNullable<SpecializedAdapterSpec["renderPlan"]["presence"]> {
  return {
    initialHiddenParts: [
      ...getRequiredValue(spec.renderPlan.presence?.initialHiddenParts, "presence"),
    ],
    unmountPolicy: getRequiredValue(spec.renderPlan.presence?.unmountPolicy, "presence policy"),
  };
}

function buildStateControlRecipe(spec: SpecializedAdapterSpec): TooltipStateControlRecipe {
  const openState = getRequiredState(spec, "open");
  const openEvent = getRequiredEvent(spec, "openChange");
  const openSetter = getStateSetter(spec, "open");
  const disabledSetter = getPropSetter(spec, "disabled");

  return {
    event: {
      callbackProp: openEvent.callbackProp,
      cancelable: openEvent.cancelable === true,
      detailsType: openEvent.detailsType,
      domEvent: openEvent.domEvent,
      emitsFrom: openEvent.emitsFrom,
      name: "openChange",
      valueProperty: openEvent.valueProperty,
      valueType: openEvent.valueType,
    },
    runtimeBoundary: [...TOOLTIP_STATE_CONTROL_RUNTIME_BOUNDARY],
    setterSync: {
      disabled: {
        method: disabledSetter.method,
        prop: getRequiredValue(disabledSetter.prop, "disabled setter prop"),
      },
      open: {
        method: openSetter.method,
        options: { ...(openSetter.options ?? { emit: false }) },
        stateModel: "open",
        suppressesEmit: openSetter.suppressesEmit === true,
      },
    },
    state: {
      controlledProp: openState.controlledProp,
      defaultProp: openState.defaultProp,
      getter: openState.runtimeGetter,
      name: "open",
      setter: openState.runtimeSetter,
      valueType: openState.valueType,
    },
  };
}

function validateAccessibility(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Tooltip specialized adapter spec requires accessibility metadata."];
  }

  const errors: string[] = [];
  if (value.popupRole !== "tooltip" || getPart(spec, "popup").role !== "tooltip") {
    errors.push('Tooltip specialized adapter spec popupRole must be "tooltip".');
  }

  if (!isRecord(value.ariaDescription)) {
    errors.push("Tooltip specialized adapter spec requires aria description boundary metadata.");
  } else if (
    value.ariaDescription.relationship !== "runtime-owned-aria-describedby" ||
    value.ariaDescription.triggerPart !== "trigger" ||
    value.ariaDescription.popupPart !== "popup"
  ) {
    errors.push("Tooltip specialized adapter spec ariaDescription must stay Runtime-owned.");
  }

  if (!isRecord(value.nonInteractivePopup)) {
    errors.push("Tooltip specialized adapter spec requires non-interactive popup metadata.");
  } else {
    if (value.nonInteractivePopup.tabIndex !== "omitted") {
      errors.push("Tooltip specialized adapter spec popup must omit tabIndex metadata.");
    }
    if (
      !arraysEqual(
        asArray(value.nonInteractivePopup.runtimeBoundary),
        TOOLTIP_NON_INTERACTIVE_POPUP_BOUNDARY,
      )
    ) {
      errors.push(
        "Tooltip specialized adapter spec nonInteractivePopup runtimeBoundary must match Runtime-owned behavior.",
      );
    }
  }

  if (
    hasStaticAttribute(spec, "popup", "tabIndex") ||
    hasStaticAttribute(spec, "popup", "tabindex")
  ) {
    errors.push("Tooltip specialized adapter spec popup must omit tabIndex metadata.");
  }

  return errors;
}

function validateAnatomy(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!Array.isArray(value)) {
    return ["Tooltip specialized adapter spec requires anatomy metadata."];
  }

  const errors: string[] = [];
  if (
    !arraysEqual(
      value.map((part) => (isRecord(part) ? part.part : undefined)),
      TOOLTIP_ANATOMY_PARTS,
    )
  ) {
    errors.push(
      "Tooltip specialized adapter spec anatomy must match root, trigger, portal, positioner, popup, arrow.",
    );
  }

  for (const partName of TOOLTIP_ANATOMY_PARTS) {
    const recipe = value.find((part) => isRecord(part) && part.part === partName);
    if (!isRecord(recipe)) {
      errors.push(`Tooltip specialized adapter spec requires ${partName} anatomy part.`);
      continue;
    }

    const part = getPart(spec, partName);
    if (recipe.defaultElement !== part.defaultElement) {
      errors.push(
        `Tooltip specialized adapter spec ${partName} defaultElement must match contract.`,
      );
    }
    if (recipe.discoveryAttribute !== part.discoveryAttribute) {
      errors.push(
        `Tooltip specialized adapter spec ${partName} discoveryAttribute must match contract.`,
      );
    }
    if (!arraysEqual(asArray(recipe.initialAttributes), getInitialAttributeNames(spec, partName))) {
      errors.push(
        `Tooltip specialized adapter spec ${partName} initialAttributes must match contract.`,
      );
    }
    if (recipe.publicRef !== hasPublicRef(spec, partName)) {
      errors.push(`Tooltip specialized adapter spec ${partName} publicRef must match contract.`);
    }
  }

  return errors;
}

function validateAsChildTrigger(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Tooltip specialized adapter spec requires asChildTrigger metadata."];
  }

  const asChild = getAsChild(spec, "trigger");
  const errors: string[] = [];
  if (
    value.part !== "trigger" ||
    value.prop !== "asChild" ||
    value.attribute !== "data-as-child" ||
    value.wrapperElement !== "span" ||
    !arraysEqual(asArray(value.merges), asChild.merges)
  ) {
    errors.push("Tooltip specialized adapter spec trigger asChild metadata must match contract.");
  }

  return errors;
}

function validateFloating(spec: SpecializedAdapterSpec, value: unknown): string[] {
  const expected = buildFloatingRecipe(spec);
  if (!isRecord(value)) {
    return ["Tooltip specialized adapter spec requires floating metadata."];
  }

  const errors: string[] = [];
  if (!recordsEqual(value, expected)) {
    errors.push(
      "Tooltip specialized adapter spec floating metadata must match Runtime floating boundary.",
    );
  }

  return errors;
}

function validateNamespace(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Tooltip specialized adapter spec requires namespace metadata."];
  }

  const expected = buildNamespaceRecipe(spec);
  const errors: string[] = [];
  if (value.defaultExport !== expected.defaultExport || value.namespace !== expected.namespace) {
    errors.push("Tooltip specialized adapter spec namespace default export must be Tooltip.");
  }
  if (value.defaultNamespace !== true) {
    errors.push("Tooltip specialized adapter spec namespace must keep defaultNamespace enabled.");
  }
  if (!arraysEqual(asArray(value.memberParts), expected.memberParts)) {
    errors.push(
      "Tooltip specialized adapter spec namespace memberParts must match generated export order.",
    );
  }
  if (!arraysEqual(asArray(value.namedExports), expected.namedExports)) {
    errors.push(
      "Tooltip specialized adapter spec namespace namedExports must match generated export order.",
    );
  }
  if (!recordsArrayEqual(asArray(value.objectEntries), expected.objectEntries)) {
    errors.push(
      "Tooltip specialized adapter spec namespace objectEntries must match generated export order.",
    );
  }

  return errors;
}

function validateOptions(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Tooltip specialized adapter spec requires option metadata."];
  }

  const expected = buildOptionsRecipe(spec);
  return recordsEqual(value, expected)
    ? []
    : [
        "Tooltip specialized adapter spec option metadata must match contract timing, disabled, and dismissal facts.",
      ];
}

function validatePresence(spec: SpecializedAdapterSpec, value: unknown): string[] {
  const expected = buildPresenceRecipe(spec);
  if (!isRecord(value)) {
    return ["Tooltip specialized adapter spec requires presence metadata."];
  }

  return recordsEqual(value, expected)
    ? []
    : [
        "Tooltip specialized adapter spec presence metadata must match Runtime-owned hidden popup facts.",
      ];
}

function validateStateControl(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Tooltip specialized adapter spec requires stateControl metadata."];
  }

  const errors: string[] = [];
  const openState = spec.stateModels.find((state) => state.name === "open");
  const openEvent = spec.events.find((event) => event.name === "openChange");
  if (!openState) {
    errors.push("Tooltip specialized adapter spec requires open state metadata.");
  }
  if (!openEvent) {
    errors.push("Tooltip specialized adapter spec requires openChange event metadata.");
  }

  if (openState && openEvent && !recordsEqual(value, buildStateControlRecipe(spec))) {
    errors.push(
      "Tooltip specialized adapter spec stateControl metadata must match contract state/event/setter facts.",
    );
  }

  return errors;
}

function assertPart(spec: SpecializedAdapterSpec, partName: string): void {
  if (!hasPart(spec, partName)) {
    throw new Error(`Tooltip specialized adapter spec requires ${partName} part.`);
  }
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function arraysEqual(actual: readonly unknown[], expected: readonly unknown[]): boolean {
  return (
    actual.length === expected.length && actual.every((value, index) => value === expected[index])
  );
}

function getAsChild(spec: SpecializedAdapterSpec, partName: string) {
  const asChild = spec.asChild.find((candidate) => candidate.part === partName);
  if (!asChild) {
    throw new Error(`Tooltip specialized adapter spec requires ${partName} asChild metadata.`);
  }

  return asChild;
}

function getInitialAttributeNames(spec: SpecializedAdapterSpec, partName: string): string[] {
  return spec.renderPlan.staticAttributes
    .filter((attribute) => attribute.part === partName)
    .map((attribute) => attribute.name);
}

function getPart(spec: SpecializedAdapterSpec, partName: string) {
  const part = spec.parts.find((candidate) => candidate.name === partName);
  if (!part) {
    throw new Error(`Tooltip specialized adapter spec requires ${partName} part.`);
  }

  return part;
}

function getTooltipAnatomyPart(spec: TooltipSpecializedAdapterSpec, partName: string) {
  const part = spec.tooltip.anatomy.find((candidate) => candidate.part === partName);
  if (!part) {
    throw new Error(
      `Tooltip specialized adapter spec output model requires ${partName} anatomy recipe.`,
    );
  }

  return part;
}

function getTooltipFloatingAttribute(
  spec: TooltipSpecializedAdapterSpec,
  propName: string,
  attributeName: string,
): string {
  if (!spec.tooltip.floating.optionProps.includes(propName)) {
    throw new Error(
      `Tooltip specialized adapter spec output model requires ${propName} floating option.`,
    );
  }

  const positionerAttribute = getStaticAttributeName(
    spec,
    spec.tooltip.floating.positionerPart,
    attributeName,
  );
  getStaticAttributeName(spec, spec.tooltip.floating.popupPart, attributeName);

  return positionerAttribute;
}

function getTooltipSpecFileBasename(
  spec: TooltipSpecializedAdapterSpec,
  partName: string,
): string {
  const file = spec.files.find(
    (candidate) => candidate.kind === "part" && candidate.part === partName,
  );
  if (!file || file.kind !== "part") {
    throw new Error(
      `Tooltip specialized adapter spec output model requires ${partName} part file.`,
    );
  }

  const expectedPath = `${spec.component}/${file.exportName}`;
  if (file.path !== expectedPath) {
    throw new Error(
      `Tooltip specialized adapter spec output model requires ${partName} file path ${expectedPath}.`,
    );
  }

  return file.exportName;
}

function assertTooltipPublicRef(spec: TooltipSpecializedAdapterSpec, partName: string): void {
  if (!hasPublicRef(spec, partName)) {
    throw new Error(
      `Tooltip specialized adapter spec output model requires ${partName} public ref.`,
    );
  }
}

function getAdapterFamilyProp(prop: ReturnType<typeof getProp>): AdapterFamilyProp {
  return {
    defaultValue: prop.defaultValue,
    name: prop.name,
    required: prop.required,
    type: prop.type,
  };
}

function getBooleanNumberStringOptions(
  options: Record<string, unknown> | undefined,
): Record<string, boolean | number | string> | undefined {
  if (!options) return undefined;

  return Object.fromEntries(
    Object.entries(options).filter(
      (entry): entry is [string, boolean | number | string] =>
        typeof entry[1] === "boolean" ||
        typeof entry[1] === "number" ||
        typeof entry[1] === "string",
    ),
  );
}

function getPropDefault(spec: SpecializedAdapterSpec, propName: string): string {
  return getRequiredValue(getProp(spec, propName).defaultValue, `${propName} defaultValue`);
}

function getProp(spec: SpecializedAdapterSpec, propName: string) {
  const prop = spec.props.find((candidate) => candidate.name === propName);
  if (!prop) {
    throw new Error(`Tooltip specialized adapter spec requires ${propName} prop metadata.`);
  }

  return prop;
}

function getPropSetter(spec: SpecializedAdapterSpec, propName: string) {
  const setter = spec.setterSync.find(
    (candidate) => "prop" in candidate && candidate.prop === propName,
  );
  if (!setter || !("prop" in setter)) {
    throw new Error(`Tooltip specialized adapter spec requires ${propName} setter metadata.`);
  }

  return setter;
}

function getPropType(spec: SpecializedAdapterSpec, propName: string): string {
  return getProp(spec, propName).type;
}

function getRequiredEvent(spec: SpecializedAdapterSpec, eventName: string): TooltipRequiredEvent {
  const event = spec.events.find((candidate) => candidate.name === eventName);
  if (!event?.detailsType || !event.domEvent || !event.valueProperty || !event.valueType) {
    throw new Error(`Tooltip specialized adapter spec requires ${eventName} event metadata.`);
  }

  return event as TooltipRequiredEvent;
}

function getRequiredFloatingPart(
  spec: SpecializedAdapterSpec,
  field: keyof NonNullable<SpecializedAdapterSpec["renderPlan"]["floating"]>,
): string {
  const value = spec.renderPlan.floating?.[field];
  if (typeof value !== "string") {
    throw new Error(
      `Tooltip specialized adapter spec requires floating ${String(field)} metadata.`,
    );
  }

  return value;
}

function getRequiredState(spec: SpecializedAdapterSpec, stateName: string): TooltipRequiredState {
  const state = spec.stateModels.find((candidate) => candidate.name === stateName);
  if (
    !state?.controlledProp ||
    !state.defaultProp ||
    !state.runtimeGetter ||
    !state.runtimeSetter
  ) {
    throw new Error(`Tooltip specialized adapter spec requires ${stateName} state metadata.`);
  }

  return state as TooltipRequiredState;
}

function getRequiredValue<T>(value: T | undefined, context: string): T {
  if (value === undefined) {
    throw new Error(`Tooltip specialized adapter spec requires ${context}.`);
  }

  return value;
}

function getStateSetter(spec: SpecializedAdapterSpec, stateModel: string) {
  const setter = spec.setterSync.find(
    (candidate) => "stateModel" in candidate && candidate.stateModel === stateModel,
  );
  if (!setter || !("stateModel" in setter)) {
    throw new Error(`Tooltip specialized adapter spec requires ${stateModel} setter metadata.`);
  }

  return setter;
}

function getStaticAttributeName(
  spec: SpecializedAdapterSpec,
  partName: string,
  name: string,
): string {
  const attribute = spec.renderPlan.staticAttributes.find(
    (candidate) => candidate.part === partName && candidate.name === name,
  );
  if (!attribute) {
    throw new Error(`Tooltip specialized adapter spec requires ${name} metadata for ${partName}.`);
  }

  return attribute.name;
}

function hasPart(spec: SpecializedAdapterSpec, partName: string): boolean {
  return spec.parts.some((part) => part.name === partName);
}

function hasPublicRef(spec: SpecializedAdapterSpec, partName: string): boolean {
  return spec.refs.some((ref) => ref.part === partName && ref.public);
}

function hasStaticAttribute(spec: SpecializedAdapterSpec, partName: string, name: string): boolean {
  return spec.renderPlan.staticAttributes.some(
    (attribute) => attribute.part === partName && attribute.name === name,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function recordsArrayEqual(actual: unknown[], expected: unknown[]): boolean {
  return (
    actual.length === expected.length &&
    actual.every((entry, index) => recordsEqual(entry, expected[index]))
  );
}

function recordsEqual(actual: unknown, expected: unknown): boolean {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function toUnknownAdapterProp(prop: AdapterFamilyProp) {
  return { kind: "unknown" as const, name: prop.name, type: prop.type };
}

function toPascalCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((segment) => `${segment[0].toUpperCase()}${segment.slice(1)}`)
    .join("");
}
