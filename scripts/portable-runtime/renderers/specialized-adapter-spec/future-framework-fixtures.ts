import {
  type FutureFrameworkTracerTarget,
  getFutureFrameworkTracerTarget,
} from "../framework-adapters/future-framework-tracer.js";
import type { SelectSpecializedAdapterSpec } from "./select-specialized-adapter-spec.js";
import type { SpecializedAdapterSpec, SpecializedAdapterSpecPrintedFile } from "./types.js";

export function printFutureSpecializedAdapterSpecFixture(
  target: FutureFrameworkTracerTarget,
  spec: SpecializedAdapterSpec,
): SpecializedAdapterSpecPrintedFile[] {
  return getFutureFrameworkTracerTarget(target).printSpecializedAdapterSpec(spec);
}

export function printFutureSelectSpecializedAdapterSpecFixture(
  target: FutureFrameworkTracerTarget,
  spec: SelectSpecializedAdapterSpec,
): SpecializedAdapterSpecPrintedFile[] {
  return getFutureFrameworkTracerTarget(target).printSelectSpecializedAdapterSpec(spec);
}
