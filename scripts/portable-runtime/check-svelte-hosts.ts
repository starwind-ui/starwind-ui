import assert from "node:assert/strict";
import { type ChildProcess, execFile, fork } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, readdir, readFile, realpath, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { chromium } from "playwright";
import { parse as parseYaml } from "yaml";
import {
  getImplementedSvelteStyledRoots,
  SVELTE_MANUAL_FACADES,
  SVELTE_PRIMITIVE_COMPONENTS,
} from "./renderers/framework-adapters/svelte/inventory.js";

const execute = promisify(execFile);
export const HOST_TOOLS = {
  svelte: "5.29.0",
  vite: "7.3.5",
  "@sveltejs/vite-plugin-svelte": "6.2.1",
  "tailwind-variants": "3.2.2",
  "tailwind-merge": "3.6.0",
  "@floating-ui/dom": "1.7.6",
  "embla-carousel": "8.6.0",
  tailwindcss: "4.3.0",
  "@tailwindcss/vite": "4.3.0",
  "tw-animate-css": "1.4.0",
  "@tailwindcss/forms": "0.5.11",
};
export const SVELTEKIT_TOOLS = {
  ...HOST_TOOLS,
  "@sveltejs/kit": "2.70.3",
  "@sveltejs/adapter-node": "5.5.7",
};
export const ASTRO_TOOLS = {
  ...HOST_TOOLS,
  astro: "7.1.3",
  "@astrojs/svelte": "9.0.1",
  svelte: "5.57.0",
  vite: "8.1.3",
  "@sveltejs/vite-plugin-svelte": "7.3.0",
  typescript: "5.9.3",
};
export function verifyAstroToolEntries(entries: Record<string, string>) {
  for (const [entry, expected] of Object.entries({
    "integration:plugin": "@sveltejs/vite-plugin-svelte",
    "integration:vite": "vite",
    "plugin:svelte/compiler": "svelte/compiler",
    "astro:vite": "vite",
  })) {
    assert.equal(typeof entries[expected], "string", `Astro ${expected} host tool absent`);
    assert.equal(
      entries[entry],
      entries[expected],
      `Astro ${entry} must use the verified host tool`,
    );
  }
}
/** A small composition exercises native forms and overlay ownership in each host. */
export const REPRESENTATIVE_SVELTE_STYLED_ROOTS = [
  "button",
  "checkbox",
  "select",
  "dialog",
  "theme-toggle",
] as const;
export function svelteBaselineScope() {
  return {
    kind: "representative-five-root",
    roots: [...REPRESENTATIVE_SVELTE_STYLED_ROOTS],
    packagePrimitives: [...SVELTE_PRIMITIVE_COMPONENTS].sort(),
    packageFacades: [...SVELTE_MANUAL_FACADES],
    catalogRoots: getImplementedSvelteStyledRoots().sort(),
    fullCatalogBehavior: false,
  };
}
export type Host = "vite" | "sveltekit" | "astro";
export function selectHost(value: string | undefined): Host {
  if (value !== "vite" && value !== "sveltekit" && value !== "astro")
    throw new Error(
      `Host ${value ?? "(missing)"} is not implemented. Use --host=vite, --host=sveltekit, or --host=astro.`,
    );
  return value;
}
export function assertConsumerPath(root: string, file: string) {
  assert.ok(file.startsWith(root + path.sep), `Resolved outside consumer: ${file}`);
}
const hash = (content: Buffer) => createHash("sha256").update(content).digest("hex");
export async function readPackagePayloadFiles(root: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  async function visit(directory: string) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      assert.ok(!entry.isSymbolicLink(), `Unexpected package symlink: ${file}`);
      if (entry.isDirectory() && entry.name === "node_modules") continue;
      if (entry.isDirectory()) await visit(file);
      else result[path.relative(root, file)] = hash(await readFile(file));
    }
  }
  await visit(root);
  return result;
}
export interface Packed {
  name: string;
  version: string;
  tarball: string;
  sha256: string;
  files: Record<string, string>;
}
interface Server {
  url: string;
  close(): Promise<void>;
}
export interface HostSteps {
  pack(root: string): Promise<Packed[]>;
  install(root: string, packed: Packed[]): Promise<void>;
  provenance(root: string, packed: Packed[]): Promise<unknown>;
  commands?(root: string, packed: Packed[]): Promise<unknown>;
  start(root: string): Promise<Server>;
  browser(server: Server): Promise<unknown>;
  buildProvenance(root: string): Promise<unknown>;
}
const PUBLIC_PACKAGES = ["@starwind-ui/runtime", "@starwind-ui/svelte", "starwind"] as const;

export function assertPublicSveltePackSet(packed: Pick<Packed, "name">[]): void {
  const names = packed.map(({ name }) => name).sort();
  assert.deepEqual(
    names,
    [...PUBLIC_PACKAGES].sort(),
    "Expected exact Runtime, Svelte, and CLI packs",
  );
}

