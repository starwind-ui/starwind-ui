import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import { createBrowserBuildScript } from "./compatibility-hydration.js";
import type { DistConsumer } from "./dist-consumer.js";

/** Covers every consumer of the shared forwarded-attachment printer through built exports. */
export async function verifyForwardedAttachmentIsolation(consumer: DistConsumer) {
  await consumer.write({
    "ForwardedAttachments.svelte": APP,
    "hydrate-main.js": CLIENT,
    "build-forwarded-attachments.mjs": createBrowserBuildScript(),
    "forwarded-attachments-ssr.mjs":
      'import assert from "node:assert/strict";import {render} from "svelte/server";import App from "./ForwardedAttachments.svelte";assert.equal(globalThis.document,undefined);const body=render(App).body;assert.equal(body,render(App).body);console.log(JSON.stringify({body}));',
  });
  const { body } = JSON.parse(
    await consumer.run("forwarded-attachments-ssr.mjs", { loader: true }),
  );
  await consumer.run("build-forwarded-attachments.mjs");
  const javascript = await readFile(path.join(consumer.root, "browser.js"));
  const server = createServer((request, response) => {
    response.setHeader(
      "Content-Type",
      request.url === "/browser.js" ? "text/javascript" : "text/html",
    );
    response.end(
      request.url === "/browser.js"
        ? javascript
        : `<link rel="icon" href="data:,"><div id="app">${body}</div><script type="module" src="/browser.js"></script>`,
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
    await page.waitForFunction(
      () => document.documentElement.dataset.forwardedAttachments,
      undefined,
      {
        timeout: 30_000,
      },
    );
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.forwardedAttachments!),
    );
    assert.deepEqual(diagnostics, []);
    assert.equal(result.error, undefined, result.error);
    assert.deepEqual(result.failures, []);
    assert.equal(result.hydrated, true);
    assert.equal(result.remaining, 0);
    assert.deepEqual(result.parts, ["checkbox", "indicator", "select"]);
    return result;
  } finally {
    await browser?.close();
    if (server.listening)
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
  }
}

const APP = `<script lang="ts">
import Checkbox from "@starwind-ui/svelte/checkbox";
import Select from "@starwind-ui/svelte/select";
import { createAttachmentKey, type Attachment } from "svelte/attachments";
let firstValue = $state(0), secondValue = $state(0), replaced = $state(false);
let present = $state(true), secondPresent = $state(true), generation = $state(0), changed = $state(false);
const firstKey = createAttachmentKey(), secondKey = createAttachmentKey();
const parts = ["checkbox", "indicator", "select"] as const;
type Part = typeof parts[number];
function pair(part: Part) {
  const events: string[] = [], refs: string[] = [], live = new Map<string, Element>();
  let owner: Element | null = null;
  const attach = (label: string, slot: string, read: () => number): Attachment<Element> => element => {
    const value = read();
    if (typeof document === "undefined" || !(element instanceof Element)) throw new Error("invalid attachment owner");
    if (live.has(slot)) throw new Error("overlapping symbol " + part + " " + slot);
    live.set(slot, element); events.push(label + ":" + value + ":setup");
    return () => {
      if (live.get(slot) !== element) throw new Error("cleanup changed owner");
      live.delete(slot); events.push(label + ":" + value + ":cleanup");
    };
  };
  return {
    first: attach("first", "first", () => firstValue),
    second: attach("second", "second", () => secondValue),
    replacement: attach("replacement", "second", () => secondValue),
    ref: (element: Element | null) => {
      if (typeof document === "undefined") throw new Error("SSR ref");
      if (element && owner) throw new Error("overlapping ref");
      owner = element; refs.push(element ? "setup" : "cleanup");
    },
    node: () => owner,
    snapshot: () => ({ events: [...events], refs: [...refs] }),
    verify: (unmounted: boolean) => {
      const expected = unmounted || !present ? [] : secondPresent ? ["first", "second"] : ["first"];
      if (JSON.stringify([...live.keys()].sort()) !== JSON.stringify(expected)) throw new Error("live symbol set " + part);
      if ([...live.values()].some(element => element !== owner)) throw new Error("ref and attachment mismatch " + part);
      if (unmounted && owner) throw new Error("unmounted ref " + part);
    },
  };
}
const pairs = Object.fromEntries(parts.map(part => [part, pair(part)])) as Record<Part, ReturnType<typeof pair>>;
function props(part: Part) {
  const value = pairs[part];
  return { get ref() { changed; return value.ref; }, "data-probe": part, title: changed ? "changed" : "initial",
    ...(present ? { [firstKey]: value.first, ...(secondPresent ? { [secondKey]: replaced ? value.replacement : value.second } : {}) } : {}) };
}
export function updateFirst() { firstValue++; }
export function updateSecond() { secondValue++; }
export function replaceSecond() { replaced = true; }
export function removeSecond() { secondPresent = false; }
export function restoreSecond() { secondPresent = true; }
export function removeAll() { present = false; }
export function restoreAll() { present = true; }
export function replaceOwners() { generation++; }
export function changeAttrs() { changed = true; }
export function snapshot() { return Object.fromEntries(parts.map(part => [part, pairs[part].snapshot()])); }
export function owners() { return parts.map(part => pairs[part].node()); }
export function verify(unmounted = false) { for (const part of parts) pairs[part].verify(unmounted); }
</script>
{#key generation}
<Checkbox.Root {...props("checkbox")} defaultChecked><Checkbox.Indicator {...props("indicator")} keepMounted>Checked</Checkbox.Indicator></Checkbox.Root>
<Select.Root {...props("select")} defaultValue="alpha"><Select.Trigger>Choose</Select.Trigger><Select.Portal><Select.Positioner><Select.Popup><Select.List><Select.Item value="alpha"><Select.ItemText>Alpha</Select.ItemText></Select.Item></Select.List></Select.Popup></Select.Positioner></Select.Portal></Select.Root>
{/key}`;

