import type { RuntimeAdapterContract } from "../../contracts/primitive/types.js";
import { buildGenericAdapterPlan } from "../generic-adapter-plan/generic-adapter-plan-builder.js";
import type {
  GenericAdapterPlan,
  GenericAdapterPlanPart,
} from "../generic-adapter-plan/types.js";
import { validateGenericAdapterPlan } from "../generic-adapter-plan/validation.js";
import type { SpecializedAdapterSpec } from "./types.js";

const RUNTIME_BEHAVIOR_FIELD_NAMES = new Set([
  "behavior",
  "collectionNavigation",
  "collectionRegistration",
  "filtering",
  "floatingCalculation",
  "floatingCalculations",
  "floatingUpdates",
  "focusManagement",
  "hiddenInputSync",
  "itemExtraction",
  "keyboardNavigation",
  "itemTextExtraction",
  "itemResolution",
  "measurement",
  "mutationObserver",
  "notificationScheduling",
  "pointerMath",
  "runtimeBehavior",
  "runtimeOwnedBehavior",
  "timers",
  "timerLifecycle",
  "typeahead",
  "validationBehavior",
  "viewportMeasurement",
]);

export function buildBaseSpecializedAdapterSpec(
  contract: RuntimeAdapterContract,
): SpecializedAdapterSpec {
  const renderPlan = buildGenericAdapterPlan(contract);
  const rootPart = renderPlan.parts.find((part) => part.name === renderPlan.runtime.rootPart);

  if (!rootPart) {
    throw new Error(
      `${renderPlan.displayName} specialized adapter spec is missing runtime root part "${renderPlan.runtime.rootPart}".`,
    );
  }

  if (rootPart.ownsRuntime !== true) {
    throw new Error(
      `${renderPlan.displayName} specialized adapter spec root part "${rootPart.name}" must own Runtime initialization.`,
    );
  }

  return {
    asChild:
      renderPlan.asChild?.map((asChild) => ({ ...asChild, merges: [...asChild.merges] })) ?? [],
    category: renderPlan.category,
    component: renderPlan.component,
    context:
      renderPlan.context?.map((context) => ({
        ...context,
        values: [...context.values],
      })) ?? [],
    displayName: renderPlan.displayName,
    events: renderPlan.events.map((event) => ({ ...event })),
    exports: {
      ...renderPlan.exports,
      members: renderPlan.exports.members.map((member) => ({ ...member })),
    },
    files: renderPlan.files.map((file) => ({ ...file })),
    parts: renderPlan.parts.map((part) => ({ ...part })),
    props: renderPlan.props.map((prop) => ({ ...prop })),
    refs: renderPlan.refs.map((ref) => ({ ...ref })),
    renderPlan,
    root: {
      defaultElement: rootPart.defaultElement,
      discoveryAttribute: rootPart.discoveryAttribute,
      ownsRuntime: true,
      part: rootPart.name,
      runtimeFactory: renderPlan.runtime.factory,
      runtimeImportSource: renderPlan.runtime.importSource,
    },
    sourceContract: renderPlan.sourceContract,
    stateModels: renderPlan.stateModels.map((stateModel) => ({ ...stateModel })),
    setterSync: renderPlan.setters.map((setter) => ({ ...setter })),
  };
}

export function validateSpecializedAdapterSpec(spec: unknown): string[] {
  if (!isRecord(spec)) {
    return ["Specialized adapter spec must be an object."];
  }

  const displayName = typeof spec.displayName === "string" ? spec.displayName : "Unknown";
  const errors: string[] = [];

  collectRuntimeBehaviorFieldErrors(spec, [displayName], errors);

  if (!isRecord(spec.root)) {
    errors.push(`${displayName} specialized adapter spec is missing a root recipe.`);
  } else if (spec.root.ownsRuntime !== true) {
    errors.push(
      `${displayName} specialized adapter spec root recipe must own Runtime initialization.`,
    );
  }

  if (!isRecord(spec.renderPlan)) {
    errors.push(
      `${displayName} specialized adapter spec is missing its generic adapter plan bridge.`,
    );
    return errors;
  }

  if (isRecord(spec.root)) {
    errors.push(...validateRootRecipe(displayName, spec.root, spec.renderPlan));
  }

  return [
    ...errors,
    ...validateGenericAdapterPlan(spec.renderPlan as unknown as GenericAdapterPlan).map(
      (issue) => `${issue.path}: ${issue.message}`,
    ),
  ];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function collectRuntimeBehaviorFieldErrors(value: unknown, path: string[], errors: string[]): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      collectRuntimeBehaviorFieldErrors(item, [...path, String(index)], errors);
    });
    return;
  }

  if (!isRecord(value)) return;

  Object.entries(value).forEach(([key, child]) => {
    const nextPath = [...path, key];
    if (RUNTIME_BEHAVIOR_FIELD_NAMES.has(key)) {
      errors.push(
        `${path[0]} specialized adapter spec must not declare ${formatValidationPath(nextPath)}; keep Runtime-owned behavior in Runtime controllers.`,
      );
    }

    collectRuntimeBehaviorFieldErrors(child, nextPath, errors);
  });
}

function validateRootRecipe(
  displayName: string,
  root: Record<string, unknown>,
  renderPlanValue: Record<string, unknown>,
): string[] {
  const errors: string[] = [];
  const renderPlan = renderPlanValue as unknown as GenericAdapterPlan;
  const rootPartName = isRecord(renderPlan.runtime) ? renderPlan.runtime.rootPart : undefined;
  const rootPart =
    typeof rootPartName === "string" && Array.isArray(renderPlan.parts)
      ? renderPlan.parts.find(
          (part): part is GenericAdapterPlanPart => isRecord(part) && part.name === rootPartName,
        )
      : undefined;

  if (typeof rootPartName !== "string" || !rootPart) {
    errors.push(
      `${displayName} specialized adapter spec cannot resolve the generic adapter plan root part.`,
    );
    return errors;
  }

  if (root.part !== rootPart.name) {
    errors.push(
      `${displayName} specialized adapter spec root part "${String(root.part)}" must match generic adapter plan root part "${rootPart.name}".`,
    );
  }

  if (root.defaultElement !== rootPart.defaultElement) {
    errors.push(
      `${displayName} specialized adapter spec root defaultElement "${String(root.defaultElement)}" must match generic adapter plan root defaultElement "${rootPart.defaultElement}".`,
    );
  }

  if (root.discoveryAttribute !== rootPart.discoveryAttribute) {
    errors.push(
      `${displayName} specialized adapter spec root discoveryAttribute "${String(root.discoveryAttribute)}" must match generic adapter plan root discoveryAttribute "${rootPart.discoveryAttribute}".`,
    );
  }

  if (root.runtimeFactory !== renderPlan.runtime.factory) {
    errors.push(
      `${displayName} specialized adapter spec root runtimeFactory "${String(root.runtimeFactory)}" must match generic adapter plan runtime factory "${renderPlan.runtime.factory}".`,
    );
  }

  if (root.runtimeImportSource !== renderPlan.runtime.importSource) {
    errors.push(
      `${displayName} specialized adapter spec root runtimeImportSource "${String(root.runtimeImportSource)}" must match generic adapter plan runtime import "${renderPlan.runtime.importSource}".`,
    );
  }

  return errors;
}

function formatValidationPath(path: string[]): string {
  return path.slice(1).join(".");
}