export async function readPublicSveltePacks(
  directory: string,
  extractionRoot: string,
): Promise<Packed[]> {
  let acceptedEntries:
    | Array<{
        file: string;
        manifest: unknown;
        name: string;
        sha256: string;
        version: string;
      }>
    | undefined;
  try {
    const accepted = JSON.parse(await readFile(path.join(directory, "manifest.json"), "utf8"));
    assert.equal(accepted.schemaVersion, 2, "Unsupported accepted pack manifest schema");
    acceptedEntries = Object.values(accepted.packages ?? {}).filter(
      (entry): entry is NonNullable<typeof acceptedEntries>[number] =>
        Boolean(
          entry &&
          typeof entry === "object" &&
          "name" in entry &&
          PUBLIC_PACKAGES.includes(entry.name as (typeof PUBLIC_PACKAGES)[number]),
        ),
    );
    assertPublicSveltePackSet(acceptedEntries);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const archives = acceptedEntries
    ? acceptedEntries.map(({ file }) => path.resolve(directory, file))
    : (await readdir(directory))
        .filter((file) => file.endsWith(".tgz"))
        .map((file) => path.resolve(directory, file));
  assert.equal(archives.length, PUBLIC_PACKAGES.length, "Expected exactly three public pack files");
  const packed: Packed[] = [];
  for (const [index, tarball] of archives.entries()) {
    const destination = path.join(extractionRoot, `pack-${index}`);
    await mkdir(destination, { recursive: true });
    await execute("tar", ["-xzf", tarball, "-C", destination]);
    const packageRoot = path.join(destination, "package");
    const metadata = JSON.parse(await readFile(path.join(packageRoot, "package.json"), "utf8"));
    assert.equal(typeof metadata.name, "string", `Pack has no package name: ${tarball}`);
    assert.equal(typeof metadata.version, "string", `Pack has no package version: ${tarball}`);
    if (metadata.name === "starwind")
      assert.equal(metadata.bin?.starwind, "./dist/index.js", "CLI pack has an invalid binary");
    if (metadata.name === "@starwind-ui/svelte") {
      assert.notEqual(metadata.private, true, "Svelte pack must be public");
      assert.equal(metadata.peerDependencies?.svelte, ">=5.29.0 <6", "Svelte peer range");
    }
    if (metadata.name === "@starwind-ui/runtime")
      assert.notEqual(metadata.private, true, "Runtime pack must be public");
    const sha256 = hash(await readFile(tarball));
    const accepted = acceptedEntries?.find(({ file }) => path.resolve(directory, file) === tarball);
    if (accepted) {
      assert.equal(sha256, accepted.sha256, `Accepted archive changed: ${metadata.name}`);
      assert.equal(metadata.name, accepted.name, `Accepted archive name changed: ${tarball}`);
      assert.equal(
        metadata.version,
        accepted.version,
        `Accepted archive version changed: ${tarball}`,
      );
      assert.deepEqual(
        metadata,
        accepted.manifest,
        `Accepted pack manifest changed: ${metadata.name}`,
      );
    }
    packed.push({
      name: metadata.name,
      version: metadata.version,
      tarball,
      sha256,
      files: await readPackagePayloadFiles(packageRoot),
    });
  }
  assertPublicSveltePackSet(packed);
  return packed.sort((left, right) => left.name.localeCompare(right.name));
}
function environment(root: string) {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    XDG_CACHE_HOME: path.join(root, ".cache"),
    npm_config_cache: path.join(root, ".npm-cache"),
    NODE_ENV: "production",
  };
  delete env.NODE_OPTIONS;
  delete env.NODE_PATH;
  return env;
}
async function command(root: string, args: string[]) {
  return execute("pnpm", args, {
    cwd: root,
    env: environment(root),
    timeout: 180_000,
    maxBuffer: 8 * 1024 * 1024,
  });
}
export function verifyPackedWorkspaceOverrides(
  content: string,
  packed: Pick<Packed, "name" | "tarball">[],
): void {
  const workspace = parseYaml(content) as { overrides?: unknown } | null;
  assert.deepEqual(
    workspace?.overrides,
    Object.fromEntries(packed.map(({ name, tarball }) => [name, `file:${tarball}`])),
    "Host requires the exact tarball override mapping",
  );
}

