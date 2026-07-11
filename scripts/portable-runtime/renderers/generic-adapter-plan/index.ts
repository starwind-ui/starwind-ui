export {
  classifyGenericAdapterPlanContract,
  classifyGenericAdapterPlanInventory,
  renderGenericAdapterPlanCoverageReport,
  validateGenericAdapterPlanCoverageManifest,
} from "./classification.js";
export {
  genericAdapterFutureFrameworkTracerClassifications,
  printFutureFrameworkTracerPlan,
} from "./future-framework-tracer-printers.js";
export {
  buildGenericAdapterOutputModel,
  GENERIC_ADAPTER_OUTPUT_MODEL_COMPONENTS,
  getGenericAdapterOutputFamilyPlanId,
  getGenericAdapterOutputFamilyPlanIds,
} from "./generic-adapter-output-model.js";
export { printGenericAdapterOutputModel } from "./generic-adapter-output-printer.js";
export { buildGenericAdapterPlan } from "./generic-adapter-plan-builder.js";
export type {
  GenericAdapterPlan,
  GenericAdapterPlanClassification,
  GenericAdapterPlanClassificationStrategy,
  GenericAdapterPlanEscapeDeclaration,
  GenericAdapterPlanExportMember,
  GenericAdapterPlanExports,
  GenericAdapterPlanFile,
  GenericAdapterPlanIssue,
  GenericAdapterPlanPart,
  GenericAdapterPlanPrintedFile,
  GenericAdapterPlanRef,
  GenericAdapterPlanStaticAttribute,
} from "./types.js";
export { validateGenericAdapterPlan } from "./validation.js";
