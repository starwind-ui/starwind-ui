import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import { BROWSER_BUILD } from "./compatibility-hydration.js";
import type { DistConsumer } from "./dist-consumer.js";

/** One-way defined models hold until the parent changes them, on every overlay and menu root. */
export async function verifyParentOwnedModels(consumer: DistConsumer) {
  await consumer.write({
    "ParentOwned.svelte": APP,
    "hydrate-main.js": CLIENT,
    "build-parent-owned.mjs": BROWSER_BUILD,
  });
  await consumer.write({
    "parent-owned-ssr.mjs": `import { render } from "svelte/server"; import Navigation from "@starwind-ui/svelte/navigation-menu"; console.log(JSON.stringify({ open: render(Navigation.Root, { props: { value: "a" } }).body, closed: render(Navigation.Root, { props: {} }).body }));`,
  });
  const navigation = JSON.parse(await consumer.run("parent-owned-ssr.mjs", { loader: true }));
  assert.match(navigation.open, /<nav[^>]*data-state="open"/);
  assert.match(navigation.closed, /<nav[^>]*data-state="closed"/);
  await consumer.run("build-parent-owned.mjs");
  const javascript = await readFile(path.join(consumer.root, "browser.js"));
  const server = createServer((request, response) => {
    if (request.url === "/browser.js") {
      response.setHeader("Content-Type", "text/javascript");
      response.end(javascript);
    } else {
      response.setHeader("Content-Type", "text/html");
      response.end(
        '<link rel="icon" href="data:,"><div id="app"></div><script type="module" src="/browser.js"></script>',
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
    await page.waitForFunction(() => document.documentElement.dataset.parentOwned, undefined, {
      timeout: 30000,
    });
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.parentOwned!),
    );
    assert.deepEqual(diagnostics, []);
    return result as { error?: string; roots?: string[] };
  } finally {
    await browser?.close();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

const APP = `<script lang="ts">
import AlertDialog from "@starwind-ui/svelte/alert-dialog";
import Combobox from "@starwind-ui/svelte/combobox";
import ContextMenu from "@starwind-ui/svelte/context-menu";
import Drawer from "@starwind-ui/svelte/drawer";
import Menu from "@starwind-ui/svelte/menu";
import NavigationMenu from "@starwind-ui/svelte/navigation-menu";
import Popover from "@starwind-ui/svelte/popover";
import PreviewCard from "@starwind-ui/svelte/preview-card";
import Radio from "@starwind-ui/svelte/radio";
import Tooltip from "@starwind-ui/svelte/tooltip";
let open = $state<boolean>(false), nav = $state<string | null>(null), checked = $state(false), radio = $state("a"), itemMenu = $state(true);
const calls: Record<string, number> = {};
const count = (name: string) => () => { calls[name] = (calls[name] ?? 0) + 1; };
export function setOpen(next: boolean) { open = next; }
export function setNav(next: string | null) { nav = next; }
export function setChecked(next: boolean) { checked = next; }
export function setRadio(next: string) { radio = next; }
let comboValue = $state<string | null>("astro"), comboText = $state("Astro"), comboOpen = $state(false), boundValue = $state<string | null>("astro"), boundText = $state("Astro"), boundOpen = $state(false);
export function setCombo(next: { value?: string | null; text?: string; open?: boolean }) { if ("value" in next) comboValue = next.value!; if (next.text !== undefined) comboText = next.text; if (next.open !== undefined) comboOpen = next.open; }
export function setBound(next: { open?: boolean }) { if (next.open !== undefined) boundOpen = next.open; }
export function bound() { return { value: boundValue, text: boundText, open: boundOpen }; }
export function snapshot() { return { calls: { ...calls } }; }
</script>
{#snippet comboParts(id: string)}<Combobox.Label>Framework</Combobox.Label><Combobox.InputGroup><Combobox.Input data-input={id}/><Combobox.Trigger data-trigger={id}>Open</Combobox.Trigger><Combobox.Clear data-clear={id}>Clear</Combobox.Clear></Combobox.InputGroup><Combobox.Portal><Combobox.Positioner><Combobox.Popup data-popup={id}><Combobox.List><Combobox.Item value="astro" data-item={id + "-astro"}><Combobox.ItemText>Astro</Combobox.ItemText></Combobox.Item><Combobox.Item value="react" data-item={id + "-react"}><Combobox.ItemText>React</Combobox.ItemText></Combobox.Item></Combobox.List></Combobox.Popup></Combobox.Positioner></Combobox.Portal>{/snippet}
<form id="combo-form"><Combobox.Root data-case="combobox" name="combo" value={comboValue} inputValue={comboText} open={comboOpen} onValueChange={count("combo-value")} onInputValueChange={count("combo-text")} onOpenChange={count("combo-open")}>{@render comboParts("combobox")}</Combobox.Root></form>
<form id="bound-form"><Combobox.Root data-case="bound-combobox" name="bound" defaultValue="vue" bind:value={boundValue} bind:inputValue={boundText} bind:open={boundOpen}>{@render comboParts("bound-combobox")}</Combobox.Root></form>
<AlertDialog.Root data-case="alert-dialog" {open} onOpenChange={count("alert-dialog")}><AlertDialog.Trigger data-trigger="alert-dialog">Open</AlertDialog.Trigger><AlertDialog.Portal><AlertDialog.Popup><AlertDialog.Title>Title</AlertDialog.Title><AlertDialog.Close>Close</AlertDialog.Close></AlertDialog.Popup></AlertDialog.Portal></AlertDialog.Root>
<Drawer.Root data-case="drawer" {open} onOpenChange={count("drawer")}><Drawer.Trigger data-trigger="drawer">Open</Drawer.Trigger><Drawer.Portal><Drawer.Popup><Drawer.Title>Title</Drawer.Title><Drawer.Close>Close</Drawer.Close></Drawer.Popup></Drawer.Portal></Drawer.Root>
<Popover.Root data-case="popover" {open} onOpenChange={count("popover")}><Popover.Trigger data-trigger="popover">Open</Popover.Trigger><Popover.Portal><Popover.Popup>Content</Popover.Popup></Popover.Portal></Popover.Root>
<Tooltip.Root data-case="tooltip" {open} openDelay={0} onOpenChange={count("tooltip")}><Tooltip.Trigger data-trigger="tooltip">Open</Tooltip.Trigger><Tooltip.Portal><Tooltip.Popup>Content</Tooltip.Popup></Tooltip.Portal></Tooltip.Root>
<PreviewCard.Root data-case="preview-card" {open} openDelay={0} onOpenChange={count("preview-card")}><PreviewCard.Trigger data-trigger="preview-card" href="#card">Open</PreviewCard.Trigger><PreviewCard.Portal><PreviewCard.Popup>Content</PreviewCard.Popup></PreviewCard.Portal></PreviewCard.Root>
<Menu.Root data-case="menu" {open} onOpenChange={count("menu")}><Menu.Trigger data-trigger="menu">Open</Menu.Trigger><Menu.Portal><Menu.Popup><Menu.Item>Item</Menu.Item></Menu.Popup></Menu.Portal></Menu.Root>
<ContextMenu.Root data-case="context-menu" {open} onOpenChange={count("context-menu")}><ContextMenu.Trigger data-trigger="context-menu">Open</ContextMenu.Trigger><ContextMenu.Portal><ContextMenu.Popup><ContextMenu.Item>Item</ContextMenu.Item></ContextMenu.Popup></ContextMenu.Portal></ContextMenu.Root>
<NavigationMenu.Root data-case="navigation-menu" value={nav} onValueChange={count("navigation-menu")}><NavigationMenu.List><NavigationMenu.Item value="a"><NavigationMenu.Trigger data-trigger="navigation-menu">Open</NavigationMenu.Trigger><NavigationMenu.Content>Content</NavigationMenu.Content></NavigationMenu.Item></NavigationMenu.List><NavigationMenu.Portal><NavigationMenu.Popup><NavigationMenu.Viewport/></NavigationMenu.Popup></NavigationMenu.Portal></NavigationMenu.Root>
<Radio.Root data-case="radio" {checked} value="only" onCheckedChange={count("radio")}><Radio.Indicator/></Radio.Root>
<Menu.Root data-case="item-menu" defaultOpen modal={false}><Menu.Trigger>Items</Menu.Trigger><Menu.Portal><Menu.Popup>
<Menu.CheckboxItem data-case="checkbox-item" closeOnClick={false} {checked} onCheckedChange={count("checkbox-item")}>Check</Menu.CheckboxItem>
<Menu.RadioGroup data-case="radio-group" value={radio} onValueChange={count("radio-group")}><Menu.RadioItem data-radio="a" value="a" closeOnClick={false}>A</Menu.RadioItem><Menu.RadioItem data-radio="b" value="b" closeOnClick={false}>B</Menu.RadioItem></Menu.RadioGroup>
</Menu.Popup></Menu.Portal></Menu.Root>`;

const CLIENT = `import { flushSync, mount, tick } from "svelte";
import App from "./ParentOwned.svelte";
const result = {};
const assert = (value, message) => { if (!value) throw new Error(message); };
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const settle = async () => { flushSync(); await tick(); await wait(60); flushSync(); };
const part = (name) => document.querySelector('[data-case="' + name + '"]');
const trigger = (name) => document.querySelector('[data-trigger="' + name + '"]');
const state = (name) => part(name).getAttribute("data-state");
try {
  const app = mount(App, { target: document.getElementById("app") });
  await settle();
  const roots = ["alert-dialog", "drawer", "popover", "tooltip", "preview-card", "menu", "context-menu"];
  const request = {
    tooltip: () => trigger("tooltip").focus(),
    "preview-card": () => trigger("preview-card").focus(),
    "context-menu": () => trigger("context-menu").dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 4, clientY: 4 })),
  };
  for (const name of roots) {
    assert(state(name) === "closed", name + " starts closed");
    (request[name] ?? (() => trigger(name).click()))();
    await settle();
    assert(app.snapshot().calls[name] === 1, name + " proposes once: " + JSON.stringify(app.snapshot().calls));
    assert(state(name) === "closed", name + " keeps a refused open");
    trigger(name).blur();
    await settle();
  }
  app.setOpen(true);
  await settle();
  for (const name of roots) assert(state(name) === "open", name + " follows the parent command");
  app.setOpen(false);
  await settle();
  for (const name of roots) assert(state(name) === "closed", name + " follows the parent close");
  trigger("navigation-menu").click();
  await settle();
  assert(app.snapshot().calls["navigation-menu"] === 1, "Navigation Menu proposes once");
  assert(state("navigation-menu") === "closed", "Navigation Menu keeps a refused value");
  app.setNav("a");
  await settle();
  assert(state("navigation-menu") === "open", "Navigation Menu follows the parent command");
  app.setNav(null);
  await settle();
  part("radio").click();
  await settle();
  assert(app.snapshot().calls.radio === 1 && part("radio").getAttribute("aria-checked") === "false", "Radio keeps a refused change");
  app.setChecked(true);
  await settle();
  assert(part("radio").getAttribute("aria-checked") === "true", "Radio follows the parent command");
  app.setChecked(false);
  await settle();
  const item = part("checkbox-item");
  item.click();
  await settle();
  assert(app.snapshot().calls["checkbox-item"] === 1 && item.getAttribute("aria-checked") === "false", "CheckboxItem keeps a refused change");
  app.setChecked(true);
  await settle();
  assert(item.getAttribute("aria-checked") === "true", "CheckboxItem follows the parent command");
  document.querySelector('[data-radio="b"]').click();
  await settle();
  assert(app.snapshot().calls["radio-group"] === 1 && document.querySelector('[data-radio="a"]').getAttribute("aria-checked") === "true" && document.querySelector('[data-radio="b"]').getAttribute("aria-checked") === "false", "RadioGroup keeps a refused change");
  app.setRadio("b");
  await settle();
  assert(document.querySelector('[data-radio="b"]').getAttribute("aria-checked") === "true", "RadioGroup follows the parent command");
  const comboInput = document.querySelector('[data-input="combobox"]');
  const comboState = () => [part("combobox").querySelector("[data-sw-combobox-hidden-input]").value, comboInput.value, state("combobox")].join();
  trigger("combobox").click();
  await settle();
  assert(app.snapshot().calls["combo-open"] === 1 && comboState() === "astro,Astro,closed", "Combobox keeps a refused open: " + comboState());
  comboInput.value = "rea";
  comboInput.dispatchEvent(new Event("input", { bubbles: true }));
  await settle();
  assert(app.snapshot().calls["combo-text"] === 1 && comboInput.value === "Astro", "Combobox repairs refused text: " + comboInput.value);
  app.setCombo({ open: true });
  await settle();
  assert(state("combobox") === "open", "Combobox follows the parent open");
  document.querySelector('[data-item="combobox-react"]').click();
  await settle();
  assert(app.snapshot().calls["combo-value"] === 1 && comboState().startsWith("astro,Astro,"), "Combobox keeps a refused value: " + comboState());
  app.setCombo({ value: "react", text: "React", open: false });
  await settle();
  assert(comboState() === "react,React,closed", "Combobox follows the parent commands: " + comboState());
  document.getElementById("combo-form").reset();
  await settle();
  assert(comboState() === "react,React,closed", "Combobox reset keeps the parent values: " + comboState());
  const order = [];
  const boundRoot = part("bound-combobox");
  boundRoot.addEventListener("starwind:value-change", (event) => order.push("value:" + event.detail.value));
  boundRoot.addEventListener("starwind:input-value-change", (event) => order.push("input:" + event.detail.inputValue + ":" + event.detail.reason));
  boundRoot.addEventListener("starwind:open-change", (event) => order.push("open:" + event.detail.open));
  trigger("bound-combobox").click();
  await settle();
  assert(app.bound().open === true && state("bound-combobox") === "open", "bind:open accepts");
  order.length = 0;
  document.querySelector('[data-item="bound-combobox-react"]').click();
  await settle();
  assert(order.join() === "value:react,input:React:item-press,open:false", "item press order: " + order.join());
  assert(JSON.stringify(app.bound()) === JSON.stringify({ value: "react", text: "React", open: false }), "bind: receives each item press model: " + JSON.stringify(app.bound()));
  order.length = 0;
  document.querySelector('[data-clear="bound-combobox"]').click();
  await settle();
  assert(order.join() === "value:null,input::clear", "clear order: " + order.join());
  assert(app.bound().value === null && app.bound().text === "", "bind: receives each clear model: " + JSON.stringify(app.bound()));
  document.getElementById("bound-form").reset();
  await settle();
  assert(app.bound().value === null && app.bound().text === "", "bound reset keeps the parent values: " + JSON.stringify(app.bound()));
  result.roots = [...roots, "navigation-menu", "radio", "checkbox-item", "radio-group", "combobox"];
} catch (error) {
  result.error = error.stack ?? String(error);
}
document.documentElement.dataset.parentOwned = JSON.stringify(result);
`;
