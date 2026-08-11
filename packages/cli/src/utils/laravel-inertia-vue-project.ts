import fs from "fs-extra";
import { parse, type ParseError } from "jsonc-parser";

import { resolveProjectMutationPath } from "./project-path.js";
import {
  asAstArrayExpression,
  asAstObjectExpression,
  countAstTopLevelDirectCalls,
  getAstDefaultExportCallObject,
  getAstDefaultImportBinding,
  getAstDirectCall,
  getAstObjectProperty,
  getAstStringValue,
  hasAstDirectCall,
  hasAstEscapedObjectKey,
  hasAstSoleNamedImport,
  parseSourceModule,
} from "./source-shape.js";
import { meetsVueVersionFloor } from "./vue-project.js";

export const LARAVEL_INERTIA_VUE_CANDIDATE_PATHS = [
  "artisan",
  "composer.json",
  "vite.config.ts",
  "vite.config.js",
  "resources/js/app.ts",
  "resources/js/app.js",
  "resources/css/app.css",
  "tsconfig.json",
] as const;

const HOST_CSS = "resources/css/app.css";
const STARWIND_CSS = "resources/css/starwind.css";
const MARKER_START = "/* starwind:start */";
const MARKER_END = "/* starwind:end */";
const MARKER_BLOCK = `${MARKER_START}\n@import "./starwind.css";\n${MARKER_END}`;
const MANUAL_ACTION =
  "This Laravel project needs manual action. Expected the official Laravel starter with Inertia Vue, static resources entries, and direct Laravel, Inertia, Tailwind, and Vue Vite plugins.";

export type LaravelInertiaVueEvidence = Readonly<{
  existingPaths: ReadonlySet<string>;
  projectFiles?: Readonly<Record<string, string>>;
}>;

type ProjectPackage = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

export type LaravelInertiaVueProjectPlan = Readonly<{
  componentDir: "resources/js/components/starwind";
  cssFile: "resources/css/starwind.css";
  entry: "resources/js/app.ts" | "resources/js/app.js";
  hostCss: "resources/css/app.css";
  kind: "laravel";
  utilsDir: "resources/js/lib/utils";
  viteConfig: "vite.config.ts" | "vite.config.js";
  vueUpgradeRequired: boolean;
}>;

export function getLaravelInertiaVueProjectPlan(
  pkg: ProjectPackage,
  evidence: LaravelInertiaVueEvidence,
): LaravelInertiaVueProjectPlan | undefined {
  const dependencies = getDependencies(pkg);
  if (!hasLaravelInertiaVueProjectEvidence(pkg, evidence)) return undefined;

  const files = evidence.projectFiles ?? {};
  const entries = (["resources/js/app.ts", "resources/js/app.js"] as const).filter((path) =>
    evidence.existingPaths.has(path),
  );
  const viteConfigs = (["vite.config.ts", "vite.config.js"] as const).filter((path) =>
    evidence.existingPaths.has(path),
  );
  const hasRequiredDependencies = [
    "vue",
    "@vitejs/plugin-vue",
    "laravel-vite-plugin",
    "@inertiajs/vue3",
    "@inertiajs/vite",
    "tailwindcss",
    "@tailwindcss/vite",
  ].every((name) => Boolean(dependencies[name]));
  if (
    !hasRequiredDependencies ||
    !evidence.existingPaths.has("artisan") ||
    !evidence.existingPaths.has("composer.json") ||
    !evidence.existingPaths.has(HOST_CSS) ||
    entries.length !== 1 ||
    viteConfigs.length !== 1 ||
    !hasLaravelComposer(files["composer.json"]) ||
    !inspectInertiaEntry(files[entries[0]!]) ||
    !inspectLaravelViteConfig(files[viteConfigs[0]!], entries[0]!) ||
    (entries[0] === "resources/js/app.ts" &&
      (!evidence.existingPaths.has("tsconfig.json") ||
        !hasOfficialTypeScriptAlias(files["tsconfig.json"]))) ||
    prepareLaravelHostCss(files[HOST_CSS]) === undefined
  ) {
    throw new Error(MANUAL_ACTION);
  }

  return Object.freeze({
    componentDir: "resources/js/components/starwind",
    cssFile: STARWIND_CSS,
    entry: entries[0]!,
    hostCss: HOST_CSS,
    kind: "laravel",
    utilsDir: "resources/js/lib/utils",
    viteConfig: viteConfigs[0]!,
    vueUpgradeRequired: !meetsVueVersionFloor(dependencies.vue!),
  });
}

