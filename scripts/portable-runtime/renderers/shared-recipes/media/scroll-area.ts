import type { AdapterViewportMeasurementFacts } from "../../framework-adapters/types.js";

/** Runtime owns measurement and later tabindex writes. Adapters normalize authored thresholds. */
export const scrollAreaRecipe = {
  minimumThreshold: 0,
  edges: ["xEnd", "xStart", "yEnd", "yStart"],
  viewport: { initialTabIndex: -1, overflow: "scroll" },
} as const;

export function scrollAreaThresholds(
  facts: AdapterViewportMeasurementFacts,
  minimum = scrollAreaRecipe.minimumThreshold as number,
): string {
  const { typeName, attributesTypeName, helperName, normalizeHelperName } = facts.threshold;
  return `type ${attributesTypeName} = { shared?: number; ${scrollAreaRecipe.edges.map((edge) => `${edge}?: number;`).join(" ")} };
function ${helperName}(threshold: ${typeName} | undefined): ${attributesTypeName} {
  if (typeof threshold === "number") {
    const shared = ${normalizeHelperName}(threshold);
    return shared === undefined ? {} : { shared };
  }
  if (!threshold) return {};
  return {
    ${scrollAreaRecipe.edges.map((edge) => `${edge}: ${normalizeHelperName}(threshold.${edge}),`).join("\n    ")}
  };
}
function ${normalizeHelperName}(value: number | undefined): number | undefined {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  return Math.max(value, ${minimum});
}`;
}
