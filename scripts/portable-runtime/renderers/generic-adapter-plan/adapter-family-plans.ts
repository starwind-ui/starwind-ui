import type { GenericAdapterPlan } from "./types.js";

export type AdapterFamilyPlan = {
  futureFrameworkTracerNotes?: readonly string[];
  id: string;
  matches: (plan: GenericAdapterPlan) => boolean;
};

export type AdapterOutputFamilyPlan<TOutputModel> = AdapterFamilyPlan & {
  buildOutputModel: (plan: GenericAdapterPlan) => TOutputModel;
};

export function getAdapterFamilyPlanIds(modules: readonly AdapterFamilyPlan[]): string[] {
  return modules.map((module) => module.id);
}
