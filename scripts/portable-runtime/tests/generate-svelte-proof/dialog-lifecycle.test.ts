import { copyFile, mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { svelte } from "@sveltejs/vite-plugin-svelte";
import { chromium, type Browser } from "playwright";
import { render } from "svelte/server";
import { afterEach, describe, expect, it } from "vitest";
import { createServer, type ViteDevServer } from "vite";

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
    configFile: false,
    logLevel: "silent",
    plugins: [svelte()],
    resolve: { alias: { "@starwind-ui/runtime/dialog": path.join(root, "runtime.ts") } },
    root,
    server: middlewareMode
      ? { middlewareMode: true }
      : { host: "127.0.0.1", port: 0, strictPort: false },
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
  instance.closeAndMakeModal(); await tick();
  lockObserver.disconnect(); document.removeEventListener("focusin", focusListener);
  snapshot = instance.snapshot();
  const simultaneous = { binding: snapshot.controlled, closeComplete: snapshot.closeComplete, focusedOutside: document.activeElement === query("#outside"), open: query('[data-popup="controlled"]').open, modal: query('[data-popup="controlled"]').getAttribute("aria-modal"), sawStaleFocus: stale.focus, sawStaleLock: stale.lock, scrollLocked: document.body.hasAttribute("data-sw-scroll-locked") };
  const externalOpenBefore = { callbacks: snapshot.openChangeCount, setters: globalThis.__dialogLifecycle.setOpenEmitFalse };
  instance.setControlled(true); await tick(); snapshot = instance.snapshot();
  const externalOpen = { binding: snapshot.controlled, callbackCountDelta: snapshot.openChangeCount - externalOpenBefore.callbacks, focused: document.activeElement === query('[data-input="controlled"]'), open: query('[data-popup="controlled"]').open, scrollLocked: document.body.hasAttribute("data-sw-scroll-locked"), setterDelta: globalThis.__dialogLifecycle.setOpenEmitFalse - externalOpenBefore.setters };
  const externalCloseBefore = { callbacks: snapshot.openChangeCount, setters: globalThis.__dialogLifecycle.setOpenEmitFalse };
  instance.setControlled(false); await tick(); snapshot = instance.snapshot();
  const externalClose = { binding: snapshot.controlled, callbackCountDelta: snapshot.openChangeCount - externalCloseBefore.callbacks, closeComplete: snapshot.closeComplete, closeCompleteSawCommitted: snapshot.closeCompleteSawCommitted, open: query('[data-popup="controlled"]').open, order: snapshot.closeCompleteOrder, setterDelta: globalThis.__dialogLifecycle.setOpenEmitFalse - externalCloseBefore.setters };
  query('[data-trigger="controlled"]').click(); await tick();
  escape(); await tick();
  snapshot = instance.snapshot();
  const escaped = { binding: snapshot.controlled, closeComplete: snapshot.closeComplete, focusReturned: document.activeElement === query("#outside"), open: query('[data-popup="controlled"]').open, scrollLocked: document.body.hasAttribute("data-sw-scroll-locked") };
  query('[data-trigger="uncontrolled"]').click(); await tick();
  const uncontrolledOpened = query('[data-popup="uncontrolled"]').open;
  query('[data-backdrop="uncontrolled"]').click(); await tick();
  const uncontrolled = { opened: uncontrolledOpened, outsideClosed: !query('[data-popup="uncontrolled"]').open };
  query('[data-trigger="sibling"]').click(); await tick(); query('[data-trigger="controlled"]').click(); await tick(); query('[data-trigger="nested"]').click(); await tick();
  escape(); await tick();
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