export async function readHostProvenance(
  root: string,
  packed: Packed[],
  tools: Record<string, string> = HOST_TOOLS,
) {
  root = await realpath(root);
  const manifest = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
  const installed: Record<string, unknown> = {};
  const packedRoots: Record<string, string> = {};
  for (const [name, version] of Object.entries({
    ...tools,
    ...Object.fromEntries(packed.map((p) => [p.name, p.version])),
  })) {
    const directory = await realpath(path.join(root, "node_modules", name));
    assertConsumerPath(root, directory);
    const metadata = JSON.parse(await readFile(path.join(directory, "package.json"), "utf8"));
    assert.equal(metadata.name, name);
    assert.equal(metadata.version, version, `${name} version`);
    const archive = packed.find((p) => p.name === name);
    if (archive) {
      packedRoots[name] = directory;
      if (manifest.dependencies[name] !== `file:${archive.tarball}`) {
        assert.equal(
          manifest.dependencies[name],
          archive.version,
          `${name} exact tarball dependency`,
        );
        verifyPackedWorkspaceOverrides(
          await readFile(path.join(root, "pnpm-workspace.yaml"), "utf8"),
          packed,
        );
      }
      assert.equal(hash(await readFile(archive.tarball)), archive.sha256, "Tarball changed");
      assert.deepEqual(
        await readPackagePayloadFiles(directory),
        archive.files,
        `${name} differs from packed files`,
      );
    } else assert.equal(manifest.dependencies[name], version, `${name} exact tool dependency`);
    installed[name] = { version, directory, exports: metadata.exports };
  }
  await writeFile(path.join(root, "verified-packed-roots.json"), JSON.stringify(packedRoots));
  // pnpm list records every resolved transitive version as well as peer contexts.
  const dependencyTree = JSON.parse(
    (await command(root, ["list", "--depth", "Infinity", "--json"])).stdout,
  );
  return {
    installed,
    packedDeclarations: Object.fromEntries(
      packed.map(({ name }) => [name, manifest.dependencies[name]]),
    ),
    packedRoots,
    dependencyTree,
    lockfile: await readFile(path.join(root, "pnpm-lock.yaml"), "utf8"),
  };
}
/** A same-version registry installation is a different payload from the verified archive. */
export async function verifyPackedBuildModules(
  root: string,
  modules: string[],
  packedRoots: Record<string, string>,
) {
  const resolved: string[] = [];
  for (const module of modules) {
    const file = await realpath(module);
    assertConsumerPath(root, file);
    for (const [name, directory] of Object.entries(packedRoots)) {
      if (!file.includes(`/node_modules/${name}/`)) continue;
      assert.ok(
        file.startsWith(directory + path.sep),
        `${name} build module bypassed its verified packed payload: ${file}`,
      );
      assert.ok(
        file.startsWith(path.join(directory, "dist") + path.sep),
        `${name} build module used package source: ${file}`,
      );
    }
    resolved.push(file);
  }
  return resolved;
}
export async function stopHost(child: ChildProcess) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  await new Promise<void>((resolve) => {
    const timer = setTimeout(() => child.kill("SIGKILL"), 3000);
    child.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
    if (child.connected)
      child.send("close", (error) => {
        if (error) child.kill("SIGTERM");
      });
    else child.kill("SIGTERM");
  });
}
export async function startHostProcess(root: string): Promise<Server> {
  const child = fork(path.join(root, "host.mjs"), [], {
    cwd: root,
    env: environment(root),
    execArgv: [],
    stdio: ["ignore", "pipe", "pipe", "ipc"],
  });
  let output = "";
  child.stdout?.on("data", (chunk) => {
    output += chunk;
  });
  child.stderr?.on("data", (chunk) => {
    output += chunk;
  });
  try {
    const url = await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`Host build/start timed out: ${output}`)),
        90_000,
      );
      child.once("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
      child.once("exit", (code) => {
        clearTimeout(timer);
        reject(new Error(`Host exited ${code}: ${output}`));
      });
      child.once("message", (message) => {
        clearTimeout(timer);
        if (!message || typeof message !== "object" || !("url" in message)) {
          reject(new Error("Invalid host readiness message"));
          return;
        }
        resolve(String(message.url));
      });
    });
    return { url, close: () => stopHost(child) };
  } catch (error) {
    await stopHost(child);
    throw error;
  }
}
export async function verifyHostBrowser(server: Server) {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const page = await browser.newPage({ colorScheme: "light" });
    const diagnostics: string[] = [];
    page.on("pageerror", (error) => diagnostics.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) diagnostics.push(message.text());
    });
    page.on("requestfailed", (request) =>
      diagnostics.push(`${request.url()}: ${request.failure()?.errorText}`),
    );
    page.on("response", (response) => {
      if (response.status() >= 400) diagnostics.push(`${response.status()} ${response.url()}`);
    });
    await page.goto(server.url);
    await page.waitForFunction(() => document.documentElement.dataset.hostResult, undefined, {
      timeout: 30_000,
    });
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.hostResult!),
    );
    assert.equal(result.error, undefined, result.error);
    assert.deepEqual(diagnostics, []);
    assert.equal(result.cycles.length, 3);
    assert.equal(result.vendoredSelect, true);
    assert.equal(result.styles.length, 3);
    for (const style of result.styles) {
      assert.equal(style.display, "inline-flex");
      assert.ok(parseFloat(style.radius) > 0);
    }
    for (const cycle of result.cycles) {
      const { refs, ...behavior } = cycle;
      assert.deepEqual(behavior, {
        clicks: 1,
        checked: false,
        open: false,
        value: "beta",
        selectOpen: false,
        callbacks: { checked: 1, dialog: 2, value: 1, select: 2 },
        mounted: true,
        themed: true,
        remaining: 0,
        stale: 0,
      });
      assert.ok(refs.setups > 0);
      assert.equal(refs.cleanups, refs.setups);
    }
    return { ...result, diagnostics };
  } finally {
    await browser.close();
  }
}
interface NavigationSnapshot {
  clicks: number;
  checked: boolean;
  open: boolean;
  value: string;
  selectOpen: boolean;
  callbacks: Record<string, number>;
  refs: { setups: number; cleanups: number };
}
interface NavigationWindow extends Window {
  __hostOwners: {
    app: { snapshot(): NavigationSnapshot; acceptCheckbox(): void; replaceRef(): void };
    destroyed: boolean;
    nodes?: HTMLElement[];
    island?: HTMLElement | null;
  }[];
  __documentToken?: string;
}
export const verifySvelteKitBrowser = (server: Server) =>
  verifyNavigationHostBrowser(server, "sveltekit");
