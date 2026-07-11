import type { RuntimeAdapterContract } from "../../contracts/primitive/types.js";
import type {
  AdapterComponentFile,
  AdapterFamilyProp,
  AdapterOutputModel,
  AdapterSidebarComponentProjection,
  AdapterSidebarFacts,
} from "../framework-adapters/index.js";
import {
  buildBaseSpecializedAdapterSpec,
  validateSpecializedAdapterSpec,
} from "./base-specialized-adapter-spec.js";
import type { SpecializedAdapterSpec } from "./types.js";

export type SidebarSpecializedAdapterSpec = SpecializedAdapterSpec & {
  sourcePrimitiveContract: RuntimeAdapterContract;
  sidebar: {
    adapterKind: "presence-disclosure-control";
    anatomy: SidebarAnatomyRecipe[];
    context: SidebarContextRecipe;
    namespace: SidebarNamespaceRecipe;
    providerOptions: SidebarProviderOptionsRecipe;
    runtimeBoundary: string[];
    sidebarOptions: SidebarPartOptionsRecipe;
    stateControls: SidebarStateControlsRecipe;
    styledBoundary: SidebarStyledBoundaryRecipe;
    toggleTargets: SidebarToggleTargetsRecipe;
  };
};

type SidebarAnatomyRecipe = {
  defaultElement: string;
  discoveryAttribute: string;
  initialAttributes: string[];
  part: string;
  publicRef: boolean;
  role?: string;
};

type SidebarAsChildProjectionRecipe = {
  merges: string[];
  prop: "asChild";
};

type SidebarContextRecipe = {
  consumers: ["sidebar", "trigger", "rail", "menuButton"];
  file: "sidebar/SidebarContext";
  hook: "useSidebarContext";
  name: "SidebarContext";
  providerPart: "provider";
  typeName: "SidebarContextValue";
  values: ["expanded", "mobileOpen", "open", "state"];
};

type SidebarEventRecipe = {
  callbackProp: string;
  detailsType: string;
  domEvent: string;
  emitsFrom: string;
  name: "openChange" | "mobileOpenChange";
  valueProperty: string;
  valueType: string;
};

type SidebarNamespaceRecipe = {
  contextExports: ["SidebarContext", "useSidebarContext"];
  contextTypeExports: ["SidebarContextValue"];
  defaultExport: "Sidebar";
  defaultNamespace: boolean;
  memberParts: string[];
  namedExports: string[];
  namespace: "Sidebar";
  objectEntries: SidebarNamespaceObjectEntry[];
};

type SidebarNamespaceObjectEntry = {
  exportName: string;
  part: string;
  property: string;
};

type SidebarOptionRecipe = {
  adapterDefault: boolean;
  attribute: string;
  defaultValue: string;
  lifecycle: "constructor-only";
  prop: string;
  type: string;
};

type SidebarPartOptionRecipe = {
  attribute: string;
  defaultValue: string;
  prop: string;
  type: string;
};

type SidebarPartOptionsRecipe = {
  collapsible: SidebarPartOptionRecipe;
  side: SidebarPartOptionRecipe;
  variant: SidebarPartOptionRecipe;
};

type SidebarProviderOptionsRecipe = {
  keyboardShortcut: SidebarOptionRecipe;
  mobileQuery: SidebarOptionRecipe;
  persistOpen: SidebarOptionRecipe;
  persistenceKey: SidebarOptionRecipe;
  persistenceMaxAge: SidebarOptionRecipe;
  persistenceStorage: SidebarOptionRecipe;
};

type SidebarRequiredEvent = SpecializedAdapterSpec["events"][number] & {
  callbackProp: string;
  detailsType: string;
  domEvent: string;
  emitsFrom: string;
  valueProperty: string;
  valueType: string;
};

type SidebarRequiredState = SpecializedAdapterSpec["stateModels"][number] & {
  controlledProp: string;
  defaultProp: string;
  initialAttribute: string;
  runtimeGetter: string;
  runtimeSetter: string;
  valueType: "boolean";
};

type SidebarStateControlRecipe = {
  event: SidebarEventRecipe;
  renderedAttribute: string;
  setterSync: {
    method: string;
    options?: Record<string, unknown>;
    stateModel: "mobileOpen" | "open";
    suppressesEmit: boolean;
  };
  state: {
    controlledProp: "mobileOpen" | "open";
    defaultProp: "defaultMobileOpen" | "defaultOpen";
    defaultValue: string;
    getter: string;
    initialAttribute: string;
    name: "mobileOpen" | "open";
    setter: string;
    valueType: "boolean";
  };
};

type SidebarStateControlsRecipe = {
  mobileOpen: SidebarStateControlRecipe;
  open: SidebarStateControlRecipe;
};

type SidebarStyledBoundaryRecipe = {
  description: string;
  styledOnlyParts: string[];
};

type SidebarToggleTargetsRecipe = {
  menuButton: {
    asChild: SidebarAsChildProjectionRecipe;
    discoveryAttribute: string;
    part: "menuButton";
    stateAttribute: string;
  };
  rail: {
    buttonTypeAttribute: string;
    discoveryAttribute: string;
    expandedAttribute: string;
    part: "rail";
    stateAttribute: string;
    tabIndexAttribute: string;
    tabIndexValue: "-1";
  };
  trigger: {
    asChild: SidebarAsChildProjectionRecipe;
    buttonTypeAttribute: string;
    discoveryAttribute: string;
    expandedAttribute: string;
    part: "trigger";
    stateAttribute: string;
  };
};

