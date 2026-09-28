import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import { BROWSER_BUILD } from "./compatibility-hydration.js";
import type { DistConsumer } from "./dist-consumer.js";

export async function verifyFormAndFieldset(consumer: DistConsumer, styled = false) {
  await consumer.write({
    "FormLifecycle.svelte": appSource(styled),
    "hydrate-main.js": CLIENT,
    "build-form.mjs": BROWSER_BUILD,
    "form-ssr.mjs": `import assert from "node:assert/strict";import {render} from "svelte/server";import App from "./FormLifecycle.svelte";import Form,* as named from "@starwind-ui/svelte/form";import Fieldset from "@starwind-ui/svelte/fieldset";
assert.equal(globalThis.document,undefined);assert.equal(Form.Root,named.FormRoot);const ref=()=>{throw new Error("SSR ref write")};render(Form.Root,{props:{ref}});render(Form.ErrorSummary,{props:{ref}});render(Fieldset.Root,{props:{ref}});render(Fieldset.Legend,{props:{ref}});const body=render(App).body;assert.equal(body,render(App).body);console.log(JSON.stringify({body}));`,
  });
  const { body } = JSON.parse(await consumer.run("form-ssr.mjs", { loader: true }));
  assert.match(body, /data-sw-form/);
  assert.doesNotMatch(body, /\[object Object\]/);
  const build = JSON.parse(await consumer.run("build-form.mjs"));
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
    await page.waitForFunction(() => document.documentElement.dataset.formResult, undefined, {
      timeout: 30000,
    });
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.formResult!),
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