export const verifyAstroBrowser = (server: Server) => verifyNavigationHostBrowser(server, "astro");
async function verifyNavigationHostBrowser(server: Server, host: "sveltekit" | "astro") {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const ssrContext = await browser.newContext({ javaScriptEnabled: false });
    const ssrPage = await ssrContext.newPage();
    const response = await ssrPage.goto(server.url);
    assert.equal(response?.status(), 200, `${host} SSR request`);
    const html = await response!.text();
    const ssr: Record<string, string> = {};
    for (const part of ["button", "checkbox", "theme", "trigger", "dialog", "select"]) {
      assert.ok(html.includes(`data-test="${part}"`), `${host} SSR omitted ${part}`);
      const element = ssrPage.locator(`[data-test="${part}"]`);
      assert.equal(await element.count(), 1, `${host} SSR ${part} owner count`);
      ssr[part] = await element.evaluate((node) => node.tagName);
    }
    assert.equal(ssr.button, "BUTTON");
    assert.equal(ssr.dialog, "DIALOG");
    assert.equal(
      await ssrPage.locator('[data-test="checkbox"]').getAttribute("aria-checked"),
      "true",
    );
    assert.ok((await ssrPage.locator('[data-test="select"]').textContent())?.includes("alpha"));
    assert.equal(await ssrPage.locator("html").getAttribute("data-host-ready"), null);
    if (host === "astro") {
      assert.equal(
        await ssrPage.locator('astro-island[client="load"][ssr]').count(),
        1,
        "Astro SSR must contain one client:load island",
      );
      assert.equal(
        await ssrPage.locator('astro-island [data-test="dialog"]').count(),
        1,
        "Astro compound tree must be inside the island",
      );
    }
    await ssrContext.close();

    const page = await browser.newPage({ colorScheme: "light" });
    const diagnostics: string[] = [];
    page.on("pageerror", (error) => diagnostics.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) diagnostics.push(message.text());
    });
    page.on("requestfailed", (request) =>
      diagnostics.push(`${request.url()}: ${request.failure()?.errorText}`),
    );
    page.on("response", (response) => {
      if (response.status() >= 400) diagnostics.push(`${response.status()} ${response.url()}`);
    });
    await page.goto(server.url);
    await page.waitForFunction(() => document.documentElement.dataset.hostReady === "true");
    await page.evaluate(() => {
      (window as unknown as NavigationWindow).__documentToken = "same host document";
    });
    const cycles = [];
    for (let cycle = 0; cycle < 2; cycle++) {
      if (host === "astro") {
        assert.equal(await page.locator("astro-island").count(), 1);
        await page.waitForFunction(
          () => !document.querySelector("astro-island")?.hasAttribute("ssr"),
        );
      }
      const computedStyle = await page.locator('[data-test="button"]').evaluate((element) => {
        const style = getComputedStyle(element);
        return { display: style.display, radius: style.borderRadius };
      });
      assert.equal(computedStyle.display, "inline-flex", `${host} command-installed Button CSS`);
      assert.ok(parseFloat(computedStyle.radius) > 0, `${host} canonical theme radius`);
      const initial = await page.evaluate(() =>
        (window as unknown as NavigationWindow).__hostOwners.at(-1)!.app.snapshot(),
      );
      assert.deepEqual(initial.callbacks, { checked: 0, dialog: 0, value: 0, select: 0 });
      assert.equal(initial.checked, true);
      assert.equal(initial.value, "alpha");
      assert.equal(initial.open, false);
      assert.equal(initial.selectOpen, false);
      await page.locator('[data-test="checkbox"]').click();
      assert.deepEqual(
        await page.evaluate(() => {
          const state = (window as unknown as NavigationWindow).__hostOwners.at(-1)!.app.snapshot();
          return { checked: state.checked, calls: state.callbacks.checked };
        }),
        { checked: true, calls: 0 },
      );
      await page.evaluate(() =>
        (window as unknown as NavigationWindow).__hostOwners.at(-1)!.app.acceptCheckbox(),
      );
      await page.locator('[data-test="checkbox"]').click();
      await page.locator('[data-test="button"]').click();
      await page.locator('[data-test="theme"]').click();
      await page.waitForFunction(() => document.documentElement.classList.contains("dark"));
      const sameOwner = await page.evaluate(async () => {
        const owner = (window as unknown as NavigationWindow).__hostOwners.at(-1)!;
        const trigger = document.querySelector('[data-test="trigger"]');
        owner.app.replaceRef();
        await new Promise(requestAnimationFrame);
        return trigger === document.querySelector('[data-test="trigger"]');
      });
      assert.equal(sameOwner, true, `${host} ref replacement changed semantic owner`);
      await page.locator('[data-test="trigger"]').click();
      await page.waitForFunction(() =>
        document.querySelector('[data-test="dialog"]')?.matches(":modal"),
      );
      await page.locator('[data-test="select"]').click();
      await page.locator('[data-sw-select-item][data-value="beta"]').click();
      await page.waitForFunction(
        () =>
          (window as unknown as NavigationWindow).__hostOwners.at(-1)!.app.snapshot().value ===
          "beta",
      );
      await page.waitForFunction(() => document.activeElement?.matches('[data-test="select"]'));
      await page.locator('[data-test="close"]').click();
      await page.waitForFunction(() => document.activeElement?.matches('[data-test="trigger"]'));
      await page.locator('[data-test="trigger"]').click();
      await page.waitForFunction(() =>
        document.querySelector('[data-test="dialog"]')?.matches(":modal"),
      );
      await page.evaluate(() => {
        (window as unknown as NavigationWindow).__hostOwners.at(-1)!.island =
          document.querySelector("astro-island");
        (window as unknown as NavigationWindow).__hostOwners.at(-1)!.nodes = [
          "button",
          "checkbox",
          "trigger",
          "dialog",
          "select",
        ].map((part) => document.querySelector(`[data-test="${part}"]`) as HTMLElement);
      });
      await page.locator('[data-test="away"]').click();
      await page.waitForURL(new URL("/away", server.url).href);
      await page.waitForFunction(
        () => (window as unknown as NavigationWindow).__hostOwners.at(-1)?.destroyed,
      );
      const result = await page.evaluate(async () => {
        const state = window as unknown as NavigationWindow;
        const owner = state.__hostOwners.at(-1)!;
        const before = owner.app.snapshot();
        owner.nodes!.slice(0, 3).forEach((node) => node.click());
        await new Promise(requestAnimationFrame);
        const after = owner.app.snapshot();
        return {
          snapshot: after,
          stale:
            after.clicks -
            before.clicks +
            Object.keys(after.callbacks).reduce(
              (sum, key) => sum + after.callbacks[key]! - before.callbacks[key]!,
              0,
            ),
          detached: owner.nodes!.every((node) => !node.isConnected),
          islandRemoved: owner.island ? !owner.island.isConnected : undefined,
          remainingIslands: document.querySelectorAll("astro-island").length,
          remaining: document.querySelectorAll("[data-sw-dialog], [data-sw-select-portal], :modal")
            .length,
          documentToken: state.__documentToken,
          ownerCount: state.__hostOwners.length,
          scrollLocked:
            document.documentElement.style.overflow === "hidden" ||
            document.body.style.overflow === "hidden",
        };
      });
      assert.equal(result.documentToken, "same host document", "Navigation reloaded the document");
      assert.equal(result.ownerCount, cycle + 1);
      assert.equal(result.detached, true);
      if (host === "astro") {
        assert.equal(result.islandRemoved, true);
        assert.equal(result.remainingIslands, 0);
      }
      assert.equal(result.remaining, 0);
      assert.equal(result.stale, 0);
      assert.equal(result.scrollLocked, false);
      assert.deepEqual(result.snapshot.refs, { setups: 7, cleanups: 7 });
      assert.equal(result.snapshot.clicks, 1);
      assert.equal(result.snapshot.checked, false);
      assert.equal(result.snapshot.value, "beta");
      assert.deepEqual(result.snapshot.callbacks, { checked: 1, dialog: 3, value: 1, select: 2 });
      cycles.push(result);
      await page.evaluate(() => {
        localStorage.clear();
        document.documentElement.classList.remove("dark");
      });
      await page.locator('[data-test="return"]').click();
      await page.waitForURL(new URL("/", server.url).href);
      await page.waitForFunction(() => document.documentElement.dataset.hostReady === "true");
    }
    assert.deepEqual(diagnostics, []);
    return { ssr, cycles, diagnostics };
  } finally {
    await browser.close();
  }
}
export async function runSvelteCommandDelivery(
  repoRoot: string,
  root: string,
  host: Host,
  capabilityPath?: string,
): Promise<unknown> {
  const capability = capabilityPath ?? (await prepareSvelteCommandCapability(repoRoot, root));
  const env: NodeJS.ProcessEnv = {
    ...environment(root),
    TSX_TSCONFIG_PATH: path.join(repoRoot, "packages/cli/tsconfig.json"),
  };
  delete env.npm_execpath;
  try {
    const result = await execute(
      process.execPath,
      [
        "--import",
        "tsx",
        path.join(repoRoot, "scripts/portable-runtime/tests/svelte-hosts/command-delivery.mjs"),
        root,
        capability,
        host,
      ],
      { cwd: repoRoot, env, timeout: 180_000, maxBuffer: 8 * 1024 * 1024 },
    );
    await writeFile(path.join(root, "command-output.log"), result.stdout + result.stderr);
  } catch (error) {
    const output = error as Error & { stdout?: string; stderr?: string };
    await writeFile(
      path.join(root, "command-output.log"),
      (output.stdout ?? "") + (output.stderr ?? ""),
    );
    throw error;
  }
  return JSON.parse(await readFile(path.join(root, "command-evidence.json"), "utf8"));
}

