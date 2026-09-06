import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadPublicationPlan, preparePublicationPlan } from "../release-publication-plan.mjs";

const roots = [];
const names = [
  "@starwind-ui/runtime",
  "@starwind-ui/astro",
  "@starwind-ui/react",
  "@starwind-ui/vue",
  "starwind",
];
const packageManifests = names.map((name) => ({
  entry: { name, ...(name === "@starwind-ui/vue" ? { tag: "beta" } : {}) },
  manifest: {
    name,
    version: name === "starwind" ? "3.4.0" : name === "@starwind-ui/vue" ? "0.2.0" : "1.3.0",
  },
}));
const head = "1234567890abcdef1234567890abcdef12345678";
const snapshot = packageManifests.map(({ entry, manifest }) => ({
  name: entry.name,
  version: manifest.version,
  tag: entry.tag ?? "latest",
}));

async function fixture(existing = []) {
  const repoRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-publication-plan-"));
  roots.push(repoRoot);
  const published = new Set(existing);
  const registry = {
    capture: async (_command, args) => {
      if (args[2] === "dist-tags")
        return { code: 0, stdout: JSON.stringify({ latest: "0.1.0", beta: "0.1.0" }), stderr: "" };
      const entry = snapshot.find(({ name, version }) => args[1] === `${name}@${version}`);
      return published.has(entry.name)
        ? { code: 0, stdout: JSON.stringify(entry.version), stderr: "" }
        : { code: 1, stdout: "", stderr: "npm ERR! code E404" };
    },
  };
  return { head, packageManifests, tag: "latest", repoRoot, registry, published };
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("routine publication planning", () => {
  it("keeps mixed tags and skips existing versions in dependency order", async () => {
    const input = await fixture(names.slice(0, 3));
    const result = await preparePublicationPlan(input);
    expect(result).toEqual({ head, snapshot, packages: snapshot.slice(3), vueLatest: "0.1.0" });
    expect(await loadPublicationPlan(input)).toEqual(result);
  });

  it("keeps dry-run discovery free of persistent state", async () => {
    const input = await fixture();
    expect((await preparePublicationPlan({ ...input, dryRun: true })).packages).toEqual(snapshot);
    expect(await readdir(input.repoRoot)).toEqual([]);
  });

  it("returns an empty plan when all versions already exist", async () => {
    const input = await fixture(names);
    expect((await preparePublicationPlan(input)).packages).toEqual([]);
  });

  it("retains the original publication subset through prefix recovery", async () => {
    const input = await fixture(names.slice(0, 3));
    const first = await preparePublicationPlan(input);
    input.published.add("@starwind-ui/vue");
    expect(await preparePublicationPlan({ ...input, resumeFrom: "starwind" })).toEqual(first);
    await expect(preparePublicationPlan(input)).rejects.toThrow(/resume-from/);
    await expect(
      preparePublicationPlan({ ...input, resumeFrom: "@starwind-ui/vue" }),
    ).rejects.toThrow(/first missing/);
  });

  it("rejects missing recovery state and non-prefix publication", async () => {
    const input = await fixture();
    await expect(preparePublicationPlan({ ...input, resumeFrom: "starwind" })).rejects.toThrow(
      /missing/,
    );
    await preparePublicationPlan(input);
    input.published.add("starwind");
    await expect(
      preparePublicationPlan({ ...input, resumeFrom: "@starwind-ui/runtime" }),
    ).rejects.toThrow(/prefix/);
  });

  it("directs a fully published saved plan to finalization", async () => {
    const input = await fixture(names.slice(0, 3));
    await preparePublicationPlan(input);
    names.forEach((name) => input.published.add(name));
    await expect(preparePublicationPlan(input)).rejects.toThrow(/release:finalize/);
  });

  it("rejects changed snapshots and a saved subset outside the original order", async () => {
    const input = await fixture();
    await preparePublicationPlan(input);
    const changed = structuredClone(packageManifests);
    changed[3].manifest.version = "0.3.0";
    await expect(loadPublicationPlan({ ...input, packageManifests: changed })).rejects.toThrow(
      /snapshot/,
    );
    const directory = path.join(
      input.repoRoot,
      "node_modules/.cache/starwind-release/publication-plans",
    );
    const file = path.join(directory, (await readdir(directory))[0]);
    const saved = JSON.parse(await readFile(file, "utf8"));
    saved.packages.reverse();
    await writeFile(file, JSON.stringify(saved));
    await expect(loadPublicationPlan(input)).rejects.toThrow(/ordered subset/);
  });

  it.each(["npm ERR! code E403", "npm ERR! code EAI_AGAIN", "npm ERR! code E500"])(
    "fails closed on %s",
    async (stderr) => {
      const input = await fixture();
      input.registry.capture = async () => ({ code: 1, stdout: "", stderr });
      await expect(preparePublicationPlan(input)).rejects.toThrow(/could not be checked/);
      expect(await readdir(input.repoRoot)).toEqual([]);
    },
  );

  it("rejects malformed exact-version responses", async () => {
    const input = await fixture();
    input.registry.capture = async () => ({ code: 0, stdout: '"9.9.9"', stderr: "" });
    await expect(preparePublicationPlan(input)).rejects.toThrow(/unexpected version/);
  });

  it("does not overwrite a previous saved baseline during a dry-run", async () => {
    const input = await fixture();
    const saved = await preparePublicationPlan(input);
    input.published.add("@starwind-ui/runtime");
    await preparePublicationPlan({ ...input, dryRun: true });
    expect(await loadPublicationPlan(input)).toEqual(saved);
  });
});