function appSource(styled: boolean) {
  return `<script lang="ts">
import Form from "${styled ? "./form/index.js" : "@starwind-ui/svelte/form"}";
import Fieldset from "@starwind-ui/svelte/fieldset";
import Input from "./input/index.js";
import { createForm, type FormValidationTiming } from "@starwind-ui/svelte/form";
import { createAttachmentKey } from "svelte/attachments";
let disabled = $state(false), nested = $state(true), extra = $state(false), legend = $state(true), legendId = $state("legend-one"), key = $state(0), refVersion = $state(0);
let timing = $state<FormValidationTiming>("blur"), dataTiming = $state<FormValidationTiming | undefined>("manual");
const calls = { refs:0, clear:0, attach:0, detach:0, submit:0, reset:0 }; const log:string[]=[];
const ref = (version:number) => (node:HTMLFormElement|null) => { calls[node ? "refs" : "clear"]++; log.push(version + (node ? ":set" : ":clear")); if(node) createForm(node).setOptions({}); };
let callback = $derived(ref(refVersion));
const attachments = { [createAttachmentKey()]: (node:HTMLFormElement) => { if(node.tagName !== "FORM") throw new Error("native attachment"); calls.attach++; return () => { calls.detach++; }; } };
export function configure(next:{disabled?:boolean;nested?:boolean;extra?:boolean;legend?:boolean;legendId?:string;timing?:FormValidationTiming;dataTiming?:FormValidationTiming | null}) { if(next.disabled!==undefined) disabled=next.disabled; if(next.nested!==undefined) nested=next.nested; if(next.extra!==undefined) extra=next.extra; if(next.legend!==undefined) legend=next.legend; if(next.legendId) legendId=next.legendId; if(next.timing) timing=next.timing; if('dataTiming' in next) dataTiming=next.dataTiming ?? undefined; }
export function replace() { key++; }
export function replaceRef() { refVersion++; }
export function snapshot() { return {calls:{...calls},log:[...log]}; }
</script>
{#key key}<Form.Root id="first" ref={callback} {...attachments} validationTiming={timing} data-validation-timing={dataTiming} errorVisibility="manual" data-error-visibility="submit" revalidationTiming="blur" data-revalidation-timing="change" onsubmit={(event)=>{event.preventDefault();calls.submit++;}} onreset={()=>calls.reset++}>
<Form.ErrorSummary id="summary"><span id="summary-child">Review these errors.</span></Form.ErrorSummary>
<div data-sw-field data-name="email"><label for="email" data-sw-field-label>Email</label><Input id="email" name="email" data-sw-field-control required /><span data-sw-field-error></span></div>
{#if extra}<div data-sw-field data-name="extra"><label for="extra" data-sw-field-label>Extra</label><textarea id="extra" name="extra" data-sw-field-control required></textarea><span data-sw-field-error></span></div>{/if}
<Fieldset.Root id="outer" {disabled}><Fieldset.Legend id={legendId}>Details</Fieldset.Legend>{#if legend}<Fieldset.Legend id="legend-two">More details</Fieldset.Legend>{/if}
<input id="enabled" name="enabled" value="included" aria-label="Enabled" />
<input id="owned" name="owned" disabled aria-label="Owned disabled" />
<Fieldset.Root id="nested" disabled={nested}><Fieldset.Legend>Nested</Fieldset.Legend><input id="nested-input" name="nested-input" value="nested" aria-label="Nested" /></Fieldset.Root>
</Fieldset.Root>
<button type="submit">Submit</button><button type="reset">Reset</button>
</Form.Root>{/key}
<Fieldset.Root id="explicit" aria-labelledby="caller-label"><Fieldset.Legend id={legendId + "-explicit"}>Explicit</Fieldset.Legend></Fieldset.Root>
<Form.Root id="second"><Form.ErrorSummary id="second-summary" role="alert" aria-live="assertive" aria-atomic={false} hidden={false} /><div data-sw-field data-name="other"><label for="other" data-sw-field-label>Other</label><input id="other" name="other" data-sw-field-control required /><span data-sw-field-error></span></div></Form.Root>
`;
}
const CLIENT = `import {hydrate,flushSync,tick,unmount} from "svelte";
import {createForm,createFormSchemaValidator,validateFormSchema} from "@starwind-ui/svelte/form";
import {createFieldset} from "@starwind-ui/runtime/fieldset";
import App from "./FormLifecycle.svelte";
const result={}; const node=id=>document.getElementById(id); const assert=(value,message)=>{if(!value)throw new Error(message)};
const settle=async()=>{flushSync();await tick();await new Promise(resolve=>setTimeout(resolve,25));flushSync();};
const NativeObserver = MutationObserver;
let fieldsetObservers = 0;
window.MutationObserver = class extends NativeObserver {
  observe(target, options) { if (target.id === "outer") fieldsetObservers++; super.observe(target, options); }
};
const target=node("app"), before=node("first"), app=hydrate(App,{target});
try {
await settle(); const form=createForm(node("first")), second=createForm(node("second")), fieldset=createFieldset(node("outer"));
assert(fieldsetObservers === 1, "one Fieldset Runtime observer");
assert(before===node("first"),"hydration identity");assert(node("first").dataset.validationTiming==="manual" && node("first").dataset.errorVisibility==="submit" && node("first").dataset.revalidationTiming==="change","explicit timing precedence");
assert(node("summary").hidden && node("summary").getAttribute("role")==="status" && node("summary").getAttribute("aria-live")==="polite" && node("summary").getAttribute("aria-atomic")==="true","summary defaults");
assert(node("second-summary").getAttribute("role")==="alert" && node("second-summary").getAttribute("aria-live")==="assertive" && node("second-summary").getAttribute("aria-atomic")==="false","summary native forwarding");
app.configure({timing:"change",dataTiming:null});await settle();assert(node("first").dataset.validationTiming==="change" && createForm(node("first"))===form,"live timing alias");
app.configure({dataTiming:"submit"});await settle();
const invalid=new SubmitEvent("submit",{bubbles:true,cancelable:true});node("first").dispatchEvent(invalid);await settle();assert(invalid.defaultPrevented && app.snapshot().calls.submit===0 && !node("summary").hidden,"invalid submit");
assert(node("summary-child") && node("summary").querySelector('[data-sw-form-error-summary-item]'),"summary preserves snippet");node("summary").querySelector('[data-sw-form-error-summary-item]').click();assert(document.activeElement===node("email"),"summary focus");
node("email").value="valid";node("email").dispatchEvent(new Event("input",{bubbles:true}));await settle();node("first").dispatchEvent(new SubmitEvent("submit",{bubbles:true,cancelable:true}));await settle();assert(app.snapshot().calls.submit===1 && new FormData(node("first")).get("email")==="valid","native valid callback once");
form.setExternalErrors({email:"Server error"});form.setErrorsVisible(true);await settle();assert(!node("summary").hidden && node("summary").textContent.includes("Server error") && second.getErrors().length===0,"external errors and two forms");
form.resetValidation({externalErrors:"preserve"});assert(form.getErrors().some(error=>error.message==="Server error"),"preserve external errors");form.clearExternalErrors();form.resetValidation();await settle();assert(form.getErrors().length===0,"clear validation");
const schema=values=>values.email?{success:true}:{success:false,issues:[{path:["email"],message:"Schema required"}]};assert(JSON.stringify(validateFormSchema({},schema).errors.email).includes("Schema required"),"schema facade");form.setOptions({formValidators:createFormSchemaValidator(schema)});assert((await form.validate()).valid,"advanced options after ref attachment");form.setOptions({formValidators:undefined});
app.configure({extra:true});await settle();assert(form.getFields().length===2,"dynamic raw field discovery");await form.validate();assert(form.getErrors().some(error=>error.name==="extra"),"native textarea validation");const retiredExtra=node("extra");app.configure({extra:false});await settle();assert(form.getFields().length===1 && !form.getErrors().some(error=>error.name==="extra"),"raw field removal");retiredExtra.dispatchEvent(new Event("input",{bubbles:true}));
assert(node("outer").getAttribute("aria-labelledby").includes("legend-one") && node("outer").getAttribute("aria-labelledby").includes("legend-two"),"legend wiring");app.configure({legend:false,legendId:"legend-new"});await settle();assert(node("outer").getAttribute("aria-labelledby").includes("legend-new") && !node("outer").getAttribute("aria-labelledby").includes("legend-two"),"legend refresh");app.configure({legendId:"legend-same-node"});await settle();assert(node("outer").getAttribute("aria-labelledby").includes("legend-same-node"),"legend id refresh");assert(node("explicit").getAttribute("aria-labelledby") === "caller-label", "explicit label preserved through legend updates");
app.configure({disabled:true});await settle();assert(node("outer").disabled && !new FormData(node("first")).has("enabled"),"native disabled omission");app.configure({disabled:false});await settle();assert(!node("enabled").disabled && node("owned").disabled && node("nested").disabled && new FormData(node("first")).has("enabled") && !new FormData(node("first")).has("nested-input"),"nested caller disabled preserved");
app.configure({disabled:true,nested:false});await settle();assert(node("nested").disabled,"inherited nested disabled");app.configure({disabled:false});await settle();assert(!node("nested").disabled && !node("nested-input").disabled && createFieldset(node("outer"))===fieldset,"own disabled update under parent");
node("first").reset();await settle();assert(node("email").value==="" && app.snapshot().calls.reset===1,"native reset");
app.replaceRef();await settle();assert(app.snapshot().log.slice(-2).join() === "0:clear,1:set" && createForm(node("first"))===form,"ref replacement");
const old=node("first"), oldFieldset=node("outer");app.replace();await settle();assert(node("first")!==old && old.checkValidity===HTMLFormElement.prototype.checkValidity && oldFieldset.getAttribute("aria-labelledby")===null,"keyed cleanup");
const active=createForm(node("first"));node("email").value="async";let signal, resolve;active.setOptions({asyncFieldValidators:{email:(_value,context)=>{signal=context.signal;return new Promise(done=>{resolve=done})}}});const pending=active.validate();await settle();assert(signal && !signal.aborted,"async validation started");await unmount(app);assert(signal.aborted,"unmount aborts validation");resolve("Retired error");assert((await pending).status==="aborted","stale validation outcome");await settle();const final=app.snapshot();assert(final.calls.refs===final.calls.clear && final.calls.attach===final.calls.detach && !target.children.length,"teardown refs and attachments");result.complete=true;
} catch(error) {result.error=error.stack??String(error)}
window.MutationObserver = NativeObserver;
document.documentElement.dataset.formResult=JSON.stringify(result);
`;
