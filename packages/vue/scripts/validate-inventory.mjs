import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  assertVueInventorySnapshot,
  formatVueInventoryDiagnostics,
  validateVueInventorySnapshot,
} from "../../../scripts/portable-runtime/renderers/framework-adapters/vue/inventory.ts";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));

export { formatVueInventoryDiagnostics, validateVueInventorySnapshot };

export async function validateVuePackageInventory(root = packageRoot) {
  const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
  const sourceFiles = await readFileTree(path.join(root, "src"));
  assertVueInventorySnapshot({ packageExports: packageJson.exports ?? {}, sourceFiles });
}

async function readFileTree(directory, root = directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const candidate = path.join(directory, entry.name);
      if (entry.isDirectory()) return readFileTree(candidate, root);
      return entry.isFile() ? [path.relative(root, candidate).replaceAll("\\", "/")] : [];
    }),
  );
  return files.flat().sort();
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await validateVuePackageInventory();
}
