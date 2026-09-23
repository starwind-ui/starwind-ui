import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import { BROWSER_BUILD } from "./compatibility-hydration.js";
import type { DistConsumer } from "./dist-consumer.js";

export async function verifyInputOtp(consumer: DistConsumer, styled = false) {
  await consumer.write({
    "OtpCase.svelte": caseSource(styled),
    "OtpApp.svelte": appSource(styled),
    "hydrate-main.js": CLIENT,
    "otp-build.mjs": BROWSER_BUILD,
    "otp-ssr.mjs": `import assert from "node:assert/strict";import {render} from "svelte/server";import App from "./OtpApp.svelte";import Otp,* as named from "@starwind-ui/svelte/input-otp";
assert.equal(globalThis.document,undefined);assert.equal(Otp.Root,named.InputOtpRoot);assert.deepEqual(Object.keys(Otp).sort(),["Group","Root","Separator","Slot"]);const ref=()=>{throw new Error("SSR callback")};for(const Part of Object.values(Otp))render(Part,{props:{ref}});const body=render(App).body;assert.equal(body,render(App).body);console.log(JSON.stringify({body}));`,
  });
  const { body } = JSON.parse(await consumer.run("otp-ssr.mjs", { loader: true }));
  assert.match(body, /data-value="1x2"/);
  assert.match(body, /autocomplete="one-time-code"/);
  assert.doesNotMatch(body, /\[object Object\]/);
  const build = JSON.parse(await consumer.run("otp-build.mjs"));
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
    await page.waitForFunction(() => document.documentElement.dataset.otpResult, undefined, {
      timeout: 30000,
    });
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.otpResult!),
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

function caseSource(styled: boolean) {
  return `<script lang="ts">
import Otp from "${styled ? "./input-otp/index.js" : "@starwind-ui/svelte/input-otp"}";
import type {InputOtpValueChangeDetails} from "@starwind-ui/runtime/input-otp";
import {createAttachmentKey} from "svelte/attachments";
import {untrack} from "svelte";
let {caseId,mode="bound",initial,initialDefault}: {caseId:string;mode?:"bound"|"plain"|"omitted";initial?:string;initialDefault?:string}=$props();
let model=$state<string|undefined>(untrack(()=>initial)), defaultValue=$state(untrack(()=>initialDefault));
let maxLength=$state(6), pattern=$state<RegExp|string>(), readOnly=$state(false), disabled=$state(false), form=$state<string>(), name=$state<string|undefined>("code"), required=$state(false), inputId=$state(untrack(()=>"input-"+caseId)), cancel=$state(false);
const proposals:{value:string;previous:string;reason:string}[]=[];
const refEvents:{part:string;node:HTMLDivElement|null}[]=[];const attachmentEvents:string[]=[];const native={input:0,keydown:0};
const refCallback=(part:string)=>(node:HTMLDivElement|null)=>refEvents.push({part,node});
const rootRef=refCallback("root"),groupRef=refCallback("group"),slotRef=refCallback("slot"),separatorRef=refCallback("separator");
const attachmentKey=createAttachmentKey();const attached={[attachmentKey]:(node:HTMLDivElement)=>{attachmentEvents.push("set:"+node.tagName);return()=>attachmentEvents.push("clear:"+node.tagName);}};
function change(value:string,detail:InputOtpValueChangeDetails){proposals.push({value,previous:detail.previousValue,reason:detail.reason});if(cancel)detail.cancel();}
export function command(next:string|undefined){model=next;}
export function options(next:{maxLength?:number;pattern?:RegExp|string;readOnly?:boolean;disabled?:boolean;form?:string;name?:string;required?:boolean;inputId?:string;defaultValue?:string;cancel?:boolean}) {if(next.maxLength!==undefined)maxLength=next.maxLength;if("pattern" in next)pattern=next.pattern;if(next.readOnly!==undefined)readOnly=next.readOnly;if(next.disabled!==undefined)disabled=next.disabled;if("form" in next)form=next.form;if("name" in next)name=next.name;if(next.required!==undefined)required=next.required;if(next.inputId!==undefined)inputId=next.inputId;if("defaultValue" in next)defaultValue=next.defaultValue;if(next.cancel!==undefined)cancel=next.cancel;}
export function snapshot(){return {model,proposals:[...proposals],native:{...native},refs:[...refEvents],attachments:[...attachmentEvents]};}
</script>
{#snippet slots()}<Otp.Group ref={groupRef} {...attached}>{#each Array(6) as _,index}<Otp.Slot {index} ref={index===0?slotRef:undefined} {...attached}/>{/each}</Otp.Group><Otp.Separator ref={separatorRef} {...attached}/>{/snippet}
<form id={"form-"+caseId}>
{#if mode==="omitted"}<Otp.Root data-case={caseId} {defaultValue} {maxLength} {pattern} {readOnly} {disabled} {form} {name} {required} id={inputId} ref={rootRef} {...attached} onValueChange={change} oninput={()=>native.input++} onkeydown={()=>native.keydown++}>{@render slots()}</Otp.Root>
{:else if mode==="plain"}<Otp.Root data-case={caseId} value={model} {defaultValue} {maxLength} {pattern} {readOnly} {disabled} {form} {name} {required} id={inputId} ref={rootRef} {...attached} onValueChange={change} oninput={()=>native.input++} onkeydown={()=>native.keydown++}>{@render slots()}</Otp.Root>
{:else}<Otp.Root data-case={caseId} bind:value={model} {defaultValue} {maxLength} {pattern} {readOnly} {disabled} {form} {name} {required} id={inputId} ref={rootRef} {...attached} onValueChange={change} oninput={()=>native.input++} onkeydown={()=>native.keydown++}>{@render slots()}</Otp.Root>{/if}
</form>`;
}

