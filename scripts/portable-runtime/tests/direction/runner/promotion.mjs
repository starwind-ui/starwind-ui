import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import { compareStage, plannedEngines } from "./stage.mjs";

export const shardCount = 8;
export const engines = ["chromium", "firefox", "webkit"];

export function partitionCases(cases, total = shardCount) {
  const bins = Array.from({ length: total }, () => ({ cost: 0, cases: [] }));
  const cost = (item) =>
    Object.keys(item.fixtures).length *
    plannedEngines(item).length *
    (item.id.includes("paint") ? 3 : 1);
  for (const item of [...cases].sort((a, b) => cost(b) - cost(a) || a.id.localeCompare(b.id))) {
    const bin = bins.reduce((best, candidate) => (candidate.cost < best.cost ? candidate : best));
    bin.cases.push(item);
    bin.cost += cost(item);
  }
  return bins.map((bin) => bin.cases);
}

export function verifyUnion(cases, reports, sha, engineSet = engines) {
  assert(reports.length, "Missing direction reports");
  const ids = new Set();
  const results = [];
  for (const report of reports) {
    assert.equal(report.sha, sha, "Direction report source revision");
    assert.equal(report.status, "passed", "Direction shard failed");
    for (const id of report.caseIds) {
      assert(!ids.has(id), "Duplicate case across shards: " + id);
      ids.add(id);
    }
    assert.deepEqual(
      [...new Set(report.results.map((r) => r.caseId))].sort(),
      [...report.caseIds].sort(),
      "Missing cases within shard",
    );
    for (const result of report.results) {
      assert.equal(result.status, "passed", "Unsuccessful browser receipt");
      assert(
        result.checks.length && result.checks.every((c) => c.status === "passed"),
        "Unexecuted or unsuccessful assertion",
      );
      results.push(result);
    }
  }
  assert.deepEqual([...ids].sort(), cases.map((c) => c.id).sort(), "Required case union");
  const comparison = compareStage(cases, results, [], engineSet);
  assert.equal(comparison.status, "passed", JSON.stringify(comparison.issues.slice(0, 15)));
  return { cases: ids.size, results: results.length, assertions: comparison.checks.length };
}

export function verifyInstalled(packs, hosts, browser, sha) {
  const targets = ["astro", "react", "vue", "svelte"];
  assert.deepEqual(Object.keys(packs.archiveHashes).sort(), [
    "astro",
    "cli",
    "react",
    "runtime",
    "svelte",
    "vue",
  ]);
  assert(Object.values(packs.archiveHashes).every((h) => /^[a-f0-9]{64}$/.test(h)));
  for (const data of [packs, hosts, browser]) {
    assert.equal(data.sourceSha, sha, "Installed source revision");
    assert.deepEqual(data.archiveHashes, packs.archiveHashes, "Installed archive provenance");
  }
  for (const [report, modes] of [
    [hosts, ["fresh", "retained"]],
    [browser, ["fresh", "retained", "repaired"]],
  ]) {
    assert.deepEqual(
      report.results.map((r) => r.framework + "/" + r.mode).sort(),
      targets.flatMap((t) => modes.map((m) => t + "/" + m)).sort(),
      "Installed consumer identities",
    );
  }
  for (const host of hosts.results) assert.equal(host.build, "passed", "Installed host build");
  for (const row of browser.results) {
    if (row.mode === "repaired") {
      assert.equal(row.nestedRotate, "0deg", "Repaired nested CSS");
      assert.match(row.stylesheetHash, /^[a-f0-9]{64}$/);
    } else {
      assert.equal(row.style.ordinary.direction, "ltr");
      assert.equal(row.style.rtl.direction, "rtl");
      assert.equal(row.style.nested.rotate, row.mode === "fresh" ? "0deg" : "180deg");
    }
  }
  return { sourceSha: sha, archiveHashes: packs.archiveHashes, hosts: 8, browserReceipts: 12 };
}

export async function verifyArchives(packs) {
  for (const [name, file] of Object.entries(packs.files)) {
    assert.equal(
      createHash("sha256")
        .update(await readFile(file))
        .digest("hex"),
      packs.archiveHashes[name],
      name + " archive bytes",
    );
  }
  assert.deepEqual(Object.keys(packs.files).sort(), Object.keys(packs.archiveHashes).sort());
}

export function verifySealedPacks(seal, packs) {
  assert.equal(packs.sourceSha, seal.sourceCommit, "Sealed archive source revision");
  assert.equal(
    packs.sourceFingerprint,
    seal.sourceFingerprint,
    "Sealed archive source fingerprint",
  );
  assert.equal(packs.manifestHash, seal.manifestSha256, "Sealed release manifest");
  assert.deepEqual(packs.archiveHashes, seal.packages, "Sealed archive byte hashes");
}
