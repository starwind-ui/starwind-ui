import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import type { DistConsumer } from "./dist-consumer.js";
import { BROWSER_BUILD } from "./compatibility-hydration.js";
import { nativeAttachmentOwnership } from "./styled-native-lifecycle.js";
import { videoImports, videoSourceCases } from "./styled-video-consumer.js";

const inlinePreview =
  "<!doctype html><html><body><p data-inline-preview>Trusted <strong>local preview</strong></p></body></html>";

export async function verifyStyledVideoBrowser(consumer: DistConsumer) {
  await consumer.write({
    "VideoLifecycle.svelte": APP,
    "hydrate-main.js": CLIENT,
    "build-video.mjs": BROWSER_BUILD,
    "video-ssr.mjs": `import assert from "node:assert/strict";import {render} from "svelte/server";import App from "./VideoLifecycle.svelte";import Video,* as exports from "./video/index.js";
assert.equal(globalThis.document,undefined);assert.equal(Video,exports.Video);assert.deepEqual(Object.keys(exports).sort(),["Video","VideoVariants","default"]);const body=render(App).body;assert.equal(body,render(App).body);console.log(JSON.stringify({body}));`,
  });
  const { body } = JSON.parse(await consumer.run("video-ssr.mjs", { loader: true }));
  assert.match(body, /<video\b/);
  assert.match(body, /<iframe\b/);
  assert.match(body, /<track[^>]*kind="captions"/);
  const build = JSON.parse(await consumer.run("build-video.mjs"));
  const javascript = await readFile(path.join(consumer.root, "browser.js"));
  const media = await readFile(
    new URL(
      "../../../apps/demo/src/assets/videos/starwind-pro_nav-3-responsive.mp4",
      import.meta.url,
    ),
  );
  const server = createServer((request, response) => {
    const pathname = new URL(request.url!, "http://localhost").pathname;
    if (pathname === "/browser.js") {
      response.setHeader("Content-Type", "text/javascript");
      response.end(javascript);
    } else if (pathname === "/clip.mp4") {
      response.setHeader("Content-Type", "video/mp4");
      response.end(media);
    } else if (pathname === "/poster.svg") {
      response.setHeader("Content-Type", "image/svg+xml");
      response.end(
        '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#172033"/></svg>',
      );
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
    const diagnostics: string[] = [],
      requests: string[] = [];
    page.on("pageerror", (error) => diagnostics.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) diagnostics.push(message.text());
    });
    await page.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (url.hostname === "127.0.0.1") return route.continue();
      assert.ok(
        ["www.youtube.com", "www.youtube-nocookie.com", "youtu.be"].includes(url.hostname),
        url.href,
      );
      requests.push(url.href);
      if (route.request().resourceType() === "media")
        await route.fulfill({
          status: 200,
          contentType: "video/mp4",
          body: media,
          headers: { "Access-Control-Allow-Origin": "*" },
        });
      else
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: "<!doctype html><title>Local embed fixture</title><p>Embedded video fixture</p>",
        });
    });
    await page.goto(`http://127.0.0.1:${address.port}`);
    await page.waitForFunction(() => document.documentElement.dataset.videoResult, undefined, {
      timeout: 30000,
    });
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.videoResult!),
    );
    assert.deepEqual(diagnostics, []);
    assert.equal(result.error, undefined, result.error);
    assert.ok(result.attachments.setups >= 5);
    assert.equal(result.attachments.setups, result.attachments.cleanups);
    assert.deepEqual(result, {
      sources: videoSourceCases.length,
      ssr: true,
      hydrated: true,
      localMedia: true,
      refs: result.refs,
      attachments: result.attachments,
      events: 4,
      remaining: 0,
    });
    assert.ok(
      requests.some((url) => url.startsWith("https://www.youtube-nocookie.com/embed/")),
      "iframe fixture did not request its derived source",
    );
    return { build, result, interceptedRequests: requests };
  } finally {
    await browser?.close();
    if (server.listening)
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
  }
}

