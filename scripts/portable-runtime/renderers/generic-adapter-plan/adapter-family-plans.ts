import type { GenericAdapterPlan } from "./types.js";

export type AdapterFamilyPlan = {
  futureFrameworkTracerNotes?: readonly string[];
  id: string;
  matches: (plan: GenericAdapterPlan) => boolean;
};

export type AdapterOutputFamilyPlan<TOutputModel> = AdapterFamilyPlan & {
  buildOutputModel: (plan: GenericAdapterPlan) => TOutputModel;
};

export function selectAdapterFamilyPlan(
  modules: readonly AdapterFamilyPlan[],
  plan: GenericAdapterPlan,
): AdapterFamilyPlan {
  const familyPlan = modules.find((module) => module.matches(plan));

  if (!familyPlan) {
    throw new Error(
      `${plan.displayName} generic adapter plan does not match a structured Adapter Family Plan.`,
    );
  }

  return familyPlan;
}

export function getAdapterFamilyPlanIds(modules: readonly AdapterFamilyPlan[]): string[] {
  return modules.map((module) => module.id);
}