export type InstalledCliExecutor = (
  executable: string,
  args: string[],
  options: { cwd: string; env: NodeJS.ProcessEnv; timeout: number; maxBuffer: number },
) => Promise<{ stdout: string; stderr: string }>;

const boundedOutput = (value: string) => value.slice(-32 * 1024);

export async function resolveConsumerCli(root: string, packed: Packed[]) {
  root = await realpath(root);
  const archive = packed.find(({ name }) => name === "starwind");
  assert.ok(archive, "Public host delivery requires the CLI pack");
  const packageRoot = await realpath(path.join(root, "node_modules/starwind"));
  assertConsumerPath(root, packageRoot);
  const metadata = JSON.parse(await readFile(path.join(packageRoot, "package.json"), "utf8"));
  assert.equal(metadata.name, "starwind");
  assert.equal(metadata.version, archive.version, "Installed CLI version differs from its pack");
  const bin = metadata.bin?.starwind;
  assert.equal(typeof bin, "string", "Installed CLI manifest has no starwind binary");
  const binary = await realpath(path.join(packageRoot, bin));
  const launcher = await realpath(path.join(root, "node_modules/.bin/starwind"));
  assertConsumerPath(root, binary);
  assertConsumerPath(root, launcher);
  const launcherSource = await readFile(launcher, "utf8");
  return {
    archiveSha256: archive.sha256,
    binary,
    binarySha256: hash(await readFile(binary)),
    launcher,
    launcherSha256: hash(Buffer.from(launcherSource)),
    packageRoot,
    version: archive.version,
  };
}

