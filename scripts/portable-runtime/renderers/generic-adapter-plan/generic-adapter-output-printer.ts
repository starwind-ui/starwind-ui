import { printAdapterOutput } from "../framework-adapters/conformance.js";
import type { AdapterOutputModel, FrameworkAdapter } from "../framework-adapters/types.js";
import type { GenericAdapterPlanPrintedFile } from "./types.js";

export function printGenericAdapterOutputModel(
  adapter: FrameworkAdapter,
  model: AdapterOutputModel,
): GenericAdapterPlanPrintedFile[] {
  return printAdapterOutput(adapter, model);
}
