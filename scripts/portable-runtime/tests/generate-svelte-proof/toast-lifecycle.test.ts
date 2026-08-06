import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";
import { compile } from "svelte/compiler";
import { render } from "svelte/server";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { chromium, type Browser } from "playwright";
import { createServer, type ViteDevServer } from "vite";

import { createSvelteComponentHeader } from "../../renderers/framework-adapters/svelte/primitive-package.js";
import { getPrimitiveGeneratorEntries } from "../../renderers/primitive-generator-registry.js";
import { createTsHeader } from "../../renderers/shared.js";

const temporaryRoots: string[] = [];
const servers: ViteDevServer[] = [];
const browsers: Browser[] = [];

afterEach(async () => {
  await Promise.all(browsers.splice(0).map((browser) => browser.close()));
  await Promise.all(servers.splice(0).map((server) => server.close()));
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
  );
});

describe("Svelte Toast notification-system proof", () => {
  it("generates every compiler-valid part and the Runtime service surface", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "starwind-svelte-toast-"));
    temporaryRoots.push(root);
    const entry = getPrimitiveGeneratorEntries().find(({ component }) => component === "toast");
    if (!entry) throw new Error("Toast Primitive generator entry is missing.");

    await entry.generateTarget({
      componentHeader: createSvelteComponentHeader("Svelte Toast proof"),
      moduleHeader: createTsHeader("Svelte Toast proof"),
      outputRoot: root,
      target: "svelte",
    });

    const directory = path.join(root, "toast");
    const files = (await readdir(directory)).sort();
    expect(files).toEqual(
      [
        "ToastAction.svelte",
        "ToastClose.svelte",
        "ToastContent.svelte",
        "ToastDescription.svelte",
        "ToastRoot.svelte",
        "ToastTemplate.svelte",
        "ToastTitle.svelte",
        "ToastTitleText.svelte",
        "ToastViewport.svelte",
        "index.ts",
      ].sort(),
    );

    const sources = new Map(
      await Promise.all(
        files.map(
          async (file): Promise<[string, string]> => [
            file,
            await readFile(path.join(directory, file), "utf8"),
          ],
        ),
      ),
    );
    for (const [file, source] of sources) {
      if (!file.endsWith(".svelte")) continue;
      for (const generate of ["client", "server"] as const) {
        expect(compile(source, { filename: file, generate, modernAst: true }).warnings).toEqual([]);
      }
    }

    const viewport = sources.get("ToastViewport.svelte")!;
    const template = sources.get("ToastTemplate.svelte")!;
    const index = sources.get("index.ts")!;
    const all = [...sources.values()].join("\n");
    expect(viewport).toContain("createToastManager");
    expect(viewport).toContain('import type { Attachment } from "svelte/attachments"');
    expect(viewport).toContain("manager.destroy()");
    expect(viewport).toContain("data-sw-toast-viewport");
    expect(template).toContain("data-sw-toast-template");
    expect(template).toContain("{@render children?.()}");
    expect(index).toContain('export { toast } from "@starwind-ui/runtime/toast"');
    expect(index).toContain("ToastPromiseOptions");
    expect(all).not.toMatch(/queue|setTimeout|pointermove\s*=>|componentName[^\n]*toast/i);
  });

  it("hydrates, routes across providers, runs services and timers, remounts, and cleans up", async () => {
    expect(globalThis).not.toHaveProperty("window");
    expect(globalThis).not.toHaveProperty("document");
    const root = await createBrowserHarness();
    const ssrServer = await createProofServer(root, true);
    servers.push(ssrServer);
    const appModule = await ssrServer.ssrLoadModule("/App.svelte");
    const first = render(appModule.default).body;
    expect(render(appModule.default).body).toBe(first);
    expect(first.match(/data-sw-toast-viewport=""/g)).toHaveLength(2);

    await writeFile(
      path.join(root, "index.html"),
      `<div id="app">${first}</div><script type="module" src="/main.ts"></script>`,
      "utf8",
    );
    const browserServer = await createProofServer(root, false);
    servers.push(browserServer);
    await browserServer.listen();
    const browser = await chromium.launch({ channel: "chrome", headless: true });
    browsers.push(browser);
    const page = await browser.newPage();
    const messages: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning") messages.push(message.text());
    });
    const url = browserServer.resolvedUrls?.local[0];
    if (!url) throw new Error("Svelte Toast proof server did not expose a local URL.");
    await page.goto(url);
    await page.waitForFunction(() => Boolean(document.documentElement.dataset.svelteToastResult), {
      timeout: 15_000,
    });
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.svelteToastResult ?? "{}"),
    );

    expect(messages.filter((message) => !message.includes("Failed to load resource"))).toEqual([]);
    expect(result.error).toBeUndefined();
    expect(result).toMatchObject({
      action: 1,
      close: 1,
      connects: 3,
      destroys: 3,
      hydrationExact: true,
      latestSecond: true,
      promiseVariant: "success",
      reactiveSnippetText: "After",
      reactiveTemplateAttribute: "after",
      reactiveVariantUpdated: true,
      remountedSecond: true,
      remove: 1,
      restoredFirst: true,
      rootsAfterUnmount: 0,
      timerRemoved: true,
      updated: "Updated",
    });
  }, 120_000);
});

