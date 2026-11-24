import { mkdir, mkdtemp, readdir, rename, rm, rmdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build, type Options } from "tsup";

import runtimeBuild from "../../tsup.config";

const packageRoot = fileURLToPath(new URL("../../", import.meta.url));

/**
 * Build the shipping entries before browser tests import the real minified Runtime.
 *
 * Other processes can read packages/runtime/dist while this build runs, for example release gate
 * lanes that import the built Runtime. So the build writes to a staging folder next to dist, which
 * keeps the source map paths the same. Then it moves each file into dist with one rename. Files
 * that dist does not have yet, such as a chunk with a new hash, move first, and the files that both
 * builds have, such as the entries, move after them. So an entry in dist never imports a chunk that
 * is not there yet, even when the move stops halfway. Last, it removes the files that the new build
 * did not write.
 */
export default async function buildRuntimeDist(): Promise<void> {
  const dist = path.join(packageRoot, "dist");
  const staging = await mkdtemp(path.join(packageRoot, ".dist-staging-"));
  try {
    await build({
      ...(runtimeBuild as Options),
      config: false,
      silent: true,
      outDir: staging,
      clean: true,
    });
    const built = await listFiles(staging);
    const current = new Set(await listFiles(dist).catch(() => []));
    const order = [
      ...built.filter((file) => !current.has(file)),
      ...built.filter((file) => current.has(file)),
    ];
    for (const file of order) {
      await mkdir(path.dirname(path.join(dist, file)), { recursive: true });
      await rename(path.join(staging, file), path.join(dist, file));
    }
    const keep = new Set(built);
    for (const file of await listFiles(dist)) {
      if (!keep.has(file)) await rm(path.join(dist, file), { force: true });
    }
    await removeEmptyFolders(dist);
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

async function listFiles(root: string, relative = ""): Promise<string[]> {
  const entries = await readdir(path.join(root, relative), { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const child = path.join(relative, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(root, child)));
    else files.push(child);
  }
  return files;
}

async function removeEmptyFolders(folder: string): Promise<void> {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const child = path.join(folder, entry.name);
    await removeEmptyFolders(child);
    if ((await readdir(child)).length === 0) await rmdir(child);
  }
}
