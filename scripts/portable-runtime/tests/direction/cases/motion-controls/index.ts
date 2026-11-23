import assert from "node:assert/strict";
import {
  type DirectionCase,
  type DirectionExpectation,
  TARGETS,
  type Target,
} from "../../inventory.js";
import { waitHidden } from "../../waits.js";

const parts = {
  carousel: "Carousel CarouselContent CarouselItem CarouselPrevious CarouselNext",
  tabs: "Tabs TabsList TabsTrigger TabsContent",
  "navigation-menu":
    "NavigationMenu NavigationMenuList NavigationMenuItem NavigationMenuTrigger NavigationMenuContent NavigationMenuLink",
  "scroll-area": "ScrollArea ScrollBar ScrollAreaThumb",
};
const checks = [
  "carousel-reading-controls",
  "navigation-logical-motion",
  "tabs-physical-indicator",
  "scroll-area-rail-and-corner",
  "nested-carousel-axes-and-icons",
];
function source(target: Target) {
  const imports =
    Object.entries(parts)
      .map(
        ([slug, names]) =>
          `import { ${names.split(" ").join(", ")} } from "@direction/styled-${target}/${slug}";`,
      )
      .join("\n") + '\nimport "@direction/sheet";';
  const rail =
    '<ScrollBar orientation="vertical"><ScrollAreaThumb /></ScrollBar><ScrollBar orientation="horizontal"><ScrollAreaThumb /></ScrollBar>';
  const scroll =
    target === "react"
      ? `<ScrollArea class="w-48 h-20" scrollbar={<>${rail}</>}><div class="w-96 h-48">Scroll this text</div></ScrollArea>`
      : target === "svelte"
        ? `{#snippet rails()}${rail}{/snippet}<ScrollArea class="w-48 h-20" scrollbar={rails}><div class="w-96 h-48">Scroll this text</div></ScrollArea>`
        : `<ScrollArea class="w-48 h-20"><div class="w-96 h-48">Scroll this text</div>${target === "vue" ? `<template #scrollbar>${rail}</template>` : `<Fragment slot="scrollbar">${rail}</Fragment>`}</ScrollArea>`;
  const carousel = (
    vertical = false,
    custom = false,
  ) => `<Carousel orientation="${vertical ? "vertical" : "horizontal"}" data-carousel-case="${vertical ? "vertical" : custom ? "custom" : "horizontal"}" class="w-48 my-16">
    <CarouselContent class="${vertical ? "h-20" : ""}"><CarouselItem><p class="h-12">الأولى First</p></CarouselItem><CarouselItem><p class="h-12">الثانية Second</p></CarouselItem></CarouselContent>
    <CarouselPrevious />${custom ? '<CarouselNext aria-label="Custom next"><svg data-caller="true" viewBox="0 0 12 12"><path d="M1 1l9 4-9 4z" /></svg></CarouselNext>' : "<CarouselNext />"}</Carousel>`;
  const nested = (["horizontal", "vertical"] as const)
    .flatMap((child) => {
      const parent = child === "vertical" ? "horizontal" : "vertical";
      return (["ltr", "rtl"] as const).flatMap((dir) =>
        (["default", "caller"] as const).map((icons) => {
          const arrows =
            icons === "default"
              ? "<CarouselPrevious /><CarouselNext />"
              : `<CarouselPrevious aria-label="Previous"><svg data-caller="previous" class="rotate-45" viewBox="0 0 12 12"><path d="M10 1L2 6l8 5z" /></svg></CarouselPrevious>
           <CarouselNext aria-label="Next"><svg data-caller="next" viewBox="0 0 12 12"><path d="M2 1l8 5-8 5z" /></svg></CarouselNext>`;
          return `<div dir="${dir}"><Carousel orientation="${parent}" class="w-72"><CarouselContent><CarouselItem>
          <Carousel orientation="${child}" data-nested-case="${child}-${dir}-${icons}" class="relative w-48 my-16">
            <CarouselContent class="h-20"><CarouselItem>First</CarouselItem><CarouselItem>Second</CarouselItem></CarouselContent>
            <div>${arrows}</div>
          </Carousel></CarouselItem><CarouselItem>Next outer slide</CarouselItem></CarouselContent>
          <CarouselPrevious /><CarouselNext /></Carousel></div>`;
        }),
      );
    })
    .join("");
  // The scope is an LTR area in an RTL page. `flip` sets its dir, so an RTL flip stays one level
  // deep. Nested carousels sit directly in the RTL page, in an LTR or RTL wrapper.
  const body =
    `<main dir="rtl" class="mx-auto w-96"><div><section dir="ltr" data-direction-scope="motion">
    <NavigationMenu align="start"><NavigationMenuList>${["a", "b"].map((v, i) => `<NavigationMenuItem value="${v}"><NavigationMenuTrigger><span>${i ? "الموارد Resources" : "المنتجات Products"}</span></NavigationMenuTrigger><NavigationMenuContent><NavigationMenuLink class="${i ? "w-52" : "w-40"}" href="#${v}">${v}</NavigationMenuLink></NavigationMenuContent></NavigationMenuItem>`).join("")}</NavigationMenuList></NavigationMenu>
    <Tabs defaultValue="a"><TabsList activateOnFocus class="relative"><TabsTrigger value="a">First</TabsTrigger><TabsTrigger value="b">Second</TabsTrigger><span data-sw-tabs-indicator="" class="absolute bottom-0 h-px bg-current"></span></TabsList><TabsContent value="a">A</TabsContent><TabsContent value="b">B</TabsContent></Tabs>
    ${scroll}${carousel()}${carousel(true)}${carousel(false, true)}
    </section></div>${nested}</main>`.replaceAll(
      "class=",
      target === "react" ? "className=" : "class=",
    );
  if (target === "astro")
    return `---\n${imports}\n---\n<html><head><title>Motion controls</title></head><body>${body}</body></html>`;
  if (target === "react")
    return `import {createRoot} from "react-dom/client";\n${imports}\ncreateRoot(document.getElementById("app")!).render(${body});`;
  if (target === "vue")
    return `<script setup lang="ts">\n${imports}\n</script><template>${body}</template>`;
  return `<script lang="ts">\n${imports}\n</script>${body}`;
}
export const cases: DirectionCase[] = [
  {
    id: "motion-controls-styled",
    row: "carousel",
    acceptance: ["SPEC-AC-01", "SPEC-AC-02", "SPEC-AC-12", "SPEC-AC-13"],
    physicalExceptions: [
      "Vertical Carousel controls retain physical left/half-translation centering and 90-degree button rotation.",
      "Navigation Menu positioner uses actual trigger rectangle displacement; its top bridge spans both physical sides.",
      "Tabs indicator offsets and motion markers refer to physical edges. Scroll Area uses native scrollLeft and physical thumb offsets.",
    ],
    fixtures: Object.fromEntries(
      TARGETS.map((t) => [
        t,
        { source: source(t), exports: parts.carousel.split(" "), assertions: checks },
      ]),
    ),
  },
];

