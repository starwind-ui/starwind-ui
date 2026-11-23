import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, realpath, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { installCandidateHosts } from "../../../../packages/cli/tests/integration/direction/installed-hosts.ts";
import { verifyInstalledHosts } from "../../../../packages/cli/tests/integration/direction/verify-installed-hosts.ts";
import { loadPublicReleaseArtifacts } from "../../../pack-public-release-artifacts.mjs";
import { ROOT } from "./inventory.ts";
import { verifyInstalled, verifySealedPacks } from "./runner/promotion.mjs";

const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const json = async (file) => JSON.parse(await readFile(file, "utf8"));
// Usage: direction:installed [--packs <dir>] [parent] [archive-source] [seal-receipt]
const argv = process.argv.slice(2);
const packsIndex = argv.indexOf("--packs");
const packsFlag = packsIndex < 0 ? undefined : argv.splice(packsIndex, 2)[1];
const [parentArg, sourceArg, sealArg] = argv;
const runnerSha = git(ROOT, "rev-parse", "HEAD");
// In the release gate, other lanes can hold temporary untracked files. The gate packs carry a
// source fingerprint that the archive load below checks, so tracked files decide cleanliness.
const statusArgs = packsFlag
  ? ["status", "--porcelain", "--untracked-files=no"]
  : ["status", "--porcelain"];
assert.equal(git(ROOT, ...statusArgs), "", "Installed runner must be clean");
const sourceRoot = await realpath(sourceArg ?? ROOT);
const sourceSha = git(sourceRoot, "rev-parse", "HEAD");
assert.equal(git(sourceRoot, ...statusArgs), "", "Archive source must be clean");
// The release gate passes its own packs; a manual run reads `pnpm release:pack:public-artifacts`.
const outputDirectory = packsFlag
  ? path.resolve(packsFlag)
  : path.join(sourceRoot, ".release-packs");
const manifest = await loadPublicReleaseArtifacts({
  repoRoot: sourceRoot,
  outputDirectory,
  requireSvelte: true,
});
const parent = path.resolve(parentArg ?? tmpdir());
await mkdir(parent, { recursive: true });
const root = await mkdtemp(path.join(parent, "direction-installed-"));
console.log("Installed shipping archive receipts:", root);
const archiveHashes = Object.fromEntries(
  Object.entries(manifest.packages).map(([key, entry]) => [key, entry.sha256]),
);
const files = Object.fromEntries(
  Object.entries(manifest.packages).map(([key, entry]) => [
    key,
    path.join(outputDirectory, entry.file),
  ]),
);
const manifestHash = hash(await readFile(path.join(outputDirectory, "manifest.json")));
if (sourceSha !== runnerSha || sealArg) {
  assert(sealArg, "External archive source requires a seal receipt");
  const seal = await json(sealArg);
  verifySealedPacks(seal, {
    sourceSha,
    sourceFingerprint: manifest.sourceFingerprint,
    manifestHash,
    archiveHashes,
  });
  const changed = git(ROOT, "diff", "--name-only", sourceSha, runnerSha)
    .split("\n")
    .filter(Boolean);
  for (const file of changed)
    assert(
      /^(?:\.scratch\/|packages\/[^/]+\/tests\/|scripts\/portable-runtime\/tests\/|scripts\/(?:vue-cli-host-acceptance|public-ci-local)\.mjs$|scripts\/tests\/(?:public-ci-local\.test\.mjs|root-verification-scripts\.test\.ts)$|\.github\/workflows\/verify\.yml$|package\.json$)/.test(
        file,
      ),
      "Shipping input changed: " + file,
    );
  const inputs = async (root) => {
    const pkg = await json(path.join(root, "package.json"));
    delete pkg.scripts["direction:installed"];
    delete pkg.scripts["direction:stage:test"];
    return pkg;
  };
  assert.deepEqual(await inputs(ROOT), await inputs(sourceRoot), "Root build inputs changed");
}
const registryHashes = {};
for (const file of ["bundled-registry.json", "primitive-vendoring-artifacts.json"]) {
  const name = path.join("packages/cli/src/registry", file);
  registryHashes[file] = hash(await readFile(path.join(sourceRoot, name)));
  assert.equal(
    hash(await readFile(path.join(ROOT, name))),
    registryHashes[file],
    "Installed registry source " + file,
  );
}
const packs = {
  root: sourceRoot,
  sourceSha,
  runnerSha,
  sourceFingerprint: manifest.sourceFingerprint,
  manifestHash,
  files,
  archiveHashes,
  registryHashes,
};
await writeFile(path.join(root, "shipping-packs.json"), JSON.stringify(packs, null, 2));
const hosts = path.join(root, "hosts");
await mkdir(hosts, { recursive: true });
await installCandidateHosts(ROOT, hosts, packs);
await verifyInstalledHosts(hosts);
const receipt = async (file) => JSON.parse(await readFile(path.join(hosts, file), "utf8"));
const result = verifyInstalled(
  packs,
  await receipt("installed-hosts.json"),
  await receipt("installed-browser.json"),
  sourceSha,
);
assert.equal(result.hosts, 8);
await writeFile(
  path.join(root, "installed.json"),
  JSON.stringify(
    {
      ...result,
      runnerSha,
      sourceFingerprint: manifest.sourceFingerprint,
      manifestHash,
      registryHashes,
    },
    null,
    2,
  ),
);
