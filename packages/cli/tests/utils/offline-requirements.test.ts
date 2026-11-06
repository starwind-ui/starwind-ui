import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  collectRegistryPackageRequirements,
  getOfflineCodeRequirements,
} from "../../src/offline-requirements.js";

const SOURCE_DIRECTORY = fileURLToPath(new URL("../../src", import.meta.url));

// Host frameworks are not in the offline kit. Offline init stops before it installs them.
const HOST_SPECS = new Set(["astro@latest"]);
// Commands that the CLI prints for the user to run online.
const PRINTED_SPECS = new Set(["starwind@latest"]);

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === "registry" ? [] : sourceFiles(file);
    return entry.name.endsWith(".ts") ? [file] : [];
  });
}

describe("offline kit requirements", () => {
  it("cover every package spec that the CLI code names", () => {
    const covered = new Set(getOfflineCodeRequirements());
    for (const file of ["bundled-registry.json", "primitive-vendoring-artifacts.json"]) {
      const document = JSON.parse(
        readFileSync(path.join(SOURCE_DIRECTORY, "registry", file), "utf8"),
      );
      collectRegistryPackageRequirements(document, covered);
    }
    // A spec in double quotes, single quotes, or a template literal without placeholders.
    const specPattern =
      /(["'`])((?:@[a-z0-9][\w.-]*\/)?[a-z0-9][\w.-]*@(?:\^|~|>=?|\d|latest)[^"'`\s$]*)\1/g;
    const missing: string[] = [];
    for (const file of sourceFiles(SOURCE_DIRECTORY)) {
      // Comments show example specs, such as pnpm lockfile keys.
      const code = readFileSync(file, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      for (const [, , spec] of code.matchAll(specPattern)) {
        if (HOST_SPECS.has(spec) || PRINTED_SPECS.has(spec) || covered.has(spec)) continue;
        missing.push(`${path.relative(SOURCE_DIRECTORY, file)}: ${spec}`);
      }
    }
    // Put a new install spec in `utils/install-defaults.ts` and add it to
    // `getOfflineCodeRequirements`, so the offline kit stores it.
    expect(missing).toEqual([]);
  });
});