export function hasLaravelInertiaVueProjectEvidence(
  pkg: ProjectPackage,
  evidence: LaravelInertiaVueEvidence,
): boolean {
  const dependencies = getDependencies(pkg);
  return (
    evidence.existingPaths.has("artisan") ||
    hasLaravelComposer(evidence.projectFiles?.["composer.json"]) ||
    Boolean(
      dependencies["@inertiajs/vue3"] ||
      dependencies["@inertiajs/vite"] ||
      dependencies["laravel-vite-plugin"],
    )
  );
}

export async function validateLaravelInertiaVueProjectSetup(
  plan: LaravelInertiaVueProjectPlan,
): Promise<void> {
  await prepareCurrentProject(plan);
}

export async function setupLaravelInertiaVueProject(
  plan: LaravelInertiaVueProjectPlan,
  cssFile: string,
): Promise<void> {
  if (cssFile !== plan.cssFile) {
    throw new Error(`${MANUAL_ACTION} Use the plan-owned stylesheet path ${plan.cssFile}.`);
  }
  const preparation = await prepareCurrentProject(plan);
  if (preparation.updatedHostCss !== preparation.hostCss) {
    await fs.writeFile(
      await resolveProjectMutationPath(plan.hostCss),
      preparation.updatedHostCss,
      "utf8",
    );
  }
}

