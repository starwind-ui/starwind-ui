import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import type { DistConsumer } from "./dist-consumer.js";
import { BROWSER_BUILD } from "./compatibility-hydration.js";

export async function verifyStyledAccordion(consumer: DistConsumer) {
  await consumer.write({
    "AccordionCase.svelte": caseSource(),
    "AccordionApp.svelte": appSource(),
    "hydrate-main.js": CLIENT,
    "accordion-build.mjs": BROWSER_BUILD,
    "accordion-ssr.mjs": `import assert from "node:assert/strict";import {render} from "svelte/server";import App from "./AccordionApp.svelte";import Accordion,* as named from "@starwind-ui/svelte/accordion";
assert.equal(globalThis.document,undefined);assert.equal(Accordion.Root,named.AccordionRoot);assert.deepEqual(Object.keys(Accordion).sort(),["Header","Item","Panel","Root","Trigger"]);const ref=()=>{throw new Error("SSR callback")};render(Accordion.Root,{props:{ref}});const body=render(App).body;assert.equal(body,render(App).body);console.log(JSON.stringify({body}));`,
  });
  const { body } = JSON.parse(await consumer.run("accordion-ssr.mjs", { loader: true }));
  assert.match(body, /data-slot="accordion-trigger"/);
  assert.match(body, /data-slot="accordion-content"/);
  assert.doesNotMatch(body, /\[object Object\]/);
  const build = JSON.parse(await consumer.run("accordion-build.mjs"));
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
    await page.waitForFunction(() => document.documentElement.dataset.accordionResult, undefined, {
      timeout: 30000,
    });
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.accordionResult!),
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

