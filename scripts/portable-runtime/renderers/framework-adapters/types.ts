import type { StyledAdapterContract } from "../../contracts/styled/types.js";
import type {
  StyledOutputComponentGroup,
  StyledOutputModel,
} from "../styled-output-model/types.js";
import type {
  AdapterColorPickerComponentProjection,
  AdapterColorPickerIndexProjection,
} from "../primitive-output-model/index.js";

export type FrameworkAdapterTarget = "astro" | "react" | "solid" | "svelte" | "vue" | (string & {});

export type FrameworkAdapterTargetPublicSupport = {
  cliRegistry: boolean;
  demoIntegration: boolean;
  packageExports: boolean;
  publicDocsClaim: boolean;
  status: "deferred" | "non-shipping-tracer" | "shipping";
};

export type FrameworkAdapterTargetPrimitiveOutputArgs = {
  componentHeader?: string;
  componentName: string;
  moduleHeader: string;
  outputModel: AdapterOutputModel;
  outputRoot: string;
};

export type FrameworkAdapterTargetManualPrimitiveArgs = {
  componentHeader?: string;
  moduleHeader: string;
  outputRoot: string;
  target: FrameworkAdapterTarget;
};

export type FrameworkAdapterTargetManualPrimitiveGenerator = (
  args: FrameworkAdapterTargetManualPrimitiveArgs,
) => Promise<void>;

export type FrameworkAdapterTargetManualPrimitiveGenerators = Readonly<
  Record<string, FrameworkAdapterTargetManualPrimitiveGenerator>
>;

export type FrameworkAdapterTargetGeneratePrimitiveEntriesArgs = {
  componentHeader?: string;
  moduleHeader: string;
  outputRoot: string;
};

export type FrameworkAdapterTargetPrimitiveSupport =
  | { kind: "all" }
  | { components: readonly string[]; kind: "subset" };

export type FrameworkAdapterTargetGeneratePrimitiveEntries = (
  args: FrameworkAdapterTargetGeneratePrimitiveEntriesArgs,
) => Promise<void>;

export type FrameworkAdapterTargetPrimitivePackageArgs = {
  components: readonly string[];
  generatePrimitiveEntries: FrameworkAdapterTargetGeneratePrimitiveEntries;
  generatedBy: string;
  outputRoot: string;
};

export type FrameworkAdapterTargetPrimitivePackageGenerator = (
  args: FrameworkAdapterTargetPrimitivePackageArgs,
) => Promise<void>;

export type FrameworkAdapterTargetStyledProjectArgs = {
  contracts: StyledAdapterContract[];
  outputRoot: string;
  primitiveImportBase?: string;
  primitiveOutputRoot: string;
};

export type FrameworkAdapterTargetStyledWriteArgs = FrameworkAdapterTargetStyledProjectArgs & {
  generatedBy: string;
};

export type FrameworkAdapterTargetStyledCapability = {
  project(args: FrameworkAdapterTargetStyledProjectArgs): StyledOutputModel;
  write(args: FrameworkAdapterTargetStyledWriteArgs): Promise<void>;
};

export type FrameworkAdapterTargetPackageRequirement = {
  name: string;
  range: string;
};

export type FrameworkAdapterTargetCliRegistryMetadata = {
  generatedImportCandidateExtensions: readonly string[];
  primitiveArtifact?: {
    extraPackageRequirements?: readonly string[];
    includeLocalImportGraph?: boolean;
    outputDir: string;
    sourceRoot: string;
  };
  styledArtifact: {
    collectPackageImportSources?: (args: {
      group: StyledOutputComponentGroup;
      primitiveImportBase: string;
    }) => readonly string[];
    outputDir: string;
    primitiveOutputDir: string;
  };
  setupPackageRequirements: readonly FrameworkAdapterTargetPackageRequirement[];
};

export type FrameworkAdapterTargetPrimitiveOutputModelCapabilities = {
  groupedValueControlContextHelper?: {
    fileExtension: string;
  };
};

export type FrameworkAdapterTargetPrimitiveOutputModel = {
  capabilities?: FrameworkAdapterTargetPrimitiveOutputModelCapabilities;
  projectSpecialized(model: AdapterOutputModel): AdapterOutputModel;
  write(args: FrameworkAdapterTargetPrimitiveOutputArgs): Promise<void>;
};

export type FrameworkAdapterTargetPrimitiveCapability = {
  generatePackage: FrameworkAdapterTargetPrimitivePackageGenerator;
  manualPrimitives?: FrameworkAdapterTargetManualPrimitiveGenerators;
  outputModel: FrameworkAdapterTargetPrimitiveOutputModel;
  support?: FrameworkAdapterTargetPrimitiveSupport;
};

export type FrameworkAdapterTargetRegistration<
  TTarget extends FrameworkAdapterTarget = FrameworkAdapterTarget,
> = {
  adapter: FrameworkAdapter & { target: TTarget };
  cliRegistry: FrameworkAdapterTargetCliRegistryMetadata;
  displayName: string;
  home: `scripts/portable-runtime/renderers/framework-adapters/${string}`;
  packageName?: string;
  primitive: FrameworkAdapterTargetPrimitiveCapability;
  publicSupport: FrameworkAdapterTargetPublicSupport;
  styled?: FrameworkAdapterTargetStyledCapability;
  target: TTarget;
};

/**
 * Framework-neutral description of every file a target adapter needs to emit.
 * Runtime contracts and adapter specs should produce this model; target
 * adapters translate it into framework syntax.
 */
export type AdapterOutputModel = {
  files: AdapterOutputFile[];
};

export type AdapterOutputFile =
  | AdapterComponentFile
  | AdapterHelperFile
  | AdapterIndexFile
  | AdapterTypeFacadeFile;

export type AdapterComponentFile = {
  component: AdapterComponentModel;
  kind: "component";
  path: string;
  target?: FrameworkAdapterTarget;
};

export type AdapterHelperFile = {
  body: AdapterCodeBlock;
  family?: AdapterFamilyHelperProjection;
  imports: AdapterImport[];
  kind: "helper";
  name: string;
  path: string;
  target?: FrameworkAdapterTarget;
};

export type AdapterIndexFile = {
  exports: AdapterNamespaceExport;
  family?: AdapterFamilyIndexProjection;
  imports: AdapterImport[];
  kind: "index";
  path: string;
  target?: FrameworkAdapterTarget;
  typeFacades: AdapterTypeFacade[];
};

export type AdapterTypeFacadeFile = {
  exports: AdapterNamespaceExport;
  imports: AdapterImport[];
  kind: "type-facade";
  path: string;
  target?: FrameworkAdapterTarget;
  typeFacades: AdapterTypeFacade[];
};

export type AdapterComponentModel = {
  defaults: AdapterDefaultValue[];
  displayName?: string;
  events: AdapterEventBridge[];
  exports: AdapterNamespaceExport;
  family?: AdapterComponentFamilyProjection;
  imports: AdapterImport[];
  lifecycle?: AdapterRuntimeLifecycle;
  name: string;
  portals: AdapterPortal[];
  props: AdapterProp[];
  refs: AdapterRef[];
  render: AdapterRenderNode;
  stateSync: AdapterControlledStateSync[];
  typeFacades: AdapterTypeFacade[];
  context: AdapterContextProjection[];
};

export type AdapterComponentFamilyProjection =
  | AdapterActionSurfaceComponentProjection
  | AdapterAnchoredMenuOverlayComponentProjection
  | AdapterBooleanFormControlComponentProjection
  | AdapterCompositeMenuOverlayComponentProjection
  | AdapterColorPickerComponentProjection
  | AdapterControlledValuePresenceComponentProjection
  | AdapterDisclosurePresenceComponentProjection
  | AdapterEditableCollectionOverlayComponentProjection
  | AdapterEngineViewportComponentProjection
  | AdapterFileDropControlComponentProjection
  | AdapterFormControlCompositionComponentProjection
  | AdapterFormFieldCoordinatorComponentProjection
  | AdapterGroupedValueControlComponentProjection
  | AdapterHiddenInputVisualSlotComponentProjection
  | AdapterMediaStatusComponentProjection
  | AdapterNativeDisabledComponentProjection
  | AdapterNativeInputValueComponentProjection
  | AdapterNativeOverlayComponentProjection
  | AdapterNotificationSystemComponentProjection
  | AdapterOptionCollectionOverlayComponentProjection
  | AdapterPresenceFloatingOverlayComponentProjection
  | AdapterRangeStatusComponentProjection
  | AdapterRangeControlComponentProjection
  | AdapterRepeatedDisclosureComponentProjection
  | AdapterSharedViewportNavigationComponentProjection
  | AdapterSidebarComponentProjection
  | AdapterSingleBooleanControlComponentProjection
  | AdapterTimedFloatingOverlayComponentProjection
  | AdapterViewportMeasurementComponentProjection;

export type AdapterFamilyHelperProjection =
  | AdapterCompositeMenuOverlayHelperProjection
  | AdapterControlledValuePresenceHelperProjection
  | AdapterEditableCollectionOverlayHelperProjection
  | AdapterGroupedValueControlHelperProjection
  | AdapterOptionCollectionOverlayHelperProjection
  | AdapterSidebarHelperProjection;

export type AdapterFamilyIndexProjection =
  | AdapterActionSurfaceIndexProjection
  | AdapterAnchoredMenuOverlayIndexProjection
  | AdapterBooleanFormControlIndexProjection
  | AdapterCompositeMenuOverlayIndexProjection
  | AdapterColorPickerIndexProjection
  | AdapterControlledValuePresenceIndexProjection
  | AdapterDisclosurePresenceIndexProjection
  | AdapterEditableCollectionOverlayIndexProjection
  | AdapterEngineViewportIndexProjection
  | AdapterFileDropControlIndexProjection
  | AdapterFormControlCompositionIndexProjection
  | AdapterFormFieldCoordinatorIndexProjection
  | AdapterGroupedValueControlIndexProjection
  | AdapterHiddenInputVisualSlotIndexProjection
  | AdapterMediaStatusIndexProjection
  | AdapterNativeDisabledIndexProjection
  | AdapterNativeInputValueIndexProjection
  | AdapterNativeOverlayIndexProjection
  | AdapterNotificationSystemIndexProjection
  | AdapterOptionCollectionOverlayIndexProjection
  | AdapterPresenceFloatingOverlayIndexProjection
  | AdapterRangeStatusIndexProjection
  | AdapterRangeControlIndexProjection
  | AdapterRepeatedDisclosureIndexProjection
  | AdapterSharedViewportNavigationIndexProjection
  | AdapterSidebarIndexProjection
  | AdapterSingleBooleanControlIndexProjection
  | AdapterTimedFloatingOverlayIndexProjection
  | AdapterViewportMeasurementIndexProjection;

export type AdapterActionSurfaceComponentProjection = {
  facts: AdapterActionSurfaceFacts;
  kind: "action-surface";
  part: "root";
};

export type AdapterActionSurfaceIndexProjection = {
  facts: AdapterActionSurfaceFacts;
  kind: "action-surface";
};

export type AdapterActionSurfaceFacts = {
  attrs: {
    ariaDisabled: string;
    disabled: string;
    focusableWhenDisabled: string;
    root: string;
    stateDisabled: string;
    type: string;
  };
  displayName: string;
  exports: {
    namespace: string;
    root: string;
  };
  index: {
    importMembers: AdapterExportMember[];
    namespaceMembers: Array<{ key: string; name: string }>;
  };
  parts: {
    root: AdapterFamilyPart & { namespaceKey: string };
  };
  props: {
    disabled: AdapterFamilyProp;
    focusableWhenDisabled: AdapterFamilyProp;
    type: AdapterFamilyProp;
  };
  runtime: {
    conditionalInit: {
      attribute: string;
      prop: string;
      truthyValue: string;
    };
    disabledSetter: {
      method: string;
      prop: string;
    };
    factory: string;
    importSource: string;
    optionProps: string[];
    setupFunction: string;
  };
};

export type AdapterNativeDisabledComponentProjection = {
  facts: AdapterNativeDisabledFacts;
  kind: "native-disabled";
  part: string;
};

export type AdapterNativeDisabledIndexProjection = {
  facts: AdapterNativeDisabledFacts;
  kind: "native-disabled";
};

