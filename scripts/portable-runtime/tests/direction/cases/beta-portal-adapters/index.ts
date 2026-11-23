import assert from "node:assert/strict";
import type { DirectionCase, DirectionExpectation } from "../../inventory.js";

const firstVisibleProbe = `const firstVisibleObserver = new MutationObserver(() => {
  if ((window as any).__firstVisiblePortal) return;
  const content = document.querySelector<HTMLElement>("#portal-content");
  if (!content || content.hidden || content.getAttribute("data-state") !== "open") return;
  const style = getComputedStyle(content);
  if (style.display === "none" || style.visibility === "hidden") return;
  const portal = content.closest<HTMLElement>("[data-sw-popover-portal]");
  if (!portal) return;
  (window as any).__firstVisiblePortal = {
    direction: style.direction,
    portalDirection: portal.getAttribute("dir"),
    target: portal.parentElement?.id ?? null,
  };
  firstVisibleObserver.disconnect();
});
firstVisibleObserver.observe(document.documentElement, { attributes: true, childList: true, subtree: true });
return () => firstVisibleObserver.disconnect();`;

const vueSource = `<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Popover, PopoverContent, PopoverTrigger } from "@direction/styled-vue/popover";
import "@direction/sheet";
const ownerDirection = ref<"rtl" | "ltr">("rtl");
const surfaceDirection = ref<"rtl" | undefined>();
const container = ref("#portal-target-a");
const disabled = ref(false);
const open = ref(false);
const show = ref(true);
const child = ref(false);
const ownerRevision = ref(0);
onMounted(() => { ${firstVisibleProbe} });
function destroy() {
  const portal = document.querySelector<HTMLElement>("[data-sw-popover-portal]");
  (window as any).__heldPortal = portal;
  (window as any).__beforeDestroy = { connected: portal?.isConnected, direction: portal?.getAttribute("dir") };
  show.value = false;
}
</script>
<template>
  <div id="portal-target-a" dir="ltr"></div><div id="portal-target-b" dir="ltr"></div>
  <div id="portal-owner" data-direction-scope :dir="ownerDirection" style="position:relative;margin:120px;width:460px">
    <Popover v-if="show" :key="ownerRevision" v-model:open="open">
      <PopoverTrigger id="portal-trigger">Open details</PopoverTrigger>
      <PopoverContent id="portal-content" :dir="surfaceDirection" :portal-container="container" :disable-portal="disabled" side="left" align="start" style="text-align:start">
        مرحبا Portal 42
        <button id="flip-owner" @click="ownerDirection = ownerDirection === 'rtl' ? 'ltr' : 'rtl'">Flip</button>
        <button id="author-surface" @click="surfaceDirection = 'rtl'">Author</button>
        <button id="retarget" @click="container = '#portal-target-b'">Retarget</button>
        <button id="disable-portal" @click="disabled = !disabled">Toggle portal</button>
        <button id="replace-child" @click="child = !child">Replace child</button>
        <button id="replace-owner" @click="ownerRevision += 1">Replace owner</button>
        <span v-if="child" id="replacement-child">New child</span><span v-else id="original-child">Old child</span>
        <button id="destroy-owner" @click="destroy">Destroy</button>
      </PopoverContent>
    </Popover>
  </div>
</template>`;

const svelteSource = `<script lang="ts">
import { onMount } from "svelte";
import { Popover, PopoverContent, PopoverTrigger } from "@direction/styled-svelte/popover";
import "@direction/sheet";
let ownerDirection = $state<"rtl" | "ltr">("rtl");
let surfaceDirection = $state<"rtl" | undefined>();
let container = $state("#portal-target-a");
let disabled = $state(false);
let open = $state(false);
let show = $state(true);
let child = $state(false);
let ownerRevision = $state(0);
onMount(() => { ${firstVisibleProbe} });
function destroy() {
  const portal = document.querySelector<HTMLElement>("[data-sw-popover-portal]");
  (window as any).__heldPortal = portal;
  (window as any).__beforeDestroy = { connected: portal?.isConnected, direction: portal?.getAttribute("dir") };
  show = false;
}
</script>
<div id="portal-target-a" dir="ltr"></div><div id="portal-target-b" dir="ltr"></div>
  <div id="portal-owner" data-direction-scope dir={ownerDirection} style="position:relative;margin:120px;width:460px">
    {#if show}
    {#key ownerRevision}
    <Popover bind:open>
      <PopoverTrigger id="portal-trigger">Open details</PopoverTrigger>
      <PopoverContent id="portal-content" dir={surfaceDirection} portalContainer={container} disablePortal={disabled} side="left" align="start" style="text-align:start">
        مرحبا Portal 42
        <button id="flip-owner" onclick={() => ownerDirection = ownerDirection === "rtl" ? "ltr" : "rtl"}>Flip</button>
        <button id="author-surface" onclick={() => surfaceDirection = "rtl"}>Author</button>
        <button id="retarget" onclick={() => container = "#portal-target-b"}>Retarget</button>
        <button id="disable-portal" onclick={() => disabled = !disabled}>Toggle portal</button>
        <button id="replace-child" onclick={() => child = !child}>Replace child</button>
        <button id="replace-owner" onclick={() => ownerRevision += 1}>Replace owner</button>
        {#if child}<span id="replacement-child">New child</span>{:else}<span id="original-child">Old child</span>{/if}
        <button id="destroy-owner" onclick={destroy}>Destroy</button>
      </PopoverContent>
    </Popover>
    {/key}
    {/if}
  </div>
`;

