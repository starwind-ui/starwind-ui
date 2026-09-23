import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { chromium } from "playwright";
import { createBrowserBuildScript } from "./compatibility-hydration.js";
import type { DistConsumer } from "./dist-consumer.js";

/** Run the editable selection ownership cases through consumer-local compilation and SSR. */
export async function verifyComboboxFixture(
  consumer: DistConsumer,
  files: Record<string, string>,
  actions: string,
  afterUnmount = "",
) {
  await consumer.write({
    ...files,
    "build-browser.mjs": createBrowserBuildScript(true),
    "ssr.mjs":
      'import { render } from "svelte/server"; import App from "./App.svelte"; console.log(JSON.stringify({body:render(App).body}));',
    "hydrate-main.js": `import { hydrate, unmount, tick, flushSync } from "svelte"; import App from "./App.svelte";
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const settle=async()=>{flushSync();await tick();await wait(30);flushSync();};
const finish=async()=>{await settle();await wait(150);};
try {
const target=document.getElementById("app"),ssr=target.innerHTML;
const app=hydrate(App,{target});
assert(target.innerHTML===ssr,"hydration preserves first markup before effects");
await finish();
let result={};
${actions}
await unmount(app);await finish();
assert(!document.querySelector("[data-sw-combobox-popup]"),"unmount releases the Popup");
assert(!document.querySelector("[data-sw-combobox-portal]"),"unmount releases the Portal");
${afterUnmount}
document.documentElement.dataset.comboboxResult=JSON.stringify({...result,complete:true,hydrationExact:true,teardown:true});
}catch(error){document.documentElement.dataset.comboboxResult=JSON.stringify({error:error.message,stack:error.stack});}`,
  });
  const first = JSON.parse(await consumer.run("ssr.mjs", { loader: true }));
  assert.equal((await consumer.run("ssr.mjs", { loader: true })).trim(), JSON.stringify(first));
  const build = JSON.parse(await consumer.run("build-browser.mjs"));
  const javascript = await readFile(`${consumer.root}/browser.js`);
  const server = createServer((request, response) => {
    if (request.url === "/browser.js") {
      response.setHeader("Content-Type", "text/javascript");
      response.end(javascript);
    } else {
      response.setHeader("Content-Type", "text/html");
      response.end(
        `<link rel="icon" href="data:,"><style>[data-sw-combobox-popup]{padding:8px;background:white;}[data-sw-combobox-popup][data-state=closed]{opacity:0}[data-sw-combobox-popup][data-state=open]{opacity:1}[data-sw-combobox-positioner]{background:white;padding:8px;}[data-sw-combobox-trigger]{margin:4px}</style><button id="outside">Outside</button><div id="app">${first.body}</div><div id="portal-a"></div><div id="portal-b"></div><script type="module" src="/browser.js"></script>`,
      );
    }
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) errors.push(message.text());
    });
    const address = server.address();
    assert.ok(address && typeof address === "object");
    await page.goto(`http://127.0.0.1:${address.port}`);
    await page.waitForFunction(() => document.documentElement.dataset.comboboxResult, undefined, {
      timeout: 60_000,
    });
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.comboboxResult!),
    );
    assert.deepEqual(errors, [], result.stack ?? result.error);
    assert.equal(result.error, undefined, result.stack ?? result.error);
    return { ...result, build };
  } finally {
    await browser?.close();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

function comboboxCaseSource(styled: boolean): string {
  const input = `{#if showInput}{#key keys.input}<Box.Input data-input={id} placeholder="Search frameworks" ref={inputRef} ${styled ? "showTrigger={false}" : ""} />{/key}{/if}`;
  const controls = `<Box.Label>Framework {id}</Box.Label>${styled ? "" : "<Box.InputGroup>"}${input}{#if showTrigger}{#key keys.trigger}<Box.Trigger data-trigger={id} ref={triggerRef} {...attachmentProps} child={childMode === "default" ? undefined : child} onclick={()=>events.push("native-trigger")}>Open</Box.Trigger>{/key}{/if}{#if showClear}{#key keys.clear}<Box.Clear data-clear={id} ref={clearRef} child={childMode === "default" ? undefined : child}>Clear</Box.Clear>{/key}{/if}${styled ? "" : "</Box.InputGroup>"}<Box.Value data-value-label={id} placeholder="Choose"/>`;
  const items = `<Box.Empty data-empty={id}>No framework found.</Box.Empty><Box.Group data-group={id}><Box.GroupLabel>{groupLabel}</Box.GroupLabel>{#each items as item (item.value)}<Box.Item data-item={id+"-"+item.value} value={item.value} disabled={item.disabled}>${styled ? "{item.label}" : "<Box.ItemText>{item.label}</Box.ItemText><Box.ItemIndicator/>"}</Box.Item>{/each}</Box.Group>`;
  const surface = styled
    ? `{#if showPopup}{#key keys.popup}<Box.Content data-popup={id} portalContainer={container} {disablePortal} {side} {align} sideOffset={offset} avoidCollisions={false}>${items}</Box.Content>{/key}{/if}`
    : `{#if showPopup}{#key keys.portal}<Box.Portal {container} disabled={disablePortal} data-portal={id}>{#key keys.positioner}<Box.Positioner {side} {align} sideOffset={offset} avoidCollisions={false}>{#key keys.popup}<Box.Popup data-popup={id}><Box.List>${items}</Box.List></Box.Popup>{/key}</Box.Positioner>{/key}</Box.Portal>{/key}{/if}`;
  const root = (binding: string) =>
    `<Box.Root data-root={id} defaultValue={seedValue} defaultInputValue={seedInput} defaultOpen={seedOpen} ${binding} {disabled} {readOnly} {filterMode} {locale} {modal} name={id} form={external ? "external-"+id : undefined} required={required} autoComplete={autoComplete} onValueChange={(next,detail)=>propose("value",next,detail)} onInputValueChange={(next,detail)=>propose("inputValue",next,detail)} onOpenChange={(next,detail)=>propose("open",next,detail)} ref={(node)=>{rootNode=node;}}>${controls}${surface}</Box.Root>`;
  return `<script lang="ts">
import {flushSync,untrack} from "svelte";
import {createAttachmentKey,type Attachment} from "svelte/attachments";
import Primitive,{type ButtonChildPayload} from "@starwind-ui/svelte/combobox";
import ForwardButton from "./ForwardButton.svelte";
${styled ? 'import Box from "./combobox/index.js";' : "const Box=Primitive;"}
let {id,mode="bound",value:initialValue,inputValue:initialInput,open:initialOpen,defaultValue="astro",defaultInputValue,defaultOpen=false,external=false}:{id:string;mode?:"bound"|"omitted"|"plain"|"function";value?:string|null;inputValue?:string;open?:boolean;defaultValue?:string|null;defaultInputValue?:string;defaultOpen?:boolean;external?:boolean}=$props();
let value=$state<string|null|undefined>(untrack(()=>initialValue)),inputValue=$state<string|undefined>(untrack(()=>initialInput)),open=$state<boolean|undefined>(untrack(()=>initialOpen));
let seedValue=$state<string|null>(untrack(()=>defaultValue)),seedInput=$state<string|undefined>(untrack(()=>defaultInputValue)),seedOpen=$state(untrack(()=>defaultOpen));
let shown=$state(true),showPopup=$state(true),showInput=$state(true),showTrigger=$state(true),showClear=$state(true),disabled=$state(false),readOnly=$state(false),required=$state(false),modal=$state(false),filterMode=$state<"contains"|"startsWith">("contains"),locale=$state("en"),autoComplete=$state<string|undefined>();
let keys=$state<Record<string,number>>({root:0,input:0,trigger:0,clear:0,popup:0,positioner:0,portal:0});
let groupLabel=$state("Frameworks");
let items=$state([{value:"astro",label:"Astro",disabled:false},{value:"react",label:"React",disabled:false},{value:"vue",label:"Vue",disabled:false},{value:"svelte",label:"Svelte",disabled:false},{value:"solid",label:"Solid",disabled:true}]);
let side=$state<"top"|"right"|"bottom"|"left">("bottom"),align=$state<"start"|"center"|"end">("start"),offset=$state(8),container=$state<string|HTMLElement|undefined>("#portal-a"),disablePortal=$state(false);
let cancel=$state<string[]>([]),command=$state<{name:string;value:any}|null>(null),setter=$state("accept"),childMode=$state("default"),swapRef=$state(false),refRead=$state(0),attachmentRead=$state(0),withB=$state(true);
const events:string[]=[],writes:{name:string;value:any}[]=[],callbacks:{name:string;value:any;before:any}[]=[],refs:string[]=[],attachments:string[]=[];
let rootNode:HTMLDivElement|null=null;
const inputRef=(node:HTMLInputElement|null)=>{refs.push("input:"+(node?.tagName??"null"));};
const oldRef=(node:HTMLButtonElement|null)=>{void refRead;refs.push("old:"+(node?.tagName??"null"));};const nextRef=(node:HTMLButtonElement|null)=>{void refRead;refs.push("new:"+(node?.tagName??"null"));};let triggerRef=$derived(swapRef?nextRef:oldRef);
const clearRef=(node:HTMLButtonElement|null)=>{refs.push("clear:"+(node?.tagName??"null"));};
const keyA=createAttachmentKey(),keyB=createAttachmentKey();
const attachA:Attachment<HTMLButtonElement>=(node)=>{const read=attachmentRead;attachments.push("A:start:"+read+":"+node.tagName);return()=>{attachments.push("A:end:"+read);};};
const attachB:Attachment<HTMLButtonElement>=(node)=>{attachments.push("B:start:"+node.tagName);return()=>{attachments.push("B:end");};};
let attachmentProps=$derived({[keyA]:attachA,...(withB?{[keyB]:attachB}:{})});
function assign(name:string,next:any){if(name==="value")value=next;else if(name==="inputValue")inputValue=next;else open=next;}
function propose(name:string,next:any,detail:any){events.push("proposal:"+name);callbacks.push({name,value:next,before:name==="value"?value:name==="inputValue"?inputValue:open});if(cancel.includes(name))detail.cancel();if(command)flushSync(()=>assign(command!.name,command!.value));}
function put(name:string,next:any){events.push("write:"+name);writes.push({name,value:next});if(setter==="retain")return;assign(name,setter==="transform"?(name==="value"&&next==="react"?"vue":name==="inputValue"&&next==="alias"?"ALIAS":next):next);}
export function snapshot(){return {value,inputValue,open,events:[...events],writes:[...writes],callbacks:[...callbacks],refs:[...refs],attachments:[...attachments]};}
export function setModel(name:string,next:any){flushSync(()=>assign(name,next));}
export function proposals(next:string[],newCommand:{name:string;value:any}|null=null){cancel=next;command=newCommand;}
export function functionPolicy(next:string){setter=next;}
export function log(next:string){events.push(next);}
export function replace(part:string){keys[part]++;}
export function show(part:string,next:boolean){if(part==="input")showInput=next;else if(part==="trigger")showTrigger=next;else if(part==="clear")showClear=next;else showPopup=next;}
export function option(name:string,next:any){if(name==="disabled")disabled=next;else if(name==="readOnly")readOnly=next;else if(name==="filterMode")filterMode=next;else if(name==="locale")locale=next;else if(name==="modal")modal=next;else if(name==="required")required=next;else autoComplete=next;}
export function setGroupLabel(next:string){groupLabel=next;}
export function collection(next:{value:string;label:string;disabled:boolean}[]){items=next;}
export function place(next:string|HTMLElement|undefined,inPlace=false){container=next;disablePortal=inPlace;}
export function placement(next:"top"|"right"|"bottom"|"left",nextAlign:"start"|"center"|"end",nextOffset:number){side=next;align=nextAlign;offset=nextOffset;}
export function modeChild(next:string){childMode=next;}export function changeRef(){swapRef=!swapRef;}export function readRef(){refRead++;}export function readAttachment(){attachmentRead++;}export function symbolB(next:boolean){withB=next;}export function root(){return rootNode;}export function hide(){shown=false;}
</script>
{#snippet child({props,children}:ButtonChildPayload)}{#if childMode==="component"}<ForwardButton {props} {children}/>{:else}<button {...props}>{@render children?.()}</button>{/if}{/snippet}
<form data-form={id}>{#if shown}{#key keys.root}{#if mode==="function"}${root('bind:value={()=>value,(next)=>put("value",next)} bind:inputValue={()=>inputValue,(next)=>put("inputValue",next)} bind:open={()=>open,(next)=>put("open",next)}')}{:else if mode==="bound"}${root("bind:value bind:inputValue bind:open")}{:else}${root('{...(mode==="plain"?{value,inputValue,open}:{})}')}{/if}{/key}{/if}</form>`;
}

const basicCases = [
  ...["omitted", "plain", "bound", "function"].map((mode) => ({
    id: mode,
    mode,
    defaultValue: "astro",
  })),
  {
    id: "defined",
    value: null,
    inputValue: "",
    open: false,
    defaultValue: "astro",
    defaultInputValue: "seed",
    defaultOpen: true,
  },
  { id: "query", defaultValue: null, defaultInputValue: "rea" },
  { id: "coupled", value: null, inputValue: "", open: false },
  { id: "life", defaultValue: "astro" },
  { id: "keyboard", defaultValue: null },
  { id: "readonly", defaultValue: "astro" },
  { id: "replacement", defaultValue: "astro" },
  { id: "collection", defaultValue: null },
  { id: "function-retain", mode: "function", defaultValue: "astro" },
  { id: "function-transform", mode: "function", defaultValue: null },
  ...["value", "inputValue", "open"].flatMap((model) => [
    { id: "cancel-" + model, defaultValue: null },
    { id: "dom-" + model, defaultValue: null },
    { id: "command-" + model, defaultValue: null },
  ]),
  { id: "form", defaultValue: "astro", external: true },
  { id: "reset", defaultValue: "astro", defaultInputValue: "Seed query" },
];

export async function verifyStyledComboboxComposition(consumer: DistConsumer) {
  const { build, ...result } = await verifyComboboxFixture(
    consumer,
    {
      "Case.svelte": comboboxCaseSource(true),
      "ForwardButton.svelte":
        '<script lang="ts">import type {ButtonChildPayload} from "@starwind-ui/svelte/combobox";let {props,children}:ButtonChildPayload=$props();</script><button {...props}>{@render children?.()}</button>',
      "App.svelte":
        '<script lang="ts">import Case from "./Case.svelte";let owner:any;export function getOwner(){return owner;}</script><Case id="main" mode="function" bind:this={owner}/>',
    },
    `
const owner = app.getOwner();
const el = kind => document.querySelector('[data-'+kind+'="main"]');
const click = node => node.dispatchEvent(new MouseEvent("click", {bubbles:true,cancelable:true}));
click(el("trigger")); await settle(); assert(owner.snapshot().open === true, "Styled Root publishes opening");
const input = el("input"); input.value = "rea"; input.dispatchEvent(new InputEvent("input",{bubbles:true,inputType:"insertText",data:"rea"})); await settle();
assert(owner.snapshot().inputValue === "rea", "Styled Input publishes native text");
click(document.querySelector('[data-item="main-react"]')); await finish();
assert(owner.snapshot().value === "react" && owner.snapshot().inputValue === "React" && owner.snapshot().open === false, "Styled selection publishes all coupled models");
owner.proposals(["value"]); owner.setModel("open",true); await settle();
click(document.querySelector('[data-item="main-vue"]')); await finish();
assert(owner.snapshot().value === "react", "Styled callback cancellation retains selection");
owner.proposals([]); owner.setModel("open",false); owner.modeChild("component"); await finish();
click(el("trigger")); await finish();
assert(owner.snapshot().open === true, "Styled Trigger forwards its component child");
owner.place("#portal-b"); await finish();
assert(el("popup").closest("[data-sw-combobox-portal]").parentElement.id === "portal-b", "Content forwards its portal target");
const previous = el("input"); owner.replace("input"); await finish();
assert(el("input") !== previous && el("input").value === "React", "composed Input replacement restores accepted text");
click(el("clear")); await finish();
assert(owner.snapshot().value === null && owner.snapshot().inputValue === "", "Styled Clear forwards its action");
const retiredTrigger = el("trigger"); result.composition = true;
`,
    `
const snapshot = owner.snapshot();
assert(snapshot.attachments.filter(item=>item.includes(":start")).length === snapshot.attachments.filter(item=>item.includes(":end")).length, "Styled Trigger releases forwarded attachments");
assert(snapshot.refs.at(-1).endsWith(":null"), "Styled wrappers release callback refs");
const before = snapshot.callbacks.length; click(retiredTrigger); await settle();
assert(owner.snapshot().callbacks.length === before, "retired Trigger cannot publish");
`,
  );
  return { result, build };
}

export async function verifyComboboxLifecycle(consumer: DistConsumer, styled = false) {
  const { build, ...result } = await verifyComboboxFixture(
    consumer,
    {
      "Case.svelte": comboboxCaseSource(styled),
      "ForwardButton.svelte":
        '<script lang="ts">import type {ButtonChildPayload} from "@starwind-ui/svelte/combobox";let {props,children}:ButtonChildPayload=$props();</script><button {...props}>{@render children?.()}</button>',
      "FieldCase.svelte": `<script lang="ts">import Primitive from "@starwind-ui/svelte/combobox";${styled ? 'import Box from "./combobox/index.js";import Field from "./field/index.js";import Form from "./form/index.js";' : 'const Box=Primitive;import Field from "@starwind-ui/svelte/field";import Form from "@starwind-ui/svelte/form";'}let value=$state<string|null|undefined>(),disabled=$state(false),shown=$state(true);export function snapshot(){return value;}export function configure(next:boolean){disabled=next;}export function hide(){shown=false;}</script>{#if shown}<Form.Root id="field-form"><Field.Root id="combobox-field" name="framework" {disabled}><Field.Label id="field-label">Framework</Field.Label><Box.Root data-root="field" required bind:value><Box.InputGroup><Box.Input data-input="field" ${styled ? "showTrigger={false}" : ""}/><Box.Trigger data-trigger="field">Open</Box.Trigger></Box.InputGroup>${styled ? "<Box.Content>" : "<Box.Portal><Box.Popup><Box.List>"}<Box.Item value="astro" data-item="field-astro">Astro</Box.Item><Box.Item value="react" data-item="field-react">React</Box.Item>${styled ? "</Box.Content>" : "</Box.List></Box.Popup></Box.Portal>"}</Box.Root><Field.Description id="field-description">Choose a framework</Field.Description><Field.Error id="field-error" match="valueMissing">Required</Field.Error></Field.Root></Form.Root>{/if}`,
      "App.svelte": `<script lang="ts">import Case from "./Case.svelte";import FieldCase from "./FieldCase.svelte";const configs=${JSON.stringify(basicCases)} as const;const cases:Record<string,any>={};let field:any;export function getCases(){return cases;}export function getField(){return field;}</script>{#each configs as config (config.id)}<Case {...config} bind:this={cases[config.id]}/>{/each}<form id="external-form"></form><FieldCase bind:this={field}/>`,
    },
    `
const cases=app.getCases();
const el=(kind,id)=>document.querySelector('[data-'+kind+'="'+id+'"]');
const click=node=>node.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));
const type=(id,text)=>{const input=el("input",id);input.value=text;input.dispatchEvent(new InputEvent("input",{bubbles:true,inputType:"insertText",data:text}));};
const nativeReset=form=>HTMLFormElement.prototype.reset.call(form);
const key=(id,value)=>el("input",id).dispatchEvent(new KeyboardEvent("keydown",{key:value,bubbles:true,cancelable:true}));
for(const id of ["plain","bound","function","omitted"]){
 const input=el("input",id);assert(input.value==="Astro",id+" initial Runtime text");
 click(el("trigger",id));await settle();assert(!el("popup",id).hidden,id+" opens");
 type(id,"rea");await settle();assert(!el("item",id+"-react").hidden&&el("item",id+"-astro").hidden,id+" native Runtime filtering");
 click(el("item",id+"-react"));await finish();assert(input.value==="React"&&el("popup",id).hidden,id+" selection and close");
 if(id!=="omitted"&&id!=="plain")assert(cases[id].snapshot().value==="react",id+" accepted output");
 if(id==="plain")assert(cases[id].snapshot().value===undefined,"plain prop consumer does not receive output");
}
assert(cases.defined.snapshot().value===null&&cases.defined.snapshot().inputValue===""&&cases.defined.snapshot().open===false,"defined null empty false override defaults");
click(el("trigger","query"));await settle();assert(el("item","query-astro").hidden&&!el("item","query-react").hidden,"frozen initial filter is independent from selection");
cases.bound.setModel("value","vue");cases.bound.setModel("inputValue","Vue");await settle();assert(el("input","bound").value==="Vue"&&cases.bound.snapshot().inputValue==="Vue","supplied parent channels update together");
cases.bound.setModel("inputValue","Alias");await settle();assert(el("input","bound").value==="Alias","silent input command");
cases.bound.setModel("value",undefined);cases.bound.setModel("inputValue",undefined);cases.bound.setModel("open",undefined);await settle();assert(el("input","bound").value==="Alias","later undefined retains accepted text");
cases.bound.setModel("value","");await settle();assert(cases.bound.snapshot().value===""&&el("input","bound").value==="","empty selection normalizes in Runtime");

const models=["value","inputValue","open"];
const domEvents={value:"starwind:value-change",inputValue:"starwind:input-value-change",open:"starwind:open-change"};
for(const model of models){
 const id="cancel-"+model,owner=cases[id];
 if(model!=="open"){owner.setModel("open",true);await settle();}
 const before=owner.snapshot();owner.proposals([model]);await settle();
 const root=owner.root();root.addEventListener(domEvents[model],()=>owner.log("dom:"+model));
 if(model==="value")click(el("item",id+"-react"));else if(model==="inputValue")type(id,"rea");else click(el("trigger",id));
 await finish();const after=owner.snapshot();
 assert(Object.is(after[model],before[model]),"callback cancellation preserves "+model);
 assert(after.events.includes("proposal:"+model)&&after.events.includes("dom:"+model),"callback cancellation still precedes DOM "+model);
 assert(after.events.lastIndexOf("proposal:"+model)<after.events.lastIndexOf("dom:"+model),"callback before DOM "+model);
 assert(after.writes.length===before.writes.length,"canceled callback makes no binding write "+model);
 if(model==="inputValue")assert(el("input",id).value===(before.inputValue??""),"callback cancellation repairs visible native text");
 const domId="dom-"+model,domOwner=cases[domId];if(model!=="open"){domOwner.setModel("open",true);await settle();}
 const domBefore=domOwner.snapshot();domOwner.root().addEventListener(domEvents[model],event=>{event.preventDefault();domOwner.log("dom:"+model);},{once:true});
 if(model==="value")click(el("item",domId+"-react"));else if(model==="inputValue")type(domId,"rea");else click(el("trigger",domId));
 await finish();assert(Object.is(domOwner.snapshot()[model],domBefore[model]),"later DOM cancellation preserves "+model);
 if(model==="inputValue")assert(el("input",domId).value===(domBefore.inputValue??""),"later DOM cancellation repairs visible native text");
}
const coupled=cases.coupled;coupled.setModel("open",true);await settle();type("coupled","rea");await settle();coupled.proposals(["inputValue"]);await settle();click(el("item","coupled-react"));await finish();
assert(coupled.snapshot().value==="react"&&coupled.snapshot().inputValue==="rea"&&!coupled.snapshot().open,"selection acceptance is independent from text cancellation");
assert(coupled.root().querySelector("[data-sw-combobox-hidden-input]").value==="react","accepted selection participates in forms after text cancellation");
coupled.proposals([]);coupled.setModel("value",null);coupled.setModel("open",true);await settle();type("coupled","vue");await settle();coupled.proposals(["inputValue","open"]);await settle();click(el("item","coupled-vue"));await finish();
assert(coupled.snapshot().value==="vue"&&coupled.snapshot().inputValue==="vue"&&coupled.snapshot().open,"text and open cancellation remain independent of selected value");
coupled.proposals([]);await settle();click(el("clear","coupled"));await finish();assert(coupled.snapshot().value===null&&coupled.snapshot().inputValue===""&&coupled.snapshot().open,"clear updates selected value and text while preserving open");
coupled.setModel("value","astro");coupled.setModel("inputValue","Astro");await settle();coupled.proposals(["value"]);await settle();click(el("clear","coupled"));await finish();assert(coupled.snapshot().value==="astro"&&coupled.snapshot().inputValue==="Astro","canceling clear selection stops dependent text change");
for(const model of models){
 const id="command-"+model,owner=cases[id];
 if(model!=="open"){owner.setModel("open",true);await settle();}
 owner.proposals([model],{name:model,value:model==="value"?"vue":model==="inputValue"?"Alias":true});await settle();
 if(model==="value")click(el("item",id+"-react"));else if(model==="inputValue")type(id,"rea");else click(el("trigger",id));
 await finish();assert(Object.is(owner.snapshot()[model],model==="value"?"vue":model==="inputValue"?"Alias":true),"new parent command wins canceled "+model);
}
const transformed=cases["function-transform"];transformed.functionPolicy("transform");transformed.setModel("value","react");await settle();assert(transformed.snapshot().value==="react","ordinary value command is not an outbound transform");
transformed.setModel("value",null);transformed.setModel("open",true);await settle();click(el("item","function-transform-react"));await finish();assert(transformed.snapshot().value==="vue","function binding canonical value readback");
transformed.setModel("inputValue","alias");await settle();assert(transformed.snapshot().inputValue==="alias","ordinary text command stays a command");

const {createCombobox}=await import("@starwind-ui/runtime/combobox");
const collection=cases.collection;collection.setModel("open",true);await settle();type("collection","no-match");await settle();assert(!el("empty","collection").hidden,"empty results are Runtime owned");
const collectionInstance=createCombobox(collection.root());
collection.collection([{value:"custom",label:"A no-match framework",disabled:false},{value:"disabled",label:"No-match disabled",disabled:true}]);await settle();assert(el("empty","collection").hidden&&!el("item","collection-custom").hidden,"reactive grouped items join active filtering");
collection.setGroupLabel("Current frameworks");await settle();assert(createCombobox(collection.root())===collectionInstance,"ordinary item and group label changes keep the current controller");assert(el("group","collection").getAttribute("aria-labelledby").split(" ").some(id=>document.getElementById(id)?.textContent==="Current frameworks"),"Runtime reads the changed group name");
key("collection","ArrowDown");await settle();key("collection","Enter");await finish();assert(collection.snapshot().value==="custom"&&el("input","collection").value==="A no-match framework","Runtime extracts new item text and skips disabled items");
collection.setModel("open",true);await settle();const foreign=document.createElement("div");foreign.dataset.swComboboxItem="";foreign.dataset.value="foreign";foreign.textContent="Foreign";collection.root().append(foreign);click(foreign);await settle();assert(collection.snapshot().value==="custom","items outside the owned popup cannot select");foreign.remove();
collection.collection([]);await settle();assert(collection.snapshot().value==="custom"&&!el("empty","collection").hidden,"removed selected item keeps the Runtime value and produces empty results");
collection.collection([{value:"custom",label:"Returned label",disabled:false}]);await settle();collection.setModel("value",null);collection.setModel("value","custom");collection.setModel("inputValue","Returned label");await settle();assert(el("input","collection").value==="Returned label","selected text comes from current Runtime item text");
assert(createCombobox(collection.root())===collectionInstance,"item removal and return keep the current controller");
collection.option("filterMode","startsWith");await settle();type("collection","label");await settle();assert(!el("empty","collection").hidden,"startsWith constructor option uses Runtime filtering");
const keyboard=cases.keyboard;click(el("trigger","keyboard"));await settle();assert(document.activeElement===el("input","keyboard"),"Trigger focuses the editable Input");
key("keyboard","ArrowDown");await settle();assert(el("input","keyboard").getAttribute("aria-activedescendant")===el("item","keyboard-astro").id,"ArrowDown highlights first option");
key("keyboard","ArrowUp");await settle();assert(el("input","keyboard").getAttribute("aria-activedescendant")===el("item","keyboard-svelte").id,"ArrowUp wraps past disabled option");
key("keyboard","Enter");await finish();assert(keyboard.snapshot().value==="svelte"&&!keyboard.snapshot().open&&document.activeElement===el("input","keyboard"),"keyboard selection keeps Input focus");
keyboard.setModel("open",true);await settle();type("keyboard","rea");await settle();key("keyboard","Escape");await finish();assert(keyboard.snapshot().inputValue==="rea"&&el("input","keyboard").value==="rea"&&!keyboard.snapshot().open,"Escape retains supplied text and closes");
const readonly=cases.readonly;readonly.setModel("open",true);await settle();readonly.option("disabled",true);await settle();assert(!createCombobox(readonly.root()).getOpen()&&el("input","readonly").disabled&&el("trigger","readonly").disabled&&el("clear","readonly").disabled,"disabled setter closes and updates native controls");
const disabledCallbacks=readonly.snapshot().callbacks.length;click(el("trigger","readonly"));await settle();assert(!createCombobox(readonly.root()).getOpen()&&readonly.snapshot().callbacks.length===disabledCallbacks,"disabled Trigger rejects activation");
readonly.setModel("open",false);readonly.option("disabled",false);readonly.option("readOnly",true);await settle();click(el("trigger","readonly"));await settle();type("readonly","rea");click(el("item","readonly-react"));click(el("clear","readonly"));await finish();assert(el("input","readonly").readOnly&&createCombobox(readonly.root()).getValue()==="astro"&&el("input","readonly").value==="Astro","readOnly blocks editing selection and clear");
readonly.option("readOnly",false);await settle();type("readonly","rea");await settle();click(el("item","readonly-react"));await finish();assert(readonly.snapshot().value==="react","readOnly updates release captured behavior");
readonly.option("required",true);readonly.option("autoComplete","organization");await settle();assert(el("input","readonly").getAttribute("aria-required")==="true"&&el("input","readonly").getAttribute("autocomplete")==="organization","public form option setters update native metadata");
const replacement=cases.replacement;replacement.setModel("value","react");replacement.setModel("inputValue","React");replacement.setModel("open",true);await settle();
for(const part of ["input","trigger","clear","popup"]){
 const old=el(part,"replacement"),count=replacement.snapshot().callbacks.length;replacement.replace(part);await finish();assert(!old.isConnected&&el(part,"replacement")!==old,"settled "+part+" replacement");assert(replacement.snapshot().value==="react"&&replacement.snapshot().inputValue==="React"&&replacement.snapshot().open,"replacement preserves accepted models "+part);
 if(part==="input"){old.value="stale";old.dispatchEvent(new InputEvent("input",{bubbles:true}));}else click(old);
 await settle();assert(replacement.snapshot().callbacks.length===count,"retained retired "+part+" has no Runtime behavior");
}
replacement.show("input",false);await settle();replacement.setModel("value","vue");replacement.setModel("inputValue","During gap");replacement.setModel("open",true);await settle();assert(!el("input","replacement"),"required missing Input defers connection");replacement.show("input",true);await finish();assert(replacement.snapshot().value==="vue"&&el("input","replacement").value==="During gap"&&replacement.snapshot().open,"defined commands replay after required Input returns");
replacement.show("popup",false);await settle();replacement.show("popup",true);await finish();assert(replacement.snapshot().value==="vue"&&replacement.snapshot().open,"required Popup replacement reconnects");
replacement.setModel("inputValue","");await settle();type("replacement","sv");await settle();key("replacement","ArrowDown");key("replacement","Enter");await finish();assert(replacement.snapshot().value==="svelte"&&el("input","replacement").value==="Svelte","replacement starts a usable new editing cycle");
const reset=cases.reset,resetForm=el("form","reset");reset.setModel("value","vue");reset.setModel("open",true);await settle();type("reset","rea");await settle();
resetForm.addEventListener("reset",event=>event.preventDefault(),{once:true});nativeReset(resetForm);await finish();assert(reset.snapshot().value==="vue"&&el("input","reset").value==="rea"&&!el("item","reset-react").hidden,"canceled native reset preserves coupled state and query");
resetForm.addEventListener("reset",()=>reset.setModel("inputValue","Later"),{once:true});nativeReset(resetForm);await finish();assert(reset.snapshot().value==="vue"&&el("input","reset").value==="Later"&&!el("item","reset-react").hidden,"later defined text supersedes the coupled reset");
resetForm.addEventListener("reset",()=>type("reset","sv"),{once:true});nativeReset(resetForm);await finish();assert(reset.snapshot().value==="vue"&&el("input","reset").value==="sv"&&!el("item","reset-svelte").hidden,"later native input supersedes reset");
const resetProposals=reset.snapshot().callbacks.length;nativeReset(resetForm);await finish();assert(reset.snapshot().value==="astro"&&el("input","reset").value==="Seed query"&&reset.snapshot().callbacks.length===resetProposals,"accepted native reset reads silent Runtime defaults into bindings");
reset.setModel("value",null);await settle();nativeReset(resetForm);await finish();assert(reset.snapshot().value==="astro","repeated connected reset uses original selected default");
const external=cases.form,externalForm=document.getElementById("external-form"),ancestor=el("form","form");external.setModel("value","vue");await settle();
const submitted=external.root().querySelector("[data-sw-combobox-hidden-input]");assert(submitted.form===externalForm&&new FormData(externalForm).get("form")==="vue"&&!new FormData(ancestor).has("form"),"hidden input owns the explicit external FormData entry");
nativeReset(ancestor);await finish();assert(external.snapshot().value==="vue","ancestor reset leaves external owner unchanged");nativeReset(externalForm);await finish();assert(external.snapshot().value==="astro"&&new FormData(externalForm).get("form")==="astro","actual external form resets accepted models");
const {createForm}=await import("@starwind-ui/runtime/form"),{createField}=await import("@starwind-ui/runtime/field");
const fieldOwner=app.getField(),fieldForm=document.getElementById("field-form"),fieldNode=document.getElementById("combobox-field"),field=createField(fieldNode),formController=createForm(fieldForm);
assert(formController.getFields().length===1&&el("root","field").getAttribute("aria-labelledby").includes("field-label")&&el("input","field").getAttribute("aria-describedby").includes("field-description"),"Field labels the compound root and describes its editable native control");
await formController.validate();formController.setErrorsVisible(true);await settle();assert(!field.getState().valid&&!document.getElementById("field-error").hidden,"required Combobox participates in Form validation");
click(el("trigger","field"));await settle();click(el("item","field-react"));await finish();assert(fieldOwner.snapshot()==="react"&&new FormData(fieldForm).get("framework")==="react","Field name reaches submitted selected value");
el("input","field").dispatchEvent(new FocusEvent("focusout",{bubbles:true}));await formController.validate();await settle();assert(field.getState().valid&&field.getState().dirty&&field.getState().touched,"selection updates Field validity dirty and touched state");
fieldOwner.configure(true);await settle();assert(el("input","field").disabled&&!new FormData(fieldForm).has("framework"),"Field disabled state reaches native and submitted controls");fieldOwner.configure(false);await settle();assert(!el("input","field").disabled,"Field disabled release restores editable control");
nativeReset(fieldForm);await finish();assert(fieldOwner.snapshot()===null&&el("input","field").value==="","Form reset restores the empty Combobox seed");fieldOwner.hide();await finish();assert(!document.getElementById("field-form")&&!document.querySelector('[data-root="field"]'),"Field and Form teardown releases Combobox ownership");
const life=cases.life;
for(const mode of ["native","component","default"]){life.modeChild(mode);await settle();life.setModel("open",false);await settle();click(el("trigger","life"));await settle();assert(life.snapshot().open&&document.activeElement===el("input","life"),"Trigger child works: "+mode);click(el("clear","life"));await settle();assert(life.snapshot().value===null,"Clear child works: "+mode);life.setModel("value","astro");await settle();}
const refsBefore=life.snapshot().refs.length;life.readRef();await settle();assert(life.snapshot().refs.length===refsBefore,"reactive reads in callback refs stay untracked");life.changeRef();await settle();assert(life.snapshot().refs.slice(-2).join(",")==="old:null,new:BUTTON","callback replacement releases old before assigning same button");
const active=(log,name)=>log.filter(value=>value.startsWith(name+":start")).length-log.filter(value=>value.startsWith(name+":end")).length;life.readAttachment();await settle();assert(active(life.snapshot().attachments,"A")===1&&active(life.snapshot().attachments,"B")===1,"reactive attachment update keeps both owners active");life.symbolB(false);await settle();assert(active(life.snapshot().attachments,"A")===1&&active(life.snapshot().attachments,"B")===0,"removing one symbol keeps the remaining owner active");life.symbolB(true);await settle();assert(active(life.snapshot().attachments,"A")===1&&active(life.snapshot().attachments,"B")===1,"restored attachment symbol owns the current element");
life.setModel("open",true);await settle();const wrapper=el("popup","life").closest("[data-sw-combobox-portal]"),authoredInput=el("input","life");authoredInput.focus();life.place("#portal-b");await finish();assert(wrapper.parentElement.id==="portal-b"&&el("popup","life").closest("[data-sw-combobox-portal]")===wrapper,"Portal retargets the same wrapper");assert(document.activeElement===authoredInput,"Portal retarget preserves Input focus");life.place("#portal-b",true);await settle();assert(life.root().contains(wrapper),"disabled Portal returns to authored parent");life.place("[invalid");await settle();assert(wrapper.isConnected&&wrapper.getAttribute("data-sw-portal-placement")==="framework","invalid selector follows public Portal fallback");life.place("#portal-a");await settle();life.placement("right","start",12);await finish();const anchor=life.root().querySelector("[data-sw-combobox-input-group]").getBoundingClientRect(),popup=el("popup","life").getBoundingClientRect();assert(Math.abs(popup.left-anchor.right-12)<3,"Runtime applies requested side and offset");
result.filteringAndCollection=true;result.keyboardAndFocus=true;result.disabledReadOnly=true;result.partReplacement=true;result.refsAndAttachments=true;result.buttonChild=true;result.portalLifecycle=true;result.placement=true;
result.modelTruthTable=true;result.cancellation=true;result.parentCommands=true;result.coupledModels=true;
result.formReset=true;result.externalFormOwnership=true;result.fieldIntegration=true;

`,
    `assert(!document.querySelector("[data-sw-combobox]"),"root teardown");`,
  );
  return { result, build };
}