export type AdapterNativeDisabledFacts = {
  attrs: {
    disabled: "disabled";
    root: string;
    stateDisabled: string;
  };
  displayName: string;
  exports: {
    namespace: string;
    root: string;
  };
  index: {
    importMembers: AdapterExportMember[];
    namespaceMembers: Array<{ key: string; name: string }>;
  };
  parts: {
    all: AdapterNativeDisabledPart[];
    root: AdapterNativeDisabledPart;
  };
  props: {
    disabled: AdapterFamilyProp;
  };
  runtime: {
    disabledSetter: {
      method: string;
      options?: Record<string, boolean | number | string>;
    };
    factory: string;
    importSource: string;
    optionProps: string[];
    setupFunction: string;
  };
};

export type AdapterNativeDisabledPart = AdapterFamilyPart & {
  exportName: string;
  namespaceKey: string;
  publicRef: boolean;
  role?: string;
};

export type AdapterNativeInputValueComponentProjection = {
  facts: AdapterNativeInputValueFacts;
  kind: "native-input-value";
  part: "root";
};

export type AdapterNativeInputValueIndexProjection = {
  facts: AdapterNativeInputValueFacts;
  kind: "native-input-value";
};

export type AdapterNativeInputValueFacts = {
  attrs: {
    disabled: "disabled";
    root: string;
    stateDisabled: string;
    value: string;
  };
  displayName: string;
  events: {
    valueChange: {
      callbackProp: string;
      detailsType: string;
      valueProperty: string;
      valueType: string;
    };
  };
  exports: {
    namespace: string;
    root: string;
  };
  index: {
    importMembers: AdapterExportMember[];
    namespaceMembers: Array<{ key: string; name: string }>;
    typeExports: string[];
  };
  parts: {
    root: AdapterFamilyPart & { namespaceKey: string };
  };
  props: {
    defaultValue: AdapterFamilyProp;
    disabled: AdapterFamilyProp;
    value: AdapterFamilyProp;
  };
  runtime: {
    disabledSetter: {
      method: string;
      options?: Record<string, boolean | number | string>;
    };
    factory: string;
    importSource: string;
    optionProps: string[];
    setupFunction: string;
    typeImportSource: string;
    valueGetter: string;
    valueSetter: {
      method: string;
      options?: Record<string, boolean | number | string>;
    };
  };
};

export type AdapterAnchoredMenuOverlayPartName = "root" | "trigger";

export type AdapterAnchoredMenuOverlayComponentProjection = {
  facts: AdapterAnchoredMenuOverlayFacts;
  kind: "anchored-menu-overlay";
  part: AdapterAnchoredMenuOverlayPartName;
};

export type AdapterAnchoredMenuOverlayIndexProjection = {
  facts: AdapterAnchoredMenuOverlayFacts;
  kind: "anchored-menu-overlay";
};

export type AdapterAnchoredMenuOverlayFacts = {
  attrs: {
    closeDelay: string;
    defaultOpen: string;
    disabled: string;
    menuRoot: string;
    menuTrigger: string;
    modal: string;
    root: string;
    state: string;
    trigger: string;
  };
  displayName: string;
  events: {
    closeComplete: AdapterAnchoredMenuOverlayDetailsEvent;
    openChange: AdapterAnchoredMenuOverlayValueEvent;
  };
  exports: {
    namespace: string;
    root: string;
    trigger: string;
  };
  index: {
    importMembers: AdapterExportMember[];
    menuAliasMembers: Array<{
      contextName: string;
      menuName: string;
    }>;
    namespaceMembers: Array<{ key: string; name: string }>;
    typeExports: string[];
  };
  parts: {
    root: AdapterFamilyPart & { namespaceKey: string };
    trigger: AdapterFamilyPart & { namespaceKey: string };
  };
  props: {
    closeDelay: AdapterFamilyProp;
    defaultOpen: AdapterFamilyProp;
    disabled: AdapterFamilyProp;
    modal: AdapterFamilyProp;
    open: AdapterFamilyProp;
    tabIndex: AdapterFamilyProp;
  };
  root: {
    menuDiscoveryAttribute: string;
    stateAttributes: {
      closedValue: string;
      openValue: string;
      state: string;
    };
  };
  runtime: {
    cleanupEvent: string;
    destroyFunction: string;
    destroyMethod: string;
    factory: string;
    importSource: string;
    initEvents: string[];
    instancesName: string;
    setupFunction: string;
    typeImportSource: string;
  };
  setters: {
    open: {
      method: string;
      options?: Record<string, boolean | number | string>;
    };
  };
  state: {
    open: {
      getter: string;
      setter: string;
    };
  };
  trigger: {
    disabled: AdapterCompositeMenuOverlayDisabledProjection;
    disclosure: {
      ariaExpanded: string;
      ariaHaspopup: {
        attribute: string;
        value: string;
      };
      closedStateValue: string;
      openStateValue: string;
      stateAttribute: string;
    };
    menuDiscoveryAttribute: string;
    tabIndexDefaultValue: string;
    touchCalloutStyle: {
      property: string;
      value: string;
    };
  };
};

export type AdapterAnchoredMenuOverlayDetailsEvent = {
  callbackProp: string;
  detailsType: string;
  name: string;
};

export type AdapterAnchoredMenuOverlayValueEvent = AdapterAnchoredMenuOverlayDetailsEvent & {
  domEvent: string;
  valueProperty: string;
  valueType: string;
};

export type AdapterSharedViewportNavigationPartName =
  | "arrow"
  | "content"
  | "icon"
  | "item"
  | "link"
  | "list"
  | "popup"
  | "portal"
  | "positioner"
  | "root"
  | "trigger"
  | "viewport";

export type AdapterSharedViewportNavigationComponentProjection = {
  facts: AdapterSharedViewportNavigationFacts;
  kind: "shared-viewport-navigation";
  part: AdapterSharedViewportNavigationPartName;
};

export type AdapterSharedViewportNavigationIndexProjection = {
  facts: AdapterSharedViewportNavigationFacts;
  kind: "shared-viewport-navigation";
};

export type AdapterSharedViewportNavigationFacts = {
  attrs: Record<
    | "active"
    | "align"
    | "alignOffset"
    | "arrow"
    | "asChild"
    | "avoidCollisions"
    | "closeDelay"
    | "closeOnEscape"
    | "closeOnOutsideInteract"
    | "collisionPadding"
    | "content"
    | "controlledValue"
    | "defaultValue"
    | "disabled"
    | "icon"
    | "item"
    | "itemValue"
    | "link"
    | "linkCloseOnClick"
    | "list"
    | "openDelay"
    | "orientation"
    | "popup"
    | "portal"
    | "positioner"
    | "root"
    | "side"
    | "sideOffset"
    | "trigger"
    | "triggerCloseDelay"
    | "triggerOpenDelay"
    | "value"
    | "viewport",
    string
  >;
  content: {
    hiddenAttribute: string;
    stateAttribute: string;
    stateValue: string;
  };
  displayName: string;
  exports: Record<AdapterSharedViewportNavigationPartName, string> & {
    namespace: string;
  };
  floating: {
    align: AdapterFamilyProp;
    alignOffset: AdapterFamilyProp;
    avoidCollisions: AdapterFamilyProp;
    collisionPadding: AdapterFamilyProp;
    side: AdapterFamilyProp;
    sideOffset: AdapterFamilyProp;
  };
  index: {
    importMembers: AdapterExportMember[];
    namespaceMembers: Array<{ key: string; name: string }>;
    typeExports: string[];
  };
  item: {
    stateAttribute: string;
    stateValue: string;
    valueProp: AdapterFamilyProp;
  };
  link: {
    active: {
      ariaCurrentAttribute: string;
      ariaCurrentValue: string;
      prop: AdapterFamilyProp;
    };
    closeOnClick: {
      falseValue: string;
      prop: AdapterFamilyProp;
    };
  };
  parts: Record<
    AdapterSharedViewportNavigationPartName,
    AdapterFamilyPart & {
      ariaHidden?: boolean;
      hidden?: boolean;
      hiddenAttribute?: string;
      namespaceKey: string;
      stateAttribute?: string;
      stateValue?: string;
    }
  >;
  positioner: {
    stateAttribute: string;
    stateValue: string;
  };
  props: {
    closeDelay: AdapterFamilyProp;
    closeOnEscape: AdapterFamilyProp;
    closeOnOutsideInteract: AdapterFamilyProp;
    defaultValue: AdapterFamilyProp;
    openDelay: AdapterFamilyProp;
    orientation: AdapterFamilyProp;
    value: AdapterFamilyProp;
  };
  runtime: {
    cleanupEvent: string;
    destroyFunction: string;
    destroyMethod: string;
    factory: string;
    importSource: string;
    initEvents: string[];
    instancesName: string;
    setupFunction: string;
    typeImportSource: string;
  };
  trigger: {
    asChild: AdapterFamilyProp;
    closeDelay: AdapterFamilyProp;
    disabled: AdapterCompositeMenuOverlayDisabledProjection & { nativeAttribute: string };
    disclosure: {
      ariaExpanded: string;
      ariaHaspopup: {
        attribute: string;
        value: string;
      };
      closedStateValue: string;
      stateAttribute: string;
    };
    openDelay: AdapterFamilyProp;
    typeAttribute: {
      attribute: string;
      value: string;
    };
  };
  valueControl: {
    event: AdapterSharedViewportNavigationValueEvent;
    controlledResync: {
      detailsValueProperty: string;
      preserveDetailFields: string[];
      runtimeBoundary: string;
      setter: string;
    };
    state: {
      controlledNullMarker: {
        attribute: string;
        value: string;
      };
      defaultValueAttribute: string;
      getter: string;
      renderedStateAttribute: string;
    };
  };
};

export type AdapterSharedViewportNavigationValueEvent = {
  callbackProp: string;
  detailsType: string;
  name: string;
  valueProperty: string;
  valueType: string;
};

export type AdapterEditableCollectionOverlayPartName =
  | "clear"
  | "empty"
  | "group"
  | "groupLabel"
  | "icon"
  | "input"
  | "inputGroup"
  | "item"
  | "itemIndicator"
  | "itemText"
  | "label"
  | "list"
  | "popup"
  | "portal"
  | "positioner"
  | "root"
  | "separator"
  | "trigger"
  | "value";

export type AdapterEditableCollectionOverlayComponentProjection = {
  facts: AdapterEditableCollectionOverlayFacts;
  kind: "editable-collection-overlay";
  part: AdapterEditableCollectionOverlayPartName;
};

export type AdapterEditableCollectionOverlayHelperProjection = {
  facts: AdapterEditableCollectionOverlayFacts;
  kind: "editable-collection-overlay";
};

export type AdapterEditableCollectionOverlayIndexProjection = {
  facts: AdapterEditableCollectionOverlayFacts;
  kind: "editable-collection-overlay";
};

