import {
  accessSync,
  constants,
  mkdtempSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildPackageSizeBaselineCeilingCandidates,
  collectPackageSizeEnvironment,
  createPackageSizeRunDirectory,
  createPackageSizeRunRecord,
  evaluatePackageSizeRunStability,
  publishAcceptedPackageSizeArtifacts,
  serializePackageSizeEvidence,
  validatePackageSizeRunRecord,
} from "../package-size-run-evidence.mjs";

const requiredRowIds = ["vue-adapter", "vue-combined"];
const linuxEnvironment = {
  architecture: "x64",
  esbuildVersion: "0.25.8",
  kernelRelease: "6.8.0-64-generic",
  nodeVersion: "24.5.0",
  npmVersion: "11.5.1",
  osName: "Linux",
  osRelease: "#64-Ubuntu SMP",
  platform: "linux",
  pnpmVersion: "10.14.0",
  zlibVersion: "1.3.1",
};

function makeRun({ environment = linuxEnvironment, values = [100_000, 205_824], ...changes } = {}) {
  return createPackageSizeRunRecord({
    command: {
      executable: "pnpm",
      arguments: ["runtime:size:baseline:vue", "--refresh"],
    },
    commit: "a".repeat(40),
    comparator: {
      name: "zag-vue",
      version: "1.42.0",
      packages: { "@zag-js/core": "1.42.0", "@zag-js/vue": "1.42.0" },
    },
    environment,
    flags: { gzipLevel: 9, minify: true, platform: "browser", target: "es2020" },
    packageVersions: {
      "@starwind-ui/runtime": "0.4.4",
      "@starwind-ui/vue": "0.0.0",
    },
    rows: requiredRowIds.map((id, index) => ({ gzipBytes: values[index], id })),
    ...changes,
  });
}

