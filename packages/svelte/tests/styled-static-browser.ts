import { nativeAttachmentOwnership } from "./styled-native-lifecycle.js";
import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import type { DistConsumer } from "./dist-consumer.js";
import { BROWSER_BUILD } from "./compatibility-hydration.js";
import {
  staticStyledImports,
  staticStyledParts,
  staticStyledRoots,
} from "./styled-static-consumer.js";

export async function verifyStyledStaticBrowser(consumer: DistConsumer) {
  await consumer.write({
    "StaticLifecycle.svelte": APP,
    "hydrate-main.js": CLIENT,
    "static-ssr.mjs": `import assert from "node:assert/strict"; import { render } from "svelte/server"; import App from "./StaticLifecycle.svelte";
${staticStyledRoots.map((root) => `import ${root}, * as ${root}Exports from "./${root}/index.js";`).join("\n")}
assert.equal(globalThis.document, undefined);
${staticStyledRoots
  .map((root) => {
    const parts = staticStyledParts.filter((part) => part.root === root);
    const collection = root[0]!.toUpperCase() + root.slice(1) + "Variants";
    return `assert.deepEqual(Object.keys(${root}).sort(), ${JSON.stringify(parts.map((part) => part.member).sort())});
assert.deepEqual(Object.keys(${root}Exports).sort(), ${JSON.stringify([...parts.map((part) => part.name), collection, "default"].sort())});
${parts.map((part) => `assert.equal(${root}.${part.member}, ${root}Exports.${part.name});`).join("\n")}
assert.deepEqual(Object.keys(${root}Exports.${collection}).sort(), ${JSON.stringify(parts.map((part) => part.name[0]!.toLowerCase() + part.name.slice(1)).sort())});`;
  })
  .join("\n")}
const body = render(App).body; assert.equal(body, render(App).body); console.log(JSON.stringify({ body }));`,
    "build-static.mjs": BROWSER_BUILD,
  });
  const { body } = JSON.parse(await consumer.run("static-ssr.mjs", { loader: true }));
  assert.match(body, /role="alert"/);
  assert.match(body, /data-size="sm"/);
  for (const tag of [
    "table",
    "caption",
    "thead",
    "tbody",
    "tfoot",
    "th",
    "td",
    "tr",
    "kbd",
    "h5",
    "p",
  ])
    assert.match(body, new RegExp(`<${tag}\\b`));
  const build = JSON.parse(await consumer.run("build-static.mjs"));
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
    await page.waitForFunction(() => document.documentElement.dataset.staticResult, undefined, {
      timeout: 30_000,
    });
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.staticResult!),
    );
    assert.deepEqual(diagnostics, []);
    assert.equal(result.error, undefined, result.error);
    assert.ok(result.attachments.setups >= 60);
    assert.equal(result.attachments.setups, result.attachments.cleanups);
    assert.deepEqual(result, {
      parts: 20,
      hydrated: true,
      refs: { bound: 20, cleared: 20 },
      attachments: result.attachments,
      nativeCalls: 20,
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

function attrs(name: string) {
  return `{...attributes("${name}")} bind:ref={bound.${name}}`;
}

const APP = `<script lang="ts">
${nativeAttachmentOwnership}
${staticStyledImports}
import { createAttachmentKey, type Attachment } from "svelte/attachments";
let generation = $state(0), second = $state(false);
let variant = $state<"warning" | "info" | "error">("warning"), size = $state<"sm" | "md">("sm"), role = $state<"region" | undefined>(undefined), columnSpan = $state(2);
const parts = ${JSON.stringify(staticStyledParts)};
let bound = $state<Record<string, HTMLElement | undefined>>({});
const attachments: string[] = [], calls: Record<string, number> = {};
const attachCallbacks = new Map<string, Attachment<HTMLElement>>();
const key = createAttachmentKey();
function attributes(name: string) {
  const label = name + (second ? "-b" : "-a");
  if (!attachCallbacks.has(label)) attachCallbacks.set(label, (node) => {
    const release = beginAttachment(name, node);
    attachments.push(label + ":setup"); return () => { release(); attachments.push(label + ":cleanup"); };
  });
  return { [key]: attachCallbacks.get(label), "data-static-part": name, title: name, class: "native-" + name, style: "--native-probe: ready;", onpointerdown: (event: PointerEvent) => { if (event.target === event.currentTarget) calls[name] = (calls[name] ?? 0) + 1; } };
}
export function changeProps() { variant = "info"; size = "md"; columnSpan = 1; }
export function overrideRole() { role = "region"; }
export function inferRole() { role = undefined; variant = "error"; }
export function replaceCallbacks() { second = true; }
export function replaceOwners() { generation++; }
export function snapshot() { const owners = new Map(Object.entries(bound).filter((entry): entry is [string, HTMLElement] => Boolean(entry[1]))); if (owners.size) verifyAttachmentOwners(owners); return { refs: parts.map(({ name }) => bound[name]?.tagName ?? null), attachments: [...attachments], calls: { ...calls } }; }
</script>
{#key generation}
<Alert ${attrs("Alert")} {variant} {role}><AlertTitle ${attrs("AlertTitle")}>Check your settings</AlertTitle><AlertDescription ${attrs("AlertDescription")}>Review the project before saving.</AlertDescription></Alert>
<Card ${attrs("Card")} {size}><CardHeader ${attrs("CardHeader")}><CardTitle ${attrs("CardTitle")}>Project</CardTitle><CardDescription ${attrs("CardDescription")}>Project details</CardDescription><CardAction ${attrs("CardAction")}><button>Edit</button></CardAction></CardHeader><CardContent ${attrs("CardContent")}>Your workspace</CardContent><CardFooter ${attrs("CardFooter")}>Saved</CardFooter></Card>
<KbdGroup ${attrs("KbdGroup")}><Kbd ${attrs("Kbd")}>Ctrl</Kbd><span>+</span><kbd>K</kbd></KbdGroup>
<Table ${attrs("Table")} aria-label="Projects"><TableCaption ${attrs("TableCaption")}>Current projects</TableCaption><TableHeader ${attrs("TableHeader")}><TableRow ${attrs("TableRow")}><TableHead ${attrs("TableHead")} scope="col">Name</TableHead><th scope="col">Status</th></TableRow></TableHeader><TableBody ${attrs("TableBody")}><tr><TableCell ${attrs("TableCell")} colspan={columnSpan}>Starwind</TableCell>{#if columnSpan === 1}<td>Active</td>{/if}</tr></TableBody><TableFoot ${attrs("TableFoot")}><tr><td colspan="2">One project</td></tr></TableFoot></Table>
{/key}`;

const CLIENT = `import { hydrate, flushSync, tick, unmount } from "svelte"; import App from "./StaticLifecycle.svelte";
const parts = ${JSON.stringify(staticStyledParts)};
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const part = (name) => document.querySelector('[data-static-part="' + name + '"]');
const elements = () => parts.map(({ name }) => part(name));
const settle = async () => { flushSync(); await tick(); flushSync(); };
try {
const before = elements(); const app = hydrate(App, { target: document.querySelector("#app") }); await settle();
assert(elements().every((node,index) => node === before[index]), "hydration replaced static owner");
assert(app.snapshot().refs.every(Boolean) && app.snapshot().attachments.length === 20, "initial owner count");
for (const { name, tag, slot } of parts) {
  const node = part(name); assert(node.tagName === tag && node.dataset.slot === slot, "native anatomy " + name);
  assert(node.title === name && node.classList.contains("native-" + name) && node.style.getPropertyValue("--native-probe").trim() === "ready", "native attributes " + name);
  node.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
}
assert(Object.values(app.snapshot().calls).every((value) => value === 1) && Object.keys(app.snapshot().calls).length === 20, "native handlers must fire once on each owner");
const table = part("Table"), container = table.parentElement;
assert(container.dataset.slot === "table-container" && container.children.length === 1 && !container.hasAttribute("title") && !container.hasAttribute("data-static-part"), "Table container took native props");
assert(table.caption === part("TableCaption") && table.tHead === part("TableHeader") && table.tBodies[0] === part("TableBody") && table.tFoot === part("TableFoot"), "table section ownership");
assert(JSON.stringify([...table.children].map((node) => node.tagName)) === JSON.stringify(["CAPTION", "THEAD", "TBODY", "TFOOT"]), "table parser repaired nesting");
assert(table.rows.length === 3 && part("TableHead").scope === "col" && part("TableCell").colSpan === 2, "table native cell attributes");
assert(part("Alert").getAttribute("role") === "alert" && part("Card").dataset.size === "sm", "initial variants");
app.changeProps(); await settle();
assert(part("Alert").getAttribute("role") === "status" && part("Card").dataset.size === "md" && part("TableCell").colSpan === 1, "reactive native props");
app.overrideRole(); await settle(); assert(part("Alert").getAttribute("role") === "region", "explicit alert role");
app.inferRole(); await settle(); assert(part("Alert").getAttribute("role") === "alert", "inferred error role");
assert(app.snapshot().refs.every(Boolean), "prop changes cleared bindable refs");
app.replaceCallbacks(); await settle();
assert(elements().every((node,index) => node === before[index]), "ref replacement changed element");
for (const { name, tag } of parts) {
  assert(app.snapshot().refs[parts.findIndex((entry) => entry.name === name)] === tag, "bindable ref target " + name);
  assert(JSON.stringify(app.snapshot().attachments.filter((entry) => entry.startsWith(name + "-")).slice(-2)) === JSON.stringify([name + "-a:cleanup", name + "-b:setup"]), "attachment replacement order " + name);
}
app.replaceOwners(); await settle(); const current = elements();
assert(current.every((node,index) => node !== before[index]), "key did not replace owners");
for (const node of before) node.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })); await settle();
assert(Object.values(app.snapshot().calls).every((value) => value === 1), "retired owner handler");
await unmount(app); await settle();
for (const node of current) node.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })); await settle();
const snapshot = app.snapshot();
for (const { name, tag } of parts) {
  assert(snapshot.refs[parts.findIndex((entry) => entry.name === name)] === null, "bindable ref did not clear " + name);
  assert(JSON.stringify(snapshot.attachments.filter((entry) => entry.startsWith(name + "-")).slice(-4)) === JSON.stringify([name + "-b:setup", name + "-b:cleanup", name + "-b:setup", name + "-b:cleanup"]), "unbalanced attachment lifecycle " + name);
}
const nativeCalls = Object.values(snapshot.calls).reduce((sum, count) => sum + count, 0);
document.documentElement.dataset.staticResult = JSON.stringify({ parts: parts.length, hydrated: true, refs: { bound: parts.length, cleared: snapshot.refs.filter((value) => value === null).length }, attachments: { setups: snapshot.attachments.filter((value) => value.endsWith(":setup")).length, cleanups: snapshot.attachments.filter((value) => value.endsWith(":cleanup")).length }, nativeCalls, remaining: document.querySelector("#app").children.length, stale: nativeCalls - 20 });
} catch (error) { document.documentElement.dataset.staticResult = JSON.stringify({ error: String(error) }); }`;
