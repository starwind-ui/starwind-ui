import { randomBytes } from "node:crypto";
import path from "node:path";

import fs from "fs-extra";

import { resolveProjectMutationPath } from "./project-path.js";

type ChartTokenBlockDefinition = {
  /** Selector used when the block is printed or created. */
  selector: "@theme inline" | ":root" | ".dark";
  tokens: ReadonlyArray<readonly [name: string, value: string]>;
};

const CHART_RAMP = [
  ["--chart-1", "var(--color-blue-300)"],
  ["--chart-2", "var(--color-blue-500)"],
  ["--chart-3", "var(--color-blue-600)"],
  ["--chart-4", "var(--color-blue-700)"],
  ["--chart-5", "var(--color-blue-800)"],
] as const;

export const CHART_TOKEN_BLOCKS: readonly ChartTokenBlockDefinition[] = [
  {
    selector: "@theme inline",
    tokens: CHART_RAMP.map(([name]) => [`--color-${name.slice(2)}`, `var(${name})`] as const),
  },
  { selector: ":root", tokens: CHART_RAMP },
  { selector: ".dark", tokens: CHART_RAMP },
];

export type ChartTokenAddition = {
  block: ChartTokenBlockDefinition["selector"];
  tokens: string[];
};

export type ChartTokenInsertResult = {
  added: ChartTokenAddition[];
  content: string;
};

export type ChartTokenSyncResult =
  | { status: "added"; cssPath: string; added: ChartTokenAddition[] }
  | { status: "unchanged"; cssPath: string }
  | { status: "failed"; cssPath: string; error: string; block: string };

type CssBlock = {
  ancestors: string[];
  close: number;
  open: number;
  prelude: string;
};

type ScannedCss = {
  blocks: CssBlock[];
  /** The source with comments and string contents replaced by spaces, same length. */
  masked: string;
};

function normalizePrelude(prelude: string): string {
  return prelude.replace(/\s+/g, " ").trim();
}

function maskRange(chars: string[], start: number, end: number): void {
  for (let index = start; index < end; index += 1) {
    if (chars[index] !== "\n" && chars[index] !== "\r") chars[index] = " ";
  }
}

function scanCss(css: string): ScannedCss {
  // Split on UTF-16 code units so indexes match String.prototype.slice.
  const source = css;
  const chars = source.split("");
  const blocks: CssBlock[] = [];
  const stack: Array<{ open: number; prelude: string }> = [];
  let statementStart = 0;
  let index = 0;

  while (index < source.length) {
    const char = source[index];

    if (char === "/" && source[index + 1] === "*") {
      const end = source.indexOf("*/", index + 2);
      if (end === -1) throw new Error("The CSS file has an unclosed comment.");
      maskRange(chars, index, end + 2);
      index = end + 2;
      continue;
    }

    if (char === '"' || char === "'") {
      let end = index + 1;
      while (end < source.length && source[end] !== char) {
        if (source[end] === "\\") end += 1;
        else if (source[end] === "\n") break;
        end += 1;
      }
      if (end >= source.length || source[end] !== char) {
        throw new Error("The CSS file has an unclosed string.");
      }
      maskRange(chars, index + 1, end);
      index = end + 1;
      continue;
    }

    if (char === "{") {
      stack.push({
        open: index,
        prelude: normalizePrelude(chars.slice(statementStart, index).join("")),
      });
      statementStart = index + 1;
    } else if (char === "}") {
      const entry = stack.pop();
      if (!entry) throw new Error("The CSS file has an unexpected closing brace.");
      blocks.push({
        ancestors: stack.map((parent) => parent.prelude),
        close: index,
        open: entry.open,
        prelude: entry.prelude,
      });
      statementStart = index + 1;
    } else if (char === ";") {
      statementStart = index + 1;
    }

    index += 1;
  }

  if (stack.length > 0) throw new Error("The CSS file has an unclosed block.");

  blocks.sort((left, right) => left.open - right.open);
  return { blocks, masked: chars.join("") };
}