export type AdapterEditableCollectionOverlayFacts = {
  attrs: Record<
    | "align"
    | "alignOffset"
    | "autoComplete"
    | "avoidCollisions"
    | "clear"
    | "defaultInputValue"
    | "defaultOpen"
    | "defaultValue"
    | "disabled"
    | "empty"
    | "filterMode"
    | "form"
    | "group"
    | "groupLabel"
    | "hiddenInput"
    | "highlightItemOnHover"
    | "icon"
    | "input"
    | "inputGroup"
    | "inputValue"
    | "item"
    | "itemIndicator"
    | "itemText"
    | "label"
    | "list"
    | "locale"
    | "modal"
    | "name"
    | "popup"
    | "portal"
    | "positioner"
    | "readOnly"
    | "required"
    | "root"
    | "separator"
    | "side"
    | "sideOffset"
    | "trigger"
    | "value"
    | "valueData",
    string
  >;
  clearAction: {
    typeAttribute: { attribute: string; value: string };
  };
  collection: {
    empty: { hiddenAttribute: string };
    group: { role: string };
    item: {
      disabled: {
        ariaAttribute: string;
        dataAttribute: string;
      };
      initialProjection: {
        ariaSelected: string;
        tabIndex: number;
      };
      role: string;
    };
    itemIndicator: {
      dataHiddenAttribute: string;
      hiddenAttribute: string;
      initialState: string;
      selectedStateAttribute: string;
    };
    separator: {
      ariaOrientation: string;
      role: string;
    };
  };
  context: {
    fileExportMembers: AdapterExportMember[];
    itemContext: string;
    itemContextValueType: string;
    rootContext: string;
    rootContextValueType: string;
    useItemContext: string;
    useRootContext: string;
  };
  displayName: string;
  events: {
    inputValueChange: AdapterEditableCollectionOverlayValueEvent;
    openChange: AdapterEditableCollectionOverlayValueEvent;
    valueChange: AdapterEditableCollectionOverlayValueEvent;
  };
  exports: Record<AdapterEditableCollectionOverlayPartName, string> & {
    namespace: string;
  };
  floating: {
    alignDefault: string;
    alignOffsetDefault: string;
    avoidCollisionsDefault: string;
    sideDefault: string;
    sideOffsetDefault: string;
  };
  formSetter: {
    dependencies: string[];
    method: string;
    props: string[];
  };
  hiddenInput: {
    constantAttributes: {
      ariaHidden: string;
      tabIndex: string;
      type: string;
    };
  };
  index: {
    importMembers: AdapterExportMember[];
    namespaceMembers: Array<{ key: string; name: string }>;
    typeExportSource?: string;
    typeExports?: string[];
  };
  inputSemantics: {
    ariaAutocomplete: string;
    autocomplete: string;
    role: string;
  };
  parts: Record<
    AdapterEditableCollectionOverlayPartName,
    AdapterFamilyPart & {
      namespaceKey: string;
      role?: string;
    }
  >;
  popupRole: string;
  props: {
    align: AdapterFamilyProp;
    alignOffset: AdapterFamilyProp;
    asChild: AdapterFamilyProp;
    autoComplete: AdapterFamilyProp;
    avoidCollisions: AdapterFamilyProp;
    defaultInputValue: AdapterFamilyProp;
    defaultOpen: AdapterFamilyProp;
    defaultValue: AdapterFamilyProp;
    disabled: AdapterFamilyProp;
    filterMode: AdapterFamilyProp;
    form: AdapterFamilyProp;
    highlightItemOnHover: AdapterFamilyProp;
    inputDefaultValue: AdapterFamilyProp;
    inputValue: AdapterFamilyProp;
    itemDisabled: AdapterFamilyProp;
    itemValue: AdapterFamilyProp;
    locale: AdapterFamilyProp;
    modal: AdapterFamilyProp;
    name: AdapterFamilyProp;
    open: AdapterFamilyProp;
    placeholder: AdapterFamilyProp;
    readOnly: AdapterFamilyProp;
    required: AdapterFamilyProp;
    side: AdapterFamilyProp;
    sideOffset: AdapterFamilyProp;
    value: AdapterFamilyProp;
  };
  runtime: {
    factory: string;
    importSource: string;
    setupFunction: string;
  };
  setters: {
    disabled: AdapterEditableCollectionOverlaySetter;
    inputValue: AdapterEditableCollectionOverlaySetter;
    open: AdapterEditableCollectionOverlaySetter;
    value: AdapterEditableCollectionOverlaySetter;
  };
  states: {
    inputValue: AdapterEditableCollectionOverlayState;
    open: AdapterEditableCollectionOverlayState;
    value: AdapterEditableCollectionOverlayState;
  };
};

export type AdapterEditableCollectionOverlayState = {
  getter: string;
  name: string;
  setter: string;
  valueType: string;
};

export type AdapterEditableCollectionOverlaySetter = {
  method: string;
  options?: Record<string, boolean | number | string>;
};

export type AdapterEditableCollectionOverlayValueEvent = {
  callbackProp: string;
  detailsType: string;
  name: string;
  valueProperty: string;
  valueType: string;
};

export type AdapterEngineViewportPartName =
  | "container"
  | "item"
  | "next"
  | "previous"
  | "root"
  | "viewport";

export type AdapterEngineViewportComponentProjection = {
  facts: AdapterEngineViewportFacts;
  kind: "engine-viewport";
  part: AdapterEngineViewportPartName;
};

export type AdapterEngineViewportIndexProjection = {
  facts: AdapterEngineViewportFacts;
  kind: "engine-viewport";
};

export type AdapterEngineViewportFacts = {
  attrs: {
    autoInit: string;
    axis: string;
    container: string;
    item: string;
    itemRole: string;
    itemRoledescription: string;
    next: string;
    opts: string;
    previous: string;
    role: string;
    root: string;
    roledescription: string;
    viewport: string;
  };
  controls: {
    next: AdapterEngineViewportControl;
    previous: AdapterEngineViewportControl;
  };
  displayName: string;
  exports: Record<AdapterEngineViewportPartName, string> & {
    namespace: string;
  };
  index: {
    importMembers: AdapterExportMember[];
    namespaceMembers: Array<{ key: string; name: string }>;
    typeExportSource: string;
    typeExports: string[];
    valueExportSource: string;
    valueExports: string[];
  };
  options: {
    autoInit: AdapterFamilyProp & {
      falseValue: string;
    };
    opts: AdapterFamilyProp;
    orientation: AdapterFamilyProp & {
      axisMap: {
        horizontal: string;
        vertical: string;
      };
    };
    plugins: AdapterFamilyProp;
    setApi: AdapterFamilyProp;
  };
  parts: Record<
    AdapterEngineViewportPartName,
    AdapterFamilyPart & {
      namespaceKey: string;
      role?: string;
    }
  >;
  runtime: {
    apiType: string;
    factory: string;
    importSource: string;
    instanceType: string;
    optionsType: string;
    setupFunction: string;
  };
  semantics: {
    itemRole: string;
    itemRoledescription: string;
    rootRole: string;
    rootRoledescription: string;
  };
};

export type AdapterEngineViewportControl = {
  typeAttribute: string;
  typeValue: string;
};

export type AdapterNotificationSystemPartName =
  | "action"
  | "close"
  | "content"
  | "description"
  | "root"
  | "template"
  | "title"
  | "titleText"
  | "viewport";

export type AdapterNotificationSystemComponentProjection = {
  facts: AdapterNotificationSystemFacts;
  kind: "notification-system";
  part: AdapterNotificationSystemPartName;
};

export type AdapterNotificationSystemIndexProjection = {
  facts: AdapterNotificationSystemFacts;
  kind: "notification-system";
};

export type AdapterNotificationSystemFacts = {
  actions: {
    action: AdapterNotificationSystemActionButton;
    close: AdapterNotificationSystemCloseButton;
  };
  attrs: Record<AdapterNotificationSystemPartName, string>;
  displayName: string;
  exports: Record<AdapterNotificationSystemPartName, string> & {
    namespace: string;
  };
  index: {
    importMembers: AdapterExportMember[];
    namespaceMembers: Array<{ key: string; name: string }>;
    typeExportSource: string;
    typeExports: string[];
    valueExportSource: string;
    valueExports: string[];
  };
  parts: Record<
    AdapterNotificationSystemPartName,
    AdapterFamilyPart & {
      namespaceKey: string;
      role?: string;
    }
  >;
  rootState: {
    ariaModalAttribute: string;
    ariaModalValue: string;
    role: string;
    stateAttribute: string;
    stateOpenValue: string;
    variantAttribute: string;
  };
  runtime: {
    destroyMethod: string;
    factory: string;
    importSource: string;
    setupFunction: string;
  };
  template: {
    variant: AdapterFamilyProp & {
      rootAttribute: string;
      templateAttribute: string;
      values: string[];
    };
  };
  viewportOptions: {
    duration: AdapterNotificationSystemAttributeOption;
    gap: AdapterNotificationSystemCssOption;
    limit: AdapterNotificationSystemAttributeOption;
    peek: AdapterNotificationSystemCssOption;
    position: AdapterNotificationSystemAttributeOption & {
      values: string[];
    };
  };
  viewportSemantics: {
    ariaAtomicAttribute: string;
    ariaAtomicValue: string;
    ariaLabelAttribute: string;
    ariaLabelValue: string;
    ariaLiveAttribute: string;
    ariaLiveValue: string;
    ariaRelevantAttribute: string;
    ariaRelevantValue: string;
    role: string;
    tabIndexAttribute: string;
    tabIndexValue: string;
  };
};

export type AdapterNotificationSystemActionButton = {
  typeAttribute: string;
  typeValue: string;
};

export type AdapterNotificationSystemAttributeOption = AdapterFamilyProp & {
  attribute: string;
};

export type AdapterNotificationSystemCloseButton = AdapterNotificationSystemActionButton & {
  ariaLabelAttribute: string;
  ariaLabelValue: string;
};

export type AdapterNotificationSystemCssOption = AdapterFamilyProp & {
  cssVariable: string;
};

export type AdapterCompositeMenuOverlayPartName =
  | "checkboxItem"
  | "checkboxItemIndicator"
  | "group"
  | "item"
  | "label"
  | "linkItem"
  | "popup"
  | "portal"
  | "positioner"
  | "radioGroup"
  | "radioItem"
  | "radioItemIndicator"
  | "root"
  | "separator"
  | "shortcut"
  | "submenuRoot"
  | "submenuTrigger"
  | "trigger";

export type AdapterCompositeMenuOverlayComponentProjection = {
  facts: AdapterCompositeMenuOverlayFacts;
  kind: "composite-menu-overlay";
  part: AdapterCompositeMenuOverlayPartName;
};

export type AdapterCompositeMenuOverlayIndexProjection = {
  facts: AdapterCompositeMenuOverlayFacts;
  kind: "composite-menu-overlay";
};

export type AdapterCompositeMenuOverlayHelperProjection = {
  facts: AdapterCompositeMenuOverlayFacts;
  kind: "composite-menu-overlay-radio-context";
};

