import fs from "fs-extra";
import semver from "semver";

import { resolveProjectMutationPath } from "./project-path.js";
import {
  asAstArrayExpression,
  asAstArrowFunctionExpression,
  asAstObjectExpression,
  getAstBooleanValue,
  getAstDefaultExportCall,
  getAstDefaultImportBinding,
  getAstIdentifierName,
  getAstNodeRange,
  getAstObjectProperty,
  getAstStringValue,
  hasAstSoleNamedImport,
  hasOnlyAstBareObjectKeys,
  parseSourceModule,
  type AstArrayExpression,
  type AstNode,
  type AstObjectExpression,
  type ParsedSourceModule,
  type SourceRange,
} from "./source-shape.js";
import { meetsVueVersionFloor } from "./vue-project.js";

export const QUASAR_PROJECT_CANDIDATE_PATHS = [
  "quasar.config.ts",
  "quasar.config.js",
  "quasar.config.mjs",
  "quasar.config.cjs",
  "src/App.vue",
  "src/router",
  "src/layouts",
  "src/pages",
  "src/css",
  "src-ssr",
  "src-ssg",
  "src-pwa",
  "src-bex",
  "src-cordova",
  "src-capacitor",
  "src-electron",
] as const;

const SUPPORTED_CONFIGS = ["quasar.config.ts", "quasar.config.js"] as const;
const MODE_FOLDERS = [
  "src-ssr",
  "src-ssg",
  "src-pwa",
  "src-bex",
  "src-cordova",
  "src-capacitor",
  "src-electron",
] as const;
const SHARED_LAYOUT = ["src/App.vue", "src/router", "src/layouts", "src/pages", "src/css"] as const;
const STARWIND_CSS_ENTRY = "starwind.css";
const TAILWIND_TUPLE = '["@tailwindcss/vite", {}, { server: true, client: true }]';
const MANUAL_ACTION =
  "This Quasar project needs manual action. Expected Quasar CLI with @quasar/app-vite v3, one static #q-app defineConfig callback, and a supported SPA or SSR source layout.";

export type QuasarProjectEvidence = Readonly<{
  existingPaths: ReadonlySet<string>;
  projectFiles?: Readonly<Record<string, string>>;
}>;

type ProjectPackage = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

export type QuasarProjectPlan = Readonly<{
  componentDir: "src/components/starwind";
  cssFile: "src/css/starwind.css";
  kind: "quasar";
  mode: "spa" | "ssr";
  quasarConfig: "quasar.config.ts" | "quasar.config.js";
  utilsDir: "src/lib/utils";
  vueUpgradeRequired: boolean;
}>;

export function getQuasarProjectPlan(
  pkg: ProjectPackage,
  evidence: QuasarProjectEvidence,
): QuasarProjectPlan | undefined {
  const dependencies = getDependencies(pkg);
  if (!hasQuasarProjectEvidence(pkg, evidence)) return undefined;

  const configs = SUPPORTED_CONFIGS.filter((path) => evidence.existingPaths.has(path));
  const hasAlternateConfig = ["quasar.config.mjs", "quasar.config.cjs"].some((path) =>
    evidence.existingPaths.has(path),
  );
  const modes = MODE_FOLDERS.filter((path) => evidence.existingPaths.has(path));
  const hasUnsupportedMode = modes.some((path) => path !== "src-ssr");
  const hasSharedLayout = SHARED_LAYOUT.every((path) => evidence.existingPaths.has(path));
  const config = configs[0];
  const source = config ? evidence.projectFiles?.[config] : undefined;

  if (
    !dependencies.quasar ||
    !dependencies.vue ||
    !isAppViteV3(dependencies["@quasar/app-vite"]) ||
    Boolean(dependencies["@quasar/app-webpack"]) ||
    configs.length !== 1 ||
    hasAlternateConfig ||
    !hasSharedLayout ||
    hasUnsupportedMode ||
    modes.length > 1 ||
    !source ||
    updateQuasarConfigContent(source) === null
  ) {
    throw new Error(MANUAL_ACTION);
  }

  return Object.freeze({
    componentDir: "src/components/starwind",
    cssFile: "src/css/starwind.css",
    kind: "quasar",
    mode: modes[0] === "src-ssr" ? "ssr" : "spa",
    quasarConfig: config!,
    utilsDir: "src/lib/utils",
    vueUpgradeRequired: !meetsVueVersionFloor(dependencies.vue),
  });
}

export function hasQuasarProjectEvidence(
  pkg: ProjectPackage,
  evidence: QuasarProjectEvidence,
): boolean {
  const dependencies = getDependencies(pkg);
  return (
    Boolean(dependencies["@quasar/app-vite"]) ||
    [...SUPPORTED_CONFIGS, "quasar.config.mjs", "quasar.config.cjs", ...MODE_FOLDERS].some((path) =>
      evidence.existingPaths.has(path),
    )
  );
}

export async function validateQuasarProjectSetup(plan: QuasarProjectPlan): Promise<void> {
  const source = await fs.readFile(plan.quasarConfig, "utf8");
  if (updateQuasarConfigContent(source) === null) throw new Error(getUnsafeConfigDiagnostic());
}

