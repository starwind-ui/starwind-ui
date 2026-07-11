import type {
  StyledOutputAttribute,
  StyledOutputComment,
  StyledOutputConditionNode,
  StyledOutputElementNode,
  StyledOutputRenderNode,
  StyledOutputRepeatNode,
  StyledOutputSlotNode,
  StyledOutputValueExpression,
} from '../../../styled-output-model/index.js';
import { getComponentReferenceName } from './component-discovery.js';
import { REACT_FRAMEWORK } from './constants.js';
import {
  escapeTemplateText,
  formatObjectKey,
  indent,
  isForFramework,
  isIdentifier,
  mapReactAttributeName,
  toReactSlotPropName,
} from './formatting.js';
import { getPrimitiveAliasForNode } from './primitive-helpers.js';

export function renderReturn(
  nodes: StyledOutputRenderNode[],
  primitiveAliases: Record<string, string>,
): string {
  if (nodes.length === 1 && nodes[0].type === "condition") {
    return renderConditionalReturn(nodes[0], primitiveAliases);
  }

  if (nodes.length === 1) {
    return `return (
${renderNode(nodes[0], 1, primitiveAliases)}
);`;
  }

  return `return (
  <>
${renderNodes(nodes, 2, primitiveAliases)}
  </>
);`;
}

function renderConditionalReturn(
  node: StyledOutputConditionNode,
  primitiveAliases: Record<string, string>,
): string {
  return `if (${node.condition}) {
  return ${renderReturnExpression(node.then, primitiveAliases, 2, 1)};
}

return ${renderReturnExpression(node.else, primitiveAliases)};`;
}

function renderReturnExpression(
  nodes: StyledOutputRenderNode[],
  primitiveAliases: Record<string, string>,
  nodeLevel = 1,
  closingLevel = 0,
): string {
  if (nodes.length === 0) return "null";

  if (nodes.length === 1) {
    const [node] = nodes;

    if (node.type === "slot" && !node.name && (!node.fallback || node.fallback.length === 0)) {
      return "children";
    }

    return `(
${renderNode(node, nodeLevel, primitiveAliases)}
${indent(closingLevel)})`;
  }

  return `(
${indent(nodeLevel)}<>
${renderNodes(nodes, nodeLevel + 1, primitiveAliases)}
${indent(nodeLevel)}</>
${indent(closingLevel)})`;
}

export function renderNodes(
  nodes: StyledOutputRenderNode[],
  level: number,
  primitiveAliases: Record<string, string>,
): string {
  return nodes.map((node) => renderNode(node, level, primitiveAliases)).join("\n\n");
}

function renderNode(
  node: StyledOutputRenderNode,
  level: number,
  primitiveAliases: Record<string, string>,
): string {
  switch (node.type) {
    case "component":
      return renderTag(
        getComponentReferenceName(node),
        node.attrs ?? [],
        node.children ?? [],
        Boolean(node.selfClosing),
        level,
        primitiveAliases,
      );
    case "condition":
      return renderConditionalNode(node, level, primitiveAliases);
    case "element":
      return renderElementNode(node, level, primitiveAliases);
    case "fragment":
      return `${indent(level)}<>
${renderNodes(node.children, level + 1, primitiveAliases)}
${indent(level)}</>`;
    case "icon":
      return renderTag(node.importName, node.attrs ?? [], [], true, level, primitiveAliases);
    case "primitive":
      return renderTag(
        `${getPrimitiveAliasForNode(node, primitiveAliases)}.${node.part}`,
        node.attrs ?? [],
        node.children ?? [],
        Boolean(node.selfClosing),
        level,
        primitiveAliases,
      );
    case "repeat":
      return renderRepeatNode(node, level, primitiveAliases);
    case "slot":
      return renderSlot(node, level, primitiveAliases);
    case "text":
      return `${indent(level)}${node.value}`;
  }
}

