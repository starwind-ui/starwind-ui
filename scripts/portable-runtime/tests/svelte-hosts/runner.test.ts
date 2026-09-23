import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import {
  access,
  cp,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ASTRO_TOOLS,
  assertConsumerPath,
  assertPublicSveltePackSet,
  HOST_TOOLS,
  type HostSteps,
  type Packed,
  prepareSvelteCommandCapability,
  REPRESENTATIVE_SVELTE_STYLED_ROOTS,
  readHostProvenance,
  readPackagePayloadFiles,
  readPublicSveltePacks,
  resolveConsumerCli,
  runInstalledSvelteCommandDelivery,
  runSvelteCommandDelivery,
  runSvelteHost,
  runSvelteHosts,
  SVELTEKIT_TOOLS,
  selectHost,
  startHostProcess,
  svelteBaselineScope,
  verifyPackedBuildModules,
  verifyPackedWorkspaceOverrides,
} from "../../check-svelte-hosts.js";

const owned: string[] = [];
const execute = promisify(execFile);
async function temporary() {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), "host-unit-")));
  owned.push(root);
  return root;
}
afterEach(async () => {
  await Promise.all(owned.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});
describe("packed host lifecycle", () => {
  it("passes one public Runtime, Svelte, and CLI pack set to all three hosts", async () => {
    let root = "";
    const packed: Packed[] = [
      {
        name: "@starwind-ui/runtime",
        version: "1.2.1",
        tarball: "runtime.tgz",
        sha256: "r",
        files: {},
      },
      {
        name: "@starwind-ui/svelte",
        version: "0.0.0",
        tarball: "svelte.tgz",
        sha256: "s",
        files: {},
      },
      { name: "starwind", version: "3.3.2", tarball: "cli.tgz", sha256: "c", files: {} },
    ];
    const selected: string[] = [];
    await runSvelteHosts({
      hosts: ["vite", "sveltekit", "astro"],
      pack: async (directory) => {
        root = directory;
        return packed;
      },
      runHost: async (options) => {
        selected.push(options.host!);
        expect(options.packed).toBe(packed);
        expect(options.capabilityPath).toBeUndefined();
        await access(root);
        return { host: options.host, status: "passed" };
      },
    });
    expect(selected).toEqual(["vite", "sveltekit", "astro"]);
    await expect(access(root)).rejects.toThrow();
  });

  it("shares one pack across selected hosts and cleans it after a host failure", async () => {
    let root = "";
    const packed: Awaited<ReturnType<HostSteps["pack"]>> = [];
    const pack = vi.fn(async (value: string) => {
      root = value;
      return packed;
    });
    const selected: string[] = [];
    await expect(
      runSvelteHosts({
        hosts: ["vite", "vite", "sveltekit"],
        pack,
        prepareCapability: async (_repoRoot, directory) => path.join(directory, "capability.json"),
        runHost: async (options) => {
          selected.push(options.host!);
          expect(options.packed).toBe(packed);
          expect(options.capabilityPath).toBe(path.join(root, "capability.json"));
          await access(root);
          if (options.host === "sveltekit") throw new Error("injected host failure");
          return runSvelteHost({
            ...options,
            log: () => {},
            steps: {
              pack: async () => {
                throw new Error("Unexpected second pack");
              },
              install: async () => {},
              provenance: async () => ({}),
              start: async () => ({ url: "http://unused", close: async () => {} }),
              browser: async () => ({}),
              buildProvenance: async () => [],
            },
          });
        },
      }),
    ).rejects.toThrow("injected host failure");
    expect(pack).toHaveBeenCalledOnce();
    expect(selected).toEqual(["vite", "sveltekit"]);
    await expect(access(root)).rejects.toThrow();
  });
  it.each([
    "pack",
    "install",
    "provenance",
    "commands",
    "start",
    "buildProvenance",
    "browser",
    "close",
  ] as const)(
    "cleans the owned consumer after %s failure and retains evidence",
    async (failure) => {
      const output = path.join(await temporary(), "report.json");
      let consumer = "";
      const close = vi.fn(async () => {
        if (failure === "close") throw new Error("injected close");
      });
      const steps: HostSteps = {
        pack: async (root) => {
          consumer = root;
          return [];
        },
        install: async () => {},
        provenance: async () => ({}),
        commands: async () => ({ source: "injected command witness" }),
        start: async () => ({ url: "http://unused", close }),
        browser: async () => ({}),
        buildProvenance: async () => [],
      };
      if (failure !== "close") {
        steps[failure] = async (...args: unknown[]) => {
          if (failure === "pack") consumer = String(args[0]);
          throw new Error(`injected ${failure}`);
        };
      }
      await expect(runSvelteHost({ host: "vite", output, steps, log: () => {} })).rejects.toThrow(
        "Packed vite host failed",
      );
      await expect(access(consumer)).rejects.toThrow();
      const report = JSON.parse(await readFile(output, "utf8"));
      expect(report).toMatchObject({
        status: "failed",
        cleaned: true,
        error: `Error: injected ${failure}`,
      });
      expect(close).toHaveBeenCalledTimes(
        ["buildProvenance", "browser", "close"].includes(failure) ? 1 : 0,
      );
    },
  );
  it("records a successful run and cleans the owned server and root", async () => {
    let root = "";
    const close = vi.fn(async () => {});
    const output = path.join(await temporary(), "report.json");
    const result = await runSvelteHost({
      host: "vite",
      output,
      log: () => {},
      steps: {
        pack: async (value) => {
          root = value;
          return [];
        },
        install: async () => {},
        provenance: async () => ({ exact: true }),
        start: async () => ({ url: "http://unused", close }),
        buildProvenance: async () => ["dist"],
        browser: async () => ({ cycles: 3 }),
      },
    });
    expect(result).toMatchObject({
      status: "passed",
      cleaned: true,
      browser: { cycles: 3 },
      baseline: svelteBaselineScope(),
    });
    expect(close).toHaveBeenCalledOnce();
    await expect(access(root)).rejects.toThrow();
  });
  it("reports an owned child that fails before server readiness", async () => {
    const root = await temporary();
    await writeFile(
      path.join(root, "host.mjs"),
      'process.stderr.write("injected child failure"); process.exit(7);',
    );
    await expect(startHostProcess(root)).rejects.toThrow("Host exited 7: injected child failure");
  });
  it("stops and reaps its ready child process", async () => {
    const root = await temporary();
    await writeFile(
      path.join(root, "host.mjs"),
      `import { writeFileSync } from "node:fs";
      writeFileSync("pid", String(process.pid));
      process.send({ url: "http://127.0.0.1:1" });
      process.on("message", message => { if (message === "close") process.exit(0); });`,
    );
    const server = await startHostProcess(root);
    const pid = Number(await readFile(path.join(root, "pid"), "utf8"));
    await server.close();
    expect(() => process.kill(pid, 0)).toThrow();
    await server.close();
  });
  it.each(["unknown", undefined])(
    "rejects unavailable host %s before allocating a consumer",
    (value) => {
      expect(() => selectHost(value)).toThrow("not implemented");
    },
  );
});
describe("source command delivery", () => {
  it("runs the source commands against each configured fixture without installing host packages", async () => {
    const repoRoot = process.cwd();
    const capabilityPath = await prepareSvelteCommandCapability(repoRoot, await temporary());
    const runtime = JSON.parse(
      await readFile(path.join(repoRoot, "packages/runtime/package.json"), "utf8"),
    );
    const svelte = JSON.parse(
      await readFile(path.join(repoRoot, "packages/svelte/package.json"), "utf8"),
    );
    for (const host of ["vite", "sveltekit", "astro"] as const) {
      const root = await temporary();
      await cp(
        path.join(repoRoot, `scripts/portable-runtime/tests/svelte-hosts/fixtures/${host}`),
        root,
        { recursive: true },
      );
      const tools =
        host === "vite" ? HOST_TOOLS : host === "sveltekit" ? SVELTEKIT_TOOLS : ASTRO_TOOLS;
      await writeFile(
        path.join(root, "package.json"),
        JSON.stringify({
          type: "module",
          dependencies: {
            ...tools,
            "@starwind-ui/runtime": runtime.version,
            "@starwind-ui/svelte": svelte.version,
          },
        }),
      );
      const result = (await runSvelteCommandDelivery(repoRoot, root, host, capabilityPath)) as {
        status: string;
        phases: Array<{ name: string; status: string }>;
        config: { framework: string };
        vendoredSelectFiles?: number;
      };
      expect(result.status).toBe("passed");
      expect(result.phases.every((phase) => phase.status === "passed")).toBe(true);
      expect(result.phases.map(({ name }) => name)).toEqual(
        host === "vite"
          ? [
              "init",
              "repeat-init",
              "add-five-styled-roots",
              "source-update",
              "behavior-update",
              "remove",
              "re-add",
              "docs",
              "primitive-search",
              "vendor-select",
            ]
          : ["init", "repeat-init", "add-five-styled-roots"],
      );
      expect(result.config.framework).toBe(host === "astro" ? "astro" : "svelte");
      await expect(access(path.join(root, "node_modules"))).rejects.toThrow();
      if (host === "vite") expect(result.vendoredSelectFiles).toBeGreaterThan(0);
    }
  }, 60_000);

  it("retains command phase failure details before consumer cleanup", async () => {
    const output = path.join(await temporary(), "report.json");
    let root = "";
    await expect(
      runSvelteHost({
        host: "vite",
        output,
        log: () => {},
        steps: {
          pack: async (directory) => {
            root = directory;
            return [];
          },
          install: async () => {},
          commands: async (directory) => {
            await writeFile(
              path.join(directory, "command-evidence.json"),
              JSON.stringify({
                status: "failed",
                phases: [{ name: "init", error: "fixture rejected" }],
              }),
            );
            throw new Error("command child failed");
          },
          provenance: async () => ({}),
          start: async () => {
            throw new Error("Unexpected build");
          },
          browser: async () => ({}),
          buildProvenance: async () => ({}),
        },
      }),
    ).rejects.toThrow("Packed vite host failed");
    expect(JSON.parse(await readFile(output, "utf8"))).toMatchObject({
      status: "failed",
      cleaned: true,
      commands: { phases: [{ name: "init", error: "fixture rejected" }] },
    });
    await expect(access(root)).rejects.toThrow();
  });
});

describe("installed CLI command delivery", () => {
  async function consumerCli() {
    const root = await temporary();
    const packageRoot = path.join(root, "node_modules/starwind");
    await mkdir(path.join(packageRoot, "dist"), { recursive: true });
    await mkdir(path.join(root, "node_modules/.bin"), { recursive: true });
    await writeFile(
      path.join(packageRoot, "package.json"),
      JSON.stringify({ name: "starwind", version: "3.3.2", bin: { starwind: "dist/index.js" } }),
    );
    await writeFile(path.join(packageRoot, "dist/index.js"), "#!/usr/bin/env node\n");
    await symlink("../starwind/dist/index.js", path.join(root, "node_modules/.bin/starwind"));
    const packed: Packed[] = [
      {
        name: "@starwind-ui/runtime",
        version: "1.2.1",
        tarball: "/packs/runtime.tgz",
        sha256: "runtime-hash",
        files: {},
      },
      {
        name: "@starwind-ui/svelte",
        version: "0.0.0",
        tarball: "/packs/svelte.tgz",
        sha256: "svelte-hash",
        files: {},
      },
      {
        name: "starwind",
        version: "3.3.2",
        tarball: "/packs/cli.tgz",
        sha256: "cli-hash",
        files: {},
      },
    ];
    return { packed, root };
  }

  it("rejects a pack set with a missing or substituted package", () => {
    expect(() =>
      assertPublicSveltePackSet([
        { name: "@starwind-ui/runtime" },
        { name: "@starwind-ui/svelte" },
        { name: "@starwind-ui/react" },
      ]),
    ).toThrow("exact Runtime, Svelte, and CLI packs");
  });

  it("validates accepted archive hashes and package manifests", async () => {
    const directory = await temporary();
    const packages = [
      {
        key: "runtime",
        file: "runtime.tgz",
        manifest: { name: "@starwind-ui/runtime", version: "1.2.1" },
      },
      {
        key: "svelte",
        file: "svelte.tgz",
        manifest: {
          name: "@starwind-ui/svelte",
          version: "0.0.0",
          peerDependencies: { svelte: ">=5.29.0 <6" },
        },
      },
      {
        key: "cli",
        file: "cli.tgz",
        manifest: { name: "starwind", version: "3.3.2", bin: { starwind: "./dist/index.js" } },
      },
    ];
    const entries: Record<string, unknown> = {};
    for (const item of packages) {
      const staging = path.join(directory, `staging-${item.key}`);
      await mkdir(path.join(staging, "package"), { recursive: true });
      await writeFile(path.join(staging, "package/package.json"), JSON.stringify(item.manifest));
      await execute("tar", ["-czf", path.join(directory, item.file), "package"], { cwd: staging });
      entries[item.key] = {
        file: item.file,
        manifest: item.manifest,
        name: item.manifest.name,
        sha256: createHash("sha256")
          .update(await readFile(path.join(directory, item.file)))
          .digest("hex"),
        version: item.manifest.version,
      };
    }
    await writeFile(
      path.join(directory, "manifest.json"),
      JSON.stringify({ schemaVersion: 2, packages: entries }),
    );

    await expect(
      readPublicSveltePacks(directory, path.join(directory, "extracted")),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "@starwind-ui/runtime", version: "1.2.1" }),
        expect.objectContaining({ name: "@starwind-ui/svelte", version: "0.0.0" }),
        expect.objectContaining({ name: "starwind", version: "3.3.2" }),
      ]),
    );

    (entries.cli as { sha256: string }).sha256 = "changed";
    await writeFile(
      path.join(directory, "manifest.json"),
      JSON.stringify({ schemaVersion: 2, packages: entries }),
    );
    await expect(
      readPublicSveltePacks(directory, path.join(directory, "changed-extracted")),
    ).rejects.toThrow("Accepted archive changed: starwind");
  });

  it("rejects a CLI package that resolves outside the consumer", async () => {
    const { packed, root } = await consumerCli();
    const other = await temporary();
    await mkdir(path.join(other, "dist"));
    await writeFile(
      path.join(other, "package.json"),
      JSON.stringify({ name: "starwind", version: "3.3.2", bin: { starwind: "dist/index.js" } }),
    );
    await writeFile(path.join(other, "dist/index.js"), "#!/usr/bin/env node\n");
    await rm(path.join(root, "node_modules/starwind"), { force: true, recursive: true });
    await symlink(other, path.join(root, "node_modules/starwind"));
    await expect(resolveConsumerCli(root, packed)).rejects.toThrow("outside consumer");
  });

  it("records a rejected installed command without claiming public CLI acceptance", async () => {
    const { packed, root } = await consumerCli();
    const executeCli = vi.fn(async () => {
      throw Object.assign(new Error("Commander rejected option"), {
        stdout: "",
        stderr: "error: unknown option --framework\n",
      });
    });

    await expect(
      runInstalledSvelteCommandDelivery(root, "vite", packed, executeCli),
    ).rejects.toThrow("Commander rejected option");

    expect(executeCli).toHaveBeenCalledOnce();
    const evidence = JSON.parse(await readFile(path.join(root, "command-evidence.json"), "utf8"));
    expect(evidence).toMatchObject({
      publicCliTarball: false,
      status: "failed",
      phases: [
        {
          name: "init",
          status: "failed",
          error: "Error: Commander rejected option",
          output: "error: unknown option --framework\n",
        },
      ],
    });
  });

  it("records exact consumer-local CLI identity after installed init and add", async () => {
    const { packed, root } = await consumerCli();
    const executeCli = vi.fn(async (_node: string, args: string[]) => {
      if (args.includes("init")) {
        await mkdir(path.join(root, "src/styles"), { recursive: true });
        await writeFile(
          path.join(root, "starwind.config.json"),
          JSON.stringify({
            framework: "svelte",
            componentDir: "src/components/starwind",
            components: [],
          }),
        );
      }
      if (args.includes("add") && !args.includes("primitives")) {
        const configPath = path.join(root, "starwind.config.json");
        const config = JSON.parse(await readFile(configPath, "utf8"));
        for (const name of REPRESENTATIVE_SVELTE_STYLED_ROOTS) {
          config.components.push({ name, framework: "svelte" });
          await mkdir(path.join(root, config.componentDir, name), { recursive: true });
          await writeFile(path.join(root, config.componentDir, name, "index.ts"), "export {};\n");
        }
        await writeFile(configPath, JSON.stringify(config));
      }
      return { stdout: "ok\n", stderr: "" };
    });

    const result = (await runInstalledSvelteCommandDelivery(root, "vite", packed, executeCli)) as {
      publicCliTarball: boolean;
      cli: { archiveSha256: string; binary: string };
    };

    expect(result.publicCliTarball).toBe(true);
    expect(result.cli.archiveSha256).toBe("cli-hash");
    expect(result.cli.binary).toBe(
      await realpath(path.join(root, "node_modules/starwind/dist/index.js")),
    );
    expect(executeCli).toHaveBeenCalledTimes(3);
  });
});

