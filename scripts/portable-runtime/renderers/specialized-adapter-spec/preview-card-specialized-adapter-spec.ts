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

export type PreviewCardSpecializedAdapterSpec = SpecializedAdapterSpec & {
  sourcePrimitiveContract: RuntimeAdapterContract;
  previewCard: {
    adapterKind: "timed-floating-overlay";
    anatomy: PreviewCardAnatomyRecipe[];
    floating: NonNullable<SpecializedAdapterSpec["renderPlan"]["floating"]>;
    namespace: PreviewCardNamespaceRecipe;
    optionalOverlayParts: PreviewCardOptionalOverlayPartRecipe[];
    options: PreviewCardOptionsRecipe;
    presence: NonNullable<SpecializedAdapterSpec["renderPlan"]["presence"]>;
    runtimeBoundary: string[];
    stateControl: PreviewCardStateControlRecipe;
    triggerProjection: PreviewCardTriggerProjectionRecipe;
  };
};

type PreviewCardAnatomyRecipe = {
  defaultElement: string;
  discoveryAttribute: string;
  initialAttributes: string[];
  part: string;
  publicRef: boolean;
  role?: string;
};

type PreviewCardEventRecipe = {
  callbackProp: string;
  cancelable: boolean;
  detailsType: string;
  domEvent: string;
  emitsFrom: string;
  name: "openChange";
  valueProperty: string;
  valueType: string;
};

type PreviewCardNamespaceRecipe = {
  defaultExport: "PreviewCard";
  defaultNamespace: boolean;
  memberParts: string[];
  namedExports: string[];
  namespace: "PreviewCard";
  objectEntries: PreviewCardNamespaceObjectEntry[];
};

type PreviewCardNamespaceObjectEntry = {
  exportName: string;
  part: string;
  property: string;
};

type PreviewCardOptionAttributeRecipe<Prop extends string, Type extends string> = {
  attribute: string;
  defaultValue: string;
  prop: Prop;
  type: Type;
};

type PreviewCardOptionsRecipe = {
  dismissal: {
    closeOnEscape: PreviewCardOptionAttributeRecipe<"closeOnEscape", "boolean">;
    closeOnOutsideInteract: PreviewCardOptionAttributeRecipe<"closeOnOutsideInteract", "boolean">;
    runtimeBoundary: "Runtime owns Escape and outside interaction dismissal.";
  };
  timing: {
    closeDelay: PreviewCardOptionAttributeRecipe<"closeDelay", "number">;
    disableHoverableContent: {
      contentHoverableAttribute: string;
      defaultValue: string;
      prop: "disableHoverableContent";
      type: "boolean";
    };
    openDelay: PreviewCardOptionAttributeRecipe<"openDelay", "number">;
    runtimeBoundary: "Runtime owns hover/focus timers and hoverable-content coordination.";
  };
  triggerDisabled: {
    attributes: {
      ariaDisabled: string;
      dataDisabled: string;
    };
    defaultValue: string;
    navigationWhenDisabled: {
      href: "removed";
      tabIndex: -1;
    };
    prop: "disabled";
    type: "boolean";
  };
};

type PreviewCardOptionalOverlayPartRecipe = {
  hiddenAttribute?: "hidden";
  initialHidden: boolean;
  part: "backdrop" | "viewport" | "arrow";
  stateAttribute: "data-state";
};

type PreviewCardStateControlRecipe = {
  event: PreviewCardEventRecipe;
  runtimeBoundary: string[];
  setterSync: {
    open: {
      method: string;
      options?: Record<string, unknown>;
      stateModel: "open";
      suppressesEmit: boolean;
    };
  };
  state: {
    controlledProp: string;
    defaultProp: string;
    getter: string;
    name: "open";
    setter: string;
    valueType: string;
  };
};

type PreviewCardTriggerProjectionRecipe = {
  asChildWrapperElement: "div";
  attribute: "data-as-child";
  delayOverrideAttributes: {
    closeDelay: string;
    openDelay: string;
  };
  disabledAttributes: {
    ariaDisabled: string;
    dataDisabled: string;
  };
  merges: string[];
  omittedNativeAttributes: ["type", "disabled"];
  part: "trigger";
  prop: "asChild";
  renderedElement: "a";
  transferAttributes: ["href", "tabindex"];
};

type PreviewCardRequiredEvent = SpecializedAdapterSpec["events"][number] & {
  callbackProp: string;
  detailsType: string;
  domEvent: string;
  emitsFrom: string;
  valueProperty: string;
  valueType: string;
};