const APP = `<script lang="ts">
${videoImports}
${nativeAttachmentOwnership}
import {createAttachmentKey,type Attachment} from "svelte/attachments";
const cases=${JSON.stringify(videoSourceCases)};
const preview=${JSON.stringify(inlinePreview)};
let src=$state("/clip.mp4"),srcdoc=$state<string|undefined>(undefined),changed=$state(false),second=$state(false),generation=$state(0);
const attachments:string[]=[];let media=$state<HTMLVideoElement|HTMLIFrameElement>(),events=0;
const attach=(name:string):Attachment<HTMLVideoElement|HTMLIFrameElement>=>node=>{const release=beginAttachment("media",node);attachments.push(name+":"+node.tagName+":setup");return()=>{release();attachments.push(name+":"+node.tagName+":cleanup");};};
const attachA=attach("a"),attachB=attach("b"),key=createAttachmentKey();
const unusedChildren=()=>{throw new Error("Video replaced its captions with caller children");};
export function changeProps(){changed=true;}
export function embed(){src="https://www.youtube.com/watch?v=changing-id";}
export function shorts(){src="https://www.youtube.com/shorts/changing-short";}
export function inline(){srcdoc=preview;}
export function emptyInline(){srcdoc="";}
export function clearInline(){srcdoc=undefined;}
export function invalid(){src="https://www.youtube.com/watch?v=";}
export function local(){src="/clip.mp4?second";}
export function replaceOwner(){generation++;}
export function snapshot(){return{refTag:media?.tagName??null,attachments:[...attachments],events};}
</script>
{#each cases as item(item.name)}<Video src={item.src} data-case={item.name} preload="none"/>{/each}
<Video src="https://youtu.be/parameters" data-case="parameters" autoplay muted loop controls={false}/>
<Video src="https://youtu.be/inline" data-case="inline" srcdoc={preview}/>
<Video src="https://youtu.be/empty-inline" data-case="empty-inline" srcdoc=""/>
<Video src="https://www.youtube.com/channel/invalid-inline" data-case="invalid-inline" srcdoc={preview} preload="none"/>
<Video src="https://youtu.be/overrides" data-case="overrides" title="Custom title" allow="fullscreen" allowfullscreen={false} referrerpolicy="origin" loading="lazy"/>
{#key generation}<Video data-changing {src} {srcdoc} bind:ref={media} {...{[key]:second?attachB:attachA}} autoplay={changed} muted={changed} loop={changed} controls={!changed} title={changed?"Updated title":"Video"} poster={changed?"/poster.svg":undefined} preload="metadata" playsinline class={["native-video",{updated:changed}]} style="max-width:640px" onpointerdown={event=>{if(event.currentTarget!==media)throw new Error("event owner");events++;}} children={unusedChildren}/>{/key}`;

