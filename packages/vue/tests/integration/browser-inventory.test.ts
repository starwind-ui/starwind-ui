import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  createVueBrowserProjectConfig,
  formatVueBrowserInventoryDiagnostics,
  validateVueBrowserInventory,
  vueBrowserProjectOwnership,
} from "../browser-project.js";

const repoRoot = fileURLToPath(new URL("../../../..", import.meta.url));

describe("Vue browser verification inventory", () => {
  it("owns every discovered browser test exactly once for every supported Primitive", async () => {
    const diagnostics = validateVueBrowserInventory({
      browserFiles: await discoverBrowserTests(path.join(repoRoot, "packages/vue/tests")),
    });

    expect(diagnostics, formatVueBrowserInventoryDiagnostics(diagnostics)).toEqual({
      components: {
        duplicateOwnership: [],
        missingCoverage: [],
        staleAllowlist: [],
        staleOwnership: [],
      },
      tests: {
        duplicateOwnership: [],
        missingOwnership: [],
        staleOwnership: [],
      },
    });
  });

  it("isolates each component project in a deterministic Vite cache directory", () => {
    const cacheDirectories = vueBrowserProjectOwnership.map(({ component }) => {
      const config = createVueBrowserProjectConfig(component);
      const expected = path.join(repoRoot, "node_modules/.vite/vue-browser", component);
      const browserProject = config.test?.projects?.[1];

      expect(browserProject).toMatchObject({
        cacheDir: expected,
        test: { name: "browser" },
      });
      if (!browserProject || typeof browserProject === "string") {
        throw new Error(`Missing executable browser project for ${component}`);
      }
      return browserProject.cacheDir;
    });

    expect(new Set(cacheDirectories)).toHaveLength(vueBrowserProjectOwnership.length);
  });

  it("reports missing, duplicate, and stale ownership with actionable paths", () => {
    const known = vueBrowserProjectOwnership[0]!;
    const unowned = "packages/vue/tests/new/new.browser.test.ts";
    const stale = "packages/vue/tests/avatar/removed.browser.test.ts";
    const diagnostics = validateVueBrowserInventory({
      allowlist: ["unsupported", known.component],
      browserFiles: [...known.tests, unowned],
      ownership: [
        known,
        { ...known, tests: [known.tests[0]!, stale] },
        {
          component: "unsupported",
          config: "packages/vue/tests/unsupported/vitest.config.ts",
          tests: ["packages/vue/tests/unsupported/unsupported.browser.test.ts"],
        },
      ],
      supportedComponents: [known.component, "missing"],
    });
    const message = formatVueBrowserInventoryDiagnostics(diagnostics);

    expect(diagnostics.components).toEqual({
      duplicateOwnership: [known.component],
      missingCoverage: ["missing"],
      staleAllowlist: [known.component, "unsupported"],
      staleOwnership: ["unsupported"],
    });
    expect(diagnostics.tests).toEqual({
      duplicateOwnership: [known.tests[0]],
      missingOwnership: [unowned],
      staleOwnership: [stale, "packages/vue/tests/unsupported/unsupported.browser.test.ts"],
    });
    expect(message).toContain(unowned);
    expect(message).toContain(stale);
    expect(message).toContain("missing");
  });
});

async function discoverBrowserTests(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const discovered = await Promise.all(
    entries.map(async (entry) => {
      const candidate = path.join(directory, entry.name);
      if (entry.isDirectory()) return discoverBrowserTests(candidate);
      if (!entry.isFile() || !entry.name.endsWith(".browser.test.ts")) return [];
      return [path.relative(repoRoot, candidate).replaceAll("\\", "/")];
    }),
  );
  return discovered.flat().sort();
}
