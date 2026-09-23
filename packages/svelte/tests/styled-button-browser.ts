import assert from "node:assert/strict";
import path from "node:path";

import { svelte } from "@sveltejs/vite-plugin-svelte";
import { chromium } from "playwright";
import { createServer } from "vite";

import type { DistConsumer } from "./dist-consumer.js";

export async function verifyStyledButtonBrowser(consumer: DistConsumer) {
  await consumer.write({
    "App.svelte": APP,
    "main.js": MAIN,
    "ssr.mjs": `import { render } from "svelte/server"; import App from "./App.svelte";
if (typeof document !== "undefined" || typeof window !== "undefined") throw new Error("SSR has DOM globals");
console.log(JSON.stringify({ body: render(App).body }));`,
  });
  const { body } = JSON.parse(await consumer.run("ssr.mjs", { loader: true }));
  assert.equal((body.match(/<button\b/g) ?? []).length, 4);
  assert.equal((body.match(/<a\b/g) ?? []).length, 1);
  await consumer.write({
    "index.html": `<link rel="icon" href="data:,"><div id="app">${body}</div><script type="module" src="/main.js"></script>`,
  });
  const server = await createServer({
    root: consumer.root,
    configFile: false,
    cacheDir: path.join(consumer.root, ".vite-styled-button"),
    logLevel: "silent",
    plugins: [svelte({ hot: false })],
    resolve: { dedupe: ["svelte"] },
    server: { host: "127.0.0.1", port: 0, strictPort: false, watch: null, hmr: false },
  });
  let browser;
  try {
    await server.listen();
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage();
    const diagnostics: string[] = [];
    let lastPhase = "startup";
    let rejectPage!: (error: Error) => void;
    const pageFailure = new Promise<never>((_, reject) => {
      rejectPage = reject;
    });
    page.on("pageerror", (error) => rejectPage(error));
    page.on("console", (message) => {
      if (message.text().startsWith("styled-phase:")) lastPhase = message.text().slice(13);
      if (["warning", "error"].includes(message.type())) diagnostics.push(message.text());
    });
    page.on("response", (response) => {
      if (response.status() >= 400) rejectPage(new Error(`${response.status()} ${response.url()}`));
    });
    const url = server.resolvedUrls?.local[0];
    if (!url) throw new Error("Styled Button browser server has no URL");
    await Promise.race([
      pageFailure,
      (async () => {
        await page.goto(url, { waitUntil: "commit" });
        await page.waitForFunction(
          () => document.documentElement.dataset.styledButtonResult,
          undefined,
          { timeout: 30_000 },
        );
      })(),
    ]).catch((error) => {
      throw new Error(`${String(error)}; last phase: ${lastPhase}`);
    });
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.styledButtonResult!),
    );
    assert.deepEqual(diagnostics, []);
    const buttonAttachments = result.attachments.filter((entry: string) =>
      entry.startsWith("button-"),
    );
    assert.ok(buttonAttachments.includes("button-a:setup"));
    assert.ok(buttonAttachments.includes("button-b:setup"));
    assert.equal(
      buttonAttachments.filter((entry: string) => entry.endsWith(":setup")).length,
      buttonAttachments.filter((entry: string) => entry.endsWith(":cleanup")).length,
    );
    const anchorAttachments = result.attachments.filter((entry: string) =>
      entry.startsWith("anchor:"),
    );
    assert.equal(anchorAttachments[0], "anchor:setup");
    assert.equal(anchorAttachments.at(-1), "anchor:cleanup");
    assert.equal(
      anchorAttachments.filter((entry: string) => entry.endsWith(":setup")).length,
      anchorAttachments.filter((entry: string) => entry.endsWith(":cleanup")).length,
    );
    const { attachments: _attachments, ...state } = result;
    assert.deepEqual(state, {
      hydrated: true,
      buttons: 4,
      links: 1,
      clicks: 1,
      anchorClicks: 1,
      selectOpen: false,
      dialogOpen: false,
      popoverOpen: false,
      refs: [
        "button:BUTTON",
        "anchor-a:A",
        "anchor-a:null",
        "anchor-b:A",
        "button:null",
        "anchor-b:null",
      ],
      remainingNodes: 0,
      staleCallbacks: 0,
    });
    return result;
  } finally {
    await browser?.close();
    await server.close();
  }
}