function appSource(styled: boolean) {
  return `<script lang="ts">
import Case from "./OtpCase.svelte";
import Otp from "${styled ? "./input-otp/index.js" : "@starwind-ui/svelte/input-otp"}";
import Field from "${styled ? "./field/index.js" : "@starwind-ui/svelte/field"}";
import Form from "@starwind-ui/svelte/form";
import type {InputOtpValueChangeDetails} from "@starwind-ui/runtime/input-otp";
let cases:Record<string,Case>={};let fieldValue=$state<string>(),fieldCancel=$state(true),fieldDisabled=$state(false);const fieldProposals:string[]=[];
export function getCases(){return cases;}export function fieldOptions(next:{cancel?:boolean;disabled?:boolean}){if(next.cancel!==undefined)fieldCancel=next.cancel;if(next.disabled!==undefined)fieldDisabled=next.disabled;}export function fieldSnapshot(){return{value:fieldValue,proposals:[...fieldProposals]};}
function change(value:string,detail:InputOtpValueChangeDetails){fieldProposals.push(value);if(fieldCancel)detail.cancel();}
</script>
<Case caseId="default" mode="omitted" initialDefault="1x2" bind:this={cases.default}/>
<Case caseId="plain" mode="plain" initial="12" initialDefault="34" bind:this={cases.plain}/>
<Case caseId="bound" initial="12" initialDefault="34" bind:this={cases.bound}/>
<Case caseId="undefined" initialDefault="56" bind:this={cases.undefined}/>
<Case caseId="cancel" initial="12" bind:this={cases.cancel}/>
<Case caseId="reset" initial="23" initialDefault="1a2" bind:this={cases.reset}/>
<Case caseId="life" initial="1234" initialDefault="12" bind:this={cases.life}/>
<Form.Root id="otp-form"><Field.Root id="otp-field" name="otp" disabled={fieldDisabled}><Field.Label>Code</Field.Label><Otp.Root data-case="field" required bind:value={fieldValue} onValueChange={change}><Otp.Group>{#each Array(6) as _,index}<Otp.Slot {index}/>{/each}</Otp.Group></Otp.Root><Field.Description>Six digits</Field.Description><Field.Error match="valueMissing">Required</Field.Error></Field.Root></Form.Root>
<form id="external-a"></form>`;
}