const SIDEBAR_ANATOMY_PARTS = ["provider", "sidebar", "trigger", "rail", "menuButton"] as const;
const SIDEBAR_NAMESPACE_OBJECT_PART_ORDER = [
  "provider",
  "sidebar",
  "trigger",
  "rail",
  "menuButton",
] as const;
const SIDEBAR_NAMESPACE_NAMED_EXPORTS = [
  "Sidebar",
  "SidebarComponent",
  "SidebarMenuButton",
  "SidebarProvider",
  "SidebarRail",
  "SidebarTrigger",
] as const;
const SIDEBAR_REQUIRED_PARTS = SIDEBAR_ANATOMY_PARTS;
const SIDEBAR_RUNTIME_BOUNDARY = [
  "desktop open state commit and controlled sync",
  "mobile open state commit and controlled sync",
  "storage persistence reads and writes",
  "keyboard shortcut handling",
  "responsive media query controller behavior",
  "provider attribute synchronization",
  "controller cleanup",
] as const;
const SIDEBAR_STYLED_BOUNDARY = {
  description:
    "Styled Sidebar owns app-layout composition, mobile Sheet composition, menu layout anatomy, tooltip decoration, and visual variants outside provider/sidebar/trigger/rail/menuButton primitive behavior.",
  styledOnlyParts: [
    "inset",
    "content",
    "header",
    "footer",
    "group",
    "groupLabel",
    "groupAction",
    "groupContent",
    "input",
    "separator",
    "menu",
    "menuItem",
    "menuAction",
    "menuBadge",
    "menuSkeleton",
    "menuSub",
    "menuSubItem",
    "menuSubButton",
    "mobileSheet",
  ],
} as const;

export function buildSidebarSpecializedAdapterSpec(
  contract: RuntimeAdapterContract,
): SidebarSpecializedAdapterSpec {
  const spec = buildBaseSpecializedAdapterSpec(contract);
  if (spec.component !== "sidebar") {
    throw new Error(
      `${spec.displayName} cannot be rendered as the Sidebar specialized adapter spec.`,
    );
  }

  for (const part of SIDEBAR_REQUIRED_PARTS) {
    assertPart(spec, part);
  }

  return {
    ...spec,
    files: normalizeSidebarFiles(spec.files),
    sourcePrimitiveContract: contract,
    sidebar: {
      adapterKind: "presence-disclosure-control",
      anatomy: buildAnatomyRecipes(spec),
      context: buildContextRecipe(),
      namespace: buildNamespaceRecipe(spec),
      providerOptions: buildProviderOptionsRecipe(spec),
      runtimeBoundary: [...SIDEBAR_RUNTIME_BOUNDARY],
      sidebarOptions: buildSidebarOptionsRecipe(spec),
      stateControls: buildStateControlsRecipe(spec),
      styledBoundary: {
        description: SIDEBAR_STYLED_BOUNDARY.description,
        styledOnlyParts: [...SIDEBAR_STYLED_BOUNDARY.styledOnlyParts],
      },
      toggleTargets: buildToggleTargetsRecipe(spec),
    },
  };
}

function normalizeSidebarFiles(
  files: SpecializedAdapterSpec["files"],
): SpecializedAdapterSpec["files"] {
  return files.map((file) =>
    file.kind === "part" && file.part === "sidebar"
      ? { ...file, exportName: "Sidebar", path: "sidebar/Sidebar" }
      : { ...file },
  );
}

export function validateSidebarSpecializedAdapterSpec(
  spec: SidebarSpecializedAdapterSpec,
): string[] {
  const errors = validateSpecializedAdapterSpec(spec);
  if (!isRecord(spec) || spec.component !== "sidebar") {
    errors.push("Sidebar specialized adapter spec must target the sidebar primitive.");
    return errors;
  }

  const sidebar = isRecord(spec.sidebar) ? spec.sidebar : undefined;
  if (!sidebar) {
    errors.push("Sidebar specialized adapter spec is missing sidebar metadata.");
    return errors;
  }

  if (sidebar.adapterKind !== "presence-disclosure-control") {
    errors.push(
      'Sidebar specialized adapter spec adapterKind must be "presence-disclosure-control".',
    );
  }

  const expectedFields = new Set([
    "adapterKind",
    "anatomy",
    "context",
    "namespace",
    "providerOptions",
    "runtimeBoundary",
    "sidebarOptions",
    "stateControls",
    "styledBoundary",
    "toggleTargets",
  ]);
  const behaviorFields = new Set([
    "mobileSheetComposition",
    "responsiveQueryBehavior",
    "shortcutHandling",
    "stateSynchronization",
    "storagePersistence",
  ]);

  for (const field of Object.keys(sidebar)) {
    if (behaviorFields.has(field)) {
      errors.push(
        `Sidebar specialized adapter spec must not declare sidebar.${field}; keep Runtime-owned behavior in Runtime controllers.`,
      );
      continue;
    }

    if (!expectedFields.has(field)) {
      errors.push(`Sidebar specialized adapter spec must not declare unexpected field "${field}".`);
    }
  }

  for (const part of SIDEBAR_REQUIRED_PARTS) {
    if (!hasPart(spec, part)) {
      errors.push(`Sidebar specialized adapter spec requires ${part} part.`);
    }
  }

  errors.push(...validateAnatomy(spec, sidebar.anatomy));
  errors.push(...validateStateControls(spec, sidebar.stateControls));
  errors.push(...validateProviderOptions(spec, sidebar.providerOptions));
  errors.push(...validateSidebarOptions(spec, sidebar.sidebarOptions));
  errors.push(...validateToggleTargets(spec, sidebar.toggleTargets));
  errors.push(...validateContext(sidebar.context));
  errors.push(...validateNamespace(spec, sidebar.namespace));

  if (!recordsEqual(sidebar.styledBoundary, SIDEBAR_STYLED_BOUNDARY)) {
    errors.push(
      "Sidebar specialized adapter spec styled boundary must match styled-only Sidebar anatomy.",
    );
  }


  if (!arraysEqual(asArray(sidebar.runtimeBoundary), SIDEBAR_RUNTIME_BOUNDARY)) {
    errors.push(
      "Sidebar specialized adapter spec runtimeBoundary must match Runtime-owned Sidebar behavior.",
    );
  }

  return errors;
}

