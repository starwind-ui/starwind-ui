import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  generateSveltePrimitiveWrappers,
  SVELTE_PRIMITIVE_OUTPUT_DIR,
} from "./generate-svelte-wrappers.js";

export async function checkSvelteWrappers(repoRoot = process.cwd()): Promise<void> {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-svelte-check-"));
  try {
    await generateSveltePrimitiveWrappers({ outputRoot: temporaryRoot, repoRoot });
    const committed = await readTree(path.join(repoRoot, SVELTE_PRIMITIVE_OUTPUT_DIR));
    const generated = await readTree(temporaryRoot);
    if (!treesEqual(committed, generated)) {
      throw new Error("Svelte package output is stale. Run pnpm runtime:generate:svelte.");
    }
  } finally {
    await rm(temporaryRoot, { force: true, recursive: true });
  }
}

async function readTree(root: string): Promise<Map<string, string>> {
  const files = await listFiles(root);
  return new Map(
    await Promise.all(
      files.map(
        async (file) =>
          [path.relative(root, file).replaceAll("\\", "/"), await readFile(file, "utf8")] as const,
      ),
    ),
  );
}

async function listFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const candidate = path.join(directory, entry.name);
      return entry.isDirectory() ? listFiles(candidate) : [candidate];
    }),
  );
  return files.flat().sort();
}

function treesEqual(left: Map<string, string>, right: Map<string, string>): boolean {
  if (left.size !== right.size) return false;
  return [...left].every(([file, contents]) => right.get(file) === contents);
}

if (process.argv[1]?.endsWith("check-svelte-wrappers.ts")) {
  await checkSvelteWrappers();
}
