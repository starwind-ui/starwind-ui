import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import { BROWSER_BUILD } from "./compatibility-hydration.js";
import type { DistConsumer } from "./dist-consumer.js";

export async function verifyStyledBindableRefs(consumer: DistConsumer) {
  await consumer.write({
    "BindableRefs.svelte": APP,
    "hydrate-main.js": CLIENT,
    "bindable-refs-ssr.mjs":
      'import { render } from "svelte/server"; import App from "./BindableRefs.svelte"; console.log(JSON.stringify({ body: render(App).body }));',
    "build-bindable-refs.mjs": BROWSER_BUILD,
  });
  const check = await consumer.check();
  assert.equal(check.code, 0, check.output);
  const { body } = JSON.parse(await consumer.run("bindable-refs-ssr.mjs", { loader: true }));
  await consumer.run("build-bindable-refs.mjs");
  const javascript = await readFile(path.join(consumer.root, "browser.js"));
  const server = createServer((request, response) => {
    response.setHeader(
      "Content-Type",
      request.url === "/browser.js" ? "text/javascript" : "text/html",
    );
    response.end(
      request.url === "/browser.js"
        ? javascript
        : `<link rel="icon" href="data:,\"><div id="app">${body}</div><script type="module" src="/browser.js"></script>`,
    );
  });
  let browser;
  try {
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage();
    const diagnostics: string[] = [];
    page.on("pageerror", (error) => diagnostics.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) diagnostics.push(message.text());
    });
    await page.goto(`http://127.0.0.1:${address.port}`);
    await page.waitForFunction(() => document.documentElement.dataset.bindableRefResult);
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.bindableRefResult!),
    );
    assert.deepEqual(diagnostics, []);
    assert.equal(result.error, undefined, result.error);
    assert.deepEqual(result.initial, {
      badge: "DIV",
      card: "DIV",
      table: "TABLE",
      tableParent: "DIV",
      select: "SELECT",
      textarea: "TEXTAREA",
    });
    assert.deepEqual(result.updated, { ...result.initial, badge: "A" });
    assert.deepEqual(result.removed, {
      card: null,
      badge: null,
      table: null,
      tableParent: null,
      select: null,
      textarea: null,
    });
    assert.equal(result.remaining, 0);
  } finally {
    await browser?.close();
    if (server.listening)
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
  }
}

const APP = `<script lang="ts">
import Card from "./card/Card.svelte";
import Badge from "./badge/Badge.svelte";
import Table from "./table/Table.svelte";
import NativeSelect from "./native-select/NativeSelect.svelte";
import NativeSelectOption from "./native-select/NativeSelectOption.svelte";
import Textarea from "./textarea/Textarea.svelte";
let visible = $state(true), title = $state("initial"), value = $state("a"), text = $state("hello"), badgeHref = $state<string>();
let card = $state<HTMLDivElement>(), table = $state<HTMLTableElement>();
let badge = $state<HTMLDivElement | HTMLAnchorElement>();
let select = $state<HTMLSelectElement>(), textarea = $state<HTMLTextAreaElement>();
export function update() { title = "updated"; badgeHref = "#badge"; }
export function hide() { visible = false; }
export function snapshot() { return { badge: badge?.tagName ?? null, card: card?.tagName ?? null, table: table?.tagName ?? null, tableParent: table?.parentElement?.tagName ?? null, select: select?.tagName ?? null, textarea: textarea?.tagName ?? null }; }
</script>
{#if visible}
<Card bind:ref={card} {title}>Card</Card>
<Badge bind:ref={badge} href={badgeHref}>Badge</Badge>
<Table bind:ref={table}><tbody><tr><td>Cell</td></tr></tbody></Table>
<NativeSelect bind:ref={select} bind:value><NativeSelectOption value="a">A</NativeSelectOption></NativeSelect>
<Textarea bind:ref={textarea} bind:value={text}/>
{/if}`;

const CLIENT = `import { flushSync, hydrate, tick, unmount } from "svelte";
import App from "./BindableRefs.svelte";
const settle = async () => { flushSync(); await tick(); flushSync(); };
try {
  const app = hydrate(App, { target: document.querySelector("#app") }); await settle();
  const initial = app.snapshot(); app.update(); await settle(); const updated = app.snapshot();
  app.hide(); await settle(); const removed = app.snapshot(); await unmount(app); await settle();
  document.documentElement.dataset.bindableRefResult = JSON.stringify({ initial, updated, removed, remaining: document.querySelector("#app").children.length });
} catch (error) { document.documentElement.dataset.bindableRefResult = JSON.stringify({ error: String(error) }); }`;