const vueIframeSource = `<script setup lang="ts">
import { createApp, onMounted, ref } from "vue";
import { Popover, PopoverContent, PopoverTrigger } from "@direction/styled-vue/popover";
import "@direction/sheet";
const { insideFrame = false } = defineProps<{ insideFrame?: boolean }>();
const ownerDirection = ref<"rtl" | "ltr">("rtl");
const surfaceDirection = ref<"rtl" | undefined>();
const container = ref("#portal-target-a");
const open = ref(false);
const show = ref(true);
onMounted(async () => {
  if (insideFrame) return;
  const frame = document.querySelector<HTMLIFrameElement>("#portal-frame")!;
  const ownerDocument = frame.contentDocument!;
  for (const id of ["portal-target-a", "portal-target-b"]) {
    const target = ownerDocument.createElement("div");
    target.id = id;
    target.dir = "ltr";
    ownerDocument.body.append(target);
  }
  const { default: Page } = await import("./Page.vue");
  const host = ownerDocument.createElement("div");
  ownerDocument.body.append(host);
  (window as any).__iframeApp = createApp(Page, { insideFrame: true });
  (window as any).__iframeApp.mount(host);
});
</script>
<template>
  <iframe v-if="!insideFrame" id="portal-frame" data-direction-scope style="width:1100px;height:760px" />
  <template v-else>
    <section id="portal-owner" data-direction-scope :dir="ownerDirection" style="position:relative;margin:120px;width:460px">
      <Popover v-if="show" v-model:open="open">
        <PopoverTrigger id="portal-trigger">Open details</PopoverTrigger>
        <PopoverContent id="portal-content" :dir="surfaceDirection" :portal-container="container" side="left" align="start">
          مرحبا Portal 42
          <button id="flip-owner" @click="ownerDirection = ownerDirection === 'rtl' ? 'ltr' : 'rtl'">Flip</button>
          <button id="author-surface" @click="surfaceDirection = 'rtl'">Author</button>
          <button id="retarget" @click="container = '#portal-target-b'">Retarget</button>
          <button id="destroy-owner" @click="show = false">Destroy</button>
        </PopoverContent>
      </Popover>
    </section>
  </template>
</template>`;

const vueOppositeIframeSource = `<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import { PopoverRoot, PopoverTrigger, PopoverPortal, PopoverPopup } from "@starwind-ui/vue/popover";
const insideFrame = new URLSearchParams(window.location.search).has("opposite-frame");
const frameSrc = window.location.pathname + "?opposite-frame=1";
const container = shallowRef<HTMLElement>();
const ownerDirection = ref<"rtl" | "ltr">("rtl");
const show = ref(true);
let retry: number | undefined;
onMounted(() => {
  if (insideFrame) {
    (window as any).__setOppositeTarget = (target: HTMLElement) => { container.value = target; };
    (window as any).__destroyOpposite = () => { show.value = false; };
    return;
  }
  const frame = document.querySelector<HTMLIFrameElement>("#opposite-frame")!;
  const install = () => {
    const child = frame.contentWindow as Window & { __setOppositeTarget?: (target: HTMLElement) => void };
    if (!child?.__setOppositeTarget) { retry = window.setTimeout(install, 0); return; }
    const ownerDocument = frame.contentDocument!;
    const adopted = document.createElement("div");
    adopted.id = "opposite-adopted-target";
    adopted.dir = "ltr";
    const native = ownerDocument.createElement("div");
    native.id = "opposite-native-target";
    native.dir = "ltr";
    ownerDocument.body.append(adopted, native);
    child.__setOppositeTarget(adopted);
    (window as any).__oppositeReady = true;
  };
  frame.addEventListener("load", install, { once: true });
});
onBeforeUnmount(() => {
  if (retry !== undefined) window.clearTimeout(retry);
  if (insideFrame) {
    delete (window as any).__setOppositeTarget;
    delete (window as any).__destroyOpposite;
  }
});
</script>
<template>
  <iframe v-if="!insideFrame" id="opposite-frame" :src="frameSrc" title="Opposite module realm" data-direction-scope style="width:1100px;height:760px" />
  <section v-else id="opposite-owner" data-direction-scope :dir="ownerDirection" style="position:relative;margin:120px;width:460px">
    <PopoverRoot v-if="show">
      <PopoverTrigger id="opposite-trigger" style="position:fixed;left:240px;top:100px;width:80px;height:32px">Open</PopoverTrigger>
      <PopoverPortal :container="container">
        <PopoverPopup id="opposite-popup" side="bottom" align="start" style="width:120px;height:60px">Popup</PopoverPopup>
      </PopoverPortal>
    </PopoverRoot>
  </section>
</template>`;

const svelteIframeSource = `<script lang="ts">
import { onMount, mount, unmount } from "svelte";
import { Popover, PopoverContent, PopoverTrigger } from "@direction/styled-svelte/popover";
import "@direction/sheet";
let { insideFrame = false }: { insideFrame?: boolean } = $props();
let ownerDirection = $state<"rtl" | "ltr">("rtl");
let surfaceDirection = $state<"rtl" | undefined>();
let container = $state("#portal-target-a");
let open = $state(false);
let show = $state(true);
onMount(() => {
  if (insideFrame) return;
  const frame = document.querySelector<HTMLIFrameElement>("#portal-frame")!;
  const ownerDocument = frame.contentDocument!;
  for (const id of ["portal-target-a", "portal-target-b"]) {
    const target = ownerDocument.createElement("div");
    target.id = id;
    target.dir = "ltr";
    ownerDocument.body.append(target);
  }
  let instance: Record<string, unknown> | undefined;
  void import("./Page.svelte").then(({ default: Page }) => {
    instance = mount(Page, { target: ownerDocument.body, props: { insideFrame: true } });
  });
  return () => { if (instance) void unmount(instance); };
});
</script>
{#if !insideFrame}<iframe id="portal-frame" title="Portal owner" data-direction-scope style="width:1100px;height:760px"></iframe>{:else}
  <section id="portal-owner" data-direction-scope dir={ownerDirection} style="position:relative;margin:120px;width:460px">
    {#if show}<Popover bind:open>
      <PopoverTrigger id="portal-trigger">Open details</PopoverTrigger>
      <PopoverContent id="portal-content" dir={surfaceDirection} portalContainer={container} side="left" align="start">
        مرحبا Portal 42
        <button id="flip-owner" onclick={() => ownerDirection = ownerDirection === "rtl" ? "ltr" : "rtl"}>Flip</button>
        <button id="author-surface" onclick={() => surfaceDirection = "rtl"}>Author</button>
        <button id="retarget" onclick={() => container = "#portal-target-b"}>Retarget</button>
        <button id="destroy-owner" onclick={() => show = false}>Destroy</button>
      </PopoverContent>
    </Popover>{/if}
  </section>
{/if}`;

