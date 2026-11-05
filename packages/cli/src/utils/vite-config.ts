import path from "node:path";

import * as p from "@clack/prompts";
import fs from "fs-extra";

import { fileExists } from "./fs.js";
import { highlighter } from "./highlighter.js";
import { resolveProjectMutationPath } from "./project-path.js";
import {
  asAstArrayExpression,
  asAstObjectExpression,
  getAstDefaultExportCallObject,
  getAstDefaultExportObject,
  getAstDefaultExportRange,
  getAstDefaultImportBinding,
  getAstNamedImportBinding,
  getAstNodeRange,
  getAstObjectProperty,
  getAvailableIdentifier,
  hasAstDirectCall,
  hasAstTopLevelFunction,
  isAstSourceAliasValue,
  parseSourceModule,
  type AstArrayExpression,
  type AstObjectExpression,
  type ParsedSourceModule,
} from "./source-shape.js";

const VITE_CONFIG_PATHS = [
  "vite.config.ts",
  "vite.config.js",
  "vite.config.mts",
  "vite.config.mjs",
] as const;

const REACT_ENTRY_PATHS = ["src/main.tsx", "src/main.jsx", "src/main.ts", "src/main.js"] as const;

type TextEdit = { end: number; start: number; text: string };

const REACT_THEME_MODULE = "@starwind-ui/react/theme";
const VUE_THEME_MODULE = "@starwind-ui/vue/theme";
const SVELTE_THEME_MODULE = "@starwind-ui/svelte/theme";

export function updateViteConfigContent(content: string): string | null {
  const module = parseSourceModule(content);
  if (!module) return null;
  const shape = getViteConfigShape(module);
  if (!shape) return null;

  const updated = addViteTailwindAndAlias(content, module, shape, false);
  return updated === null ? null : addViteThemeInit(updated, REACT_THEME_MODULE);
}

/** Updates the object-style config emitted by the official Vite Vue starter. */
export function updateVueViteConfigContent(content: string): string | null {
  const module = parseSourceModule(content);
  if (!module) return null;
  const shape = getViteConfigShape(module, { rejectRegularExpression: true });
  if (!shape) return null;

  const vueImport = getAstDefaultImportBinding(module, "@vitejs/plugin-vue");
  if (vueImport.status !== "found" || !hasAstDirectCall(shape.plugins, vueImport.localName)) {
    return null;
  }
  const updated = addViteTailwindAndAlias(content, module, shape, true);
  return updated === null ? null : addViteThemeInit(updated, VUE_THEME_MODULE);
}

/** Updates a Vite Svelte config. The host validates the official Svelte plugin first. */
export function updateSvelteViteConfigContent(content: string): string | null {
  const module = parseSourceModule(content);
  if (!module) return null;
  const shape = getViteConfigShape(module, { allowDirectObject: true });
  if (!shape) return null;

  const updated = addViteTailwindAndAlias(content, module, shape, true);
  return updated === null ? null : addViteThemeInit(updated, SVELTE_THEME_MODULE);
}

/**
 * Adds the Theme prepaint plugin to a Vite config. Vite React, Vue, and Svelte hosts all use this
 * edit, so a saved theme applies before first paint in each of them.
 */
export function addViteThemeInit(content: string, themeModule: string): string | null {
  const module = parseSourceModule(content);
  if (!module) return null;
  const config = getDirectOrDefinedConfig(module);
  const pluginsProperty = config && getAstObjectProperty(config, "plugins");
  const plugins =
    pluginsProperty?.status === "found" ? asAstArrayExpression(pluginsProperty.value) : undefined;
  if (!plugins) return null;

  const themeImport = getAstNamedImportBinding(module, themeModule, "getThemeInitScript");
  if (themeImport.status === "unsafe") return null;
  const themeInitName =
    themeImport.status === "found"
      ? themeImport.localName
      : getAvailableIdentifier(
          content,
          ["getThemeInitScript", "starwindGetThemeInitScript"],
          "starwindGetThemeInitScript",
        );
  const existingThemePlugin = hasAstTopLevelFunction(module, "starwindThemeInitPlugin");
  const themePluginName = existingThemePlugin
    ? "starwindThemeInitPlugin"
    : getAvailableIdentifier(
        content,
        ["starwindThemeInitPlugin", "starwindThemePlugin"],
        "starwindThemePlugin",
      );

  const edits: TextEdit[] = [];
  if (themeImport.status === "missing") {
    const binding =
      themeInitName === "getThemeInitScript"
        ? "getThemeInitScript"
        : `getThemeInitScript as ${themeInitName}`;
    edits.push({
      end: 0,
      start: 0,
      text: `import { ${binding} } from ${JSON.stringify(themeModule)};\n`,
    });
  }
  if (!existingThemePlugin) {
    const exportRange = getAstDefaultExportRange(module);
    if (!exportRange) return null;
    edits.push({
      end: exportRange.start,
      start: exportRange.start,
      text: `${getThemePluginSource(themePluginName, themeInitName)}\n\n`,
    });
  }
  if (!hasAstDirectCall(plugins, themePluginName)) {
    const pluginsRange = getAstNodeRange(plugins);
    if (!pluginsRange) return null;
    edits.push({
      end: pluginsRange.start + 1,
      start: pluginsRange.start + 1,
      text: `${themePluginName}(), `,
    });
  }
  return applyTextEdits(content, edits);
}

