import { mkdirSync, mkdtempSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  VUE_BASELINE_REQUIRED_ROW_IDS,
  buildVueBaselineEvidence,
  checkVueBaselineEvidence,
  getVueBaselineEvidencePaths,
  mapVueMeasurementToRunRecord,
  renderVueBaselineEvidenceMarkdown,
  runVueBaselineCapture,
  validateSerializedVueBaselineEvidence,
} from "../package-size-vue-baseline-runner.mjs";
import {
  STARWIND_VUE_MEASUREMENT_LABELS,
  starwindVueRuntimeComponents,
  zagVueComparatorPackages,
} from "../package-size-vue-plan.mjs";

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
  zlibVersion: "1.3.2.1-motley-3246f1b",
};

describe("Vue package-size baseline runner", () => {
  it("performs exactly three serialized measurements in unique run roots", async () => {
    const root = temporaryDirectory("vue-baseline-success-");
    const events = [];
    let active = 0;

    const result = await runVueBaselineCapture({
      evidenceDirectory: path.join(root, "evidence"),
      measurementRoot: path.join(root, "runs"),
      measureRun: async ({ index, runPaths }) => {
        active += 1;
        events.push(["start", index, runPaths.runDirectory, active]);
        await Promise.resolve();
        active -= 1;
        events.push(["end", index, runPaths.runDirectory, active]);
        return measurementFixture({ offset: index });
      },
    });

    expect(events.map(([event, index, , concurrency]) => [event, index, concurrency])).toEqual([
      ["start", 0, 1],
      ["end", 0, 0],
      ["start", 1, 1],
      ["end", 1, 0],
      ["start", 2, 1],
      ["end", 2, 0],
    ]);
    expect(new Set(events.map(([, , runDirectory]) => runDirectory)).size).toBe(3);
    expect(result.evidence.runs).toHaveLength(3);
    expect(result.evidence.stability.stable).toBe(true);
    expect(result.evidence.sentinels.map(({ component }) => component)).toEqual([
      "tooltip",
      "toggle-group",
      "toggle",
      "toast",
      "tabs",
    ]);
    expect(result.evidence.sentinels.some(({ component }) => component === "theme")).toBe(false);
    expect(readFileSync(result.paths.json, "utf8")).toContain(
      '"schema": "starwind.package-size.vue-baseline"',
    );
    expect(readFileSync(result.paths.markdown, "utf8")).toContain(
      "Theme is measured as `vue.theme` and is excluded from sentinel selection.",
    );
  });

  it.each([
    {
      failure: "Unstable package-size rows: vue.adapter-only",
      name: "unstable rows",
      result(index) {
        return measurementFixture({ adapterBytes: index === 0 ? 1_000 : 2_025 });
      },
    },
    {
      failure: "mixed provenance",
      name: "mixed provenance",
      result(index) {
        return measurementFixture({ commit: index === 2 ? "b".repeat(40) : "a".repeat(40) });
      },
    },
    {
      failure: "requires Zag Vue 1.42.0",
      name: "invalid comparator version",
      result() {
        const fixture = measurementFixture();
        fixture.vueProvenance.comparator.version = "1.43.0";
        return fixture;
      },
    },
    {
      failure: "vue.cold.accordion",
      name: "missing rows",
      result() {
        const fixture = measurementFixture();
        fixture.vueColdImportResults = fixture.vueColdImportResults.slice(1);
        return fixture;
      },
    },
  ])("keeps accepted artifacts byte-identical for $name", async ({ failure, result }) => {
    const root = temporaryDirectory("vue-baseline-rejected-");
    const evidenceDirectory = path.join(root, "evidence");
    const paths = seedAcceptedArtifacts(evidenceDirectory);

    await expect(
      runVueBaselineCapture({
        evidenceDirectory,
        measurementRoot: path.join(root, "runs"),
        measureRun: async ({ index }) => result(index),
      }),
    ).rejects.toThrow(failure);
    expect(readFileSync(paths.json, "utf8")).toBe("accepted json\n");
    expect(readFileSync(paths.markdown, "utf8")).toBe("accepted markdown\n");
  });

  it("rejects incomplete or invalid exact comparator provenance", () => {
    const incomplete = measurementFixture();
    delete incomplete.vueProvenance.comparator.packages["@zag-js/vue"];
    expect(() => mapVueMeasurementToRunRecord(incomplete, { diagnosticPath: "/tmp/run" })).toThrow(
      "missing: @zag-js/vue",
    );

    const wrongVersion = measurementFixture();
    wrongVersion.vueProvenance.comparator.version = "1.43.0";
    expect(() =>
      mapVueMeasurementToRunRecord(wrongVersion, { diagnosticPath: "/tmp/run" }),
    ).toThrow("requires Zag Vue 1.42.0");

    const mismatchedPackageProvenance = measurementFixture();
    mismatchedPackageProvenance.vueProvenance.packageVersions["@zag-js/vue"] = "1.43.0";
    const run = mapVueMeasurementToRunRecord(mismatchedPackageProvenance, {
      diagnosticPath: "/tmp/run",
    });
    expect(() => buildVueBaselineEvidence([run, run, run])).toThrow(
      "package provenance differs for @zag-js/vue",
    );
  });

  it("restores both accepted evidence artifacts after a publication failure", async () => {
    const root = temporaryDirectory("vue-baseline-publication-");
    const evidenceDirectory = path.join(root, "evidence");
    const paths = seedAcceptedArtifacts(evidenceDirectory);
    let replacements = 0;

    await expect(
      runVueBaselineCapture({
        evidenceDirectory,
        measurementRoot: path.join(root, "runs"),
        measureRun: async ({ index }) => measurementFixture({ offset: index }),
        publicationOptions: {
          replaceArtifact(source, destination) {
            replacements += 1;
            if (replacements === 2) throw new Error("simulated publication failure");
            renameSync(source, destination);
          },
        },
      }),
    ).rejects.toThrow("simulated publication failure");
    expect(readFileSync(paths.json, "utf8")).toBe("accepted json\n");
    expect(readFileSync(paths.markdown, "utf8")).toBe("accepted markdown\n");
  });

  it("renders deterministic JSON and Markdown from the same raw evidence", () => {
    const runs = [0, 1, 2].map((offset) =>
      mapVueMeasurementToRunRecord(measurementFixture({ offset }), {
        diagnosticPath: `/tmp/run-${offset}`,
      }),
    );
    const evidence = buildVueBaselineEvidence(runs);
    const serialized = `${JSON.stringify(sortJson(evidence), null, 2)}\n`;

    expect(validateSerializedVueBaselineEvidence(serialized)).toEqual(evidence);
    expect(renderVueBaselineEvidenceMarkdown(evidence)).toBe(
      renderVueBaselineEvidenceMarkdown(JSON.parse(serialized)),
    );
    expect(evidence.stability.requiredRowIds).toEqual(VUE_BASELINE_REQUIRED_ROW_IDS);
    expect(evidence.candidates).toHaveLength(8);
  });

  it("validates accepted evidence offline through reads only", async () => {
    const root = temporaryDirectory("vue-baseline-offline-");
    const evidenceDirectory = path.join(root, "evidence");
    let liveMeasurements = 0;
    await runVueBaselineCapture({
      evidenceDirectory,
      measurementRoot: path.join(root, "runs"),
      measureRun: async ({ index }) => {
        liveMeasurements += 1;
        return measurementFixture({ offset: index });
      },
    });
    const acceptedBytes = Object.values(getVueBaselineEvidencePaths({ evidenceDirectory })).map(
      (filePath) => readFileSync(filePath),
    );
    const reads = [];

    const checked = checkVueBaselineEvidence({
      evidenceDirectory,
      readFile(filePath, encoding) {
        reads.push([filePath, encoding]);
        return readFileSync(filePath, encoding);
      },
    });

    expect(reads).toHaveLength(2);
    expect(liveMeasurements).toBe(3);
    expect(checked.evidence.stability.stable).toBe(true);
    expect(Object.values(checked.paths).map((filePath) => readFileSync(filePath))).toEqual(
      acceptedBytes,
    );
  });

  it.each([
    ["Darwin", { osName: "Darwin", platform: "darwin" }],
    ["arm64", { architecture: "arm64" }],
    ["Node 22", { nodeVersion: "22.18.0" }],
  ])("rejects recorded %s evidence during offline validation", (_, environmentChanges) => {
    const root = temporaryDirectory("vue-baseline-offline-platform-");
    const evidenceDirectory = path.join(root, "evidence");
    mkdirSync(evidenceDirectory, { recursive: true });
    const runs = [0, 1, 2].map((offset) => {
      const fixture = measurementFixture({ offset });
      fixture.vueProvenance.environment = {
        ...fixture.vueProvenance.environment,
        ...environmentChanges,
      };
      return mapVueMeasurementToRunRecord(fixture, { diagnosticPath: `/tmp/run-${offset}` });
    });
    const evidence = buildVueBaselineEvidence(runs, { requireBaselinePlatform: false });
    const paths = getVueBaselineEvidencePaths({ evidenceDirectory });
    writeFileSync(paths.json, `${JSON.stringify(sortJson(evidence), null, 2)}\n`);
    writeFileSync(paths.markdown, "accepted markdown\n");
    const acceptedBytes = Object.values(paths).map((filePath) => readFileSync(filePath));

    expect(() => checkVueBaselineEvidence({ evidenceDirectory })).toThrow(
      "requires Linux x86_64 and Node 24",
    );
    expect(Object.values(paths).map((filePath) => readFileSync(filePath))).toEqual(acceptedBytes);
  });
});

