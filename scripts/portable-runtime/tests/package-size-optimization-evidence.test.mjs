import { renameSync, writeFileSync } from "node:fs";
import {
  access,
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

import { describe, expect, it } from "vitest";

import {
  buildPackageSizeOptimizationEvidence,
  getPackageSizeOptimizationEvidencePaths,
  publishPackageSizeOptimizationEvidence,
  renderPackageSizeOptimizationMarkdown,
  runPackageSizeOptimizationEvidenceCommand,
  serializePackageSizeOptimizationEvidence,
  validatePackageSizeOptimizationEvidence,
} from "../package-size-optimization-evidence.mjs";

const repoRoot = process.cwd();
const temporaryRoot = await realpath(os.tmpdir());
const acceptedEvidence = JSON.parse(
  await readFile(
    path.join(repoRoot, "scripts/portable-runtime/evidence/vue-package-size-baseline.json"),
    "utf8",
  ),
);
const predecessorCommit = "1".repeat(40);
const candidateCommit = "2".repeat(40);
const relevantRowId = "vue.adapter-only";

describe("package size optimization evidence", () => {
  it("retains an improvement at the exact 1 KiB threshold", () => {
    const evidence = buildEvidence({ beforeBytes: 52_000, afterBytes: 50_976 });
    const row = evidence.comparisons.find(({ id }) => id === relevantRowId);

    expect(row).toEqual(
      expect.objectContaining({
        afterMaximumBytes: 50_976,
        beforeMaximumBytes: 52_000,
        improvementBytes: 1_024,
        requiredImprovementBytes: 1_024,
        retentionThresholdMet: true,
        thresholdDisposition: "retained",
      }),
    );
    expect(evidence.decision).toEqual({
      behaviorGatesPass: true,
      budgetsPass: true,
      disposition: "retained",
      reason: "Every retention row meets the size threshold and all gates pass.",
      retentionRowsPass: true,
    });
  });

  it("uses the 1% threshold when it exceeds 1 KiB", () => {
    const evidence = buildEvidence({ beforeBytes: 200_000, afterBytes: 198_000 });
    const row = evidence.comparisons.find(({ id }) => id === relevantRowId);

    expect(row.requiredImprovementBytes).toBe(2_000);
    expect(row.retentionThresholdMet).toBe(true);
  });

  it("rejects a candidate one byte below the threshold", () => {
    const evidence = buildEvidence({ beforeBytes: 52_000, afterBytes: 50_977 });
    const row = evidence.comparisons.find(({ id }) => id === relevantRowId);

    expect(row.improvementBytes).toBe(1_023);
    expect(row.thresholdDisposition).toBe("rejected");
    expect(evidence.decision.disposition).toBe("rejected");
    expect(evidence.decision.reason).toContain("retention threshold");
  });

  it("rejects regressions and reports failed existing budgets", () => {
    const evidence = buildEvidence({ beforeBytes: 52_000, afterBytes: 54_399 });
    const row = evidence.comparisons.find(({ id }) => id === relevantRowId);

    expect(row.improvementBytes).toBe(-2_399);
    expect(row.budget).toEqual({ ceilingBytes: 54_398, passed: false });
    expect(evidence.budgetResults.find(({ id }) => id === relevantRowId)).toEqual({
      ceilingBytes: 54_398,
      maximumBytes: 54_399,
      id: relevantRowId,
      passed: false,
    });
    expect(evidence.decision).toEqual(
      expect.objectContaining({ budgetsPass: false, disposition: "rejected" }),
    );
  });

  it("records correctness-only size effects as advisory", () => {
    const evidence = buildEvidence({
      afterBytes: 51_900,
      beforeBytes: 52_000,
      evaluationMode: "advisory",
    });

    expect(evidence.decision).toEqual(
      expect.objectContaining({ disposition: "recorded-advisory", retentionRowsPass: false }),
    );
    expect(evidence.comparisons.find(({ id }) => id === relevantRowId).thresholdDisposition).toBe(
      "rejected",
    );
  });

  it("rejects a threshold candidate when a behavior gate fails", () => {
    const evidence = buildEvidence({
      afterBytes: 50_976,
      beforeBytes: 52_000,
      behaviorGates: [{ id: "focused-verification", passed: false }],
    });

    expect(evidence.decision).toEqual(
      expect.objectContaining({ behaviorGatesPass: false, disposition: "rejected" }),
    );
  });

  it.each([
    [
      "missing rows",
      () => {
        const runs = runsAt(candidateCommit, { [relevantRowId]: 50_976 });
        runs[0].rows.pop();
        return { afterRuns: runs };
      },
      /Required package-size rows differ/,
    ],
    [
      "unstable runs",
      () => ({
        afterRuns: runsAt(candidateCommit, { [relevantRowId]: [50_000, 50_000, 52_000] }),
      }),
      /Unstable package-size rows/,
    ],
    [
      "mixed within-set provenance",
      () => {
        const runs = runsAt(candidateCommit, { [relevantRowId]: 50_976 });
        runs[1].flags = { ...runs[1].flags, changed: true };
        return { afterRuns: runs };
      },
      /mixed provenance/,
    ],
    [
      "mixed cross-set environment",
      () => ({
        afterRuns: runsAt(candidateCommit, { [relevantRowId]: 50_976 }, (run) => {
          run.environment.osRelease = "different-release";
        }),
      }),
      /same environment and tool provenance/,
    ],
    [
      "mixed cross-set tool provenance",
      () => ({
        afterRuns: runsAt(candidateCommit, { [relevantRowId]: 50_976 }, (run) => {
          run.packageVersions["@starwind-ui/vue"] = "0.0.1";
        }),
      }),
      /same environment and tool provenance/,
    ],
    [
      "non-Linux records",
      () => ({
        afterRuns: runsAt(candidateCommit, { [relevantRowId]: 50_976 }, (run) => {
          run.environment.platform = "darwin";
        }),
      }),
      /Linux x86_64 and Node 24/,
    ],
    [
      "incorrect candidate commit",
      () => ({ afterRuns: runsAt("3".repeat(40), { [relevantRowId]: 50_976 }) }),
      /candidate commit/,
    ],
    [
      "a missing diagnostic path",
      () => {
        const runs = runsAt(candidateCommit, { [relevantRowId]: 50_976 });
        delete runs[1].diagnosticPath;
        return { afterRuns: runs };
      },
      /requires an absolute diagnostic path/,
    ],
    [
      "a reused within-set diagnostic path",
      () => {
        const runs = runsAt(candidateCommit, { [relevantRowId]: 50_976 });
        runs[2].diagnosticPath = runs[0].diagnosticPath;
        return { afterRuns: runs };
      },
      /reuse diagnostic path/,
    ],
    [
      "a before-after diagnostic path collision",
      () => {
        const beforeRuns = runsAt(predecessorCommit, { [relevantRowId]: 52_000 });
        const afterRuns = runsAt(candidateCommit, { [relevantRowId]: 50_976 });
        afterRuns[0].diagnosticPath = beforeRuns[0].diagnosticPath;
        return { afterRuns, beforeRuns };
      },
      /before and after runs reuse diagnostic path/,
    ],
  ])("rejects %s", (_label, change, message) => {
    expect(() => buildEvidence({ beforeBytes: 52_000, afterBytes: 50_976, ...change() })).toThrow(
      message,
    );
  });

  it("allows only the worktree path to differ in the measurement command", () => {
    const afterRuns = runsAt(candidateCommit, { [relevantRowId]: 50_976 }, (run) => {
      run.command.arguments[0] =
        "/tmp/another-worktree/scripts/portable-runtime/measure-package-sizes.mjs";
    });

    expect(
      buildEvidence({ afterRuns, beforeBytes: 52_000, afterBytes: 50_976 }).decision.disposition,
    ).toBe("retained");
  });

  it.each([
    [
      "executable",
      (run) => {
        run.command.executable = "/usr/bin/bun";
      },
    ],
    [
      "measurement mode",
      (run) => {
        run.command.arguments.push("--check");
      },
    ],
    [
      "measurement script",
      (run) => {
        run.command.arguments[0] = "/tmp/another-worktree/scripts/other-measurement.mjs";
      },
    ],
    [
      "same-named measurement script outside its repository-relative path",
      (run) => {
        run.command.arguments[0] = "/tmp/another-worktree/tools/measure-package-sizes.mjs";
      },
    ],
  ])("rejects a materially different %s", (_label, mutate) => {
    const afterRuns = runsAt(candidateCommit, { [relevantRowId]: 50_976 }, mutate);
    expect(() => buildEvidence({ afterRuns, beforeBytes: 52_000, afterBytes: 50_976 })).toThrow(
      "materially different measurement commands",
    );
  });

  it("rebuilds deterministic JSON and Markdown from raw runs", () => {
    const evidence = buildEvidence({ beforeBytes: 52_000, afterBytes: 50_976 });
    const serialized = serializePackageSizeOptimizationEvidence(evidence);

    expect(validatePackageSizeOptimizationEvidence(JSON.parse(serialized))).toEqual(evidence);
    expect(serializePackageSizeOptimizationEvidence(evidence)).toBe(serialized);
    expect(renderPackageSizeOptimizationMarkdown(evidence)).toBe(
      renderPackageSizeOptimizationMarkdown(JSON.parse(serialized)),
    );
    expect(renderPackageSizeOptimizationMarkdown(evidence)).toContain(
      "| `vue.adapter-only` | 52000 | 50976 | 1024 | 1.969231% | 1024 | retained | Pass |",
    );
  });

  it("rolls back both private candidate artifacts after interrupted publication", async () => {
    const temporaryRepo = await mkdtemp(path.join(temporaryRoot, "starwind-candidate-rollback-"));
    const evidence = buildEvidence({ beforeBytes: 52_000, afterBytes: 50_976 });
    const paths = getPackageSizeOptimizationEvidencePaths({
      candidateId: "compiler-inline-production",
      repoRoot: temporaryRepo,
    });

    try {
      await mkdir(path.dirname(paths.json), { recursive: true });
      await writeFile(paths.json, "old json", "utf8");
      await writeFile(paths.markdown, "old markdown", "utf8");
      let replacements = 0;

      let publicationError;
      try {
        publishPackageSizeOptimizationEvidence({
          candidateId: "compiler-inline-production",
          evidence,
          publicationOptions: {
            replaceArtifact: (source, destination) => {
              replacements += 1;
              if (replacements === 2) throw new Error("simulated interruption");
              return renameSync(source, destination);
            },
            rollbackArtifact: renameSync,
          },
          repoRoot: temporaryRepo,
        });
      } catch (error) {
        publicationError = error;
      }
      expect(publicationError?.message).toBe("simulated interruption");
      expect(publicationError?.packageSizeOptimizationPublication).toEqual(
        expect.objectContaining({
          rollback: expect.objectContaining({ complete: true, errors: [] }),
        }),
      );
      expect(await readFile(paths.json, "utf8")).toBe("old json");
      expect(await readFile(paths.markdown, "utf8")).toBe("old markdown");
    } finally {
      await rm(temporaryRepo, { force: true, recursive: true });
    }
  });

  it.each([
    [
      "validation",
      {
        mutateEvidence: (evidence) => {
          evidence.comparisons[0].improvementBytes += 1;
        },
      },
    ],
    [
      "staging",
      {
        publicationOptions: {
          stageArtifact: createFailingStageWriter(),
        },
      },
    ],
    [
      "staged-validation",
      {
        publicationOptions: {
          stageArtifact: ({ stagingPath }) => {
            writeFileSync(stagingPath, "corrupt staged bytes", {
              flag: "wx",
              mode: 0o600,
            });
          },
        },
      },
    ],
    [
      "before-replace",
      {
        publicationOptions: {
          beforeReplace: () => {
            throw new Error("simulated beforeReplace failure");
          },
        },
      },
    ],
  ])("preserves both artifacts after a %s failure", async (phase, options) => {
    const diagnostics = await exercisePublicationFailure(options);

    expect(diagnostics).toEqual(
      expect.objectContaining({
        phase,
        rollback: expect.objectContaining({
          complete: true,
          retainedBackups: [],
          retainedStaged: [],
        }),
      }),
    );
  });

  it("uses the built-in fallback when an injected rollback operation fails", async () => {
    let replacements = 0;
    const diagnostics = await exercisePublicationFailure({
      publicationOptions: {
        replaceArtifact: (source, destination) => {
          replacements += 1;
          if (replacements === 2) throw new Error("simulated replacement failure");
          renameSync(source, destination);
        },
        rollbackArtifact: () => {
          throw new Error("simulated rollback failure");
        },
      },
    });

    expect(diagnostics).toEqual(
      expect.objectContaining({
        phase: "replacement",
        rollback: expect.objectContaining({
          complete: true,
          recoveredWithFallback: true,
          retainedBackups: [],
          retainedStaged: [],
        }),
      }),
    );
    expect(diagnostics.rollback.errors).toEqual(
      expect.arrayContaining([expect.stringContaining("simulated rollback failure")]),
    );
  });

  it("runs the prepared-evidence command into the private feature directory", async () => {
    const temporaryRepo = await mkdtemp(path.join(temporaryRoot, "starwind-candidate-cli-"));
    const descriptorPath = path.join(temporaryRepo, "prepared-candidate.json");
    const descriptor = buildDescriptor({ afterBytes: 50_976, beforeBytes: 52_000 });

    try {
      await writeFile(descriptorPath, JSON.stringify(descriptor), "utf8");
      const result = runPackageSizeOptimizationEvidenceCommand({
        descriptorPath,
        repoRoot: temporaryRepo,
        validateRepoRoot: (root) => path.resolve(root),
      });
      const paths = getPackageSizeOptimizationEvidencePaths({
        candidateId: descriptor.candidateId,
        repoRoot: temporaryRepo,
      });

      expect(result.paths).toEqual(paths);
      expect(JSON.parse(await readFile(paths.json, "utf8")).candidate.id).toBe(
        descriptor.candidateId,
      );
      expect(await readFile(paths.markdown, "utf8")).toContain(
        "# Compile production inline Vue SFCs",
      );
      expect(
        await fileExists(
          path.join(
            temporaryRepo,
            "scripts/portable-runtime/evidence/vue-package-size-baseline.json",
          ),
        ),
      ).toBe(false);
    } finally {
      await rm(temporaryRepo, { force: true, recursive: true });
    }
  });

  it("rejects an arbitrary CLI repository root", async () => {
    const temporaryRepo = await mkdtemp(path.join(temporaryRoot, "starwind-candidate-cli-root-"));
    const descriptorPath = path.join(temporaryRepo, "prepared-candidate.json");

    try {
      await writeFile(
        descriptorPath,
        JSON.stringify(buildDescriptor({ afterBytes: 50_976, beforeBytes: 52_000 })),
        "utf8",
      );

      expect(() =>
        runPackageSizeOptimizationEvidenceCommand({ descriptorPath, repoRoot: temporaryRepo }),
      ).toThrow("Starwind repository root");
    } finally {
      await rm(temporaryRepo, { force: true, recursive: true });
    }
  });

  it("rejects a symlinked feature destination before staging", async () => {
    const temporaryRepo = await mkdtemp(path.join(temporaryRoot, "starwind-candidate-symlink-"));
    const acceptedDirectory = path.join(temporaryRepo, "scripts/portable-runtime/evidence");
    const featureParent = path.join(
      temporaryRepo,
      ".scratch/vue-adapter-optimization-and-portal-parity",
    );
    const acceptedJson = path.join(acceptedDirectory, "vue-package-size-baseline.json");
    const acceptedMarkdown = path.join(acceptedDirectory, "vue-package-size-baseline.md");

    try {
      await mkdir(acceptedDirectory, { recursive: true });
      await mkdir(featureParent, { recursive: true });
      await writeFile(acceptedJson, "accepted json", "utf8");
      await writeFile(acceptedMarkdown, "accepted markdown", "utf8");
      await symlink(acceptedDirectory, path.join(featureParent, "evidence"), "dir");

      let publicationError;
      try {
        publishPackageSizeOptimizationEvidence({
          candidateId: "vue-package-size-baseline",
          evidence: buildEvidence({
            afterBytes: 50_976,
            beforeBytes: 52_000,
            candidateId: "vue-package-size-baseline",
          }),
          repoRoot: temporaryRepo,
        });
      } catch (error) {
        publicationError = error;
      }

      expect(publicationError?.message).toBe(
        `Candidate publication path ancestry contains a symlink: ${path.join(featureParent, "evidence")}`,
      );
      expect(publicationError?.packageSizeOptimizationPublication).toEqual(
        expect.objectContaining({ phase: "path-validation" }),
      );
      expect(await readFile(acceptedJson, "utf8")).toBe("accepted json");
      expect(await readFile(acceptedMarkdown, "utf8")).toBe("accepted markdown");
    } finally {
      await rm(temporaryRepo, { force: true, recursive: true });
    }
  });

  it("publishes only inside the feature evidence directory", async () => {
    const temporaryRepo = await mkdtemp(path.join(temporaryRoot, "starwind-candidate-scope-"));
    const protectedFiles = [
      "scripts/portable-runtime/evidence/vue-package-size-baseline.json",
      "scripts/portable-runtime/evidence/vue-package-size-baseline.md",
      "docs/portable-runtime/diagnostics/package-size-diagnostics.md",
      "docs/portable-runtime/package-size-comparison.md",
      "scripts/portable-runtime/vue-package-size-baseline.mjs",
    ];
    const before = new Map();

    try {
      for (const relativePath of protectedFiles) {
        const file = path.join(temporaryRepo, relativePath);
        await mkdir(path.dirname(file), { recursive: true });
        const contents = `protected:${relativePath}`;
        await writeFile(file, contents, "utf8");
        before.set(file, contents);
      }

      const result = publishPackageSizeOptimizationEvidence({
        candidateId: "template-only-attrs",
        evidence: buildEvidence({
          afterBytes: 50_976,
          beforeBytes: 52_000,
          candidateId: "template-only-attrs",
        }),
        repoRoot: temporaryRepo,
      });
      const expectedPaths = getPackageSizeOptimizationEvidencePaths({
        candidateId: "template-only-attrs",
        repoRoot: temporaryRepo,
      });

      expect(result.paths).toEqual(expectedPaths);
      expect(result.publication.published.sort()).toEqual(
        [expectedPaths.json, expectedPaths.markdown].sort(),
      );
      for (const [file, contents] of before) {
        expect(await readFile(file, "utf8")).toBe(contents);
      }
    } finally {
      await rm(temporaryRepo, { force: true, recursive: true });
    }
  });
});

function buildEvidence({
  afterBytes,
  afterRuns,
  beforeBytes,
  beforeRuns,
  behaviorGates = [{ id: "focused-verification", passed: true }],
  candidateId = "compiler-inline-production",
  evaluationMode = "threshold",
}) {
  return buildPackageSizeOptimizationEvidence(
    buildDescriptor({
      afterBytes,
      afterRuns,
      beforeBytes,
      beforeRuns,
      behaviorGates,
      candidateId,
      evaluationMode,
    }),
  );
}

function buildDescriptor({
  afterBytes,
  afterRuns,
  beforeBytes,
  beforeRuns,
  behaviorGates = [{ id: "focused-verification", passed: true }],
  candidateId = "compiler-inline-production",
  evaluationMode = "threshold",
}) {
  return {
    afterRuns: afterRuns ?? runsAt(candidateCommit, { [relevantRowId]: afterBytes }),
    beforeRuns: beforeRuns ?? runsAt(predecessorCommit, { [relevantRowId]: beforeBytes }),
    behaviorGates,
    candidateCommit,
    candidateId,
    evaluationMode,
    label: "Compile production inline Vue SFCs",
    predecessorCommit,
    retentionRowIds: [relevantRowId],
  };
}

function runsAt(commit, rowValues = {}, mutate) {
  return acceptedEvidence.runs.map((source, index) => {
    const run = structuredClone(source);
    run.commit = commit;
    run.diagnosticPath = `/tmp/starwind-candidate/${commit.slice(0, 8)}/run-${index + 1}`;
    for (const row of run.rows) {
      if (!(row.id in rowValues)) continue;
      const value = rowValues[row.id];
      row.gzipBytes = Array.isArray(value) ? value[index] : value;
    }
    mutate?.(run, index);
    return run;
  });
}

function createFailingStageWriter() {
  let stageCount = 0;
  return ({ contents, stagingPath }) => {
    stageCount += 1;
    if (stageCount === 2) throw new Error("simulated staging failure");
    writeFileSync(stagingPath, contents, { flag: "wx", mode: 0o600 });
  };
}

async function exercisePublicationFailure({ mutateEvidence, publicationOptions } = {}) {
  const temporaryRepo = await mkdtemp(path.join(temporaryRoot, "starwind-candidate-phase-"));
  const evidence = buildEvidence({ afterBytes: 50_976, beforeBytes: 52_000 });
  mutateEvidence?.(evidence);
  const paths = getPackageSizeOptimizationEvidencePaths({
    candidateId: evidence.candidate.id,
    repoRoot: temporaryRepo,
  });

  try {
    await mkdir(path.dirname(paths.json), { recursive: true });
    await writeFile(paths.json, "old json", "utf8");
    await writeFile(paths.markdown, "old markdown", "utf8");
    let publicationError;
    try {
      publishPackageSizeOptimizationEvidence({
        candidateId: evidence.candidate.id,
        evidence,
        publicationOptions,
        repoRoot: temporaryRepo,
      });
    } catch (error) {
      publicationError = error;
    }

    expect(publicationError).toBeDefined();
    expect(await readFile(paths.json, "utf8")).toBe("old json");
    expect(await readFile(paths.markdown, "utf8")).toBe("old markdown");
    return publicationError.packageSizeOptimizationPublication;
  } finally {
    await rm(temporaryRepo, { force: true, recursive: true });
  }
}

async function fileExists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}
