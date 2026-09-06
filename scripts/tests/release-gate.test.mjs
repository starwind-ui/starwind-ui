import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";
import { releaseGateStages, reusableGateRecord, runReleaseGate } from "../release-gate.mjs";

const roots = [];
const recordFile = path.join("node_modules", ".cache", "starwind-release", "gate.json");

async function createFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "starwind-release-gate-test-"));
  roots.push(root);
  execFileSync("git", ["init", "-b", "main"], { cwd: root, stdio: "pipe" });
  execFileSync("git", ["config", "user.name", "Release gate test"], { cwd: root });
  execFileSync("git", ["config", "user.email", "release-gate-test@localhost"], { cwd: root });
  await writeFile(path.join(root, ".gitignore"), "node_modules/\n");
  await writeFile(path.join(root, "package.json"), '{"name":"fixture"}\n');
  await writeFile(path.join(root, "tracked-input.txt"), "initial\n");
  execFileSync("git", ["add", "."], { cwd: root });
  execFileSync("git", ["commit", "--quiet", "-m", "fixture"], { cwd: root });
  return root;
}

async function loadRecord(root) {
  return JSON.parse(await readFile(path.join(root, recordFile), "utf8"));
}

function callCount(calls, command) {
  return calls.filter(([first]) => first === command).length;
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
});

describe("release gate checkpoints", () => {
  const stages = [
    ["build", ["build:public"]],
    ["hosts", ["test:hosts"]],
  ];
  const inputs = { source: "source-and-toolchain", outputs: "built-files-and-packs", stages };
  const record = {
    ...inputs,
    schemaVersion: 1,
    completed: [{ name: "build", seconds: 1 }],
    complete: false,
  };
  it("resumes a completed prefix only while every recorded input matches", () => {
    expect(reusableGateRecord(record, inputs)).toBe(true);
    for (const changes of [
      { source: "edited" },
      { outputs: "repacked" },
      { stages: stages.slice(1) },
    ]) {
      expect(reusableGateRecord(record, { ...inputs, ...changes })).toBe(false);
    }
    expect(reusableGateRecord({ ...record, completed: [{ name: "hosts" }] }, inputs)).toBe(false);
    expect(reusableGateRecord({ ...record, complete: true }, inputs)).toBe(false);
    expect(
      reusableGateRecord(
        { ...record, completed: [{ name: "build" }, { name: "hosts" }], complete: true },
        inputs,
      ),
    ).toBe(true);
    expect(reusableGateRecord(null, inputs)).toBe(false);
  });
  it("builds and packs before prepared tests, retaining both complete host matrices", () => {
    const publicStages = releaseGateStages();
    const index = (name) => publicStages.findIndex(([candidate]) => candidate === name);
    expect(index("build")).toBeLessThan(index("pack"));
    for (const stage of ["vue tests", "vue demo", "Vue hosts", "candidate hosts"])
      expect(index("pack")).toBeLessThan(index(stage));
    expect(publicStages.find(([name]) => name === "vue tests")[1]).toContain("test:all:built");
    expect(publicStages.find(([name]) => name === "vue demo")[1]).toContain("smoke:built");
    expect(releaseGateStages({ privateEvidence: true })).toHaveLength(publicStages.length + 1);
  });

  it("reuses a completed prefix after a later stage fails", async () => {
    const root = await createFixture();
    const calls = [];
    const run = async (args) => {
      calls.push(args);
      if (args[0] === "styled:versions:check") throw new Error("stop after static");
    };

    await expect(runReleaseGate({ root, run })).rejects.toThrow("stop after static");
    await expect(runReleaseGate({ root, run })).rejects.toThrow("stop after static");

    expect(callCount(calls, "audit:prod")).toBe(2);
    expect(callCount(calls, "check:public")).toBe(1);
    expect(callCount(calls, "styled:versions:check")).toBe(2);
    await expect(loadRecord(root)).resolves.toMatchObject({
      complete: false,
      completed: [{ name: "static" }],
    });
  });

  it("starts stages again when a failed stage changes built output", async () => {
    const root = await createFixture();
    const calls = [];
    const run = async (args) => {
      calls.push(args);
      if (args[0] === "styled:versions:check") {
        await mkdir(path.join(root, "packages", "runtime", "dist"), { recursive: true });
        await writeFile(path.join(root, "packages", "runtime", "dist", "index.js"), "changed\n");
        throw new Error("output changed");
      }
    };

    await expect(runReleaseGate({ root, run })).rejects.toThrow("output changed");
    await expect(runReleaseGate({ root, run })).rejects.toThrow("output changed");

    expect(callCount(calls, "audit:prod")).toBe(2);
    expect(callCount(calls, "check:public")).toBe(2);
    expect(callCount(calls, "styled:versions:check")).toBe(2);
  });

  it("rejects source drift before recording a successful stage", async () => {
    const root = await createFixture();
    const calls = [];

    await expect(
      runReleaseGate({
        root,
        run: async (args) => {
          calls.push(args);
          if (args[0] === "check:public") {
            await writeFile(path.join(root, "tracked-input.txt"), "generated drift\n");
          }
        },
      }),
    ).rejects.toThrow(/Source changed during static/);

    expect(callCount(calls, "audit:prod")).toBe(1);
    expect(callCount(calls, "check:public")).toBe(1);
    await expect(loadRecord(root)).resolves.toMatchObject({ complete: false, completed: [] });
  });
});