export type AdapterCompositeMenuOverlayFacts = {
  attrs: {
    align: string;
    avoidCollisions: string;
    checkboxCloseOnClick: string;
    checkboxDefaultChecked: string;
    checkboxItem: string;
    checkboxItemIndicator: string;
    closeDelay: string;
    defaultOpen: string;
    disabled: string;
    group: string;
    item: string;
    itemCloseOnClick: string;
    label: string;
    linkItem: string;
    linkItemCloseOnClick: string;
    modal: string;
    openOnHover: string;
    popup: string;
    portal: string;
    positioner: string;
    radioGroup: string;
    radioGroupValue: string;
    radioItem: string;
    radioItemCloseOnClick: string;
    radioItemDefaultChecked: string;
    radioItemIndicator: string;
    radioItemValue: string;
    root: string;
    separator: string;
    shortcut: string;
    side: string;
    sideOffset: string;
    submenuRoot: string;
    submenuTrigger: string;
    trigger: string;
  };
  checkboxItem: {
    checkedState: {
      controlledProp: AdapterFamilyProp;
      defaultProp: AdapterFamilyProp;
      initialAttribute: string;
      valueType: string;
    };
    closeOnClick: AdapterCompositeMenuOverlayBooleanPropAttribute;
    disabled: AdapterCompositeMenuOverlayDisabledProjection;
    event: AdapterCompositeMenuOverlayValueEvent;
    indicator: AdapterCompositeMenuOverlayIndicatorProjection;
    role: string;
    stateAttributes: AdapterCompositeMenuOverlayCheckedStateAttributes;
  };
  displayName: string;
  events: {
    closeComplete: AdapterCompositeMenuOverlayDetailsEvent;
    openChange: AdapterCompositeMenuOverlayValueEvent;
  };
  exports: Record<AdapterCompositeMenuOverlayPartName, string> & {
    namespace: string;
  };
  floating: {
    alignDefault: string;
    avoidCollisionsDefault: string;
    sideDefault: string;
    sideOffsetDefault: string;
  };
  index: {
    importMembers: AdapterExportMember[];
    namespaceMembers: Array<{ key: string; name: string }>;
    typeExports: string[];
  };
  parts: Record<
    AdapterCompositeMenuOverlayPartName,
    AdapterFamilyPart & { namespaceKey: string; role?: string }
  >;
  props: {
    align: AdapterFamilyProp;
    asChild: AdapterFamilyProp;
    avoidCollisions: AdapterFamilyProp;
    closeDelay: AdapterFamilyProp;
    defaultOpen: AdapterFamilyProp;
    disabled: AdapterFamilyProp;
    modal: AdapterFamilyProp;
    open: AdapterFamilyProp;
    openOnHover: AdapterFamilyProp;
    side: AdapterFamilyProp;
    sideOffset: AdapterFamilyProp;
  };
  radioGroup: {
    event: AdapterCompositeMenuOverlayValueEvent;
    role: string;
    valueState: {
      controlledProp: AdapterFamilyProp;
      defaultProp: AdapterFamilyProp;
      initialAttribute: string;
      valueType: string;
    };
  };
  radioItem: {
    checkedState: {
      controlledProp: AdapterFamilyProp;
      defaultProp: AdapterFamilyProp;
      initialAttribute: string;
      valueType: string;
    };
    closeOnClick: AdapterCompositeMenuOverlayBooleanPropAttribute;
    disabled: AdapterCompositeMenuOverlayDisabledProjection;
    indicator: AdapterCompositeMenuOverlayIndicatorProjection;
    role: string;
    stateAttributes: AdapterCompositeMenuOverlayCheckedStateAttributes;
    valueProp: AdapterFamilyProp & { attribute: string; required: true };
  };
  runtime: {
    destroyFunction: string;
    factory: string;
    importSource: string;
    instancesName: string;
    rootExclusionAttributes: string[];
    setupFunction: string;
    typeImportSource: string;
  };
  setters: {
    open: {
      method: string;
      options?: Record<string, boolean | number | string>;
    };
  };
  state: {
    open: {
      defaultValue: string;
      getter: string;
      setter: string;
    };
  };
  staticBranches: {
    group: AdapterCompositeMenuOverlayStaticBranch;
    item: AdapterCompositeMenuOverlayStaticBranch & {
      closeOnClick: AdapterCompositeMenuOverlayBooleanPropAttribute;
      disabled: AdapterCompositeMenuOverlayDisabledProjection;
      tabIndex: NonNullable<AdapterCompositeMenuOverlayStaticBranch["tabIndex"]>;
    };
    label: AdapterCompositeMenuOverlayStaticBranch;
    linkItem: AdapterCompositeMenuOverlayStaticBranch & {
      closeOnClick: AdapterCompositeMenuOverlayBooleanPropAttribute;
      disabled: AdapterCompositeMenuOverlayDisabledProjection;
      tabIndex: NonNullable<AdapterCompositeMenuOverlayStaticBranch["tabIndex"]>;
    };
    separator: AdapterCompositeMenuOverlayStaticBranch & {
      ariaAttributes: Array<{ name: string; value: string }>;
    };
    shortcut: AdapterCompositeMenuOverlayStaticBranch;
  };
  submenu: {
    root: {
      closeDelay: AdapterFamilyProp & { attribute: string };
      stateAttributes: {
        closedValue: string;
        openValue: string;
        state: string;
      };
    };
    trigger: {
      disabled: AdapterCompositeMenuOverlayDisabledProjection;
      disclosure: {
        ariaExpanded: string;
        ariaHaspopup: {
          attribute: string;
          value: string;
        };
        closedStateValue: string;
        openStateValue: string;
        stateAttribute: string;
      };
      role: string;
      tabIndex: {
        attribute: string;
        value: string;
      };
    };
  };
};

export type AdapterCompositeMenuOverlayDetailsEvent = {
  callbackProp: string;
  detailsType: string;
  name: string;
};

export type AdapterCompositeMenuOverlayValueEvent = AdapterCompositeMenuOverlayDetailsEvent & {
  domEvent: string;
  valueProperty: string;
  valueType: string;
};

export type AdapterCompositeMenuOverlayBooleanPropAttribute = {
  attribute: string;
  defaultValue: string;
  prop: AdapterFamilyProp;
};

export type AdapterCompositeMenuOverlayDisabledProjection = {
  ariaAttribute: string;
  dataAttribute: string;
  prop: AdapterFamilyProp;
};

export type AdapterCompositeMenuOverlayCheckedStateAttributes = {
  ariaChecked: string;
  checked: string;
  unchecked: string;
};

export type AdapterCompositeMenuOverlayIndicatorProjection = {
  ariaHidden: string;
  checkedStateValue: string;
  hiddenAttribute: string;
  indicatorPart: "checkboxItemIndicator" | "radioItemIndicator";
  sourcePart: "checkboxItem" | "radioItem";
  stateAttribute: string;
  uncheckedStateValue: string;
  visibleAttribute: string;
};

export type AdapterCompositeMenuOverlayStaticBranch = {
  defaultElement: string;
  part: AdapterCompositeMenuOverlayPartName;
  role?: string;
  tabIndex?: {
    attribute: string;
    value: string;
  };
};

export type AdapterOptionCollectionOverlayPartName =
  | "group"
  | "groupLabel"
  | "icon"
  | "item"
  | "itemIndicator"
  | "itemText"
  | "label"
  | "list"
  | "popup"
  | "portal"
  | "positioner"
  | "root"
  | "scrollDownArrow"
  | "scrollUpArrow"
  | "separator"
  | "trigger"
  | "value";

export type AdapterOptionCollectionOverlayComponentProjection = {
  facts: AdapterOptionCollectionOverlayFacts;
  kind: "option-collection-overlay";
  part: AdapterOptionCollectionOverlayPartName;
};

export type AdapterOptionCollectionOverlayHelperProjection = {
  facts: AdapterOptionCollectionOverlayFacts;
  kind: "option-collection-overlay";
};

export type AdapterOptionCollectionOverlayIndexProjection = {
  facts: AdapterOptionCollectionOverlayFacts;
  kind: "option-collection-overlay";
};

export type AdapterOptionCollectionOverlayFacts = {
  attrs: {
    align: string;
    alignItemWithTrigger: string;
    alignOffset: string;
    autoComplete: string;
    avoidCollisions: string;
    defaultOpen: string;
    defaultValue: string;
    disabled: string;
    form: string;
    group: string;
    groupLabel: string;
    highlightItemOnHover: string;
    icon: string;
    input: string;
    item: string;
    itemIndicator: string;
    itemText: string;
    label: string;
    list: string;
    modal: string;
    name: string;
    popup: string;
    portal: string;
    positioner: string;
    readOnly: string;
    required: string;
    root: string;
    scrollDownArrow: string;
    scrollUpArrow: string;
    separator: string;
    side: string;
    sideOffset: string;
    trigger: string;
    value: string;
    valueData: string;
  };
  context: {
    fileExportMembers: AdapterExportMember[];
    itemContext: string;
    itemContextValueType: string;
    rootContext: string;
    rootContextValueType: string;
    useItemContext: string;
    useRootContext: string;
  };
  displayName: string;
  events: {
    openChange: {
      callbackProp: string;
      detailsType: string;
      name: string;
      valueProperty: string;
      valueType: string;
    };
    valueChange: {
      callbackProp: string;
      detailsType: string;
      name: string;
      valueProperty: string;
      valueType: string;
    };
  };
  exports: Record<AdapterOptionCollectionOverlayPartName, string> & {
    namespace: string;
  };
  floating: {
    alignDefault: string;
    alignItemWithTriggerDefault: string;
    alignOffsetDefault: string;
    avoidCollisionsDefault: string;
    sideDefault: string;
    sideOffsetDefault: string;
  };
  index: {
    importMembers: AdapterExportMember[];
    namespaceMembers: Array<{ key: string; name: string }>;
    typeExports: string[];
  };
  parts: Record<
    AdapterOptionCollectionOverlayPartName,
    AdapterFamilyPart & { namespaceKey: string; role?: string }
  > & {
    input: AdapterFamilyPart;
  };
  props: {
    align: AdapterFamilyProp;
    alignItemWithTrigger: AdapterFamilyProp;
    alignOffset: AdapterFamilyProp;
    asChild: AdapterFamilyProp;
    autoComplete: AdapterFamilyProp;
    avoidCollisions: AdapterFamilyProp;
    defaultOpen: AdapterFamilyProp;
    defaultValue: AdapterFamilyProp;
    disabled: AdapterFamilyProp;
    form: AdapterFamilyProp;
    highlightItemOnHover: AdapterFamilyProp;
    modal: AdapterFamilyProp;
    name: AdapterFamilyProp;
    open: AdapterFamilyProp;
    readOnly: AdapterFamilyProp;
    required: AdapterFamilyProp;
    side: AdapterFamilyProp;
    sideOffset: AdapterFamilyProp;
    value: AdapterFamilyProp;
  };
  runtime: {
    factory: string;
    importSource: string;
    setupFunction: string;
    typeImportSource: string;
  };
  state: {
    open: {
      defaultValue: string;
      getter: string;
      setter: string;
    };
    value: {
      getter: string;
      setter: string;
    };
  };
};

export type AdapterBooleanFormControlComponentProjection = {
  facts: AdapterBooleanFormControlFacts;
  kind: "boolean-form-control";
  part: "root" | "state-indicator";
};

export type AdapterBooleanFormControlIndexProjection = {
  facts: AdapterBooleanFormControlFacts;
  kind: "boolean-form-control";
};

export type AdapterBooleanFormControlFacts = {
  attrs: {
    ariaReadOnly?: string;
    ariaRequired?: string;
    ariaState: string;
    defaultState: string;
    disabled: string;
    filled?: string;
    form?: string;
    id?: string;
    indeterminate?: string;
    input: string;
    name?: string;
    readOnly?: string;
    required?: string;
    root: string;
    stateIndicator?: string;
    stateIndicatorKeepMounted?: string;
    stateIndicatorFalsyPresence?: string;
    falsyPresence: string;
    truthyPresence: string;
    uncheckedValue?: string;
    value?: string;
  };
  behavior: {
    canCancelChange: boolean;
    formResetSync: boolean;
    groupStrategy?: "array-includes" | "value-equals";
    hasIndeterminate: boolean;
    inputIdStrategy: "always-prop" | "omit-when-native" | "suffixed-when-native";
    inputPlacement: "external" | "nested-when-non-native";
    readonlyAriaFalseWhenFalse: boolean;
  };
  displayName: string;
  event: {
    callbackProp: string;
    detailsType: string;
    name: string;
    valueProperty: string;
    valueType: string;
  };
  exports: {
    namespace: string;
    root: string;
    stateIndicator?: string;
  };
  group?: {
    hookName: string;
    importPath: string;
    valueFields: string[];
    variableName: string;
  };
  input: {
    elementType: string;
    idHelperName?: string;
    refProp?: AdapterFamilyProp;
    type: string;
  };
  parts: {
    input: AdapterFamilyPart;
    root: AdapterFamilyPart;
    stateIndicator?: AdapterFamilyPart & { namespaceKey: string };
  };
  props: {
    defaultState: AdapterFamilyProp;
    disabled: AdapterFamilyProp;
    form?: AdapterFamilyProp;
    id?: AdapterFamilyProp;
    indeterminate?: AdapterFamilyProp;
    keepMounted?: AdapterFamilyProp;
    name?: AdapterFamilyProp;
    nativeButton: AdapterFamilyProp;
    readOnly?: AdapterFamilyProp;
    required?: AdapterFamilyProp;
    state: AdapterFamilyProp;
    uncheckedValue?: AdapterFamilyProp;
    value?: AdapterFamilyProp;
  };
  render: {
    nativeElement: string;
    nativeElementType: string;
    nonNativeElement: string;
    nonNativeElementType: string;
    role: string;
  };
  runtime: {
    factory: string;
    importSource: string;
    setupFunction: string;
    typeImportSource: string;
  };
  state: {
    getter: string;
    name: string;
    pascalName: string;
  };
  setters: {
    disabled: {
      method: string;
      options?: Record<string, boolean | number | string>;
    };
    formOptions?: {
      method: string;
      props: string[];
    };
    indeterminate?: {
      method: string;
      options?: Record<string, boolean | number | string>;
    };
    readOnly?: {
      method: string;
      options?: Record<string, boolean | number | string>;
    };
    state: {
      method: string;
      options?: Record<string, boolean | number | string>;
    };
  };
};

export type AdapterControlledValuePresencePartName =
  | "indicator"
  | "list"
  | "panel"
  | "root"
  | "tab";

export type AdapterControlledValuePresenceComponentProjection = {
  facts: AdapterControlledValuePresenceFacts;
  kind: "controlled-value-presence";
  part: AdapterControlledValuePresencePartName;
};

export type AdapterControlledValuePresenceHelperProjection = {
  facts: AdapterControlledValuePresenceFacts;
  kind: "controlled-value-presence";
};

