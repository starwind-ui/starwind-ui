import { randomUUID } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmdirSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { layeredDocsMetadata } from "./docs/layered-docs/generated/layered-docs-metadata.js";
import type { LayeredDocsMetadata, PublicFrameworkTarget } from "./docs/layered-docs/types.js";
import { renderAdapterDocs } from "./package-docs/render-adapter.js";
import { renderRuntimeDocs } from "./package-docs/render-runtime.js";
import type { DocsFiles } from "./package-docs/shared.js";
import { readFrameworkSurfaceManifest } from "./package-docs/source-facts.js";
import {
  absolutizeSiteLinks,
  compareCodeUnits,
  PACKAGE_DOCS_DIRECTORY,
  validatePackageDocs,
} from "./package-docs/validate-docs.mjs";

/**
 * Generates installed Markdown docs for the Runtime and Primitive adapter packages. Package
 * `prepack` scripts run it, so every `pnpm pack` and directory `pnpm publish` ships docs that match
 * the version in `package.json`. The output folder is ignored by Git.
 *
 * Several packs of the same revision can run at once, for example parallel release checks. Each
 * writer renders files into a private temp folder in the package `node_modules/.cache`, which npm
 * never packs, and renames each finished file into `docs/`. A rename replaces a file in one step,
 * so a reader sees the old or the new file and never a partial one. Writers delete only paths that
 * the current render does not contain.
 */

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export type PackageDocsKey = "runtime" | PublicFrameworkTarget;

export const PACKAGE_DOCS_PACKAGES: Readonly<
  Record<PackageDocsKey, { readonly directory: string; readonly name: string }>
> = {
  runtime: { directory: "packages/runtime", name: "@starwind-ui/runtime" },
  astro: { directory: "packages/astro", name: "@starwind-ui/astro" },
  react: { directory: "packages/react", name: "@starwind-ui/react" },
  vue: { directory: "packages/vue", name: "@starwind-ui/vue" },
  svelte: { directory: "packages/svelte", name: "@starwind-ui/svelte" },
};

export const PACKAGE_DOCS_KEYS = Object.keys(PACKAGE_DOCS_PACKAGES) as PackageDocsKey[];

type PackageManifest = {
  readonly name: string;
  readonly version: string;
  readonly files?: readonly string[];
  readonly dependencies?: Readonly<Record<string, string>>;
  readonly peerDependencies?: Readonly<Record<string, string>>;
};

const readManifest = (directory: string): PackageManifest =>
  JSON.parse(readFileSync(path.join(directory, "package.json"), "utf8")) as PackageManifest;

/** Resolves a `workspace:` range to the version that `pnpm pack` writes into the archive. */
const resolveRuntimeRequirement = (repoRoot: string, range: string | undefined) => {
  if (!range) throw new Error("Adapter package has no @starwind-ui/runtime dependency.");
  if (!range.startsWith("workspace:")) return range;
  const version = readManifest(path.join(repoRoot, "packages/runtime")).version;
  const prefix = range.slice("workspace:".length);
  return prefix === "*" ? version : prefix === "^" || prefix === "~" ? prefix + version : prefix;
};

export type RenderPackageDocsOptions = {
  readonly key: PackageDocsKey;
  readonly repoRoot?: string;
  readonly metadata?: LayeredDocsMetadata;
};

