import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import { BROWSER_BUILD } from "./compatibility-hydration.js";
import type { DistConsumer } from "./dist-consumer.js";

export async function verifyFixedOwnerAttachments(consumer: DistConsumer) {
  await consumer.write({
    "FixedOwnerAttachments.svelte": APP,
    "hydrate-main.js": CLIENT,
    "fixed-owner-attachments-ssr.mjs":
      'import { render } from "svelte/server"; import App from "./FixedOwnerAttachments.svelte"; console.log(JSON.stringify({ body: render(App).body }));',
    "build-fixed-owner-attachments.mjs": BROWSER_BUILD,
  });
  const check = await consumer.check();
  assert.equal(check.code, 0, check.output);
  const { body } = JSON.parse(
    await consumer.run("fixed-owner-attachments-ssr.mjs", { loader: true }),
  );
  await consumer.run("build-fixed-owner-attachments.mjs");
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
    await page.waitForFunction(() => document.documentElement.dataset.fixedOwnerAttachments);
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.fixedOwnerAttachments!),
    );
    assert.deepEqual(diagnostics, []);
    assert.equal(result.error, undefined, result.error);
    assert.deepEqual(result, {
      owners: {
        button: "BUTTON", checkbox: "BUTTON", indicator: "SPAN", select: "DIV",
        combobox: "DIV", group: "DIV", navigation: "NAV", icon: "SPAN",
        "dialog-trigger": "BUTTON", "preview-trigger": "A", "context-trigger": "DIV",
      },
      updated: {
        button: "updated", checkbox: "updated", indicator: "updated", select: "updated",
        combobox: "updated", group: "updated", navigation: "updated", icon: "updated",
        "dialog-trigger": "updated", "preview-trigger": "updated", "context-trigger": "updated",
      },
      checked: true,
      cleared: 0,
      remaining: 0,
    });
  } finally {
    await browser?.close();
    if (server.listening)
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
  }
}

const APP = `<script lang="ts">
import Button from "@starwind-ui/svelte/button";
import Checkbox from "@starwind-ui/svelte/checkbox";
import Select from "@starwind-ui/svelte/select";
import Combobox from "@starwind-ui/svelte/combobox";
import NavigationMenu from "@starwind-ui/svelte/navigation-menu";
import Dialog, { type ButtonChildPayload } from "@starwind-ui/svelte/dialog";
import PreviewCard, { type AnchorChildPayload } from "@starwind-ui/svelte/preview-card";
import ContextMenu from "@starwind-ui/svelte/context-menu";
import { createAttachmentKey, type Attachment } from "svelte/attachments";
let visible = $state(true), title = $state("initial");
const events: string[] = [], live = new Map<string, Element>(), key = createAttachmentKey();
const attach = (name: string): Attachment<Element> => element => {
  if (live.has(name)) throw new Error("overlapping owner " + name);
  live.set(name, element); events.push(name + ":setup:" + element.tagName);
  return () => { if (live.get(name) !== element) throw new Error("changed owner " + name); live.delete(name); events.push(name + ":cleanup"); };
};
const props = (name: string) => ({ [key]: attach(name), title });
export function update() { title = "updated"; }
export function hide() { visible = false; }
export function snapshot() { return { events: [...events], live: Object.fromEntries([...live].map(([name, element]) => [name, element.tagName])), titles: Object.fromEntries([...document.querySelectorAll<HTMLElement>("[data-probe]")].map(element => [element.dataset.probe, element.title])), checked: document.querySelector("[data-probe=checkbox]")?.getAttribute("data-checked") !== null, states: Object.fromEntries([...document.querySelectorAll<HTMLElement>("[data-state-probe]")].map(element => [element.dataset.stateProbe, element.dataset.state])) }; }
</script>
{#snippet buttonChild({ props: childProps, children }: ButtonChildPayload)}<button {...childProps} data-probe="dialog-trigger">{@render children?.()}</button>{/snippet}
{#snippet anchorChild({ props: childProps, children }: AnchorChildPayload)}<a {...childProps} data-probe="preview-trigger">{@render children?.()}</a>{/snippet}
{#if visible}
  <Button.Root {...props("button")} data-probe="button">Button</Button.Root>
  <Checkbox.Root {...props("checkbox")} data-probe="checkbox" defaultChecked nativeButton><Checkbox.Indicator {...props("indicator")} data-probe="indicator" keepMounted>Checked</Checkbox.Indicator></Checkbox.Root>
  <Select.Root {...props("select")} data-probe="select" data-state-probe="select" defaultOpen defaultValue="one"><Select.Trigger>Choose</Select.Trigger><Select.Portal disabled><Select.Positioner><Select.Popup><Select.List><Select.Item value="one"><Select.ItemText>One</Select.ItemText></Select.Item></Select.List></Select.Popup></Select.Positioner></Select.Portal></Select.Root>
  <Combobox.Root {...props("combobox")} data-probe="combobox" data-state-probe="combobox" defaultOpen><Combobox.Input/><Combobox.Trigger>Choose</Combobox.Trigger><Combobox.Portal disabled><Combobox.Positioner><Combobox.Popup><Combobox.List><Combobox.Group><Combobox.GroupLabel {...props("group")} data-probe="group">Group</Combobox.GroupLabel><Combobox.Item value="one"><Combobox.ItemText>One</Combobox.ItemText></Combobox.Item></Combobox.Group></Combobox.List></Combobox.Popup></Combobox.Positioner></Combobox.Portal></Combobox.Root>
  <NavigationMenu.Root {...props("navigation")} data-probe="navigation" data-state-probe="navigation" defaultValue="item"><NavigationMenu.List><NavigationMenu.Item value="item"><NavigationMenu.Trigger>Item<NavigationMenu.Icon {...props("icon")} data-probe="icon"/></NavigationMenu.Trigger></NavigationMenu.Item></NavigationMenu.List></NavigationMenu.Root>
  <Dialog.Root><Dialog.Trigger {...props("dialog-trigger")} child={buttonChild}>Dialog</Dialog.Trigger><Dialog.Popup>Dialog content</Dialog.Popup></Dialog.Root>
  <PreviewCard.Root><PreviewCard.Trigger {...props("preview-trigger")} child={anchorChild} href="#preview">Preview</PreviewCard.Trigger><PreviewCard.Portal disabled><PreviewCard.Positioner><PreviewCard.Popup>Preview content</PreviewCard.Popup></PreviewCard.Positioner></PreviewCard.Portal></PreviewCard.Root>
  <ContextMenu.Root><ContextMenu.Trigger {...props("context-trigger")} data-probe="context-trigger">Context</ContextMenu.Trigger></ContextMenu.Root>
{/if}`;

