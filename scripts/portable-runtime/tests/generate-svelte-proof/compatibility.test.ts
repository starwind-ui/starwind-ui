import { mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  SVELTE_COMPATIBILITY_TOOLS,
  installCompatibilityTools,
  readCompatibilityProvenance,
  runSvelteCompatibility,
  type SvelteCompatibilityResult,
} from "../../check-svelte-compatibility.js";
import type { DistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";

const temporaryRoots: string[] = [];
afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

async function temporaryRoot() {
  const root = await mkdtemp(path.join(os.tmpdir(), "svelte-compatibility-test-"));
  temporaryRoots.push(root);
  return root;
}

function result(consumer: DistConsumer, version: string): SvelteCompatibilityResult {
  // The injected verifier isolates runner cleanup from the real browser assertions.
  return {
    version,
    root: consumer.root,
    tools: {},
    styled: {
      types: { positiveFiles: ["Positive.svelte"], negativeFiles: ["Negative.svelte"] },
    } as SvelteCompatibilityResult["styled"],
  };
}

async function fakeConsumer(root: string): Promise<DistConsumer> {
  await mkdir(root, { recursive: true });
  return {
    root,
    tools: { compiler: "unused", checker: "unused", typescript: "unused" },
    dispose: () => rm(root, { recursive: true, force: true }),
    write: async () => {},
    check: async () => ({ code: 0, output: "unused" }),
    run: async () => "unused",
  };
}

describe("explicit Svelte compatibility gate", () => {
  it("runs each frozen version in a distinct consumer and cleans both after verification", async () => {
    const root = await temporaryRoot();
    const versions: string[] = [];
    const verifiedRoots: string[] = [];
    const messages: string[] = [];
    const results = await runSvelteCompatibility({
      createConsumer: async (version) => {
        versions.push(version);
        return fakeConsumer(path.join(root, version));
      },
      verifyConsumer: async (consumer, version) => {
        verifiedRoots.push(consumer.root);
        return result(consumer, version);
      },
      log: (message) => messages.push(message),
    });
    expect(versions).toEqual(["5.29.0", "5.57.0"]);
    expect(results.map((item) => item.version)).toEqual(versions);
    expect(new Set(verifiedRoots).size).toBe(2);
    const summaries = messages.filter((message) => message.includes(" passed:"));
    expect(summaries).toHaveLength(2);
    for (const summary of summaries)
      expect(summary).toContain("1 positive and 1 negative fixtures");
    for (const consumerRoot of verifiedRoots)
      await expect(readFile(consumerRoot)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("fails the gate and cleans the consumer when a verifier fails", async () => {
    const root = await temporaryRoot();
    const attempted: string[] = [];
    const consumerRoot = path.join(root, "failed");
    await expect(
      runSvelteCompatibility({
        createConsumer: async (version) => {
          attempted.push(version);
          return fakeConsumer(consumerRoot);
        },
        verifyConsumer: async () => {
          throw new Error("Expected negative diagnostic missing");
        },
        log: () => {},
      }),
    ).rejects.toThrow("Expected negative diagnostic missing");
    expect(attempted).toEqual(["5.29.0"]);
    await expect(readFile(consumerRoot)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("selects exact tools and separate install stores without workspace resolution", async () => {
    const root = await temporaryRoot();
    const commands: { args: string[]; cwd: string }[] = [];
    for (const version of ["5.29.0", "5.57.0"]) {
      await installCompatibilityTools(path.join(root, version), version, async (args, cwd) => {
        commands.push({ args, cwd });
      });
    }
    for (const [index, version] of ["5.29.0", "5.57.0"].entries()) {
      expect(commands[index]!.args).toEqual(
        expect.arrayContaining([
          "--save-exact",
          `svelte@${version}`,
          "svelte-check@4.4.8",
          "typescript@5.9.3",
          "esbuild@0.28.1",
          "@floating-ui/dom@1.7.6",
          "embla-carousel@8.6.0",
          "tailwind-variants@3.2.2",
          "tailwind-merge@3.6.0",
          path.join(root, version, ".pnpm-store"),
          "--config.enable-global-virtual-store=false",
          "--config.link-workspace-packages=false",
        ]),
      );
      expect(commands[index]!.cwd).toBe(path.join(root, version));
    }
  });

  it("reports an install failure with the version and rerun command", async () => {
    const root = await temporaryRoot();
    await expect(
      installCompatibilityTools(root, "5.57.0", async () => {
        throw new Error("ECONNREFUSED registry");
      }),
    ).rejects.toThrow(
      /Svelte 5\.57\.0[\s\S]*registry\/network[\s\S]*pnpm svelte:compatibility[\s\S]*ECONNREFUSED/,
    );
  });

  it("reads consumer-local metadata when package exports hide the manifest", async () => {
    const root = await fakeCompatibilityTools();
    const require = createRequire(path.join(root, "package.json"));
    expect(() => require.resolve("tailwind-merge/package.json")).toThrow(
      /not defined by "exports"/,
    );
    const tools = await readCompatibilityProvenance(root, "5.29.0");
    expect(tools["tailwind-merge"]).toEqual({
      version: "3.6.0",
      manifest: path.join(root, "node_modules/tailwind-merge/package.json"),
      entry: path.join(root, "node_modules/tailwind-merge/dist/index.js"),
    });
    expect(Object.keys(tools)).toHaveLength(8);
    for (const tool of Object.values(tools)) {
      expect(tool.manifest.startsWith(root + path.sep)).toBe(true);
      expect(tool.entry.startsWith(root + path.sep)).toBe(true);
    }
  });

  it.each([
    [{ name: "another-package", version: "3.6.0" }, /own package manifest/],
    [{ name: "tailwind-merge", version: "0.0.0" }, /exact selected version/],
  ])("rejects mismatched hidden package metadata %j", async (metadata, message) => {
    const root = await fakeCompatibilityTools();
    await writeFile(
      path.join(root, "node_modules/tailwind-merge/package.json"),
      JSON.stringify({
        ...metadata,
        exports: { ".": "./dist/index.js" },
      }),
    );
    await expect(readCompatibilityProvenance(root, "5.29.0")).rejects.toThrow(message);
  });

  it("rejects a hidden manifest linked outside the consumer", async () => {
    const root = await fakeCompatibilityTools();
    const manifest = path.join(root, "node_modules/tailwind-merge/package.json");
    const outside = path.join(await temporaryRoot(), "package.json");
    await writeFile(outside, await readFile(manifest));
    await rm(manifest);
    await symlink(outside, manifest);
    await expect(readCompatibilityProvenance(root, "5.29.0")).rejects.toThrow(
      /manifest resolved outside its consumer/,
    );
  });

  it("rejects a different installed compiler version", async () => {
    const root = await temporaryRoot();
    await fakeSvelte(path.join(root, "node_modules/svelte"), "5.29.0");
    await expect(readCompatibilityProvenance(root, "5.57.0")).rejects.toThrow(
      /exact selected version/,
    );
  });

  it("rejects a compiler resolved through a workspace fallback", async () => {
    const root = await temporaryRoot();
    const consumerRoot = path.join(root, "consumer");
    const workspacePackage = path.join(root, "workspace/svelte");
    await fakeSvelte(workspacePackage, "5.29.0");
    await mkdir(path.join(consumerRoot, "node_modules"), { recursive: true });
    await symlink(workspacePackage, path.join(consumerRoot, "node_modules/svelte"), "junction");
    await expect(readCompatibilityProvenance(consumerRoot, "5.29.0")).rejects.toThrow(
      /outside its consumer/,
    );
  });
});

async function fakeSvelte(root: string, version: string) {
  await mkdir(root, { recursive: true });
  await writeFile(
    path.join(root, "package.json"),
    JSON.stringify({
      name: "svelte",
      version,
      exports: { "./package.json": "./package.json", "./compiler": "./compiler.js" },
    }),
  );
  await writeFile(path.join(root, "compiler.js"), "");
}

async function fakeCompatibilityTools() {
  const root = await realpath(await temporaryRoot());
  await fakeSvelte(path.join(root, "node_modules/svelte"), "5.29.0");
  for (const [name, version] of Object.entries(SVELTE_COMPATIBILITY_TOOLS)) {
    const directory = path.join(root, "node_modules", name);
    await mkdir(path.join(directory, "dist"), { recursive: true });
    await writeFile(path.join(directory, "dist/index.js"), "");
    await writeFile(
      path.join(directory, "dist/package.json"),
      JSON.stringify({ type: "commonjs" }),
    );
    await writeFile(
      path.join(directory, "package.json"),
      JSON.stringify({
        name,
        version,
        exports:
          name === "svelte-check"
            ? { "./bin/svelte-check": "./dist/index.js" }
            : { ".": "./dist/index.js" },
      }),
    );
  }
  return root;
}