export function buildSidebarAdapterOutputModel(
  spec: SidebarSpecializedAdapterSpec,
): AdapterOutputModel {
  assertValidSidebarAdapterOutputModelSpec(spec);

  const facts = getSidebarFacts(spec);
  const files: AdapterOutputModel["files"] = [
    createSidebarComponentFile(spec, "provider", facts),
    createSidebarComponentFile(spec, "sidebar", facts),
    createSidebarComponentFile(spec, "trigger", facts),
    createSidebarComponentFile(spec, "rail", facts),
    createSidebarComponentFile(spec, "menuButton", facts),
    {
      exports: {
        kind: "namespace",
        members: [],
        namespace: facts.exports.namespace,
      },
      family: { facts, kind: "sidebar" },
      imports: [],
      kind: "index",
      path: `${spec.component}/index.ts`,
      typeFacades: [],
    },
  ];

  return { files };
}

function createSidebarComponentFile(
  spec: SidebarSpecializedAdapterSpec,
  partName: AdapterSidebarComponentProjection["part"],
  facts: AdapterSidebarFacts,
): AdapterComponentFile {
  const part = facts.parts[partName];
  const fileName = facts.exports[partName];

  return {
    component: {
      context: [],
      defaults: [],
      displayName: `${facts.displayName}.${part.namespaceKey}`,
      events: [],
      exports: {
        kind: "named",
        members: [{ from: `./${fileName}`, name: fileName }],
        namespace: facts.exports.namespace,
      },
      family: { facts, kind: "sidebar", part: partName },
      imports: [],
      lifecycle: undefined,
      name: fileName,
      portals: [],
      props: getSidebarComponentProps(partName, facts),
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
      stateSync: [],
      typeFacades: [],
    },
    kind: "component",
    path: `${spec.component}/${fileName}`,
  };
}

function getSidebarComponentProps(
  partName: AdapterSidebarComponentProjection["part"],
  facts: AdapterSidebarFacts,
) {
  if (partName === "provider") {
    return [
      facts.props.defaultOpen,
      facts.props.open,
      facts.props.defaultMobileOpen,
      facts.props.mobileOpen,
      facts.props.keyboardShortcut,
      facts.props.mobileQuery,
      facts.props.persistOpen,
      facts.props.persistenceKey,
      facts.props.persistenceStorage,
      facts.props.persistenceMaxAge,
    ].map(toUnknownAdapterProp);
  }

  if (partName === "sidebar") {
    return [facts.props.side, facts.props.variant, facts.props.collapsible].map(
      toUnknownAdapterProp,
    );
  }

  if (partName === "trigger" || partName === "menuButton") {
    return [facts.props.asChild].map(toUnknownAdapterProp);
  }

  return [];
}

