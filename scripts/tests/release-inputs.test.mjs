import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, expect, it } from "vitest";
import {
  fingerprintFiles,
  releaseOutputFingerprint,
  releaseSourceFiles,
  releaseSourceFingerprint,
} from "../release-inputs.mjs";

const roots = [];
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

it("lists a source tree whose Git output exceeds the default child-process buffer", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "release-inputs-large-list-"));
  roots.push(root);
  execFileSync("git", ["init", "--quiet"], { cwd: root });
  const directory = path.join(root, "many");
  await mkdir(directory);
  const expected = [];
  for (let batch = 0; batch < 40; batch += 1) {
    const writes = [];
    for (let index = 0; index < 200; index += 1) {
      const id = batch * 200 + index;
      const name = `${String(id).padStart(5, "0")}-${"release-input-".repeat(9)}.txt`;
      expected.push(`many/${name}`);
      writes.push(writeFile(path.join(directory, name), String(id)));
    }
    await Promise.all(writes);
  }

  expect(Buffer.byteLength(`${expected.join("\0")}\0`)).toBeGreaterThan(1024 * 1024);
  const files = releaseSourceFiles(root);
  expect(files).toEqual(expected.sort());
  const original = fingerprintFiles(root, files);
  await writeFile(path.join(root, files.at(-1)), "changed tail input");
  expect(fingerprintFiles(root, releaseSourceFiles(root))).not.toBe(original);
});
it("fingerprints a tracked directory symlink by its target path", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "release-inputs-symlink-"));
  roots.push(root);
  execFileSync("git", ["init", "--quiet"], { cwd: root });
  await mkdir(path.join(root, "first"));
  await mkdir(path.join(root, "second"));
  await writeFile(path.join(root, "first", "SKILL.md"), "skill\n");
  await symlink("first", path.join(root, "link"));
  execFileSync("git", ["add", "."], { cwd: root });

  const original = releaseSourceFingerprint(root);
  await writeFile(path.join(root, "first", "SKILL.md"), "edited skill\n");
  const edited = releaseSourceFingerprint(root);
  expect(edited).not.toBe(original);
  await rm(path.join(root, "link"));
  await symlink("second", path.join(root, "link"));
  expect(releaseSourceFingerprint(root)).not.toBe(edited);
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
