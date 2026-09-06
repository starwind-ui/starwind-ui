import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, expect, it } from "vitest";
import { releaseOutputFingerprint, releaseSourceFingerprint } from "../release-inputs.mjs";

const roots = [];
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});
it("invalidates release evidence for edited and new source, dependencies, and built artifacts", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "release-inputs-test-"));
  roots.push(root);
  execFileSync("git", ["init", "--quiet"], { cwd: root });
  await writeFile(path.join(root, ".gitignore"), "node_modules/\npackages/*/dist/\n");
  await writeFile(path.join(root, "source.js"), "export const value = 1;");
  execFileSync("git", ["add", "."], { cwd: root });
  const original = releaseSourceFingerprint(root);
  await writeFile(path.join(root, "source.js"), "export const value = 2;");
  expect(releaseSourceFingerprint(root)).not.toBe(original);
  await writeFile(path.join(root, "source.js"), "export const value = 1;");
  expect(releaseSourceFingerprint(root)).toBe(original);
  await writeFile(path.join(root, "pnpm-lock.yaml"), "lockfileVersion: '9.0'");
  expect(releaseSourceFingerprint(root)).not.toBe(original);
  await rm(path.join(root, "pnpm-lock.yaml"));
  const packs = path.join(root, "node_modules/packs");
  const outputs = releaseOutputFingerprint(root, packs);
  await mkdir(path.join(root, "packages/vue/dist"), { recursive: true });
  await writeFile(path.join(root, "packages/vue/dist/index.js"), "export {};");
  expect(releaseOutputFingerprint(root, packs)).not.toBe(outputs);
  expect(releaseSourceFingerprint(root)).toBe(original);
});
