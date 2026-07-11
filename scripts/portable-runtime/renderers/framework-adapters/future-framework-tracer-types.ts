import type {
  GenericAdapterPlan,
  GenericAdapterPlanClassification,
  GenericAdapterPlanPrintedFile,
} from "../generic-adapter-plan/types.js";
import type { SelectSpecializedAdapterSpec } from "../specialized-adapter-spec/select-specialized-adapter-spec.js";
import type { SpecializedAdapterSpec, SpecializedAdapterSpecPrintedFile } from "../specialized-adapter-spec/types.js";

export type FutureFrameworkTracerTarget = "solid" | "vue";

export type FrameworkAdapterFutureFrameworkTracer = {
  classifications: readonly GenericAdapterPlanClassification[];
  printGenericAdapterPlan(plan: GenericAdapterPlan): GenericAdapterPlanPrintedFile[];
  printSelectSpecializedAdapterSpec(
    spec: SelectSpecializedAdapterSpec,
  ): SpecializedAdapterSpecPrintedFile[];
  printSpecializedAdapterSpec(spec: SpecializedAdapterSpec): SpecializedAdapterSpecPrintedFile[];
};
