import assert from "node:assert/strict";
import type { DirectionCase, DirectionExpectation } from "../../inventory.js";
import { waitHidden } from "../../waits.js";

const assertions = [
  "owner-direction-before-visible-paint",
  "custom-target-and-live-owner-flip",
  "authored-surface-and-physical-side",
  "placement-teardown-and-replacement",
  "disabled-inline-and-owned-state-cleanup",
];

const firstVisibleProbe = `const firstVisibleObserver = new MutationObserver(() => {
  if ((window as any).__firstVisiblePortal) return;
  const content = document.querySelector<HTMLElement>("#portal-content");
  if (!content || content.hidden || content.getAttribute("data-state") !== "open") return;
  if (getComputedStyle(content).display === "none") return;
  const portal = content.closest<HTMLElement>("[data-sw-popover-portal]");
  if (!portal) return;
  (window as any).__firstVisiblePortal = {
    direction: getComputedStyle(content).direction,
    portalDirection: portal.getAttribute("dir"),
    target: portal.parentElement?.id ?? null,
  };
  firstVisibleObserver.disconnect();
});
firstVisibleObserver.observe(document.documentElement, { attributes: true, childList: true, subtree: true });`;

const popover = `<section id="portal-owner" data-direction-scope dir="rtl" style="position:relative;margin:120px;width:460px">
  <Popover defaultOpen={false}>
    <PopoverTrigger id="portal-trigger" style="position:relative;left:180px">Open details</PopoverTrigger>
    <PopoverContent id="portal-content" portalContainer="#portal-target" side="left" align="start" style="text-align:start">مرحبا Portal 42</PopoverContent>
  </Popover>
</section>`;

const astroSource = `---
import { Popover, PopoverContent, PopoverTrigger } from "@direction/styled-astro/popover";
import "@direction/sheet";
---
<html lang="en" dir="ltr"><head><meta charset="utf-8" /></head><body>
  <div id="portal-target" dir="ltr"></div>
  ${popover}
  <section id="disabled-owner" dir="rtl" style="position:relative;margin:120px;width:460px">
    <Popover><PopoverTrigger id="disabled-trigger">Open inline</PopoverTrigger>
      <PopoverContent id="disabled-content" disablePortal side="right">Inline content</PopoverContent>
    </Popover>
  </section>
  <script>
    import { initStarwind } from "@starwind-ui/runtime/init-starwind";
    ${firstVisibleProbe}
    const owner = document.querySelector<HTMLElement>("#portal-owner")!;
    (window as any).__portalDirectInit = () => initStarwind(owner);
    (window as any).__portalScopedInit = () => owner.dispatchEvent(new Event("starwind:init", { bubbles: true }));
    (window as any).__portalSwap = () => document.dispatchEvent(new Event("astro:after-swap"));
  </script>
</body></html>`;

const reactSource = `import * as React from "react";
import { createRoot } from "react-dom/client";
import { Popover, PopoverContent, PopoverTrigger } from "@direction/styled-react/popover";
import "@direction/sheet";
function App() {
  const [direction, setDirection] = React.useState<"rtl" | "ltr">("rtl");
  const [revision, setRevision] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const [surfaceDirection, setSurfaceDirection] = React.useState<"rtl" | undefined>();
  const [disabled, setDisabled] = React.useState(false);
  return <>
    <div data-revision={revision} data-direction-scope id="portal-owner" dir={direction} style={{position:"relative",margin:120,width:460}}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger id="portal-trigger" style={{position:"relative",left:180}}>Open details</PopoverTrigger>
        <PopoverContent id="portal-content" dir={surfaceDirection} portalContainer="#portal-target" disablePortal={disabled} side="left" align="start" style={{textAlign:"start"}}>
          مرحبا Portal 42
          <button id="flip-owner" onClick={() => setDirection(value => value === "rtl" ? "ltr" : "rtl")}>Flip</button>
          <button id="rerender-owner" onClick={() => setRevision(value => value + 1)}>Rerender</button>
          <button id="author-surface" onClick={() => setSurfaceDirection("rtl")}>Author surface</button>
          <button id="disable-portal" onClick={() => setDisabled(value => !value)}>Toggle portal</button>
          <button id="unmount-owner" onClick={() => {
            const portal = document.querySelector("[data-sw-popover-portal]");
            (window as any).__lastPortal = portal;
            (window as any).__beforeUnmount = {
              connected: portal?.isConnected,
              direction: portal?.getAttribute("dir"),
            };
            (window as any).__unmountPortalApp();
          }}>Unmount</button>
        </PopoverContent>
      </Popover>
    </div>
  </>;
}
${firstVisibleProbe}
const root = createRoot(document.getElementById("app")!);
(window as any).__unmountPortalApp = () => root.unmount();
root.render(<React.StrictMode><App /></React.StrictMode>);`;

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

