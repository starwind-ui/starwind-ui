import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";
import { createPackPlan } from "../pack-public-release-artifacts.mjs";
import { getCandidateMatrix } from "../release-candidate-acceptance.mjs";
import {
  assertNoWorkspaceSourceAliases,
  assertNuxtComponentDiscovery,
  assertPackedVueHostProvenance,
  assertPreservedVueHostBytes,
  assertPreservedVueHostPackageRanges,
  capturePreservedVueHostBytes,
  captureVueHostPackageRanges,
  createOfficialVueHostFixture,
  createVueBetaPackPlan,
  createVueCliHostAcceptancePlan,
  createVueLocalLinkAcceptancePlan,
  getAstroPageFixture,
  getAstroVueFixture,
  getViteVueFixture,
  getVueFixture,
  isNuxtComponentCollisionWarning,
  isPreviewTreeAlive,
  isVueHydrationMismatchWarning,
  parseArgs,
  prepareVueHostPackages,
  runCleanupOperations,
  runVueHostWorkers,
  runWithCleanup,
  shouldCaptureVueHydrationWarnings,
  shouldPreserveVueHostRoot,
  stopPreviewTree,
  verifyPackedVueExports,
} from "../vue-cli-host-acceptance.mjs";

const root = path.resolve("vue-cli-host-root");
const packages = {
  cli: path.join(root, "packs", "starwind-cli.tgz"),
  runtime: path.join(root, "packs", "starwind-runtime.tgz"),
  vue: path.join(root, "packs", "starwind-vue.tgz"),
};

