import type { AdapterFormControlCompositionFacts } from "../../../framework-adapters/types.js";
import { disposeDocumentOwner } from "./form-policy.js";

export interface FieldProjection {
  read(name: string): string;
  observe(name: string, body: string): string;
}
/** Constructor inputs and subsequent commands use the same contract-owned state list. */
export function fieldOptions(
  facts: AdapterFormControlCompositionFacts,
  projection: Pick<FieldProjection, "read">,
): string {
  return `{ ${Object.values(facts.rootState)
    .map(({ prop }) => `${prop.name}: ${projection.read(prop.name)}`)
    .join(", ")} }`;
}
export function fieldSynchronizations(
  facts: AdapterFormControlCompositionFacts,
  projection: FieldProjection,
  current: string,
): string {
  return Object.values(facts.rootState)
    .map(({ prop, setter }) =>
      projection.observe(prop.name, `${current}?.${setter}(${projection.read(prop.name)});`),
    )
    .join("\n");
}
export function connectField(
  facts: AdapterFormControlCompositionFacts,
  projection: Pick<FieldProjection, "read">,
  element: string,
  current: string,
  captured: string,
  declare = true,
): string {
  return `${declare ? "const " : ""}${captured} = ${facts.runtime.factory}(${element}, ${fieldOptions(facts, projection)});\n${current} = ${captured};`;
}
export type FieldOwner =
  | { kind: "local" }
  | {
      kind: "form-context";
      owner: string;
      defer(body: string): string;
    };
/** Svelte's explicit Form context owns discovery/destruction; native lifecycle targets own their connection directly. */
export function prepareFieldOwner(owner: FieldOwner): string {
  return owner.kind === "local" ? "" : `${owner.owner}?.refresh();`;
}
export function disconnectField(current: string, captured: string, owner: FieldOwner): string {
  if (owner.kind === "local") return disposeDocumentOwner(current, captured);
  return `if (${current} === ${captured}) ${current} = undefined;\nif (${owner.owner}) ${owner.defer(`${owner.owner}.refresh();`)}\nelse ${captured}?.destroy();`;
}
/** Parts notify their Field when their native node enters or leaves the document. */
export function fieldPartConnection(refresh: string): string {
  return `${refresh}?.(); return () => ${refresh}?.();`;
}
/** Match values are booleans or validity tokens; native discovery reads their string representation. */
export function fieldMatch(value: string): string {
  return `String(${value})`;
}

export interface FieldReadinessProjection {
  afterDescendants(body: string): string;
  cancelPending: string;
  ready(element: string): string;
}
/** Refresh the Form first, acquire its idempotent Field connection, then expose readiness. */
export function requestFieldConnection(
  projection: FieldReadinessProjection,
  owner: FieldOwner,
  connection: string,
  element: string,
): string {
  return projection.afterDescendants(
    `${prepareFieldOwner(owner)}\n${connection}\n${projection.ready(element)}`,
  );
}
/** Cancel pending attachment and withdraw readiness before releasing the controller owner. */
export function releaseFieldConnection(
  projection: FieldReadinessProjection,
  current: string,
  captured: string,
  owner: FieldOwner,
): string {
  return `${projection.cancelPending}\n${projection.ready("null")}\n${disconnectField(current, captured, owner)}`;
}
