import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import { BROWSER_BUILD } from "./compatibility-hydration.js";
import type { DistConsumer } from "./dist-consumer.js";

export async function verifyAvatarLifecycle(consumer: DistConsumer, styled: boolean) {
  await consumer.write({
    "AvatarLifecycle.svelte": app(styled),
    "hydrate-main.js": CLIENT,
    "build-avatar.mjs": BROWSER_BUILD,
    "avatar-ssr.mjs": `import assert from "node:assert/strict";import {render} from "svelte/server";import App from "./AvatarLifecycle.svelte";
assert.equal(globalThis.document,undefined);const body=render(App).body;assert.equal(body,render(App).body);console.log(JSON.stringify({body}));`,
  });
  const { body } = JSON.parse(await consumer.run("avatar-ssr.mjs", { loader: true }));
  assert.match(body, /data-image-loading-status="idle"/);
  assert.match(body, /visibility: hidden/);
  assert.match(body, /data-delay="70"[^>]*hidden/);
  assert.doesNotMatch(body, /data-image-loading-status="(?:loaded|error|loading)"/);
  const build = JSON.parse(await consumer.run("build-avatar.mjs"));
  const javascript = await readFile(path.join(consumer.root, "browser.js"));
  const server = createServer((request, response) => {
    if (request.url === "/browser.js") {
      response.setHeader("Content-Type", "text/javascript");
      response.end(javascript);
    } else if (request.url?.startsWith("/portrait.svg")) {
      response.setHeader("Content-Type", "image/svg+xml");
      // A delayed response exercises the Runtime loading state before the native load event.
      setTimeout(
        () =>
          response.end(
            '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="green"/></svg>',
          ),
        50,
      );
    } else {
      response.setHeader("Content-Type", "text/html");
      response.end(
        `<link rel="icon" href="data:,"><div id="app">${body}</div><script type="module" src="/browser.js"></script>`,
      );
    }
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
    await page.waitForFunction(() => document.documentElement.dataset.avatarResult, undefined, {
      timeout: 30000,
    });
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.avatarResult!),
    );
    assert.deepEqual(diagnostics, []);
    assert.equal(result.error, undefined, JSON.stringify(result));
    assert.equal(result.hydrationExact, true);
    assert.equal(result.initialCatchup, true);
    assert.equal(result.latestCallback, true);
    assert.equal(result.loadedStylePreserved, true);
    assert.equal(result.delayReplacement, true);
    assert.equal(result.partReplacement, true);
    assert.equal(result.nativeHandlers, true);
    assert.equal(result.cleanup, true);
    assert.equal(result.isolation, true);
    return { result, build };
  } finally {
    await browser?.close();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

function app(styled: boolean): string {
  return `<script lang="ts">
import Avatar from "${styled ? "./avatar/index.js" : "@starwind-ui/svelte/avatar"}";
import { createAttachmentKey, type Attachment } from "svelte/attachments";
import type { AvatarImageLoadingStatus, AvatarLoadingStatusChangeDetails } from "@starwind-ui/svelte/avatar";
let src = $state<string | undefined>();
let delay = $state(70);
let imageKey = $state(0);
let showImage = $state(true);
let fallbackKey = $state(0);
let refVersion = $state(0);
let callbackVersion = $state(0);
let className = $state("initial");
let style = $state("border: 1px solid red; visibility: visible !important");
let rootStyle = $state("display: inline-block");
let fallbackStyle = $state("color: red");
let attachmentVersion = $state(0);
let dependency = $state(0);
const owners = new Map<string, HTMLElement>();
const attachments = new Map<string, HTMLElement>();
const refLog: string[] = [], attachmentLog: string[] = [];
const callbacks: { version: number; status: AvatarImageLoadingStatus; previous: AvatarImageLoadingStatus; committed: boolean }[] = [];
let nativeLoads = 0, nativeErrors = 0, nativeClicks = 0, reactiveRuns = 0;
const ref = (name: string, version: number) => (node: HTMLElement | null) => {
  if (node) { if (owners.has(name)) throw new Error("duplicate ref " + name); owners.set(name, node); }
  else owners.delete(name);
  refLog.push(name + ":" + version + ":" + (node ? "set" : "clear"));
};
const rootRef = ref("root", 0), fallbackRef = ref("fallback", 0);
let imageRef = $derived(ref("image", refVersion));
const attach = (name: string, version: number): Attachment<HTMLElement> => (node) => {
  void dependency; reactiveRuns++;
  if (attachments.has(name)) throw new Error("duplicate attachment " + name);
  attachments.set(name, node); attachmentLog.push(name + ":" + version + ":set");
  return () => { if (attachments.get(name) !== node) throw new Error("wrong attachment cleanup"); attachments.delete(name); attachmentLog.push(name + ":" + version + ":clear"); };
};
const rootAttachments = { [createAttachmentKey()]: attach("root", 0) };
const fallbackAttachments = { [createAttachmentKey()]: attach("fallback", 0) };
const imageAttachmentKey = createAttachmentKey();
let imageAttachments = $derived({ [imageAttachmentKey]: attach("image", attachmentVersion) });
const notify = (version: number) => (status: AvatarImageLoadingStatus, details: AvatarLoadingStatusChangeDetails) => {
  const root = owners.get("root");
  callbacks.push({ version, status, previous: details.previousStatus, committed: root?.getAttribute("data-image-loading-status") === status });
};
let callback = $derived(notify(callbackVersion));
export function setSource(value?: string) { src = value; }
export function updatePresentation() { className = "updated"; style = "border: 2px solid blue; visibility: collapse !important"; rootStyle = "display: inline-flex"; fallbackStyle = "color: blue"; }
export function updateCallback() { callbackVersion++; }
export function updateDelay(value: number) { delay = value; }
export function replaceImage() { imageKey++; }
export function setImageVisible(value: boolean) { showImage = value; }
export function replaceFallback() { fallbackKey++; }
export function replaceRef() { refVersion++; }
export function replaceAttachment() { attachmentVersion++; }
export function updateDependency() { dependency++; }
export function snapshot() { return { callbacks: [...callbacks], refLog: [...refLog], attachmentLog: [...attachmentLog], refs: owners.size, attachments: attachments.size, nativeLoads, nativeErrors, nativeClicks, reactiveRuns, ownersMatch: [...owners].every(([name,node]) => attachments.get(name) === node) }; }
</script>
<Avatar.Root id="avatar-root" class={className} style={rootStyle} ref={rootRef} {...rootAttachments}>
  {#if showImage}{#key imageKey}<Avatar.Image id="avatar-image" alt="Portrait" {src} {style} class={className} ref={imageRef} {...imageAttachments} onLoadingStatusChange={callback} onload={() => nativeLoads++} onerror={() => nativeErrors++} onclick={() => nativeClicks++} />{/key}{/if}
  {#key fallbackKey}<Avatar.Fallback id="avatar-fallback" {delay} class={className} style={fallbackStyle} ref={fallbackRef} {...fallbackAttachments}>SW</Avatar.Fallback>{/key}
  <Avatar.Root id="nested-root"><Avatar.Image alt="Nested portrait" /><Avatar.Fallback>AB</Avatar.Fallback></Avatar.Root>
</Avatar.Root>
<Avatar.Root id="isolated-root"><Avatar.Image alt="Other portrait" /><Avatar.Fallback>CD</Avatar.Fallback></Avatar.Root>
`;
}

const CLIENT = `import { hydrate, flushSync, tick, unmount } from "svelte";
import App from "./AvatarLifecycle.svelte";
import { createAvatar } from "@starwind-ui/runtime/avatar";
const result = {};
const assert = (value, message) => { if (!value) throw new Error(message); };
const settle = async () => { flushSync(); await tick(); flushSync(); };
const pause = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const poll = async (test, message) => { for (let n=0;n<100;n++) { if(test())return; await pause(10); } throw new Error(message); };
const target = document.querySelector("#app");
const root = () => document.querySelector("#avatar-root");
const img = () => document.querySelector("#avatar-image");
const fallback = () => document.querySelector("#avatar-fallback");
const before = [root(), img(), fallback()];
const instance = hydrate(App, { target });
try {
  await settle();
  result.hydrationExact = before.every((node, index) => node === [root(),img(),fallback()][index]);
  let snapshot = instance.snapshot();
  assert(snapshot.ownersMatch && snapshot.refs === 3 && snapshot.attachments === 3, "initial native owners");
  assert(snapshot.callbacks.length === 1 && snapshot.callbacks[0].status === "error" && snapshot.callbacks[0].committed, "initial catchup " + JSON.stringify(snapshot.callbacks));
  assert(img().style.visibility === "hidden" && !img().hidden, "initial image visibility");
  assert(fallback().hidden, "initial delayed fallback");
  await poll(() => !fallback().hidden, "fallback delay never released");
  result.initialCatchup = true;
  instance.updateCallback(); await settle();
  assert(instance.snapshot().callbacks.length === 1, "callback change replayed state");
  instance.setSource("/portrait.svg?v=1"); await settle();
  await poll(() => root().getAttribute("data-image-loading-status") === "loaded", "source never loaded");
  snapshot = instance.snapshot();
  assert(snapshot.callbacks.slice(1).every(entry => entry.version === 1 && entry.committed), "latest callback or commit ordering");
  assert(snapshot.callbacks.some(entry => entry.status === "loading"), "missing loading transition");
  assert(snapshot.callbacks.at(-1).status === "loaded", "missing loaded transition");
  assert(fallback().hidden && img().style.visibility === "visible", "loaded visibility");
  result.latestCallback = true;
  const count = snapshot.callbacks.length;
  const controller = createAvatar(root());
  instance.updatePresentation(); await settle();
  assert(createAvatar(root()) === controller, "presentation update recreated Runtime");
  assert(root().getAttribute("data-image-loading-status") === "loaded" && img().getAttribute("data-image-loading-status") === "loaded", "presentation update reset status");
  assert(img().style.visibility === "visible" && fallback().hidden && img().classList.contains("updated"), "presentation update reset visibility");
  assert(img().style.borderWidth === "2px" && fallback().style.color === "blue", "presentation update lost caller styles");
  assert(instance.snapshot().callbacks.length === count, "presentation update emitted callback");
  result.loadedStylePreserved = true;
  instance.replaceRef(); await settle();
  snapshot = instance.snapshot();
  assert(snapshot.refLog.slice(-2).join(",") === "image:0:clear,image:1:set", "ref replacement ordering");
  assert(snapshot.callbacks.length === count, "ref replacement recreated Runtime");
  instance.replaceAttachment(); await settle();
  snapshot = instance.snapshot();
  assert(snapshot.attachmentLog.slice(-2).join(",") === "image:0:clear,image:1:set", "attachment replacement ordering");
  const runs = snapshot.reactiveRuns;
  instance.updateDependency(); await settle();
  assert(instance.snapshot().reactiveRuns === runs + 3, "public attachment reactivity");
  img().click(); img().dispatchEvent(new Event("load")); img().dispatchEvent(new Event("error")); await settle();
  snapshot = instance.snapshot();
  assert(snapshot.nativeClicks === 1 && snapshot.nativeLoads === 2 && snapshot.nativeErrors === 1, "native handlers duplicated " + JSON.stringify(snapshot));
  result.nativeHandlers = true;
  instance.setSource(undefined); await settle();
  await poll(() => root().getAttribute("data-image-loading-status") === "error", "removed source never errored");
  await poll(() => !fallback().hidden, "error fallback never released");
  instance.updateDelay(150); await settle();
  assert(fallback().hidden, "delay change retained expired timer state");
  instance.updateDelay(10); await settle();
  await poll(() => !fallback().hidden, "changed delay never released");
  assert(createAvatar(root()) === controller, "delay change recreated Runtime");
  result.delayReplacement = true;
  const oldImage = img();
  instance.replaceImage(); await settle();
  assert(img() !== oldImage && instance.snapshot().ownersMatch, "keyed image ownership");
  const oldFallback = fallback();
  instance.replaceFallback(); await settle();
  assert(fallback() !== oldFallback && fallback().hidden && instance.snapshot().ownersMatch, "keyed fallback ownership");
  const afterReplacement = instance.snapshot().callbacks.length;
  oldImage.dispatchEvent(new Event("load")); oldImage.dispatchEvent(new Event("error")); await settle();
  assert(instance.snapshot().callbacks.length === afterReplacement, "detached image retained listeners");
  instance.setSource("/portrait.svg?v=2"); await settle();
  await poll(() => root().getAttribute("data-image-loading-status") === "loaded", "replacement source never loaded");
  assert(img().style.visibility === "visible" && fallback().hidden, "replacement parts not Runtime owned");
  assert(createAvatar(root()) === controller, "part replacement recreated Runtime");
  const removedImage = img();
  instance.setImageVisible(false); await settle();
  assert(!img() && root().getAttribute("data-image-loading-status") === "error", "image removal did not restore fallback state");
  await poll(() => !fallback().hidden, "removed image fallback delay never released");
  removedImage.dispatchEvent(new Event("load"));
  assert(root().getAttribute("data-image-loading-status") === "error", "removed image changed status");
  instance.setImageVisible(true); await settle();
  await poll(() => root().getAttribute("data-image-loading-status") === "loaded", "reinserted image never loaded");
  assert(createAvatar(root()) === controller, "conditional image recreated Runtime");
  result.partReplacement = true;
  result.isolation = ["nested-root","isolated-root"].every(id => document.getElementById(id).getAttribute("data-image-loading-status") === "error");
  instance.setSource(undefined); instance.updateDelay(150); await settle();
  const stale = [img(), fallback()];
  const beforeUnmount = instance.snapshot().callbacks.length;
  await unmount(instance); await settle();
  stale[0].dispatchEvent(new Event("load")); stale[0].dispatchEvent(new Event("error")); await pause(200);
  snapshot = instance.snapshot();
  assert(snapshot.callbacks.length === beforeUnmount && snapshot.refs === 0 && snapshot.attachments === 0 && target.children.length === 0, "unmount cleanup " + JSON.stringify(snapshot));
  assert(stale[1].hidden, "unmount retained fallback timer");
  result.cleanup = true;
} catch (error) { result.error = error.stack ?? String(error); }
document.documentElement.dataset.avatarResult = JSON.stringify(result);
`;