export async function runInstalledSvelteCommandDelivery(
  root: string,
  host: Host,
  packed: Packed[],
  executeCli: InstalledCliExecutor = (executable, args, options) =>
    execute(executable, args, options) as Promise<{ stdout: string; stderr: string }>,
): Promise<unknown> {
  const evidence: Record<string, unknown> = {
    source: "consumer-installed starwind CLI tarball",
    publicCliTarball: false,
    phases: [],
    status: "failed",
  };
  const output: string[] = [];
  const phases = evidence.phases as Array<Record<string, unknown>>;
  try {
    assertPublicSveltePackSet(packed);
    const identity = await resolveConsumerCli(root, packed);
    evidence.cli = identity;
    const phase = async (name: string, args: string[]) => {
      const started = performance.now();
      const item: Record<string, unknown> = { args, name, status: "failed" };
      phases.push(item);
      try {
        const result = await executeCli(process.execPath, [identity.binary, ...args], {
          cwd: root,
          env: environment(root),
          timeout: 180_000,
          maxBuffer: 8 * 1024 * 1024,
        });
        const commandOutput = boundedOutput(result.stdout + result.stderr);
        item.output = commandOutput;
        output.push(`$ starwind ${args.join(" ")}\n${commandOutput}`);
        item.status = "passed";
      } catch (error) {
        const failed = error as Error & { stdout?: string; stderr?: string };
        const commandOutput = boundedOutput((failed.stdout ?? "") + (failed.stderr ?? ""));
        item.error = String(error);
        item.output = commandOutput;
        output.push(`$ starwind ${args.join(" ")}\n${commandOutput}`);
        throw error;
      } finally {
        item.durationMs = Math.round(performance.now() - started);
      }
    };
    await phase("init", ["init", "--defaults", "--framework", "svelte"]);
    await phase("add-five-styled-roots", [
      "add",
      ...REPRESENTATIVE_SVELTE_STYLED_ROOTS,
      "--framework",
      "svelte",
      "--yes",
      "--package-manager",
      "pnpm",
    ]);
    if (host === "vite")
      await phase("vendor-select", [
        "primitives",
        "add",
        "select",
        "--framework",
        "svelte",
        "--to",
        "src/vendored/primitives",
        "--yes",
        "--package-manager",
        "pnpm",
      ]);
    const config = JSON.parse(await readFile(path.join(root, "starwind.config.json"), "utf8"));
    const componentRoot = host === "astro" ? config.componentDirs?.svelte : config.componentDir;
    assert.equal(typeof componentRoot, "string", "CLI did not configure a Svelte component root");
    assert.equal(config.framework, host === "astro" ? "astro" : "svelte");
    for (const name of REPRESENTATIVE_SVELTE_STYLED_ROOTS) {
      assert.ok(
        config.components.some(
          (component: { framework?: string; name?: string }) =>
            component.name === name && component.framework === "svelte",
        ),
        `CLI config omitted Svelte ${name}`,
      );
      assert.ok(
        (await readdir(path.join(root, componentRoot, name))).length > 0,
        `CLI did not install Svelte ${name}`,
      );
    }
    evidence.config = config;
    evidence.publicCliTarball = true;
    evidence.status = "passed";
  } catch (error) {
    evidence.error = String(error);
    throw error;
  } finally {
    await writeFile(path.join(root, "command-output.log"), boundedOutput(output.join("\n")));
    await writeFile(path.join(root, "command-evidence.json"), JSON.stringify(evidence, null, 2));
  }
  return evidence;
}

