import { menuRuntimeAdapterContract } from "../../contracts/primitive/components/menu.js";
import type { RuntimeAdapterContract } from "../../contracts/primitive/types.js";
import type {
  AdapterAnchoredMenuOverlayFacts,
  AdapterAnchoredMenuOverlayPartName,
  AdapterComponentFile,
  AdapterIndexFile,
  AdapterOutputModel,
} from "../framework-adapters/index.js";
import { createPrimitiveAttributeMap } from "../primitives/contract-helpers.js";
import {
  buildBaseSpecializedAdapterSpec,
  validateSpecializedAdapterSpec,
} from "./base-specialized-adapter-spec.js";
import {
  buildMenuSpecializedAdapterSpec,
  type MenuSpecializedAdapterSpec,
  validateMenuSpecializedAdapterSpec,
} from "./menu-specialized-adapter-spec.js";
import type { SpecializedAdapterSpec, SpecializedAdapterSpecPrintedFile } from "./types.js";

export type ContextMenuSpecializedAdapterSpec = SpecializedAdapterSpec & {
  contextMenu: {
    anchor: ContextMenuAnchorRecipe;
    contextAlias: ContextMenuContextAliasRecipe;
    events: {
      closeComplete: ContextMenuEventRecipe;
      openChange: ContextMenuEventRecipe & { cancelable: true };
    };
    floating: ContextMenuFloatingRecipe;
    lifecycle: ContextMenuLifecycleRecipe;
    namespace: ContextMenuNamespaceRecipe;
    reusedMenuRecipes: Pick<
      MenuSpecializedAdapterSpec["menu"],
      "checkboxItem" | "radioGroup" | "radioItem" | "staticBranches" | "submenu"
    >;
    root: ContextMenuRootRecipe;
    runtimeBoundary: string[];
    trigger: ContextMenuTriggerRecipe;
    variantOf: "menu";
  };
  sourceMenuSpec: MenuSpecializedAdapterSpec;
  sourcePrimitiveContract: RuntimeAdapterContract;
};

type ContextMenuRootRecipe = {
  closeDelay: {
    attribute: "data-close-delay";
    defaultValue: "200";
    prop: "closeDelay";
    type: "number";
  };
  defaultElement: "div";
  disabled: {
    dataAttribute: string;
    prop: "disabled";
  };
  discoveryAttribute: string;
  menuDiscoveryAttribute: "data-sw-menu";
  part: "root";
  stateAttributes: {
    closedValue: "closed";
    openValue: "open";
    state: "data-state";
  };
};

type ContextMenuTriggerRecipe = {
  defaultElement: "div";
  disabled: {
    ariaAttribute: "aria-disabled";
    dataAttribute: "data-disabled";
    prop: "disabled";
  };
  discoveryAttribute: string;
  disclosure: {
    ariaExpanded: "aria-expanded";
    ariaHaspopup: {
      attribute: "aria-haspopup";
      value: "menu";
    };
    closedStateValue: "closed";
    openStateValue: "open";
    stateAttribute: "data-state";
  };
  menuDiscoveryAttribute: "data-sw-menu-trigger";
  part: "trigger";
  tabIndex: {
    attribute: "tabindex";
    defaultValue: "0";
    prop: "tabIndex";
  };
  touchCalloutStyle: {
    property: "-webkit-touch-callout";
    value: "none";
  };
};

type ContextMenuAnchorRecipe = {
  creation: "runtime-created";
  defaultElement: "span";
  discoveryAttribute: string;
  floatingReference: true;
  part: "anchor";
  publicRef: false;
  runtimeAttributes: ["data-sw-context-menu-anchor", "style"];
};

type ContextMenuContextAliasRecipe = {
  consumerPart: "radioItem";
  contractContextName: "context-menu-radio-group";
  providerPart: "radioGroup";
  reusedContextName: "menu-radio-group";
  strategy: "menu-backed-part-alias";
};

type ContextMenuEventRecipe = {
  callbackProp: string;
  detailsType: string;
  domEvent: string;
  name: string;
  valueProperty: string;
};

type ContextMenuFloatingRecipe = {
  anchorPart: "anchor";
  menuOptionProps: string[];
  popupPart: "popup";
  portalPart: "portal";
  positionerPart: "positioner";
  referenceSelection: "runtime-created-anchor";
};

type ContextMenuLifecycleRecipe = {
  cleanupEvent: "before-swap";
  destroyMethod: "destroy";
  factory: "createContextMenu";
  initEvents: ["initial-load", "after-swap", "starwind:init"];
  instanceStore: "WeakMap<HTMLElement, ContextMenuInstance>";
  effectSync: {
    cleanup: "instance.destroy()";
    remountDependencies: ["disabled", "modal", "closeDelay"];
    setterSync: "setOpen(open, { emit: false })";
  };
};

type ContextMenuNamespaceRecipe = {
  defaultExport: "ContextMenu";
  defaultNamespace: boolean;
  hiddenParts: ["anchor"];
  localParts: ["root", "trigger"];
  menuBackedAliases: ContextMenuMenuBackedAlias[];
  namedExports: string[];
  namespace: "ContextMenu";
  objectEntries: ContextMenuNamespaceObjectEntry[];
};

type ContextMenuMenuBackedAlias = {
  contextExportName: string;
  contextPart: string;
  menuExportName: string;
  menuPart: string;
  property: string;
};

type ContextMenuNamespaceObjectEntry = {
  exportName: string;
  part: string;
  property: string;
};

type ContextMenuRequiredEvent = SpecializedAdapterSpec["events"][number] & {
  callbackProp: string;
  detailsType: string;
  domEvent: string;
  valueProperty: string;
};

const CONTEXT_MENU_COMPOSITE_OVERLAY_FIXTURE_COMMENT =
  "Non-shipping Context Menu composite overlay fixture. Do not publish, export, register, or copy into demo dependencies.";