async function createBrowserHarness(): Promise<string> {
  const root = await mkdtemp(path.join(process.cwd(), ".svelte-toast-browser-"));
  temporaryRoots.push(root);
  const toastRoot = path.join(root, "toast");
  await mkdir(toastRoot);
  for (const file of await readdir(path.join(process.cwd(), "packages/svelte/src/toast"))) {
    await copyFile(
      path.join(process.cwd(), "packages/svelte/src/toast", file),
      path.join(toastRoot, file),
    );
  }
  const runtime = path
    .join(process.cwd(), "packages/runtime/src/components/toast/toast.ts")
    .replaceAll("\\", "/");
  await writeFile(
    path.join(root, "runtime.ts"),
    `import { createToastManager as createActualToastManager } from "${runtime}";
const proof = globalThis.__toastLifecycle ??= { connects: 0, destroys: 0 };
export function createToastManager(viewport) {
  proof.connects += 1;
  const manager = createActualToastManager(viewport);
  let destroyed = false;
  return new Proxy(manager, { get(target, property) {
    const value = Reflect.get(target, property);
    if (property === "destroy") return () => { if (!destroyed) { destroyed = true; proof.destroys += 1; } return target.destroy(); };
    return typeof value === "function" ? value.bind(target) : value;
  }});
}
export { toast } from "${runtime}";
export type * from "${runtime}";
`,
    "utf8",
  );
  await writeFile(path.join(root, "App.svelte"), APP_SOURCE, "utf8");
  await writeFile(path.join(root, "main.ts"), MAIN_SOURCE, "utf8");
  return root;
}

async function createProofServer(root: string, middlewareMode: boolean): Promise<ViteDevServer> {
  return createServer({
    appType: middlewareMode ? "custom" : "spa",
    configFile: false,
    logLevel: "silent",
    plugins: [svelte()],
    resolve: { alias: { "@starwind-ui/runtime/toast": path.join(root, "runtime.ts") } },
    root,
    server: middlewareMode
      ? { middlewareMode: true }
      : { host: "127.0.0.1", port: 0, strictPort: false },
  });
}