export type AdapterControlledValuePresenceIndexProjection = {
  facts: AdapterControlledValuePresenceFacts;
  kind: "controlled-value-presence";
};

export type AdapterControlledValuePresenceFacts = {
  attrs: {
    activateOnFocus: string;
    ariaOrientation: string;
    defaultValue: string;
    disabled: string;
    indicator: string;
    indicatorOrientation: string;
    keepMounted: string;
    list: string;
    listOrientation: string;
    loopFocus: string;
    orientation: string;
    panel: string;
    panelActive: string;
    panelHidden: string;
    panelOrientation: string;
    panelState: string;
    panelValue: string;
    root: string;
    syncKey: string;
    tab: string;
    tabActive: string;
    tabAriaSelected: string;
    tabOrientation: string;
    tabState: string;
    tabValue: string;
    value: string;
  };
  context: {
    componentName: string;
    consumers: string[];
    hookName: string;
    name: string;
    providerPart: string;
    typeName: string;
    values: AdapterFamilyProp[];
  };
  displayName: string;
  events: {
    valueChange: {
      callbackProp: string;
      callbackTiming: "before-state-commit";
      cancelable: boolean;
      detailsType: string;
      domEvent: string;
      emitsFrom: string;
      name: string;
      valueProperty: string;
      valueType: string;
    };
  };
  exports: {
    indicator: string;
    list: string;
    namespace: string;
    panel: string;
    root: string;
    tab: string;
  };
  index: {
    helperExports: AdapterExportMember[];
    importMembers: AdapterExportMember[];
    namespaceMembers: Array<{ key: string; name: string }>;
    typeExports: string[];
  };
  parts: {
    indicator: AdapterFamilyPart & { namespaceKey: string; role: string };
    list: AdapterFamilyPart & { namespaceKey: string; role: string };
    panel: AdapterFamilyPart & { namespaceKey: string; role: string };
    root: AdapterFamilyPart & { namespaceKey: string };
    tab: AdapterFamilyPart & { namespaceKey: string; role: string };
  };
  props: {
    activateOnFocus: AdapterFamilyProp;
    defaultValue: AdapterFamilyProp;
    disabled: AdapterFamilyProp;
    keepMounted: AdapterFamilyProp;
    loopFocus: AdapterFamilyProp;
    orientation: AdapterFamilyProp;
    panelValue: AdapterFamilyProp;
    syncKey: AdapterFamilyProp;
    tabValue: AdapterFamilyProp;
    value: AdapterFamilyProp;
  };
  runtime: {
    factory: string;
    importSource: string;
    setupFunction: string;
    typeImportSource: string;
  };
  serializer: {
    functionName: string;
  };
  setter: {
    method: string;
    options?: Record<string, boolean | number | string>;
  };
  state: {
    getter: string;
    name: string;
    type: string;
  };
};

export type AdapterFormControlCompositionPartName =
  | "control"
  | "description"
  | "error"
  | "item"
  | "label"
  | "root"
  | "validity";

export type AdapterFormControlCompositionComponentProjection = {
  facts: AdapterFormControlCompositionFacts;
  kind: "field-composition";
  part: AdapterFormControlCompositionPartName;
};

export type AdapterFormControlCompositionIndexProjection = {
  facts: AdapterFormControlCompositionFacts;
  kind: "field-composition";
};

export type AdapterFormControlCompositionFacts = {
  attrs: {
    control: string;
    dirty: string;
    disabled: string;
    description: string;
    error: string;
    input: string;
    invalid: string;
    item: string;
    label: string;
    name: string;
    root: string;
    touched: string;
    validity: string;
  };
  control: {
    disabledAttribute: string;
    disabledForwardedAttribute: string;
    disabledProp: AdapterFamilyProp;
    valueType: string;
    valueTypeName: string;
  };
  displayName: string;
  exports: {
    control: string;
    description: string;
    error: string;
    item: string;
    label: string;
    namespace: string;
    root: string;
    validity: string;
  };
  formTiming: {
    errorVisibility: AdapterFormTimingProjection;
    revalidationTiming: AdapterFormTimingProjection;
    typeImport: {
      importSource: string;
      name: string;
    };
    validationTiming: AdapterFormTimingProjection;
  };
  index: {
    importMembers: AdapterExportMember[];
    namespaceMembers: Array<{ key: string; name: string }>;
    typeExports: string[];
  };
  message: {
    error: AdapterFormMessageProjection & {
      messageSource: {
        attribute: string;
        prop: AdapterFamilyProp;
        typeName: string;
      };
    };
    matchType: string;
    matchValues: string[];
    validity: AdapterFormMessageProjection;
  };
  parts: Record<
    AdapterFormControlCompositionPartName,
    AdapterFamilyPart & { namespaceKey: string }
  >;
  rootState: {
    dirty: AdapterFormRootStateProjection;
    disabled: AdapterFormRootStateProjection;
    invalid: AdapterFormRootStateProjection;
    name: AdapterFormRootStateProjection;
    touched: AdapterFormRootStateProjection;
  };
  runtime: {
    factory: string;
    importSource: string;
    setupFunction: string;
    typeImportSource: string;
  };
};

export type AdapterFormTimingProjection = {
  attribute: string;
  dataPropName: string;
  prop: AdapterFamilyProp;
};

export type AdapterFormMessageProjection = {
  hiddenDefault: string;
  matchAttribute: string;
  matchDefault: string;
  matchProp: AdapterFamilyProp;
};

export type AdapterFormRootStateProjection = {
  attribute: string;
  prop: AdapterFamilyProp;
  setter: string;
};

export type AdapterRangeControlPartName =
  | "control"
  | "indicator"
  | "label"
  | "root"
  | "thumb"
  | "track";

export type AdapterRangeControlComponentProjection = {
  facts: AdapterRangeControlFacts;
  kind: "range-control";
  part: AdapterRangeControlPartName;
};

export type AdapterRangeControlIndexProjection = {
  facts: AdapterRangeControlFacts;
  kind: "range-control";
};

export type AdapterRangeStatusPartName = "indicator" | "label" | "root" | "track" | "value";

export type AdapterRangeStatusComponentProjection = {
  facts: AdapterRangeStatusFacts;
  kind: "range-status";
  part: AdapterRangeStatusPartName;
};

export type AdapterRangeStatusIndexProjection = {
  facts: AdapterRangeStatusFacts;
  kind: "range-status";
};

export type AdapterRangeStatusFacts = {
  attrs: {
    indicator: string;
    indeterminate: string;
    label: string;
    labelRole: {
      attribute: string;
      value: string;
    };
    max: string;
    min: string;
    root: string;
    track: string;
    value: string;
    valueAriaHidden: {
      attribute: string;
      value: string;
    };
    valuePart: string;
    valuePreserveText: string;
  };
  displayName: string;
  exports: Record<AdapterRangeStatusPartName, string> & {
    namespace: string;
  };
  index: {
    importMembers: AdapterExportMember[];
    namespaceMembers: Array<{ key: string; name: string }>;
  };
  parts: Record<
    AdapterRangeStatusPartName,
    AdapterFamilyPart & {
      namespaceKey: string;
      role?: string;
    }
  >;
  props: {
    format?: AdapterFamilyProp;
    getAriaValueText?: AdapterFamilyProp;
    locale?: AdapterFamilyProp;
    max: AdapterFamilyProp;
    min: AdapterFamilyProp;
    value: AdapterFamilyProp;
  };
  runtime: {
    factory: string;
    importSource: string;
    setupFunction: string;
    typeImportSource: string;
  };
  setters: {
    formatOptionsSetter?: {
      method: string;
      options?: Record<string, boolean | number | string>;
    };
    valueSetter?: {
      method: string;
      options?: Record<string, boolean | number | string>;
    };
  };
  state: {
    name: string;
    valueType: string;
  };
};

export type AdapterRangeControlFacts = {
  attrs: {
    control: string;
    defaultValue: string;
    disabled: string;
    form: string;
    index: string;
    indicator: string;
    input: string;
    inputAriaHidden: string;
    inputTabIndex: string;
    inputType: string;
    label: string;
    largeStep: string;
    max: string;
    min: string;
    minStepsBetweenValues: string;
    name: string;
    orientation: string;
    root: string;
    step: string;
    thumb: string;
    track: string;
    value: string;
  };
  displayName: string;
  events: {
    valueChange: {
      callbackProp: string;
      detailsType: string;
      name: string;
      valueProperty: string;
      valueType: string;
    };
    valueCommitted: {
      callbackProp: string;
      detailsType: string;
      name: string;
      valueProperty: string;
      valueType: string;
    };
  };
  exports: {
    control: string;
    indicator: string;
    label: string;
    namespace: string;
    root: string;
    thumb: string;
    track: string;
  };
  index: {
    importMembers: AdapterExportMember[];
    namespaceMembers: Array<{ key: string; name: string }>;
    typeExports: string[];
  };
  inputRefPropName: string;
  parts: Record<
    AdapterRangeControlPartName,
    AdapterFamilyPart & { namespaceKey: string; role?: string }
  >;
  props: {
    defaultValue: AdapterFamilyProp;
    disabled: AdapterFamilyProp;
    form: AdapterFamilyProp;
    index: AdapterFamilyProp;
    largeStep: AdapterFamilyProp;
    max: AdapterFamilyProp;
    min: AdapterFamilyProp;
    minStepsBetweenValues: AdapterFamilyProp;
    name: AdapterFamilyProp;
    orientation: AdapterFamilyProp;
    step: AdapterFamilyProp;
    value: AdapterFamilyProp;
  };
  rootRole: string;
  runtime: {
    factory: string;
    importSource: string;
    setupFunction: string;
    typeImportSource: string;
  };
  serializer: {
    arrayType: string;
    scalarType: string;
    strategy: "number-or-json-array";
    valueType: string;
  };
  setter: {
    method: string;
    options?: Record<string, boolean | number | string>;
  };
  setters: {
    disabled: string;
    name: string;
    options: string;
  };
  state: {
    getter: string;
    name: string;
    type: string;
  };
  thumbInput: {
    hiddenRangeInput: {
      ariaHiddenValue: string;
      tabIndexValue: string;
      typeValue: string;
    };
    nesting: "input-inside-thumb";
  };
};

export type AdapterHiddenInputVisualSlotPartName = "group" | "root" | "separator" | "slot";

export type AdapterHiddenInputVisualSlotComponentProjection = {
  facts: AdapterHiddenInputVisualSlotFacts;
  kind: "hidden-input-visual-slot";
  part: AdapterHiddenInputVisualSlotPartName;
};

export type AdapterHiddenInputVisualSlotIndexProjection = {
  facts: AdapterHiddenInputVisualSlotFacts;
  kind: "hidden-input-visual-slot";
};

export type AdapterHiddenInputVisualSlotFacts = {
  attrs: {
    ariaDisabled: string;
    defaultValue: string;
    disabled: string;
    form: string;
    group: string;
    id: string;
    input: string;
    inputAutocomplete: string;
    inputClass: string;
    inputMaxLength: string;
    inputMode: string;
    inputReadOnly: string;
    inputTabIndex: string;
    maxLength: string;
    name: string;
    pattern: string;
    readOnly: string;
    required: string;
    root: string;
    rootTabIndex: string;
    separator: string;
    separatorAriaHidden: string;
    slot: string;
    slotCaret: string;
    slotCaretClass: string;
    slotCaretHidden: string;
    slotChar: string;
    slotIndex: string;
    value: string;
  };
  displayName: string;
  event: {
    callbackProp: string;
    detailsType: string;
    name: string;
    valueProperty: string;
    valueType: string;
  };
  exports: {
    group: string;
    namespace: string;
    root: string;
    separator: string;
    slot: string;
  };
  index: {
    importMembers: AdapterExportMember[];
    namespaceMembers: Array<{ key: string; name: string }>;
    typeExports: string[];
  };
  nativeInput: {
    autocompleteValue: string;
    hiddenClassValue: string;
    nesting: "input-inside-root-before-visual-slots";
    tabIndexValue: string;
  };
  parts: Record<
    AdapterHiddenInputVisualSlotPartName,
    AdapterFamilyPart & { namespaceKey: string; role?: string }
  > & {
    input: AdapterFamilyPart;
    slotCaret: AdapterFamilyPart;
    slotChar: AdapterFamilyPart;
  };
  pattern: {
    defaultPattern: string;
    numericPatternExamples: string[];
  };
  props: {
    caret: AdapterFamilyProp;
    defaultValue: AdapterFamilyProp;
    disabled: AdapterFamilyProp;
    form: AdapterFamilyProp;
    id: AdapterFamilyProp;
    index: AdapterFamilyProp;
    maxLength: AdapterFamilyProp;
    name: AdapterFamilyProp;
    pattern: AdapterFamilyProp;
    readOnly: AdapterFamilyProp;
    required: AdapterFamilyProp;
    value: AdapterFamilyProp;
  };
  runtime: {
    factory: string;
    importSource: string;
    setupFunction: string;
    typeImportSource: string;
  };
  setter: {
    method: string;
    options?: Record<string, boolean | number | string>;
  };
  setters: {
    disabled: string;
    formOptions: string;
  };
  state: {
    getter: string;
    name: string;
    type: string;
  };
  visualSlots: {
    caretRendering: {
      outletName: string;
    };
    separator: {
      ariaHiddenValue: string;
      role: string;
    };
    slotCaret: {
      classValue: string;
    };
  };
};

