import fs from "fs-extra";
import semver from "semver";

import { resolveProjectMutationPath } from "./project-path.js";
import {
  asAstArrayExpression,
  asAstObjectExpression,
  getAstBooleanValue,
  getAstDefaultExportCallObject,
  getAstDefaultImportBinding,
  getAstNodeRange,
  getAstObjectProperty,
  getAstStringValue,
  getAvailableIdentifier,
  hasAstDirectCall,
  hasAstEscapedObjectKey,
  hasAstObjectProperty,
  hasOnlyAstDirectCalls,
  parseSourceModule,
  type AstArrayExpression,
  type AstObjectExpression,
  type ParsedSourceModule,
  type SourceRange,
} from "./source-shape.js";
import { meetsVueVersionFloor } from "./vue-project.js";

type ProjectPackage = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

export type NuxtProjectPlan = Readonly<{
  componentDir: string;
  cssFile: string;
  kind: "nuxt";
  nuxtConfig: "nuxt.config.ts";
  nuxtMajor: 3 | 4;
  utilsDir: string;
  vueUpgradeRequired: boolean;
}>;

export const NUXT_PROJECT_CANDIDATE_PATHS = [
  "nuxt.config.ts",
  "nuxt.config.js",
  "nuxt.config.mjs",
  "nuxt.config.cjs",
  "nuxt.config.mts",
  "nuxt.config.cts",
  "app/app.vue",
  "app.vue",
] as const;

const STARWIND_CSS_ENTRY = "~/assets/css/starwind.css";
const NUXT_COMPONENTS_DIRECTORY = "~/components";
const STARWIND_COMPONENT_IGNORES = ["starwind/**/*.ts", "starwind-primitives/**/*.ts"] as const;
const MANUAL_ACTION =
  "This Nuxt project needs manual action. Starwind supports only the official Nuxt 4 app/app.vue layout or the bounded Nuxt 3 root app.vue layout with a static root nuxt.config.ts.";

export function getNuxtProjectPlan(
  pkg: ProjectPackage,
  existingPaths: ReadonlySet<string>,
): NuxtProjectPlan | undefined {
  const dependencies = getDependencies(pkg);
  if (!dependencies.nuxt) return undefined;
  const nuxtMajor = getSupportedNuxtMajor(dependencies.nuxt);
  if (!nuxtMajor) {
    throw new Error(MANUAL_ACTION + " Declare Nuxt major 3 or 4 with a semver range.");
  }

  const hasTypeScriptConfig = existingPaths.has("nuxt.config.ts");
  const hasAlternateConfig = NUXT_PROJECT_CANDIDATE_PATHS.some(
    (candidate) =>
      candidate.startsWith("nuxt.config.") &&
      candidate !== "nuxt.config.ts" &&
      existingPaths.has(candidate),
  );
  const hasNuxt3Root = existingPaths.has("app.vue");
  const hasNuxt4App = existingPaths.has("app/app.vue");
  const layoutMatches =
    nuxtMajor === 4 ? hasNuxt4App && !hasNuxt3Root : hasNuxt3Root && !hasNuxt4App;
  if (!hasTypeScriptConfig || hasAlternateConfig || !layoutMatches) {
    throw new Error(MANUAL_ACTION);
  }

  const sourceRoot = nuxtMajor === 4 ? "app/" : "";
  return Object.freeze({
    componentDir: sourceRoot + "components/starwind",
    cssFile: sourceRoot + "assets/css/starwind.css",
    kind: "nuxt",
    nuxtConfig: "nuxt.config.ts",
    nuxtMajor,
    utilsDir: sourceRoot + "lib/utils",
    vueUpgradeRequired: !dependencies.vue || !meetsVueVersionFloor(dependencies.vue),
  });
}

export async function validateNuxtProjectSetup(plan: NuxtProjectPlan): Promise<void> {
  const source = await fs.readFile(plan.nuxtConfig, "utf8");
  if (!updateNuxtConfigContent(source)) throw new Error(getUnsafeConfigDiagnostic());
}

export async function setupNuxtProject(plan: NuxtProjectPlan, cssFile: string): Promise<void> {
  if (cssFile !== plan.cssFile) {
    throw new Error(
      "This Nuxt project needs manual action. Use the plan-owned stylesheet path " +
        plan.cssFile +
        ".",
    );
  }
  const source = await fs.readFile(plan.nuxtConfig, "utf8");
  const updated = updateNuxtConfigContent(source);
  if (!updated) {
    throw new Error(getUnsafeConfigDiagnostic() + " The config changed after preflight.");
  }
  if (updated !== source) {
    await fs.writeFile(await resolveProjectMutationPath(plan.nuxtConfig), updated, "utf8");
  }
}