describe("production Vue CLI host acceptance", () => {
  it("plans exact beta packages and includes Vue in public candidate acceptance", () => {
    const betaPlan = createVueBetaPackPlan({ outputDirectory: path.join(root, "packs") });
    const publicPlan = createPackPlan({ outputDirectory: path.join(root, "public-packs") });

    expect(betaPlan.packages.map(({ key }) => key)).toEqual(["runtime", "vue", "cli"]);
    expect(betaPlan.packages.map(({ name }) => name)).toEqual([
      "@starwind-ui/runtime",
      "@starwind-ui/vue",
      "starwind",
    ]);
    expect(publicPlan.packages.map(({ key }) => key)).toEqual(["runtime", "astro", "react", "cli"]);
    expect(publicPlan.packages.map(({ key }) => key)).not.toContain("vue");
    expect(
      createPackPlan({
        outputDirectory: path.join(root, "public-beta-packs"),
        vueBeta: true,
      }).packages.map(({ key }) => key),
    ).toEqual(["runtime", "astro", "react", "vue", "cli"]);
    expect(getCandidateMatrix().map(({ framework }) => framework)).toContain("vue");
  });

  it("plans isolated build-before-link execution and aggregate plus leaf cleanup", () => {
    const plan = createVueLocalLinkAcceptancePlan({ root });

    expect(plan.builds).toEqual(["runtime:build", "vue:build", "cli:build"]);
    expect(plan.links).toEqual(["runtime:link", "vue:link", "cli:link"]);
    expect(plan.cleanup).toEqual(["ul", "vue:unlink", "runtime:unlink", "cli:unlink"]);
    expect(plan.pnpmHome).toBe(path.join(root, "pnpm-global"));
    expect(plan.globalDirectory.startsWith(plan.pnpmHome)).toBe(true);
    expect(plan.consumerDirectory.startsWith(root)).toBe(true);
    expect([...plan.builds, ...plan.links].join(" ")).not.toContain("astro");
    expect([...plan.builds, ...plan.links].join(" ")).not.toContain("react");
  });

  it("plans the official Vite Vue and Astro Vue clean hosts", () => {
    const plan = createVueCliHostAcceptancePlan({ packages, root });

    expect(plan.projects.map(({ id }) => id)).toEqual([
      "vite-vue",
      "astro-vue",
      "nuxt-4",
      "nuxt-3",
      "laravel-inertia-vue",
      "quasar-spa",
      "quasar-ssr",
    ]);
    expect(plan.projects[0].scaffold.args).toEqual([
      "create",
      "vite@9.1.1",
      "vite-vue",
      "--template",
      "vue-ts",
      "--no-interactive",
    ]);
    expect(plan.projects[1].scaffold.args).toEqual([
      "create",
      "astro@5.2.3",
      "astro-vue",
      "--template",
      "minimal",
      "--no-install",
      "--no-git",
      "--yes",
    ]);
    for (const project of plan.projects) {
      expect(project.framework).toBe("vue");
      expect(project.lifecycle).toEqual([
        "init",
        "repeat-init",
        "search",
        "styled-add",
        "styled-update",
        "styled-remove",
        "styled-re-add",
        "primitive-add",
      ]);
      expect(project.packedDependencies).toEqual({
        "@starwind-ui/runtime": packages.runtime,
        "@starwind-ui/vue": packages.vue,
        starwind: packages.cli,
      });
    }
    for (const project of plan.projects.slice(0, 2)) {
      expect(project.build.args).toEqual(["build"]);
      expect(project.preview.args).toEqual(["--host", "{host}", "--port", "{port}"]);
    }
    expect(plan.projects[0].check.args).toEqual([
      "exec",
      "vue-tsc",
      "--noEmit",
      "--project",
      "tsconfig.app.json",
    ]);
    expect(plan.projects[1].check.args).toEqual(["exec", "astro", "check"]);
    for (const project of plan.projects.slice(5)) {
      expect(project.prepare.args).toEqual(["exec", "quasar", "prepare"]);
      expect(project.fixture).toMatchObject({ kind: "quasar" });
    }
  });

  it("pins authoritative commands, registry provenance, and backend quarantine", () => {
    const projects = createVueCliHostAcceptancePlan({ packages, root }).projects;
    const byId = Object.fromEntries(projects.map((project) => [project.id, project]));

    for (const id of ["nuxt-4", "nuxt-3"]) {
      expect(byId[id].check.args).toEqual(["exec", "nuxt", "typecheck"]);
      expect(byId[id].build.args).toEqual(["build"]);
      expect(byId[id].preview).toMatchObject({
        args: [".output/server/index.mjs"],
        command: process.execPath,
      });
    }
    expect(byId["laravel-inertia-vue"].check.args).toEqual([
      "exec",
      "vue-tsc",
      "--noEmit",
      "--project",
      "tsconfig.json",
    ]);
    expect(byId["laravel-inertia-vue"].build.args).toEqual(["build"]);
    expect(byId["laravel-inertia-vue"].preview).toBeNull();
    expect(byId["laravel-inertia-vue"].preserveFiles).toEqual(["artisan", "composer.json"]);
    expect(byId["quasar-spa"].build.args).toEqual(["exec", "quasar", "build"]);
    expect(byId["quasar-ssr"].build.args).toEqual(["exec", "quasar", "build", "-m", "ssr"]);
    expect(byId["quasar-ssr"].preview).toMatchObject({
      args: ["dist/ssr/index.js"],
      command: process.execPath,
    });
    expect(byId["quasar-ssr"].ssrInstall).toMatchObject({ args: ["install"] });
    expect(byId["quasar-ssr"].ssrInstall.cwd).toBe(path.join(root, "quasar-ssr", "src-ssr"));
    expect(byId["quasar-ssr"].postBuild).toMatchObject({ args: ["install", "--prod"] });
    expect(byId["quasar-ssr"].postBuild.cwd).toBe(path.join(root, "quasar-ssr", "dist", "ssr"));
    expect(byId["quasar-ssr"].registryDependencyRoots).toEqual([
      { directory: "src-ssr", packages: ["@hono/node-server", "hono"] },
    ]);
    expect(byId["quasar-spa"].preview.args).toEqual([
      "node_modules/vite/bin/vite.js",
      "preview",
      "--host",
      "{host}",
      "--port",
      "{port}",
      "--strictPort",
      "--outDir",
      "dist/spa",
    ]);
    expect(byId["nuxt-4"].registryDependencies).not.toContain("vite");
    expect(byId["quasar-spa"].registryDependencies).toContain("vite");
    for (const project of projects) {
      expect(project.registryDependencies).toEqual(
        expect.arrayContaining([
          "@tailwindcss/forms",
          "@tailwindcss/vite",
          "tailwindcss",
          "tw-animate-css",
        ]),
      );
      const commands = [
        project.scaffold,
        project.prepare,
        project.check,
        project.build,
        project.preview,
        project.ssrInstall,
        project.postBuild,
      ]
        .flatMap((command) => command?.args ?? [])
        .join(" ");
      expect(commands).not.toMatch(/\b(?:composer|php)\b/i);
    }
  });

  it("captures Vue hydration mismatch warnings only for SSR and island hosts", () => {
    expect(isVueHydrationMismatchWarning("[Vue warn]: Hydration text content mismatch")).toBe(true);
    expect(isVueHydrationMismatchWarning("Hydration completed but contains mismatches.")).toBe(
      true,
    );
    expect(isVueHydrationMismatchWarning("Third-party package is deprecated")).toBe(false);
    expect(shouldCaptureVueHydrationWarnings({ host: "nuxt" })).toBe(true);
    expect(shouldCaptureVueHydrationWarnings({ fixture: { mode: "ssr" } })).toBe(true);
    expect(shouldCaptureVueHydrationWarnings({ id: "astro-vue" })).toBe(true);
    expect(shouldCaptureVueHydrationWarnings({ id: "vite-vue" })).toBe(false);
  });

  it("detects Nuxt component collisions and accepts only SFC plus unrelated user declarations", async () => {
    expect(
      isNuxtComponentCollisionWarning(
        "Two component files resolving to the same name StarwindCollapsible",
      ),
    ).toBe(true);
    expect(isNuxtComponentCollisionWarning("Nuxt build completed")).toBe(false);

    const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-nuxt-components-"));
    const project = {
      directory: path.join(fixtureRoot, "nuxt-4"),
      host: "nuxt",
      id: "nuxt-4",
    };
    const logs = path.join(fixtureRoot, "logs");
    try {
      await mkdir(path.join(project.directory, ".nuxt"), { recursive: true });
      await mkdir(logs, { recursive: true });
      await writeFile(path.join(logs, "09-typecheck.log"), "typecheck passed\n");
      await writeFile(path.join(logs, "10-build.log"), "build passed\n");
      await writeFile(
        path.join(project.directory, ".nuxt", "components.d.ts"),
        `declare module 'vue' {
  export interface GlobalComponents {
    StarwindCollapsible: typeof import('../app/components/starwind/collapsible/Collapsible.vue')['default']
    StarwindPrimitivesButtonRoot: typeof import('../app/components/starwind-primitives/button/ButtonRoot.vue')['default']
    UserTypeScript: typeof import('../app/components/UserTypeScript.ts')['default']
    UserVue: typeof import('../app/components/UserVue.vue')['default']
  }
}
`,
      );

      await expect(assertNuxtComponentDiscovery(project, logs)).resolves.toBeUndefined();
      await writeFile(
        path.join(logs, "10-build.log"),
        "Two component files resolving to the same name StarwindCollapsible\n",
      );
      await expect(assertNuxtComponentDiscovery(project, logs)).rejects.toThrow(
        /duplicate Nuxt component/i,
      );
      await writeFile(path.join(logs, "10-build.log"), "build passed\n");
      await writeFile(
        path.join(project.directory, ".nuxt", "components.d.ts"),
        `export const StarwindCollapsible: unknown;
export const StarwindPrimitivesButtonRoot: unknown;
export const UserTypeScript: unknown;
export const UserVue: unknown;
export const StarwindCollapsibleHelper: typeof import('../app/components/starwind/collapsible/internal-helper.ts')['default'];
`,
      );
      await expect(assertNuxtComponentDiscovery(project, logs)).rejects.toThrow(
        /Styled TypeScript file/i,
      );
    } finally {
      await rm(fixtureRoot, { force: true, recursive: true });
    }
  });

  it("rejects malformed packed Vue declarations through the consumer compiler", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-declaration-test-"));
    const packageDirectory = path.join(directory, "node_modules/@starwind-ui/vue");
    const logsDirectory = path.join(directory, "logs");
    await mkdir(path.join(packageDirectory, "dist/button"), { recursive: true });
    await writeFile(
      path.join(packageDirectory, "package.json"),
      `${JSON.stringify({
        exports: {
          ".": { import: "./dist/index.js", types: "./dist/index.d.ts" },
          "./button": { import: "./dist/button/index.js", types: "./dist/button/index.d.ts" },
        },
        name: "@starwind-ui/vue",
        type: "module",
        version: "0.1.0",
      })}\n`,
    );
    await Promise.all([
      writeFile(path.join(packageDirectory, "dist/index.d.ts"), "export type Broken = ;\n"),
      writeFile(path.join(packageDirectory, "dist/index.js"), "export {};\n"),
      writeFile(
        path.join(packageDirectory, "dist/button/index.d.ts"),
        "export type Button = {};\n",
      ),
      writeFile(path.join(packageDirectory, "dist/button/index.js"), "export {};\n"),
    ]);
    await symlink(
      await realpath("node_modules/typescript"),
      path.join(directory, "node_modules/typescript"),
    );
    await expect(verifyPackedVueExports({ directory }, logsDirectory)).rejects.toThrow(
      /09-packed-declarations/,
    );
    await rm(directory, { force: true, recursive: true });
  });

  it("rejects workspace and source fallbacks from every host-owned isolation config", async () => {
    const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-host-isolation-"));
    try {
      const projects = createVueCliHostAcceptancePlan({ packages, root: fixtureRoot }).projects;
      const injectionFiles = {
        "vite-vue": "vite.config.ts",
        "astro-vue": "astro.config.mjs",
        "nuxt-4": "nuxt.config.ts",
        "nuxt-3": "nuxt.config.ts",
        "laravel-inertia-vue": "vite.config.ts",
        "quasar-spa": "quasar.config.ts",
        "quasar-ssr": "src-ssr/server.ts",
      };
      for (const project of projects) {
        const relative = injectionFiles[project.id];
        expect(project.sourceIsolationFiles).toContain(relative);
        const file = path.join(project.directory, relative);
        await mkdir(path.dirname(file), { recursive: true });
        const original = "export default {};\n";
        await writeFile(file, original, "utf8");
        await writeFile(
          file,
          original + "// " + path.resolve(".").replaceAll("\\", "/") + "\n",
          "utf8",
        );
        await expect(assertNoWorkspaceSourceAliases(project)).rejects.toThrow(
          project.id + ":" + relative + " contains",
        );
        await writeFile(file, original, "utf8");
        expect(await readFile(file, "utf8")).toBe(original);
      }
    } finally {
      await rm(fixtureRoot, { force: true, recursive: true });
    }
  });

  it("builds the checked Quasar v3 entry marker and detects Laravel backend mutation", async () => {
    const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-host-plan-"));
    try {
      const projects = createVueCliHostAcceptancePlan({ packages, root: fixtureRoot }).projects;
      const quasar = projects.find(({ id }) => id === "quasar-spa");
      const quasarSsr = projects.find(({ id }) => id === "quasar-ssr");
      const laravel = projects.find(({ id }) => id === "laravel-inertia-vue");
      if (!quasar || !quasarSsr || !laravel) throw new Error("Expected host scenarios.");
      await createOfficialVueHostFixture(quasar);
      await createOfficialVueHostFixture(quasarSsr);
      await createOfficialVueHostFixture(laravel);
      const packageRanges = await captureVueHostPackageRanges(laravel);
      expect(packageRanges.vue).toEqual({ dependencies: "3.5.39" });
      expect(packageRanges.tailwindcss).toEqual({ dependencies: "^4.1" });
      await expect(
        assertPreservedVueHostPackageRanges(laravel, packageRanges),
      ).resolves.toBeUndefined();
      const manifestFile = path.join(laravel.directory, "package.json");
      const originalManifest = await readFile(manifestFile, "utf8");
      const changedManifest = JSON.parse(originalManifest);
      changedManifest.dependencies.tailwindcss = "^4.2";
      await writeFile(manifestFile, JSON.stringify(changedManifest, null, 2) + "\n", "utf8");
      await expect(assertPreservedVueHostPackageRanges(laravel, packageRanges)).rejects.toThrow(
        "changed the direct tailwindcss package declaration",
      );
      await writeFile(manifestFile, originalManifest, "utf8");
      expect(await readFile(path.join(quasar.directory, "index.html"), "utf8")).toContain(
        "<!-- quasar:entry-point -->",
      );
      const quasarManifest = JSON.parse(
        await readFile(path.join(quasar.directory, "package.json"), "utf8"),
      );
      expect(quasarManifest.dependencies["vue-router"]).toBe("^5.0.6");
      const router = await readFile(path.join(quasar.directory, "src/router/index.ts"), "utf8");
      expect(router).toContain("from '#q-app'");
      expect(router).toContain("import.meta.env.QUASAR_SERVER");
      expect(router).not.toContain("#q-app/wrappers");
      expect(
        await readFile(path.join(quasar.directory, "src/pages/IndexPage.vue"), "utf8"),
      ).toContain('import Acceptance from "../components/Acceptance.vue"');
      const ssrManifest = JSON.parse(
        await readFile(path.join(quasarSsr.directory, "src-ssr/package.json"), "utf8"),
      );
      expect(ssrManifest.dependencies).toEqual({ "@hono/node-server": "^2.0.0", hono: "^4.12.12" });
      const server = await readFile(path.join(quasarSsr.directory, "src-ssr/server.ts"), "utf8");
      expect(server).toContain("defineSsrListen");
      expect(server).toContain("defineSsrRenderPreloadTag");
      const render = await readFile(
        path.join(quasarSsr.directory, "src-ssr/middlewares/render.ts"),
        "utf8",
      );
      expect(render).toContain("await render(");
      const preserved = await capturePreservedVueHostBytes(laravel);
      await expect(assertPreservedVueHostBytes(laravel, preserved)).resolves.toBeUndefined();
      await writeFile(path.join(laravel.directory, "composer.json"), "{}\n", "utf8");
      await expect(assertPreservedVueHostBytes(laravel, preserved)).rejects.toThrow(
        /changed preserved backend fixture bytes/,
      );
    } finally {
      await rm(fixtureRoot, { force: true, recursive: true });
    }
  });

  it("uses local Styled, Primitive, and packed Theme surfaces in both fixtures", () => {
    const [vite, astro] = createVueCliHostAcceptancePlan({ packages, root }).projects;
    expect(getViteVueFixture(vite)).toBe(getVueFixture(vite, "src"));
    expect(getAstroVueFixture(astro)).toBe(getVueFixture(astro, "src/components"));
    for (const fixture of [getViteVueFixture(vite), getAstroVueFixture(astro)]) {
      expect(fixture).toContain("CollapsibleTrigger");
      expect(fixture).toContain("CollapsibleContent");
      expect(fixture).toContain("ButtonRoot");
      expect(fixture).toContain('from "@starwind-ui/vue/theme"');
      expect(fixture).toContain('v-model:open="open"');
      expect(fixture).toContain("Toggle acceptance");
      expect(fixture).toContain("Runtime panel content");
    }
    expect(getAstroPageFixture()).toContain("<Acceptance client:load />");
    expect(getAstroPageFixture()).toContain('import "../styles/starwind.css";');
  });

  it("pins each tarball to its importer, package resolution, and snapshot", () => {
    const expected = {
      "@starwind-ui/runtime": {
        direct: false,
        file: packages.runtime,
        version: "0.1.0-beta.8",
      },
      "@starwind-ui/vue": { file: packages.vue, version: "0.2.0" },
      starwind: { file: packages.cli, version: "3.3.0" },
    };
    const installed = {
      "@starwind-ui/runtime": { name: "@starwind-ui/runtime", version: "0.1.0-beta.8" },
      "@starwind-ui/vue": { name: "@starwind-ui/vue", version: "0.2.0" },
      starwind: { name: "starwind", version: "3.3.0" },
    };
    const assertLockfile = (lockfile: string, installedPackages = installed) =>
      assertPackedVueHostProvenance({
        expected,
        installed: installedPackages,
        lockfile,
        lockfileDirectory: root,
      });

    expect(() => assertLockfile(createPackedLockfile(packages))).not.toThrow();
    expect(() =>
      assertLockfile(createPackedLockfile(packages), {
        ...installed,
        "@starwind-ui/vue": { name: "@starwind-ui/vue", version: "0.0.1" },
      }),
    ).toThrow(/installed version/);
    expect(() =>
      assertLockfile(
        createPackedLockfile(packages).replace(
          `version: file:${relativePackageFile(packages.vue)}`,
          `version: file:${relativePackageFile(packages.runtime)}`,
        ),
      ),
    ).toThrow(/importer version/);
    expect(() =>
      assertLockfile(
        createPackedLockfile(packages).replace(
          "snapshots:",
          `  'duplicate-vue@file:${relativePackageFile(packages.vue)}':\n    resolution: {tarball: file:${relativePackageFile(packages.vue)}}\nsnapshots:`,
        ),
      ),
    ).toThrow(/exactly one package resolution/);
    expect(() =>
      assertLockfile(
        `${createPackedLockfile(packages)}orphan: file:${relativePackageFile(packages.cli)}\n`,
      ),
    ).toThrow(/orphaned lockfile reference/);
    expect(() =>
      assertLockfile(
        replaceLast(
          createPackedLockfile(packages),
          `'@starwind-ui/runtime': file:${relativePackageFile(packages.runtime)}`,
          `'@starwind-ui/runtime': file:${relativePackageFile(packages.cli)}`,
        ),
      ),
    ).toThrow(/Runtime dependency/);
  });

  it("checks exact archive provenance through workspace and pack directory symlinks", async () => {
    const fixture = await mkdtemp(path.join(os.tmpdir(), "vue-pack-paths-"));
    try {
      const workspace = path.join(fixture, "actual/workspace");
      const archives = path.join(fixture, "actual/packs");
      const workspaceAlias = path.join(fixture, "workspace-alias");
      const packsAlias = path.join(fixture, "packs-alias");
      await mkdir(workspace, { recursive: true });
      await mkdir(archives, { recursive: true });
      await symlink(workspace, workspaceAlias, process.platform === "win32" ? "junction" : "dir");
      await symlink(archives, packsAlias, process.platform === "win32" ? "junction" : "dir");
      const versions = { runtime: "0.1.0-beta.8", vue: "0.2.0", cli: "3.3.0" };
      let lockfile = createPackedLockfile(packages);
      const expected: Record<string, { direct?: boolean; file: string; version: string }> = {};
      const installed: Record<string, { name: string; version: string }> = {};
      for (const key of ["runtime", "vue", "cli"] as const) {
        const name = key === "cli" ? "starwind" : `@starwind-ui/${key}`;
        const file = path.join(archives, `${key}.tgz`);
        await writeFile(file, key);
        lockfile = lockfile.replaceAll(
          relativePackageFile(packages[key]),
          path.relative(workspace, file).replaceAll("\\", "/"),
        );
        expected[name] = {
          direct: key !== "runtime",
          file: path.join(packsAlias, `${key}.tgz`),
          version: versions[key],
        };
        installed[name] = { name, version: versions[key] };
      }
      const check = () =>
        assertPackedVueHostProvenance({
          expected,
          installed,
          lockfile,
          lockfileDirectory: workspaceAlias,
        });
      expect(check).not.toThrow();
      await writeFile(path.join(archives, "other.tgz"), "runtime");
      expected["@starwind-ui/runtime"].file = path.join(packsAlias, "other.tgz");
      expect(check).toThrow(/exactly one package resolution/);
    } finally {
      await rm(fixture, { recursive: true, force: true });
    }
  });

  it("stages verified shared archives outside the repository without weakening source isolation", async () => {
    const shared = await mkdtemp(path.join(process.cwd(), "node_modules/vue-shared-packs-"));
    const fixture = await mkdtemp(path.join(os.tmpdir(), "vue-staged-packs-"));
    const entries: Record<
      string,
      { file: string; manifest: { name: string; version: string }; sha256: string }
    > = {};
    try {
      for (const key of ["runtime", "vue", "cli"]) {
        const bytes = Buffer.from(`verified-${key}`);
        await writeFile(path.join(shared, `${key}.tgz`), bytes);
        entries[key] = {
          file: `${key}.tgz`,
          manifest: { name: key, version: "9.8.7" },
          sha256: createHash("sha256").update(bytes).digest("hex"),
        };
      }
      const outputDirectory = path.join(fixture, "packs");
      const prepare = () =>
        prepareVueHostPackages(
          { packsDirectory: shared, outputDirectory },
          {
            loadArtifacts: async () => ({ packages: entries }),
            packPackages: async () => {
              throw new Error("must reuse packs");
            },
          },
        );
      const prepared = await prepare();
      expect(prepared.manifests.vue.version).toBe("9.8.7");
      for (const key of ["runtime", "vue", "cli"]) {
        expect(prepared.packages[key]).toBe(path.join(outputDirectory, `${key}.tgz`));
        expect(await readFile(prepared.packages[key])).toEqual(
          await readFile(path.join(shared, `${key}.tgz`)),
        );
      }
      const project = {
        id: "fixture",
        directory: fixture,
        sourceIsolationFiles: ["vite.config.ts"],
      };
      await writeFile(
        path.join(fixture, "package.json"),
        JSON.stringify({ dependencies: { starwind: `file:${prepared.packages.cli}` } }),
      );
      await expect(assertNoWorkspaceSourceAliases(project)).resolves.toBeUndefined();
      await writeFile(
        path.join(fixture, "vite.config.ts"),
        `export default { alias: ${JSON.stringify(path.resolve("packages/vue/src"))} };`,
      );
      await expect(assertNoWorkspaceSourceAliases(project)).rejects.toThrow(/contains/);
      await writeFile(path.join(shared, "vue.tgz"), "changed after validation");
      await expect(prepare()).rejects.toThrow(/archive changed/i);
    } finally {
      await rm(shared, { recursive: true, force: true });
      await rm(fixture, { recursive: true, force: true });
    }
    expect(parseArgs(["--packs", "/tmp/shared-packs", "--concurrency", "1"])).toMatchObject({
      packsDirectory: "/tmp/shared-packs",
      concurrency: 1,
    });
    expect(parseArgs([]).concurrency).toBe(2);
    expect(() => parseArgs(["--concurrency", "0"])).toThrow(/concurrency/i);
  });

  it("dispatches bounded workers with isolated roots and the same staged packs", async () => {
    const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), "vue-workers-"));
    const contexts: { root: string; prepared: { packages: typeof packages } }[] = [];
    let active = 0;
    let maximum = 0;
    let releaseWorkers!: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseWorkers = resolve;
    });
    let markBothStarted!: () => void;
    const bothStarted = new Promise<void>((resolve) => {
      markBothStarted = resolve;
    });
    try {
      const execution = runVueHostWorkers(
        ["one", "two", "three"].map((id) => ({ id })),
        {
          root: fixtureRoot,
          prepared: { packages },
          concurrency: 2,
        },
        async (_phase: string, command: { command: string; args: string[] }) => {
          expect(command.command).toBe(process.execPath);
          expect(command.args[1]).toBe("--tsconfig");
          expect(command.args[2]).toBe(path.resolve("packages/cli/tsconfig.json"));
          contexts.push(JSON.parse(await readFile(command.args.at(-1)!, "utf8")));
          maximum = Math.max(maximum, ++active);
          if (active === 2) markBothStarted();
          await gate;
          active--;
        },
      );
      await bothStarted;
      expect(active).toBe(2);
      releaseWorkers();
      await execution;
      expect(maximum).toBe(2);
      expect(new Set(contexts.map((context) => context.root)).size).toBe(3);
      expect(
        contexts.every(
          (context) => JSON.stringify(context.prepared.packages) === JSON.stringify(packages),
        ),
      ).toBe(true);
    } finally {
      await rm(fixtureRoot, { recursive: true, force: true });
    }
  });

  it("propagates a real isolated worker failure with its diagnostics", async () => {
    const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), "vue-worker-error-"));
    try {
      await expect(
        runVueHostWorkers([{ id: "unknown-host" }], {
          root: fixtureRoot,
          prepared: { packages, manifests: {} },
          concurrency: 1,
        }),
      ).rejects.toThrow(/Unknown Vue host acceptance project id/);
      expect(
        await readFile(path.join(fixtureRoot, "logs/unknown-host-worker.log"), "utf8"),
      ).toContain("Unknown Vue host acceptance project id");
      const archive = path.join(fixtureRoot, "changed.tgz");
      await writeFile(archive, "changed");
      await expect(
        runVueHostWorkers([{ id: "unknown-host" }], {
          root: fixtureRoot,
          prepared: {
            packages: { ...packages, runtime: archive },
            manifests: {},
            archiveHashes: { runtime: "original-hash" },
          },
          concurrency: 1,
        }),
      ).rejects.toThrow(/Staged release archive changed/);
    } finally {
      await rm(fixtureRoot, { recursive: true, force: true });
    }
  });

  it("retains failed roots and supports explicit successful retention", () => {
    expect(shouldPreserveVueHostRoot({ failed: true, keepTemp: false })).toBe(true);
    expect(shouldPreserveVueHostRoot({ failed: false, keepTemp: true })).toBe(true);
    expect(shouldPreserveVueHostRoot({ failed: false, keepTemp: false })).toBe(false);
    expect(parseArgs(["--keep-temp"])).toMatchObject({
      keepTemp: true,
      localLinkOnly: false,
      projectIds: undefined,
      rootDirectory: undefined,
    });
    expect(parseArgs(["--local-link-only"])).toMatchObject({
      keepTemp: false,
      localLinkOnly: true,
      projectIds: undefined,
      rootDirectory: undefined,
    });
    expect(parseArgs(["--project", "nuxt-4", "--root", "/tmp/vue-host"])).toMatchObject({
      keepTemp: false,
      localLinkOnly: false,
      projectIds: ["nuxt-4"],
      rootDirectory: "/tmp/vue-host",
    });
    expect(() => parseArgs(["--private-vue"])).toThrow(/Unknown argument/);
  });

  it("attempts every cleanup and retains operation plus cleanup failures", async () => {
    const calls: string[] = [];
    await expect(
      runCleanupOperations([
        async () => {
          calls.push("first");
          throw new Error("first cleanup failed");
        },
        async () => {
          calls.push("second");
        },
        async () => {
          calls.push("third");
          throw new Error("third cleanup failed");
        },
      ]),
    ).rejects.toBeInstanceOf(AggregateError);
    expect(calls).toEqual(["first", "second", "third"]);

    const combined = runWithCleanup(async () => {
      throw new Error("capability failed");
    }, [async () => Promise.reject(new Error("registry cleanup failed"))]);
    await expect(combined).rejects.toMatchObject({
      errors: [expect.objectContaining({ message: "capability failed" }), expect.anything()],
    });
  });

  it.skipIf(process.platform === "win32")("stops a detached preview process group", async () => {
    const child = spawn(
      process.execPath,
      ["-e", "process.on('SIGTERM', () => {}); setInterval(() => {}, 1000)"],
      {
        detached: true,
        stdio: "ignore",
      },
    );
    await stopPreviewTree({ child, getOutput: () => "" });
    await waitForExit(child);
    expect(child.exitCode ?? child.signalCode).not.toBeNull();
    expect(isPreviewTreeAlive({ child })).toBe(false);
  });

  it("uses public Commander choices and checked-in Vue beta registry artifacts", async () => {
    const [program, registry, primitives, vueManifest] = await Promise.all([
      readFile("packages/cli/src/program.ts", "utf8"),
      readFile("packages/cli/src/registry/bundled-registry.json", "utf8"),
      readFile("packages/cli/src/registry/primitive-vendoring-artifacts.json", "utf8"),
      readFile("packages/vue/package.json", "utf8"),
    ]);

    expect(program).toContain('"vue",');
    expect(program).not.toContain("PRIVATE_VUE_FRAMEWORK_TARGET_POLICY");
    expect(JSON.parse(registry).setup.vue.adapterPackage).toEqual({
      name: "@starwind-ui/vue",
      range: JSON.parse(vueManifest).version,
    });
    expect(
      JSON.parse(primitives).primitives.some(
        (artifact: { framework: string }) => artifact.framework === "vue",
      ),
    ).toBe(true);
  });
});

