import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";
import {
  createCandidatePlan,
  createCandidateVerificationPlan,
  getCandidateFixtureFiles,
  getCandidateManifestScriptCommand,
  getCandidateMatrix,
  getCandidateWorkspacePackage,
  getCandidateWorkspacePolicy,
  parseArgs,
  prepareCandidatePackages,
  runCandidateProjects,
  startCandidateRegistry,
} from "../release-candidate-acceptance.mjs";
import { RELEASE_PACKS, releaseGateStages } from "../release-gate.mjs";

const root = path.resolve("candidate-root");
const packages = {
  astro: path.join(root, "packs", "astro.tgz"),
  cli: path.join(root, "packs", "starwind.tgz"),
  react: path.join(root, "packs", "react.tgz"),
  runtime: path.join(root, "packs", "runtime.tgz"),
  vue: path.join(root, "packs", "vue.tgz"),
};
const vueAdapterVersion = "0.2.0";

describe("release candidate acceptance", () => {
  it("bounds active projects and waits for workers before surfacing errors", async () => {
    let active = 0;
    let maximum = 0;
    const started: number[] = [];
    const releases: (() => void)[] = [];
    const failure = new Error("host failed");
    const execution = runCandidateProjects([0, 1, 2], {
      concurrency: 2,
      runProject: async (id: number) => {
        started.push(id);
        maximum = Math.max(maximum, ++active);
        await new Promise<void>((resolve) => releases.push(resolve));
        active--;
        if (id === 0) throw failure;
      },
    });
    const rejection = expect(execution).rejects.toThrow("host failed");
    expect(started).toEqual([0, 1]);
    releases[0]();
    await new Promise((resolve) => setImmediate(resolve));
    expect(active).toBe(1);
    expect(started).toEqual([0, 1]);
    releases[1]();
    await rejection;
    expect(active).toBe(0);
    expect(maximum).toBe(2);
  });

  it("runs every selected project with diagnostic concurrency one", async () => {
    const seen: number[] = [];
    await runCandidateProjects([0, 1, 2], {
      concurrency: 1,
      runProject: async (id: number) => {
        seen.push(id);
      },
    });
    expect(seen).toEqual([0, 1, 2]);
    await expect(
      runCandidateProjects([], { concurrency: 0, runProject: async () => {} }),
    ).rejects.toThrow(/concurrency/i);
    expect(parseArgs(["--packs", "/tmp/packs", "--concurrency", "1"])).toMatchObject({
      packsDirectory: "/tmp/packs",
      concurrency: 1,
    });
    expect(parseArgs([]).concurrency).toBe(2);
    expect(() => parseArgs(["--concurrency", "1.5"])).toThrow(/concurrency/i);
  });

  it("reuses validated prepared packs and their packed registry metadata", async () => {
    const entries = Object.fromEntries(
      ["runtime", "astro", "react", "vue", "cli"].map((key) => [
        key,
        {
          file: `${key}.tgz`,
          name: key === "cli" ? "starwind" : `@starwind-ui/${key}`,
          version: "9.8.7",
          manifest: { name: `packed-${key}`, dependencies: { runtime: "9.8.7" } },
        },
      ]),
    );
    const loaded = await prepareCandidatePackages(
      { packsDirectory: "/tmp/shared-packs", packDirectory: "/tmp/unused" },
      {
        loadArtifacts: async ({ outputDirectory }: { outputDirectory: string }) => {
          expect(outputDirectory).toBe(path.resolve("/tmp/shared-packs"));
          return { packages: entries };
        },
        packPackages: async () => {
          throw new Error("must reuse packs");
        },
      },
    );
    expect(loaded.packages.vue).toBe(path.resolve("/tmp/shared-packs/vue.tgz"));
    expect(loaded.registryPackages.vue.manifest).toEqual(entries.vue.manifest);
    await expect(
      prepareCandidatePackages(
        { packsDirectory: "/tmp/shared-packs" },
        {
          loadArtifacts: async () => {
            throw new Error("stale packs");
          },
          packPackages: async () => {
            throw new Error("must not fall back to packing");
          },
        },
      ),
    ).rejects.toThrow("stale packs");
  });

  it("covers supported Astro, React, and Vue versions plus each supported React host", () => {
    expect(getCandidateMatrix()).toEqual([
      expect.objectContaining({ framework: "astro", id: "astro-5", packageManager: "pnpm" }),
      expect.objectContaining({ framework: "astro", id: "astro-7", packageManager: "pnpm" }),
      expect.objectContaining({
        framework: "react",
        host: "vite",
        id: "react-18",
        packageManager: "pnpm",
      }),
      expect.objectContaining({
        framework: "react",
        host: "vite",
        id: "react-19",
        packageManager: "pnpm",
      }),
      expect.objectContaining({
        framework: "vue",
        frameworkVersion: "3.5.39",
        host: "vite",
        id: "vue-35",
        packageManager: "pnpm",
      }),
      expect.objectContaining({
        framework: "react",
        host: "vite",
        id: "react-19-js",
        language: "javascript",
        packageManager: "pnpm",
      }),
      expect.objectContaining({
        framework: "react",
        host: "vite",
        id: "react-19-npm",
        packageManager: "npm",
      }),
      expect.objectContaining({ framework: "react", host: "next-app", id: "next-app" }),
      expect.objectContaining({ framework: "react", host: "next-pages", id: "next-pages" }),
      expect.objectContaining({
        framework: "react",
        host: "tanstack-start",
        id: "tanstack-start",
      }),
      expect.objectContaining({
        framework: "react",
        host: "react-router",
        id: "react-router",
      }),
    ]);
  });

  it("uses packed workspace packages and keeps each pnpm project isolated", () => {
    const manifest = JSON.parse(getCandidateWorkspacePackage(packages));

    expect(manifest.devDependencies.starwind).toBe(`file:${packages.cli.replaceAll("\\", "/")}`);
    const workspace = getCandidateWorkspacePolicy(
      createCandidatePlan({ packages, root, vueAdapterVersion }).projects,
      packages,
    );
    expect(workspace).toContain(
      `"@starwind-ui/astro": "file:${packages.astro.replaceAll("\\", "/")}"`,
    );
    expect(workspace).toContain(
      `"@starwind-ui/react": "file:${packages.react.replaceAll("\\", "/")}"`,
    );
    expect(workspace).toContain(
      `"@starwind-ui/runtime": "file:${packages.runtime.replaceAll("\\", "/")}"`,
    );
    expect(workspace).toContain(`"@starwind-ui/vue": "file:${packages.vue.replaceAll("\\", "/")}"`);
    expect(workspace).toContain("unrs-resolver: true");
  });

  it("serves packed scoped packages through npm-compatible metadata", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "starwind-candidate-registry-"));
    const tarball = path.join(directory, "runtime.tgz");
    const adapterTarball = path.join(directory, "astro.tgz");
    const vueTarball = path.join(directory, "vue.tgz");
    await writeFile(tarball, "packed runtime");
    await writeFile(adapterTarball, "packed astro adapter");
    await writeFile(vueTarball, "packed vue adapter");
    const registry = await startCandidateRegistry({
      astro: {
        file: adapterTarball,
        manifest: { dependencies: { "@starwind-ui/runtime": "workspace:*" } },
        name: "@starwind-ui/astro",
        version: "0.1.0-beta.7",
      },
      runtime: {
        file: tarball,
        name: "@starwind-ui/runtime",
        version: "0.1.0-beta.7",
      },
      vue: {
        file: vueTarball,
        name: "@starwind-ui/vue",
        version: "0.2.0",
      },
    });

    try {
      const metadataResponse = await fetch(`${registry.url}/@starwind-ui%2Fruntime`);
      const metadata = await metadataResponse.json();
      expect(metadata.versions["0.1.0-beta.7"].dist.tarball).toBe(
        `${registry.url}/@starwind-ui/runtime/-/runtime-0.1.0-beta.7.tgz`,
      );
      expect(metadata["dist-tags"].beta).toBe("0.1.0-beta.7");

      const adapterMetadata = await (await fetch(`${registry.url}/@starwind-ui%2Fastro`)).json();
      expect(adapterMetadata.versions["0.1.0-beta.7"].dependencies["@starwind-ui/runtime"]).toBe(
        "0.1.0-beta.7",
      );

      const tarballResponse = await fetch(metadata.versions["0.1.0-beta.7"].dist.tarball);
      expect(await tarballResponse.text()).toBe("packed runtime");

      const vueMetadata = await (await fetch(`${registry.url}/@starwind-ui%2Fvue`)).json();
      expect(vueMetadata["dist-tags"].beta).toBe("0.2.0");
      expect(vueMetadata.versions["0.2.0"].version).toBe("0.2.0");
    } finally {
      await registry.close();
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("uses current manifest versions in candidate registry metadata and validation", () => {
    expect(
      createCandidatePlan({ packages, root, vueAdapterVersion }).projects.find(
        ({ framework }) => framework === "vue",
      ),
    ).toMatchObject({ adapterVersion: vueAdapterVersion });
    expect(() => createCandidatePlan({ packages, root })).toThrow(
      "The Vue candidate adapter version is required.",
    );
  });

  it("runs auto-detect, all-component install, lifecycle, checks, builds, SSR, and browser work", () => {
    const plan = createCandidatePlan({ packages, root, vueAdapterVersion });

    for (const project of plan.projects.filter((project) => project.packageManager === "pnpm")) {
      expect(project.init.args).toEqual([plan.cliEntrypoint, "init", "--defaults"]);
      expect(project.add.args).toEqual([plan.cliEntrypoint, "add", "--all", "--yes"]);
      expect(project.update.args).toContain("update");
      expect(project.remove.args).toEqual([
        plan.cliEntrypoint,
        "remove",
        project.host === "next-pages" ? "dialog" : "button",
        "--yes",
      ]);
      expect(project.readd.args).toEqual([
        plan.cliEntrypoint,
        "add",
        project.host === "next-pages" ? "dialog" : "button",
        "--yes",
      ]);
      expect(project.check).toBeDefined();
      expect(project.build.args).toEqual(["build"]);
      expect(project.browser).toBe(true);
      if (project.host === "vite" && project.framework === "react") {
        expect(project.ssr).toBeDefined();
      }
    }
  });

  it("uses each host's official noninteractive scaffold and production server", () => {
    const projects = createCandidatePlan({ packages, root, vueAdapterVersion }).projects;
    const getProject = (id: string) => projects.find((project) => project.id === id)!;

    expect(getProject("next-app").scaffold.args).toEqual(
      expect.arrayContaining([
        "dlx",
        "create-next-app@16.3.0",
        "--app",
        "--src-dir",
        "--skip-install",
      ]),
    );
    expect(getProject("next-app").preview).toMatchObject({ script: "start" });
    expect(getProject("next-app").typegen.args).toEqual(["exec", "next", "typegen"]);
    expect(getProject("next-app").lint).toEqual({
      cwd: path.join(root, "next-app"),
      manifestScript: "lint",
    });

    expect(getProject("next-pages").scaffold.args).toEqual(
      expect.arrayContaining(["dlx", "create-next-app@16.3.0", "--no-app", "--skip-install"]),
    );
    expect(getProject("next-pages").preview).toMatchObject({ script: "start" });
    expect(getProject("next-pages").typegen.args).toEqual(["exec", "next", "typegen"]);
    expect(getProject("next-pages").lint).toEqual({
      cwd: path.join(root, "next-pages"),
      manifestScript: "lint",
    });

    const nextManifest = { scripts: { lint: "eslint" } };
    expect(getCandidateManifestScriptCommand(getProject("next-app").lint, nextManifest)).toEqual({
      args: ["run", "lint"],
      cwd: path.join(root, "next-app"),
    });
    expect(
      createCandidateVerificationPlan(getProject("next-app"), nextManifest).map(
        (phase) => phase.name,
      ),
    ).toEqual(["lint", "typegen", "check", "build"]);
    expect(
      createCandidateVerificationPlan(getProject("next-pages"), nextManifest).map(
        (phase) => phase.name,
      ),
    ).toEqual(["lint", "typegen", "check", "build"]);

    expect(getProject("tanstack-start").scaffold.args).toEqual(
      expect.arrayContaining(["dlx", "@tanstack/cli@0.70.1", "create", "--no-install"]),
    );
    expect(getProject("tanstack-start").preview).toMatchObject({ script: "preview" });
    expect(getProject("tanstack-start").typegen.args).toEqual(["generate-routes"]);

    expect(getProject("react-router").scaffold.args).toEqual(
      expect.arrayContaining(["dlx", "create-react-router@8.3.0", "--no-install", "--yes"]),
    );
    expect(getProject("react-router").check.args).toEqual(["typecheck"]);
    expect(getProject("react-router").preview).toMatchObject({ script: "start" });

    expect(getProject("react-19-js").scaffold.args).toEqual(
      expect.arrayContaining(["create", "vite@9.1.1", "react-19-js", "--template", "react"]),
    );
    expect(getProject("react-19-npm").build.command).toBe(
      process.platform === "win32" ? "npm.cmd" : "npm",
    );
    expect(getProject("react-19-npm").check.command).toBe(
      process.platform === "win32" ? "npm.cmd" : "npm",
    );

    expect(getProject("react-19-js").check.args).toEqual([
      "exec",
      "tsc",
      "--noEmit",
      "--project",
      "tsconfig.json",
    ]);
    expect(getProject("react-19-js").ssr.args).toContain("src/acceptance-ssr.jsx");
    expect(getProject("vue-35").scaffold.args).toEqual(
      expect.arrayContaining(["create", "vite@9.1.1", "vue-35", "--template", "vue-ts"]),
    );
    expect(getProject("vue-35").check.args).toEqual(["exec", "vue-tsc", "--noEmit"]);
    expect(getProject("vue-35").ssr).toBeUndefined();
  });

  it("writes framework-native fixtures that render the critical interactive cohort", () => {
    const projects = createCandidatePlan({ packages, root, vueAdapterVersion }).projects;
    const fixturePaths = Object.fromEntries(
      projects.map((project) => [
        project.id,
        getCandidateFixtureFiles(project).map((file) => file.path),
      ]),
    );

    expect(fixturePaths["next-app"]).toEqual(["src/app/page.tsx"]);
    expect(fixturePaths["next-pages"]).toEqual(["pages/index.tsx"]);
    expect(fixturePaths["tanstack-start"]).toEqual(["src/routes/index.tsx"]);
    expect(fixturePaths["react-router"]).toEqual(["app/routes/home.tsx"]);
    expect(fixturePaths["react-19-js"]).toEqual(["src/App.jsx"]);
    expect(fixturePaths["vue-35"]).toEqual(["src/App.vue"]);
    expect(
      getCandidateFixtureFiles(projects.find((project) => project.id === "vue-35")!)[0].content,
    ).toContain("Published Vue Runtime panel");

    for (const id of ["next-app", "next-pages", "tanstack-start", "react-router"]) {
      const content = getCandidateFixtureFiles(projects.find((project) => project.id === id)!)[0]
        .content;
      expect(content).toContain("<Dialog");
      expect(content).toContain("<ContextMenu");
      expect(content).toContain("<ColorPicker");
    }
  });

  it("can select projects for focused diagnostics without changing the default gate", () => {
    expect(parseArgs(["--project", "next-pages", "--project=react-router"]).projectIds).toEqual([
      "next-pages",
      "react-router",
    ]);
    expect(
      createCandidatePlan({
        packages,
        projectIds: ["next-pages"],
        root,
        vueAdapterVersion,
      }).projects.map((project) => project.id),
    ).toEqual(["next-pages"]);
    expect(() =>
      createCandidatePlan({ packages, projectIds: ["missing"], root, vueAdapterVersion }),
    ).toThrow(/Unknown candidate project: missing/);
  });

  it("runs once in the release gate and stays out of the public sync and publish commands", async () => {
    const manifest = JSON.parse(await readFile("package.json", "utf8"));

    expect(manifest.scripts["release:gate"]).toBe("node scripts/release-gate.mjs");
    expect(
      releaseGateStages().filter(([, args]) => args[0] === "release:candidate:acceptance"),
    ).toEqual([
      [
        "candidate hosts",
        ["release:candidate:acceptance", "--packs", RELEASE_PACKS, "--concurrency", "2"],
      ],
    ]);
    expect(manifest.scripts["sync-public-runtime"] ?? "").not.toContain(
      "release:candidate:acceptance",
    );
    expect(manifest.scripts["publish:release"]).not.toContain("release:candidate:acceptance");
    expect(manifest.scripts["publish:release:dry-run"]).not.toContain(
      "release:candidate:acceptance",
    );
  });
});
