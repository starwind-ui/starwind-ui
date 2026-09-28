import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { access, cp, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ASTRO_TOOLS,
  runSvelteHost,
  selectHost,
  startHostProcess,
  verifyAstroToolEntries,
  type HostSteps,
} from "../../check-svelte-hosts.js";
const owned: string[] = [];
async function temporary() {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), "astro-host-unit-")));
  owned.push(root);
  return root;
}
afterEach(async () => {
  await Promise.all(owned.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});
describe("Astro packed host", () => {
  it("selects the approved island comparison compiler and compatible host versions", () => {
    expect(selectHost("astro")).toBe("astro");
    expect(ASTRO_TOOLS).toMatchObject({
      astro: "7.1.3",
      "@astrojs/svelte": "9.0.1",
      svelte: "5.57.0",
      vite: "8.1.3",
      "@sveltejs/vite-plugin-svelte": "7.3.0",
    });
  });
  it.each(["integration:plugin", "integration:vite", "plugin:svelte/compiler", "astro:vite"])(
    "rejects a different Astro %s resolution",
    (entry) => {
      const entries = {
        "@sveltejs/vite-plugin-svelte": "/consumer/plugin/index.js",
        vite: "/consumer/vite/index.js",
        "svelte/compiler": "/consumer/svelte/compiler.js",
        "integration:plugin": "/consumer/plugin/index.js",
        "integration:vite": "/consumer/vite/index.js",
        "plugin:svelte/compiler": "/consumer/svelte/compiler.js",
        "astro:vite": "/consumer/vite/index.js",
      };
      expect(() => verifyAstroToolEntries(entries)).not.toThrow();
      expect(() =>
        verifyAstroToolEntries({ ...entries, [entry]: "/consumer/another-version/index.js" }),
      ).toThrow("must use the verified host tool");
    },
  );
  it("resolves Astro plugin compiler imports through ESM conditional exports", async () => {
    const root = await temporary();
    const parent = path.join(root, "node_modules/plugin/index.mjs");
    await mkdir(path.dirname(parent), { recursive: true });
    await writeFile(parent, "");
    const decoy = path.join(root, "node_modules/svelte");
    await mkdir(decoy, { recursive: true });
    await writeFile(
      path.join(decoy, "package.json"),
      JSON.stringify({ name: "svelte", exports: { "./compiler": "./decoy.mjs" } }),
    );
    await writeFile(path.join(decoy, "decoy.mjs"), "export const wrongCompiler = true;");
    const compiler = path.join(root, "node_modules/plugin/node_modules/svelte");
    await mkdir(compiler, { recursive: true });
    await writeFile(
      path.join(compiler, "package.json"),
      JSON.stringify({
        name: "svelte",
        version: "5.57.0",
        exports: { "./compiler": { import: "./esm.mjs", require: "./cjs.cjs" } },
      }),
    );
    await writeFile(path.join(compiler, "esm.mjs"), "export const compiler = true;");
    await writeFile(path.join(compiler, "cjs.cjs"), "exports.compiler = true;");
    await cp(
      new URL("./fixtures/astro/resolve-tools.mjs", import.meta.url),
      path.join(root, "resolve-tools.mjs"),
    );
    const { stdout } = await promisify(execFile)(process.execPath, [
      "--input-type=module",
      "--eval",
      `const { resolveToolEntries } = await import(process.argv[1]);
      process.stdout.write(JSON.stringify(await resolveToolEntries({ compiler: { specifier: "svelte/compiler", parentURL: process.argv[2] } })));`,
      pathToFileURL(path.join(root, "resolve-tools.mjs")).href,
      pathToFileURL(parent).href,
    ]);
    expect(JSON.parse(stdout).compiler).toBe(path.join(compiler, "esm.mjs"));
    expect(createRequire(parent).resolve("svelte/compiler")).toBe(path.join(compiler, "cjs.cjs"));
  });
  it("rejects missing Astro tool provenance", () => {
    expect(() => verifyAstroToolEntries({})).toThrow("host tool absent");
  });
  it("reports a failed Astro build and reaps the child", async () => {
    const root = await temporary();
    await writeFile(
      path.join(root, "host.mjs"),
      `import { writeFileSync } from "node:fs";
      writeFileSync("pid", String(process.pid)); process.stderr.write("Astro production build failed"); process.exit(7);`,
    );
    await expect(startHostProcess(root)).rejects.toThrow("Astro production build failed");
    const pid = Number(await readFile(path.join(root, "pid"), "utf8"));
    expect(() => process.kill(pid, 0)).toThrow();
  });
  it.each(["start", "buildProvenance", "browser"] as const)(
    "cleans the Astro consumer after %s failure",
    async (stage) => {
      const output = path.join(await temporary(), "report.json");
      let consumer = "";
      const close = vi.fn(async () => {});
      const steps: HostSteps = {
        pack: async (root) => {
          consumer = root;
          return [];
        },
        install: async () => {},
        provenance: async () => ({}),
        start: async () => ({ url: "http://unused", close }),
        buildProvenance: async () => ({}),
        browser: async () => ({}),
      };
      steps[stage] = async () => {
        throw new Error(`Astro ${stage} failed`);
      };
      await expect(runSvelteHost({ host: "astro", output, steps, log: () => {} })).rejects.toThrow(
        "Packed astro host failed",
      );
      const evidence = JSON.parse(await readFile(output, "utf8"));
      expect(evidence).toMatchObject({
        host: "astro",
        status: "failed",
        cleaned: true,
        error: `Error: Astro ${stage} failed`,
      });
      expect(close).toHaveBeenCalledTimes(stage === "start" ? 0 : 1);
      await expect(access(consumer)).rejects.toThrow();
    },
  );
});
