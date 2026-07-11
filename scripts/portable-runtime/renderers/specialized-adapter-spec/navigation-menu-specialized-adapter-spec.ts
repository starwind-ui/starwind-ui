import type { RuntimeAdapterContract } from "../../contracts/primitive/types.js";
import type {
  AdapterComponentFile,
  AdapterIndexFile,
  AdapterOutputModel,
  AdapterSharedViewportNavigationFacts,
  AdapterSharedViewportNavigationPartName,
} from "../framework-adapters/index.js";
import {
  buildBaseSpecializedAdapterSpec,
  validateSpecializedAdapterSpec,
} from "./base-specialized-adapter-spec.js";
import type { SpecializedAdapterSpec, SpecializedAdapterSpecPrintedFile } from "./types.js";

export type NavigationMenuSpecializedAdapterSpec = SpecializedAdapterSpec & {
  navigationMenu: {
    adapterKind: "shared-viewport-navigation";
    anatomy: NavigationMenuAnatomyRecipe[];
    floating: NonNullable<SpecializedAdapterSpec["renderPlan"]["floating"]>;
    lifecycle: NavigationMenuLifecycleRecipe;
    namespace: NavigationMenuNamespaceRecipe;
    nestedRootPolicy: NavigationMenuNestedRootPolicyRecipe;
    partRecipes: NavigationMenuPartRecipes;
    rootParts: NavigationMenuRootPartsRecipe;
    runtimeBoundary: string[];
    valueControl: NavigationMenuValueControlRecipe;
    valueState: {
      controlledProp: "value";
      defaultProp: "defaultValue";
      getter: "getValue";
      name: "value";
      setter: "setValue";
      valueType: "string | null";
    };
    viewportProjection: NavigationMenuViewportProjectionRecipe;
  };
  sourcePrimitiveContract: RuntimeAdapterContract;
};

type NavigationMenuAnatomyRecipe = {
  defaultElement: string;
  discoveryAttribute: string;
  initialAttributes: string[];
  part: string;
  publicRef: boolean;
};

type NavigationMenuLifecycleRecipe = {
  cleanupEvent: "before-swap";
  destroyMethod: "destroy";
  factory: "createNavigationMenu";
  initEvents: ["initial-load", "after-swap", "starwind:init"];
  instanceStore: "Set<ReturnType<typeof createNavigationMenu>>";
  effectSync: {
    cleanup: "instance.destroy()";
    remountDependencies: ["openDelay", "closeDelay", "closeOnEscape", "closeOnOutsideInteract"];
    setterSync: "setValue(value, { emit: false })";
  };
};

type NavigationMenuNamespaceRecipe = {
  defaultExport: "NavigationMenu";
  defaultNamespace: boolean;
  memberParts: string[];
  namedExports: string[];
  namespace: "NavigationMenu";
  objectEntries: NavigationMenuNamespaceObjectEntry[];
};

type NavigationMenuNamespaceObjectEntry = {
  exportName: string;
  part: string;
  property: string;
};

type NavigationMenuNestedRootPolicyRecipe = {
  boundaryPart: "content";
  contractOwnedFacts: string[];
  policy: "inert";
  runtimeBoundary: "nested root detection and inert controller policy";
};

type NavigationMenuPartRecipes = {
  content: {
    defaultElement: "div";
    hiddenAttribute: "hidden";
    initialState: "closed";
    part: "content";
    stateAttribute: "data-state";
  };
  item: {
    defaultElement: "li";
    fallbackValueExpectation: "adapter-renders-data-value-when-item-value-prop-is-provided";
    initialState: "closed";
    part: "item";
    stateAttribute: "data-state";
    value: {
      attribute: "data-value";
      prop: string;
      required: boolean;
      type: string;
    };
  };
  link: {
    active: {
      ariaCurrentAttribute: "aria-current";
      ariaCurrentValue: "page";
      attribute: "data-active";
      defaultValue: string;
      prop: string;
    };
    closeOnClick: {
      attribute: "data-close-on-click";
      defaultValue: string;
      falseValue: "false";
      prop: string;
    };
    defaultElement: "a";
    part: "link";
  };
  list: {
    defaultElement: "ul";
    orientation: {
      attribute: "data-orientation";
      inheritedFrom: "root";
      prop: string;
      values: string[];
    };
    part: "list";
  };
  options: {
    dismissal: {
      closeOnEscape: {
        attribute: "data-close-on-escape";
        defaultValue: string;
        prop: string;
      };
      closeOnOutsideInteract: {
        attribute: "data-close-on-outside-interact";
        defaultValue: string;
        prop: string;
      };
    };
    rootDelay: NavigationMenuDelayRecipe;
    triggerDelay: NavigationMenuDelayRecipe;
  };
  runtimeBoundary: [
    "orientation-driven keyboard mapping",
    "focus movement and restoration",
    "trigger/content/value coordination",
  ];
  trigger: {
    asChild: {
      attribute: "data-as-child";
      merges: string[];
      part: "trigger";
      prop: "asChild";
    };
    defaultElement: "button";
    disabled: {
      ariaAttribute: "aria-disabled";
      dataAttribute: "data-disabled";
      nativeAttribute: "disabled";
      prop: string;
    };
    disclosure: {
      ariaExpanded: "aria-expanded";
      ariaHaspopup: {
        attribute: "aria-haspopup";
        value: "menu";
      };
      closedStateValue: "closed";
      stateAttribute: "data-state";
    };
    part: "trigger";
    publicRef: boolean;
    typeAttribute: {
      attribute: "type";
      value: string;
    };
  };
};

type NavigationMenuDelayRecipe = {
  closeDelay: {
    attribute: "data-close-delay";
    defaultValue: string;
    prop: string;
  };
  openDelay: {
    attribute: "data-open-delay";
    defaultValue: string;
    prop: string;
  };
};

type NavigationMenuViewportProjectionRecipe = {
  activationDirection: {
    attribute: "data-activation-direction";
    runtimeOwnership: "computed-from-active-item-order";
    targets: string[];
    values: ["initial", "next", "previous", "current"];
  };
  activeContent: {
    fromPart: "content";
    placeholder: "navigation-menu-content-placeholder";
    runtimeOwnership: "moves-active-content-into-shared-viewport";
    toPart: "viewport";
  };
  cssVariables: {
    sizing: {
      runtimeMutated: true;
      targets: Record<string, string[]>;
      variables: string[];
    };
    transformOrigin: {
      targets: string[];
      variable: "--transform-origin";
    };
  };
  floating: {
    adaptiveOrigin: true;
    fallbackFloatingPart: "popup";
    floatingPart: string;
    optionProps: string[];
    placementStateTargets: ["arrow", "popup", "viewport"];
    reference: "active-trigger";
  };
  floatingOptions: NavigationMenuFloatingOptionRecipe[];
  initialState: {
    closedParts: string[];
    closedValue: "closed";
    hiddenAttribute: "hidden";
    hiddenParts: string[];
    openValue: "open";
    stateAttribute: "data-state";
  };
  instantState: {
    attribute: "data-instant";
    positionOnlyTargets: ["positioner"];
    stateTargets: string[];
    timing: "requestAnimationFrame-cleared";
  };
  placementAttributes: {
    align: "data-align";
    side: "data-side";
    stateTargets: string[];
  };
  projectionTargets: {
    arrow: "arrow";
    content: "content";
    popup: "popup";
    positioner: "positioner";
    viewport: "viewport";
  };
  runtimeBoundary: [
    "active content movement",
    "viewport measurement and size mutation",
    "floating placement and auto-update",
    "transient instant-state timing",
  ];
};

type NavigationMenuFloatingOptionRecipe = {
  attribute: string;
  defaultValue: string;
  prop: string;
  targets: string[];
};

type NavigationMenuValueControlRecipe = {
  eventForwarding: {
    callbackProp: "onValueChange";
    callbackTiming: "before-state-commit";
    cancelable: true;
    detailsType: "NavigationMenuValueChangeDetails";
    domEvent: "starwind:value-change";
    emitsFrom: "root";
    name: "valueChange";
    valueProperty: "value";
    valueType: "string | null";
  };
  controlledResync: {
    detailsValueProperty: "value";
    preserveDetailFields: ["event", "reason", "trigger"];
    runtimeBoundary: "Runtime owns focus handoff; adapter preserves event/reason/trigger details.";
    setter: "setValue";
  };
  setterSync: {
    method: "setValue";
    options: { emit: false };
    stateModel: "value";
    suppressesEmit: true;
  };
  state: {
    controlledStateSync: "unsupported";
    controlledNullMarker: {
      attribute: "data-controlled-value";
      value: "";
    };
    controlledProp: "value";
    controlledValueAttribute: "data-value";
    defaultProp: "defaultValue";
    defaultValueAttribute: "data-default-value";
    getter: "getValue";
    name: "value";
    renderedStateAttribute: "data-state";
    setter: "setValue";
    valueType: "string | null";
  };
};

