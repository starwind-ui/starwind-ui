import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import { BROWSER_BUILD } from "./compatibility-hydration.js";
import type { DistConsumer } from "./dist-consumer.js";

export async function verifyInputLifecycle(
  consumer: DistConsumer,
  owner: "input" | "input-group" = "input",
) {
  const componentName = owner === "input" ? "Input" : "InputGroupInput";
  const app =
    owner === "input"
      ? APP
      : APP.replace(
          'import Primitive, { type InputValue } from "@starwind-ui/svelte/input";',
          'import Group from "./input-group/index.js"; import type { InputValue } from "@starwind-ui/svelte/input"; const Primitive = { Root: Group.Input };',
        ).replace(
          'import Input from "./input/index.js";',
          'import { InputGroupInput as Input } from "./input-group/index.js";',
        );
  await consumer.write({
    "InputLifecycle.svelte": app,
    "hydrate-main.js": CLIENT,
    "build-input.mjs": BROWSER_BUILD,
    "input-ssr.mjs": `import assert from "node:assert/strict";import {render} from "svelte/server";import App from "./InputLifecycle.svelte";import OwnerDefault,* as named from "./${owner}/index.js";const Input = ${owner === "input" ? "OwnerDefault" : "OwnerDefault.Input"};
assert.equal(globalThis.document,undefined);assert.equal(Input,named.${componentName});render(Input, { props: { value: ["server"], ref() { throw new Error("SSR ref write"); }, onValueChange() { throw new Error("SSR callback"); } } });const body=render(App).body;assert.equal(body,render(App).body);console.log(JSON.stringify({body}));`,
  });
  const { body } = JSON.parse(await consumer.run("input-ssr.mjs", { loader: true }));
  assert.match(body, /value="a,b"/);
  assert.doesNotMatch(body, /\[object Object\]/);
  const build = JSON.parse(await consumer.run("build-input.mjs"));
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
    await page.waitForFunction(() => document.documentElement.dataset.inputResult, undefined, {
      timeout: 30000,
    });
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.inputResult!),
    );
    assert.deepEqual(diagnostics, []);
    assert.equal(result.error, undefined, JSON.stringify(result));
    assert.equal(result.complete, true, JSON.stringify(result));
    return { result, build };
  } finally {
    await browser?.close();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

const APP = `<script lang="ts">
import Primitive, { type InputValue } from "@starwind-ui/svelte/input";
import Input from "./input/index.js";
import { createAttachmentKey } from "svelte/attachments";
let bound = $state<InputValue | undefined>(), plain = $state<InputValue | undefined>(["a", "b"]);
let functional = $state<InputValue | undefined>("start"), file = $state<InputValue | undefined>();
let styledPlain = $state<InputValue>(["s", "t"]);
let numeric = $state<InputValue | undefined>(7), array = $state<InputValue | undefined>(["x", "y"]);
let inputType = $state<"text" | "file">("text");
let disabled = $state(false), readonly = $state(false), form = $state("external");
let key = $state(0), refVersion = $state(0), attachmentVersion = $state(0), attachmentPresent = $state(true);
let defaultValue = $state<InputValue>("seed");
const calls = { value: 0, input: 0, change: 0, setter: 0, refs: 0, clear: 0, attach: 0, detach: 0 };
let cancel = false, command: InputValue | undefined, transform = "uppercase";
const log: string[] = [];
const ref = (version: number) => (node: HTMLInputElement | null) => { calls[node ? "refs" : "clear"]++; log.push(version + (node ? ":set" : ":clear")); };
let callback = $derived(ref(refVersion));
const attachmentKey = createAttachmentKey();
let attachments = $derived(attachmentPresent ? { [attachmentKey]: (node: HTMLInputElement) => { void attachmentVersion; if (node.tagName !== "INPUT") throw new Error("attachment owner"); calls.attach++; return () => { calls.detach++; }; } } : {});
export function set(next: InputValue | undefined) { bound = next; }
export function setPlain(next: InputValue | undefined) { plain = next; }
export function mutateStyledArray() { if (Array.isArray(styledPlain)) styledPlain = [...styledPlain, "u"]; }
export function mutateArray() { if (Array.isArray(plain)) plain = [...plain, "c"]; }
export function configure(next: { disabled?: boolean; readonly?: boolean; cancel?: boolean; command?: InputValue; form?: string; defaultValue?: InputValue }) { if (next.disabled !== undefined) disabled = next.disabled; if (next.readonly !== undefined) readonly = next.readonly; cancel = next.cancel ?? false; command = next.command; if (next.form) form = next.form; if (next.defaultValue !== undefined) defaultValue = next.defaultValue; }
export function replace() { key++; }
export function replaceRef() { refVersion++; }
export function replaceAttachment() { attachmentVersion++; }
export function removeAttachment() { attachmentPresent = false; }
export function addAttachment() { attachmentPresent = true; }
export function setType(next: "text" | "file") { inputType = next; }
export function setTransform(next: string) { transform = next; }
export function setFile(next: InputValue) { file = next; }
export function snapshot() { return { bound, plain, functional, file, numeric, array, calls: {...calls}, log: [...log] }; }
</script>
<form id="external"></form><form id="other"></form>
{#key key}<Primitive.Root id="bound" type={inputType} {form} name="bound" bind:value={bound} {defaultValue} {disabled} {readonly} ref={callback} {...attachments} onValueChange={(next, detail) => { calls.value++; if (cancel) detail.cancel(); if (command !== undefined) bound = command; }} oninput={() => calls.input++} onchange={() => calls.change++} />{/key}
<Primitive.Root id="plain" form="external" value={plain} />
<Input id="styled-plain" form="external" value={styledPlain} />
<Primitive.Root id="omitted" />
<Input id="styled" form="external" name="styled" defaultValue="styled seed" bind:value={() => functional, next => { calls.setter++; if (transform !== "retain") functional = transform === "uppercase" && typeof next === "string" ? next.toUpperCase() : next; }} />
<Input id="file" type="file" bind:value={file} />
<Input id="number" type="number" value={12} />
<Primitive.Root id="numeric-bound" form="external" bind:value={numeric} /><Primitive.Root id="array-bound" form="external" bind:value={array} />
<form id="validation" data-sw-form data-validation-timing="change"><div data-sw-field data-name="field"><Primitive.Root id="validated-input" data-sw-field-control name="field" onValueChange={(next, detail) => { if (next === "canceled") detail.cancel(); }} /></div></form>
`;
const CLIENT = `import { hydrate, flushSync, tick, unmount } from "svelte";
import { createInput } from "@starwind-ui/runtime/input";
import { createForm } from "@starwind-ui/runtime/form";
import App from "./InputLifecycle.svelte";
const result = {};
const assert = (value, message) => { if (!value) throw new Error(message + " " + JSON.stringify(app.snapshot())); };
const settle = async () => { flushSync(); await tick(); flushSync(); await Promise.resolve(); };
const pause = () => new Promise(resolve => setTimeout(resolve,20));
const input = id => document.getElementById(id);
const type = (id, value) => { input(id).value = value; input(id).dispatchEvent(new Event("input", { bubbles:true })); };
const target = document.querySelector("#app"), before = input("bound");
const discoveryObservers = new Set();
const originalObserve = MutationObserver.prototype.observe, originalDisconnect = MutationObserver.prototype.disconnect;
MutationObserver.prototype.observe = function(node, options) { if(node === document && options.attributeFilter?.includes("form")) discoveryObservers.add(this); return originalObserve.call(this,node,options); };
MutationObserver.prototype.disconnect = function() { discoveryObservers.delete(this); return originalDisconnect.call(this); };
const app = hydrate(App, { target });
try {
 await settle();
 assert(discoveryObservers.size === 1, "one shared Input discovery observer");
 assert(input("bound") === before && app.snapshot().bound === "seed", "hydration/undefined initialization");
 assert(input("plain").value === "a,b" && input("omitted").value === "" && input("number").value === "12", "initial normalization");
 assert(app.snapshot().numeric === 7 && JSON.stringify(app.snapshot().array) === JSON.stringify(["x","y"]), "defined bound shapes");
 type("numeric-bound", "9"); type("array-bound", "z"); await settle(); assert(app.snapshot().numeric === "9" && app.snapshot().array === "z", "bound normalized native output");
 let validations = 0; const formController = createForm(input("validation"), { fieldValidators: { field: () => { validations++; return null; } } });
 type("validated-input", "accepted"); await pause(); await settle(); assert(validations > 0, "Form change validation"); const validated = validations; type("validated-input", "canceled"); await pause(); await settle(); assert(validations === validated && input("validated-input").value === "canceled", "canceled detail suppresses Form validation"); formController.destroy();
 app.mutateArray(); await settle(); assert(input("plain").value === "a,b,c", "array mutation");
 type("plain", "edited-array"); await settle(); app.mutateArray(); await settle(); assert(input("plain").value === "a,b,c,c", "array command after native publication");
 type("styled-plain", "edited-array"); await settle(); app.mutateStyledArray(); await settle(); assert(input("styled-plain").value === "s,t,u", "Styled array command after native publication");
 input("external").reset(); await pause(); await settle(); app.mutateArray(); app.mutateStyledArray(); await settle();
 assert(input("plain").value === "a,b,c,c,c", "array command after reset publication");
 assert(input("styled-plain").value === "s,t,u,u", "Styled array command after reset publication");
 app.setPlain(45); await settle(); assert(input("plain").value === "45" && app.snapshot().plain === 45, "silent plain number");
 type("plain", "edited"); await settle(); assert(app.snapshot().plain === 45 && input("plain").value === "edited", "plain native acceptance");
 app.setPlain(undefined); await settle(); assert(input("plain").value === "edited", "later undefined");
 const controller = createInput(input("bound"));
 app.set("command"); await settle(); assert(input("bound").value === "command" && app.snapshot().calls.value === 0 && createInput(input("bound")) === controller, "silent setter");
 app.set(undefined); await settle(); assert(input("bound").value === "command", "bound later undefined");
 app.configure({ cancel:true }); type("bound", "canceled detail"); await settle();
 assert(app.snapshot().bound === "canceled detail" && controller.getValue() === "canceled detail" && app.snapshot().calls.value === 1 && app.snapshot().calls.input === 1, "native cancellation must publish");
 input("bound").dispatchEvent(new Event("change", {bubbles:true})); await settle(); assert(app.snapshot().calls.change === 1 && app.snapshot().calls.value === 1, "native change once");
 app.configure({}); type("bound", "old"); await settle(); app.set("newer"); await settle(); assert(app.snapshot().bound === "newer" && input("bound").value === "newer", "parent command after accepted input");
 app.configure({}); const writes = app.snapshot().calls.setter; type("styled", "mixed"); await settle(); assert(app.snapshot().functional === "MIXED" && input("styled").value === "MIXED" && app.snapshot().calls.setter === writes + 1, "function one write/readback");
 app.setTransform("retain"); type("styled", "discard"); await settle(); assert(app.snapshot().functional === "MIXED" && input("styled").value === "MIXED" && app.snapshot().calls.setter === writes + 2, "retained getter readback");
 app.setTransform("identity"); type("styled", "identity"); await settle(); assert(app.snapshot().functional === "identity" && app.snapshot().calls.setter === writes + 3, "identity getter"); app.setTransform("uppercase");
 app.configure({disabled:true, readonly:true}); await settle(); assert(input("bound").disabled && input("bound").readOnly && !new FormData(input("external")).has("bound"), "disabled readonly native form");
 app.configure({disabled:false}); await settle(); assert(new FormData(input("external")).get("bound") === "newer", "FormData");
 const valueCalls = app.snapshot().calls.value;
 app.configure({defaultValue:"late"}); input("external").reset(); await pause(); await settle();
 assert(app.snapshot().bound === "seed" && input("bound").value === "seed" && app.snapshot().calls.value === valueCalls && app.snapshot().functional === "STYLED SEED", "frozen reset seed");
 assert(app.snapshot().numeric === "7" && app.snapshot().array === "x,y", "initial defined model reset seeds");
 app.set("cancel-reset"); await settle(); input("external").addEventListener("reset", event => event.preventDefault(), {once:true}); input("external").reset(); await pause(); await settle(); assert(app.snapshot().bound === "cancel-reset" && controller.getValue() === "cancel-reset", "canceled reset");
 input("external").reset(); app.set("wins"); await settle(); await pause(); await settle(); assert(app.snapshot().bound === "wins" && input("bound").value === "wins", "new command after reset");
 app.setType("file"); await settle(); assert(input("bound").value === "", "type change to file skips nonempty writes"); app.setType("text"); await settle(); assert(input("bound").value === "wins", "type change retains accepted value");
 input("external").reset();
 const oldForm = input("external"), newForm = document.createElement("form"); newForm.id = "external"; oldForm.replaceWith(newForm); await settle();
 assert(createInput(input("bound")) === controller && input("bound").value === "wins", "actual external form replacement");
 newForm.reset(); await pause(); await settle(); assert(app.snapshot().bound === "seed", "replacement form reset");
 app.set("moved"); app.configure({form:"other"}); await settle(); input("other").reset(); await pause(); await settle(); assert(app.snapshot().bound === "seed", "form prop association");
 app.replaceRef(); await settle(); assert(app.snapshot().log.slice(-2).join() === "0:clear,1:set", "ref replacement");
 app.replaceAttachment(); await settle(); app.removeAttachment(); await settle(); app.addAttachment(); await settle(); assert(app.snapshot().calls.attach === app.snapshot().calls.detach + 1, "attachment replacement");
 app.setFile("forbidden"); await settle(); assert(input("file").value === "", "file nonempty guard"); app.setFile(""); await settle(); assert(input("file").value === "", "file empty write");
 const retired = input("bound"); input("other").reset(); app.replace(); await settle(); await pause(); await settle(); const fresh = app.snapshot().bound; retired.value="retired"; retired.dispatchEvent(new Event("input",{bubbles:true})); assert(app.snapshot().bound === fresh, "replaced owner cleanup");
 input("other").reset(); await unmount(app); await pause(); await settle(); const snapshot=app.snapshot(); assert(snapshot.calls.refs === snapshot.calls.clear && snapshot.calls.attach === snapshot.calls.detach && target.children.length === 0, "unmount reset/ref cleanup");
 assert(discoveryObservers.size === 0, "final discovery subscriber cleanup");
 MutationObserver.prototype.observe = originalObserve; MutationObserver.prototype.disconnect = originalDisconnect;
 result.complete = true;
} catch(error) { result.error = error.stack ?? String(error); }
document.documentElement.dataset.inputResult = JSON.stringify(result);
`;
