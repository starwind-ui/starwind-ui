import { nativeAttachmentOwnership } from "./styled-native-lifecycle.js";
import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import type { DistConsumer } from "./dist-consumer.js";
import { BROWSER_BUILD } from "./compatibility-hydration.js";
import { nativeStyledImports } from "./styled-native-consumer.js";

/** Use the isolated consumer compiler for both server output and the hydrated client. */
export async function verifyStyledNativeBrowser(consumer: DistConsumer) {
  await consumer.write({
    "NativeLifecycle.svelte": APP,
    "NativeRemoval.svelte": NATIVE_REMOVAL,
    "hydrate-main.js": CLIENT,
    "native-ssr.mjs": `import assert from "node:assert/strict"; import { render } from "svelte/server"; import App from "./NativeLifecycle.svelte";
${["separator", "label", "skeleton"].map((name) => `import ${name}, * as ${name}Exports from "./${name}/index.js";`).join("\n")}
assert.equal(globalThis.document, undefined);
${["Separator", "Label", "Skeleton"].map((name) => `assert.equal(${name.toLowerCase()}, ${name.toLowerCase()}Exports.${name}); assert.deepEqual(Object.keys(${name.toLowerCase()}Exports).sort(), ["${name}", "${name}Variants", "default"]);`).join("\n")}
const body = render(App).body; assert.equal(body, render(App).body); console.log(JSON.stringify({ body }));`,
    "build-native.mjs": BROWSER_BUILD,
  });
  const { body } = JSON.parse(await consumer.run("native-ssr.mjs", { loader: true }));
  assert.match(body, /role="separator"/);
  assert.match(body, /aria-orientation="horizontal"/);
  assert.match(body, /data-slot="custom-separator"/);
  assert.match(body, /<label[^>]*for="native-control"/);
  const build = JSON.parse(await consumer.run("build-native.mjs"));
  const javascript = await readFile(path.join(consumer.root, "browser.js"));
  const server = createServer((request, response) => {
    if (request.url === "/browser.js") {
      response.setHeader("Content-Type", "text/javascript");
      response.end(javascript);
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
    await page.waitForFunction(() => document.documentElement.dataset.nativeResult, undefined, {
      timeout: 30_000,
    });
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.nativeResult!),
    );
    assert.deepEqual(diagnostics, []);
    assert.equal(result.error, undefined, result.error);
    assert.ok(result.attachments >= 6);
    assert.equal(result.attachments % 2, 0);
    const version = JSON.parse(
      await readFile(path.join(consumer.root, "node_modules/svelte/package.json"), "utf8"),
    ).version;
    assert.deepEqual(result.nativeRemoval, {
      omitted:
        version === "5.57.0" ? ["setup", "cleanup"] : ["setup", "cleanup", "setup", "cleanup"],
      explicit: ["setup", "cleanup", "setup", "cleanup"],
      live: 0,
    });
    assert.deepEqual(result, {
      nativeRemoval: result.nativeRemoval,
      hydrated: true,
      refs: { bound: 3, cleared: 3 },
      attachments: result.attachments,
      clicks: 3,
      remaining: 0,
      stale: 0,
    });
    return { build, result };
  } finally {
    await browser?.close();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

const APP = `<script lang="ts">
${nativeAttachmentOwnership}
${nativeStyledImports}
import type { Attachment } from "svelte/attachments";
import { createAttachmentKey } from "svelte/attachments";
let generation = $state(0), second = $state(false), active = $state(true);
let orientation = $state<"horizontal" | "vertical">("horizontal");
let refs = $state<(HTMLElement | undefined)[]>([]);
const attachments: string[] = [], owners = new Map<string, Element>();
let clicks = 0;
const attach = (name: string): Attachment<HTMLElement> => (node) => { const release = beginAttachment(name.split("-")[0]!, node); attachments.push(name + ":setup"); return () => { release(); attachments.push(name + ":cleanup"); }; };
const attachmentKey = createAttachmentKey();
const a = [attach("separator-a"), attach("label-a"), attach("skeleton-a")], b = [attach("separator-b"), attach("label-b"), attach("skeleton-b")];
const symbolProps = (index: number) => active ? { [attachmentKey]: (second ? b : a)[index] } : {};
export function replaceCallbacks() { second = true; }
export function replaceOwners() { generation++; }
export function attachmentCount() { return attachmentOwners.size; }
export function removeAttachments() { active = false; }
export function addAttachments() { active = true; }
export function changeOrientation() { orientation = "vertical"; }
export function snapshot() { return { refs: refs.map((node) => node?.tagName ?? null), attachments: [...attachments], clicks }; }
let attachmentDependency = $state(0), replaceSecondAttachment = $state(false);
const firstKey = createAttachmentKey(), secondKey = createAttachmentKey();
const pair = () => {
  const events: string[] = [];
  const live = new Map<string, HTMLDivElement>();
  const attach = (name: string, reactive = false): Attachment<HTMLDivElement> => (node) => {
    const version = reactive ? attachmentDependency : 0;
    if (live.has(name)) throw new Error("duplicate attachment owner " + name);
    if ([...live.values()].some((owner) => owner !== node)) throw new Error("split semantic owner");
    live.set(name, node); events.push(name + ":setup:" + version);
    return () => { if (!live.delete(name)) throw new Error("missing attachment cleanup"); events.push(name + ":cleanup:" + version); };
  };
  return { first: attach("first", true), second: attach("second"), replacement: attach("replacement"), snapshot: () => ({ events: [...events], live: [...live.keys()].sort() }) };
};
const direct = pair(), wrapped = pair();
export function replaceSecondSymbol() { replaceSecondAttachment = true; }
export function changeAttachmentDependency() { attachmentDependency++; }
export function attachmentSnapshot() { return { direct: direct.snapshot(), wrapped: wrapped.snapshot() }; }
const forbidden = { role: "presentation", "aria-orientation": "diagonal" };
</script>
{#key generation}
<Separator {...forbidden} {...symbolProps(0)} {orientation} data-test="separator" data-slot="custom-separator" class="native-separator" style="height: 24px;" bind:ref={refs[0]} onpointerdown={() => clicks++} />
<Label {...symbolProps(1)} for="native-control" data-test="label" size="sm" bind:ref={refs[1]} onclick={() => clicks++}>Native label</Label><input id="native-control" />
<Skeleton {...symbolProps(2)} data-test="skeleton" aria-label="Loading" class="native-skeleton" style="height: 12px;" bind:ref={refs[2]} onpointerdown={() => clicks++} />
{/key}
<div data-orientation={orientation} data-pair="direct" {...{ [firstKey]: direct.first, [secondKey]: replaceSecondAttachment ? direct.replacement : direct.second }}></div>
<Separator {orientation} data-pair="wrapped" {...{ [firstKey]: wrapped.first, [secondKey]: replaceSecondAttachment ? wrapped.replacement : wrapped.second }} />`;

const NATIVE_REMOVAL = `<script lang="ts">
import { createAttachmentKey, type Attachment } from "svelte/attachments";
let active = $state(true);
export function remove() { active = false; }
export function restore() { active = true; }
const removalKey = createAttachmentKey();
const removalEvents = { omitted: [] as string[], explicit: [] as string[] };
const removalOwners = new Map<string, HTMLDivElement>();
const removalAttachment = (kind: "omitted" | "explicit"): Attachment<HTMLDivElement> => (node) => {
  if (removalOwners.has(kind)) throw new Error("duplicate removal probe owner " + kind);
  removalOwners.set(kind, node); removalEvents[kind].push("setup");
  return () => { if (removalOwners.get(kind) !== node) throw new Error("lost removal probe owner " + kind); removalOwners.delete(kind); removalEvents[kind].push("cleanup"); };
};
const omittedRemoval = removalAttachment("omitted"), explicitRemoval = removalAttachment("explicit");
export function snapshot() { return { omitted: [...removalEvents.omitted], explicit: [...removalEvents.explicit], live: removalOwners.size }; }
</script>
<div data-removal="omitted" {...(active ? { [removalKey]: omittedRemoval } : {})}></div>
<div data-removal="explicit" {...Object.fromEntries([[removalKey, active ? explicitRemoval : undefined]])}></div>`;

const CLIENT = `import { hydrate, mount, flushSync, tick, unmount } from "svelte"; import App from "./NativeLifecycle.svelte"; import NativeRemoval from "./NativeRemoval.svelte";
const assert = (condition, label) => { if (!condition) throw new Error(label); };
const names = ["separator", "label", "skeleton"];
const elements = () => names.map(name => document.querySelector('[data-test="' + name + '"]'));
const settle = async () => { flushSync(); await tick(); flushSync(); };
try {
const before = elements(); const app = hydrate(App, { target: document.querySelector("#app") }); await settle();
const compareAttachments = (phase, liveCount = 2) => {
  const { direct, wrapped } = app.attachmentSnapshot();
  assert(direct.live.length === liveCount && wrapped.live.length === liveCount, phase + ": missing live owner");
  assert(JSON.stringify(direct.live) === JSON.stringify(wrapped.live), phase + ": different live attachments");
  for (const name of ["first", "second", "replacement"]) {
    assert(JSON.stringify(direct.events.filter(value => value.startsWith(name + ":"))) === JSON.stringify(wrapped.events.filter(value => value.startsWith(name + ":"))), phase + ": direct/wrapped attachment mismatch " + JSON.stringify({ direct, wrapped }));
  }
};
compareAttachments("mount");
app.replaceSecondSymbol(); await settle(); compareAttachments("callback replacement");
app.changeAttachmentDependency(); await settle(); compareAttachments("reactive dependency");
assert(elements().every((node, index) => node === before[index]), "hydration replaced native owner");
assert(JSON.stringify(app.snapshot().refs) === JSON.stringify(["DIV", "LABEL", "DIV"]) && app.snapshot().attachments.length === 3, "initial bindable refs");
assert(before[0].getAttribute("role") === "separator" && before[0].getAttribute("aria-orientation") === "horizontal", "separator owned attributes were overwritten");
assert(before[0].dataset.slot === "custom-separator" && before[0].classList.contains("native-separator") && before[0].style.height === "24px", "native attributes lost");
app.changeOrientation(); await settle(); compareAttachments("ordinary attributes");
assert(before[0].getAttribute("aria-orientation") === "vertical" && before[0].dataset.orientation === "vertical", "orientation update lost");
assert(JSON.stringify(app.snapshot().refs) === JSON.stringify(["DIV", "LABEL", "DIV"]) && elements().every((node, index) => node === before[index]), "ordinary props recreated ownership");
before[0].dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })); before[1].click(); before[2].dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })); await settle();
assert(app.snapshot().clicks === 3, "native handlers not forwarded once");
assert(before[1].control === document.querySelector("#native-control"), "label control association lost");
app.removeAttachments(); await settle();
assert(app.attachmentCount() === 0, "removed symbols retained live owners");
app.replaceOwners(); await settle(); const current = elements();
assert(current.every((node,index) => node !== before[index]), "key did not replace native owner");
for (const node of before) { node.click(); node.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })); } await settle();
assert(app.snapshot().clicks === 3, "retired element called native handler");
await unmount(app); await settle(); compareAttachments("unmount", 0);
for (const node of current) { node.click(); node.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })); } await settle();
const result = app.snapshot();
assert(result.refs.every((value) => value === null), "bindable refs did not clear on unmount");
for (const name of names) {
const entriesA = result.attachments.filter(value => value.startsWith(name));
assert(entriesA.length >= 2 && entriesA.filter(value => value.endsWith("setup")).length * 2 === entriesA.length && entriesA.at(-1).endsWith("cleanup"), "attachment lifecycle unbalanced");
}
const removalTarget = document.createElement("div"); document.body.append(removalTarget);
const removalApp = mount(NativeRemoval, { target: removalTarget }); await settle();
const removalNodes = [...removalTarget.children];
assert(JSON.stringify(removalApp.snapshot()) === JSON.stringify({ omitted: ["setup"], explicit: ["setup"], live: 2 }), "initial native removal probes");
removalApp.remove(); await settle();
assert(JSON.stringify(removalApp.snapshot()) === JSON.stringify({ omitted: ["setup", "cleanup"], explicit: ["setup", "cleanup"], live: 0 }), "native symbol removal cleanup");
removalApp.restore(); await settle();
assert(removalNodes.every((node, index) => node === removalTarget.children[index]), "native symbol removal changed the element");
assert(JSON.stringify(removalApp.snapshot().explicit) === JSON.stringify(["setup", "cleanup", "setup"]), "explicit native symbol restoration");
await unmount(removalApp); await settle(); removalTarget.remove();
document.documentElement.dataset.nativeResult = JSON.stringify({ nativeRemoval: removalApp.snapshot(), hydrated: true, refs: { bound: 3, cleared: result.refs.filter((value) => value === null).length }, attachments: result.attachments.length, clicks: result.clicks, remaining: document.querySelector("#app").children.length, stale: result.clicks - 3 });
} catch (error) { document.documentElement.dataset.nativeResult = JSON.stringify({ error: String(error) }); }`;
