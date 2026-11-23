import { createTsHeader } from "../../shared.js";

/**
 * The one child resolver that the Vue asChild helpers share. It stays small because the
 * native-control helper ships it to Dialog, AlertDialog, Drawer, and Select consumers.
 */
export function renderVueAsChildTargetHelper(generatedBy: string): string {
  return `${createTsHeader(generatedBy)}import { Comment, Fragment, isVNode, type VNode } from "vue";

/** A v-if that renders nothing leaves a Comment. It is not a second child. */
function withoutEmptyBranches(children: readonly unknown[]): readonly unknown[] {
  return children.filter((child) => !isVNode(child) || child.type !== Comment);
}

/**
 * Returns the one native element or component VNode that asChild composes.
 * Empty v-if comments and one Fragment boundary are allowed, as ADR 0011 says.
 */
export function resolveVueAsChildTarget(name: string, children: readonly unknown[]): VNode {
  let rendered = withoutEmptyBranches(children);
  const boundary = rendered[0];
  if (rendered.length === 1 && isVNode(boundary) && boundary.type === Fragment) {
    rendered = withoutEmptyBranches(Array.isArray(boundary.children) ? boundary.children : []);
  }
  const child = rendered[0];
  // Comment, Text, and Fragment VNodes have symbol types.
  if (rendered.length !== 1 || !isVNode(child) || typeof child.type === "symbol") {
    throw new TypeError(\`\${name} asChild requires exactly one native element or component VNode.\`);
  }
  return child;
}
`;
}