const APP_SOURCE = String.raw`<script lang="ts">
  import { ToastAction, ToastClose, ToastContent, ToastDescription, ToastRoot, ToastTemplate, ToastTitle, ToastTitleText, ToastViewport, toast } from "./toast/index";
  let showSecond = $state(true);
  let reactiveAttribute = $state("before");
  let reactiveText = $state("Before");
  let reactiveVariant = $state<"info" | "warning">("info");
  const callbacks = (globalThis as any).__toastCallbacks ??= { action: 0, close: 0, remove: 0 };
  export function createLatest() { return toast({ action: { label: "Undo", onClick: () => callbacks.action += 1 }, description: "Created", duration: 0, onClose: () => callbacks.close += 1, onRemove: () => callbacks.remove += 1, title: "Latest" }); }
  export function updateToast(id: string) { toast.update(id, { title: "Updated" }); }
  export async function runPromise() { await toast.promise(Promise.resolve("done"), { loading: "Loading", success: "Success", error: "Error" }); }
  export function removeSecond() { showSecond = false; }
  export function restoreSecond() { showSecond = true; }
  export function createTimer() { return toast("Timer", { duration: 30 }); }
  export function updateReactiveTemplate() { reactiveAttribute = "after"; reactiveText = "After"; reactiveVariant = "warning"; }
  export function createReactive() { return toast({ duration: 0, title: "Reactive", variant: "warning" }); }
</script>

<ToastViewport data-provider="first" duration={30}>
  {#each ["default", "loading", "success"] as variant (variant)}
    <ToastTemplate {variant}><ToastRoot><ToastContent><ToastTitle><ToastTitleText /></ToastTitle><ToastDescription /><ToastAction /><ToastClose>Close</ToastClose></ToastContent></ToastRoot></ToastTemplate>
  {/each}
</ToastViewport>
{#if showSecond}<ToastViewport data-provider="second" duration={30}>
  {#each ["default", "loading", "success"] as variant (variant)}
    <ToastTemplate {variant}><ToastRoot><ToastContent><ToastTitle><ToastTitleText /></ToastTitle><ToastDescription /><ToastAction /><ToastClose>Close</ToastClose></ToastContent></ToastRoot></ToastTemplate>
  {/each}
  <ToastTemplate variant={reactiveVariant} data-template-proof={reactiveAttribute}><ToastRoot><ToastContent><span data-reactive-content>{reactiveText}</span><ToastTitle><ToastTitleText /></ToastTitle><ToastDescription /><ToastClose>Close</ToastClose></ToastContent></ToastRoot></ToastTemplate>
</ToastViewport>{/if}
`;

const MAIN_SOURCE = String.raw`import { flushSync, hydrate, unmount } from "svelte";
import App from "./App.svelte";
const tick = async (ms = 0) => { flushSync(); await new Promise((resolve) => setTimeout(resolve, ms)); flushSync(); };
void (async () => { try {
  const target = document.querySelector("#app");
  const before = target.querySelectorAll("[data-sw-toast-viewport]").length;
  const instance = hydrate(App, { target }); await tick();
  const after = target.querySelectorAll("[data-sw-toast-viewport]").length;
  const id = instance.createLatest(); await tick();
  const latestSecond = Boolean(target.querySelector('[data-provider="second"] [data-toast-id="' + id + '"]'));
  instance.updateToast(id); await tick();
  const updated = target.querySelector('[data-toast-id="' + id + '"] [data-sw-toast-title-text]')?.textContent;
  target.querySelector('[data-toast-id="' + id + '"] [data-sw-toast-action]')?.click(); await tick(210);
  await instance.runPromise(); await tick();
  const promiseVariant = target.querySelector('[data-provider="second"] [data-variant="success"]')?.getAttribute("data-variant");
  instance.updateReactiveTemplate(); await tick();
  const reactiveTemplate = target.querySelector('template[data-sw-toast-template="warning"]');
  const reactiveTemplateAttribute = reactiveTemplate?.getAttribute("data-template-proof");
  const reactiveVariantUpdated = !target.querySelector('template[data-sw-toast-template="info"]');
  const reactive = instance.createReactive(); await tick();
  const reactiveSnippetText = target.querySelector('[data-toast-id="' + reactive + '"] [data-reactive-content]')?.textContent;
  instance.removeSecond(); await tick();
  const restored = instance.createLatest(); await tick();
  const restoredFirst = Boolean(target.querySelector('[data-provider="first"] [data-toast-id="' + restored + '"]'));
  const timer = instance.createTimer(); await tick(250);
  const timerRemoved = !target.querySelector('[data-toast-id="' + timer + '"]');
  instance.restoreSecond(); await tick();
  const remounted = instance.createLatest(); await tick();
  const remountedSecond = Boolean(target.querySelector('[data-provider="second"] [data-toast-id="' + remounted + '"]'));
  const callbacks = { ...globalThis.__toastCallbacks };
  await unmount(instance); await tick();
  const lifecycle = globalThis.__toastLifecycle;
  document.documentElement.dataset.svelteToastResult = JSON.stringify({ ...callbacks, ...lifecycle, hydrationExact: before === after, latestSecond, promiseVariant, reactiveSnippetText, reactiveTemplateAttribute, reactiveVariantUpdated, remountedSecond, restoredFirst, rootsAfterUnmount: target.querySelectorAll("[data-sw-toast-viewport]").length, timerRemoved, updated });
} catch (error) { document.documentElement.dataset.svelteToastResult = JSON.stringify({ error: error instanceof Error ? error.stack : String(error) }); } })();
`;