describe("consumer provenance", () => {
  const packedOverrides = [
    { name: "@starwind-ui/runtime", tarball: "/consumer/runtime.tgz" },
    { name: "@starwind-ui/svelte", tarball: "/consumer/svelte.tgz" },
  ];
  const validOverrides =
    'overrides:\n  "@starwind-ui/svelte": "file:/consumer/svelte.tgz"\n  "@starwind-ui/runtime": "file:/consumer/runtime.tgz"\n';
  it("accepts exact archive overrides beside pnpm's allowBuilds setting", () => {
    expect(() =>
      verifyPackedWorkspaceOverrides(
        "allowBuilds:\n  esbuild: true\n" + validOverrides,
        packedOverrides,
      ),
    ).not.toThrow();
  });
  it.each([
    ["missing", "allowBuilds:\n  esbuild: true\n"],
    ["changed", validOverrides.replace("file:/consumer/svelte.tgz", "0.0.0")],
    ["extra", validOverrides + '  "@starwind-ui/other": "file:/consumer/other.tgz"\n'],
  ])("rejects a %s override mapping", (_name, content) => {
    expect(() => verifyPackedWorkspaceOverrides(content, packedOverrides)).toThrow(
      "exact tarball override",
    );
  });

  it("rejects a sibling path sharing the consumer prefix", () => {
    expect(() => assertConsumerPath("/tmp/consumer", "/tmp/consumer-escape/file")).toThrow(
      "outside consumer",
    );
  });
  it("excludes installer-owned nested dependencies from package payload hashes", async () => {
    const root = await temporary();
    await writeFile(path.join(root, "package.json"), "{}\n");
    await mkdir(path.join(root, "node_modules/.bin"), { recursive: true });
    await writeFile(path.join(root, "node_modules/.bin/generated"), "installer-owned\n");
    expect(await readPackagePayloadFiles(root)).toEqual({
      "package.json": createHash("sha256").update("{}\n").digest("hex"),
    });
  });
  it("rejects a package symlink into the workspace", async () => {
    const root = await temporary();
    const external = await temporary();
    await mkdir(path.join(root, "node_modules"));
    await symlink(external, path.join(root, "node_modules/svelte"));
    await writeFile(path.join(root, "package.json"), "{}");
    await expect(readHostProvenance(root, [], { svelte: "5.29.0" })).rejects.toThrow(
      "outside consumer",
    );
  });
  it("rejects an unexpected installed tool version", async () => {
    const root = await temporary();
    const directory = path.join(root, "node_modules/svelte");
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(root, "package.json"), "{}");
    await writeFile(
      path.join(directory, "package.json"),
      JSON.stringify({ name: "svelte", version: "5.57.0" }),
    );
    await expect(readHostProvenance(root, [], { svelte: "5.29.0" })).rejects.toThrow(
      "svelte version",
    );
  });
  it.each(["payload", "archive", "dependency", "override"])(
    "rejects changed packed %s",
    async (change) => {
      const root = await temporary();
      const directory = path.join(root, "node_modules/@starwind-ui/svelte");
      await mkdir(directory, { recursive: true });
      const content = JSON.stringify({
        name: "@starwind-ui/svelte",
        version: "0.0.0",
        private: true,
      });
      const digest = (text: string) => createHash("sha256").update(text).digest("hex");
      const tarball = path.join(root, "packed.tgz");
      await writeFile(tarball, change === "archive" ? "changed" : "archive");
      await writeFile(path.join(directory, "package.json"), content);
      if (change === "payload") await writeFile(path.join(directory, "source.ts"), "unexpected");
      await writeFile(
        path.join(root, "package.json"),
        JSON.stringify({
          dependencies: {
            "@starwind-ui/svelte":
              change === "dependency"
                ? "workspace:*"
                : change === "override"
                  ? "0.0.0"
                  : `file:${tarball}`,
          },
        }),
      );
      if (change === "override")
        await writeFile(
          path.join(root, "pnpm-workspace.yaml"),
          'overrides:\n  "@starwind-ui/svelte": "0.0.0"\n',
        );
      await expect(
        readHostProvenance(
          root,
          [
            {
              name: "@starwind-ui/svelte",
              version: "0.0.0",
              tarball,
              sha256: digest("archive"),
              files: { "package.json": digest(content) },
            },
          ],
          {},
        ),
      ).rejects.toThrow(
        change === "payload"
          ? "differs from packed files"
          : change === "archive"
            ? "Tarball changed"
            : change === "override"
              ? "exact tarball override"
              : "exact tarball dependency",
      );
    },
  );
});