type NavigationMenuRootPartsRecipe = {
  arrow: "arrow";
  content: "content";
  item: "item";
  list: "list";
  popup: "popup";
  portal: "portal";
  positioner: "positioner";
  root: "root";
  trigger: "trigger";
  viewport: "viewport";
};

type NavigationMenuRequiredState = SpecializedAdapterSpec["stateModels"][number] & {
  controlledProp: string;
  defaultProp: string;
  runtimeGetter: string;
  runtimeSetter: string;
  valueType: string;
};

type NavigationMenuRequiredEvent = SpecializedAdapterSpec["events"][number] & {
  callbackProp: string;
  detailsType: string;
  domEvent: string;
  emitsFrom: string;
  valueProperty: string;
};

const NAVIGATION_MENU_REQUIRED_ROOT_PARTS = [
  "root",
  "list",
  "item",
  "trigger",
  "content",
  "portal",
  "positioner",
  "popup",
  "viewport",
  "arrow",
] as const;
const NAVIGATION_MENU_ANATOMY_PARTS = [
  "root",
  "list",
  "item",
  "trigger",
  "icon",
  "content",
  "link",
  "portal",
  "positioner",
  "popup",
  "viewport",
  "arrow",
] as const;
const NAVIGATION_MENU_FLOATING_OPTION_PROPS = [
  "side",
  "align",
  "sideOffset",
  "alignOffset",
  "avoidCollisions",
  "collisionPadding",
] as const;
const NAVIGATION_MENU_FORBIDDEN_MENU_RECIPE_KEYS = [
  "checkboxItem",
  "itemIndicator",
  "radioGroup",
  "radioItem",
  "staticBranches",
  "submenu",
] as const;
const NAVIGATION_MENU_NAMESPACE_PART_ORDER = [
  "arrow",
  "content",
  "icon",
  "item",
  "link",
  "list",
  "popup",
  "portal",
  "positioner",
  "root",
  "trigger",
  "viewport",
] as const;
const NAVIGATION_MENU_RUNTIME_BOUNDARY = [
  "active content movement",
  "content placeholder management",
  "shared viewport measurement and sizing",
  "placement and arrow projection",
  "trigger/content/value coordination",
  "orientation-driven keyboard mapping",
  "focus movement and restoration",
  "hover open and close timers",
  "outside pointer and Escape dismissal",
  "portal movement",
  "Floating UI positioning and updates",
  "link activation close behavior",
  "nested root inertness",
  "animation-delayed hiding",
  "cleanup",
] as const;
const NAVIGATION_MENU_VIEWPORT_PROJECTION_TARGETS = {
  arrow: "arrow",
  content: "content",
  popup: "popup",
  positioner: "positioner",
  viewport: "viewport",
} as const satisfies NavigationMenuViewportProjectionRecipe["projectionTargets"];
const NAVIGATION_MENU_VIEWPORT_PROJECTION_RUNTIME_BOUNDARY = [
  "active content movement",
  "viewport measurement and size mutation",
  "floating placement and auto-update",
  "transient instant-state timing",
] as const satisfies NavigationMenuViewportProjectionRecipe["runtimeBoundary"];
const NAVIGATION_MENU_VIEWPORT_STATE_TARGETS = [
  "content",
  "positioner",
  "popup",
  "root",
  "viewport",
] as const;
const NAVIGATION_MENU_PLACEMENT_STATE_TARGETS = ["arrow", "popup", "viewport"] as const;
const NAVIGATION_MENU_PLACEMENT_SURFACE_TARGETS = [
  "arrow",
  "popup",
  "positioner",
  "viewport",
] as const;
const NAVIGATION_MENU_VIEWPORT_SIZING_VARIABLES = [
  "--sw-nav-menu-viewport-width",
  "--sw-nav-menu-viewport-height",
  "--sw-nav-menu-popup-width",
  "--sw-nav-menu-popup-height",
  "--sw-nav-menu-positioner-width",
  "--sw-nav-menu-positioner-height",
  "--popup-width",
  "--popup-height",
  "--positioner-width",
  "--positioner-height",
] as const;
const NAVIGATION_MENU_VIEWPORT_CSS_TARGETS = {
  content: ["--sw-nav-menu-viewport-width", "--sw-nav-menu-viewport-height"],
  popup: [
    "--sw-nav-menu-viewport-width",
    "--sw-nav-menu-viewport-height",
    "--sw-nav-menu-popup-width",
    "--sw-nav-menu-popup-height",
    "--popup-width",
    "--popup-height",
  ],
  positioner: [
    "--sw-nav-menu-viewport-width",
    "--sw-nav-menu-viewport-height",
    "--sw-nav-menu-positioner-width",
    "--sw-nav-menu-positioner-height",
    "--positioner-width",
    "--positioner-height",
  ],
  root: ["--sw-nav-menu-viewport-width", "--sw-nav-menu-viewport-height"],
  viewport: ["--sw-nav-menu-viewport-width", "--sw-nav-menu-viewport-height"],
} as const;
const NAVIGATION_MENU_FLOATING_OPTION_ATTRIBUTES = {
  align: "data-align",
  alignOffset: "data-align-offset",
  avoidCollisions: "data-avoid-collisions",
  collisionPadding: "data-collision-padding",
  side: "data-side",
  sideOffset: "data-side-offset",
} as const;
const NAVIGATION_MENU_CONTROLLED_RESYNC = {
  detailsValueProperty: "value",
  preserveDetailFields: ["event", "reason", "trigger"],
  runtimeBoundary: "Runtime owns focus handoff; adapter preserves event/reason/trigger details.",
  setter: "setValue",
} as const satisfies NavigationMenuValueControlRecipe["controlledResync"];
const NAVIGATION_MENU_SHARED_VIEWPORT_FIXTURE_COMMENT =
  "Non-shipping Navigation Menu shared viewport fixture. Do not publish, export, register, or copy into demo dependencies.";

export function buildNavigationMenuSpecializedAdapterSpec(
  contract: RuntimeAdapterContract,
): NavigationMenuSpecializedAdapterSpec {
  const spec = buildBaseSpecializedAdapterSpec(contract);
  if (spec.component !== "navigation-menu") {
    throw new Error(
      `${spec.displayName} cannot be rendered as the Navigation Menu shared viewport specialized adapter spec.`,
    );
  }

  for (const part of NAVIGATION_MENU_REQUIRED_ROOT_PARTS) {
    assertPart(spec, part);
  }

  const valueState = getStateModel(spec, "value");
  const valueEvent = getEvent(spec, "valueChange");
  const valueSetter = getSetter(spec, valueState.runtimeSetter ?? "setValue");
  const floating = spec.renderPlan.floating;
  if (!floating) {
    throw new Error("Navigation Menu specialized adapter spec requires floating metadata.");
  }
  if (valueSetter.method !== "setValue") {
    throw new Error("Navigation Menu specialized adapter spec requires setValue setter sync.");
  }

  return {
    ...spec,
    navigationMenu: {
      adapterKind: "shared-viewport-navigation",
      anatomy: buildAnatomyRecipes(spec),
      floating,
      lifecycle: buildLifecycleRecipe(),
      namespace: buildNamespaceRecipe(spec),
      nestedRootPolicy: buildNestedRootPolicyRecipe(),
      partRecipes: buildPartRecipes(spec),
      rootParts: {
        arrow: "arrow",
        content: "content",
        item: "item",
        list: "list",
        popup: "popup",
        portal: "portal",
        positioner: "positioner",
        root: "root",
        trigger: "trigger",
        viewport: "viewport",
      },
      runtimeBoundary: [...NAVIGATION_MENU_RUNTIME_BOUNDARY],
      valueControl: buildValueControlRecipe(spec, valueState, valueEvent, valueSetter),
      valueState: {
        controlledProp: "value",
        defaultProp: "defaultValue",
        getter: "getValue",
        name: "value",
        setter: "setValue",
        valueType: "string | null",
      },
      viewportProjection: buildViewportProjectionRecipe(spec, floating),
    },
    sourcePrimitiveContract: contract,
  };
}


const NAVIGATION_MENU_OUTPUT_MODEL_PARTS = [
  "arrow",
  "content",
  "icon",
  "item",
  "link",
  "list",
  "popup",
  "portal",
  "positioner",
  "root",
  "trigger",
  "viewport",
] as const satisfies readonly AdapterSharedViewportNavigationPartName[];

export function buildNavigationMenuAdapterOutputModel(
  spec: NavigationMenuSpecializedAdapterSpec,
): AdapterOutputModel {
  const facts = getNavigationMenuSharedViewportFacts(spec);
  const files: AdapterOutputModel["files"] = [
    ...NAVIGATION_MENU_OUTPUT_MODEL_PARTS.map((partName) =>
      createNavigationMenuComponentFile(spec, partName, facts),
    ),
    createNavigationMenuIndexFile(spec, facts),
  ];

  return { files };
}