export async function setupQuasarProject(plan: QuasarProjectPlan, cssFile: string): Promise<void> {
  if (cssFile !== plan.cssFile) {
    throw new Error(`${MANUAL_ACTION} Use the plan-owned stylesheet path ${plan.cssFile}.`);
  }
  const source = await fs.readFile(plan.quasarConfig, "utf8");
  const updated = updateQuasarConfigContent(source);
  if (updated === null) {
    throw new Error(`${getUnsafeConfigDiagnostic()} The config changed after preflight.`);
  }
  if (updated !== source) {
    await fs.writeFile(await resolveProjectMutationPath(plan.quasarConfig), updated, "utf8");
  }
}

export function updateQuasarConfigContent(source: string): string | null {
  const module = parseSourceModule(source);
  if (!module) return null;
  const shape = getQuasarConfigShape(module);
  if (!shape) return null;
  const edits: TextEdit[] = [];

  if (!shape.css) {
    addObjectPropertyEdit(
      edits,
      source,
      shape.config,
      `css: [${JSON.stringify(STARWIND_CSS_ENTRY)}]`,
    );
  } else if (!hasCanonicalCssEntry(shape.css)) {
    addArrayEntryEdit(edits, shape.css, JSON.stringify(STARWIND_CSS_ENTRY));
  }
  if (!shape.build) {
    addObjectPropertyEdit(
      edits,
      source,
      shape.config,
      `build: { vitePlugins: [${TAILWIND_TUPLE}] }`,
    );
  } else if (!shape.plugins) {
    addObjectPropertyEdit(edits, source, shape.build, `vitePlugins: [${TAILWIND_TUPLE}]`);
  } else if (!shape.hasTailwindPlugin) {
    addArrayEntryEdit(edits, shape.plugins, TAILWIND_TUPLE);
  }
  return applyTextEdits(source, edits);
}

type QuasarConfigShape = {
  build?: AstObjectExpression;
  config: AstObjectExpression;
  css?: AstArrayExpression;
  hasTailwindPlugin: boolean;
  plugins?: AstArrayExpression;
};

type TextEdit = SourceRange & { text: string };

function getQuasarConfigShape(module: ParsedSourceModule): QuasarConfigShape | undefined {
  if (module.hasRegularExpression) return undefined;
  const config = getQuasarCallbackObject(module);
  if (!config || !hasOnlyAstBareObjectKeys(module, config)) return undefined;

  const cssProperty = getAstObjectProperty(config, "css");
  if (cssProperty.status === "unsafe") return undefined;
  let css: AstArrayExpression | undefined;
  if (cssProperty.status === "found") {
    css = asAstArrayExpression(cssProperty.value);
    if (!css || !hasSafeCssEntries(css)) return undefined;
  }

  const buildProperty = getAstObjectProperty(config, "build");
  if (buildProperty.status === "unsafe") return undefined;
  if (buildProperty.status === "missing") {
    return { config, css, hasTailwindPlugin: false };
  }
  const build = asAstObjectExpression(buildProperty.value);
  if (!build || !hasOnlyAstBareObjectKeys(module, build)) return undefined;
  const pluginsProperty = getAstObjectProperty(build, "vitePlugins");
  if (pluginsProperty.status === "unsafe") return undefined;
  if (pluginsProperty.status === "missing") {
    return { build, config, css, hasTailwindPlugin: false };
  }
  const plugins = asAstArrayExpression(pluginsProperty.value);
  if (!plugins) return undefined;
  const pluginState = inspectVitePlugins(module, plugins);
  return pluginState.safe
    ? { build, config, css, hasTailwindPlugin: pluginState.hasTailwind, plugins }
    : undefined;
}

function getQuasarCallbackObject(module: ParsedSourceModule): AstObjectExpression | undefined {
  if (!hasAstSoleNamedImport(module, "#q-app", "defineConfig")) return undefined;
  const call = getAstDefaultExportCall(module, "defineConfig");
  if (!call || call.arguments.length !== 1) return undefined;
  const callback = asAstArrowFunctionExpression(call.arguments[0]!);
  if (!callback || callback.async || callback.params.length > 1) return undefined;
  if (callback.params[0] && getAstIdentifierName(callback.params[0]) === undefined)
    return undefined;
  const expressionObject = asAstObjectExpression(callback.body);
  if (expressionObject) return expressionObject;
  if (callback.body.type !== "BlockStatement") return undefined;
  const statements = (callback.body as AstNode & { body: AstNode[] }).body;
  if (statements.length !== 1 || statements[0]!.type !== "ReturnStatement") return undefined;
  const returned = (statements[0] as AstNode & { argument?: AstNode }).argument;
  return returned ? asAstObjectExpression(returned) : undefined;
}

function hasSafeCssEntries(css: AstArrayExpression): boolean {
  if (
    css.elements.some((element) => element === null || getAstStringValue(element) === undefined)
  ) {
    return false;
  }
  const values = css.elements.map((element) => getAstStringValue(element!));
  const starwind = values.filter((value) => value && /(?:^|\/)starwind\.css$/.test(value));
  return starwind.length === 0 || (starwind.length === 1 && values[0] === STARWIND_CSS_ENTRY);
}

