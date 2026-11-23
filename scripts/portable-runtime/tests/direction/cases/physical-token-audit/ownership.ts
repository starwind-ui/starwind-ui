import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import path from "node:path";
import ts from "typescript";
import { starwindStyledContracts } from "../../../../contracts/styled/starwind.js";
import {
  buildGenericAdapterPlan,
  getGenericAdapterOutputFamilyPlanId,
} from "../../../../renderers/generic-adapter-plan/index.js";
import { getRuntimeAdapterPrimitiveInventoryEntries } from "../../../../renderers/primitive-inventory.js";
import type { SourceInventory } from "./ledger.js";

const styled = new Set(starwindStyledContracts.map((contract) => contract.component));
const expressions = new Map<string, Set<string>>();
const assets = new Map<string, Set<string>>();
function add(map: Map<string, Set<string>>, key: string, owner: string) {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key)!.add(owner);
}
function recordValues(value: unknown, owner: string) {
  if (!value || typeof value !== "object") return;
  const record = value as Record<string, unknown>;
  if (record.type === "raw" && typeof record.code === "string")
    add(expressions, record.code, owner);
  if (typeof record.source === "string" && record.source.endsWith(".svg"))
    add(assets, record.source, owner);
  Object.values(record).forEach((child) => recordValues(child, owner));
}
for (const contract of starwindStyledContracts) recordValues(contract, contract.component);

