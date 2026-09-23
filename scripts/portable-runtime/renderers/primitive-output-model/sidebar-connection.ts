import type { AdapterSidebarFacts } from "../framework-adapters/types.js";
import type {
  StyledOutputComponentGroup,
  StyledOutputRenderNode,
} from "../styled-output-model/index.js";

export function assertSidebarConnection(facts: AdapterSidebarFacts): void {
  if (
    facts.connection?.contextState !== "controller-readback" ||
    facts.connection?.mobileSheetOwner !== "nearest-provider" ||
    facts.connection?.mobileSheetState !== "accepted-after-dispatch"
  ) {
    throw new TypeError(
      "Sidebar projection requires restored context and accepted nearest-provider Sheet state.",
    );
  }
}

export function assertStyledSidebarConnection(group: StyledOutputComponentGroup): void {
  if (group.component !== "sidebar") return;
  let ownedSheet = false;
  function visit(nodes: StyledOutputRenderNode[]): void {
    for (const node of nodes) {
      if (node.type === "component" && node.component === "sheet" && node.exportName === "Sheet") {
        ownedSheet = node.attrs.some(
          (attr) =>
            attr.name === "data-sidebar" &&
            attr.value?.type === "literal" &&
            attr.value.value === "mobile",
        );
      }
      if ("children" in node) visit(node.children);
      if (node.type === "condition") {
        visit(node.then);
        visit(node.else);
      }
      if (node.type === "slot") visit(node.fallback);
    }
  }
  visit(group.components.find((component) => component.exportName === "Sidebar")?.render ?? []);
  if (!ownedSheet)
    throw new TypeError("Styled Sidebar requires its owned mobile Sheet bridge marker.");
}