const svelteFocusedIframeSource = (family: "menu" | "combobox") => {
  const controls =
    family === "menu"
      ? `<Parts.Trigger id="focused-trigger">Open menu</Parts.Trigger>`
      : `<Parts.InputGroup><Parts.Input id="focused-input" /><Parts.Trigger id="focused-trigger">Open choices</Parts.Trigger></Parts.InputGroup>`;
  const item =
    family === "menu"
      ? `<Parts.Item id="focused-item" closeOnClick={false}>Alpha</Parts.Item>`
      : `<Parts.Item id="focused-item" value="alpha">Alpha</Parts.Item>`;
  const popup =
    family === "menu"
      ? `<Parts.Popup id="focused-popup">${item}</Parts.Popup>`
      : `<Parts.Popup id="focused-popup"><Parts.List>${item}</Parts.List></Parts.Popup>`;
  return `<script lang="ts">
import { onMount, mount, unmount } from "svelte";
import Parts from "@starwind-ui/svelte/${family}";
let { insideFrame = false }: { insideFrame?: boolean } = $props();
let container = $state("#focused-target-a");
let show = $state(true);
onMount(() => {
  if (insideFrame) {
    (window as any).__moveFocused = () => { container = "#focused-target-b"; };
    (window as any).__destroyFocused = () => { show = false; };
    return () => { delete (window as any).__moveFocused; delete (window as any).__destroyFocused; };
  }
  const frame = document.querySelector<HTMLIFrameElement>("#focused-frame")!;
  const ownerDocument = frame.contentDocument!;
  for (const id of ["focused-target-a", "focused-target-b"]) {
    const target = ownerDocument.createElement("div");
    target.id = id;
    target.dir = "ltr";
    ownerDocument.body.append(target);
  }
  let instance: Record<string, unknown> | undefined;
  void import("./Page.svelte").then(({ default: Page }) => {
    instance = mount(Page, { target: ownerDocument.body, props: { insideFrame: true } });
  });
  return () => { if (instance) void unmount(instance); };
});
</script>
{#if !insideFrame}<iframe id="focused-frame" title="Focused portal owner" data-direction-scope style="width:1100px;height:760px"></iframe>{:else}
  <section id="focused-owner" data-direction-scope dir="rtl" style="position:relative;margin:120px;width:460px">
    {#if show}<Parts.Root>
      ${controls}
      <Parts.Portal {container}><Parts.Positioner>${popup}</Parts.Positioner></Parts.Portal>
    </Parts.Root>{/if}
  </section>
{/if}`;
};

const overlayExamples = [
  {
    id: "sheet",
    exports: ["Sheet", "SheetTrigger", "SheetContent", "SheetTitle"],
    markup: `<Sheet><SheetTrigger id="overlay-trigger">Open sheet</SheetTrigger><SheetContent id="overlay-content" side="left"><SheetTitle>Sheet content</SheetTitle></SheetContent></Sheet>`,
    side: "left",
  },
  {
    id: "dropdown",
    exports: ["Dropdown", "DropdownTrigger", "DropdownContent", "DropdownItem"],
    markup: `<Dropdown><DropdownTrigger id="overlay-trigger">Open menu</DropdownTrigger><DropdownContent id="overlay-content" side="right" align="start"><DropdownItem>Menu item</DropdownItem></DropdownContent></Dropdown>`,
    side: "right",
  },
] as const;

const firstVisibleOverlayProbe = `const firstVisibleOverlayObserver = new MutationObserver(() => {
  if ((window as any).__firstVisibleOverlay) return;
  const content = document.querySelector<HTMLElement>("#overlay-content");
  if (!content || content.hidden) return;
  const style = getComputedStyle(content);
  if (style.display === "none" || style.visibility === "hidden") return;
  if (content.localName === "dialog" ? !content.hasAttribute("open") : content.getAttribute("data-state") !== "open") return;
  const portal = content.closest<HTMLElement>("[data-sw-menu-portal], [data-sw-drawer-portal]");
  (window as any).__firstVisibleOverlay = {
    direction: style.direction,
    ownerDirection: getComputedStyle(document.querySelector("#overlay-owner")!).direction,
    portalDirection: portal?.getAttribute("dir") ?? null,
    side: content.getAttribute("data-side"),
    open: content.hasAttribute("open"),
    state: content.getAttribute("data-state"),
  };
  firstVisibleOverlayObserver.disconnect();
});
firstVisibleOverlayObserver.observe(document.documentElement, { attributes: true, childList: true, subtree: true });
return () => firstVisibleOverlayObserver.disconnect();`;

const overlaySource = (example: (typeof overlayExamples)[number], target: "vue" | "svelte") => {
  const imports = `import { ${example.exports.join(", ")} } from "@direction/styled-${target}/${example.id}";\nimport "@direction/sheet";`;
  const content = `<div id="overlay-owner" data-direction-scope dir="rtl" style="position:relative;margin:100px;width:400px">${example.markup}</div>`;
  return target === "vue"
    ? `<script setup lang="ts">import { onMounted } from "vue";\n${imports}\nonMounted(() => { ${firstVisibleOverlayProbe} });</script><template>${content}</template>`
    : `<script lang="ts">import { onMount } from "svelte";\n${imports}\nonMount(() => { ${firstVisibleOverlayProbe} });</script>${content}`;
};

const assertions = [
  "owner-direction-before-visible-paint",
  "live-owner-and-authored-surface",
  "retarget-disabled-and-child-replacement",
  "retained-close-and-reopen",
  "replaced-owner-and-ref-cleanup",
  "held-wrapper-cleanup",
];

