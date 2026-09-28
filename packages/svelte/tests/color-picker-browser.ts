import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { chromium } from "playwright";
import { createBrowserBuildScript } from "./compatibility-hydration.js";
import type { DistConsumer } from "./dist-consumer.js";

export async function verifyColorPickerLifecycle(consumer: DistConsumer) {
  await consumer.write({
    "Case.svelte": CASE,
    "App.svelte": APP,
    "hydrate-main.js": CLIENT,
    "build-browser.mjs": createBrowserBuildScript(true),
    "ssr.mjs": `import assert from "node:assert/strict";import {render} from "svelte/server";import App from "./App.svelte";import Picker,* as named from "@starwind-ui/svelte/color-picker";import * as root from "@starwind-ui/svelte";
assert.equal(globalThis.document,undefined);assert.equal(Picker,named.ColorPicker);assert.equal(Object.keys(Picker).length,23);for(const [part,component]of Object.entries(Picker)){assert.equal(named["ColorPicker"+part],component);assert.equal(root["ColorPicker"+part],component);}for(const name of ["parseColor","createColorPickerInitialState","projectColorPickerInitialPart"])assert.equal(named[name],root[name]);const body=render(App).body;assert.equal(render(App).body,body);assert.match(body,/data-model="observed">undefined\\|undefined/);console.log(JSON.stringify({body}));`,
  });
  const { body } = JSON.parse(await consumer.run("ssr.mjs", { loader: true }));
  assert.match(body, /data-sw-color-picker-initial-owned/);
  await consumer.run("build-browser.mjs");
  const javascript = await readFile(`${consumer.root}/browser.js`);
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
    await page.waitForFunction(
      () => document.documentElement.dataset.colorPickerResult,
      undefined,
      { timeout: 30_000 },
    );
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.colorPickerResult!),
    );
    assert.deepEqual(diagnostics, [], result.error);
    assert.equal(result.error, undefined, result.error);
    return result;
  } finally {
    await browser?.close();
    if (server.listening)
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
  }
}

