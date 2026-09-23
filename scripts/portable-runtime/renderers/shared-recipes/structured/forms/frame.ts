import { formProjection } from "../../../framework-adapters/form-control-frame.js";
import * as react from "../../../framework-adapters/react/form-control-root.js";
import * as svelte from "../../../framework-adapters/svelte/form-control-root.js";
import * as vue from "../../../framework-adapters/vue/form-control-root.js";
import type { Target } from "../operations.js";
import { connectionType, formLifecycle } from "./lifecycle.js";
import type { FormControlPlan } from "./plan.js";

const targets = { react, vue, svelte };
export function printFormRoot(target: Target, plan: FormControlPlan): string {
  const adapter = targets[target];
  const operations = adapter.formOperations(plan);
  return adapter.printFormProjection(
    formProjection(
      target,
      plan,
      operations,
      formLifecycle(plan, operations),
      connectionType(plan, operations),
    ),
  );
}