export const cases: DirectionCase[] = [
  {
    id: "beta-portal-adapters-popover",
    row: "popover",
    acceptance: ["SPEC-AC-03", "SPEC-AC-04", "SPEC-AC-11", "SPEC-AC-14"],
    fixtures: {
      vue: {
        source: vueSource,
        exports: ["Popover", "PopoverContent", "PopoverTrigger"],
        assertions,
      },
      svelte: {
        source: svelteSource,
        exports: ["Popover", "PopoverContent", "PopoverTrigger"],
        assertions,
      },
    },
    physicalExceptions: [
      "Explicit side=left and data-side remain physical preferences; collision handling can choose another physical side.",
    ],
  },
  {
    id: "beta-portal-adapters-popover-iframe",
    row: "popover",
    acceptance: ["SPEC-AC-03", "SPEC-AC-04", "SPEC-AC-11", "SPEC-AC-14"],
    fixtures: {
      vue: {
        source: vueIframeSource,
        exports: ["Popover", "PopoverContent", "PopoverTrigger"],
        assertions: ["iframe-first-ready", "iframe-delayed-retarget", "iframe-owner-and-cleanup"],
      },
      svelte: {
        source: svelteIframeSource,
        exports: ["Popover", "PopoverContent", "PopoverTrigger"],
        assertions: ["iframe-first-ready", "iframe-delayed-retarget", "iframe-owner-and-cleanup"],
      },
    },
    physicalExceptions: ["Explicit side=left retains its physical meaning in the iframe."],
  },
  {
    id: "beta-portal-adapters-popover-opposite-iframe",
    row: "runtime:popover",
    acceptance: ["SPEC-AC-03", "SPEC-AC-04", "SPEC-AC-11", "SPEC-AC-14"],
    fixtures: {
      vue: {
        source: vueOppositeIframeSource,
        exports: ["PopoverRoot", "PopoverTrigger", "PopoverPortal", "PopoverPopup"],
        assertions: [
          "opposite-enabled-first-paint",
          "opposite-retarget",
          "opposite-removal-recovery",
          "opposite-invalid-targets",
          "opposite-cleanup",
        ],
      },
    },
  },
  ...(["menu", "combobox"] as const).map(
    (family): DirectionCase => ({
      id: `beta-portal-adapters-${family}-iframe`,
      row: `runtime:${family}`,
      acceptance: ["SPEC-AC-03", "SPEC-AC-04", "SPEC-AC-11", "SPEC-AC-14"],
      fixtures: {
        svelte: {
          source: svelteFocusedIframeSource(family),
          exports: [],
          assertions: ["iframe-focused-retarget", "iframe-focused-cleanup"],
        },
      },
    }),
  ),
  ...overlayExamples.map(
    (example): DirectionCase => ({
      id: `beta-portal-adapters-${example.id}`,
      row: example.id,
      acceptance: ["SPEC-AC-03", "SPEC-AC-04", "SPEC-AC-11", "SPEC-AC-14"],
      fixtures: {
        vue: {
          source: overlaySource(example, "vue"),
          exports: [...example.exports],
          assertions: ["owner-direction-before-visible-paint", "live-direction-and-physical-side"],
        },
        svelte: {
          source: overlaySource(example, "svelte"),
          exports: [...example.exports],
          assertions: ["owner-direction-before-visible-paint", "live-direction-and-physical-side"],
        },
      },
      physicalExceptions: [`Explicit side=${example.side} keeps its physical meaning.`],
    }),
  ),
];

type Page = Parameters<DirectionExpectation["run"]>[0];

function capture(page: Page) {
  return page.locator("#portal-content").evaluate((content) => {
    const portal = content.closest<HTMLElement>("[data-sw-popover-portal]")!;
    const positioner = content.closest<HTMLElement>("[data-sw-popover-positioner]");
    return {
      direction: getComputedStyle(content).direction,
      portalDirection: portal.getAttribute("dir"),
      target: portal.parentElement?.id ?? null,
      visible: !content.hasAttribute("hidden") && getComputedStyle(content).visibility !== "hidden",
      side: positioner?.getAttribute("data-side") ?? content.getAttribute("data-side"),
      align: positioner?.getAttribute("data-align") ?? content.getAttribute("data-align"),
    };
  });
}