function createNavigationMenuComponentFile(
  spec: NavigationMenuSpecializedAdapterSpec,
  partName: AdapterSharedViewportNavigationPartName,
  facts: AdapterSharedViewportNavigationFacts,
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
      family: { facts, kind: "shared-viewport-navigation", part: partName },
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

function createNavigationMenuIndexFile(
  spec: NavigationMenuSpecializedAdapterSpec,
  facts: AdapterSharedViewportNavigationFacts,
): AdapterIndexFile {
  return {
    exports: {
      kind: "namespace",
      members: facts.index.importMembers,
      namespace: facts.exports.namespace,
    },
    family: { facts, kind: "shared-viewport-navigation" },
    imports: [],
    kind: "index",
    path: `${spec.component}/index.ts`,
    typeFacades: [],
  };
}

function getNavigationMenuSharedViewportFacts(
  spec: NavigationMenuSpecializedAdapterSpec,
): AdapterSharedViewportNavigationFacts {
  const errors = validateNavigationMenuSpecializedAdapterSpec(spec);
  if (errors.length > 0) {
    throw new Error(
      `Navigation Menu output model cannot print invalid Navigation Menu spec:\n${errors.join("\n")}`,
    );
  }

  const namespace = spec.navigationMenu.namespace;
  const recipes = spec.navigationMenu.partRecipes;
  const valueState = spec.navigationMenu.valueControl.state;
  const viewportState = spec.navigationMenu.viewportProjection.initialState;
  const sideOption = getFloatingOption(spec, "side");
  const alignOption = getFloatingOption(spec, "align");
  const sideOffsetOption = getFloatingOption(spec, "sideOffset");
  const alignOffsetOption = getFloatingOption(spec, "alignOffset");
  const avoidCollisionsOption = getFloatingOption(spec, "avoidCollisions");
  const collisionPaddingOption = getFloatingOption(spec, "collisionPadding");
  const exportsByPart = Object.fromEntries(
    NAVIGATION_MENU_OUTPUT_MODEL_PARTS.map((partName) => [
      partName,
      getNavigationMenuFileExportName(spec, partName),
    ]),
  ) as Record<AdapterSharedViewportNavigationPartName, string>;

  return {
    attrs: {
      active: recipes.link.active.attribute,
      align: alignOption.attribute,
      alignOffset: alignOffsetOption.attribute,
      arrow: getPartRecipe(spec, "arrow").discoveryAttribute,
      asChild: recipes.trigger.asChild.attribute,
      avoidCollisions: avoidCollisionsOption.attribute,
      closeDelay: recipes.options.rootDelay.closeDelay.attribute,
      closeOnEscape: recipes.options.dismissal.closeOnEscape.attribute,
      closeOnOutsideInteract: recipes.options.dismissal.closeOnOutsideInteract.attribute,
      collisionPadding: collisionPaddingOption.attribute,
      content: getPartRecipe(spec, "content").discoveryAttribute,
      controlledValue: valueState.controlledNullMarker.attribute,
      defaultValue: valueState.defaultValueAttribute,
      disabled: recipes.trigger.disabled.dataAttribute,
      icon: getPartRecipe(spec, "icon").discoveryAttribute,
      item: getPartRecipe(spec, "item").discoveryAttribute,
      itemValue: recipes.item.value.attribute,
      link: getPartRecipe(spec, "link").discoveryAttribute,
      linkCloseOnClick: recipes.link.closeOnClick.attribute,
      list: getPartRecipe(spec, "list").discoveryAttribute,
      openDelay: recipes.options.rootDelay.openDelay.attribute,
      orientation: recipes.list.orientation.attribute,
      popup: getPartRecipe(spec, "popup").discoveryAttribute,
      portal: getPartRecipe(spec, "portal").discoveryAttribute,
      positioner: getPartRecipe(spec, "positioner").discoveryAttribute,
      root: getPartRecipe(spec, "root").discoveryAttribute,
      side: sideOption.attribute,
      sideOffset: sideOffsetOption.attribute,
      trigger: getPartRecipe(spec, "trigger").discoveryAttribute,
      triggerCloseDelay: recipes.options.triggerDelay.closeDelay.attribute,
      triggerOpenDelay: recipes.options.triggerDelay.openDelay.attribute,
      value: valueState.controlledValueAttribute,
      viewport: getPartRecipe(spec, "viewport").discoveryAttribute,
    },
    content: {
      hiddenAttribute: recipes.content.hiddenAttribute,
      stateAttribute: recipes.content.stateAttribute,
      stateValue: recipes.content.initialState,
    },
    displayName: spec.displayName,
    exports: {
      ...exportsByPart,
      namespace: namespace.namespace,
    },
    floating: {
      align: getAdapterFamilyPropForTarget(spec, alignOption.prop, "positioner"),
      alignOffset: getAdapterFamilyProp(spec, alignOffsetOption.prop),
      avoidCollisions: getAdapterFamilyProp(spec, avoidCollisionsOption.prop),
      collisionPadding: getAdapterFamilyProp(spec, collisionPaddingOption.prop),
      side: getAdapterFamilyPropForTarget(spec, sideOption.prop, "positioner"),
      sideOffset: getAdapterFamilyProp(spec, sideOffsetOption.prop),
    },
    index: {
      importMembers: namespace.objectEntries.map((entry) => ({
        from: `./${getNavigationMenuFileExportName(spec, entry.part)}`,
        name: entry.exportName,
      })),
      namespaceMembers: namespace.objectEntries.map((entry) => ({
        key: entry.property,
        name: entry.exportName,
      })),
      typeExports: [
        `${namespace.namespace}Value`,
        spec.navigationMenu.valueControl.eventForwarding.detailsType,
      ],
    },
    item: {
      stateAttribute: recipes.item.stateAttribute,
      stateValue: recipes.item.initialState,
      valueProp: getAdapterFamilyPropForTarget(spec, recipes.item.value.prop, "item"),
    },
    link: {
      active: {
        ariaCurrentAttribute: recipes.link.active.ariaCurrentAttribute,
        ariaCurrentValue: recipes.link.active.ariaCurrentValue,
        prop: getAdapterFamilyPropForTarget(spec, recipes.link.active.prop, "link"),
      },
      closeOnClick: {
        falseValue: recipes.link.closeOnClick.falseValue,
        prop: getAdapterFamilyPropForTarget(spec, recipes.link.closeOnClick.prop, "link"),
      },
    },
    parts: Object.fromEntries(
      NAVIGATION_MENU_OUTPUT_MODEL_PARTS.map((partName) => [
        partName,
        getSharedViewportPartFacts(spec, partName, viewportState),
      ]),
    ) as AdapterSharedViewportNavigationFacts["parts"],
    positioner: getClosedStateForPart(spec, "positioner"),
    props: {
      closeDelay: getAdapterFamilyProp(spec, recipes.options.rootDelay.closeDelay.prop),
      closeOnEscape: getAdapterFamilyProp(spec, recipes.options.dismissal.closeOnEscape.prop),
      closeOnOutsideInteract: getAdapterFamilyProp(
        spec,
        recipes.options.dismissal.closeOnOutsideInteract.prop,
      ),
      defaultValue: getAdapterFamilyProp(spec, valueState.defaultProp),
      openDelay: getAdapterFamilyProp(spec, recipes.options.rootDelay.openDelay.prop),
      orientation: getAdapterFamilyPropForTarget(spec, recipes.list.orientation.prop, "root"),
      value: getAdapterFamilyProp(spec, valueState.controlledProp),
    },
    runtime: {
      cleanupEvent: spec.navigationMenu.lifecycle.cleanupEvent,
      destroyFunction: "destroyNavigationMenus",
      destroyMethod: spec.navigationMenu.lifecycle.destroyMethod,
      factory: spec.navigationMenu.lifecycle.factory,
      importSource: spec.root.runtimeImportSource,
      initEvents: [...spec.navigationMenu.lifecycle.initEvents],
      instancesName: "navigationMenuInstances",
      setupFunction: "setupNavigationMenus",
      typeImportSource: spec.root.runtimeImportSource.replace(/\/navigation-menu$/, ""),
    },
    trigger: {
      asChild: getAdapterFamilyPropForTarget(spec, recipes.trigger.asChild.prop, "trigger"),
      closeDelay: getAdapterFamilyPropForTarget(
        spec,
        recipes.options.triggerDelay.closeDelay.prop,
        "trigger",
      ),
      disabled: {
        ariaAttribute: recipes.trigger.disabled.ariaAttribute,
        dataAttribute: recipes.trigger.disabled.dataAttribute,
        nativeAttribute: recipes.trigger.disabled.nativeAttribute,
        prop: getAdapterFamilyPropForTarget(spec, recipes.trigger.disabled.prop, "trigger"),
      },
      disclosure: recipes.trigger.disclosure,
      openDelay: getAdapterFamilyPropForTarget(
        spec,
        recipes.options.triggerDelay.openDelay.prop,
        "trigger",
      ),
      typeAttribute: recipes.trigger.typeAttribute,
    },
    valueControl: {
      event: {
        callbackProp: spec.navigationMenu.valueControl.eventForwarding.callbackProp,
        detailsType: spec.navigationMenu.valueControl.eventForwarding.detailsType,
        name: spec.navigationMenu.valueControl.eventForwarding.name,
        valueProperty: spec.navigationMenu.valueControl.eventForwarding.valueProperty,
        valueType: spec.navigationMenu.valueControl.eventForwarding.valueType,
      },
      controlledResync: spec.navigationMenu.valueControl.controlledResync,
      state: {
        controlledNullMarker: valueState.controlledNullMarker,
        defaultValueAttribute: valueState.defaultValueAttribute,
        getter: valueState.getter,
        renderedStateAttribute: valueState.renderedStateAttribute,
      },
    },
  };
}

export function validateNavigationMenuSpecializedAdapterSpec(
  spec: NavigationMenuSpecializedAdapterSpec,
): string[] {
  const errors = validateSpecializedAdapterSpec(spec);
  if (!isRecord(spec) || spec.component !== "navigation-menu") {
    errors.push(
      "Navigation Menu specialized adapter spec must target the navigation-menu primitive.",
    );
    return errors;
  }

  const navigationMenu = isRecord(spec.navigationMenu) ? spec.navigationMenu : undefined;
  if (!navigationMenu) {
    errors.push(
      "Navigation Menu specialized adapter spec is missing shared viewport recipe metadata.",
    );
    return errors;
  }

  if (navigationMenu.adapterKind !== "shared-viewport-navigation") {
    errors.push(
      'Navigation Menu specialized adapter spec adapterKind must be "shared-viewport-navigation".',
    );
  }

  for (const part of NAVIGATION_MENU_REQUIRED_ROOT_PARTS) {
    if (!hasPart(spec, part)) {
      errors.push(`Navigation Menu specialized adapter spec requires ${part} part.`);
    }
  }

  errors.push(...validateRootParts(navigationMenu.rootParts));
  errors.push(...validateAnatomy(spec, navigationMenu.anatomy));
  errors.push(...validateValueState(spec, navigationMenu.valueState));
  if (!hasSetter(spec, "setValue")) {
    errors.push("Navigation Menu specialized adapter spec requires setValue setter sync.");
  }
  errors.push(...validateValueControl(spec, navigationMenu.valueControl));
  errors.push(...validateFloating(navigationMenu.floating));
  errors.push(...validateNamespace(spec, navigationMenu.namespace));
  errors.push(...validateLifecycle(navigationMenu.lifecycle));
  errors.push(...validateNestedRootPolicy(navigationMenu.nestedRootPolicy));
  errors.push(...validatePartRecipes(spec, navigationMenu.partRecipes));
  errors.push(...validateViewportProjection(spec, navigationMenu.viewportProjection));
  errors.push(...validateRuntimeBoundary(navigationMenu.runtimeBoundary));
  errors.push(...validateForbiddenMenuRecipes(navigationMenu));

  return errors;
}

export function printNavigationMenuSharedViewportFixture(
  spec: NavigationMenuSpecializedAdapterSpec,
): SpecializedAdapterSpecPrintedFile[] {
  const errors = validateNavigationMenuSpecializedAdapterSpec(spec);
  if (errors.length > 0) {
    throw new Error(
      `Navigation Menu shared viewport fixture cannot print invalid Navigation Menu spec:\n${errors.join("\n")}`,
    );
  }

  return [
    {
      contents: renderNavigationMenuSharedViewportFixture(spec),
      path: "__future-fixtures/shared-viewport-navigation/navigation-menu/NavigationMenuSharedViewport.fixture.ts",
    },
    {
      contents: `// ${NAVIGATION_MENU_SHARED_VIEWPORT_FIXTURE_COMMENT}\nexport { navigationMenuSharedViewportFixture } from "./NavigationMenuSharedViewport.fixture";\n`,
      path: "__future-fixtures/shared-viewport-navigation/navigation-menu/index.ts",
    },
  ];
}

function renderNavigationMenuSharedViewportFixture(
  spec: NavigationMenuSpecializedAdapterSpec,
): string {
  const navigationMenu = spec.navigationMenu;
  const rootParts = NAVIGATION_MENU_REQUIRED_ROOT_PARTS.join(", ");
  const lines = [
    `component: ${spec.component}`,
    `adapterKind: ${navigationMenu.adapterKind}`,
    `runtime: ${spec.root.runtimeFactory} from ${spec.root.runtimeImportSource}`,
    `rootParts: ${rootParts}`,
    `namespace.named: ${navigationMenu.namespace.namedExports.join(", ")}`,
    `lifecycle: ${navigationMenu.lifecycle.factory} init=${navigationMenu.lifecycle.initEvents.join(", ")} cleanup=${navigationMenu.lifecycle.cleanupEvent}`,
    `nestedRootPolicy: ${navigationMenu.nestedRootPolicy.policy} at ${navigationMenu.nestedRootPolicy.boundaryPart}`,
    `partRecipes.trigger: asChild merges ${navigationMenu.partRecipes.trigger.asChild.merges.join(", ")} disabled ${navigationMenu.partRecipes.trigger.disabled.dataAttribute}`,
    `partRecipes.item: ${navigationMenu.partRecipes.item.value.prop} -> ${navigationMenu.partRecipes.item.value.attribute}`,
    `partRecipes.link: active ${navigationMenu.partRecipes.link.active.attribute}/${navigationMenu.partRecipes.link.active.ariaCurrentAttribute} closeOnClick ${navigationMenu.partRecipes.link.closeOnClick.attribute}`,
    `viewportProjection: ${navigationMenu.viewportProjection.activeContent.fromPart} -> ${navigationMenu.viewportProjection.activeContent.toPart} hidden=${navigationMenu.viewportProjection.initialState.hiddenParts.join(", ")} placement=${navigationMenu.viewportProjection.floating.placementStateTargets.join(", ")}`,
    `viewportProjection.css: ${navigationMenu.viewportProjection.cssVariables.sizing.variables.join(", ")}`,
    `valueControl.event: ${navigationMenu.valueControl.eventForwarding.domEvent} -> ${navigationMenu.valueControl.eventForwarding.callbackProp}(${navigationMenu.valueControl.eventForwarding.valueProperty}, details)`,
    `valueControl.controlledResync: ${navigationMenu.valueControl.controlledResync.setter} preserves ${navigationMenu.valueControl.controlledResync.preserveDetailFields.join(", ")}`,
    `valueState: ${navigationMenu.valueState.controlledProp}/${navigationMenu.valueState.defaultProp} -> ${navigationMenu.valueState.getter}/${navigationMenu.valueState.setter}`,
    `floating: ${navigationMenu.floating.anchorPart} -> ${navigationMenu.floating.portalPart}/${navigationMenu.floating.positionerPart}/${navigationMenu.floating.popupPart} options ${navigationMenu.floating.optionProps.join(", ")}`,
    ...navigationMenu.runtimeBoundary.map((boundary) => `runtimeBoundary: ${boundary}`),
  ];

  return `// ${NAVIGATION_MENU_SHARED_VIEWPORT_FIXTURE_COMMENT}\nexport const navigationMenuSharedViewportFixture = [\n${lines
    .map((line) => `  ${JSON.stringify(line)},`)
    .join("\n")}\n] as const;\n`;
}

function getNavigationMenuFileExportName(
  spec: NavigationMenuSpecializedAdapterSpec,
  partName: string,
): string {
  const file = spec.files.find(
    (candidate) => candidate.kind === "part" && candidate.part === partName,
  );
  if (!file || file.kind !== "part") {
    throw new Error(`Navigation Menu output model requires ${partName} part file metadata.`);
  }

  const expectedPath = `${spec.component}/${file.exportName}`;
  if (file.path !== expectedPath) {
    throw new Error(
      `Navigation Menu output model requires ${partName} file path ${expectedPath}.`,
    );
  }

  return file.exportName;
}

function getSharedViewportPartFacts(
  spec: NavigationMenuSpecializedAdapterSpec,
  partName: AdapterSharedViewportNavigationPartName,
  viewportState: NavigationMenuViewportProjectionRecipe["initialState"],
): AdapterSharedViewportNavigationFacts["parts"][AdapterSharedViewportNavigationPartName] {
  const part = getPartRecipe(spec, partName);
  const namespaceEntry = spec.navigationMenu.namespace.objectEntries.find(
    (entry) => entry.part === partName,
  );
  if (!namespaceEntry) {
    throw new Error(`Navigation Menu output model requires ${partName} namespace metadata.`);
  }
  const anatomyPart = spec.navigationMenu.anatomy.find((entry) => entry.part === partName);

  return {
    defaultElement: part.defaultElement,
    discoveryAttribute: part.discoveryAttribute,
    name: part.name,
    namespaceKey: namespaceEntry.property,
    ...(anatomyPart?.initialAttributes.includes("aria-hidden") ? { ariaHidden: true } : {}),
    ...(viewportState.hiddenParts.includes(partName)
      ? {
          hidden: true,
          hiddenAttribute: viewportState.hiddenAttribute,
          stateAttribute: viewportState.stateAttribute,
          stateValue: viewportState.closedValue,
        }
      : {}),
  };
}

function getClosedStateForPart(
  spec: NavigationMenuSpecializedAdapterSpec,
  partName: string,
): { stateAttribute: string; stateValue: string } {
  const initialState = spec.navigationMenu.viewportProjection.initialState;
  if (!initialState.closedParts.includes(partName)) {
    throw new Error(`Navigation Menu output model requires ${partName} closed initial state.`);
  }

  return {
    stateAttribute: initialState.stateAttribute,
    stateValue: initialState.closedValue,
  };
}

function getFloatingOption(
  spec: NavigationMenuSpecializedAdapterSpec,
  propName: string,
): NavigationMenuFloatingOptionRecipe {
  const option = spec.navigationMenu.viewportProjection.floatingOptions.find(
    (candidate) => candidate.prop === propName,
  );
  if (!option) {
    throw new Error(`Navigation Menu output model requires ${propName} floating option.`);
  }

  return option;
}

function getAdapterFamilyProp(spec: SpecializedAdapterSpec, propName: string) {
  const prop = getProp(spec, propName);

  return {
    ...(prop.defaultValue ? { defaultValue: prop.defaultValue } : {}),
    name: prop.name,
    ...(prop.required ? { required: prop.required } : {}),
    type: prop.type,
  };
}

function getAdapterFamilyPropForTarget(
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

function validateRootParts(value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Navigation Menu specialized adapter spec requires rootParts metadata."];
  }

  return NAVIGATION_MENU_REQUIRED_ROOT_PARTS.flatMap((part) => {
    if (value[part] !== part) {
      return [
        `Navigation Menu specialized adapter spec rootParts.${part} "${String(value[part])}" must be "${part}".`,
      ];
    }

    return [];
  });
}

function buildAnatomyRecipes(spec: SpecializedAdapterSpec): NavigationMenuAnatomyRecipe[] {
  return NAVIGATION_MENU_ANATOMY_PARTS.map((partName) => {
    const part = getPartRecipe(spec, partName);

    return {
      defaultElement: part.defaultElement,
      discoveryAttribute: part.discoveryAttribute,
      initialAttributes: spec.renderPlan.staticAttributes
        .filter((attribute) => attribute.part === partName)
        .map((attribute) => attribute.name),
      part: part.name,
      publicRef: hasPublicRef(spec, partName),
    };
  });
}

function buildNamespaceRecipe(spec: SpecializedAdapterSpec): NavigationMenuNamespaceRecipe {
  const membersByPart = new Map(spec.exports.members.map((member) => [member.part, member]));
  const objectEntries = NAVIGATION_MENU_NAMESPACE_PART_ORDER.map((part) => {
    const member = membersByPart.get(part);
    if (!member) {
      throw new Error(`Navigation Menu specialized adapter spec requires ${part} export metadata.`);
    }

    return {
      exportName: member.name,
      part,
      property: member.name.replace(/^NavigationMenu/, ""),
    };
  });

  return {
    defaultExport: "NavigationMenu",
    defaultNamespace: spec.exports.defaultNamespace,
    memberParts: [...NAVIGATION_MENU_NAMESPACE_PART_ORDER],
    namedExports: ["NavigationMenu", ...objectEntries.map((entry) => entry.exportName)],
    namespace: "NavigationMenu",
    objectEntries,
  };
}

function buildLifecycleRecipe(): NavigationMenuLifecycleRecipe {
  return {
    cleanupEvent: "before-swap",
    destroyMethod: "destroy",
    factory: "createNavigationMenu",
    initEvents: ["initial-load", "after-swap", "starwind:init"],
    instanceStore: "Set<ReturnType<typeof createNavigationMenu>>",
    effectSync: {
      cleanup: "instance.destroy()",
      remountDependencies: ["openDelay", "closeDelay", "closeOnEscape", "closeOnOutsideInteract"],
      setterSync: "setValue(value, { emit: false })",
    },
  };
}

function buildNestedRootPolicyRecipe(): NavigationMenuNestedRootPolicyRecipe {
  return {
    boundaryPart: "content",
    contractOwnedFacts: [
      "nested roots inside Content are not auto-initialized",
      "parent controllers ignore descendant Navigation Menu parts",
    ],
    policy: "inert",
    runtimeBoundary: "nested root detection and inert controller policy",
  };
}

function buildPartRecipes(spec: SpecializedAdapterSpec): NavigationMenuPartRecipes {
  const triggerAsChild = spec.asChild.find((entry) => entry.part === "trigger");
  if (!triggerAsChild) {
    throw new Error("Navigation Menu specialized adapter spec requires trigger asChild metadata.");
  }
  if (!arraysEqual(triggerAsChild.merges, ["aria", "className", "data", "ref", "style"])) {
    throw new Error(
      "Navigation Menu specialized adapter spec trigger asChild merges must include aria, className, data, ref, style.",
    );
  }
  const rootOpenDelay = getPropForTarget(spec, "openDelay", "root");
  const rootCloseDelay = getPropForTarget(spec, "closeDelay", "root");
  const triggerOpenDelay = getPropForTarget(spec, "openDelay", "trigger");
  const triggerCloseDelay = getPropForTarget(spec, "closeDelay", "trigger");
  const closeOnEscape = getProp(spec, "closeOnEscape");
  const closeOnOutsideInteract = getProp(spec, "closeOnOutsideInteract");
  const itemValue = getPropForTarget(spec, "value", "item");
  const linkActive = getPropForTarget(spec, "active", "link");
  const linkCloseOnClick = getPropForTarget(spec, "closeOnClick", "link");
  const orientation = getPropForTarget(spec, "orientation", "root");
  const triggerDisabled = getPropForTarget(spec, "disabled", "trigger");

  return {
    content: {
      defaultElement: getPartRecipe(spec, "content").defaultElement as "div",
      hiddenAttribute: getStaticAttributeName(spec, "content", "hidden"),
      initialState: "closed",
      part: "content",
      stateAttribute: getStaticAttributeName(spec, "content", "data-state"),
    },
    item: {
      defaultElement: getPartRecipe(spec, "item").defaultElement as "li",
      fallbackValueExpectation: "adapter-renders-data-value-when-item-value-prop-is-provided",
      initialState: "closed",
      part: "item",
      stateAttribute: getStaticAttributeName(spec, "item", "data-state"),
      value: {
        attribute: getStaticAttributeName(spec, "item", "data-value"),
        prop: itemValue.name,
        required: itemValue.required === true,
        type: itemValue.type,
      },
    },
    link: {
      active: {
        ariaCurrentAttribute: getStaticAttributeName(spec, "link", "aria-current"),
        ariaCurrentValue: "page",
        attribute: getStaticAttributeName(spec, "link", "data-active"),
        defaultValue: linkActive.defaultValue ?? "false",
        prop: linkActive.name,
      },
      closeOnClick: {
        attribute: getStaticAttributeName(spec, "link", "data-close-on-click"),
        defaultValue: linkCloseOnClick.defaultValue ?? "true",
        falseValue: "false",
        prop: linkCloseOnClick.name,
      },
      defaultElement: getPartRecipe(spec, "link").defaultElement as "a",
      part: "link",
    },
    list: {
      defaultElement: getPartRecipe(spec, "list").defaultElement as "ul",
      orientation: {
        attribute: getStaticAttributeName(spec, "root", "data-orientation"),
        inheritedFrom: "root",
        prop: orientation.name,
        values: ["horizontal", "vertical"],
      },
      part: "list",
    },
    options: {
      dismissal: {
        closeOnEscape: {
          attribute: getStaticAttributeName(spec, "root", "data-close-on-escape"),
          defaultValue: closeOnEscape.defaultValue ?? "true",
          prop: closeOnEscape.name,
        },
        closeOnOutsideInteract: {
          attribute: getStaticAttributeName(spec, "root", "data-close-on-outside-interact"),
          defaultValue: closeOnOutsideInteract.defaultValue ?? "true",
          prop: closeOnOutsideInteract.name,
        },
      },
      rootDelay: {
        closeDelay: {
          attribute: getStaticAttributeName(spec, "root", "data-close-delay"),
          defaultValue: rootCloseDelay.defaultValue ?? "50",
          prop: rootCloseDelay.name,
        },
        openDelay: {
          attribute: getStaticAttributeName(spec, "root", "data-open-delay"),
          defaultValue: rootOpenDelay.defaultValue ?? "50",
          prop: rootOpenDelay.name,
        },
      },
      triggerDelay: {
        closeDelay: {
          attribute: getStaticAttributeName(spec, "trigger", "data-close-delay"),
          defaultValue: triggerCloseDelay.defaultValue ?? "50",
          prop: triggerCloseDelay.name,
        },
        openDelay: {
          attribute: getStaticAttributeName(spec, "trigger", "data-open-delay"),
          defaultValue: triggerOpenDelay.defaultValue ?? "50",
          prop: triggerOpenDelay.name,
        },
      },
    },
    runtimeBoundary: [
      "orientation-driven keyboard mapping",
      "focus movement and restoration",
      "trigger/content/value coordination",
    ],
    trigger: {
      asChild: {
        attribute: getStaticAttributeName(spec, "trigger", "data-as-child"),
        merges: [...triggerAsChild.merges] as ["aria", "className", "data", "ref", "style"],
        part: "trigger",
        prop: "asChild",
      },
      defaultElement: getPartRecipe(spec, "trigger").defaultElement as "button",
      disabled: {
        ariaAttribute: "aria-disabled",
        dataAttribute: getStaticAttributeName(spec, "trigger", "data-disabled"),
        nativeAttribute: "disabled",
        prop: triggerDisabled.name,
      },
      disclosure: {
        ariaExpanded: getStaticAttributeName(spec, "trigger", "aria-expanded"),
        ariaHaspopup: {
          attribute: getStaticAttributeName(spec, "trigger", "aria-haspopup"),
          value: getStaticAttributeValue(spec, "trigger", "aria-haspopup") as "menu",
        },
        closedStateValue: "closed",
        stateAttribute: getStaticAttributeName(spec, "trigger", "data-state"),
      },
      part: "trigger",
      publicRef: hasPublicRef(spec, "trigger"),
      typeAttribute: {
        attribute: getStaticAttributeName(spec, "trigger", "type"),
        value: getStaticAttributeValue(spec, "trigger", "type") as "button",
      },
    },
  };
}

function buildViewportProjectionRecipe(
  spec: SpecializedAdapterSpec,
  floating: NonNullable<SpecializedAdapterSpec["renderPlan"]["floating"]>,
): NavigationMenuViewportProjectionRecipe {
  const presence = spec.renderPlan.presence;
  if (!presence) {
    throw new Error("Navigation Menu specialized adapter spec requires presence metadata.");
  }

  const hiddenParts = presence.initialHiddenParts.filter((part) =>
    Object.values(NAVIGATION_MENU_VIEWPORT_PROJECTION_TARGETS).includes(
      part as (typeof NAVIGATION_MENU_VIEWPORT_PROJECTION_TARGETS)[keyof typeof NAVIGATION_MENU_VIEWPORT_PROJECTION_TARGETS],
    ),
  );
  hiddenParts.forEach((part) => getStaticAttributeName(spec, part, "hidden"));
  const closedParts = ["arrow", "content", "positioner", "popup", "viewport"].filter((part) =>
    hasStaticAttribute(spec, part, "data-state"),
  );

  return {
    activationDirection: {
      attribute: "data-activation-direction",
      runtimeOwnership: "computed-from-active-item-order",
      targets: [...NAVIGATION_MENU_VIEWPORT_STATE_TARGETS],
      values: ["initial", "next", "previous", "current"],
    },
    activeContent: {
      fromPart: "content",
      placeholder: "navigation-menu-content-placeholder",
      runtimeOwnership: "moves-active-content-into-shared-viewport",
      toPart: "viewport",
    },
    cssVariables: {
      sizing: {
        runtimeMutated: true,
        targets: {
          content: [...NAVIGATION_MENU_VIEWPORT_CSS_TARGETS.content],
          popup: [...NAVIGATION_MENU_VIEWPORT_CSS_TARGETS.popup],
          positioner: [...NAVIGATION_MENU_VIEWPORT_CSS_TARGETS.positioner],
          root: [...NAVIGATION_MENU_VIEWPORT_CSS_TARGETS.root],
          viewport: [...NAVIGATION_MENU_VIEWPORT_CSS_TARGETS.viewport],
        },
        variables: [...NAVIGATION_MENU_VIEWPORT_SIZING_VARIABLES],
      },
      transformOrigin: {
        targets: [...NAVIGATION_MENU_PLACEMENT_SURFACE_TARGETS],
        variable: "--transform-origin",
      },
    },
    floating: {
      adaptiveOrigin: true,
      fallbackFloatingPart: "popup",
      floatingPart: floating.positionerPart,
      optionProps: [...floating.optionProps],
      placementStateTargets: [...NAVIGATION_MENU_PLACEMENT_STATE_TARGETS] as [
        "arrow",
        "popup",
        "viewport",
      ],
      reference: "active-trigger",
    },
    floatingOptions: buildViewportProjectionFloatingOptions(spec, floating.optionProps),
    initialState: {
      closedParts,
      closedValue: "closed",
      hiddenAttribute: "hidden",
      hiddenParts,
      openValue: "open",
      stateAttribute: "data-state",
    },
    instantState: {
      attribute: "data-instant",
      positionOnlyTargets: ["positioner"],
      stateTargets: [...NAVIGATION_MENU_VIEWPORT_STATE_TARGETS],
      timing: "requestAnimationFrame-cleared",
    },
    placementAttributes: {
      align: "data-align",
      side: "data-side",
      stateTargets: [...NAVIGATION_MENU_PLACEMENT_SURFACE_TARGETS],
    },
    projectionTargets: NAVIGATION_MENU_VIEWPORT_PROJECTION_TARGETS,
    runtimeBoundary: [...NAVIGATION_MENU_VIEWPORT_PROJECTION_RUNTIME_BOUNDARY],
  };
}

function buildViewportProjectionFloatingOptions(
  spec: SpecializedAdapterSpec,
  optionProps: readonly string[],
): NavigationMenuFloatingOptionRecipe[] {
  return optionProps.map((propName) => {
    const attribute =
      NAVIGATION_MENU_FLOATING_OPTION_ATTRIBUTES[
        propName as keyof typeof NAVIGATION_MENU_FLOATING_OPTION_ATTRIBUTES
      ];
    if (!attribute) {
      throw new Error(
        `Navigation Menu specialized adapter spec requires floating option attribute metadata for ${propName}.`,
      );
    }

    const prop = getProp(spec, propName);
    const targets = [...(prop.targets ?? [])];
    if (targets.length === 0) {
      throw new Error(
        `Navigation Menu specialized adapter spec requires floating option targets for ${propName}.`,
      );
    }
    targets.forEach((target) => getStaticAttributeName(spec, target, attribute));

    return {
      attribute,
      defaultValue: prop.defaultValue ?? "",
      prop: prop.name,
      targets,
    };
  });
}

function buildValueControlRecipe(
  spec: SpecializedAdapterSpec,
  valueState = getStateModel(spec, "value"),
  valueEvent = getEvent(spec, "valueChange"),
  valueSetter = getSetter(spec, "setValue"),
): NavigationMenuValueControlRecipe {
  const controlledValueAttribute = getStaticAttributeName(spec, "root", "data-value");
  const controlledNullAttribute = getStaticAttributeName(spec, "root", "data-controlled-value");
  const defaultValueAttribute = getStaticAttributeName(spec, "root", "data-default-value");
  const renderedStateAttribute = getStaticAttributeName(spec, "root", "data-state");

  if (
    valueState.controlledProp !== "value" ||
    valueState.defaultProp !== "defaultValue" ||
    valueState.runtimeGetter !== "getValue" ||
    valueState.runtimeSetter !== "setValue" ||
    valueState.valueType !== "string | null"
  ) {
    throw new Error(
      "Navigation Menu specialized adapter spec requires the root value state model.",
    );
  }
  if (
    valueEvent.name !== "valueChange" ||
    valueEvent.callbackProp !== "onValueChange" ||
    valueEvent.callbackTiming !== "before-state-commit" ||
    valueEvent.cancelable !== true ||
    valueEvent.detailsType !== "NavigationMenuValueChangeDetails" ||
    valueEvent.domEvent !== "starwind:value-change" ||
    valueEvent.emitsFrom !== "root" ||
    valueEvent.valueProperty !== "value" ||
    valueEvent.valueType !== "string | null"
  ) {
    throw new Error(
      "Navigation Menu specialized adapter spec requires before-commit valueChange event metadata.",
    );
  }
  if (
    valueSetter.method !== "setValue" ||
    valueSetter.stateModel !== "value" ||
    valueSetter.suppressesEmit !== true ||
    !recordsEqual(valueSetter.options, { emit: false })
  ) {
    throw new Error(
      "Navigation Menu specialized adapter spec requires setValue emit-suppressed setter sync.",
    );
  }

  return {
    eventForwarding: {
      callbackProp: "onValueChange",
      callbackTiming: "before-state-commit",
      cancelable: true,
      detailsType: "NavigationMenuValueChangeDetails",
      domEvent: "starwind:value-change",
      emitsFrom: "root",
      name: "valueChange",
      valueProperty: "value",
      valueType: "string | null",
    },
    controlledResync: {
      ...NAVIGATION_MENU_CONTROLLED_RESYNC,
      preserveDetailFields: [...NAVIGATION_MENU_CONTROLLED_RESYNC.preserveDetailFields],
    },
    setterSync: {
      method: "setValue",
      options: { emit: false },
      stateModel: "value",
      suppressesEmit: true,
    },
    state: {
      controlledStateSync: "unsupported",
      controlledNullMarker: {
        attribute: controlledNullAttribute,
        value: "",
      },
      controlledProp: "value",
      controlledValueAttribute,
      defaultProp: "defaultValue",
      defaultValueAttribute,
      getter: "getValue",
      name: "value",
      renderedStateAttribute,
      setter: "setValue",
      valueType: "string | null",
    },
  };
}

function validateAnatomy(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!Array.isArray(value)) {
    return ["Navigation Menu specialized adapter spec requires anatomy metadata."];
  }

  const errors: string[] = [];
  const missingParts = NAVIGATION_MENU_ANATOMY_PARTS.filter((part) => !hasPart(spec, part));
  for (const part of missingParts) {
    errors.push(`Navigation Menu specialized adapter spec requires ${part} anatomy part.`);
  }
  if (missingParts.length > 0) {
    return errors;
  }

  const expected = buildAnatomyRecipes(spec);
  for (const expectedPart of expected) {
    const actualPart = value.find(
      (candidate) => isRecord(candidate) && candidate.part === expectedPart.part,
    );
    if (!recordsEqual(actualPart, expectedPart)) {
      errors.push(
        `Navigation Menu specialized adapter spec anatomy for ${expectedPart.part} must match contract metadata.`,
      );
    }
  }

  if (
    !arraysEqual(
      value.map((part) => (isRecord(part) ? part.part : undefined)),
      expected.map((part) => part.part),
    )
  ) {
    errors.push(
      "Navigation Menu specialized adapter spec anatomy order must match contract order.",
    );
  }

  return errors;
}

