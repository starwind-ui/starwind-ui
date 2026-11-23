import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { generateAstroPrimitiveWrappers } from "../../../../../scripts/portable-runtime/generate-astro-wrappers.js";
import {
  buildPrimitiveVendoringArtifacts,
  writeRuntimeRegistry,
} from "../../../../../scripts/portable-runtime/generate-cli-registry.js";
import { generateReactPrimitiveWrappers } from "../../../../../scripts/portable-runtime/generate-react-wrappers.js";
import { generateSveltePrimitiveWrappers } from "../../../../../scripts/portable-runtime/generate-svelte-wrappers.js";
import { generateVuePrimitiveWrappers } from "../../../../../scripts/portable-runtime/generate-vue-wrappers.js";

const packages = ["runtime", "astro", "react", "vue", "svelte", "cli"] as const;
type CandidatePackage = (typeof packages)[number];

export type CandidatePacks = {
  root: string;
  sourceSha: string;
  files: Record<CandidatePackage, string>;
  archiveHashes: Record<CandidatePackage, string>;
  registryHash: string;
  vendoringHash: string;
};

async function command(cwd: string, args: string[], log: string): Promise<string> {
  const chunks: string[] = [];
  await new Promise<void>((resolve, reject) => {
    const child = spawn("pnpm", args, {
      cwd,
      env: { ...process.env, CI: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout.on("data", (chunk) => chunks.push(String(chunk)));
    child.stderr.on("data", (chunk) => chunks.push(String(chunk)));
    child.once("error", reject);
    child.once("close", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${args.join(" ")} failed: ${chunks.join("").slice(-6000)}`)),
    );
  });
  const output = chunks.join("");
  await writeFile(log, output);
  return output;
}

async function sha(file: string): Promise<string> {
  return createHash("sha256")
    .update(await readFile(file))
    .digest("hex");
}

function keepPackageFile(sourceRoot: string, target: CandidatePackage, candidate: string): boolean {
  const relative = path.relative(sourceRoot, candidate);
  if (!relative) return true;
  const parts = relative.split(path.sep);
  if (parts.some((part) => ["node_modules", "dist", "tests", ".cache", ".tsup"].includes(part)))
    return false;
  if (target === "cli" && relative.startsWith(`src${path.sep}registry`)) return false;
  if (["astro", "react", "vue", "svelte"].includes(target) && parts[0] === "src") return false;
  return true;
}

/** Builds only inside an owned temporary workspace. The source checkout is read-only. */
export async function prepareCandidatePacks(
  repoRoot: string,
  root: string,
  sourceSha: string,
): Promise<CandidatePacks> {
  assert(path.isAbsolute(repoRoot) && path.isAbsolute(root));
  assert(!root.startsWith(repoRoot + path.sep), "Candidate workspace must be outside the checkout");
  await mkdir(path.join(root, "packages"), { recursive: true });
  await mkdir(path.join(root, "logs"), { recursive: true });
  await cp(path.join(repoRoot, "tsconfig.json"), path.join(root, "tsconfig.json"));
  await cp(path.join(repoRoot, "prettier.config.mjs"), path.join(root, "prettier.config.mjs"));
  await writeFile(
    path.join(root, "package.json"),
    '{"name":"starwind-direction-candidate","private":true,"type":"module"}\n',
  );
  await writeFile(path.join(root, "pnpm-workspace.yaml"), "packages:\n  - packages/*\n");
  await symlink(path.join(repoRoot, "node_modules"), path.join(root, "node_modules"), "dir");
  await mkdir(path.join(root, "scripts"));
  await symlink(
    path.join(repoRoot, "scripts/portable-runtime"),
    path.join(root, "scripts/portable-runtime"),
    "dir",
  );
  for (const target of packages) {
    const from = path.join(repoRoot, "packages", target);
    const to = path.join(root, "packages", target);
    await cp(from, to, {
      recursive: true,
      filter: (candidate) => keepPackageFile(from, target, candidate),
    });
    await symlink(path.join(from, "node_modules"), path.join(to, "node_modules"), "dir");
  }

  await generateAstroPrimitiveWrappers({ repoRoot: root, outputDir: "packages/astro/src" });
  await generateReactPrimitiveWrappers({ repoRoot: root, outputDir: "packages/react/src" });
  await generateVuePrimitiveWrappers({ repoRoot: root, outputDir: "packages/vue/src" });
  await generateSveltePrimitiveWrappers({
    repoRoot: root,
    outputRoot: path.join(root, "packages/svelte/src"),
  });

  const cliRoot = path.join(root, "packages/cli");
  await writeRuntimeRegistry({
    repoRoot,
    outputRoot: cliRoot,
    outputPath: "src/registry/bundled-registry.json",
  });
  const vendoring = await buildPrimitiveVendoringArtifacts({ repoRoot });
  const vendoringPath = path.join(cliRoot, "src/registry/primitive-vendoring-artifacts.json");
  await writeFile(vendoringPath, `${JSON.stringify(vendoring, null, 2)}\n`);
  const registryPath = path.join(cliRoot, "src/registry/bundled-registry.json");

  for (const target of ["runtime", "react", "vue", "svelte", "cli"] as const) {
    await command(
      path.join(root, "packages", target),
      ["build"],
      path.join(root, "logs", `${target}-build.log`),
    );
  }
  const files = {} as Record<CandidatePackage, string>;
  const archiveHashes = {} as Record<CandidatePackage, string>;
  await mkdir(path.join(root, "packs"));
  for (const target of packages) {
    const file = path.join(root, "packs", `starwind-${target}.tgz`);
    await command(
      path.join(root, "packages", target),
      ["pack", "--out", file],
      path.join(root, "logs", `${target}-pack.log`),
    );
    files[target] = file;
    archiveHashes[target] = await sha(file);
  }
  const result = {
    root,
    sourceSha,
    files,
    archiveHashes,
    registryHash: await sha(registryPath),
    vendoringHash: await sha(vendoringPath),
  };
  await writeFile(path.join(root, "candidate-packs.json"), `${JSON.stringify(result, null, 2)}\n`);
  return result;
}
