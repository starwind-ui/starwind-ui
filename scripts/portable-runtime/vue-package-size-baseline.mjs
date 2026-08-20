import { ZAG_VUE_COMPARATOR_VERSION, zagVueComparatorPackages } from "./package-size-vue-plan.mjs";

const adoptedBudgets = {
  "vue.adapter-only": budget(51_807, 2_591, 54_398),
  "vue.cold.combobox": budget(29_258, 1_463, 30_721),
  "vue.cold.context-menu": budget(27_203, 1_361, 28_564),
  "vue.cold.menu": budget(27_184, 1_360, 28_544),
  "vue.cold.navigation-menu": budget(24_878, 1_244, 26_122),
  "vue.cold.select": budget(30_107, 1_506, 31_613),
  "vue.combined": budget(201_210, 10_061, 211_271),
  "vue.packed-tarball": budget(135_512, 6_776, 142_288),
};

const adoptedSentinels = [
  { component: "select", id: "vue.cold.select", maximumBytes: 30_107, rank: 1 },
  { component: "combobox", id: "vue.cold.combobox", maximumBytes: 29_258, rank: 2 },
  { component: "context-menu", id: "vue.cold.context-menu", maximumBytes: 27_203, rank: 3 },
  { component: "menu", id: "vue.cold.menu", maximumBytes: 27_184, rank: 4 },
  {
    component: "navigation-menu",
    id: "vue.cold.navigation-menu",
    maximumBytes: 24_878,
    rank: 5,
  },
];

export const vuePackageSizeBaseline = deepFreeze({
  budgets: adoptedBudgets,
  comparatorSnapshots: {
    packages: Object.fromEntries(
      zagVueComparatorPackages.map((packageName) => [packageName, ZAG_VUE_COMPARATOR_VERSION]),
    ),
    starwindMatchedGzipBytes: 176_194,
    zagMatchedGzipBytes: 128_292,
    zagVersion: ZAG_VUE_COMPARATOR_VERSION,
  },
  evidenceSource: ".scratch/vue-package-size-comparison/evidence/vue-package-size-baseline.json",
  provenance: {
    command: {
      arguments: ["scripts/portable-runtime/measure-package-sizes.mjs", "--baseline-vue"],
      executable: "node",
    },
    commit: "ef58435373775514c1237ce94bfc3e7628c1ebe4",
    environment: {
      architecture: "x64",
      esbuildVersion: "0.28.1",
      kernelRelease: "7.0.0-28-generic",
      nodeVersion: "24.19.0",
      npmVersion: "11.17.0",
      osName: "Linux",
      osRelease: "#28~24.04.1-Ubuntu SMP PREEMPT_DYNAMIC Wed Jul  1 15:50:57 UTC 2",
      platform: "linux",
      pnpmVersion: "11.8.0",
      zlibVersion: "1.3.2.1-motley-3246f1b",
    },
  },
  sentinelRecords: adoptedSentinels,
  sentinels: adoptedSentinels.map(({ component }) => component),
});

export function validateVuePackageSizeBaselineEvidence(evidence) {
  if (!evidence || !Array.isArray(evidence.runs) || evidence.runs.length !== 3) {
    throw new Error("Vue package-size evidence must contain three raw runs");
  }

  if (!sameJson(evidence.sentinels, vuePackageSizeBaseline.sentinelRecords)) {
    throw new Error("Vue package-size evidence sentinels differ from the adopted baseline");
  }

  const candidates = new Map(evidence.candidates?.map((candidate) => [candidate.id, candidate]));
  for (const [id, adopted] of Object.entries(vuePackageSizeBaseline.budgets)) {
    const candidate = candidates.get(id);
    if (!candidate || !sameJson(candidate, { id, ...adopted })) {
      throw new Error(
        `Vue package-size evidence candidate ${id} differs from the adopted baseline`,
      );
    }
  }
  if (candidates.size !== Object.keys(vuePackageSizeBaseline.budgets).length) {
    throw new Error("Vue package-size evidence contains an unexpected adopted candidate");
  }

  for (const [index, run] of evidence.runs.entries()) {
    if (
      !sameJson(toPortableCaptureCommand(run.command), vuePackageSizeBaseline.provenance.command)
    ) {
      throw new Error(`Vue package-size evidence run ${index + 1} command differs`);
    }
    if (
      run.commit !== vuePackageSizeBaseline.provenance.commit ||
      !sameJson(run.environment, vuePackageSizeBaseline.provenance.environment)
    ) {
      throw new Error(`Vue package-size evidence run ${index + 1} provenance differs`);
    }
    if (
      run.comparator?.version !== vuePackageSizeBaseline.comparatorSnapshots.zagVersion ||
      !sameJson(run.comparator.packages, vuePackageSizeBaseline.comparatorSnapshots.packages)
    ) {
      throw new Error(`Vue package-size evidence run ${index + 1} comparator differs`);
    }

    const rows = new Map(run.rows?.map((row) => [row.id, row.gzipBytes]));
    for (const [id, adopted] of Object.entries(vuePackageSizeBaseline.budgets)) {
      if (rows.get(id) !== adopted.values[index]) {
        throw new Error(`Vue package-size evidence raw row ${id} differs in run ${index + 1}`);
      }
    }
    if (
      rows.get("vue.matched.starwind") !==
        vuePackageSizeBaseline.comparatorSnapshots.starwindMatchedGzipBytes ||
      rows.get("vue.matched.zag") !== vuePackageSizeBaseline.comparatorSnapshots.zagMatchedGzipBytes
    ) {
      throw new Error(
        `Vue package-size evidence matched comparator rows differ in run ${index + 1}`,
      );
    }
  }

  return true;
}

function toPortableCaptureCommand(command) {
  const script = "scripts/portable-runtime/measure-package-sizes.mjs";
  return {
    executable: /(^|[/\\])node(?:\.exe)?$/i.test(command?.executable ?? "")
      ? "node"
      : command?.executable,
    arguments: (command?.arguments ?? []).map((argument) =>
      argument.replaceAll("\\", "/").endsWith(script) ? script : argument,
    ),
  };
}

function budget(maximumBytes, headroomBytes, ceilingBytes) {
  return {
    ceilingBytes,
    headroomBytes,
    maximumBytes,
    values: [maximumBytes, maximumBytes, maximumBytes],
  };
}

function deepFreeze(value) {
  for (const child of Object.values(value)) {
    if (child && typeof child === "object") deepFreeze(child);
  }
  return Object.freeze(value);
}

function sameJson(left, right) {
  return JSON.stringify(sortJson(left)) === JSON.stringify(sortJson(right));
}

function sortJson(value) {
  if (Array.isArray(value)) return value.map(sortJson);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right, "en"))
      .map(([key, child]) => [key, sortJson(child)]),
  );
}