describe("package-size run evidence", () => {
  it("accepts the exact 1% stability boundary", () => {
    const runs = [
      makeRun({ values: [100_000, 202_752] }),
      makeRun({ values: [100_000, 203_776] }),
      makeRun({ values: [100_000, 204_800] }),
    ];

    const result = evaluatePackageSizeRunStability({ requiredRowIds, runs });
    const oneByteBeyond = evaluatePackageSizeRunStability({
      requiredRowIds,
      runs: [
        makeRun({ values: [100_000, 202_751] }),
        makeRun({ values: [100_000, 203_776] }),
        makeRun({ values: [100_000, 204_800] }),
      ],
    });

    expect(result.stable).toBe(true);
    expect(result.rows.find((row) => row.id === "vue-combined")).toMatchObject({
      maximumBytes: 204_800,
      rangeBytes: 2_048,
      stable: true,
      toleranceBytes: 2_048,
    });
    expect(oneByteBeyond).toMatchObject({ stable: false, unstableRows: ["vue-combined"] });
  });

  it("accepts the exact 1 KiB boundary and rejects one byte beyond it", () => {
    const stable = evaluatePackageSizeRunStability({
      requiredRowIds,
      runs: [
        makeRun({ values: [98_976, 205_824] }),
        makeRun({ values: [99_488, 205_824] }),
        makeRun({ values: [100_000, 205_824] }),
      ],
    });
    const unstable = evaluatePackageSizeRunStability({
      requiredRowIds,
      runs: [
        makeRun({ values: [98_975, 205_824] }),
        makeRun({ values: [99_488, 205_824] }),
        makeRun({ values: [100_000, 205_824] }),
      ],
    });

    expect(stable.stable).toBe(true);
    expect(unstable).toMatchObject({ stable: false, unstableRows: ["vue-adapter"] });
  });

  it("rejects missing, invalid, and incomplete rows", () => {
    const valid = makeRun();
    const missing = { ...valid, rows: valid.rows.slice(0, 1) };
    const invalid = {
      ...valid,
      rows: valid.rows.map((row) =>
        row.id === "vue-adapter" ? { ...row, gzipBytes: Number.NaN } : row,
      ),
    };
    const incomplete = { ...valid, complete: false };

    expect(() => validatePackageSizeRunRecord(missing, { requiredRowIds })).toThrow(
      "Required package-size rows differ",
    );
    expect(() => validatePackageSizeRunRecord(invalid, { requiredRowIds })).toThrow(
      "finite nonnegative integer",
    );
    expect(() => validatePackageSizeRunRecord(incomplete, { requiredRowIds })).toThrow(
      "incomplete",
    );
  });

  it("rejects unknown record and nested fields", () => {
    const valid = makeRun();
    const cases = [
      { ...valid, unexpected: true },
      { ...valid, environment: { ...valid.environment, unexpected: true } },
      { ...valid, command: { ...valid.command, unexpected: true } },
      { ...valid, comparator: { ...valid.comparator, unexpected: true } },
      {
        ...valid,
        rows: valid.rows.map((row, index) => ({ ...row, ...(index ? {} : { extra: 1 }) })),
      },
    ];

    for (const record of cases) {
      expect(() => validatePackageSizeRunRecord(record)).toThrow("unknown field");
    }
  });

  it("rejects malformed runtime and tool versions", () => {
    for (const [key, value] of [
      ["nodeVersion", "24junk"],
      ["nodeVersion", "024.5.0"],
      ["nodeVersion", "24.05.0"],
      ["nodeVersion", "24.5.00"],
      ["nodeVersion", "24.5.0-01"],
      ["npmVersion", "11.5"],
      ["pnpmVersion", "latest"],
      ["esbuildVersion", "0.25.8junk"],
    ]) {
      expect(() => makeRun({ environment: { ...linuxEnvironment, [key]: value } })).toThrow(
        `environment.${key} must be a valid semantic version`,
      );
    }
    expect(() => makeRun({ comparator: { name: "zag-vue", version: "1.42junk" } })).toThrow(
      "comparator.version must be a valid semantic version",
    );
    expect(() => makeRun({ packageVersions: { "@starwind-ui/vue": "workspace:*" } })).toThrow(
      "packageVersions.@starwind-ui/vue must be a valid semantic version",
    );
  });

  it("accepts supported semantic version prerelease and build forms", () => {
    expect(
      makeRun({
        environment: {
          ...linuxEnvironment,
          nodeVersion: "24.5.0-rc.1+build.024",
          zlibVersion: "1.3.1-470d3a2",
        },
      }).environment,
    ).toMatchObject({ nodeVersion: "24.5.0-rc.1+build.024", zlibVersion: "1.3.1-470d3a2" });
  });

  it("preserves the native zlib version syntax emitted by Node 24", () => {
    const zlibVersion = "1.3.2.1-motley-3246f1b";

    expect(
      makeRun({ environment: { ...linuxEnvironment, zlibVersion } }).environment.zlibVersion,
    ).toBe(zlibVersion);
  });

  it("collects the live native zlib version without changing its provenance identity", () => {
    const environment = collectPackageSizeEnvironment({
      esbuildVersion: "0.25.8",
      execute: (command) => (command === "npm" ? "11.5.1" : "10.14.0"),
    });

    expect(environment.zlibVersion).toBe(process.versions.zlib);
  });

  it("rejects unsafe or malformed native zlib versions", () => {
    for (const zlibVersion of [
      "",
      " ",
      "1.3.2.1 motley",
      "1.3.2.1\nmotley",
      "../1.3.2.1",
      "1.3.2.1/motley",
      "1.3.2.1\\motley",
      "1",
      ".1.3.2",
      "1..3.2",
      "1.3.2.",
      "1.3.2.1-",
      "1.3.2.1--motley",
    ]) {
      expect(() => makeRun({ environment: { ...linuxEnvironment, zlibVersion } })).toThrow(
        "environment.zlibVersion must be a valid native runtime version",
      );
    }
  });

  it("rejects mixed environment, command, commit, tool, and package provenance", () => {
    const cases = [
      { environment: { ...linuxEnvironment, npmVersion: "11.5.2" } },
      { command: { executable: "pnpm", arguments: ["different"] } },
      { commit: "b".repeat(40) },
      { comparator: { name: "zag-vue", version: "1.42.1", packages: {} } },
      { packageVersions: { "@starwind-ui/vue": "0.0.1" } },
    ];

    for (const change of cases) {
      expect(() =>
        evaluatePackageSizeRunStability({
          requiredRowIds,
          runs: [makeRun(), makeRun(), makeRun(change)],
        }),
      ).toThrow("mixed provenance");
    }
  });

  it("rejects baseline publication from the wrong platform, architecture, or Node major", () => {
    for (const environment of [
      { ...linuxEnvironment, platform: "darwin" },
      { ...linuxEnvironment, architecture: "arm64" },
      { ...linuxEnvironment, nodeVersion: "22.18.0" },
    ]) {
      expect(() =>
        evaluatePackageSizeRunStability({
          requiredRowIds,
          runs: [makeRun({ environment }), makeRun({ environment }), makeRun({ environment })],
        }),
      ).toThrow("requires Linux x86_64 and Node 24");
    }
  });

  it("allows other platforms to validate committed run evidence", () => {
    const environment = { ...linuxEnvironment, architecture: "arm64", platform: "darwin" };
    const result = evaluatePackageSizeRunStability({
      requireBaselinePlatform: false,
      requiredRowIds,
      runs: [makeRun({ environment }), makeRun({ environment }), makeRun({ environment })],
    });

    expect(result.stable).toBe(true);
  });

  it("derives stable ceiling candidates with deterministic headroom", () => {
    const stability = evaluatePackageSizeRunStability({
      requiredRowIds,
      runs: [makeRun(), makeRun(), makeRun()],
    });

    expect(buildPackageSizeBaselineCeilingCandidates(stability, requiredRowIds)).toEqual([
      {
        ceilingBytes: 105_000,
        headroomBytes: 5_000,
        id: "vue-adapter",
        maximumBytes: 100_000,
        values: [100_000, 100_000, 100_000],
      },
      {
        ceilingBytes: 216_116,
        headroomBytes: 10_292,
        id: "vue-combined",
        maximumBytes: 205_824,
        values: [205_824, 205_824, 205_824],
      },
    ]);
  });

  it("creates unique writable run-local paths for active runs", () => {
    const parentDirectory = mkdtempSync(path.join(os.tmpdir(), "starwind-size-runs-"));
    const first = createPackageSizeRunDirectory({ parentDirectory });
    const second = createPackageSizeRunDirectory({ parentDirectory });

    expect(first.runDirectory).not.toBe(second.runDirectory);
    for (const key of ["npmCache", "comparatorInstall", "packOutput", "esbuildOutput"]) {
      expect(first[key]).not.toBe(second[key]);
      expect(first[key].startsWith(`${first.runDirectory}${path.sep}`)).toBe(true);
      accessSync(first[key], constants.R_OK | constants.W_OK);
    }
  });

  it("rejects run prefixes that can escape or add path segments", () => {
    const parentDirectory = mkdtempSync(path.join(os.tmpdir(), "starwind-size-prefix-"));

    for (const prefix of [
      "../escape-",
      path.resolve(parentDirectory, "absolute-"),
      "one/two-",
      "one\\two-",
    ]) {
      expect(() => createPackageSizeRunDirectory({ parentDirectory, prefix })).toThrow(
        "prefix must be one safe path segment",
      );
    }
  });

  it("keeps accepted bytes unchanged when staging is interrupted", () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), "starwind-size-publish-"));
    const destination = path.join(directory, "accepted.json");
    const diagnosticRun = createPackageSizeRunDirectory({ parentDirectory: directory });
    writeFileSync(destination, "accepted\n");
    const runs = [makeRun(), makeRun(), makeRun()];
    let retainedStagingPath;

    expect(() =>
      publishAcceptedPackageSizeArtifacts({
        artifacts: [{ contents: "candidate\n", destination }],
        beforeReplace: ({ staged }) => {
          retainedStagingPath = staged[0].stagingPath;
          throw new Error("simulated interruption");
        },
        evidence: runs,
        requiredRowIds,
      }),
    ).toThrow("simulated interruption");
    expect(readFileSync(destination, "utf8")).toBe("accepted\n");
    expect(readFileSync(retainedStagingPath, "utf8")).toBe("candidate\n");
    accessSync(diagnosticRun.runDirectory, constants.R_OK | constants.W_OK);
  });

  it("validates every candidate before it replaces accepted artifacts", () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), "starwind-size-validate-"));
    const first = path.join(directory, "first.txt");
    const second = path.join(directory, "second.txt");
    writeFileSync(first, "old first\n");
    writeFileSync(second, "old second\n");

    expect(() =>
      publishAcceptedPackageSizeArtifacts({
        artifacts: [
          { contents: "new first\n", destination: first },
          {
            contents: "bad second\n",
            destination: second,
            validate: () => {
              throw new Error("invalid candidate");
            },
          },
        ],
        evidence: [makeRun(), makeRun(), makeRun()],
        requiredRowIds,
      }),
    ).toThrow("invalid candidate");
    expect(readFileSync(first, "utf8")).toBe("old first\n");
    expect(readFileSync(second, "utf8")).toBe("old second\n");
  });

  it("restores every accepted artifact when a later replacement fails", () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), "starwind-size-rollback-"));
    const first = path.join(directory, "first.txt");
    const second = path.join(directory, "second.txt");
    const diagnosticRun = createPackageSizeRunDirectory({ parentDirectory: directory });
    writeFileSync(first, "old first\n");
    writeFileSync(second, "old second\n");
    let replacementCount = 0;
    let publicationError;

    try {
      publishAcceptedPackageSizeArtifacts({
        artifacts: [
          { contents: "new first\n", destination: first },
          { contents: "new second\n", destination: second },
        ],
        evidence: [
          makeRun({ diagnosticPath: diagnosticRun.runDirectory }),
          makeRun({ diagnosticPath: diagnosticRun.runDirectory }),
          makeRun({ diagnosticPath: diagnosticRun.runDirectory }),
        ],
        replaceArtifact: (source, destination) => {
          replacementCount += 1;
          if (replacementCount === 2) throw new Error("simulated second replacement failure");
          renameSync(source, destination);
        },
        requiredRowIds,
      });
    } catch (error) {
      publicationError = error;
    }

    expect(publicationError).toMatchObject({ message: "simulated second replacement failure" });
    expect(readFileSync(first, "utf8")).toBe("old first\n");
    expect(readFileSync(second, "utf8")).toBe("old second\n");
    expect(publicationError.packageSizePublication.diagnosticPaths).toEqual([
      diagnosticRun.runDirectory,
      diagnosticRun.runDirectory,
      diagnosticRun.runDirectory,
    ]);
    for (const [index, artifact] of publicationError.packageSizePublication.staged.entries()) {
      expect(artifact.retained).toBe(true);
      expect(readFileSync(artifact.stagingPath, "utf8")).toBe(
        `new ${index ? "second" : "first"}\n`,
      );
    }
    accessSync(diagnosticRun.runDirectory, constants.R_OK | constants.W_OK);
  });

  it("exposes publication diagnostics when rollback cannot restore every destination", () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), "starwind-size-rollback-failure-"));
    const first = path.join(directory, "first.txt");
    const second = path.join(directory, "second.txt");
    const diagnosticRun = createPackageSizeRunDirectory({ parentDirectory: directory });
    writeFileSync(first, "old first\n");
    writeFileSync(second, "old second\n");
    let replacementCount = 0;
    let publicationError;

    try {
      publishAcceptedPackageSizeArtifacts({
        artifacts: [
          { contents: "new first\n", destination: first },
          { contents: "new second\n", destination: second },
        ],
        evidence: [
          makeRun({ diagnosticPath: diagnosticRun.runDirectory }),
          makeRun({ diagnosticPath: diagnosticRun.runDirectory }),
          makeRun({ diagnosticPath: diagnosticRun.runDirectory }),
        ],
        replaceArtifact: (source, destination) => {
          replacementCount += 1;
          if (replacementCount === 2) throw new Error("simulated replacement failure");
          renameSync(source, destination);
        },
        requiredRowIds,
        rollbackArtifact: (source, destination) => {
          if (source.includes(".backup-") && destination === first) {
            throw new Error("simulated rollback failure");
          }
          renameSync(source, destination);
        },
      });
    } catch (error) {
      publicationError = error;
    }

    expect(publicationError).toBeInstanceOf(AggregateError);
    expect(publicationError.packageSizePublication).toMatchObject({
      destinations: [
        { destination: first, existedBefore: true, existsAfter: false, restored: false },
        { destination: second, existedBefore: true, existsAfter: true, restored: true },
      ],
      diagnosticPaths: [
        diagnosticRun.runDirectory,
        diagnosticRun.runDirectory,
        diagnosticRun.runDirectory,
      ],
      rollback: {
        complete: false,
        errors: ["simulated rollback failure", `Rollback changed destination existence: ${first}`],
      },
      staged: [
        { destination: first, retained: true },
        { destination: second, retained: true },
      ],
    });
    expect(publicationError.packageSizePublication.rollback.retainedBackups).toHaveLength(1);
    expect(
      readFileSync(publicationError.packageSizePublication.rollback.retainedBackups[0], "utf8"),
    ).toBe("old first\n");
  });

  it("serializes JSON keys deterministically", () => {
    expect(serializePackageSizeEvidence({ z: 1, rows: [{ z: 2, a: 1 }], a: { d: 4, b: 2 } })).toBe(
      '{\n  "a": {\n    "b": 2,\n    "d": 4\n  },\n  "rows": [\n    {\n      "a": 1,\n      "z": 2\n    }\n  ],\n  "z": 1\n}\n',
    );
  });
});
