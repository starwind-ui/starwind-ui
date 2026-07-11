export type FrameworkTarget = "astro" | "react" | "solid" | "svelte" | "vue";

export type RuntimeTemplateCategory =
  | "static-semantic"
  | "single-boolean-control"
  | "controlled-value-group"
  | "form-value-control"
  | "presence-disclosure-control"
  | "presence-floating-overlay"
  | "composite-menu-overlay"
  | "floating-value-control"
  | "dialog-native-overlay"
  | "field-control-coordinator"
  | "notification-system"
  | "viewport-measurement";

export type RuntimeAdapterContract = {
  component: string;
  category: RuntimeTemplateCategory;
  displayName: string;
  runtime: RuntimeBridgeContract;
  parts: PrimitivePartContract[];
  props: PrimitivePropContract[];
  stateModels?: PrimitiveStateModelContract[];
  events?: PrimitiveEventContract[];
  setters?: PrimitiveSetterContract[];
  context?: PrimitiveContextContract[];
  form?: PrimitiveFormContract;
  presence?: PrimitivePresenceContract;
  floating?: PrimitiveFloatingContract;
  refs?: PrimitiveRefContract[];
  asChild?: PrimitiveAsChildContract[];
  initialMarkup?: PrimitiveInitialMarkupContract[];
  frameworkNotes?: Partial<Record<FrameworkTarget, string[]>>;
  escapeHatches?: PrimitiveEscapeHatchContract[];
};

export type RuntimeBridgeContract = {
  factory: string;
  importSource: "@starwind-ui/runtime" | `@starwind-ui/runtime/${string}`;
  rootPart: string;
  optionProps?: string[];
  optionPropLifecycles?: Partial<Record<string, PrimitiveRuntimeOptionLifecycle>>;
  destroys: true;
};

export type PrimitiveRuntimeOptionLifecycle =
  | "attribute-observed"
  | "constructor-only"
  | "refresh-required"
  | "setter-backed";

export type PrimitivePartContract = {
  name: string;
  defaultElement: string;
  discoveryAttribute: string;
  role?: string;
  forwardsRef?: boolean;
  initExclusionAttributes?: string[];
  ownsRuntime?: boolean;
  requiresContext?: string[];
  initialAttributes?: PrimitiveAttributeContract[];
};

export type PrimitiveAttributeContract = {
  name: string;
  source: "constant" | "prop" | "state" | "runtime";
  value?: string;
};

export type PrimitivePropContract = {
  defaultValue?: string;
  unsupportedTargets?: FrameworkTarget[];
  name: string;
  kind: "attribute" | "callback" | "children" | "control" | "option" | "rendering";
  required?: boolean;
  targets?: string[];
  type: string;
};

export type PrimitiveStateModelContract = {
  name: string;
  controlledProp?: string;
  defaultProp?: string;
  initialAttribute?: string;
  valueType: string;
  runtimeGetter?: string;
  runtimeSetter?: string;
  controlledStateSync?: "unsupported" | "custom-event" | "imperative";
};

export type PrimitiveEventContract = {
  callbackTiming?: "after-state-commit" | "before-state-commit";
  cancelable?: boolean;
  name: string;
  callbackProp: string;
  detailsType?: string;
  domEvent?: string;
  emitsFrom: string;
  valueProperty?: string;
  valueType?: string;
};

export type PrimitiveSetterContract =
  | {
      method: string;
      options?: Record<string, boolean | number | string>;
      prop?: never;
      props?: never;
      stateModel: string;
      suppressesEmit?: boolean;
    }
  | {
      method: string;
      options?: Record<string, boolean | number | string>;
      prop: string;
      props?: never;
      stateModel?: never;
      suppressesEmit?: boolean;
    }
  | {
      method: string;
      options?: Record<string, boolean | number | string>;
      prop?: never;
      props: readonly [string, ...string[]];
      stateModel?: never;
      suppressesEmit?: boolean;
    };

export type PrimitiveContextContract = {
  name: string;
  direction: "provides" | "consumes";
  values: string[];
};

export type PrimitiveFormContract = {
  hiddenInput?: {
    part: string;
    type: "checkbox" | "file" | "hidden" | "radio" | "range" | "text";
  };
  fieldIntegration?: boolean;
  props: string[];
};

export type PrimitivePresenceContract = {
  keepMountedProp?: string;
  initialHiddenParts: string[];
  initialVisibility?: PrimitiveInitialVisibilityContract[];
  unmountPolicy: "runtime-owned" | "runtime-owned-visibility" | "framework-owned" | "none";
};

export type PrimitiveInitialVisibilityContract = {
  condition?: string;
  delivery: "markup" | "ref-initializer" | "runtime-measurement";
  hidden: boolean;
  part: string;
  targets: FrameworkTarget[];
};

export type PrimitiveFloatingContract = {
  anchorPart: string;
  positionerPart: string;
  popupPart: string;
  portalPart?: string;
  optionProps: string[];
};

export type PrimitiveRefContract = {
  part: string;
  public: boolean;
};

export type PrimitiveAsChildContract = {
  part: string;
  merges: Array<"aria" | "className" | "data" | "events" | "ref" | "style">;
};

export type PrimitiveInitialMarkupContract = {
  part: string;
  attributes: string[];
  reason: string;
};

export type PrimitiveEscapeHatchContract = {
  affectedFrameworks: FrameworkTarget[];
  boundary: string;
  contractOwnedFacts: string[];
  demotionCriteria: string;
  reason: string;
  tests: string[];
};
