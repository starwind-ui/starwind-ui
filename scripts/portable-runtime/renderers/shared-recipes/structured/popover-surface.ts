import { operations, type Target } from "./operations.js";

export type SurfacePolicy = {
  requiredParts: readonly string[];
  connect: readonly ("stage-authored-placement" | "connect-runtime")[];
};

/** Capture mounted logical parts and stage current authored placement before Runtime open effects. Trigger is optional. */
export const popoverSurfacePolicy = {
  requiredParts: ["[data-sw-popover-popup]"],
  connect: ["stage-authored-placement", "connect-runtime"],
} as const;

/** DOM input storage is emitted once per Root; target operations supply stable cells/context. */
export function authoredPlacementStorage(target: Target, policy: SurfacePolicy): string {
  const type = "Map<HTMLElement, Record<string, string>>";
  const present = policy.requiredParts
    .map(
      (selector) =>
        `[...authoredPlacement.keys()].some(element => element.isConnected && element.matches('${selector}'))`,
    )
    .join(" && ");
  return `const authoredPlacement = ${operations[target].stableValue(`new ${type}()`)};
${present ? `function hasRequiredSurface(): boolean { return ${present}; }` : ""}
function registerPlacement(element: HTMLElement, attributes: Record<string, string> | null): void {
  if (attributes) authoredPlacement.set(element, attributes);
  else authoredPlacement.delete(element);
  ${target === "svelte" && present ? "surfaceReady = hasRequiredSurface();" : ""}
}`;
}

/** The recipe orders work inside the target's fixed physical capture window. */
export function connectPopoverSurface(target: Target, policy: SurfacePolicy): string {
  const prepare =
    target === "svelte"
      ? "const restorers = [...portals.values()].map(({ prepare }) => prepare?.());"
      : "";
  const restore =
    target === "svelte" ? "for (const restore of restorers.reverse()) restore?.();" : "";
  const body = policy.connect
    .flatMap((step) => {
      if (step === "stage-authored-placement")
        return [
          "for (const [element, attributes] of authoredPlacement) { for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value); }",
        ];
      if (step === "connect-runtime") return ["connectRuntime(root);"];
      return [];
    })
    .join("\n");
  return `function connectSurface(root: HTMLDivElement): void {
    ${policy.requiredParts.length ? "if (!hasRequiredSurface()) { disconnectRuntime(); return; }" : ""}
    ${prepare}
    ${restore ? `try { ${body} } finally { ${restore} }` : body}

  }`;
}