export function projectLaravelStarwindStylesheet(content: string): string {
  return content
    .replace(/^@import ["']tailwindcss["'];\r?\n/m, "")
    .replace(/^@import ["']tw-animate-css["'];\r?\n/m, "")
    .replace(/^@custom-variant dark [^;]+;\r?\n/m, "")
    .replace(/^\s*\n/, "");
}

export function prepareLaravelHostCss(source: string | undefined): string | undefined {
  if (source === undefined) return undefined;
  const markerStarts = countOccurrences(source, MARKER_START);
  const markerEnds = countOccurrences(source, MARKER_END);
  if (markerStarts > 0 || markerEnds > 0) {
    if (markerStarts !== 1 || markerEnds !== 1 || !source.includes(`\n${MARKER_BLOCK}`))
      return undefined;
    const withoutMarker = source.replace(`\n${MARKER_BLOCK}`, "");
    return prepareLaravelHostCss(withoutMarker) === source ? source : undefined;
  }
  const prelude = getCssImportPrelude(source);
  if (!prelude || !isRecognizedHostCss(source, prelude.modules)) return undefined;
  if (prelude.modules.some((module) => /(?:^|\/)starwind\.css$/.test(module))) return undefined;
  return (
    source.slice(0, prelude.end) +
    "\n" +
    MARKER_BLOCK +
    (source.slice(prelude.end).startsWith("\n") ? "" : "\n") +
    source.slice(prelude.end)
  );
}

async function prepareCurrentProject(plan: LaravelInertiaVueProjectPlan): Promise<{
  hostCss: string;
  updatedHostCss: string;
}> {
  const [composer, entry, viteConfig, hostCss, tsconfig] = await Promise.all([
    fs.readFile("composer.json", "utf8"),
    fs.readFile(plan.entry, "utf8"),
    fs.readFile(plan.viteConfig, "utf8"),
    fs.readFile(plan.hostCss, "utf8"),
    plan.entry.endsWith(".ts") ? fs.readFile("tsconfig.json", "utf8") : undefined,
  ]);
  const updatedHostCss = prepareLaravelHostCss(hostCss);
  if (
    !hasLaravelComposer(composer) ||
    (plan.entry.endsWith(".ts") && !hasOfficialTypeScriptAlias(tsconfig)) ||
    !inspectInertiaEntry(entry) ||
    !inspectLaravelViteConfig(viteConfig, plan.entry) ||
    updatedHostCss === undefined
  ) {
    throw new Error(MANUAL_ACTION);
  }
  return { hostCss, updatedHostCss };
}

function hasLaravelComposer(source: string | undefined): boolean {
  if (!source) return false;
  try {
    const parsed = JSON.parse(source) as { require?: Record<string, unknown> };
    return typeof parsed.require?.["laravel/framework"] === "string";
  } catch {
    return false;
  }
}

function hasOfficialTypeScriptAlias(source: string | undefined): boolean {
  if (!source) return false;
  const errors: ParseError[] = [];
  const parsed = parse(source, errors, { allowTrailingComma: true }) as
    | { compilerOptions?: { paths?: Record<string, unknown> } }
    | undefined;
  if (errors.length > 0) return false;
  const alias = parsed?.compilerOptions?.paths?.["@/*"];
  return Array.isArray(alias) && alias.length === 1 && alias[0] === "./resources/js/*";
}

function inspectInertiaEntry(source: string | undefined): boolean {
  if (!source) return false;
  const module = parseSourceModule(source);
  return Boolean(
    module &&
    !module.hasRegularExpression &&
    hasAstSoleNamedImport(module, "@inertiajs/vue3", "createInertiaApp") &&
    countAstTopLevelDirectCalls(module, "createInertiaApp") === 1,
  );
}

function inspectLaravelViteConfig(
  source: string | undefined,
  entry: LaravelInertiaVueProjectPlan["entry"],
): boolean {
  if (!source) return false;
  const module = parseSourceModule(source);
  if (!module || module.hasRegularExpression) return false;
  const config = getAstDefaultExportCallObject(module, "defineConfig");
  if (!config || hasAstEscapedObjectKey(module, config)) return false;
  const pluginsProperty = getAstObjectProperty(config, "plugins", { allowStringKey: true });
  if (pluginsProperty.status !== "found") return false;
  const plugins = asAstArrayExpression(pluginsProperty.value);
  if (!plugins) return false;

  const laravel = getAstDefaultImportBinding(module, "laravel-vite-plugin");
  const inertia = getAstDefaultImportBinding(module, "@inertiajs/vite");
  const tailwind = getAstDefaultImportBinding(module, "@tailwindcss/vite");
  const vue = getAstDefaultImportBinding(module, "@vitejs/plugin-vue");
  if (
    laravel.status !== "found" ||
    inertia.status !== "found" ||
    tailwind.status !== "found" ||
    vue.status !== "found" ||
    !hasAstDirectCall(plugins, inertia.localName) ||
    !hasAstDirectCall(plugins, tailwind.localName) ||
    !hasAstDirectCall(plugins, vue.localName)
  ) {
    return false;
  }

  const laravelCall = getAstDirectCall(plugins, laravel.localName);
  if (!laravelCall || laravelCall.arguments.length !== 1) return false;
  const laravelOptions = asAstObjectExpression(laravelCall.arguments[0]!);
  if (!laravelOptions || hasAstEscapedObjectKey(module, laravelOptions)) return false;
  const inputProperty = getAstObjectProperty(laravelOptions, "input", { allowStringKey: true });
  if (inputProperty.status !== "found") return false;
  const input = asAstArrayExpression(inputProperty.value);
  if (!input || input.elements.length !== 2 || input.elements.some((value) => value === null)) {
    return false;
  }
  const inputs = input.elements.map((value) => getAstStringValue(value!));
  if (inputs.some((value) => value === undefined)) return false;
  return new Set(inputs).size === 2 && inputs.includes(HOST_CSS) && inputs.includes(entry);
}

function isRecognizedHostCss(source: string, knownModules?: readonly string[]): boolean {
  const prelude = knownModules ? { modules: knownModules } : getCssImportPrelude(source);
  if (!prelude) return false;
  const code = stripCssComments(source);
  return (
    prelude.modules.includes("tailwindcss") &&
    prelude.modules.includes("tw-animate-css") &&
    /@custom-variant\s+dark\b/.test(code) &&
    /@theme(?:\s+inline)?\s*\{/.test(code)
  );
}

function getCssImportPrelude(source: string): { end: number; modules: string[] } | undefined {
  let index = skipCssTrivia(source, 0);
  let importEnd = -1;
  const modules: string[] = [];
  while (source.startsWith("@import", index) && !/[\w-]/.test(source[index + 7] ?? "")) {
    const statementEnd = findCssStatementEnd(source, index + 7);
    if (statementEnd < 0) return undefined;
    const statement = source.slice(index, statementEnd + 1);
    const match = /^@import\s+(["'])([^"'\\\r\n]+)\1\s*;$/.exec(statement.trim());
    if (!match) return undefined;
    modules.push(match[2]!);
    importEnd = statementEnd + 1;
    index = skipCssTrivia(source, importEnd);
  }
  return importEnd < 0 ? undefined : { end: importEnd, modules };
}

function findCssStatementEnd(source: string, start: number): number {
  let quote: '"' | "'" | undefined;
  for (let index = start; index < source.length; index += 1) {
    const character = source[index]!;
    if (quote) {
      if (character === "\\") index += 1;
      else if (character === quote) quote = undefined;
      continue;
    }
    if (character === '"' || character === "'") quote = character;
    else if (character === ";") return index;
    else if (character === "{" || character === "}") return -1;
  }
  return -1;
}

function skipCssTrivia(source: string, start: number): number {
  let index = start;
  while (index < source.length) {
    while (index < source.length && /\s/.test(source[index] ?? "")) index += 1;
    if (!source.startsWith("/*", index)) break;
    const close = source.indexOf("*/", index + 2);
    if (close < 0) return source.length;
    index = close + 2;
  }
  return index;
}

function countOccurrences(source: string, needle: string): number {
  return source.split(needle).length - 1;
}

function getDependencies(pkg: ProjectPackage): Record<string, string> {
  return {
    ...pkg.peerDependencies,
    ...pkg.optionalDependencies,
    ...pkg.devDependencies,
    ...pkg.dependencies,
  };
}

function stripCssComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "");
}