function hasCanonicalCssEntry(css: AstArrayExpression): boolean {
  return Boolean(css.elements[0] && getAstStringValue(css.elements[0]!) === STARWIND_CSS_ENTRY);
}

function inspectVitePlugins(
  module: ParsedSourceModule,
  plugins: AstArrayExpression,
): { hasTailwind: boolean; safe: boolean } {
  const tailwindImport = getAstDefaultImportBinding(module, "@tailwindcss/vite");
  if (tailwindImport.status === "unsafe") return { hasTailwind: false, safe: false };
  const tailwindName = tailwindImport.status === "found" ? tailwindImport.localName : undefined;
  let tailwindEntries = 0;

  for (const entry of plugins.elements) {
    if (!entry) return { hasTailwind: false, safe: false };
    if (entry.type === "CallExpression") {
      const name = getAstIdentifierName((entry as AstNode & { callee: AstNode }).callee);
      if (!name) return { hasTailwind: false, safe: false };
      if (tailwindName && name === tailwindName) tailwindEntries += 1;
      continue;
    }
    const tuple = asAstArrayExpression(entry);
    if (!tuple || tuple.elements.length < 2 || tuple.elements.length > 3) {
      return { hasTailwind: false, safe: false };
    }
    if (tuple.elements.some((item) => item === null)) {
      return { hasTailwind: false, safe: false };
    }
    const pluginNode = tuple.elements[0]!;
    const pluginName = getAstStringValue(pluginNode) ?? getAstIdentifierName(pluginNode);
    const options = asAstObjectExpression(tuple.elements[1]!);
    if (
      !pluginName ||
      !options ||
      getAstObjectProperty(options, "__shape_check__").status === "unsafe"
    ) {
      return { hasTailwind: false, safe: false };
    }
    const isTailwind = pluginName === "@tailwindcss/vite" || pluginName === tailwindName;
    const threadOptions = tuple.elements[2];
    if (threadOptions) {
      const threads = asAstObjectExpression(threadOptions);
      if (!threads || getAstObjectProperty(threads, "__shape_check__").status === "unsafe") {
        return { hasTailwind: false, safe: false };
      }
      if (isTailwind && !hasBothThreads(threads)) {
        return { hasTailwind: false, safe: false };
      }
    }
    if (isTailwind) tailwindEntries += 1;
  }
  return { hasTailwind: tailwindEntries === 1, safe: tailwindEntries <= 1 };
}

function hasBothThreads(options: AstObjectExpression): boolean {
  const server = getAstObjectProperty(options, "server", { allowStringKey: true });
  const client = getAstObjectProperty(options, "client", { allowStringKey: true });
  return (
    server.status === "found" &&
    client.status === "found" &&
    getAstBooleanValue(server.value) === true &&
    getAstBooleanValue(client.value) === true
  );
}

function addObjectPropertyEdit(
  edits: TextEdit[],
  source: string,
  object: AstObjectExpression,
  property: string,
): void {
  const range = getAstNodeRange(object)!;
  const indent = getObjectIndent(source, range);
  edits.push({
    end: range.start + 1,
    start: range.start + 1,
    text: `\n${indent}${property},`,
  });
}

function addArrayEntryEdit(edits: TextEdit[], array: AstArrayExpression, entry: string): void {
  const range = getAstNodeRange(array)!;
  edits.push({ end: range.start + 1, start: range.start + 1, text: `${entry}, ` });
}

function getObjectIndent(source: string, object: SourceRange): string {
  const after = source.slice(object.start + 1, object.end - 1);
  const existing = /\n([ \t]+)\S/.exec(after)?.[1];
  if (existing) return existing;
  const lineStart = source.lastIndexOf("\n", object.end - 1) + 1;
  const closingIndent = /^\s*/.exec(source.slice(lineStart, object.end - 1))?.[0] ?? "";
  return closingIndent + "  ";
}

function applyTextEdits(source: string, edits: TextEdit[]): string {
  return [...edits]
    .sort((left, right) => right.start - left.start)
    .reduce(
      (result, edit) => result.slice(0, edit.start) + edit.text + result.slice(edit.end),
      source,
    );
}

function isAppViteV3(range: string | undefined): boolean {
  if (!range || /^(?:file|link|portal|workspace):/i.test(range)) return false;
  try {
    const minimum = semver.minVersion(range);
    return Boolean(minimum && minimum.major === 3 && semver.subset(range, ">=3.0.0 <4.0.0"));
  } catch {
    return false;
  }
}

function getDependencies(pkg: ProjectPackage): Record<string, string> {
  return {
    ...pkg.peerDependencies,
    ...pkg.optionalDependencies,
    ...pkg.devDependencies,
    ...pkg.dependencies,
  };
}

function getUnsafeConfigDiagnostic(): string {
  return "This Quasar config needs manual action. Expected a static #q-app defineConfig callback with literal css, build, and build.vitePlugins shapes.";
}
