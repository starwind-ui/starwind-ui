import { nativeAttachmentOwnership } from "./styled-native-lifecycle.js";
import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import type { DistConsumer } from "./dist-consumer.js";
import { BROWSER_BUILD } from "./compatibility-hydration.js";
import { dynamicStyledImports, dynamicStyledParts } from "./styled-dynamic-consumer.js";

export async function verifyStyledDynamicBrowser(consumer: DistConsumer) {
  await consumer.write({
    "DynamicLifecycle.svelte": APP,
    "DynamicVoid.svelte": VOID_APP,
    "hydrate-main.js": CLIENT,
    "dynamic-ssr.mjs": `import assert from "node:assert/strict"; import { render } from "svelte/server"; import App from "./DynamicLifecycle.svelte"; import VoidApp from "./DynamicVoid.svelte";
import AspectRatio, * as aspectExports from "./aspect-ratio/index.js";
import Badge, * as badgeExports from "./badge/index.js";
import Item, * as itemExports from "./item/index.js";
assert.equal(globalThis.document, undefined);
assert.equal(AspectRatio, aspectExports.AspectRatio); assert.equal(Badge, badgeExports.Badge);
assert.deepEqual(Object.keys(aspectExports).sort(), ["AspectRatio", "AspectRatioVariants", "default"]);
assert.deepEqual(Object.keys(badgeExports).sort(), ["Badge", "BadgeVariants", "default"]);
assert.deepEqual(Object.keys(itemExports).sort(), ${JSON.stringify([...["Item", "ItemActions", "ItemContent", "ItemDescription", "ItemFooter", "ItemGroup", "ItemHeader", "ItemMedia", "ItemSeparator", "ItemTitle", "ItemVariants", "default"]].sort())});
${dynamicStyledParts
  .filter((part) => part.root === "item")
  .map((part) => `assert.equal(Item.${part.member}, itemExports.${part.name});`)
  .join("\n")}
assert.deepEqual(Object.keys(Item).sort(), ${JSON.stringify(["Root", "Actions", "Content", "Description", "Footer", "Group", "Header", "Media", "Separator", "Title"].sort())});
assert.deepEqual(Object.keys(aspectExports.AspectRatioVariants).sort(), ["aspectRatio", "aspectRatioWrapper"]);
assert.deepEqual(Object.keys(badgeExports.BadgeVariants), ["badge"]);
assert.deepEqual(Object.keys(itemExports.ItemVariants).sort(), ${JSON.stringify(["item", "itemActions", "itemContent", "itemDescription", "itemFooter", "itemGroup", "itemHeader", "itemMedia", "itemSeparator", "itemTitle"].sort())});
const body = render(App).body; assert.equal(body, render(App).body); console.log(JSON.stringify({ body, voidBody: render(VoidApp).body }));`,
    "build-dynamic.mjs": BROWSER_BUILD,
  });
  const { body, voidBody } = JSON.parse(await consumer.run("dynamic-ssr.mjs", { loader: true }));
  assert.match(body, /padding-bottom: 100%/);
  assert.match(body, /data-slot="aspect-ratio-wrapper"/);
  assert.match(body, /role="list"/);
  assert.match(body, /role="separator"/);
  for (const { slot } of dynamicStyledParts) assert.ok(body.includes(`data-slot="${slot}"`), slot);
  const build = JSON.parse(await consumer.run("build-dynamic.mjs"));
  const javascript = await readFile(path.join(consumer.root, "browser.js"));
  const server = createServer((request, response) => {
    if (request.url === "/browser.js") {
      response.setHeader("Content-Type", "text/javascript");
      response.end(javascript);
    } else {
      response.setHeader("Content-Type", "text/html");
      response.end(
        `<link rel="icon" href="data:,"><div id="app">${body}</div><div id="void-app">${voidBody}</div><script type="module" src="/browser.js"></script>`,
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
    await page.waitForFunction(() => document.documentElement.dataset.dynamicResult, undefined, {
      timeout: 30_000,
    });
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.dynamicResult!),
    );
    assert.deepEqual(diagnostics, []);
    assert.equal(result.error, undefined, result.error);
    assert.ok(result.attachments.setups >= 56);
    assert.equal(result.attachments.setups, result.attachments.cleanups);
    assert.deepEqual(result, {
      parts: 12,
      hydrated: true,
      attachments: result.attachments,
      nativeCalls: 18,
      remaining: 0,
      stale: 0,
    });
    return { build, result };
  } finally {
    await browser?.close();
    if (server.listening)
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
  }
}

function attrs(name: string) {
  return `{...attributes("${name}")}`;
}
const APP = `<script lang="ts">
${nativeAttachmentOwnership}
${dynamicStyledImports}
import { createAttachmentKey, type Attachment } from "svelte/attachments";
let generation = $state(0), second = $state(false);
let ratio = $state<number | undefined>(undefined), as = $state<keyof HTMLElementTagNameMap>("div"), itemAs = $state<keyof HTMLElementTagNameMap>("div"), href = $state<string | undefined>(undefined);
let tone = $state<BadgeProps["tone"]>(undefined), appearance = $state<BadgeProps["appearance"]>(undefined), variant = $state<BadgeProps["variant"]>("primary");
let size = $state<"sm" | "md">("sm"), media = $state<"icon" | "image">("icon"), orientation = $state<"horizontal" | "vertical">("horizontal");
const parts = ${JSON.stringify(dynamicStyledParts)};
const attachments: string[] = [], calls: Record<string, number> = {};
const attachCallbacks = new Map<string, Attachment<HTMLElement>>();
const key = createAttachmentKey();
function attributes(name: string) {
  const label = name + (second ? "-b" : "-a");
  if (!attachCallbacks.has(label)) attachCallbacks.set(label, (node) => {
    const release = beginAttachment(name, node);
    attachments.push(label + ":" + node.tagName + ":setup");
    return () => { release(); attachments.push(label + ":" + node.tagName + ":cleanup"); };
  });
  return { [key]: attachCallbacks.get(label), "data-dynamic-part": name, title: name, class: "native-" + name, style: "--native-probe: ready; color: red;", onpointerdown: (event: PointerEvent) => { if (event.target === event.currentTarget) calls[name] = (calls[name] ?? 0) + 1; } };
}
export function changeProps() { ratio = 16 / 9; tone = "success"; media = "image"; size = "md"; orientation = "vertical"; }
export function appearanceOnly() { tone = undefined; appearance = "outline"; }
export function legacyStyle() { appearance = undefined; variant = "warning"; }
export function replaceBranches() { as = "section"; itemAs = "a"; href = "#details"; }
export function restoreBranches() { as = "div"; itemAs = "div"; href = ""; ratio = undefined; }
export function replaceCallbacks() { second = true; }
export function replaceOwners() { generation++; }
export function snapshot() { return { attachments: [...attachments], calls: { ...calls } }; }
</script>
{#key generation}
<AspectRatio ${attrs("AspectRatio")} {as} {ratio}>Image preview</AspectRatio>
<Badge ${attrs("Badge")} {href} {tone} {appearance} {variant}>Status</Badge>
<ItemGroup ${attrs("ItemGroup")}><Item ${attrs("Item")} as={itemAs} href={itemAs === "a" ? "#details" : undefined} {size} variant="outline"><ItemHeader ${attrs("ItemHeader")}>Header</ItemHeader><ItemMedia ${attrs("ItemMedia")} variant={media}>Media</ItemMedia><ItemContent ${attrs("ItemContent")}><ItemTitle ${attrs("ItemTitle")}>Project</ItemTitle><ItemDescription ${attrs("ItemDescription")}>Description</ItemDescription></ItemContent><ItemActions ${attrs("ItemActions")}>Actions</ItemActions><ItemFooter ${attrs("ItemFooter")}>Footer</ItemFooter></Item><ItemSeparator ${attrs("ItemSeparator")} {orientation} /></ItemGroup>
{/key}`;
const CLIENT = `import { hydrate, flushSync, tick, unmount } from "svelte"; import App from "./DynamicLifecycle.svelte"; import VoidApp from "./DynamicVoid.svelte";
const parts = ${JSON.stringify(dynamicStyledParts)};
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const part = (name) => document.querySelector('[data-dynamic-part="' + name + '"]');
const elements = () => parts.map(({ name }) => part(name));
const settle = async () => { flushSync(); await tick(); flushSync(); };
const changed = ["AspectRatio", "Badge", "Item"];
const branchOwners = parts.filter(({ name }) => !["ItemGroup", "ItemSeparator"].includes(name));
const dispatch = (node) => node.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
try {
const voidBefore = [...document.querySelectorAll("[data-void-owner]")];
const voidApp = hydrate(VoidApp, { target: document.querySelector("#void-app") }); await settle();
assert(voidBefore.length === 2 && voidBefore.every((node) => node.tagName === "HR" && node.childElementCount === 0 && node.textContent === "" && node === document.querySelector('[data-void-owner="' + node.dataset.voidOwner + '"]')), "void hydration changed owner");
voidApp.switchTag(); await settle();
assert([...document.querySelectorAll("[data-void-owner]")].every((node) => node.tagName === "SECTION" && node.textContent.includes("Optional content")), "void to content branch");
voidApp.switchTag(); await settle();
assert([...document.querySelectorAll("[data-void-owner]")].every((node) => node.tagName === "HR" && node.childElementCount === 0 && node.textContent === ""), "content to void branch");
await unmount(voidApp); await settle();
const voidSnapshot = voidApp.snapshot();
for (const name of ["ratio", "item"]) assert(JSON.stringify(voidSnapshot.attachments[name]) === JSON.stringify(["HR:setup", "HR:cleanup", "SECTION:setup", "SECTION:cleanup", "HR:setup", "HR:cleanup"]), "void attachment lifecycle " + name);
const before = elements(); const app = hydrate(App, { target: document.querySelector("#app") }); await settle();
assert(elements().every((node,index) => node === before[index]), "hydration replaced native owner");
assert(app.snapshot().attachments.length === 12, "initial attachment count");
for (const { name, tag, slot } of parts) {
  const node = part(name); assert(node.tagName === tag && node.dataset.slot === slot, "native anatomy " + name);
  assert(node.title === name && node.classList.contains("native-" + name) && node.style.getPropertyValue("--native-probe").trim() === "ready", "native attributes " + name);
  dispatch(node);
}
assert(Object.values(app.snapshot().calls).every((value) => value === 1) && Object.keys(app.snapshot().calls).length === 12, "native handlers must fire once on each owner");
const container = part("AspectRatio").parentElement;
assert(container.dataset.slot === "aspect-ratio-wrapper" && container.children.length === 1 && !container.hasAttribute("title") && !container.hasAttribute("data-dynamic-part"), "AspectRatio wrapper took native props");
assert(container.style.paddingBottom === "100%" && !part("AspectRatio").style.paddingBottom && !container.style.color, "ratio default and style ownership");
assert(part("Badge").classList.contains("bg-primary") && !part("Badge").classList.contains("cursor-pointer"), "legacy Badge variant");
assert(part("ItemGroup").getAttribute("role") === "list" && part("ItemSeparator").getAttribute("role") === "separator" && part("ItemSeparator").getAttribute("aria-orientation") === "horizontal", "Item Separator composition");
app.changeProps(); await settle();
assert(container.style.paddingBottom === "56.25%", "ratio numeric change");
assert(part("Badge").classList.contains("bg-success/10") && !part("Badge").classList.contains("bg-primary"), "tone must select composed soft default");
assert(part("Item").classList.contains("gap-4") && part("ItemMedia").dataset.variant === "image" && part("ItemSeparator").getAttribute("aria-orientation") === "vertical", "Item reactive variants and separator props");
app.appearanceOnly(); await settle();
assert(part("Badge").classList.contains("border-border") && !part("Badge").classList.contains("bg-primary") && !part("Badge").classList.contains("bg-success/10"), "appearance must select neutral default");
app.legacyStyle(); await settle(); assert(part("Badge").classList.contains("bg-warning"), "return to legacy Badge variant");
app.replaceBranches(); await settle();
const branched = elements();
for (const { name } of parts) {
  const index = parts.findIndex((entry) => entry.name === name);
  if (branchOwners.some((entry) => entry.name === name)) assert(branched[index] !== before[index], "branch retained owner " + name);
  else assert(branched[index] === before[index], "branch replaced sibling owner " + name);
}
assert(part("AspectRatio").tagName === "SECTION" && part("AspectRatio").parentElement === container, "AspectRatio inner branch");
assert(part("Badge").tagName === "A" && part("Badge").getAttribute("href") === "#details" && part("Badge").classList.contains("cursor-pointer"), "Badge link branch");
assert(part("Item").tagName === "A" && part("Item").getAttribute("href") === "#details", "Item native as link");
for (const name of changed) dispatch(part(name));
for (const { name } of branchOwners) dispatch(before[parts.findIndex((entry) => entry.name === name)]);
assert(changed.every((name) => app.snapshot().calls[name] === 2), "branch handlers or retired owner handler");
app.restoreBranches(); await settle(); const restored = elements();
assert(changed.every((name) => part(name).tagName === "DIV"), "branch restoration");
assert(container.style.paddingBottom === "100%", "ratio undefined restores default");
assert(!part("Badge").classList.contains("cursor-pointer"), "empty href uses div branch");
for (const name of changed) dispatch(part(name));
for (const { name } of branchOwners) dispatch(branched[parts.findIndex((entry) => entry.name === name)]);
assert(changed.every((name) => app.snapshot().calls[name] === 3), "restored branch handlers");
for (const { name, tag: initialTag } of branchOwners) {
  const tag = name === "AspectRatio" ? "SECTION" : ["Badge", "Item"].includes(name) ? "A" : initialTag;
  assert(JSON.stringify(app.snapshot().attachments.filter((entry) => entry.startsWith(name + "-")).slice(-4)) === JSON.stringify([name + "-a:" + initialTag + ":cleanup", name + "-a:" + tag + ":setup", name + "-a:" + tag + ":cleanup", name + "-a:" + initialTag + ":setup"]), "branch attachment order " + name);
}
app.replaceCallbacks(); await settle();
assert(elements().every((node,index) => node === restored[index]), "callback replacement changed element");
for (const { name, tag } of parts) {
  assert(JSON.stringify(app.snapshot().attachments.filter((entry) => entry.startsWith(name + "-")).slice(-2)) === JSON.stringify([name + "-a:" + tag + ":cleanup", name + "-b:" + tag + ":setup"]), "attachment replacement order " + name);
}
app.replaceOwners(); await settle(); const current = elements();
assert(current.every((node,index) => node !== restored[index]), "key did not replace owners");
for (const node of restored) dispatch(node);
await unmount(app); await settle();
for (const node of current) dispatch(node);
const snapshot = app.snapshot();
for (const { name, tag } of parts) {
  assert(JSON.stringify(snapshot.attachments.filter((entry) => entry.startsWith(name + "-")).slice(-3)) === JSON.stringify([name + "-b:" + tag + ":cleanup", name + "-b:" + tag + ":setup", name + "-b:" + tag + ":cleanup"]), "key and unmount attachment lifecycle " + name);
}
const nativeCalls = Object.values(snapshot.calls).reduce((sum, count) => sum + count, 0);
document.documentElement.dataset.dynamicResult = JSON.stringify({ parts: parts.length, hydrated: true, attachments: { setups: snapshot.attachments.filter((value) => value.endsWith(":setup")).length, cleanups: snapshot.attachments.filter((value) => value.endsWith(":cleanup")).length }, nativeCalls, remaining: document.querySelector("#app").children.length, stale: nativeCalls - 18 });
} catch (error) { document.documentElement.dataset.dynamicResult = JSON.stringify({ error: String(error) }); }`;

const VOID_APP = `<script lang="ts">
import { AspectRatio } from "./aspect-ratio/index.js";
import { Item } from "./item/index.js";
import { createAttachmentKey, type Attachment } from "svelte/attachments";
let tag = $state<"hr" | "section">("hr");
const attachments: Record<string, string[]> = { ratio: [], item: [] };
const attachment = (name: string): Attachment<HTMLElement> => (node) => { attachments[name].push(node.tagName + ":setup"); return () => { attachments[name].push(node.tagName + ":cleanup"); }; };
const ratioAttrs = { [createAttachmentKey()]: attachment("ratio") }, itemAttrs = { [createAttachmentKey()]: attachment("item") };
export function switchTag() { tag = tag === "hr" ? "section" : "hr"; }
export function snapshot() { return { attachments }; }
</script>
<AspectRatio {...ratioAttrs} as={tag} data-void-owner="ratio">Optional content</AspectRatio>
<Item {...itemAttrs} as={tag} data-void-owner="item">Optional content</Item>`;