const CONTEXT_MENU_RUNTIME_BOUNDARY = [
  "pointer anchoring",
  "keyboard anchoring",
  "long-press timing",
  "trigger event interception",
  "hidden anchor lifecycle",
  "Menu instance delegation",
  "portal reference selection",
  "floating updates",
  "dismissal",
  "open-change detail forwarding",
  "cleanup",
] as const;

export function buildContextMenuSpecializedAdapterSpec(
  contract: RuntimeAdapterContract,
  menuSpec = buildMenuSpecializedAdapterSpec(menuRuntimeAdapterContract),
): ContextMenuSpecializedAdapterSpec {
  const spec = buildBaseSpecializedAdapterSpec(contract);
  if (spec.component !== "context-menu") {
    throw new Error(
      `${spec.displayName} cannot be rendered as the Context Menu specialized adapter spec.`,
    );
  }

  const openState = getStateModel(spec, "open");
  const openEvent = getEvent(spec, "openChange");
  const closeCompleteEvent = getEvent(spec, "closeComplete");
  const openSetter = getSetter(spec, openState.runtimeSetter ?? "setOpen");
  if (openSetter.method !== "setOpen") {
    throw new Error("Context Menu specialized adapter spec requires setOpen setter sync.");
  }

  return {
    ...spec,
    contextMenu: {
      anchor: buildAnchorRecipe(spec),
      contextAlias: buildContextAliasRecipe(spec, menuSpec),
      events: {
        closeComplete: {
          callbackProp: closeCompleteEvent.callbackProp,
          detailsType: closeCompleteEvent.detailsType,
          domEvent: closeCompleteEvent.domEvent,
          name: closeCompleteEvent.name,
          valueProperty: closeCompleteEvent.valueProperty,
        },
        openChange: {
          callbackProp: openEvent.callbackProp,
          cancelable: true,
          detailsType: openEvent.detailsType,
          domEvent: openEvent.domEvent,
          name: openEvent.name,
          valueProperty: openEvent.valueProperty,
        },
      },
      floating: buildFloatingRecipe(spec, menuSpec),
      lifecycle: {
        cleanupEvent: "before-swap",
        destroyMethod: "destroy",
        factory: "createContextMenu",
        initEvents: ["initial-load", "after-swap", "starwind:init"],
        instanceStore: "WeakMap<HTMLElement, ContextMenuInstance>",
        effectSync: {
          cleanup: "instance.destroy()",
          remountDependencies: ["disabled", "modal", "closeDelay"],
          setterSync: "setOpen(open, { emit: false })",
        },
      },
      namespace: buildNamespaceRecipe(spec, menuSpec),
      reusedMenuRecipes: {
        checkboxItem: menuSpec.menu.checkboxItem,
        radioGroup: menuSpec.menu.radioGroup,
        radioItem: menuSpec.menu.radioItem,
        staticBranches: menuSpec.menu.staticBranches,
        submenu: menuSpec.menu.submenu,
      },
      root: buildRootRecipe(spec),
      runtimeBoundary: [...CONTEXT_MENU_RUNTIME_BOUNDARY],
      trigger: buildTriggerRecipe(spec),
      variantOf: "menu",
    },
    sourceMenuSpec: menuSpec,
    sourcePrimitiveContract: contract,
  };
}

const CONTEXT_MENU_OUTPUT_MODEL_PARTS = [
  "root",
  "trigger",
] as const satisfies readonly AdapterAnchoredMenuOverlayPartName[];

export function buildContextMenuAdapterOutputModel(
  spec: ContextMenuSpecializedAdapterSpec,
): AdapterOutputModel {
  const facts = getContextMenuAnchoredMenuOverlayFacts(spec);
  const files: AdapterOutputModel["files"] = [
    ...CONTEXT_MENU_OUTPUT_MODEL_PARTS.map((partName) =>
      createContextMenuComponentFile(spec, partName, facts),
    ),
    createContextMenuIndexFile(spec, facts),
  ];

  return { files };
}

function createContextMenuComponentFile(
  spec: ContextMenuSpecializedAdapterSpec,
  partName: AdapterAnchoredMenuOverlayPartName,
  facts: AdapterAnchoredMenuOverlayFacts,
): AdapterComponentFile {
  const exportName = facts.exports[partName];
  const part = facts.parts[partName];

  return {
    component: {
      context: [],
      defaults: [],
      displayName: `${facts.displayName}.${part.namespaceKey}`,
      events: [],
      exports: {
        kind: "named",
        members: [{ from: `./${exportName}`, name: exportName }],
        namespace: facts.exports.namespace,
      },
      family: { facts, kind: "anchored-menu-overlay", part: partName },
      imports: [],
      name: exportName,
      portals: [],
      props: [],
      refs: [],
      render: {
        attrs: [{ name: part.discoveryAttribute }],
        children: [{ kind: "slot" }],
        defaultElement: part.defaultElement,
        events: [],
        kind: "element",
        part: part.name,
        refs: [],
      },
      stateSync: [],
      typeFacades: [],
    },
    kind: "component",
    path: `${spec.component}/${exportName}`,
  };
}

function createContextMenuIndexFile(
  spec: ContextMenuSpecializedAdapterSpec,
  facts: AdapterAnchoredMenuOverlayFacts,
): AdapterIndexFile {
  return {
    exports: {
      kind: "namespace",
      members: facts.index.importMembers,
      namespace: facts.exports.namespace,
    },
    family: { facts, kind: "anchored-menu-overlay" },
    imports: [],
    kind: "index",
    path: `${spec.component}/index.ts`,
    typeFacades: [],
  };
}