const CLIENT = `import { hydrate, flushSync, tick, unmount } from "svelte";
import App from "./ForwardedAttachments.svelte";
const parts = ["checkbox", "indicator", "select"], failures = [];
const same = (actual, expected, message) => { if (JSON.stringify(actual) !== JSON.stringify(expected)) failures.push({message,actual:structuredClone(actual),expected:structuredClone(expected)}); };
const settle = async () => { flushSync(); await tick(); flushSync(); await tick(); flushSync(); };
try {
  const before = parts.slice(0, 3).map(part => document.querySelector('[data-probe="' + part + '"]'));
  const app = hydrate(App, { target: document.querySelector("#app") }); await settle();
  const initialOwners = app.owners();
  same(initialOwners.slice(0, 3).map((node, index) => node === before[index]), [true,true,true], "hydration owner identity");
  app.verify();
  for (const part of parts) same(app.snapshot()[part].events.slice(0, 2), ["first:0:setup","second:0:setup"], "initial attachments " + part);
  app.updateFirst(); await settle(); app.verify();
  for (const part of parts) same(app.snapshot()[part].events.at(-1), "first:1:setup", "reactive attachment input " + part);
  app.replaceSecond(); await settle(); app.updateSecond(); await settle(); app.verify();
  for (const part of parts) same(app.snapshot()[part].events.at(-1), "replacement:1:setup", "replacement attachment active " + part);
  app.changeAttrs(); await settle();
  same(app.owners().map((node, index) => node === initialOwners[index] && node.title === "changed"), [true,true,true], "stable native owners");
  await unmount(app); await settle();
  app.verify(true);
  const final = app.snapshot();
  for (const part of parts) {
    const events = final[part].events;
    same(events.filter(event => event.endsWith(":setup")).length, events.filter(event => event.endsWith(":cleanup")).length, "balanced teardown " + part);
  }
  document.documentElement.dataset.forwardedAttachments = JSON.stringify({failures,parts,hydrated:true,remaining:document.querySelector("#app").children.length,final});
} catch (error) { document.documentElement.dataset.forwardedAttachments = JSON.stringify({error:String(error),failures}); }`;
