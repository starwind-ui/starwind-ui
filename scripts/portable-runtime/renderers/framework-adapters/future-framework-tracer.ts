import type { GenericAdapterPlanClassification } from "../generic-adapter-plan/types.js";
import type {
  FrameworkAdapterFutureFrameworkTracer,
  FutureFrameworkTracerTarget,
} from "./future-framework-tracer-types.js";
import { solidFutureFrameworkTracer } from "./solid/future-framework-tracer.js";
import { vueFutureFrameworkTracer } from "./vue/future-framework-tracer.js";

const futureFrameworkTracerTargetEntries: readonly [
  FutureFrameworkTracerTarget,
  FrameworkAdapterFutureFrameworkTracer,
][] = [
  ["vue", vueFutureFrameworkTracer],
  ["solid", solidFutureFrameworkTracer],
];

const futureFrameworkTracerTargets = new Map(futureFrameworkTracerTargetEntries);

export function getFutureFrameworkTracerTarget(
  target: FutureFrameworkTracerTarget,
): FrameworkAdapterFutureFrameworkTracer {
  const tracer = futureFrameworkTracerTargets.get(target);

  if (!tracer) {
    throw new Error(`Unsupported future Framework Adapter tracer target: ${target}`);
  }

  return tracer;
}

export function getFutureFrameworkTracerClassifications(): readonly GenericAdapterPlanClassification[] {
  return futureFrameworkTracerTargetEntries.flatMap(([, tracer]) => tracer.classifications);
}

export type { FrameworkAdapterFutureFrameworkTracer, FutureFrameworkTracerTarget };