type Page = Parameters<DirectionExpectation["run"]>[0];
type Direction = "ltr" | "rtl";
async function flip(page: Page, dir: Direction) {
  await page.locator("[data-direction-scope]").evaluate(async (el, dir) => {
    el.setAttribute("dir", dir);
    document.dispatchEvent(new Event("starwind:direction-change"));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }, dir);
}
// Hydration and direction changes can start rotate transitions on carousel controls. Read their
// end state.
async function settleCarousels(page: Page) {
  await page.locator("[data-carousel-case], [data-nested-case]").evaluateAll(async (roots) => {
    await new Promise(requestAnimationFrame);
    await Promise.all(
      roots
        .flatMap((root) => root.getAnimations({ subtree: true }))
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => {})),
    );
  });
}
async function carouselGeometry(page: Page) {
  return page.locator("[data-carousel-case]").evaluateAll((roots) =>
    roots.map((root) => {
      const slot = (id: string) => root.querySelector<HTMLElement>(`[data-slot="carousel-${id}"]`)!;
      const rootRect = root.getBoundingClientRect(),
        prev = slot("previous"),
        next = slot("next");
      const previous = prev.getBoundingClientRect(),
        following = next.getBoundingClientRect(),
        item = slot("item");
      const center = (box: DOMRect, axis: "x" | "y") =>
        box[axis] + (axis === "x" ? box.width : box.height) / 2;
      return {
        id: root.getAttribute("data-carousel-case"),
        dir: getComputedStyle(root).direction,
        axis: root.getAttribute("data-axis"),
        x: [
          center(previous, "x") - center(rootRect, "x"),
          center(following, "x") - center(rootRect, "x"),
        ],
        y: [
          center(previous, "y") - center(rootRect, "y"),
          center(following, "y") - center(rootRect, "y"),
        ],
        icons: [prev, next].map((el) => getComputedStyle(el.querySelector("svg")!).rotate),
        buttons: [prev, next].map((el) => getComputedStyle(el).rotate),
        gap: [
          getComputedStyle(slot("container")).marginInlineStart,
          getComputedStyle(item).paddingInlineStart,
        ],
        focused: root.contains(document.activeElement),
      };
    }),
  );
}
async function testNestedCarousels(page: Page, ctx: Parameters<DirectionExpectation["run"]>[2]) {
  for (const child of ["horizontal", "vertical"] as const) {
    for (const dir of ["ltr", "rtl"] as const) {
      for (const icons of ["default", "caller"] as const) {
        const id = `${child}-${dir}-${icons}`;
        const geometry = await page.locator(`[data-nested-case="${id}"]`).evaluate((root) => {
          const part = (name: string) =>
            root.querySelector<HTMLElement>(`[data-slot="carousel-${name}"]`)!;
          const container = getComputedStyle(part("container")),
            item = getComputedStyle(part("item"));
          const box = root.getBoundingClientRect();
          const controls = [part("previous"), part("next")].map((node) => {
            const button = node.getBoundingClientRect();
            const svg = node.querySelector("svg")!;
            return {
              centerX: button.x + button.width / 2 - box.x - box.width / 2,
              centerY: button.y + button.height / 2 - box.y - box.height / 2,
              rotation: getComputedStyle(node).rotate,
              icon: getComputedStyle(svg).rotate,
              caller: svg.getAttribute("data-caller"),
            };
          });
          return {
            dir: getComputedStyle(root).direction,
            axis: root.getAttribute("data-axis"),
            outerAxis: root.parentElement!.closest("[data-sw-carousel]")!.getAttribute("data-axis"),
            controls,
            width: box.width,
            height: box.height,
            flow: container.flexDirection,
            margin: [container.marginInlineStart, container.marginTop],
            padding: [item.paddingInlineStart, item.paddingTop],
          };
        });
        ctx.observe("nested-" + id, geometry);
        const vertical = child === "vertical";
        assert.equal(geometry.dir, dir);
        assert.equal(geometry.axis, vertical ? "y" : "x");
        assert.equal(geometry.outerAxis, vertical ? "x" : "y");
        assert.equal(geometry.flow, vertical ? "column" : "row");
        assert.deepEqual(geometry.margin, vertical ? ["0px", "-16px"] : ["-16px", "0px"]);
        assert.deepEqual(geometry.padding, vertical ? ["0px", "16px"] : ["16px", "0px"]);
        assert.deepEqual(
          geometry.controls.map((c) => c.caller),
          icons === "caller" ? ["previous", "next"] : [null, null],
        );
        const defaultTurn = !vertical && dir === "rtl" ? "180deg" : "none";
        assert.deepEqual(
          geometry.controls.map((c) => c.icon),
          icons === "caller" ? ["45deg", "none"] : [defaultTurn, defaultTurn],
        );
        for (const [index, control] of geometry.controls.entries()) {
          const sequence = index === 0 ? -1 : 1;
          const expectedX = vertical
            ? 0
            : sequence * (dir === "rtl" ? -1 : 1) * (geometry.width / 2 + 32);
          const expectedY = vertical ? sequence * (geometry.height / 2 + 32) : 0;
          assert(
            Math.abs(control.centerX - expectedX) < 1 && Math.abs(control.centerY - expectedY) < 1,
            id,
          );
          assert.equal(control.rotation, vertical ? "90deg" : "none");
        }
      }
    }
  }
}
async function testCarousel(page: Page, ctx: Parameters<DirectionExpectation["run"]>[2]) {
  const horizontal = page.locator('[data-carousel-case="horizontal"]');
  const next = horizontal.locator("[data-sw-carousel-next]"),
    prev = horizontal.locator("[data-sw-carousel-previous]");
  for (const motion of ["no-preference", "reduce"] as const) {
    await page.emulateMedia({ reducedMotion: motion });
    for (const [change, dir] of (["ltr", "rtl", "ltr", "rtl"] as const).entries()) {
      await next.focus();
      await flip(page, dir);
      await settleCarousels(page);
      const values = await carouselGeometry(page);
      ctx.observe(`carousel-${motion}-${dir}-${change}`, values);
      for (const result of values) {
        const vertical = result.axis === "y",
          rtl = dir === "rtl";
        assert.equal(result.dir, dir);
        if (vertical) {
          assert(result.y[0]! < 0 && result.y[1]! > 0);
          assert(result.x.every((x) => Math.abs(x) < 1));
          assert.deepEqual(result.buttons, ["90deg", "90deg"]);
        } else {
          assert((rtl ? -1 : 1) * result.x[0]! < -96 && (rtl ? -1 : 1) * result.x[1]! > 96);
          assert(result.y.every((y) => Math.abs(y) < 1));
          assert.deepEqual(result.gap, ["-16px", "16px"]);
        }
        assert.deepEqual(result.icons, [
          !vertical && rtl ? "180deg" : "none",
          !vertical && rtl && result.id !== "custom" ? "180deg" : "none",
        ]);
      }
      assert(values[0]!.focused);
      await next.press(dir === "rtl" ? "ArrowLeft" : "ArrowRight");
      await page.waitForFunction(
        () =>
          document.querySelector<HTMLButtonElement>(
            '[data-carousel-case="horizontal"] [data-sw-carousel-next]',
          )!.disabled,
      );
      await prev.click();
      await page.waitForFunction(
        () =>
          document.querySelector<HTMLButtonElement>(
            '[data-carousel-case="horizontal"] [data-sw-carousel-previous]',
          )!.disabled,
      );
    }
  }
}
async function testMenu(page: Page, ctx: Parameters<DirectionExpectation["run"]>[2]) {
  const trigger = page.locator("[data-sw-nav-menu-trigger]");
  const positioner = page.locator('[data-slot="navigation-menu-positioner"]');
  for (const motion of ["no-preference", "reduce"] as const) {
    await page.emulateMedia({ reducedMotion: motion });
    for (const [change, dir] of (["ltr", "rtl", "ltr"] as const).entries()) {
      await flip(page, dir);
      for (const [step, index, marker] of [
        [0, 0, "initial"],
        [1, 1, "next"],
        [2, 0, "previous"],
      ] as const) {
        const control = trigger.nth(index);
        await control.focus();
        const previousX = step > 0 ? (await positioner.boundingBox())!.x : null;
        await control.press("Enter");
        await positioner.waitFor({ state: "visible" });
        await page.waitForFunction(
          (expected) =>
            document
              .querySelector("[data-slot=navigation-menu-positioner]")
              ?.getAttribute("data-activation-direction") === expected,
          marker,
        );
        const exposure = await positioner.evaluate(async (boundary) => {
          const panel = boundary.querySelector(
            "[data-slot=navigation-menu-content][data-state=open]",
          )!;
          const frames = [];
          for (let frame = 0; frame < 5; frame++) {
            const style = getComputedStyle(panel);
            frames.push({
              boundaryX: boundary.getBoundingClientRect().x,
              contentTransform: style.transform,
              contentTranslate: style.translate,
              opacity: Number(style.opacity),
            });
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
          }
          return { transition: getComputedStyle(panel).transitionProperty, frames };
        });
        assert.equal(exposure.transition, "opacity");
        assert(
          exposure.frames.every(
            (f) => f.contentTransform === "none" && f.contentTranslate === "none",
          ),
        );
        ctx.observe(`exposure-${motion}-${change}-${step}`, exposure);
        const start = await control.boundingBox();
        assert(start);
        await page.waitForFunction(
          ({ x, right, dir }) => {
            const rect = document
              .querySelector("[data-slot=navigation-menu-positioner]")!
              .getBoundingClientRect();
            return Math.abs(dir === "rtl" ? rect.right - right : rect.left - x) < 1.5;
          },
          { x: start.x, right: start.x + start.width, dir },
        );
        const sample = await positioner.evaluate((el) => ({
          x: el.getBoundingClientRect().x,
          width: el.getBoundingClientRect().width,
          direction: getComputedStyle(el).direction,
          marker: el.getAttribute("data-activation-direction"),
          transition: getComputedStyle(el).transitionProperty,
        }));
        if (previousX !== null) {
          const sign = (dir === "rtl" ? -1 : 1) * (marker === "previous" ? -1 : 1);
          assert((sample.x - previousX) * sign > 20, "Popup must move toward the active trigger");
        }
        const gap = await control
          .locator("[data-slot=navigation-menu-indicator]")
          .evaluate((el) => getComputedStyle(el).marginInlineStart);
        assert.equal(sample.direction, dir);
        assert.equal(gap, "6px");
        ctx.observe(`menu-${motion}-${change}-${dir}-${step}`, {
          triggerX: start.x,
          ...sample,
          gap,
          previousX,
        });
      }
      // Preserve the active panel and focus as the open portal updates direction.
      const retained = await positioner.evaluate(async (el) => {
        const active = document.activeElement;
        const scope = document.querySelector("[data-direction-scope]")!;
        scope.setAttribute("dir", scope.getAttribute("dir") === "rtl" ? "ltr" : "rtl");
        document.dispatchEvent(new Event("starwind:direction-change"));
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        return {
          focus: document.activeElement === active,
          portal: getComputedStyle(el).direction,
          owner: getComputedStyle(scope).direction,
          marker: el.getAttribute("data-activation-direction"),
        };
      });
      ctx.observe(`live-menu-${motion}-${change}`, retained);
      assert(retained.focus);
      assert.equal(retained.portal, retained.owner);
      assert.equal(retained.marker, "previous");
      await trigger.first().press("Escape");
      await waitHidden(positioner);
    }
  }
}
async function testTabs(page: Page, ctx: Parameters<DirectionExpectation["run"]>[2]) {
  const tabs = page.getByRole("tab"),
    indicator = page.locator("[data-sw-tabs-indicator]");
  await tabs.first().focus();
  for (const [change, dir] of (["ltr", "rtl", "ltr", "rtl"] as const).entries()) {
    await flip(page, dir);
    await tabs.first().press(dir === "rtl" ? "ArrowLeft" : "ArrowRight");
    assert.equal(await tabs.nth(1).getAttribute("aria-selected"), "true");
    const geometry = await indicator.evaluate((el) => {
      const list = el.closest('[role="tablist"]')!,
        tab = list.querySelector("[aria-selected=true]")!;
      const rect = tab.getBoundingClientRect(),
        bounds = list.getBoundingClientRect(),
        style = getComputedStyle(el);
      return {
        marker: el.getAttribute("data-activation-direction"),
        focused: document.activeElement === tab,
        left: Number.parseFloat(style.getPropertyValue("--active-tab-left")),
        right: Number.parseFloat(style.getPropertyValue("--active-tab-right")),
        actualLeft: rect.left - bounds.left,
        actualRight: bounds.right - rect.right,
      };
    });
    ctx.observe(`tabs-${change}-${dir}`, geometry);
    assert.equal(geometry.marker, dir === "rtl" ? "left" : "right");
    assert(geometry.focused);
    assert(
      Math.abs(geometry.left - geometry.actualLeft) < 1 &&
        Math.abs(geometry.right - geometry.actualRight) < 1,
    );
    await tabs.nth(1).press("Home");
  }
}
async function testScroll(page: Page, ctx: Parameters<DirectionExpectation["run"]>[2]) {
  const viewport = page.locator("[data-sw-scroll-area-viewport]");
  for (const [change, dir] of (["ltr", "rtl", "ltr", "rtl"] as const).entries()) {
    await flip(page, dir);
    await viewport.hover();
    const result = await page.locator("[data-sw-scroll-area]").evaluate((el) => {
      const rail = el.querySelector("[data-sw-scroll-area-scrollbar][data-orientation=vertical]")!,
        corner = el.querySelector("[data-slot=scroll-area-corner]")!,
        horizontal = el.querySelector(
          "[data-sw-scroll-area-scrollbar][data-orientation=horizontal]",
        )!,
        thumb = horizontal.querySelector("[data-sw-scroll-area-thumb]")!;
      const outer = el.getBoundingClientRect(),
        r = rail.getBoundingClientRect(),
        c = corner.getBoundingClientRect(),
        track = horizontal.getBoundingClientRect(),
        h = thumb.getBoundingClientRect();
      return {
        rail: [r.left - outer.left, outer.right - r.right],
        corner: [c.left - outer.left, outer.right - c.right],
        gutter: [
          getComputedStyle(rail).borderInlineStartWidth,
          getComputedStyle(rail).borderInlineEndWidth,
        ],
        thumb: [h.left - track.left, track.right - h.right],
        widths: [r.width, c.width, h.width],
      };
    });
    ctx.observe(`scroll-${change}-${dir}`, result);
    const end = dir === "rtl" ? 0 : 1;
    assert(result.widths.every((w) => w > 0));
    assert.deepEqual(result.gutter, ["1px", "0px"]);
    assert.equal(result.rail[end], 0);
    assert.equal(result.corner[end], 0);
    assert(Math.abs(result.thumb[1 - end]!) < 3);
  }
}
export const expectations: DirectionExpectation[] = [
  {
    id: "motion-controls-styled",
    layer: "styled",
    async run(page, _target, ctx) {
      await page.evaluate("window.__name = (target) => target");
      await settleCarousels(page);
      await ctx.check("nested-carousel-axes-and-icons", () => testNestedCarousels(page, ctx));
      await ctx.check(checks[0]!, () => testCarousel(page, ctx));
      await ctx.check(checks[1]!, () => testMenu(page, ctx));
      await ctx.check(checks[2]!, () => testTabs(page, ctx));
      await ctx.check(checks[3]!, () => testScroll(page, ctx));
    },
  },
];
