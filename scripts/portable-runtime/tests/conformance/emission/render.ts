// Renders generated Primitive parts on the server for each target. The emission check reads the real
// HTML, so a contract fact counts as handled only when the target's part produces it.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { render as renderSvelte } from "svelte/server";
import ts from "typescript";
import { createSSRApp, h, type Component as VueComponent } from "vue";
import { renderToString as renderVue } from "vue/server-renderer";

export const EMISSION_TARGETS = ["astro", "react", "vue", "svelte"] as const;
export type EmissionTarget = (typeof EMISSION_TARGETS)[number];

export const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../..",
);

const EXTENSIONS: Record<EmissionTarget, string> = {
  astro: "astro",
  react: "tsx",
  vue: "vue",
  svelte: "svelte",
};

function pascal(name: string): string {
  return name.replace(/(^|-)([a-zA-Z0-9])/g, (_match, _dash, letter: string) =>
    letter.toUpperCase(),
  );
}

/** Context Menu reuses the Menu parts for everything past its own root and trigger. */
const SHARED_FAMILY: Record<string, string> = { "context-menu": "menu" };

function partCandidates(target: EmissionTarget, family: string, part: string): string[] {
  const home = path.join(repositoryRoot, "packages", target, "src");
  const name = pascal(part);
  const candidates = [path.join(home, family, `${pascal(family)}${name}.${EXTENSIONS[target]}`)];
  if (part === family) candidates.push(path.join(home, family, `${name}.${EXTENSIONS[target]}`));
  const shared = SHARED_FAMILY[family];
  if (shared)
    candidates.push(path.join(home, shared, `${pascal(shared)}${name}.${EXTENSIONS[target]}`));
  return candidates;
}

export function partFile(target: EmissionTarget, family: string, part: string): string {
  const candidates = partCandidates(target, family, part);
  return candidates.find((file) => existsSync(file)) ?? candidates[0]!;
}

export function partExists(target: EmissionTarget, family: string, part: string): boolean {
  return existsSync(partFile(target, family, part));
}

/** A composition node with a target component, its probe props, and its children. */
export type RenderNode = {
  component: unknown;
  props: Record<string, unknown>;
  children: RenderNode[];
};

function reactNode(node: RenderNode): React.ReactNode {
  return React.createElement(
    node.component as React.ElementType,
    node.props,
    ...node.children.map(reactNode),
  );
}

function vueNode(node: RenderNode): ReturnType<typeof h> {
  return h(
    node.component as VueComponent,
    node.props,
    node.children.length > 0 ? { default: () => node.children.map(vueNode) } : undefined,
  );
}

type SvelteServerComponent = (renderer: unknown, props: Record<string, unknown>) => void;

function svelteProps(node: RenderNode): Record<string, unknown> {
  if (node.children.length === 0) return node.props;
  return {
    ...node.props,
    // A compiled server snippet is a function of the renderer, so a tree needs no generated markup.
    children: (renderer: unknown) => {
      for (const child of node.children) {
        (child.component as SvelteServerComponent)(renderer, svelteProps(child));
      }
    },
  };
}

type AstroContainer = {
  renderToString(
    component: unknown,
    options: { props: Record<string, unknown>; slots: Record<string, string> },
  ): Promise<string>;
};

let astroContainer: Promise<AstroContainer> | undefined;

function getAstroContainer(): Promise<AstroContainer> {
  astroContainer ??= (async () => {
    const entry = path.join(repositoryRoot, "apps/demo/node_modules/astro/dist/container/index.js");
    const { experimental_AstroContainer: Container } = await import(/* @vite-ignore */ entry);
    return Container.create();
  })();
  return astroContainer;
}

async function astroNode(node: RenderNode, container: AstroContainer): Promise<string> {
  const inner = await Promise.all(node.children.map((child) => astroNode(child, container)));
  return container.renderToString(node.component, {
    props: node.props,
    slots: inner.length > 0 ? { default: inner.join("") } : {},
  });
}