function renderRepeatNode(
  node: StyledOutputRepeatNode,
  level: number,
  primitiveAliases: Record<string, string>,
): string {
  const indexParameter = node.index ? `, ${node.index}` : "";

  return `${indent(level)}{${node.each}.map((${node.item}${indexParameter}) => (
${renderNodes(node.children, level + 1, primitiveAliases)}
${indent(level)}))}`;
}

function renderConditionalNode(
  node: StyledOutputConditionNode,
  level: number,
  primitiveAliases: Record<string, string>,
): string {
  if (node.else.length === 0) {
    return `${indent(level)}{${node.condition} && ${renderFallbackExpression(
      node.then,
      primitiveAliases,
      level,
    )}}`;
  }

  return `${indent(level)}{${node.condition} ? ${renderFallbackExpression(
    node.then,
    primitiveAliases,
    level,
  )} : ${renderFallbackExpression(node.else, primitiveAliases, level)}}`;
}

function renderElementNode(
  node: StyledOutputElementNode,
  level: number,
  primitiveAliases: Record<string, string>,
): string {
  const comments = renderLeadingComments(node.comments, level);
  const tag = renderTag(
    node.tag,
    node.attrs ?? [],
    node.children ?? [],
    Boolean(node.selfClosing),
    level,
    primitiveAliases,
  );

  return [comments, tag].filter(Boolean).join("\n");
}

function renderLeadingComments(
  comments: StyledOutputComment[],
  level: number,
): string {
  return comments
    .filter((comment) => isForFramework(comment, REACT_FRAMEWORK))
    .map((comment) => `${indent(level)}{/* ${comment.value} */}`)
    .join("\n");
}

function renderTag(
  tag: string,
  attrs: StyledOutputAttribute[],
  children: StyledOutputRenderNode[],
  selfClosing: boolean,
  level: number,
  primitiveAliases: Record<string, string>,
): string {
  const renderedAttrs = attrs.filter((attr) => isForFramework(attr, REACT_FRAMEWORK));

  if (canRenderInlineTextTag(renderedAttrs, children, selfClosing)) {
    return `${indent(level)}<${tag}${renderInlineAttrs(renderedAttrs)}>${children[0].value}</${tag}>`;
  }

  const openTag = renderOpenTag(tag, renderedAttrs, selfClosing || children.length === 0, level);

  if (selfClosing || children.length === 0) {
    return openTag;
  }

  return `${openTag}
${renderNodes(children, level + 1, primitiveAliases)}
${indent(level)}</${tag}>`;
}

function renderOpenTag(
  tag: string,
  attrs: StyledOutputAttribute[],
  selfClosing: boolean,
  level: number,
): string {
  const inlineSuffix = selfClosing ? " />" : ">";
  const multilineSuffix = selfClosing ? "/>" : ">";

  if (attrs.length === 0) {
    return `${indent(level)}<${tag}${inlineSuffix}`;
  }

  const renderedAttrs = attrs
    .map((attr) => `${indent(level + 1)}${renderAttribute(attr)}`)
    .join("\n");

  return `${indent(level)}<${tag}
${renderedAttrs}
${indent(level)}${multilineSuffix}`;
}

function renderAttribute(attr: StyledOutputAttribute): string {
  if (attr.name === "spread") {
    if (!attr.value) {
      throw new Error("Spread attributes require a value expression.");
    }

    return `{...${renderValueExpression(attr.value)}}`;
  }

  if (!attr.value) return attr.name;

  const name = mapReactAttributeName(attr.name);

  if (attr.value.type === "literal" && typeof attr.value.value === "string") {
    return `${name}=${JSON.stringify(attr.value.value)}`;
  }

  return `${name}={${renderValueExpression(attr.value)}}`;
}

function renderSlot(
  node: StyledOutputSlotNode,
  level: number,
  primitiveAliases: Record<string, string>,
): string {
  return `${indent(level)}{${renderSlotExpression(node, primitiveAliases, level)}}`;
}

