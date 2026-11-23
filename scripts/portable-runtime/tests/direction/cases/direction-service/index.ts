import assert from "node:assert/strict";
import path from "node:path";

import type { DirectionCase, DirectionExpectation } from "../../inventory.js";
import { ROOT } from "../../inventory.js";

const directionSource = JSON.stringify(
  path.join(ROOT, "packages/runtime/src/internal/direction.ts"),
);

export const cases: DirectionCase[] = [
  {
    id: "direction-service-live-owner",
    row: "runtime:radio-group",
    acceptance: ["SPEC-AC-03", "SPEC-AC-04", "SPEC-AC-14"],
    fixtures: {
      astro: {
        source: `---\n---\n<html><head><title>Direction service</title></head><body><main dir="ltr"><h1>Live direction owner</h1></main><script>import { readDirection, subscribeDirection, spatialDelta, spatialRatio } from ${directionSource}; window.__directionService = { readDirection, subscribeDirection, spatialDelta, spatialRatio };</script></body></html>`,
        exports: [],
        assertions: [
          "computed-and-auto",
          "ancestor-frame-and-input",
          "reparent-and-document",
          "same-value-bounded-work",
          "teardown-releases-owner",
        ],
      },
    },
  },
];

export const expectations: DirectionExpectation[] = [
  {
    id: "direction-service-live-owner",
    layer: "raw-html",
    async run(page, _target, ctx) {
      await page.waitForFunction(() => Boolean((window as any).__directionService));
      await ctx.check("computed-and-auto", async () => {
        const result = await page.evaluate(async () => {
          const api = (window as any).__directionService;
          const scope = document.createElement("div");
          const owner = document.createElement("button");
          scope.dir = "rtl";
          scope.append(owner);
          document.body.append(scope);
          const subscription = api.subscribeDirection(owner, () => {});
          const inherited = subscription.get();
          scope.dir = "auto";
          const text = document.createTextNode("שלום");
          scope.insertBefore(text, owner);
          const autoRtl = subscription.get();
          text.data = "Hello";
          const autoLtr = subscription.get();
          scope.style.direction = "rtl";
          const css = subscription.refresh();
          const spatial = [
            api.spatialDelta(8, "rtl", "horizontal"),
            api.spatialRatio(0.2, "rtl", "horizontal"),
          ];
          subscription.destroy();
          scope.remove();
          return { inherited, autoRtl, autoLtr, css, spatial };
        });
        ctx.observe("computedAndAuto", result);
        assert.deepEqual(result, {
          inherited: "rtl",
          autoRtl: "rtl",
          autoLtr: "ltr",
          css: "rtl",
          spatial: [-8, 0.8],
        });
      });
      await ctx.check("ancestor-frame-and-input", async () => {
        const result = await page.evaluate(async () => {
          const api = (window as any).__directionService;
          const scope = document.createElement("div");
          const owner = document.createElement("button");
          scope.append(owner);
          document.body.append(scope);
          const changes: string[] = [];
          const subscription = api.subscribeDirection(owner, (value: string) =>
            changes.push(value),
          );
          owner.addEventListener("keydown", () => changes.push(`key:${subscription.get()}`));
          scope.dir = "rtl";
          owner.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
          const atInput = [...changes];
          scope.dir = "ltr";
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          );
          const idle = [...changes];
          document.dispatchEvent(new Event("starwind:direction-change"));
          const byFrame = [...changes];
          subscription.destroy();
          scope.remove();
          return { atInput, idle, byFrame };
        });
        ctx.observe("ancestorTiming", result);
        assert.deepEqual(result.atInput, ["rtl", "key:rtl"]);
        assert.deepEqual(result.idle, ["rtl", "key:rtl"]);
        assert.deepEqual(result.byFrame, ["rtl", "key:rtl", "ltr"]);
      });
      await ctx.check("reparent-and-document", async () => {
        const result = await page.evaluate(async () => {
          const api = (window as any).__directionService;
          const left = document.createElement("div");
          const right = document.createElement("div");
          const owner = document.createElement("button");
          const peer = document.createElement("button");
          left.dir = "ltr";
          right.dir = "rtl";
          left.append(owner, peer);
          document.body.append(left, right);
          const changes: string[] = [];
          const subscription = api.subscribeDirection(owner, (value: string) =>
            changes.push(value),
          );
          const peerChanges: string[] = [];
          const peerSubscription = api.subscribeDirection(peer, (value: string) =>
            peerChanges.push(value),
          );
          right.append(owner);
          document.dispatchEvent(new Event("starwind:direction-change"));
          const afterMove = [...changes];
          const iframe = document.createElement("iframe");
          document.body.append(iframe);
          const other = iframe.contentDocument!;
          other.documentElement.dir = "ltr";
          other.body.append(other.adoptNode(owner));
          const afterAdopt = subscription.get();
          other.documentElement.dir = "rtl";
          other.dispatchEvent(
            new (iframe.contentWindow as Window & typeof globalThis).Event(
              "starwind:direction-change",
            ),
          );
          const afterOtherFlip = [...changes];
          left.dir = "rtl";
          document.dispatchEvent(new Event("starwind:direction-change"));
          const afterOriginalFlip = { owner: [...changes], peer: [...peerChanges] };
          subscription.destroy();
          peerSubscription.destroy();
          iframe.remove();
          left.remove();
          right.remove();
          return { afterMove, afterAdopt, afterOtherFlip, afterOriginalFlip };
        });
        ctx.observe("documentRebind", result);
        assert.deepEqual(result, {
          afterMove: ["rtl"],
          afterAdopt: "ltr",
          afterOtherFlip: ["rtl", "ltr", "rtl"],
          afterOriginalFlip: { owner: ["rtl", "ltr", "rtl"], peer: ["rtl"] },
        });
      });
      await ctx.check("same-value-bounded-work", async () => {
        const result = await page.evaluate(async () => {
          const api = (window as any).__directionService;
          const scope = document.createElement("div");
          scope.dir = "ltr";
          document.body.append(scope);
          const subscriptions = Array.from({ length: 16 }, () => {
            const owner = document.createElement("span");
            scope.append(owner);
            return api.subscribeDirection(owner, () => {});
          });
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          );
          const original = window.getComputedStyle;
          let reads = 0;
          window.getComputedStyle = (...args) => {
            reads++;
            return original.apply(window, args);
          };
          try {
            scope.setAttribute("dir", "ltr");
            scope.setAttribute("dir", "ltr");
            await new Promise<void>((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
            );
            document.body.append(document.createElement("div"));
            await new Promise<void>((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
            );
            const sameValueReads = reads;
            scope.dir = "rtl";
            await new Promise<void>((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
            );
            if (reads !== sameValueReads) throw new Error("A dir write read direction");
            document.dispatchEvent(new Event("starwind:direction-change"));
            return { sameValueReads, flipReads: reads - sameValueReads };
          } finally {
            window.getComputedStyle = original;
            subscriptions.forEach((subscription) => subscription.destroy());
            scope.remove();
          }
        });
        ctx.observe("boundedReads", result);
        assert.equal(result.sameValueReads, 0);
        assert(result.flipReads > 0 && result.flipReads <= 16);
      });
      await ctx.check("teardown-releases-owner", async () => {
        const result = await page.evaluate(async () => {
          const api = (window as any).__directionService;
          const scope = document.createElement("div");
          const owner = document.createElement("button");
          scope.append(owner);
          document.body.append(scope);
          const changes: string[] = [];
          const first = api.subscribeDirection(owner, (value: string) => changes.push(value));
          first.destroy();
          first.destroy();
          scope.dir = "rtl";
          document.dispatchEvent(new Event("starwind:direction-change"));
          const afterDestroy = [...changes];
          const second = api.subscribeDirection(owner, (value: string) => changes.push(value));
          scope.dir = "ltr";
          document.dispatchEvent(new Event("starwind:direction-change"));
          const afterReinit = [...changes];
          second.destroy();
          scope.remove();
          return { afterDestroy, afterReinit };
        });
        ctx.observe("lifecycle", result);
        assert.deepEqual(result, { afterDestroy: [], afterReinit: ["ltr"] });
      });
    },
  },
];
