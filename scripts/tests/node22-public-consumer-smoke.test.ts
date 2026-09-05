import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  assertPackedPackageProvenance,
  assertExactNodeVersion,
  createNodeFloorPlan,
  getJavaScriptTypecheckConfig,
  getPackedProjectDependencies,
  getProjectCheck,
  parseArgs,
} from "../node22-public-consumer-smoke.mjs";
import { createPackPlan, parseArgs as parsePackArgs } from "../pack-public-release-artifacts.mjs";

describe("Node 22 public consumer smoke", () => {
  it("packs the four public packages in publication order", () => {
    const outputDirectory = path.resolve("release-packs");

    expect(createPackPlan({ outputDirectory }).packages).toEqual([
      expect.objectContaining({ key: "runtime", name: "@starwind-ui/runtime" }),
      expect.objectContaining({ key: "astro", name: "@starwind-ui/astro" }),
      expect.objectContaining({ key: "react", name: "@starwind-ui/react" }),
      expect.objectContaining({ key: "cli", name: "starwind" }),
    ]);
    expect(createPackPlan({ outputDirectory }).packages.map(({ key }) => key)).not.toContain("vue");
    expect(
      createPackPlan({ outputDirectory, vueBeta: true }).packages.map(({ key }) => key),
    ).toEqual(["runtime", "astro", "react", "vue", "cli"]);
  });

  it("packs to the shared release directory by default", () => {
    expect(parsePackArgs([])).toEqual({ outputDirectory: path.resolve(".release-packs") });
    expect(parsePackArgs(["--output", "custom-packs"])).toEqual({
      outputDirectory: path.resolve("custom-packs"),
    });
    expect(parsePackArgs(["--vue-beta", "--output", "custom-packs"])).toEqual({
      outputDirectory: path.resolve("custom-packs"),
      vueBeta: true,
    });
  });

  it("requires the exact declared Node floor", () => {
    expect(() => assertExactNodeVersion("v22.12.0", "v22.12.0")).not.toThrow();
    expect(() => assertExactNodeVersion("v22.13.0", "v22.12.0")).toThrow(/exactly v22\.12\.0/);
    expect(() => assertExactNodeVersion("v24.0.0", "v22.12.0")).toThrow(/exactly v22\.12\.0/);
  });

  it("uses packed packages through the installed CLI shim in Astro 7 and Vite React JavaScript", () => {
    const packagesDirectory = path.resolve("release-packs");
    const root = path.resolve("node-floor-root");
    const plan = createNodeFloorPlan({ packagesDirectory, root });

    expect(plan.requiredNodeVersion).toBe("v22.12.0");
    expect(plan.packageManager).toBe(process.platform === "win32" ? "npm.cmd" : "npm");
    expect(
      plan.projects.map(({ framework, host, language }) => ({ framework, host, language })),
    ).toEqual([
      { framework: "astro", host: "astro", language: "astro" },
      { framework: "react", host: "vite", language: "javascript" },
    ]);
    expect(plan.projects[0].scaffold.args.slice(0, 6)).toEqual([
      "create",
      "astro@5.2.3",
      "--",
      "astro",
      "--template",
      "minimal",
    ]);
    expect(plan.projects[1].scaffold.args.slice(0, 6)).toEqual([
      "create",
      "vite@9.1.1",
      "--",
      "react",
      "--template",
      "react",
    ]);
    expect(plan.cliShim).toBe(
      path.join(
        root,
        "node_modules",
        ".bin",
        process.platform === "win32" ? "starwind.cmd" : "starwind",
      ),
    );
    for (const project of plan.projects) {
      expect(project.scaffold.command).toBe(plan.packageManager);
      expect(project.init.command).toBe(plan.cliShim);
      expect(project.init.args).toEqual(["init", "--defaults"]);
      expect(project.add).toMatchObject({
        args: ["add", "button", "dialog", "color-picker", "--yes", "--package-manager", "npm"],
        command: plan.cliShim,
      });
      expect(project.build).toMatchObject({ command: plan.packageManager, args: ["run", "build"] });
    }
  });

  it("uses the release pack directory by default and accepts an override", () => {
    expect(parseArgs(["--packages", "release-packs"])).toEqual({
      keepTemp: false,
      packagesDirectory: path.resolve("release-packs"),
    });
    expect(parseArgs([])).toEqual({
      keepTemp: false,
      packagesDirectory: path.resolve(".release-packs"),
    });
  });

  it("restores and verifies packed adapter and Runtime provenance after CLI package changes", () => {
    const packagesDirectory = path.resolve("release-packs");
    const project = { framework: "react" };
    const artifactManifest = {
      packages: {
        react: { file: "starwind-react.tgz" },
        runtime: { file: "starwind-runtime.tgz" },
      },
    };
    const dependencies = getPackedProjectDependencies(project, packagesDirectory, artifactManifest);
    const packedLockfile = {
      packages: {
        "node_modules/@starwind-ui/react": {
          resolved: "file:../release-packs/starwind-react.tgz",
        },
        "node_modules/@starwind-ui/runtime": {
          resolved: "file:../release-packs/starwind-runtime.tgz",
        },
      },
    };

    expect(dependencies).toEqual({
      "@starwind-ui/react": `file:${path.join(packagesDirectory, "starwind-react.tgz").replaceAll("\\", "/")}`,
      "@starwind-ui/runtime": `file:${path.join(packagesDirectory, "starwind-runtime.tgz").replaceAll("\\", "/")}`,
    });
    expect(() =>
      assertPackedPackageProvenance(
        project,
        packagesDirectory,
        artifactManifest,
        { dependencies },
        packedLockfile,
      ),
    ).not.toThrow();
    expect(() =>
      assertPackedPackageProvenance(
        project,
        packagesDirectory,
        artifactManifest,
        { dependencies },
        {
          packages: {
            ...packedLockfile.packages,
            "node_modules/@starwind-ui/react": {
              resolved: "https://registry.npmjs.org/@starwind-ui/react/-/react-0.1.0-beta.7.tgz",
            },
          },
        },
      ),
    ).toThrow();
  });

  it("checks the JavaScript app and installed generated TSX source", () => {
    const project = createNodeFloorPlan({
      packagesDirectory: path.resolve("release-packs"),
      root: path.resolve("node-floor-root"),
    }).projects[1];

    expect(getProjectCheck(project).args).toEqual([
      "exec",
      "--",
      "tsc",
      "--project",
      "tsconfig.starwind-acceptance.json",
    ]);
    expect(getProjectCheck(project).command).toBe(process.platform === "win32" ? "npm.cmd" : "npm");
    expect(getJavaScriptTypecheckConfig()).toMatchObject({
      compilerOptions: { allowJs: true, checkJs: true, noEmit: true },
      include: expect.arrayContaining(["src/**/*.jsx", "src/**/*.tsx"]),
    });
  });

  it("runs as one focused exact-Node workflow without the full candidate matrix", async () => {
    const workflow = await readFile(".github/workflows/verify.yml", "utf8");
    const jobStart = workflow.indexOf("  node22-public-consumer:");
    const nextJob = workflow.indexOf("\n  windows-packed-cli:", jobStart);
    const job = workflow.slice(jobStart, nextJob);

    expect(job).toContain("node-version: 22.12.0");
    expect(job).toContain("pnpm release:pack:public-artifacts");
    expect(job).toContain("npm run release:consumer:node22");
    expect(job.slice(job.indexOf("Setup exact public Node floor"))).not.toContain("cache: pnpm");
    expect(job).not.toContain("release:candidate:acceptance");
  });
});
