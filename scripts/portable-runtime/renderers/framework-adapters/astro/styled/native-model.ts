import { nativeValuePolicy } from "../../../shared-recipes/passive/native-values.js";
import type {
  StyledOutputComponent,
  StyledOutputRenderNode,
} from "../../../styled-output-model/index.js";

/**
 * A textarea has no value attribute. Its child text is the shown text and the native reset default,
 * and Astro renders once, so the contract's native model becomes that text.
 */
export function applyAstroNativeModel(component: StyledOutputComponent): void {
  const policy = nativeValuePolicy(component.nativeModel);
  if (policy?.writesThrough !== "value-property") return;
  const control = findNativeElement(component.render, policy.tag);
  if (!control) {
    throw new TypeError(`Astro Styled ${component.exportName} requires its native ${policy.tag}.`);
  }
  control.selfClosing = false;
  control.inlineChildren = true;
  control.children = [{ type: "text", value: "{value ?? defaultValue}" }];
}

function findNativeElement(
  nodes: StyledOutputRenderNode[],
  tag: string,
): Extract<StyledOutputRenderNode, { type: "element" }> | undefined {
  for (const node of nodes) {
    if (node.type === "element" && node.tag === tag) return node;
    if ("children" in node && node.children) {
      const nested = findNativeElement(node.children, tag);
      if (nested) return nested;
    }
  }
  return undefined;
}