function validateValueState(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Navigation Menu specialized adapter spec requires value state metadata."];
  }

  const state = getStateModel(spec, "value");
  const errors: string[] = [];
  const expected = {
    controlledProp: "value",
    defaultProp: "defaultValue",
    getter: "getValue",
    name: "value",
    setter: "setValue",
    valueType: "string | null",
  };
  for (const [field, expectedValue] of Object.entries(expected)) {
    if (value[field] !== expectedValue) {
      errors.push(
        `Navigation Menu specialized adapter spec valueState.${field} "${String(value[field])}" must be "${expectedValue}".`,
      );
    }
  }
  if (
    state.controlledProp !== expected.controlledProp ||
    state.defaultProp !== expected.defaultProp ||
    state.runtimeGetter !== expected.getter ||
    state.runtimeSetter !== expected.setter ||
    state.valueType !== expected.valueType
  ) {
    errors.push("Navigation Menu specialized adapter spec requires the root value state model.");
  }

  return errors;
}

function validateFloating(value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Navigation Menu specialized adapter spec requires floating metadata."];
  }

  const errors: string[] = [];
  for (const [field, expected] of [
    ["anchorPart", "trigger"],
    ["portalPart", "portal"],
    ["positionerPart", "positioner"],
    ["popupPart", "popup"],
  ] as const) {
    if (value[field] !== expected) {
      errors.push(
        `Navigation Menu specialized adapter spec floating ${field} "${String(value[field])}" must be "${expected}".`,
      );
    }
  }

  const optionProps = Array.isArray(value.optionProps) ? value.optionProps : [];
  const missingOptions = NAVIGATION_MENU_FLOATING_OPTION_PROPS.filter(
    (option) => !optionProps.includes(option),
  );
  if (missingOptions.length > 0) {
    errors.push(
      "Navigation Menu specialized adapter spec floating optionProps must include side, align, sideOffset, alignOffset, avoidCollisions, collisionPadding.",
    );
  }

  return errors;
}