function directOwner(file: string): string | undefined {
  const matches = [
    [/^candidate\/styled\/\w+\/([\w-]+)\//, ""],
    [/^candidate\/packages\/\w+\/src\/(?!_?internal\/)([\w-]+)\//, "runtime:"],
    [/^packages\/runtime\/src\/components\/([\w-]+)\//, "runtime:"],
    [/^apps\/demo\/src\/components\/starwind\/([\w-]+)\//, "legacy:"],
    [/contracts\/styled\/(?:components|styles)\/([\w-]+)\.ts$/, ""],
    [/contracts\/primitive\/components\/([\w-]+)\.ts$/, "runtime:"],
    [/contracts\/primitive\/(color-picker)\.ts$/, "runtime:"],
  ] as const;
  for (const [pattern, prefix] of matches) {
    const match = file.match(pattern);
    if (match) return match[1] === "theme" ? "theme" : prefix + match[1];
  }
  if (file.startsWith("packages/runtime/src/theme/")) return "theme";
}

function consumers(sources: Map<string, string>) {
  const graph = new Map<string, string[]>();
  const result = new Map<string, Set<string>>();
  for (const [name, source] of sources) {
    if (
      !name.startsWith("packages/runtime/src/") &&
      !name.startsWith("apps/demo/src/") &&
      !name.startsWith("candidate/packages/")
    )
      continue;
    const imports = [];
    const executable = source
      .replace(/\btypeof\s+import\(\s*["'][^"']+["']\s*\)/g, "")
      .replace(/\b(?:import|export)\s+type\s+(?:\{[^}]*\}|[\w$]+)\s+from\s*["'][^"']+["']/g, "");
    for (const match of executable.matchAll(
      /\b(?:from\s*|import\s*\(?\s*)["'](\.[^"']+|@\/[^"']+)["']/g,
    )) {
      const spec = match[1]!;
      const base = spec.startsWith("@/")
        ? path.posix.join("apps/demo/src", spec.slice(2))
        : path.posix.join(path.posix.dirname(name), spec.replace(/\.(?:js|mjs)$/, ""));
      const destination = [
        base,
        base + ".ts",
        base + ".tsx",
        base + ".astro",
        base + "/index.ts",
      ].find((s) => sources.has(s));
      if (destination) imports.push(destination);
    }
    graph.set(name, imports);
  }
  for (const name of graph.keys()) {
    const owner = directOwner(name);
    if (!owner) continue;
    const seen = new Set<string>();
    const visit = (file: string) => {
      if (seen.has(file)) return;
      seen.add(file);
      add(result, file, owner);
      for (const child of graph.get(file) ?? []) visit(child);
    };
    visit(name);
  }
  return result;
}

type Section = {
  disposition:
    | "component"
    | "shared-runtime"
    | "emitted-expression"
    | "printer"
    | "asset"
    | "stylesheet";
  owners: string[];
  proof?: string;
};
function section(
  disposition: Section["disposition"],
  owners: Iterable<string>,
  proof?: string,
): Section {
  return { disposition, owners: [...new Set(owners)].sort(), ...(proof ? { proof } : {}) };
}
const rangeProof = "slider-paint-styled#server-html-no-js";
const clearanceProof = "chrome-overlay-styled#context-entry-bounds";
const sidebarProof = "chrome-sidebar-styled#owned-sidebar-tooltips";
const projectionProof = "audit-source-occurrences#public-coverage";

// A dispatch expression copied from a contract belongs to that contract even when the
// printer containing it handles many unrelated components. Index the AST branch, including
// continuation lines and nested calls, so projection boilerplate cannot absorb that geometry.
function adapterFamilies(sources: Map<string, string>) {
  const families = new Map<string, Set<string>>();
  for (const entry of getRuntimeAdapterPrimitiveInventoryEntries()) {
    const owner = "runtime:" + entry.component;
    if (entry.generation.strategy === "generic-adapter-plan") {
      const kind = getGenericAdapterOutputFamilyPlanId(buildGenericAdapterPlan(entry.contract));
      add(families, kind, owner);
    } else {
      const file =
        "scripts/portable-runtime/renderers/specialized-adapter-spec/" +
        entry.component +
        "-specialized-adapter-spec.ts";
      for (const match of (sources.get(file) ?? "").matchAll(
        /family:\s*\{[^}]{0,100}?kind:\s*"([\w-]+)"/g,
      ))
        add(families, match[1]!, owner);
    }
  }
  return families;
}
function familyHints(text: string, families: Map<string, Set<string>>) {
  const found = new Set<string>();
  for (const [kind, owners] of families) {
    const pascal = kind
      .split("-")
      .map((s) => s[0]!.toUpperCase() + s.slice(1))
      .join("");
    if (
      text.includes('"' + kind + '"') ||
      text.includes("Adapter" + pascal) ||
      text.endsWith("/" + kind + ".ts")
    )
      for (const owner of owners) found.add(owner);
  }
  return found;
}
function branchOwners(name: string, source: string, families: Map<string, Set<string>>) {
  const tree = ts.createSourceFile(name, source, ts.ScriptTarget.Latest, true);
  const spans = new Map<number, Section>();
  function assign(node: ts.Node, decision: Section) {
    const start = tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1;
    const end = tree.getLineAndCharacterOfPosition(node.end).line + 1;
    for (let line = start; line <= end; line++) spans.set(line, decision);
  }
  function visit(node: ts.Node) {
    if (
      name.endsWith("/vue/styled/expressions.ts") &&
      ts.isIfStatement(node) &&
      node.expression.getText(tree).startsWith("keys.join(") &&
      /--border-offset|--translation/.test(node.expression.getText(tree))
    )
      assign(
        node,
        section("emitted-expression", ["switch"], "switch-paint-styled#disabled-server-paint"),
      );
    if (ts.isCaseClause(node) && ts.isStringLiteral(node.expression)) {
      const literal = node.expression.text;
      const owners = expressions.get(literal);
      if (owners)
        assign(
          node,
          section(
            "emitted-expression",
            owners,
            owners.size === 1 && owners.has("slider") ? rangeProof : undefined,
          ),
        );
      else if (styled.has(literal)) assign(node, section("emitted-expression", [literal]));
    }
    if (ts.isPropertyAssignment(node) && ts.isStringLiteral(node.name)) {
      const owners = assets.get(node.name.text);
      if (owners) assign(node, section("asset", owners));
    }
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      ["menuEntry", "entryRoom"].includes(node.name.text) &&
      name === "packages/runtime/src/internal/floating.ts"
    )
      assign(node, section("shared-runtime", ["runtime:context-menu"], clearanceProof));
    if (
      ts.isIfStatement(node) &&
      name === "packages/runtime/src/internal/floating.ts" &&
      node.expression.getText(tree).includes("contextMenuEntryRoom")
    )
      assign(node, section("shared-runtime", ["runtime:context-menu"], clearanceProof));
    if (ts.isIfStatement(node)) {
      const users = familyHints(node.expression.getText(tree), families);
      if (users.size) assign(node.thenStatement, section("emitted-expression", users));
    }
    if (ts.isFunctionDeclaration(node) && node.name) {
      const signature = node.parameters.map((p) => p.type?.getText(tree) ?? "").join(" ");
      const family = familyHints(signature, families);
      if (family.size) assign(node, section("emitted-expression", family));
      else {
        const identifier = node.name.text.replace(/([a-z\d])([A-Z])/g, "$1-$2").toLowerCase();
        const owner = [...styled]
          .filter((id) => !["item", "form", "input", "button", "label", "image"].includes(id))
          .sort((a, b) => b.length - a.length)
          .find((id) => ("-" + identifier + "-").includes("-" + id + "-"));
        if (owner) assign(node, section("emitted-expression", [owner]));
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  return spans;
}

// A section is anchored by the statements it covers. `statements` counts them and `signature`
// hashes their text in file order. `lines` is computed fresh for failure messages and is never
// stored in the ledger or compared.
export type SourceSection = Section & { statements: number; signature: string; lines?: string };
export function classifySections(
  sources: Map<string, string>,
  inventory: SourceInventory,
): Record<string, SourceSection[]> {
  const graph = consumers(sources);
  const families = adapterFamilies(sources);
  const result: Record<string, SourceSection[]> = {};
  for (const [file, groups] of Object.entries(inventory)) {
    const source = sources.get(file)!;
    const own = directOwner(file);
    const markers = [...styled].sort((a, b) => b.length - a.length);
    const shared =
      !own &&
      (file.startsWith("scripts/portable-runtime/renderers/") ||
        file.endsWith("svg-assets.ts") ||
        file.endsWith("internal/floating.ts"));
    const branches = shared ? branchOwners(file, source, families) : new Map<number, Section>();
    const family = shared ? familyHints(file, families) : new Set<string>();
    const recipeName = path.posix.basename(file, ".ts").replace(/^recipe-/, "");
    const moduleOwner = file.includes("/renderers/")
      ? [...styled]
          .sort((a, b) => b.length - a.length)
          .find(
            (id) =>
              recipeName === id ||
              recipeName.startsWith(id + "-operations") ||
              file.endsWith("/" + id + ".ts") ||
              file.endsWith("/" + id + "-specialized-adapter-spec.ts") ||
              file.includes("/" + id + "/"),
          )
      : undefined;
    const sectionRows = new Map<string, number[]>();
    // Use the statement text that the occurrence scan saw, with block comments blanked.
    const used = new Map<number, string>();
    for (const group of Object.values(groups))
      for (const site of group.sites) used.set(site.line, site.statement);
    // Owner rules read the raw line. The section signature hashes the scanned statement.
    const raw = source.split(/\r?\n/);
    for (const line of [...used.keys()].sort((a, b) => a - b)) {
      const text = raw[line - 1]!;
      let decision = branches.get(line);
      if (file.endsWith("/svelte/styled/native-popup.ts"))
        decision = section(
          "emitted-expression",
          ["select"],
          "select-alignment-styled#physical-clamp-and-touch-fallback",
        );
      if (
        file.endsWith("/specialized-future-framework-tracer.ts") &&
        text.includes("${MENU_FIXTURE_COMMENT}")
      )
        decision = section("emitted-expression", ["runtime:menu"]);
      if (file.endsWith("/svg-assets.ts") && !decision && /viewBox|["']M0 0h24/.test(text))
        decision = section(
          "asset",
          [...assets.values()].flatMap((ids) => [...ids]),
        );
      if (file === "packages/runtime/src/internal/floating.ts" && /\bgetSideIntent\b/.test(text))
        decision = section("shared-runtime", ["runtime:tooltip", "sidebar"], sidebarProof);
      if (file === "packages/runtime/src/internal/floating.ts" && /\bentryRoom\b/.test(text))
        decision = section("shared-runtime", ["runtime:context-menu"], clearanceProof);
      if (!decision && own) decision = section("component", [own]);
      const users = graph.get(file);
      if (!decision && users?.size) decision = section("shared-runtime", users);
      if (!decision && file === "apps/demo/src/styles/starwind.css")
        decision = section("stylesheet", styled);
      if (!decision && shared) {
        const ids = markers.filter((id) =>
          new RegExp("(?:data-sw-|--sw-|[\"'])" + id + "(?:-|(?![\\w-]))").test(text),
        );
        if (ids.length) decision = section("emitted-expression", ids);
      }
      if (!decision && family.size) decision = section("emitted-expression", family);
      if (!decision && moduleOwner) decision = section("emitted-expression", [moduleOwner]);
      if (!decision) {
        // These modules emit or validate adapter code. Their concrete component output is
        // audited separately in candidate/{packages,styled}; they have no Runtime geometry.
        assert(
          file.startsWith("scripts/portable-runtime/") || file.endsWith("/src/index.ts"),
          "Missing source-owner trace for " + file,
        );
        decision = section("printer", [], projectionProof);
      }
      // The section key is the review decision: disposition, owners and proof. A token line that
      // moves to another function with the same decision stays in this section and passes. The
      // review covers the token and its owner, not the function that holds it.
      const key = JSON.stringify(decision);
      if (!sectionRows.has(key)) sectionRows.set(key, []);
      sectionRows.get(key)!.push(line);
    }
    result[file] = [...sectionRows]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, numbers]) => ({
        ...JSON.parse(key),
        statements: numbers.length,
        signature: createHash("sha256")
          // Sorted, so that moving a statement inside the section keeps the hash.
          .update(
            numbers
              .map((n) => used.get(n)!)
              .sort()
              .join("\n"),
          )
          .digest("hex")
          .slice(0, 24),
        lines: ranges(numbers),
      }));
  }
  return result;
}

function ranges(numbers: number[]) {
  const out: string[] = [];
  let first = numbers[0]!,
    last = first;
  for (const n of numbers.slice(1)) {
    if (n === last + 1) {
      last = n;
      continue;
    }
    out.push(first === last ? String(first) : first + "-" + last);
    first = last = n;
  }
  out.push(first === last ? String(first) : first + "-" + last);
  return out.join(",");
}
export function compareClassifications(
  expected: Record<string, SourceSection[]>,
  actual: Record<string, SourceSection[]>,
) {
  const anchor = (sections: SourceSection[] | undefined) =>
    sections?.map(({ lines: _lines, ...section }) => section);
  for (const file of new Set([...Object.keys(expected), ...Object.keys(actual)]))
    assert.deepEqual(
      anchor(actual[file]),
      anchor(expected[file]),
      file +
        " changed reviewed ownership or disposition; current sections: " +
        (actual[file]
          ?.map((s) => s.disposition + " [" + s.owners.join(", ") + "] lines " + s.lines)
          .join("; ") ?? "none"),
    );
}
export const expectations = [];
