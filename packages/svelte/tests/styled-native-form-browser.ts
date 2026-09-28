import { nativeAttachmentOwnership } from "./styled-native-lifecycle.js";
import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import type { DistConsumer } from "./dist-consumer.js";
import { BROWSER_BUILD } from "./compatibility-hydration.js";
import { nativeFormImports } from "./styled-native-form-consumer.js";
export async function verifyStyledNativeFormBrowser(consumer: DistConsumer) {
  await consumer.write({
    "NativeFormLifecycle.svelte": APP,
    "NativeMultiple.svelte": NATIVE_MULTIPLE,
    "NativeFloor.svelte": NATIVE_FLOOR,
    "hydrate-main.js": CLIENT,
    "build-native-form.mjs": BROWSER_BUILD,
    "native-form-ssr.mjs": `import assert from "node:assert/strict";import {render} from "svelte/server";import App from "./NativeFormLifecycle.svelte";import Select,* as select from "./native-select/index.js";import Textarea,* as textarea from "./textarea/index.js";
assert.equal(globalThis.document,undefined);assert.equal(Select.Root,select.NativeSelect);assert.equal(Select.Option,select.NativeSelectOption);assert.equal(Select.OptGroup,select.NativeSelectOptGroup);assert.equal(Textarea,textarea.Textarea);assert.deepEqual(Object.keys(select).sort(),["NativeSelect","NativeSelectOptGroup","NativeSelectOption","NativeSelectVariants","default"]);assert.deepEqual(Object.keys(textarea).sort(),["Textarea","TextareaVariants","default"]);const body=render(App).body;assert.equal(body,render(App).body);console.log(JSON.stringify({body}));`,
  });
  const { body } = JSON.parse(await consumer.run("native-form-ssr.mjs", { loader: true }));
  assert.match(body, /data-slot="native-select-wrapper"/);
  assert.match(body, /data-slot="native-select-icon"/);
  assert.match(body, /data-sw-textarea/);
  const build = JSON.parse(await consumer.run("build-native-form.mjs"));
  const javascript = await readFile(path.join(consumer.root, "browser.js"));
  const server = createServer((req, res) => {
    if (req.url === "/browser.js") {
      res.setHeader("Content-Type", "text/javascript");
      res.end(javascript);
    } else {
      res.setHeader("Content-Type", "text/html");
      res.end(
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
    const nativeFloorDiagnostics: { kind: string; type: string; message: string }[] = [];
    let nativeFloorPhase: string | null = null;
    await page.exposeFunction("nativeFloorPhase", (kind: string | null) => {
      nativeFloorPhase = kind;
    });
    page.on("pageerror", (e) => diagnostics.push(e.message));
    page.on("console", (m) => {
      if (["warning", "error"].includes(m.type())) {
        if (nativeFloorPhase)
          nativeFloorDiagnostics.push({
            kind: nativeFloorPhase,
            type: m.type(),
            message: m.text(),
          });
        else diagnostics.push(m.text());
      }
    });
    await page.goto(`http://127.0.0.1:${address.port}`);
    await page.waitForFunction(() => document.documentElement.dataset.nativeFormResult, undefined, {
      timeout: 30000,
    });
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.nativeFormResult!),
    );
    assert.deepEqual(diagnostics, []);
    assert.equal(result.error, undefined, result.error);
    const version = JSON.parse(
      await readFile(path.join(consumer.root, "node_modules/svelte/package.json"), "utf8"),
    ).version;
    assert.deepEqual(
      nativeFloorDiagnostics,
      version === "5.57.0"
        ? [
            {
              kind: "binding",
              type: "warning",
              message: "https://svelte.dev/e/select_multiple_invalid_value",
            },
          ]
        : [],
    );
    const { nativeFloor, ...actual } = result;
    for (const kind of ["binding", "spread"]) {
      if (version === "5.29.0")
        assert.match(nativeFloor[kind], /indexOf/, `${kind}: ${nativeFloor[kind]}`);
      else
        assert.ok(
          nativeFloor[kind] === "supported" || /indexOf/.test(nativeFloor[kind]),
          `${kind}: ${nativeFloor[kind]}`,
        );
    }
    assert.ok(result.attachments.setups >= 12);
    assert.equal(result.attachments.setups, result.attachments.cleanups);
    assert.deepEqual(actual, {
      parts: 4,
      hydrated: true,
      forms: true,
      attachments: result.attachments,
      calls: 4,
      remaining: 0,
    });
    result.nativeFloorDiagnostics = nativeFloorDiagnostics;
    return { build, result, nativeVersion: version };
  } finally {
    await browser?.close();
    if (server.listening)
      await new Promise<void>((resolve, reject) =>
        server.close((e) => (e ? reject(e) : resolve())),
      );
  }
}
// Expected native floor failures are contained so the adapter proof can finish.
const NATIVE_FLOOR = `<script lang="ts">
let {kind,onFailure}:{kind:"binding"|"spread";onFailure:(error:string)=>void}=$props();
let value:string[]|undefined=$state(undefined);
const attributes={name:"choices"};
</script>
<svelte:boundary onerror={error=>onFailure(String(error))}>
{#if kind === "binding"}<select multiple bind:value><option value="one" selected>One</option></select>
{:else}<select multiple {...attributes}><option value="one" selected>One</option></select>{/if}
</svelte:boundary>`;
// This minimal native component isolates Svelte component-binding array identity.
const NATIVE_MULTIPLE = `<script lang="ts">
import type {Snippet} from "svelte";
let {value=$bindable(),children,"data-case":dataCase,name}:{value:unknown[];children?:Snippet;"data-case":string;name:string}=$props();
</script>
<select multiple bind:value data-case={dataCase} {name}>{@render children?.()}</select>`;
const APP = `<script lang="ts">
${nativeAttachmentOwnership}
${nativeFormImports}
import NativeMultiple from "./NativeMultiple.svelte";
import {createAttachmentKey,type Attachment} from "svelte/attachments";
let generation=$state(0),second=$state(false),changed=$state(false),first=$state(0),other=$state(0);
const attachments:string[]=[],reactive:string[]=[],calls:Record<string,number>={};const attaches=new Map<string,Attachment<Element>>();const key=createAttachmentKey(),firstKey=createAttachmentKey(),otherKey=createAttachmentKey();
function attributes(name:string){const label=name+(second?"-b":"-a");if(!attaches.has(label))attaches.set(label,node=>{const release=beginAttachment(name,node);attachments.push(label+":setup");return()=>{release();attachments.push(label+":cleanup");};});return{[key]:attaches.get(label),"data-native-form-part":name,class:["native-"+name,{updated:changed}],style:"--probe:ready",onclick:(event:MouseEvent)=>{if(event.target===event.currentTarget)calls[name]=(calls[name]??0)+1;}};}
function track(name:string,value:number){reactive.push(name+":"+value+":setup");return()=>{reactive.push(name+":"+value+":cleanup");};}
const componentFirst:Attachment<HTMLSelectElement>=()=>track("component-first",first),componentOther:Attachment<HTMLSelectElement>=()=>track("component-other",other),nativeFirst:Attachment<HTMLSelectElement>=()=>track("native-first",first),nativeOther:Attachment<HTMLSelectElement>=()=>track("native-other",other);const independent={[firstKey]:componentFirst,[otherKey]:componentOther};
const item=$state({id:"object"});const plainItem={id:"plain-object"};
let plainMulti:unknown[]=$state([plainItem,3]),nativePlainMulti:unknown[]=$state([plainItem,3]);
let text:string|null|undefined=$state(undefined),nativeText:string|null|undefined=$state(undefined),defined=$state("Defined"),nativeDefined=$state("Defined");
let single=$state(1),nativeSingle=$state(1),undef:number|undefined=$state(undefined),nativeUndef:number|undefined=$state(undefined),object:typeof item|number=$state(item),nativeObject:typeof item|number=$state(item),multi:(typeof item|number)[]=$state([item,3]),nativeMulti:(typeof item|number)[]=$state([item,3]),empty:(typeof item|number)[]=$state([]),nativeEmpty:(typeof item|number)[]=$state([]),disabled=$state(false);
let nativeUndefinedSelect:number|undefined=$state(undefined),nativePlainSelect=$state(2),nativePlainText=$state("Plain");
let optional:number[]|undefined=$state(undefined);const branchAttachments:string[]=[];const branchKey=createAttachmentKey();const branchProps={[branchKey]:(node:HTMLSelectElement)=>{branchAttachments.push("setup");return()=>{branchAttachments.push("cleanup");};}};
export function bindMultiple(){optional=[2];}export function unbindMultiple(){optional=undefined;}
const events:string[]=[];
function record(name:string,event:Event){events.push(name+":"+event.type+":"+(name.startsWith("native")?nativeText:text));}
function selectEvent(name:string,event:Event){events.push(name+":"+event.type+":"+(name.startsWith("native")?nativeSingle:single));}
export function changeProps(){changed=true;}export function updateFirst(){first++;}export function updateOther(){other++;}export function replaceCallbacks(){second=true;}export function replaceOwners(){generation++;}export function disable(){disabled=true;}export function setValues(){text=nativeText="Updated";single=nativeSingle=2;object=nativeObject=3;multi=nativeMulti=[3];plainMulti=nativePlainMulti=[3];}
export function snapshot(){return{branchAttachments:[...branchAttachments],attachments:[...attachments],reactive:[...reactive],calls:{...calls},events:[...events],optional,plainIdentity:plainMulti[0]===plainItem,nativePlainIdentity:nativePlainMulti[0]===plainItem,plainValues:JSON.stringify(plainMulti),nativePlainValues:JSON.stringify(nativePlainMulti),values:{text,nativeText,defined,nativeDefined,single,nativeSingle,undef,nativeUndef,object:typeof object==="object"?"object":object,nativeObject:typeof nativeObject==="object"?"object":nativeObject,multi:multi.map(v=>typeof v==="object"?"object":v),nativeMulti:nativeMulti.map(v=>typeof v==="object"?"object":v),empty:empty?.map(v=>typeof v==="object"?"object":v),nativeEmpty:nativeEmpty?.map(v=>typeof v==="object"?"object":v)}};}
</script>
{#key generation}<NamedSelect {...attributes("Select")} {...independent} size={changed?"lg":"sm"} title={changed?"Changed":"Initial"}><NativeSelectOptGroup {...attributes("Group")} label={changed?"Changed":"Options"}><NativeSelectOption {...attributes("Option")} value="one">One</NativeSelectOption></NativeSelectOptGroup></NamedSelect>
<Textarea {...attributes("Textarea")} rows={changed?4:2} size={changed?"lg":"sm"} data-slot="notes"/>{/key}
<select aria-label="Native probe" {@attach nativeFirst} {@attach nativeOther}><option>Probe</option></select>
<NamedSelect data-custom-select aria-label="Custom icon"><NativeSelectOption>One</NativeSelectOption>{#snippet icon()}<span data-custom-icon aria-hidden="true">⌄</span>{/snippet}</NamedSelect>
<form id="forms">
<Textarea data-case="text" name="text" defaultValue="Draft" bind:value={text} {disabled} oninput={e=>record("text",e)} onchange={e=>record("text",e)}/><textarea data-case="nativeText" name="nativeText" defaultValue="Draft" bind:value={nativeText} {disabled} oninput={e=>record("nativeText",e)} onchange={e=>record("nativeText",e)}></textarea>
<Textarea data-case="defined" name="defined" defaultValue="Reset" bind:value={defined}/><textarea data-case="nativeDefined" name="nativeDefined" defaultValue="Reset" bind:value={nativeDefined}></textarea>
<Textarea data-case="plainText" value="Plain"/><textarea data-case="nativePlainText" bind:value={nativePlainText}></textarea>
<Textarea data-case="omittedText"/><textarea data-case="nativeOmittedText"></textarea>
<Textarea data-case="undefinedText" value={undefined}/><textarea data-case="nativeUndefinedText" value={undefined}></textarea>
<NamedSelect data-case="single" name="single" bind:value={single} {disabled} oninput={e=>selectEvent("single",e)} onchange={e=>selectEvent("single",e)}><NativeSelectOption value={1}>One</NativeSelectOption><NativeSelectOption value={2} selected>Two</NativeSelectOption></NamedSelect>
<select data-case="nativeSingle" name="nativeSingle" bind:value={nativeSingle} {disabled} oninput={e=>selectEvent("nativeSingle",e)} onchange={e=>selectEvent("nativeSingle",e)}><option value={1}>One</option><option value={2} selected>Two</option></select>
<NamedSelect data-case="undef" bind:value={undef}><NativeSelectOption value={1}>One</NativeSelectOption><NativeSelectOption value={2} selected>Two</NativeSelectOption></NamedSelect><select data-case="nativeUndef" bind:value={nativeUndef}><option value={1}>One</option><option value={2} selected>Two</option></select>
<NamedSelect data-case="object" bind:value={object}><NativeSelectOption value={item}>Object</NativeSelectOption><NativeSelectOption value={3}>Three</NativeSelectOption></NamedSelect><select data-case="nativeObject" bind:value={nativeObject}><option value={item}>Object</option><option value={3}>Three</option></select>
<NamedSelect data-case="multi" name="multi" multiple bind:value={multi}><NativeSelectOption value={item}>Object</NativeSelectOption><NativeSelectOption value={3}>Three</NativeSelectOption></NamedSelect><select data-case="nativeMulti" name="nativeMulti" multiple bind:value={nativeMulti}><option value={item}>Object</option><option value={3}>Three</option></select>
<NamedSelect data-case="empty" multiple bind:value={empty}><NativeSelectOption value={item} selected>Object</NativeSelectOption><NativeSelectOption value={3}>Three</NativeSelectOption></NamedSelect><select data-case="nativeEmpty" multiple bind:value={nativeEmpty}><option value={item} selected>Object</option><option value={3}>Three</option></select>
<NamedSelect data-case="plainSelect" value={2}><NativeSelectOption value={1}>One</NativeSelectOption><NativeSelectOption value={2}>Two</NativeSelectOption></NamedSelect><select data-case="nativePlainSelect" bind:value={nativePlainSelect}><option value={1}>One</option><option value={2}>Two</option></select>
<NamedSelect data-case="omittedSelect"><NativeSelectOption value={1}>One</NativeSelectOption><NativeSelectOption value={2} selected>Two</NativeSelectOption></NamedSelect><select data-case="nativeOmittedSelect"><option value={1}>One</option><option value={2} selected>Two</option></select>
<NamedSelect data-case="undefinedSelect" value={undefined}><NativeSelectOption value={1}>One</NativeSelectOption><NativeSelectOption value={2} selected>Two</NativeSelectOption></NamedSelect><select data-case="nativeUndefinedSelect" bind:value={nativeUndefinedSelect}><option value={1}>One</option><option value={2} selected>Two</option></select>
<NamedSelect data-case="plainObjectMulti" name="plainObjectMulti" multiple bind:value={plainMulti}><NativeSelectOption value={plainItem}>Plain object</NativeSelectOption><NativeSelectOption value={3}>Three</NativeSelectOption></NamedSelect><NativeMultiple data-case="nativePlainObjectMulti" name="nativePlainObjectMulti" bind:value={nativePlainMulti}><option value={plainItem}>Plain object</option><option value={3}>Three</option></NativeMultiple>
<NamedSelect data-case="omittedMulti" name="omittedMulti" multiple><NativeSelectOption value={1} selected>One</NativeSelectOption><NativeSelectOption value={2} selected>Two</NativeSelectOption><NativeSelectOption value={3}>Three</NativeSelectOption></NamedSelect><select data-case="nativeOmittedMulti" name="nativeOmittedMulti" multiple><option value={1} selected>One</option><option value={2} selected>Two</option><option value={3}>Three</option></select>
<NamedSelect data-case="optional" value={optional} multiple {...branchProps}><NativeSelectOption value={1} selected>One</NativeSelectOption><NativeSelectOption value={2}>Two</NativeSelectOption></NamedSelect>
<NamedSelect name="disabledOption" data-case="disabledOption"><NativeSelectOption disabled value="no">No</NativeSelectOption><NativeSelectOption value="yes" selected>Yes</NativeSelectOption><NativeSelectOptGroup label="Disabled" disabled><NativeSelectOption value="group">Group</NativeSelectOption></NativeSelectOptGroup></NamedSelect>
</form>`;
const CLIENT = `import {hydrate,mount,flushSync,tick,unmount} from "svelte";import App from "./NativeFormLifecycle.svelte";import NativeFloor from "./NativeFloor.svelte";
const assert=(v,m)=>{if(!v)throw new Error(m);};const settle=async()=>{flushSync();await tick();flushSync();};const part=name=>document.querySelector('[data-native-form-part="'+name+'"]');const elements=()=>[part("Select"),part("Group"),part("Option"),part("Textarea")];const control=name=>document.querySelector('[data-case="'+name+'"]');const dispatch=node=>node.dispatchEvent(new MouseEvent("click",{bubbles:true}));
try{const before=elements(),controls=[...document.querySelectorAll("[data-case]")],ssr=controls.map(n=>({name:n.dataset.case,value:n.value,selected:n instanceof HTMLSelectElement?[...n.options].map(o=>o.selected):undefined})),app=hydrate(App,{target:document.querySelector("#app")});await settle();assert(elements().every((node,i)=>node===before[i])&&controls.every(n=>n===control(n.dataset.case)),"hydration changed owner");assert(app.snapshot().attachments.length===4,"initial attachment count");
const pairs=["text","defined","plainText","omittedText","undefinedText","single","undef","object","multi","empty","plainSelect","omittedSelect","undefinedSelect","omittedMulti","plainObjectMulti"],native=name=>"native"+name[0].toUpperCase()+name.slice(1);
const compare=stage=>{for(const name of pairs){const a=control(name),b=control(native(name));assert(a.value===b.value,stage+" value "+name+" "+a.value+" / "+b.value);if(a instanceof HTMLSelectElement)assert(JSON.stringify([...a.options].map(o=>o.selected))===JSON.stringify([...b.options].map(o=>o.selected)),stage+" selections "+name);}
assert(app.snapshot().plainValues===app.snapshot().nativePlainValues&&app.snapshot().plainIdentity===app.snapshot().nativePlainIdentity,stage+" plain object native component-binding array");const values=app.snapshot().values;for(const name of ["text","defined","single","undef","object","multi","empty"])assert(JSON.stringify(values[name])===JSON.stringify(values[native(name)]),stage+" binding "+name+" "+JSON.stringify(values));};
for(const name of pairs){const a=ssr.find(n=>n.name===name),b=ssr.find(n=>n.name===native(name));assert(a.value===b.value&&JSON.stringify(a.selected)===JSON.stringify(b.selected),"SSR native parity "+name+JSON.stringify([a,b]));}compare("initial");assert(app.snapshot().values.text==="Draft"&&app.snapshot().values.single===1&&app.snapshot().values.undef===2&&app.snapshot().values.object==="object"&&JSON.stringify(app.snapshot().values.multi)===JSON.stringify(["object",3]),"initial native values "+JSON.stringify(app.snapshot().values));
assert(part("Select") instanceof HTMLSelectElement&&part("Select").parentElement.dataset.slot==="native-select-wrapper"&&!part("Select").parentElement.hasAttribute("data-native-form-part"),"inner select owner");assert(part("Select").parentElement.querySelector('[data-slot="native-select-icon"]') instanceof SVGElement,"default icon");assert(document.querySelector("[data-custom-select]").parentElement.querySelector("[data-custom-icon]")&&!document.querySelector("[data-custom-select]").parentElement.querySelector("svg"),"custom icon");assert(part("Select").size===0&&part("Select").classList.contains("h-9"),"visual size separate from native size");assert(part("Group") instanceof HTMLOptGroupElement&&part("Option") instanceof HTMLOptionElement&&part("Textarea") instanceof HTMLTextAreaElement&&part("Textarea").dataset.slot==="notes"&&part("Textarea").hasAttribute("data-sw-textarea"),"native parts");
for(const node of before){assert(node.style.getPropertyValue("--probe").trim()==="ready","native style");dispatch(node);}assert(Object.values(app.snapshot().calls).reduce((a,b)=>a+b,0)===4,"forward events once");
for(const name of ["text","nativeText"]){control(name).value="Edited";control(name).dispatchEvent(new Event("input",{bubbles:true}));control(name).dispatchEvent(new Event("change",{bubbles:true}));}await settle();compare("text input");assert(app.snapshot().values.text==="Edited","text binding");const compareEvents=name=>{const events=app.snapshot().events,read=label=>events.filter(value=>value.startsWith(label+":")).map(value=>value.slice(label.length));assert(JSON.stringify(read(name))===JSON.stringify(read(native(name))),"native event order "+name+" "+JSON.stringify(events));assert(read(name).length===2&&read(name)[0].startsWith(":input:")&&read(name)[1].startsWith(":change:"),"native event count "+name);};compareEvents("text");
for(const name of ["single","nativeSingle"]){control(name).value="2";control(name).dispatchEvent(new Event("input",{bubbles:true}));control(name).dispatchEvent(new Event("change",{bubbles:true}));}await settle();compare("select change");compareEvents("single");assert(app.snapshot().values.single===2,"select accepted native change");
for(const name of ["omittedMulti","nativeOmittedMulti"]){control(name).options[0].selected=false;control(name).options[2].selected=true;control(name).dispatchEvent(new Event("change",{bubbles:true}));}await settle();compare("unbound multiple");
const data=new FormData(document.querySelector("#forms"));assert(data.get("text")==="Edited"&&data.get("single")==="2"&&JSON.stringify(data.getAll("multi"))===JSON.stringify(data.getAll("nativeMulti"))&&data.get("disabledOption")==="yes"&&JSON.stringify(data.getAll("omittedMulti"))===JSON.stringify(["2","3"])&&JSON.stringify(data.getAll("omittedMulti"))===JSON.stringify(data.getAll("nativeOmittedMulti")),"native FormData");app.setValues();await settle();compare("prop update");assert(control("text").value==="Updated"&&control("object").value==="3"&&control("multi").selectedOptions.length===1,"parent binding writes");
for(const name of ["object","nativeObject"]){control(name).selectedIndex=0;control(name).dispatchEvent(new Event("change",{bubbles:true}));}for(const name of ["multi","nativeMulti","plainObjectMulti","nativePlainObjectMulti"]){control(name).options[0].selected=true;control(name).options[1].selected=false;control(name).dispatchEvent(new Event("change",{bubbles:true}));}await settle();compare("object and array option changes");assert(app.snapshot().values.object==="object"&&JSON.stringify(app.snapshot().values.multi)===JSON.stringify(["object"]),"non-string option binding");const plainData=new FormData(document.querySelector("#forms"));assert(JSON.stringify(plainData.getAll("plainObjectMulti"))===JSON.stringify(plainData.getAll("nativePlainObjectMulti")),"plain object native component-binding FormData");
document.querySelector("#forms").reset();await new Promise(resolve=>setTimeout(resolve));await settle();compare("reset");assert(JSON.stringify(new FormData(document.querySelector("#forms")).getAll("plainObjectMulti"))===JSON.stringify(new FormData(document.querySelector("#forms")).getAll("nativePlainObjectMulti")),"plain object native component-binding reset FormData");assert(app.snapshot().values.text==="Draft"&&app.snapshot().values.defined==="Reset"&&app.snapshot().values.undef===2,"native default reset");assert(JSON.stringify(new FormData(document.querySelector("#forms")).getAll("omittedMulti"))===JSON.stringify(["1","2"]),"unbound multiple selected-option reset");
const optional=control("optional"),shell=optional.parentElement,icon=shell.querySelector("svg");assert(optional.selectedOptions[0].value==="1","unbound branch initial selection");optional.options[1].selected=true;optional.dispatchEvent(new Event("change",{bubbles:true}));await settle();assert(app.snapshot().optional===undefined&&control("optional")===optional,"unbound branch published a model");app.bindMultiple();await settle();assert(control("optional")!==optional&&control("optional").parentElement===shell&&shell.querySelector("svg")===icon&&control("optional").selectedOptions[0].value==="2","bound branch switch");assert(JSON.stringify(app.snapshot().branchAttachments)===JSON.stringify(["setup","cleanup","setup"]),"branch attachment release order");app.unbindMultiple();await settle();assert(control("optional").selectedOptions[0].value==="1"&&app.snapshot().branchAttachments.length===5,"restore unbound branch");
app.disable();await settle();assert(control("text").disabled&&control("single").disabled,"disabled native controls");const disabledData=new FormData(document.querySelector("#forms"));assert(!disabledData.has("text")&&!disabledData.has("single")&&control("disabledOption").options[0].disabled&&control("disabledOption").querySelector("optgroup").disabled,"native disabled form ownership");
const attachmentBaseline=app.snapshot().reactive.length;const compareAttachments=()=>{const log=app.snapshot().reactive.slice(attachmentBaseline);for(const key of ["first","other"])assert(JSON.stringify(log.filter(x=>x.startsWith("component-"+key)).map(x=>x.replace("component-","")))===JSON.stringify(log.filter(x=>x.startsWith("native-"+key)).map(x=>x.replace("native-",""))),"independent native attachment "+key);};compareAttachments();app.updateFirst();await settle();compareAttachments();assert(app.snapshot().reactive.slice(attachmentBaseline).filter(x=>x.startsWith("component-other")).length===0,"unrelated attachment rerun");app.updateOther();await settle();compareAttachments();app.changeProps();await settle();assert(elements().every((node,i)=>node===before[i]),"prop update restarted owner");assert(part("Select").size===0&&part("Select").classList.contains("h-12")&&part("Group").label==="Changed"&&part("Textarea").rows===4&&elements().every(node=>node.classList.contains("updated")),"native prop updates");
app.replaceCallbacks();await settle();app.replaceOwners();await settle();const current=elements();assert(current.every((node,i)=>node!==before[i]),"keyed replacement");for(const node of before)dispatch(node);await unmount(app);await settle();for(const node of current)dispatch(node);const log=app.snapshot(),calls=Object.values(log.calls).reduce((a,b)=>a+b,0);assert(calls===4,"retired native handlers");assert(JSON.stringify(log.branchAttachments)===JSON.stringify(["setup","cleanup","setup","cleanup","setup","cleanup"]),"branch attachment teardown");const nativeFloor={};for(const kind of ["binding","spread"]){await window.nativeFloorPhase(kind);const target=document.createElement("div");document.body.append(target);nativeFloor[kind]="supported";const probe=mount(NativeFloor,{target,props:{kind,onFailure:error=>nativeFloor[kind]=error}});await settle();await unmount(probe);await settle();target.remove();await window.nativeFloorPhase(null);}
document.documentElement.dataset.nativeFormResult=JSON.stringify({nativeFloor,parts:4,hydrated:true,forms:true,attachments:{setups:log.attachments.filter(x=>x.endsWith(":setup")).length,cleanups:log.attachments.filter(x=>x.endsWith(":cleanup")).length},calls,remaining:document.querySelector("#app").children.length});}catch(error){document.documentElement.dataset.nativeFormResult=JSON.stringify({error:String(error)});}`;