function validateValueControl(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Navigation Menu specialized adapter spec requires valueControl metadata."];
  }

  let expected: NavigationMenuValueControlRecipe;
  try {
    expected = buildValueControlRecipe(spec);
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }

  const errors: string[] = [];
  errors.push(
    ...validateRecordFields(
      value.eventForwarding,
      expected.eventForwarding,
      "Navigation Menu specialized adapter spec valueControl.eventForwarding",
    ),
  );
  if (!recordsEqual(value.setterSync, expected.setterSync)) {
    errors.push(
      "Navigation Menu specialized adapter spec valueControl.setterSync must call setValue with emit suppressed.",
    );
  }
  if (!recordsEqual(value.state, expected.state)) {
    const state = isRecord(value.state) ? value.state : {};
    const marker = isRecord(state.controlledNullMarker) ? state.controlledNullMarker : {};
    if (marker.attribute !== "data-controlled-value") {
      errors.push(
        "Navigation Menu specialized adapter spec static Astro controlled null marker must use data-controlled-value.",
      );
    } else {
      errors.push(
        "Navigation Menu specialized adapter spec valueControl.state must match value state attributes.",
      );
    }
  }
  errors.push(...validateControlledResync(value.controlledResync));

  return errors;
}

function validateControlledResync(value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Navigation Menu specialized adapter spec requires controlled resync metadata."];
  }

  const expected = NAVIGATION_MENU_CONTROLLED_RESYNC;
  const errors: string[] = [];
  if (!arraysEqual(asArray(value.preserveDetailFields), expected.preserveDetailFields)) {
    errors.push(
      "Navigation Menu specialized adapter spec controlled resync must preserve event, reason, and trigger details.",
    );
  }
  for (const field of [
    "detailsValueProperty",
    "runtimeBoundary",
    "setter",
  ] as const) {
    if (!recordsEqual(value[field], expected[field])) {
      errors.push(
        `Navigation Menu specialized adapter spec controlled resync ${field} must match Runtime value-control facts.`,
      );
    }
  }

  return errors;
}

