import type { AdapterRangeStatusFacts } from "../../framework-adapters/types.js";
/** Static parts stay on the existing fact-driven printers. This policy owns the only extra choices. */
export interface PassivePartPolicy {
  childText: "consumer" | "runtime-unless-children";
  runtimeStyleProperties: readonly string[];
}
export function progressPartPolicy(
  facts: AdapterRangeStatusFacts,
  part: string,
): PassivePartPolicy {
  if (part === "value") return { childText: "runtime-unless-children", runtimeStyleProperties: [] };
  if (part === "indicator") {
    if (facts.parts.indicator.name !== "indicator")
      throw new Error("Progress indicator recipe requires its named part.");
    return { childText: "consumer", runtimeStyleProperties: ["transform"] };
  }
  return { childText: "consumer", runtimeStyleProperties: [] };
}
