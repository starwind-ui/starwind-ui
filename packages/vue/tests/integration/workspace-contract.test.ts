import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

import { approvedTestHomePrefixes } from "../../../../scripts/check-test-homes.mjs";
import { getPrimitiveFrameworkAdapterTarget } from "../../../../scripts/portable-runtime/renderers/framework-adapters/target-registry.js";
import { vuePrimitiveComponents } from "../../../../scripts/portable-runtime/renderers/framework-adapters/vue/inventory.js";

const repoRoot = fileURLToPath(new URL("../../../../", import.meta.url));

describe("Vue public-beta vertical-slice workspace contract", () => {
  it("exposes only the approved focused root commands", async () => {
    const rootPackage = await readRepoJson<{ scripts: Record<string, string> }>("package.json");

    expect(rootPackage.scripts).toMatchObject({
      "runtime:generate:vue": "tsx scripts/portable-runtime/generate-vue-wrappers.ts",
      "runtime:generate:vue:test": "vitest run --project=portable-vue",
      "vue:build": "pnpm --filter=@starwind-ui/vue build",
      "vue:typecheck": "pnpm --filter=@starwind-ui/vue typecheck",
      "vue:verify": "pnpm runtime:generate:vue:test && pnpm vue:typecheck && pnpm vue:test",
      "vue-demo:build": "pnpm --filter=vue-demo build",
      "vue-demo:dev": "pnpm --filter=vue-demo dev",
      "vue-demo:smoke": "pnpm --filter=vue-demo smoke",
    });
    expect(rootPackage.scripts["runtime:generate:all"]).toBe(
      "pnpm runtime:generate:astro && pnpm runtime:generate:react && pnpm runtime:generate:vue",
    );
  });

  it("keeps the materialized beta independent and the review app private", async () => {
    const vuePackage = await readRepoJson<{
      dependencies: Record<string, string>;
      name: string;
      private?: boolean;
      version: string;
    }>("packages/vue/package.json");
    const demoPackage = await readRepoJson<{ name: string; private: boolean }>(
      "apps/vue-demo/package.json",
    );
    const changesets = await readRepoJson<{ fixed: string[][]; ignore: string[] }>(
      ".changeset/config.json",
    );

    expect(vuePackage).toMatchObject({
      dependencies: { "@starwind-ui/runtime": "1.2.0" },
      name: "@starwind-ui/vue",
      version: "0.1.0",
    });
    expect(vuePackage.private).toBeUndefined();
    expect(demoPackage).toMatchObject({ name: "vue-demo", private: true });
    expect(changesets.fixed.flat()).not.toContain("@starwind-ui/vue");
    expect(changesets.ignore).toEqual(expect.arrayContaining(["demo", "react-demo", "vue-demo"]));
    expect(changesets.ignore).not.toContain("@starwind-ui/vue");
    expect(approvedTestHomePrefixes).toContain("packages/vue/tests/");
  });

  it("promotes Vue support through the shared release surfaces", async () => {
    const rootPackage = await readRepoJson<{ scripts: Record<string, string> }>("package.json");
    const vueTarget = getPrimitiveFrameworkAdapterTarget("vue");

    expect(vueTarget.publicSupport).toEqual({
      cliRegistry: true,
      demoIntegration: true,
      packageExports: true,
      publicDocsClaim: true,
      status: "public-beta",
    });
    expect(vueTarget.primitive.support).toEqual({
      components: vuePrimitiveComponents,
      kind: "subset",
    });
    expect(rootPackage.scripts["release:prepare"]).toContain("runtime:generate:all");
    expect(rootPackage.scripts["release:gate"]).toContain("vue-demo:smoke");
    expect(rootPackage.scripts["release:gate"]).toContain("runtime:size:check:prepared");
    expect(rootPackage.scripts["release:candidate:acceptance"]).toBe(
      "node scripts/release-candidate-acceptance.mjs",
    );
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
