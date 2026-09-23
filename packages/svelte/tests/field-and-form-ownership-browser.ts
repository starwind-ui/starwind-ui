import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import { BROWSER_BUILD } from "./compatibility-hydration.js";
import type { DistConsumer } from "./dist-consumer.js";

export async function verifyFieldOwnership(consumer: DistConsumer, styled = false) {
  await consumer.write({
    "FieldOwnership.svelte": appSource(styled),
    "hydrate-main.js": CLIENT,
    "build-field.mjs": BROWSER_BUILD,
    "field-ssr.mjs": `import assert from "node:assert/strict";import {render} from "svelte/server";import App from "./FieldOwnership.svelte";import Field,* as named from "@starwind-ui/svelte/field";
assert.equal(globalThis.document,undefined);assert.equal(Field.Root,named.FieldRoot);const ref=()=>{throw new Error("SSR ref write")};for(const Part of Object.values(Field)) render(Part,{props:{ref}});const body=render(App).body;assert.equal(body,render(App).body);console.log(JSON.stringify({body}));`,
  });
  const { body } = JSON.parse(await consumer.run("field-ssr.mjs", { loader: true }));
  assert.match(body, /data-sw-form/);
  assert.doesNotMatch(body, /\[object Object\]/);
  const build = JSON.parse(await consumer.run("build-field.mjs"));
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
    await page.waitForFunction(() => document.documentElement.dataset.fieldResult, undefined, {
      timeout: 30000,
    });
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.fieldResult!),
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
import Field from "${styled ? "./field/index.js" : "@starwind-ui/svelte/field"}";
import Form from "@starwind-ui/svelte/form";
import Fieldset from "@starwind-ui/svelte/fieldset";
import Input from "@starwind-ui/svelte/input";
import Textarea from "./textarea/index.js";
import Checkbox from "@starwind-ui/svelte/checkbox";
import RadioGroup from "@starwind-ui/svelte/radio-group";
import Radio from "@starwind-ui/svelte/radio";
import CheckboxGroup from "@starwind-ui/svelte/checkbox-group";
import {createForm} from "@starwind-ui/svelte/form";
import {createAttachmentKey} from "svelte/attachments";
let visible=$state(true), fieldVisible=$state(true), key=$state(0), controlKey=$state(0), disabled=$state(false), revision=$state(0), formRevision=$state(0), partKey=$state(0), fieldDisabled=$state(false), symbolVersion=$state(0);
let dirty=$state<boolean>(), touched=$state<boolean>(), invalid=$state<boolean>();
let value=$state<string|number|string[]>(), command=$state<string|number|string[]>();
let transformed=$state<string|number|string[]>("seed"); const writes:string[]=[];
const calls={refs:0,clear:0,formRefs:0,formClear:0,input:0,change:0,attach:0,detach:0}; const log:string[]=[];
const callback=(version:number)=>(node:HTMLDivElement|null)=>{calls[node?"refs":"clear"]++;log.push(version+(node?":set":":clear"));};
const ref=$derived(callback(revision));
const formRefEvents: {version:number;node:HTMLFormElement|null;instance:ReturnType<typeof createForm>|null}[]=[];
const formCallback=(version:number)=>(node:HTMLFormElement|null)=>{
 calls[node?"formRefs":"formClear"]++;
 const instance=node?createForm(node):null;
 formRefEvents.push({version,node,instance});
 // Only the original callback configures validation, so replacement must retain its options.
 if(instance&&version===0)instance.setOptions({fieldValidators:{email:value=>value==="blocked"?"Blocked":null}});
};
const formRef=$derived(formCallback(formRevision));
const attachmentKey=createAttachmentKey();
const attached=$derived(symbolVersion===2 ? {} : { [attachmentKey]:(node:HTMLInputElement)=>{if(node.tagName!=="INPUT")throw new Error("attachment owner"); const version=symbolVersion; calls.attach++;log.push("attach:"+version);return()=>{calls.detach++;log.push("detach:"+version);};} });
export function configure(next:{visible?:boolean;fieldVisible?:boolean;disabled?:boolean;fieldDisabled?:boolean;dirty?:boolean;touched?:boolean;invalid?:boolean;value?:string|number|string[];command?:string|number|string[]}) { if(next.visible!==undefined)visible=next.visible;if(next.fieldVisible!==undefined)fieldVisible=next.fieldVisible;if(next.disabled!==undefined)disabled=next.disabled; if(next.fieldDisabled!==undefined)fieldDisabled=next.fieldDisabled;if("dirty" in next)dirty=next.dirty;if("touched" in next)touched=next.touched;if("invalid" in next)invalid=next.invalid;if("value" in next)value=next.value;if("command" in next)command=next.command; }
export function replaceParts(){partKey++;} export function replaceAttachment(){symbolVersion++;} export function mutateCommand(){if(Array.isArray(command))command = [...command, "c"];}
export function replaceFormRef(){formRevision++;} export function formReferences(){return [...formRefEvents];}
export function replace(){key++;} export function replaceControl(){controlKey++;} export function replaceRef(){revision++;}
export function snapshot(){return {calls:{...calls},log:[...log],value,writes:[...writes],transformed};}
</script>
{#if visible}{#key key}<Form.Root id="form" ref={formRef} validationTiming="submit" errorVisibility="submit">
<Fieldset.Root id="set" {disabled}><Fieldset.Legend>Profile</Fieldset.Legend>
{#if fieldVisible}<Field.Root id="field" name="email" disabled={fieldDisabled} {dirty} {touched} {invalid} {ref} validationTiming="change" data-validation-timing="manual">
{#key partKey}<Field.Label id={"label-"+partKey}>Email</Field.Label>{/key}{#key controlKey}<Field.Control id={"input-"+controlKey} name="email" required bind:value {...attached} oninput={()=>calls.input++} onValueChange={()=>calls.change++} />{/key}
{#key partKey}<Field.Description id={"description-"+partKey}>Private</Field.Description>{/key}<Field.Error id="error" match="valueMissing" messageSource="children">Required</Field.Error><Field.Error id="validation-error" messageSource="validation"/><Field.Validity id="validity" match={true}>Valid</Field.Validity>
</Field.Root>{/if}
<Field.Root id="text-field"><Field.Label>Details</Field.Label><Textarea id="text" name="text" data-sw-field-control /></Field.Root>
<Field.Root id="check-field"><Field.Item><Checkbox.Root id="check" name="check" data-sw-field-control /><Field.Label>Accept</Field.Label></Field.Item></Field.Root>
<Field.Root id="radio-field"><Field.Label>Choice</Field.Label><RadioGroup.Root name="choice" defaultValue="a" data-sw-field-control><Radio.Root value="a" aria-label="A"/><Radio.Root value="b" aria-label="B"/></RadioGroup.Root></Field.Root>
<Field.Root id="group-field"><Field.Label>Topics</Field.Label><CheckboxGroup.Root defaultValue={["news"]} data-sw-field-control><Checkbox.Root name="topics" value="news" aria-label="News"/><Checkbox.Root name="topics" value="tips" aria-label="Tips"/></CheckboxGroup.Root></Field.Root>
<div data-sw-field data-name="raw"><input name="raw" value="raw" aria-label="Raw" data-sw-field-control /></div>
</Fieldset.Root></Form.Root>{/key}{/if}
<Form.Root id="other-form"><Field.Root id="other-field"><Field.Label>Other</Field.Label><Input.Root id="other" name="other" data-sw-field-control /></Field.Root></Form.Root>
<Field.Root><Field.Label>Function binding</Field.Label><Field.Control id="function-input" bind:value={()=>transformed, next=>{writes.push(String(next));transformed=String(next).toUpperCase();}} /></Field.Root>
<Field.Root id="standalone"><Field.Label>Standalone</Field.Label><Field.Control id="standalone-input" value={command} /></Field.Root>
`;
}
const CLIENT = `import {hydrate,flushSync,tick,unmount,mount} from "svelte";
import {createForm} from "@starwind-ui/svelte/form";import {createField} from "@starwind-ui/runtime/field";import App from "./FieldOwnership.svelte";
const result={};const node=id=>document.getElementById(id);const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const settle=async()=>{flushSync();await tick();await new Promise(resolve=>setTimeout(resolve,25));flushSync();};
const target=node("app"), before=node("field"), app=hydrate(App,{target});
try {await settle();const form=createForm(node("form")), field=createField(node("field")), other=createForm(node("other-form")), standalone=createField(node("standalone"));
assert(before===node("field"),"hydration identity");assert(form.getFields().length===6 && other.getFields().length===1,"Form isolation and raw Field discovery");
const input=()=>node("input-0")??node("input-1");assert(input().hasAttribute("data-sw-input")&&input().hasAttribute("data-sw-field-control"),"same native control");assert(node("label-0").htmlFor===input().id && input().getAttribute("aria-describedby").includes("description-0"),"label and description IDs");assert(node("field").dataset.validationTiming==="manual","explicit timing precedence");
assert(node("error").hidden,"hidden seed"); await form.validate();form.setErrorsVisible(true);await settle();assert(!node("error").hidden&&node("error").textContent==="Required","match children error");
app.configure({dirty:true,touched:true,invalid:true});await settle();assert(node("field").hasAttribute("data-dirty")&&node("field").hasAttribute("data-touched")&&node("field").hasAttribute("data-invalid"),"state commands");app.configure({dirty:undefined,touched:undefined,invalid:undefined});await settle();assert(createField(node("field"))===field,"stable setter ownership");
input().value="accepted";input().dispatchEvent(new Event("input",{bubbles:true}));await settle();assert(app.snapshot().value==="accepted"&&app.snapshot().calls.input===1&&app.snapshot().calls.change===1,"native model callbacks once");assert(new FormData(node("form")).get("email")==="accepted","FormData");
app.configure({value:42});await settle();assert(input().value==="42","normalized command");app.configure({value:undefined});await settle();assert(input().value==="42","undefined retains accepted");app.configure({command:["a","b"]});await settle();assert(node("standalone-input").value==="a,b","composed array command");app.mutateCommand();await settle();assert(node("standalone-input").value==="a,b,c","replacement array command");
const functionInput=node("function-input");const priorWrites=app.snapshot().writes.length;functionInput.value="lower";functionInput.dispatchEvent(new Event("input",{bubbles:true}));await settle();assert(functionInput.value==="LOWER"&&app.snapshot().writes.length===priorWrites+1,"function binding writes once and reads back");
app.replaceRef();await settle();assert(createForm(node("form"))===form&&createField(node("field"))===field&&app.snapshot().log.slice(-2).join() === "0:clear,1:set","callback replacement preserves controllers");
const originalFormNode=node("form"), originalFormRef=app.formReferences().at(-1);
assert(originalFormRef.version===0&&originalFormRef.node===originalFormNode&&originalFormRef.instance===form,"initial Form callback owns the connected controller");
app.replaceFormRef();await settle();const [releasedFormRef,replacedFormRef]=app.formReferences().slice(-2);
assert(releasedFormRef.version===0&&releasedFormRef.node===null&&releasedFormRef.instance===null,"old Form callback released");
assert(replacedFormRef.version===1&&replacedFormRef.node===originalFormNode&&replacedFormRef.instance===form&&createForm(originalFormNode)===form&&createField(node("field"))===field,"new Form callback receives the same node and controllers");
app.replaceAttachment();await settle();assert(app.snapshot().log.includes("detach:0")&&app.snapshot().log.includes("attach:1"),"reactive attachment replacement");app.replaceAttachment();await settle();assert(app.snapshot().calls.attach===app.snapshot().calls.detach,"reactive attachment removal");
app.replaceControl();await settle();assert(node("label-0").htmlFor==="input-1"&&createField(node("field"))===field,"part refresh");app.replaceParts();await settle();assert(node("label-1").htmlFor==="input-1"&&input().getAttribute("aria-describedby").includes("description-1")&&!input().getAttribute("aria-describedby").includes("description-0"),"label description replacement");
app.configure({fieldDisabled:true});await settle();assert(input().disabled&&createField(node("field"))===field,"stable disabled setter");app.configure({fieldDisabled:false});await settle();assert(!input().disabled,"own disabled release");
app.configure({dirty:false,touched:false,invalid:true});await settle();input().value="released";input().dispatchEvent(new Event("input",{bubbles:true}));await settle();assert(!field.getState().dirty&&!field.getState().touched&&!field.getState().valid,"explicit overrides");app.configure({dirty:undefined,touched:undefined,invalid:undefined});await settle();input().value="after-release";input().dispatchEvent(new Event("input",{bubbles:true}));input().dispatchEvent(new FocusEvent("focusout",{bubbles:true}));await settle();await form.validate();assert(field.getState().dirty&&field.getState().touched&&field.getState().valid,"undefined releases every override");
node("text").value="details";node("text").dispatchEvent(new Event("input",{bubbles:true}));node("check").click();await settle();const data=new FormData(node("form"));assert(data.get("text")==="details"&&data.has("check")&&data.get("choice")==="a"&&data.get("topics")==="news","existing control composition");
app.configure({disabled:true});await settle();assert(input().disabled&&!new FormData(node("form")).has("email"),"Fieldset disabled inheritance");app.configure({disabled:false});await settle();assert(!input().disabled,"disabled release");
input().value="blocked";input().dispatchEvent(new Event("input",{bubbles:true}));await settle();await form.validate();assert(form.getErrors().some(error=>error.message==="Blocked"),"Form callback replacement retains original ref-time validator options");form.setErrorsVisible(true);await settle();assert(node("validation-error").textContent==="Blocked"&&!node("validation-error").hidden,"validation message source");node("form").reset();await settle();assert(input().value==="","reset Input seed");
const retired=node("field");app.configure({fieldVisible:false});await settle();assert(form.getFields().length===5&&other.getFields().length===1,"borrowed field release");const retiredController=createField(retired);assert(retiredController!==field,"Form destroyed removed Field");retiredController.destroy();app.configure({fieldVisible:true});await settle();assert(form.getFields().length===6,"Field remount");
const retiredForm=node("form");app.configure({visible:false});await settle();assert(retiredForm.checkValidity===HTMLFormElement.prototype.checkValidity,"Form cleanup");app.configure({visible:true});await settle();const current=node("form");app.replace();flushSync();app.configure({visible:false});flushSync();await settle();assert(current.checkValidity===HTMLFormElement.prototype.checkValidity,"pending remount canceled");
const standaloneRoot=node("standalone");await unmount(app);await settle();const newStandalone=createField(standaloneRoot);assert(newStandalone!==standalone,"standalone owns destruction");newStandalone.destroy();const counts=app.snapshot().calls;assert(counts.refs===counts.clear&&counts.formRefs===counts.formClear&&counts.attach===counts.detach,"balanced refs and attachments");const transient=mount(App,{target});flushSync();await unmount(transient);await settle();assert(!target.children.length,"pending mount canceled");result.complete=true;
}catch(error){result.error=error.stack??String(error)}document.documentElement.dataset.fieldResult=JSON.stringify(result);`;
