import type { FrameworkOperations } from "../structured/operations.js";
/** React schedules render state; Vue and Svelte keep a cached reactive cell. */
export interface AcceptedRenderOperations {
  fw: FrameworkOperations;
  acceptedRenderMode: "uncontrolled-render" | "cached-cell";
}
/** The recipe owns eligibility; targets only supply the cell assignment. */
export function renderAcceptedState(
  ops: AcceptedRenderOperations,
  name: string,
  next: string,
  group?: string,
): string {
  const write = ops.fw.renderAccepted(name, next);
  if (ops.acceptedRenderMode === "cached-cell") return write;
  const eligible = `${group ? group + "===undefined&&" : ""}${ops.fw.readInput(name)}===undefined`;
  return `if(${eligible})${write}`;
}
