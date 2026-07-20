import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

import { approvedTestHomePrefixes } from "../../../../scripts/check-test-homes.mjs";
import { getPrimitiveFrameworkAdapterTarget } from "../../../../scripts/portable-runtime/renderers/framework-adapters/target-registry.js";
import { vuePrimitiveComponents } from "../../../../scripts/portable-runtime/renderers/framework-adapters/vue/inventory.js";

const repoRoot = fileURLToPath(new URL("../../../../", import.meta.url));

describe("private Vue vertical-slice workspace contract", () => {
  it("exposes only the approved focused root commands", async () => {
    const rootPackage = await readRepoJson<{ scripts: Record<string, string> }>("package.json");

    expect(rootPackage.scripts).toMatchObject({
      "runtime:generate:vue": "tsx scripts/portable-runtime/generate-vue-wrappers.ts",
      "runtime:generate:vue:test":
        "vitest run scripts/portable-runtime/tests/generate-vue-wrappers --testTimeout=60000",
      "vue:build": "pnpm --filter=@starwind-ui/vue build",
      "vue:typecheck": "pnpm --filter=@starwind-ui/vue typecheck",
      "vue-demo:build": "pnpm --filter=vue-demo build",
      "vue-demo:dev": "pnpm --filter=vue-demo dev",
      "vue-demo:smoke": "pnpm --filter=vue-demo smoke",
    });
    expect(rootPackage.scripts["runtime:generate:all"]).toBe(
      "pnpm runtime:generate:astro && pnpm runtime:generate:react",
    );
  });

  it("keeps the package and review app private and out of Changesets", async () => {
    const vuePackage = await readRepoJson<{ name: string; private: boolean }>(
      "packages/vue/package.json",
    );
    const demoPackage = await readRepoJson<{ name: string; private: boolean }>(
      "apps/vue-demo/package.json",
    );
    const changesets = await readRepoJson<{ fixed: string[][]; ignore: string[] }>(
      ".changeset/config.json",
    );

    expect(vuePackage).toMatchObject({ name: "@starwind-ui/vue", private: true });
    expect(demoPackage).toMatchObject({ name: "vue-demo", private: true });
    expect(changesets.fixed.flat()).not.toContain("@starwind-ui/vue");
    expect(changesets.ignore).toEqual(
      expect.arrayContaining(["demo", "react-demo", "vue-demo", "@starwind-ui/vue"]),
    );
    expect(approvedTestHomePrefixes).toContain("packages/vue/tests/");
  });

  it("keeps Vue disabled across public support and release surfaces", async () => {
    const rootPackage = await readRepoJson<{ scripts: Record<string, string> }>("package.json");
    const vueTarget = getPrimitiveFrameworkAdapterTarget("vue");

    expect(vueTarget.publicSupport).toEqual({
      cliRegistry: false,
      demoIntegration: false,
      packageExports: false,
      publicDocsClaim: false,
      status: "non-shipping-tracer",
    });
    expect(vueTarget.primitive.support).toEqual({
      components: vuePrimitiveComponents,
      kind: "subset",
    });
    for (const scriptName of [
      "release:prepare",
      "release:artifacts",
      "release:gate",
      "publish:release",
      "publish:release:dry-run",
    ]) {
      expect(rootPackage.scripts[scriptName], scriptName).not.toMatch(/vue/i);
    }
  });

  it("loads the Vue demo dev config without prebuilt adapter output", async () => {
    const demoRoot = path.join(repoRoot, "apps/vue-demo");
    const configPath = path.join(demoRoot, "vite.config.ts");
    const configSource = await readFile(configPath, "utf8");
    const demoRequire = createRequire(path.join(demoRoot, "package.json"));
    const { loadConfigFromFile } = await import(pathToFileURL(demoRequire.resolve("vite")).href);

    const loaded = await loadConfigFromFile(
      {
        command: "serve",
        isPreview: false,
        isSsrBuild: false,
        mode: "development",
      },
      configPath,
      demoRoot,
      "silent",
    );

    expect(path.normalize(loaded?.path ?? "")).toBe(path.normalize(configPath));
    expect(configSource).not.toMatch(/from\s+["']@starwind-ui\/vue(?:\/[^"']*)?["']/);
  });
});

async function readRepoJson<T>(relativePath: string): Promise<T> {
  return JSON.parse(await readFile(path.join(repoRoot, relativePath), "utf8")) as T;
}