const CASE = `<script lang="ts">
import {flushSync,untrack} from "svelte";
import {createAttachmentKey,type Attachment} from "svelte/attachments";
import Picker,{parseColor,type ColorPickerValue,type ColorPickerFormat} from "@starwind-ui/svelte/color-picker";
let {id,mode="bound",initialValue,initialFormat,defaultValue,empty=false,external=false,initialSwatchDisabled=false}:{id:string;mode?:string;initialValue?:ColorPickerValue;initialFormat?:ColorPickerFormat;defaultValue?:ColorPickerValue;empty?:boolean;external?:boolean;initialSwatchDisabled?:boolean}=$props();
let value=$state.raw<ColorPickerValue|undefined>(untrack(()=>initialValue)),format=$state<ColorPickerFormat|undefined>(untrack(()=>initialFormat));
let seed=$state.raw(untrack(()=>defaultValue)),allowEmpty=$state(empty),alpha=$state(true),disabled=$state(false),readOnly=$state(false),association=$state(external?"external":undefined);
let swatchDisabled=$state(untrack(()=>initialSwatchDisabled));
let styleText=$state("--caller: first"),partKey=$state(0),showParts=$state(true),channel=$state<"hue"|"red">("hue"),xChannel=$state<"saturation"|"red">("saturation"),orientation=$state<"horizontal"|"vertical">("horizontal"),step=$state(1),swatch=$state("#00ff00"),callbackVersion=$state(0),swapRef=$state(false),attachmentRead=$state(0),secondAttachment=$state(true);
let rootKey=$state(0);
export function remount(){rootKey++;}
let cancel=false,command:ColorPickerValue|undefined,transform="accept",node:HTMLDivElement|null=null;
const proposals:any[]=[],commits:any[]=[],formats:any[]=[],writes:any[]=[],refs:string[]=[],attachments:string[]=[];
const string=(v:ColorPickerValue|undefined)=>v===undefined?"undefined":v===null?"null":typeof v==="string"?v:v.toString("hex");
function propose(next:any,details:any,version:number){proposals.push({next:string(next),before:string(value),version});if(cancel)details.cancel();if(command!==undefined)flushSync(()=>{value=command;});}
let callback=$derived((next:any,details:any)=>propose(next,details,callbackVersion));
const oldRef=(element:HTMLInputElement|null)=>{refs.push("old:"+(element?"on":"off"));},newRef=(element:HTMLInputElement|null)=>{refs.push("new:"+(element?"on":"off"));};
const keyA=createAttachmentKey(),keyB=createAttachmentKey();
const attachA:Attachment<HTMLInputElement>=(element)=>{const read=attachmentRead;attachments.push("A:"+read+":on");return()=>attachments.push("A:"+read+":off");};
const attachB:Attachment<HTMLInputElement>=(element)=>{attachments.push("B:on");return()=>attachments.push("B:off");};
let attrs=$derived({[keyA]:attachA,...(secondAttachment?{[keyB]:attachB}:{})});
function writeValue(next:ColorPickerValue|undefined){writes.push({model:"value",next});value=transform==="canonical"&&next&&typeof next!=="string"?next.withChannels("rgb",{alpha:1}):transform==="invalid"?"invalid":next;}
function writeFormat(next:ColorPickerFormat|undefined){writes.push({model:"format",next});format=transform==="format"?"rgb":next;}
export function configure(options:any){if("style"in options)styleText=options.style;if("value"in options)value=options.value;if("format"in options)format=options.format;if("defaultValue"in options)seed=options.defaultValue;if("alpha"in options)alpha=options.alpha;if("allowEmpty"in options)allowEmpty=options.allowEmpty;if("disabled"in options)disabled=options.disabled;if("readOnly"in options)readOnly=options.readOnly;if("form"in options)association=options.form;if("cancel"in options)cancel=options.cancel;if("command"in options)command=options.command;if("transform"in options)transform=options.transform;if("parts"in options)showParts=options.parts;if("channel"in options)channel=options.channel;if("xChannel"in options)xChannel=options.xChannel;if("orientation"in options)orientation=options.orientation;if("step"in options)step=options.step;if("swatch"in options)swatch=options.swatch;if("swatchDisabled"in options)swatchDisabled=options.swatchDisabled;if(options.replace)partKey++;if(options.callback)callbackVersion++;if(options.ref)swapRef=true;if(options.attachment)attachmentRead++;if("secondAttachment"in options)secondAttachment=options.secondAttachment;}
export function snapshot(){return {node,value,format,proposals:[...proposals],commits:[...commits],formats:[...formats],writes:[...writes],refs:[...refs],attachments:[...attachments]};}
let common=$derived({id,style:styleText,alpha,allowEmpty,disabled,readOnly,defaultValue:seed,name:id,form:association,ref:(element:HTMLDivElement|null)=>{node=element;},onValueChange:callback,onValueCommitted:(next:any,details:any)=>commits.push({next:string(next),before:string(value)}),onFormatChange:(next:any,details:any)=>formats.push({next,previous:details.previousFormat})});
</script>
{#snippet parts()}
<Picker.Label>Color {id}</Picker.Label><Picker.Control><Picker.ValueInput data-input={id} ref={swapRef?newRef:oldRef} {...attrs}/><Picker.ValueSwatch/><Picker.ValueText/></Picker.Control>
{#if showParts}{#key partKey}
<Picker.Area {xChannel} style={styleText}><Picker.AreaBackground/><Picker.AreaThumb/><Picker.AreaInput axis="x" {step}/><Picker.AreaInput axis="y"/>
{#if id==="bound"}<Picker.Root id="nested" value="#0000ff"><Picker.AreaInput axis="x"/><Picker.Swatch swatchValue="#ff0000">Nested red</Picker.Swatch><Picker.HiddenInput/></Picker.Root>{/if}
</Picker.Area>
<Picker.ChannelSlider {channel} {orientation} {step}><Picker.ChannelSliderTrack/><Picker.ChannelSliderThumb/><Picker.ChannelSliderInput/></Picker.ChannelSlider>
<Picker.ChannelInput channel="red"/>
{/key}{/if}
<Picker.FormatSelect><option value="hex">Hex</option><option value="rgb">RGB</option><option value="hsl">HSL</option><option value="hsb">HSB</option></Picker.FormatSelect><Picker.FormatControl/>
<Picker.TransparencyGrid/><Picker.SwatchGroup><Picker.Swatch data-swatch={id} swatchValue={swatch} {swatchDisabled}>Preset</Picker.Swatch>{#if id==="swatches"}<Picker.Swatch data-native-disabled disabled swatchValue="#ff0000" {swatchDisabled}>Native disabled</Picker.Swatch>{/if}</Picker.SwatchGroup><Picker.EyeDropperTrigger>Sample</Picker.EyeDropperTrigger><Picker.Clear>Clear</Picker.Clear><Picker.HiddenInput/>
{/snippet}
<form id={id+"-form"}>
{#key rootKey}{#if mode==="plain"}<Picker.Root {...common} {value} {format} children={parts}/>
{:else if mode==="omitted"}<Picker.Root {...common} children={parts}/>
{:else if mode==="function"}<Picker.Root {...common} bind:value={()=>value,writeValue} bind:format={()=>format,writeFormat} children={parts}/>
{:else}<Picker.Root {...common} bind:value bind:format children={parts}/>{/if}{/key}
</form>
<output data-model={id}>{string(value)}|{format??"undefined"}</output>`;