function getContextMenuAnchoredMenuOverlayFacts(
  spec: ContextMenuSpecializedAdapterSpec,
): AdapterAnchoredMenuOverlayFacts {
  const errors = validateContextMenuSpecializedAdapterSpec(spec);
  if (errors.length > 0) {
    throw new Error(
      `Context Menu output model cannot print invalid Context Menu spec:\n${errors.join("\n")}`,
    );
  }

  const attrs = createContextMenuAttributeMap(spec);
  const openState = getStateModel(spec, "open");
  const openSetter = getSetter(spec, openState.runtimeSetter ?? "setOpen");
  const exportsByPart = Object.fromEntries(
    CONTEXT_MENU_OUTPUT_MODEL_PARTS.map((partName) => [
      partName,
      getContextMenuFileExportName(spec, partName),
    ]),
  ) as Record<AdapterAnchoredMenuOverlayPartName, string>;
  const parts = Object.fromEntries(
    CONTEXT_MENU_OUTPUT_MODEL_PARTS.map((partName) => [
      partName,
      getContextMenuAdapterPart(spec, partName),
    ]),
  ) as AdapterAnchoredMenuOverlayFacts["parts"];
  const menuAliasMembers = [...spec.contextMenu.namespace.menuBackedAliases]
    .sort((a, b) => a.contextExportName.localeCompare(b.contextExportName))
    .map((alias) => ({
      contextName: alias.contextExportName,
      menuName: alias.menuExportName,
    }));

  return {
    attrs: {
      closeDelay: attrs.closeDelay,
      defaultOpen: attrs.defaultOpen,
      disabled: attrs.disabled,
      menuRoot: spec.contextMenu.root.menuDiscoveryAttribute,
      menuTrigger: spec.contextMenu.trigger.menuDiscoveryAttribute,
      modal: attrs.modal,
      root: spec.contextMenu.root.discoveryAttribute,
      state: spec.contextMenu.root.stateAttributes.state,
      trigger: spec.contextMenu.trigger.discoveryAttribute,
    },
    displayName: spec.displayName,
    events: {
      closeComplete: {
        callbackProp: spec.contextMenu.events.closeComplete.callbackProp,
        detailsType: spec.contextMenu.events.closeComplete.detailsType,
        name: spec.contextMenu.events.closeComplete.name,
      },
      openChange: {
        callbackProp: spec.contextMenu.events.openChange.callbackProp,
        detailsType: spec.contextMenu.events.openChange.detailsType,
        domEvent: spec.contextMenu.events.openChange.domEvent,
        name: spec.contextMenu.events.openChange.name,
        valueProperty: spec.contextMenu.events.openChange.valueProperty,
        valueType: openState.valueType,
      },
    },
    exports: {
      ...exportsByPart,
      namespace: spec.contextMenu.namespace.namespace,
    },
    index: {
      importMembers: CONTEXT_MENU_OUTPUT_MODEL_PARTS.map((partName) => ({
        from: `./${exportsByPart[partName]}`,
        name: exportsByPart[partName],
      })),
      menuAliasMembers,
      namespaceMembers: spec.contextMenu.namespace.objectEntries.map((entry) => ({
        key: entry.property,
        name: entry.exportName,
      })),
      typeExports: [
        "ContextMenuCloseCompleteDetails",
        "ContextMenuOpenChangeDetails",
        "MenuCheckedChangeDetails",
        "MenuValueChangeDetails",
      ],
    },
    parts,
    props: {
      closeDelay: getContextMenuAdapterFamilyPropForTarget(spec, "closeDelay", "root"),
      defaultOpen: getContextMenuAdapterFamilyPropForTarget(spec, "defaultOpen", "root"),
      disabled: getContextMenuAdapterFamilyPropForTarget(spec, "disabled", "root"),
      modal: getContextMenuAdapterFamilyPropForTarget(spec, "modal", "root"),
      open: getContextMenuAdapterFamilyPropForTarget(spec, "open", "root"),
      tabIndex: { name: spec.contextMenu.trigger.tabIndex.prop, type: "number" },
    },
    root: {
      menuDiscoveryAttribute: spec.contextMenu.root.menuDiscoveryAttribute,
      stateAttributes: spec.contextMenu.root.stateAttributes,
    },
    runtime: {
      cleanupEvent: spec.contextMenu.lifecycle.cleanupEvent,
      destroyFunction: "destroyContextMenus",
      destroyMethod: spec.contextMenu.lifecycle.destroyMethod,
      factory: spec.contextMenu.lifecycle.factory,
      importSource: spec.root.runtimeImportSource,
      initEvents: [...spec.contextMenu.lifecycle.initEvents],
      instancesName: "contextMenuInstances",
      setupFunction: "setupContextMenus",
      typeImportSource: "@starwind-ui/runtime",
    },
    setters: {
      open: {
        method: openSetter.method,
        options: openSetter.options,
      },
    },
    state: {
      open: {
        getter: openState.runtimeGetter ?? "getOpen",
        setter: openState.runtimeSetter ?? "setOpen",
      },
    },
    trigger: {
      disabled: {
        ariaAttribute: spec.contextMenu.trigger.disabled.ariaAttribute,
        dataAttribute: spec.contextMenu.trigger.disabled.dataAttribute,
        prop: getContextMenuAdapterFamilyPropForTarget(spec, "disabled", "trigger"),
      },
      disclosure: spec.contextMenu.trigger.disclosure,
      menuDiscoveryAttribute: spec.contextMenu.trigger.menuDiscoveryAttribute,
      tabIndexDefaultValue: spec.contextMenu.trigger.tabIndex.defaultValue,
      touchCalloutStyle: spec.contextMenu.trigger.touchCalloutStyle,
    },
  };
}

