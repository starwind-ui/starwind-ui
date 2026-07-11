import path from "node:path";

import * as p from "@clack/prompts";
import fs from "fs-extra";

import { fileExists } from "./fs.js";
import { highlighter } from "./highlighter.js";
import { resolveProjectMutationPath } from "./project-path.js";

const VITE_CONFIG_PATHS = [
  "vite.config.ts",
  "vite.config.js",
  "vite.config.mts",
  "vite.config.mjs",
] as const;

const REACT_ENTRY_PATHS = ["src/main.tsx", "src/main.jsx", "src/main.ts", "src/main.js"] as const;

const THEME_PLUGIN = `function starwindThemeInitPlugin() {
  return {
    name: "starwind-theme-init",
    transformIndexHtml() {
      return [
        {
          tag: "script",
          attrs: { "data-starwind-theme-init": "" },
          children: getThemeInitScript(),
          injectTo: "head-prepend",
        },
      ];
    },
  };
}`;

export function updateViteConfigContent(content: string): string | null {
  if (!/export\s+default\s+defineConfig\s*\(\s*\{/.test(content)) return null;

  let next = content;

  if (!next.includes('from "@tailwindcss/vite"') && !next.includes("from '@tailwindcss/vite'")) {
    next = `import tailwindcss from "@tailwindcss/vite";\n${next}`;
  }

  if (
    !next.includes('from "@starwind-ui/react/theme"') &&
    !next.includes("from '@starwind-ui/react/theme'")
  ) {
    next = `import { getThemeInitScript } from "@starwind-ui/react/theme";\n${next}`;
  }

  if (!next.includes('from "node:url"') && !next.includes("from 'node:url'")) {
    next = `import { fileURLToPath } from "node:url";\n${next}`;
  } else if (!next.includes("fileURLToPath")) {
    return null;
  }

  if (!next.includes("function starwindThemeInitPlugin()")) {
    next = next.replace(
      /export\s+default\s+defineConfig/,
      `${THEME_PLUGIN}\n\nexport default defineConfig`,
    );
  }

  const pluginsMatch = next.match(/plugins\s*:\s*\[/);
  if (!pluginsMatch || pluginsMatch.index === undefined) return null;

  const pluginInsertAt = pluginsMatch.index + pluginsMatch[0].length;
  const pluginsToAdd = [
    !next.includes("starwindThemeInitPlugin(),") ? "starwindThemeInitPlugin()" : null,
    !next.includes("tailwindcss(),") ? "tailwindcss()" : null,
  ].filter((plugin): plugin is string => Boolean(plugin));
  if (pluginsToAdd.length > 0) {
    next = `${next.slice(0, pluginInsertAt)}${pluginsToAdd.join(", ")}, ${next.slice(pluginInsertAt)}`;
  }

  if (!next.includes('"@": fileURLToPath(new URL("./src", import.meta.url))')) {
    const aliasObject = next.match(/alias\s*:\s*\{/);
    if (aliasObject?.index !== undefined) {
      const insertAt = aliasObject.index + aliasObject[0].length;
      next = `${next.slice(0, insertAt)}\n      "@": fileURLToPath(new URL("./src", import.meta.url)),${next.slice(insertAt)}`;
    } else {
      const resolveObject = next.match(/resolve\s*:\s*\{/);
      if (resolveObject?.index !== undefined) {
        const insertAt = resolveObject.index + resolveObject[0].length;
        next = `${next.slice(0, insertAt)}\n    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },${next.slice(insertAt)}`;
      } else {
        next = next.replace(
          /export\s+default\s+defineConfig\s*\(\s*\{/,
          'export default defineConfig({\n  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },',
        );
      }
    }
  }

  return next;
}

export function addReactCssImport(content: string, entryPath: string, cssPath: string): string {
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