function getSidebarFacts(spec: SidebarSpecializedAdapterSpec): AdapterSidebarFacts {
  const stateControls = spec.sidebar.stateControls;
  const providerOptions = spec.sidebar.providerOptions;
  const sidebarOptions = spec.sidebar.sidebarOptions;
  const toggleTargets = spec.sidebar.toggleTargets;
  const entriesByPart = new Map(
    spec.sidebar.namespace.objectEntries.map((entry) => [entry.part, entry]),
  );
  const anatomy = {
    menuButton: getSidebarOutputAnatomyPart(spec, "menuButton"),
    provider: getSidebarOutputAnatomyPart(spec, "provider"),
    rail: getSidebarOutputAnatomyPart(spec, "rail"),
    sidebar: getSidebarOutputAnatomyPart(spec, "sidebar"),
    trigger: getSidebarOutputAnatomyPart(spec, "trigger"),
  };

  for (const partName of spec.sidebar.namespace.memberParts) {
    getSidebarOutputFileBasename(spec, partName);
    assertSidebarOutputPublicRef(spec, partName);
  }

  const parts = {
    menuButton: getSidebarOutputPart(spec, "menuButton", entriesByPart),
    provider: getSidebarOutputPart(spec, "provider", entriesByPart),
    rail: getSidebarOutputPart(spec, "rail", entriesByPart),
    sidebar: getSidebarOutputPart(spec, "sidebar", entriesByPart),
    trigger: getSidebarOutputPart(spec, "trigger", entriesByPart),
  };
  const props = {
    asChild: getAdapterFamilyProp(getSidebarOutputTargetProp(spec, "asChild", "trigger")),
    collapsible: getAdapterFamilyProp(
      getSidebarOutputTargetProp(spec, sidebarOptions.collapsible.prop, "sidebar"),
    ),
    defaultMobileOpen: getAdapterFamilyProp(
      getSidebarOutputProp(spec, stateControls.mobileOpen.state.defaultProp),
    ),
    defaultOpen: getAdapterFamilyProp(
      getSidebarOutputProp(spec, stateControls.open.state.defaultProp),
    ),
    keyboardShortcut: getAdapterFamilyProp(
      getSidebarOutputProp(spec, providerOptions.keyboardShortcut.prop),
    ),
    mobileOpen: getAdapterFamilyProp(
      getSidebarOutputProp(spec, stateControls.mobileOpen.state.controlledProp),
    ),
    mobileQuery: getAdapterFamilyProp(getSidebarOutputProp(spec, providerOptions.mobileQuery.prop)),
    open: getAdapterFamilyProp(getSidebarOutputProp(spec, stateControls.open.state.controlledProp)),
    persistOpen: getAdapterFamilyProp(getSidebarOutputProp(spec, providerOptions.persistOpen.prop)),
    persistenceKey: getAdapterFamilyProp(
      getSidebarOutputProp(spec, providerOptions.persistenceKey.prop),
    ),
    persistenceMaxAge: getAdapterFamilyProp(
      getSidebarOutputProp(spec, providerOptions.persistenceMaxAge.prop),
    ),
    persistenceStorage: getAdapterFamilyProp(
      getSidebarOutputProp(spec, providerOptions.persistenceStorage.prop),
    ),
    side: getAdapterFamilyProp(
      getSidebarOutputTargetProp(spec, sidebarOptions.side.prop, "sidebar"),
    ),
    variant: getAdapterFamilyProp(
      getSidebarOutputTargetProp(spec, sidebarOptions.variant.prop, "sidebar"),
    ),
  };

  return {
    attrs: {
      defaultMobileOpen: stateControls.mobileOpen.state.initialAttribute,
      defaultOpen: stateControls.open.state.initialAttribute,
      keyboardShortcut: providerOptions.keyboardShortcut.attribute,
      menuButton: anatomy.menuButton.discoveryAttribute,
      menuButtonState: toggleTargets.menuButton.stateAttribute,
      mobileOpen: stateControls.mobileOpen.renderedAttribute,
      mobileQuery: providerOptions.mobileQuery.attribute,
      persistOpen: providerOptions.persistOpen.attribute,
      persistenceKey: providerOptions.persistenceKey.attribute,
      persistenceMaxAge: providerOptions.persistenceMaxAge.attribute,
      persistenceStorage: providerOptions.persistenceStorage.attribute,
      provider: anatomy.provider.discoveryAttribute,
      providerState: stateControls.open.renderedAttribute,
      rail: anatomy.rail.discoveryAttribute,
      railExpanded: toggleTargets.rail.expandedAttribute,
      railState: toggleTargets.rail.stateAttribute,
      railTabindex: toggleTargets.rail.tabIndexAttribute,
      railType: toggleTargets.rail.buttonTypeAttribute,
      sidebar: anatomy.sidebar.discoveryAttribute,
      sidebarCollapsible: getSidebarOutputStaticAttribute(spec, "sidebar", "data-collapsible"),
      sidebarCollapsibleMode: sidebarOptions.collapsible.attribute,
      sidebarSide: sidebarOptions.side.attribute,
      sidebarState: getSidebarOutputStaticAttribute(spec, "sidebar", "data-state"),
      sidebarVariant: sidebarOptions.variant.attribute,
      trigger: anatomy.trigger.discoveryAttribute,
      triggerExpanded: toggleTargets.trigger.expandedAttribute,
      triggerState: toggleTargets.trigger.stateAttribute,
      triggerType: toggleTargets.trigger.buttonTypeAttribute,
    },
    context: {
      contextExports: [...spec.sidebar.namespace.contextExports],
      contextTypeExports: [...spec.sidebar.namespace.contextTypeExports],
      file: spec.sidebar.context.file,
      hook: spec.sidebar.context.hook,
      name: spec.sidebar.context.name,
      typeName: spec.sidebar.context.typeName,
    },
    displayName: spec.displayName,
    events: {
      mobileOpen: stateControls.mobileOpen.event,
      open: stateControls.open.event,
    },
    exports: {
      menuButton: getSidebarOutputFileBasename(spec, "menuButton"),
      namespace: spec.sidebar.namespace.namespace,
      provider: getSidebarOutputFileBasename(spec, "provider"),
      rail: getSidebarOutputFileBasename(spec, "rail"),
      sidebar: getSidebarOutputFileBasename(spec, "sidebar"),
      trigger: getSidebarOutputFileBasename(spec, "trigger"),
    },
    index: {
      namespaceMembers: spec.sidebar.namespace.objectEntries.map((entry) => ({
        key: entry.property,
        name: entry.exportName,
      })),
      namedExports: [...spec.sidebar.namespace.namedExports],
      typeExports: [
        stateControls.mobileOpen.event.detailsType,
        stateControls.open.event.detailsType,
        providerOptions.persistenceStorage.type,
      ],
      valueExports: getSidebarReactValueExports(spec),
    },
    parts,
    props,
    rail: {
      tabIndexValue: toggleTargets.rail.tabIndexValue,
    },
    runtime: {
      factory: spec.root.runtimeFactory,
      importSource: spec.root.runtimeImportSource,
      setupFunction: `setup${spec.displayName}s`,
      typeImportSource: "@starwind-ui/runtime",
    },
    state: {
      mobileOpen: {
        getter: stateControls.mobileOpen.state.getter,
        initialAttribute: stateControls.mobileOpen.state.initialAttribute,
        renderedAttribute: stateControls.mobileOpen.renderedAttribute,
        setter: stateControls.mobileOpen.state.setter,
        setterOptions: getBooleanNumberStringOptions(stateControls.mobileOpen.setterSync.options),
        valueType: stateControls.mobileOpen.state.valueType,
      },
      open: {
        getter: stateControls.open.state.getter,
        initialAttribute: stateControls.open.state.initialAttribute,
        renderedAttribute: stateControls.open.renderedAttribute,
        setter: stateControls.open.state.setter,
        setterOptions: getBooleanNumberStringOptions(stateControls.open.setterSync.options),
        valueType: stateControls.open.state.valueType,
      },
    },
    types: {
      mobileOpenDetails: stateControls.mobileOpen.event.detailsType,
      openDetails: stateControls.open.event.detailsType,
      persistenceStorage: providerOptions.persistenceStorage.type,
    },
  };
}