type PreviewCardRequiredState = SpecializedAdapterSpec["stateModels"][number] & {
  controlledProp: string;
  defaultProp: string;
  runtimeGetter: string;
  runtimeSetter: string;
  valueType: string;
};

const PREVIEW_CARD_ANATOMY_PARTS = [
  "root",
  "trigger",
  "portal",
  "positioner",
  "popup",
  "arrow",
  "backdrop",
  "viewport",
] as const;
const PREVIEW_CARD_NAMESPACE_OBJECT_PART_ORDER = [
  "root",
  "trigger",
  "portal",
  "positioner",
  "popup",
  "arrow",
  "backdrop",
  "viewport",
] as const;
const PREVIEW_CARD_NAMESPACE_NAMED_EXPORT_PART_ORDER = [
  "arrow",
  "backdrop",
  "popup",
  "portal",
  "positioner",
  "root",
  "trigger",
  "viewport",
] as const;
const PREVIEW_CARD_OPTIONAL_OVERLAY_PARTS = ["backdrop", "viewport", "arrow"] as const;
const PREVIEW_CARD_REQUIRED_PARTS = PREVIEW_CARD_ANATOMY_PARTS;
const PREVIEW_CARD_STATE_CONTROL_RUNTIME_BOUNDARY = [
  "Runtime owns hover/focus timing; adapters only project open state and event forwarding.",
  "Runtime owns delayed hide and cancellation; adapters only call setOpen for controlled resync.",
] as const;
const PREVIEW_CARD_RUNTIME_BOUNDARY = [
  "hover/focus timing",
  "hoverable-content coordination",
  "delayed hide and presence cleanup",
  "portal movement",
  "Floating UI auto-update",
  "Escape and outside interaction dismissal",
  "aria-describedby wiring",
  "active trigger and anchor switching",
  "controller destroy cleanup",
] as const;

export function buildPreviewCardSpecializedAdapterSpec(
  contract: RuntimeAdapterContract,
): PreviewCardSpecializedAdapterSpec {
  const spec = buildBaseSpecializedAdapterSpec(contract);
  if (spec.component !== "preview-card") {
    throw new Error(
      `${spec.displayName} cannot be rendered as the Preview Card specialized adapter spec.`,
    );
  }

  for (const part of PREVIEW_CARD_REQUIRED_PARTS) {
    assertPart(spec, part);
  }

  if (!spec.renderPlan.floating) {
    throw new Error("Preview Card specialized adapter spec requires floating metadata.");
  }
  if (!spec.renderPlan.presence) {
    throw new Error("Preview Card specialized adapter spec requires presence metadata.");
  }

  return {
    ...spec,
    sourcePrimitiveContract: contract,
    previewCard: {
      adapterKind: "timed-floating-overlay",
      anatomy: buildAnatomyRecipes(spec),
      floating: buildFloatingRecipe(spec),
      namespace: buildNamespaceRecipe(spec),
      optionalOverlayParts: buildOptionalOverlayPartRecipes(spec),
      options: buildOptionsRecipe(spec),
      presence: buildPresenceRecipe(spec),
      runtimeBoundary: [...PREVIEW_CARD_RUNTIME_BOUNDARY],
      stateControl: buildStateControlRecipe(spec),
      triggerProjection: buildTriggerProjectionRecipe(spec),
    },
  };
}

export function validatePreviewCardSpecializedAdapterSpec(
  spec: PreviewCardSpecializedAdapterSpec,
): string[] {
  const errors = validateSpecializedAdapterSpec(spec);
  if (!isRecord(spec) || spec.component !== "preview-card") {
    errors.push("Preview Card specialized adapter spec must target the preview-card primitive.");
    return errors;
  }

  const previewCard = isRecord(spec.previewCard) ? spec.previewCard : undefined;
  if (!previewCard) {
    errors.push("Preview Card specialized adapter spec is missing previewCard metadata.");
    return errors;
  }

  if (previewCard.adapterKind !== "timed-floating-overlay") {
    errors.push(
      'Preview Card specialized adapter spec adapterKind must be "timed-floating-overlay".',
    );
  }

  const expectedFields = new Set([
    "adapterKind",
    "anatomy",
    "floating",
    "namespace",
    "optionalOverlayParts",
    "options",
    "presence",
    "runtimeBoundary",
    "stateControl",
    "triggerProjection",
  ]);
  const behaviorFields = new Set([
    "delayedHiding",
    "dismissalAlgorithms",
    "floatingUpdates",
    "hoverFocusTimers",
    "hoverableContentCoordination",
  ]);
  for (const field of Object.keys(previewCard)) {
    if (behaviorFields.has(field)) {
      errors.push(
        `Preview Card specialized adapter spec must not declare previewCard.${field}; keep Runtime-owned behavior in Runtime controllers.`,
      );
      continue;
    }

    if (!expectedFields.has(field)) {
      errors.push(
        `Preview Card specialized adapter spec must not declare unexpected field "${field}".`,
      );
    }
  }

  for (const part of PREVIEW_CARD_REQUIRED_PARTS) {
    if (!hasPart(spec, part)) {
      errors.push(`Preview Card specialized adapter spec requires ${part} part.`);
    }
  }

  errors.push(...validateAnatomy(spec, previewCard.anatomy));
  errors.push(...validateFloating(spec, previewCard.floating));
  errors.push(...validateNamespace(spec, previewCard.namespace));
  errors.push(...validateOptionalOverlayParts(spec, previewCard.optionalOverlayParts));
  errors.push(...validateOptions(spec, previewCard.options));
  errors.push(...validatePresence(spec, previewCard.presence));
  errors.push(...validateStateControl(spec, previewCard.stateControl));
  errors.push(...validateTriggerProjection(spec, previewCard.triggerProjection));


  if (!arraysEqual(asArray(previewCard.runtimeBoundary), PREVIEW_CARD_RUNTIME_BOUNDARY)) {
    errors.push(
      "Preview Card specialized adapter spec runtimeBoundary must match Runtime-owned behavior.",
    );
  }

  return errors;
}