export function updateNuxtConfigContent(source: string): string | null {
  const module = parseSourceModule(source);
  if (!module) return null;
  const shape = getNuxtConfigShape(module);
  if (!shape) return null;
  const tailwindImport = getAstDefaultImportBinding(module, "@tailwindcss/vite");
  if (tailwindImport.status === "unsafe") return null;
  const tailwindName =
    tailwindImport.status === "found"
      ? tailwindImport.localName
      : getAvailableIdentifier(
          source,
          ["tailwindcss", "starwindTailwindcss"],
          "starwindTailwindcss",
        );

  const edits: TextEdit[] = [];
  if (tailwindImport.status === "missing") {
    edits.push({
      end: 0,
      start: 0,
      text: `import ${tailwindName} from "@tailwindcss/vite";\n`,
    });
  }
  addNuxtComponentsEdits(edits, shape);
  if (!shape.css) {
    addObjectPropertyEdit(edits, shape.config, `css: [${JSON.stringify(STARWIND_CSS_ENTRY)}]`, 2);
  } else if (!hasStringEntry(shape.css, STARWIND_CSS_ENTRY)) {
    addArrayEntryEdit(edits, shape.css, JSON.stringify(STARWIND_CSS_ENTRY));
  }
  if (!shape.vite) {
    addObjectPropertyEdit(edits, shape.config, `vite: { plugins: [${tailwindName}()] }`, 2);
  } else if (!shape.plugins) {
    addObjectPropertyEdit(edits, shape.vite, `plugins: [${tailwindName}()]`, 4);
  } else if (!hasAstDirectCall(shape.plugins, tailwindName)) {
    addArrayEntryEdit(edits, shape.plugins, `${tailwindName}()`);
  }
  return applyTextEdits(source, edits);
}

type NuxtConfigShape = {
  components: NuxtComponentsShape;
  config: AstObjectExpression;
  css?: AstArrayExpression;
  plugins?: AstArrayExpression;
  vite?: AstObjectExpression;
};

type NuxtComponentsShape =
  | { kind: "missing" }
  | { kind: "replace-array"; range: SourceRange }
  | { kind: "replace-entry"; range: SourceRange }
  | { ignore?: AstArrayExpression; kind: "object"; object: AstObjectExpression };

type TextEdit = SourceRange & { text: string };

function getNuxtConfigShape(module: ParsedSourceModule): NuxtConfigShape | undefined {
  if (module.hasRegularExpression) return undefined;
  const config = getAstDefaultExportCallObject(module, "defineNuxtConfig");
  if (!config || hasAstEscapedObjectKey(module, config)) return undefined;
  if (
    ["srcDir", "rootDir", "dir", "extends", "builder", "webpack", "rspack"].some((name) =>
      hasAstObjectProperty(config, name, { allowStringKey: true }),
    )
  ) {
    return undefined;
  }

  const components = getNuxtComponentsShape(module, config);
  if (!components) return undefined;

  const cssProperty = getAstObjectProperty(config, "css");
  if (cssProperty.status === "unsafe") return undefined;
  let css: AstArrayExpression | undefined;
  if (cssProperty.status === "found") {
    css = asAstArrayExpression(cssProperty.value);
    if (!css || !hasOnlyStaticStrings(css) || hasIncompatibleStarwindCssEntry(css)) {
      return undefined;
    }
  }

  const viteProperty = getAstObjectProperty(config, "vite");
  if (viteProperty.status === "unsafe") return undefined;
  if (viteProperty.status === "missing") return { components, config, css };
  const vite = asAstObjectExpression(viteProperty.value);
  if (!vite || hasAstEscapedObjectKey(module, vite)) return undefined;
  const pluginsProperty = getAstObjectProperty(vite, "plugins");
  if (pluginsProperty.status === "unsafe") return undefined;
  if (pluginsProperty.status === "missing") return { components, config, css, vite };
  const plugins = asAstArrayExpression(pluginsProperty.value);
  if (!plugins || !hasOnlyAstDirectCalls(plugins)) return undefined;
  return { components, config, css, plugins, vite };
}