export type AdapterFileDropControlPartName =
  | "filesList"
  | "input"
  | "loadingIndicator"
  | "root"
  | "uploadIndicator";

export type AdapterFileDropControlComponentProjection = {
  facts: AdapterFileDropControlFacts;
  kind: "file-drop-control";
  part: AdapterFileDropControlPartName;
};

export type AdapterFileDropControlIndexProjection = {
  facts: AdapterFileDropControlFacts;
  kind: "file-drop-control";
};

export type AdapterFileDropControlFacts = {
  attrs: {
    ariaDisabled: string;
    disabled: string;
    dragActive: string;
    filesList: string;
    hasFiles: string;
    input: string;
    inputClass: string;
    inputDisabled: string;
    inputTabIndex: string;
    inputType: string;
    isUploading: string;
    loadingIndicator: string;
    role: string;
    root: string;
    uploadIndicator: string;
  };
  displayName: string;
  event: {
    callbackProp: string;
    detailsType: string;
    name: string;
    valueProperty: string;
    valueType: string;
  };
  exports: {
    filesList: string;
    input: string;
    loadingIndicator: string;
    namespace: string;
    root: string;
    uploadIndicator: string;
  };
  fileInput: {
    acceptsProps: string[];
    disabledForwardedAttribute: string;
    formProps: string[];
    hiddenClassValue: string;
    tabIndexValue: string;
    typeValue: string;
  };
  fileList: {
    emptyInitialState: string;
    renderingBoundary: "runtime-owned-dom-replacement";
    stateAttribute: string;
  };
  index: {
    importMembers: AdapterExportMember[];
    namespaceMembers: Array<{ key: string; name: string }>;
    typeExports: string[];
  };
  parts: Record<AdapterFileDropControlPartName, AdapterFamilyPart & { namespaceKey: string }> & {
    root: AdapterFamilyPart & { namespaceKey: string; role: string };
  };
  props: {
    accept: AdapterFamilyProp;
    disabled: AdapterFamilyProp;
    isUploading: AdapterFamilyProp;
    multiple: AdapterFamilyProp;
    name: AdapterFamilyProp;
    required: AdapterFamilyProp;
  };
  runtime: {
    factory: string;
    importSource: string;
    setupFunction: string;
    typeImportSource: string;
  };
  setters: {
    disabled: string;
    uploading: string;
  };
  uploadState: {
    getter: string;
    hiddenWhenNotUploadingPart: "loadingIndicator";
    hiddenWhenUploadingPart: "uploadIndicator";
    name: string;
    setter: string;
    type: string;
  };
};

export type AdapterFormFieldCoordinatorComponentProjection = {
  facts: AdapterFormFieldCoordinatorFacts;
  kind: "form-field-coordinator";
  part: "error-summary" | "root";
};

export type AdapterFormFieldCoordinatorIndexProjection = {
  facts: AdapterFormFieldCoordinatorFacts;
  kind: "form-field-coordinator";
};

export type AdapterFormFieldCoordinatorFacts = {
  attrs: {
    errorSummary: string;
    errorSummaryAriaAtomic: string;
    errorSummaryAriaLive: string;
    errorSummaryHidden: string;
    errorSummaryRole: string;
    errorSummarySlot: string;
    errorVisibility: string;
    revalidationTiming: string;
    root: string;
    rootSlot: string;
    validationTiming: string;
  };
  displayName: string;
  exports: {
    errorSummary: string;
    namespace: string;
    root: string;
  };
  parts: {
    errorSummary: AdapterFamilyPart & { namespaceKey: string; slotValue: string };
    root: AdapterFamilyPart & { namespaceKey: string; slotValue: string };
  };
  props: {
    dataErrorVisibility: AdapterFamilyProp;
    dataRevalidationTiming: AdapterFamilyProp;
    dataValidationTiming: AdapterFamilyProp;
    errorVisibility: AdapterFamilyProp;
    revalidationTiming: AdapterFamilyProp;
    validationTiming: AdapterFamilyProp;
  };
  runtime: {
    factory: string;
    helperExports: string[];
    importSource: string;
    rootVariable: string;
    setupFunction: string;
    typeImportSource: string;
    typeExports: string[];
    validationTimingType: string;
  };
};

export type AdapterDisclosurePresenceComponentProjection = {
  facts: AdapterDisclosurePresenceFacts;
  kind: "disclosure-presence";
  part: "panel" | "root" | "trigger";
};

export type AdapterDisclosurePresenceIndexProjection = {
  facts: AdapterDisclosurePresenceFacts;
  kind: "disclosure-presence";
};

export type AdapterSingleBooleanControlComponentProjection = {
  facts: AdapterSingleBooleanControlFacts;
  kind: "single-boolean-control";
  part: "root";
};

export type AdapterSingleBooleanControlIndexProjection = {
  facts: AdapterSingleBooleanControlFacts;
  kind: "single-boolean-control";
};

export type AdapterGroupedValueControlComponentProjection = {
  facts: AdapterGroupedValueControlFacts;
  kind: "grouped-value-control";
  part: "root";
};

export type AdapterGroupedValueControlHelperProjection = {
  facts: AdapterGroupedValueControlFacts;
  kind: "grouped-value-control";
};

export type AdapterGroupedValueControlIndexProjection = {
  facts: AdapterGroupedValueControlFacts;
  kind: "grouped-value-control";
};

export type AdapterMediaStatusComponentProjection = {
  facts: AdapterMediaStatusFacts;
  kind: "media-status";
  part: "fallback" | "image" | "root";
};

export type AdapterMediaStatusIndexProjection = {
  facts: AdapterMediaStatusFacts;
  kind: "media-status";
};

export type AdapterViewportMeasurementComponentProjection = {
  facts: AdapterViewportMeasurementFacts;
  kind: "viewport-measurement";
  part: "content" | "corner" | "root" | "scrollbar" | "thumb" | "viewport";
};

export type AdapterViewportMeasurementIndexProjection = {
  facts: AdapterViewportMeasurementFacts;
  kind: "viewport-measurement";
};

export type AdapterNativeOverlayPartName =
  | "backdrop"
  | "close"
  | "description"
  | "popup"
  | "portal"
  | "root"
  | "title"
  | "trigger"
  | "viewport";

export type AdapterNativeOverlayComponentProjection = {
  facts: AdapterNativeOverlayFacts;
  kind: "native-overlay";
  part: AdapterNativeOverlayPartName;
};

export type AdapterNativeOverlayIndexProjection = {
  facts: AdapterNativeOverlayFacts;
  kind: "native-overlay";
};

export type AdapterNativeOverlayFacts = {
  attrs: {
    backdrop: string;
    backdropHidden: string;
    backdropState: string;
    close: string;
    closeType: string;
    closeOnEscape: string;
    closeOnOutsideInteract: string;
    defaultOpen: string;
    description: string;
    modal: string;
    popup: string;
    popupRole?: string;
    popupSide?: string;
    popupState: string;
    portal?: string;
    root: string;
    rootState: string;
    targetId: string;
    title: string;
    trigger: string;
    triggerAriaHaspopup: string;
    triggerState: string;
    triggerType: string;
    viewport?: string;
  };
  displayName: string;
  events: {
    closeComplete: {
      callbackProp: string;
      detailsType: string;
      name: string;
      valueProperty: string;
      valueType: string;
    };
    openChange: {
      callbackProp: string;
      detailsType: string;
      name: string;
      valueProperty: string;
      valueType: string;
    };
  };
  exports: {
    backdrop: string;
    close: string;
    description: string;
    namespace: string;
    popup: string;
    portal?: string;
    root: string;
    title: string;
    trigger: string;
    viewport?: string;
  };
  index: {
    importMembers: AdapterExportMember[];
    namespaceMembers: Array<{ key: string; name: string }>;
    typeExports: string[];
  };
  parts: {
    backdrop: AdapterFamilyPart & { namespaceKey: string };
    close: AdapterFamilyPart & { namespaceKey: string };
    description: AdapterFamilyPart & { namespaceKey: string };
    popup: AdapterFamilyPart & { namespaceKey: string; role: string };
    portal?: AdapterFamilyPart & { namespaceKey: string };
    root: AdapterFamilyPart & { namespaceKey: string };
    title: AdapterFamilyPart & { namespaceKey: string };
    trigger: AdapterFamilyPart & { namespaceKey: string };
    viewport?: AdapterFamilyPart & { namespaceKey: string };
  };
  popupRoleValue?: string;
  props: {
    closeOnEscape: AdapterFamilyProp;
    closeOnOutsideInteract: AdapterFamilyProp;
    defaultOpen: AdapterFamilyProp;
    modal: AdapterFamilyProp;
    open: AdapterFamilyProp;
    side?: AdapterFamilyProp;
    targetId: AdapterFamilyProp;
  };
  runtime: {
    factory: string;
    importSource: string;
    setupFunction: string;
    typeImportSource: string;
  };
  sideDefault?: string;
  state: {
    getter: string;
    name: string;
  };
  setter: {
    method: string;
    options?: Record<string, boolean | number | string>;
  };
};

export type AdapterPresenceFloatingOverlayPartName =
  | "arrow"
  | "backdrop"
  | "close"
  | "description"
  | "popup"
  | "portal"
  | "positioner"
  | "root"
  | "title"
  | "trigger"
  | "viewport";

export type AdapterPresenceFloatingOverlayComponentProjection = {
  facts: AdapterPresenceFloatingOverlayFacts;
  kind: "presence-floating-overlay";
  part: AdapterPresenceFloatingOverlayPartName;
};

export type AdapterPresenceFloatingOverlayIndexProjection = {
  facts: AdapterPresenceFloatingOverlayFacts;
  kind: "presence-floating-overlay";
};

