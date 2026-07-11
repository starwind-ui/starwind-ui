import {
  getPrimitiveFrameworkAdapterTargetNames,
  getPrimitiveFrameworkAdapterTargetsWithOutputModelCapability,
} from "../framework-adapters/target-registry.js";
import type { AdapterOutputModel } from "../framework-adapters/types.js";
import {
  type AdapterOutputFamilyPlan,
  getAdapterFamilyPlanIds,
} from "./adapter-family-plans.js";
import { actionSurfaceAdapterFamilyPlan } from "./families/action-surface.js";
import { booleanFormControlAdapterFamilyPlan } from "./families/boolean-form-control.js";
import { disclosurePresenceAdapterFamilyPlan } from "./families/disclosure-presence.js";
import { formFieldCoordinatorAdapterFamilyPlan } from "./families/form-field-coordinator.js";
import { createGroupedValueControlAdapterFamilyPlan } from "./families/grouped-value-control.js";
import { mediaStatusAdapterFamilyPlan } from "./families/media-status.js";
import { nativeDisabledAdapterFamilyPlan } from "./families/native-disabled.js";
import { nativeInputValueAdapterFamilyPlan } from "./families/native-input-value.js";
import { nativeOverlayAdapterFamilyPlan } from "./families/native-overlay.js";
import { presenceFloatingOverlayAdapterFamilyPlan } from "./families/presence-floating-overlay.js";
import { rangeStatusAdapterFamilyPlan } from "./families/range-status.js";
import { singleBooleanControlAdapterFamilyPlan } from "./families/single-boolean-control.js";
import { viewportMeasurementAdapterFamilyPlan } from "./families/viewport-measurement.js";
import type { GenericAdapterPlan } from "./types.js";

export const GENERIC_ADAPTER_OUTPUT_MODEL_COMPONENTS = [
  "alert-dialog",
  "avatar",
  "button",
  "checkbox-group",
  "collapsible",
  "checkbox",
  "dialog",
  "drawer",
  "fieldset",
  "form",
  "input",
  "popover",
  "progress",
  "radio",
  "radio-group",
  "scroll-area",
  "switch",
  "toggle",
  "toggle-group",
] as const;

const groupedValueControlAdapterFamilyPlan = createGroupedValueControlAdapterFamilyPlan({
  contextHelperTargets: getPrimitiveFrameworkAdapterTargetsWithOutputModelCapability(
    "groupedValueControlContextHelper",
  ).map(({ capability, target }) => ({
    fileExtension: capability.fileExtension,
    target,
  })),
  targetNames: getPrimitiveFrameworkAdapterTargetNames(),
});

const GENERIC_ADAPTER_OUTPUT_FAMILY_MODULES = [
  actionSurfaceAdapterFamilyPlan,
  disclosurePresenceAdapterFamilyPlan,
  singleBooleanControlAdapterFamilyPlan,
  booleanFormControlAdapterFamilyPlan,
  groupedValueControlAdapterFamilyPlan,
  formFieldCoordinatorAdapterFamilyPlan,
  mediaStatusAdapterFamilyPlan,
  rangeStatusAdapterFamilyPlan,
  nativeDisabledAdapterFamilyPlan,
  nativeInputValueAdapterFamilyPlan,
  viewportMeasurementAdapterFamilyPlan,
  nativeOverlayAdapterFamilyPlan,
  presenceFloatingOverlayAdapterFamilyPlan,
] satisfies readonly AdapterOutputFamilyPlan<AdapterOutputModel>[];

export function buildGenericAdapterOutputModel(plan: GenericAdapterPlan): AdapterOutputModel {
  return selectGenericAdapterOutputFamilyPlan(plan).buildOutputModel(plan);
}

export function getGenericAdapterOutputFamilyPlanIds(): string[] {
  return getAdapterFamilyPlanIds(GENERIC_ADAPTER_OUTPUT_FAMILY_MODULES);
}

export function getGenericAdapterOutputFamilyPlanId(plan: GenericAdapterPlan): string {
  return selectGenericAdapterOutputFamilyPlan(plan).id;
}

function selectGenericAdapterOutputFamilyPlan(
  plan: GenericAdapterPlan,
): AdapterOutputFamilyPlan<AdapterOutputModel> {
  const familyPlan = GENERIC_ADAPTER_OUTPUT_FAMILY_MODULES.find((module) => module.matches(plan));
  if (familyPlan) return familyPlan;

  throw new Error(
    `${plan.displayName} generic adapter plan does not match a structured Adapter Output Model family.`,
  );
}
