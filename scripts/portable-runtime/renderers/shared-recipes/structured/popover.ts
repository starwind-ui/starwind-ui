import { readFileSync } from "node:fs";
import { connectionType, emitLifecycle } from "./emit.js";
import { operations, type Target } from "./operations.js";
import { type PopoverPlan, popoverPlan } from "./plan.js";
import {
  authoredPlacementStorage,
  connectPopoverSurface,
  popoverSurfacePolicy,
} from "./popover-surface.js";

export function renderRoot(target: Target, plan: PopoverPlan = popoverPlan): string {
  const template = readFileSync(
    new URL(`../../framework-adapters/${target}/popover-root.txt`, import.meta.url),
    "utf8",
  );
  return template
    .replace(
      "__ACCEPTED_CELL__",
      operations[target].acceptedCell(
        plan.model.name,
        "",
        target === "react"
          ? "open ?? defaultOpen"
          : target === "vue"
            ? "initialDefaultOpen"
            : "initialModel ?? initialDefaultOpen",
      ),
    )
    .replace(
      "__CONTROLLER_CELL__",
      operations[target].controllerCell(
        connectionType,
        target === "react"
          ? "open ?? defaultOpen"
          : target === "vue"
            ? "props.open ?? initialDefaultOpen"
            : "initialModel ?? initialDefaultOpen",
      ),
    )
    .replace("__LIFECYCLE__", emitLifecycle(plan, operations[target]))
    .replace("__AUTHORED_PLACEMENT__", authoredPlacementStorage(target, popoverSurfacePolicy))
    .replace("__CONNECT_SURFACE__", connectPopoverSurface(target, popoverSurfacePolicy))
    .replace("__OBSERVE_MODEL__", operations[target].observeModel(plan.model.name))
    .replace(
      "__CONSTRUCTOR_INPUTS__",
      plan.constructorInputs
        .map((name) => (target === "vue" ? `() => props.${name}` : name))
        .join(", "),
    )
    .replace(/^[\t ]+$/gm, "");
}
