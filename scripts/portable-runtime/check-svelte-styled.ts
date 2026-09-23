import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { generateSvelteStyled, SVELTE_STYLED_OUTPUT_DIR } from "./generate-svelte-styled.js";

export async function checkSvelteStyled(repoRoot = process.cwd()): Promise<void> {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-svelte-styled-check-"));
  try {
    await generateSvelteStyled({ outputRoot: temporaryRoot, repoRoot });
    const generated = await readSvelteStyledTree(temporaryRoot);
    const committed = await readSvelteStyledTree(path.join(repoRoot, SVELTE_STYLED_OUTPUT_DIR));
    if (
      generated.size !== committed.size ||
      [...generated].some(([name, content]) => committed.get(name) !== content)
    ) {
      throw new Error("Svelte Styled output is stale. Run pnpm svelte:styled:generate.");
    }
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

export async function readSvelteStyledTree(root: string): Promise<Map<string, string>> {
  const files = new Map<string, string>();
  async function visit(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(file);
      else if (entry.isFile())
        files.set(path.relative(root, file).replaceAll("\\", "/"), await readFile(file, "utf8"));
    }
  }
  await visit(root);
  return files;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await checkSvelteStyled();