const APP = `<script lang="ts">
import type { ClassValue } from "svelte/elements";
import { createAttachmentKey, type Attachment } from "svelte/attachments";
import { Button } from "./button/index.js";
import type { ButtonChildPayload } from "@starwind-ui/svelte/button";
import Select from "@starwind-ui/svelte/select";
import Dialog from "@starwind-ui/svelte/dialog";
import Popover from "@starwind-ui/svelte/popover";
let disabled = $state(false);
let useSecondRef = $state(false);
let classValue = $state<ClassValue>(["consumer-class", { "object-class": true }]);
let selectOpen = $state<boolean | undefined>(undefined);
let dialogOpen = $state<boolean | undefined>(undefined);
let popoverOpen = $state<boolean | undefined>(undefined);
let clicks = 0;
let anchorClicks = 0;
const refs: string[] = [];
const attachments: string[] = [];
const buttonRef = (element: HTMLButtonElement | null) => { refs.push("button:" + (element?.tagName ?? "null")); };
const anchorRefA = (element: HTMLAnchorElement | null) => { refs.push("anchor-a:" + (element?.tagName ?? "null")); };
const anchorRefB = (element: HTMLAnchorElement | null) => { refs.push("anchor-b:" + (element?.tagName ?? "null")); };
const attachment = (name: string): Attachment<HTMLElement> => (_element) => {
  attachments.push(name + ":setup");
  return () => { attachments.push(name + ":cleanup"); };
};
const key = createAttachmentKey();
let buttonAttachments = $state.raw({ [key]: attachment("button-a") });
const anchorAttachments = { [createAttachmentKey()]: attachment("anchor") };
export function updateClass() { classValue = ["next-class", { "next-object": true }]; }
export function replaceRef() { useSecondRef = true; }
export function replaceAttachment() { buttonAttachments = { [key]: attachment("button-b") }; }
export function setDisabled(value: boolean) { disabled = value; }
export function snapshot() { return { clicks, anchorClicks, selectOpen, dialogOpen, popoverOpen, refs: [...refs], attachments: [...attachments] }; }
</script>
{#snippet forwarding({ props, children }: ButtonChildPayload)}
  <Button {...props} variant="secondary">{@render children?.()}</Button>
{/snippet}
<Button id="native-button" ref={buttonRef} {...buttonAttachments} class={classValue} {disabled} onclick={() => clicks++}>Save</Button>
<Button id="native-anchor" as="a" href="/docs" tabindex={3} ref={useSecondRef ? anchorRefB : anchorRefA} {...anchorAttachments} class={classValue} {disabled} onclick={(event) => { event.preventDefault(); anchorClicks++; }}>Docs</Button>
<Select.Root bind:open={selectOpen} defaultValue="alpha">
  <Select.Trigger id="composed-select" data-slot="select-trigger" child={forwarding}><Select.Value placeholder="Choose" /></Select.Trigger>
  <Select.Positioner><Select.Popup><Select.List><Select.Item value="alpha"><Select.ItemText>Alpha</Select.ItemText></Select.Item></Select.List></Select.Popup></Select.Positioner>
</Select.Root>
<Dialog.Root bind:open={dialogOpen}>
  <Dialog.Trigger id="composed-dialog" data-slot="dialog-trigger" child={forwarding}>Open dialog</Dialog.Trigger>
  <Dialog.Popup><Dialog.Title>Dialog title</Dialog.Title><Dialog.Description>Dialog description</Dialog.Description></Dialog.Popup>
</Dialog.Root>
<Popover.Root bind:open={popoverOpen}>
  <Popover.Trigger id="composed-popover" data-slot="popover-trigger" child={forwarding}>Open popover</Popover.Trigger>
  <Popover.Portal><Popover.Viewport><Popover.Positioner><Popover.Popup>Popover content</Popover.Popup></Popover.Positioner></Popover.Viewport></Popover.Portal>
</Popover.Root>
`;

