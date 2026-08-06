import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  createCandidatePlan,
  getCandidateMatrix,
  startCandidateRegistry,
  getCandidateWorkspacePackage,
  getCandidateWorkspacePolicy,
} from "../release-candidate-acceptance.mjs";

const root = path.resolve("candidate-root");
const packages = {
  astro: path.join(root, "packs", "astro.tgz"),
  cli: path.join(root, "packs", "starwind.tgz"),
  react: path.join(root, "packs", "react.tgz"),
  runtime: path.join(root, "packs", "runtime.tgz"),
};

describe("release candidate acceptance", () => {
  it("covers supported Astro and React majors plus npm on the critical React path", () => {
    expect(getCandidateMatrix()).toEqual([
      expect.objectContaining({ framework: "astro", id: "astro-5", packageManager: "pnpm" }),
      expect.objectContaining({ framework: "astro", id: "astro-7", packageManager: "pnpm" }),
      expect.objectContaining({ framework: "react", id: "react-18", packageManager: "pnpm" }),
      expect.objectContaining({ framework: "react", id: "react-19", packageManager: "pnpm" }),
      expect.objectContaining({ framework: "react", id: "react-19-npm", packageManager: "npm" }),
    ]);
  });

  it("uses packed workspace packages and keeps each pnpm project isolated", () => {
    const manifest = JSON.parse(getCandidateWorkspacePackage(packages));

    expect(manifest.devDependencies.starwind).toBe(`file:${packages.cli.replaceAll("\\", "/")}`);
    const workspace = getCandidateWorkspacePolicy(
      createCandidatePlan({ packages, root }).projects,
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
  });

  it("serves packed scoped packages through npm-compatible metadata", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "starwind-candidate-registry-"));
    const tarball = path.join(directory, "runtime.tgz");
    const adapterTarball = path.join(directory, "astro.tgz");
    await writeFile(tarball, "packed runtime");
    await writeFile(adapterTarball, "packed astro adapter");
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
    } finally {
      await registry.close();
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("runs auto-detect, all-component install, lifecycle, checks, builds, SSR, and browser work", () => {
    const plan = createCandidatePlan({ packages, root });

    for (const project of plan.projects.filter((project) => project.packageManager === "pnpm")) {
      expect(project.init.args).toEqual([plan.cliEntrypoint, "init", "--defaults"]);
      expect(project.add.args).toEqual([plan.cliEntrypoint, "add", "--all", "--yes"]);
      expect(project.update.args).toContain("update");
      expect(project.remove.args).toEqual([plan.cliEntrypoint, "remove", "button", "--yes"]);
      expect(project.check).toBeDefined();
      expect(project.build.args).toEqual(["build"]);
      expect(project.browser).toBe(true);
      if (project.framework === "react") expect(project.ssr).toBeDefined();
    }
  });

  it("runs once in the release gate and stays out of the public sync and publish commands", async () => {
    const manifest = JSON.parse(await readFile("package.json", "utf8"));

    expect(manifest.scripts["release:gate"].match(/release:candidate:acceptance/g)).toHaveLength(1);
    expect(manifest.scripts["sync-public-runtime"] ?? "").not.toContain(
      "release:candidate:acceptance",
    );
    expect(manifest.scripts["publish:release"]).not.toContain("release:candidate:acceptance");
  });
});
