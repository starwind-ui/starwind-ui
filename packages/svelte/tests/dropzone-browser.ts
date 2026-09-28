import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import { BROWSER_BUILD } from "./compatibility-hydration.js";
import type { DistConsumer } from "./dist-consumer.js";

export async function verifyDropzone(consumer: DistConsumer, styled = false) {
  await consumer.write({
    "DropCase.svelte": caseSource(styled),
    "DropApp.svelte": appSource(styled),
    "hydrate-main.js": `const styled = ${styled};\n${CLIENT}`,
    "dropzone-build.mjs": BROWSER_BUILD,
    "dropzone-ssr.mjs": `import assert from "node:assert/strict";import {render} from "svelte/server";import App from "./DropApp.svelte";import Drop,* as named from "@starwind-ui/svelte/dropzone";
assert.equal(globalThis.document,undefined);assert.equal(Drop.Root,named.DropzoneRoot);assert.deepEqual(Object.keys(Drop).sort(),["FilesList","Input","LoadingIndicator","Root","UploadIndicator"]);const ref=()=>{throw new Error("SSR callback")};for(const Part of Object.values(Drop))render(Part,{props:{ref}});const body=render(App).body;assert.equal(body,render(App).body);console.log(JSON.stringify({body}));`,
  });
  const { body } = JSON.parse(await consumer.run("dropzone-ssr.mjs", { loader: true }));
  assert.match(body, /type="file"/);
  assert.match(body, /data-is-uploading="false"/);
  assert.doesNotMatch(body, /\[object Object\]/);
  const build = JSON.parse(await consumer.run("dropzone-build.mjs"));
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
    await page.waitForFunction(() => document.documentElement.dataset.dropzoneResult, undefined, {
      timeout: 30000,
    });
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.dropzoneResult!),
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
  const part = styled ? "./dropzone/index.js" : "@starwind-ui/svelte/dropzone";
  const native = styled
    ? ""
    : "<Drop.Input {name} {form} {accept} {multiple} {required} {disabled} ref={inputRef} {...inputAttached} onchange={()=>native.change++} onclick={()=>native.click++}/>";
  const attrs = styled
    ? " {name} {form} {accept} {multiple} {required} {...inputAttached} onchange={()=>native.change++} onclick={()=>native.click++}"
    : " {...rootAttached}";
  return `<script lang="ts">
import Drop from "${part}";
import { createDropzone, type DropzoneFilesChangeDetails, type DropzoneInstance } from "@starwind-ui/runtime/dropzone";
import { createAttachmentKey } from "svelte/attachments";
import { untrack } from "svelte";
let { caseId, custom=true }: { caseId: string; custom?: boolean }=$props();
let disabled=$state(false), isUploading=$state(false), name=$state("files"), form=$state<string>(), accept=$state(".txt"), multiple=$state(true), required=$state(false), rootKey=$state(0), inputKey=$state(0), indicatorsKey=$state(0), listKey=$state(0), refVersion=$state(0), symbolVersion=$state(0), callbackVersion=$state(0), visible=$state(true), mutateCallback=$state(false);
const native={change:0,click:0};
const events:{names:string[];detailNames:string[];previous:string[];reason:string;version:number}[]=[];
const references:{part:string;version:number;node:Element|null;controller:DropzoneInstance|null}[]=[];
const attachments:string[]=[];
const reference=(part:string,version:number)=>(node:Element|null)=>references.push({part,version,node,controller:part==="root"&&node?createDropzone(node as HTMLElement):null});
const rootRef=$derived(reference("root",refVersion)),inputRef=$derived(reference("input",refVersion)),uploadRef=$derived(reference("upload",refVersion)),loadingRef=$derived(reference("loading",refVersion)),listRef=$derived(reference("list",refVersion));
const attachKey=createAttachmentKey();
const attach=(part:string,version:number)=>(node:Element)=>{attachments.push("set:"+part+":"+version+":"+node.tagName);return()=>{attachments.push("clear:"+part+":"+version+":"+node.tagName);};};
const rootAttached=$derived({[attachKey]:symbolVersion===2?undefined:attach("root",symbolVersion)});
const inputAttached=$derived({[attachKey]:symbolVersion===2?undefined:attach("input",symbolVersion)});
const partAttached=$derived({[attachKey]:symbolVersion===2?undefined:attach("part",symbolVersion)});
const change=$derived(((version:number)=>(files:File[],detail:DropzoneFilesChangeDetails)=>{events.push({names:files.map(file=>file.name),detailNames:detail.files.map(file=>file.name),previous:detail.previousFiles.map(file=>file.name),reason:detail.reason,version});if(mutateCallback){files.length=0;detail.files.length=0;detail.previousFiles.length=0;}})(callbackVersion));
export function options(next:{disabled?:boolean;isUploading?:boolean;name?:string;form?:string;accept?:string;multiple?:boolean;required?:boolean;mutateCallback?:boolean}){if(next.disabled!==undefined)disabled=next.disabled;if(next.isUploading!==undefined)isUploading=next.isUploading;if(next.name!==undefined)name=next.name;if("form" in next)form=next.form;if(next.accept!==undefined)accept=next.accept;if(next.multiple!==undefined)multiple=next.multiple;if(next.required!==undefined)required=next.required;if(next.mutateCallback!==undefined)mutateCallback=next.mutateCallback;}
export function replace(kind:string){if(kind==="root")rootKey++;if(kind==="input")inputKey++;if(kind==="indicators")indicatorsKey++;if(kind==="list")listKey++;if(kind==="ref")refVersion++;if(kind==="attachment")symbolVersion++;if(kind==="callback")callbackVersion++;}
export function show(next:boolean){visible=next;}
export function snapshot(){return {events:[...events],native:{...native},attachments:[...attachments]};}
export function refs(){return [...references];}
</script>
<div data-case={caseId}>
<form id={"form-"+caseId}>
{#if visible}{#key rootKey}
{#if custom}<Drop.Root id={"drop-"+caseId} {disabled} {isUploading} ref={rootRef} onFilesChange={change}${attrs}>
{#key inputKey}${native}{/key}
{#key indicatorsKey}<Drop.UploadIndicator ref={uploadRef} {...partAttached}>Choose files</Drop.UploadIndicator><Drop.LoadingIndicator ref={loadingRef} {...partAttached}>Uploading</Drop.LoadingIndicator>{/key}
{#key listKey}<Drop.FilesList ref={listRef} {...partAttached}/>{/key}
</Drop.Root>{:else}<Drop.Root id={"drop-"+caseId} {disabled} {isUploading} ref={rootRef} onFilesChange={change}${attrs}>${styled ? "" : native + "<Drop.UploadIndicator>Upload</Drop.UploadIndicator><Drop.LoadingIndicator>Wait</Drop.LoadingIndicator><Drop.FilesList/>"}</Drop.Root>{/if}
{/key}{/if}
</form>
</div>`;
}