function getNuxtComponentsShape(
  module: ParsedSourceModule,
  config: AstObjectExpression,
): NuxtComponentsShape | undefined {
  const property = getAstObjectProperty(config, "components");
  if (property.status === "unsafe") return undefined;
  if (property.status === "missing") return { kind: "missing" };

  if (getAstBooleanValue(property.value) === true) {
    const range = getAstNodeRange(property.value);
    return range ? { kind: "replace-array", range } : undefined;
  }

  const array = asAstArrayExpression(property.value);
  if (!array) return undefined;
  let normalDirectory:
    | { kind: "replace-entry"; range: SourceRange }
    | { ignore?: AstArrayExpression; kind: "object"; object: AstObjectExpression }
    | undefined;

  for (const element of array.elements) {
    if (!element) return undefined;
    const stringPath = getAstStringValue(element);
    if (stringPath !== undefined) {
      if (stringPath !== NUXT_COMPONENTS_DIRECTORY) continue;
      if (normalDirectory) return undefined;
      const range = getAstNodeRange(element);
      if (!range) return undefined;
      normalDirectory = { kind: "replace-entry", range };
      continue;
    }

    const object = asAstObjectExpression(element);
    if (!object || hasAstEscapedObjectKey(module, object)) return undefined;
    const pathProperty = getAstObjectProperty(object, "path");
    if (pathProperty.status !== "found") return undefined;
    const path = getAstStringValue(pathProperty.value);
    if (path === undefined) return undefined;
    if (path !== NUXT_COMPONENTS_DIRECTORY) continue;
    if (normalDirectory) return undefined;

    const ignoreProperty = getAstObjectProperty(object, "ignore");
    if (ignoreProperty.status === "unsafe") return undefined;
    let ignore: AstArrayExpression | undefined;
    if (ignoreProperty.status === "found") {
      ignore = asAstArrayExpression(ignoreProperty.value);
      if (!ignore || !hasOnlyStaticStrings(ignore)) return undefined;
    }
    normalDirectory = { ignore, kind: "object", object };
  }

  if (!normalDirectory) return undefined;
  return normalDirectory;
}

function addNuxtComponentsEdits(edits: TextEdit[], shape: NuxtConfigShape): void {
  const entry = `{ path: ${JSON.stringify(NUXT_COMPONENTS_DIRECTORY)}, ignore: [${STARWIND_COMPONENT_IGNORES.map((glob) => JSON.stringify(glob)).join(", ")}] }`;
  if (shape.components.kind === "missing") {
    addObjectPropertyEdit(edits, shape.config, `components: [${entry}]`, 2);
    return;
  }
  if (shape.components.kind === "replace-array") {
    edits.push({ ...shape.components.range, text: `[${entry}]` });
    return;
  }
  if (shape.components.kind === "replace-entry") {
    edits.push({ ...shape.components.range, text: entry });
    return;
  }
  if (!shape.components.ignore) {
    addObjectPropertyEdit(
      edits,
      shape.components.object,
      `ignore: [${STARWIND_COMPONENT_IGNORES.map((glob) => JSON.stringify(glob)).join(", ")}]`,
      4,
    );
    return;
  }
  for (const glob of STARWIND_COMPONENT_IGNORES) {
    if (!hasStringEntry(shape.components.ignore, glob)) {
      addArrayEntryEdit(edits, shape.components.ignore, JSON.stringify(glob));
    }
  }
}

function hasOnlyStaticStrings(array: AstArrayExpression): boolean {
  return array.elements.every(
    (element) => element !== null && getAstStringValue(element) !== undefined,
  );
}

function hasIncompatibleStarwindCssEntry(array: AstArrayExpression): boolean {
  return array.elements.some((element) => {
    if (!element) return false;
    const value = getAstStringValue(element);
    return Boolean(value && /(?:^|\/)starwind\.css$/.test(value) && value !== STARWIND_CSS_ENTRY);
  });
}

function hasStringEntry(array: AstArrayExpression, expected: string): boolean {
  return array.elements.some((element) =>
    Boolean(element && getAstStringValue(element) === expected),
  );
}

function addObjectPropertyEdit(
  edits: TextEdit[],
  object: AstObjectExpression,
  property: string,
  spaces: number,
): void {
  const range = getAstNodeRange(object)!;
  edits.push({
    end: range.start + 1,
    start: range.start + 1,
    text: `\n${" ".repeat(spaces)}${property},`,
  });
}

function addArrayEntryEdit(edits: TextEdit[], array: AstArrayExpression, entry: string): void {
  const range = getAstNodeRange(array)!;
  edits.push({ end: range.start + 1, start: range.start + 1, text: `${entry}, ` });
}

function applyTextEdits(source: string, edits: TextEdit[]): string {
  return [...edits]
    .sort((left, right) => right.start - left.start)
    .reduce(
      (result, edit) => result.slice(0, edit.start) + edit.text + result.slice(edit.end),
      source,
    );
}

function getSupportedNuxtMajor(range: string): 3 | 4 | undefined {
  if (/^(?:file|link|portal|workspace):/i.test(range)) return undefined;
  try {
    const minimum = semver.minVersion(range);
    if (!minimum) return undefined;
    if (minimum.major === 3 && semver.subset(range, ">=3.0.0 <4.0.0")) return 3;
    if (minimum.major === 4 && semver.subset(range, ">=4.0.0 <5.0.0")) return 4;
    return undefined;
  } catch {
    return undefined;
  }
}

function getUnsafeConfigDiagnostic(): string {
  return "This Nuxt config needs manual action. Expected export default defineNuxtConfig({ ... }) with static literal css, vite, and vite.plugins shapes.";
}

function getDependencies(pkg: ProjectPackage): Record<string, string> {
  return {
    ...pkg.peerDependencies,
    ...pkg.optionalDependencies,
    ...pkg.devDependencies,
    ...pkg.dependencies,
  };
}
