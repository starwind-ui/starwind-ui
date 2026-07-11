import type { RuntimeAdapterContract } from "../../contracts/primitive/types.js";
import type {
  GenericAdapterPlan,
  GenericAdapterPlanPrintedFile,
} from "../generic-adapter-plan/index.js";
import type {
  GenericAdapterPlanAsChild,
  GenericAdapterPlanContext,
  GenericAdapterPlanEvent,
  GenericAdapterPlanExports,
  GenericAdapterPlanFile,
  GenericAdapterPlanPart,
  GenericAdapterPlanProp,
  GenericAdapterPlanRef,
  GenericAdapterPlanSetter,
  GenericAdapterPlanStateModel,
} from "../generic-adapter-plan/types.js";

export type SpecializedAdapterSpec = {
  asChild: GenericAdapterPlanAsChild[];
  category: RuntimeAdapterContract["category"];
  component: string;
  context: GenericAdapterPlanContext[];
  displayName: string;
  events: GenericAdapterPlanEvent[];
  exports: GenericAdapterPlanExports;
  files: GenericAdapterPlanFile[];
  parts: GenericAdapterPlanPart[];
  props: GenericAdapterPlanProp[];
  refs: GenericAdapterPlanRef[];
  renderPlan: GenericAdapterPlan;
  root: SpecializedAdapterSpecRoot;
  sourceContract: RuntimeAdapterContract["component"];
  stateModels: GenericAdapterPlanStateModel[];
  setterSync: GenericAdapterPlanSetter[];
};

export type SpecializedAdapterSpecPrintedFile = GenericAdapterPlanPrintedFile;

export type SpecializedAdapterSpecRoot = {
  defaultElement: string;
  discoveryAttribute: string;
  ownsRuntime: true;
  part: string;
  runtimeFactory: string;
  runtimeImportSource: RuntimeAdapterContract["runtime"]["importSource"];
};
