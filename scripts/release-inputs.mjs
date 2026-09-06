import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { createSpawnCommand, getPackageManagerCommand } from "./command-process.mjs";

export function releaseSourceFiles(root) {
  return [
    ...new Set(
      execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], {
        cwd: root,
        encoding: "utf8",
      })
        .split("\0")
        .filter(Boolean),
    ),
  ].sort();
}

export function fingerprintFiles(root, files) {
  const hash = createHash("sha256");
  for (const file of [...files].sort()) {
    const target = path.join(root, file);
    hash.update(file).update("\0");
    if (!existsSync(target)) {
      hash.update("missing\0");
      continue;
    }
    const stat = lstatSync(target);
    if (!stat.isFile()) throw new Error(`Release input must be a regular file: ${file}`);
    hash
      .update(String(stat.mode & 0o111))
      .update("\0")
      .update(readFileSync(target))
      .update("\0");
  }
  return hash.digest("hex");
}

export function releaseToolchain(root) {
  const command = createSpawnCommand(getPackageManagerCommand("pnpm"), ["--version"]);
  return {
    node: process.version,
    pnpm: execFileSync(command.command, command.args, { cwd: root, encoding: "utf8" }).trim(),
    platform: process.platform,
    arch: process.arch,
  };
}

export function releaseSourceFingerprint(root) {
  return createHash("sha256")
    .update(JSON.stringify(releaseToolchain(root)))
    .update(fingerprintFiles(root, releaseSourceFiles(root)))
    .digest("hex");
}

export function releaseOutputFingerprint(root, packsDirectory) {
  const files = [];
  function visit(relative) {
    const target = path.join(root, relative);
    if (!existsSync(target)) {
      files.push(relative);
      return;
    }
    if (lstatSync(target).isDirectory()) {
      for (const entry of readdirSync(target).sort()) visit(path.join(relative, entry));
    } else files.push(relative);
  }
  for (const directory of [
    "packages/runtime/dist",
    "packages/react/dist",
    "packages/vue/dist",
    "packages/cli/dist",
    "apps/demo/dist",
    "apps/react-demo/dist",
    "apps/vue-demo/dist",
    path.relative(root, packsDirectory),
  ])
    visit(directory);
  return fingerprintFiles(root, files);
}