const APP = `<script lang="ts">
import Case from "./Case.svelte";
let bound:Case,plain:Case,func:Case,omitted:Case,seeded:Case,empty:Case,external:Case,swatches:Case,observed:Case,observedFunc:Case,valueOnly:Case,formatOnly:Case,controlledEmpty:Case;
export function get(id:string){return ({bound,plain,func,omitted,seeded,empty,external,swatches,observed,observedFunc,valueOnly,formatOnly,controlledEmpty} as any)[id];}
</script>
<form id="external"></form><form id="external-next"></form>
<Case id="swatches" initialValue="#000000" initialSwatchDisabled bind:this={swatches}/><Case id="bound" initialValue="#000000" initialFormat="hex" bind:this={bound}/><Case id="observed" bind:this={observed}/><Case id="observedFunc" mode="function" bind:this={observedFunc}/><Case id="valueOnly" initialValue="#ff0000" bind:this={valueOnly}/><Case id="formatOnly" initialFormat="rgb" bind:this={formatOnly}/><Case id="controlledEmpty" mode="plain" empty initialValue={null} bind:this={controlledEmpty}/><Case id="plain" mode="plain" initialValue="#ff0000" initialFormat="rgb" defaultValue="#0000ff" bind:this={plain}/><Case id="func" mode="function" initialValue="#000000" initialFormat="hex" bind:this={func}/><Case id="omitted" mode="omitted" bind:this={omitted}/><Case id="seeded" initialValue="#123456" initialFormat="hsl" bind:this={seeded}/><Case id="empty" empty defaultValue={null} bind:this={empty}/><Case id="external-case" initialValue="#000000" initialFormat="hex" external bind:this={external}/>`;

