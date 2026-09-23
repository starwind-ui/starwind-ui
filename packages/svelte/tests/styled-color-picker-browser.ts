import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { chromium } from "playwright";
import { createBrowserBuildScript } from "./compatibility-hydration.js";
import type { DistConsumer } from "./dist-consumer.js";

export async function verifyStyledColorPicker(consumer: DistConsumer) {
  await consumer.write({
    "App.svelte": APP,
    "hydrate-main.js": CLIENT,
    "build-browser.mjs": createBrowserBuildScript(true),
    "ssr.mjs": `import assert from "node:assert/strict";import {render} from "svelte/server";import App from "./App.svelte";import Picker,* as named from "./color-picker/index.js";assert.equal(globalThis.document,undefined);assert.equal(Object.keys(Picker).length,12);for(const key of Object.keys(Picker))assert.equal(Picker[key],named[key==="Root"?"ColorPicker":"ColorPicker"+key]);assert.equal(typeof named.ColorPickerVariants.colorPickerValueInput,"function");const body=render(App).body;assert.equal(render(App).body,body);console.log(JSON.stringify({body}));`,
  });
  const { body } = JSON.parse(await consumer.run("ssr.mjs", { loader: true }));
  await consumer.run("build-browser.mjs");
  const javascript = await readFile(`${consumer.root}/browser.js`);
  const server = createServer((request, response) => {
    if (request.url === "/browser.js") {
      response.setHeader("Content-Type", "text/javascript");
      response.end(javascript);
    } else {
      response.setHeader("Content-Type", "text/html");
      response.end(
        `<link rel="icon" href="data:,"><button id="outside">Outside</button><div id="app">${body}</div><script type="module" src="/browser.js"></script>`,
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
      () => document.documentElement.dataset.styledColorPickerResult,
      undefined,
      {
        timeout: 30_000,
      },
    );
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.styledColorPickerResult!),
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
const APP = `<script lang="ts">
import Picker from "./color-picker/index.js";import Dialog from "./dialog/index.js";import {createAttachmentKey,type Attachment} from "svelte/attachments";import type {ColorPickerValue,ColorPickerFormat} from "@starwind-ui/svelte/color-picker";
let portalContainer=$state<string>(),disablePortal=$state(false),modal=$state(false),canonicalize=$state(false),bindingWrites=0;
let value=$state.raw<ColorPickerValue|undefined>("#ff0000"),format=$state<ColorPickerFormat|undefined>("hex"),open=$state<boolean|undefined>(false),inline=$state(false),mode=$state<"select"|"native"|"none">("select"),disabled=$state(false),cancel=$state(false),dialogOpen=$state<boolean|undefined>(false),dialogPickerOpen=$state<boolean|undefined>(false);
let inlineValue=$state.raw<ColorPickerValue|undefined>("#00ff00"),inlineFormat=$state<ColorPickerFormat|undefined>("rgb"),inlineOpen=$state<boolean|undefined>(true),customValue=$state.raw<ColorPickerValue|undefined>("#0000ff");
const events:string[]=[],refs=new Map<string,HTMLElement>(),attachments=new Map<string,HTMLElement>();
const ref=(key:string)=>(node:HTMLElement|null)=>{if(node)refs.set(key,node);else refs.delete(key);};const rootRef=ref("root"),inputRef=ref("input"),contentRef=ref("content"),areaRef=ref("area");
const attrs=(key:string)=>({[createAttachmentKey()]:((node)=>{attachments.set(key,node);return()=>attachments.delete(key);}) as Attachment<HTMLElement>});const rootAttrs=attrs("root"),inputAttrs=attrs("input");
const swatches=[{value:"#ff0000",label:"Red"},{value:"#00ff00",label:"Green"},{value:"#0000ff",label:"Blue",disabled:true}];
export function command(next:any){if("modal"in next)modal=next.modal;if("canonicalize"in next)canonicalize=next.canonicalize;if("portalContainer"in next)portalContainer=next.portalContainer;if("disablePortal"in next)disablePortal=next.disablePortal;if("value"in next)value=next.value;if("format"in next)format=next.format;if("open"in next)open=next.open;if("inline"in next)inline=next.inline;if("mode"in next)mode=next.mode;if("disabled"in next)disabled=next.disabled;if("cancel"in next)cancel=next.cancel;if("dialogOpen"in next)dialogOpen=next.dialogOpen;if("dialogPickerOpen"in next)dialogPickerOpen=next.dialogPickerOpen;}
const hex=(color:ColorPickerValue|undefined)=>typeof color==="string"?color:color?.toString("hex")??null;
export function snapshot(){return {value:hex(value),format,open,inlineOpen,inlineValue:hex(inlineValue),inlineFormat,customValue:hex(customValue),events:[...events],refs:refs.size,attachments:attachments.size,owners:[...attachments].every(([key,node])=>refs.get(key)===node),dialogOpen,dialogPickerOpen,bindingWrites};}
</script>
<div id="sibling-portal"></div>
<form id="colors">
<Picker.Root id="popup" {portalContainer} {disablePortal} {modal} bind:value={()=>value,next=>{bindingWrites+=1;value=canonicalize?"#336699":next;}} bind:format bind:open {inline} formatControl={mode} {disabled} label="Accent" name="accent" clearable {swatches} ref={rootRef} {...rootAttrs} onValueChange={(color,details)=>{events.push("value:"+hex(color));if(cancel)details.cancel();}} onValueCommitted={()=>events.push("commit")} onFormatChange={next=>events.push("format:"+next)} onOpenChange={next=>{events.push("open:"+next);}} onCloseComplete={()=>events.push("closed")}/>
<Picker.Root id="inline" inline bind:value={inlineValue} bind:format={inlineFormat} bind:open={inlineOpen} label="Inline" name="inline" formatControl="native" showEyeDropper={false}/>
<Picker.Root id="custom" inline bind:value={customValue} name="custom" clearable><p data-custom>Custom</p><Picker.Input formatControl="none" ref={inputRef} {...inputAttrs}/><Picker.Swatch value="#ff0000" aria-label="Custom red"/><Picker.Clear>Clear custom</Picker.Clear></Picker.Root>
</form>
<Picker.Root id="nested-outer" value="#123456" name="outer-accent" form="colors"><Picker.Trigger>Outer editor</Picker.Trigger><Picker.Content portalContainer="#nested-inner"><Picker.Swatch value="#fedcba" aria-label="Outer swatch"/></Picker.Content><Picker.Root id="nested-inner" inline value="#654321" name="inner-accent" form="colors"><Picker.Swatch value="#abcdef" aria-label="Inner swatch"/></Picker.Root></Picker.Root>
<Dialog.Root bind:open={dialogOpen}><Dialog.Trigger>Open dialog</Dialog.Trigger><Dialog.Content id="dialog-local"><Dialog.Title>Color dialog</Dialog.Title><Dialog.Description>Edit the dialog color.</Dialog.Description><Picker.Root id="dialog-color" name="dialog-accent" form="colors" bind:open={dialogPickerOpen} value="#112233" label="Dialog accent"><Picker.Trigger>Dialog editor</Picker.Trigger><Picker.Content ref={contentRef}><Picker.Area ref={areaRef}/><Picker.ChannelSlider channel="red"/><Picker.ChannelInput channel="green"/><Picker.ValueSwatch/><Picker.Input formatControl="native"/></Picker.Content></Picker.Root></Dialog.Content></Dialog.Root>`;
const CLIENT = `import {hydrate,unmount,flushSync,tick} from "svelte";import App from "./App.svelte";
const assert=(value,message)=>{if(!value)throw new Error(message);};const q=selector=>document.querySelector(selector);const target=q("#app"),before=q("#popup");const app=hydrate(App,{target});const settle=async()=>{flushSync();await tick();flushSync();await new Promise(resolve=>setTimeout(resolve,25));};const click=async(selector)=>{const node=q(selector);assert(node,"Missing "+selector);node.click();await settle();};
try{
const regressions=[];
await settle();assert(before===q("#popup"),"exact hydration");assert(app.snapshot().value==="#ff0000"&&app.snapshot().format==="hex","accepted value and format");assert(app.snapshot().events.length===0,"silent initial models");assert(app.snapshot().inlineOpen===true&&!q("#inline [data-sw-popover]"),"inline retains open without overlay");assert(q("#custom [data-custom]")&&!q("#custom [data-slot=color-picker-area]"),"custom children replace defaults");assert(document.querySelectorAll("#colors [data-slot=color-picker-hidden-input]").length===3,"hidden input in each branch");assert(new FormData(q("#colors")).get("accent")==="#ff0000","native submitted value");assert(q("#popup [data-slot=color-picker-trigger]"),"public trigger slot");
await click("#popup [data-slot=color-picker-trigger]");assert(app.snapshot().open===true&&app.snapshot().events.includes("open:true"),"accepted Popover open forwarding");const content=q("#popup [data-slot=color-picker-content]");assert(content&&content.closest("#popup"),"popup stays in owned floating root");assert(q("#popup [data-slot=color-picker-area]")&&q("#popup [data-slot=color-picker-value-input]"),"default editor anatomy");assert(q("#popup [data-sw-color-picker-eye-dropper]").tagName==="BUTTON"&&q("#popup [data-sw-color-picker-eye-dropper] svg"),"EyeDropper keeps its native control and icon");
await click('#popup [data-slot=color-picker-swatch][aria-label="Green"]');assert(app.snapshot().value==="#00ff00"&&app.snapshot().events.includes("commit"),"swatch callbacks and accepted binding");assert(new FormData(q("#colors")).get("accent")==="#00ff00","updated form value");app.command({cancel:true});await settle();await click('#popup [data-slot=color-picker-swatch][aria-label="Red"]');assert(app.snapshot().value==="#00ff00","wrapper forwards value cancellation");app.command({cancel:false});await settle();
await click("#popup [data-sw-select-trigger]");await click('#popup [data-sw-select-item][data-value="hsl"]');assert(app.snapshot().format==="hsl"&&app.snapshot().events.includes("format:hsl"),"Styled Select changes the accepted format");app.command({format:"rgb"});await settle();assert(q("#popup [data-sw-select]").getAttribute("data-value")==="rgb","parent format updates Styled Select");
app.command({mode:"native"});await settle();assert(!q("#popup [data-sw-select]"),"native branch replaces Styled Select");const native=q("#popup [data-sw-color-picker-format-select]");native.value="hex";native.dispatchEvent(new Event("change",{bubbles:true}));await settle();assert(app.snapshot().format==="hex","native format binding");app.command({mode:"none"});await settle();assert(!q("#popup [data-sw-color-picker-format-select]")&&!q("#popup [data-sw-select]"),"omitted format control");
app.command({portalContainer:"#popup",disablePortal:true});await settle();assert(q("#popup [data-sw-popover-portal]").hasAttribute("data-disabled"),"disablePortal keeps authored owner");app.command({disablePortal:false});await settle();assert(q("#popup [data-sw-popover-portal]").parentElement===q("#popup"),"explicit owned portalContainer");
app.command({portalContainer:"#sibling-portal"});await settle();await click('[data-slot=color-picker-swatch][aria-label="Red"]');if(app.snapshot().value!=="#ff0000"||new FormData(q("#colors")).get("accent")!=="#ff0000")regressions.push("sibling portal loses editing and native submitted state");app.command({portalContainer:"#popup"});await settle();
const count=app.snapshot().events.length;app.command({value:"#abcdef",format:"hsb",open:false});await settle();assert(app.snapshot().value==="#abcdef"&&app.snapshot().format==="hsb"&&!app.snapshot().open,"silent parent commands");assert(app.snapshot().events.slice(count).every(value=>value==="closed"),"commands do not echo proposal callbacks");app.command({value:undefined,format:undefined});await settle();assert(q("#popup [data-sw-color-picker-value-input]").value.includes("hsb"),"later undefined keeps accepted format");
await click('#custom [data-slot=color-picker-swatch]');assert(app.snapshot().customValue==="#ff0000","custom swatch model");await click('#custom [data-slot=color-picker-clear]');assert(app.snapshot().customValue===null&&new FormData(q("#colors")).get("custom")==="","custom clear preserves empty form value");
app.command({value:"#abcdef",format:"hsb",open:true});await settle();const retained={value:q("#popup").getAttribute("data-value"),format:q("#popup").getAttribute("data-format"),submitted:new FormData(q("#colors")).get("accent")};const retainedRoot=q("#popup"),retainedProxy=q("#popup [data-slot=color-picker-hidden-input]");const layoutEvents=app.snapshot().events.length;app.command({value:undefined,format:undefined,open:undefined});await settle();for(const nextInline of [true,false]){app.command({inline:nextInline});await settle();if(q("#popup").getAttribute("data-value")!==retained.value||q("#popup").getAttribute("data-format")!==retained.format||new FormData(q("#colors")).get("accent")!==retained.submitted)regressions.push("layout transition loses accepted color/format/submitted value: "+JSON.stringify({inline:nextInline,retained,value:q("#popup").getAttribute("data-value"),format:q("#popup").getAttribute("data-format"),submitted:new FormData(q("#colors")).get("accent")}));assert(q("#popup")===retainedRoot&&q("#popup [data-slot=color-picker-hidden-input]")===retainedProxy,"layout keeps Primitive and form owners mounted");if(nextInline)assert(!q("#popup [data-sw-popover-popup]"),"inline has no overlay");else if(app.snapshot().open!==true)regressions.push("layout transition loses accepted open");}assert(app.snapshot().events.slice(layoutEvents).every(value=>value==="closed"),"layout commands do not echo change callbacks");assert(regressions.length===0,regressions.join("; "));
app.command({canonicalize:true,value:"#ff0000",format:"rgb",open:true,modal:true});await settle();const writes=app.snapshot().bindingWrites;await click('#popup [data-slot=color-picker-swatch][aria-label="Green"]');assert(app.snapshot().bindingWrites===writes+1,"one function-binding write");const canonical={value:q("#popup").getAttribute("data-value"),format:q("#popup").getAttribute("data-format"),submitted:new FormData(q("#colors")).get("accent")};assert(canonical.submitted==="rgb(51, 102, 153)","Primitive accepts canonicalized getter readback");const canonicalEvents=app.snapshot().events.length;assert(document.body.style.overflow==="hidden","modal popup acquires its scroll lock");app.command({value:undefined,format:undefined,open:undefined});await settle();app.command({inline:true});await settle();assert(document.body.style.overflow!=="hidden"&&!q("#popup [data-sw-popover-popup]"),"inline releases popup and scroll lock");const outside=q("#outside");outside.focus();outside.dispatchEvent(new KeyboardEvent("keydown",{key:"Tab",bubbles:true}));outside.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}));outside.click();await settle();assert(document.activeElement===outside,"inline releases focus ownership");app.command({inline:false});await settle();assert(q("#popup").getAttribute("data-value")===canonical.value&&q("#popup").getAttribute("data-format")===canonical.format&&new FormData(q("#colors")).get("accent")===canonical.submitted,"canonicalized accepted models survive undefined and layout");assert(app.snapshot().open===true&&app.snapshot().events.slice(canonicalEvents).every(value=>value==="closed"),"inline has no active dismissal or change callbacks");app.command({canonicalize:false,modal:false,open:false});await settle();
await click("#nested-outer [data-slot=color-picker-trigger]");const nestedPopup=q("#nested-outer [data-slot=color-picker-content]");assert(nestedPopup.closest("[data-sw-color-picker]")===q("#nested-outer"),"nested target falls back to the owning Color Picker");await click('[aria-label="Outer swatch"]');assert(new FormData(q("#colors")).get("outer-accent")==="#fedcba"&&new FormData(q("#colors")).get("inner-accent")==="#654321","nested owners keep independent editing and form state");await click('[aria-label="Inner swatch"]');assert(new FormData(q("#colors")).get("inner-accent")==="#abcdef"&&new FormData(q("#colors")).get("outer-accent")==="#fedcba","nested target keeps its own model");
app.command({dialogOpen:true});await settle();app.command({dialogPickerOpen:true});await settle();const popup=q("#dialog-color [data-slot=color-picker-content]");assert(popup&&popup.closest("#dialog-local"),"Dialog-local Popover placement");assert(app.snapshot().dialogOpen&&app.snapshot().dialogPickerOpen,"separate overlay models");const dialogInput=q("#dialog-color [data-sw-color-picker-channel-input]");dialogInput.value="200";dialogInput.dispatchEvent(new Event("input",{bubbles:true}));dialogInput.dispatchEvent(new Event("change",{bubbles:true}));await settle();assert(q("#dialog-color").getAttribute("data-value")!=="#112233","Dialog-local editor retains Color Picker ownership");assert(new FormData(q("#colors")).get("dialog-accent")===q("#dialog-color").getAttribute("data-value"),"Dialog-local submitted form value");assert(app.snapshot().owners&&app.snapshot().refs===4&&app.snapshot().attachments===2,"native refs and attachments across wrappers");
app.command({dialogPickerOpen:false});await settle();assert(app.snapshot().dialogOpen,"closing picker preserves Dialog");await unmount(app);await settle();assert(app.snapshot().refs===0&&app.snapshot().attachments===0,"wrapper teardown");assert(!q("[data-sw-color-picker]")&&!q("[data-sw-popover-portal]"),"owned nodes released");document.documentElement.dataset.styledColorPickerResult=JSON.stringify({hydration:true,models:true,formats:true,custom:true,form:true,dialog:true,teardown:true});
}catch(error){document.documentElement.dataset.styledColorPickerResult=JSON.stringify({error:error.stack??String(error)});}`;