function measurementFixture({ adapterBytes = 10_000, commit = "a".repeat(40), offset = 0 } = {}) {
  const exactComparatorPackages = Object.fromEntries(
    zagVueComparatorPackages.map((packageName) => [packageName, "1.42.0"]),
  );
  return {
    vueBundleResults: [
      {
        gzipBytes: adapterBytes + offset,
        label: STARWIND_VUE_MEASUREMENT_LABELS.adapterOnly,
      },
      {
        gzipBytes: 20_000 + offset,
        label: STARWIND_VUE_MEASUREMENT_LABELS.combined,
      },
    ],
    vueColdImportResults: [
      ...starwindVueRuntimeComponents.map((component, index) => ({
        component,
        gzipBytes: 30_000 + index * 100 + offset,
      })),
      { component: "theme", gzipBytes: 99_000 + offset },
    ],
    vueMatchedSupportResults: [
      { gzipBytes: 40_000 + offset, provider: "starwind-vue" },
      { gzipBytes: 50_000 + offset, provider: "zag-vue" },
    ],
    vuePackagePayload: { packageGzipBytes: 60_000 + offset },
    vueProvenance: {
      command: {
        arguments: ["scripts/portable-runtime/measure-package-sizes.mjs", "--baseline-vue"],
        executable: "/usr/bin/node",
      },
      commit,
      comparator: {
        name: "zag-vue",
        packages: exactComparatorPackages,
        version: "1.42.0",
      },
      environment: { ...linuxEnvironment },
      flags: {
        baselineVue: true,
        gzipLevel: 9,
        includePrivateVue: true,
        minify: true,
        platform: "browser",
        staticGraphHeadlines: true,
        target: "es2020",
      },
      packageVersions: {
        "@starwind-ui/runtime": "0.4.4",
        "@starwind-ui/vue": "0.0.0",
        ...exactComparatorPackages,
      },
    },
  };
}

function temporaryDirectory(prefix) {
  return mkdtempSync(path.join(os.tmpdir(), prefix));
}

function seedAcceptedArtifacts(evidenceDirectory) {
  mkdirSync(evidenceDirectory, { recursive: true });
  const paths = getVueBaselineEvidencePaths({ evidenceDirectory });
  writeFileSync(paths.json, "accepted json\n", { flag: "wx" });
  writeFileSync(paths.markdown, "accepted markdown\n", { flag: "wx" });
  return paths;
}

function sortJson(value) {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort((left, right) => left.localeCompare(right, "en"))
        .map((key) => [key, sortJson(value[key])]),
    );
  }
  return value;
}
