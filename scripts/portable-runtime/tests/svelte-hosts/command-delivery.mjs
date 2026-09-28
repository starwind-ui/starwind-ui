import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { add } from "../../../../packages/cli/src/commands/add.ts";
import { docs } from "../../../../packages/cli/src/commands/docs.ts";
import { init } from "../../../../packages/cli/src/commands/init.ts";
import { primitivesAdd } from "../../../../packages/cli/src/commands/primitives.ts";
import { remove } from "../../../../packages/cli/src/commands/remove.ts";
import { search } from "../../../../packages/cli/src/commands/search.ts";
import { update } from "../../../../packages/cli/src/commands/update.ts";
import { tailwindConfig } from "../../../../packages/cli/src/templates/starwind.css.ts";
import { PUBLIC_FRAMEWORK_TARGET_POLICY } from "../../../../packages/cli/src/utils/framework-target-policy.ts";

const [root, capabilityPath, host] = process.argv.slice(2);
const { registry, artifacts, behaviorRegistry, roots } = JSON.parse(
  await readFile(capabilityPath, "utf8"),
);
const targetPolicy = PUBLIC_FRAMEWORK_TARGET_POLICY;
const dependencies = { registry, artifacts, targetPolicy };
const options = { framework: "svelte", yes: true, packageManager: "pnpm" };
const evidence = {
  source: "repository command APIs with injected Svelte artifacts",
  publicCliTarball: false,
  phases: [],
  status: "failed",
};
const originalCwd = process.cwd();
const originalExit = process.exit;
process.exit = (code) => {
  throw new Error(`Source command requested process.exit(${code ?? 0})`);
};
process.chdir(root);

async function projectFiles(directory = ".") {
  const result = {};
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (
      ["node_modules", ".pnpm-store", ".cache", ".npm-cache", "artifacts"].includes(entry.name) ||
      entry.name === "command-evidence.json"
    )
      continue;
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) Object.assign(result, await projectFiles(filename));
    else
      result[filename] = createHash("sha256")
        .update(await readFile(filename))
        .digest("hex");
  }
  return result;
}
async function config() {
  return JSON.parse(await readFile("starwind.config.json", "utf8"));
}
async function phase(name, run) {
  const started = performance.now();
  const item = { name, status: "failed" };
  evidence.phases.push(item);
  try {
    const result = await run();
    item.status = "passed";
    return result;
  } catch (error) {
    item.error = String(error);
    throw error;
  } finally {
    item.durationMs = Math.round(performance.now() - started);
  }
}
async function jsonOutput(run) {
  const originalLog = console.log;
  const output = [];
  console.log = (value) => output.push(String(value));
  try {
    await run();
    return JSON.parse(output.at(-1));
  } finally {
    console.log = originalLog;
  }
}
try {
  await phase("init", () =>
    init(true, { framework: "svelte", defaults: true, packageManager: "pnpm" }, dependencies),
  );
  assert.equal(await readFile("src/styles/starwind.css", "utf8"), tailwindConfig);
  const initialized = await projectFiles();
  await phase("repeat-init", () =>
    init(true, { framework: "svelte", defaults: true, packageManager: "pnpm" }, dependencies),
  );
  assert.deepEqual(await projectFiles(), initialized, "Repeated init changed project files");
  evidence.initialized = initialized;
  await phase("add-five-styled-roots", () => add(roots, options, dependencies));
  const installed = await config();
  const componentDir = host === "astro" ? installed.componentDirs.svelte : installed.componentDir;
  assert.equal(installed.framework, host === "astro" ? "astro" : "svelte");
  for (const name of roots) {
    assert.ok(
      installed.components.some(
        (component) => component.name === name && component.framework === "svelte",
      ),
    );
    assert.ok((await readdir(path.join(componentDir, name))).length > 0);
  }
  if (host === "vite") {
    const sourcePath = path.join(componentDir, "select/Select.svelte");
    const source = await readFile(sourcePath, "utf8");
    await writeFile(sourcePath, source + "\n<!-- source update witness -->\n");
    const old = await config();
    old.components.find(({ name }) => name === "select").version = "0.0.0";
    await writeFile("starwind.config.json", JSON.stringify(old, null, 2));
    await phase("source-update", () => update(["select"], options, dependencies));
    assert.equal(await readFile(sourcePath, "utf8"), source);
    const edited = source + "\n<!-- behavior update witness -->\n";
    await writeFile(sourcePath, edited);
    await phase("behavior-update", () =>
      update(["select"], options, { ...dependencies, registry: behaviorRegistry }),
    );
    assert.equal(await readFile(sourcePath, "utf8"), edited);
    assert.equal(
      (await config()).components.find(({ name }) => name === "select").version,
      behaviorRegistry.components.find(({ name }) => name === "select").version,
    );
    await phase("remove", () => remove(["select"], options, dependencies));
    assert.ok(!(await config()).components.some(({ name }) => name === "select"));
    await phase("re-add", () => add(["select"], options, dependencies));
    assert.equal(await readFile(sourcePath, "utf8"), source);
    evidence.docs = await phase("docs", () =>
      jsonOutput(() => docs(["select"], { json: true }, dependencies)),
    );
    assert.equal(evidence.docs[0].component, "select");
    evidence.search = await phase("primitive-search", () =>
      jsonOutput(() =>
        search("select", { json: true, primitives: true, framework: "svelte" }, dependencies),
      ),
    );
    assert.ok(
      evidence.search.primitives.results.some(
        ({ name, framework }) => name === "select" && framework === "svelte",
      ),
    );
    await phase("vendor-select", () =>
      primitivesAdd(["select"], { ...options, to: "src/vendored/primitives" }, dependencies),
    );
    const primitive = artifacts.primitives.find(({ component }) => component === "select");
    for (const file of primitive.files) {
      const destination = file.path.replace(
        "src/components/starwind-primitives/",
        "src/vendored/primitives/",
      );
      assert.equal(
        await readFile(destination, "utf8"),
        file.content,
        `Vendored file mismatch: ${destination}`,
      );
    }
    evidence.vendoredSelectFiles = primitive.files.length;
  }
  evidence.config = await config();
  evidence.files = await projectFiles();
  evidence.status = "passed";
} catch (error) {
  evidence.error = String(error);
  throw error;
} finally {
  await writeFile(path.join(root, "command-evidence.json"), JSON.stringify(evidence, null, 2));
  process.chdir(originalCwd);
  process.exit = originalExit;
}