function addViteTailwindAndAlias(
  content: string,
  module: ParsedSourceModule,
  shape: ViteConfigShape,
  useGlobalThisUrl: boolean,
): string | null {
  const tailwindImport = getAstDefaultImportBinding(module, "@tailwindcss/vite");
  const fileUrlImport = getAstNamedImportBinding(module, "node:url", "fileURLToPath");
  if (tailwindImport.status === "unsafe" || fileUrlImport.status === "unsafe") return null;

  const tailwindName =
    tailwindImport.status === "found"
      ? tailwindImport.localName
      : getAvailableIdentifier(
          content,
          ["tailwindcss", "starwindTailwindcss"],
          "starwindTailwindcss",
        );
  const fileUrlName =
    fileUrlImport.status === "found"
      ? fileUrlImport.localName
      : getAvailableIdentifier(
          content,
          ["fileURLToPath", "starwindFileURLToPath"],
          "starwindFileURLToPath",
        );
  const aliasState = getSourceAliasState(shape.alias, fileUrlImport, fileUrlName, useGlobalThisUrl);
  if (aliasState === "unsafe") return null;

  const edits: TextEdit[] = [];
  const imports: string[] = [];
  if (tailwindImport.status === "missing") {
    imports.push(`import ${tailwindName} from "@tailwindcss/vite";\n`);
  }
  if (fileUrlImport.status === "missing") {
    const binding =
      fileUrlName === "fileURLToPath" ? "fileURLToPath" : `fileURLToPath as ${fileUrlName}`;
    imports.push(`import { ${binding} } from "node:url";\n`);
  }
  if (imports.length > 0) edits.push({ end: 0, start: 0, text: imports.join("") });

  if (!hasAstDirectCall(shape.plugins, tailwindName)) {
    const pluginsRange = getAstNodeRange(shape.plugins);
    if (!pluginsRange) return null;
    edits.push({
      end: pluginsRange.start + 1,
      start: pluginsRange.start + 1,
      text: `${tailwindName}(), `,
    });
  }
  if (aliasState === "missing") addAliasEdit(edits, shape, fileUrlName, useGlobalThisUrl);
  return applyTextEdits(content, edits);
}

type ViteConfigShape = {
  alias?: AstObjectExpression;
  config: AstObjectExpression;
  plugins: AstArrayExpression;
  resolve?: AstObjectExpression;
};

function getViteConfigShape(
  module: ParsedSourceModule,
  options: { allowDirectObject?: boolean; rejectRegularExpression?: boolean } = {},
): ViteConfigShape | undefined {
  if (options.rejectRegularExpression && module.hasRegularExpression) return undefined;
  const config = options.allowDirectObject
    ? getDirectOrDefinedConfig(module)
    : getAstDefaultExportCallObject(module, "defineConfig");
  if (!config) return undefined;
  const pluginsProperty = getAstObjectProperty(config, "plugins");
  if (pluginsProperty.status !== "found") return undefined;
  const plugins = asAstArrayExpression(pluginsProperty.value);
  if (!plugins) return undefined;

  const resolveProperty = getAstObjectProperty(config, "resolve");
  if (resolveProperty.status === "unsafe") return undefined;
  if (resolveProperty.status === "missing") return { config, plugins };
  const resolve = asAstObjectExpression(resolveProperty.value);
  if (!resolve) return undefined;

  const aliasProperty = getAstObjectProperty(resolve, "alias");
  if (aliasProperty.status === "unsafe") return undefined;
  if (aliasProperty.status === "missing") return { config, plugins, resolve };
  const alias = asAstObjectExpression(aliasProperty.value);
  return alias ? { alias, config, plugins, resolve } : undefined;
}

function getDirectOrDefinedConfig(module: ParsedSourceModule): AstObjectExpression | undefined {
  const defineConfig = getAstNamedImportBinding(module, "vite", "defineConfig");
  return getAstDefaultExportObject(
    module,
    defineConfig.status === "found" ? defineConfig.localName : "defineConfig",
  );
}