export function validateContextMenuSpecializedAdapterSpec(
  spec: ContextMenuSpecializedAdapterSpec,
): string[] {
  const errors = validateSpecializedAdapterSpecSafely(spec);
  if (!isRecord(spec) || spec.component !== "context-menu") {
    errors.push("Context Menu specialized adapter spec must target the context-menu primitive.");
    return errors;
  }

  const contextMenu = isRecord(spec.contextMenu) ? spec.contextMenu : undefined;
  if (!contextMenu) {
    errors.push("Context Menu specialized adapter spec is missing contextMenu variant metadata.");
    return errors;
  }

  const menuSpec = isRecord(spec.sourceMenuSpec)
    ? (spec.sourceMenuSpec as MenuSpecializedAdapterSpec)
    : buildMenuSpecializedAdapterSpec(menuRuntimeAdapterContract);
  errors.push(...validateMenuSpecializedAdapterSpec(menuSpec));
  errors.push(...validateRootRecipe(spec, contextMenu.root));
  errors.push(...validateTriggerRecipe(spec, contextMenu.trigger));
  errors.push(...validateAnchorRecipe(spec, contextMenu.anchor));
  errors.push(...validateContextAliasRecipe(spec, menuSpec, contextMenu.contextAlias));
  errors.push(...validateEventRecipe(spec, "openChange", contextMenu.events?.openChange, true));
  errors.push(
    ...validateEventRecipe(spec, "closeComplete", contextMenu.events?.closeComplete, false),
  );
  errors.push(...validateFloatingRecipe(spec, menuSpec, contextMenu.floating));
  errors.push(...validateReusedMenuRecipes(menuSpec, contextMenu.reusedMenuRecipes));
  errors.push(...validateNamespaceRecipe(spec, menuSpec, contextMenu.namespace));
  errors.push(...validateLifecycleRecipe(contextMenu.lifecycle));

  return errors;
}

export function printContextMenuCompositeOverlayFixture(
  spec: ContextMenuSpecializedAdapterSpec,
): SpecializedAdapterSpecPrintedFile[] {
  assertContextMenuCompositeOverlayFixtureSpec(spec);

  return [
    {
      contents: renderContextMenuCompositeOverlayFixture(spec),
      path: "__future-fixtures/composite-menu-overlay/context-menu/ContextMenuCompositeOverlay.fixture.ts",
    },
    {
      contents: `// ${CONTEXT_MENU_COMPOSITE_OVERLAY_FIXTURE_COMMENT}\nexport { contextMenuCompositeOverlayFixture } from "./ContextMenuCompositeOverlay.fixture";\n`,
      path: "__future-fixtures/composite-menu-overlay/context-menu/index.ts",
    },
  ];
}

function renderContextMenuCompositeOverlayFixture(spec: ContextMenuSpecializedAdapterSpec): string {
  const contextMenu = spec.contextMenu;
  const lines = [
    `component: ${spec.component}`,
    `variantOf: ${contextMenu.variantOf}`,
    `runtime: ${spec.root.runtimeFactory} from ${spec.root.runtimeImportSource}`,
    `root: ${contextMenu.root.discoveryAttribute} + ${contextMenu.root.menuDiscoveryAttribute} closeDelay=${contextMenu.root.closeDelay.attribute} default=${contextMenu.root.closeDelay.defaultValue} disabled=${contextMenu.root.disabled.dataAttribute} state=${contextMenu.root.stateAttributes.state} ${contextMenu.root.stateAttributes.closedValue}|${contextMenu.root.stateAttributes.openValue}`,
    `trigger: ${contextMenu.trigger.discoveryAttribute} + ${contextMenu.trigger.menuDiscoveryAttribute} ${contextMenu.trigger.disclosure.ariaHaspopup.attribute}=${contextMenu.trigger.disclosure.ariaHaspopup.value} ${contextMenu.trigger.disclosure.ariaExpanded} ${contextMenu.trigger.disclosure.stateAttribute} disabled=${contextMenu.trigger.disabled.ariaAttribute}/${contextMenu.trigger.disabled.dataAttribute} ${contextMenu.trigger.tabIndex.attribute}=${contextMenu.trigger.tabIndex.defaultValue} touchCallout=${contextMenu.trigger.touchCalloutStyle.property}:${contextMenu.trigger.touchCalloutStyle.value}`,
    `anchor: ${contextMenu.anchor.discoveryAttribute} ${contextMenu.anchor.creation} floatingReference attributes=${contextMenu.anchor.runtimeAttributes.join(", ")}`,
    `events: ${contextMenu.events.openChange.name} ${contextMenu.events.openChange.detailsType} ${contextMenu.events.openChange.domEvent} cancelable; ${contextMenu.events.closeComplete.name} ${contextMenu.events.closeComplete.detailsType} ${contextMenu.events.closeComplete.domEvent}`,
    `floating: ${contextMenu.floating.anchorPart} -> ${contextMenu.floating.portalPart}/${contextMenu.floating.positionerPart}/${contextMenu.floating.popupPart} via ${contextMenu.floating.referenceSelection} options ${contextMenu.floating.menuOptionProps.join(", ")}`,
    "reuse: staticBranches from Menu",
    `reuse: checkboxItem indicator ${contextMenu.reusedMenuRecipes.checkboxItem.indicatorProjection.indicatorPart}`,
    `reuse: radioGroup context ${contextMenu.reusedMenuRecipes.radioGroup.context.name}`,
    `reuse: radioItem indicator ${contextMenu.reusedMenuRecipes.radioItem.indicatorProjection.indicatorPart}`,
    `reuse: submenu owner topology ${contextMenu.reusedMenuRecipes.submenu.ownerTopology.rootMenu.ownerKind}/${contextMenu.reusedMenuRecipes.submenu.ownerTopology.submenu.ownerKind}`,
    `contextAlias: ${contextMenu.contextAlias.contractContextName} -> ${contextMenu.contextAlias.reusedContextName} via Menu-backed radio parts`,
    ...contextMenu.namespace.menuBackedAliases.map(
      (alias) =>
        `alias: ${alias.contextExportName}=${alias.menuExportName} part=${alias.contextPart} property=${alias.property}`,
    ),
    `namespace.named: ${contextMenu.namespace.namedExports.join(", ")}`,
    `lifecycle: ${contextMenu.lifecycle.factory} init=${contextMenu.lifecycle.initEvents.join(", ")} cleanup=${contextMenu.lifecycle.cleanupEvent} effectCleanup=${contextMenu.lifecycle.effectSync.cleanup} remount=${contextMenu.lifecycle.effectSync.remountDependencies.join(", ")}`,
    ...contextMenu.runtimeBoundary.map((boundary) => `runtimeBoundary: ${boundary}`),
  ];

  return `// ${CONTEXT_MENU_COMPOSITE_OVERLAY_FIXTURE_COMMENT}\nexport const contextMenuCompositeOverlayFixture = [\n${lines
    .map((line) => `  ${JSON.stringify(line)},`)
    .join("\n")}\n] as const;\n`;
}