const CLIENT = `import {hydrate,tick,unmount} from "svelte";
import App from "./OtpApp.svelte";
import {createInputOtp} from "@starwind-ui/runtime/input-otp";
const target=document.querySelector("#app"),equal=(a,b,l)=>{if(JSON.stringify(a)!==JSON.stringify(b))throw new Error(l+":"+JSON.stringify(a)+"!="+JSON.stringify(b));},ok=(v,l)=>{if(!v)throw new Error(l);};
const settle=async()=>{await tick();await Promise.resolve();await new Promise(r=>setTimeout(r,5));await tick();};
const root=id=>document.querySelector('[data-case="'+id+'"]'),input=id=>root(id).querySelector('[data-sw-input-otp-input]');
const state=id=>({value:createInputOtp(root(id)).getValue(),input:input(id).value,chars:[...root(id).querySelectorAll('[data-sw-input-otp-char]')].map(n=>n.textContent).join('')});
const inputValue=(id,value)=>{input(id).value=value;input(id).dispatchEvent(new Event('input',{bubbles:true}));};
const key=(id,value)=>input(id).dispatchEvent(new KeyboardEvent('keydown',{key:value,bubbles:true,cancelable:true}));
const paste=(id,value)=>{const data=new DataTransfer();data.setData('text',value);input(id).dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));};
try{
 const originals=[...target.querySelectorAll('[data-sw-input-otp]')],app=hydrate(App,{target});await settle();const cases=app.getCases();const boundController=createInputOtp(root('bound'));let boundDestroys=0;const destroyBound=boundController.destroy.bind(boundController);boundController.destroy=()=>{boundDestroys++;destroyBound();};
 ok(originals.every((node,index)=>node===target.querySelectorAll('[data-sw-input-otp]')[index]),'hydration preserves roots');
 equal(state('default').value,'12','default normalized');equal(cases.undefined.snapshot().model,'56','undefined binding initialized');equal(cases.bound.snapshot().proposals,[],'initialization silent');
 for(const id of ['bound','plain','default']){inputValue(id,'3x45');await settle();equal(state(id),{value:'345',input:'345',chars:'345'},id+' normalized input');}
 equal(cases.bound.snapshot().model,'345','bound accepted');equal(cases.plain.snapshot().model,'12','plain parent unchanged');
 cases.plain.command('67');await settle();equal(state('plain').value,'67','plain parent command');cases.plain.command(undefined);await settle();inputValue('plain','89');await settle();equal(state('plain').value,'89','plain uncontrolled interaction');
 cases.bound.command('98x7');await settle();equal(cases.bound.snapshot().model,'987','normalized parent command');cases.bound.command(undefined);await settle();equal(state('bound').value,'987','undefined retains accepted');
 cases.cancel.options({cancel:true});inputValue('cancel','56');await settle();equal(state('cancel').value,'12','callback cancellation');const canceled=e=>e.preventDefault();root('cancel').addEventListener('starwind:value-change',canceled);cases.cancel.options({cancel:false});inputValue('cancel','56');await settle();equal(state('cancel').value,'12','DOM cancellation');root('cancel').removeEventListener('starwind:value-change',canceled);
 cases.bound.command('');await settle();input('bound').focus();key('bound','1');key('bound','a');key('bound','2');await settle();equal(state('bound').value,'12','keyboard filtering');paste('bound','x3y4');await settle();equal(state('bound').value,'1234','filtered paste');equal(createInputOtp(root('bound'))===boundController,true,'value updates preserve controller');equal(boundDestroys,0,'value updates have no cleanup');document.querySelector('#form-bound').reset();await settle();equal(state('bound').value,'34','bound reset value');equal(cases.bound.snapshot().model,'34','bound reset publishes application model');equal(createInputOtp(root('bound'))===boundController,true,'reset preserves controller');equal(boundDestroys,0,'reset has no cleanup');
 const life=root('life');let lifecycleDestroys=0;const watchController=controller=>{const destroy=controller.destroy.bind(controller);controller.destroy=()=>{lifecycleDestroys++;destroy();};return controller;};let lifeController=watchController(createInputOtp(life));equal(state('life').chars,'1234','slot text');cases.life.options({maxLength:3});await settle();let nextController=watchController(createInputOtp(life));ok(nextController!==lifeController,'length reconstructs');equal(lifecycleDestroys,1,'length cleanup');lifeController=nextController;equal(state('life').value,'123','length normalized');equal(cases.life.snapshot().model,'123','length publishes');
 cases.life.options({pattern:'[A-Z]',maxLength:4});await settle();nextController=watchController(createInputOtp(life));ok(nextController!==lifeController,'pattern reconstructs');equal(lifecycleDestroys,2,'pattern cleanup');lifeController=nextController;equal(state('life').value,'','pattern normalizes');cases.life.command('A1BC');await settle();equal(state('life').value,'ABC','pattern filters');equal(input('life').inputMode,'text','pattern input mode');
 cases.life.options({readOnly:true});await settle();nextController=watchController(createInputOtp(life));ok(nextController!==lifeController,'readonly reconstructs');equal(lifecycleDestroys,3,'readonly cleanup');lifeController=nextController;inputValue('life','D');await settle();equal(state('life').value,'ABC','readonly suppresses input');ok(input('life').readOnly,'native readonly');cases.life.options({readOnly:false,disabled:true});await settle();nextController=createInputOtp(life);ok(nextController!==lifeController,'readonly release reconstructs');equal(lifecycleDestroys,4,'readonly release cleanup');lifeController=nextController;key('life','D');await settle();equal(state('life').value,'ABC','disabled suppresses mutation');ok(input('life').disabled&&life.tabIndex===-1,'disabled native state');cases.life.options({disabled:false});await settle();
 cases.life.options({form:'external-a',name:'external-code',required:true,inputId:'associated-code'});await settle();equal(input('life').form.id,'external-a','external form');ok(input('life').required,'native required');equal([...new FormData(document.querySelector('#external-a'))],[['external-code','ABC']],'FormData');document.querySelector('#external-a').reset();await settle();equal(state('life').value,'','external form reset');equal(cases.life.snapshot().model,'','external reset publishes application model');
 cases.reset.command('45');await settle();document.querySelector('#form-reset').reset();await settle();equal(state('reset').value,'12','native reset value');equal(cases.reset.snapshot().model,'12','reset publishes application model');equal(cases.reset.snapshot().proposals,[],'reset silent callback');
 inputValue('field','123');await settle();equal(state('field').value,'','Field cancellation');app.fieldOptions({cancel:false});inputValue('field','456');await settle();equal(app.fieldSnapshot().value,'456','Field accepted model');equal([...new FormData(document.querySelector('#otp-form'))],[['otp','456']],'Field FormData');ok(input('field').getAttribute('aria-labelledby')&&input('field').getAttribute('aria-describedby'),'Field aria');app.fieldOptions({disabled:true});await settle();ok(input('field').disabled,'Field disabled');app.fieldOptions({disabled:false});document.querySelector('#otp-form').reset();await settle();equal(app.fieldSnapshot().value,'','Field reset publishes application model');
 const instances=Object.values(cases);await unmount(app);await settle();equal(target.querySelectorAll('[data-sw-input-otp]').length,0,'roots removed');for(const entry of instances){const snap=entry.snapshot();for(const part of ['root','group','slot','separator'])equal(snap.refs.filter(e=>e.part===part&&e.node).length,snap.refs.filter(e=>e.part===part&&!e.node).length,part+' refs balanced');equal(snap.attachments.filter(e=>e.startsWith('set:')).length,snap.attachments.filter(e=>e.startsWith('clear:')).length,'attachments balanced');}
 document.documentElement.dataset.otpResult=JSON.stringify({complete:true,models:true,reset:true,forms:true,cleanup:true});
}catch(error){document.documentElement.dataset.otpResult=JSON.stringify({error:String(error),stack:error.stack});}
`;
