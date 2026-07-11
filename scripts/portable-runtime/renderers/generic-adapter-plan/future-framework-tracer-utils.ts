import type { GenericAdapterPlan, GenericAdapterPlanPart } from "./types.js";

export function getRootPart(plan: GenericAdapterPlan): GenericAdapterPlanPart {
  return getPart(plan, plan.runtime.rootPart);
}

export function getPart(plan: GenericAdapterPlan, partName: string): GenericAdapterPlanPart {
  const part = plan.parts.find((candidate) => candidate.name === partName);
  if (!part) {
    throw new Error(`${plan.displayName} future-framework tracer is missing ${partName} part.`);
  }

  return part;
}

export function getPlanPropDefault(plan: GenericAdapterPlan, name: string): string {
  const prop = plan.props.find((candidate) => candidate.name === name);
  if (!prop?.defaultValue) {
    throw new Error(`${plan.displayName} future-framework tracer is missing ${name} default.`);
  }

  return prop.defaultValue;
}

export function getStateModel(plan: GenericAdapterPlan, name: string) {
  const stateModel = plan.stateModels.find((candidate) => candidate.name === name);
  if (!stateModel) {
    throw new Error(`${plan.displayName} future-framework tracer is missing ${name} state model.`);
  }

  return stateModel;
}

export function getEvent(plan: GenericAdapterPlan, name: string) {
  const event = plan.events.find((candidate) => candidate.name === name);
  if (!event) {
    throw new Error(`${plan.displayName} future-framework tracer is missing ${name} event.`);
  }

  return event;
}

export function getStateSetter(plan: GenericAdapterPlan, stateModel: string) {
  const setter = plan.setters.find(
    (candidate) => "stateModel" in candidate && candidate.stateModel === stateModel,
  );
  if (!setter || !("stateModel" in setter)) {
    throw new Error(`${plan.displayName} future-framework tracer is missing ${stateModel} setter.`);
  }

  return setter;
}

export function formatOptions(
  options: Readonly<Record<string, boolean | number | string>> | undefined,
) {
  if (!options) return "{}";

  const entries = Object.entries(options).map(([key, value]) => {
    if (typeof value === "string") return `${key}: ${JSON.stringify(value)}`;
    return `${key}: ${String(value)}`;
  });

  return `{ ${entries.join(", ")} }`;
}

export function getRequiredValue(value: string | undefined, message: string): string {
  if (value === undefined) {
    throw new Error(message);
  }

  return value;
}