function assertContextMenuCompositeOverlayFixtureSpec(
  spec: ContextMenuSpecializedAdapterSpec,
): void {
  const errors = validateContextMenuSpecializedAdapterSpec(spec);
  if (errors.length > 0) {
    throw new Error(
      `Context Menu composite overlay fixture cannot print invalid Context Menu spec:\n${errors.join("\n")}`,
    );
  }
}

function createContextMenuAttributeMap(spec: ContextMenuSpecializedAdapterSpec) {
  return createPrimitiveAttributeMap(spec.sourcePrimitiveContract, {
    closeDelay: { part: "root", attribute: "data-close-delay" },
    defaultOpen: { part: "root", attribute: "data-default-open" },
    disabled: { part: "root", attribute: "data-disabled" },
    modal: { part: "root", attribute: "data-modal" },
  });
}

function getContextMenuFileExportName(
  spec: SpecializedAdapterSpec,
  partName: AdapterAnchoredMenuOverlayPartName,
): string {
  const file = spec.files.find(
    (candidate) => candidate.kind === "part" && candidate.part === partName,
  );
  if (!file || file.kind !== "part") {
    throw new Error(`Context Menu output model requires ${partName} part file.`);
  }

  const expectedPath = `${spec.component}/${file.exportName}`;
  if (file.path !== expectedPath) {
    throw new Error(`Context Menu output model requires ${partName} file path ${expectedPath}.`);
  }

  return file.exportName;
}

function getContextMenuAdapterPart(
  spec: ContextMenuSpecializedAdapterSpec,
  partName: AdapterAnchoredMenuOverlayPartName,
): AdapterAnchoredMenuOverlayFacts["parts"][AdapterAnchoredMenuOverlayPartName] {
  const part = getPartRecipe(spec, partName);
  const namespaceEntry = spec.contextMenu.namespace.objectEntries.find(
    (entry) => entry.part === partName,
  );
  if (!namespaceEntry) {
    throw new Error(`Context Menu output model requires ${partName} namespace entry.`);
  }

  return {
    defaultElement: part.defaultElement,
    discoveryAttribute: part.discoveryAttribute,
    name: part.name,
    namespaceKey: namespaceEntry.property,
  };
}

function getContextMenuAdapterFamilyPropForTarget(
  spec: SpecializedAdapterSpec,
  propName: string,
  target: string,
) {
  const prop = getPropForTarget(spec, propName, target);

  return {
    ...(prop.defaultValue ? { defaultValue: prop.defaultValue } : {}),
    name: prop.name,
    ...(prop.required ? { required: prop.required } : {}),
    type: prop.type,
  };
}

function buildRootRecipe(spec: SpecializedAdapterSpec): ContextMenuRootRecipe {
  const part = getPartRecipe(spec, "root");
  const closeDelay = getPropForTarget(spec, "closeDelay", "root");
  if (part.defaultElement !== "div") {
    throw new Error("Context Menu specialized adapter spec requires root div anatomy.");
  }
  if (closeDelay.defaultValue !== "200" || closeDelay.type !== "number") {
    throw new Error(
      "Context Menu specialized adapter spec requires root closeDelay prop metadata.",
    );
  }

  return {
    closeDelay: {
      attribute: getStaticAttributeName(spec, "root", "data-close-delay"),
      defaultValue: "200",
      prop: "closeDelay",
      type: "number",
    },
    defaultElement: "div",
    disabled: buildRootDisabledRecipe(spec),
    discoveryAttribute: part.discoveryAttribute,
    menuDiscoveryAttribute: getConstantAttributeValue(
      spec,
      "root",
      "data-sw-menu",
    ) as "data-sw-menu",
    part: "root",
    stateAttributes: {
      closedValue: "closed",
      openValue: "open",
      state: getStaticAttributeName(spec, "root", "data-state"),
    },
  };
}

function buildTriggerRecipe(spec: SpecializedAdapterSpec): ContextMenuTriggerRecipe {
  const part = getPartRecipe(spec, "trigger");
  if (part.defaultElement !== "div") {
    throw new Error("Context Menu specialized adapter spec requires trigger div anatomy.");
  }

  return {
    defaultElement: "div",
    disabled: buildDisabledRecipe(spec, "trigger"),
    discoveryAttribute: part.discoveryAttribute,
    disclosure: {
      ariaExpanded: getStaticAttributeName(spec, "trigger", "aria-expanded"),
      ariaHaspopup: {
        attribute: getStaticAttributeName(spec, "trigger", "aria-haspopup"),
        value: getStaticAttributeValue(spec, "trigger", "aria-haspopup") as "menu",
      },
      closedStateValue: "closed",
      openStateValue: "open",
      stateAttribute: getStaticAttributeName(spec, "trigger", "data-state"),
    },
    menuDiscoveryAttribute: getConstantAttributeValue(
      spec,
      "trigger",
      "data-sw-menu-trigger",
    ) as "data-sw-menu-trigger",
    part: "trigger",
    tabIndex: {
      attribute: getStaticAttributeName(spec, "trigger", "tabindex"),
      defaultValue: "0",
      prop: "tabIndex",
    },
    touchCalloutStyle: {
      property: "-webkit-touch-callout",
      value: "none",
    },
  };
}