function defaultSteps(repoRoot: string, host: Host, capabilityPath?: string): HostSteps {
  const tools =
    host === "sveltekit" ? SVELTEKIT_TOOLS : host === "astro" ? ASTRO_TOOLS : HOST_TOOLS;
  return {
    async pack(root) {
      await command(repoRoot, ["runtime:build"]);
      await command(repoRoot, ["svelte:build"]);
      await command(repoRoot, ["cli:build"]);
      const destination = path.join(root, "artifacts");
      await mkdir(destination, { recursive: true });
      for (const directory of ["runtime", "svelte", "cli"]) {
        await command(path.join(repoRoot, "packages", directory), [
          "pack",
          "--pack-destination",
          destination,
        ]);
      }
      return readPublicSveltePacks(destination, path.join(root, "inspected-packs"));
    },
    async install(root, packed) {
      await cp(
        path.join(repoRoot, `scripts/portable-runtime/tests/svelte-hosts/fixtures/${host}`),
        root,
        { recursive: true },
      );
      const appDestination =
        host === "vite" ? "src/App.svelte" : host === "sveltekit" ? "src/App.svelte" : "App.svelte";
      await mkdir(path.dirname(path.join(root, appDestination)), { recursive: true });
      const app = await readFile(
        path.join(
          repoRoot,
          "scripts/portable-runtime/tests/svelte-hosts/fixtures/vite/src/App.svelte",
        ),
        "utf8",
      );
      const componentRoot =
        host === "sveltekit"
          ? "./lib/starwind/"
          : host === "astro"
            ? "./src/components/starwind-svelte/"
            : "./components/starwind/";
      await writeFile(
        path.join(root, appDestination),
        app.replaceAll("./components/starwind/", componentRoot),
      );
      await writeFile(
        path.join(root, "package.json"),
        JSON.stringify(
          {
            name: `starwind-packed-${host}-consumer`,
            private: true,
            type: "module",
            dependencies: {
              ...tools,
              ...Object.fromEntries(packed.map((p) => [p.name, `file:${p.tarball}`])),
            },
          },
          null,
          2,
        ),
      );
      await writeFile(
        path.join(root, "pnpm-workspace.yaml"),
        "overrides:\n" +
          packed
            .map((p) => `  ${JSON.stringify(p.name)}: ${JSON.stringify(`file:${p.tarball}`)}\n`)
            .join(""),
      );
      await command(root, [
        "--allow-build=esbuild",
        "add",
        "--save-exact",
        "--workspace-root",
        "--store-dir",
        path.join(root, ".pnpm-store"),
        "--config.enable-global-virtual-store=false",
        "--config.link-workspace-packages=false",
        "--config.prefer-workspace-packages=false",
        "--reporter=append-only",
        ...Object.entries(tools).map(([name, version]) => `${name}@${version}`),
      ]);
    },
    commands: (root, packed) =>
      capabilityPath
        ? runSvelteCommandDelivery(repoRoot, root, host, capabilityPath)
        : runInstalledSvelteCommandDelivery(root, host, packed),
    provenance: (root, packed) => readHostProvenance(root, packed, tools),
    start: startHostProcess,
    browser:
      host === "sveltekit"
        ? verifySvelteKitBrowser
        : host === "astro"
          ? verifyAstroBrowser
          : verifyHostBrowser,
    async buildProvenance(root) {
      const modules: string[] = JSON.parse(
        await readFile(path.join(root, "build-provenance.json"), "utf8"),
      );
      const packedRoots: Record<string, string> = JSON.parse(
        await readFile(path.join(root, "verified-packed-roots.json"), "utf8"),
      );
      await verifyPackedBuildModules(root, modules, packedRoots);
      for (const group of ["button", "checkbox", "select", "dialog", "theme"])
        assert.ok(
          modules.some((file) => file.includes(`/@starwind-ui/svelte/dist/${group}/`)),
          `${group} packed subpath absent`,
        );
      assert.ok(
        modules.some((file) => file.includes("/@starwind-ui/runtime/dist/")),
        "Runtime packed dist absent",
      );
      const graphs: Record<string, string[]> = {};
      if (host !== "vite") {
        for (const target of ["server", "client"]) {
          const graph: string[] = JSON.parse(
            await readFile(path.join(root, `build-${target}-provenance.json`), "utf8"),
          );
          await verifyPackedBuildModules(root, graph, packedRoots);
          for (const group of ["button", "checkbox", "select", "dialog", "theme"])
            assert.ok(
              graph.some((file) => file.includes(`/@starwind-ui/svelte/dist/${group}/`)),
              `${host} ${target} ${group} packed subpath absent`,
            );
          assert.ok(
            graph.some((file) => file.includes("/@starwind-ui/runtime/dist/")),
            `${host} ${target} Runtime packed dist absent`,
          );
          graphs[target] = graph;
        }
      }
      const componentRoot =
        host === "sveltekit"
          ? "src/lib/starwind"
          : host === "astro"
            ? "src/components/starwind-svelte"
            : "src/components/starwind";
      for (const group of REPRESENTATIVE_SVELTE_STYLED_ROOTS)
        assert.ok(
          modules.some((file) => file.startsWith(path.join(root, componentRoot, group) + path.sep)),
          `${host} command-installed ${group} source absent from build`,
        );
      assert.ok(
        modules.some((file) => file === path.join(root, "src/styles/starwind.css")),
        `${host} CLI-prepared stylesheet absent from build`,
      );
      if (host === "vite")
        assert.ok(
          modules.some((file) =>
            file.startsWith(path.join(root, "src/vendored/primitives/select") + path.sep),
          ),
          "Vendored Select absent from Vite build",
        );
      const tools: Record<string, string> = JSON.parse(
        await readFile(path.join(root, "host-tools.json"), "utf8"),
      );
      for (const entry of Object.values(tools)) assertConsumerPath(root, await realpath(entry));
      if (host === "astro") verifyAstroToolEntries(tools);
      return { modules, tools, packedRoots, graphs };
    },
  };
}
export async function runSvelteHost(options: {
  host: string;
  repoRoot?: string;
  output?: string;
  steps?: HostSteps;
  packed?: Packed[];
  capabilityPath?: string;
  log?: (message: string) => void;
}) {
  const host = selectHost(options.host);
  const repoRoot = await realpath(options.repoRoot ?? process.cwd());
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), "starwind-svelte-host-")));
  assert.ok(!root.startsWith(repoRoot + path.sep));
  const steps = options.steps ?? defaultSteps(repoRoot, host, options.capabilityPath);
  const log = options.log ?? console.log;
  let server: Server | undefined;
  let failure: unknown;
  const evidence: Record<string, unknown> = {
    host,
    root,
    baseline: svelteBaselineScope(),
    node: process.version,
    platform: process.platform,
    startedAt: new Date().toISOString(),
    status: "failed",
  };
  try {
    log(
      options.packed
        ? "Reusing prepared Runtime, Svelte, and CLI packages"
        : "Building and packing Runtime, Svelte, and CLI",
    );
    const packed = options.packed ?? (await steps.pack(root));
    evidence.packed = packed;
    log("Installing isolated host tools and exact tarballs");
    await steps.install(root, packed);
    log(
      options.capabilityPath
        ? "Initializing and delivering through source command APIs"
        : "Initializing and delivering through the consumer-installed CLI",
    );
    if (steps.commands) evidence.commands = await steps.commands(root, packed);
    evidence.provenance = await steps.provenance(root, packed);
    log("Building production host and checking browser lifecycle");
    server = await steps.start(root);
    evidence.buildModules = await steps.buildProvenance(root);
    evidence.browser = await steps.browser(server);
    evidence.status = "passed";
  } catch (error) {
    failure = error;
    evidence.error = String(error);
  } finally {
    for (const [key, filename] of [
      ["commands", "command-evidence.json"],
      ["commandOutput", "command-output.log"],
    ]) {
      try {
        const content = await readFile(path.join(root, filename!), "utf8");
        evidence[key!] = key === "commands" ? JSON.parse(content) : content;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
          failure ??= error;
          evidence.status = "failed";
          evidence.error = String(error);
        }
      }
    }
    try {
      await server?.close();
    } catch (error) {
      failure ??= error;
      evidence.error = String(error);
      evidence.status = "failed";
    }
    try {
      await rm(root, { recursive: true, force: true });
      evidence.cleaned = true;
    } catch (error) {
      failure ??= error;
      evidence.cleanupError = String(error);
      evidence.cleaned = false;
      evidence.status = "failed";
    }
  }
  const output =
    options.output ??
    path.join(await mkdtemp(path.join(os.tmpdir(), "starwind-svelte-host-report-")), "report.json");
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(evidence, null, 2));
  log(`Host evidence: ${output}`);
  if (failure)
    throw new Error(`Packed ${host} host failed. Evidence: ${output}`, { cause: failure });
  return evidence;
}
/** Generate one private command capability without changing public registry artifacts. */
export async function prepareSvelteCommandCapability(
  repoRoot: string,
  root: string,
): Promise<string> {
  const { buildRuntimeRegistry, buildPrimitiveVendoringArtifacts, createCliRegistryBuildPolicy } =
    await import("./generate-cli-registry.js");
  const { svelteFrameworkAdapterTarget } =
    await import("./renderers/framework-adapters/svelte/index.js");
  const targetPolicy = createCliRegistryBuildPolicy([svelteFrameworkAdapterTarget]);
  const npmExecpath = process.env.npm_execpath;
  // pnpm 11 supplies a native executable here; the existing formatter's fallback invokes pnpm.
  delete process.env.npm_execpath;
  try {
    const registry = await buildRuntimeRegistry({ repoRoot, targetPolicy });
    const artifacts = await buildPrimitiveVendoringArtifacts({ repoRoot, targetPolicy });
    const manifest = JSON.parse(
      await readFile(
        path.join(repoRoot, "packages/cli/registry/styled-component-versions.json"),
        "utf8",
      ),
    );
    manifest.components.select = manifest.components.select.replace(/\d+$/, (patch: string) =>
      String(Number(patch) + 1),
    );
    const versionManifestPath = path.join(root, "behavior-versions.json");
    await writeFile(versionManifestPath, JSON.stringify(manifest));
    const behaviorRegistry = await buildRuntimeRegistry({
      repoRoot,
      targetPolicy,
      versionManifestPath,
    });
    const capabilityPath = path.join(root, "private-command-capability.json");
    await writeFile(
      capabilityPath,
      JSON.stringify({
        registry,
        artifacts,
        behaviorRegistry,
        roots: REPRESENTATIVE_SVELTE_STYLED_ROOTS,
      }),
    );
    return capabilityPath;
  } finally {
    if (npmExecpath === undefined) delete process.env.npm_execpath;
    else process.env.npm_execpath = npmExecpath;
  }
}