function caseSource() {
  return `<script lang="ts">
import Accordion from "./accordion/index.js";
import {type AccordionValue,type AccordionValueChangeDetails} from "@starwind-ui/svelte/accordion";
import {createAttachmentKey} from "svelte/attachments";
import {untrack,flushSync} from "svelte";
let {caseId,mode="bound",initial,initialDefault,initialType="single"}:{caseId:string;mode?:string;initial?:AccordionValue;initialDefault?:AccordionValue;initialType?:"single"|"multiple"}=$props();
const copy=(value:AccordionValue|undefined)=>Array.isArray(value)?[...value]:value;
let model=$state<AccordionValue|undefined>(untrack(()=>copy(initial))), defaultValue=$state(untrack(()=>copy(initialDefault))), type=$state(untrack(()=>initialType)),collapsible=$state(true),disabled=$state(false),triggerDisabled=$state(false),items=$state(["a","b","c"]),key=$state(0),rootKey=$state(0),refVersion=$state(0),symbolVersion=$state(0),callbackVersion=$state(0),visible=$state(true),cancel=$state(false),command=$state<AccordionValue|undefined>(),newType=$state<"single"|"multiple"|undefined>(),removeOnProposal=$state(false);
const proposals:{next:AccordionValue;previous:AccordionValue;model:AccordionValue|undefined;version:number}[]=[];
const references:{part:string;version:number;node:Element|null}[]=[];
const attachments:string[]=[];let native=0;
const reference=(part:string,version:number)=>(node:Element|null)=>references.push({part,version,node});
const rootRef=$derived(reference("root",refVersion)),itemRef=$derived(reference("item",refVersion)),triggerRef=$derived(reference("trigger",refVersion)),panelRef=$derived(reference("panel",refVersion));
const keySymbol=createAttachmentKey();
const attach=(part:string,version:number)=>(node:Element)=>{attachments.push("set:"+part+":"+version+":"+node.tagName);return()=>attachments.push("clear:"+part+":"+version+":"+node.tagName);};
const rootAttached=$derived({[keySymbol]:symbolVersion===2?undefined:attach("root",symbolVersion)}),itemAttached=$derived({[keySymbol]:symbolVersion===2?undefined:attach("item",symbolVersion)}),triggerAttached=$derived({[keySymbol]:symbolVersion===2?undefined:attach("trigger",symbolVersion)}),panelAttached=$derived({[keySymbol]:symbolVersion===2?undefined:attach("panel",symbolVersion)});
const onChange=$derived(((version:number)=>(next:AccordionValue,detail:AccordionValueChangeDetails)=>{proposals.push({next:copy(next) as AccordionValue,previous:copy(detail.previousValue) as AccordionValue,model:copy(model),version});if(cancel)detail.cancel();if(command!==undefined){model=copy(command);flushSync();}if(newType){type=newType;flushSync();}if(removeOnProposal){visible=false;flushSync();}})(callbackVersion));
export function setModel(next:AccordionValue|undefined){model=copy(next);}
export function options(next:{type?:"single"|"multiple";collapsible?:boolean;disabled?:boolean;triggerDisabled?:boolean;defaultValue?:AccordionValue;cancel?:boolean;command?:AccordionValue;newType?:"single"|"multiple";removeOnProposal?:boolean}){if(next.type!==undefined)type=next.type;if(next.collapsible!==undefined)collapsible=next.collapsible;if(next.disabled!==undefined)disabled=next.disabled;if(next.triggerDisabled!==undefined)triggerDisabled=next.triggerDisabled;if("defaultValue" in next)defaultValue=next.defaultValue;if(next.cancel!==undefined)cancel=next.cancel;if("command" in next)command=copy(next.command);if("newType" in next)newType=next.newType;if(next.removeOnProposal!==undefined)removeOnProposal=next.removeOnProposal;}
export function replace(part:string){if(part==="items")key++;if(part==="root")rootKey++;if(part==="ref")refVersion++;if(part==="attachment")symbolVersion++;if(part==="callback")callbackVersion++;}
export function collection(next:string[]){items=[...next];}export function show(next:boolean){visible=next;}
export function refs(){return [...references];}export function snapshot(){return {model:copy(model),proposals:[...proposals],attachments:[...attachments],native};}
</script>
{#snippet content(accepted:AccordionValue)}
<output data-accepted>{JSON.stringify(accepted)}</output>
{#key key}{#each items as item (item)}
<Accordion.Item value={item} disabled={item==="b"&&disabled} ref={item==="b"?itemRef:undefined} {...(item==="b"?itemAttached:{})}>
<Accordion.Trigger data-trigger={item} disabled={item==="b"&&triggerDisabled} ref={item==="b"?triggerRef:undefined} {...(item==="b"?triggerAttached:{})} onclick={()=>native++} aria-expanded={false}>{item}</Accordion.Trigger>
<Accordion.Content data-panel={item} ref={item==="b"?panelRef:undefined} {...(item==="b"?panelAttached:{})}><p>{item} content</p></Accordion.Content>
</Accordion.Item>
{/each}{/key}
{/snippet}
{#if visible}{#key rootKey}
{#if mode==="omitted"}<Accordion.Root data-case={caseId} {type} {collapsible} {defaultValue} children={content} ref={rootRef} {...rootAttached} onValueChange={onChange}/>
{:else if mode==="plain"}<Accordion.Root data-case={caseId} value={model} {type} {collapsible} {defaultValue} children={content} ref={rootRef} {...rootAttached} onValueChange={onChange}/>
{:else}<Accordion.Root data-case={caseId} bind:value={model} {type} {collapsible} {defaultValue} children={content} ref={rootRef} {...rootAttached} onValueChange={onChange}/>{/if}
{/key}{/if}`;
}
function appSource() {
  return `<script lang="ts">
import Case from "./AccordionCase.svelte";import Accordion from "./accordion/index.js";
let cases:Record<string,Case>={};let outer=$state<string|string[]|null>("outer"),inner=$state<string|string[]|null>("inner-a");
export function getCases(){return cases;}export function nested(){return {outer,inner};}
</script>
<Case caseId="bound" initial="a" initialDefault="c" bind:this={cases.bound}/>
<Case caseId="plain" mode="plain" initial="a" bind:this={cases.plain}/>
<Case caseId="omitted" mode="omitted" initialDefault="a" bind:this={cases.omitted}/>
<Case caseId="undefined" initialDefault="a" bind:this={cases.undefined}/>
<Case caseId="multiple" initialType="multiple" initial={["a"]} bind:this={cases.multiple}/>
<Case caseId="cancel" initial="a" bind:this={cases.cancel}/>
<Case caseId="dom" initial="a" bind:this={cases.dom}/>
<Case caseId="life" initial="a" bind:this={cases.life}/>
<Case caseId="remove" initial="a" bind:this={cases.remove}/>
<Accordion.Root data-case="outer" bind:value={outer}><Accordion.Item value="outer"><Accordion.Trigger data-trigger="outer">Outer</Accordion.Trigger><Accordion.Content><Accordion.Root data-case="inner" bind:value={inner}><Accordion.Item value="inner-a"><Accordion.Trigger data-trigger="inner-a">Inner A</Accordion.Trigger><Accordion.Content>Inner A content</Accordion.Content></Accordion.Item><Accordion.Item value="inner-b"><Accordion.Trigger data-trigger="inner-b">Inner B</Accordion.Trigger><Accordion.Content>Inner B content</Accordion.Content></Accordion.Item></Accordion.Root></Accordion.Content></Accordion.Item></Accordion.Root>`;
}
const CLIENT = `import {hydrate,tick,unmount} from "svelte";import App from "./AccordionApp.svelte";import {createAccordion} from "@starwind-ui/runtime/accordion";
const target=document.querySelector('#app');
const copy=value=>Array.isArray(value)?[...value]:value;
const equal=(actual,expected,label)=>{if(JSON.stringify(actual)!==JSON.stringify(expected))throw new Error(label+': '+JSON.stringify(actual)+' != '+JSON.stringify(expected));};
const ok=(value,label)=>{if(!value)throw new Error(label);};
const settle=async()=>{await tick();await Promise.resolve();await new Promise(resolve=>setTimeout(resolve,5));await tick();};
const root=id=>document.querySelector('[data-case="'+id+'"]');
const trigger=(id,item='b')=>root(id).querySelector('[data-trigger="'+item+'"]');
const click=(id,item='b')=>trigger(id,item).click();
const state=id=>({value:copy(createAccordion(root(id)).getValue()),rendered:JSON.parse(root(id).querySelector('[data-accepted]')?.textContent??'null'),open:[...root(id).querySelectorAll('[data-trigger][aria-expanded="true"]')].filter(node=>node.closest('[data-sw-accordion]')===root(id)).map(node=>node.dataset.trigger)});
try{
const initial=[...target.querySelectorAll('[data-sw-accordion], [data-sw-accordion-item], [data-sw-accordion-trigger], [data-sw-accordion-content]')];
const app=hydrate(App,{target});await settle();const cases=app.getCases();ok(initial.every(node=>node.isConnected),'hydration retains all owners');
equal(cases.undefined.snapshot().model,'a','undefined initializes from default');equal(cases.bound.snapshot().proposals,[],'initialization silent');
for(const id of ['bound','plain','omitted']){click(id);await settle();equal(state(id),{value:'b',rendered:'b',open:['b']},id+' accepted click');equal(cases[id].snapshot().native,1,id+' native callback once');}
equal(cases.bound.snapshot().model,'b','bound publication');equal(cases.plain.snapshot().model,'a','plain parent remains');cases.plain.setModel('c');await settle();equal(state('plain').value,'c','plain later command');cases.plain.setModel(undefined);await settle();equal(state('plain').value,'c','undefined retains accepted');
cases.bound.setModel(null);await settle();equal(state('bound').open,[],'null closes');cases.bound.setModel(['a','b']);await settle();equal(cases.bound.snapshot().model,'a','single normalizes array');
click('multiple');await settle();equal(state('multiple').value,['a','b'],'multiple opens second');equal(cases.multiple.snapshot().model,['a','b'],'multiple binding copied');cases.multiple.setModel(['a','b','c']);await settle();equal(state('multiple').value,['a','b','c'],'replacement array command');cases.multiple.setModel([]);await settle();equal(state('multiple').open,[],'empty array closes all');cases.multiple.setModel('b');await settle();equal(cases.multiple.snapshot().model,['b'],'multiple normalizes scalar');
cases.cancel.options({cancel:true});await settle();click('cancel');await settle();equal(state('cancel').value,'a','callback cancel');equal(cases.cancel.snapshot().proposals[0].model,'a','callback sees previous model');
const cancelDom=event=>event.preventDefault();root('dom').addEventListener('starwind:value-change',cancelDom);click('dom');await settle();equal(state('dom').value,'a','DOM cancel');root('dom').removeEventListener('starwind:value-change',cancelDom);
let life=root('life');let controller=createAccordion(life);cases.life.options({disabled:true});await settle();ok(trigger('life').disabled,'item disabled inherits');click('life');await settle();equal(state('life').value,'a','disabled item ignores click');cases.life.options({disabled:false});await settle();ok(!trigger('life').disabled,'item disabled released');cases.life.options({triggerDisabled:true});await settle();ok(trigger('life').disabled,'native trigger disabled');cases.life.options({triggerDisabled:false});await settle();ok(trigger('life').disabled,'trigger disabled release matches peers');cases.life.replace('root');await settle();life=root('life');controller=createAccordion(life);ok(!trigger('life').disabled,'remount clears disabled Runtime output');
const oldItem=trigger('life').closest('[data-sw-accordion-item]');cases.life.replace('items');await settle();ok(!oldItem.isConnected,'keyed items replaced');ok(createAccordion(life)===controller,'item refresh stable');click('life');await settle();equal(state('life').value,'b','replacement item connects');ok(!life.querySelector('[data-panel="b"]').hidden,'replacement panel opens');
cases.life.collection(['a','c']);await settle();equal(state('life').value,null,'removed selected item reconciles');equal(cases.life.snapshot().model,'b','silent Runtime collection reconciliation leaves parent model');cases.life.collection(['a','b','c']);await settle();click('life');await settle();equal(state('life').value,'b','new item connects');
const refsBefore=cases.life.refs();cases.life.replace('ref');await settle();for(const part of ['root','item','trigger','panel']){const events=cases.life.refs().slice(refsBefore.length).filter(event=>event.part===part);equal(events.map(event=>[event.version,Boolean(event.node)]),[[0,false],[1,true]],part+' ref replacement');}ok(createAccordion(life)===controller,'ref replacement stable');
const events=cases.life.snapshot().attachments;for(const expected of ['root:0:DIV','item:0:DIV','trigger:0:BUTTON','panel:0:DIV'])ok(events.includes('set:'+expected),'attachment semantic owner '+expected);cases.life.replace('attachment');await settle();cases.life.replace('attachment');await settle();const all=cases.life.snapshot().attachments;equal(all.filter(event=>event.startsWith('set:')).length,all.filter(event=>event.startsWith('clear:')).length,'reactive symbols balanced');
cases.life.replace('callback');await settle();click('life','c');await settle();equal(cases.life.snapshot().proposals.at(-1).version,1,'latest callback');controller=createAccordion(life);
cases.life.options({defaultValue:'a',type:'multiple'});await settle();ok(createAccordion(life)!==controller,'type recreates');equal(life.getAttribute('data-type'),'multiple','type updates');controller=createAccordion(life);cases.life.options({collapsible:false,type:'single'});await settle();equal(life.getAttribute('data-collapsible'),'false','collapsible updates');click('life','c');await settle();equal(state('life').value,'c','ordinary selection works after option update');
click('inner','inner-b');await settle();equal(app.nested(),{outer:'outer',inner:'inner-b'},'nested root ownership');ok(!root('outer').querySelector('[data-slot="accordion-content"]').hidden,'outer panel remains visible');
const removed=root('remove');cases.remove.options({removeOnProposal:true});await settle();click('remove');await settle();ok(!root('remove'),'proposal unmount');removed.querySelector('[data-trigger="c"]').click();await settle();equal(cases.remove.snapshot().proposals.length,1,'removed owner listener cleanup');
const refs=Object.values(cases);await unmount(app);await settle();equal(target.querySelectorAll('[data-sw-accordion]').length,0,'all roots removed');for(const entry of refs){for(const part of ['root','item','trigger','panel'])equal(entry.refs().filter(event=>event.part===part&&event.node).length,entry.refs().filter(event=>event.part===part&&!event.node).length,part+' final refs balanced');}
document.documentElement.dataset.accordionResult=JSON.stringify({complete:true,models:true,collections:true,cancellation:true,nativeTrigger:true,attachments:true,cleanup:true});
}catch(error){document.documentElement.dataset.accordionResult=JSON.stringify({error:String(error),stack:error.stack});}
`;