function assertValidSidebarAdapterOutputModelSpec(spec: SidebarSpecializedAdapterSpec): void {
  const errors = validateSidebarSpecializedAdapterSpec(spec);
  if (errors.length > 0) {
    throw new Error(
      `Sidebar Adapter Output Model cannot build from invalid Sidebar spec:\n${errors.join("\n")}`,
    );
  }
}

function buildAnatomyRecipes(spec: SpecializedAdapterSpec): SidebarAnatomyRecipe[] {
  return SIDEBAR_ANATOMY_PARTS.map((partName) => {
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

function buildContextRecipe(): SidebarContextRecipe {
  return {
    consumers: ["sidebar", "trigger", "rail", "menuButton"],
    file: "sidebar/SidebarContext",
    hook: "useSidebarContext",
    name: "SidebarContext",
    providerPart: "provider",
    typeName: "SidebarContextValue",
    values: ["expanded", "mobileOpen", "open", "state"],
  };
}

function buildNamespaceRecipe(_spec: SpecializedAdapterSpec): SidebarNamespaceRecipe {
  const objectEntries = SIDEBAR_NAMESPACE_OBJECT_PART_ORDER.map((part) => ({
    exportName: getSidebarNamespaceExportName(part),
    part,
    property: part === "sidebar" ? "Sidebar" : toPascalCase(part),
  }));

  return {
    contextExports: ["SidebarContext", "useSidebarContext"],
    contextTypeExports: ["SidebarContextValue"],
    defaultExport: "Sidebar",
    defaultNamespace: true,
    memberParts: objectEntries.map((entry) => entry.part),
    namedExports: [...SIDEBAR_NAMESPACE_NAMED_EXPORTS],
    namespace: "Sidebar",
    objectEntries,
  };
}

function buildProviderOptionsRecipe(spec: SpecializedAdapterSpec): SidebarProviderOptionsRecipe {
  return {
    keyboardShortcut: buildProviderOption(spec, "keyboardShortcut", "data-keyboard-shortcut", true),
    mobileQuery: buildProviderOption(spec, "mobileQuery", "data-mobile-query", true),
    persistOpen: buildProviderOption(spec, "persistOpen", "data-persist-open", true),
    persistenceKey: buildProviderOption(spec, "persistenceKey", "data-persistence-key", false),
    persistenceMaxAge: buildProviderOption(
      spec,
      "persistenceMaxAge",
      "data-persistence-max-age",
      true,
    ),
    persistenceStorage: buildProviderOption(
      spec,
      "persistenceStorage",
      "data-persistence-storage",
      false,
    ),
  };
}

function buildSidebarOptionsRecipe(spec: SpecializedAdapterSpec): SidebarPartOptionsRecipe {
  const collapsible = getTargetProp(spec, "collapsible", "sidebar");
  const side = getTargetProp(spec, "side", "sidebar");
  const variant = getTargetProp(spec, "variant", "sidebar");

  return {
    collapsible: {
      attribute: getStaticAttributeName(spec, "sidebar", "data-collapsible-mode"),
      defaultValue: getRequiredValue(collapsible.defaultValue, "collapsible defaultValue"),
      prop: "collapsible",
      type: collapsible.type as '"offcanvas" | "icon"',
    },
    side: {
      attribute: getStaticAttributeName(spec, "sidebar", "data-side"),
      defaultValue: getRequiredValue(side.defaultValue, "side defaultValue"),
      prop: "side",
      type: side.type as '"left" | "right"',
    },
    variant: {
      attribute: getStaticAttributeName(spec, "sidebar", "data-variant"),
      defaultValue: getRequiredValue(variant.defaultValue, "variant defaultValue"),
      prop: "variant",
      type: variant.type as '"sidebar" | "floating" | "inset"',
    },
  };
}

function buildStateControlsRecipe(spec: SpecializedAdapterSpec): SidebarStateControlsRecipe {
  return {
    mobileOpen: buildStateControl(spec, "mobileOpen", "mobileOpenChange", "data-mobile-open"),
    open: buildStateControl(spec, "open", "openChange", "data-state"),
  };
}

function buildToggleTargetsRecipe(spec: SpecializedAdapterSpec): SidebarToggleTargetsRecipe {
  const menuButton = getPart(spec, "menuButton");
  const rail = getPart(spec, "rail");
  const trigger = getPart(spec, "trigger");

  return {
    menuButton: {
      asChild: buildAsChildProjection(spec, "menuButton"),
      discoveryAttribute: menuButton.discoveryAttribute,
      part: "menuButton",
      stateAttribute: getStaticAttributeName(spec, "menuButton", "data-sidebar-state"),
    },
    rail: {
      buttonTypeAttribute: getStaticAttributeName(spec, "rail", "type"),
      discoveryAttribute: rail.discoveryAttribute,
      expandedAttribute: getStaticAttributeName(spec, "rail", "aria-expanded"),
      part: "rail",
      stateAttribute: getStaticAttributeName(spec, "rail", "data-state"),
      tabIndexAttribute: getStaticAttributeName(spec, "rail", "tabindex"),
      tabIndexValue: getRequiredStaticAttributeValue(spec, "rail", "tabindex"),
    },
    trigger: {
      asChild: buildAsChildProjection(spec, "trigger"),
      buttonTypeAttribute: getStaticAttributeName(spec, "trigger", "type"),
      discoveryAttribute: trigger.discoveryAttribute,
      expandedAttribute: getStaticAttributeName(spec, "trigger", "aria-expanded"),
      part: "trigger",
      stateAttribute: getStaticAttributeName(spec, "trigger", "data-state"),
    },
  };
}

function buildAsChildProjection(
  spec: SpecializedAdapterSpec,
  partName: "menuButton" | "trigger",
): SidebarAsChildProjectionRecipe {
  const asChild = spec.asChild.find((candidate) => candidate.part === partName);
  if (!asChild) {
    throw new Error(`Sidebar specialized adapter spec requires ${partName} asChild metadata.`);
  }

  return {
    merges: [...asChild.merges],
    prop: "asChild",
  };
}

function buildProviderOption(
  spec: SpecializedAdapterSpec,
  propName: keyof SidebarProviderOptionsRecipe,
  attribute: string,
  adapterDefault: boolean,
) {
  const prop = getTargetProp(spec, propName, "provider");

  return {
    adapterDefault,
    attribute: getStaticAttributeName(spec, "provider", attribute),
    defaultValue: getRequiredValue(prop.defaultValue, `${propName} defaultValue`),
    lifecycle: "constructor-only" as const,
    prop: propName,
    type: prop.type,
  };
}

function buildStateControl(
  spec: SpecializedAdapterSpec,
  stateName: "mobileOpen" | "open",
  eventName: "mobileOpenChange" | "openChange",
  renderedAttribute: string,
): SidebarStateControlRecipe {
  const state = getRequiredState(spec, stateName);
  const event = getRequiredEvent(spec, eventName);
  const setter = getStateSetter(spec, stateName);
  const defaultProp = getProp(spec, state.defaultProp);

  return {
    event: {
      callbackProp: event.callbackProp,
      detailsType: event.detailsType,
      domEvent: event.domEvent,
      emitsFrom: event.emitsFrom,
      name: eventName,
      valueProperty: event.valueProperty,
      valueType: event.valueType,
    },
    renderedAttribute: getStaticAttributeName(spec, "provider", renderedAttribute),
    setterSync: {
      method: setter.method,
      options: {
        ...getRequiredValue(setter.options, `${stateName} setter options`),
      },
      stateModel: stateName,
      suppressesEmit: setter.suppressesEmit === true,
    },
    state: {
      controlledProp: state.controlledProp as "mobileOpen" | "open",
      defaultProp: state.defaultProp as "defaultMobileOpen" | "defaultOpen",
      defaultValue: getRequiredValue(defaultProp.defaultValue, `${state.defaultProp} defaultValue`),
      getter: state.runtimeGetter,
      initialAttribute: state.initialAttribute,
      name: stateName,
      setter: state.runtimeSetter,
      valueType: state.valueType,
    },
  };
}

function validateAnatomy(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!Array.isArray(value)) {
    return ["Sidebar specialized adapter spec requires anatomy metadata."];
  }

  const errors: string[] = [];
  if (
    !arraysEqual(
      value.map((part) => (isRecord(part) ? part.part : undefined)),
      SIDEBAR_ANATOMY_PARTS,
    )
  ) {
    errors.push(
      "Sidebar specialized adapter spec anatomy must match provider, sidebar, trigger, rail, and menuButton.",
    );
  }

  for (const partName of SIDEBAR_ANATOMY_PARTS) {
    const recipe = value.find((part) => isRecord(part) && part.part === partName);
    if (!isRecord(recipe)) {
      errors.push(`Sidebar specialized adapter spec requires ${partName} anatomy part.`);
      continue;
    }

    const part = findPart(spec, partName);
    if (!part) continue;

    if (recipe.defaultElement !== part.defaultElement) {
      errors.push(
        `Sidebar specialized adapter spec ${partName} defaultElement must match contract.`,
      );
    }
    if (recipe.discoveryAttribute !== part.discoveryAttribute) {
      errors.push(
        `Sidebar specialized adapter spec ${partName} discoveryAttribute must match contract.`,
      );
    }
    if (!arraysEqual(asArray(recipe.initialAttributes), getInitialAttributeNames(spec, partName))) {
      errors.push(
        `Sidebar specialized adapter spec ${partName} initialAttributes must match contract.`,
      );
    }
    if (recipe.publicRef !== hasPublicRef(spec, partName)) {
      errors.push(`Sidebar specialized adapter spec ${partName} publicRef must match contract.`);
    }
    if (recipe.role !== part.role) {
      errors.push(`Sidebar specialized adapter spec ${partName} role must match contract.`);
    }
  }

  return errors;
}

function validateContext(value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Sidebar specialized adapter spec requires context metadata."];
  }

  return recordsEqual(value, buildContextRecipe())
    ? []
    : [
        "Sidebar specialized adapter spec context metadata must match provider state projection facts.",
      ];
}

function validateNamespace(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Sidebar specialized adapter spec requires namespace metadata."];
  }

  return recordsEqual(value, buildNamespaceRecipe(spec))
    ? []
    : [
        "Sidebar specialized adapter spec namespace metadata must match generated export and context export order.",
      ];
}

