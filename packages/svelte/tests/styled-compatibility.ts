import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import type { DistConsumer } from "./dist-consumer.js";
import { BROWSER_BUILD } from "./compatibility-hydration.js";
import { verifyConsumerTypes } from "./consumer-types.js";
import { verifyStyledNativeBrowser } from "./styled-native-browser.js";
import { verifyStyledNativeFormBrowser } from "./styled-native-form-browser.js";
import { verifyForwardedAttachmentIsolation } from "./forwarded-attachments-browser.js";

/** Explicit compiler compatibility probes. Component suites own their behavior regressions. */
export const STYLED_COMPATIBILITY_ROOTS = [
  "button",
  "checkbox",
  "select",
  "dialog",
  "theme-toggle",
  "separator",
  "label",
  "skeleton",
  "native-select",
  "textarea",
] as const;
export async function verifyStyledCompatibility(consumer: DistConsumer, repoRoot: string) {
  const types = await verifyConsumerTypes(consumer, repoRoot, STYLED_COMPATIBILITY_ROOTS);
  await consumer.write({ "StyledCompatibility.svelte": COMPONENT });
  await consumer.write({
    "hydrate-main.js": CLIENT,
    "styled-ssr.mjs":
      'import { render } from "svelte/server"; import App from "./StyledCompatibility.svelte"; if (typeof document !== "undefined") throw new Error("SSR DOM global"); console.log(JSON.stringify({ body: render(App).body }));',
    "build-styled-browser.mjs": BROWSER_BUILD,
  });
  const { body } = JSON.parse(await consumer.run("styled-ssr.mjs", { loader: true }));
  const build = JSON.parse(await consumer.run("build-styled-browser.mjs")) as {
    bundler: string;
    compiler: string;
    inputs: string[];
  };
  const javascript = await readFile(path.join(consumer.root, "browser.js"));
  const css = await readFile(path.join(consumer.root, "browser.css"));
  const server = createServer((request, response) => {
    if (request.url === "/browser.js") {
      response.setHeader("Content-Type", "text/javascript");
      response.end(javascript);
    } else if (request.url === "/browser.css") {
      response.setHeader("Content-Type", "text/css");
      response.end(css);
    } else if (request.url === "/") {
      response.setHeader("Content-Type", "text/html");
      response.end(
        `<link rel="icon" href="data:,"><link rel="stylesheet" href="/browser.css"><div id="app">${body}</div><script type="module" src="/browser.js"></script>`,
      );
    } else {
      response.statusCode = 404;
      response.end();
    }
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage({ colorScheme: "light" });
    const diagnostics: string[] = [];
    page.on("pageerror", (error) => diagnostics.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) diagnostics.push(message.text());
    });
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    await page.goto(`http://127.0.0.1:${address.port}`);
    await page.waitForFunction(
      () => document.documentElement.dataset.styledCompatibility,
      undefined,
      { timeout: 30_000 },
    );
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.styledCompatibility!),
    );
    assert.deepEqual(diagnostics, []);
    assert.equal(result.error, undefined, result.error);
    assert.ok(result.refs.setups > 0);
    assert.equal(result.refs.setups, result.refs.cleanups);
    assert.deepEqual(result, {
      clicks: 1,
      checked: false,
      open: false,
      value: "beta",
      selectOpen: false,
      callbacks: { checked: 1, dialog: 2, value: 1, select: 2 },
      refs: result.refs,
      hydrated: true,
      themed: true,
      remaining: 0,
      stale: 0,
    });
    const native = await verifyStyledNativeBrowser(consumer);
    const nativeForms = await verifyStyledNativeFormBrowser(consumer);
    const attachments = await verifyForwardedAttachmentIsolation(consumer);
    return {
      roots: [...STYLED_COMPATIBILITY_ROOTS],
      types,
      native,
      nativeForms,
      attachments,
      build,
      result,
    };
  } finally {
    await browser?.close();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

const COMPONENT = `<script lang="ts">
import { onMount } from "svelte";
import { Button } from "./button/index.js";
import Checkbox from "./checkbox/index.js";
import Select from "./select/index.js";
import Dialog from "./dialog/index.js";
import { ThemeToggle } from "./theme-toggle/index.js";
import { initThemeController } from "@starwind-ui/svelte/theme";
let checked = $state<boolean | undefined>(undefined), open = $state<boolean | undefined>(undefined), selectOpen = $state<boolean | undefined>(undefined);
let value = $state<string | null | undefined>(undefined);
let second = $state(false);
let clicks = 0;
const callbacks = { checked: 0, dialog: 0, value: 0, select: 0 };
const refs = { setups: 0, cleanups: 0 };
const ref = (element: HTMLElement | null) => { if (element) refs.setups++; else refs.cleanups++; };
const alternate = (element: HTMLButtonElement | null) => ref(element);
onMount(() => { const controller = initThemeController(document); return () => controller.destroy(); });
export function replaceRef() { second = true; }
export function snapshot() { return { clicks, checked, open, value, selectOpen, callbacks: { ...callbacks }, refs: { ...refs } }; }
</script>
<Button data-test="button" {ref} onclick={() => clicks++}>Click</Button>
<Checkbox data-test="checkbox" id="choice" label="Choose" defaultChecked bind:checked {ref} onCheckedChange={() => callbacks.checked++} />
<ThemeToggle data-test="theme" {ref} />
<Dialog.Root bind:open onOpenChange={() => callbacks.dialog++}>
  <Dialog.Trigger data-test="trigger" ref={second ? alternate : ref}>{#snippet child({ props, children })}<Button {...props}>{@render children?.()}</Button>{/snippet}Open</Dialog.Trigger>
  <Dialog.Content data-test="dialog" {ref}>
    <Dialog.Header><Dialog.Title>Compatible dialog</Dialog.Title><Dialog.Description>Choose an item</Dialog.Description></Dialog.Header>
    <Select.Root bind:value bind:open={selectOpen} defaultValue="alpha" onValueChange={() => callbacks.value++} onOpenChange={() => callbacks.select++}>
      <Select.Trigger data-test="select" {ref}>{#snippet child({ props, children })}<Button {...props}>{@render children?.()}</Button>{/snippet}<Select.Value placeholder="Choose">{#snippet children(label, selected)}{label ?? selected}{/snippet}</Select.Value></Select.Trigger>
      <Select.Content><Select.Item value="alpha">Alpha</Select.Item><Select.Item value="beta">Beta</Select.Item></Select.Content>
    </Select.Root>
    <Dialog.Footer><Dialog.Close data-test="close">Close</Dialog.Close></Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>`;

const CLIENT = `import { hydrate, unmount, flushSync, tick } from "svelte"; import App from "./StyledCompatibility.svelte";
const assert = (value, message) => { if (!value) throw new Error(message); };
try {
const part = (name) => document.querySelector('[data-test="' + name + '"]');
const target = document.querySelector("#app"), before = ["button", "checkbox", "theme", "trigger", "dialog", "select"].map(part);
const app = hydrate(App, { target });
const settle = async () => { flushSync(); await tick(); flushSync(); };
const finish = async () => { for (let index=0; index<8; index++) { await new Promise(requestAnimationFrame); await settle(); } };
await settle();
assert(before.every((node,index) => node === part(["button", "checkbox", "theme", "trigger", "dialog", "select"][index])), "Styled compatibility hydration replaced owners");
assert(app.snapshot().checked === true && app.snapshot().open === undefined && app.snapshot().value === "alpha" && app.snapshot().selectOpen === false, "Styled initial undefined bindings "+JSON.stringify(app.snapshot()));
assert(Object.values(app.snapshot().callbacks).every((count) => count === 0), "Styled initialization called proposal callbacks");
part("button").click(); part("checkbox").click(); await settle(); part("theme").click(); await settle(); const themed = document.documentElement.classList.contains("dark");
const trigger = part("trigger"); app.replaceRef(); await settle(); assert(trigger === part("trigger"), "Styled ref replacement changed owner");
trigger.focus(); trigger.click(); await finish(); assert(part("dialog").matches(":modal"), "Styled Dialog native ownership");
part("select").click(); await finish(); document.querySelector('[data-sw-select-item][data-value="beta"]').click(); await finish();
assert(app.snapshot().value === "beta" && app.snapshot().selectOpen === false, "Styled Select accepted value");
part("close").click(); await finish(); assert(app.snapshot().open === false && !part("dialog").open, "Styled Dialog accepted close");
const snapshot = app.snapshot(); await unmount(app); await finish(); before[0].click(); before[1].click(); trigger.click(); await settle();
const final = app.snapshot(), stale = final.clicks - snapshot.clicks + Object.keys(final.callbacks).reduce((sum,key) => sum + final.callbacks[key] - snapshot.callbacks[key], 0);
document.documentElement.dataset.styledCompatibility = JSON.stringify({ ...final, hydrated: true, themed, remaining: document.querySelectorAll("[data-sw-dialog], [data-sw-select-portal], [data-test], :modal").length, stale });
} catch (error) { document.documentElement.dataset.styledCompatibility = JSON.stringify({ error: String(error) }); }
`;