function renderFallbackExpression(
  fallback: StyledOutputRenderNode[],
  primitiveAliases: Record<string, string>,
  level: number,
): string {
  if (fallback.length === 1 && fallback[0].type === "text") {
    return JSON.stringify(fallback[0].value);
  }

  if (fallback.length === 1) {
    const inlineExpression = renderInlineFallbackExpression(fallback[0]);
    if (inlineExpression) return inlineExpression;

    if (fallback[0].type === "slot") {
      const slotExpression = renderSlotExpression(fallback[0], primitiveAliases, level);

      return fallback[0].fallback && fallback[0].fallback.length > 0
        ? `(${slotExpression})`
        : slotExpression;
    }

    return `(
${renderNode(fallback[0], level + 1, primitiveAliases)}
${indent(level)})`;
  }

  return `(
${indent(level + 1)}<>
${renderNodes(fallback, level + 2, primitiveAliases)}
${indent(level + 1)}</>
${indent(level)})`;
}

function renderSlotExpression(
  node: StyledOutputSlotNode,
  primitiveAliases: Record<string, string>,
  level: number,
): string {
  const slotName = node.name ? toReactSlotPropName(node.name) : "children";
  if (!node.fallback || node.fallback.length === 0) return slotName;

  return `${slotName} ?? ${renderFallbackExpression(node.fallback, primitiveAliases, level)}`;
}

function renderInlineFallbackExpression(node: StyledOutputRenderNode): string | undefined {
  if (node.type === "icon" && (!node.attrs || node.attrs.length === 0)) {
    return `<${node.importName} />`;
  }

  if (node.type === "element" && !node.selfClosing) {
    const attrs = node.attrs ?? [];
    const children = node.children ?? [];

    if (canRenderInlineTextTag(attrs, children, false)) {
      return `<${node.tag}${renderInlineAttrs(attrs)}>${children[0].value}</${node.tag}>`;
    }
  }

  return undefined;
}

export function renderValueExpression(value: StyledOutputValueExpression): string {
  switch (value.type) {
    case "class-join":
      return `[${value.items.map(renderValueExpression).join(", ")}].filter(Boolean).join(" ")`;
    case "class-variant":
      return `${value.variant}(${renderClassVariantArgs(value.args)})`;
    case "literal":
      return JSON.stringify(value.value);
    case "object":
      return renderObjectExpression(value.entries);
    case "raw":
      return value.code;
    case "template":
      return renderTemplateExpression(value.parts);
    case "variable":
      return value.name;
  }
}

function renderClassVariantArgs(args: Record<string, string> | undefined): string {
  if (!args || Object.keys(args).length === 0) return "";

  return `{ ${Object.entries(args)
    .map(([key, value]) => (key === value && isIdentifier(value) ? value : `${key}: ${value}`))
    .join(", ")} }`;
}

function renderObjectExpression(entries: Record<string, StyledOutputValueExpression>): string {
  return `{ ${Object.entries(entries)
    .map(([key, value]) => `${key}: ${renderValueExpression(value)}`)
    .join(", ")} }`;
}

function renderTemplateExpression(parts: Array<string | StyledOutputValueExpression>): string {
  return `\`${parts
    .map((part) =>
      typeof part === "string" ? escapeTemplateText(part) : `\${${renderValueExpression(part)}}`,
    )
    .join("")}\``;
}

export function renderIdentifierObject(entries: Record<string, string>): string {
  const lines = Object.entries(entries).map(([key, value]) =>
    key === value && isIdentifier(key) ? `  ${key},` : `  ${formatObjectKey(key)}: ${value},`,
  );

  return `{\n${lines.join("\n")}\n}`;
}

function canRenderInlineTextTag(
  attrs: StyledOutputAttribute[],
  children: StyledOutputRenderNode[],
  selfClosing: boolean,
): children is [Extract<StyledOutputRenderNode, { type: "text" }>] {
  return !selfClosing && attrs.length <= 1 && children.length === 1 && children[0].type === "text";
}

function renderInlineAttrs(attrs: StyledOutputAttribute[]): string {
  if (attrs.length === 0) return "";

  return ` ${attrs.map(renderAttribute).join(" ")}`;
}
