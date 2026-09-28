import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import { BROWSER_BUILD } from "./compatibility-hydration.js";
import type { DistConsumer } from "./dist-consumer.js";

export async function verifyProgressLifecycle(consumer: DistConsumer) {
  await consumer.write({
    "ProgressLifecycle.svelte": APP,
    "hydrate-main.js": CLIENT,
    "build-progress.mjs": BROWSER_BUILD,
    "progress-ssr.mjs": `import assert from "node:assert/strict";import {render} from "svelte/server";import App from "./ProgressLifecycle.svelte";import Progress,* as named from "./progress/index.js";
assert.equal(globalThis.document,undefined);assert.equal(Progress,named.Progress);const body=render(App).body;assert.equal(body,render(App).body);console.log(JSON.stringify({body}));`,
  });
  const { body } = JSON.parse(await consumer.run("progress-ssr.mjs", { loader: true }));
  assert.match(body, /data-value="35"/);
  assert.match(body, /data-min="0"/);
  assert.match(body, /data-max="100"/);
  assert.match(body, /role="progressbar"/);
  assert.match(body, /data-preserve-text/);
  assert.match(body, /transform: translateX\(-65%\)/);
  assert.match(body, /data-indeterminate/);
  assert.doesNotMatch(body, /\[object Object\]/);
  const build = JSON.parse(await consumer.run("build-progress.mjs"));
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
    await page.waitForFunction(() => document.documentElement.dataset.progressResult, undefined, {
      timeout: 30000,
    });
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.progressResult!),
    );
    assert.deepEqual(diagnostics, []);
    assert.equal(result.error, undefined, JSON.stringify(result));
    for (const name of [
      "hydrationExact",
      "setters",
      "formatting",
      "valueText",
      "labelLinks",
      "styleOwnership",
      "nativeOwnership",
      "isolation",
      "cleanup",
    ])
      assert.equal(result[name], true, name);
    return { result, build };
  } finally {
    await browser?.close();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

const APP = `<script lang="ts">
import Primitive, { type ProgressValue } from "@starwind-ui/svelte/progress";
import Progress from "./progress/index.js";
import { createAttachmentKey, type Attachment } from "svelte/attachments";
let value = $state<ProgressValue>(35), min = $state(0), max = $state(100);
let format = $state<Intl.NumberFormatOptions | undefined>();
let locale = $state<Intl.LocalesArgument>("en-US");
let formatter = $state<((formatted: string | null, value: ProgressValue) => string) | undefined>();
let ariaText = $state<string | undefined>(), ariaLabel = $state<string | undefined>(), labelledBy = $state<string | undefined>();
let customText = $state("Caller");
let labelKey = $state(0), indicatorKey = $state(0), valueKey = $state(0);
let labelId = $state<string | undefined>("before");
let className = $state("initial"), indicatorStyle = $state("background: red; transform: rotate(3deg) !important");
let refVersion = $state(0), attachmentVersion = $state(0), dependency = $state(0);
const refs = new Map<string, HTMLElement>(), attachments = new Map<string, HTMLElement>();
const refLog: string[] = [], attachmentLog: string[] = [];
let attachmentRuns = 0;
const clicks = { root: 0, indicator: 0, styled: 0 };
const ref = (name: string, version = 0) => (node: HTMLElement | null) => {
  if (node) { if (refs.has(name)) throw new Error("duplicate ref " + name); refs.set(name, node); }
  else refs.delete(name);
  refLog.push(name + ":" + version + ":" + (node ? "set" : "clear"));
};
const trackRef = ref("track"), indicatorRef = ref("indicator"), labelRef = ref("label"), valueRef = ref("value"), staticRef = ref("static"), styledRef = ref("styled");
let rootRef = $derived(ref("root", refVersion));
const attach = (name: string, version = 0): Attachment<HTMLElement> => node => {
  void dependency; attachmentRuns++;
  if (attachments.has(name)) throw new Error("duplicate attachment " + name);
  attachments.set(name,node); attachmentLog.push(name + ":" + version + ":set");
  return () => { if (attachments.get(name) !== node) throw new Error("wrong attachment owner " + name); attachments.delete(name); attachmentLog.push(name + ":" + version + ":clear"); };
};
const attrs = (name: string) => ({ [createAttachmentKey()]: attach(name) });
const trackAttrs = attrs("track"), indicatorAttrs = attrs("indicator"), labelAttrs = attrs("label"), valueAttrs = attrs("value"), staticAttrs = attrs("static"), styledAttrs = attrs("styled");
const rootAttachmentKey = createAttachmentKey();
let rootAttrs = $derived({ [rootAttachmentKey]: attach("root", attachmentVersion) });
export function setRange(next: ProgressValue, low = min, high = max) { value = next; min = low; max = high; }
export function setFormat(next: Intl.NumberFormatOptions | undefined, nextLocale: Intl.LocalesArgument = "en-US") { format = next; locale = nextLocale; }
export function mutateFormat() { if (format) format = {...format, maximumFractionDigits: 0}; }
export function setFormatter(version: number | null) { formatter = version === null ? undefined : (text, next) => version + ":" + (text ?? "pending") + ":" + next; }
export function setAriaText(next?: string) { ariaText = next; }
export function setAriaLabel(next?: string) { ariaLabel = next; }
export function setLabelledBy(next?: string) { labelledBy = next; }
export function updateCustom() { customText = "Updated caller value"; }
export function replaceLabel() { labelKey++; }
export function setLabelId(next?: string) { labelId = next; }
export function replaceIndicator() { indicatorKey++; }
export function replaceValue() { valueKey++; }
export function updatePresentation() { className = "updated"; indicatorStyle = "background: blue; transform: rotate(45deg) !important"; }
export function replaceRef() { refVersion++; }
export function replaceAttachment() { attachmentVersion++; }
export function updateDependency() { dependency++; }
export function snapshot() { return { value, refs: refs.size, attachments: attachments.size, refLog: [...refLog], attachmentLog: [...attachmentLog], attachmentRuns, clicks: { ...clicks }, ownersMatch: [...refs].every(([name,node])=>attachments.get(name)===node) }; }
</script>
<span id="external-label">External label</span>
<Primitive.Root id="progress-root" {value} {min} {max} {format} {locale} getAriaValueText={formatter} aria-valuetext={ariaText} aria-label={ariaLabel} aria-labelledby={labelledBy} class={className} ref={rootRef} {...rootAttrs} onclick={() => clicks.root++}>
  {#key labelKey}<Primitive.Label id={labelId} data-part="label" ref={labelRef} {...labelAttrs}>Transfer</Primitive.Label>{/key}
  <Primitive.Track data-part="track" ref={trackRef} {...trackAttrs}>
    {#key indicatorKey}<Primitive.Indicator data-part="indicator" style={indicatorStyle} class={className} ref={indicatorRef} {...indicatorAttrs} onclick={() => clicks.indicator++} />{/key}
  </Primitive.Track>
  {#key valueKey}<Primitive.Value data-part="value" ref={valueRef} {...valueAttrs} />{/key}
  <Primitive.Value data-part="static" ref={staticRef} {...staticAttrs}><em>{customText} {value ?? "pending"}</em></Primitive.Value>
  <Primitive.Root id="nested-progress" value={20} locale="en-US" format={{ style: "currency", currency: "USD" }} getAriaValueText={(text) => "Nested " + text}><Primitive.Label>Nested</Primitive.Label><Primitive.Indicator /><Primitive.Value /></Primitive.Root>
</Primitive.Root>
<Primitive.Root id="indeterminate-progress" aria-label="Waiting"><Primitive.Indicator /><Primitive.Value /></Primitive.Root>
<Progress id="styled-progress" {value} {min} {max} label="Styled transfer" variant="success" class={className} ref={styledRef} {...styledAttrs} onclick={() => clicks.styled++} />
`;

const CLIENT = `import { hydrate, flushSync, tick, unmount } from "svelte";
import { createProgress } from "@starwind-ui/runtime/progress";
import App from "./ProgressLifecycle.svelte";
const result = {};
const assert = (value,message) => { if (!value) throw new Error(message); };
const settle = async () => { flushSync(); await tick(); flushSync(); await Promise.resolve(); };
const pause = ms => new Promise(resolve => setTimeout(resolve,ms));
const target = document.querySelector("#app");
const root = () => document.getElementById("progress-root");
const part = name => root().querySelector('[data-part="'+name+'"]');
const styled = () => document.getElementById("styled-progress");
const x = element => Number(element.style.transform.match(/translateX\\((-?[\\d.]+)%\\)/)?.[1]);
const before = [root(),part("label"),part("track"),part("indicator"),part("value"),part("static"),styled()];
const app = hydrate(App,{target});
try {
  await settle();
  result.hydrationExact = before.every((node,index) => node === [root(),part("label"),part("track"),part("indicator"),part("value"),part("static"),styled()][index]);
  let snapshot = app.snapshot();
  assert(snapshot.refs === 7 && snapshot.attachments === 7 && snapshot.ownersMatch,"initial owners");
  assert(root().getAttribute("aria-valuenow") === "35" && part("value").textContent === "35%", "initial numeric state");
  assert(root().getAttribute("aria-labelledby") === part("label").id && part("label").id, "initial label link");
  assert(part("label").getAttribute("role") === "presentation" && part("value").getAttribute("aria-hidden") === "true", "part semantics");
  result.labelLinks = true;
  const staticChild = part("static").querySelector("em");
  const controller = createProgress(root());
  const calls = { value:0, format:0, destroy:0 };
  const setValue = controller.setValue.bind(controller), setFormat = controller.setFormatOptions.bind(controller), destroy = controller.destroy.bind(controller);
  controller.setValue = (...args) => { calls.value++; return setValue(...args); };
  controller.setFormatOptions = (...args) => { calls.format++; return setFormat(...args); };
  controller.destroy = () => { calls.destroy++; return destroy(); };
  app.setRange(150,100,0); await settle();
  assert(createProgress(root()) === controller && calls.value === 1 && calls.format === 0, "range changes must use setValue once");
  assert(app.snapshot().value === 150,"outbound value publication");
  for (const element of [root(),styled()]) assert(element.getAttribute("aria-valuenow") === "100" && element.getAttribute("aria-valuemin") === "0" && element.getAttribute("aria-valuemax") === "100" && element.getAttribute("data-status") === "complete", "reversed bounds normalization");
  assert(x(part("indicator")) === 0 && x(styled().querySelector('[data-sw-progress-indicator]')) === 0,"complete transform");
  app.setRange(null); await settle();
  assert(root().getAttribute("data-status") === "indeterminate" && !root().hasAttribute("aria-valuenow") && part("value").textContent === "" && part("indicator").style.transform === "", "null state");
  assert(styled().hasAttribute("data-indeterminate") && styled().querySelector('[data-sw-progress-indicator]').style.transform === "", "Styled null state");
  app.setRange(Number.NaN,0,100); await settle();
  assert(root().getAttribute("data-status") === "indeterminate" && styled().getAttribute("data-status") === "indeterminate","non-finite value");
  app.setRange(30,50,50); await settle();
  assert(root().getAttribute("aria-valuenow") === "50" && x(part("indicator")) === 0,"zero-length range");
  app.setRange(37.25,0,100); await settle();
  const valueCalls = calls.value;
  app.setFormat({ style:"decimal", maximumFractionDigits:2 }, "de-DE"); await settle();
  assert(createProgress(root()) === controller && calls.value === valueCalls && calls.format === 1,"format changes must use setFormatOptions");
  assert(part("value").textContent === "37,25" && root().getAttribute("aria-valuetext") === "37,25","locale formatting");
  app.mutateFormat(); await settle();
  assert(part("value").textContent === "37" && calls.format === 2,"reactive format field");
  app.setFormatter(1); await settle();
  assert(root().getAttribute("aria-valuetext") === "1:37:37.25","formatter");
  app.setFormatter(2); await settle();
  assert(root().getAttribute("aria-valuetext") === "2:37:37.25","latest formatter");
  app.setAriaText("Manual value"); await settle();
  assert(root().getAttribute("aria-valuetext") === "Manual value","explicit aria value text");
  app.setAriaText(undefined); await settle();
  assert(root().getAttribute("aria-valuetext") === "2:37:37.25","removed explicit aria value text");
  app.setFormatter(null); app.setFormat(undefined); await settle();
  assert(part("value").textContent === "37%" && root().getAttribute("aria-valuetext") === "37%","format clearing");
  result.setters = true; result.formatting = true;
  const beforePresentation = { ...calls };
  app.updatePresentation(); await settle();
  assert(createProgress(root()) === controller && calls.value === beforePresentation.value && calls.format === beforePresentation.format,"presentation update called setters");
  assert(x(part("indicator")) === -63 && part("indicator").style.background === "blue" && part("indicator").classList.contains("updated"),"Runtime indicator transform was overwritten");
  assert(x(styled().querySelector('[data-sw-progress-indicator]')) === -63,"Styled indicator transform was overwritten");
  assert(part("static").querySelector("em") === staticChild && staticChild.textContent === "Caller 37.25", "caller Value subtree changed");
  result.styleOwnership = true;
  app.replaceRef(); await settle();
  assert(app.snapshot().refLog.slice(-2).join(",") === "root:0:clear,root:1:set" && createProgress(root()) === controller,"ref replacement");
  app.replaceAttachment(); await settle();
  assert(app.snapshot().attachmentLog.slice(-2).join(",") === "root:0:clear,root:1:set","attachment replacement");
  const runs = app.snapshot().attachmentRuns; app.updateDependency(); await settle();
  assert(app.snapshot().attachmentRuns === runs + 7 && app.snapshot().ownersMatch,"reactive public attachments");
  part("indicator").click(); styled().click(); await settle();
  assert(JSON.stringify(app.snapshot().clicks) === JSON.stringify({ root:1,indicator:1,styled:1 }),"native events");
  result.nativeOwnership = true;
  const oldValue = part("value"); app.updateCustom(); app.setRange(45); await settle();
  assert(part("value") === oldValue && part("value").textContent === "45%" && !part("value").hasAttribute("data-preserve-text"),"stable generated Value");
  assert(part("static").querySelector("em") === staticChild && staticChild.textContent === "Updated caller value 45","caller Value text ownership");
  assert(createProgress(root()) === controller && calls.destroy === 0,"stable Value updates recreated Runtime");
  result.valueText = true;
  app.setRange(65); await settle();
  assert(x(part("indicator")) === -35 && app.snapshot().ownersMatch,"stable indicator ownership");
  result.isolation = document.getElementById("nested-progress").getAttribute("aria-valuetext") === "Nested $20.00" && document.getElementById("indeterminate-progress").getAttribute("data-status") === "indeterminate";
  app.setRange(null); await settle(); app.setRange(70); await settle();
  const detachedRoot = root(), detachedIndicator = part("indicator"), detachedValue = part("value");
  assert(detachedIndicator.hasAttribute("data-instant"),"expected pending mode-change frame");
  const transform = detachedIndicator.style.transform, text = detachedValue.textContent;
  await unmount(app); await settle();
  detachedRoot.setAttribute("data-value","2"); await pause(60);
  snapshot = app.snapshot();
  assert(snapshot.refs === 0 && snapshot.attachments === 0 && target.children.length === 0,"unmount owners");
  assert(!detachedIndicator.hasAttribute("data-instant") && detachedIndicator.style.transform === transform && detachedValue.textContent === text,"observer or frame cleanup");
  result.cleanup = true;
} catch(error) { result.error = error.stack ?? String(error); }
document.documentElement.dataset.progressResult = JSON.stringify(result);
`;
