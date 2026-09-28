import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import type { DistConsumer } from "./dist-consumer.js";
import { BROWSER_BUILD } from "./compatibility-hydration.js";

export async function verifyStyledSlider(consumer: DistConsumer) {
  await consumer.write({
    "SliderCase.svelte": CASE,
    "SliderApp.svelte": APP,
    "SliderRefs.svelte": REFS,
    "hydrate-main.js": CLIENT,
    "slider-build.mjs": BROWSER_BUILD,
    "slider-ssr.mjs": `import assert from "node:assert/strict";import {render} from "svelte/server";import App from "./SliderApp.svelte";import Slider,* as named from "@starwind-ui/svelte/slider";assert.equal(globalThis.document,undefined);assert.equal(Slider.Root,named.SliderRoot);assert.deepEqual(Object.keys(Slider).sort(),["Control","Indicator","Label","Root","Thumb","Track"]);render(Slider.Root,{props:{ref(){throw new Error("SSR ref");}}});const body=render(App).body;assert.equal(body,render(App).body);console.log(JSON.stringify({body}));`,
  });
  const { body } = JSON.parse(await consumer.run("slider-ssr.mjs", { loader: true }));
  assert.match(body, /data-slot="slider-thumb"/);
  assert.match(body, /data-sw-slider-input/);
  assert.doesNotMatch(body, /\[object Object\]/);
  const build = JSON.parse(await consumer.run("slider-build.mjs"));
  const javascript = await readFile(path.join(consumer.root, "browser.js"));
  const server = createServer((request, response) => {
    if (request.url === "/browser.js") {
      response.setHeader("Content-Type", "text/javascript");
      response.end(javascript);
    } else {
      response.setHeader("Content-Type", "text/html");
      response.end(
        `<style>[data-case]{width:300px;margin:30px;position:relative;}[data-sw-slider-control]{position:relative;height:20px;width:300px;}[data-sw-slider-thumb]{position:absolute;top:0;width:16px;height:20px;}[data-sw-slider-track]{position:absolute;width:100%;height:6px;top:7px;}[data-sw-slider-control][data-orientation=vertical]{width:20px;height:200px;}[data-sw-slider-control][data-orientation=vertical] [data-sw-slider-track]{height:100%;width:6px;top:0;}</style><link rel="icon" href="data:,"><div id="app">${body}</div><script type="module" src="/browser.js"></script>`,
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
    await page.waitForFunction(
      () => document.documentElement.dataset.sliderResult,
      {},
      { timeout: 30000 },
    );
    let result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.sliderResult!),
    );
    assert.equal(result.error, undefined, JSON.stringify(result));
    assert.equal(result.ready, true, JSON.stringify(result));
    const control = page.locator('[data-case="pointer"] [data-sw-slider-control]');
    await control.scrollIntoViewIfNeeded();
    const box = await control.boundingBox();
    assert.ok(box);
    await page.evaluate(() => {
      const h = (globalThis as any).sliderHarness;
      h.pointerOwners = [...h.root("pointer").querySelectorAll("[data-sw-slider-thumb]")];
    });
    await page.mouse.move(box.x + 60 + 8, box.y + 10);
    await page.mouse.down();
    await page.mouse.move(box.x + 120, box.y + 10, { steps: 4 });
    await page.evaluate(async () => {
      const h = (globalThis as any).sliderHarness;
      await h.settle();
      h.ok(
        h.pointerOwners.every(
          (node: Element, index: number) => node === h.thumbs("pointer")[index],
        ),
        "drag retains thumbs",
      );
      h.equal(h.cases.pointer.snapshot().commits.length, 0, "drag defers commit");
      h.ok(h.cases.pointer.snapshot().changes.length > 0, "drag accepts changes");
    });
    await page.mouse.move(box.x + 150, box.y + 10, { steps: 3 });
    await page.mouse.up();
    await page.evaluate(async () => {
      const h = (globalThis as any).sliderHarness;
      await h.settle();
      h.equal(h.state("pointer").value, [50, 80], "pointer range");
      h.equal(h.cases.pointer.snapshot().commits.length, 1, "one pointer commit");
      h.equal(h.cases.pointer.snapshot().commits[0].previous, [20, 80], "pointer commit previous");
      h.ok(document.activeElement === h.pointerOwners[0], "drag retains focus");
    });
    const vertical = page.locator('[data-case="vertical"] [data-sw-slider-control]');
    await vertical.scrollIntoViewIfNeeded();
    const vb = await vertical.boundingBox();
    assert.ok(vb);
    await page.mouse.click(vb.x + 10, vb.y + vb.height * 0.25);
    await page.evaluate(async () => {
      const h = (globalThis as any).sliderHarness;
      await h.settle();
      h.equal(h.state("vertical").value, 75, "vertical pointer geometry");
      h.key("vertical", "ArrowDown");
      await h.settle();
      h.equal(h.state("vertical").value, 74, "vertical keyboard");
      await h.finish();
    });
    result = await page.evaluate(() => JSON.parse(document.documentElement.dataset.sliderResult!));
    assert.deepEqual(diagnostics, []);
    assert.equal(result.complete, true, JSON.stringify(result));
    return { result, build };
  } finally {
    await browser?.close();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

const CASE = String.raw`<script lang="ts">
import Slider from "./slider/index.js";
import type {SliderValue,SliderValueChangeDetails,SliderValueCommitDetails} from "@starwind-ui/svelte/slider";
import {createAttachmentKey} from "svelte/attachments";
import {untrack,flushSync} from "svelte";
let {id,mode="bound",initial,initialDefault,initialStep=1,vertical=false}:{id:string;mode?:string;initial?:SliderValue;initialDefault?:SliderValue;initialStep?:number;vertical?:boolean}=$props();
const copy=(next:SliderValue|undefined)=>Array.isArray(next)?[...next]:next;
let model=$state<SliderValue|undefined>(untrack(()=>copy(initial))),seed=$state(untrack(()=>copy(initialDefault))),step=$state(untrack(()=>initialStep)),min=$state(0),max=$state(100),largeStep=$state(10),disabled=$state(false),orientation=$state<"horizontal"|"vertical">(untrack(()=>vertical?"vertical":"horizontal")),form=$state<string|undefined>(),name=$state("choice"),visible=$state(true),key=$state(0),version=$state(0),symbol=$state(0),callbacks=$state(0),cancel=$state(false),command=$state<SliderValue|undefined>(),removeOnChange=$state(false);
const writes:(SliderValue|undefined)[]=[],changes:{next:SliderValue|undefined;previous:SliderValue;model:SliderValue|undefined;version:number}[]=[],commits:{next:SliderValue|undefined;previous:SliderValue;model:SliderValue|undefined;version:number}[]=[];
const refs:{version:number;node:HTMLDivElement|null}[]=[],attachments:string[]=[];let native=0;let proposal:SliderValue|undefined,publication:SliderValue|undefined;
const ref=$derived(((version:number)=>(node:HTMLDivElement|null)=>refs.push({version,node}))(version));
const attachmentKey=createAttachmentKey();const attached=$derived({[attachmentKey]:symbol===2?undefined:((version:number)=>(node:HTMLDivElement)=>{attachments.push("set:"+version);return()=>attachments.push("clear:"+version);})(symbol)});
const onValueChange=$derived(((version:number)=>(next:SliderValue,detail:SliderValueChangeDetails)=>{proposal=next;changes.push({next:copy(next),previous:copy(detail.previousValue) as SliderValue,model:copy(model),version});if(cancel)detail.cancel();if(command!==undefined){model=copy(command);flushSync();}if(removeOnChange){visible=false;flushSync();}})(callbacks));
const onValueCommitted=$derived(((version:number)=>(next:SliderValue,detail:SliderValueCommitDetails)=>commits.push({next:copy(next),previous:copy(detail.previousValue) as SliderValue,model:copy(model),version}))(callbacks));
function publish(next:SliderValue|undefined){publication=next;writes.push(copy(next));if(mode==="retain")return;model=mode==="transform"?(Array.isArray(next)?[30,70]:30):copy(next);}
export function setModel(next:SliderValue|undefined){model=copy(next);}
export function mutateModel(next:number){if(Array.isArray(model))model[0]=next;}
export function options(next:{defaultValue?:SliderValue;step?:number;min?:number;max?:number;largeStep?:number;disabled?:boolean;orientation?:"horizontal"|"vertical";form?:string;name?:string;cancel?:boolean;command?:SliderValue;removeOnChange?:boolean}){if("defaultValue" in next)seed=copy(next.defaultValue);if(next.step!==undefined)step=next.step;if(next.min!==undefined)min=next.min;if(next.max!==undefined)max=next.max;if(next.largeStep!==undefined)largeStep=next.largeStep;if(next.disabled!==undefined)disabled=next.disabled;if(next.orientation!==undefined)orientation=next.orientation;if("form" in next)form=next.form;if("name" in next)name=next.name??"choice";if(next.cancel!==undefined)cancel=next.cancel;if("command" in next)command=copy(next.command);if(next.removeOnChange!==undefined)removeOnChange=next.removeOnChange;}
export function replace(part:string){if(part==="root")key++;if(part==="ref")version++;if(part==="attachment")symbol++;if(part==="callback")callbacks++;}
export function show(next:boolean){visible=next;}export function references(){return [...refs];}
export function snapshot(){return {model:copy(model),writes:writes.map(copy),changes:[...changes],commits:[...commits],attachments:[...attachments],native,aliased:proposal!==undefined&&proposal===publication};}
</script>
<form id={id+"-other"}></form><form id={id+"-form"}>
{#if visible}{#key key}
{#if mode==="omitted"}<Slider data-case={id} defaultValue={seed} {step} {min} {max} {largeStep} {disabled} {orientation} {form} {name} {ref} {...attached} {onValueChange} {onValueCommitted} aria-label={id} onclick={()=>native++}/>
{:else if mode==="plain"}<Slider data-case={id} value={model} defaultValue={seed} {step} {min} {max} {largeStep} {disabled} {orientation} {form} {name} {ref} {...attached} {onValueChange} {onValueCommitted} aria-label={id} onclick={()=>native++}/>
{:else}<Slider data-case={id} bind:value={()=>model,publish} defaultValue={seed} {step} {min} {max} {largeStep} {disabled} {orientation} {form} {name} {ref} {...attached} {onValueChange} {onValueCommitted} aria-label={id} onclick={()=>native++}/>{/if}
{/key}{/if}</form>`;
const APP = String.raw`<script lang="ts">import Case from "./SliderCase.svelte";import Refs from "./SliderRefs.svelte";let cases:Record<string,Case>={};let refs:Refs;export function getCases(){return cases;}export function getRefs(){return refs;}</script>
<Case id="bound" initial={20} bind:this={cases.bound}/><Case id="plain" mode="plain" initial={20} bind:this={cases.plain}/><Case id="omitted" mode="omitted" initialDefault={25} initialStep={10} bind:this={cases.omitted}/><Case id="undefined" initialDefault={[17,83]} initialStep={10} bind:this={cases.undefined}/>
<Case id="range" initial={[20,80]} bind:this={cases.range}/><Case id="retain" mode="retain" initial={[20,80]} bind:this={cases.retain}/><Case id="transform" mode="transform" initial={[20,80]} bind:this={cases.transform}/><Case id="cancel" initial={20} bind:this={cases.cancel}/><Case id="dom" initial={20} bind:this={cases.dom}/><Case id="newer" initial={20} bind:this={cases.newer}/>
<Case id="reset" initial={[40,60]} initialDefault={[17,83]} initialStep={10} bind:this={cases.reset}/><Case id="cancelReset" initial={40} initialDefault={20} bind:this={cases.cancelReset}/><Case id="parentReset" initial={40} initialDefault={20} bind:this={cases.parentReset}/><Case id="interactionReset" initial={40} initialDefault={20} bind:this={cases.interactionReset}/>
<Case id="life" initial={20} bind:this={cases.life}/><Case id="remove" initial={20} bind:this={cases.remove}/><Case id="pointer" initial={[20,80]} bind:this={cases.pointer}/><Case id="vertical" initial={20} vertical bind:this={cases.vertical}/><Refs bind:this={refs}/>`;
const REFS = String.raw`<script lang="ts">
import Slider from "@starwind-ui/svelte/slider";import {createAttachmentKey} from "svelte/attachments";
let version=$state(0),symbol=$state(0);const events:{part:string;version:number;node:Element|null}[]=[],attached:string[]=[];
const reference=(part:string)=>(node:Element|null)=>events.push({part,version,node});
const refs=$derived.by(()=>{const current=version;return Object.fromEntries(["root","control","track","indicator","label","thumb","input"].map(part=>[part,(node:Element|null)=>events.push({part,version:current,node})]));});
const key=createAttachmentKey();const props=$derived.by(()=>{const current=symbol;return Object.fromEntries(["root","control","track","indicator","label","thumb"].map(part=>[part,{[key]:current===2?undefined:(node:Element)=>{attached.push("set:"+part+":"+current);return()=>attached.push("clear:"+part+":"+current);}}]));});
export function replace(part:string){if(part==="ref")version++;else symbol++;}export function snapshot(){return {events:[...events],attached:[...attached]};}
</script><Slider.Root data-case="refs" value={20} ref={refs.root} {...props.root}><Slider.Label ref={refs.label} {...props.label}>Ref slider</Slider.Label><Slider.Control ref={refs.control} {...props.control}><Slider.Track ref={refs.track} {...props.track}><Slider.Indicator ref={refs.indicator} {...props.indicator}/></Slider.Track><Slider.Thumb index={0} ref={refs.thumb} inputRef={refs.input} {...props.thumb}/></Slider.Control></Slider.Root>`;
const CLIENT = String.raw`import {hydrate,tick,unmount,flushSync} from "svelte";import App from "./SliderApp.svelte";import {createSlider} from "@starwind-ui/runtime/slider";
const equal=(actual,expected,label)=>{if(JSON.stringify(actual)!==JSON.stringify(expected))throw new Error(label+": "+JSON.stringify(actual)+" != "+JSON.stringify(expected));};const ok=(value,label)=>{if(!value)throw new Error(label);};
const copy=next=>Array.isArray(next)?[...next]:next;
const settle=async()=>{await tick();await tick();await new Promise(resolve=>setTimeout(resolve,10));await tick();};
const root=id=>document.querySelector('[data-case="'+id+'"]');const thumbs=id=>[...root(id).querySelectorAll('[data-sw-slider-thumb]')];const form=id=>document.getElementById(id+'-form');
const key=(id,key='ArrowRight',index=0)=>thumbs(id)[index].dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true}));
const state=id=>{const inputs=[...root(id).querySelectorAll('[data-sw-slider-input]')];return {value:copy(createSlider(root(id)).getValue()),inputs:inputs.map(node=>Number(node.value)),aria:thumbs(id).map(node=>Number(node.getAttribute('aria-valuenow'))),names:inputs.map(node=>node.name),submitted:[...new FormData(inputs[0]?.form??form(id)).values()].map(Number)};};
try {
 const target=document.querySelector('#app'),owners=[...target.querySelectorAll('[data-sw-slider-thumb]')];const app=hydrate(App,{target});await settle();const cases=app.getCases();ok(owners.every(node=>node.isConnected),'hydration retains thumbs');
 equal(state('omitted').value,30,'omitted normalize');equal(cases.undefined.snapshot().model,[20,80],'undefined normalized model');equal(cases.bound.snapshot().changes,[],'silent initialization');equal(cases.bound.snapshot().commits,[],'silent initial commit');
 for(const id of ['bound','plain','range','retain','transform']){key(id);await settle();}
 equal(cases.bound.snapshot().model,21,'bound accepted');equal(cases.plain.snapshot().model,20,'plain parent retained');equal(state('plain').value,21,'plain accepts interaction');cases.plain.setModel([10,90]);await settle();equal(state('plain').value,[10,90],'plain incoming array');cases.plain.mutateModel(30);await settle();equal(state('plain').value,[30,90],'plain in-place command');
 equal(state('range').value,[21,80],'range accepts');for(const [id,value] of [['retain',[20,80]],['transform',[30,70]]]){equal(state(id).value,value,id+' readback');equal(cases[id].snapshot().writes,[[21,80]],id+' one write');equal(cases[id].snapshot().commits[0].next,[21,80],id+' committed interaction');equal(cases[id].snapshot().commits[0].model,value,id+' committed accepted model');ok(!cases[id].snapshot().aliased,id+' copied callback array');}
 const rangeOwners=thumbs('range');rangeOwners[0].focus();cases.range.setModel([10,70]);await settle();ok(rangeOwners.every((node,index)=>node===thumbs('range')[index]),'numeric values retain thumb identity');ok(document.activeElement===rangeOwners[0],'numeric values retain focus');cases.range.mutateModel(25);await settle();equal(state('range').value,[25,70],'in-place bound command');
 cases.range.setModel([10,30,80]);await settle();ok(rangeOwners.every((node,index)=>node===thumbs('range')[index]),'thumb-count expansion retains prefix');equal(state('range').inputs,[10,30,80],'new thumb input');const removedThumb=thumbs('range')[2];cases.range.setModel(40);await settle();equal(thumbs('range').length,1,'range to scalar thumb count');equal(state('range').submitted,[40],'scalar submitted');const beforeRemoved=cases.range.snapshot().changes.length;removedThumb.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));await settle();equal(cases.range.snapshot().changes.length,beforeRemoved,'removed thumb inactive');
 cases.range.setModel([90,-10,32]);await settle();equal(state('range').value,[0,32,90],'sorted range command');cases.range.options({max:60,step:10});await settle();equal(state('range').value,[0,30,60],'constraints normalize');equal(state('range').inputs,[0,30,60],'normalized native inputs');cases.range.setModel(undefined);await settle();cases.range.options({defaultValue:5});await settle();equal(state('range').value,[0,30,60],'undefined retains accepted');equal(thumbs('range').length,3,'undefined retains thumb count');
 cases.cancel.options({cancel:true});await settle();key('cancel');await settle();equal(state('cancel').value,20,'callback cancellation');equal(cases.cancel.snapshot().writes,[],'cancel no publication');equal(cases.cancel.snapshot().commits,[],'cancel no commit');root('dom').addEventListener('starwind:value-change',event=>event.preventDefault());key('dom');await settle();equal(state('dom').value,20,'DOM cancellation');equal(cases.dom.snapshot().writes,[],'DOM cancel no publication');
 cases.newer.options({command:40,cancel:true});await settle();key('newer');await settle();equal(state('newer').value,40,'newer command beats canceled proposal');cases.newer.options({command:70,cancel:false});await settle();key('newer');await settle();equal(state('newer').value,70,'newer command beats accepted proposal');equal(cases.newer.snapshot().commits.at(-1).next,41,'committed proposal remains distinct');
 const input=root('bound').querySelector('input');input.value='35';input.dispatchEvent(new Event('change',{bubbles:true}));await settle();equal(state('bound').value,35,'native input change');equal(cases.bound.snapshot().commits.at(-1).next,35,'input commits once');root('bound').click();equal(cases.bound.snapshot().native,1,'native root callback once');form('bound').reset();await settle();equal(state('bound').value,20,'implicit reset seed uses initial model');
 const life=root('life'),controller=createSlider(life);cases.life.options({disabled:true});await settle();key('life');await settle();equal(state('life').value,20,'disabled ignores keyboard');ok(thumbs('life')[0].getAttribute('aria-disabled')==='true','disabled thumb ARIA');ok(root('life').querySelector('input').disabled,'disabled native input');cases.life.options({disabled:false,largeStep:20});await settle();key('life','PageUp');await settle();equal(state('life').value,40,'large step');key('life','Home');await settle();equal(state('life').value,0,'Home minimum');key('life','End');await settle();equal(state('life').value,100,'End maximum');
 cases.life.options({orientation:'vertical',name:'amount',form:'life-other'});await settle();equal(root('life').querySelector('input').form.id,'life-other','form association');equal(state('life').names,['amount'],'changed name');equal(thumbs('life')[0].getAttribute('aria-orientation'),'vertical','orientation');ok(thumbs('life')[0].style.bottom==='100%'&&!thumbs('life')[0].style.left,'Runtime vertical position');ok(createSlider(life)===controller,'mutable props keep controller');
 const beforeRef=cases.life.references().length;cases.life.replace('ref');await settle();equal(cases.life.references().slice(beforeRef).map(event=>[event.version,!!event.node]),[[0,false],[1,true]],'root callback ref replacement');const attachmentStart=cases.life.snapshot().attachments.length;cases.life.replace('attachment');await settle();cases.life.replace('attachment');await settle();equal(cases.life.snapshot().attachments.slice(attachmentStart),['clear:0','set:1','clear:1'],'root reactive attachment cleanup');cases.life.replace('callback');await settle();key('life','ArrowDown');await settle();equal(cases.life.snapshot().changes.at(-1).version,1,'latest proposal callback');equal(cases.life.snapshot().commits.at(-1).version,1,'latest commit callback');ok(createSlider(life)===controller,'callbacks and refs stable');
 const refs=app.getRefs(),before=refs.snapshot();refs.replace('ref');await settle();for(const part of ['root','control','track','indicator','label','thumb','input'])equal(refs.snapshot().events.slice(before.events.length).filter(event=>event.part===part).map(event=>[event.version,!!event.node]),[[0,false],[1,true]],part+' ref handoff');refs.replace('attachment');await settle();refs.replace('attachment');await settle();const attached=refs.snapshot().attached;equal(attached.filter(event=>event.startsWith('set:')).length,attached.filter(event=>event.startsWith('clear:')).length,'part symbols balance');
 cases.reset.options({defaultValue:[5,95],step:5});await settle();form('reset').reset();await settle();equal(state('reset').value,[15,85],'frozen raw reset seed');equal(state('reset').submitted,[15,85],'reset submission');equal(cases.reset.snapshot().changes,[],'reset silent proposal');equal(cases.reset.snapshot().commits,[],'reset silent commit');form('cancelReset').addEventListener('reset',event=>event.preventDefault());form('cancelReset').reset();form('parentReset').reset();cases.parentReset.setModel(70);flushSync();form('interactionReset').reset();key('interactionReset');flushSync();await settle();equal(state('cancelReset').value,40,'canceled reset');equal(state('parentReset').value,70,'parent supersedes reset');equal(state('interactionReset').value,41,'interaction supersedes reset');
 const old=root('life');cases.life.replace('root');await settle();ok(root('life')!==old,'keyed root replacement');ok(createSlider(root('life'))!==controller,'keyed root new controller');equal(state('life').value,99,'keyed root accepted');const oldCount=cases.life.snapshot().changes.length;old.querySelector('[data-sw-slider-thumb]').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));await settle();equal(cases.life.snapshot().changes.length,oldCount,'retired root inactive');
 cases.remove.options({removeOnChange:true});await settle();key('remove');await settle();ok(!root('remove'),'proposal unmount');equal(cases.remove.snapshot().writes,[],'removed proposal no binding');equal(cases.remove.snapshot().commits,[],'removed proposal no commit');
 async function finish(){const all=Object.values(cases);await unmount(app);await settle();equal(target.querySelectorAll('[data-sw-slider]').length,0,'final teardown');for(const entry of all){const events=entry.references();equal(events.filter(event=>event.node).length,events.filter(event=>!event.node).length,'root refs balance');}for(const part of ['root','control','track','indicator','label','thumb','input']){const events=refs.snapshot().events.filter(event=>event.part===part);equal(events.filter(event=>event.node).length,events.filter(event=>!event.node).length,part+' final ref cleanup');}document.documentElement.dataset.sliderResult=JSON.stringify({complete:true,models:true,thumbs:true,pointer:true,forms:true,cancellation:true,cleanup:true});}
 globalThis.sliderHarness={cases,root,thumbs,state,key,settle,equal,ok,finish};document.documentElement.dataset.sliderResult=JSON.stringify({ready:true});
}catch(error){document.documentElement.dataset.sliderResult=JSON.stringify({error:String(error),stack:error.stack});}`;