export const expectations: DirectionExpectation[] = [
  {
    id: "beta-portal-adapters-popover-opposite-iframe",
    layer: "generated",
    async run(page, _target, ctx) {
      const frame = page.frameLocator("#opposite-frame");
      await page.waitForFunction(() => (window as any).__oppositeReady === true);
      await frame.locator("#opposite-trigger").waitFor();
      const realms = await page.evaluate(() => {
        const frame = document.querySelector<HTMLIFrameElement>("#opposite-frame")!;
        const ownerDocument = frame.contentDocument!;
        const target = ownerDocument.querySelector("#opposite-adopted-target")!;
        const portal = ownerDocument.querySelector("[data-sw-popover-portal]")!;
        const FrameHTMLElement = (frame.contentWindow as Window & typeof globalThis).HTMLElement;
        const firstVisible = new MutationObserver(() => {
          if ((window as any).__oppositeFirstVisible) return;
          const popup = ownerDocument.querySelector<HTMLElement>("#opposite-popup");
          const wrapper = ownerDocument.querySelector<HTMLElement>("[data-sw-popover-portal]");
          if (!popup || !wrapper || popup.hidden || popup.getAttribute("data-state") !== "open")
            return;
          const style = frame.contentWindow!.getComputedStyle(popup);
          if (style.display === "none" || style.visibility === "hidden") return;
          (window as any).__oppositeFirstVisible = {
            target: wrapper.parentElement?.id,
            placement: wrapper.getAttribute("data-placement"),
            disabled: wrapper.hasAttribute("data-disabled"),
            direction: style.direction,
          };
          firstVisible.disconnect();
        });
        firstVisible.observe(ownerDocument.documentElement, {
          attributes: true,
          childList: true,
          subtree: true,
        });
        return {
          sameDocument: target.ownerDocument === ownerDocument,
          targetFromParent: target instanceof HTMLElement,
          targetFromFrame: target instanceof FrameHTMLElement,
          portalFromFrame: portal instanceof FrameHTMLElement,
        };
      });
      ctx.observe("oppositeRealms", realms);
      assert.deepEqual(realms, {
        sameDocument: true,
        targetFromParent: true,
        targetFromFrame: false,
        portalFromFrame: true,
      });
      await frame.locator("#opposite-trigger").click();
      await frame.locator("#opposite-popup:visible").waitFor();
      await ctx.check("opposite-enabled-first-paint", async () => {
        await page.waitForFunction(() => {
          const wrapper = document
            .querySelector<HTMLIFrameElement>("#opposite-frame")!
            .contentDocument!.querySelector("[data-sw-popover-portal]");
          return wrapper?.getAttribute("data-placement") === "ready";
        });
        const first = await page.evaluate(() => (window as any).__oppositeFirstVisible);
        const placed = await page.evaluate(() => {
          const frame = document.querySelector<HTMLIFrameElement>("#opposite-frame")!;
          const ownerDocument = frame.contentDocument!;
          const wrapper = ownerDocument.querySelector<HTMLElement>("[data-sw-popover-portal]")!;
          const popup = ownerDocument.querySelector<HTMLElement>("#opposite-popup")!;
          const trigger = ownerDocument.querySelector<HTMLElement>("#opposite-trigger")!;
          return {
            target: wrapper.parentElement?.id,
            placement: wrapper.getAttribute("data-placement"),
            disabled: wrapper.hasAttribute("data-disabled"),
            direction: frame.contentWindow!.getComputedStyle(popup).direction,
            edgeError: Math.abs(
              popup.getBoundingClientRect().right - trigger.getBoundingClientRect().right,
            ),
          };
        });
        ctx.observe("oppositeFirst", { first, placed });
        assert.deepEqual(first, {
          target: "opposite-adopted-target",
          placement: "ready",
          disabled: false,
          direction: "rtl",
        });
        assert.equal(placed.target, "opposite-adopted-target");
        assert.equal(placed.placement, "ready");
        assert.equal(placed.disabled, false);
        assert.equal(placed.direction, "rtl");
        assert(placed.edgeError <= 1, `RTL popup edge error ${placed.edgeError}`);
      });
      await ctx.check("opposite-retarget", async () => {
        const retarget = async (id: string) => {
          await page.evaluate((targetId) => {
            const frame = document.querySelector<HTMLIFrameElement>("#opposite-frame")!;
            (frame.contentWindow as any).__setOppositeTarget(
              frame.contentDocument!.querySelector(targetId),
            );
          }, `#${id}`);
          await frame.locator(`#${id} > [data-sw-popover-portal]`).waitFor({ state: "attached" });
          await page.waitForFunction((targetId) => {
            const frame = document.querySelector<HTMLIFrameElement>("#opposite-frame")!;
            const wrapper = frame.contentDocument!.querySelector<HTMLElement>(
              "[data-sw-popover-portal]",
            );
            return (
              wrapper?.parentElement?.id === targetId &&
              wrapper.getAttribute("data-placement") === "ready" &&
              !wrapper.hasAttribute("data-disabled")
            );
          }, id);
        };
        await retarget("opposite-native-target");
        await retarget("opposite-adopted-target");
        await frame.locator("#opposite-owner").evaluate((element) => {
          element.setAttribute("dir", "ltr");
          element.dispatchEvent(new Event("starwind:direction-change", { bubbles: true }));
        });
        await page.waitForFunction(() => {
          const frame = document.querySelector<HTMLIFrameElement>("#opposite-frame")!;
          return (
            frame
              .contentDocument!.querySelector("[data-sw-popover-portal]")
              ?.getAttribute("dir") === "ltr"
          );
        });
        const state = await frame.locator("[data-sw-popover-portal]").evaluate((wrapper) => ({
          target: wrapper.parentElement?.id,
          ready: wrapper.getAttribute("data-placement"),
          disabled: wrapper.hasAttribute("data-disabled"),
          visible: !wrapper.querySelector<HTMLElement>("#opposite-popup")!.hidden,
        }));
        ctx.observe("oppositeRetarget", state);
        assert.deepEqual(state, {
          target: "opposite-adopted-target",
          ready: "ready",
          disabled: false,
          visible: true,
        });
      });
      await ctx.check("opposite-removal-recovery", async () => {
        await page.evaluate(() => {
          const frame = document.querySelector<HTMLIFrameElement>("#opposite-frame")!;
          const target = frame.contentDocument!.querySelector("#opposite-adopted-target")!;
          (window as any).__oppositeHeldTarget = target;
          target.remove();
        });
        await page.waitForFunction(() => {
          const frame = document.querySelector<HTMLIFrameElement>("#opposite-frame")!;
          const wrapper = frame.contentDocument!.querySelector<HTMLElement>(
            "[data-sw-popover-portal]",
          );
          const popup = frame.contentDocument!.querySelector<HTMLElement>("#opposite-popup");
          return (
            wrapper?.parentElement === frame.contentDocument!.body &&
            wrapper.getAttribute("data-placement") === "ready" &&
            !wrapper.hasAttribute("data-disabled") &&
            popup &&
            !popup.hidden
          );
        });
        const fallback = await page.evaluate(() => {
          const frame = document.querySelector<HTMLIFrameElement>("#opposite-frame")!;
          const wrapper = frame.contentDocument!.querySelector<HTMLElement>(
            "[data-sw-popover-portal]",
          )!;
          return {
            connected: wrapper.isConnected,
            target: wrapper.parentElement?.tagName,
            direction: frame.contentWindow!.getComputedStyle(wrapper).direction,
          };
        });
        ctx.observe("oppositeRemoval", fallback);
        assert.deepEqual(fallback, { connected: true, target: "BODY", direction: "ltr" });
        await page.evaluate(() => {
          const frame = document.querySelector<HTMLIFrameElement>("#opposite-frame")!;
          frame.contentDocument!.body.append((window as any).__oppositeHeldTarget);
        });
        await frame
          .locator("#opposite-adopted-target > [data-sw-popover-portal]")
          .waitFor({ state: "attached" });
        await page.waitForFunction(() => {
          const frame = document.querySelector<HTMLIFrameElement>("#opposite-frame")!;
          const wrapper = frame.contentDocument!.querySelector<HTMLElement>(
            "[data-sw-popover-portal]",
          );
          return (
            wrapper?.parentElement?.id === "opposite-adopted-target" &&
            wrapper.getAttribute("data-placement") === "ready" &&
            !wrapper.hasAttribute("data-disabled")
          );
        });
      });
      await ctx.check("opposite-invalid-targets", async () => {
        for (const kind of ["svg", "foreign"] as const) {
          await page.evaluate((invalidKind) => {
            const frame = document.querySelector<HTMLIFrameElement>("#opposite-frame")!;
            const target =
              invalidKind === "svg"
                ? frame.contentDocument!.createElementNS("http://www.w3.org/2000/svg", "svg")
                : document.createElement("div");
            (invalidKind === "svg" ? frame.contentDocument!.body : document.body).append(target);
            (frame.contentWindow as any).__setOppositeTarget(target);
          }, kind);
          await page.waitForFunction(() => {
            const frame = document.querySelector<HTMLIFrameElement>("#opposite-frame")!;
            const wrapper = frame.contentDocument!.querySelector<HTMLElement>(
              "[data-sw-popover-portal]",
            );
            return (
              wrapper?.parentElement === frame.contentDocument!.body &&
              wrapper.getAttribute("data-placement") === "ready" &&
              !wrapper.hasAttribute("data-disabled")
            );
          });
        }
        await page.evaluate(() => {
          const frame = document.querySelector<HTMLIFrameElement>("#opposite-frame")!;
          (frame.contentWindow as any).__setOppositeTarget(
            frame.contentDocument!.querySelector("#opposite-adopted-target"),
          );
        });
        await frame
          .locator("#opposite-adopted-target > [data-sw-popover-portal]")
          .waitFor({ state: "attached" });
      });
      await ctx.check("opposite-cleanup", async () => {
        await page.evaluate(() => {
          const frame = document.querySelector<HTMLIFrameElement>("#opposite-frame")!;
          (window as any).__oppositeHeldPortal = frame.contentDocument!.querySelector(
            "[data-sw-popover-portal]",
          );
          (frame.contentWindow as any).__destroyOpposite();
        });
        await page.waitForFunction(() => !(window as any).__oppositeHeldPortal?.isConnected);
        const dir = await page.evaluate(() =>
          (window as any).__oppositeHeldPortal?.getAttribute("dir"),
        );
        ctx.observe("oppositeCleanup", { dir });
        assert.equal(dir, null);
      });
    },
  },
  ...(["menu", "combobox"] as const).map(
    (family): DirectionExpectation => ({
      id: `beta-portal-adapters-${family}-iframe`,
      layer: "generated",
      async run(page, _target, ctx) {
        const frame = page.frameLocator("#focused-frame");
        await frame.locator("#focused-trigger").waitFor();
        await frame.locator("#focused-trigger").click();
        await frame.locator("#focused-popup:visible").waitFor();
        const realms = await page.evaluate(() => {
          const frame = document.querySelector<HTMLIFrameElement>("#focused-frame")!;
          const item = frame.contentDocument!.querySelector("#focused-item")!;
          const target = frame.contentDocument!.querySelector("#focused-target-a")!;
          const FrameHTMLElement = (frame.contentWindow as Window & typeof globalThis).HTMLElement;
          return {
            itemFromParent: item instanceof HTMLElement,
            itemFromFrame: item instanceof FrameHTMLElement,
            targetFromFrame: target instanceof FrameHTMLElement,
          };
        });
        ctx.observe("focusedRealms", realms);
        assert.deepEqual(realms, {
          itemFromParent: true,
          itemFromFrame: false,
          targetFromFrame: true,
        });
        await ctx.check("iframe-focused-retarget", async () => {
          await frame
            .locator("#focused-item")
            .evaluate((element) => (element as HTMLElement).focus());
          await page.evaluate(() => {
            const frame = document.querySelector<HTMLIFrameElement>("#focused-frame")!;
            const ownerDocument = frame.contentDocument!;
            const item = ownerDocument.querySelector<HTMLElement>("#focused-item")!;
            const root = ownerDocument.querySelector<HTMLElement>(
              "[data-sw-menu], [data-sw-combobox]",
            )!;
            const popup = ownerDocument.querySelector<HTMLElement>("#focused-popup")!;
            const events: string[] = [];
            (window as any).__focusEvents = events;
            ownerDocument.addEventListener("focusin", (event) =>
              events.push(`in:${(event.target as Element).id}`),
            );
            ownerDocument.addEventListener("focusout", (event) =>
              events.push(`out:${(event.target as Element).id}`),
            );
            const originalFocus = item.focus.bind(item);
            item.focus = (...args) => {
              events.push(
                `call:item.focus:${root.getAttribute("data-state")}:${popup.hidden}:${item.isConnected}:${item.checkVisibility({ visibilityProperty: true })}`,
              );
              originalFocus(...args);
            };
            new MutationObserver(() =>
              events.push(`state:${root.getAttribute("data-state")}:${popup.hidden}`),
            ).observe(root, { attributes: true, attributeFilter: ["data-state"] });
          });
          const before = await page.evaluate(() => {
            const frame = document.querySelector<HTMLIFrameElement>("#focused-frame")!;
            return frame.contentDocument!.activeElement?.id;
          });
          assert.equal(before, "focused-item");
          await page.evaluate(() => (window as any).__moveFocused());
          await frame
            .locator(
              "#focused-target-b > [data-sw-menu-portal], #focused-target-b > [data-sw-combobox-portal]",
            )
            .waitFor({ state: "attached" });
          const after = await page.evaluate(() => {
            const frame = document.querySelector<HTMLIFrameElement>("#focused-frame")!;
            return {
              active: frame.contentDocument!.activeElement?.id,
              events: (window as any).__focusEvents,
              popup: (() => {
                const popup = frame.contentDocument!.querySelector<HTMLElement>("#focused-popup")!;
                const style = frame.contentWindow!.getComputedStyle(popup);
                return {
                  hidden: popup.hidden,
                  state: popup.getAttribute("data-state"),
                  display: style.display,
                };
              })(),
              target: frame.contentDocument!.querySelector(
                "[data-sw-menu-portal], [data-sw-combobox-portal]",
              )?.parentElement?.id,
            };
          });
          ctx.observe("focusedRetarget", { before, after });
          assert.equal(after.active, "focused-item");
          assert.equal(after.target, "focused-target-b");
        });
        await ctx.check("iframe-focused-cleanup", async () => {
          await page.evaluate(() => {
            const frame = document.querySelector<HTMLIFrameElement>("#focused-frame")!;
            (window as any).__focusedHeldPortal = frame.contentDocument!.querySelector(
              "[data-sw-menu-portal], [data-sw-combobox-portal]",
            );
            (window as any).__destroyFocused();
          });
          await page.waitForFunction(() => !(window as any).__focusedHeldPortal?.isConnected);
          const direction = await page.evaluate(() =>
            (window as any).__focusedHeldPortal?.getAttribute("dir"),
          );
          ctx.observe("focusedCleanup", { direction });
          assert.equal(direction, null);
        });
      },
    }),
  ),
  {
    id: "beta-portal-adapters-popover-iframe",
    layer: "styled",
    async run(page, target, ctx) {
      const frame = page.frameLocator("#portal-frame");
      const portal = frame.locator("[data-sw-popover-portal]");
      await frame.locator("#portal-trigger").waitFor();
      const realms = await page.evaluate(() => {
        const frame = document.querySelector<HTMLIFrameElement>("#portal-frame")!;
        const trigger = frame.contentDocument!.querySelector("#portal-trigger")!;
        const target = frame.contentDocument!.querySelector("#portal-target-a")!;
        const FrameHTMLElement = (frame.contentWindow as Window & typeof globalThis).HTMLElement;
        const ownerDocument = frame.contentDocument!;
        const firstVisible = new MutationObserver(() => {
          if ((window as any).__iframeFirstVisible) return;
          const content = ownerDocument.querySelector<HTMLElement>("#portal-content");
          const portal = content?.closest<HTMLElement>("[data-sw-popover-portal]");
          if (
            !content ||
            !portal ||
            content.hidden ||
            content.getAttribute("data-state") !== "open"
          )
            return;
          const style = frame.contentWindow!.getComputedStyle(content);
          if (style.display === "none" || style.visibility === "hidden") return;
          (window as any).__iframeFirstVisible = {
            direction: style.direction,
            portalDirection: portal.getAttribute("dir"),
            target: portal.parentElement?.id ?? null,
          };
          firstVisible.disconnect();
        });
        firstVisible.observe(ownerDocument.documentElement, {
          attributes: true,
          childList: true,
          subtree: true,
        });
        return {
          parentHTMLElement: trigger instanceof HTMLElement,
          frameHTMLElement: trigger instanceof FrameHTMLElement,
          targetParentHTMLElement: target instanceof HTMLElement,
          targetFrameHTMLElement: target instanceof FrameHTMLElement,
          sameConstructor: HTMLElement === FrameHTMLElement,
        };
      });
      ctx.observe("iframeRealms", realms);
      assert.deepEqual(realms, {
        parentHTMLElement: true,
        frameHTMLElement: false,
        targetParentHTMLElement: false,
        targetFrameHTMLElement: true,
        sameConstructor: false,
      });
      await frame.locator("#portal-trigger").click();
      await frame.locator("#portal-content:visible").waitFor();
      await ctx.check("iframe-first-ready", async () => {
        if (target === "vue")
          await page.waitForFunction(() => {
            const frame = document.querySelector<HTMLIFrameElement>("#portal-frame")!;
            return (
              frame
                .contentDocument!.querySelector("[data-sw-popover-portal]")
                ?.getAttribute("data-placement") === "ready"
            );
          });
        const first = await page.evaluate(() => (window as any).__iframeFirstVisible);
        const placed = await portal.evaluate((element) => ({
          target: element.parentElement?.id,
          direction: element.ownerDocument.defaultView!.getComputedStyle(element).direction,
        }));
        ctx.observe("iframeFirst", { first, placed });
        assert.deepEqual(first, {
          direction: "rtl",
          portalDirection: "rtl",
          target: "portal-target-a",
        });
        assert.deepEqual(placed, { target: "portal-target-a", direction: "rtl" });
      });
      await ctx.check("iframe-delayed-retarget", async () => {
        await page.evaluate(() => {
          const ownerDocument =
            document.querySelector<HTMLIFrameElement>("#portal-frame")!.contentDocument!;
          const target = ownerDocument.querySelector("#portal-target-b")!;
          target.remove();
          (window as any).__delayedTarget = target;
        });
        await frame
          .locator("#retarget")
          .evaluate((element) => (element as HTMLButtonElement).click());
        await page.evaluate(() => {
          const ownerDocument =
            document.querySelector<HTMLIFrameElement>("#portal-frame")!.contentDocument!;
          ownerDocument.body.append((window as any).__delayedTarget);
        });
        await frame.locator("#portal-target-b > [data-sw-popover-portal]").waitFor({
          state: "attached",
        });
        if (target === "vue")
          await page.waitForFunction(() => {
            const frame = document.querySelector<HTMLIFrameElement>("#portal-frame")!;
            return (
              frame
                .contentDocument!.querySelector("[data-sw-popover-portal]")
                ?.getAttribute("data-placement") === "ready"
            );
          });
        ctx.observe(
          "iframeRetarget",
          await portal.evaluate((element) => element.parentElement?.id),
        );
      });
      await ctx.check("iframe-owner-and-cleanup", async () => {
        await frame
          .locator("#flip-owner")
          .evaluate((element) => (element as HTMLButtonElement).click());
        await page.waitForFunction(() => {
          const frame = document.querySelector<HTMLIFrameElement>("#portal-frame")!;
          return (
            frame.contentDocument!.querySelector("#portal-owner")?.getAttribute("dir") === "ltr"
          );
        });
        await frame.locator("#portal-owner").evaluate((element) => {
          const view = element.ownerDocument.defaultView!;
          element.ownerDocument.dispatchEvent(new view.Event("starwind:direction-change"));
        });
        await page.waitForFunction(() => {
          const frame = document.querySelector<HTMLIFrameElement>("#portal-frame")!;
          return (
            frame
              .contentDocument!.querySelector("[data-sw-popover-portal]")
              ?.getAttribute("dir") === "ltr"
          );
        });
        await frame
          .locator("#author-surface")
          .evaluate((element) => (element as HTMLButtonElement).click());
        const authored = await frame
          .locator("#portal-content")
          .evaluate(
            (element) => element.ownerDocument.defaultView!.getComputedStyle(element).direction,
          );
        assert.equal(authored, "rtl");
        await page.evaluate(() => {
          const frame = document.querySelector<HTMLIFrameElement>("#portal-frame")!;
          (window as any).__iframeHeldPortal = frame.contentDocument!.querySelector(
            "[data-sw-popover-portal]",
          );
        });
        await frame
          .locator("#destroy-owner")
          .evaluate((element) => (element as HTMLButtonElement).click());
        await page.waitForFunction(() => !(window as any).__iframeHeldPortal?.isConnected);
        const heldDirection = await page.evaluate(() =>
          (window as any).__iframeHeldPortal?.getAttribute("dir"),
        );
        ctx.observe("iframeCleanup", { heldDirection });
        assert.equal(heldDirection, null);
      });
    },
  },
  {
    id: "beta-portal-adapters-popover",
    layer: "styled",
    async run(page, _target, ctx) {
      await page.locator("#portal-trigger").click();
      await page.locator("#portal-content:visible").waitFor();
      const first = await capture(page);
      const firstVisible = await page.evaluate(() => (window as any).__firstVisiblePortal);
      ctx.observe("first", first);
      ctx.observe("firstVisibleMutation", firstVisible);
      await ctx.check("owner-direction-before-visible-paint", () => {
        assert.deepEqual(firstVisible, {
          direction: "rtl",
          portalDirection: "rtl",
          target: "portal-target-a",
        });
        assert.equal(first.visible, true);
        assert.equal(first.direction, "rtl");
      });
      await ctx.check("live-owner-and-authored-surface", async () => {
        await page.locator("#flip-owner").click();
        await page.waitForFunction(
          () => document.querySelector("#portal-owner")?.getAttribute("dir") === "ltr",
        );
        await page.evaluate(() => document.dispatchEvent(new Event("starwind:direction-change")));
        await page.waitForFunction(
          () => getComputedStyle(document.querySelector("#portal-content")!).direction === "ltr",
        );
        const flipped = await capture(page);
        ctx.observe("flipped", flipped);
        assert.equal(flipped.portalDirection, "ltr");
        await page.locator("#author-surface").click();
        await page.waitForFunction(
          () => getComputedStyle(document.querySelector("#portal-content")!).direction === "rtl",
        );
        const authored = await capture(page);
        ctx.observe("authored", authored);
        assert.equal(authored.portalDirection, "ltr");
        assert.equal(authored.direction, "rtl");
        assert.equal(authored.align, "start");
        assert(["left", "right"].includes(authored.side ?? ""));
      });
      await ctx.check("retarget-disabled-and-child-replacement", async () => {
        await page.locator("#retarget").click();
        await page.waitForFunction(
          () =>
            document.querySelector("[data-sw-popover-portal]")?.parentElement?.id ===
            "portal-target-b",
        );
        const moved = await capture(page);
        ctx.observe("moved", moved);
        assert.equal(moved.direction, "rtl");
        await page.locator("#disable-portal").click();
        await page.waitForFunction(
          () =>
            document.querySelector("[data-sw-popover-portal]")?.parentElement?.id !==
            "portal-target-b",
        );
        const inline = await capture(page);
        ctx.observe("inline", inline);
        assert.equal(inline.direction, "rtl");
        await page.locator("#disable-portal").click();
        await page.waitForFunction(
          () =>
            document.querySelector("[data-sw-popover-portal]")?.parentElement?.id ===
            "portal-target-b",
        );
        await page.locator("#replace-child").click();
        await page.locator("#replacement-child").waitFor();
        const replaced = await capture(page);
        ctx.observe("replaced", replaced);
        assert.equal(replaced.visible, true);
        assert.equal(replaced.direction, "rtl");
      });
      await ctx.check("retained-close-and-reopen", async () => {
        await page.locator("#portal-trigger").click();
        await page.waitForFunction(
          () => document.querySelector("#portal-content")?.getAttribute("data-state") === "closed",
        );
        const closed = await capture(page);
        ctx.observe("closed", closed);
        assert.equal(closed.portalDirection, "ltr");
        await page.locator("#portal-trigger").click();
        await page.locator("#portal-content:visible").waitFor();
        const reopened = await capture(page);
        ctx.observe("reopened", reopened);
        assert.equal(reopened.direction, "rtl");
        assert.equal(reopened.portalDirection, "ltr");
      });
      await ctx.check("replaced-owner-and-ref-cleanup", async () => {
        await page.evaluate(() => {
          const previous = document.querySelector<HTMLElement>("[data-sw-popover-portal]");
          (window as any).__replacedPortal = previous;
          const observer = new MutationObserver(() => {
            if ((window as any).__replacementFirstVisible) return;
            const content = document.querySelector<HTMLElement>("#portal-content");
            const portal = content?.closest<HTMLElement>("[data-sw-popover-portal]");
            if (!content || !portal || portal === previous) return;
            const style = getComputedStyle(content);
            if (
              content.getAttribute("data-state") !== "open" ||
              style.display === "none" ||
              style.visibility === "hidden"
            )
              return;
            (window as any).__replacementFirstVisible = {
              direction: style.direction,
              portalDirection: portal.getAttribute("dir"),
              target: portal.parentElement?.id ?? null,
            };
            observer.disconnect();
          });
          observer.observe(document.documentElement, {
            attributes: true,
            childList: true,
            subtree: true,
          });
        });
        await page.locator("#replace-owner").click();
        await page.waitForFunction(
          () =>
            (window as any).__replacementFirstVisible &&
            !(window as any).__replacedPortal?.isConnected,
        );
        const replacement = await page.evaluate(() => ({
          firstVisible: (window as any).__replacementFirstVisible,
          oldConnected: (window as any).__replacedPortal?.isConnected,
          oldDirection: (window as any).__replacedPortal?.getAttribute("dir"),
        }));
        ctx.observe("ownerReplacement", replacement);
        assert.deepEqual(replacement, {
          firstVisible: {
            direction: "rtl",
            portalDirection: "ltr",
            target: "portal-target-b",
          },
          oldConnected: false,
          oldDirection: null,
        });
      });
      await ctx.check("held-wrapper-cleanup", async () => {
        await page.locator("#destroy-owner").click();
        await page.waitForFunction(
          () =>
            !(window as any).__heldPortal?.isConnected &&
            (window as any).__heldPortal?.getAttribute("dir") === null,
        );
        await page.evaluate(() =>
          document.querySelector("#portal-owner")?.setAttribute("dir", "rtl"),
        );
        await page.waitForTimeout(30);
        const teardown = await page.evaluate(() => ({
          before: (window as any).__beforeDestroy,
          connected: (window as any).__heldPortal?.isConnected,
          direction: (window as any).__heldPortal?.getAttribute("dir"),
        }));
        ctx.observe("teardown", teardown);
        assert.deepEqual(teardown, {
          before: { connected: true, direction: "ltr" },
          connected: false,
          direction: null,
        });
      });
    },
  },
  ...overlayExamples.map(
    (example): DirectionExpectation => ({
      id: `beta-portal-adapters-${example.id}`,
      layer: "styled",
      async run(page, _target, ctx) {
        await page.locator("#overlay-trigger").click();
        await page.locator("#overlay-content:visible").waitFor();
        const content = page.locator("#overlay-content");
        const capture = () =>
          content.evaluate((element) => ({
            direction: getComputedStyle(element).direction,
            side: element.getAttribute("data-side"),
            state: element.getAttribute("data-state"),
            visible:
              !element.hasAttribute("hidden") && getComputedStyle(element).visibility !== "hidden",
          }));
        const first = await capture();
        const firstVisible = await page.evaluate(() => (window as any).__firstVisibleOverlay);
        ctx.observe("first", first);
        ctx.observe("firstVisibleMutation", firstVisible);
        await ctx.check("owner-direction-before-visible-paint", () => {
          assert(firstVisible, "The first visible mutation was not observed");
          assert.equal(firstVisible.direction, "rtl");
          assert.equal(firstVisible.ownerDirection, "rtl");
          assert.equal(firstVisible.side, example.side);
          if (example.id === "sheet") assert.equal(firstVisible.open, true);
          else assert.equal(firstVisible.portalDirection, "rtl");
          assert.equal(first.visible, true);
        });
        await ctx.check("live-direction-and-physical-side", async () => {
          await page.locator("#overlay-owner").evaluate((element) => {
            (element as HTMLElement).dir = "ltr";
            element.dispatchEvent(new Event("starwind:direction-change", { bubbles: true }));
          });
          await page.waitForFunction(
            () => getComputedStyle(document.querySelector("#overlay-content")!).direction === "ltr",
          );
          const flipped = await capture();
          ctx.observe("flipped", flipped);
          assert.equal(flipped.direction, "ltr");
          assert.equal(flipped.side, example.side);
        });
      },
    }),
  ),
];