function buildAnchorRecipe(spec: SpecializedAdapterSpec): ContextMenuAnchorRecipe {
  const part = getPartRecipe(spec, "anchor");
  if (part.defaultElement !== "span") {
    throw new Error("Context Menu specialized adapter spec requires runtime anchor span anatomy.");
  }

  return {
    creation: "runtime-created",
    defaultElement: "span",
    discoveryAttribute: part.discoveryAttribute,
    floatingReference: true,
    part: "anchor",
    publicRef: hasPublicRef(spec, "anchor"),
    runtimeAttributes: [
      getStaticAttributeName(spec, "anchor", "data-sw-context-menu-anchor"),
      getStaticAttributeName(spec, "anchor", "style"),
    ],
  };
}

function buildFloatingRecipe(
  spec: SpecializedAdapterSpec,
  menuSpec: MenuSpecializedAdapterSpec,
): ContextMenuFloatingRecipe {
  const floating = spec.renderPlan.floating;
  if (!floating) {
    throw new Error("Context Menu specialized adapter spec requires floating metadata.");
  }
  if (floating.anchorPart !== "anchor") {
    throw new Error(
      "Context Menu specialized adapter spec requires runtime-created anchor floating reference.",
    );
  }

  return {
    anchorPart: "anchor",
    menuOptionProps: [...menuSpec.menu.floating.optionProps],
    popupPart: "popup",
    portalPart: "portal",
    positionerPart: "positioner",
    referenceSelection: "runtime-created-anchor",
  };
}

function buildContextAliasRecipe(
  spec: SpecializedAdapterSpec,
  menuSpec: MenuSpecializedAdapterSpec,
): ContextMenuContextAliasRecipe {
  const provider = getContextRecipe(spec, "context-menu-radio-group", "provides");
  const consumer = getContextRecipe(spec, "context-menu-radio-group", "consumes");
  if (!arraysEqual(provider.values, menuSpec.menu.radioGroup.context.providedValues)) {
    throw new Error(
      "Context Menu specialized adapter spec context alias must preserve Menu radio provider values.",
    );
  }
  if (!arraysEqual(consumer.values, menuSpec.menu.radioGroup.context.consumedValues)) {
    throw new Error(
      "Context Menu specialized adapter spec context alias must preserve Menu radio consumer values.",
    );
  }

  return {
    consumerPart: "radioItem",
    contractContextName: "context-menu-radio-group",
    providerPart: "radioGroup",
    reusedContextName: menuSpec.menu.radioGroup.context.name,
    strategy: "menu-backed-part-alias",
  };
}

function buildNamespaceRecipe(
  spec: SpecializedAdapterSpec,
  menuSpec: MenuSpecializedAdapterSpec,
): ContextMenuNamespaceRecipe {
  const contextMembersByPart = new Map(spec.exports.members.map((member) => [member.part, member]));
  const menuMembersByPart = new Map(
    menuSpec.menu.namespace.objectEntries.map((entry) => [entry.part, entry]),
  );
  const menuBackedAliases = spec.exports.members
    .filter(
      (member) => member.part !== "root" && member.part !== "trigger" && member.part !== "anchor",
    )
    .map((member) => {
      const menuMember = menuMembersByPart.get(member.part);
      if (!menuMember) {
        throw new Error(
          `Context Menu specialized adapter spec cannot alias ${member.part} without a Menu export.`,
        );
      }

      return {
        contextExportName: member.name,
        contextPart: member.part,
        menuExportName: menuMember.exportName,
        menuPart: menuMember.part,
        property: menuMember.property,
      };
    });
  const localRoot = contextMembersByPart.get("root");
  const localTrigger = contextMembersByPart.get("trigger");
  if (!localRoot || !localTrigger) {
    throw new Error("Context Menu specialized adapter spec requires root and trigger exports.");
  }

  return {
    defaultExport: "ContextMenu",
    defaultNamespace: spec.exports.defaultNamespace,
    hiddenParts: ["anchor"],
    localParts: ["root", "trigger"],
    menuBackedAliases,
    namedExports: [
      "ContextMenu",
      localRoot.name,
      localTrigger.name,
      ...menuBackedAliases.map((alias) => alias.contextExportName),
    ],
    namespace: "ContextMenu",
    objectEntries: [
      { exportName: localRoot.name, part: "root", property: "Root" },
      { exportName: localTrigger.name, part: "trigger", property: "Trigger" },
      ...menuBackedAliases.map((alias) => ({
        exportName: alias.contextExportName,
        part: alias.contextPart,
        property: alias.property,
      })),
    ],
  };
}

function validateRootRecipe(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Context Menu specialized adapter spec requires root recipe metadata."];
  }

  const expected = buildRootRecipe(spec);
  if (!recordsEqual(value.disabled, expected.disabled)) {
    return [
      "Context Menu specialized adapter spec root disabled dataAttribute must match root disabled attribute.",
    ];
  }

  return validateRecordAgainstExpected(
    value,
    expected,
    "Context Menu specialized adapter spec root",
  );
}

function validateTriggerRecipe(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Context Menu specialized adapter spec requires trigger recipe metadata."];
  }

  return validateRecordAgainstExpected(
    value,
    buildTriggerRecipe(spec),
    "Context Menu specialized adapter spec trigger",
  );
}