function validatePartRecipes(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Navigation Menu specialized adapter spec requires partRecipes metadata."];
  }

  let expected: NavigationMenuPartRecipes;
  try {
    expected = buildPartRecipes(spec);
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }

  const errors: string[] = [];
  const expectedFields = new Set([
    "content",
    "item",
    "link",
    "list",
    "options",
    "runtimeBoundary",
    "trigger",
  ]);
  for (const field of Object.keys(value)) {
    if (!expectedFields.has(field)) {
      errors.push(
        `Navigation Menu specialized adapter spec partRecipes must not declare unexpected field "${field}".`,
      );
    }
  }

  const trigger = isRecord(value.trigger) ? value.trigger : {};
  const triggerAsChild = isRecord(trigger.asChild) ? trigger.asChild : {};
  if (!arraysEqual(asArray(triggerAsChild.merges), expected.trigger.asChild.merges)) {
    errors.push(
      "Navigation Menu specialized adapter spec trigger asChild merges must include aria, className, data, ref, style.",
    );
  } else if (!recordsEqual(trigger, expected.trigger)) {
    errors.push(
      "Navigation Menu specialized adapter spec trigger recipe must match contract metadata.",
    );
  }

  const link = isRecord(value.link) ? value.link : {};
  const linkActive = isRecord(link.active) ? link.active : {};
  if (
    linkActive.ariaCurrentAttribute !== "aria-current" ||
    linkActive.ariaCurrentValue !== "page" ||
    linkActive.attribute !== "data-active"
  ) {
    errors.push(
      "Navigation Menu specialized adapter spec link active metadata must preserve aria-current page projection.",
    );
  } else if (!recordsEqual(link, expected.link)) {
    errors.push(
      "Navigation Menu specialized adapter spec link recipe must match contract metadata.",
    );
  }

  if (!recordsEqual(value.options, expected.options)) {
    errors.push(
      "Navigation Menu specialized adapter spec option recipes must match Runtime option attributes.",
    );
  }

  for (const field of ["content", "item", "list", "runtimeBoundary"] as const) {
    if (!recordsEqual(value[field], expected[field])) {
      errors.push(
        `Navigation Menu specialized adapter spec ${field} recipe must match contract metadata.`,
      );
    }
  }

  return errors;
}

