import { copyFile, mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { svelte } from "@sveltejs/vite-plugin-svelte";
import { type Browser, chromium } from "playwright";
import { render } from "svelte/server";
import { createServer, type ViteDevServer } from "vite";
import { afterEach, describe, expect, it } from "vitest";

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

describe("generated Svelte Dialog lifecycle", () => {
  it("preserves Dialog ownership across hydration, cancellation, recreation, nesting, remounts, and cleanup", async () => {
    expect(globalThis).not.toHaveProperty("window");
    expect(globalThis).not.toHaveProperty("document");
    const root = await createHarness();
    const ssrServer = await createProofServer(root, true);
    servers.push(ssrServer);
    const appModule = await ssrServer.ssrLoadModule("/App.svelte");
    const [firstRender, secondRender] = await Promise.all([
      Promise.resolve(render(appModule.default).body),
      Promise.resolve(render(appModule.default).body),
    ]);
    expect(secondRender).toBe(firstRender);
    expect(firstRender).toContain("data-sw-dialog");
    expect(firstRender).toContain("<dialog");
    expect(globalThis).not.toHaveProperty("window");
    expect(globalThis).not.toHaveProperty("document");

    await writeFile(
      path.join(root, "index.html"),
      `<button id="outside">Outside</button><div id="app">${firstRender}</div><script type="module" src="/main.ts"></script>`,
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
    if (!url) throw new Error("Svelte Dialog proof server did not expose a local URL.");
    await page.goto(url);
    await page.waitForFunction(
      () => document.documentElement.dataset.svelteDialogResult,
      undefined,
      {
        timeout: 20_000,
      },
    );
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.svelteDialogResult ?? "{}"),
    );

    expect(messages.filter((message) => !message.includes("Failed to load resource"))).toEqual([]);
    expect(result.error).toBeUndefined();
    expect(result).toMatchObject({
      canceled: { binding: false, callbackSawPreviousBinding: true, open: false },
      accepted: { binding: true, focused: true, open: true, scrollLocked: false },
      simultaneous: {
        binding: false,
        closeComplete: 0,
        focusedOutside: true,
        open: false,
        modal: "true",
        sawStaleFocus: false,
        sawStaleLock: false,
        scrollLocked: false,
      },
      external: {
        close: {
          binding: false,
          callbackCountDelta: 0,
          closeComplete: 1,
          closeCompleteSawCommitted: true,
          open: false,
          order: ["binding:false", "dom:false", "closeComplete"],
          setterDelta: 1,
        },
        open: {
          binding: true,
          callbackCountDelta: 0,
          focused: true,
          open: true,
          scrollLocked: true,
          setterDelta: 1,
        },
      },
      escaped: {
        binding: false,
        closeComplete: 2,
        focusReturned: true,
        open: false,
        scrollLocked: false,
      },
      uncontrolled: { opened: true, outsideClosed: true },
      isolation: { nestedAfterEscape: false, parentAfterEscape: true, siblingOpen: true },
      remount: {
        conditionalAfterRemoval: 0,
        conditionalAfterRemount: 1,
        conditionalBeforeRemoval: 1,
        nestedAfterRemoval: 1,
        nestedAfterRemount: 1,
        nestedBeforeRemoval: 1,
      },
      hydrationExact: true,
      rootsAfterUnmount: 0,
      scrollLockedAfterUnmount: false,
    });
    expect(result.lifecycle.connects).toBe(7);
    expect(result.lifecycle.destroys).toBe(7);
    expect(result.lifecycle.setOpenEmitFalse).toBeGreaterThanOrEqual(2);
  }, 120_000);
});