/** Prepare one package pair for an explicitly selected set of hosts. */
export async function runSvelteHosts(options: {
  hosts: readonly string[];
  repoRoot?: string;
  outputDirectory?: string;
  singleOutput?: string;
  packsDirectory?: string;
  pack?: HostSteps["pack"];
  runHost?: typeof runSvelteHost;
  prepareCapability?: typeof prepareSvelteCommandCapability;
}) {
  const hosts = [...new Set(options.hosts.map(selectHost))];
  assert.ok(hosts.length, "Select at least one host.");
  const repoRoot = await realpath(options.repoRoot ?? process.cwd());
  const root = await mkdtemp(path.join(os.tmpdir(), "starwind-svelte-packs-"));
  try {
    const packed = options.packsDirectory
      ? await readPublicSveltePacks(
          await realpath(options.packsDirectory),
          path.join(root, "inspected-packs"),
        )
      : await (options.pack ?? defaultSteps(repoRoot, "vite").pack)(root);
    const capabilityPath = options.prepareCapability
      ? await options.prepareCapability(repoRoot, root)
      : undefined;
    const reports = [];
    for (const host of hosts)
      reports.push(
        await (options.runHost ?? runSvelteHost)({
          host,
          repoRoot,
          packed,
          capabilityPath,
          output:
            hosts.length === 1 && options.singleOutput
              ? options.singleOutput
              : options.outputDirectory
                ? path.join(options.outputDirectory, `${host}.json`)
                : undefined,
        }),
      );
    return reports;
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

if (process.argv[1]?.endsWith("check-svelte-hosts.ts")) {
  const args = process.argv.slice(2);
  const host = args.find((arg) => arg.startsWith("--host="))?.slice(7);
  const hosts = args.find((arg) => arg.startsWith("--hosts="))?.slice(8);
  const output = args.find((arg) => arg.startsWith("--output="))?.slice(9);
  const packsDirectory = args.find((arg) => arg.startsWith("--packs="))?.slice(8);
  if (hosts) {
    assert.equal(host, undefined, "Use either --host or --hosts.");
    await runSvelteHosts({ hosts: hosts.split(","), outputDirectory: output, packsDirectory });
  } else if (packsDirectory) {
    await runSvelteHosts({
      hosts: [host ?? ""],
      singleOutput: output,
      packsDirectory,
    });
  } else await runSvelteHost({ host: host ?? "", output });
}