function validateProviderOptions(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Sidebar specialized adapter spec requires provider option metadata."];
  }

  const errors: string[] = [];
  for (const propName of [
    "keyboardShortcut",
    "mobileQuery",
    "persistOpen",
    "persistenceKey",
    "persistenceMaxAge",
    "persistenceStorage",
  ]) {
    if (!findTargetProp(spec, propName, "provider")) {
      errors.push(
        `Sidebar specialized adapter spec requires ${propName} provider option metadata.`,
      );
    }
  }
  if (errors.length > 0) return errors;

  return recordsEqual(value, buildProviderOptionsRecipe(spec))
    ? []
    : [
        "Sidebar specialized adapter spec provider options must match shortcut, mobile query, and persistence facts.",
      ];
}

function validateSidebarOptions(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Sidebar specialized adapter spec requires sidebar option metadata."];
  }

  const errors: string[] = [];
  for (const propName of ["collapsible", "side", "variant"]) {
    if (!findTargetProp(spec, propName, "sidebar")) {
      errors.push(`Sidebar specialized adapter spec requires ${propName} sidebar option metadata.`);
    }
  }
  if (errors.length > 0) return errors;

  return recordsEqual(value, buildSidebarOptionsRecipe(spec))
    ? []
    : [
        "Sidebar specialized adapter spec sidebar options must match side, variant, and collapsible facts.",
      ];
}

