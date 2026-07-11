import type {
  StyledOutputAttribute,
  StyledOutputComment,
  StyledOutputConditionNode,
  StyledOutputElementNode,
  StyledOutputRenderNode,
  StyledOutputRepeatNode,
  StyledOutputValueExpression,
} from '../../../styled-output-model/index.js';
import { getComponentReferenceName } from './component-discovery.js';
import { ASTRO_FRAMEWORK } from './constants.js';
import {
  escapeTemplateText,
  formatObjectKey,
  indent,
  isForFramework,
  isIdentifier,
} from './formatting.js';
import { getPrimitiveAliasForNode } from './primitive-helpers.js';

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
      return renderSlot(node.name, node.fallback ?? [], level, primitiveAliases);
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

  return `${indent(level)}{
${indent(level + 1)}${node.each}.map((${node.item}${indexParameter}) => (
${renderNodes(node.children, level + 2, primitiveAliases)}
${indent(level + 1)}))
${indent(level)}}`;
}

function renderConditionalNode(
  node: StyledOutputConditionNode,
  level: number,
  primitiveAliases: Record<string, string>,
): string {
  if (node.else.length === 0) {
    return `${indent(level)}{
${indent(level + 1)}${node.condition} && (
${renderNodes(node.then, level + 2, primitiveAliases)}
${indent(level + 1)})
${indent(level)}}`;
  }

  return `${indent(level)}{
${indent(level + 1)}${node.condition} ? (
${renderNodes(node.then, level + 2, primitiveAliases)}
${indent(level + 1)}) : (
${renderNodes(node.else, level + 2, primitiveAliases)}
${indent(level + 1)})
${indent(level)}}`;
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
    .filter((comment) => isForFramework(comment, ASTRO_FRAMEWORK))
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
  const renderedAttrs = attrs.filter((attr) => isForFramework(attr, ASTRO_FRAMEWORK));

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

  const inlineOpenTag = `${indent(level)}<${tag}${renderInlineAttrs(attrs)}${inlineSuffix}`;
  if (inlineOpenTag.length <= 100) {
    return inlineOpenTag;
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

  if (attr.value.type === "literal" && typeof attr.value.value === "string") {
    return `${attr.name}=${JSON.stringify(attr.value.value)}`;
  }

  return `${attr.name}={${renderValueExpression(attr.value)}}`;
}

function renderSlot(
  name: string | undefined,
  fallback: StyledOutputRenderNode[],
  level: number,
  primitiveAliases: Record<string, string>,
): string {
  const attr = name ? ` name=${JSON.stringify(name)}` : "";

  if (fallback.length === 0) {
    return `${indent(level)}<slot${attr} />`;
  }

  if (fallback.length === 1 && fallback[0].type === "text") {
    return `${indent(level)}<slot${attr}>${fallback[0].value}</slot>`;
  }

  return `${indent(level)}<slot${attr}>
${renderNodes(fallback, level + 1, primitiveAliases)}
${indent(level)}</slot>`;
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
