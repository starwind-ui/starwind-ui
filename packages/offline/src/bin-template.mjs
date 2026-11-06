#!/usr/bin/env node
// Runs the starwind CLI with the offline kit store. The kit builder fills in the platform list.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const packageRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const platformPackages = /* PLATFORM_PACKAGES */ [];

const storeDirectories = [path.join(packageRoot, "store")];
for (const packageName of platformPackages) {
  try {
    const manifest = require.resolve(`${packageName}/package.json`);
    storeDirectories.push(path.join(path.dirname(manifest), "store"));
  } catch {
    // The package manager installs only the platform package that matches this machine.
  }
}

const cliManifestPath = require.resolve("starwind/package.json");
const cliManifest = JSON.parse(readFileSync(cliManifestPath, "utf8"));
const cliEntry = path.join(path.dirname(cliManifestPath), cliManifest.bin.starwind);

process.env.STARWIND_OFFLINE_STORE = storeDirectories.join(path.delimiter);
await import(pathToFileURL(cliEntry).href);