export const renderPackageDocs = ({
  key,
  repoRoot = REPO_ROOT,
  metadata = layeredDocsMetadata,
}: RenderPackageDocsOptions): { readonly files: DocsFiles; readonly manifest: PackageManifest } => {
  const definition = PACKAGE_DOCS_PACKAGES[key];
  const packageRoot = path.join(repoRoot, definition.directory);
  const manifest = readManifest(packageRoot);
  if (manifest.name !== definition.name) {
    throw new Error(`${definition.directory} is ${manifest.name}, expected ${definition.name}.`);
  }
  if (!manifest.files?.includes(PACKAGE_DOCS_DIRECTORY)) {
    throw new Error(`${definition.name} must list "${PACKAGE_DOCS_DIRECTORY}" in package files.`);
  }
  if (key === "runtime") {
    return {
      files: withAbsoluteSiteLinks(
        renderRuntimeDocs({ metadata, repoRoot, version: manifest.version }),
      ),
      manifest,
    };
  }
  const framework = metadata.frameworks.find((entry) => entry.target === key);
  if (!framework || framework.packageName !== definition.name) {
    throw new Error(`Layered docs metadata has no framework entry for ${definition.name}.`);
  }
  const files = renderAdapterDocs({
    metadata,
    repoRoot,
    packageRoot,
    manifest: readFrameworkSurfaceManifest(repoRoot),
    framework,
    version: manifest.version,
    runtimeRequirement: resolveRuntimeRequirement(
      repoRoot,
      manifest.dependencies?.["@starwind-ui/runtime"],
    ),
    peerDependencies: manifest.peerDependencies ?? {},
  });
  return { files: withAbsoluteSiteLinks(files), manifest };
};

/** Authored metadata links to website pages from the site root. Installed docs need full URLs. */
const withAbsoluteSiteLinks = (files: DocsFiles): DocsFiles =>
  new Map([...files].map(([file, contents]) => [file, absolutizeSiteLinks(contents)]));

