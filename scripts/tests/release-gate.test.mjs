import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";
import {
  assertGateEvidence,
  assertReleaseGate,
  RELEASE_PACKS,
  releaseGateStages,
  reusableGateRecord,
  runReleaseGate,
  verifyGateEvidence,
} from "../release-gate.mjs";

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
    for (const stage of [
      "vue tests",
      "vue demo",
      "Vue hosts",
      "svelte tests",
      "svelte demo",
      "Svelte hosts",
      "candidate hosts",
    ])
      expect(index("pack")).toBeLessThan(index(stage));
    expect(publicStages.find(([name]) => name === "vue tests")[1]).toContain("test:all:built");
    expect(publicStages.find(([name]) => name === "vue demo")[1]).toContain("smoke:built");
    expect(publicStages.find(([name]) => name === "svelte tests")[1]).toEqual([
      "--filter=@starwind-ui/svelte",
      "test:run",
    ]);
    expect(publicStages.find(([name]) => name === "Svelte hosts")[1]).toEqual([
      "test:svelte-cli-host-acceptance",
      `--packs=${RELEASE_PACKS}`,
    ]);
    expect(releaseGateStages({ privateEvidence: true })).toEqual(publicStages);
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

  it("reuses lane stages only after every preparation stage passes", () => {
    const laneStages = [
      ["build", ["build:public"]],
      ["pack", ["pack"]],
      ["unit", ["test:unit"], "tests"],
      ["hosts", ["test:hosts"], "hosts"],
    ];
    const laneInputs = { ...inputs, stages: laneStages };
    const withCompleted = (names, complete = false) => ({
      ...laneInputs,
      schemaVersion: 1,
      completed: names.map((name) => ({ name, seconds: 1 })),
      complete,
    });

    expect(reusableGateRecord(withCompleted(["build", "pack", "hosts"]), laneInputs)).toBe(true);
    expect(reusableGateRecord(withCompleted(["build", "hosts"]), laneInputs)).toBe(false);
    expect(reusableGateRecord(withCompleted(["build", "pack", "hosts", "hosts"]), laneInputs)).toBe(
      false,
    );
    expect(reusableGateRecord(withCompleted(["build", "pack", "hosts"], true), laneInputs)).toBe(
      false,
    );
    expect(
      reusableGateRecord(withCompleted(["build", "pack", "hosts", "unit"], true), laneInputs),
    ).toBe(true);
  });

  it("prepares in order before lanes, and lanes only hold prepared-output stages", () => {
    const publicStages = releaseGateStages();
    const firstLane = publicStages.findIndex(([, , lane]) => lane);
    expect(publicStages[firstLane - 1][0]).toBe("pack");
    expect(publicStages.slice(firstLane).every(([, , lane]) => lane)).toBe(true);
    const laneOf = (name) => publicStages.find(([stage]) => stage === name)[2];
    // These stages start Vite servers on the default HMR port, so they must not overlap.
    for (const name of ["astro demo", "react demo"]) expect(laneOf(name)).toBe(laneOf("vue tests"));
    expect(new Set(publicStages.map(([, , lane]) => lane).filter(Boolean))).toEqual(
      new Set(["tests", "generators", "demos", "hosts", "candidate"]),
    );
  });

  it("runs lanes at the same time with one log file per lane stage", async () => {
    const root = await createFixture();
    const laneNames = new Set(
      releaseGateStages()
        .filter(([, , lane]) => lane)
        .map(([name]) => name),
    );
    const laneArgs = new Map(
      releaseGateStages()
        .filter(([, , lane]) => lane)
        .map(([, args]) => [args.join(" "), true]),
    );
    let active = 0;
    let peak = 0;
    const logFiles = [];
    const run = async (args, _root, options) => {
      if (!laneArgs.has(args.join(" "))) return;
      logFiles.push(options?.logFile);
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
    };

    // The fixture has no packs, so the final artifact check fails after every stage passes.
    await expect(runReleaseGate({ root, run })).rejects.not.toThrow(/failed stage/);

    expect(peak).toBe(5);
    expect(logFiles).toHaveLength(laneNames.size);
    expect(logFiles.every((file) => file?.startsWith(path.join(root, "node_modules")))).toBe(true);
    const record = await loadRecord(root);
    expect(record.completed).toHaveLength(releaseGateStages().length);
  });

  it("retries a failed lane stage alone, then reports every stage that fails again", async () => {
    const root = await createFixture();
    const calls = [];
    let failing = new Set(["react:test", "test:vue-cli-host-acceptance"]);
    const run = async (args) => {
      calls.push(args);
      if (failing.has(args[0])) throw new Error(`${args[0]} broke`);
    };

    const failure = runReleaseGate({ root, run });
    await expect(failure).rejects.toThrow(/found 2 failed stage\(s\)/);
    await expect(failure).rejects.toThrow(/react tests: react:test broke/);
    await expect(failure).rejects.toThrow(/Vue hosts: test:vue-cli-host-acceptance broke/);
    expect(callCount(calls, "runtime:test")).toBe(1);
    expect(callCount(calls, "react:test")).toBe(2);
    expect(callCount(calls, "release:candidate:acceptance")).toBe(1);

    failing = new Set();
    await expect(runReleaseGate({ root, run })).rejects.not.toThrow(/failed stage/);
    expect(callCount(calls, "check:public")).toBe(1);
    expect(callCount(calls, "runtime:test")).toBe(1);
    expect(callCount(calls, "react:test")).toBe(3);
    expect(callCount(calls, "test:vue-cli-host-acceptance")).toBe(3);
  });

  it("records a lane stage that fails under load and passes alone", async () => {
    const root = await createFixture();
    let active = 0;
    let attempts = 0;
    const run = async (args) => {
      active += 1;
      await new Promise((resolve) => setTimeout(resolve, 5));
      const crowded = active > 1;
      active -= 1;
      if (args[0] === "test:run" && (attempts += 1) && crowded)
        throw new Error("Test timed out in 60000ms.");
    };

    await expect(runReleaseGate({ root, run })).rejects.not.toThrow(/failed stage/);

    expect(attempts).toBe(2);
    const record = await loadRecord(root);
    expect(record.completed.map(({ name }) => name)).toContain("repo and generator tests");
  });

  it("runs every stage one at a time without log files in serial mode", async () => {
    const root = await createFixture();
    let active = 0;
    let peak = 0;
    const options = [];
    const run = async (args, _root, runOptions) => {
      // The audit always writes a log, because it runs before any stage.
      if (args[0] !== "audit:prod") options.push(runOptions);
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 1));
      active -= 1;
    };

    await expect(runReleaseGate({ root, run, serial: true })).rejects.not.toThrow(/failed stage/);

    expect(peak).toBe(1);
    expect(options.every((value) => value === undefined)).toBe(true);
  });

  it("allows temporary lane files and rejects source a lane leaves changed", async () => {
    const root = await createFixture();
    const transient = path.join(root, ".generator-temp", "Component.vue");
    const runWith = (leaveChange) => async (args) => {
      if (args[0] === "runtime:generate:vue:test") {
        await mkdir(path.dirname(transient), { recursive: true });
        await writeFile(transient, "temporary\n");
        await new Promise((resolve) => setTimeout(resolve, 20));
        if (!leaveChange) await rm(path.dirname(transient), { recursive: true });
      } else if (args[0] === "runtime:test") {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    };

    await expect(runReleaseGate({ root, run: runWith(false), fresh: true })).rejects.not.toThrow(
      /failed stage/,
    );
    await expect(runReleaseGate({ root, run: runWith(true), fresh: true })).rejects.toThrow(
      /lanes: Source changed while the lanes ran/,
    );
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

describe("release gate evidence at merge points", () => {
  const git = (root, ...args) =>
    execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: "pipe" }).trim();

  // Every stage passes, but the fixture has no packs, so the final artifact check fails. Mark the
  // record complete as a real passing gate would.
  async function passGate(root) {
    await expect(runReleaseGate({ root, run: async () => {} })).rejects.not.toThrow(/failed stage/);
    const record = await loadRecord(root);
    await writeFile(
      path.join(root, recordFile),
      `${JSON.stringify({ ...record, complete: true }, null, 2)}\n`,
    );
    return record;
  }

  async function createLockedFixture() {
    const root = await createFixture();
    await writeFile(path.join(root, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
    git(root, "add", ".");
    git(root, "commit", "--quiet", "-m", "lockfile");
    return root;
  }

  it("accepts a complete record for the exact source and expected head", async () => {
    const root = await createLockedFixture();
    const record = await passGate(root);

    expect(record.head).toBe(git(root, "rev-parse", "HEAD"));
    expect(record.toolchain).toMatchObject({ node: process.version });
    await expect(verifyGateEvidence({ root, expectHead: "HEAD" })).resolves.toMatchObject({
      ok: true,
      problems: [],
    });
    await expect(assertGateEvidence({ root, expectHead: "main" })).resolves.toMatchObject({
      complete: true,
    });
  });

  it("names the stages an incomplete record is missing", async () => {
    const root = await createLockedFixture();
    const failing = new Set(["runtime:generate:svelte:test", "release:candidate:acceptance"]);
    await expect(
      runReleaseGate({
        root,
        run: async (args) => {
          if (failing.has(args[0])) throw new Error(`${args[0]} broke`);
        },
      }),
    ).rejects.toThrow(/found 2 failed stage/);

    const { ok, problems } = await verifyGateEvidence({ root });
    expect(ok).toBe(false);
    expect(problems).toEqual([
      "The record is incomplete. Stages that failed or did not run: svelte generator tests, candidate hosts.",
    ]);
  });

  it("rejects a complete record from an older source tree and prints what changed", async () => {
    const root = await createLockedFixture();
    const record = await passGate(root);
    await writeFile(path.join(root, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n# svelte 5.57\n");
    git(root, "commit", "--quiet", "-am", "refresh dependencies");

    const { ok, problems } = await verifyGateEvidence({ root, expectHead: "HEAD" });
    expect(ok).toBe(false);
    expect(problems).toEqual([
      "The record is for a different source tree.",
      "pnpm-lock.yaml changed.",
      `The record was written at ${record.head.slice(0, 12)}; HEAD is ${git(root, "rev-parse", "HEAD").slice(0, 12)}.`,
      "Files changed after the record (1): pnpm-lock.yaml.",
    ]);
    await expect(assertGateEvidence({ root })).rejects.toThrow(
      /does not match this checkout:\n- The record is for a different source tree\./,
    );
  });

  it("rejects a missing record, a different head, and a dirty checkout", async () => {
    const root = await createLockedFixture();
    await expect(verifyGateEvidence({ root })).resolves.toMatchObject({
      ok: false,
      problems: [`No release gate record at ${path.join(root, recordFile)}.`],
    });

    await passGate(root);
    await expect(verifyGateEvidence({ root, expectHead: "HEAD~1" })).resolves.toMatchObject({
      ok: false,
      problems: [expect.stringMatching(/^The checkout is at \w{12}, not the expected \w{12}\.$/)],
    });

    await writeFile(path.join(root, "untracked.txt"), "local edit\n");
    const { problems } = await verifyGateEvidence({ root, expectHead: "HEAD" });
    expect(problems).toContain("The checkout has uncommitted or untracked files.");
    expect(problems).toContain("The record is for a different source tree.");
  });

  it("accepts the same tree on another commit, as after a squash merge", async () => {
    const root = await createLockedFixture();
    await passGate(root);
    git(root, "commit", "--quiet", "--allow-empty", "-m", "squash merge");

    await expect(verifyGateEvidence({ root, expectHead: "main" })).resolves.toMatchObject({
      ok: true,
    });
  });

  it("runs every stage after a failed audit and keeps the audit out of stage evidence", async () => {
    const root = await createLockedFixture();
    const calls = [];
    const run = async (args) => {
      calls.push(args);
      if (args[0] === "audit:prod") throw new Error("pnpm audit:prod failed (1).");
    };

    await expect(runReleaseGate({ root, run })).rejects.not.toThrow(/failed stage/);
    for (const [, args] of releaseGateStages()) expect(calls).toContainEqual(args);
    const record = await loadRecord(root);
    expect(record.completed).toHaveLength(releaseGateStages().length);
    expect(record.audit).toMatchObject({ passed: false, message: "pnpm audit:prod failed (1)." });
    expect(record.audit.log).toMatch(/dependency-audit\.log$/);

    await writeFile(
      path.join(root, recordFile),
      `${JSON.stringify({ ...record, complete: true }, null, 2)}\n`,
    );
    const evidence = await verifyGateEvidence({ root, expectHead: "HEAD" });
    expect(evidence).toMatchObject({ ok: true, problems: [] });
    expect(evidence.audit).toMatch(/^Dependency audit: failed\. .*dependency-audit\.log$/);
    // Publication keeps the audit as a hard block.
    await expect(assertReleaseGate({ root })).rejects.toThrow(
      /dependency audit did not pass in the last gate run/,
    );
  });

  it("reports a failed audit together with failed stages", async () => {
    const root = await createLockedFixture();
    const run = async (args) => {
      if (args[0] === "audit:prod") throw new Error("advisory");
      if (args[0] === "runtime:generate:svelte:test") throw new Error("svelte broke");
    };

    const failure = runReleaseGate({ root, run });
    await expect(failure).rejects.toThrow(/found 1 failed stage\(s\)/);
    await expect(failure).rejects.toThrow(
      /svelte generator tests: svelte broke\ndependency audit: advisory/,
    );
    await expect(verifyGateEvidence({ root })).resolves.toMatchObject({
      ok: false,
      problems: [
        "The record is incomplete. Stages that failed or did not run: svelte generator tests.",
      ],
    });
  });

  it("requires the expected base to be an ancestor of the checkout", async () => {
    const root = await createLockedFixture();
    await passGate(root);
    git(root, "switch", "--quiet", "-c", "moved-main");
    git(root, "commit", "--quiet", "--allow-empty", "-m", "public main moved");
    git(root, "switch", "--quiet", "main");

    await expect(verifyGateEvidence({ root, expectBase: "HEAD~1" })).resolves.toMatchObject({
      ok: true,
    });
    const { ok, problems } = await verifyGateEvidence({
      root,
      expectHead: "main",
      expectBase: "moved-main",
    });
    expect(ok).toBe(false);
    expect(problems).toEqual([
      expect.stringMatching(/^HEAD does not contain moved-main \(\w{12}\)\. Refresh the branch/),
    ]);
  });

  it("rejects evidence after the installed dependencies change", async () => {
    const root = await createLockedFixture();
    await passGate(root);
    await mkdir(path.join(root, "node_modules", ".pnpm"), { recursive: true });
    await writeFile(path.join(root, "node_modules", ".pnpm", "lock.yaml"), "svelte: 5.57.2\n");

    await expect(verifyGateEvidence({ root })).resolves.toMatchObject({
      ok: false,
      problems: [
        "Installed dependencies changed after the record (node_modules/.pnpm/lock.yaml). Run the gate again.",
      ],
    });
    const calls = [];
    await expect(
      runReleaseGate({ root, run: async (args) => calls.push(args) }),
    ).rejects.not.toThrow(/failed stage/);
    expect(callCount(calls, "check:public")).toBe(1);
  });
});
