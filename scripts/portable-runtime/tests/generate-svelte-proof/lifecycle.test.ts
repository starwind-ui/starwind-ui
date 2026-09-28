import { copyFile, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { svelte } from "@sveltejs/vite-plugin-svelte";
import { type Browser, chromium } from "playwright";
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

describe("generated Svelte Button lifecycle", () => {
  it("renders without DOM globals and hydrates with balanced attachment ownership", async () => {
    expect(globalThis).not.toHaveProperty("window");
    expect(globalThis).not.toHaveProperty("document");

    const root = await createHarness();
    const ssrServer = await createProofServer(root, true);
    servers.push(ssrServer);
    const appModule = await ssrServer.ssrLoadModule("/App.svelte");
    const { render } = await ssrServer.ssrLoadModule("svelte/server");
    const serverMarkup = render(appModule.default).body;

    expect(serverMarkup.match(/<button\b/g)).toHaveLength(1);
    expect(serverMarkup).toContain('data-native="forwarded"');
    expect(serverMarkup).toContain('aria-label="Svelte proof"');
    expect(globalThis).not.toHaveProperty("window");
    expect(globalThis).not.toHaveProperty("document");

    await writeFile(
      path.join(root, "index.html"),
      `<div id="app">${serverMarkup}</div><script type="module" src="/main.ts"></script>`,
      "utf8",
    );
    const browserServer = await createProofServer(root, false);
    servers.push(browserServer);
    await browserServer.listen();
    const browser = await chromium.launch({ channel: "chrome", headless: true });
    browsers.push(browser);
    const page = await browser.newPage();
    const url = browserServer.resolvedUrls?.local[0];
    if (!url) throw new Error("Svelte proof Vite server did not expose a local URL.");
    await page.goto(url);
    await page.waitForFunction(() => document.documentElement.dataset.svelteProofResult);
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.svelteProofResult ?? "{}"),
    );

    expect(result).toMatchObject({
      activations: 1,
      afterDisabled: { ariaDisabled: "true", dataDisabled: true, nativeDisabled: false },

      forwarded: {
        ariaLabel: "Svelte proof",
        className: "native-class",
        dataNative: "forwarded",
        id: "proof-button",
      },
      hydrationExact: true,
      rootCount: 1,
      rootCountAfterUnmount: 0,
    });
    expect(result.connection.connects).toBeGreaterThan(0);
    expect(result.connection.destroys).toBe(result.connection.connects);
    expect(result.externalAttachment.connects).toBeGreaterThan(0);
    expect(result.externalAttachment.cleanups).toBe(result.externalAttachment.connects);
  }, 60_000);
});

async function runBrowserHarness(
  root: string,
  markup: string,
  production = false,
): Promise<{
  result: unknown;
  warnings: string[];
}> {
  await writeFile(
    path.join(root, "index.html"),
    `<link rel="icon" href="data:,"><div id="app">${markup}</div><script type="module" src="/main.ts"></script>`,
    "utf8",
  );
  const server = await createProofServer(root, false, production);
  servers.push(server);
  await server.listen();
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  browsers.push(browser);
  const page = await browser.newPage();
  const warnings: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "warning" || message.type() === "error") warnings.push(message.text());
  });
  page.on("pageerror", (error) => warnings.push(error.message));
  const url = server.resolvedUrls?.local[0];
  if (!url) throw new Error("Svelte proof Vite server did not expose a local URL.");
  await page.goto(url);
  await page.waitForFunction(() => document.documentElement.dataset.svelteProofResult);
  const result = await page.evaluate(() =>
    JSON.parse(document.documentElement.dataset.svelteProofResult ?? "{}"),
  );
  return { result, warnings };
}