function validateStateControls(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Sidebar specialized adapter spec requires state control metadata."];
  }

  const errors: string[] = [];
  for (const stateName of ["open", "mobileOpen"]) {
    if (!findRequiredState(spec, stateName)) {
      errors.push(`Sidebar specialized adapter spec requires ${stateName} state metadata.`);
    }
    if (!findStateSetter(spec, stateName)) {
      errors.push(`Sidebar specialized adapter spec requires ${stateName} setter metadata.`);
    }
  }
  for (const eventName of ["openChange", "mobileOpenChange"]) {
    if (!findRequiredEvent(spec, eventName)) {
      errors.push(`Sidebar specialized adapter spec requires ${eventName} event metadata.`);
    }
  }
  if (errors.length > 0) return errors;

  return recordsEqual(value, buildStateControlsRecipe(spec))
    ? []
    : [
        "Sidebar specialized adapter spec state controls must match desktop and mobile state/event/setter facts.",
      ];
}

function validateToggleTargets(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Sidebar specialized adapter spec requires toggle target metadata."];
  }

  let expected: SidebarToggleTargetsRecipe;
  try {
    expected = buildToggleTargetsRecipe(spec);
  } catch {
    return [];
  }

  return recordsEqual(value, expected)
    ? []
    : [
        "Sidebar specialized adapter spec toggle targets must match trigger, rail, and menuButton projection facts.",
      ];
}

