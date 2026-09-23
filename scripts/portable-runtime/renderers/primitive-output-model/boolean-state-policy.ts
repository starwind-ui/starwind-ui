import type { AdapterBooleanFormControlFacts } from "../framework-adapters/types.js";

/** Verify the state facts consumed by reactive boolean projections. Radio has its own policy. */
export function assertBooleanStatePolicy(facts: AdapterBooleanFormControlFacts): void {
  if (facts.input.type === "checkbox" && facts.behavior.resetBaseline !== "mount") {
    throw new TypeError(`${facts.displayName} projection requires the mount reset baseline.`);
  }
  if (
    facts.behavior.groupStrategy === "array-includes" &&
    facts.behavior.groupStateOwnership !== "group-membership"
  ) {
    throw new TypeError(
      `${facts.displayName} projection requires group-membership state ownership.`,
    );
  }
}