const MAIN = `import { hydrate, flushSync, tick, unmount } from "svelte";
import App from "./App.svelte";
const assert = (value, message) => { if (!value) throw new Error(message); };
const target = document.querySelector("#app");
const before = [...target.querySelectorAll("button, a")];
const app = hydrate(App, { target });
const settle = async () => { flushSync(); await tick(); flushSync(); };
await settle();
const button = document.getElementById("native-button");
const anchor = document.getElementById("native-anchor");
assert(before.every((element, index) => element === target.querySelectorAll("button, a")[index]), "Hydration replaced semantic nodes");
assert(button.classList.contains("consumer-class") && button.classList.contains("object-class"), "Native Svelte class arrays were lost");
assert(anchor.classList.contains("consumer-class"), "Anchor classes were lost");
assert(button.type === "button", "Button default type changed");
assert(anchor.getAttribute("href") === "/docs" && anchor.tabIndex === 3, "Enabled anchor semantics");
button.click(); anchor.click(); await settle();
const setup = app.snapshot();
app.updateClass(); await settle();
assert(JSON.stringify(app.snapshot().refs) === JSON.stringify(setup.refs), "Class change recreated refs");
assert(button.classList.contains("next-object") && anchor.classList.contains("next-class"), "Updated classes were lost");
app.replaceRef(); await settle();
assert(anchor === document.getElementById("native-anchor"), "Replacing the ref replaced the anchor");
app.replaceAttachment(); await settle();
app.setDisabled(true); await settle();
assert(button.disabled === true, "Native disabled button was lost");
button.click(); await settle();
assert(app.snapshot().clicks === 1, "Disabled button emitted a click");
assert(!anchor.hasAttribute("href") && anchor.getAttribute("aria-disabled") === "true" && anchor.hasAttribute("data-disabled") && anchor.tabIndex === -1, "Disabled anchor semantics");
app.setDisabled(false); await settle();
assert(anchor.getAttribute("href") === "/docs" && !anchor.hasAttribute("aria-disabled") && anchor.tabIndex === 3, "Anchor did not restore its native state");
const select = document.getElementById("composed-select");
const dialog = document.getElementById("composed-dialog");
const popover = document.getElementById("composed-popover");
assert(select.tagName === "BUTTON" && select.getAttribute("data-slot") === "select-trigger" && select.hasAttribute("data-sw-select-trigger"), "Select child payload did not reach one Styled button");
assert(dialog.tagName === "BUTTON" && dialog.getAttribute("data-slot") === "dialog-trigger" && dialog.hasAttribute("data-sw-dialog-trigger"), "Dialog child payload did not reach one Styled button");
assert(popover.tagName === "BUTTON" && popover.getAttribute("data-slot") === "popover-trigger" && popover.hasAttribute("data-sw-popover-trigger"), "Popover child payload did not reach one Styled button");
console.log("styled-phase:before select open");
select.click(); await settle();
console.log("styled-phase:after select open");
assert(app.snapshot().selectOpen === true && select.getAttribute("aria-expanded") === "true", "Select child lost its Runtime attachment");
console.log("styled-phase:before select close");
select.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); await settle();
assert(app.snapshot().selectOpen === false, "Select did not close");
console.log("styled-phase:before dialog open");
dialog.click(); await settle();
console.log("styled-phase:after dialog open");
assert(app.snapshot().dialogOpen === true && document.querySelector("dialog").open, "Dialog child lost its Runtime attachment");
console.log("styled-phase:before dialog close");
document.querySelector("dialog").dispatchEvent(new Event("cancel", { bubbles: true, cancelable: true })); await settle();
assert(app.snapshot().dialogOpen === false, "Dialog did not close");
console.log("styled-phase:before popover open");
popover.click(); await settle();
assert(app.snapshot().popoverOpen === true && popover.getAttribute("aria-expanded") === "true", "Popover child lost its Runtime attachment");
console.log("styled-phase:before popover close");
popover.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); await settle();
assert(app.snapshot().popoverOpen === false, "Popover did not close");
console.log("styled-phase:before unmount");
const prior = app.snapshot();
await unmount(app); await settle();
anchor.removeAttribute("href");
button.click(); anchor.click(); select.click(); dialog.click(); popover.click(); await settle();
const final = app.snapshot();
document.documentElement.dataset.styledButtonResult = JSON.stringify({ hydrated: true, buttons: before.filter((element) => element.tagName === "BUTTON").length, links: before.filter((element) => element.tagName === "A").length, ...final, remainingNodes: target.querySelectorAll("*").length, staleCallbacks: final.clicks + final.anchorClicks - prior.clicks - prior.anchorClicks });
`;