describe("bundled packed payload identity", () => {
  it.each(["runtime", "svelte"])(
    "rejects a same-version registry %s beside the verified tarball",
    async (name) => {
      const root = await temporary();
      const packageName = `@starwind-ui/${name}`;
      const version = name === "runtime" ? "1.2.1" : "0.0.0";
      const packedRoot = path.join(
        root,
        "node_modules/.pnpm",
        `@starwind-ui+${name}@file+artifacts+${name}.tgz`,
        "node_modules",
        packageName,
      );
      const registryRoot = path.join(
        root,
        "node_modules/.pnpm",
        `@starwind-ui+${name}@${version}`,
        "node_modules",
        packageName,
      );
      for (const directory of [packedRoot, registryRoot]) {
        await mkdir(path.join(directory, "dist"), { recursive: true });
        await writeFile(
          path.join(directory, "package.json"),
          JSON.stringify({ name: packageName, version }),
        );
        await writeFile(path.join(directory, "dist/index.js"), "export const sameVersion = true;");
      }
      await mkdir(path.join(root, "node_modules/@starwind-ui"), { recursive: true });
      await symlink(packedRoot, path.join(root, "node_modules", packageName));
      const packedEntry = path.join(root, "node_modules", packageName, "dist/index.js");
      await expect(
        verifyPackedBuildModules(root, [packedEntry], { [packageName]: packedRoot }),
      ).resolves.toEqual([path.join(packedRoot, "dist/index.js")]);
      await expect(
        verifyPackedBuildModules(root, [packedEntry, path.join(registryRoot, "dist/index.js")], {
          [packageName]: packedRoot,
        }),
      ).rejects.toThrow("bypassed its verified packed payload");
    },
  );
});

it("names the original five-root workload while recording the complete current package scope", () => {
  expect(REPRESENTATIVE_SVELTE_STYLED_ROOTS).toEqual([
    "button",
    "checkbox",
    "select",
    "dialog",
    "theme-toggle",
  ]);
  const scope = svelteBaselineScope();
  expect(scope).toMatchObject({
    kind: "representative-five-root",
    fullCatalogBehavior: false,
    packageFacades: ["theme"],
  });
  expect(scope.packagePrimitives).toContain("button");
  expect(scope.catalogRoots).toContain("theme-toggle");
});
