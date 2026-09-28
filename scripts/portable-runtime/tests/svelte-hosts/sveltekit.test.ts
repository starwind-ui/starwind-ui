import { access, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  runSvelteHost,
  selectHost,
  startHostProcess,
  SVELTEKIT_TOOLS,
  type HostSteps,
} from "../../check-svelte-hosts.js";
const owned: string[] = [];
async function temporary() {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), "kit-host-unit-")));
  owned.push(root);
  return root;
}
afterEach(async () => {
  await Promise.all(owned.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});
describe("SvelteKit packed host", () => {
  it("selects the request host with the approved compiler and adapter versions", () => {
    expect(selectHost("sveltekit")).toBe("sveltekit");
    expect(SVELTEKIT_TOOLS).toMatchObject({
      "@sveltejs/kit": "2.70.3",
      "@sveltejs/adapter-node": "5.5.7",
      svelte: "5.29.0",
      vite: "7.3.5",
      "@sveltejs/vite-plugin-svelte": "6.2.1",
    });
  });
  it("reports a failed request-server startup and reaps the child", async () => {
    const root = await temporary();
    await writeFile(
      path.join(root, "host.mjs"),
      `import { writeFileSync } from "node:fs";
      writeFileSync("pid", String(process.pid));
      process.stderr.write("SvelteKit adapter startup failed"); process.exit(7);`,
    );
    await expect(startHostProcess(root)).rejects.toThrow("SvelteKit adapter startup failed");
    const pid = Number(await readFile(path.join(root, "pid"), "utf8"));
    expect(() => process.kill(pid, 0)).toThrow();
  });
  it.each(["start", "browser"] as const)(
    "cleans the consumer after SvelteKit %s failure",
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
        throw new Error(
          stage === "browser"
            ? "SvelteKit navigation left a stale owner"
            : "SvelteKit build failed",
        );
      };
      await expect(
        runSvelteHost({ host: "sveltekit", output, steps, log: () => {} }),
      ).rejects.toThrow("Packed sveltekit host failed");
      const evidence = JSON.parse(await readFile(output, "utf8"));
      expect(evidence).toMatchObject({ host: "sveltekit", status: "failed", cleaned: true });
      expect(evidence.error).toContain(
        stage === "browser" ? "navigation left a stale owner" : "build failed",
      );
      expect(close).toHaveBeenCalledTimes(stage === "browser" ? 1 : 0);
      await expect(access(consumer)).rejects.toThrow();
    },
  );
});
