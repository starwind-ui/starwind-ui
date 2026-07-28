import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { createSourceBackedRuntimeAliases } from "./source-backed-runtime-aliases";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

function resolveAlias(importId: string): string | undefined {
  for (const alias of createSourceBackedRuntimeAliases(repoRoot)) {
    if (typeof alias.find === "string") {
      if (importId === alias.find) return alias.replacement;
      continue;
    }
    if (alias.find.test(importId)) return importId.replace(alias.find, alias.replacement);
  }
  return undefined;
}

describe("React source-backed Runtime aliases", () => {
  it("cover every public Runtime package export with an existing source file", () => {
    const runtimePackage = JSON.parse(
      readFileSync(path.join(repoRoot, "packages/runtime/package.json"), "utf8"),
    ) as { exports: Record<string, unknown> };

    for (const exportPath of Object.keys(runtimePackage.exports)) {
      const importId =
        exportPath === "." ? "@starwind-ui/runtime" : `@starwind-ui/runtime${exportPath.slice(1)}`;
      const sourcePath = resolveAlias(importId);

      expect(sourcePath, importId).toBeDefined();
      expect(existsSync(sourcePath!), `${importId} -> ${sourcePath}`).toBe(true);
    }
  });
});