const CLIENT = `import { flushSync, hydrate, tick, unmount } from "svelte";
import App from "./FixedOwnerAttachments.svelte";
const settle = async () => { flushSync(); await tick(); flushSync(); await tick(); flushSync(); };
const expected = { button:"BUTTON", checkbox:"BUTTON", indicator:"SPAN", select:"DIV", combobox:"DIV", group:"DIV", navigation:"NAV", icon:"SPAN", "dialog-trigger":"BUTTON", "preview-trigger":"A", "context-trigger":"DIV" };
const check = (condition, message) => { if (!condition) throw new Error(message); };
try {
  const app = hydrate(App, { target: document.querySelector("#app") }); await settle();
  const initial = app.snapshot(); check(Object.keys(initial.live).length === Object.keys(expected).length && Object.entries(expected).every(([name, tag]) => initial.live[name] === tag), "initial semantic owners " + JSON.stringify(initial)); check(initial.checked, "checked state missing");
  app.update(); await settle(); const updated = app.snapshot(); check(Object.values(updated.titles).every(value => value === "updated"), "ordinary props did not update"); check(Object.keys(updated.live).length === Object.keys(expected).length && Object.entries(expected).every(([name, tag]) => updated.live[name] === tag), "updated semantic owners"); check(updated.checked, "checked state changed during prop update");
  app.hide(); await settle(); const hidden = app.snapshot(); check(Object.keys(hidden.live).length === 0, "owners survived conditional removal");
  await unmount(app); await settle(); const final = app.snapshot();
  for (const name of Object.keys(expected)) { const setup = final.events.filter(value => value.startsWith(name + ":setup:")).length, cleanup = final.events.filter(value => value === name + ":cleanup").length; check(setup === cleanup && setup > 0, "unbalanced " + name + " " + JSON.stringify(final.events)); }
  document.documentElement.dataset.fixedOwnerAttachments = JSON.stringify({ owners: initial.live, updated: updated.titles, checked: updated.checked, cleared: Object.keys(final.live).length, remaining: document.querySelector("#app").children.length });
} catch (error) { document.documentElement.dataset.fixedOwnerAttachments = JSON.stringify({ error: String(error) }); }`;