function validateAnchorRecipe(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Context Menu specialized adapter spec requires anchor recipe metadata."];
  }

  return validateRecordAgainstExpected(
    value,
    buildAnchorRecipe(spec),
    "Context Menu specialized adapter spec anchor",
  );
}

function validateEventRecipe(
  spec: SpecializedAdapterSpec,
  eventName: "closeComplete" | "openChange",
  value: unknown,
  mustBeCancelable: boolean,
): string[] {
  if (!isRecord(value)) {
    return [`Context Menu specialized adapter spec requires ${eventName} recipe metadata.`];
  }

  const event = getEvent(spec, eventName);
  const errors: string[] = [];
  for (const field of [
    "callbackProp",
    "detailsType",
    "domEvent",
    "name",
    "valueProperty",
  ] as const) {
    if (value[field] !== event[field]) {
      errors.push(
        `Context Menu specialized adapter spec ${eventName} ${field} "${String(value[field])}" must match event ${field} "${String(event[field])}".`,
      );
    }
  }
  if (mustBeCancelable && value.cancelable !== true) {
    errors.push(`Context Menu specialized adapter spec ${eventName} event must be cancelable.`);
  }

  return errors;
}

function validateFloatingRecipe(
  spec: SpecializedAdapterSpec,
  menuSpec: MenuSpecializedAdapterSpec,
  value: unknown,
): string[] {
  if (!isRecord(value)) {
    return ["Context Menu specialized adapter spec requires floating metadata."];
  }

  const errors: string[] = [];
  const floating = spec.renderPlan.floating;
  if (!floating) {
    return ["Context Menu specialized adapter spec requires floating metadata."];
  }
  if (floating.anchorPart !== "anchor") {
    errors.push(
      `Context Menu specialized adapter spec contract floating anchorPart "${floating.anchorPart}" must be runtime-created anchor.`,
    );
  }
  if (value.anchorPart !== "anchor") {
    errors.push(
      `Context Menu specialized adapter spec floating anchorPart "${String(value.anchorPart)}" must be runtime-created anchor.`,
    );
  }
  if (value.referenceSelection !== "runtime-created-anchor") {
    errors.push(
      `Context Menu specialized adapter spec floating referenceSelection "${String(value.referenceSelection)}" must be runtime-created-anchor.`,
    );
  }
  for (const part of ["portalPart", "positionerPart", "popupPart"] as const) {
    if (value[part] !== floating[part]) {
      errors.push(
        `Context Menu specialized adapter spec floating ${part} "${String(value[part])}" must match contract ${part} "${floating[part]}".`,
      );
    }
  }
  if (!arraysEqual(asArray(value.menuOptionProps), menuSpec.menu.floating.optionProps)) {
    errors.push(
      "Context Menu specialized adapter spec floating option props must reuse Menu options.",
    );
  }

  return errors;
}

function validateContextAliasRecipe(
  spec: SpecializedAdapterSpec,
  menuSpec: MenuSpecializedAdapterSpec,
  value: unknown,
): string[] {
  if (!isRecord(value)) {
    return ["Context Menu specialized adapter spec requires context alias metadata."];
  }

  return validateRecordAgainstExpected(
    value,
    buildContextAliasRecipe(spec, menuSpec),
    "Context Menu specialized adapter spec contextAlias",
  );
}

function validateReusedMenuRecipes(menuSpec: MenuSpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Context Menu specialized adapter spec requires reused Menu recipes."];
  }

  const expected = {
    checkboxItem: menuSpec.menu.checkboxItem,
    radioGroup: menuSpec.menu.radioGroup,
    radioItem: menuSpec.menu.radioItem,
    staticBranches: menuSpec.menu.staticBranches,
    submenu: menuSpec.menu.submenu,
  };

  return validateRecordAgainstExpected(
    value,
    expected,
    "Context Menu specialized adapter spec reusedMenuRecipes",
  );
}

function validateNamespaceRecipe(
  spec: SpecializedAdapterSpec,
  menuSpec: MenuSpecializedAdapterSpec,
  value: unknown,
): string[] {
  if (!isRecord(value)) {
    return ["Context Menu specialized adapter spec requires namespace recipe metadata."];
  }

  const errors: string[] = [];
  const expected = buildNamespaceRecipe(spec, menuSpec);
  for (const alias of expected.menuBackedAliases) {
    const actualAlias = Array.isArray(value.menuBackedAliases)
      ? value.menuBackedAliases.find(
          (candidate) => isRecord(candidate) && candidate.contextPart === alias.contextPart,
        )
      : undefined;
    if (!recordsEqual(actualAlias, alias)) {
      errors.push(
        `Context Menu specialized adapter spec aliases must include ${alias.contextPart} as ${alias.contextExportName} -> ${alias.menuExportName}.`,
      );
    }
  }
  if (!recordsEqual(value.hiddenParts, expected.hiddenParts)) {
    errors.push(
      "Context Menu specialized adapter spec namespace hiddenParts must keep anchor hidden.",
    );
  }
  if (!recordsEqual(value.namedExports, expected.namedExports)) {
    errors.push(
      "Context Menu specialized adapter spec namespace namedExports must match local and Menu-backed aliases.",
    );
  }
  if (!recordsEqual(value.objectEntries, expected.objectEntries)) {
    errors.push(
      "Context Menu specialized adapter spec namespace objectEntries must match local and Menu-backed alias order.",
    );
  }

  return errors;
}

function validateLifecycleRecipe(value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Context Menu specialized adapter spec requires lifecycle cleanup metadata."];
  }

  return validateRecordAgainstExpected(
    value,
    {
      cleanupEvent: "before-swap",
      destroyMethod: "destroy",
      factory: "createContextMenu",
      initEvents: ["initial-load", "after-swap", "starwind:init"],
      instanceStore: "WeakMap<HTMLElement, ContextMenuInstance>",
      effectSync: {
        cleanup: "instance.destroy()",
        remountDependencies: ["disabled", "modal", "closeDelay"],
        setterSync: "setOpen(open, { emit: false })",
      },
    },
    "Context Menu specialized adapter spec lifecycle",
  );
}