const overlayFirstVisibleProbe = `const firstVisibleOverlayObserver = new MutationObserver(() => {
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
firstVisibleOverlayObserver.observe(document.documentElement, { attributes: true, childList: true, subtree: true });`;

const overlaySource = (example: (typeof overlayExamples)[number], target: "astro" | "react") => {
  const imports = `import { ${example.exports.join(", ")} } from "@direction/styled-${target}/${example.id}";\nimport "@direction/sheet";`;
  const content = `<div id="overlay-owner" data-direction-scope dir="rtl" style=${target === "astro" ? '"position:relative;margin:100px;width:400px"' : '{{position:"relative",margin:100,width:400}}'}>${example.markup}</div>`;
  return target === "astro"
    ? `---\n${imports}\n---\n<html lang="en" dir="ltr"><head><meta charset="utf-8" /></head><body>${content}<script>${overlayFirstVisibleProbe}</script></body></html>`
    : `import * as React from "react";\nimport { createRoot } from "react-dom/client";\n${imports}\n${overlayFirstVisibleProbe}\nfunction App() { return ${content}; }\ncreateRoot(document.getElementById("app")!).render(<React.StrictMode><App /></React.StrictMode>);`;
};

export const cases: DirectionCase[] = [
  {
    id: "stable-portal-adapters-popover",
    row: "popover",
    acceptance: ["SPEC-AC-03", "SPEC-AC-04", "SPEC-AC-11", "SPEC-AC-14"],
    fixtures: {
      astro: {
        source: astroSource,
        exports: ["Popover", "PopoverContent", "PopoverTrigger"],
        assertions,
      },
      react: {
        source: reactSource,
        exports: ["Popover", "PopoverContent", "PopoverTrigger"],
        assertions,
      },
    },
    physicalExceptions: [
      "Explicit side=left and data-side remain physical preferences; viewport collision may select another physical side.",
    ],
  },
  ...overlayExamples.map(
    (example): DirectionCase => ({
      id: `stable-portal-adapters-${example.id}`,
      row: example.id,
      acceptance: ["SPEC-AC-03", "SPEC-AC-04", "SPEC-AC-11", "SPEC-AC-14"],
      fixtures: {
        astro: {
          source: overlaySource(example, "astro"),
          exports: [...example.exports],
          assertions: ["owner-direction-before-visible-paint", "live-direction-and-physical-side"],
        },
        react: {
          source: overlaySource(example, "react"),
          exports: [...example.exports],
          assertions: ["owner-direction-before-visible-paint", "live-direction-and-physical-side"],
        },
      },
      physicalExceptions: [`Explicit side=${example.side} retains its physical meaning.`],
    }),
  ),
];

type Page = Parameters<DirectionExpectation["run"]>[0];

async function capture(page: Page) {
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
      textAlign: getComputedStyle(content).textAlign,
    };
  });
}