export type AdapterPresenceFloatingOverlayFacts = {
  attrs: {
    arrow: string;
    backdrop: string;
    backdropHidden: string;
    backdropState: string;
    close: string;
    closeType: string;
    description: string;
    floatingAlign: string;
    floatingAvoidCollisions: string;
    floatingCollisionStrategy: string;
    floatingSide: string;
    floatingSideOffset: string;
    popup: string;
    popupHidden: string;
    popupRole: string;
    popupState: string;
    popupTabIndex: string;
    popupTabindex: string;
    portal: string;
    positioner: string;
    positionerState: string;
    root: string;
    rootCloseDelay: string;
    rootCloseOnEscape: string;
    rootCloseOnOutsideInteract: string;
    rootDefaultOpen: string;
    rootModal: string;
    rootOpenOnHover: string;
    rootState: string;
    title: string;
    trigger: string;
    triggerAriaExpanded: string;
    triggerAriaHaspopup: string;
    triggerAsChild: string;
    triggerState: string;
    triggerType: string;
    viewport: string;
  };
  displayName: string;
  events: {
    closeComplete: {
      callbackProp: string;
      detailsType: string;
      name: string;
      valueProperty: string;
      valueType: string;
    };
    openChange: {
      callbackProp: string;
      detailsType: string;
      name: string;
      valueProperty: string;
      valueType: string;
    };
  };
  exports: {
    arrow: string;
    backdrop: string;
    close: string;
    description: string;
    namespace: string;
    popup: string;
    portal: string;
    positioner: string;
    root: string;
    title: string;
    trigger: string;
    viewport: string;
  };
  floating: {
    anchorPart: string;
    optionProps: string[];
    popupPart: string;
    portalPart: string;
    positionerPart: string;
  };
  index: {
    importMembers: AdapterExportMember[];
    namespaceMembers: Array<{ key: string; name: string }>;
    typeExports: string[];
  };
  parts: {
    arrow: AdapterFamilyPart & { namespaceKey: string };
    backdrop: AdapterFamilyPart & { namespaceKey: string };
    close: AdapterFamilyPart & { namespaceKey: string };
    description: AdapterFamilyPart & { namespaceKey: string };
    popup: AdapterFamilyPart & { namespaceKey: string; role: string };
    portal: AdapterFamilyPart & { namespaceKey: string };
    positioner: AdapterFamilyPart & { namespaceKey: string };
    root: AdapterFamilyPart & { namespaceKey: string };
    title: AdapterFamilyPart & { namespaceKey: string };
    trigger: AdapterFamilyPart & { namespaceKey: string };
    viewport: AdapterFamilyPart & { namespaceKey: string };
  };
  props: {
    align: AdapterFamilyProp;
    asChild: AdapterFamilyProp;
    avoidCollisions: AdapterFamilyProp;
    collisionStrategy: AdapterFamilyProp;
    closeDelay: AdapterFamilyProp;
    closeOnEscape: AdapterFamilyProp;
    closeOnOutsideInteract: AdapterFamilyProp;
    defaultOpen: AdapterFamilyProp;
    modal: AdapterFamilyProp;
    open: AdapterFamilyProp;
    openOnHover: AdapterFamilyProp;
    side: AdapterFamilyProp;
    sideOffset: AdapterFamilyProp;
  };
  runtime: {
    factory: string;
    importSource: string;
    setupFunction: string;
    typeImportSource: string;
  };
  state: {
    getter: string;
    name: string;
  };
  setter: {
    method: string;
    options?: Record<string, boolean | number | string>;
  };
};

export type AdapterTimedFloatingOverlayPartName =
  | "arrow"
  | "backdrop"
  | "popup"
  | "portal"
  | "positioner"
  | "root"
  | "trigger"
  | "viewport";

export type AdapterTimedFloatingOverlayComponentProjection = {
  facts: AdapterTimedFloatingOverlayFacts;
  kind: "timed-floating-overlay";
  part: AdapterTimedFloatingOverlayPartName;
};

export type AdapterTimedFloatingOverlayIndexProjection = {
  facts: AdapterTimedFloatingOverlayFacts;
  kind: "timed-floating-overlay";
};

export type AdapterTimedFloatingOverlayFacts = {
  attrs: {
    align: string;
    arrow: string;
    arrowState: string;
    avoidCollisions: string;
    popup: string;
    popupState: string;
    portal: string;
    positioner: string;
    positionerState: string;
    root: string;
    rootCloseDelay: string;
    rootCloseOnEscape: string;
    rootCloseOnOutsideInteract: string;
    rootContentHoverable: string;
    rootDefaultOpen: string;
    rootDisabled?: string;
    rootOpenDelay: string;
    rootState: string;
    popupHidden: string;
    side: string;
    sideOffset: string;
    trigger: string;
    triggerAriaDisabled: string;
    triggerAsChild: string;
    triggerCloseDelay?: string;
    triggerDisabled: string;
    triggerNativeDisabled?: string;
    triggerOpenDelay?: string;
    triggerState: string;
    backdrop?: string;
    backdropHidden?: string;
    backdropState?: string;
    viewport?: string;
    viewportState?: string;
  };
  displayName: string;
  event: {
    callbackProp: string;
    detailsType: string;
    name: string;
    valueProperty: string;
    valueType: string;
  };
  exports: Record<"arrow" | "popup" | "portal" | "positioner" | "root" | "trigger", string> &
    Partial<Record<"backdrop" | "viewport", string>> & {
      namespace: string;
    };
  index: {
    importMembers: AdapterExportMember[];
    namespaceMembers: Array<{ key: string; name: string }>;
    typeExports: string[];
  };
  parts: Record<
    "arrow" | "popup" | "portal" | "positioner" | "root" | "trigger",
    AdapterFamilyPart & {
      namespaceKey: string;
      role?: string;
    }
  > &
    Partial<
      Record<
        "backdrop" | "viewport",
        AdapterFamilyPart & {
          namespaceKey: string;
          role?: string;
        }
      >
    >;
  props: {
    align: AdapterFamilyProp;
    asChild: AdapterFamilyProp;
    avoidCollisions: AdapterFamilyProp;
    closeDelay: AdapterFamilyProp;
    closeOnEscape: AdapterFamilyProp;
    closeOnOutsideInteract: AdapterFamilyProp;
    defaultOpen: AdapterFamilyProp;
    disabled: AdapterFamilyProp;
    disableHoverableContent: AdapterFamilyProp;
    open: AdapterFamilyProp;
    openDelay: AdapterFamilyProp;
    side: AdapterFamilyProp;
    sideOffset: AdapterFamilyProp;
  };
  popupRole: string;
  popup: {
    omitTabIndexProps: boolean;
  };
  root: {
    disabled: boolean;
  };
  runtime: {
    factory: string;
    importSource: string;
    setupFunction: string;
    typeImportSource: string;
  };
  setters: {
    disabled: { method: string };
    open: { method: string; options?: Record<string, boolean | number | string> };
  };
  state: {
    getter: string;
    name: string;
    valueType: string;
  };
  trigger: {
    asChildWrapperElement: string;
    clickGuardWhenDisabled: boolean;
    delayOverrides: boolean;
    disabledNavigation: boolean;
    renderedElement: string;
    triggerKind: "anchor" | "button";
  };
};

export type AdapterSidebarPartName = "menuButton" | "provider" | "rail" | "sidebar" | "trigger";

export type AdapterSidebarComponentProjection = {
  facts: AdapterSidebarFacts;
  kind: "sidebar";
  part: AdapterSidebarPartName;
};

export type AdapterSidebarHelperProjection = {
  facts: AdapterSidebarFacts;
  kind: "sidebar-context";
};

export type AdapterSidebarIndexProjection = {
  facts: AdapterSidebarFacts;
  kind: "sidebar";
};

export type AdapterSidebarValueEvent = {
  callbackProp: string;
  detailsType: string;
  name: string;
  valueProperty: string;
  valueType: string;
};

export type AdapterSidebarStateControl = {
  getter: string;
  initialAttribute: string;
  renderedAttribute: string;
  setter: string;
  setterOptions?: Record<string, boolean | number | string>;
  valueType: "boolean";
};

export type AdapterSidebarFacts = {
  attrs: {
    defaultMobileOpen: string;
    defaultOpen: string;
    keyboardShortcut: string;
    menuButton: string;
    menuButtonState: string;
    mobileOpen: string;
    mobileQuery: string;
    persistOpen: string;
    persistenceKey: string;
    persistenceMaxAge: string;
    persistenceStorage: string;
    provider: string;
    providerState: string;
    rail: string;
    railExpanded: string;
    railState: string;
    railTabindex: string;
    railType: string;
    sidebar: string;
    sidebarCollapsible: string;
    sidebarCollapsibleMode: string;
    sidebarSide: string;
    sidebarState: string;
    sidebarVariant: string;
    trigger: string;
    triggerExpanded: string;
    triggerState: string;
    triggerType: string;
  };
  context: {
    contextExports: string[];
    contextTypeExports: string[];
    file: string;
    hook: string;
    name: string;
    typeName: string;
  };
  displayName: string;
  events: {
    mobileOpen: AdapterSidebarValueEvent;
    open: AdapterSidebarValueEvent;
  };
  exports: Record<AdapterSidebarPartName, string> & {
    namespace: string;
  };
  index: {
    namespaceMembers: Array<{ key: string; name: string }>;
    namedExports: string[];
    typeExports: string[];
    valueExports: string[];
  };
  parts: Record<
    AdapterSidebarPartName,
    AdapterFamilyPart & {
      namespaceKey: string;
      role?: string;
    }
  >;
  props: {
    asChild: AdapterFamilyProp;
    collapsible: AdapterFamilyProp;
    defaultMobileOpen: AdapterFamilyProp;
    defaultOpen: AdapterFamilyProp;
    keyboardShortcut: AdapterFamilyProp;
    mobileOpen: AdapterFamilyProp;
    mobileQuery: AdapterFamilyProp;
    open: AdapterFamilyProp;
    persistOpen: AdapterFamilyProp;
    persistenceKey: AdapterFamilyProp;
    persistenceMaxAge: AdapterFamilyProp;
    persistenceStorage: AdapterFamilyProp;
    side: AdapterFamilyProp;
    variant: AdapterFamilyProp;
  };
  rail: {
    tabIndexValue: string;
  };
  runtime: {
    factory: string;
    importSource: string;
    setupFunction: string;
    typeImportSource: string;
  };
  state: {
    mobileOpen: AdapterSidebarStateControl;
    open: AdapterSidebarStateControl;
  };
  types: {
    mobileOpenDetails: string;
    openDetails: string;
    persistenceStorage: string;
  };
};

export type AdapterRepeatedDisclosurePartName = "header" | "item" | "panel" | "root" | "trigger";

export type AdapterRepeatedDisclosureComponentProjection = {
  facts: AdapterRepeatedDisclosureFacts;
  kind: "repeated-disclosure";
  part: AdapterRepeatedDisclosurePartName;
};

export type AdapterRepeatedDisclosureIndexProjection = {
  facts: AdapterRepeatedDisclosureFacts;
  kind: "repeated-disclosure";
};

export type AdapterRepeatedDisclosureFacts = {
  attrs: {
    collapsible: string;
    defaultValue: string;
    disabled: string;
    header: string;
    item: string;
    itemState: string;
    itemValue: string;
    panel: string;
    panelHidden: string;
    panelState: string;
    root: string;
    rootState: string;
    trigger: string;
    triggerExpanded: string;
    triggerState: string;
    triggerType: string;
    type: string;
  };
  displayName: string;
  events: {
    valueChange: {
      callbackProp: string;
      detailsType: string;
      name: string;
      valueProperty: string;
      valueType: string;
    };
  };
  exports: {
    header: string;
    item: string;
    namespace: string;
    panel: string;
    root: string;
    trigger: string;
  };
  index: {
    importMembers: AdapterExportMember[];
    namespaceMembers: Array<{ key: string; name: string }>;
    typeExports: string[];
  };
  itemContext: {
    consumers: string[];
    name: string;
    providerPart: string;
    provides: string[];
  };
  panelVisibility: {
    hiddenAttribute: string;
    stateAttribute: string;
  };
  parts: {
    header: AdapterFamilyPart & { namespaceKey: string };
    item: AdapterFamilyPart & { namespaceKey: string };
    panel: AdapterFamilyPart & { namespaceKey: string };
    root: AdapterFamilyPart & { namespaceKey: string };
    trigger: AdapterFamilyPart & { namespaceKey: string };
  };
  props: {
    collapsible: AdapterFamilyProp;
    defaultValue: AdapterFamilyProp & { staticMarkupType: string };
    disabled: AdapterFamilyProp;
    itemValue: AdapterFamilyProp;
    type: AdapterFamilyProp;
    value: AdapterFamilyProp;
  };
  runtime: {
    factory: string;
    importSource: string;
    setupFunction: string;
    typeImportSource: string;
  };
  state: {
    getter: string;
    name: string;
    type: string;
  };
  setter: {
    method: string;
    options?: Record<string, boolean | number | string>;
  };
  valueEqualityHelper: string;
};