const CLIENT = `import {hydrate,flushSync,tick,unmount} from "svelte";import App from "./VideoLifecycle.svelte";
const assert=(condition,message)=>{if(!condition)throw new Error(message);};const settle=async()=>{flushSync();await tick();flushSync();};
const cases=${JSON.stringify(videoSourceCases)},preview=${JSON.stringify(inlinePreview)};
const part=name=>document.querySelector('[data-case="'+name+'"]'),changing=()=>document.querySelector("[data-changing]");
const checkSources=()=>{for(const item of cases){const node=part(item.name);assert(node.tagName===item.tag,"source branch "+item.name);assert(node.dataset.slot==="video"&&node.hasAttribute("data-sw-video")&&node.classList.contains("aspect-video"),"source anatomy "+item.name);if(item.tag==="VIDEO"){assert(node.getAttribute("src")===item.src&&node.controls&&!node.autoplay&&!node.loop&&!node.muted,"native defaults "+item.name);assert(node.children.length===1&&node.firstElementChild.tagName==="TRACK"&&node.firstElementChild.kind==="captions","default captions "+item.name);}else{assert(node.getAttribute("src")==="https://www.youtube-nocookie.com/embed/"+item.id&&node.dataset.videoType===item.kind,"embedded source "+item.name);assert(node.title==="Video"&&node.allowFullscreen&&node.referrerPolicy==="strict-origin-when-cross-origin","iframe defaults "+item.name);assert(node.getAttribute("allow")==="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share","iframe permissions "+item.name);}}
assert(part("parameters").getAttribute("src")==="https://www.youtube-nocookie.com/embed/parameters?autoplay=1&mute=1&loop=1&playlist=parameters&controls=0","embed parameters");assert(!part("inline").hasAttribute("src")&&part("inline").getAttribute("srcdoc")===preview,"truthy srcdoc precedence");assert(part("empty-inline").getAttribute("src")==="https://www.youtube-nocookie.com/embed/empty-inline"&&part("empty-inline").getAttribute("srcdoc")==="","empty srcdoc contract");assert(part("invalid-inline").tagName==="VIDEO"&&!part("invalid-inline").hasAttribute("srcdoc"),"invalid source fallback precedes srcdoc");assert(part("overrides").title==="Custom title"&&part("overrides").getAttribute("allow")==="fullscreen"&&!part("overrides").allowFullscreen&&part("overrides").referrerPolicy==="origin"&&part("overrides").loading==="lazy","caller native iframe attributes");};
try{
checkSources();const before=[...document.querySelectorAll("[data-case]")],initial=changing();const app=hydrate(App,{target:document.querySelector("#app")});await settle();checkSources();assert(before.every(node=>node===part(node.dataset.case))&&initial===changing(),"hydration replaced owner");assert(app.snapshot().attachments.length===1,"initial attachment count");
if(initial.readyState<1)await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error("local video metadata timed out")),5000);initial.addEventListener("loadedmetadata",()=>{clearTimeout(timer);resolve();},{once:true});});assert(initial.videoWidth>0&&initial.duration>0,"local media metadata");
const dispatch=node=>node.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true}));dispatch(initial);
app.changeProps();await settle();assert(changing()===initial&&app.snapshot().refTag==="VIDEO","native prop update replaced ref");assert(initial.autoplay&&initial.muted&&initial.loop&&!initial.controls&&initial.getAttribute("poster")==="/poster.svg"&&initial.classList.contains("updated")&&initial.playsInline,"native prop updates");
app.embed();await settle();const frame=changing();assert(frame instanceof HTMLIFrameElement&&frame!==initial&&app.snapshot().refTag==="IFRAME","iframe branch replacement");assert(frame.getAttribute("src")==="https://www.youtube-nocookie.com/embed/changing-id?autoplay=1&mute=1&loop=1&playlist=changing-id&controls=0"&&frame.title==="Updated title","reactive embed parameters");dispatch(frame);dispatch(initial);assert(app.snapshot().events===2,"retired video handler");
app.shorts();await settle();assert(changing()===frame&&frame.dataset.videoType==="youtube-shorts"&&frame.getAttribute("src").includes("/changing-short?"),"same iframe source update");app.inline();await settle();assert(changing()===frame&&!frame.hasAttribute("src")&&frame.getAttribute("srcdoc")===preview,"reactive srcdoc precedence");app.emptyInline();await settle();assert(frame.hasAttribute("src")&&frame.getAttribute("srcdoc")==="","reactive empty srcdoc");app.clearInline();await settle();assert(!frame.hasAttribute("srcdoc")&&frame.hasAttribute("src")&&app.snapshot().refTag==="IFRAME","iframe source restoration");
app.invalid();await settle();const fallback=changing();assert(fallback instanceof HTMLVideoElement&&fallback!==frame&&fallback.getAttribute("src")==="https://www.youtube.com/watch?v="&&app.snapshot().refTag==="VIDEO","invalid URL native fallback");app.local();await settle();assert(changing()===fallback&&fallback.getAttribute("src")==="/clip.mp4?second"&&fallback.children.length===1,"native source and captions update");dispatch(fallback);dispatch(frame);assert(app.snapshot().events===3,"retired iframe handler");
app.replaceOwner();await settle();const current=changing();assert(current!==fallback&&app.snapshot().refTag==="VIDEO","keyed owner replacement updates bound ref");dispatch(current);dispatch(fallback);await unmount(app);await settle();dispatch(current);const log=app.snapshot();assert(log.events===4,"stale native events");assert(log.refTag===null,"bound ref cleanup");
document.documentElement.dataset.videoResult=JSON.stringify({sources:cases.length,ssr:true,hydrated:true,localMedia:true,refs:{setups:1,cleanups:log.refTag===null?1:0},attachments:{setups:log.attachments.filter(value=>value.endsWith(":setup")).length,cleanups:log.attachments.filter(value=>value.endsWith(":cleanup")).length},events:log.events,remaining:document.querySelector("#app").children.length});
}catch(error){document.documentElement.dataset.videoResult=JSON.stringify({error:String(error)});}`;