function appSource(styled: boolean) {
  return `<script lang="ts">
import Case from "./DropCase.svelte";
import Input from "@starwind-ui/svelte/input";
import Drop from "${styled ? "./dropzone/index.js" : "@starwind-ui/svelte/dropzone"}";
import Field from "${styled ? "./field/index.js" : "@starwind-ui/svelte/field"}";
import Form from "@starwind-ui/svelte/form";
let cases:Record<string,Case>={};
let fieldDisabled=$state(false), fieldVisible=$state(true);
const fieldEvents:string[][]=[];
export function getCases(){return cases;}
export function fieldOptions(next:{disabled?:boolean;visible?:boolean}){if(next.disabled!==undefined)fieldDisabled=next.disabled;if(next.visible!==undefined)fieldVisible=next.visible;}
export function fieldSnapshot(){return fieldEvents.map(files=>[...files]);}
</script>
<Case caseId="custom" bind:this={cases.custom}/><Case caseId="default" custom={false} bind:this={cases.default}/>
<div data-sw-field id="early-field"><Case caseId="early" bind:this={cases.early}/></div>
{#if fieldVisible}<Form.Root id="field-form"><Field.Root name="documents" disabled={fieldDisabled}><Field.Label>Documents</Field.Label>
<div data-case="field"><Drop.Root onFilesChange={files=>fieldEvents.push(files.map(file=>file.name))}${styled ? ' required multiple accept=".txt"' : ""}>${styled ? "" : '<Drop.Input required multiple accept=".txt"/>'}<Drop.UploadIndicator>Choose files</Drop.UploadIndicator><Drop.LoadingIndicator>Uploading</Drop.LoadingIndicator><Drop.FilesList/></Drop.Root></div>
<Field.Description>Text documents</Field.Description><Field.Error match="valueMissing">Choose a document</Field.Error>
</Field.Root></Form.Root>{/if}
<Input.Root id="shared-discovery-input" defaultValue="seed"/><form id="external-a"></form><form id="external-b"></form>`;
}