function validateViewportProjection(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Navigation Menu specialized adapter spec requires viewportProjection metadata."];
  }

  let expected: NavigationMenuViewportProjectionRecipe;
  try {
    const floating = spec.renderPlan.floating;
    if (!floating) {
      throw new Error("Navigation Menu specialized adapter spec requires floating metadata.");
    }
    expected = buildViewportProjectionRecipe(spec, floating);
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }

  const errors: string[] = [];
  const expectedFields = new Set([
    "activationDirection",
    "activeContent",
    "cssVariables",
    "floating",
    "floatingOptions",
    "initialState",
    "instantState",
    "placementAttributes",
    "projectionTargets",
    "runtimeBoundary",
  ]);
  for (const field of Object.keys(value)) {
    if (!expectedFields.has(field)) {
      errors.push(
        `Navigation Menu specialized adapter spec viewportProjection must not declare unexpected field "${field}".`,
      );
    }
  }

  if (!recordsEqual(value.cssVariables, expected.cssVariables)) {
    errors.push(
      "Navigation Menu specialized adapter spec viewport projection CSS variables must match Runtime-mutated surface boundaries.",
    );
  }

  if (!recordsEqual(value.floating, expected.floating)) {
    errors.push(
      "Navigation Menu specialized adapter spec viewport projection floating metadata must match Runtime floating boundary.",
    );
  }

  if (!recordsEqual(value.floatingOptions, expected.floatingOptions)) {
    errors.push(
      "Navigation Menu specialized adapter spec viewport projection floating option metadata must reuse generic-adapter-plan floating option props.",
    );
  }

  if (!recordsEqual(value.initialState, expected.initialState)) {
    errors.push(
      "Navigation Menu specialized adapter spec viewport projection initial state metadata must match presence and static attributes.",
    );
  }

  for (const field of [
    "activationDirection",
    "activeContent",
    "instantState",
    "placementAttributes",
    "projectionTargets",
    "runtimeBoundary",
  ] as const) {
    if (!recordsEqual(value[field], expected[field])) {
      errors.push(
        `Navigation Menu specialized adapter spec viewport projection ${field} metadata must match Runtime boundary facts.`,
      );
    }
  }

  return errors;
}

