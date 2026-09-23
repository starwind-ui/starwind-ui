import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { build, preview } from "vite";

/** Mount the actual layout in an isolated production entry so its teardown can be observed. */
export async function verifyThemeLayoutLifecycle(browser, appRoot) {
  const root = await mkdtemp(path.join(appRoot, "tests/.theme-lifecycle-"));
  let server;
  let context;
  try {
    await writeFile(
      path.join(root, "index.html"),
      '<link rel="icon" href="data:,"><div id="app"></div><script type="module" src="/main.js"></script>',
    );
    await writeFile(path.join(root, "App.svelte"), APP);
    await writeFile(
      path.join(root, "main.js"),
      `import { mount, tick, flushSync, unmount } from "svelte"; import App from "./App.svelte";
const app = mount(App, { target: document.getElementById("app") });
const settle = async () => { flushSync(); await tick(); flushSync(); };
await settle();
window.themeFixture = { app, settle, dispose: async () => { await unmount(app); await settle(); } };`,
    );
    const config = {
      root,
      configFile: false,
      plugins: [tailwindcss(), svelte({ configFile: false })],
      resolve: { alias: { $lib: path.join(appRoot, "src/lib") }, dedupe: ["svelte"] },
      logLevel: "error",
    };
    await build(config);
    server = await preview({ ...config, preview: { host: "127.0.0.1", port: 0 } });
    const address = server.httpServer.address();
    assert.ok(address && typeof address === "object");
    context = await browser.newContext({ colorScheme: "light" });
    await context.addInitScript(() => {
      window.themeSignals = [];
      const add = EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener = function (type, listener, options) {
        if (
          options?.signal &&
          ((this === window && type === "storage") ||
            (this === document && type === "starwind:theme-change") ||
            (this instanceof MediaQueryList && type === "change"))
        ) {
          window.themeSignals.push({ type, signal: options.signal });
        }
        return add.call(this, type, listener, options);
      };
    });
    const page = await context.newPage();
    const diagnostics = [];
    page.on("pageerror", (error) => diagnostics.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) diagnostics.push(message.text());
    });
    await page.goto(`http://127.0.0.1:${address.port}`);
    await page.waitForFunction(() => window.themeFixture);
    const result = await page.evaluate(async () => {
      const { app, settle, dispose } = window.themeFixture;
      const original = document.getElementById("observed-toggle");
      const before = app.snapshot();
      app.changeClass();
      await settle();
      const afterClass = app.snapshot();
      app.replaceOwners();
      await settle();
      const afterReplace = app.snapshot();
      const sameNode = original === document.getElementById("observed-toggle");
      original.click();
      await settle();
      const clickCount = app.snapshot().clicks;
      app.hide();
      await settle();
      const afterHide = app.snapshot();
      const header = document.querySelector('[aria-label="Toggle page theme"]');
      const wasDark = document.documentElement.classList.contains("dark");
      header.click();
      await settle();
      const stillUsable = document.documentElement.classList.contains("dark") !== wasDark;
      app.show();
      await settle();
      const remounted = document.getElementById("observed-toggle");
      const synchronized =
        remounted.getAttribute("aria-pressed") === header.getAttribute("aria-pressed");
      const liveSignals = window.themeSignals.map(({ type, signal }) => ({
        type,
        aborted: signal.aborted,
      }));
      await dispose();
      const afterDispose = app.snapshot();
      const finalClass = document.documentElement.className;
      const theme = localStorage.getItem("colorTheme");
      original.click();
      remounted.click();
      header.click();
      window.dispatchEvent(
        new StorageEvent("storage", {
          storageArea: localStorage,
          key: "colorTheme",
          newValue: theme === "dark" ? "light" : "dark",
        }),
      );
      await settle();
      return {
        before,
        afterClass,
        afterReplace,
        sameNode,
        clickCount,
        afterHide,
        stillUsable,
        synchronized,
        liveSignals,
        aborted: window.themeSignals.every(({ signal }) => signal.aborted),
        afterDispose,
        final: app.snapshot(),
        staleThemeChange: finalClass !== document.documentElement.className,
        remainingControls: document.querySelectorAll("[data-sw-theme-toggle]").length,
      };
    });
    assert.deepEqual(result.before, { refs: ["a:BUTTON"], attachments: ["a:setup"], clicks: 0 });
    assert.deepEqual(result.afterClass, result.before);
    assert.deepEqual(result.afterReplace, {
      refs: ["a:BUTTON", "a:null", "b:BUTTON"],
      attachments: ["a:setup", "a:cleanup", "b:setup"],
      clicks: 0,
    });
    assert.equal(result.sameNode, true);
    assert.equal(result.clickCount, 1);
    assert.deepEqual(result.afterHide, {
      refs: ["a:BUTTON", "a:null", "b:BUTTON", "b:null"],
      attachments: ["a:setup", "a:cleanup", "b:setup", "b:cleanup"],
      clicks: 1,
    });
    assert.equal(result.stillUsable, true);
    assert.equal(result.synchronized, true);
    assert.deepEqual(result.liveSignals.map(({ type }) => type).sort(), [
      "change",
      "starwind:theme-change",
      "storage",
    ]);
    assert.ok(result.liveSignals.every(({ aborted }) => !aborted));
    assert.equal(result.aborted, true);
    assert.deepEqual(result.afterDispose, {
      refs: ["a:BUTTON", "a:null", "b:BUTTON", "b:null", "b:BUTTON", "b:null"],
      attachments: ["a:setup", "a:cleanup", "b:setup", "b:cleanup", "b:setup", "b:cleanup"],
      clicks: 1,
    });
    assert.deepEqual(result.final, result.afterDispose);
    assert.equal(result.staleThemeChange, false);
    assert.equal(result.remainingControls, 0);
    assert.deepEqual(diagnostics, []);
  } finally {
    await context?.close();
    if (server)
      await new Promise((resolve, reject) =>
        server.httpServer.close((error) => (error ? reject(error) : resolve())),
      );
    await rm(root, { recursive: true, force: true });
  }
}

const APP = `<script lang="ts">
import Layout from "../../src/routes/+layout.svelte";
import ThemeToggle from "$lib/starwind-runtime/theme-toggle";
import { createAttachmentKey, type Attachment } from "svelte/attachments";
let visible = $state(true);
let className = $state("before");
let second = $state(false);
const refs: string[] = [];
const attachments: string[] = [];
let clicks = 0;
const refA = (element: HTMLButtonElement | null) => { refs.push("a:" + (element?.tagName ?? "null")); };
const refB = (element: HTMLButtonElement | null) => { refs.push("b:" + (element?.tagName ?? "null")); };
const attachment = (name: string): Attachment<HTMLButtonElement> => () => { attachments.push(name + ":setup"); return () => { attachments.push(name + ":cleanup"); }; };
const key = createAttachmentKey();
let forwarded = $state.raw({ [key]: attachment("a") });
export function changeClass() { className = "after"; }
export function replaceOwners() { second = true; forwarded = { [key]: attachment("b") }; }
export function hide() { visible = false; }
export function show() { visible = true; }
export function snapshot() { return { refs: [...refs], attachments: [...attachments], clicks }; }
</script>
<Layout><main id="main">{#if visible}<ThemeToggle id="observed-toggle" class={className} ref={second ? refB : refA} {...forwarded} onclick={() => clicks++} />{/if}</main></Layout>`;
