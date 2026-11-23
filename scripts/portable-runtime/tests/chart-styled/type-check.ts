import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
export const repoRoot = path.resolve(import.meta.dirname, "../../../..");

/** The source line of each `@expect-error-line <name>` marker, which marks the next line. */
export function expectedLines(source: string): Record<string, number> {
  const lines = source.split("\n");
  return Object.fromEntries(
    lines.flatMap((line, index) => {
      const match = line.match(/@expect-error-line ([\w-]+)/);
      return match ? [[match[1]!, index + 2]] : [];
    }),
  );
}

export interface TypeCheckResult {
  /** The lines of the check file that have an error. */
  errors: Set<number>;
  /** The line that each marker names. */
  expected: Record<string, number>;
  output: string;
}

/**
 * Type checks one consumer file with an app's compiler options and modules. The fixture lives in
 * the app's node_modules, so repository scans do not see it while it exists.
 */
export async function checkConsumerTypes(options: {
  app: string;
  file: string;
  source: string;
  compiler: "tsc" | "vue-tsc";
  roots: string[];
  /** Extra vue-tsc options, such as \`strictTemplates\`. */
  vueCompilerOptions?: Record<string, unknown>;
}): Promise<TypeCheckResult> {
  const app = path.join(repoRoot, options.app);
  const root = await mkdtemp(path.join(app, "node_modules/.chart-types-"));
  options.roots.push(root);
  await writeFile(path.join(root, options.file), options.source);
  await writeFile(
    path.join(root, "tsconfig.json"),
    JSON.stringify({
      extends: "../../tsconfig.json",
      compilerOptions: {
        composite: false,
        declaration: false,
        declarationMap: false,
        noEmit: true,
      },
      include: [options.file],
      // The base config excludes node_modules, where the fixture lives.
      exclude: [],
      ...(options.vueCompilerOptions ? { vueCompilerOptions: options.vueCompilerOptions } : {}),
    }),
  );
  const appRequire = createRequire(path.join(app, "package.json"));
  const compiler =
    options.compiler === "tsc"
      ? require.resolve("typescript/lib/tsc.js")
      : appRequire.resolve("vue-tsc/bin/vue-tsc.js");
  const result = spawnSync(
    process.execPath,
    [compiler, "--noEmit", "-p", path.join(root, "tsconfig.json")],
    { cwd: app, encoding: "utf8", timeout: 180_000 },
  );
  if (result.error) throw result.error;
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  const file = options.file.replace(/\./g, "\\.");
  const errors = [
    ...output.matchAll(new RegExp(`${file}\\((\\d+),\\d+\\): error TS\\d+`, "g")),
  ].map(([, line]) => Number(line));
  return { errors: new Set(errors), expected: expectedLines(options.source), output };
}

export async function removeRoots(roots: string[]): Promise<void> {
  await Promise.all(roots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
}