function assertPart(spec: SpecializedAdapterSpec, partName: string): void {
  if (!hasPart(spec, partName)) {
    throw new Error(`Sidebar specialized adapter spec requires ${partName} part.`);
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

function findPart(spec: SpecializedAdapterSpec, partName: string) {
  return spec.parts.find((candidate) => candidate.name === partName);
}

function getInitialAttributeNames(spec: SpecializedAdapterSpec, partName: string): string[] {
  return spec.renderPlan.staticAttributes
    .filter((attribute) => attribute.part === partName)
    .map((attribute) => attribute.name);
}

function getPart(spec: SpecializedAdapterSpec, partName: string) {
  const part = findPart(spec, partName);
  if (!part) {
    throw new Error(`Sidebar specialized adapter spec requires ${partName} part.`);
  }

  return part;
}

function getSidebarOutputAnatomyPart(
  spec: SidebarSpecializedAdapterSpec,
  partName: string,
) {
  const part = spec.sidebar.anatomy.find((candidate) => candidate.part === partName);
  if (!part) {
    throw new Error(
      `Sidebar specialized adapter spec output model requires ${partName} anatomy recipe.`,
    );
  }

  return part;
}

function getSidebarOutputPart(
  spec: SidebarSpecializedAdapterSpec,
  partName: string,
  entriesByPart: Map<string, SidebarNamespaceObjectEntry>,
) {
  const part = getPart(spec, partName);
  const namespaceEntry = entriesByPart.get(partName);
  if (!namespaceEntry) {
    throw new Error(
      `Sidebar specialized adapter spec output model requires ${partName} namespace entry.`,
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

function getSidebarOutputFileBasename(
  spec: SidebarSpecializedAdapterSpec,
  partName: string,
): string {
  const file = spec.files.find(
    (candidate) => candidate.kind === "part" && candidate.part === partName,
  );
  if (!file || file.kind !== "part") {
    throw new Error(
      `Sidebar specialized adapter spec output model requires ${partName} part file.`,
    );
  }

  const expectedPath = `${spec.component}/${file.exportName}`;
  if (file.path !== expectedPath) {
    throw new Error(
      `Sidebar specialized adapter spec output model requires ${partName} file path ${expectedPath}.`,
    );
  }

  return file.exportName;
}

function assertSidebarOutputPublicRef(
  spec: SidebarSpecializedAdapterSpec,
  partName: string,
): void {
  if (!hasPublicRef(spec, partName)) {
    throw new Error(
      `Sidebar specialized adapter spec output model requires ${partName} public ref.`,
    );
  }
}

function getSidebarOutputProp(spec: SpecializedAdapterSpec, propName: string) {
  return getProp(spec, propName);
}

function getSidebarOutputTargetProp(
  spec: SpecializedAdapterSpec,
  propName: string,
  targetPart: string,
) {
  return getTargetProp(spec, propName, targetPart);
}

function getSidebarOutputStaticAttribute(
  spec: SpecializedAdapterSpec,
  partName: string,
  name: string,
): string {
  return getStaticAttributeName(spec, partName, name);
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

function getProp(spec: SpecializedAdapterSpec, propName: string) {
  const prop = spec.props.find((candidate) => candidate.name === propName);
  if (!prop) {
    throw new Error(`Sidebar specialized adapter spec requires ${propName} prop metadata.`);
  }

  return prop;
}

function findRequiredEvent(
  spec: SpecializedAdapterSpec,
  eventName: string,
): SidebarRequiredEvent | undefined {
  const event = spec.events.find((candidate) => candidate.name === eventName);
  return event?.detailsType && event.domEvent && event.valueProperty && event.valueType
    ? (event as SidebarRequiredEvent)
    : undefined;
}

function getRequiredEvent(spec: SpecializedAdapterSpec, eventName: string): SidebarRequiredEvent {
  const event = findRequiredEvent(spec, eventName);
  if (!event) {
    throw new Error(`Sidebar specialized adapter spec requires ${eventName} event metadata.`);
  }

  return event;
}

function findRequiredState(
  spec: SpecializedAdapterSpec,
  stateName: string,
): SidebarRequiredState | undefined {
  const state = spec.stateModels.find((candidate) => candidate.name === stateName);
  return state?.controlledProp &&
    state.defaultProp &&
    state.initialAttribute &&
    state.runtimeGetter &&
    state.runtimeSetter &&
    state.valueType === "boolean"
    ? (state as SidebarRequiredState)
    : undefined;
}

function getRequiredState(spec: SpecializedAdapterSpec, stateName: string): SidebarRequiredState {
  const state = findRequiredState(spec, stateName);
  if (!state) {
    throw new Error(`Sidebar specialized adapter spec requires ${stateName} state metadata.`);
  }

  return state;
}

function getRequiredStaticAttributeValue(
  spec: SpecializedAdapterSpec,
  partName: string,
  name: string,
): "-1" {
  const attribute = spec.renderPlan.staticAttributes.find(
    (candidate) => candidate.part === partName && candidate.name === name,
  );
  if (attribute?.value !== "-1") {
    throw new Error(`Sidebar specialized adapter spec requires ${partName} ${name} static value.`);
  }

  return attribute.value;
}

function getRequiredValue<T>(value: T | undefined, context: string): T {
  if (value === undefined) {
    throw new Error(`Sidebar specialized adapter spec requires ${context}.`);
  }

  return value;
}

function getSidebarNamespaceExportName(part: string): string {
  if (part === "sidebar") return "SidebarComponent";

  return `Sidebar${toPascalCase(part)}`;
}

function getSidebarReactValueExports(spec: SidebarSpecializedAdapterSpec): string[] {
  const namespace = spec.sidebar.namespace;

  return [
    namespace.defaultExport,
    "SidebarComponent",
    "SidebarContext",
    "SidebarMenuButton",
    "SidebarProvider",
    "SidebarRail",
    "SidebarTrigger",
    "useSidebarContext",
  ];
}

function getStateSetter(spec: SpecializedAdapterSpec, stateModel: string) {
  const setter = findStateSetter(spec, stateModel);
  if (!setter || !("stateModel" in setter)) {
    throw new Error(`Sidebar specialized adapter spec requires ${stateModel} setter metadata.`);
  }

  return setter;
}

function findStateSetter(spec: SpecializedAdapterSpec, stateModel: string) {
  return spec.setterSync.find(
    (candidate) => "stateModel" in candidate && candidate.stateModel === stateModel,
  );
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
    throw new Error(`Sidebar specialized adapter spec requires ${name} metadata for ${partName}.`);
  }

  return attribute.name;
}

function getTargetProp(spec: SpecializedAdapterSpec, propName: string, targetPart: string) {
  const prop = findTargetProp(spec, propName, targetPart);
  if (!prop) {
    throw new Error(
      `Sidebar specialized adapter spec requires ${propName} prop metadata for ${targetPart}.`,
    );
  }

  return prop;
}

function findTargetProp(spec: SpecializedAdapterSpec, propName: string, targetPart: string) {
  return spec.props.find(
    (candidate) => candidate.name === propName && candidate.targets?.includes(targetPart),
  );
}

function hasPart(spec: SpecializedAdapterSpec, partName: string): boolean {
  return spec.parts.some((part) => part.name === partName);
}

function hasPublicRef(spec: SpecializedAdapterSpec, partName: string): boolean {
  return spec.refs.some((ref) => ref.part === partName && ref.public);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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