function replaceLast(source: string, search: string, replacement: string): string {
  const index = source.lastIndexOf(search);
  if (index === -1) throw new Error(`Missing fixture value: ${search}`);
  return source.slice(0, index) + replacement + source.slice(index + search.length);
}

function relativePackageFile(file: string): string {
  return path.relative(root, file).replaceAll("\\", "/");
}

function createPackedLockfile(files: typeof packages): string {
  const relative = relativePackageFile;
  return `lockfileVersion: '9.0'
overrides:
  '@starwind-ui/runtime': file:${relative(files.runtime)}
  '@starwind-ui/vue': file:${relative(files.vue)}
  starwind: file:${relative(files.cli)}
importers:
  .:
    dependencies:
      '@starwind-ui/vue':
        specifier: file:${relative(files.vue)}
        version: file:${relative(files.vue)}(vue@3.5.39)
    devDependencies:
      starwind:
        specifier: file:${relative(files.cli)}
        version: file:${relative(files.cli)}
packages:
  '@starwind-ui/runtime@file:${relative(files.runtime)}':
    resolution: {tarball: file:${relative(files.runtime)}}
  '@starwind-ui/vue@file:${relative(files.vue)}':
    resolution: {tarball: file:${relative(files.vue)}}
  'starwind@file:${relative(files.cli)}':
    resolution: {tarball: file:${relative(files.cli)}}
snapshots:
  '@starwind-ui/runtime@file:${relative(files.runtime)}': {}
  '@starwind-ui/vue@file:${relative(files.vue)}(vue@3.5.39)':
    dependencies:
      '@starwind-ui/runtime': file:${relative(files.runtime)}
  'starwind@file:${relative(files.cli)}': {}
`;
}

async function waitForExit(child: ReturnType<typeof spawn>): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return;
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Preview process did not exit.")), 5_000);
    child.once("close", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}
