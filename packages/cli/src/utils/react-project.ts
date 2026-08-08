import path from "node:path";

import fs from "fs-extra";

import { fileExists } from "./fs.js";
import { resolveProjectMutationPath } from "./project-path.js";
import { addReactCssImport, updateViteConfigContent } from "./vite-config.js";

type ProjectPackage = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

export type ReactHostKind = "next-app" | "next-pages" | "react-router" | "tanstack-start" | "vite";

export type ReactProjectPlan = {
  componentDir: string;
  cssEntry: string;
  cssFile: string;
  kind: ReactHostKind;
  rootEntry?: string;
  sourceRoot: "." | "app" | "src";
  utilsDir: string;
  viteConfig?: string;
};

const VITE_CONFIG_PATHS = [
  "vite.config.ts",
  "vite.config.js",
  "vite.config.mts",
  "vite.config.mjs",
] as const;
const VITE_ENTRY_PATHS = ["src/main.tsx", "src/main.jsx", "src/main.ts", "src/main.js"] as const;
const NEXT_LAYOUT_EXTENSIONS = ["tsx", "jsx", "ts", "js"] as const;
const REACT_ROUTER_CONFIG_PATHS = [
  "react-router.config.ts",
  "react-router.config.js",
  "react-router.config.mts",
  "react-router.config.mjs",
] as const;
const REACT_ROUTER_CSS_PATHS = ["app/app.css", "app/root.css", "app/styles.css"] as const;
const NEXT_PAGES_STYLES_START = "/* Starwind Next.js Pages component styles: start */";
const NEXT_PAGES_STYLES_END = "/* Starwind Next.js Pages component styles: end */";
export const REACT_PROJECT_CANDIDATE_PATHS = [
  ...VITE_CONFIG_PATHS,
  ...VITE_ENTRY_PATHS,
  ...REACT_ROUTER_CONFIG_PATHS,
  ...REACT_ROUTER_CSS_PATHS,
  ...NEXT_LAYOUT_EXTENSIONS.flatMap((extension) => [
    `src/app/layout.${extension}`,
    `app/layout.${extension}`,
    `src/pages/_app.${extension}`,
    `pages/_app.${extension}`,
    `src/pages/_document.${extension}`,
    `pages/_document.${extension}`,
    `app/root.${extension}`,
    `src/routes/__root.${extension}`,
  ]),
  "src/app/globals.css",
  "app/globals.css",
  "src/styles/globals.css",
  "styles/globals.css",
  "src/styles.css",
  "src/app.css",
] as const;

export function getReactProjectPlan(
  pkg: ProjectPackage,
  existingPaths: ReadonlySet<string>,
): ReactProjectPlan {
  const dependencies = {
    ...pkg.peerDependencies,
    ...pkg.optionalDependencies,
    ...pkg.devDependencies,
    ...pkg.dependencies,
  };

  if (dependencies.next) {
    return getNextProjectPlan(existingPaths);
  }

  const reactRouterConfig = findFirstExistingPath(existingPaths, REACT_ROUTER_CONFIG_PATHS);
  if (reactRouterConfig) {
    const rootEntry = findFirstExistingPath(
      existingPaths,
      NEXT_LAYOUT_EXTENSIONS.map((extension) => `app/root.${extension}`),
    );
    const viteConfig = findFirstExistingPath(existingPaths, VITE_CONFIG_PATHS);
    const cssEntry = findFirstExistingPath(existingPaths, REACT_ROUTER_CSS_PATHS);

    if (!rootEntry || !viteConfig || !cssEntry) {
      throw new Error(
        "The React Router framework project is missing a supported Vite config, root route, or global stylesheet.",
      );
    }

    return {
      componentDir: "app/components/starwind",
      cssEntry,
      cssFile: "app/styles/starwind.css",
      kind: "react-router",
      rootEntry,
      sourceRoot: "app",
      utilsDir: "app/lib/utils",
      viteConfig,
    };
  }

  if (dependencies["@tanstack/react-start"]) {
    const rootEntry = findFirstExistingPath(
      existingPaths,
      NEXT_LAYOUT_EXTENSIONS.map((extension) => `src/routes/__root.${extension}`),
    );
    const viteConfig = findFirstExistingPath(existingPaths, VITE_CONFIG_PATHS);
    const cssEntry = findFirstExistingPath(existingPaths, ["src/styles.css", "src/app.css"]);

    if (!rootEntry || !viteConfig || !cssEntry) {
      throw new Error(
        "The TanStack Start project is missing a supported Vite config, root route, or global stylesheet.",
      );
    }

    return {
      componentDir: "src/components/starwind",
      cssEntry,
      cssFile: "src/styles/starwind.css",
      kind: "tanstack-start",
      rootEntry,
      sourceRoot: "src",
      utilsDir: "src/lib/utils",
      viteConfig,
    };
  }

  const viteConfig = findFirstExistingPath(existingPaths, VITE_CONFIG_PATHS);
  const cssEntry = findFirstExistingPath(existingPaths, VITE_ENTRY_PATHS);
  if (viteConfig && cssEntry) {
    return {
      componentDir: "src/components/starwind",
      cssEntry,
      cssFile: "src/styles/starwind.css",
      kind: "vite",
      sourceRoot: "src",
      utilsDir: "src/lib/utils",
      viteConfig,
    };
  }

  throw new Error(
    "Unable to identify a supported React project. Starwind currently supports Vite React, Next.js App Router, Next.js Pages Router, React Router framework mode, and TanStack Start with Vite.",
  );
}

