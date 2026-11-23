import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

import type { CandidatePacks } from "./candidate-packs.js";
import { installCandidateHosts } from "./installed-hosts.js";

const repoRoot = process.cwd();
const root = process.argv[2];
const packsPath = process.argv[3];
assert(root && path.isAbsolute(root) && packsPath && path.isAbsolute(packsPath));
const packs = JSON.parse(await readFile(packsPath, "utf8")) as CandidatePacks;
const results = await installCandidateHosts(repoRoot, root, packs);
console.log(JSON.stringify({ count: results.length, results }));