function validateNamespace(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Navigation Menu specialized adapter spec requires namespace metadata."];
  }

  let expected: NavigationMenuNamespaceRecipe;
  try {
    expected = buildNamespaceRecipe(spec);
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }
  const errors: string[] = [];
  if (value.defaultNamespace !== true) {
    errors.push(
      "Navigation Menu specialized adapter spec namespace must keep defaultNamespace enabled.",
    );
  }
  if (value.defaultExport !== expected.defaultExport || value.namespace !== expected.namespace) {
    errors.push("Navigation Menu specialized adapter spec namespace name must be NavigationMenu.");
  }
  if (!recordsEqual(value.memberParts, expected.memberParts)) {
    errors.push(
      "Navigation Menu specialized adapter spec namespace memberParts must match current package export order.",
    );
  }
  if (!recordsEqual(value.namedExports, expected.namedExports)) {
    errors.push(
      "Navigation Menu specialized adapter spec namespace namedExports must match current package export order.",
    );
  }
  if (!recordsEqual(value.objectEntries, expected.objectEntries)) {
    errors.push(
      "Navigation Menu specialized adapter spec namespace objectEntries must match current package export order.",
    );
  }

  return errors;
}

function validateLifecycle(value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Navigation Menu specialized adapter spec requires lifecycle metadata."];
  }
  if (!recordsEqual(value, buildLifecycleRecipe())) {
    return [
      "Navigation Menu specialized adapter spec lifecycle must match current Astro and React lifecycle facts.",
    ];
  }

  return [];
}

function validateNestedRootPolicy(value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Navigation Menu specialized adapter spec requires nestedRootPolicy metadata."];
  }
  if (value.policy !== "inert") {
    return [
      "Navigation Menu specialized adapter spec nestedRootPolicy must keep nested roots inert.",
    ];
  }
  if (!recordsEqual(value, buildNestedRootPolicyRecipe())) {
    return [
      "Navigation Menu specialized adapter spec nestedRootPolicy must match the shared viewport gate.",
    ];
  }

  return [];
}

function validateRuntimeBoundary(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return ["Navigation Menu specialized adapter spec requires runtimeBoundary metadata."];
  }
  if (!arraysEqual(value, NAVIGATION_MENU_RUNTIME_BOUNDARY)) {
    return [
      "Navigation Menu specialized adapter spec runtimeBoundary must match the shared viewport gate.",
    ];
  }

  return [];
}

function validateForbiddenMenuRecipes(value: Record<string, unknown>): string[] {
  return NAVIGATION_MENU_FORBIDDEN_MENU_RECIPE_KEYS.filter((key) => key in value).map(
    (key) => `Navigation Menu specialized adapter spec must not declare Menu-only ${key} recipes.`,
  );
}

function assertPart(spec: SpecializedAdapterSpec, partName: string): void {
  if (!hasPart(spec, partName)) {
    throw new Error(`Navigation Menu specialized adapter spec requires ${partName} part.`);
  }
}

function hasPart(spec: SpecializedAdapterSpec, partName: string): boolean {
  return spec.parts.some((part) => part.name === partName);
}

function getPartRecipe(spec: SpecializedAdapterSpec, partName: string) {
  const part = spec.parts.find((candidate) => candidate.name === partName);
  if (!part) {
    throw new Error(`Navigation Menu specialized adapter spec requires ${partName} part.`);
  }

  return part;
}

function hasPublicRef(spec: SpecializedAdapterSpec, partName: string): boolean {
  return spec.refs.some((ref) => ref.part === partName && ref.public);
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
      `Navigation Menu specialized adapter spec requires ${attributeName} static attribute for ${partName}.`,
    );
  }

  return attributeName;
}

function hasStaticAttribute(
  spec: SpecializedAdapterSpec,
  partName: string,
  attributeName: string,
): boolean {
  return spec.renderPlan.staticAttributes.some(
    (candidate) => candidate.part === partName && candidate.name === attributeName,
  );
}

function getStaticAttributeValue(
  spec: SpecializedAdapterSpec,
  partName: string,
  attributeName: string,
): string {
  const attribute = spec.renderPlan.staticAttributes.find(
    (candidate) =>
      candidate.part === partName &&
      candidate.name === attributeName &&
      candidate.source === "constant" &&
      typeof candidate.value === "string",
  );
  if (!attribute?.value) {
    throw new Error(
      `Navigation Menu specialized adapter spec requires ${attributeName} constant attribute for ${partName}.`,
    );
  }

  return attribute.value;
}

function getStateModel(spec: SpecializedAdapterSpec, name: string): NavigationMenuRequiredState {
  const state = spec.stateModels.find((candidate) => candidate.name === name);
  if (!state) {
    throw new Error(`Navigation Menu specialized adapter spec is missing ${name} state model.`);
  }
  if (!state.controlledProp || !state.defaultProp || !state.runtimeGetter || !state.runtimeSetter) {
    throw new Error(
      `Navigation Menu specialized adapter spec requires complete ${name} state metadata.`,
    );
  }

  return state as NavigationMenuRequiredState;
}

function getEvent(spec: SpecializedAdapterSpec, name: string): NavigationMenuRequiredEvent {
  const event = spec.events.find((candidate) => candidate.name === name);
  if (!event) {
    throw new Error(`Navigation Menu specialized adapter spec requires ${name} event.`);
  }
  if (
    !event.callbackProp ||
    !event.detailsType ||
    !event.domEvent ||
    !event.emitsFrom ||
    !event.valueProperty
  ) {
    throw new Error(
      `Navigation Menu specialized adapter spec requires complete ${name} event metadata.`,
    );
  }

  return event as NavigationMenuRequiredEvent;
}

function getSetter(spec: SpecializedAdapterSpec, method: string) {
  const setter = spec.setterSync.find((candidate) => candidate.method === method);
  if (!setter) {
    throw new Error(`Navigation Menu specialized adapter spec requires ${method} setter sync.`);
  }

  return setter;
}

function hasSetter(spec: SpecializedAdapterSpec, method: string): boolean {
  return spec.setterSync.some((setter) => setter.method === method);
}

function getProp(spec: SpecializedAdapterSpec, propName: string) {
  const prop = spec.props.find((candidate) => candidate.name === propName);
  if (!prop) {
    throw new Error(`Navigation Menu specialized adapter spec requires ${propName} prop metadata.`);
  }

  return prop;
}

function getPropForTarget(spec: SpecializedAdapterSpec, propName: string, target: string) {
  const prop = spec.props.find(
    (candidate) => candidate.name === propName && candidate.targets?.includes(target),
  );
  if (!prop) {
    throw new Error(
      `Navigation Menu specialized adapter spec requires ${propName} prop metadata for ${target}.`,
    );
  }

  return prop;
}

function arraysEqual(actual: readonly unknown[], expected: readonly unknown[]): boolean {
  return (
    actual.length === expected.length && actual.every((value, index) => value === expected[index])
  );
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function validateRecordFields(
  value: unknown,
  expected: Record<string, unknown>,
  label: string,
): string[] {
  if (!isRecord(value)) {
    return [`${label} must match contract metadata.`];
  }

  return Object.entries(expected).flatMap(([field, expectedValue]) => {
    if (recordsEqual(value[field], expectedValue)) return [];

    return [
      `${label}.${field} "${String(value[field])}" must match event ${field} "${String(expectedValue)}".`,
    ];
  });
}

function recordsEqual(actual: unknown, expected: unknown): boolean {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
