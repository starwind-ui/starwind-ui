import { createRequire } from "node:module";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { runHighlightSweep } from "../runtime-performance/highlight-sweep.mjs";

const require = createRequire(path.resolve("apps/react-demo/package.json"));
const { chromium } = require("playwright");
let browser;

beforeAll(async () => {
  browser = await chromium.launch({ headless: true });
});
afterAll(async () => {
  await browser?.close();
});

async function runFixture(mode) {
  const page = await browser.newPage();
  try {
    await page.setContent("<button>First</button><button>Second</button><button>Third</button>");
    await page.addScriptTag({
      content: `window.runHighlightSweep = ${runHighlightSweep.toString()}`,
    });
    return await page.evaluate(async (mode) => {
      const items = [...document.querySelectorAll("button")];
      let pending;
      let pointerMoves = 0;
      let mouseMoves = 0;
      let layouts = 0;
      for (const item of items) {
        item.addEventListener("pointermove", () => pointerMoves++);
        item.addEventListener("mousemove", () => {
          mouseMoves++;
          if (mode === "no-highlight") return;
          const update = () => {
            if (mode !== "stale-highlight") {
              for (const previous of items) previous.removeAttribute("data-highlighted");
            }
            item.setAttribute("data-highlighted", "");
          };
          if (mode === "deferred") queueMicrotask(() => setTimeout(update, 0));
          else pending = update;
        });
      }
      const result = await window.runHighlightSweep({
        items,
        timeoutMs: 50,
        flushUpdates(callback) {
          callback();
          pending?.();
          pending = undefined;
        },
        forceLayout(item) {
          if (["valid", "deferred"].includes(mode) && !item.hasAttribute("data-highlighted")) {
            throw new Error("Layout measured before the queued highlight update committed");
          }
          item.getBoundingClientRect();
          layouts++;
        },
      });
      return { result, pointerMoves, mouseMoves, layouts };
    }, mode);
  } finally {
    await page.close();
  }
}

describe("verified highlighting performance sweep", () => {
  it("drives pointer and mouse handlers and commits each update before measuring layout", async () => {
    const result = await runFixture("valid");
    expect(result).toMatchObject({
      pointerMoves: 3,
      mouseMoves: 3,
      layouts: 3,
      result: { verifiedItemCount: 3 },
    });
    for (const key of [
      "durationMs",
      "dispatchDurationMs",
      "updateDurationMs",
      "forcedLayoutDurationMs",
    ]) {
      expect(result.result[key]).toBeGreaterThanOrEqual(0);
    }
  });

  it("includes state-machine actions that commit in a later task", async () => {
    expect(await runFixture("deferred")).toMatchObject({
      result: { verifiedItemCount: 3 },
      layouts: 3,
    });
  });

  it("fails when dispatched events do not produce highlighting", async () => {
    await expect(runFixture("no-highlight")).rejects.toThrow(
      "Benchmark item did not become highlighted: First",
    );
  });

  it("fails when the previous item remains highlighted", async () => {
    await expect(runFixture("stale-highlight")).rejects.toThrow(
      "Previous benchmark item remained highlighted: First",
    );
  });
});