export function buildPreviewCardAdapterOutputModel(
  spec: PreviewCardSpecializedAdapterSpec,
): AdapterOutputModel {
  assertValidPreviewCardAdapterOutputModelSpec(spec);

  const facts = getPreviewCardTimedFloatingOverlayFacts(spec);
  const files: AdapterOutputModel["files"] = [
    createPreviewCardComponentFile(spec, "root", facts),
    createPreviewCardComponentFile(spec, "trigger", facts),
    createPreviewCardComponentFile(spec, "portal", facts),
    createPreviewCardComponentFile(spec, "positioner", facts),
    createPreviewCardComponentFile(spec, "popup", facts),
    createPreviewCardComponentFile(spec, "arrow", facts),
    createPreviewCardComponentFile(spec, "backdrop", facts),
    createPreviewCardComponentFile(spec, "viewport", facts),
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

function createPreviewCardComponentFile(
  spec: PreviewCardSpecializedAdapterSpec,
  partName: AdapterTimedFloatingOverlayComponentProjection["part"],
  facts: AdapterTimedFloatingOverlayFacts,
): AdapterComponentFile {
  const part = facts.parts[partName];
  const exportName = facts.exports[partName];
  if (!part || !exportName) {
    throw new Error(
      `Preview Card specialized adapter spec output model requires ${partName} part and export.`,
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
                facts.props.disableHoverableContent,
                facts.props.openDelay,
              ].map((prop) => ({ name: prop.name, source: "prop" })),
              rootRef: "rootRef",
            }
          : undefined,
      name: exportName,
      portals: [],
      props: getPreviewCardComponentProps(partName, facts),
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

function getPreviewCardComponentProps(
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
      facts.props.disableHoverableContent,
      facts.props.openDelay,
    ].map(toUnknownAdapterProp);
  }

  if (partName === "trigger") {
    return [
      facts.props.asChild,
      facts.props.closeDelay,
      facts.props.disabled,
      facts.props.openDelay,
    ].map(toUnknownAdapterProp);
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

function getPreviewCardTimedFloatingOverlayFacts(
  spec: PreviewCardSpecializedAdapterSpec,
): AdapterTimedFloatingOverlayFacts {
  const portalPart = getRequiredValue(
    spec.previewCard.floating.portalPart,
    "floating portal part",
  );
  const anatomy = {
    arrow: getPreviewCardAnatomyPart(spec, "arrow"),
    backdrop: getPreviewCardAnatomyPart(spec, "backdrop"),
    popup: getPreviewCardAnatomyPart(spec, spec.previewCard.floating.popupPart),
    portal: getPreviewCardAnatomyPart(spec, portalPart),
    positioner: getPreviewCardAnatomyPart(spec, spec.previewCard.floating.positionerPart),
    root: getPreviewCardAnatomyPart(spec, "root"),
    trigger: getPreviewCardAnatomyPart(spec, "trigger"),
    viewport: getPreviewCardAnatomyPart(spec, "viewport"),
  };
  for (const partName of spec.previewCard.namespace.memberParts) {
    getPreviewCardSpecFileBasename(spec, partName);
    assertPreviewCardPublicRef(spec, partName);
  }

  const state = spec.previewCard.stateControl.state;
  const event = spec.previewCard.stateControl.event;
  const options = spec.previewCard.options;
  const triggerProjection = spec.previewCard.triggerProjection;
  const entriesByPart = new Map(
    spec.previewCard.namespace.objectEntries.map((entry) => [entry.part, entry]),
  );
  const parts = {
    arrow: getPreviewCardTimedFloatingPart(spec, anatomy.arrow.part),
    backdrop: getPreviewCardTimedFloatingPart(spec, anatomy.backdrop.part),
    popup: getPreviewCardTimedFloatingPart(spec, anatomy.popup.part),
    portal: getPreviewCardTimedFloatingPart(spec, anatomy.portal.part),
    positioner: getPreviewCardTimedFloatingPart(spec, anatomy.positioner.part),
    root: getPreviewCardTimedFloatingPart(spec, anatomy.root.part),
    trigger: getPreviewCardTimedFloatingPart(spec, anatomy.trigger.part),
    viewport: getPreviewCardTimedFloatingPart(spec, anatomy.viewport.part),
  };
  const props = {
    align: getAdapterFamilyProp(getProp(spec, "align")),
    asChild: getAdapterFamilyProp(getProp(spec, triggerProjection.prop)),
    avoidCollisions: getAdapterFamilyProp(getProp(spec, "avoidCollisions")),
    closeDelay: getAdapterFamilyProp(getProp(spec, options.timing.closeDelay.prop)),
    closeOnEscape: getAdapterFamilyProp(getProp(spec, options.dismissal.closeOnEscape.prop)),
    closeOnOutsideInteract: getAdapterFamilyProp(
      getProp(spec, options.dismissal.closeOnOutsideInteract.prop),
    ),
    defaultOpen: getAdapterFamilyProp(getProp(spec, state.defaultProp)),
    disabled: getAdapterFamilyProp(getProp(spec, options.triggerDisabled.prop)),
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
      align: getPreviewCardFloatingAttribute(spec, props.align.name, "data-align"),
      arrow: anatomy.arrow.discoveryAttribute,
      arrowState: getStaticAttributeName(spec, anatomy.arrow.part, "data-state"),
      avoidCollisions: getPreviewCardFloatingAttribute(
        spec,
        props.avoidCollisions.name,
        "data-avoid-collisions",
      ),
      backdrop: anatomy.backdrop.discoveryAttribute,
      backdropHidden: getStaticAttributeName(spec, anatomy.backdrop.part, "hidden"),
      backdropState: getStaticAttributeName(spec, anatomy.backdrop.part, "data-state"),
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
      rootOpenDelay: options.timing.openDelay.attribute,
      rootState: getStaticAttributeName(spec, anatomy.root.part, "data-state"),
      side: getPreviewCardFloatingAttribute(spec, props.side.name, "data-side"),
      sideOffset: getPreviewCardFloatingAttribute(spec, props.sideOffset.name, "data-side-offset"),
      trigger: anatomy.trigger.discoveryAttribute,
      triggerAriaDisabled: options.triggerDisabled.attributes.ariaDisabled,
      triggerAsChild: triggerProjection.attribute,
      triggerCloseDelay: triggerProjection.delayOverrideAttributes.closeDelay,
      triggerDisabled: options.triggerDisabled.attributes.dataDisabled,
      triggerOpenDelay: triggerProjection.delayOverrideAttributes.openDelay,
      triggerState: getStaticAttributeName(spec, anatomy.trigger.part, "data-state"),
      viewport: anatomy.viewport.discoveryAttribute,
      viewportState: getStaticAttributeName(spec, anatomy.viewport.part, "data-state"),
    },
    displayName: spec.displayName,
    event,
    exports: {
      arrow: getPreviewCardSpecFileBasename(spec, "arrow"),
      backdrop: getPreviewCardSpecFileBasename(spec, "backdrop"),
      namespace: spec.previewCard.namespace.namespace,
      popup: getPreviewCardSpecFileBasename(spec, "popup"),
      portal: getPreviewCardSpecFileBasename(spec, portalPart),
      positioner: getPreviewCardSpecFileBasename(spec, spec.previewCard.floating.positionerPart),
      root: getPreviewCardSpecFileBasename(spec, "root"),
      trigger: getPreviewCardSpecFileBasename(spec, "trigger"),
      viewport: getPreviewCardSpecFileBasename(spec, "viewport"),
    },
    index: {
      importMembers: spec.previewCard.namespace.namedExports
        .filter((exportName) => exportName !== spec.previewCard.namespace.defaultExport)
        .map((exportName) => {
          const entry = spec.previewCard.namespace.objectEntries.find(
            (candidate) => candidate.exportName === exportName,
          );
          if (!entry) {
            throw new Error(
              `Preview Card specialized adapter spec output model requires ${exportName} namespace entry.`,
            );
          }

          return { from: `./${exportName}`, name: exportName };
        }),
      namespaceMembers: spec.previewCard.namespace.objectEntries.map((entry) => ({
        key: entry.property,
        name: entry.exportName,
      })),
      typeExports: [event.detailsType],
    },
    parts,
    popup: {
      omitTabIndexProps: false,
    },
    popupRole: getRequiredRole(anatomy.popup),
    props,
    root: {
      disabled: false,
    },
    runtime: {
      factory: spec.root.runtimeFactory,
      importSource: spec.root.runtimeImportSource,
      setupFunction: `setup${spec.displayName}s`,
      typeImportSource: "@starwind-ui/runtime",
    },
    setters: {
      disabled: {
        method: "setDisabled",
      },
      open: {
        method: spec.previewCard.stateControl.setterSync.open.method,
        options: getBooleanNumberStringOptions(
          spec.previewCard.stateControl.setterSync.open.options,
        ),
      },
    },
    state: {
      getter: state.getter,
      name: state.name,
      valueType: state.valueType,
    },
    trigger: {
      asChildWrapperElement: triggerProjection.asChildWrapperElement,
      clickGuardWhenDisabled: true,
      delayOverrides: true,
      disabledNavigation: true,
      renderedElement: triggerProjection.renderedElement,
      triggerKind: "anchor",
    },
  };

  function getPreviewCardTimedFloatingPart(
    currentSpec: PreviewCardSpecializedAdapterSpec,
    partName: string,
  ) {
    const part = getPart(currentSpec, partName);
    const namespaceEntry = entriesByPart.get(partName);
    if (!namespaceEntry) {
      throw new Error(
        `Preview Card specialized adapter spec output model requires ${partName} namespace entry.`,
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

function assertValidPreviewCardAdapterOutputModelSpec(
  spec: PreviewCardSpecializedAdapterSpec,
): void {
  const errors = validatePreviewCardSpecializedAdapterSpec(spec);
  if (errors.length > 0) {
    throw new Error(
      `Preview Card Adapter Output Model cannot build from invalid Preview Card spec:\n${errors.join("\n")}`,
    );
  }
}

function buildAnatomyRecipes(spec: SpecializedAdapterSpec): PreviewCardAnatomyRecipe[] {
  return PREVIEW_CARD_ANATOMY_PARTS.map((partName) => {
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

function buildNamespaceRecipe(spec: SpecializedAdapterSpec): PreviewCardNamespaceRecipe {
  const membersByPart = new Map(spec.exports.members.map((member) => [member.part, member]));
  const objectEntries = PREVIEW_CARD_NAMESPACE_OBJECT_PART_ORDER.map((part) => {
    const member = membersByPart.get(part);
    if (!member) {
      throw new Error(`Preview Card specialized adapter spec requires ${part} namespace export.`);
    }

    return {
      exportName: member.name,
      part,
      property: toPascalCase(part),
    };
  });

  return {
    defaultExport: "PreviewCard",
    defaultNamespace: spec.exports.defaultNamespace,
    memberParts: objectEntries.map((entry) => entry.part),
    namedExports: [
      "PreviewCard",
      ...PREVIEW_CARD_NAMESPACE_NAMED_EXPORT_PART_ORDER.map((part) => {
        const member = membersByPart.get(part);
        if (!member) {
          throw new Error(`Preview Card specialized adapter spec requires ${part} named export.`);
        }

        return member.name;
      }),
    ],
    namespace: "PreviewCard",
    objectEntries,
  };
}

function buildOptionalOverlayPartRecipes(
  spec: SpecializedAdapterSpec,
): PreviewCardOptionalOverlayPartRecipe[] {
  return PREVIEW_CARD_OPTIONAL_OVERLAY_PARTS.map((part) => ({
    hiddenAttribute: hasStaticAttribute(spec, part, "hidden") ? "hidden" : undefined,
    initialHidden: spec.renderPlan.presence?.initialHiddenParts.includes(part) === true,
    part,
    stateAttribute: getStaticAttributeName(spec, part, "data-state") as "data-state",
  }));
}

function buildOptionsRecipe(spec: SpecializedAdapterSpec): PreviewCardOptionsRecipe {
  return {
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
    triggerDisabled: {
      attributes: {
        ariaDisabled: getStaticAttributeName(spec, "trigger", "aria-disabled"),
        dataDisabled: getStaticAttributeName(spec, "trigger", "data-disabled"),
      },
      defaultValue: getPropDefault(spec, "disabled"),
      navigationWhenDisabled: {
        href: "removed",
        tabIndex: -1,
      },
      prop: "disabled",
      type: getPropType(spec, "disabled") as "boolean",
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

function buildStateControlRecipe(spec: SpecializedAdapterSpec): PreviewCardStateControlRecipe {
  const openState = getRequiredState(spec, "open");
  const openEvent = getRequiredEvent(spec, "openChange");
  const openSetter = getStateSetter(spec, "open");

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
    runtimeBoundary: [...PREVIEW_CARD_STATE_CONTROL_RUNTIME_BOUNDARY],
    setterSync: {
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

function buildTriggerProjectionRecipe(
  spec: SpecializedAdapterSpec,
): PreviewCardTriggerProjectionRecipe {
  const asChild = getAsChild(spec, "trigger");

  return {
    asChildWrapperElement: "div",
    attribute: "data-as-child",
    delayOverrideAttributes: {
      closeDelay: getStaticAttributeName(spec, "trigger", "data-close-delay"),
      openDelay: getStaticAttributeName(spec, "trigger", "data-open-delay"),
    },
    disabledAttributes: {
      ariaDisabled: getStaticAttributeName(spec, "trigger", "aria-disabled"),
      dataDisabled: getStaticAttributeName(spec, "trigger", "data-disabled"),
    },
    merges: [...asChild.merges],
    omittedNativeAttributes: ["type", "disabled"],
    part: "trigger",
    prop: "asChild",
    renderedElement: "a",
    transferAttributes: ["href", "tabindex"],
  };
}

function validateAnatomy(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!Array.isArray(value)) {
    return ["Preview Card specialized adapter spec requires anatomy metadata."];
  }

  const errors: string[] = [];
  if (
    !arraysEqual(
      value.map((part) => (isRecord(part) ? part.part : undefined)),
      PREVIEW_CARD_ANATOMY_PARTS,
    )
  ) {
    errors.push(
      "Preview Card specialized adapter spec anatomy must match root, trigger, portal, positioner, popup, arrow, backdrop, viewport.",
    );
  }

  for (const partName of PREVIEW_CARD_ANATOMY_PARTS) {
    const recipe = value.find((part) => isRecord(part) && part.part === partName);
    if (!isRecord(recipe)) {
      errors.push(`Preview Card specialized adapter spec requires ${partName} anatomy part.`);
      continue;
    }

    const part = getPart(spec, partName);
    if (recipe.defaultElement !== part.defaultElement) {
      errors.push(
        `Preview Card specialized adapter spec ${partName} defaultElement must match contract.`,
      );
    }
    if (recipe.discoveryAttribute !== part.discoveryAttribute) {
      errors.push(
        `Preview Card specialized adapter spec ${partName} discoveryAttribute must match contract.`,
      );
    }
    if (!arraysEqual(asArray(recipe.initialAttributes), getInitialAttributeNames(spec, partName))) {
      errors.push(
        `Preview Card specialized adapter spec ${partName} initialAttributes must match contract.`,
      );
    }
    if (recipe.publicRef !== hasPublicRef(spec, partName)) {
      errors.push(
        `Preview Card specialized adapter spec ${partName} publicRef must match contract.`,
      );
    }
    if (partName === "popup" && (part.role !== "tooltip" || recipe.role !== "tooltip")) {
      errors.push("Preview Card specialized adapter spec popup role must stay tooltip.");
    } else if (recipe.role !== part.role) {
      errors.push(`Preview Card specialized adapter spec ${partName} role must match contract.`);
    }
  }

  return errors;
}

function validateFloating(spec: SpecializedAdapterSpec, value: unknown): string[] {
  const expected = buildFloatingRecipe(spec);
  if (!isRecord(value)) {
    return ["Preview Card specialized adapter spec requires floating metadata."];
  }

  return recordsEqual(value, expected)
    ? []
    : [
        "Preview Card specialized adapter spec floating metadata must match Runtime floating boundary.",
      ];
}

function validateNamespace(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Preview Card specialized adapter spec requires namespace metadata."];
  }

  const expected = buildNamespaceRecipe(spec);
  const errors: string[] = [];
  if (value.defaultExport !== expected.defaultExport || value.namespace !== expected.namespace) {
    errors.push(
      "Preview Card specialized adapter spec namespace default export must be PreviewCard.",
    );
  }
  if (value.defaultNamespace !== true) {
    errors.push(
      "Preview Card specialized adapter spec namespace must keep defaultNamespace enabled.",
    );
  }
  if (!arraysEqual(asArray(value.memberParts), expected.memberParts)) {
    errors.push(
      "Preview Card specialized adapter spec namespace memberParts must match generated export order.",
    );
  }
  if (!arraysEqual(asArray(value.namedExports), expected.namedExports)) {
    errors.push(
      "Preview Card specialized adapter spec namespace namedExports must match generated export order.",
    );
  }
  if (!recordsArrayEqual(asArray(value.objectEntries), expected.objectEntries)) {
    errors.push(
      "Preview Card specialized adapter spec namespace objectEntries must match generated export order.",
    );
  }

  return errors;
}

function validateOptionalOverlayParts(spec: SpecializedAdapterSpec, value: unknown): string[] {
  const expected = buildOptionalOverlayPartRecipes(spec);
  if (!Array.isArray(value)) {
    return ["Preview Card specialized adapter spec requires optional overlay part metadata."];
  }

  return recordsEqual(value, expected)
    ? []
    : [
        "Preview Card specialized adapter spec optional overlay parts must match backdrop, viewport, and arrow metadata.",
      ];
}

function validateOptions(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Preview Card specialized adapter spec requires option metadata."];
  }

  return recordsEqual(value, buildOptionsRecipe(spec))
    ? []
    : [
        "Preview Card specialized adapter spec option metadata must match contract timing, trigger disabled, and dismissal facts.",
      ];
}

function validatePresence(spec: SpecializedAdapterSpec, value: unknown): string[] {
  const expected = buildPresenceRecipe(spec);
  if (!isRecord(value)) {
    return ["Preview Card specialized adapter spec requires presence metadata."];
  }

  return recordsEqual(value, expected)
    ? []
    : [
        "Preview Card specialized adapter spec presence metadata must match Runtime-owned hidden popup/backdrop facts.",
      ];
}

function validateStateControl(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Preview Card specialized adapter spec requires stateControl metadata."];
  }

  const errors: string[] = [];
  const openState = spec.stateModels.find((state) => state.name === "open");
  const openEvent = spec.events.find((event) => event.name === "openChange");
  const openSetter = spec.setterSync.find(
    (setter) => "stateModel" in setter && setter.stateModel === "open",
  );
  if (!openState) {
    errors.push("Preview Card specialized adapter spec requires open state metadata.");
  }
  if (!openEvent) {
    errors.push("Preview Card specialized adapter spec requires openChange event metadata.");
  }
  if (!openSetter) {
    errors.push("Preview Card specialized adapter spec requires open setter metadata.");
  }

  if (openState && openEvent && openSetter && !recordsEqual(value, buildStateControlRecipe(spec))) {
    errors.push(
      "Preview Card specialized adapter spec stateControl metadata must match contract state/event/setter facts.",
    );
  }

  return errors;
}

function validateTriggerProjection(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Preview Card specialized adapter spec requires trigger projection metadata."];
  }

  return recordsEqual(value, buildTriggerProjectionRecipe(spec))
    ? []
    : [
        "Preview Card specialized adapter spec trigger projection must match anchor/asChild output parity facts.",
      ];
}

function assertPart(spec: SpecializedAdapterSpec, partName: string): void {
  if (!hasPart(spec, partName)) {
    throw new Error(`Preview Card specialized adapter spec requires ${partName} part.`);
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
    throw new Error(`Preview Card specialized adapter spec requires ${partName} asChild metadata.`);
  }

  return asChild;
}

function getPreviewCardAnatomyPart(
  spec: PreviewCardSpecializedAdapterSpec,
  partName: string,
) {
  const part = spec.previewCard.anatomy.find((candidate) => candidate.part === partName);
  if (!part) {
    throw new Error(
      `Preview Card specialized adapter spec output model requires ${partName} anatomy recipe.`,
    );
  }

  return part;
}

function getPreviewCardFloatingAttribute(
  spec: PreviewCardSpecializedAdapterSpec,
  propName: string,
  attributeName: string,
): string {
  if (!spec.previewCard.floating.optionProps.includes(propName)) {
    throw new Error(
      `Preview Card specialized adapter spec output model requires ${propName} floating option.`,
    );
  }

  const positionerAttribute = getStaticAttribute(
    spec,
    spec.previewCard.floating.positionerPart,
    attributeName,
  );
  const popupAttribute = getStaticAttribute(
    spec,
    spec.previewCard.floating.popupPart,
    attributeName,
  );
  const matchingMetadata =
    positionerAttribute.source === popupAttribute.source &&
    positionerAttribute.value === popupAttribute.value;
  if (!matchingMetadata) {
    throw new Error(
      `Preview Card specialized adapter spec output model requires ${attributeName} floating attribute metadata to match on positioner and popup.`,
    );
  }

  return positionerAttribute.name;
}

function getPreviewCardSpecFileBasename(
  spec: PreviewCardSpecializedAdapterSpec,
  partName: string,
): string {
  const file = spec.files.find(
    (candidate) => candidate.kind === "part" && candidate.part === partName,
  );
  if (!file || file.kind !== "part") {
    throw new Error(
      `Preview Card specialized adapter spec output model requires ${partName} part file.`,
    );
  }

  const expectedPath = `${spec.component}/${file.exportName}`;
  if (file.path !== expectedPath) {
    throw new Error(
      `Preview Card specialized adapter spec output model requires ${partName} file path ${expectedPath}.`,
    );
  }

  return file.exportName;
}

function assertPreviewCardPublicRef(
  spec: PreviewCardSpecializedAdapterSpec,
  partName: string,
): void {
  if (!hasPublicRef(spec, partName)) {
    throw new Error(
      `Preview Card specialized adapter spec output model requires ${partName} public ref.`,
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

function getRequiredRole(part: PreviewCardAnatomyRecipe): string {
  return getRequiredValue(part.role, `${part.part} role`);
}

function getInitialAttributeNames(spec: SpecializedAdapterSpec, partName: string): string[] {
  return spec.renderPlan.staticAttributes
    .filter((attribute) => attribute.part === partName)
    .map((attribute) => attribute.name);
}

function getPart(spec: SpecializedAdapterSpec, partName: string) {
  const part = spec.parts.find((candidate) => candidate.name === partName);
  if (!part) {
    throw new Error(`Preview Card specialized adapter spec requires ${partName} part.`);
  }

  return part;
}

function getProp(spec: SpecializedAdapterSpec, propName: string) {
  const prop = spec.props.find((candidate) => candidate.name === propName);
  if (!prop) {
    throw new Error(`Preview Card specialized adapter spec requires ${propName} prop metadata.`);
  }

  return prop;
}

function getPropDefault(spec: SpecializedAdapterSpec, propName: string): string {
  return getRequiredValue(getProp(spec, propName).defaultValue, `${propName} defaultValue`);
}

function getPropType(spec: SpecializedAdapterSpec, propName: string): string {
  return getProp(spec, propName).type;
}

function getRequiredEvent(
  spec: SpecializedAdapterSpec,
  eventName: string,
): PreviewCardRequiredEvent {
  const event = spec.events.find((candidate) => candidate.name === eventName);
  if (!event?.detailsType || !event.domEvent || !event.valueProperty || !event.valueType) {
    throw new Error(`Preview Card specialized adapter spec requires ${eventName} event metadata.`);
  }

  return event as PreviewCardRequiredEvent;
}

function getRequiredFloatingPart(
  spec: SpecializedAdapterSpec,
  field: keyof NonNullable<SpecializedAdapterSpec["renderPlan"]["floating"]>,
): string {
  const value = spec.renderPlan.floating?.[field];
  if (typeof value !== "string") {
    throw new Error(
      `Preview Card specialized adapter spec requires floating ${String(field)} metadata.`,
    );
  }

  return value;
}

function getRequiredState(
  spec: SpecializedAdapterSpec,
  stateName: string,
): PreviewCardRequiredState {
  const state = spec.stateModels.find((candidate) => candidate.name === stateName);
  if (
    !state?.controlledProp ||
    !state.defaultProp ||
    !state.runtimeGetter ||
    !state.runtimeSetter
  ) {
    throw new Error(`Preview Card specialized adapter spec requires ${stateName} state metadata.`);
  }

  return state as PreviewCardRequiredState;
}

function getRequiredValue<T>(value: T | undefined, context: string): T {
  if (value === undefined) {
    throw new Error(`Preview Card specialized adapter spec requires ${context}.`);
  }

  return value;
}

function getStateSetter(spec: SpecializedAdapterSpec, stateModel: string) {
  const setter = spec.setterSync.find(
    (candidate) => "stateModel" in candidate && candidate.stateModel === stateModel,
  );
  if (!setter || !("stateModel" in setter)) {
    throw new Error(
      `Preview Card specialized adapter spec requires ${stateModel} setter metadata.`,
    );
  }

  return setter;
}

function getStaticAttribute(
  spec: SpecializedAdapterSpec,
  partName: string,
  name: string,
) {
  const attribute = spec.renderPlan.staticAttributes.find(
    (candidate) => candidate.part === partName && candidate.name === name,
  );
  if (!attribute) {
    throw new Error(
      `Preview Card specialized adapter spec requires ${name} metadata for ${partName}.`,
    );
  }

  return attribute;
}

function getStaticAttributeName(
  spec: SpecializedAdapterSpec,
  partName: string,
  name: string,
): string {
  return getStaticAttribute(spec, partName, name).name;
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