async function createHarness(): Promise<string> {
  const root = await mkdtemp(path.join(process.cwd(), ".svelte-proof-browser-"));
  await mkdir(path.join(root, "button"));
  await mkdir(path.join(root, "_internal"), { recursive: true });
  await copyFile(
    path.join(process.cwd(), "packages/svelte/src/_internal/ref-attachment.ts"),
    path.join(root, "_internal/ref-attachment.ts"),
  );
  temporaryRoots.push(root);
  await copyFile(
    path.join(process.cwd(), "packages/svelte/src/button/ButtonRoot.svelte"),
    path.join(root, "button/ButtonRoot.svelte"),
  );
  await writeFile(
    path.join(root, "runtime.ts"),
    `import { createButton as createRuntimeButton } from "${path.join(process.cwd(), "packages/runtime/src/components/button/index.ts").replaceAll("\\", "/")}";
const proof = globalThis.__connectionProof ??= { connects: 0, destroys: 0, updates: 0 };
export function createButton(root, options) {
  const instance = createRuntimeButton(root, options);
  proof.connects += 1;
  return {
    destroy() { proof.destroys += 1; instance.destroy(); },
    setDisabled(value) { proof.updates += 1; instance.setDisabled(value); },
  };
}
`,
    "utf8",
  );
  await writeFile(
    path.join(root, "App.svelte"),
    `<script lang="ts">
  import { createAttachmentKey, type Attachment } from "svelte/attachments";
  import ButtonRoot from "./button/ButtonRoot.svelte";

  let disabled = $state(false);
  let focusableWhenDisabled = $state(true);
  let activations = $state(0);
  const externalAttachment: Attachment<HTMLButtonElement> = (root) => {
    const proof = (globalThis as any).__externalAttachmentProof ??= { connects: 0, cleanups: 0 };
    proof.connects += 1;
    return () => { proof.cleanups += 1; };
  };
  const attachmentProps = { [createAttachmentKey()]: externalAttachment };

  export function setDisabled(value: boolean) { disabled = value; }
  export function setFocusableWhenDisabled(value: boolean) { focusableWhenDisabled = value; }
  export function getActivations() { return activations; }
</script>

<ButtonRoot
  {...attachmentProps}
  id="proof-button"
  class="native-class"
  data-native="forwarded"
  aria-label="Svelte proof"
  {disabled}
  {focusableWhenDisabled}
  onclick={() => activations += 1}
>
  Proof {activations}
</ButtonRoot>
`,
    "utf8",
  );
  await writeFile(
    path.join(root, "main.ts"),
    `import { flushSync, hydrate, unmount } from "svelte";
import App from "./App.svelte";

try {
  const target = document.querySelector("#app");
  if (!(target instanceof HTMLElement)) throw new Error("Missing hydration target.");
  const before = target.innerHTML;
  const instance = hydrate(App, { target });
  flushSync();
  const afterHydration = target.innerHTML;
  const button = target.querySelector("button");
  if (!(button instanceof HTMLButtonElement)) throw new Error("Missing generated button.");
  button.click();
  flushSync();
  instance.setDisabled(true);
  flushSync();
  const afterDisabled = {
    ariaDisabled: button.getAttribute("aria-disabled"),
    dataDisabled: button.hasAttribute("data-disabled"),
    nativeDisabled: button.disabled,
  };
  instance.setDisabled(false);
  flushSync();
  instance.setFocusableWhenDisabled(false);
  flushSync();
  instance.setFocusableWhenDisabled(true);
  flushSync();
  const proof = {
    activations: instance.getActivations(),
    afterDisabled,
    connection: globalThis.__connectionProof,
    externalAttachment: globalThis.__externalAttachmentProof,
    forwarded: {
      ariaLabel: button.getAttribute("aria-label"),
      className: button.className,
      dataNative: button.dataset.native,
      id: button.id,
    },
    hydrationExact: before === afterHydration,
    rootCount: target.querySelectorAll("button").length,
  };
  await unmount(instance);
  document.documentElement.dataset.svelteProofResult = JSON.stringify({
    ...proof,
    rootCountAfterUnmount: target.querySelectorAll("button").length,
  });
} catch (error) {
  document.documentElement.dataset.svelteProofResult = JSON.stringify({
    error: error instanceof Error ? error.stack ?? error.message : String(error),
  });
}
`,
    "utf8",
  );
  return root;
}
describe("generated Svelte compound button children", () => {
  it.each(["native", "forward", "button"])(
    "composes %s children and replaces each context-owned button",
    async (mode) => {
      const root = await createCompoundHarness(mode);
      const ssr = await createProofServer(root, true);
      servers.push(ssr);
      const app = await ssr.ssrLoadModule("/App.svelte");
      const renderer = await ssr.ssrLoadModule("svelte/server");
      const markup = renderer.render(app.default).body;
      expect(markup.match(/data-compound="/g)).toHaveLength(3);
      const { result, warnings } = await runBrowserHarness(root, markup);
      expect(result).toMatchObject({
        attrs: { count: 3, required: true, forwarded: true, content: true },
        sameOwner: true,
        stale: { select: true, dialog: true, close: true },
        replacement: {
          selectOpen: true,
          value: "beta",
          dialogOpen: true,
          portalParent: "compound-portal-b",
        },
        newOwnersWork: true,
        nativeOnce: true,

        domCanceled: true,
        pendingClose: true,
        frozenReset: "alpha",
        cleaned: true,
        balanced: true,
      });
      expect(warnings).toEqual([]);
    },
    60_000,
  );
  it.each(["missing", "wrong", "multiple"])(
    "diagnoses %s compound owners after mount",
    async (mode) => {
      const root = await createCompoundHarness(mode);
      await writeFile(
        path.join(root, "main.ts"),
        `import { mount, flushSync, tick, unmount } from "svelte";
import App from "./App.svelte";
const app = mount(App, { target: document.querySelector("#app")! });
flushSync(); await tick(); flushSync(); await tick();
await unmount(app);
document.documentElement.dataset.svelteProofResult = JSON.stringify({ completed: true });`,
      );
      const { result, warnings } = await runBrowserHarness(root, "");
      expect(result).toEqual({ completed: true });
      const message =
        mode === "missing"
          ? "did not attach"
          : mode === "wrong"
            ? "HTMLButtonElement"
            : "multiple owners";
      for (const part of ["SelectTrigger"]) {
        expect(
          warnings.some((warning) => warning.includes(part) && warning.includes(message)),
          warnings.join("\n"),
        ).toBe(true);
      }
    },
    60_000,
  );
});

async function createCompoundHarness(mode: string): Promise<string> {
  const root = await createHarness();
  await mkdir(path.join(root, "_internal"), { recursive: true });
  await copyFile(
    path.join(process.cwd(), "packages/svelte/src/_internal/ref-attachment.ts"),
    path.join(root, "_internal/ref-attachment.ts"),
  );
  await copyFile(
    path.join(process.cwd(), "packages/svelte/src/_internal/portal-document-observer.ts"),
    path.join(root, "_internal/portal-document-observer.ts"),
  );
  await copyFile(
    path.join(process.cwd(), "packages/svelte/src/_internal/portal-placement.ts"),
    path.join(root, "_internal/portal-placement.ts"),
  );
  for (const family of ["button", "select", "dialog"]) {
    await mkdir(path.join(root, family), { recursive: true });
    for (const file of await readdir(path.join(process.cwd(), "packages/svelte/src", family))) {
      await copyFile(
        path.join(process.cwd(), "packages/svelte/src", family, file),
        path.join(root, family, file),
      );
    }
    if (family === "button") continue;
    const factory = "create" + family[0].toUpperCase() + family.slice(1);
    const runtime = path
      .join(process.cwd(), "packages/runtime/src/components", family, "index.ts")
      .replaceAll("\\", "/");
    await writeFile(
      path.join(root, family + "-runtime.ts"),
      `
export * from "${runtime}";
import { ${factory} as createActual } from "${runtime}";
export function ${factory}(root, options) {
  const counts = (globalThis.__compoundRuntime ??= {})["${family}"] ??= { connects: 0, destroys: 0 };
  counts.connects += 1;
  const instance = createActual(root, options);
  const destroy = instance.destroy.bind(instance);
  instance.destroy = () => { counts.destroys += 1; destroy(); };
  return instance;
}`,
    );
  }
  await writeFile(
    path.join(root, "ForwardButton.svelte"),
    `<script lang="ts">
import type { Snippet } from "svelte";
import type { ButtonChildProps } from "./button/index";
let { children, ...props }: ButtonChildProps & { children?: Snippet } = $props();
</script><button {...props}>{@render children?.()}</button>`,
  );
  await writeFile(
    path.join(root, "App.svelte"),
    `<script lang="ts">
import { createAttachmentKey } from "svelte/attachments";
import { flushSync } from "svelte";
import { ButtonRoot, type ButtonChildPayload, type ButtonChildProps } from "./button/index";
import { SelectRoot, SelectTrigger, SelectPortal, SelectPopup, SelectList, SelectItem, SelectItemText } from "./select/index";
import { DialogRoot, DialogTrigger, DialogClose, DialogPopup } from "./dialog/index";
import ForwardButton from "./ForwardButton.svelte";
let key = $state(0);
let selectOpen = $state(false);
let value = $state<string | null>("alpha");
let dialogOpen = $state(false);
let portalTarget = $state("#compound-portal-a");
let refVersion = $state("a");
let className = $state("caller-class");
const refs: Record<string, string[]> = {};
const attachments: string[] = [];
const natives: Record<string, number> = {};
const proposals: Record<string, number> = {};
const attachmentKey = createAttachmentKey();
let attachmentProps: ButtonChildProps = $state({});
let veto = false;
let replaceOnProposal = false;
const ref = (name: string, version: string) => (element: HTMLButtonElement | null) => (refs[name] ??= []).push(version + ":" + (element ? "button" : "null"));
const native = (name: string) => () => natives[name] = (natives[name] ?? 0) + 1;
function proposal(name: string, detail: { cancel(): void }) { proposals[name] = (proposals[name] ?? 0) + 1; if (veto) detail.cancel(); if (replaceOnProposal) { replaceOnProposal = false; key += 1; flushSync(); } }
export function changeSurface() { className = "updated-class"; refVersion = "b"; }
export function setAttachment(name: string | null) { attachmentProps = name ? { [attachmentKey]: () => { attachments.push(name + ":setup"); return () => { attachments.push(name + ":cleanup"); }; } } : {}; }
export function replace() { key += 1; }
export function prepare() { value = "beta"; selectOpen = true; dialogOpen = true; portalTarget = "#compound-portal-b"; }
export function closeOverlays() { selectOpen = false; dialogOpen = false; }
export function setVeto(next: boolean) { veto = next; }
export function replaceOnNextProposal() { replaceOnProposal = true; }
export function snapshot() { return { selectOpen, value, dialogOpen, refs, attachments, natives, proposals }; }
</script>
{#snippet child({ props, children }: ButtonChildPayload)}
  {#key key}
    ${mode === "missing" ? "<span>Missing owner</span>" : mode === "wrong" ? "<div {...props}>Wrong owner</div>" : mode === "multiple" ? "<button {...props}>First</button><button {...props}>Second</button>" : mode === "native" ? "<button {...props}>{@render children?.()}</button>" : mode === "forward" ? "<ForwardButton {...props}>{@render children?.()}</ForwardButton>" : "<ButtonRoot {...props}>{@render children?.()}</ButtonRoot>"}
    <span data-compound-sibling>Sibling</span>
  {/key}
{/snippet}
<form id="compound-form">
  <SelectRoot bind:open={selectOpen} bind:value name="choice" defaultValue="alpha" onOpenChange={(_, detail) => proposal("select", detail)}>
    <SelectTrigger {child} {...attachmentProps} class={className} style="color: red;" data-slot="caller-slot" data-compound="select" data-sw-part="collision" aria-label="Caller label" ref={ref("select", refVersion)} onclick={native("select")}>Select content</SelectTrigger>
    <SelectPortal container={portalTarget} data-compound-portal>
      <SelectPopup><SelectList><SelectItem value="alpha"><SelectItemText>Alpha</SelectItemText></SelectItem><SelectItem value="beta"><SelectItemText>Beta</SelectItemText></SelectItem></SelectList></SelectPopup>
    </SelectPortal>
  </SelectRoot>
</form>
<DialogRoot bind:open={dialogOpen} onOpenChange={(_, detail) => proposal("dialog", detail)}>
  <DialogTrigger {child} {...attachmentProps} class={className} style="color: red;" data-slot="caller-slot" data-compound="dialog" data-sw-part="collision" aria-label="Caller label" ref={ref("dialog", refVersion)} onclick={native("dialog")}>Dialog content</DialogTrigger>
  <DialogPopup><DialogClose {child} {...attachmentProps} class={className} style="color: red;" data-slot="caller-slot" data-compound="close" data-sw-part="collision" aria-label="Caller label" ref={ref("close", refVersion)} onclick={native("close")}>Close content</DialogClose></DialogPopup>
</DialogRoot>
<div id="compound-portal-a"></div><div id="compound-portal-b"></div>`,
  );
  await writeFile(
    path.join(root, "main.ts"),
    `import { hydrate, flushSync, tick, unmount } from "svelte";
import App from "./App.svelte";
try {
  const app = hydrate(App, { target: document.querySelector("#app")! });
  const settle = async () => { flushSync(); await tick(); flushSync(); };
  const finish = async () => { await new Promise((resolve) => setTimeout(resolve, 30)); await settle(); };
  await settle();
  const button = (name) => document.querySelector('[data-compound="' + name + '"]');
  const names = ["select", "dialog", "close"];
  const first = Object.fromEntries(names.map((name) => [name, button(name)]));
  const firstConnections = JSON.stringify(globalThis.__compoundRuntime);
  const attrs = { count: document.querySelectorAll("button[data-compound]").length,
    required: names.every((name) => button(name).getAttribute("data-sw-part") === (name === "close" ? "close" : "trigger") && button(name).type === "button"),
    forwarded: names.every((name) => button(name).className === "caller-class" && button(name).getAttribute("style") === "color: red;" && button(name).getAttribute("data-slot") === "caller-slot" && button(name).getAttribute("aria-label") === "Caller label"),
    content: names.every((name) => button(name).textContent.includes("content")),
  };
  app.setAttachment("a"); await settle(); app.changeSurface(); await settle();
  app.setAttachment("b"); await settle(); app.setAttachment(null); await settle();
  const sameOwner = names.every((name) => button(name) === first[name]) && JSON.stringify(globalThis.__compoundRuntime) === firstConnections;
  app.prepare(); await finish();
  const before = app.snapshot();
  app.replace(); flushSync();
  const stale = {};
  for (const name of names) {
    const prior = JSON.stringify(app.snapshot().proposals);
    first[name].click();
    stale[name] = JSON.stringify(app.snapshot().proposals) === prior;
  }
  await finish();
  const replacement = { ...app.snapshot(), portalParent: document.querySelector("[data-compound-portal]")?.parentElement?.id };
  app.closeOverlays(); await finish();
  app.setVeto(true);
  let nativeOnce = true;
  const click = (name) => { const before = app.snapshot().natives[name] ?? 0; button(name).click(); nativeOnce &&= app.snapshot().natives[name] === before + 1; };
  const beforeCancel = app.snapshot().proposals.select ?? 0;
  button("select").focus(); click("select"); await settle();
  const canceled = !app.snapshot().selectOpen && app.snapshot().proposals.select === beforeCancel + 1;
  app.setVeto(false);
  button("select").focus(); click("select"); await settle();
  const openedSelect = app.snapshot().selectOpen;
  app.closeOverlays(); await finish();
  click("dialog"); await finish();
  const openedDialog = app.snapshot().dialogOpen;
  click("close"); await finish();
  const newOwnersWork = canceled && openedSelect && openedDialog && !app.snapshot().dialogOpen;
  app.setVeto(false);
  const selectRoot = button("select").closest("[data-sw-select]");
  const prevent = (event) => event.preventDefault();
  selectRoot.addEventListener("starwind:open-change", prevent, { once: true });
  button("select").focus(); click("select"); await finish();
  const domCanceled = !app.snapshot().selectOpen;
  click("dialog"); await finish();
  click("close"); app.replace(); flushSync(); await finish();
  const pendingClose = !app.snapshot().dialogOpen && !document.querySelector("dialog").open;
  document.querySelector("#compound-form").reset(); await finish();
  app.replace(); flushSync(); await finish();
  const frozenReset = app.snapshot().value;
  const proof = app.snapshot();
  await unmount(app); await finish();
  const balanced = Object.values(globalThis.__compoundRuntime).every((counts) => counts.connects === counts.destroys)
    && Object.values(proof.refs).every((entries) => entries.every((entry, index) => entry.endsWith(index % 2 === 0 ? ":button" : ":null")) && entries.length % 2 === 0)
    && proof.attachments.filter((entry) => entry.endsWith(":setup")).length === proof.attachments.filter((entry) => entry.endsWith(":cleanup")).length;
  document.documentElement.dataset.svelteProofResult = JSON.stringify({ attrs, sameOwner, stale, replacement, newOwnersWork, nativeOnce, domCanceled, pendingClose, frozenReset, balanced, proof, counts: globalThis.__compoundRuntime, cleaned: !document.querySelector("[data-compound-portal], [data-compound]") });
} catch (error) { document.documentElement.dataset.svelteProofResult = JSON.stringify({ error: String(error), stack: error.stack }); }`,
  );
  return root;
}

async function createProofServer(
  root: string,
  middlewareMode: boolean,
  production = false,
): Promise<ViteDevServer> {
  return createServer({
    appType: middlewareMode ? "custom" : "spa",
    configFile: false,
    cacheDir: path.join(root, middlewareMode ? ".vite-ssr" : ".vite-browser"),
    logLevel: "silent",
    plugins: [svelte({ compilerOptions: { dev: !production } })],
    resolve: {
      alias: {
        "@starwind-ui/runtime/button": path.join(root, "runtime.ts"),
        "@starwind-ui/runtime/select": path.join(root, "select-runtime.ts"),
        "@starwind-ui/runtime/dialog": path.join(root, "dialog-runtime.ts"),
        "@starwind-ui/runtime/accordion": path.join(root, "accordion-runtime.ts"),
      },
    },
    root,
    server: middlewareMode
      ? { middlewareMode: true, watch: null, hmr: false }
      : { host: "127.0.0.1", port: 0, strictPort: false, watch: null, hmr: false },
  });
}