function getSourceAliasState(
  alias: AstObjectExpression | undefined,
  fileUrlImport: ReturnType<typeof getAstNamedImportBinding>,
  fileUrlName: string,
  allowGlobalThisUrl: boolean,
): "missing" | "ready" | "unsafe" {
  if (!alias) return "missing";
  const sourceAlias = getAstObjectProperty(alias, "@", { allowStringKey: true });
  if (sourceAlias.status !== "found") return sourceAlias.status;
  if (fileUrlImport.status !== "found") return "unsafe";
  return isAstSourceAliasValue(sourceAlias.value, fileUrlName, { allowGlobalThisUrl })
    ? "ready"
    : "unsafe";
}

function addAliasEdit(
  edits: TextEdit[],
  shape: ViteConfigShape,
  fileUrlName: string,
  useGlobalThis: boolean,
): void {
  const urlName = useGlobalThis ? "globalThis.URL" : "URL";
  const aliasValue = `${fileUrlName}(new ${urlName}("./src", import.meta.url))`;
  const container = shape.alias ?? shape.resolve ?? shape.config;
  const range = getAstNodeRange(container)!;
  const text = shape.alias
    ? `\n      "@": ${aliasValue},`
    : shape.resolve
      ? `\n    alias: { "@": ${aliasValue} },`
      : `\n  resolve: { alias: { "@": ${aliasValue} } },`;
  edits.push({ end: range.start + 1, start: range.start + 1, text });
}

function getThemePluginSource(pluginName: string, themeInitName: string): string {
  return `function ${pluginName}() {
  return {
    name: "starwind-theme-init",
    transformIndexHtml() {
      return [
        {
          tag: "script",
          attrs: { "data-starwind-theme-init": "" },
          children: ${themeInitName}(),
          injectTo: "head-prepend",
        },
      ];
    },
  };
}`;
}

function applyTextEdits(source: string, edits: TextEdit[]): string {
  return [...edits]
    .sort((left, right) => right.start - left.start)
    .reduce(
      (result, edit) => result.slice(0, edit.start) + edit.text + result.slice(edit.end),
      source,
    );
}
export function addReactCssImport(content: string, entryPath: string, cssPath: string): string {
  return addViteCssImport(content, entryPath, cssPath);
}

export function addVueCssImport(content: string, entryPath: string, cssPath: string): string {
  return addViteCssImport(content, entryPath, cssPath);
}

function addViteCssImport(content: string, entryPath: string, cssPath: string): string {
  const relativePath = path.posix.relative(
    path.posix.dirname(entryPath.replace(/\\/g, "/")),
    cssPath.replace(/\\/g, "/"),
  );
  const importPath = relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
  const importStatement = `import ${JSON.stringify(importPath)};`;

  if (content.includes(importStatement)) return content;
  return `${importStatement}\n${content}`;
}

export async function setupReactViteConfig(): Promise<boolean> {
  try {
    const configPath = await findFirstExistingPath(VITE_CONFIG_PATHS);
    if (!configPath) throw new Error("No supported vite.config file was found.");

    const content = await fs.readFile(configPath, "utf8");
    const updated = updateViteConfigContent(content);
    if (!updated) {
      throw new Error(
        "The Vite config shape is not supported automatically. Expected export default defineConfig({ ... }) with a plugins array.",
      );
    }

    if (updated !== content) {
      await fs.writeFile(await resolveProjectMutationPath(configPath), updated, "utf8");
    }
    return true;
  } catch (error) {
    p.log.error(
      highlighter.error(
        `Failed to setup React Vite config: ${error instanceof Error ? error.message : "Unknown error"}`,
      ),
    );
    return false;
  }
}

export async function setupReactCssImport(cssPath: string): Promise<boolean> {
  try {
    const entryPath = await findFirstExistingPath(REACT_ENTRY_PATHS);
    if (!entryPath) throw new Error("No supported React src/main entry file was found.");

    const content = await fs.readFile(entryPath, "utf8");
    const updated = addReactCssImport(content, entryPath, cssPath);
    if (updated !== content) {
      await fs.writeFile(await resolveProjectMutationPath(entryPath), updated, "utf8");
    }
    return true;
  } catch (error) {
    p.log.error(
      highlighter.error(
        `Failed to add the React CSS import: ${error instanceof Error ? error.message : "Unknown error"}`,
      ),
    );
    return false;
  }
}

async function findFirstExistingPath(paths: readonly string[]): Promise<string | null> {
  for (const candidate of paths) {
    if (await fileExists(candidate)) return candidate;
  }
  return null;
}
