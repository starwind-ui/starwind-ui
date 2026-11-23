import assert from "node:assert/strict";
import type { Locator, Page } from "playwright";
import type { DirectionCase, DirectionExpectation } from "../../inventory.js";
import { waitHidden } from "../../waits.js";
import { legacyEvidence } from "../legacy-baseline/index.js";

function nestedCarousel(outerAxis: "horizontal" | "vertical") {
  const innerAxis = outerAxis === "vertical" ? "horizontal" : "vertical";
  return `<section data-nest="${outerAxis}"><Carousel data-outer-carousel orientation="${outerAxis}" tabindex="0">
    <CarouselContent><CarouselItem><Carousel data-inner-carousel orientation="${innerAxis}" tabindex="0">
    <CarouselContent><CarouselItem>Inner A</CarouselItem><CarouselItem>Inner B</CarouselItem></CarouselContent>
    <CarouselPrevious><svg slot="icon" data-caller viewBox="0 0 10 10" style="rotate:22deg"><path d="M1 2L7 5L1 8"/></svg></CarouselPrevious><CarouselNext/>
    </Carousel></CarouselItem><CarouselItem>Outer B</CarouselItem></CarouselContent><CarouselPrevious/><CarouselNext/>
    </Carousel></section>`;
}
const nestedSidebar = `<div id="nested-sidebar" hidden><SidebarProvider><Sidebar collapsible="none" side="right">
<SidebarMenuButton tooltip="Static owner">Static button</SidebarMenuButton>
<SidebarProvider id="local-sidebar"><Sidebar side="left" collapsible="icon"><SidebarMenuButton tooltip="Child help">Child button</SidebarMenuButton></Sidebar><SidebarTrigger/></SidebarProvider>
</Sidebar></SidebarProvider></div>`;
const samples: Record<string, string> = {
  "alert-dialog":
    "<AlertDialog><AlertDialogTrigger>Open</AlertDialogTrigger><AlertDialogContent><AlertDialogHeader>Title</AlertDialogHeader><AlertDialogCancel>Close</AlertDialogCancel></AlertDialogContent></AlertDialog>",
  carousel:
    "<Carousel><CarouselContent><CarouselItem>One</CarouselItem><CarouselItem>Two</CarouselItem><CarouselItem>Three</CarouselItem></CarouselContent><CarouselPrevious/><CarouselNext/></Carousel>",
  "color-picker":
    '<ColorPicker id="color" defaultValue="#336699" animationDuration={100} align="start"/>',
  "context-menu":
    "<ContextMenu><ContextMenuTrigger><button>Context</button></ContextMenuTrigger><ContextMenuContent><ContextMenuItem>Choose</ContextMenuItem></ContextMenuContent></ContextMenu>",
  dialog:
    "<Dialog><DialogTrigger>Open</DialogTrigger><DialogContent><DialogHeader>Title</DialogHeader><DialogClose>Close</DialogClose></DialogContent></Dialog>",
  dropdown:
    '<Dropdown><DropdownTrigger>Open</DropdownTrigger><DropdownContent align="start" style="width:190px"><DropdownItem>Item</DropdownItem><DropdownSub><DropdownSubTrigger>More</DropdownSubTrigger><DropdownSubContent><DropdownItem>Child</DropdownItem></DropdownSubContent></DropdownSub></DropdownContent></Dropdown>',
  "hover-card":
    '<HoverCard openDelay={0}><HoverCardTrigger>Hover</HoverCardTrigger><HoverCardContent align="start" style="width:190px">Details</HoverCardContent></HoverCard>',
  "input-otp":
    '<InputOtp maxLength={4} defaultValue="2942" name="pin"><InputOtpGroup><InputOtpSlot index={0}/><InputOtpSlot index={1}/><InputOtpSlot index={2}/><InputOtpSlot index={3}/></InputOtpGroup></InputOtp>',
  popover:
    '<Popover><PopoverTrigger>Open</PopoverTrigger><PopoverContent align="start" style="width:190px"><p>Account</p></PopoverContent></Popover>',
  progress: "<Progress value={37} max={100}/>",
  "radio-group":
    '<RadioGroup><RadioGroupItem id="a" name="choice" value="a" checked/><label for="a">A</label><RadioGroupItem id="b" name="choice" value="b"/><label for="b">B</label><RadioGroupItem id="c" name="choice" value="c"/><label for="c">C</label></RadioGroup>',
  "scroll-area":
    '<ScrollArea class="h-24 w-56"><div style="width:700px;height:40px">Wide</div><ScrollBar slot="scrollbar" orientation="horizontal"/></ScrollArea>',
  select:
    '<Select name="choice"><SelectTrigger><SelectValue placeholder="Choose"/></SelectTrigger><SelectContent align="start"><SelectItem value="a">First</SelectItem><SelectItem value="b">Second</SelectItem></SelectContent></Select>',
  sheet:
    '<Sheet><SheetTrigger>Open</SheetTrigger><SheetContent side="right"><SheetTitle>Details</SheetTitle></SheetContent></Sheet>',
  sidebar:
    '<SidebarProvider><Sidebar side="right" collapsible="icon"><SidebarMenu><SidebarMenuItem><SidebarMenuButton tooltip="Menu help">Menu button</SidebarMenuButton><SidebarMenuAction>Action</SidebarMenuAction><SidebarMenuBadge>42</SidebarMenuBadge></SidebarMenuItem></SidebarMenu></Sidebar><SidebarInset><SidebarTrigger/></SidebarInset></SidebarProvider>',
  slider:
    '<Slider defaultValue={[20,70]} name="range" aria-label="Range"/><div style="height:150px"><Slider orientation="vertical" defaultValue={25} aria-label="Vertical"/></div>',
  switch:
    '<Switch id="switch" label="Label" checked/><Switch id="small" size="sm" padding={2.5} checked/><Switch id="large" size="lg" padding={5} disabled/>',
  tabs: '<Tabs defaultValue="a"><TabsList><TabsTrigger value="a">A</TabsTrigger><TabsTrigger value="b" disabled>B</TabsTrigger><TabsTrigger value="c">C</TabsTrigger><TabsTrigger value="d">D</TabsTrigger></TabsList><TabsContent value="a">A</TabsContent><TabsContent value="c">C</TabsContent><TabsContent value="d">D</TabsContent></Tabs>',
  toast: '<Toaster position="bottom-right"/><button id="notify">Notify</button>',
  tooltip:
    '<Tooltip openDelay={0}><TooltipTrigger><button>Help</button></TooltipTrigger><TooltipContent align="start" style="width:190px">Details</TooltipContent></Tooltip>',
};
const scopes = ["ordinary-ltr", "ordinary-rtl", "nested-ltr", "nested-rtl"];
const rows = legacyEvidence.filter((row) => row.owner === "legacy-interactive");
assert.deepEqual(rows.map((row) => row.id).sort(), Object.keys(samples).sort());
const criteria: Record<string, string[]> = {
  "alert-dialog": ["11", "12"],
  carousel: ["05", "10", "12"],
  "color-picker": ["09", "11"],
  "context-menu": ["05", "11"],
  dialog: ["11", "12"],
  dropdown: ["05", "11", "12"],
  "hover-card": ["11"],
  "input-otp": ["13"],
  popover: ["11"],
  progress: ["09"],
  "radio-group": ["05"],
  "scroll-area": ["09"],
  select: ["09", "12"],
  sheet: ["11", "12"],
  sidebar: ["11", "12"],
  slider: ["07"],
  switch: ["08"],
  tabs: ["05"],
  toast: ["12"],
  tooltip: ["11"],
};
const exceptions: Record<string, string> = {
  carousel: "Vertical navigation and explicit Embla options retain their meanings.",
  "context-menu": "The mouse origin stays at the physical client point.",
  "color-picker": "The popup remains positioned in physical viewport coordinates.",
  dialog: "The native dialog remains physically centered.",
  "alert-dialog": "The native alert dialog remains physically centered.",
  "scroll-area": "scrollLeft is a physical browser value; the viewport owns scroll direction.",
  sheet: "An explicit right sheet stays on the physical right.",
  sidebar: "The fixed desktop sidebar and its mobile sheet retain their explicit right edge.",
  toast: "The bottom-right viewport and swipe coordinates remain physical.",
  tooltip: "A side-aligned tooltip arrow keeps its physical centering pair.",
  slider: "The vertical axis, input names and thumb indices retain their meanings.",
};
export const cases: DirectionCase[] = rows.map(({ id }) => {
  const markup =
    samples[id]! +
    (id === "carousel"
      ? nestedCarousel("horizontal") + nestedCarousel("vertical")
      : id === "sidebar"
        ? nestedSidebar
        : id === "tooltip"
          ? '<Tooltip id="physical-tip"><TooltipTrigger><button>Physical help</button></TooltipTrigger><TooltipContent side="right">Physical side</TooltipContent></Tooltip>'
          : "");
  const names = [...new Set([...markup.matchAll(/<([A-Z]\w*)/g)].map((m) => m[1]!))];
  const source = `---
import { ${names.join(", ")} } from "@direction/legacy-astro/${id}";
import "@direction/sheet";
---
<html><head><title>Legacy ${id}</title></head><body><main id="outer"><section id="owner">
<script is:inline>
  const scope = new URL(location.href).searchParams.get("scope") || "ordinary-ltr";
  const inner = scope.endsWith("rtl") ? "rtl" : "ltr";
  document.documentElement.dir = scope.startsWith("nested") ? (inner === "rtl" ? "ltr" : "rtl") : inner;
  if (scope.startsWith("nested")) document.querySelector("#owner").dir=inner;
</script>
${markup}
${id === "carousel" ? `<script is:inline>for(const inner of document.querySelectorAll("[data-inner-carousel]")) inner.dir=getComputedStyle(inner.closest("[data-outer-carousel]")).direction==="rtl"?"ltr":"rtl";</script>` : ""}
</section></main>
${id === "toast" ? `<script>import {toast} from "@/components/starwind/toast"; document.querySelector("#notify")?.addEventListener("click",()=>toast({title:"Message",duration:0}));</script>` : ""}
<style is:global>
body {margin:0} #outer {padding:100px 0} #owner {width:320px;margin-inline:auto}
[data-slot="scroll-area-thumb"] {margin-inline:3px 9px}
[data-nest] {margin-block:90px}
[data-outer-carousel] {height:300px}
[data-inner-carousel] {height:130px;width:140px;margin:64px auto}
[data-nest] [data-slot="carousel-content"],[data-nest] [data-slot="carousel-container"] {height:100%}
[data-nest] [data-slot="carousel-item"] {min-height:0}
</style></body></html>`;
  return {
    id: "legacy-controls-" + id,
    row: "legacy:" + id,
    acceptance: ["01", "03", ...criteria[id]!].map((number) => "SPEC-AC-" + number),
    physicalExceptions: exceptions[id] ? [exceptions[id]!] : [],
    fixtures: { astro: { source, exports: names, assertions: scopes } },
  };
});
const slot = (part: string) => `[data-slot="${part}"]`;
const direction = (el: Locator) => el.evaluate((node) => getComputedStyle(node).direction);
async function box(el: Locator) {
  const rect = await el.boundingBox();
  assert(rect, "visible bounds");
  return rect;
}
async function flip(page: Page, dir: string) {
  await page.locator("#owner").evaluate(async (node, dir) => {
    node.setAttribute("dir", dir);
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
  }, dir);
}
async function finish(el: Locator) {
  await el.evaluate(async (node) => {
    await Promise.all(
      node
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => {})),
    );
  });
}
type Facts = Record<string, unknown>;
async function checkPopupOverride(trigger: Locator, popup: Locator, dir: string, facts: Facts) {
  const authored = dir === "rtl" ? "ltr" : "rtl";
  await popup.evaluate(async (el, value) => {
    el.setAttribute("dir", value);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }, authored);
  const a = await box(trigger),
    b = await box(popup);
  const startOffset = authored === "rtl" ? b.x + b.width - a.x - a.width : b.x - a.x;
  const origin = await popup.evaluate((el) =>
    Number.parseFloat(getComputedStyle(el).transformOrigin),
  );
  facts.authoredPopup = {
    authored,
    startOffset,
    origin,
    triggerWidth: a.width,
    popupWidth: b.width,
    state: await popup.getAttribute("data-state"),
    placement: await popup.evaluate((n) => [
      n.getAttribute("dir"),
      getComputedStyle(n).direction,
      (n as HTMLElement).style.left,
      (n as HTMLElement).style.transformOrigin,
    ]),
  };
  assert(Math.abs(a.width - b.width) > 4, "unequal trigger and popup widths");
  assert(Math.abs(startOffset) < 2, "authored popup direction aligns its inline start");
  assert(
    Math.abs(origin - (authored === "rtl" ? b.width : 0)) < 2,
    "transform origin follows authored inline start",
  );
  await popup.evaluate(async (el) => {
    el.removeAttribute("dir");
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  });
}
async function checkNestedCarousels(page: Page, dir: string, facts: Facts) {
  for (const outerAxis of ["horizontal", "vertical"]) {
    const host = page.locator(`[data-nest="${outerAxis}"]`),
      outer = host.locator("[data-outer-carousel]"),
      inner = host.locator("[data-inner-carousel]");
    const innerDir = dir === "rtl" ? "ltr" : "rtl";
    for (const [root, axis, d, label] of [
      [outer, outerAxis, dir, "outer"],
      [inner, outerAxis === "horizontal" ? "vertical" : "horizontal", innerDir, "inner"],
    ] as const) {
      const vertical = axis === "vertical";
      const geometry = await root.evaluate((el) => {
        const viewport = el.querySelector(':scope > [data-slot="carousel-content"]')!,
          container = viewport.firstElementChild!,
          item = container.firstElementChild!;
        const next = el.querySelector(":scope > .starwind-carousel-next")!,
          prev = el.querySelector(":scope > .starwind-carousel-previous")!;
        return {
          direction: getComputedStyle(el).direction,
          flow: getComputedStyle(container).flexDirection,
          gap: [getComputedStyle(item).paddingInlineStart, getComputedStyle(item).paddingTop],
          nextTurn: getComputedStyle(next).rotate,
          icon: getComputedStyle(next.querySelector("svg")!).rotate,
          previousIcon: getComputedStyle(prev.querySelector("svg")!).rotate,
        };
      });
      facts[outerAxis + "-" + label] = geometry;
      assert.equal(geometry.direction, d);
      assert.equal(geometry.flow, vertical ? "column" : "row");
      assert.deepEqual(geometry.gap, vertical ? ["0px", "16px"] : ["16px", "0px"]);
      assert.equal(geometry.nextTurn, vertical ? "90deg" : "none");
      const iconTurn = vertical || d === "ltr" ? "none" : "180deg";
      assert.equal(geometry.icon, iconTurn);
      assert.equal(geometry.previousIcon, label === "inner" ? "22deg" : iconTurn);
    }
    const innerPrevious = inner.locator(":scope > .starwind-carousel-previous"),
      outerPrevious = outer.locator(":scope > .starwind-carousel-previous");
    const innerNext = inner.locator(":scope > .starwind-carousel-next"),
      outerNext = outer.locator(":scope > .starwind-carousel-next");
    await innerNext.click();
    assert(!(await innerPrevious.isDisabled()));
    assert(await outerPrevious.isDisabled());
    await inner.press(
      outerAxis === "horizontal" ? "ArrowUp" : innerDir === "rtl" ? "ArrowRight" : "ArrowLeft",
    );
    assert(await innerPrevious.isDisabled());
    assert(await outerPrevious.isDisabled());
    await outerNext.click();
    assert(!(await outerPrevious.isDisabled()));
    assert(await innerPrevious.isDisabled());
    await outerPrevious.click();
    assert(await outerPrevious.isDisabled());
    const bubbled = await inner.evaluate((el) => {
      let seen = false;
      el.parentElement!.addEventListener(
        "keydown",
        () => {
          seen = true;
        },
        { once: true },
      );
      const key = new KeyboardEvent("keydown", { key: "q", bubbles: true, cancelable: true });
      el.dispatchEvent(key);
      return seen && !key.defaultPrevented;
    });
    assert(bubbled, "unhandled keys bubble from the nested carousel");
  }
}
async function probe(page: Page, id: string, dir: string, facts: Facts, nested = false) {
  const rtl = dir === "rtl",
    other = rtl ? "ltr" : "rtl";
  const part = (s: string) => page.locator(slot(s)).first();
  const approximately = (a: number, b: number, label: string, tolerance = 1) => {
    facts[label] = [a, b];
    assert(Math.abs(a - b) <= tolerance, label);
  };
  const eq = (actual: unknown, expected: unknown, label: string) => {
    facts[label] = actual;
    assert.deepEqual(actual, expected, label);
  };
  if (id === "switch") {
    const button = part("switch-button"),
      thumb = part("switch-toggle");
    const measure = async (d: string, checked: boolean, label: string) => {
      const a = await box(button),
        b = await box(thumb);
      const end = (d === "rtl") === checked ? b.x - a.x : a.x + a.width - b.x - b.width;
      approximately(end, 3, label);
    };
    await measure(dir, true, "checked inset");
    await flip(page, other);
    await measure(other, true, "live checked inset");
    await button.click();
    await button.evaluate(async (n) => {
      await Promise.all(n.getAnimations({ subtree: true }).map((a) => a.finished));
    });
    await measure(other, false, "unchecked inset");
    eq(await button.getAttribute("aria-checked"), "false", "toggle state");
    for (const [selector, padding, checked] of [
      ["#small", 2.5, true],
      ["#large", 5, false],
    ] as const) {
      const control = page.locator(selector),
        a = await box(control),
        b = await box(control.locator("span"));
      approximately(
        (other === "rtl") === checked ? b.x - a.x : a.x + a.width - b.x - b.width,
        padding,
        selector + " thumb inset",
        1,
      );
    }
    eq(await page.locator("#large").isDisabled(), true, "native disabled");
  } else if (id === "progress") {
    const root = part("progress"),
      fill = root.locator("div");
    const measure = async (d: string, p: number, label: string) => {
      const a = await box(root),
        f = await box(fill);
      // The translated fill overflows the clipping root, so measure only its visible part.
      const left = Math.max(a.x, f.x),
        right = Math.min(a.x + a.width, f.x + f.width);
      approximately(d === "ltr" ? left - a.x : a.x + a.width - right, 0, label + " anchor");
      approximately((right - left) / a.width, p, label + " ratio", 0.01);
    };
    await measure(dir, 0.37, "initial");
    await flip(page, other);
    await measure(other, 0.37, "live");
    await root.evaluate((node) => node.setAttribute("data-value", "65"));
    await finish(fill);
    await measure(other, 0.65, "mutation");
  } else if (id === "slider") {
    const root = part("slider"),
      thumb = root.locator('[role="slider"]').first(),
      track = root.locator(slot("slider-track"));
    const a = await box(track);
    const center = async (d: string, v: number, n: string) => {
      const b = await box(thumb);
      approximately((b.x + b.width / 2 - a.x) / a.width, d === "rtl" ? 1 - v : v, n, 0.008);
    };
    await center(dir, 0.2, "initial thumb");
    await thumb.press(rtl ? "ArrowLeft" : "ArrowRight");
    eq(await thumb.getAttribute("aria-valuenow"), "21", "inline key");
    await track.click({ position: { x: a.width * (rtl ? 0.7 : 0.3), y: 2 } });
    await center(dir, 0.3, "pointer value");
    await flip(page, other);
    await center(other, 0.3, "live thumb");
    const b = await box(thumb);
    await thumb.evaluate((node) =>
      node.addEventListener(
        "pointerdown",
        (event) => node.setAttribute("data-pointer", String((event as PointerEvent).pointerId)),
        { once: true },
      ),
    );
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down();
    await root.evaluate((n) =>
      n.addEventListener("slider-commit", () => n.setAttribute("data-committed", "true")),
    );
    await root.evaluate((node, d) => {
      const pointerId = Number(node.querySelector("[data-pointer]")!.getAttribute("data-pointer"));
      node.dispatchEvent(
        new PointerEvent("pointerup", { pointerId: pointerId + 1, bubbles: true }),
      );
      if (!node.hasAttribute("data-dragging")) throw new Error("Unrelated pointer ended the drag");
      // Dispatch both operations before an observer can deliver the changed direction.
      document.querySelector("#owner")!.setAttribute("dir", d);
      node.dispatchEvent(new PointerEvent("pointerup", { pointerId, bubbles: true }));
    }, dir);
    await page.mouse.up();
    eq(await root.getAttribute("data-committed"), null, "same-task flip cancels commit");
    eq(
      await root
        .locator("input")
        .evaluateAll((inputs) => inputs.map((n) => (n as HTMLInputElement).value)),
      ["30", "70"],
      "stable form order",
    );
    const v = page.getByRole("slider", { name: "Vertical" });
    for (const [key, expected] of [
      ["ArrowUp", 26],
      ["ArrowLeft", 27],
      ["ArrowRight", 26],
      ["ArrowDown", 25],
      ["Shift+ArrowRight", 35],
      ["Shift+ArrowLeft", 25],
      ["Shift+ArrowUp", 35],
      ["Shift+ArrowDown", 25],
      ["Home", 0],
      ["End", 100],
    ] as const) {
      await v.press(key);
      eq(await v.getAttribute("aria-valuenow"), String(expected), "vertical " + key);
    }
  } else if (id === "tabs") {
    const buttons = page.getByRole("tab");
    await buttons.first().press(rtl ? "ArrowLeft" : "ArrowRight");
    eq(await buttons.nth(2).getAttribute("aria-selected"), "true", "skip disabled");
    await flip(page, other);
    await buttons.nth(2).press(rtl ? "ArrowRight" : "ArrowLeft");
    eq(await buttons.nth(3).getAttribute("aria-selected"), "true", "live forward");
  } else if (id === "input-otp") {
    const root = part("input-otp"),
      slots = root.locator(slot("input-otp-slot"));
    await slots.first().click();
    await page.keyboard.press(rtl ? "ArrowRight" : "ArrowLeft");
    eq(await slots.nth(2).getAttribute("data-active"), "true", "inline caret");
    await flip(page, other);
    await page.keyboard.press(rtl ? "ArrowLeft" : "ArrowRight");
    eq(await slots.nth(1).getAttribute("data-active"), "true", "live caret");
    eq(await root.locator("input").first().inputValue(), "2942", "stored order");
  } else if (id === "radio-group") {
    const radios = page.getByRole("radio");
    await radios.nth(1).click({ force: true });
    eq(await radios.nth(1).isChecked(), true, "native selection");
    await radios.nth(1).focus();
    await radios.nth(1).press(rtl ? "ArrowLeft" : "ArrowRight");
    eq(await radios.nth(2).isChecked(), true, "native forward");
    eq(await radios.nth(2).inputValue(), "c", "native value");
  } else if (id === "carousel") {
    const root = part("carousel"),
      next = part("carousel-next"),
      prev = part("carousel-previous");
    await root.waitFor();
    await page.waitForFunction(
      () =>
        document.querySelector("[data-slot=carousel]")?.getAttribute("data-initialized") === "true",
    );
    const a = await box(prev),
      b = await box(next);
    eq(a.x > b.x, rtl, "control edges");
    await root.dispatchEvent("keydown", { key: rtl ? "ArrowLeft" : "ArrowRight", bubbles: true });
    eq(await prev.isDisabled(), false, "inline forward");
    await flip(page, other);
    await root.dispatchEvent("keydown", { key: rtl ? "ArrowLeft" : "ArrowRight", bubbles: true });
    eq(await prev.isDisabled(), true, "live backward");
    await flip(page, dir);
    await checkNestedCarousels(page, dir, facts);
  } else if (id === "scroll-area") {
    const viewport = part("scroll-area-viewport"),
      bar = part("scroll-area-scrollbar"),
      thumb = part("scroll-area-thumb");
    await bar.waitFor({ state: "visible" });
    const a = await box(bar);
    await bar.click({ position: { x: rtl ? 2 : a.width - 2, y: 3 } });
    await page.waitForFunction(
      () => Math.abs(document.querySelector("[data-slot=scroll-area-viewport]")!.scrollLeft) > 0,
    );
    await page.evaluate(
      () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
    );
    const b = await box(thumb);
    const metrics = await bar.evaluate((el) => {
      const t = el.querySelector("div")!,
        vp = el.parentElement!.querySelector('[data-slot="scroll-area-viewport"]')!,
        c = getComputedStyle(el),
        s = getComputedStyle(t);
      return {
        width: el.clientWidth,
        padding: Number.parseFloat(c.paddingInlineStart) + Number.parseFloat(c.paddingInlineEnd),
        margins: Number.parseFloat(s.marginInlineStart) + Number.parseFloat(s.marginInlineEnd),
        ratio: vp.clientWidth / vp.scrollWidth,
      };
    });
    approximately(
      b.width,
      (metrics.width - metrics.padding - metrics.margins) * metrics.ratio,
      "unequal margins thumb width",
      0.25,
    );
    facts.track = a;
    facts.thumb = b;
    eq(b.x < a.x + a.width / 2, rtl, "logical end thumb");
    eq(await viewport.evaluate((n) => n.scrollLeft < 0), rtl, "physical scroll sign");
    await viewport.evaluate((el, d) => {
      el.setAttribute("dir", d);
      el.scrollLeft = 0;
    }, other);
    await page.evaluate(
      () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
    );
    const c = await box(thumb);
    eq(c.x < a.x + a.width / 2, other === "ltr", "local viewport owns origin");
    await page.mouse.move(c.x + c.width / 2, c.y + c.height / 2);
    await page.mouse.down();
    await page.mouse.move(other === "rtl" ? a.x + 5 : a.x + a.width - 5, c.y + c.height / 2);
    await page.mouse.up();
    eq(
      await viewport.evaluate((n) => Math.abs(n.scrollLeft) > 0),
      true,
      "thumb drag after viewport override",
    );
  } else if (id === "select") {
    const trigger = part("select-trigger"),
      content = part("select-content");
    await trigger.press("Enter");
    await content.waitFor({ state: "visible" });
    await finish(content);
    eq(await direction(content), dir, "open direction");
    const a = await box(trigger),
      b = await box(content);
    approximately(rtl ? a.x + a.width - b.x - b.width : a.x - b.x, 0, "start placement");
    await flip(page, other);
    await page.locator(slot("select-item")).nth(1).click();
    eq(await page.locator("select").inputValue(), "b", "native selected field");
  } else if (id === "dialog" || id === "alert-dialog" || id === "sheet") {
    const trigger = part(id === "sheet" ? "dialog-trigger" : id + "-trigger"),
      popup = page.locator("dialog").first();
    await trigger.focus();
    await trigger.press("Enter");
    await popup.waitFor({ state: "visible" });
    await finish(popup);
    eq(await direction(popup), dir, "native top layer ownership");
    const rect = await box(popup);
    if (id === "sheet")
      approximately(rect.x + rect.width, page.viewportSize()!.width, "physical right");
    else approximately(rect.x + rect.width / 2, page.viewportSize()!.width / 2, "physical center");
    await flip(page, other);
    eq(await direction(popup), other, "open live direction");
    if (id === "sheet")
      eq(
        await part("sheet-close").evaluate((n) => getComputedStyle(n).insetInlineEnd),
        "16px",
        "live close inset",
      );
    if (id === "alert-dialog") await part("alert-dialog-cancel").click();
    else await page.keyboard.press("Escape");
    await waitHidden(popup);
    eq(
      await trigger.evaluate(
        (n) => n === document.activeElement || n.contains(document.activeElement),
      ),
      true,
      "returned focus",
    );
  } else if (id === "sidebar") {
    const shell = part("sidebar-container");
    const a = await box(shell);
    approximately(a.x + a.width, page.viewportSize()!.width, "fixed right");
    const gap = part("sidebar-gap"),
      inset = part("sidebar-inset");
    const gapBox = await box(gap),
      insetBox = await box(inset);
    eq(gapBox.x >= insetBox.x + insetBox.width - 1, true, "reserved gap on physical right");
    const badge = part("sidebar-menu-badge");
    eq(await badge.evaluate((n) => getComputedStyle(n).insetInlineEnd), "4px", "badge inline end");
    await flip(page, other);
    eq(
      await part("sidebar-menu-button").evaluate((el) => getComputedStyle(el).paddingInlineEnd),
      "32px",
      "live action end padding",
    );
    const b = await box(shell);
    approximately(b.x + b.width, page.viewportSize()!.width, "live fixed right");
    const tipTrigger = part("sidebar-menu-button"),
      tip = page.locator(".starwind-sidebar-tooltip-content").filter({ visible: true });
    // Leave room on every physical side so collision fallback cannot mask the preferred side.
    await shell.evaluate((el) => {
      el.style.setProperty("inset", "150px auto auto 500px");
    });
    await part("sidebar-trigger").click();
    await finish(shell);
    await tipTrigger.focus();
    await tip.waitFor({ state: "visible" });
    await finish(tip);
    const tipBox = await box(tip),
      triggerBox = await box(tipTrigger);
    eq(await tip.getAttribute("data-side"), "left", "right sidebar tooltip faces content");
    eq(tipBox.x + tipBox.width <= triggerBox.x + 1, true, "tooltip is physically left");
    await tipTrigger.blur();
    await waitHidden(tip);
    await page.setViewportSize({ width: 390, height: 700 });
    await part("sidebar-trigger").click();
    const modal = page.locator("dialog[open]");
    await modal.waitFor({ state: "visible" });
    await finish(modal);
    await modal.locator(slot("sidebar-menu-button")).first().focus();
    await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => r())));
    eq(await tip.count(), 0, "mobile owner suppresses collapsed desktop tooltip");
    const mobile = await box(modal);
    approximately(mobile.x + mobile.width, 390, "physical mobile sheet right");
    await page.keyboard.press("Escape");
    await waitHidden(modal);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.locator("#nested-sidebar").evaluate((el) => el.removeAttribute("hidden"));
    const nested = page.locator("#nested-sidebar"),
      local = nested.locator("#local-sidebar").first();
    await local
      .locator(slot("sidebar-container"))
      .first()
      .evaluate((el) => el.style.setProperty("inset", "200px auto auto 500px"));
    await local.evaluate((el) => el.dispatchEvent(new CustomEvent("sidebar:close")));
    await nested.getByRole("button", { name: "Static button" }).first().focus();
    await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => r())));
    eq(await tip.count(), 0, "nearest noncollapsible owner suppresses tooltip");
    await local.getByRole("button", { name: "Child button" }).first().focus();
    await tip.waitFor({ state: "visible" });
    await finish(tip);
    eq(await tip.getAttribute("data-side"), "right", "nested left sidebar opens right");
  } else if (id === "toast") {
    await page.locator("#notify").click();
    const toast = part("toast");
    await toast.waitFor({ state: "visible" });
    eq(await direction(toast), dir, "shown notification");
    const view = await box(part("toast-viewport"));
    approximately(view.x + view.width, page.viewportSize()!.width - 16, "physical right");
    await flip(page, other);
    eq(await direction(toast), other, "live toast");
    eq(
      await toast
        .locator("button")
        .last()
        .evaluate((n) => getComputedStyle(n).insetInlineEnd),
      "8px",
      "live dismiss inset",
    );
    await toast.locator("button").last().click();
    await waitHidden(toast);
  } else if (id === "color-picker") {
    const node = (p: string) => page.locator(`[data-part="${p}"]`).first();
    await node("color-input").click();
    const popup = node("custom-picker");
    await popup.waitFor({ state: "visible" });
    await finish(popup);
    eq(await direction(popup), dir, "open popup");
    await checkPopupOverride(node("color-input"), popup, dir, facts);
    for (const [surface, handle] of [
      ["sat-rect", "cursor"],
      ["hue-slider", "hue-handle"],
      ["opacity-slider", "opacity-handle"],
    ] as const) {
      const s = node(surface),
        h = node(handle);
      const a = await box(s);
      await s.click({ position: { x: a.width * 0.25, y: a.height * 0.3 } });
      const fraction = await h.evaluate((n) =>
        Number.parseFloat((n as HTMLElement).style.insetInlineStart),
      );
      approximately(fraction / a.width, rtl ? 0.75 : 0.25, surface + " pointer", 0.03);
      await s.evaluate((n, d) => n.setAttribute("dir", d), other);
      // A local RTL flip inside a nested LTR scope is a third level of mixed direction. The
      // `rtl` and `ltr` variants support one level, so local paint is checked at that level only.
      if (!(nested && other === "rtl")) {
        const b = await box(h);
        approximately((b.x + b.width / 2 - a.x) / a.width, 0.75, surface + " local paint", 0.03);
      }
    }
    const area = node("sat-rect"),
      a = await box(area),
      saved = await node("color-input").inputValue();
    await area.evaluate((n) =>
      n.addEventListener(
        "pointerdown",
        (e) => n.setAttribute("data-pointer", String((e as PointerEvent).pointerId)),
        { once: true },
      ),
    );
    await page.mouse.move(a.x + a.width * 0.85, a.y + a.height * 0.82);
    await page.mouse.down();
    await area.evaluate((el, d) => {
      const pointerId = Number(el.getAttribute("data-pointer"));
      el.setAttribute("dir", d);
      window.dispatchEvent(new PointerEvent("pointermove", { pointerId, clientX: 0, clientY: 0 }));
      window.dispatchEvent(new PointerEvent("pointerup", { pointerId }));
    }, dir);
    await page.mouse.up();
    eq(await node("color-input").inputValue(), saved, "same-task surface flip rolls color back");
    await area.evaluate((el) => el.removeAttribute("dir"));
    await page.mouse.down();
    await area.evaluate((el, d) => {
      document.querySelector("#owner")!.setAttribute("dir", d);
      window.dispatchEvent(
        new PointerEvent("pointerup", { pointerId: Number(el.getAttribute("data-pointer")) }),
      );
    }, other);
    await page.mouse.up();
    eq(
      await node("color-input").inputValue(),
      saved,
      "same-task source owner flip rolls color back",
    );
    await flip(page, other);
    eq(await direction(popup), other, "live popup");
  } else {
    await probeFloating(page, id, dir, facts);
  }
}
async function probeFloating(page: Page, id: string, dir: string, facts: Facts) {
  const other = dir === "ltr" ? "rtl" : "ltr",
    rtl = dir === "rtl";
  const trigger =
    id === "tooltip"
      ? page.getByRole("button", { name: "Help", exact: true })
      : page.locator(slot(id + "-trigger")).first();
  const panels = page.locator(slot(id === "context-menu" ? "dropdown-content" : id + "-content"));
  const content = (id === "tooltip" ? panels.filter({ hasText: "Details" }) : panels).first();
  const triggerBounds = await box(trigger);
  const point = { x: triggerBounds.x + 8, y: triggerBounds.y + 8 };
  const open = async () => {
    if (id === "context-menu") await trigger.click({ button: "right", position: { x: 8, y: 8 } });
    else if (id === "tooltip" || id === "hover-card") {
      await trigger.hover();
      await trigger.focus();
    } else await trigger.click();
    await content.waitFor({ state: "visible", timeout: 2500 });
  };
  await open();
  await finish(content);
  const actual = await direction(content);
  facts.opened = actual;
  assert.equal(actual, dir);
  const attached = await content.evaluate((el) => el.parentElement === document.body);
  assert(attached, "legacy popup moved to body");
  const a = await box(trigger),
    b = await box(content);
  if (id === "context-menu") {
    facts.anchor = { x: point.x, y: point.y, bounds: b };
    assert(
      Math.min(Math.abs(b.x - point.x), Math.abs(b.x + b.width - point.x)) < 12,
      "physical pointer anchor",
    );
  } else {
    const distance = rtl ? b.x + b.width - a.x - a.width : b.x - a.x;
    facts.initialInlineOffset = distance;
    assert(Math.abs(distance) < 2, "open inline alignment");
    await checkPopupOverride(trigger, content, dir, facts);
  }
  await flip(page, other);
  assert.equal(await direction(content), other, "open popup follows owner");
  facts.liveBounds = await box(content);
  if (id === "dropdown") {
    const sub = page.locator("[data-sub-trigger]");
    await sub.focus();
    await sub.press(rtl ? "ArrowRight" : "ArrowLeft");
    const branch = page.locator("[data-sub-content]");
    await branch.waitFor({ state: "visible" });
    await finish(branch);
    facts.childSide = await branch.getAttribute("data-side");
    assert.equal(facts.childSide, rtl ? "right" : "left");
    assert.equal(await direction(branch), other);
    await flip(page, dir);
    assert.equal(await direction(branch), dir);
    await branch.locator('[role="menuitem"]').press(rtl ? "ArrowRight" : "ArrowLeft");
    await waitHidden(branch);
  }
  await content.evaluate((n) => n.setAttribute("dir", "auto"));
  await flip(page, dir);
  assert.equal(await content.getAttribute("dir"), "auto", "authored popup dir survives owner flip");
  await content.evaluate((n) => n.removeAttribute("dir"));
  await flip(page, other);
  if (id === "tooltip" || id === "hover-card") {
    await page.mouse.move(1, 1);
    await trigger.evaluate((n) => (n as HTMLElement).blur());
  } else await page.keyboard.press("Escape");
  await content.evaluate((node, next) => {
    if (node.parentElement === document.body)
      document.querySelector("#owner")!.setAttribute("dir", next);
  }, dir);
  await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => r())));
  if (await content.evaluate((n) => n.parentElement === document.body))
    assert.equal(await direction(content), dir, "retained close follows owner");
  await waitHidden(content, 3500);
  assert.equal(await content.getAttribute("dir"), null, "projection released after retained close");
  await open();
  assert.equal(
    await direction(content),
    await direction(page.locator("#owner")),
    "reopened owner direction",
  );
  if (id === "tooltip") {
    await page.mouse.move(0, 0);
    await trigger.blur();
    await waitHidden(content);
    const button = page.getByRole("button", { name: "Physical help" });
    await button.focus();
    const explicit = page.locator(slot("tooltip-content")).filter({ hasText: "Physical side" });
    await explicit.waitFor({ state: "visible" });
    await finish(explicit);
    facts.explicitSide = await explicit.getAttribute("data-side");
    assert.equal(facts.explicitSide, "right", "standalone explicit side remains physical");
  }
}
const unchanged = new Set(["radio-group"]);
export const expectations: DirectionExpectation[] = rows.map((row) => ({
  id: "legacy-controls-" + row.id,
  layer: "legacy",
  async run(page, _target, ctx) {
    ctx.observe("source", {
      revision: row.sourceRevision,
      digest: row.sourceDigest,
      paths: row.sourcePaths,
      decision: unchanged.has(row.id) ? "verified unchanged" : "corrected",
      physicalException: exceptions[row.id] ?? null,
    });
    for (const scope of scopes) {
      const facts: Facts = {};
      await ctx.check(scope, async () => {
        const url = new URL(page.url());
        url.searchParams.set("scope", scope);
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.goto(url.href, { waitUntil: "load" });
        await page.evaluate("window.__name=(fn)=>fn");
        page.setDefaultTimeout(2500);
        try {
          await probe(
            page,
            row.id,
            scope.endsWith("rtl") ? "rtl" : "ltr",
            facts,
            scope.startsWith("nested"),
          );
        } finally {
          ctx.observe(scope, facts);
        }
      });
    }
  },
}));
