import {
  type FutureFrameworkTracerTarget,
  getFutureFrameworkTracerClassifications,
  getFutureFrameworkTracerTarget,
} from "../framework-adapters/future-framework-tracer.js";
import type {
  GenericAdapterPlan,
  GenericAdapterPlanPrintedFile,
} from "./types.js";

export type { FutureFrameworkTracerTarget };

export const genericAdapterFutureFrameworkTracerClassifications =
  getFutureFrameworkTracerClassifications();

export function printFutureFrameworkTracerPlan(
  target: FutureFrameworkTracerTarget,
  plan: GenericAdapterPlan,
): GenericAdapterPlanPrintedFile[] {
  return getFutureFrameworkTracerTarget(target).printGenericAdapterPlan(plan);
}