const CLIENT = `import {hydrate,tick,unmount} from "svelte";
import App from "./DropApp.svelte";
import {createDropzone} from "@starwind-ui/runtime/dropzone";
import {createField} from "@starwind-ui/runtime/field";
const target=document.querySelector('#app');
const equal=(actual,expected,label)=>{if(JSON.stringify(actual)!==JSON.stringify(expected))throw new Error(label+': '+JSON.stringify(actual)+' != '+JSON.stringify(expected));};
const ok=(value,label)=>{if(!value)throw new Error(label);};
const settle=async()=>{await tick();await Promise.resolve();await new Promise(resolve=>setTimeout(resolve,5));await tick();};
const root=id=>document.querySelector('[data-case="'+id+'"] [data-sw-dropzone]');
const input=id=>root(id).querySelector('[data-sw-dropzone-input]');
const names=files=>Array.from(files).map(file=>file.name);
const files=(...values)=>values.map(name=>new File(['content'],name,{type:name.endsWith('.txt')?'text/plain':'image/png'}));
const setNative=(node,values)=>{const data=new DataTransfer();values.forEach(file=>data.items.add(file));node.files=data.files;node.dispatchEvent(new Event('change',{bubbles:true}));};
const pick=(id,values)=>setNative(input(id),values);
const drag=(id,type,values=[])=>{const data=new DataTransfer();values.forEach(file=>data.items.add(file));root(id).dispatchEvent(new DragEvent(type,{dataTransfer:data,bubbles:true,cancelable:true}));};
const state=id=>({files:names(createDropzone(root(id)).getFiles()),native:names(input(id).files),text:[...root(id).querySelectorAll('[data-sw-dropzone-files-list] span')].map(node=>node.textContent)});
try {
const initialRoots=[...target.querySelectorAll('[data-sw-dropzone]')];
const initialParts=[...target.querySelectorAll('[data-sw-dropzone-input], [data-sw-dropzone-upload-indicator], [data-sw-dropzone-loading-indicator], [data-sw-dropzone-files-list]')];
const earlyField=createField(document.querySelector('#early-field'));
const earlyController=createDropzone(root('early'));
const discoveryObservers=new Set();
const originalObserve=MutationObserver.prototype.observe,originalDisconnect=MutationObserver.prototype.disconnect;
MutationObserver.prototype.observe=function(node,options){if(node===document&&options.attributeFilter?.includes('form'))discoveryObservers.add(this);return originalObserve.call(this,node,options);};
MutationObserver.prototype.disconnect=function(){discoveryObservers.delete(this);return originalDisconnect.call(this);};
const app=hydrate(App,{target});await settle();
equal(discoveryObservers.size,1,'Input and Dropzone share document discovery');
ok(initialRoots.every((node,index)=>node===target.querySelectorAll('[data-sw-dropzone]')[index]),'SSR roots retained');
const cases=app.getCases();
ok(initialParts.every(node=>node.isConnected),'SSR captured parts retained');
equal(cases.custom.snapshot().attachments.filter(event=>event.startsWith('set:')).sort(),[...(!styled?['set:root:0:LABEL']:[]),'set:input:0:INPUT','set:part:0:DIV','set:part:0:DIV','set:part:0:DIV'].sort(),'attachments reach exact semantic owners');
ok(createDropzone(root('early'))===earlyController,'earlier Field connection retained');pick('early',files('early.txt'));await settle();equal(cases.early.snapshot().events.length,1,'Field-created controller callback subscription');
for(const id of ['custom','default','field'])equal(root(id).querySelectorAll('input[type="file"]').length,1,id+' exactly one input');
const original=createDropzone(root('custom'));
const first=files('one.txt','two.txt');pick('custom',first);await settle();equal(state('custom'),{files:['one.txt','two.txt'],native:['one.txt','two.txt'],text:['one.txt','two.txt']},'native picker state');equal(cases.custom.snapshot().events.map(e=>e.reason),['input-change'],'picker callback once');equal(cases.custom.snapshot().native.change,1,'native picker callback once');ok(original.getFiles()[0]===first[0],'File identity preserved');
const ownCopy=original.getFiles();ownCopy.length=0;equal(original.getFiles().length,2,'getFiles container copied');
cases.custom.options({mutateCallback:false});await settle();const subscriber=[];const off=original.subscribe('filesChange',detail=>subscriber.push({files:names(detail.files),previous:names(detail.previousFiles)}));const outside=files('external.txt');original.setFiles(outside);outside.length=0;await settle();equal(state('custom').files,['external.txt'],'callback/input arrays isolated');equal(subscriber,[{files:['external.txt'],previous:['one.txt','two.txt']}],'subscription detail arrays isolated');off();
const beforeSilent=cases.custom.snapshot().events.length;original.setFiles(files('silent.txt'),{emit:false});await settle();equal(cases.custom.snapshot().events.length,beforeSilent,'silent set no callback');original.clearFiles();await settle();equal(state('custom').files,[],'clear files');equal(cases.custom.snapshot().events.at(-1).reason,'imperative-action','external clear callback');
cases.custom.options({mutateCallback:false});cases.custom.replace('callback');await settle();ok(createDropzone(root('custom'))===original,'callback setter preserves controller');pick('custom',files('new.txt'));await settle();equal(cases.custom.snapshot().events.at(-1).version,1,'new callback only');
const nativeBefore=cases.custom.snapshot().native.change;const callbackBefore=cases.custom.snapshot().events.length;drag('custom','dragenter');equal(root('custom').dataset.dragActive,'true','drag active');drag('custom','dragleave');equal(root('custom').dataset.dragActive,'false','drag leave');drag('custom','dragover');drag('custom','drop',files('good.txt','image.png'));await settle();equal(state('custom').files,['good.txt'],'drop accepts filter');equal(root('custom').dataset.dragActive,'false','drop clears drag');equal(cases.custom.snapshot().native.change,nativeBefore+1,'drop native callback once');equal(cases.custom.snapshot().events.length,callbackBefore+1,'drop files callback once');equal(cases.custom.snapshot().events.at(-1).reason,'drop','drop reason');
cases.custom.options({multiple:false});await settle();drag('custom','drop',files('a.txt','b.txt'));await settle();equal(state('custom').files,['a.txt'],'drop single file constraint');
let clicks=0;input('custom').addEventListener('click',event=>{event.preventDefault();clicks++;});for(const key of ['Enter',' '])root('custom').dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));await settle();equal(clicks,2,'keyboard opens native picker');
cases.custom.options({disabled:true});await settle();ok(createDropzone(root('custom'))===original,'disabled preserves controller');ok(input('custom').disabled,'disabled native input');equal(root('custom').getAttribute('aria-disabled'),'true','disabled aria');equal(root('custom').tabIndex,-1,'disabled tab order');drag('custom','drop',files('blocked.txt'));root('custom').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));await settle();equal(state('custom').files,['a.txt'],'disabled drops ignored');equal(clicks,2,'disabled keyboard ignored');cases.custom.options({disabled:false,isUploading:true});await settle();ok(createDropzone(root('custom'))===original,'upload setter preserves controller');ok(original.getUploading(),'upload prop');ok(root('custom').querySelector('[data-sw-dropzone-upload-indicator]').hidden,'upload indicator hidden');ok(!root('custom').querySelector('[data-sw-dropzone-loading-indicator]').hidden,'loading shown');
original.setUploading(false);await settle();ok(!original.getUploading(),'external upload method');cases.custom.options({isUploading:false});await settle();original.setUploading(true);original.setFiles(files('<img src=x onerror=bad>.txt'),{emit:false});await settle();ok(!root('custom').querySelector('[data-sw-dropzone-files-list] img'),'filename stays text');equal(state('custom').text,['<img src=x onerror=bad>.txt'],'literal filename');
let controller=original;const saved=controller.getFiles()[0];for(const part of ['indicators','list']){cases.custom.replace(part);await settle();equal(names(input('custom').files),names(controller.getFiles()),part+' native files before factory read');const next=createDropzone(root('custom'));ok(next===controller,part+' reconnects');ok(next.getFiles()[0]===saved,part+' preserves File identity');ok(next.getUploading(),part+' preserves upload');equal(state('custom').text,['<img src=x onerror=bad>.txt'],part+' text rendered');controller=next;}
if(cases.custom.refs().some(entry=>entry.part==='input')){const keyedInput=input('custom');cases.custom.replace('input');await settle();ok(input('custom')!==keyedInput,'keyed input replaced');ok(controller.input===input('custom'),'keyed input automatically captured');equal(names(input('custom').files),names(controller.getFiles()),'keyed input automatically populated');ok(createDropzone(root('custom'))===controller,'keyed input reconnects');controller=createDropzone(root('custom'));ok(controller.getFiles()[0]===saved,'keyed input preserves files');const beforeKeyedStale=cases.custom.snapshot().events.length;setNative(keyedInput,files('old-key.txt'));await settle();equal(cases.custom.snapshot().events.length,beforeKeyedStale,'keyed input listener released');}
const oldInput=input('custom');const replacement=oldInput.cloneNode(true);oldInput.replaceWith(replacement);await settle();ok(createDropzone(root('custom'))===controller,'native input replacement reconnects');controller=createDropzone(root('custom'));ok(controller.getFiles()[0]===saved,'input replacement preserves File identity');ok(controller.getUploading(),'input replacement preserves upload');const beforeStale=cases.custom.snapshot().events.length;setNative(oldInput,files('stale.txt'));await settle();equal(cases.custom.snapshot().events.length,beforeStale,'removed input listener released');pick('custom',files('replacement.txt'));await settle();equal(state('custom').files,['replacement.txt'],'replacement input delivers');
replacement.remove();await settle();ok(controller.getFiles().length===1,'absence preserves files');root('custom').append(replacement);await settle();ok(controller.input===replacement,'returned input automatically captured');equal(names(replacement.files),['replacement.txt'],'returned input automatically populated');
const refsBefore=cases.custom.refs();cases.custom.replace('ref');await settle();const refsAfter=cases.custom.refs();for(const part of ['root','upload','loading','list']){const current=refsBefore.filter(item=>item.part===part&&item.node).at(-1);const events=refsAfter.slice(refsBefore.length).filter(item=>item.part===part);equal(events.map(item=>[item.version,Boolean(item.node)]),[[0,false],[1,true]],part+' callback ref replacement');ok(events[1].node===current.node,part+' same ref owner');}ok(createDropzone(root('custom'))===controller,'ref changes keep controller');
cases.custom.replace('attachment');await settle();cases.custom.replace('attachment');await settle();const attachmentEvents=cases.custom.snapshot().attachments;equal(attachmentEvents.filter(event=>event.startsWith('set:')).length,attachmentEvents.filter(event=>event.startsWith('clear:')).length,'reactive attachments released');
// Restore Svelte's keyed native owner before testing reactive native props after external replacement.
cases.custom.replace('root');await settle();controller=createDropzone(root('custom'));cases.custom.options({form:'external-a',name:'upload',accept:'image/*',multiple:true,required:true});await settle();ok(createDropzone(root('custom'))===controller,'form prop reconnects');controller=createDropzone(root('custom'));equal(input('custom').form.id,'external-a','native form attr');equal(input('custom').name,'upload','native name');equal(input('custom').accept,'image/*','native accept');ok(input('custom').multiple&&input('custom').required,'native multiple required');pick('custom',files('photo.png'));await settle();equal(names(new FormData(document.querySelector('#external-a')).getAll('upload')),['photo.png'],'form submits native file');
const oldForm=document.querySelector('#external-a');const nextForm=oldForm.cloneNode();oldForm.replaceWith(nextForm);await settle();ok(createDropzone(root('custom'))===controller,'same-id form replacement reconnects');controller=createDropzone(root('custom'));equal(state('custom').files,['photo.png'],'form replacement preserves files');oldForm.dispatchEvent(new Event('reset'));await settle();equal(state('custom').files,['photo.png'],'old reset listener removed');const beforeReset=cases.custom.snapshot().events.length;nextForm.reset();await settle();equal(state('custom').files,[],'normal native reset clears');equal(cases.custom.snapshot().events.length,beforeReset,'reset stays silent');
pick('field',files('field.txt'));await settle();equal(app.fieldSnapshot(),[['field.txt']],'Field files callback once');equal(names(new FormData(document.querySelector('#field-form')).getAll('documents')),['field.txt'],'Field name submission');ok(root('field').getAttribute('aria-labelledby'),'Field label');ok(root('field').getAttribute('aria-describedby'),'Field description');app.fieldOptions({disabled:true});await settle();ok(input('field').disabled,'Field disabled');app.fieldOptions({disabled:false});await settle();document.querySelector('#field-form').reset();await settle();equal(state('field').files,[],'Field normal reset');equal(app.fieldSnapshot(),[['field.txt']],'Field reset silent');
const retiredRoot=root('custom'), retiredInput=input('custom');nextForm.reset();cases.custom.show(false);await settle();const retiredEvents=cases.custom.snapshot().events.length;setNative(retiredInput,files('retired.txt'));await settle();equal(cases.custom.snapshot().events.length,retiredEvents,'removed owner callback released');ok(!retiredRoot.isConnected,'removed root detached');cases.custom.show(true);await settle();equal(state('custom').files,[],'remount no retired work');pick('custom',files('remounted.png'));await settle();equal(cases.custom.snapshot().events.length,retiredEvents+1,'remount callback once');
app.fieldOptions({visible:false});await settle();ok(!root('field'),'Field owner removed');earlyField.destroy();const instances=Object.values(cases);await unmount(app);await settle();equal(target.querySelectorAll('[data-sw-dropzone]').length,0,'all roots removed');for(const entry of instances){const refs=entry.refs();for(const part of ['root','input','upload','loading','list'])equal(refs.filter(event=>event.part===part&&event.node).length,refs.filter(event=>event.part===part&&!event.node).length,part+' refs balanced');}
equal(discoveryObservers.size,0,'last form discovery owner disconnects');MutationObserver.prototype.observe=originalObserve;MutationObserver.prototype.disconnect=originalDisconnect;
document.documentElement.dataset.dropzoneResult=JSON.stringify({complete:true,picker:true,drop:true,files:true,uploading:true,reconnection:true,field:true,cleanup:true});
}catch(error){document.documentElement.dataset.dropzoneResult=JSON.stringify({error:String(error),stack:error.stack});}
`;