export const expectations: DirectionExpectation[] = [
  {
    id: "stable-portal-adapters-popover",
    layer: "styled",
    async run(page, target, ctx) {
      if (target === "react") {
        await page.evaluate(() => {
          const target = document.createElement("div");
          target.id = "portal-target";
          target.dir = "ltr";
          document.body.prepend(target);
        });
      }
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
          target: "portal-target",
        });
        assert.equal(first.visible, true);
        assert.equal(first.direction, "rtl");
        assert.equal(first.portalDirection, "rtl");
      });
      await ctx.check("custom-target-and-live-owner-flip", async () => {
        if (target === "react") await page.locator("#flip-owner").click();
        else
          await page.locator("#portal-owner").evaluate((element) => {
            (element as HTMLElement).dir = "ltr";
          });
        await page.waitForFunction(
          () => document.querySelector("#portal-owner")?.getAttribute("dir") === "ltr",
        );
        await page.evaluate(() => document.dispatchEvent(new Event("starwind:direction-change")));
        await page.waitForFunction(
          () => getComputedStyle(document.querySelector("#portal-content")!).direction === "ltr",
        );
        const flipped = await capture(page);
        ctx.observe("flipped", flipped);
        assert.equal(first.target, "portal-target");
        assert.equal(flipped.target, "portal-target");
        assert.equal(flipped.portalDirection, "ltr");
      });
      await ctx.check("authored-surface-and-physical-side", async () => {
        if (target === "react") await page.locator("#author-surface").click();
        else
          await page
            .locator("#portal-content")
            .evaluate((element) => ((element as HTMLElement).dir = "rtl"));
        await page.waitForFunction(
          () => getComputedStyle(document.querySelector("#portal-content")!).direction === "rtl",
        );
        const authored = await capture(page);
        ctx.observe("authored", authored);
        assert.equal(authored.direction, "rtl");
        assert.equal(authored.align, "start");
        assert(["left", "right"].includes(authored.side ?? ""));
      });
      await ctx.check("placement-teardown-and-replacement", async () => {
        if (target === "react") {
          await page.locator("#rerender-owner").click();
          await page.locator("#portal-target").evaluate((element) => {
            const replacement = element.cloneNode(false);
            element.replaceWith(replacement);
          });
          await page.waitForFunction(
            () =>
              document.querySelector("[data-sw-popover-portal]")?.parentElement?.id ===
              "portal-target",
          );
          await page.evaluate(
            () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
          );
        } else {
          await page.evaluate(() => {
            (window as any).__portalDirectInit();
            (window as any).__portalScopedInit();
            (window as any).__portalSwap();
            (window as any).__portalSwap();
          });
        }
        const replaced = await capture(page);
        ctx.observe("replaced", replaced);
        if (target === "react")
          ctx.observe(
            "reactReplacementState",
            await page.evaluate(() => ({
              rootState: document.querySelector("[data-sw-popover]")?.getAttribute("data-state"),
              contentState: document.querySelector("#portal-content")?.getAttribute("data-state"),
              contentHidden: document.querySelector("#portal-content")?.hasAttribute("hidden"),
              portalPlacement: document
                .querySelector("[data-sw-popover-portal]")
                ?.getAttribute("data-placement"),
              ownerDirection: document.querySelector("#portal-owner")?.getAttribute("dir"),
              authoredDirection: document.querySelector("#portal-content")?.getAttribute("dir"),
            })),
          );
        assert.equal(replaced.target, "portal-target");
        assert.equal(replaced.direction, "rtl");
        assert.equal(replaced.visible, true);
      });
      await ctx.check("disabled-inline-and-owned-state-cleanup", async () => {
        if (target === "react") {
          await page.locator("#disable-portal").click();
          await page.waitForFunction(
            () =>
              document.querySelector("[data-sw-popover-portal]")?.parentElement?.id !==
              "portal-target",
          );
          const inline = await capture(page);
          ctx.observe("disabledInline", inline);
          assert.equal(inline.direction, "rtl");
          assert.equal(inline.visible, true);
          await page.locator("#disable-portal").click();
          await page.waitForFunction(
            () =>
              document.querySelector("[data-sw-popover-portal]")?.parentElement?.id ===
              "portal-target",
          );
          await page.locator("#unmount-owner").click();
          const detached = await page.evaluate(() => ({
            before: (window as any).__beforeUnmount,
            connected: (window as any).__lastPortal?.isConnected,
            direction: (window as any).__lastPortal?.getAttribute("dir"),
          }));
          ctx.observe("detached", detached);
          assert.deepEqual(detached, {
            before: { connected: true, direction: "ltr" },
            connected: false,
            direction: null,
          });
        } else {
          await page.locator("#disabled-trigger").click();
          await page.locator("#disabled-content:visible").waitFor();
          const inline = await page.locator("#disabled-content").evaluate((content) => {
            const portal = content.closest<HTMLElement>("[data-sw-popover-portal]")!;
            return {
              direction: getComputedStyle(content).direction,
              disabled: portal.hasAttribute("data-disabled"),
              inline: portal.parentElement?.id !== "portal-target",
            };
          });
          ctx.observe("disabledInline", inline);
          assert.deepEqual(inline, { direction: "rtl", disabled: true, inline: true });
          // Opening the inline popover is an outside press for the portalled one, which closes
          // and returns inline after its exit animation. Reopen it so the teardown starts from a
          // placed portal.
          await waitHidden(page.locator("#portal-content"));
          await page.locator("#portal-trigger").click();
          await page.waitForFunction(
            () =>
              document.querySelector("#portal-content")?.closest("[data-sw-popover-portal]")
                ?.parentElement?.id === "portal-target",
          );
          const restored = await page.evaluate(() => {
            const portal = document
              .querySelector<HTMLElement>("#portal-content")!
              .closest<HTMLElement>("[data-sw-popover-portal]")!;
            const before = {
              direction: portal.getAttribute("dir"),
              target: portal.parentElement?.id ?? null,
            };
            document.dispatchEvent(new Event("astro:before-swap"));
            return {
              before,
              direction: portal.getAttribute("dir"),
              inline: document.querySelector("#portal-owner")?.contains(portal),
            };
          });
          ctx.observe("astroTeardown", restored);
          assert.deepEqual(restored, {
            before: { direction: "ltr", target: "portal-target" },
            direction: null,
            inline: true,
          });
        }
      });
    },
  },
  ...overlayExamples.map(
    (example): DirectionExpectation => ({
      id: `stable-portal-adapters-${example.id}`,
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
          assert.equal(first.direction, "rtl");
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