export type AdapterViewportMeasurementFacts = {
  attrs: {
    content: string;
    corner: string;
    cornerAriaHidden: string;
    keepMounted: string;
    orientation: string;
    overflowEdgeThreshold: string;
    overflowEdgeThresholdEdges: {
      xEnd: string;
      xStart: string;
      yEnd: string;
      yStart: string;
    };
    root: string;
    scrollbar: string;
    scrollbarAriaHidden: string;
    thumb: string;
    viewport: string;
    viewportStyle: string;
    viewportTabIndex: string;
    viewportTabindex: string;
  };
  displayName: string;
  exports: {
    content: string;
    corner: string;
    namespace: string;
    root: string;
    scrollbar: string;
    thumb: string;
    viewport: string;
  };
  parts: {
    content: AdapterFamilyPart & { namespaceKey: string; role: string };
    corner: AdapterFamilyPart & { namespaceKey: string };
    root: AdapterFamilyPart & { namespaceKey: string; role: string };
    scrollbar: AdapterFamilyPart & { namespaceKey: string };
    thumb: AdapterFamilyPart & { namespaceKey: string };
    viewport: AdapterFamilyPart & { namespaceKey: string; role: string };
  };
  props: {
    keepMounted: AdapterFamilyProp;
    orientation: AdapterFamilyProp;
    overflowEdgeThreshold: AdapterFamilyProp;
  };
  runtime: {
    factory: string;
    importSource: string;
    setupFunction: string;
  };
  threshold: {
    attributesTypeName: string;
    helperName: string;
    normalizeHelperName: string;
    typeName: string;
  };
};

export type AdapterMediaStatusFacts = {
  attrs: {
    fallbackDelay: string;
    fallbackStatus: string;
    imageStatus: string;
    rootStatus: string;
  };
  displayName: string;
  errors: {
    missingSource: string;
  };
  event: {
    callbackProp: string;
    detailsType: string;
    domEvent: string;
    name: string;
    valueProperty: string;
  };
  exports: {
    fallback: string;
    image: string;
    namespace: string;
    root: string;
  };
  parts: {
    fallback: AdapterFamilyPart & { namespaceKey: string };
    image: AdapterFamilyPart & { namespaceKey: string };
    root: AdapterFamilyPart & { namespaceKey: string };
  };
  presence: {
    imageConcealment: {
      property: "visibility";
      value: "hidden";
    };
  };
  props: {
    alt: AdapterFamilyProp;
    asset: AdapterFamilyProp;
    delay: AdapterFamilyProp;
    src: AdapterFamilyProp;
  };
  runtime: {
    factory: string;
    importSource: string;
    setupFunction: string;
  };
  state: {
    getter: string;
    name: string;
    type: string;
  };
};

export type AdapterGroupedValueControlFacts = {
  attrs: {
    ariaDisabled?: string;
    ariaOrientation?: string;
    ariaReadOnly?: string;
    ariaRequired?: string;
    defaultValue: string;
    disabled: string;
    form?: string;
    loopFocus?: string;
    multiple?: string;
    name?: string;
    orientation?: string;
    readOnly?: string;
    required?: string;
    root: string;
    value: string;
  };
  behavior: {
    contextProvider: boolean;
    multipleValueNormalization: boolean;
    parseValueAttributeFunction?: string;
    syncUncontrolledValueFromAttribute: boolean;
  };
  context?: {
    componentName: string;
    hookName: string;
    typeName: string;
    values: AdapterFamilyProp[];
  };
  displayName: string;
  event: {
    callbackProp: string;
    detailsType: string;
    name: string;
    valueProperty: string;
    valueType: string;
  };
  exports: {
    namespace: string;
    root: string;
  };
  props: {
    defaultValue: AdapterFamilyProp;
    disabled: AdapterFamilyProp;
    form?: AdapterFamilyProp;
    loopFocus?: AdapterFamilyProp;
    multiple?: AdapterFamilyProp;
    name?: AdapterFamilyProp;
    orientation?: AdapterFamilyProp;
    readOnly?: AdapterFamilyProp;
    required?: AdapterFamilyProp;
    value: AdapterFamilyProp;
  };
  rootPart: AdapterFamilyPart & {
    role: string;
  };
  runtime: {
    factory: string;
    importSource: string;
    setupFunction: string;
    typeImportSource: string;
  };
  state: {
    getter: string;
    name: string;
    type: string;
  };
  setters: {
    disabled: {
      method: string;
      options?: Record<string, boolean | number | string>;
    };
    loopFocus?: {
      method: string;
      options?: Record<string, boolean | number | string>;
    };
    multiple?: {
      method: string;
      options?: Record<string, boolean | number | string>;
    };
    orientation?: {
      method: string;
      options?: Record<string, boolean | number | string>;
    };
    formOptions?: {
      method: string;
      props: string[];
    };
    readOnly?: {
      method: string;
      options?: Record<string, boolean | number | string>;
    };
    value: {
      method: string;
      options?: Record<string, boolean | number | string>;
    };
  };
};

export type AdapterSingleBooleanControlFacts = {
  attrs: {
    ariaDisabled: string;
    ariaState: string;
    defaultState: string;
    disabled: string;
    falsyPresence: string;
    native: string;
    state: string;
    syncGroup: string;
    truthyPresence: string;
    value: string;
  };
  displayName: string;
  event: {
    callbackProp: string;
    detailsType: string;
    name: string;
    valueProperty: string;
    valueType: string;
  };
  exports: {
    namespace: string;
    root: string;
  };
  initExclusionAttributes: string[];
  part: AdapterFamilyPart;
  render: {
    nonNativeElement: string;
    nonNativeElementType: string;
  };
  props: {
    defaultState: AdapterFamilyProp;
    disabled: AdapterFamilyProp;
    nativeButton: AdapterFamilyProp;
    state: AdapterFamilyProp;
    syncGroup: AdapterFamilyProp;
    value: AdapterFamilyProp;
  };
  runtime: {
    factory: string;
    destroyFunction: string;
    importSource: string;
    instancesName: string;
    setupFunction: string;
    typeImportSource: string;
  };
  state: {
    getter: string;
    name: string;
    pascalName: string;
  };
  setters: {
    disabled: {
      method: string;
      options?: Record<string, boolean | number | string>;
    };
    state: {
      method: string;
      options?: Record<string, boolean | number | string>;
    };
  };
};

export type AdapterDisclosurePresenceFacts = {
  attrs: {
    defaultOpen: string;
    disabled: string;
    panel: string;
    panelHidden: string;
    panelHiddenUntilFound: string;
    panelState: string;
    root: string;
    rootState: string;
    trigger: string;
    triggerExpanded: string;
    triggerState: string;
  };
  displayName: string;
  event: {
    callbackProp: string;
    detailsType: string;
    name: string;
    valueProperty: string;
    valueType: string;
  };
  exports: {
    namespace: string;
    panel: string;
    root: string;
    trigger: string;
  };
  openGetter: string;
  parts: {
    panel: AdapterFamilyPart;
    root: AdapterFamilyPart;
    trigger: AdapterFamilyPart;
  };
  props: {
    asChild: AdapterFamilyProp;
    defaultOpen: AdapterFamilyProp;
    disabled: AdapterFamilyProp;
    hiddenUntilFound: AdapterFamilyProp;
    open: AdapterFamilyProp;
  };
  runtime: {
    factory: string;
    importSource: string;
    setupFunction: string;
    typeImportSource: string;
  };
  setter: {
    method: string;
    options?: Record<string, boolean | number | string>;
  };
};

export type AdapterFamilyPart = {
  defaultElement: string;
  discoveryAttribute: string;
  discoveryAttributeOwnership?: AdapterAttributeOwnership;
  name: string;
};

export type AdapterFamilyProp = {
  defaultValue?: string;
  name: string;
  required?: boolean;
  type: string;
};

export type AdapterImport = {
  id: string;
  kind: "runtime" | "type" | "value";
  members: AdapterImportMember[];
  source: string;
};

export type AdapterImportMember = {
  imported: string;
  local?: string;
};

export type AdapterProp = {
  attributes?: AdapterAttribute[];
  description?: string;
  kind: "boolean" | "callback" | "rendering" | "state" | "string" | "unknown";
  name: string;
  required?: boolean;
  type: string;
};

export type AdapterDefaultValue = {
  prop: string;
  value: AdapterExpression;
};

export type AdapterAttribute = {
  name: string;
  ownership?: AdapterAttributeOwnership;
  value?: AdapterExpression | boolean | number | string;
};

export type AdapterAttributeOwnership = "protected" | "composed" | "defaulted" | "consumer";

export type AdapterRenderNode =
  | AdapterElementRenderNode
  | AdapterExpressionRenderNode
  | AdapterSlotRenderNode
  | AdapterTextRenderNode;

export type AdapterElementRenderNode = {
  attrs: AdapterAttribute[];
  children: AdapterRenderNode[];
  defaultElement: string;
  events: AdapterEventBridge[];
  kind: "element";
  part: string;
  refs: AdapterRef[];
};

export type AdapterExpressionRenderNode = {
  expression: AdapterExpression;
  kind: "expression";
};

export type AdapterSlotRenderNode = {
  fallback?: AdapterRenderNode[];
  kind: "slot";
  name?: string;
};

export type AdapterTextRenderNode = {
  kind: "text";
  value: string;
};

export type AdapterRuntimeLifecycle = {
  cleanup?: AdapterCodeBlock;
  factory: string;
  factoryImport: AdapterImport;
  mount: AdapterCodeBlock;
  options: AdapterRuntimeOption[];
  rootRef: string;
};

export type AdapterRuntimeOption = {
  name: string;
  source: "default" | "prop" | "state";
  value?: AdapterExpression;
};

export type AdapterRef = {
  id: string;
  part: string;
  public?: boolean;
};

export type AdapterEventBridge = {
  detailType?: string;
  handlerProp: string;
  runtimeEvent: string;
  targetPart: string;
};

export type AdapterControlledStateSync = {
  setter: string;
  state: string;
  valueProp: string;
};

export type AdapterContextProjection = {
  name: string;
  role: "consumer" | "provider";
  value: AdapterExpression;
};

export type AdapterPortal = {
  children: AdapterRenderNode[];
  sourcePart: string;
  target: AdapterExpression | string;
};

export type AdapterNamespaceExport = {
  kind: "named" | "namespace";
  members: AdapterExportMember[];
  namespace: string;
};

export type AdapterExportMember = {
  from: string;
  kind?: "type" | "value";
  name: string;
};

export type AdapterTypeFacade = {
  body: AdapterCodeBlock;
  exports: string[];
  name: string;
};

/**
 * Target-neutral JavaScript/runtime expression. Do not embed framework template
 * syntax here; framework adapters decide how expressions are placed into
 * frontmatter, JSX, setup blocks, templates, or compiled output.
 */
export type AdapterExpression = {
  code: string;
};

/**
 * Target-neutral runtime code block for values and lifecycle bodies. Component
 * specs may describe the runtime work needed, but target adapters own framework
 * syntax such as effects, setup scripts, cleanup hooks, and template placement.
 */
export type AdapterCodeBlock = {
  code: string;
};

export type AdapterPrintedFile = {
  contents: string;
  path: string;
};

/**
 * Target adapters own framework syntax and lifecycle projection. They should
 * understand concepts such as imports, props, render trees, context, and
 * portals, while remaining unaware of any particular widget vocabulary.
 */
export type FrameworkAdapter = {
  fileExtension: string;
  target: FrameworkAdapterTarget;
  normalizeAttributeName(name: string): string;
  printComponentFile(file: AdapterComponentFile): AdapterPrintedFile;
  printExports(exportsModel: AdapterNamespaceExport): string;
  printHelperFile(file: AdapterHelperFile): AdapterPrintedFile;
  printIndexFile(file: AdapterIndexFile): AdapterPrintedFile;
  printOutput(model: AdapterOutputModel): AdapterPrintedFile[];
  printTypeFacadeFile(file: AdapterTypeFacadeFile): AdapterPrintedFile;
  projectBooleanAttribute(attribute: AdapterAttribute): AdapterAttribute;
  projectContext(context: AdapterContextProjection): AdapterContextProjection;
  projectControlledStateSync(sync: AdapterControlledStateSync): AdapterControlledStateSync;
  projectDefaultValue(defaultValue: AdapterDefaultValue): AdapterDefaultValue;
  projectEventBridge(event: AdapterEventBridge): AdapterEventBridge;
  projectPortal(portal: AdapterPortal): AdapterPortal;
  projectProp(prop: AdapterProp): AdapterProp;
  projectRef(ref: AdapterRef): AdapterRef;
  projectRenderTree(renderTree: AdapterRenderNode): AdapterRenderNode;
  projectRuntimeLifecycle(lifecycle: AdapterRuntimeLifecycle): AdapterRuntimeLifecycle;
  projectSlot(slot: AdapterSlotRenderNode): AdapterSlotRenderNode;
};