const CLIENT = `import {hydrate,unmount,flushSync,tick} from "svelte";
import {createColorPicker,parseColor} from "@starwind-ui/runtime/color-picker";
import App from "./App.svelte";
const assert=(value,message)=>{if(!value)throw new Error(message);};
const settle=async()=>{flushSync();await tick();flushSync();await new Promise(resolve=>setTimeout(resolve,25));flushSync();};
const hex=(value)=>value===null?null:typeof value==="string"?value:value?.toString("hex");
const target=document.querySelector("#app"),before=[...document.querySelectorAll("[data-sw-color-picker]")],beforeParts=[...target.querySelectorAll("[data-sw-part]")];
let app;
try{
 app=hydrate(App,{target});assert(before.every(node=>node===document.getElementById(node.id)),"hydration preserves initial roots");assert(beforeParts.every(node=>target.contains(node)),"hydration preserves initial part nodes");await settle();
 const result={},reviewFailures=[];
 const c=(id)=>app.get(id),r=(id)=>c(id).snapshot().node,api=(id)=>createColorPicker(r(id));
 const own=(id,selector)=>[...r(id).querySelectorAll(selector)].find(node=>node.closest("[data-sw-color-picker]")===r(id));
 const swatch=(id)=>own(id,"[data-sw-color-picker-swatch]");
 const model=(id)=>hex(c(id).snapshot().value);
 const color=(id)=>hex(api(id).getValue());
 const expectColor=(id,expected)=>assert(color(id)===expected,id+" accepted color: "+color(id));
 assert(model("plain")==="#ff0000"&&color("plain")==="#ff0000"&&c("plain").snapshot().proposals.length===0,"initial silent command");
 assert(color("empty")===null&&api("empty").getFormat()==="hex","explicit nullable seed");
 swatch("plain").click();await settle();expectColor("plain","#ff0000");assert(model("plain")==="#ff0000","plain controlled prop refuses proposal");
 c("plain").configure({value:"#abcdef",format:"hsb"});await settle();expectColor("plain","#abcdef");assert(api("plain").getFormat()==="hsb"&&c("plain").snapshot().proposals.length===1,"later silent commands");
 c("bound").configure({value:"#123456",format:"hsl"});await settle();c("bound").configure({value:undefined,format:undefined});await settle();expectColor("bound","#123456");assert(api("bound").getFormat()==="hsl","later undefined retains format");
 c("bound").configure({value:"invalid"});await settle();expectColor("bound","#123456");
 swatch("omitted").click();await settle();expectColor("omitted","#00ff00");
 const func=c("func");func.configure({transform:"canonical"});await settle();let writeStart=func.snapshot().writes.length;api("func").setValue("#ff000080");await settle();assert(func.snapshot().writes.length===writeStart+1&&api("func").getValue().alpha===1,"one function binding write and canonical readback");
 func.configure({transform:"invalid"});await settle();writeStart=func.snapshot().writes.length;api("func").setValue("#0000ff");await settle();expectColor("func","#ff0000");assert(func.snapshot().writes.length===writeStart+1,"invalid controlled readback retains current state after one write");
 document.getElementById("func-form").reset();await settle();if(color("func")!=="#ff0000")reviewFailures.push("invalid function readback then reset: "+color("func"));
 func.configure({transform:"format",value:parseColor("#0000ff")});await settle();writeStart=func.snapshot().writes.length;api("func").setFormat("hsb");await settle();assert(api("func").getFormat()==="rgb"&&func.snapshot().writes.length===writeStart+1,"format function binding readback");c("observed").configure({value:"#abcdef",format:"hsl"});await settle();expectColor("observed","#000000");assert(api("observed").getFormat()==="hex","undefined binding cannot acquire control");
 swatch("observed").click();await settle();expectColor("observed","#00ff00");assert(model("observed")==="#00ff00","undefined binding observes accepted state");
 c("observed").configure({value:undefined,format:undefined});await settle();expectColor("observed","#00ff00");
 c("observed").configure({value:"#abcdef",format:"hsl"});c("observed").remount();await settle();expectColor("observed","#abcdef");assert(api("observed").getFormat()==="hsl","remount recaptures ownership");
 c("observedFunc").configure({transform:"canonical"});api("observedFunc").setValue("#ff000080");await settle();assert(api("observedFunc").getValue().alpha<1,"undefined function getter does not acquire control");
 c("valueOnly").configure({value:"#123456",format:"hsl"});c("formatOnly").configure({value:"#123456",format:"hsl"});await settle();expectColor("valueOnly","#123456");expectColor("formatOnly","#000000");assert(api("valueOnly").getFormat()==="hex"&&api("formatOnly").getFormat()==="hsl","independent initial ownership");
 swatch("controlledEmpty").click();await settle();expectColor("controlledEmpty",null);c("controlledEmpty").configure({value:"#123456"});await settle();expectColor("controlledEmpty","#123456");
 result.models=true;

 const swatches=c("swatches"),derivedDisabled=swatch("swatches"),nativeDisabled=own("swatches","[data-native-disabled]");
 assert(derivedDisabled.disabled&&nativeDisabled.disabled,"initial swatch and native disabled states");derivedDisabled.click();await settle();assert(swatches.snapshot().proposals.length===0,"initial swatchDisabled blocks interaction");
 swatches.configure({swatchDisabled:false});await settle();assert(!derivedDisabled.disabled&&nativeDisabled.disabled,"swatchDisabled release preserves explicit native disabled");derivedDisabled.click();await settle();expectColor("swatches","#00ff00");assert(model("swatches")==="#00ff00","released swatch publishes accepted color");
 swatches.configure({value:"#000000",swatchDisabled:true});await settle();const swatchProposals=swatches.snapshot().proposals.length;assert(derivedDisabled.disabled,"swatchDisabled can disable again");derivedDisabled.click();await settle();expectColor("swatches","#000000");assert(swatches.snapshot().proposals.length===swatchProposals,"reenabled constraint blocks proposals");
 swatches.configure({swatchDisabled:false,disabled:true});await settle();assert(derivedDisabled.disabled&&nativeDisabled.disabled,"Root disabled overrides swatch configuration");derivedDisabled.click();await settle();expectColor("swatches","#000000");
 swatches.configure({disabled:false});await settle();assert(!derivedDisabled.disabled&&nativeDisabled.disabled,"Root release preserves native disabled ownership");nativeDisabled.click();await settle();expectColor("swatches","#000000");derivedDisabled.click();await settle();expectColor("swatches","#00ff00");result.swatchDisabled=true;

 c("bound").configure({value:"#000000",format:"hex",cancel:true});await settle();
 let domBefore,domProposalCount;const countBeforeDOM=c("bound").snapshot().proposals.length;const veto=(event)=>{domProposalCount=c("bound").snapshot().proposals.length;domBefore=model("bound");event.preventDefault();};
 r("bound").addEventListener("starwind:value-change",veto);swatch("bound").click();await settle();expectColor("bound","#000000");assert(domProposalCount===countBeforeDOM+1&&domBefore==="#000000"&&c("bound").snapshot().proposals.at(-1).before==="#000000","proposal and DOM see previous bound value");
 c("bound").configure({cancel:false});await settle();swatch("bound").click();await settle();expectColor("bound","#000000");
 r("bound").removeEventListener("starwind:value-change",veto);swatch("bound").click();await settle();expectColor("bound","#00ff00");assert(model("bound")==="#00ff00"&&c("bound").snapshot().commits.at(-1).before==="#00ff00","accepted publication precedes commit callback");
 c("bound").configure({callback:true,swatch:"#ff0000",command:"#0000ff",cancel:true});await settle();swatch("bound").click();await settle();expectColor("bound","#0000ff");assert(c("bound").snapshot().proposals.at(-1).version===1,"current callback with parent command after canceled proposal");
 c("bound").configure({cancel:false,command:undefined});await settle();
 const select=own("bound","[data-sw-color-picker-format-select]");select.value="rgb";select.dispatchEvent(new Event("change",{bubbles:true}));await settle();assert(c("bound").snapshot().format==="rgb"&&c("bound").snapshot().formats.at(-1).previous==="hex","native format accepted output");
 const input=own("bound","[data-sw-color-picker-value-input]");input.value="bad draft";input.dispatchEvent(new Event("input",{bubbles:true}));assert(input.getAttribute("aria-invalid")==="true","Runtime owns invalid text draft");input.dispatchEvent(new Event("change",{bubbles:true}));await settle();expectColor("bound","#0000ff");result.transactions=true;

 const reset=(id)=>document.getElementById(id).reset();
 reset("omitted-form");await settle();expectColor("omitted","#000000");
 c("plain").configure({defaultValue:"#ffffff",value:"#112233",format:"hex"});await settle();reset("plain-form");await settle();expectColor("plain","#112233");assert(api("plain").getFormat()==="hex","controlled parent survives reset independently of default seed");
 assert(new FormData(document.getElementById("plain-form")).get("plain")===api("plain").getValueAsString(),"submitted control uses color value");
 c("seeded").configure({value:"#ffffff",format:"rgb"});await settle();reset("seeded-form");await settle();expectColor("seeded","#ffffff");assert(c("seeded").snapshot().format==="rgb","defined models stay parent-controlled across reset");
 c("empty").configure({allowEmpty:false});await settle();reset("empty-form");await settle();expectColor("empty","#000000");
 c("bound").configure({value:"#987654",format:"hsl"});await settle();const form=document.getElementById("bound-form");const cancelReset=(event)=>event.preventDefault();form.addEventListener("reset",cancelReset);form.reset();await settle();expectColor("bound","#987654");assert(c("bound").snapshot().format==="hsl","canceled reset restores both accepted models");form.removeEventListener("reset",cancelReset);
 form.reset();c("bound").configure({value:"#abcdef",format:"hsb"});flushSync();await settle();expectColor("bound","#abcdef");assert(c("bound").snapshot().format==="hsb","new command supersedes pending reset");
 form.reset();swatch("bound").click();await settle();expectColor("bound","#ff0000");
 const external=c("external");external.configure({value:"#123456",format:"rgb"});await settle();reset("external-case-form");await settle();expectColor("external","#123456");reset("external");await settle();expectColor("external","#123456");
 external.configure({form:"external-next",value:"#123456"});await settle();reset("external");await settle();expectColor("external","#123456");reset("external-next");await settle();expectColor("external","#123456");result.reset=true;
 c("plain").configure({value:"#00ff00"});await settle();c("plain").configure({value:"invalid"});await settle();reset("plain-form");await settle();if(color("plain")!=="#00ff00")reviewFailures.push("invalid plain prop then reset: "+color("plain"));
 c("plain").configure({value:"#0000ff"});await settle();reset("plain-form");c("plain").configure({value:"invalid"});flushSync();await settle();if(color("plain")!=="#0000ff")reviewFailures.push("invalid prop during pending reset: "+color("plain"));
 const omittedForm=document.getElementById("omitted-form");omittedForm.addEventListener("reset",cancelReset);
 for(const changed of ["value","format"]){api("omitted").setValue("#00ff00");api("omitted").setFormat("hsl");await settle();omittedForm.reset();if(changed==="value")api("omitted").setValue("#ff0000");else api("omitted").setFormat("rgb");await settle();const expectedValue=changed==="value"?"#ff0000":"#00ff00",expectedFormat=changed==="value"?"hsl":"rgb";if(color("omitted")!==expectedValue||api("omitted").getFormat()!==expectedFormat)reviewFailures.push("independent canceled reset "+changed+": "+color("omitted")+"/"+api("omitted").getFormat());}
 omittedForm.removeEventListener("reset",cancelReset);assert(reviewFailures.length===0,reviewFailures.join("; "));


 const owner=api("bound"),oldAxis=own("bound","[data-sw-color-picker-area-input]"),oldChannel=own("bound","[data-sw-color-picker-channel-input]");
 c("bound").configure({value:"#123456",channel:"red",xChannel:"red",orientation:"vertical",step:5});await settle();assert(own("bound","[data-sw-color-picker-area-input]")===oldAxis&&oldAxis.max==="255"&&oldChannel.max==="255"&&oldChannel.step==="5","in-place configuration refreshes live controls");c("bound").configure({replace:true});await settle();assert(api("bound")===owner&&!oldAxis.isConnected&&!oldChannel.isConnected,"keyed part replacement refreshes current owner");expectColor("bound","#123456");
 c("bound").configure({style:"--caller: changed"});await settle();assert(r("bound").style.getPropertyValue("--sw-color-picker-color")==="#123456","native style updates retain current Runtime paint");
 const axis=own("bound","[data-sw-color-picker-area-input]"),channel=own("bound","[data-sw-color-picker-channel-input]");assert(axis.max==="255"&&channel.max==="255"&&channel.step==="5","current area and channel context");
 channel.dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowUp",bubbles:true}));await settle();assert(api("bound").getValue().toString("hex")!=="#123456","refreshed native control works");
 const nested=document.getElementById("nested"),nestedApi=createColorPicker(nested);assert(nested.querySelector("[data-sw-color-picker-area-input]").max==="100","nested root resets outer area context");const parentColor=color("bound");nested.querySelector("[data-sw-color-picker-swatch]").click();await settle();assert(hex(nestedApi.getValue())==="#0000ff"&&color("bound")===parentColor,"nearest root isolation");
 const previousCallbacks=c("bound").snapshot().proposals.length;oldAxis.dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowRight",bubbles:true}));await settle();assert(c("bound").snapshot().proposals.length===previousCallbacks,"retired parts release handlers");
 c("bound").configure({parts:false});await settle();c("bound").configure({parts:true});await settle();assert(api("bound")===owner&&color("bound")===parentColor,"normal conditional parts retain accepted state");
 c("bound").configure({ref:true,attachment:true,secondAttachment:false});await settle();const refs=c("bound").snapshot().refs,attachments=c("bound").snapshot().attachments;assert(refs.join(",")==="old:on,old:off,new:on","ref callback replacement releases once");assert(attachments.includes("A:0:off")&&attachments.includes("A:1:on")&&attachments.filter(item=>item==="B:off").length===1,"reactive attachment owners");
 c("bound").configure({disabled:true});await settle();assert(api("bound")===owner&&own("bound","[data-sw-color-picker-hidden-input]").disabled,"setter options keep current owner");c("bound").configure({disabled:false,readOnly:true});await settle();assert(own("bound","[data-sw-color-picker-value-input]").readOnly,"readOnly setter");c("bound").configure({readOnly:false});await settle();c("bound").configure({value:"#ff000080"});await settle();c("bound").configure({alpha:false});await settle();assert(api("bound").getValue().alpha===1,"capability updates normalize Runtime value");result.parts=true;
 const eye=own("bound","[data-sw-color-picker-eye-dropper]");const original=window.EyeDropper;delete window.EyeDropper;owner.refresh({preserveState:true});assert(eye.hidden&&eye.hasAttribute("data-unsupported"),"unsupported EyeDropper stays hidden");let calls=0;window.EyeDropper=class{open(){calls++;return Promise.reject(new DOMException("Canceled","AbortError"));}};owner.refresh({preserveState:true});const beforeEye=color("bound");eye.click();await settle();assert(calls===1&&color("bound")===beforeEye,"canceled EyeDropper retains state without a prompt");window.EyeDropper=original;result.eyeDropper=true;
 const stale=swatch("bound"),last=c("bound"),count=last.snapshot().proposals.length;form.reset();await unmount(app);await settle();stale.click();owner.setValue("#ffffff");await settle();assert(!target.querySelector("[data-sw-color-picker]")&&last.snapshot().proposals.length===count,"teardown retires subscriptions and pending reset");const final=last.snapshot();assert(final.refs.filter(item=>item.endsWith(":on")).length===final.refs.filter(item=>item.endsWith(":off")).length&&final.attachments.filter(item=>item.endsWith(":on")).length===final.attachments.filter(item=>item.endsWith(":off")).length,"balanced refs and attachments");result.teardown=true;
 document.documentElement.dataset.colorPickerResult=JSON.stringify(result);
}catch(error){if(app)await unmount(app);document.documentElement.dataset.colorPickerResult=JSON.stringify({error:error.stack??String(error)});}`;
