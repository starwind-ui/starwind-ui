import assert from "node:assert/strict";
import path from "node:path";

import { verifyInstalledHosts } from "./verify-installed-hosts.js";

const root = process.argv[2];
assert(root && path.isAbsolute(root));
const result = await verifyInstalledHosts(root);
console.log(JSON.stringify({ count: result.length }));