async function createHarness(): Promise<string> {
  const root = await mkdtemp(path.join(process.cwd(), ".svelte-dialog-browser-"));
  temporaryRoots.push(root);
  await mkdir(path.join(root, "_internal"));
  await copyFile(
    path.join(process.cwd(), "packages/svelte/src/_internal/ref-attachment.ts"),
    path.join(root, "_internal/ref-attachment.ts"),
  );
  const dialogRoot = path.join(root, "dialog");
  await mkdir(dialogRoot);
  for (const file of await readdir(path.join(process.cwd(), "packages/svelte/src/dialog"))) {
    await copyFile(
      path.join(process.cwd(), "packages/svelte/src/dialog", file),
      path.join(dialogRoot, file),
    );
  }
  const runtime = path
    .join(process.cwd(), "packages/runtime/src/components/dialog/dialog.ts")
    .replaceAll("\\", "/");
  await writeFile(
    path.join(root, "runtime.ts"),
    `import { createDialog as createActualDialog } from "${runtime}";
const proof = globalThis.__dialogLifecycle ??= { connects: 0, destroys: 0, setOpenEmitFalse: 0 };
export function createDialog(root, options) {
  proof.connects += 1;
  const instance = createActualDialog(root, options);
  let destroyed = false;
  return new Proxy(instance, { get(target, property) {
    const value = Reflect.get(target, property);
    if (property === "destroy") return () => { if (!destroyed) { destroyed = true; proof.destroys += 1; } return target.destroy(); };
    if (property === "setOpen") return (...args) => { if (args[1]?.emit === false) proof.setOpenEmitFalse += 1; return target.setOpen(...args); };
    return typeof value === "function" ? value.bind(target) : value;
  }});
}
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
    // Concurrent proof servers must own their optimized dependencies.
    cacheDir: path.join(root, middlewareMode ? ".vite-ssr" : ".vite-browser"),
    configFile: false,
    logLevel: "silent",
    plugins: [svelte()],
    resolve: { alias: { "@starwind-ui/runtime/dialog": path.join(root, "runtime.ts") } },
    root,
    server: middlewareMode
      ? { middlewareMode: true, watch: null, hmr: false }
      : { host: "127.0.0.1", port: 0, strictPort: false, watch: null, hmr: false },
  });
}

const APP_SOURCE = String.raw`<script lang="ts">
  import { DialogBackdrop, DialogClose, DialogDescription, DialogPopup, DialogRoot, DialogTitle, DialogTrigger } from "./dialog/index";
  let controlled = $state(false);
  let cancel = $state(true);
  let modal = $state(false);
  let closeOnEscape = $state(true);
  let showConditional = $state(true);
  let closeComplete = $state(0);
  let closeCompleteSawCommitted = $state(false);
  let closeCompleteOrder = $state<string[]>([]);
  let callbackSawPreviousBinding = $state(false);
  let openChangeCount = $state(0);
  let controlledPopup = $state<HTMLDialogElement | null>(null);
  function onOpenChange(next, detail) { openChangeCount += 1; callbackSawPreviousBinding = controlled === detail.previousOpen; if (cancel) detail.cancel(); }
  function onCloseComplete() { closeComplete += 1; closeCompleteSawCommitted = controlled === false && controlledPopup?.open === false; closeCompleteOrder = ["binding:" + controlled, "dom:" + controlledPopup?.open, "closeComplete"]; }
  export function accept() { cancel = false; }
  export function closeAndMakeModal() { controlled = false; modal = true; }
  export function setControlled(next) { controlled = next; }
  export function hideConditional() { showConditional = false; }
  export function showConditionalAgain() { showConditional = true; }
  export function snapshot() { return { callbackSawPreviousBinding, closeComplete, closeCompleteOrder, closeCompleteSawCommitted, controlled, openChangeCount }; }
</script>

<DialogRoot bind:open={controlled} {modal} {closeOnEscape} onOpenChange={onOpenChange} onCloseComplete={onCloseComplete} data-case="controlled">
  <DialogTrigger data-trigger="controlled">Open controlled</DialogTrigger><DialogBackdrop data-backdrop="controlled" />
  <DialogPopup data-popup="controlled" ref={(element) => controlledPopup = element}><DialogTitle>Controlled</DialogTitle><DialogDescription>Description</DialogDescription><input data-input="controlled" /><DialogClose>Close</DialogClose>
    <DialogRoot data-case="nested"><DialogTrigger data-trigger="nested">Open nested</DialogTrigger><DialogBackdrop /><DialogPopup data-popup="nested"><DialogTitle>Nested</DialogTitle><DialogClose>Close nested</DialogClose></DialogPopup></DialogRoot>
  </DialogPopup>
</DialogRoot>

<DialogRoot data-case="uncontrolled"><DialogTrigger data-trigger="uncontrolled">Open uncontrolled</DialogTrigger><DialogBackdrop data-backdrop="uncontrolled" /><DialogPopup data-popup="uncontrolled"><DialogTitle>Uncontrolled</DialogTitle><DialogClose>Close</DialogClose></DialogPopup></DialogRoot>
<DialogRoot data-case="sibling"><DialogTrigger data-trigger="sibling">Open sibling</DialogTrigger><DialogBackdrop /><DialogPopup data-popup="sibling"><DialogTitle>Sibling</DialogTitle><DialogClose>Close</DialogClose></DialogPopup></DialogRoot>
{#if showConditional}<div data-conditional><DialogRoot><DialogTrigger>Conditional</DialogTrigger><DialogBackdrop /><DialogPopup><DialogTitle>Conditional</DialogTitle><DialogClose>Close</DialogClose></DialogPopup></DialogRoot></div>{/if}
`;

const MAIN_SOURCE = String.raw`import { flushSync, hydrate, unmount } from "svelte";
import App from "./App.svelte";
const query = (selector) => document.querySelector(selector);
const tick = async () => { flushSync(); await new Promise((resolve) => setTimeout(resolve, 0)); flushSync(); };
const waitForClosed = async (selector) => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    flushSync();
    if (!query(selector).open) return;
  }
  throw new Error("Dialog did not reach its closed state: " + selector);
};
const escape = () => document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
void (async () => { try {
  const target = query("#app");
  const beforeParts = Array.from(target.querySelectorAll("[data-sw-part]")).map((node) => node.getAttribute("data-sw-part")).join("|");
  const instance = hydrate(App, { target }); await tick();
  query("#outside").focus();
  const afterParts = Array.from(target.querySelectorAll("[data-sw-part]")).map((node) => node.getAttribute("data-sw-part")).join("|");
  query('[data-trigger="controlled"]').click(); await tick();
  let snapshot = instance.snapshot();
  const canceled = { binding: snapshot.controlled, callbackSawPreviousBinding: snapshot.callbackSawPreviousBinding, open: query('[data-popup="controlled"]').open };
  instance.accept(); query('[data-trigger="controlled"]').click(); await tick();
  snapshot = instance.snapshot();
  const accepted = { binding: snapshot.controlled, focused: document.activeElement === query('[data-input="controlled"]'), open: query('[data-popup="controlled"]').open, scrollLocked: document.body.hasAttribute("data-sw-scroll-locked") };
  query("#outside").focus();
  const stale = { focus: false, lock: false };
  const focusListener = (event) => { if (event.target === query('[data-input="controlled"]')) stale.focus = true; };
  document.addEventListener("focusin", focusListener);
  const lockObserver = new MutationObserver(() => { if (document.body.hasAttribute("data-sw-scroll-locked")) stale.lock = true; });
  lockObserver.observe(document.body, { attributes: true, attributeFilter: ["data-sw-scroll-locked"] });
  instance.closeAndMakeModal(); await waitForClosed('[data-popup="controlled"]');
  lockObserver.disconnect(); document.removeEventListener("focusin", focusListener);
  snapshot = instance.snapshot();
  const simultaneous = { binding: snapshot.controlled, closeComplete: snapshot.closeComplete, focusedOutside: document.activeElement === query("#outside"), open: query('[data-popup="controlled"]').open, modal: query('[data-popup="controlled"]').getAttribute("aria-modal"), sawStaleFocus: stale.focus, sawStaleLock: stale.lock, scrollLocked: document.body.hasAttribute("data-sw-scroll-locked") };
  const externalOpenBefore = { callbacks: snapshot.openChangeCount, setters: globalThis.__dialogLifecycle.setOpenEmitFalse };
  instance.setControlled(true); await tick(); snapshot = instance.snapshot();
  const externalOpen = { binding: snapshot.controlled, callbackCountDelta: snapshot.openChangeCount - externalOpenBefore.callbacks, focused: document.activeElement === query('[data-input="controlled"]'), open: query('[data-popup="controlled"]').open, scrollLocked: document.body.hasAttribute("data-sw-scroll-locked"), setterDelta: globalThis.__dialogLifecycle.setOpenEmitFalse - externalOpenBefore.setters };
  const externalCloseBefore = { callbacks: snapshot.openChangeCount, setters: globalThis.__dialogLifecycle.setOpenEmitFalse };
  instance.setControlled(false); await waitForClosed('[data-popup="controlled"]'); snapshot = instance.snapshot();
  const externalClose = { binding: snapshot.controlled, callbackCountDelta: snapshot.openChangeCount - externalCloseBefore.callbacks, closeComplete: snapshot.closeComplete, closeCompleteSawCommitted: snapshot.closeCompleteSawCommitted, open: query('[data-popup="controlled"]').open, order: snapshot.closeCompleteOrder, setterDelta: globalThis.__dialogLifecycle.setOpenEmitFalse - externalCloseBefore.setters };
  query('[data-trigger="controlled"]').click(); await tick();
  escape(); await waitForClosed('[data-popup="controlled"]');
  snapshot = instance.snapshot();
  const escaped = { binding: snapshot.controlled, closeComplete: snapshot.closeComplete, focusReturned: document.activeElement === query("#outside"), open: query('[data-popup="controlled"]').open, scrollLocked: document.body.hasAttribute("data-sw-scroll-locked") };
  query('[data-trigger="uncontrolled"]').click(); await tick();
  const uncontrolledOpened = query('[data-popup="uncontrolled"]').open;
  query('[data-backdrop="uncontrolled"]').click(); await waitForClosed('[data-popup="uncontrolled"]');
  const uncontrolled = { opened: uncontrolledOpened, outsideClosed: !query('[data-popup="uncontrolled"]').open };
  query('[data-trigger="sibling"]').click(); await tick(); query('[data-trigger="controlled"]').click(); await tick(); query('[data-trigger="nested"]').click(); await tick();
  escape(); await waitForClosed('[data-popup="nested"]');
  const isolation = { nestedAfterEscape: query('[data-popup="nested"]').open, parentAfterEscape: query('[data-popup="controlled"]').open, siblingOpen: query('[data-popup="sibling"]').open };
  const conditionalBeforeRemoval = target.querySelectorAll('[data-conditional] [data-sw-dialog]').length;
  const nestedBeforeRemoval = target.querySelectorAll('[data-case="nested"]').length;
  instance.hideConditional(); await tick();
  const conditionalAfterRemoval = target.querySelectorAll('[data-conditional] [data-sw-dialog]').length;
  const nestedAfterRemoval = target.querySelectorAll('[data-case="nested"]').length;
  instance.showConditionalAgain(); await tick();
  const conditionalAfterRemount = target.querySelectorAll('[data-conditional] [data-sw-dialog]').length;
  const nestedAfterRemount = target.querySelectorAll('[data-case="nested"]').length;
  const lifecycle = globalThis.__dialogLifecycle;
  await unmount(instance); await tick();
  document.documentElement.dataset.svelteDialogResult = JSON.stringify({ accepted, canceled, escaped, external: { close: externalClose, open: externalOpen }, hydrationExact: beforeParts === afterParts, isolation, lifecycle, simultaneous, remount: { conditionalAfterRemoval, conditionalAfterRemount, conditionalBeforeRemoval, nestedAfterRemoval, nestedAfterRemount, nestedBeforeRemoval }, rootsAfterUnmount: target.querySelectorAll("[data-sw-dialog]").length, scrollLockedAfterUnmount: document.body.hasAttribute("data-sw-scroll-locked"), uncontrolled });
} catch (error) { document.documentElement.dataset.svelteDialogResult = JSON.stringify({ error: error instanceof Error ? error.stack : String(error) }); } })();
`;

async function runDialogModel(config: Record<string, unknown>, actions: string): Promise<any> {
  const directory = await createHarness();
  await writeFile(
    path.join(directory, "App.svelte"),
    DIALOG_MODEL_SOURCE.replace("CONFIG", JSON.stringify(config)),
    "utf8",
  );
  const ssr = await createProofServer(directory, true);
  servers.push(ssr);
  const appModule = await ssr.ssrLoadModule("/App.svelte");
  const renderer = await ssr.ssrLoadModule("svelte/server");
  const markup = renderer.render(appModule.default).body;
  await writeFile(
    path.join(directory, "index.html"),
    `<link rel="icon" href="data:,"><button id="outside" autofocus>Outside</button><div id="app">${markup}</div><script type="module" src="/main.ts"></script>`,
    "utf8",
  );
  await writeFile(
    path.join(directory, "main.ts"),
    `import { hydrate, flushSync, tick, unmount } from "svelte";
import App from "./App.svelte";
try {
 const outside = document.querySelector("#outside"); outside.focus();
 const effects = { focus: 0, lock: 0 };
 document.addEventListener("focusin", (event) => { if (event.target?.matches?.("[data-input]")) effects.focus++; });
 const observer = new MutationObserver(() => { if(document.body.hasAttribute("data-sw-scroll-locked")) effects.lock++; });
 observer.observe(document.body, { attributes: true, attributeFilter: ["data-sw-scroll-locked"] });
 const app = hydrate(App, { target: document.querySelector("#app") });
 const settle = async () => { flushSync(); await tick(); flushSync(); };
 const finish = async () => { for(let i=0;i<8;i++){ await new Promise(requestAnimationFrame); await settle(); } };
 const popup = () => document.querySelector("[data-popup]");
 const state = () => ({ ...app.snapshot(), native: popup()?.open ?? null, rendered: document.querySelector("[data-rendered]")?.textContent ?? null, modal: popup()?.getAttribute("aria-modal") ?? null, connections: globalThis.__dialogLifecycle.connects, effects: {...effects} });
 const click = () => document.querySelector("[data-trigger]")?.click();
 const close = () => document.querySelector("[data-close]")?.click();
 await settle();
 const result = await (async () => { ${actions} })();
 await unmount(app); await finish(); observer.disconnect();
 document.documentElement.dataset.svelteDialogResult = JSON.stringify({...result, cleanup: globalThis.__dialogLifecycle, locked: document.body.hasAttribute("data-sw-scroll-locked") });
} catch(error) { document.documentElement.dataset.svelteDialogResult = JSON.stringify({ error: String(error), stack: error.stack }); }`,
    "utf8",
  );
  const server = await createProofServer(directory, false);
  servers.push(server);
  await server.listen();
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  browsers.push(browser);
  const page = await browser.newPage();
  const messages: string[] = [];
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) messages.push(message.text());
  });
  page.on("pageerror", (error) => messages.push(error.message));
  const pageFailure = new Promise<never>((_, reject) => {
    page.on("pageerror", reject);
    page.on("requestfailed", (request) =>
      reject(new Error(`${request.url()}: ${request.failure()?.errorText}`)),
    );
    page.on("response", (response) => {
      if (response.status() >= 400)
        reject(new Error(`HTTP ${response.status()} ${response.statusText()}: ${response.url()}`));
    });
  });
  try {
    await Promise.race([
      (async () => {
        await page.goto(server.resolvedUrls!.local[0]!);
        await page.waitForFunction(() => document.documentElement.dataset.svelteDialogResult);
      })(),
      pageFailure,
    ]);
  } catch (error) {
    throw new Error(`Dialog model fixture ${JSON.stringify(config)} failed: ${String(error)}`);
  }
  const result = await page.evaluate(() =>
    JSON.parse(document.documentElement.dataset.svelteDialogResult ?? "{}"),
  );
  expect(messages).toEqual([]);
  expect(result).not.toHaveProperty("error");
  expect(result.cleanup.connects).toBe(result.cleanup.destroys);
  expect(result.locked).toBe(false);
  return { ...result, markup, cacheDirs: [ssr.config.cacheDir, server.config.cacheDir] };
}
const DIALOG_MODEL_SOURCE = String.raw`<script lang="ts">
import { flushSync } from "svelte";
import { DialogRoot, DialogPopup, DialogTrigger, DialogClose, DialogTitle } from "./dialog/index";
const config = CONFIG;
let model = $state<boolean | undefined>(config.initial);
let modal = $state(config.modal ?? false);
let escape = $state(true);
let shown = $state(true);
let triggerKey = $state(config.lateControls ? 0 : 1);
let closeKey = $state(config.lateControls ? 0 : 1);
const writes: boolean[] = [];
const callbacks: unknown[] = [];
const completions: unknown[] = [];
function proposal(next, detail) {
 callbacks.push({ next, previous: model ?? "undefined" });
 if (config.proposal?.startsWith("options")) { modal = !modal; escape = false; flushSync(); }
 if (config.proposal === "command-cancel") { model = true; flushSync(); detail.cancel(); }
 if (config.proposal === "two-commands") { model = true; flushSync(); model = false; flushSync(); }
 if (config.proposal?.endsWith("cancel")) detail.cancel();
 if (config.proposal === "unmount") { shown = false; flushSync(); }
}
function publish(next) { writes.push(next); if (config.setter === "invert") model = !next; else if (config.setter !== "retain") model = next; }
function complete() { completions.push({ model: model ?? "undefined", native: document.querySelector("[data-popup]")?.open }); }
export function setModel(next) { model = next; }
export function options() { modal = !modal; escape = !escape; }
export function hide() { shown = false; }
export function controls(trigger, close) { triggerKey = trigger; closeKey = close; }
export function snapshot() { return { model: model ?? "undefined", writes: [...writes], callbacks: [...callbacks], completions: [...completions] }; }
</script>
{#snippet parts(accepted)}
 <output data-rendered>{String(accepted)}</output>{#if triggerKey}{#key triggerKey}<DialogTrigger data-trigger>Open</DialogTrigger>{/key}{/if}
 <DialogPopup data-popup style="transition: opacity 40ms"><DialogTitle>Model</DialogTitle><input data-input />{#if closeKey}{#key closeKey}<DialogClose data-close>Close</DialogClose>{/key}{/if}</DialogPopup>
{/snippet}
{#if shown}
 {#if config.mode === "omitted"}<DialogRoot {modal} closeOnEscape={escape} defaultOpen={config.defaultOpen} onOpenChange={proposal} onCloseComplete={complete} children={parts} />
 {:else if config.mode === "plain"}<DialogRoot {modal} closeOnEscape={escape} open={model} defaultOpen={config.defaultOpen} onOpenChange={proposal} onCloseComplete={complete} children={parts} />
 {:else if config.mode === "bound"}<DialogRoot {modal} closeOnEscape={escape} bind:open={model} defaultOpen={config.defaultOpen} onOpenChange={proposal} onCloseComplete={complete} children={parts} />
 {:else}<DialogRoot {modal} closeOnEscape={escape} bind:open={() => model, publish} defaultOpen={config.defaultOpen} onOpenChange={proposal} onCloseComplete={complete} children={parts} />{/if}
{/if}
<output data-ssr>{model === undefined ? "undefined" : String(model)}:{writes.length}</output>`;

describe("Dialog accepted models", () => {
  it("keeps the native modal layer until close completion and releases it on unmount", async () => {
    const result = await runDialogModel(
      { initial: true, modal: true },
      `const initial = { native: popup().open, topLayer: popup().matches(":modal") };
      close(); flushSync();
      const pending = { ...state(), topLayer: popup().matches(":modal") };
      await finish();
      const completed = { ...state(), topLayer: popup().matches(":modal") };
      click(); await finish();
      const reopened = { native: popup().open, topLayer: popup().matches(":modal") };
      const retired = popup();
      app.hide(); flushSync(); await finish();
      const cancel = new Event("cancel", { cancelable: true });
      retired.dispatchEvent(cancel);
      return { initial, pending, completed, reopened, removed: { ...state(), topLayers: document.querySelectorAll(":modal").length, connected: retired.isConnected, canceled: cancel.defaultPrevented } };`,
    );
    expect(result).toMatchObject({
      initial: { native: true, topLayer: true },
      pending: { model: false, native: true, topLayer: true, writes: [false], completions: [] },
      completed: {
        model: false,
        native: false,
        topLayer: false,
        writes: [false],
        completions: [{ model: false, native: false }],
      },
      reopened: { native: true, topLayer: true },
      removed: {
        native: null,
        topLayers: 0,
        connected: false,
        canceled: false,
        writes: [false, true],
        callbacks: [
          { next: false, previous: true },
          { next: true, previous: false },
        ],
      },
    });
  }, 60_000);

  it("runs concurrent model fixtures without invalidating browser dependencies", async () => {
    const results = await Promise.all(
      ["plain", "bound"].map((mode) =>
        runDialogModel(
          { mode, defaultOpen: true },
          `const initial=state(); close(); await finish(); return {initial,closed:state()};`,
        ),
      ),
    );
    const cacheDirs = results.flatMap((result) => result.cacheDirs);
    expect(new Set(cacheDirs).size).toBe(cacheDirs.length);
    for (const result of results) {
      expect(result.initial).toMatchObject({ native: true, rendered: "true" });
      expect(result.closed).toMatchObject({ native: false, rendered: "false" });
    }
  }, 60_000);
  it("initializes omitted and undefined models and retains ordinary prop interactions", async () => {
    for (const mode of ["omitted", "plain", "bound", "function"]) {
      const result = await runDialogModel(
        { mode, defaultOpen: true },
        `const initial=state(); close(); await finish(); const closed=state(); app.setModel(undefined); await settle(); return {initial,closed,undefinedAgain:state()};`,
      );
      expect(result.markup).toContain("undefined:0");
      expect(result.initial).toMatchObject({ native: true, rendered: "true" });
      expect(result.closed).toMatchObject({ native: false, rendered: "false" });
      expect(result.undefinedAgain).toMatchObject({
        native: false,
        rendered: "false",
        connections: 1,
      });
      if (mode === "function") expect(result.closed.writes).toEqual([false]);
    }
  }, 120_000);
  it("publishes once and applies synchronous function binding readback", async () => {
    for (const setter of ["identity", "retain", "invert"]) {
      const result = await runDialogModel(
        { initial: false, setter },
        `click(); await finish(); return {accepted:state()};`,
      );
      expect(result.accepted).toMatchObject({
        writes: [true],
        model: setter === "identity",
        native: true,
        rendered: "true",
        connections: 1,
      });
      expect(result.accepted.callbacks).toEqual([{ next: true, previous: false }]);
    }
  }, 120_000);
  it("keeps cancellation and flushed parent commands independent of proposals", async () => {
    for (const proposal of ["cancel", "unmount"]) {
      const result = await runDialogModel(
        { initial: false, proposal },
        `click(); await finish(); return {accepted:state()};`,
      );
      expect(result.accepted.writes).toEqual([]);
      expect(result.accepted.native).toBe(proposal === "unmount" ? null : false);
    }
    const result = await runDialogModel(
      { initial: false },
      `document.querySelector("[data-sw-dialog]").addEventListener("starwind:open-change",e=>e.preventDefault()); click(); await finish(); return {accepted:state()};`,
    );
    expect(result.accepted).toMatchObject({ model: false, native: false, writes: [] });
  }, 120_000);
  it("constructs closed when a frozen open seed differs from accepted state", async () => {
    const result = await runDialogModel(
      { initial: false, defaultOpen: true, modal: true },
      `const initial=state(); app.options(); await finish(); return {initial,recreated:state()};`,
    );
    for (const snapshot of [result.initial, result.recreated])
      expect(snapshot).toMatchObject({
        model: false,
        native: false,
        writes: [],
        completions: [],
        effects: { focus: 0, lock: 0 },
      });
    expect(result.recreated.connections).toBe(2);
  }, 120_000);
  it("preserves a newer open command through pending close and unmount cleanup", async () => {
    const result = await runDialogModel(
      { initial: true },
      `close(); flushSync(); app.options(); app.setModel(true); await settle(); await finish(); const reopened=state(); close(); flushSync(); app.hide(); await finish(); return {reopened,removed:state()};`,
    );
    expect(result.reopened).toMatchObject({
      model: true,
      native: true,
      writes: [false],
      completions: [],
      connections: 2,
    });
    expect(result.removed).toMatchObject({ native: null, writes: [false, false], completions: [] });
  }, 120_000);
});