function isThemePrelude(prelude: string): boolean {
  return /^@theme(?:\s|$)/.test(prelude);
}

/**
 * Whether a block can hold an existing declaration of the token. Any depth and any selector list
 * that names the selector counts, so a new block never shadows a value the user already set.
 */
function declaresFor(selector: ChartTokenBlockDefinition["selector"], prelude: string): boolean {
  if (selector === "@theme inline") return isThemePrelude(prelude);
  return prelude.split(",").some((part) => part.trim() === selector);
}

/** Blocks at the top level or inside `@layer` only. Media and supports blocks are conditional. */
function isUnconditional(block: CssBlock): boolean {
  return block.ancestors.every((ancestor) => /^@layer(?:\s|$)/.test(ancestor));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function declares(body: string, name: string): boolean {
  return new RegExp(`(?:^|[\\s;{}])${escapeRegExp(name)}\\s*:`).test(body);
}

function lineIndent(css: string, position: number): { indent: string; lineStart: number } {
  const lineStart = css.lastIndexOf("\n", position - 1) + 1;
  const indent = /^[ \t]*/.exec(css.slice(lineStart))?.[0] ?? "";
  return { indent, lineStart };
}

function lastNonWhitespace(text: string, start: number, end: number): number {
  for (let index = end - 1; index >= start; index -= 1) {
    if (!/\s/.test(text[index] ?? "")) return index;
  }
  return -1;
}

function firstNonWhitespace(text: string, start: number, end: number): number {
  for (let index = start; index < end; index += 1) {
    if (!/\s/.test(text[index] ?? "")) return index;
  }
  return -1;
}

function formatDeclarations(
  definition: ChartTokenBlockDefinition,
  names: readonly string[],
  indent: string,
  eol: string,
): string {
  return definition.tokens
    .filter(([name]) => names.includes(name))
    .map(([name, value]) => `${indent}${name}: ${value};`)
    .join(eol);
}

function planBlockInsertion(
  css: string,
  masked: string,
  block: CssBlock,
  declarations: (indent: string) => string,
  eol: string,
): { position: number; text: string } {
  const bodyStart = block.open + 1;
  const firstContent = firstNonWhitespace(css, bodyStart, block.close);
  const blockLine = lineIndent(css, block.open);
  const contentLine = firstContent === -1 ? undefined : lineIndent(css, firstContent);
  const indent =
    contentLine && contentLine.lineStart > block.open
      ? contentLine.indent
      : `${blockLine.indent}  `;
  const body = css.slice(bodyStart, block.close);
  const lastSource = lastNonWhitespace(css, bodyStart, block.close);
  const lastMeaningful = lastNonWhitespace(masked, bodyStart, block.close);

  if (lastSource === -1) {
    const closing = body.includes("\n") ? "" : `${eol}${blockLine.indent}`;
    return { position: bodyStart, text: `${eol}${declarations(indent)}${closing}` };
  }

  if (lastMeaningful !== -1 && !";{}".includes(masked[lastMeaningful] ?? "")) {
    // The last declaration has no semicolon. Insert at the start so no existing byte changes.
    return { position: bodyStart, text: `${eol}${declarations(indent)}` };
  }

  const separator = body.includes("\n") ? `${eol}${eol}` : eol;
  return { position: lastSource + 1, text: `${separator}${declarations(indent)}` };
}

/**
 * Adds missing Starwind chart tokens to a stylesheet. Existing tokens and every other byte of the
 * file stay unchanged. Throws when the CSS cannot be parsed.
 */
export function insertMissingChartTokens(css: string): ChartTokenInsertResult {
  const { blocks, masked } = scanCss(css);
  const eol = css.includes("\r\n") ? "\r\n" : "\n";
  const edits: Array<{ position: number; text: string }> = [];
  const createdBlocks: string[] = [];
  const added: ChartTokenAddition[] = [];

  const declaredIn = (selector: ChartTokenBlockDefinition["selector"], name: string) =>
    blocks.some(
      (block) =>
        declaresFor(selector, block.prelude) &&
        declares(masked.slice(block.open + 1, block.close), name),
    );

  for (const definition of CHART_TOKEN_BLOCKS) {
    const candidates = blocks.filter((block) => declaresFor(definition.selector, block.prelude));
    const missing = definition.tokens
      .map(([name]) => name)
      .filter((name) => !declaredIn(definition.selector, name))
      // A user's own :root chart color also applies in dark mode. A blue dark value would hide it.
      .filter((name) => definition.selector !== ".dark" || !declaredIn(":root", name));
    if (missing.length === 0) continue;

    added.push({ block: definition.selector, tokens: missing });
    const target = candidates.find(
      (block) => isUnconditional(block) && block.prelude === definition.selector,
    );
    const declarations = (indent: string) => formatDeclarations(definition, missing, indent, eol);

    if (target) {
      edits.push(planBlockInsertion(css, masked, target, declarations, eol));
    } else {
      createdBlocks.push(`${definition.selector} {${eol}${declarations("  ")}${eol}}${eol}`);
    }
  }

  let content = css;
  for (const edit of edits.sort((left, right) => right.position - left.position)) {
    content = `${content.slice(0, edit.position)}${edit.text}${content.slice(edit.position)}`;
  }

  if (createdBlocks.length > 0) {
    const prefix = content === "" ? "" : content.endsWith("\n") ? eol : `${eol}${eol}`;
    content = `${content}${prefix}${createdBlocks.join(eol)}`;
  }

  return { added, content };
}

/** Prints chart token blocks for manual addition. With no argument, prints every token. */
export function formatChartTokenBlock(additions?: readonly ChartTokenAddition[]): string {
  return CHART_TOKEN_BLOCKS.flatMap((definition) => {
    const names = additions
      ? (additions.find((addition) => addition.block === definition.selector)?.tokens ?? [])
      : definition.tokens.map(([name]) => name);
    if (names.length === 0) return [];
    return [`${definition.selector} {\n${formatDeclarations(definition, names, "  ", "\n")}\n}\n`];
  }).join("\n");
}

/**
 * Writes the full content to a temp file in the same directory, then renames it over the original.
 * A failed write never leaves the original stylesheet partly written.
 */
async function replaceFileAtomically(filePath: string, content: string): Promise<void> {
  // A read-only stylesheet means the user does not want tools to change it.
  await fs.access(filePath, fs.constants.W_OK);
  const { mode } = await fs.stat(filePath);
  const tempPath = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`,
  );

  try {
    await fs.writeFile(tempPath, content, { encoding: "utf8", flag: "wx", mode: mode & 0o777 });
    await fs.chmod(tempPath, mode & 0o777);
    await fs.rename(tempPath, filePath);
  } catch (error) {
    await fs.remove(tempPath).catch(() => undefined);
    throw error;
  }
}

/**
 * Adds missing chart tokens to the project stylesheet. Never throws: a failure returns the token
 * block to print for manual addition.
 */
export async function syncChartTokens(cssPath: string): Promise<ChartTokenSyncResult> {
  let additions: ChartTokenAddition[] | undefined;

  try {
    const filePath = await resolveProjectMutationPath(cssPath);
    if (!(await fs.pathExists(filePath))) {
      throw new Error(`${cssPath} does not exist.`);
    }

    const css = await fs.readFile(filePath, "utf8");
    const result = insertMissingChartTokens(css);
    if (result.added.length === 0 || result.content === css) {
      return { status: "unchanged", cssPath };
    }

    additions = result.added;
    await replaceFileAtomically(filePath, result.content);
    return { status: "added", cssPath, added: result.added };
  } catch (error) {
    return {
      status: "failed",
      cssPath,
      error: error instanceof Error ? error.message : String(error),
      block: formatChartTokenBlock(additions),
    };
  }
}