const assertValid = (name: string, version: string, files: DocsFiles) => {
  const errors = validatePackageDocs({ files, name, version });
  if (errors.length > 0) {
    throw new Error(`Package docs are invalid:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  }
};

const listFiles = (root: string, relative = ""): string[] => {
  const absolute = path.join(root, relative);
  if (!existsSync(absolute)) return [];
  let entries;
  try {
    entries = readdirSync(absolute, { withFileTypes: true });
  } catch (error) {
    // Another writer can remove a stale folder between the check and the read.
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  return entries.flatMap((entry) => {
    const child = path.posix.join(relative, entry.name);
    return entry.isDirectory() ? listFiles(root, child) : [child];
  });
};

const isMissing = (error: unknown) => (error as NodeJS.ErrnoException).code === "ENOENT";

/** Writes one file through a temp file and a rename, and skips files that already match. */
const publishFile = (target: string, contents: string, temporaryDirectory: string) => {
  try {
    if (readFileSync(target, "utf8") === contents) return;
  } catch (error) {
    if (!isMissing(error)) throw error;
  }
  const temporary = path.join(temporaryDirectory, randomUUID());
  writeFileSync(temporary, contents, "utf8");
  mkdirSync(path.dirname(target), { recursive: true });
  renameSync(temporary, target);
};

/**
 * Deletes docs files that the current render does not contain, then empty stale folders. Another
 * writer can delete the same path first, so missing files and non-empty folders are not errors.
 */
const pruneStaleDocs = (packageRoot: string, expected: ReadonlySet<string>) => {
  const docsRoot = path.join(packageRoot, PACKAGE_DOCS_DIRECTORY);
  for (const file of listFiles(docsRoot)) {
    if (expected.has(`${PACKAGE_DOCS_DIRECTORY}/${file}`)) continue;
    try {
      unlinkSync(path.join(docsRoot, file));
    } catch (error) {
      if (!isMissing(error)) throw error;
    }
  }
  const expectedDirectories = new Set(
    [...expected]
      .map((file) => path.posix.dirname(file))
      .flatMap((directory) => {
        const parts = directory.split("/");
        return parts.map((_, index) => parts.slice(0, index + 1).join("/"));
      }),
  );
  for (const directory of listDirectories(docsRoot).sort(
    (left, right) => right.length - left.length,
  )) {
    if (expectedDirectories.has(`${PACKAGE_DOCS_DIRECTORY}/${directory}`)) continue;
    try {
      rmdirSync(path.join(docsRoot, directory));
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "ENOENT" && code !== "ENOTEMPTY" && code !== "EEXIST") throw error;
    }
  }
};

const listDirectories = (root: string, relative = ""): string[] => {
  const absolute = path.join(root, relative);
  let entries;
  try {
    entries = readdirSync(absolute, { withFileTypes: true });
  } catch (error) {
    if (isMissing(error)) return [];
    throw error;
  }
  return entries
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      const child = path.posix.join(relative, entry.name);
      return [child, ...listDirectories(root, child)];
    });
};

export const writePackageDocs = (options: RenderPackageDocsOptions) => {
  const repoRoot = options.repoRoot ?? REPO_ROOT;
  const { files, manifest } = renderPackageDocs(options);
  assertValid(manifest.name, manifest.version, files);
  const packageRoot = path.join(repoRoot, PACKAGE_DOCS_PACKAGES[options.key].directory);
  const cacheRoot = path.join(packageRoot, "node_modules", ".cache");
  mkdirSync(cacheRoot, { recursive: true });
  const temporaryDirectory = path.join(cacheRoot, `starwind-package-docs-${randomUUID()}`);
  mkdirSync(temporaryDirectory);
  try {
    for (const [file, contents] of [...files].sort(([left], [right]) =>
      compareCodeUnits(left, right),
    )) {
      publishFile(path.join(packageRoot, file), contents, temporaryDirectory);
    }
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
  pruneStaleDocs(packageRoot, new Set(files.keys()));
  return { name: manifest.name, version: manifest.version, count: files.size };
};

/** Compares the docs on disk with a fresh render. Returns one message per stale or missing file. */
export const checkPackageDocs = (options: RenderPackageDocsOptions) => {
  const repoRoot = options.repoRoot ?? REPO_ROOT;
  const { files, manifest } = renderPackageDocs(options);
  assertValid(manifest.name, manifest.version, files);
  const packageRoot = path.join(repoRoot, PACKAGE_DOCS_PACKAGES[options.key].directory);
  const onDisk = new Set(
    listFiles(path.join(packageRoot, PACKAGE_DOCS_DIRECTORY)).map(
      (file) => `${PACKAGE_DOCS_DIRECTORY}/${file}`,
    ),
  );
  const problems: string[] = [];
  for (const [file, contents] of files) {
    const target = path.join(packageRoot, file);
    if (!onDisk.has(file)) problems.push(`${manifest.name}: missing ${file}`);
    else if (readFileSync(target, "utf8") !== contents)
      problems.push(`${manifest.name}: stale ${file}`);
  }
  for (const file of onDisk) {
    if (!files.has(file)) problems.push(`${manifest.name}: unexpected ${file}`);
  }
  return problems.sort();
};

export const cleanPackageDocs = ({
  key,
  repoRoot = REPO_ROOT,
}: Pick<RenderPackageDocsOptions, "key" | "repoRoot">) =>
  rmSync(path.join(repoRoot, PACKAGE_DOCS_PACKAGES[key].directory, PACKAGE_DOCS_DIRECTORY), {
    recursive: true,
    force: true,
  });

const parseArguments = (argv: readonly string[]) => {
  const keys: PackageDocsKey[] = [];
  let mode: "check" | "clean" | "write" = "write";
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]!;
    if (argument === "--check") mode = "check";
    else if (argument === "--clean") mode = "clean";
    else if (argument === "--package") {
      const key = argv[index + 1] as PackageDocsKey | undefined;
      if (!key || !PACKAGE_DOCS_KEYS.includes(key)) {
        throw new Error(`Pass one of ${PACKAGE_DOCS_KEYS.join(", ")} after --package.`);
      }
      keys.push(key);
      index += 1;
    } else throw new Error(`Unknown argument: ${argument}`);
  }
  return { keys: keys.length > 0 ? keys : PACKAGE_DOCS_KEYS, mode };
};

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const { keys, mode } = parseArguments(process.argv.slice(2));
  if (mode === "clean") {
    for (const key of keys) cleanPackageDocs({ key });
  } else if (mode === "check") {
    const problems = keys.flatMap((key) => checkPackageDocs({ key }));
    if (problems.length > 0) {
      console.error(
        `Package docs are missing or stale. Run pnpm packages:docs.\n${problems.map((problem) => `- ${problem}`).join("\n")}`,
      );
      process.exitCode = 1;
    } else console.log(`Package docs match for ${keys.join(", ")}.`);
  } else {
    for (const key of keys) {
      const result = writePackageDocs({ key });
      console.log(`Wrote ${result.count} docs files for ${result.name}@${result.version}.`);
    }
  }
}
