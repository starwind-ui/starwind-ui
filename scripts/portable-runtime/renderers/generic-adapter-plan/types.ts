import type {
  PrimitiveAsChildContract,
  PrimitiveContextContract,
  PrimitiveEventContract,
  PrimitiveFloatingContract,
  PrimitiveFormContract,
  PrimitivePresenceContract,
  PrimitivePropContract,
  PrimitiveSetterContract,
  PrimitiveStateModelContract,
  RuntimeAdapterContract,
  RuntimeBridgeContract,
} from "../../contracts/primitive/types.js";

export type GenericAdapterPlan = {
  asChild?: GenericAdapterPlanAsChild[];
  category: RuntimeAdapterContract["category"];
  component: string;
  context?: GenericAdapterPlanContext[];
  displayName: string;
  events: GenericAdapterPlanEvent[];
  escapeDeclarations: GenericAdapterPlanEscapeDeclaration[];
  exports: GenericAdapterPlanExports;
  files: GenericAdapterPlanFile[];
  floating?: GenericAdapterPlanFloating;
  form?: GenericAdapterPlanForm;
  outputDirectory: string;
  parts: GenericAdapterPlanPart[];
  presence?: GenericAdapterPlanPresence;
  props: GenericAdapterPlanProp[];
  refs: GenericAdapterPlanRef[];
  runtime: Pick<
    RuntimeBridgeContract,
    "destroys" | "factory" | "importSource" | "optionProps" | "rootPart"
  >;
  sourceContract: RuntimeAdapterContract["component"];
  staticAttributes: GenericAdapterPlanStaticAttribute[];
  stateModels: GenericAdapterPlanStateModel[];
  setters: GenericAdapterPlanSetter[];
};

export type GenericAdapterPlanFile =
  | {
      exportName: string;
      kind: "part";
      part: string;
      path: string;
    }
  | {
      exportName: string;
      kind: "index";
      path: string;
      part?: never;
    };

export type GenericAdapterPlanPart = {
  defaultElement: string;
  discoveryAttribute: string;
  forwardsRef?: boolean;
  initExclusionAttributes?: string[];
  name: string;
  ownsRuntime?: boolean;
  role?: string;
};

export type GenericAdapterPlanProp = Pick<
  PrimitivePropContract,
  "defaultValue" | "kind" | "name" | "required" | "targets" | "type" | "unsupportedTargets"
>;

export type GenericAdapterPlanStaticAttribute = {
  name: string;
  part: string;
  source: "constant" | "prop" | "runtime" | "state";
  value?: string;
};

export type GenericAdapterPlanStateModel = PrimitiveStateModelContract;

export type GenericAdapterPlanSetter = PrimitiveSetterContract;

export type GenericAdapterPlanEvent = PrimitiveEventContract;

export type GenericAdapterPlanForm = PrimitiveFormContract;

export type GenericAdapterPlanFloating = PrimitiveFloatingContract;

export type GenericAdapterPlanAsChild = PrimitiveAsChildContract;

export type GenericAdapterPlanContext = PrimitiveContextContract;

export type GenericAdapterPlanPresence = PrimitivePresenceContract;

export type GenericAdapterPlanRef = {
  part: string;
  public: boolean;
};

export type GenericAdapterPlanExports = {
  defaultNamespace: boolean;
  members: GenericAdapterPlanExportMember[];
  namespace: string;
};

export type GenericAdapterPlanExportMember = {
  file: string;
  name: string;
  part: string;
};

export type GenericAdapterPlanEscapeDeclaration = {
  boundary: string;
  reason: string;
  tests: readonly string[];
};

export type GenericAdapterPlanIssue = {
  component: string;
  message: string;
  path: string;
};

export type GenericAdapterPlanClassification = {
  component: string;
  reason: string;
  strategy: GenericAdapterPlanClassificationStrategy;
};

export type GenericAdapterPlanClassificationStrategy =
  | "specialized-adapter-spec"
  | "custom-island"
  | "adapter-family-plan"
  | "future-framework-tracer";

export type GenericAdapterPlanPrintedFile = {
  contents: string;
  path: string;
};