function validateSpecializedAdapterSpecSafely(spec: unknown): string[] {
  return validateSpecializedAdapterSpec(spec);
}

function validateRecordAgainstExpected(
  value: Record<string, unknown>,
  expected: unknown,
  label: string,
): string[] {
  if (recordsEqual(value, expected)) return [];
  return [`${label} must match contract metadata.`];
}

function getPartRecipe(spec: SpecializedAdapterSpec, partName: string) {
  const part = spec.parts.find((candidate) => candidate.name === partName);
  if (!part) {
    throw new Error(`Context Menu specialized adapter spec requires ${partName} part.`);
  }

  return part;
}

function getStateModel(spec: SpecializedAdapterSpec, name: string) {
  const state = spec.stateModels.find((candidate) => candidate.name === name);
  if (!state) {
    throw new Error(`Context Menu specialized adapter spec is missing ${name} state model.`);
  }

  return state;
}

function getEvent(spec: SpecializedAdapterSpec, name: string): ContextMenuRequiredEvent {
  const event = spec.events.find((candidate) => candidate.name === name);
  if (!event) {
    throw new Error(`Context Menu specialized adapter spec requires ${name} event.`);
  }
  if (!event.callbackProp || !event.detailsType || !event.domEvent || !event.valueProperty) {
    throw new Error(
      `Context Menu specialized adapter spec requires complete ${name} event metadata.`,
    );
  }

  return event as ContextMenuRequiredEvent;
}

function getSetter(spec: SpecializedAdapterSpec, method: string) {
  const setter = spec.setterSync.find((candidate) => candidate.method === method);
  if (!setter) {
    throw new Error(`Context Menu specialized adapter spec requires ${method} setter sync.`);
  }

  return setter;
}

function getPropForTarget(spec: SpecializedAdapterSpec, propName: string, target: string) {
  const prop = spec.props.find((candidate) => {
    return candidate.name === propName && candidate.targets?.includes(target);
  });
  if (!prop) {
    throw new Error(
      `Context Menu specialized adapter spec requires ${propName} prop for ${target}.`,
    );
  }

  return prop;
}

function getContextRecipe(
  spec: SpecializedAdapterSpec,
  name: string,
  direction: "consumes" | "provides",
) {
  const context = spec.context.find(
    (candidate) => candidate.name === name && candidate.direction === direction,
  );
  if (!context) {
    throw new Error(
      `Context Menu specialized adapter spec requires ${name} ${direction} context metadata.`,
    );
  }

  return context;
}

function buildDisabledRecipe(
  spec: SpecializedAdapterSpec,
  partName: string,
): ContextMenuTriggerRecipe["disabled"] {
  for (const attributeName of ["aria-disabled", "data-disabled"]) {
    const attribute = spec.renderPlan.staticAttributes.find(
      (candidate) => candidate.part === partName && candidate.name === attributeName,
    );
    if (!attribute) {
      throw new Error(
        `Context Menu specialized adapter spec requires ${attributeName} static attribute for ${partName}.`,
      );
    }
  }

  return {
    ariaAttribute: "aria-disabled",
    dataAttribute: "data-disabled",
    prop: "disabled",
  };
}

function buildRootDisabledRecipe(spec: SpecializedAdapterSpec): ContextMenuRootRecipe["disabled"] {
  return {
    dataAttribute: getStaticAttributeName(spec, "root", "data-disabled"),
    prop: "disabled",
  };
}

function getStaticAttributeName<T extends string>(
  spec: SpecializedAdapterSpec,
  partName: string,
  attributeName: T,
): T {
  const attribute = spec.renderPlan.staticAttributes.find(
    (candidate) => candidate.part === partName && candidate.name === attributeName,
  );
  if (!attribute) {
    throw new Error(
      `Context Menu specialized adapter spec requires ${attributeName} static attribute for ${partName}.`,
    );
  }

  return attributeName;
}

function getStaticAttributeValue(
  spec: SpecializedAdapterSpec,
  partName: string,
  attributeName: string,
): string {
  const attribute = spec.renderPlan.staticAttributes.find(
    (candidate) => candidate.part === partName && candidate.name === attributeName,
  );
  if (!attribute?.value) {
    throw new Error(
      `Context Menu specialized adapter spec requires ${attributeName} static attribute value for ${partName}.`,
    );
  }

  return attribute.value;
}

function getConstantAttributeValue(
  spec: SpecializedAdapterSpec,
  partName: string,
  attributeName: string,
): string {
  const attribute = spec.renderPlan.staticAttributes.find(
    (candidate) =>
      candidate.part === partName &&
      candidate.name === attributeName &&
      candidate.source === "constant",
  );
  if (!attribute) {
    throw new Error(
      `Context Menu specialized adapter spec requires ${attributeName} constant attribute for ${partName}.`,
    );
  }

  return attribute.name;
}

function hasPublicRef(spec: SpecializedAdapterSpec, partName: string): false {
  const ref = spec.refs.find((candidate) => candidate.part === partName);
  if (!ref) {
    throw new Error(`Context Menu specialized adapter spec requires ${partName} ref metadata.`);
  }
  if (ref.public !== false) {
    throw new Error(`Context Menu specialized adapter spec requires ${partName} to stay private.`);
  }

  return false;
}

function arraysEqual(actual: readonly unknown[], expected: readonly unknown[]): boolean {
  return (
    actual.length === expected.length && actual.every((value, index) => value === expected[index])
  );
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function recordsEqual(actual: unknown, expected: unknown): boolean {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
