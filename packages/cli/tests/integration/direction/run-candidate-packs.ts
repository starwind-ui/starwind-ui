import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";

import { prepareCandidatePacks } from "./candidate-packs.js";

const repoRoot = process.cwd();
const outputRoot = process.argv[2];
assert(outputRoot && path.isAbsolute(outputRoot), "Pass an absolute temporary output directory");
const sourceSha = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: repoRoot,
  encoding: "utf8",
}).trim();
const result = await prepareCandidatePacks(repoRoot, outputRoot, sourceSha);
console.log(JSON.stringify(result));