export async function renderTree(target: EmissionTarget, tree: RenderNode): Promise<string> {
  if (target === "react") return renderToStaticMarkup(reactNode(tree) as React.ReactElement);
  if (target === "vue") {
    const context: { teleports?: Record<string, string> } = {};
    const html = await renderVue(createSSRApp({ render: () => vueNode(tree) }), context);
    return [html, ...Object.values(context.teleports ?? {})].join("");
  }
  if (target === "svelte") {
    return renderSvelte(tree.component as never, { props: svelteProps(tree) as never }).body;
  }
  return astroNode(tree, await getAstroContainer());
}

/** Normalizes a target's attribute text, so `overflow:scroll` and `overflow: scroll;` compare equal. */
export function normalizeAttributeValue(value: string): string {
  return value.replace(/\s+/g, "").replace(/;$/, "");
}

export type ParsedElement = { tag: string; attributes: Map<string, string> };

const START_TAG = /<([a-zA-Z][^\s/>]*)((?:\s+[^\s=>/]+(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*\/?>/g;
const ATTRIBUTE = /([^\s=>/]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;

export function parseElements(html: string): ParsedElement[] {
  const elements: ParsedElement[] = [];
  for (const match of html.matchAll(START_TAG)) {
    const attributes = new Map<string, string>();
    for (const attribute of (match[2] ?? "").matchAll(ATTRIBUTE)) {
      attributes.set(
        attribute[1]!.toLowerCase(),
        attribute[2] ?? attribute[3] ?? attribute[4] ?? "",
      );
    }
    elements.push({ tag: match[1]!.toLowerCase(), attributes });
  }
  return elements;
}

function collectTypeScriptNames(source: string, names: Set<string>): void {
  const file = ts.createSourceFile(
    "part.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const visit = (node: ts.Node) => {
    if (
      ts.isPropertySignature(node) &&
      (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name))
    ) {
      names.add(node.name.text);
    }
    if (ts.isBindingElement(node) && !node.dotDotDotToken) {
      const key = node.propertyName ?? node.name;
      if (ts.isIdentifier(key) || ts.isStringLiteral(key)) names.add(key.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
}

/** The prop names a part declares, and its source text after types are removed. */
export type PartFacts = { declared: Set<string>; compiled: string };

const AST_ONLY_SCRIPT = /<script\b[^>]*>([\s\S]*?)<\/script>/g;

export function readPartFacts(target: EmissionTarget, file: string, loaded: unknown): PartFacts {
  const source = readFileSync(file, "utf8");
  const declared = new Set<string>();
  if (target === "react") {
    collectTypeScriptNames(source, declared);
    return { declared, compiled: stripTypes(source) };
  }
  if (target === "astro") {
    const frontmatter = source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
    collectTypeScriptNames(frontmatter, declared);
    return { declared, compiled: stripTypes(frontmatter) + source.slice(frontmatter.length + 8) };
  }
  if (target === "vue") {
    const component = loaded as {
      props?: Record<string, unknown> | string[];
      emits?: Record<string, unknown> | string[];
    };
    for (const name of Array.isArray(component.props)
      ? component.props
      : Object.keys(component.props ?? {})) {
      declared.add(name);
    }
    for (const name of Array.isArray(component.emits)
      ? component.emits
      : Object.keys(component.emits ?? {})) {
      declared.add(`on${name.charAt(0).toUpperCase()}${name.slice(1)}`);
    }
    return { declared, compiled: source };
  }
  const scripts = [...source.matchAll(AST_ONLY_SCRIPT)].map((match) => match[1]).join("\n");
  collectTypeScriptNames(scripts, declared);
  return { declared, compiled: stripTypes(scripts) + source.replace(AST_ONLY_SCRIPT, "") };
}

function stripTypes(source: string): string {
  return ts.transpileModule(source, {
    compilerOptions: { jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.ES2022 },
  }).outputText;
}

/** A prop is read when its name appears past its one destructuring or declaration. */
export function propIsRead(facts: PartFacts, name: string): boolean {
  const matches = facts.compiled.match(new RegExp(`\\b${name}\\b`, "g"));
  return (matches?.length ?? 0) >= 2;
}

/** A Vue callback prop is a declared emit, such as `checkedChange` for `onCheckedChange`. */
export function vueEmitIsPublished(facts: PartFacts, callback: string): boolean {
  const event = `${callback.charAt(2).toLowerCase()}${callback.slice(3)}`;
  return facts.declared.has(callback) && new RegExp(`emit\\(\\s*"${event}"`).test(facts.compiled);
}