export async function detectReactProjectPlan(pkg: ProjectPackage): Promise<ReactProjectPlan> {
  return getReactProjectPlan(pkg, await detectReactProjectPaths());
}

export async function detectReactProjectPaths(
  pathExists: (filePath: string) => Promise<boolean> = fileExists,
): Promise<ReadonlySet<string>> {
  const existingPaths = new Set<string>();
  await Promise.all(
    REACT_PROJECT_CANDIDATE_PATHS.map(async (candidate) => {
      if (await pathExists(candidate)) existingPaths.add(candidate);
    }),
  );
  return existingPaths;
}

export function getReactPackageRequirements(requirements: string[], kind: ReactHostKind): string[] {
  if (kind !== "next-app" && kind !== "next-pages") return requirements;

  const nextRequirements = requirements.filter(
    (requirement) => !requirement.startsWith("@tailwindcss/vite@"),
  );
  if (!nextRequirements.some((requirement) => requirement.startsWith("@tailwindcss/postcss@"))) {
    nextRequirements.push("@tailwindcss/postcss@^4");
  }
  return nextRequirements;
}

export async function validateReactProjectSetup(plan: ReactProjectPlan): Promise<void> {
  if (plan.kind === "vite") {
    const config = await readRequiredProjectFile(plan.viteConfig, "Vite config");
    if (!updateViteConfigContent(config)) {
      throw new Error(
        "The Vite config shape is not supported automatically. Expected export default defineConfig({ ... }) with a plugins array.",
      );
    }
    await readRequiredProjectFile(plan.cssEntry, "React entry");
    return;
  }

  await readRequiredProjectFile(plan.cssEntry, "global stylesheet");

  if (plan.kind === "next-pages") {
    const rootEntry = await readOptionalProjectFile(plan.rootEntry);
    addThemeInitToNextPagesDocument(rootEntry ?? createNextPagesDocument());
    return;
  }

  const rootEntry = await readRequiredProjectFile(plan.rootEntry, "root document");

  if (plan.kind === "next-app") {
    addThemeInitToNextLayout(rootEntry);
    return;
  }

  const hostLabel = plan.kind === "react-router" ? "React Router" : "TanStack Start";
  const viteConfig = await readRequiredProjectFile(plan.viteConfig, `${hostLabel} Vite config`);
  if (
    !/["']@tailwindcss\/vite["']/.test(viteConfig) ||
    !/\btailwindcss\s*\(\s*\)/.test(viteConfig)
  ) {
    throw new Error(
      `The ${hostLabel} Vite config must already include the @tailwindcss/vite plugin for automatic setup.`,
    );
  }
  if (plan.kind === "react-router") {
    addThemeInitToReactRouterRoot(rootEntry);
    return;
  }
  addThemeInitToTanStackRoot(rootEntry);
}

export async function setupReactProject(plan: ReactProjectPlan, cssFile: string): Promise<void> {
  if (plan.kind === "vite") {
    const config = await readRequiredProjectFile(plan.viteConfig, "Vite config");
    const updatedConfig = updateViteConfigContent(config);
    if (!updatedConfig) {
      throw new Error("The Vite config changed after Starwind preflight validation.");
    }
    await writeProjectFile(plan.viteConfig!, updatedConfig);

    const entry = await readRequiredProjectFile(plan.cssEntry, "React entry");
    await writeProjectFile(plan.cssEntry, addReactCssImport(entry, plan.cssEntry, cssFile));
    return;
  }

  const stylesheet = await readRequiredProjectFile(plan.cssEntry, "global stylesheet");
  await writeProjectFile(plan.cssEntry, addStarwindCssImport(stylesheet, plan.cssEntry, cssFile));

  if (plan.kind === "next-pages") {
    const rootEntry = await readOptionalProjectFile(plan.rootEntry);
    await writeProjectFile(
      plan.rootEntry!,
      addThemeInitToNextPagesDocument(rootEntry ?? createNextPagesDocument()),
    );
    return;
  }

  const rootEntry = await readRequiredProjectFile(plan.rootEntry, "root document");
  const updatedRoot =
    plan.kind === "next-app"
      ? addThemeInitToNextLayout(rootEntry)
      : plan.kind === "react-router"
        ? addThemeInitToReactRouterRoot(rootEntry)
        : addThemeInitToTanStackRoot(rootEntry);
  await writeProjectFile(plan.rootEntry!, updatedRoot);
}

export function addStarwindCssImport(content: string, entryPath: string, cssPath: string): string {
  const relativePath = path.posix.relative(
    path.posix.dirname(entryPath.replace(/\\/g, "/")),
    cssPath.replace(/\\/g, "/"),
  );
  const importPath = relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
  const importStatement = `@import ${JSON.stringify(importPath)};`;

  if (content.includes(importStatement)) return content;

  const withoutTailwindImport = content.replace(
    /^@import\s+["']tailwindcss["'];[ \t]*(?:\r?\n)?/m,
    "",
  );
  const lines = withoutTailwindImport.split(/(?<=\n)/);
  const firstContentLine = lines.find((line) => line.trim() !== "")?.trim();
  if (firstContentLine?.startsWith("@charset ") || firstContentLine?.startsWith("@import ")) {
    while (lines[0]?.trim() === "") lines.shift();
  }
  let insertAt = 0;

  for (const [index, line] of lines.entries()) {
    const trimmed = line.trim();
    if (trimmed.startsWith("@charset ") || trimmed.startsWith("@import ")) {
      insertAt = index + 1;
      continue;
    }
    if (trimmed === "") continue;
    break;
  }

  lines.splice(insertAt, 0, `${importStatement}\n`);
  return lines.join("");
}

export function prepareReactComponentFile(content: string, kind: ReactHostKind): string {
  if (kind !== "next-pages") return content;

  return content.replace(/^import\s+["']\.\/styles\.css["'];?[ \t]*(?:\r?\n)?/gm, "");
}

export function updateNextPagesComponentStylesheet(
  content: string,
  stylesheetPath: string,
  componentStylePaths: readonly string[],
): string {
  const managedBlockPattern = new RegExp(
    `${escapeRegExp(NEXT_PAGES_STYLES_START)}\\r?\\n[\\s\\S]*?${escapeRegExp(NEXT_PAGES_STYLES_END)}(?:\\r?\\n)?`,
    "g",
  );
  const withoutManagedBlock = content.replace(managedBlockPattern, "");
  if (componentStylePaths.length === 0) return withoutManagedBlock;

  const imports = [...new Set(componentStylePaths)]
    .sort((left, right) => left.localeCompare(right))
    .map((componentStylePath) => {
      const relativePath = path.posix.relative(
        path.posix.dirname(stylesheetPath.replace(/\\/g, "/")),
        componentStylePath.replace(/\\/g, "/"),
      );
      const importPath = relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
      return `@import ${JSON.stringify(importPath)};`;
    });
  const managedBlock = `${NEXT_PAGES_STYLES_START}\n${imports.join("\n")}\n${NEXT_PAGES_STYLES_END}\n`;
  const lines = withoutManagedBlock.split(/(?<=\n)/);
  let insertAt = 0;

  for (const [index, line] of lines.entries()) {
    const trimmed = line.trim();
    if (trimmed.startsWith("@charset ") || trimmed.startsWith("@import ")) {
      insertAt = index + 1;
      continue;
    }
    if (trimmed === "") continue;
    break;
  }

  lines.splice(insertAt, 0, managedBlock);
  return lines.join("");
}

export async function syncNextPagesComponentStyles(
  stylesheetPath: string,
  componentDir: string,
): Promise<void> {
  const componentStylePaths: string[] = [];

  if (await fileExists(componentDir)) {
    const entries = await fs.readdir(componentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const stylePath = path.posix.join(componentDir.replace(/\\/g, "/"), entry.name, "styles.css");
      if (await fileExists(stylePath)) componentStylePaths.push(stylePath);
    }
  }

  const stylesheet = await readRequiredProjectFile(stylesheetPath, "Starwind stylesheet");
  const updated = updateNextPagesComponentStylesheet(
    stylesheet,
    stylesheetPath,
    componentStylePaths,
  );
  if (updated !== stylesheet) await writeProjectFile(stylesheetPath, updated);
}

export function addThemeInitToNextLayout(content: string): string {
  return addThemeInitToRootDocument(content, {
    headAnchor: /<body\b/,
    quote: getImportQuote(content),
  });
}

export function addThemeInitToNextPagesDocument(content: string): string {
  if (content.includes("THEME_INIT_SCRIPT") && content.includes("dangerouslySetInnerHTML")) {
    return content;
  }

  const importPath = "@starwind-ui/react/theme";
  const quote = getImportQuote(content);
  const importStatement = `import { ThemeInitScript } from ${quote}${importPath}${quote};`;
  let next = content;

  if (!next.includes(importPath)) {
    next = `${importStatement}\n${next}`;
  }

  if (!/<Html\b[^>]*\bsuppressHydrationWarning\b/.test(next)) {
    next = next.replace(/<Html\b/, "<Html suppressHydrationWarning");
  }

  if (!/<Html\b/.test(next)) {
    throw new Error("The Next.js Pages Router document has no Html element.");
  }

  if (next.includes("<ThemeInitScript />")) return next;

  if (/<Head\s*\/>/.test(next)) {
    return next.replace(/<Head\s*\/>/, "<Head>\n        <ThemeInitScript />\n      </Head>");
  }

  const existingHead = next.match(/<Head\b[^>]*>/);
  if (existingHead?.index !== undefined) {
    const insertAt = existingHead.index + existingHead[0].length;
    return `${next.slice(0, insertAt)}\n        <ThemeInitScript />${next.slice(insertAt)}`;
  }

  if (!/<body\b/.test(next)) {
    throw new Error("The Next.js Pages Router document has no Head or body element.");
  }
  return next.replace(/<body\b/, "<Head>\n        <ThemeInitScript />\n      </Head>\n      <body");
}

export function createNextPagesDocument(): string {
  return addThemeInitToNextPagesDocument(`import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html>
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
`);
}

export function addThemeInitToTanStackRoot(content: string): string {
  if (content.includes("THEME_INIT_SCRIPT") && content.includes("dangerouslySetInnerHTML")) {
    return content;
  }

  return addThemeInitToRootDocument(content, {
    headAnchor: /<HeadContent\s*\/>/,
    quote: getImportQuote(content),
  });
}

export function addThemeInitToReactRouterRoot(content: string): string {
  if (content.includes("THEME_INIT_SCRIPT") && content.includes("dangerouslySetInnerHTML")) {
    return content;
  }

  return addThemeInitToRootDocument(content, {
    headAnchor: /<body\b/,
    quote: getImportQuote(content),
  });
}

function getNextProjectPlan(existingPaths: ReadonlySet<string>): ReactProjectPlan {
  for (const sourceRoot of ["src", "."] as const) {
    const prefix = sourceRoot === "src" ? "src/" : "";
    const rootEntry = findFirstExistingPath(
      existingPaths,
      NEXT_LAYOUT_EXTENSIONS.map((extension) => `${prefix}app/layout.${extension}`),
    );
    if (!rootEntry) continue;

    const cssEntry = findFirstExistingPath(existingPaths, [
      `${prefix}app/globals.css`,
      `${prefix}styles/globals.css`,
    ]);
    if (!cssEntry) {
      throw new Error("The Next.js App Router project is missing a supported global stylesheet.");
    }

    const sourcePrefix = sourceRoot === "src" ? "src/" : "";
    return {
      componentDir: `${sourcePrefix}components/starwind`,
      cssEntry,
      cssFile: `${sourcePrefix}styles/starwind.css`,
      kind: "next-app",
      rootEntry,
      sourceRoot,
      utilsDir: `${sourcePrefix}lib/utils`,
    };
  }

  for (const sourceRoot of ["src", "."] as const) {
    const prefix = sourceRoot === "src" ? "src/" : "";
    const appEntry = findFirstExistingPath(
      existingPaths,
      NEXT_LAYOUT_EXTENSIONS.map((extension) => `${prefix}pages/_app.${extension}`),
    );
    if (!appEntry) continue;

    const cssEntry = findFirstExistingPath(existingPaths, [
      `${prefix}styles/globals.css`,
      `${prefix}pages/globals.css`,
    ]);
    if (!cssEntry) {
      throw new Error("The Next.js Pages Router project is missing a supported global stylesheet.");
    }

    const existingDocument = findFirstExistingPath(
      existingPaths,
      NEXT_LAYOUT_EXTENSIONS.map((extension) => `${prefix}pages/_document.${extension}`),
    );
    const appExtension = appEntry.slice(appEntry.lastIndexOf(".") + 1);
    const rootEntry = existingDocument ?? `${prefix}pages/_document.${appExtension}`;
    const sourcePrefix = sourceRoot === "src" ? "src/" : "";
    return {
      componentDir: `${sourcePrefix}components/starwind`,
      cssEntry,
      cssFile: `${sourcePrefix}styles/starwind.css`,
      kind: "next-pages",
      rootEntry,
      sourceRoot,
      utilsDir: `${sourcePrefix}lib/utils`,
    };
  }

  throw new Error(
    "The Next.js project has no supported App Router layout or Pages Router custom App. Expected app/layout, src/app/layout, pages/_app, or src/pages/_app.",
  );
}

function findFirstExistingPath(
  existingPaths: ReadonlySet<string>,
  candidates: readonly string[],
): string | undefined {
  return candidates.find((candidate) => existingPaths.has(candidate));
}

function addThemeInitToRootDocument(
  content: string,
  options: { headAnchor: RegExp; quote: '"' | "'" },
): string {
  const importPath = "@starwind-ui/react/theme";
  const importStatement = `import { ThemeInitScript } from ${options.quote}${importPath}${options.quote};`;
  let next = content;

  if (!next.includes(importPath)) {
    next = `${importStatement}\n${next}`;
  }

  if (!/<html\b[^>]*\bsuppressHydrationWarning\b/.test(next)) {
    next = next.replace(/<html\b/, "<html suppressHydrationWarning");
  }

  if (next.includes("<ThemeInitScript />")) return next;

  if (options.headAnchor.source.includes("HeadContent")) {
    if (!options.headAnchor.test(next)) {
      throw new Error("The TanStack Start root route has no HeadContent element.");
    }
    return next.replace(options.headAnchor, "<ThemeInitScript />\n        <HeadContent />");
  }

  const existingHead = next.match(/<head\b[^>]*>/);
  if (existingHead?.index !== undefined) {
    const insertAt = existingHead.index + existingHead[0].length;
    return `${next.slice(0, insertAt)}\n        <ThemeInitScript />${next.slice(insertAt)}`;
  }

  if (!options.headAnchor.test(next)) {
    throw new Error("The Next.js root layout has no body element.");
  }
  return next.replace(
    options.headAnchor,
    "<head>\n        <ThemeInitScript />\n      </head>\n      <body",
  );
}

function getImportQuote(content: string): '"' | "'" {
  return /^import[^\n]+from\s+'/m.test(content) ? "'" : '"';
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function readRequiredProjectFile(
  filePath: string | undefined,
  label: string,
): Promise<string> {
  if (!filePath) throw new Error(`The React project plan has no ${label} path.`);
  return fs.readFile(filePath, "utf8");
}

async function readOptionalProjectFile(filePath: string | undefined): Promise<string | undefined> {
  if (!filePath || !(await fileExists(filePath))) return undefined;
  return fs.readFile(filePath, "utf8");
}

async function writeProjectFile(filePath: string, content: string): Promise<void> {
  await fs.writeFile(await resolveProjectMutationPath(filePath), content, "utf8");
}
